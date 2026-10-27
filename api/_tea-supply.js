// api/_tea-supply.js — how many days of tea an order actually bought.
//
// 2026-10-27 (Joel): "this needs to be a chron or a scan that fires for people
// that pass the time they have the tea amount and asks for a review and offers
// them a discount for their next purchase. so if they bought a 1 month supply
// grater than a month ago... and if they bought 3 month supply graeter than 3
// months ago."
//
// The ledger's item names are not a clean SKU field. They were written by five
// different code paths over five months, in both 100 g and 150 g eras, and
// include a Shopify set, a comped All-In set and two backfills. Classifying by
// a regex over the display name is the only thing that covers all of them.
// Every pattern below is taken from a name that is really in tea:order:*.
//
// UNRECOGNISED NAMES RETURN 0, which means that order is never asked for a
// review. That is the safe direction: a missed ask costs nothing, and asking
// somebody "how is the tea going?" three weeks into a 90-day supply reads like
// we do not know what we sold them.

// ORDER MATTERS. Each name is tested in sequence and the first hit wins, so the
// narrow patterns have to come before the broad ones. The upgrade line's own
// text says "90-Day Supply" and the 3-pouch line says "pouch", so swapping any
// two of the first three rules silently mis-prices a real order. Caught in a
// dry run: the upgrade line scored 90 instead of 60.
const RULES = [
  // The one-click upsell that adds two pouches to a one-month order. The base
  // pouch is a separate line item, so this line is worth 60 days on its own.
  [/upgrade to 90[\s-]?day|additional pouch/i, 60],
  // 3-pouch sets, in all the ways they have been written. Before the
  // single-pouch rule, since "90-Day Ritual (3 pouches)" also says "pouch".
  [/90[\s-]?day|3[\s-]?pouch|\(3 pouches\)|three pouch|steady ritual/i, 90],
  [/sampler|1[\s-]?week/i, 7],
  [/1[\s-]?month|one pouch|single pouch|steady-pouch|satin|hormone tea/i, 30],
];

/** Days of supply one line item represents, times its quantity. 0 = unknown. */
export function itemSupplyDays(item) {
  const name = String(item?.name || '');
  const qty = Math.max(1, parseInt(item?.qty, 10) || 1);
  for (const [re, days] of RULES) {
    if (re.test(name)) return days * qty;
  }
  return 0;
}

/** Days of supply a whole order represents. 0 = we cannot tell, so skip it. */
export function orderSupplyDays(order) {
  const items = order?.items || [];
  let total = 0;
  for (const it of items) total += itemSupplyDays(it);
  return total;
}

/** The day their tea runs out, as an ISO string, or null when unknowable. */
export function runsOutAt(order) {
  const days = orderSupplyDays(order);
  const startIso = order?.fulfilledAt || order?.shippedEmailAt || order?.at;
  if (!days || !startIso) return null;
  const t = new Date(startIso).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + days * 86400000).toISOString();
}
