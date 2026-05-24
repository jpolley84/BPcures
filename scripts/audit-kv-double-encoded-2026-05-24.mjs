// scripts/audit-kv-double-encoded-2026-05-24.mjs
//
// Read-only scan. For every drip:* key, check if kv.get returns:
//   - object  → healthy
//   - string  → double-encoded (bug)
//   - other   → unexpected
//
// Reports counts + first 20 affected keys + their state fields.

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
console.log(`Scanning ${allKeys.length} drip:* keys...\n`);

const buckets = {
  object: [],
  string: [],
  null: [],
  other: [],
};

for (const key of allKeys) {
  const v = await kv.get(key);
  if (v === null || v === undefined) buckets.null.push(key);
  else if (typeof v === 'string') buckets.string.push({ key, preview: v.slice(0, 80) });
  else if (typeof v === 'object') buckets.object.push(key);
  else buckets.other.push({ key, type: typeof v });
}

console.log('═'.repeat(60));
console.log('RESULT');
console.log('═'.repeat(60));
console.log(`  Healthy (object):       ${buckets.object.length}`);
console.log(`  BROKEN (string):        ${buckets.string.length}  ← double-encoded bug`);
console.log(`  null/undefined:         ${buckets.null.length}`);
console.log(`  Other type:             ${buckets.other.length}`);
console.log('═'.repeat(60));

if (buckets.string.length > 0) {
  console.log('\nBROKEN records (first 30):');
  for (const { key, preview } of buckets.string.slice(0, 30)) {
    console.log(`  ${key}`);
    console.log(`    ${preview}...`);
  }
}

if (buckets.other.length > 0) {
  console.log('\nUNEXPECTED types:');
  for (const { key, type } of buckets.other) {
    console.log(`  ${key} → ${type}`);
  }
}
