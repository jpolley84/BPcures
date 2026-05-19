// scripts/stamp-wakita-tier4.mjs
//
// Wakita Taylor — Joel's first paid $6,997 1:1 client. Closed 2026-05-15
// via hand-issued Stripe invoice (no webhook fired). The state-machine
// migration couldn't find her because no drip:* record existed.
//
// Joel confirmed her email is wconssandra@gmail.com (2026-05-19).
//
// This script:
//   1. Creates the drip:wconssandra@gmail.com record if missing
//   2. Sets state='tier-4', stateEnteredAt=2026-05-15 (purchase date)
//   3. Tags: tier-3-buyer, tier-4-buyer (legacy + new convention),
//      coaching-buyer, bpquiz-purchaser, sprint-cohort-2, 1to1-client
//   4. isPaidCustomer:true, paidTier:'coaching', cohort:'coaching',
//      purchasedAt:2026-05-15
//   5. paused:true (so old drip-cron skips her; tier-4-cron picks up
//      after Phase 7 + the _state-cron.js paused-fix below)
//
// Idempotent — re-running does nothing once record exists with state=tier-4.

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

const WAKITA = {
  email: 'wconssandra@gmail.com',
  firstName: 'Wakita',
  lastName: 'Taylor',
  purchasedAt: '2026-05-15T00:00:00.000Z',
};

const key = `drip:${WAKITA.email}`;
const existing = await kv.get(key);

console.log(`Mode: ${APPLY ? (FORCE ? 'APPLY (forced)' : 'APPLY (skip if already tier-4)') : 'DRY RUN'}`);
console.log(`Target: ${key}\n`);

if (existing) {
  console.log('Existing record found:');
  console.log(`  state:            ${existing.state || '(unset)'}`);
  console.log(`  stateEnteredAt:   ${existing.stateEnteredAt || '(unset)'}`);
  console.log(`  cohort:           ${existing.cohort || '(unset)'}`);
  console.log(`  isPaidCustomer:   ${existing.isPaidCustomer || false}`);
  console.log(`  purchasedAt:      ${existing.purchasedAt || '(unset)'}`);
  console.log(`  tags:             ${JSON.stringify(existing.tags || [])}`);
} else {
  console.log('No existing record — will create fresh.');
}

if (existing && existing.state === 'tier-4' && !FORCE) {
  console.log('\nAlready state=tier-4. Use --force to re-stamp.');
  process.exit(0);
}

const tags = Array.from(new Set([
  ...((existing && existing.tags) || []),
  'bpquiz-purchaser',
  'tier-3-buyer',       // legacy convention ($97 was tier-3 historically)
  'tier-4-buyer',       // new state-machine convention ($1,997+ = tier-4)
  'coaching-buyer',
  'sprint-buyer',
  '1to1-client',
  'manually-stamped-2026-05-19',
]));

const newRecord = {
  ...(existing || {}),
  email: WAKITA.email,
  firstName: WAKITA.firstName,
  lastName: existing?.lastName || WAKITA.lastName,
  cohort: 'coaching',
  isPaidCustomer: true,
  paidTier: 'coaching',
  purchasedAt: existing?.purchasedAt || WAKITA.purchasedAt,
  enrolledAt: existing?.enrolledAt || WAKITA.purchasedAt,
  state: 'tier-4',
  stateEnteredAt: WAKITA.purchasedAt,
  stateStampedManually: '2026-05-19',
  optedIn: true,
  paused: true,         // skip drip-cron / buyer-upsell-cron / diagnostic-drip-cron
  tags,
  source: existing?.source || 'manual-hand-invoiced-2026-05-15',
};

console.log('\nNew record will be:');
console.log(`  state:            tier-4`);
console.log(`  stateEnteredAt:   ${WAKITA.purchasedAt}`);
console.log(`  cohort:           coaching`);
console.log(`  isPaidCustomer:   true`);
console.log(`  paidTier:         coaching`);
console.log(`  purchasedAt:      ${WAKITA.purchasedAt}`);
console.log(`  paused:           true (skip legacy crons)`);
console.log(`  tags:             ${JSON.stringify(tags)}`);

if (APPLY) {
  await kv.set(key, newRecord);
  console.log('\n✓ STAMPED — drip record created/updated for Wakita.');
} else {
  console.log('\n(dry-run — re-run with --apply to write)');
}
