// api/kit-oto-charge.js — TRUE one-click OTO: corner ($17) -> complete ($47)
// for the $27 difference, billed to the card saved by the corner checkout.
//
// Called by src/pages/OtoCompletePage.jsx (the /oto page corner buyers land
// on straight from Stripe's embedded checkout, BEFORE /welcome).
//
// Requires the original session to have been created with
// customer_creation:'always' + payment_intent_data.setup_future_usage:
// 'off_session' (create-embedded-checkout.js corner branch, restored
// 2026-07-16). Sessions from before that have no reusable card; the client
// falls back to the $27 upgrade Payment Link (409 no_saved_card).
//
// Fulfillment reuses triangle-webhook.js processUpgrade() EXACTLY (delivery
// email with the complete bundle resolved to the buyer's corner, paidTier
// bump on the drip record, PostHog attribution, email+tier dedupe marker),
// so a one-click upgrade is indistinguishable downstream from a
// payment-link upgrade.
//
// Idempotency: KV by session_id (one OTO per session) + the same key as
// Stripe's idempotencyKey, so a double-click never double-charges.
//
// 3D Secure: off_session charges that need authentication throw
// authentication_required; the client falls back to the Payment Link
// (re-enter card, complete 3DS interactively) rather than losing the sale.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// The LIVE $27 corner->complete OTO price (created 2026-07-05, same SKU the
// /welcome payment link sells). Charged as a direct amount (off_session PIs
// bill an amount, not a Price); the id is kept for reporting parity.
const OTO = {
  priceId: process.env.UPGRADE_CORNER_TO_COMPLETE_OTO_PRICE_ID || 'price_1TpqyjHseZnO3rRZk05rso0U',
  amount: 2700,
  targetTier: 'complete',
  description: 'The Complete BP Reset Kit (corner upgrade, one-time offer)',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { session_id } = req.body;
  if (!session_id || typeof session_id !== 'string' || !session_id.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  // Idempotency: one OTO charge per originating session, ever.
  const idemKey = `kit-oto:${session_id}`;
  try {
    const prior = await kv.get(idemKey);
    if (prior && prior.payment_intent_id) {
      return res.status(200).json({ ok: true, payment_intent_id: prior.payment_intent_id, cached: true });
    }
  } catch (err) {
    console.warn('kit-oto-charge: idem check failed (continuing)', err.message);
  }

  let originalSession;
  try {
    originalSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'payment_intent'],
    });
  } catch (err) {
    return res.status(404).json({ error: 'session_not_found', detail: err.message });
  }

  // Only a PAID braveworks-bp CORNER session may take this OTO. Anything
  // else (foreign funnel on the shared Stripe account, unpaid session, a
  // complete purchase) is rejected before any charge.
  const md = originalSession.metadata || {};
  const isCornerKit =
    (md.funnel === 'braveworks-bp' || md.brand === 'braveworks-bp') && md.tier === 'corner';
  if (!isCornerKit || originalSession.payment_status !== 'paid') {
    return res.status(409).json({ error: 'not_eligible', message: 'Session is not a paid corner-kit purchase.' });
  }

  // Never bill an upgrade the buyer already owns: the KV idem marker used to
  // expire after 24h, so a bookmarked /oto revisit could re-charge $27 while
  // processUpgrade's own dedupe swallowed re-delivery (paid twice, got
  // nothing). Check BOTH the permanent upgrade marker and the drip record.
  const buyerEmail = (originalSession.customer_details?.email || '').trim().toLowerCase();
  if (buyerEmail) {
    try {
      const [upgradeMark, drip] = await Promise.all([
        kv.get(`bwbp:upgrade:${buyerEmail}:complete`),
        kv.get(`bwbp:drip:${buyerEmail}`),
      ]);
      if (upgradeMark || drip?.paidTier === 'complete') {
        return res.status(409).json({ error: 'already_upgraded', message: 'This buyer already owns the complete kit.' });
      }
    } catch (err) {
      console.warn('kit-oto-charge: ownership check failed (continuing)', err.message);
    }
  }

  const customerId = typeof originalSession.customer === 'string'
    ? originalSession.customer
    : originalSession.customer?.id;
  const paymentMethodId = originalSession.payment_intent?.payment_method;
  // The PM is only reusable off-session when the original session set
  // setup_future_usage='off_session' (corner branch, 2026-07-16). Without
  // this gate the charge fails invalid_request_error mid-flow.
  const cardSavedForReuse =
    originalSession.payment_intent?.setup_future_usage === 'off_session';

  if (!customerId || !paymentMethodId || !cardSavedForReuse) {
    // Expected for sessions minted before the saved-card restore. Caller
    // falls back to the $27 upgrade Payment Link.
    return res.status(409).json({ error: 'no_saved_card', message: 'This session has no saved payment method. Use fallback.' });
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: OTO.amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: OTO.description,
      metadata: {
        kind: 'upgrade',
        funnel: 'braveworks-bp',
        target_tier: OTO.targetTier,
        flow: 'kit_oto_one_click',
        original_session: session_id,
        oto_price_id: OTO.priceId,
        ...(originalSession.metadata?.ph_distinct_id
          ? { ph_distinct_id: originalSession.metadata.ph_distinct_id }
          : {}),
      },
    }, {
      idempotencyKey: idemKey,
    });
  } catch (err) {
    if (err.code === 'authentication_required' || err.code === 'card_declined') {
      return res.status(402).json({ error: err.code, message: 'Card requires authentication or was declined. Fall back to re-entry.' });
    }
    console.error('kit-oto-charge stripe error:', err.message);
    return res.status(500).json({ error: 'charge_failed', detail: err.message });
  }

  try {
    // PERMANENT (no TTL): one OTO per session, forever. A 24h expiry plus a
    // bookmarked /oto revisit is a double-charge.
    await kv.set(idemKey, {
      payment_intent_id: paymentIntent.id,
      charged_at: new Date().toISOString(),
      amount: OTO.amount,
    });
  } catch (err) {
    console.warn('kit-oto-charge: idem write failed', err.message);
  }

  // Fulfillment: delivery email + paidTier bump + PostHog + dedupe marker,
  // via the SAME processUpgrade path the webhook runs for payment-link
  // upgrades. A direct PaymentIntent never fires checkout.session.completed,
  // so this call IS the fulfillment. Best-effort: a delivery failure never
  // fails the response — the customer is already billed. processUpgrade's
  // own email+tier dedupe marker is only written after a successful send.
  // NOTE: the nightly reconcile cron reconciles Checkout Sessions, not raw
  // PaymentIntents, so a delivery failure here needs the error log + manual
  // recovery (search Vercel logs for "needs recovery").
  let delivered = false;
  try {
    const { processUpgrade } = await import('./triangle-webhook.js');
    const result = await processUpgrade(
      {
        id: paymentIntent.id,
        customer_details: originalSession.customer_details,
        amount_subtotal: OTO.amount,
        amount_total: OTO.amount,
        metadata: paymentIntent.metadata,
      },
      OTO.targetTier,
    );
    delivered = Boolean(result && (result.delivered || result.deduplicated));
  } catch (err) {
    console.error('kit-oto-charge: processUpgrade failed (charge OK, needs recovery)', err.message);
    // Charged-but-undelivered must never depend on someone grepping logs:
    // write a durable KV recovery record AND email Joel. Best-effort both.
    try {
      await kv.set(`needs-recovery:kit-oto:${paymentIntent.id}`, {
        payment_intent_id: paymentIntent.id,
        session_id,
        email: originalSession.customer_details?.email || null,
        error: err.message,
        at: new Date().toISOString(),
      });
    } catch (e2) {
      console.error('kit-oto-charge: recovery record write failed', e2.message);
    }
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'BraveWorks Ops <noreply@bpquiz.com>',
        to: process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com',
        subject: 'ACTION: OTO charged but delivery failed',
        text: `A $27 complete-kit OTO charge succeeded but fulfillment failed.\n\nPaymentIntent: ${paymentIntent.id}\nBuyer: ${originalSession.customer_details?.email || 'unknown'}\nError: ${err.message}\n\nRecovery record: needs-recovery:kit-oto:${paymentIntent.id}\nManually deliver the complete kit or refund.`,
      });
    } catch (e3) {
      console.error('kit-oto-charge: recovery alert email failed', e3.message);
    }
  }

  return res.status(200).json({ ok: true, payment_intent_id: paymentIntent.id, delivered });
}
