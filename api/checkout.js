import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, successUrl, cancelUrl } = req.body;

  if (!priceId) {
    return res.status(400).json({ error: 'Missing priceId' });
  }

  try {
    // Omit payment_method_types so Stripe auto-enables every method the
    // account supports (card + Apple Pay + Google Pay + Link). Card-only
    // restriction was suppressing 8-15% of mobile-TikTok conversions.
    const siteUrl = process.env.VITE_SITE_URL || 'https://bpquiz.com';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${siteUrl}/success`,
      cancel_url: cancelUrl || siteUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
