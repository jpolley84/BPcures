// api/get-checkout-session.js — retrieve session info for post-purchase
// upsell pages. Returns the saved Customer + PaymentMethod that the
// one-click charge endpoint will bill on the next page.
//
// Used by:
//   /oto + /welcome (src/components/TeaOneClickOffer.jsx) — saved card for the
//     Steady one-click, plus legacy_tea_left (2026-10-21) so the offer hides
//     itself and points at the 150 g bag when the 100 g pouches are gone
//   /upsell-bp-cure-book?session_id=cs_xxx — checks for saved PM
//
// If session has no saved PM (e.g. customer arrived via Stripe Payment
// Link instead of /api/checkout with saveCard:true), the page falls
// back to the legacy "re-enter card" upsell path.
//
// 2026-05-20: built as part of bpcures one-click mechanic port.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';

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

    // The saved PaymentMethod ID — only valid for off-session reuse if the
    // original session was created with payment_intent_data.setup_future_usage
    // ='off_session'. A completed PaymentIntent ALWAYS carries a
    // payment_method id, but without setup_future_usage that PM was never
    // attached to the Customer, and a later off_session charge fails with
    // invalid_request_error. So gate on the PI's setup_future_usage field
    // (2026-07-13: the $17 kit branch no longer saves cards; tea still does).
    let savedPaymentMethodId = null;
    if (
      session.payment_intent &&
      typeof session.payment_intent === 'object' &&
      session.payment_intent.setup_future_usage === 'off_session'
    ) {
      savedPaymentMethodId = session.payment_intent.payment_method
        || session.payment_intent.last_payment_error?.payment_intent?.payment_method
        || null;
    }

    // 2026-10-21: 100 g Steady pouches left (KV tea:legacy100:left, the same
    // counter create-embedded-checkout.js and tea-one-click.js refuse on). The
    // /oto one-click hides itself at 0 and sends buyers to the 150 g bag on
    // hormoneteas.com. Mirrors the server guards: a missing key reads as 0, and
    // a FAILED read reads as 0 too (fail closed, like middleware.js), so a KV
    // outage sends buyers to the 150 g bag instead of an unguarded $48 Payment
    // Link for pouches nobody can confirm are on the shelf. tea-one-click.js
    // stays the real guard (410 sold_out / 503 stock_unavailable).
    let legacyTeaLeft = 0;
    try {
      const n = parseInt(await kv.get('tea:legacy100:left'), 10);
      legacyTeaLeft = Number.isFinite(n) ? n : 0;
    } catch (err) {
      console.warn('get-checkout-session: tea stock read failed, reporting 0', err.message);
      legacyTeaLeft = 0;
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
      legacy_tea_left: legacyTeaLeft,
    });
  } catch (err) {
    console.error('get-checkout-session error:', err.message);
    // Don't leak full Stripe error to client — the upsell page only
    // needs to know "no saved card available, use fallback path".
    return res.status(404).json({ error: 'session_not_found', has_saved_card: false });
  }
}
