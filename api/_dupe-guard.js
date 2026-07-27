// api/_dupe-guard.js — short-window duplicate-purchase guard.
//
// WHY THIS EXISTS (2026-07-27 dispute investigation)
// --------------------------------------------------
// A Stripe dispute audit found that 3 of 7 lifetime disputes (43%) traced to
// customers being charged more than once for the same product, not to fraud:
//
//   hscott1840@aol.com      $17 x3 within 7 minutes  -> 2 disputes, both "fraudulent"
//   helenwillismassage@...  $17 x2 within 2 minutes  -> 1 dispute, reason literally "duplicate"
//   henderson1478@yahoo.com $17 x2 within 2 minutes  -> refunded 2026-07-27
//
// A chargeback costs the $17 AND a ~$15 fee AND counts against the account's
// dispute ratio. Preventing the second charge is worth far more than winning
// the dispute afterward.
//
// ROOT CAUSE: api/create-embedded-checkout.js mints a fresh Checkout Session on
// every call, and the client re-calls it on mount and on several state changes.
// Stripe idempotency keys do NOT help here: each click is a genuinely distinct
// Session, and the buyer really does enter their card twice. The one-click
// upsell rails (kit-oto-charge.js, charge-saved-card.js, tea-one-click.js) are
// already protected by a deterministic KV + Stripe idempotency key; the main
// embedded checkout was the only unguarded path.
//
// WHAT THIS IS NOT
// ----------------
// This does not dedupe across DIFFERENT products or different purchase rails.
// A buyer who purchases tea at checkout and then deliberately clicks the
// "double your order for a friend" one-click upsell on /tea-thanks is making
// two intentional purchases of the same SKU seconds apart. That is a real sale,
// it flows through api/tea-one-click.js, and it must not be blocked. The guard
// is keyed on (email, tier) and is only consulted by the embedded-checkout
// endpoint, so that flow is untouched.
//
// PHYSICAL TEA TIERS ARE EXEMPT ENTIRELY. Do not remove the exemption.
// An upsell-safety audit on 2026-07-27 found that the "it only affects the
// one-click" reasoning above was NOT sufficient: bpquiz.com/tea's own buy
// buttons point at /pay?tier=tea-48 (public/tea/index.html:436,450,822, with
// data-pay empty, so no payment-link fallback exists there). The embedded
// checkout is therefore the ONLY manual route to a second pouch, and the
// /tea-thanks one-click cannot serve a buyer who wants pouch #2 shipped to a
// different address, because it reuses the first order's shipping. Guarding
// tea would have silently killed real $48 sales on ~44% of 30d revenue.
// The exemption list lives in api/create-embedded-checkout.js
// (DUPE_GUARD_EXEMPT_TIERS). markPurchase still writes tea keys; they are
// simply never consulted, which keeps this module free of product knowledge.
//
// FAIL-OPEN. Every function here swallows its own errors and returns the
// permissive answer. A KV outage must never block a paying customer. The cost
// of a false block (a lost sale, silently) is strictly worse than the cost of a
// missed catch (one duplicate charge, refundable).

import { kv } from '@vercel/kv';

// Observed genuine duplicates were 1 to 14 minutes apart. 30 minutes covers
// the pattern with margin while staying far below any plausible interval for a
// deliberate repeat purchase of the same digital item.
const WINDOW_SECONDS = 30 * 60;

function keyFor(email, tier) {
  const e = String(email || '').trim().toLowerCase();
  const t = String(tier || '').trim().toLowerCase();
  if (!e || !e.includes('@') || !t) return null;
  // Colons are legal in the local-part of an address; encode so a crafted
  // address cannot forge a different tier's key.
  return `dupe:purchase:${encodeURIComponent(e)}:${encodeURIComponent(t)}`;
}

/**
 * Record a completed purchase so a second attempt inside the window is caught.
 * Call from the webhook on checkout.session.completed, never from the client.
 * @returns {Promise<boolean>} true if the marker was written.
 */
export async function markPurchase(email, tier, ref) {
  const key = keyFor(email, tier);
  if (!key) return false;
  try {
    await kv.set(
      key,
      { ref: String(ref || '').slice(0, 200), at: new Date().toISOString() },
      { ex: WINDOW_SECONDS },
    );
    return true;
  } catch (err) {
    console.warn('dupe-guard: markPurchase failed (non-fatal)', err.message);
    return false;
  }
}

/**
 * Has this email already completed a paid purchase of this tier inside the
 * window? Fail-open: returns null on any error or miss.
 * @returns {Promise<{ref: string, at: string} | null>}
 */
export async function recentPurchase(email, tier) {
  const key = keyFor(email, tier);
  if (!key) return null;
  try {
    const hit = await kv.get(key);
    return hit && typeof hit === 'object' ? hit : null;
  } catch (err) {
    console.warn('dupe-guard: recentPurchase check failed (allowing)', err.message);
    return null;
  }
}

export const DUPE_WINDOW_SECONDS = WINDOW_SECONDS;
