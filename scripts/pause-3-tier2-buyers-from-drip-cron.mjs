// scripts/pause-3-tier2-buyers-from-drip-cron.mjs
//
// Stops the old drip-cron from firing universal-drip emails at the 3
// known tier-2 buyers (Phyllis / Shenette / Dora). Tomorrow's 12 UTC
// drip-cron would advance:
//   Shenette  Day 5 → Day 6  ("Why your numbers haven't moved" — pitches $97 Challenge SHE ALREADY OWNS)
//   Phyllis   Day 4 → Day 5  (generic OK)
//   Dora      Day 10 → Day 11 (generic OK)
//
// Pausing all 3 protects Shenette specifically and lets us defer the
// universal-drip footer rewrite (Fix B) without risk.
//
// They already have:
//   - state = 'tier-2'
//   - VIP classroom access via Skool (delivered today)
//   - Monday Zoom link
//   - The bridge + VIP deliverables emails
//   - Will get buyer-upsell-cron Day 10/14/17 from purchasedAt (Shenette
//     hits Day 10 tomorrow — that one's CORRECT, pitches $297 diagnostic)
//
// Setting paused:true makes drip-cron skip them. Buyer-upsell-cron also
// respects paused, BUT — let me re-read that... yes line 90:
//   if (sub.unsubscribed || sub.paused || sub.complete) skip
// Hmm. So buyer-upsell will ALSO skip them.
//
// 2026-05-19 — Joel approved Fix A. Track via stateStampedManually flag
// already on these records from earlier today.

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

const EMAILS = [
  'phyllisrene26@gmail.com',
  'blksuccessfem@aol.com',
  'dorajones56@icloud.com',
];

console.log('Pausing 3 tier-2 buyers from old drip-cron / buyer-upsell-cron paths.\n');
console.log('They keep VIP classroom + Monday Zoom + Skool community.');
console.log('When Phase 7 cutover happens, new tier-2-cron will read state==="tier-2" (paused-agnostic).\n');

for (const email of EMAILS) {
  const key = `drip:${email}`;
  const existing = await kv.get(key);
  if (!existing) {
    console.log(`  ✗ ${email}: no record (unexpected)`);
    continue;
  }
  await kv.set(key, {
    ...existing,
    paused: true,
    pausedAt: new Date().toISOString(),
    pausedReason: 'tier-2-buyer-on-universal-drip-prevented-wrong-product-pitches',
  });
  console.log(`  ✓ ${email}: paused (state=${existing.state}, lastSentDay=${existing.lastSentDay})`);
}

console.log('\nDone. Tomorrow morning\'s 12 UTC drip-cron will skip all 3.');
