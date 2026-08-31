// api/_pouch-size.js — one place that answers "how big is this pouch?"
//
// WHY (2026-08-31): three 150 g bags were packed against a 100 g order because
// NO 3-pouch product name states a size. They all read "The Steady Ritual
// (3 Pouches)" or "90-Day Ritual (3 pouches)". The size only ever lived in the
// price and the sales rail, which is invisible at a packing table. Single-pouch
// names DO carry it ("One Pouch (100g)"), which is why only 3-packs went wrong.
//
// Legacy Stripe rail sells 100 g. Shopify and TikTok sell 150 g. Both are
// deliberate (Joel, 2026-08-16) — never "fix" one to match the other.

export const LEGACY_GRAMS = 100;
export const SHOPIFY_GRAMS = 150;

// Grams per pouch for an order. An explicit size in the item name wins; then a
// size recorded on the row; otherwise the rail decides.
export function pouchGramsOf({ itemName = '', source = '', shippedGrams = null, pouchGrams = null } = {}) {
  if (shippedGrams) return Number(shippedGrams);      // what actually went in the box
  if (pouchGrams) return Number(pouchGrams);
  if (/150\s*g/i.test(itemName)) return SHOPIFY_GRAMS;
  if (/100\s*g/i.test(itemName)) return LEGACY_GRAMS;
  return String(source).startsWith('shopify') ? SHOPIFY_GRAMS : LEGACY_GRAMS;
}

// Make the size visible on the label line itself. Leaves a name that already
// states a size alone, so nothing gets "(100g) (100g each)".
export function withPouchSize(itemName, grams) {
  const name = String(itemName || '').trim();
  if (!name) return name;
  if (/\d+\s*g\b/i.test(name)) return name;           // already explicit
  const multi = /(\d+)\s*(?:additional\s+)?pouches\b/i.test(name);
  return `${name} [${grams}g${multi ? ' each' : ''}]`;
}
