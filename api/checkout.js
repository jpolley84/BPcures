import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel's auto body parser sets req.body to undefined when the body isn't
  // valid JSON. Destructuring undefined throws before the try/catch below
  // could catch it, so the response was empty (no status, no body) and the
  // caller silently bounced. Guard the destructure and surface a real 400.
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body — expected JSON' });
  }

  const { priceId, addOnPriceId, successUrl, cancelUrl, saveCard } = req.body;

  if (!priceId || typeof priceId !== 'string') {
    return res.status(400).json({ error: 'Missing priceId' });
  }

  try {
    // Omit payment_method_types so Stripe auto-enables every method the
    // account supports (card + Apple Pay + Google Pay + Link). Card-only
    // restriction was suppressing 8-15% of mobile-TikTok conversions.
    const siteUrl = process.env.VITE_SITE_URL || 'https://bpquiz.com';

    // Build line items. `addOnPriceId` is an optional order-bump price
    // (e.g. $12 Pressure Triangle Stack alongside the $17 BP starter).
    // When provided, Stripe shows both items in one checkout and the
    // combined `amount_total` drives tier recognition in
    // purchase-confirmation.js (e.g. 1700 + 1200 = 2900 → '1+pt-stack').
    const lineItems = [{ price: priceId, quantity: 1 }];
    if (addOnPriceId) {
      lineItems.push({ price: addOnPriceId, quantity: 1 });
    }

    // 2026-05-20: optional `saveCard` flag enables one-click post-purchase
    // upsells. When true, we force customer creation and tell Stripe to
    // save the payment method for off_session re-use. The follow-on
    // upsell pages (/upsell-bp-cure-book, /upsell-bp-reset-kit) then call
    // /api/charge-saved-card to bill that saved PM with one click —
    // mirrors bpcures' 26% take rate mechanic. Defaults to false so any
    // existing caller (legacy upsell paths) keeps the current behavior.
    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl || `${siteUrl}/success`,
      cancel_url: cancelUrl || siteUrl,
    };

    if (saveCard) {
      sessionParams.customer_creation = 'always';
      sessionParams.payment_intent_data = { setup_future_usage: 'off_session' };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
