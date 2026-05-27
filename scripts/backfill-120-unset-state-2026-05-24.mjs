// scripts/backfill-120-unset-state-2026-05-24.mjs
//
// 120 drip:* records have no `state` field — they're pre-migration zombies
// that the May 18 migration missed (likely because they were added between
// the migration write and a subsequent enrollment). These records are
// invisible to ALL crons (every cron filters on state === expected).
//
// Fix: derive state for each using the same logic as
// migrate-add-state-field-2026-05-17.mjs deriveState() — but only touch
// records where state is currently unset. Never re-derive an existing state.
//
// Modes:
//   --dry-run   Count + show distribution (DEFAULT)
//   --apply     Write state field to the 120 records

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

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

const DAY_MS = 86_400_000;

// Same deriveState() logic as migrate-add-state-field-2026-05-17.mjs.
// Returns the modern state vocabulary (lead/tier-1/tier-2/tier-3/tier-4/newsletter)
// — NOT the old 'kit-buyer' / 'diagnostic' / 'sprint' names.
function deriveState(sub, now = Date.now()) {
  const tags = Array.isArray(sub.tags) ? sub.tags : [];

  // 1. TIER-4 (Sprint / 1:1 / Cohort 2)
  const isTier4 =
    sub.cohort === 'sprint' ||
    sub.cohort === 'coaching' ||
    tags.includes('tier-3-buyer') ||
    tags.includes('sprint-buyer') ||
    tags.includes('coaching-buyer') ||
    sub.sprintEnrolled === true ||
    (Number(sub.lastPurchaseAmount) >= 199700);
  if (isTier4) {
    return { state: 'tier-4', enteredAt: sub.sprintEnrolledAt || sub.purchasedAt || sub.enrolledAt };
  }

  // 2. TIER-3 (Diagnostic $297)
  const isTier3 =
    sub.cohort === 'diagnostic-prospect' ||
    sub.inDiagnosticSequence === true ||
    tags.includes('diagnostic-buyer');
  if (isTier3) {
    return { state: 'tier-3', enteredAt: sub.diagnosticEnrolledAt || sub.purchasedAt || sub.enrolledAt };
  }

  // 3. TIER-2 ($97 Challenge)
  const isTier2 =
    tags.includes('tier-2-buyer') ||
    tags.includes('bp-triangle-challenge') ||
    Number(sub.lastPurchaseAmount) === 9700;
  if (isTier2) {
    return { state: 'tier-2', enteredAt: sub.purchasedAt || sub.enrolledAt };
  }

  // 4. TIER-1 ($17/$47)
  const isTier1 =
    sub.isPaidCustomer === true ||
    tags.includes('tier-1-buyer') ||
    tags.includes('bpquiz-purchaser');
  if (isTier1) {
    return { state: 'tier-1', enteredAt: sub.purchasedAt || sub.enrolledAt };
  }

  // 5. LEAD — recent quiz/lead-magnet captures only
  const LEAD_COHORTS = new Set(['quiz', 'paid-direct', 'lead-magnet', 'exit-popup']);
  const enrolledAt = sub.enrolledAt ? new Date(sub.enrolledAt).getTime() : null;
  const daysSinceEnrolled = enrolledAt ? (now - enrolledAt) / DAY_MS : Infinity;
  const lastSentDay = Number(sub.lastSentDay) || 0;
  const cohort = sub.cohort;
  const cameFromWelcomeFunnel = LEAD_COHORTS.has(cohort) || (!cohort && enrolledAt);
  const isLead = cameFromWelcomeFunnel && daysSinceEnrolled <= 14 && lastSentDay <= 7 && !sub.unsubscribed;
  if (isLead) {
    return { state: 'lead', enteredAt: sub.enrolledAt };
  }

  // 6. NEWSLETTER (everyone else)
  return { state: 'newsletter', enteredAt: new Date(now).toISOString() };
}

const allKeys = await kv.keys('drip:*');
const nowMs = Date.now();
const nowIso = new Date().toISOString();

let scanned = 0;
let fixed = 0;
let skippedHasState = 0;
const dist = {};

console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN'}`);
console.log(`Scanning ${allKeys.length} drip:* keys...\n`);

for (const key of allKeys) {
  scanned++;
  const sub = await kv.get(key);
  if (!sub || typeof sub !== 'object') continue;
  if (sub.state) { skippedHasState++; continue; }

  const { state, enteredAt } = deriveState(sub, nowMs);
  dist[state] = (dist[state] || 0) + 1;

  if (APPLY) {
    await kv.set(key, {
      ...sub,
      state,
      stateEnteredAt: enteredAt || nowIso,
      stateBackfilledAt: nowIso,
      stateBackfilledBy: 'backfill-120-unset-2026-05-24',
    });
  }
  fixed++;
}

console.log('═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`Scanned:                ${scanned}`);
console.log(`Already had state:      ${skippedHasState}`);
console.log(`${APPLY ? 'Fixed' : 'Would fix'}: ${fixed}`);
console.log('\nDistribution of fixed records:');
for (const [s, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s.padEnd(15)} ${n}`);
}
if (!APPLY) console.log('\nDRY-RUN only. Re-run with --apply to write.');
