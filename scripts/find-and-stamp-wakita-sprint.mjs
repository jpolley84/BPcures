// scripts/find-and-stamp-wakita-sprint.mjs
//
// Phase-1 cleanup. The state-field migration ran clean for 4,263 records
// but found 0 sprint-state subscribers — because Wakita Taylor (Joel's
// first $6,997 1:1 client, closed 2026-05-15) was hand-invoiced via
// Stripe outside the bpquiz.com Payment Link flow, so the webhook never
// stamped her with buyer tags.
//
// This script:
//   1. Scans drip:* for any record matching wakita-ish email patterns
//   2. Prints minimal info (state, cohort, has-purchasedAt) — no PII dump
//   3. With --stamp, sets state='sprint' on whichever record matches
//
// If no record exists, prints a clear "NO RECORD — create one" message
// and exits.

import fs from 'node:fs';
import path from 'node:path';

const STAMP = process.argv.includes('--stamp');

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
const matches = allKeys.filter((k) => /wakita|takita/i.test(k));

console.log(`Scanned ${allKeys.length} drip:* keys`);
console.log(`Found ${matches.length} candidate(s) matching wakita-ish pattern:`);

if (matches.length === 0) {
  console.log('');
  console.log('NO RECORD FOUND for Wakita.');
  console.log('Next step: manually create the drip:* record for her with state=sprint.');
  console.log('Use stripe-webhook.js handler as the template — set:');
  console.log('  cohort: "coaching"');
  console.log('  isPaidCustomer: true');
  console.log('  state: "sprint"');
  console.log('  stateEnteredAt: 2026-05-15 (purchase date)');
  console.log('  tags: ["tier-3-buyer", "coaching-buyer", "sprint-buyer"]');
  console.log('  purchasedAt: 2026-05-15T...');
  console.log('  paused: true   (so universal drip-cron skips her)');
  process.exit(0);
}

for (const key of matches) {
  const sub = await kv.get(key);
  if (!sub) {
    console.log(`  ${key}: (empty)`);
    continue;
  }
  console.log(`  ${key}`);
  console.log(`    state:            ${sub.state || '(unset)'}`);
  console.log(`    stateEnteredAt:   ${sub.stateEnteredAt || '(unset)'}`);
  console.log(`    cohort:           ${sub.cohort || '(unset)'}`);
  console.log(`    isPaidCustomer:   ${sub.isPaidCustomer || false}`);
  console.log(`    purchasedAt:      ${sub.purchasedAt || '(unset)'}`);
  console.log(`    tags:             ${JSON.stringify(sub.tags || [])}`);
  console.log(`    enrolledAt:       ${sub.enrolledAt || '(unset)'}`);
  console.log(`    optedIn:          ${sub.optedIn}`);
  console.log(`    paused:           ${sub.paused || false}`);

  if (STAMP) {
    if (sub.state === 'sprint') {
      console.log(`    → already state=sprint, skipping`);
      continue;
    }
    const updated = {
      ...sub,
      state: 'sprint',
      stateEnteredAt: sub.purchasedAt || sub.enrolledAt || new Date('2026-05-15').toISOString(),
      stateStampedManually: '2026-05-17',
      cohort: sub.cohort === 'coaching' || sub.cohort === 'sprint' ? sub.cohort : 'coaching',
      isPaidCustomer: true,
      paused: true, // keep her out of universal drip
      tags: Array.from(new Set([...(sub.tags || []), 'tier-3-buyer', 'coaching-buyer', 'sprint-buyer'])),
    };
    await kv.set(key, updated);
    console.log(`    → STAMPED state=sprint`);
  }
}

if (!STAMP) {
  console.log('');
  console.log('Re-run with --stamp to set state=sprint on the matching record(s).');
}
