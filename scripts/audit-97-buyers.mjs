// scripts/audit-97-buyers.mjs
//
// Identify every $97 BP Triangle Challenge buyer in drip:* and report
// what they're currently getting vs what they were promised.
//
// Promise (from products.json + Stripe description):
//   - 30 days of daily chapter walkthrough emails
//   - Weekly LIVE group coaching on Skool (Monday 9 PM ET)
//   - Full bonus stack (BP + Cortisol + Blood Sugar kits)
//   - Skool VIP community access
//
// Detection rules — a record is a $97 buyer if ANY of:
//   - tags includes 'tier-3-buyer' or 'tier-3' (legacy)
//   - cohort === 'challenge'
//   - lastPurchaseAmount === 9700
//   - tags includes 'challenge-buyer' or 'bp-triangle-challenge'
//
// Output: minimal report (email, state, cohort, purchasedAt, lastSentDay,
// has-monday-zoom-tag). No PII dump beyond email.

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1'));
  const repoRoot = path.resolve(here, '..');
  for (const file of ['.env.local', '.env']) {
    const p = path.join(repoRoot, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

const { kv } = await import('@vercel/kv');

const allKeys = await kv.keys('drip:*');
console.log(`Scanning ${allKeys.length} drip:* records for $97 Challenge buyers...\n`);

const buyers = [];
for (const key of allKeys) {
  const sub = await kv.get(key);
  if (!sub) continue;
  const tags = Array.isArray(sub.tags) ? sub.tags : [];

  const isTier3Buyer =
    tags.includes('tier-3-buyer') ||
    tags.includes('challenge-buyer') ||
    tags.includes('bp-triangle-challenge') ||
    sub.cohort === 'challenge' ||
    Number(sub.lastPurchaseAmount) === 9700;

  // Exclude tier-3 (quiz routing) — that's not a buyer marker
  // tier-3 alone WITHOUT bpquiz-purchaser means "quiz said go to challenge"
  const hasQuizTier3Only =
    tags.includes('tier-3') &&
    !tags.includes('tier-3-buyer') &&
    !tags.includes('bpquiz-purchaser') &&
    !sub.isPaidCustomer;

  if (isTier3Buyer && !hasQuizTier3Only) {
    buyers.push({
      email: sub.email || key.replace('drip:', ''),
      state: sub.state || '(unset)',
      cohort: sub.cohort || '(none)',
      tags: tags.filter((t) => /tier|buyer|purchaser|challenge|skool|zoom|monday/i.test(t)),
      purchasedAt: sub.purchasedAt || '(unset)',
      lastSentDay: sub.lastSentDay || 0,
      optedIn: sub.optedIn,
      paused: sub.paused || false,
      complete: sub.complete || false,
      hasMondayZoomTag: tags.some((t) => /monday-zoom|monday-live|zoom-vip|skool-vip/i.test(t)),
    });
  }
}

console.log(`Found ${buyers.length} confirmed $97 Challenge buyers:\n`);
console.log('email'.padEnd(40), 'state'.padEnd(13), 'day', 'purchasedAt'.padEnd(22), 'paused', 'has-Mon-Zoom', 'cohort');
console.log('-'.repeat(120));
for (const b of buyers) {
  console.log(
    b.email.padEnd(40),
    b.state.padEnd(13),
    String(b.lastSentDay).padStart(3),
    String(b.purchasedAt).slice(0, 22).padEnd(22),
    String(b.paused).padEnd(6),
    String(b.hasMondayZoomTag).padEnd(13),
    b.cohort
  );
}

console.log('');
console.log('=== Phase 1 state assignment summary ===');
const byState = {};
for (const b of buyers) byState[b.state] = (byState[b.state] || 0) + 1;
for (const [s, n] of Object.entries(byState)) console.log(`  ${s.padEnd(15)} ${n}`);

console.log('');
console.log('=== Gaps detected ===');
const noPurchaseDate = buyers.filter((b) => b.purchasedAt === '(unset)').length;
const notInKitBuyerState = buyers.filter((b) => b.state !== 'kit-buyer').length;
const noMondayZoom = buyers.filter((b) => !b.hasMondayZoomTag).length;
const completed = buyers.filter((b) => b.complete).length;
console.log(`  No purchasedAt timestamp:  ${noPurchaseDate}`);
console.log(`  Not in kit-buyer state:    ${notInKitBuyerState}`);
console.log(`  No Monday-Zoom tag:        ${noMondayZoom}`);
console.log(`  Marked complete (Day 30+): ${completed}`);
