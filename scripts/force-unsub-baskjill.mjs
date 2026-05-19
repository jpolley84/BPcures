// scripts/force-unsub-baskjill.mjs
//
// Manual unsubscribe for Jill (baskjill@bellsouth.net) — she reported
// the unsubscribe link wasn't working on 2026-05-19 and asked to be
// removed. Set her drip:* record to unsubscribed:true so all crons skip.
//
// Also flags the broken-unsub-link issue with a `unsubFailedReportedAt`
// field for later diagnosis (separate task — investigate
// /api/unsubscribe with this email + token).

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

const EMAIL = 'baskjill@bellsouth.net';
const key = `drip:${EMAIL}`;
const existing = await kv.get(key);

console.log(`Target: ${key}\n`);
if (!existing) {
  console.log('NO RECORD found. She may already be off the list, OR the email');
  console.log('on the drip:* record is slightly different from what she signed');
  console.log('Reply-From with. Check the raw email source for the actual address.');
  process.exit(0);
}

console.log('Current record:');
console.log(`  state:             ${existing.state || '(unset)'}`);
console.log(`  unsubscribed:      ${existing.unsubscribed || false}`);
console.log(`  paused:            ${existing.paused || false}`);
console.log(`  lastSentDay:       ${existing.lastSentDay || 0}`);
console.log(`  lastSentAt:        ${existing.lastSentAt || '(unset)'}`);
console.log(`  cohort:            ${existing.cohort || '(unset)'}`);
console.log(`  enrolledAt:        ${existing.enrolledAt || '(unset)'}`);
console.log(`  tags:              ${JSON.stringify((existing.tags || []).slice(0, 10))}`);

const updated = {
  ...existing,
  unsubscribed: true,
  unsubscribedAt: new Date().toISOString(),
  unsubscribeSource: 'manual-user-request-2026-05-19',
  unsubReportedBrokenLink: true,
  unsubReportedBrokenLinkAt: new Date().toISOString(),
};

await kv.set(key, updated);
console.log('\n✓ UNSUBSCRIBED — all crons will skip this record.');
console.log('  Flagged unsubReportedBrokenLink:true for follow-up investigation.');
