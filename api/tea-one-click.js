// api/tea-one-click.js — true one-click upsell charge for SVUTU Steady tea,
// billed to the saved card from the buyer's $17/$47 kit purchase.
//
// Unlike the digital kit upsells (api/charge-saved-card.js), tea is a
// physical product and the kit checkout never collects a shipping address
// (it's a PDF download, nothing to ship). Rather than add shipping
// collection to the kit checkout itself — extra friction on every $17 sale,
// including buyers who never want tea — the client collects the shipping
// address inline, at the moment of the upsell click. The CARD is never
// re-entered; that's the friction this endpoint actually removes.
//
// Requires the original checkout session to have been created with
// customer_creation:'always' + payment_intent_data.setup_future_usage:
// 'off_session' (api/create-embedded-checkout.js, added 2026-07-08).
// Sessions from before that change have no saved card; the client falls back
// to the plain tea Payment Link in that case (409 no_saved_card).
//
// Fulfillment reuses the EXACT path triangle-webhook.js uses for tea Payment
// Link sales (recordTeaSale export: KV shipping-digest bucket + Resend "Tea
// Buyers" tag + buyer confirmation email + PostHog capture), so the nightly
// shipping digest cron (api/tea-daily-cron.js) sees a one-click tea sale
// exactly like any other.
//
// Idempotency: KV-backed by session_id + tier, same pattern as
// charge-saved-card.js, so a double-click never double-charges.
//
// 3D Secure: an off_session charge that needs authentication throws
// authentication_required; the client falls back to the Payment Link
// (re-enter card, complete 3DS interactively) rather than losing the sale.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Live Stripe price ids behind bpquiz.com/tea's two tiers (verified against
// the active Payment Links 2026-07-08). Amount is charged directly on the
// PaymentIntent (off_session charges bill an amount, not a Price object);
// priceId is kept for reference/reporting parity with the tea page.
const TEA_TIERS = {
  'tea-48': {
    priceId: 'price_1TqGiaHseZnO3rRZhSCeTi1H',
    amount: 4800,
    description: 'SVUTU Steady, 1-Month Supply',
  },
  'tea-120': {
    priceId: 'price_1TqGiWHseZnO3rRZ9XnHorV0',
    amount: 12000,
    description: 'SVUTU Steady, 90-Day Supply',
  },
};

function cleanStr(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { session_id, tier } = req.body;

  if (!session_id || typeof session_id !== 'string' || !session_id.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  const tierConfig = TEA_TIERS[tier];
  if (!tierConfig) {
    return res.status(400).json({ error: `Unknown tier: ${tier}` });
  }

  // Shipping comes one of two ways:
  //   - explicit `shipping` object (the /welcome kit-buyer flow, where the kit
  //     checkout never collected an address), or
  //   - `reuse_session_shipping: true` (the /tea-thanks flow, where the buyer
  //     JUST typed their address into the tea checkout; we read it back off
  //     the original session so they never re-type it). Resolved after the
  //     session is retrieved below.
  const reuseSessionShipping = req.body.reuse_session_shipping === true;
  const shipping = req.body.shipping || {};
  let name = cleanStr(shipping.name, 120);
  let line1 = cleanStr(shipping.line1, 200);
  let line2 = cleanStr(shipping.line2, 200);
  let city = cleanStr(shipping.city, 100);
  let state = cleanStr(shipping.state, 60);
  let postal_code = cleanStr(shipping.postal_code, 20);
  let country = cleanStr(shipping.country, 2) || 'US';

  if (!reuseSessionShipping && (!name || !line1 || !city || !state || !postal_code)) {
    return res.status(400).json({ error: 'Missing shipping fields' });
  }

  // Idempotency: check KV for a prior successful charge against this
  // session+tier. Prevents double-charge on double-click.
  const idemKey = `tea-one-click:${session_id}:${tier}`;
  try {
    const prior = await kv.get(idemKey);
    if (prior && prior.payment_intent_id) {
      return res.status(200).json({ ok: true, payment_intent_id: prior.payment_intent_id, cached: true });
    }
  } catch (err) {
    console.warn('tea-one-click: idem check failed (continuing)', err.message);
  }

  let originalSession;
  try {
    originalSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'payment_intent'],
    });
  } catch (err) {
    return res.status(404).json({ error: 'session_not_found', detail: err.message });
  }

  // Resolve reused shipping off the original session (tea checkout collects
  // it; classic API = session.shipping_details, newer = collected_information).
  if (reuseSessionShipping) {
    const ship =
      originalSession.shipping_details ||
      originalSession.collected_information?.shipping_details ||
      null;
    const a = ship?.address || {};
    name = cleanStr(ship?.name || originalSession.customer_details?.name, 120);
    line1 = cleanStr(a.line1, 200);
    line2 = cleanStr(a.line2, 200);
    city = cleanStr(a.city, 100);
    state = cleanStr(a.state, 60);
    postal_code = cleanStr(a.postal_code, 20);
    country = cleanStr(a.country, 2) || 'US';
    if (!name || !line1 || !city || !state || !postal_code) {
      return res.status(409).json({
        error: 'no_session_shipping',
        message: 'Original session has no shipping address. Collect it client-side.',
      });
    }
  }

  const customerId = typeof originalSession.customer === 'string'
    ? originalSession.customer
    : originalSession.customer?.id;
  const paymentMethodId = originalSession.payment_intent?.payment_method;

  if (!customerId || !paymentMethodId) {
    // No saved card on this session — expected for sessions from before the
    // saveCard change, or any session that isn't a kit purchase. Caller falls
    // back to the plain Payment Link.
    return res.status(409).json({
      error: 'no_saved_card',
      message: 'This session has no saved payment method. Use fallback.',
    });
  }

  // Create the off_session PaymentIntent. confirm:true charges immediately.
  // shipping goes directly on the PaymentIntent — no separate Checkout
  // Session needed for a direct off-session charge.
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: tierConfig.amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: tierConfig.description,
      shipping: {
        name,
        address: { line1, line2: line2 || undefined, city, state, postal_code, country },
      },
      metadata: {
        funnel: 'svutu-tea',
        flow: 'tea_one_click',
        original_session: session_id,
        tier,
      },
    }, {
      idempotencyKey: idemKey, // Stripe-side idempotency
    });
  } catch (err) {
    if (err.code === 'authentication_required' || err.code === 'card_declined') {
      return res.status(402).json({
        error: err.code,
        message: 'Card requires authentication or was declined. Fall back to re-entry.',
      });
    }
    console.error('tea-one-click stripe error:', err.message);
    return res.status(500).json({ error: 'charge_failed', detail: err.message });
  }

  try {
    await kv.set(idemKey, {
      payment_intent_id: paymentIntent.id,
      tier,
      charged_at: new Date().toISOString(),
      amount: tierConfig.amount,
    }, { ex: 86400 });
  } catch (err) {
    console.warn('tea-one-click: idem write failed', err.message);
  }

  const customerEmail = originalSession.customer_details?.email
    || (typeof originalSession.customer === 'object' ? originalSession.customer?.email : null)
    || '';

  // Fulfillment: KV shipping-digest record + Resend tag + confirmation email +
  // PostHog capture, via the SAME path triangle-webhook.js uses for tea
  // Payment Link sales. Best-effort: a recording failure never fails the
  // charge — the customer's already been billed. Log for manual reconciliation.
  try {
    const { recordTeaSale } = await import('./triangle-webhook.js');
    await recordTeaSale({
      dedupeId: paymentIntent.id,
      email: customerEmail,
      name,
      items: [{ name: tierConfig.description, qty: 1 }],
      amountCents: tierConfig.amount,
      isSubscription: false,
      address: { line1, line2, city, state, postal_code, country },
      source: 'one_click_upsell',
    });
  } catch (err) {
    console.error('tea-one-click: recordTeaSale failed (charge OK)', err.message);
  }

  return res.status(200).json({ ok: true, payment_intent_id: paymentIntent.id });
}
