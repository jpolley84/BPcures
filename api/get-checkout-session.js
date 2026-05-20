// api/get-checkout-session.js — retrieve session info for post-purchase
// upsell pages. Returns the saved Customer + PaymentMethod that the
// one-click charge endpoint will bill on the next page.
//
// Used by:
//   /upsell-bp-cure-book?session_id=cs_xxx — checks for saved PM
//   /upsell-bp-reset-kit?session_id=cs_xxx — same
//
// If session has no saved PM (e.g. customer arrived via Stripe Payment
// Link instead of /api/checkout with saveCard:true), the page falls
// back to the legacy "re-enter card" upsell path.
//
// 2026-05-20: built as part of bpcures one-click mechanic port.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.query.session_id;
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent'],
    });

    // Customer info — both for greeting + for downstream charge.
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const customerEmail = session.customer_details?.email
      || (typeof session.customer === 'object' ? session.customer?.email : null)
      || null;
    const customerName = session.customer_details?.name
      || (typeof session.customer === 'object' ? session.customer?.name : null)
      || null;
    const firstName = (customerName || '').split(' ')[0] || '';

    // The saved PaymentMethod ID — only present if the original session
    // was created with payment_intent_data.setup_future_usage='off_session'
    // (i.e. via /api/checkout with saveCard:true). If undefined, no
    // one-click path available — caller falls back.
    let savedPaymentMethodId = null;
    if (session.payment_intent && typeof session.payment_intent === 'object') {
      savedPaymentMethodId = session.payment_intent.payment_method
        || session.payment_intent.last_payment_error?.payment_intent?.payment_method
        || null;
    }

    return res.status(200).json({
      ok: true,
      customer_id: customerId,
      email: customerEmail,
      first_name: firstName,
      payment_method_id: savedPaymentMethodId,
      has_saved_card: !!(customerId && savedPaymentMethodId),
      amount_paid: session.amount_total,
      session_status: session.status,
    });
  } catch (err) {
    console.error('get-checkout-session error:', err.message);
    // Don't leak full Stripe error to client — the upsell page only
    // needs to know "no saved card available, use fallback path".
    return res.status(404).json({ error: 'session_not_found', has_saved_card: false });
  }
}
