// scripts/fix-44-double-encoded-2026-05-24.mjs
//
// Repairs all drip:* records that were stored as JSON-stringified strings
// instead of objects. The @vercel/kv library auto-stringifies objects on
// set and auto-parses on get. Some import/state-fix script wrote
// `kv.set(key, JSON.stringify(obj))` which produced a string-typed value.
//
// Symptom: kv.get returns a string. Crons read `sub.state`, `sub.email`,
// `sub.lastSentDay` — all undefined on a string. Silently skipped.
//
// Audit (2026-05-24): 44 of 4455 records are broken. Includes paid
// buyers (cohort: paid-direct), quiz captures (cohort: quiz), and at
// least one beehiiv import.
//
// Idempotent: running twice is safe — second run skips already-fixed
// records.
//
// Modes:
//   --dry-run   List affected keys without writing (DEFAULT)
//   --apply     Write fixes

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
console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN'}`);
console.log(`Scanning ${allKeys.length} drip:* keys...\n`);

let scanned = 0;
let needsFix = 0;
let fixed = 0;
let parseError = 0;
let alreadyOk = 0;
const fixedKeys = [];
const errors = [];

for (const key of allKeys) {
  scanned++;
  const raw = await kv.get(key);

  if (raw === null || raw === undefined) {
    continue;
  }

  if (typeof raw !== 'string') {
    alreadyOk++;
    continue;
  }

  needsFix++;
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    parseError++;
    errors.push({ key, error: 'JSON parse failed: ' + err.message });
    console.log(`  ✗ ${key} — JSON parse failed: ${err.message}`);
    continue;
  }

  if (!obj || typeof obj !== 'object') {
    parseError++;
    errors.push({ key, error: `Parsed to non-object: ${typeof obj}` });
    continue;
  }

  if (APPLY) {
    // Tag the fix so we can identify these later if we need to investigate
    // which crons may have missed them during the broken period.
    obj.doubleEncodingFixedAt = new Date().toISOString();
    obj.doubleEncodingFixSource = 'fix-44-double-encoded-2026-05-24';

    await kv.set(key, obj);
    fixed++;
    fixedKeys.push({ key, email: obj.email, state: obj.state, cohort: obj.cohort });
  } else {
    console.log(`  → would fix: ${key}  (state=${obj.state}, cohort=${obj.cohort}, lastSentDay=${obj.lastSentDay})`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`  Scanned:           ${scanned}`);
console.log(`  Already healthy:   ${alreadyOk}`);
console.log(`  Needed fix:        ${needsFix}`);
if (APPLY) {
  console.log(`  Fixed:             ${fixed}`);
}
console.log(`  Parse errors:      ${parseError}`);

if (APPLY && fixed > 0) {
  console.log('\nFixed records (by state):');
  const byState = {};
  for (const r of fixedKeys) {
    const s = r.state || '(unset)';
    byState[s] = (byState[s] || 0) + 1;
  }
  for (const [s, n] of Object.entries(byState)) console.log(`  ${s.padEnd(15)} ${n}`);
}

if (errors.length) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  - ${e.key}: ${e.error}`);
}

if (!APPLY) {
  console.log('\nDRY-RUN only. Re-run with --apply to write fixes.');
}
