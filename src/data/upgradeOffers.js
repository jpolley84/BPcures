// src/data/upgradeOffers.js - the difference-priced /welcome upgrade offers.
//
// 2026-07 LADDER (Joel): $17 one corner -> $47 COMPLETE kit (all three corners +
// Freedom Finale) -> $97 1:1 call with Joel. top2 is RETIRED from sale.
//
// The /welcome page shows the kit in two levels: the corner the buyer owns, and
// the rest of the Triangle. A corner buyer unlocks the COMPLETE kit for the $30
// DIFFERENCE ($17 paid + $30 = the $47 complete price), never full price twice.
// A complete owner is offered the $97 1:1 call (Calendly booking after payment).
//
// Each payment link's after_completion redirects back to /welcome (upgrade) or
// /call-booked (the call). Links are stamped with metadata
// { kind:'upgrade'|'call-97', target_tier, funnel:'braveworks-bp' }; the webhook
// recognizes them by price id / metadata (NEVER by the raw amount).
//
// Created on the LIVE Stripe account 2026-07-02. Reuse these, do not recreate.
// Env can override every value (VITE_-prefixed, browser-safe public URLs).
//
// Compliance: education and lifestyle support, alongside the doctor. No doses,
// no diagnosis, no clinical promise. ZERO em-dashes in any visible copy.

function env(name, fallback) {
  const v =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || '';
  return v || fallback;
}

// corner -> complete : the other TWO corners + the Freedom Finale + every bonus.
// $27 OTO (Joel 2026-07-05: "$27 additional is a better psychological number
// than $30"; mirrors the $17 entry's charm pricing). The $30 price/link it
// replaced is DEACTIVATED on Stripe; the webhook still recognizes the $30 price
// id for any in-flight session.
export const UPGRADE_CORNER_TO_COMPLETE = {
  fromTier: 'corner',
  targetTier: 'complete',
  priceCents: 2700,
  priceLabel: '$27',
  stripePriceId: env('VITE_UPGRADE_CORNER_TO_COMPLETE_OTO_PRICE_ID', 'price_1TpqyjHseZnO3rRZk05rso0U'),
  paymentLink: env(
    'VITE_UPGRADE_CORNER_TO_COMPLETE_OTO_LINK',
    'https://buy.stripe.com/fZu9AT9o71vo0IXc7DfnO1s',
  ),
};

// The $97 1:1 call with Joel (the upsell from the complete kit). The payment
// link redirects to /call-booked, which embeds the Calendly booking calendar;
// the webhook also emails the booking link.
export const CALL_97_OFFER = {
  kind: 'call-97',
  priceCents: 9700,
  priceLabel: '$97',
  stripePriceId: env('VITE_CALL_97_PRICE_ID', 'price_1TpqZIHseZnO3rRZzYrYOfLf'),
  paymentLink: env(
    'VITE_CALL_97_LINK',
    'https://buy.stripe.com/3cI9AT9o7a1U2R58VrfnO1q',
  ),
};

// LEGACY (retired from sale, kept ONLY so the webhook keeps recognizing
// in-flight sessions; nothing on the site links to these anymore):
//   corner -> top2     $20  price_1TmhuvHseZnO3rRZ6jXBe6II
//   corner -> complete $70  price_1TmhuwHseZnO3rRZbrSRoKfh
//   top2   -> complete $50  price_1TmhuxHseZnO3rRZ3T43Sz77

export const UPGRADE_OFFERS = {
  corner_to_complete: UPGRADE_CORNER_TO_COMPLETE,
  call_97: CALL_97_OFFER,
};

// The kit upgrade(s) a buyer at `ownedTier` can take. corner AND legacy top2
// buyers both complete the Triangle for the $30 difference (generous to the few
// legacy top2 owners; complete owners have nothing left to unlock).
export function upgradesForTier(ownedTier) {
  if (ownedTier === 'corner' || ownedTier === 'top2') {
    return [UPGRADE_CORNER_TO_COMPLETE];
  }
  return [];
}

// The single upgrade offer that unlocks exactly `targetTier` for a buyer who
// currently owns `ownedTier`. Returns null when no such upgrade exists.
export function upgradeFor(ownedTier, targetTier) {
  return (
    upgradesForTier(ownedTier).find((u) => u.targetTier === targetTier) || null
  );
}

export default UPGRADE_OFFERS;
