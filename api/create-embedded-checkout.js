// api/create-embedded-checkout.js — create a Stripe EMBEDDED Checkout Session
// (ui_mode: 'embedded') so the card form renders INLINE on our own page instead
// of redirecting the buyer to buy.stripe.com. Removes the cold-traffic trust dip
// of the external hand-off (the step where 11/11 checkout-reachers were bailing).
//
// Contract:
//   POST { tier?='corner', corner?, email?, ph_did?, ab_variant? }
//   200  { clientSecret }
//   500  { error, code, ... }   'challenge-*' tiers only, when the price is
//                               not configured. The page must render an honest
//                               failure state on this, never a live spinner.
// The client mounts the embedded checkout with this clientSecret; on completion
// Stripe redirects the top frame to return_url (/welcome), where delivery shows.
//
// SECURITY: the price is chosen SERVER-SIDE from `tier` (never trust a client
// priceId), and the launch/regular price is picked by the SAME deadline the page
// uses, so the embedded form always charges what the page shows ($17 during the
// sale, $27 after). Webhook recognizes the sale by metadata.funnel + amount.
// ZERO secrets in the client. Secrets come from process.env.

import Stripe from 'stripe';
import { recentPurchase } from './_dupe-guard.js';

// Tiers the duplicate-purchase guard must NEVER block. These are physical
// consumables that customers really do buy twice in a row (a second pouch, or
// the same pouch shipped to someone else). See the guard block inside the
// handler for the full reasoning.
const DUPE_GUARD_EXEMPT_TIERS = new Set([
  'tea-48', 'tea-120', 'tea-satin-48', 'tea-satin-120',
]);

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

// ─── The Three Pressures Challenge (bpquiz.com/challenge) ─────────────
// 2026-07-26. Five live nights, Tue 2026-08-04 through Sun 2026-08-09,
// 7:00pm CT. ONE seat at $97 (challenge-ga), which includes the $17 10-Day
// BP Reset Kit. The GA/VIP split was collapsed on 2026-07-26 at Joel's call.
//
// DELIBERATELY NO HARDCODED FALLBACK PRICE ID. Every other offer in this file
// carries `process.env.X || 'price_...'` because those prices exist and are
// live. The challenge prices DO NOT EXIST YET (creating them is a financial
// write that needs Joel's explicit approval, which has not been given). A
// fallback here would either 500 inside Stripe or, far worse, inherit another
// product's id and charge a buyer $17 for a $97 seat. So: read the env var,
// and if it is absent or malformed, fail LOUD with a distinct error code the
// page renders as its honest "checkout is not open yet" state.
const CHALLENGE_COHORT = '2026-08-04';           // cohort id, also the Night 1 date
const CHALLENGE_START_CT = '2026-08-04T19:00:00'; // Night 1, 7:00pm CT
const CHALLENGE_PRICE_ENV = {
  'challenge-ga': 'CHALLENGE_GA_PRICE_ID',
  'challenge-vip': 'CHALLENGE_VIP_PRICE_ID',
};

// Wrong-product tripwire. If either challenge env var is ever pointed at a
// price this site already sells (a copy/paste slip in the Vercel dashboard),
// the buyer would be charged the wrong amount for the wrong thing and the
// webhook would deliver the wrong product. Cheaper to refuse than to refund.
// Built from the ids already declared above so it cannot drift.
function knownOtherPriceIds() {
  return new Set(
    [
      TIER_PRICES.corner.sale,
      TIER_PRICES.corner.regular,
      TIER_PRICES.complete.sale,
      TIER_PRICES.complete.regular,
      CASE_REVIEW_PRICE_ID,
      CASE_REVIEW_3PAY_PRICE,
      process.env.SATIN_48_PRICE_ID || 'price_1TqGRCHseZnO3rRZBsF7Mvyu',
      process.env.SATIN_120_PRICE_ID || 'price_1TqGR9HseZnO3rRZJ9ynNFKx',
      process.env.TEA_48_PRICE_ID || 'price_1TqGiaHseZnO3rRZhSCeTi1H',
      process.env.TEA_120_PRICE_ID || 'price_1TqGiWHseZnO3rRZ9XnHorV0',
      process.env.ALLIN_FULL_PRICE_ID || 'price_1TWftLHseZnO3rRZHCZwE2z7',
      process.env.ALLIN_DEPOSIT_PRICE_ID || 'price_1TvOULHseZnO3rRZZG8iyG9S',
      process.env.ALLIN_PLAN_PRICE_ID || 'price_1TvOULHseZnO3rRZiQYF8LFS',
    ].filter(Boolean)
  );
}

// Resolve a challenge tier to its price id, or an error reason. Never throws,
// never guesses, never falls back to another product.
function resolveChallengePrice(tier) {
  const envName = CHALLENGE_PRICE_ENV[tier];
  const raw = process.env[envName];
  const priceId = typeof raw === 'string' ? raw.trim() : '';
  if (!priceId) return { ok: false, reason: 'unset', envName };
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) return { ok: false, reason: 'malformed', envName };
  if (knownOtherPriceIds().has(priceId)) return { ok: false, reason: 'collision', envName };
  const otherTier = tier === 'challenge-ga' ? 'challenge-vip' : 'challenge-ga';
  const otherRaw = process.env[CHALLENGE_PRICE_ENV[otherTier]];
  if (typeof otherRaw === 'string' && otherRaw.trim() === priceId) {
    return { ok: false, reason: 'collision', envName };
  }
  return { ok: true, priceId, envName };
}

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

  // ── Duplicate-purchase guard (2026-07-27) ──
  // EXEMPTION (added same day, after an upsell-safety audit): physical
  // consumables are legitimately bought twice in a row. bpquiz.com/tea's buy
  // buttons point at /pay?tier=tea-48 (public/tea/index.html:436,450,822 —
  // data-pay is empty, so there is NO payment-link fallback on that page), which
  // means the embedded checkout is the ONLY manual route to a second pouch.
  // A buyer who wants pouch #2 sent to a different address cannot use the
  // /tea-thanks one-click at all (it reuses the first order's shipping), so
  // guarding tea would have destroyed a real $48 sale on the tier that is ~44%
  // of 30d revenue.
  //
  // Every dispute that motivated this guard was the $17 DIGITAL kit
  // (see api/_dupe-guard.js). Digital goods have no reason to be bought twice
  // in 30 minutes; tea does. Losing a real sale is the worse error, which is
  // the same reasoning behind the guard being fail-open.
  // If this email completed a paid purchase of this same tier in the last 30
  // minutes, do not mint another Checkout Session. See api/_dupe-guard.js for
  // the dispute data that motivated this: 43% of lifetime disputes traced to
  // double charges, and each chargeback costs the sale plus a ~$15 fee plus
  // dispute-ratio damage.
  //
  // Fail-open by construction: recentPurchase() returns null on any KV error,
  // so an infrastructure problem can never block a paying customer. It also
  // requires an email, so anonymous checkouts are unaffected.
  if (email && !DUPE_GUARD_EXEMPT_TIERS.has(tier)) {
    const prior = await recentPurchase(email, tier);
    if (prior) {
      return res.status(409).json({
        error: 'already_purchased',
        message:
          'It looks like this order just went through. Check your email for the receipt and your download link. If you meant to buy a second one, write to braveworksrn@gmail.com and we will set it up by hand.',
        purchasedAt: prior.at,
      });
    }
  }

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

  // ── The Three Pressures Challenge, GA $47 / VIP $97 ──────────────────
  // Same branch shape as All-In above: server-owned price, one-time payment,
  // embedded, metadata stamped so the sale is attributable and the webhook can
  // route it. Differences that matter:
  //   - the price id comes ONLY from env, with no fallback (see above);
  //   - NO setup_future_usage. The page promises "nothing here renews" and has
  //     no post-purchase one-click, so Stripe must not render save-card /
  //     future-charge consent language at the pay button (the 2026-07-13
  //     panel finding on the kit tier).
  //   - metadata.offer = 'challenge' is the ONLY safe way to recognize this
  //     sale. Amount routing cannot: 4700 and 9700 are already mapped to the
  //     Complete kit in triangle-webhook AMOUNT_TO_TIER. See the P0 note in
  //     the header of api/challenge-signup.js.
  if (tier === 'challenge-ga' || tier === 'challenge-vip') {
    const resolved = resolveChallengePrice(tier);
    if (!resolved.ok) {
      // Loud, specific, and never a silent charge. The page shows its
      // "Checkout is not open yet" state on this code and captures the email
      // through /api/challenge-signup instead.
      console.error(
        `create-embedded-checkout: challenge price unusable (tier=${tier}, env=${resolved.envName}, reason=${resolved.reason}). ` +
          'Refusing to create a session rather than charge the wrong product.'
      );
      return res.status(500).json({
        error: 'challengeCheckoutUnavailable',
        code: 'CHALLENGE_PRICE_NOT_CONFIGURED',
        reason: resolved.reason, // 'unset' | 'malformed' | 'collision'
        tier,
        message: 'Checkout for this challenge is not open yet.',
      });
    }
    const seat = tier === 'challenge-vip' ? 'vip' : 'ga';
    const metadata = {
      funnel: 'braveworks-bp',
      brand: 'braveworks-bp',
      offer: 'challenge',
      challenge: 'three-pressures',
      // Full tier key, not 'ga'/'vip' on its own: md.tier === 'recordings' is a
      // RestoreHER guard in the legacy webhook, so keep this namespace distinct.
      tier,
      seat,
      cohort: CHALLENGE_COHORT,
      cohort_start_ct: CHALLENGE_START_CT,
      ...phMeta,
      ...abMeta,
    };
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: 'payment',
        line_items: [{ price: resolved.priceId, quantity: 1 }],
        metadata,
        customer_creation: 'always',
        return_url: `${siteUrl}/challenge-confirmed?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        ...(email ? { customer_email: email } : {}),
      });
      return res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
      console.error('create-embedded-checkout challenge error:', err.message);
      return res.status(500).json({
        error: 'challengeCheckoutUnavailable',
        code: 'CHALLENGE_CHECKOUT_FAILED',
        tier,
        message: 'Checkout for this challenge is not open yet.',
      });
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
