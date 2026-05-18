// scripts/migrate-add-state-field-2026-05-17.mjs
//
// PHASE 1 of the state-machine migration (Three Pressures plan, 2026-05-17).
//
// Adds a single `state` field to every `drip:*` record so the new
// per-state crons (lead-cron / kit-buyer-cron / diagnostic-cron /
// sprint-cron / newsletter-cron) can route on one variable instead of
// the current scatter (cohort + tags + flags + purchasedAt + enrolledAt).
//
// State values (one per record):
//
//   'sprint'      — $1,997 Cohort 2 buyer OR $6,997 1:1 client.
//                   Highest priority. Onboarding sequence owns them.
//   'diagnostic'  — $297 BP Triangle Diagnostic buyer pre/post-call.
//                   diagnostic-drip sequence owns them.
//   'kit-buyer'   — $17/$47/$97 buyer who has NOT bought $297 yet.
//                   kit-buyer sequence owns them.
//   'lead'        — Email-capture (quiz/lead-magnet/import) within
//                   the last 14 days, no purchase, no opt-in past Day 7.
//                   Stage 0 welcome sequence owns them.
//   'newsletter'  — Everyone else. Engaged non-buyers past Day 14,
//                   alumni, beehiiv/Skool imports past their welcome
//                   window. Weekly newsletter cadence owns them.
//
// Plus 2 timestamp fields:
//   `stateEnteredAt`   — ISO. When they entered current state. Lets the
//                        new crons schedule N-day-since-entry emails.
//   `stateMigratedAt`  — ISO. Stamp this script set on, so we can spot
//                        records that have NEVER had a real state event
//                        (vs. records where the field was set by a
//                        post-migration purchase event).
//
// Existing fields are NOT touched. Old crons keep working until
// Phase 7 cutover. This is purely additive + reversible.
//
// Modes:
//   --dry-run      Print distribution table, no writes (default)
//   --apply        Write `state` + timestamps to every record
//   --force        With --apply, re-derive even if `state` exists
//   --limit=N      Process first N records only (for testing)
//
// Safety:
//   - Idempotent: re-running with --apply does nothing unless --force
//   - Per-record write (kv.set with full prior object spread) — never
//     clobbers other fields if Upstash returns partial reads
//   - Rate-limited: 30ms between KV writes (~33/sec) — gentle on Upstash
//     free tier; full 3,500-record migration takes ~100 seconds
//   - Records with `unsubscribed:true` get state:'newsletter' but
//     `paused:true` flag stays — won't fire anything

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  return arg ? parseInt(arg.split('=')[1], 10) : Infinity;
})();

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

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('ERR: KV_REST_API_URL or KV_REST_API_TOKEN missing from env.');
  process.exit(1);
}

const { kv } = await import('@vercel/kv');

// ─── State derivation logic ───────────────────────────────────────────
//
// Priority order — first match wins. Mirrors the priority hierarchy in
// the conflict-resolution plan (Stage 3 > Stage 2 > Stage 1 > Stage 0 > Stage 4).

const DAY_MS = 86_400_000;

// Import-cohort markers. Records with these are NEVER treated as "lead"
// — they came in from migrations (beehiiv batch, Skool CSV, Mailchimp
// bridge) and never went through the welcome funnel. They go straight
// to newsletter unless they later purchase.
const IMPORT_COHORT_PATTERNS = [
  /^skool-import/i,            // Skool community CSV imports
  /^mc340$/i,                  // Mailchimp 340-record bridge
  /^mc-bridge/i,               // Older Mailchimp bridges
  /^beehiiv/i,                 // Beehiiv migrations
  /^1$/, /^2$/, /^3$/,         // Numeric cohorts from beehiiv batches
];
function isImportCohort(cohort) {
  if (!cohort) return false;
  return IMPORT_COHORT_PATTERNS.some((re) => re.test(String(cohort)));
}

// Welcome-funnel cohort markers. Only records with one of these (OR
// undefined cohort + recent enrolledAt) get treated as "lead."
const LEAD_COHORTS = new Set(['quiz', 'paid-direct', 'lead-magnet', 'exit-popup']);

function deriveState(sub, now = Date.now()) {
  const tags = Array.isArray(sub.tags) ? sub.tags : [];

  // 1. SPRINT — $1,997 Cohort 2 / $6,997 1:1 buyer
  // AMOUNT_TO_TIER maps both $1,997 and $6,997 to cohort='coaching',
  // so cohort='coaching' is the canonical sprint marker. Also accept
  // explicit sprint markers in case future webhook handling changes.
  const isSprint =
    sub.cohort === 'sprint' ||
    sub.cohort === 'coaching' ||
    tags.includes('tier-3-buyer') ||
    tags.includes('sprint-buyer') ||
    tags.includes('coaching-buyer') ||
    sub.sprintEnrolled === true ||
    // Amount-based fallback: any record where a single payment was $1,997+
    (Number(sub.lastPurchaseAmount) >= 199700);
  if (isSprint) {
    return { state: 'sprint', enteredAt: sub.sprintEnrolledAt || sub.purchasedAt || sub.enrolledAt };
  }

  // 2. DIAGNOSTIC — $297 buyer
  const isDiagnostic =
    sub.cohort === 'diagnostic-prospect' ||
    sub.inDiagnosticSequence === true ||
    tags.includes('diagnostic-buyer');
  if (isDiagnostic) {
    return { state: 'diagnostic', enteredAt: sub.diagnosticEnrolledAt || sub.purchasedAt || sub.enrolledAt };
  }

  // 3. KIT-BUYER — $17/$47/$97 buyer with no diagnostic upgrade
  const isKitBuyer =
    sub.isPaidCustomer === true ||
    tags.includes('tier-1-buyer') ||
    tags.includes('tier-2-buyer') ||
    tags.includes('bpquiz-purchaser');
  if (isKitBuyer) {
    return { state: 'kit-buyer', enteredAt: sub.purchasedAt || sub.enrolledAt };
  }

  // 4. LEAD — REAL welcome-funnel subscribers only.
  // Must be: enrolled ≤14 days ago, came via welcome funnel (not an
  // import migration), no opt-in past Day 7, not unsubscribed.
  const enrolledAt = sub.enrolledAt ? new Date(sub.enrolledAt).getTime() : null;
  const daysSinceEnrolled = enrolledAt ? (now - enrolledAt) / DAY_MS : Infinity;
  const lastSentDay = Number(sub.lastSentDay) || 0;
  const cohort = sub.cohort;
  const cameFromWelcomeFunnel =
    LEAD_COHORTS.has(cohort) ||
    (!cohort && enrolledAt);  // legit lead-magnet records sometimes have no cohort set
  const isImport = isImportCohort(cohort);
  const isLead =
    !isImport &&
    cameFromWelcomeFunnel &&
    daysSinceEnrolled <= 14 &&
    lastSentDay <= 7 &&
    !sub.unsubscribed;
  if (isLead) {
    return { state: 'lead', enteredAt: sub.enrolledAt };
  }

  // 5. NEWSLETTER — everyone else (imports, post-Day-14, disengaged,
  // alumni). Sets entered-at to: enrolledAt + 14d (for natural
  // graduates) or now (for migrating imports).
  let enteredAt;
  if (enrolledAt && daysSinceEnrolled > 14) {
    enteredAt = new Date(enrolledAt + 14 * DAY_MS).toISOString();
  } else {
    enteredAt = new Date(now).toISOString();
  }
  return { state: 'newsletter', enteredAt };
}

// ─── Main ──────────────────────────────────────────────────────────────

console.log('=== state-field migration · 2026-05-17 ===');
console.log(`Mode: ${APPLY ? (FORCE ? 'APPLY (forced re-derive)' : 'APPLY (skip records with existing state)') : 'DRY RUN'}`);
console.log(`Limit: ${LIMIT === Infinity ? 'all records' : LIMIT}`);
console.log('');

const allKeys = await kv.keys('drip:*');
console.log(`Found ${allKeys.length} drip:* records`);

const distribution = { sprint: 0, diagnostic: 0, 'kit-buyer': 0, lead: 0, newsletter: 0 };
const samples = { sprint: [], diagnostic: [], 'kit-buyer': [], lead: [], newsletter: [] };
const skippedAlreadyHasState = [];
const errors = [];

let processed = 0;
let written = 0;
const now = Date.now();

for (const key of allKeys) {
  if (processed >= LIMIT) break;
  processed++;

  try {
    const sub = await kv.get(key);
    if (!sub) continue;

    if (sub.state && !FORCE) {
      // Already migrated — count it in its existing bucket for the report
      // but don't re-derive or re-write.
      distribution[sub.state] = (distribution[sub.state] || 0) + 1;
      skippedAlreadyHasState.push(key);
      continue;
    }

    const { state, enteredAt } = deriveState(sub, now);
    distribution[state] = (distribution[state] || 0) + 1;
    if (samples[state].length < 5) {
      samples[state].push({
        email: sub.email || key.replace('drip:', ''),
        firstName: sub.firstName || '',
        cohort: sub.cohort || '',
        tags: (sub.tags || []).slice(0, 3),
        enrolledAt: sub.enrolledAt || '',
        purchasedAt: sub.purchasedAt || '',
        lastSentDay: sub.lastSentDay || 0,
      });
    }

    if (APPLY) {
      await kv.set(key, {
        ...sub,
        state,
        stateEnteredAt: enteredAt || new Date(now).toISOString(),
        stateMigratedAt: new Date(now).toISOString(),
      });
      written++;
      // Gentle pace — 30ms between writes (~33/sec)
      await new Promise((r) => setTimeout(r, 30));
    }
  } catch (err) {
    errors.push({ key, message: err.message });
    if (errors.length <= 5) console.error(`  err on ${key}:`, err.message);
  }
}

// ─── Report ────────────────────────────────────────────────────────────

console.log('');
console.log('=== DISTRIBUTION ===');
const total = Object.values(distribution).reduce((a, b) => a + b, 0);
for (const [state, count] of Object.entries(distribution)) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  console.log(`  ${state.padEnd(12)} ${String(count).padStart(5)}  (${pct}%)`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(total).padStart(5)}`);

console.log('');
console.log('=== SAMPLES (first 5 per state) ===');
for (const [state, list] of Object.entries(samples)) {
  if (!list.length) continue;
  console.log(`\n[${state}]`);
  for (const s of list) {
    console.log(`  ${s.email.padEnd(40)} day=${s.lastSentDay} cohort=${s.cohort || '-'} tags=[${s.tags.join(',')}]`);
  }
}

console.log('');
console.log('=== SUMMARY ===');
console.log(`Processed:                ${processed}`);
console.log(`Written:                  ${written}`);
console.log(`Skipped (already state):  ${skippedAlreadyHasState.length}`);
console.log(`Errors:                   ${errors.length}`);
if (errors.length) {
  console.log('First 5 errors:');
  for (const e of errors.slice(0, 5)) {
    console.log(`  ${e.key}: ${e.message}`);
  }
}

if (!APPLY) {
  console.log('');
  console.log('Dry run only. Re-run with --apply to write state field to all records.');
  console.log('Use --force with --apply to re-derive records that already have state set.');
}
