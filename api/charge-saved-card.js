// api/charge-saved-card.js — one-click upsell charge.
//
// Reads the original Checkout Session, pulls the saved Customer +
// PaymentMethod, and creates a new PaymentIntent off_session for the
// requested upsell tier. On success, fires the purchase-confirmation
// email immediately (we can't rely on the Stripe webhook because a
// direct PaymentIntent isn't a checkout.session.completed event).
//
// 2026-05-20: built to port bpcures' true one-click upsell mechanic.
// Mirrors the Hostinger commerce flow that converts at ~26%.
//
// Idempotency: KV-backed by session_id + tier so a double-click never
// double-charges. The first call wins; the second returns the cached
// result.
//
// 3D Secure handling: if the customer's card requires SCA, off_session
// auth fails with `authentication_required`. We surface that to the
// client which then redirects to the existing fallback Payment Link
// (re-enter card, complete 3DS interactively). Better to lose a few
// to friction than to drop the upsell entirely.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map upsell tier → Stripe price ID + amount + tier label for the
// confirmation email + redirect chain destination.
const UPSELL_TIERS = {
  'bp-cure-book': {
    priceId: 'price_1TNGMuHseZnO3rRZSIMPnPaO',
    amount: 1299,
    description: 'Blood Pressure Cures — The 10-Day Nurse\'s Reset',
    nextStep: '/upsell-bp-reset-kit',
  },
  'bp-reset-kit-oto': {
    priceId: 'price_1TSCuLHseZnO3rRZPAcRKs7t', // $30 OTO from UpsellBpResetKitPage
    amount: 3000,
    description: 'The BP Reset Kit (one-time post-purchase price)',
    // 2026-05-20: route to /downloads so customers land on their library
    // after the final upsell. /success had no download links — bug Joel
    // caught when he tested the chain post-deploy.
    nextStep: '/downloads?upsell=accepted&one_click=1',
  },
};

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

  const tierConfig = UPSELL_TIERS[tier];
  if (!tierConfig) {
    return res.status(400).json({ error: `Unknown tier: ${tier}` });
  }

  // Idempotency: check KV for a prior successful charge against this
  // session+tier. Prevents double-charge on double-click.
  const idemKey = `upsell-charge:${session_id}:${tier}`;
  try {
    const prior = await kv.get(idemKey);
    if (prior && prior.payment_intent_id) {
      return res.status(200).json({
        ok: true,
        payment_intent_id: prior.payment_intent_id,
        next_url: tierConfig.nextStep,
        cached: true,
      });
    }
  } catch (err) {
    console.warn('charge-saved-card: idem check failed (continuing)', err.message);
  }

  let originalSession;
  try {
    originalSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'payment_intent'],
    });
  } catch (err) {
    return res.status(404).json({ error: 'session_not_found', detail: err.message });
  }

  const customerId = typeof originalSession.customer === 'string'
    ? originalSession.customer
    : originalSession.customer?.id;
  const paymentMethodId = originalSession.payment_intent?.payment_method;

  if (!customerId || !paymentMethodId) {
    // No saved card on this session — caller should fall back to the
    // legacy "re-enter card" path. This is expected for sessions that
    // came through Stripe Payment Links (no saveCard:true flag).
    return res.status(409).json({
      error: 'no_saved_card',
      message: 'This session has no saved payment method. Use fallback.',
    });
  }

  // Create the off_session PaymentIntent. confirm:true charges
  // immediately. If 3DS is required, Stripe throws authentication_required.
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
      metadata: {
        upsell_tier: tier,
        original_session: session_id,
        flow: 'one_click_upsell',
      },
    }, {
      idempotencyKey: idemKey, // Stripe-side idempotency
    });
  } catch (err) {
    // 3DS / SCA required → tell client to fall back.
    if (err.code === 'authentication_required' || err.code === 'card_declined') {
      return res.status(402).json({
        error: err.code,
        message: 'Card requires authentication or was declined. Fall back to re-entry.',
      });
    }
    console.error('charge-saved-card stripe error:', err.message);
    return res.status(500).json({ error: 'charge_failed', detail: err.message });
  }

  // Persist the idempotency record (24h TTL is plenty — same session
  // can't be revived after).
  try {
    await kv.set(idemKey, {
      payment_intent_id: paymentIntent.id,
      tier,
      charged_at: new Date().toISOString(),
      amount: tierConfig.amount,
    }, { ex: 86400 });
  } catch (err) {
    console.warn('charge-saved-card: idem write failed', err.message);
  }

  // Fire the purchase-confirmation email immediately. We can't wait
  // for the webhook because a direct PaymentIntent doesn't trigger
  // checkout.session.completed. Use the same code path the webhook
  // uses so the customer gets the proper download email.
  try {
    const { sendPurchaseConfirmation } = await import('./purchase-confirmation.js');
    const customerEmail = originalSession.customer_details?.email
      || (typeof originalSession.customer === 'object' ? originalSession.customer?.email : null);
    if (customerEmail) {
      // sendPurchaseConfirmation signature: { email, name, tier, apologyMode }
      // Tier maps to TIER_CONFIG entries we added: 'bp-cure-book' or
      // 'bp-reset-kit-oto'. For the $30 OTO we route through tier '2'
      // since that's the canonical $47 Reset Kit tier in TIER_CONFIG.
      const tierForEmail = tier === 'bp-reset-kit-oto' ? 2 : tier;
      await sendPurchaseConfirmation({
        email: customerEmail,
        name: (originalSession.customer_details?.name || '').split(' ')[0] || '',
        tier: tierForEmail,
      });
    } else {
      console.warn('charge-saved-card: no email on session, skipping confirmation send');
    }
  } catch (err) {
    // Email send failure shouldn't fail the charge — customer's already
    // been billed. Log + continue. Manual reconciliation can recover.
    console.error('charge-saved-card: confirmation email failed (charge OK)', err.message);
  }

  return res.status(200).json({
    ok: true,
    payment_intent_id: paymentIntent.id,
    next_url: tierConfig.nextStep,
  });
}
