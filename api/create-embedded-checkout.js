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

// 2026-07-16: all 5 quiz triggers are valid corner keys (sleep = The Midnight
// Drift, stillness = The Stillness Trigger). Keep in sync with PayPage
// VALID_CORNERS and _kit-manifest KIT_CORNERS.
const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium', 'sleep', 'stillness']);

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

  // Browser PostHog distinct id, threaded through session metadata so the
  // server-side purchase capture merges the buyer into the clicking device's
  // PostHog person (see api/_posthog.js / api/_triangle-posthog.js).
  // Sanitized: string only, control chars stripped, max 200 chars.
  const phDid =
    typeof req.body.ph_did === 'string'
      ? req.body.ph_did.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 200)
      : '';
  const phMeta = phDid ? { ph_distinct_id: phDid } : {};

  // Homepage A/B split variant ('a' | 'b'), threaded from localStorage
  // (src/utils/analytics.js getAbHomeVariant) so the purchase event capturePurchase
  // fires server-side can be broken down by variant. Without this the purchase
  // event has no ab_home_variant at all (2026-07-17 gap found: quiz_started and
  // checkout_clicked carried it via the client super-property, but purchase
  // fires from THIS server-side webhook, which never sees a browser super prop).
  const abVariant =
    typeof req.body.ab_variant === 'string' && (req.body.ab_variant === 'a' || req.body.ab_variant === 'b')
      ? req.body.ab_variant
      : '';
  const abMeta = abVariant ? { ab_home_variant: abVariant } : {};

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
      ...phMeta,
      ...abMeta,
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

  // ── SVUTU Steady tea (bpquiz.com/tea, embedded inline checkout) ──
  // 2026-07-10 conversion plan: the tea page's buy buttons move from Stripe
  // Payment Link redirects to this inline checkout so (a) the card is saved
  // for the post-purchase one-click "+1 pouch" (api/tea-one-click.js) and
  // (b) the buyer never bounces to a third-party screen. Physical product:
  // shipping address is collected IN the checkout (US). metadata
  // funnel:'svutu-tea' routes fulfillment to processTeaPurchase in
  // triangle-webhook.js (KV shipping digest + Resend tag + confirmation
  // email), exactly like the payment-link path. Prices are the SAME live
  // price ids the payment links use (verified 2026-07-08).
  // ── SVUTU Satin (hormoneteas.com, Annie's blend) embedded inline checkout ──
  // 2026-07-21: Satin moved from Stripe Payment Links onto the SAME embedded
  // rail as Steady so it gets a true post-purchase one-click "double your order
  // for a friend" (api/tea-one-click.js). Card saved off_session; shipping
  // collected inline. Recognized by the webhook via metadata blend:'satin'
  // (NOT funnel:'svutu-tea' — that would route it to Steady fulfillment). The
  // price ids are the SAME live Satin prices the payment links use.
  if (tier === 'tea-satin-48' || tier === 'tea-satin-120') {
    const SATIN_PRICES = {
      'tea-satin-48': process.env.SATIN_48_PRICE_ID || 'price_1TqGRCHseZnO3rRZBsF7Mvyu',   // 1-Month $48
      'tea-satin-120': process.env.SATIN_120_PRICE_ID || 'price_1TqGR9HseZnO3rRZJ9ynNFKx', // 90-Day $120
    };
    const metadata = { blend: 'satin', venture: 'svutu', offer: tier, ...phMeta, ...abMeta };
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'payment',
        line_items: [{ price: SATIN_PRICES[tier], quantity: 1 }],
        metadata,
        shipping_address_collection: { allowed_countries: ['US'] },
        customer_creation: 'always',
        payment_intent_data: { setup_future_usage: 'off_session' },
        return_url: `${siteUrl}/satin-thanks?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        ...(email ? { customer_email: email } : {}),
      });
      return res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      console.error('create-embedded-checkout satin error:', err.message);
      return res.status(500).json({ error: 'Failed to start checkout' });
    }
  }

  if (tier === 'tea-48' || tier === 'tea-120') {
    const TEA_PRICES = {
      'tea-48': process.env.TEA_48_PRICE_ID || 'price_1TqGiaHseZnO3rRZhSCeTi1H',   // 1-Month $48
      'tea-120': process.env.TEA_120_PRICE_ID || 'price_1TqGiWHseZnO3rRZ9XnHorV0', // 90-Day $120
    };
    const metadata = { funnel: 'svutu-tea', offer: tier, ...phMeta, ...abMeta };
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'payment',
        line_items: [{ price: TEA_PRICES[tier], quantity: 1 }],
        metadata,
        shipping_address_collection: { allowed_countries: ['US'] },
        customer_creation: 'always',
        payment_intent_data: { setup_future_usage: 'off_session' },
        return_url: `${siteUrl}/tea-thanks?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        ...(email ? { customer_email: email } : {}),
      });
      return res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      console.error('create-embedded-checkout tea error:', err.message);
      return res.status(500).json({ error: 'Failed to start checkout' });
    }
  }

  // ── $1,997 "All In" 90-Day Program (bpquiz.com/allin) ────────────────
  // Three ways to pay, all embedded inline on /allin:
  //   allin-full     one-time $1,997        (reuses the live 199700 price)
  //   allin-deposit  one-time $197 deposit  (locks the spot; $1,800 balance
  //                  collected by Joel later)
  //   allin-plan     subscription $367 every 2 weeks, capped at 6 charges
  //                  ($2,202 over the 12-week program). The webhook
  //                  (processAllIn) sets cancel_at after the 6th charge.
  // Recognized in the webhook by metadata offer:'all-in' + plan; the specific
  // price ids are a backstop. Joel is alerted on every All-In sale so he can
  // build the buyer's assessment/onboarding.
  if (tier === 'allin-full' || tier === 'allin-deposit' || tier === 'allin-plan') {
    const ALLIN_PRICES = {
      'allin-full': process.env.ALLIN_FULL_PRICE_ID || 'price_1TWftLHseZnO3rRZHCZwE2z7',    // $1,997 one-time
      'allin-deposit': process.env.ALLIN_DEPOSIT_PRICE_ID || 'price_1TvOULHseZnO3rRZZG8iyG9S', // $197 one-time
      'allin-plan': process.env.ALLIN_PLAN_PRICE_ID || 'price_1TvOULHseZnO3rRZiQYF8LFS',    // $367 / 2wk recurring
    };
    const plan = tier === 'allin-full' ? 'full' : tier === 'allin-deposit' ? 'deposit' : 'plan';
    const isSub = tier === 'allin-plan';
    const metadata = {
      funnel: 'braveworks-bp',
      brand: 'braveworks-bp',
      offer: 'all-in',
      plan,
      ...phMeta,
      ...abMeta,
    };
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: isSub ? 'subscription' : 'payment',
        line_items: [{ price: ALLIN_PRICES[tier], quantity: 1 }],
        metadata,
        ...(isSub ? { subscription_data: { metadata } } : {}),
        return_url: `${siteUrl}/allin-welcome?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
        ...(email ? { customer_email: email } : {}),
      });
      return res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      console.error('create-embedded-checkout all-in error:', err.message);
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
      metadata: { funnel: 'braveworks-bp', brand: 'braveworks-bp', tier, ...(corner ? { corner } : {}), ...phMeta, ...abMeta },
      // 2026-07-08: always create a Customer (the webhook + upgrade ladder use
      // it). 2026-07-13 panel fix: setup_future_usage REMOVED from the kit
      // branch. It made Stripe render save-card/future-charge consent language
      // at the pay button on a purchase the page sells as "One-time. No
      // subscription." (this buyer's exact fear). Trade-off, accepted by Joel:
      // the /welcome tea upsell falls back from a one-click saved-card charge
      // to its normal checkout link (TeaOneClickOffer already handles the
      // no-saved-card case).
      customer_creation: 'always',
      // 2026-07-16 (Joel): setup_future_usage restored on the CORNER tier only,
      // for the /oto true one-click upgrade (api/kit-oto-charge.js). This
      // reverses the 07-13 panel removal (Stripe renders save-card consent
      // language at the pay button); Joel accepted the trade-off for the OTO.
      // Complete tier has nothing left to upsell, so it stays consent-free.
      ...(tier === 'corner'
        ? { payment_intent_data: { setup_future_usage: 'off_session' } }
        : {}),
      // Pass the corner through so the /welcome thank-you page shows the SAME kit
      // the buyer paid for. A quiz-skipper has no corner in sessionStorage, so
      // without this the page falls back to the wrong corner. The delivery email is
      // driven by metadata.corner regardless; this just keeps the on-site page matched.
      // Corner buyers route through /oto (one-click complete upgrade) BEFORE
      // /welcome; complete buyers go straight to delivery.
      return_url:
        tier === 'corner'
          ? `${siteUrl}/oto?tier=corner${corner ? `&corner=${encodeURIComponent(corner)}` : ''}&session_id={CHECKOUT_SESSION_ID}`
          : `${siteUrl}/welcome?tier=${encodeURIComponent(tier)}${corner ? `&corner=${encodeURIComponent(corner)}` : ''}&session_id={CHECKOUT_SESSION_ID}`,
      ...(email ? { customer_email: email } : {}),
    });
    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('create-embedded-checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to start checkout' });
  }
}
