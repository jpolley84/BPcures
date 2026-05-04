import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, addOnPriceId, successUrl, cancelUrl } = req.body;

  if (!priceId) {
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl || `${siteUrl}/success`,
      cancel_url: cancelUrl || siteUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
