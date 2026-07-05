// src/data/upgradeOffers.js - the difference-priced /welcome upgrade offers.
//
// The /welcome page shows every tier's contents. The tier(s) the buyer owns are
// unlocked; the higher tiers are shown locked with an "Unlock now to get the
// rest of the kit" button. That button points at one of these difference-priced
// Stripe payment links so the buyer pays only the GAP, not the full higher tier
// (fair, and it avoids refund / chargeback risk):
//   corner  -> top2      = $20  (the second corner's full set + its bonus)
//   corner  -> complete  = $70  (the other two corners + Finale + Skool + cookbook)
//   top2    -> complete  = $50  (the third corner + Finale + cookbook)
//
// Each payment link's after_completion redirects back to
//   /welcome?tier=<target_tier>&upgraded=1
// so the buyer immediately lands on the now-unlocked content. The price ids are
// stamped with metadata { kind:'upgrade', target_tier, funnel:'braveworks-bp' };
// the webhook recognizes an upgrade by that price id / metadata (NEVER by the
// raw amount, since 2000 collides with the legacy $20 one-click OTO).
//
// Created on the LIVE Stripe account (see the create-upgrade-links run recorded
// in project memory). Reuse these, do not recreate. Env can override every value
// (VITE_-prefixed, browser-safe public URLs) without a code change; the live
// values are the fallbacks so the upsell works the moment it ships.
//
// Compliance: education and lifestyle support, alongside the doctor. No doses,
// no diagnosis, no clinical promise. ZERO em-dashes in any visible copy.

function env(name, fallback) {
  const v =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || '';
  return v || fallback;
}

// corner -> top2 : the SECOND loudest corner's full set (+ its bonus). $20.
export const UPGRADE_CORNER_TO_TOP2 = {
  fromTier: 'corner',
  targetTier: 'top2',
  priceCents: 2000,
  priceLabel: '$20',
  stripePriceId: env('VITE_UPGRADE_CORNER_TO_TOP2_PRICE_ID', 'price_1TmhuvHseZnO3rRZ6jXBe6II'),
  paymentLink: env(
    'VITE_UPGRADE_CORNER_TO_TOP2_LINK',
    'https://buy.stripe.com/6oU3cv9o76PIbnB7RnfnO1j',
  ),
};

// corner -> complete : the other TWO corners + the Freedom Finale (+ Skool +
// cookbook). $70.
export const UPGRADE_CORNER_TO_COMPLETE = {
  fromTier: 'corner',
  targetTier: 'complete',
  priceCents: 7000,
  priceLabel: '$70',
  stripePriceId: env('VITE_UPGRADE_CORNER_TO_COMPLETE_PRICE_ID', 'price_1TmhuwHseZnO3rRZbrSRoKfh'),
  paymentLink: env(
    'VITE_UPGRADE_CORNER_TO_COMPLETE_LINK',
    'https://buy.stripe.com/00wdR92ZJa1UgHV4FbfnO1k',
  ),
};

// top2 -> complete : the THIRD corner + the Freedom Finale (+ cookbook). $50.
export const UPGRADE_TOP2_TO_COMPLETE = {
  fromTier: 'top2',
  targetTier: 'complete',
  priceCents: 5000,
  priceLabel: '$50',
  stripePriceId: env('VITE_UPGRADE_TOP2_TO_COMPLETE_PRICE_ID', 'price_1TmhuxHseZnO3rRZ3T43Sz77'),
  paymentLink: env(
    'VITE_UPGRADE_TOP2_TO_COMPLETE_LINK',
    'https://buy.stripe.com/28E5kD9o78XQfDR5JffnO1l',
  ),
};

// All three, keyed for convenience.
export const UPGRADE_OFFERS = {
  corner_to_top2: UPGRADE_CORNER_TO_TOP2,
  corner_to_complete: UPGRADE_CORNER_TO_COMPLETE,
  top2_to_complete: UPGRADE_TOP2_TO_COMPLETE,
};

// The upgrade(s) a buyer at `ownedTier` can take, in display order (cheapest
// first). corner buyers see BOTH a top2 unlock and a complete unlock; top2
// buyers see only the complete unlock; complete buyers see none.
export function upgradesForTier(ownedTier) {
  if (ownedTier === 'corner') {
    return [UPGRADE_CORNER_TO_TOP2, UPGRADE_CORNER_TO_COMPLETE];
  }
  if (ownedTier === 'top2') {
    return [UPGRADE_TOP2_TO_COMPLETE];
  }
  return [];
}

// The single upgrade offer that unlocks exactly `targetTier` for a buyer who
// currently owns `ownedTier` (used to put the right "Unlock now" button on a
// given locked tier section). Returns null when no such upgrade exists.
export function upgradeFor(ownedTier, targetTier) {
  return (
    upgradesForTier(ownedTier).find((u) => u.targetTier === targetTier) || null
  );
}

export default UPGRADE_OFFERS;
