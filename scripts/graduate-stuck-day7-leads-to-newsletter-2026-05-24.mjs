// scripts/graduate-stuck-day7-leads-to-newsletter-2026-05-24.mjs
//
// 541 lead-state subscribers are stuck at lastSentDay=7 (the original
// drip-cron opt-in gate). They've completed the foundation arc Days 1-7
// but never received Days 8+ because (a) the gate required optedIn:true
// OR a buyer tag, and (b) drip-cron was retired 2026-05-23.
//
// With the new newsletter-cron firing weekly Monday 13 UTC, the right
// move is to graduate them to state='newsletter' with newsletterIssueLastSent=7
// → they receive newsletter issue 8 next Monday (same content arc, weekly
// cadence instead of daily). No re-greeting awkwardness.
//
// Modes:
//   --dry-run    Count + preview (DEFAULT)
//   --apply      Write changes
//
// Idempotent: re-running with --apply does nothing on already-graduated records.

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

const allKeys = await kv.keys('drip:*');
const nowIso = new Date().toISOString();

let scanned = 0;
let graduated = 0;
let skippedNotStuck = 0;
let skippedExcluded = 0;
let errors = 0;
const errs = [];

console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN'}`);
console.log(`Scanning ${allKeys.length} drip:* keys...\n`);

for (const key of allKeys) {
  scanned++;
  try {
    const sub = await kv.get(key);
    if (!sub || typeof sub !== 'object') continue;
    if (sub.unsubscribed || sub.complete) { skippedExcluded++; continue; }

    // Target: state='lead' AND lastSentDay=7 AND not already migrated
    if (sub.state !== 'lead' || sub.lastSentDay !== 7) { skippedNotStuck++; continue; }
    if (sub.newsletterIssueLastSent !== undefined) { skippedNotStuck++; continue; }

    if (!APPLY) {
      console.log(`  → would graduate: ${sub.email}  (currently state=lead, lastSentDay=7)`);
      graduated++;
      continue;
    }

    await kv.set(key, {
      ...sub,
      state: 'newsletter',
      stateEnteredAt: nowIso,
      prevState: 'lead',
      stateChangedBy: 'graduate-stuck-day7-leads-2026-05-24',
      newsletterIssueLastSent: 7,  // next fire sends issue 8
      // Preserve original lead enrollment timestamps
    });
    graduated++;
  } catch (err) {
    errors++;
    errs.push({ key, error: err.message });
  }
}

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`Scanned:              ${scanned}`);
console.log(`Graduated:            ${graduated}`);
console.log(`Skipped (not stuck):  ${skippedNotStuck}`);
console.log(`Skipped (excluded):   ${skippedExcluded}`);
console.log(`Errors:               ${errors}`);

if (errs.length) {
  console.log('\nFirst 5 errors:');
  for (const e of errs.slice(0, 5)) console.log(`  ${e.key}: ${e.error}`);
}

if (!APPLY) console.log('\nDRY-RUN only. Re-run with --apply to write changes.');
