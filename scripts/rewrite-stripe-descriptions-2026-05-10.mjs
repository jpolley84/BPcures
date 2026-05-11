#!/usr/bin/env node
/**
 * rewrite-stripe-descriptions-2026-05-10.mjs
 *
 * Rewrites Stripe Checkout product descriptions to match the BP Triangle
 * Method™ brand voice (Harry Dry concretes + Kennedy reason-why + 4th grade
 * + no negatives). Replaces "protocol → map", "assessment → Triangle",
 * "challenge → map", removes negative-framing words, adds specific
 * numbered proof (Tufts 7.2 mmHg, day 4, 1,247 women).
 *
 * Stripe Checkout renders this field in the right-hand "Order summary"
 * column at the final checkout frame. Plain text. No HTML. No Markdown.
 *
 * Usage:
 *   node scripts/rewrite-stripe-descriptions-2026-05-10.mjs           # dry-run (list)
 *   node scripts/rewrite-stripe-descriptions-2026-05-10.mjs --apply   # write
 *
 * IMPORTANT: pinned to Stripe-Version 2024-04-10 because newer 2026-02-25
 * clover-era versions changed product update semantics. Tested working on
 * 2024-04-10 during the 2026-05-09 description rewrite pass.
 */

import 'dotenv/config';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('NO STRIPE_SECRET_KEY in env. Aborting.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const STRIPE_API = 'https://api.stripe.com/v1';
const HEADERS = {
  Authorization: `Bearer ${STRIPE_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
  'Stripe-Version': '2024-04-10',
};

// New descriptions keyed by product name (case-insensitive substring match).
// Order = priority of match. First match wins.
//
// Length cap: Stripe Checkout truncates around 350 chars in the order summary.
// Keep each description tight and front-load the dream + proof.
const NEW_DESCRIPTIONS = [
  {
    matchName: 'Blood Pressure Cures',
    description:
      "Your 10-day starter map for high blood pressure — the same one Joel hands his own family. Inside: a day-by-day plan, the 7 herbs Joel trusts most with safe doses, the 4 lifestyle moves that shift numbers fastest, and the 9-line script for your next doctor visit. Tufts measured 7.2 mmHg from one of the herbs in 6 weeks. Most women feel the first soft win by day 4. 1,247 women already on the path.",
  },
  {
    matchName: 'BP Reset Kit',
    description:
      "The full 30-day BP map at your pace — Joel's complete system in one bundle. Inside: the 30-day daily plan, the BP Reset Challenge, the Graduation phase (weeks 2–4), Joel's complete herb library with doses, a printable BP tracker, a pill-interaction quick-reference, and every future update. The same map Joel hands his own family. Most women see numbers move by week two.",
  },
  {
    matchName: 'BP Triangle Challenge',
    description:
      "Joel on the call with you. 30 days. The full Triangle. Everything in the BP Reset Kit, plus Joel live every Monday at 10 PM ET for 4 weeks. Daily emails walking you through each chapter. The Skool community. Includes the full Cortisol and Sugar maps — all three corners of your Triangle covered. 50 seats per cohort. Next cohort opens at $147.",
  },
  {
    matchName: 'Cortisol Healing Blueprint',
    description:
      "Your starter map for wired-tired stress. Inside: Joel's 4 daily moves that flatten the cortisol curve, the 5 adrenal herbs he trusts most with safe doses, a morning routine that does not need a 6 AM workout, and an evening wind-down built for ICU nurses on night shift. Most women fall asleep faster by night two.",
  },
  {
    matchName: 'Cortisol Reset Kit',
    description:
      "The full cortisol map at your pace. Inside: the complete 30-day cortisol plan, the 4 daily moves that flatten your curve, Joel's full adrenal herb library with doses, a sleep-and-stress tracker, and the morning + evening routines he built for ICU nurses. Plain words. Real doses. The same map Joel hands his own family.",
  },
  {
    matchName: 'Blood Sugar Reset',
    description:
      "Your starter map for sugar crashes and cravings. Inside: the bite-by-bite meal order that cuts spikes 20 to 30 percent, the 5 herbs Joel trusts for insulin support, the 10-minute post-meal walk protocol, and Joel's water rule for your body weight. Most women feel the first crash-free afternoon by day 3.",
  },
  {
    matchName: 'Blood Sugar Kit',
    description:
      "The full blood sugar map at your pace. Inside: the 30-day daily plan, the meal-order protocol that cuts spikes 20 to 30 percent, Joel's full insulin-support herb library with doses, the 10-minute post-meal walk routine, and a printable glucose tracker. The same map Joel hands his own family.",
  },
  // Order bump (Pressure Triangle Stack)
  {
    matchName: 'Pressure Triangle Stack',
    description:
      "All three starter maps in one bundle. The BP Starter Map, the Cortisol Map, and the Sugar Map — every corner of your Triangle covered. 4 short books. Plain words. Real doses. The same maps Joel hands his own family.",
  },
];

// ---------------------------------------------------------------------------

function urlEncode(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function listAllProducts() {
  const products = [];
  let startingAfter = null;
  for (let i = 0; i < 10; i++) {
    const qs = new URLSearchParams({ active: 'true', limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await fetch(`${STRIPE_API}/products?${qs}`, { headers: HEADERS });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Stripe list failed ${res.status}: ${body}`);
    }
    const j = await res.json();
    products.push(...j.data);
    if (!j.has_more) break;
    startingAfter = j.data[j.data.length - 1]?.id;
  }
  return products;
}

async function updateProductDescription(productId, description) {
  const res = await fetch(`${STRIPE_API}/products/${productId}`, {
    method: 'POST',
    headers: HEADERS,
    body: urlEncode({ description }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Update ${productId} failed ${res.status}: ${body}`);
  }
  return res.json();
}

(async () => {
  console.log(`\n=== Stripe description rewrite — ${APPLY ? 'APPLY mode' : 'DRY RUN'} ===\n`);
  const products = await listAllProducts();
  console.log(`Fetched ${products.length} active products.\n`);

  const matches = [];
  for (const spec of NEW_DESCRIPTIONS) {
    const hit = products.find(p =>
      p.name && p.name.toLowerCase().includes(spec.matchName.toLowerCase())
    );
    if (!hit) {
      console.warn(`⚠️  No product matched name "${spec.matchName}"`);
      continue;
    }
    matches.push({ product: hit, newDesc: spec.description });
  }

  console.log(`\n${matches.length} products will be updated:\n`);
  for (const m of matches) {
    console.log(`  • ${m.product.name} (${m.product.id})`);
    console.log(`    OLD: ${(m.product.description || '').slice(0, 140)}${(m.product.description || '').length > 140 ? '…' : ''}`);
    console.log(`    NEW: ${m.newDesc.slice(0, 140)}${m.newDesc.length > 140 ? '…' : ''}`);
    console.log('');
  }

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write.\n');
    return;
  }

  console.log('\nApplying updates...\n');
  let success = 0;
  let failed = 0;
  for (const m of matches) {
    try {
      await updateProductDescription(m.product.id, m.newDesc);
      console.log(`  ✅ ${m.product.name}`);
      success++;
    } catch (e) {
      console.error(`  ❌ ${m.product.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${success} updated, ${failed} failed ===\n`);
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
