// scripts/stamp-known-tier2-buyers.mjs
//
// Phase 1.5 cleanup — manually stamps the 3 known $97 BP Triangle
// Challenge buyers identified by the other agent's audit (2026-05-18).
// All three came in via imports (beehiiv / mailchimp-30day-import) so
// they bypassed the Stripe webhook path and never got isPaidCustomer
// or tier-2-buyer flags. The state-machine migration silently placed
// them in `newsletter` — which means tier-2-cron would never pick
// them up.
//
// This script:
//   - Looks up each known $97 buyer's drip:* record
//   - Updates state -> 'tier-2', stateEnteredAt -> their purchase date
//   - Adds tags: tier-2-buyer, bpquiz-purchaser
//   - Sets isPaidCustomer:true, paidTier:'vip', purchasedAt
//   - Preserves all other fields (enrolledAt, source cohort, etc.)
//
// Modes:
//   --dry-run     Print what would change (default)
//   --apply       Actually write the updates
//   --force       With --apply, re-stamp even if already state=tier-2

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');

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

// Source: brief from the other BraveWorks agent, 2026-05-18 KV pull.
const KNOWN_BUYERS = [
  {
    email: 'blksuccessfem@aol.com',
    name: 'Shenette Thompson',
    purchasedAt: '2026-05-09T00:00:00.000Z',
    source: 'beehiiv-import',
  },
  {
    email: 'phyllisrene26@gmail.com',
    name: 'Phyllis Emery',
    purchasedAt: '2026-05-01T00:00:00.000Z',
    source: 'beehiiv-import',
    note: 'Was stalled at Day 3 since 2026-05-15 — see Phyllis investigation task',
  },
  {
    email: 'dorajones56@icloud.com',
    name: 'Dora Reeves',
    purchasedAt: '2026-04-30T00:00:00.000Z',
    source: 'mailchimp-30day-import',
  },
];

console.log(`Mode: ${APPLY ? (FORCE ? 'APPLY (forced)' : 'APPLY (skip if already tier-2)') : 'DRY RUN'}`);
console.log(`Stamping ${KNOWN_BUYERS.length} known $97 Challenge buyers as state='tier-2'\n`);

let stamped = 0;
let skipped = 0;
let notFound = 0;

for (const buyer of KNOWN_BUYERS) {
  const key = `drip:${buyer.email}`;
  const existing = await kv.get(key);

  if (!existing) {
    console.log(`✗ NO RECORD found for ${buyer.email} (${buyer.name})`);
    notFound++;
    continue;
  }

  const alreadyTier2 = existing.state === 'tier-2';
  console.log(`→ ${buyer.email} (${buyer.name})`);
  console.log(`    Current state:      ${existing.state || '(unset)'}`);
  console.log(`    Current cohort:     ${existing.cohort || '(unset)'}`);
  console.log(`    Current isPaid:     ${existing.isPaidCustomer || false}`);
  console.log(`    purchasedAt now:    ${existing.purchasedAt || '(unset)'}`);
  console.log(`    Will set state:     tier-2`);
  console.log(`    Will set entered:   ${buyer.purchasedAt}`);

  if (alreadyTier2 && !FORCE) {
    console.log(`    → already state=tier-2, skipping (use --force to re-stamp)`);
    skipped++;
    console.log('');
    continue;
  }

  if (APPLY) {
    const tags = Array.from(new Set([
      ...(existing.tags || []),
      'bpquiz-purchaser',
      'tier-2-buyer',
      'bp-triangle-challenge',
      'manually-stamped-2026-05-18',
    ]));
    const updated = {
      ...existing,
      state: 'tier-2',
      stateEnteredAt: buyer.purchasedAt,
      stateStampedManually: '2026-05-18',
      isPaidCustomer: true,
      paidTier: 'vip',
      purchasedAt: existing.purchasedAt || buyer.purchasedAt,
      tags,
      // Reset paused if it was set by an import flow — tier-2-cron
      // hard-skips paused records.
      paused: false,
    };
    await kv.set(key, updated);
    console.log(`    ✓ STAMPED state='tier-2'`);
    stamped++;
  } else {
    console.log(`    (dry-run — re-run with --apply to write)`);
    stamped++;  // count what would be stamped
  }
  console.log('');
}

console.log('=== SUMMARY ===');
console.log(`Stamped:    ${stamped}`);
console.log(`Skipped:    ${skipped}`);
console.log(`Not found:  ${notFound}`);
console.log('');
if (!APPLY) {
  console.log('Dry run only. Re-run with --apply to write changes.');
}
