// api/create-embedded-checkout.js — create a Stripe EMBEDDED Checkout Session
// (ui_mode: 'embedded') so the card form renders INLINE on our own page instead
// of redirecting the buyer to buy.stripe.com. Removes the cold-traffic trust dip
// of the external hand-off (the step where 11/11 checkout-reachers were bailing).
//
// Contract:
//   POST { tier?='corner', corner?, email? }
//   200  { clientSecret }
// The client mounts the embedded checkout with this clientSecret; on completion
// Stripe redirects the top frame to return_url (/welcome), where delivery shows.
//
// SECURITY: the price is chosen SERVER-SIDE from `tier` (never trust a client
// priceId), and the launch/regular price is picked by the SAME deadline the page
// uses, so the embedded form always charges what the page shows ($17 during the
// sale, $27 after). Webhook recognizes the sale by metadata.funnel + amount.
// ZERO secrets in the client. Secrets come from process.env.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 2026-07-01 (Joel): $17 is the PERMANENT price, "leave it at what it is forever."
// The old launch-sale deadline flip to $27 is removed; we always charge the $17 price.

// tier -> server-owned price ids. 2026-07 ladder: $17 corner on-page, $47
// COMPLETE kit (all three corners + Finale) as the direct second rung, also
// buyable inline at /pay?tier=complete. The $30 corner->complete difference
// upgrade + the $97 1:1 call are post-purchase payment links (see
// upgradeOffers.js + the webhook). top2 is RETIRED from sale.
const TIER_PRICES = {
  corner: {
    sale: process.env.STRIPE_CORNER_SALE_PRICE_ID || 'price_1ToBlWHseZnO3rRZtv4lbw2m', // $17 permanent
    regular: process.env.STRIPE_CORNER_PRICE_ID || 'price_1TlYAFHseZnO3rRZoOCNHviq',   // legacy $27 (unused)
  },
  complete: {
    sale: process.env.STRIPE_COMPLETE_47_PRICE_ID || 'price_1TpqZHHseZnO3rRZWtW0s1L8', // $47 complete
    regular: process.env.STRIPE_COMPLETE_47_PRICE_ID || 'price_1TpqZHHseZnO3rRZWtW0s1L8',
  },
};

// ─── $297 case review ("Joel's Eyes On Your Case") ────────────────────
// Paid-in-full: the live one-time $297 price (same asset the payment link uses).
const CASE_REVIEW_PRICE_ID =
  process.env.CASE_REVIEW_PRICE_ID || 'price_1TmZsIHseZnO3rRZmIhg9S7i';
// 3-pay plan: a recurring monthly price on the same product. The webhook
// (api/triangle-webhook.js) caps the subscription at 3 cycles via cancel_at.
// CASE_REVIEW_3PAY_PRICE_ID is filled after Stripe price creation (or set
// STRIPE_CASE_REVIEW_3PAY_PRICE_ID in Vercel); until then, tier 'casereview3'
// returns 400 { error: 'threePayUnavailable' } so the page can hide the option.
// Keep the const in sync with api/case-review-slots.js (same seam).
const CASE_REVIEW_3PAY_PRICE_ID = 'price_1Tp9OXHseZnO3rRZ5nLQww5E'; // $99/mo x3 (created 2026-07-03)
const CASE_REVIEW_3PAY_PRICE =
  process.env.STRIPE_CASE_REVIEW_3PAY_PRICE_ID || CASE_REVIEW_3PAY_PRICE_ID;

const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body, expected JSON' });
  }

  const tier = typeof req.body.tier === 'string' ? req.body.tier : 'corner';
  const email =
    typeof req.body.email === 'string' && req.body.email.includes('@')
      ? req.body.email.trim().slice(0, 200)
      : '';
  const siteUrl = process.env.VITE_SITE_URL || 'https://bpquiz.com';

  // ── $297 case review (paid in full OR 3-pay) ──
  // Both land on /case-review-confirmed. The metadata markers (offer + plan,
  // plus the legacy kind the webhook already recognizes) drive fulfillment in
  // api/triangle-webhook.js; the 3-pay session ALSO stamps the same metadata on
  // the subscription itself so the webhook's cancel_at guard can verify it.
  if (tier === 'casereview' || tier === 'casereview3') {
    const isThreePay = tier === 'casereview3';
    if (isThreePay && !CASE_REVIEW_3PAY_PRICE) {
      return res.status(400).json({ error: 'threePayUnavailable' });
    }
    const metadata = {
      funnel: 'braveworks-bp',
      brand: 'braveworks-bp',
      kind: 'case-review',
      offer: 'case-review',
      plan: isThreePay ? '3pay' : 'full',
    };
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: isThreePay ? 'subscription' : 'payment',
        line_items: [
          { price: isThreePay ? CASE_REVIEW_3PAY_PRICE : CASE_REVIEW_PRICE_ID, quantity: 1 },
        ],
        metadata,
        ...(isThreePay ? { subscription_data: { metadata } } : {}),
        return_url: `${siteUrl}/case-review-confirmed?session_id={CHECKOUT_SESSION_ID}`,
        ...(email ? { customer_email: email } : {}),
      });
      return res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      console.error('create-embedded-checkout error:', err.message);
      return res.status(500).json({ error: 'Failed to start checkout' });
    }
  }

  const prices = TIER_PRICES[tier];
  if (!prices) return res.status(400).json({ error: 'Unknown tier' });

  const corner = VALID_CORNERS.has(req.body.corner) ? req.body.corner : null;

  const priceId = prices.sale; // always $17 (permanent price; no deadline flip)

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      // The webhook guard keys on metadata.funnel; corner drives kit delivery.
      metadata: { funnel: 'braveworks-bp', brand: 'braveworks-bp', tier, ...(corner ? { corner } : {}) },
      // Pass the corner through so the /welcome thank-you page shows the SAME kit
      // the buyer paid for. A quiz-skipper has no corner in sessionStorage, so
      // without this the page falls back to the wrong corner. The delivery email is
      // driven by metadata.corner regardless; this just keeps the on-site page matched.
      return_url: `${siteUrl}/welcome?tier=${encodeURIComponent(tier)}${corner ? `&corner=${encodeURIComponent(corner)}` : ''}&session_id={CHECKOUT_SESSION_ID}`,
      ...(email ? { customer_email: email } : {}),
    });
    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('create-embedded-checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to start checkout' });
  }
}
