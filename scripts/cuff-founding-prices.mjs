// scripts/cuff-founding-prices.mjs — create the two Life Beyond the Cuff
// founding prices on the existing course product (2026-10-28, Joel chose
// "$997 / 2x$599" over keeping $297).
//
//   node scripts/cuff-founding-prices.mjs            dry run: prints what it would create
//   node scripts/cuff-founding-prices.mjs --create   creates both prices (Stripe write, gated)
//
// Idempotent by lookup_key: a second --create finds the existing prices.
import fs from 'node:fs';
import Stripe from 'stripe';

for (const f of ['.env', '.env.local']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PRODUCT = 'prod_VVWKKYkCupbPnE';
const PRICES = [
  { lookup_key: 'cuff_founding_full_997', nickname: 'Cuff founding pay-in-full $997', unit_amount: 99700, currency: 'usd' },
  { lookup_key: 'cuff_founding_2pay_599', nickname: 'Cuff founding 2-pay $599/mo (capped at 2 by webhook)', unit_amount: 59900, currency: 'usd', recurring: { interval: 'month' } },
  // 2026-10-28 (Joel): after the Friday close the course sells at $1,997 or 2 x $1,099.
  { lookup_key: 'cuff_regular_full_1997', nickname: 'Cuff regular pay-in-full $1,997', unit_amount: 199700, currency: 'usd' },
  { lookup_key: 'cuff_regular_2pay_1099', nickname: 'Cuff regular 2-pay $1,099/mo (capped at 2 by webhook)', unit_amount: 109900, currency: 'usd', recurring: { interval: 'month' } },
];

const create = process.argv.includes('--create');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const product = await stripe.products.retrieve(PRODUCT);
console.log(`product ${product.id} "${product.name}" active=${product.active}`);
const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookup_key), limit: 10 });
for (const p of PRICES) {
  const found = existing.data.find((x) => x.lookup_key === p.lookup_key);
  if (found) { console.log(`exists  ${p.lookup_key} -> ${found.id}`); continue; }
  if (!create) { console.log(`DRY     would create ${p.lookup_key}: ${p.unit_amount / 100} ${p.currency}${p.recurring ? '/month' : ' one time'}`); continue; }
  const made = await stripe.prices.create({ product: PRODUCT, ...p, metadata: { funnel: 'life-beyond-the-cuff' } });
  console.log(`created ${p.lookup_key} -> ${made.id}`);
}
