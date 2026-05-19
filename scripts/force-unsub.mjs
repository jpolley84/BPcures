// scripts/force-unsub.mjs
//
// Generalized manual unsubscribe — for the inevitable next reply that
// says "stop sending me emails" / "take me off the list" / etc.
//
// Usage:
//   node scripts/force-unsub.mjs --email=foo@example.com
//   node scripts/force-unsub.mjs --email=foo@example.com --note="Replied via Gmail saying STOP"
//
// What it does:
//   1. Reads the drip:<email> record
//   2. Sets unsubscribed:true + unsubscribedAt timestamp
//   3. Sets unsubscribeSource = manual-user-request-<date>
//   4. Optional note saved as unsubscribeNote
//   5. All crons (drip-cron / buyer-upsell-cron / diagnostic-drip-cron /
//      the 5 new tier-N crons / newsletter-cron) will respect this and skip
//
// If no record exists, creates a tombstone so any future re-enrollment
// respects the unsubscribe preference.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const emailArg = args.find((a) => a.startsWith('--email='));
const noteArg = args.find((a) => a.startsWith('--note='));

if (!emailArg) {
  console.error('ERR: --email=<address> required');
  console.error('Usage: node scripts/force-unsub.mjs --email=foo@example.com [--note="reason"]');
  process.exit(1);
}

const email = emailArg.split('=')[1].trim().toLowerCase();
const note = noteArg ? noteArg.split('=').slice(1).join('=') : '';

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

const key = `drip:${email}`;
const existing = await kv.get(key);
const nowIso = new Date().toISOString();
const today = nowIso.slice(0, 10);

console.log(`Target: ${key}`);
if (existing) {
  console.log(`Current state:        ${existing.state || '(unset)'}`);
  console.log(`Current unsubscribed: ${existing.unsubscribed || false}`);
  console.log(`Current paused:       ${existing.paused || false}`);
  console.log(`Current lastSentDay:  ${existing.lastSentDay || 0}`);
  console.log(`Current cohort:       ${existing.cohort || '(unset)'}`);
} else {
  console.log(`No record found — will create tombstone.`);
}

const updated = existing
  ? {
      ...existing,
      unsubscribed: true,
      unsubscribedAt: nowIso,
      unsubscribeSource: `manual-user-request-${today}`,
      ...(note ? { unsubscribeNote: note } : {}),
    }
  : {
      email,
      unsubscribed: true,
      unsubscribedAt: nowIso,
      unsubscribeSource: `manual-user-request-${today}`,
      source: 'unsubscribe-tombstone',
      lastSentDay: 0,
      ...(note ? { unsubscribeNote: note } : {}),
    };

await kv.set(key, updated);
console.log(`\n✓ UNSUBSCRIBED — all crons will skip this record.`);
if (note) console.log(`  Note: ${note}`);
