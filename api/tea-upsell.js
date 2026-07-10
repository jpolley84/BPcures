// api/tea-upsell.js — true one-click post-purchase upsell.
//
// After a SVUTU Steady tea checkout (Stripe payment link, card saved via
// setup_future_usage=off_session), the buyer lands on /tea/thankyou/ and can add
// the $17 BP Reset Kit with ONE click, charged to the card they just used, no
// re-entry. This endpoint does that charge and delivers the kit.
//
// Why deliver here rather than let a webhook do it: a one-click off-session
// PaymentIntent fires payment_intent.succeeded, and triangle-webhook ignores
// everything except checkout.session.completed (see its handler guard). So no
// webhook would deliver this kit. We deliver it directly via sendBuyerDelivery.
//
// Guardrails baked in:
//   - Only a genuine svutu-tea checkout session can trigger a charge (metadata check).
//   - The amount is server-fixed at $17 (1700); the client only passes session_id.
//   - Idempotent per tea session (KV tea:upsell:<session_id>) so the button cannot double-charge.
//   - If the saved card needs re-authentication (SCA) or is declined off-session,
//     we return the normal $17 checkout URL so the buyer can still get the kit.
// ZERO customer money is charged without the tea session proving they just paid us.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { sendBuyerDelivery } from './triangle-webhook.js';
import { capturePurchase } from './_triangle-posthog.js';

const KIT_AMOUNT_CENTS = 1700; // $17 BP Reset Kit (corner tier)
// Fallback: the live $17 BP Reset Kit payment link (The 10-Day Nurse's Reset).
const KIT_FALLBACK_URL = 'https://buy.stripe.com/cNieVdcAj3Dw3V9fjPfnO1o';

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

function firstNameOf(n) {
  return (n || '').trim().split(/\s+/)[0] || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', reason: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : '';
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ status: 'error', reason: 'bad_session', fallbackUrl: KIT_FALLBACK_URL });
  }

  const stripe = getStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  } catch (err) {
    return res.status(400).json({ status: 'error', reason: 'session_not_found', fallbackUrl: KIT_FALLBACK_URL });
  }

  // Only a real tea checkout may trigger this upsell. Prevents anyone POSTing an
  // arbitrary session id to trigger a charge on someone else's card.
  if ((session.metadata && session.metadata.funnel) !== 'svutu-tea') {
    return res.status(403).json({ status: 'error', reason: 'not_a_tea_session', fallbackUrl: KIT_FALLBACK_URL });
  }

  const customerId = typeof session.customer === 'string' ? session.customer : (session.customer && session.customer.id);
  const email = (session.customer_details && session.customer_details.email) || '';
  const firstName = firstNameOf(session.customer_details && session.customer_details.name);

  // Idempotency: one upsell per tea session.
  const dedupeKey = `tea:upsell:${sessionId}`;
  try {
    const done = await kv.get(dedupeKey);
    if (done) return res.status(200).json({ status: 'already' });
  } catch (err) {
    console.warn('tea-upsell: dedupe read failed (non-fatal)', err.message);
  }

  if (!customerId) {
    // Older tea link without a saved customer/card -> cannot one-click; send to checkout.
    return res.status(200).json({ status: 'no_saved_card', fallbackUrl: KIT_FALLBACK_URL });
  }

  // Resolve the saved card: prefer the PM used on the tea payment_intent (one-time
  // tiers), else the customer's default/first saved card (subscription tier).
  let paymentMethodId = null;
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  if (pi && pi.payment_method) {
    paymentMethodId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method.id;
  }
  if (!paymentMethodId) {
    try {
      const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 });
      paymentMethodId = (pms.data[0] && pms.data[0].id) || null;
    } catch (err) {
      console.warn('tea-upsell: paymentMethods.list failed', err.message);
    }
  }
  if (!paymentMethodId) {
    return res.status(200).json({ status: 'no_saved_card', fallbackUrl: KIT_FALLBACK_URL });
  }

  // Charge the $17 kit off-session on the saved card.
  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: KIT_AMOUNT_CENTS,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: 'BP Reset Kit — one-click add after SVUTU Steady',
      metadata: {
        funnel: 'braveworks-bp',
        brand: 'braveworks-bp',
        tier: 'corner',
        source: 'tea-upsell',
        tea_session: sessionId,
        product: 'bp-reset-kit-17',
      },
    });
  } catch (err) {
    // Off-session declines: card needs re-authentication (SCA) or was declined.
    // Fall back to the normal $17 checkout so the buyer can still buy it.
    const code = (err && (err.code || (err.raw && err.raw.code))) || '';
    console.warn('tea-upsell: off-session charge failed', code, err && err.message);
    return res.status(200).json({
      status: code === 'authentication_required' ? 'auth_required' : 'declined',
      reason: code || 'charge_failed',
      fallbackUrl: KIT_FALLBACK_URL,
    });
  }

  if (intent.status !== 'succeeded') {
    return res.status(200).json({ status: 'pending', reason: intent.status, fallbackUrl: KIT_FALLBACK_URL });
  }

  // Charged. Record idempotency FIRST so a retry never double-charges, then
  // best-effort deliver the kit + log. A delivery hiccup must not un-charge them.
  try {
    await kv.set(dedupeKey, { pi: intent.id, at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 60 });
  } catch (err) {
    console.warn('tea-upsell: dedupe write failed (non-fatal)', err.message);
  }

  let delivered = false;
  if (email) {
    try {
      // Quiz-skipper upsell buyer: deliver the Stress-corner kit by default
      // (matches the site's quiz-skipper default). modulesForTier falls back
      // gracefully if corner is unknown.
      await sendBuyerDelivery({ email, firstName, tier: 'corner', corner: 'stress', scores: null });
      delivered = true;
    } catch (err) {
      console.error('tea-upsell: kit delivery email failed', err.message);
    }
    try {
      await capturePurchase({ email, amountCents: KIT_AMOUNT_CENTS, tier: 'corner', sessionId: intent.id });
    } catch (err) {
      console.warn('tea-upsell: capturePurchase failed (non-fatal)', err.message);
    }

    // Enroll into the buyer drip so the ascension sequence takes over. Never
    // clobber an existing record; only mark paid.
    try {
      const dripKey = `bwbp:drip:${String(email).trim().toLowerCase()}`;
      const existing = await kv.get(dripKey);
      const now = new Date().toISOString();
      if (!existing) {
        await kv.set(dripKey, {
          email: String(email).trim().toLowerCase(), firstName, corner: 'stress',
          enrolledAt: now, isPaidCustomer: true, paidTier: 'corner',
          purchasedAt: now, source: 'tea-upsell', state: 'tier-1', stateEnteredAt: now,
        });
      } else if (!existing.isPaidCustomer) {
        await kv.set(dripKey, {
          ...existing, isPaidCustomer: true, paidTier: 'corner',
          purchasedAt: existing.purchasedAt || now, state: 'tier-1', stateEnteredAt: now,
        });
      }
    } catch (err) {
      console.warn('tea-upsell: drip enroll failed (non-fatal)', err.message);
    }
  }

  return res.status(200).json({ status: 'succeeded', delivered });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
