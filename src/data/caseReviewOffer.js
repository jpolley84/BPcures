// src/data/caseReviewOffer.js — the $297 "Joel's Eyes On Your Case" offer.
//
// This is the personal BP case review by Joel Polley, RN. It is a SEPARATE,
// braveworks-owned product, intentionally kept OUT of public/products.json
// (that file is the 3-tier result-page grid only). The $297 is offered as a
// soft, trust-first CTA inside the buyer email sequence (api/buyer-cron.js),
// never as a hard upsell slammed in front of a fresh $27 buyer, and the
// /case-review-confirmed page reads from it after purchase.
//
// The price + payment link are created on the LIVE Stripe account and recorded
// in memory (project_braveworks_bp_rebuild). Reuse these, do not recreate.
//   product : prod_Um8829DP1hSr5A  "BraveWorks BP - Joel's Eyes On Your Case"
//   price   : price_1TmZsIHseZnO3rRZmIhg9S7i  (29700 USD, one_time)
//   link    : after_completion redirects to
//             /case-review-confirmed?session_id={CHECKOUT_SESSION_ID}
//
// The link is overridable by env (VITE_STRIPE_CASE_REVIEW_LINK) so Joel can swap
// it without a code change; the live link is the fallback so the offer works the
// moment it ships.
//
// Compliance: education and lifestyle support, alongside the doctor. No doses,
// no diagnosis, no clinical promise. ZERO em-dashes in any visible copy.

// Public, browser-safe constants (no secrets). The bare Stripe payment link is a
// public URL, fine to ship in the bundle. The env override matches the loadEnv
// convention (VITE_-prefixed); we read import.meta.env directly here so this
// module stays free of other imports.
const ENV_LINK =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_STRIPE_CASE_REVIEW_LINK) || '';

export const CASE_REVIEW = {
  name: "Joel's Eyes On Your Case",
  price: '$297',
  priceCents: 29700,
  stripePriceId: 'price_1TmZsIHseZnO3rRZmIhg9S7i',
  // Live braveworks payment link (redirect baked in). Env can override.
  paymentLink: ENV_LINK || 'https://buy.stripe.com/6oUfZh43Nb5Y3V94FbfnO1h',

  // The outcome, sold the way Joel would say it at the bedside. Not hypey.
  kicker: 'A nurse in your corner',
  headline: 'Want Joel to look at your case himself?',
  // One-paragraph outcome promise (functional copy; a copy polish may follow).
  body:
    'Some people want more than a kit, they want a nurse who has actually read their case. With this, Joel Polley, RN, sits down with your quiz, your corners, and where you keep getting stuck, and sends back your exact next moves in plain language. Not a script, your situation, read by someone who has spent twenty years at the bedside. Education and lifestyle support, alongside your doctor, never instead of your doctor.',
  // What they get, education-framed (no clinical promise, no doses).
  includes: [
    'Joel personally reviews your quiz, your corners, and what you have tried so far',
    'Your exact next moves, written for your situation, not a generic plan',
    'Plain-language notes you can bring to your own doctor',
  ],
  cta: 'Have Joel review my case',
};

export default CASE_REVIEW;
