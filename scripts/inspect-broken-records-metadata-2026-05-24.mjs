// scripts/inspect-broken-records-metadata-2026-05-24.mjs
//
// Read-only forensics. For each broken (string-typed) drip:* record,
// JSON.parse + extract telltale fields: enrolledAt, stateFixedAt,
// stateFixedFrom, stateMigratedAt, stateChangedBy, doubleEncodingFixedAt,
// cohort, source, lastSentAt, importedAt.
//
// Goal: find the timestamp/script that touched all 44 records last.
// If they all share e.g. stateFixedAt=2026-05-21T10:00:00, we know what
// to grep for.

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
const broken = [];

for (const key of allKeys) {
  const raw = await kv.get(key);
  if (typeof raw !== 'string') continue;
  try {
    const obj = JSON.parse(raw);
    broken.push({
      key,
      email: obj.email,
      cohort: obj.cohort || '(none)',
      source: obj.source || '(none)',
      enrolledAt: obj.enrolledAt || '(none)',
      importedAt: obj.importedAt || null,
      stateFixedAt: obj.stateFixedAt || null,
      stateFixedFrom: obj.stateFixedFrom || null,
      stateMigratedAt: obj.stateMigratedAt || null,
      stateChangedBy: obj.stateChangedBy || null,
      lastSentAt: obj.lastSentAt || null,
      purchasedAt: obj.purchasedAt || null,
      state: obj.state || '(unset)',
      tags: (obj.tags || []).join(','),
    });
  } catch (e) {
    broken.push({ key, parseError: e.message });
  }
}

console.log(`Broken records: ${broken.length}\n`);

console.log('═'.repeat(80));
console.log('BY COHORT');
console.log('═'.repeat(80));
const byCohort = {};
for (const b of broken) byCohort[b.cohort] = (byCohort[b.cohort] || 0) + 1;
for (const [c, n] of Object.entries(byCohort)) console.log(`  ${c.padEnd(30)} ${n}`);

console.log('\n' + '═'.repeat(80));
console.log('BY SOURCE');
console.log('═'.repeat(80));
const bySource = {};
for (const b of broken) bySource[b.source] = (bySource[b.source] || 0) + 1;
for (const [s, n] of Object.entries(bySource)) console.log(`  ${s.padEnd(30)} ${n}`);

console.log('\n' + '═'.repeat(80));
console.log('BY STATE');
console.log('═'.repeat(80));
const byState = {};
for (const b of broken) byState[b.state] = (byState[b.state] || 0) + 1;
for (const [s, n] of Object.entries(byState)) console.log(`  ${s.padEnd(30)} ${n}`);

console.log('\n' + '═'.repeat(80));
console.log('STATE-FIX TIMESTAMPS (looking for common signature)');
console.log('═'.repeat(80));
const stateFixedAts = {};
const stateFixedFroms = {};
const stateMigratedAts = {};
const importedAts = {};
const enrolledAts = {};
for (const b of broken) {
  if (b.stateFixedAt) stateFixedAts[b.stateFixedAt] = (stateFixedAts[b.stateFixedAt] || 0) + 1;
  if (b.stateFixedFrom) stateFixedFroms[b.stateFixedFrom] = (stateFixedFroms[b.stateFixedFrom] || 0) + 1;
  if (b.stateMigratedAt) stateMigratedAts[b.stateMigratedAt] = (stateMigratedAts[b.stateMigratedAt] || 0) + 1;
  if (b.importedAt) importedAts[b.importedAt] = (importedAts[b.importedAt] || 0) + 1;
  // bucket by date only
  if (b.enrolledAt && b.enrolledAt !== '(none)') {
    const day = b.enrolledAt.slice(0, 10);
    enrolledAts[day] = (enrolledAts[day] || 0) + 1;
  }
}
console.log('\nstateFixedAt values:');
for (const [v, n] of Object.entries(stateFixedAts)) console.log(`  ${v}  → ${n}`);
console.log('\nstateFixedFrom values:');
for (const [v, n] of Object.entries(stateFixedFroms)) console.log(`  ${v}  → ${n}`);
console.log('\nstateMigratedAt values:');
for (const [v, n] of Object.entries(stateMigratedAts)) console.log(`  ${v}  → ${n}`);
console.log('\nimportedAt values:');
for (const [v, n] of Object.entries(importedAts)) console.log(`  ${v}  → ${n}`);
console.log('\nenrolledAt buckets (by date):');
for (const [d, n] of Object.entries(enrolledAts).sort()) console.log(`  ${d}  → ${n}`);

console.log('\n' + '═'.repeat(80));
console.log('FULL DUMP (first 10)');
console.log('═'.repeat(80));
for (const b of broken.slice(0, 10)) {
  console.log(JSON.stringify(b, null, 2));
  console.log('');
}
