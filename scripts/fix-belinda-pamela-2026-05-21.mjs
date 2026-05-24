// scripts/fix-belinda-pamela-2026-05-21.mjs
//
// Inbox-complaint fixes from 2026-05-21 triage:
//
// 1. Belinda Tovarez (btovarez@gmail.com)
//    - Replied 5/20 saying Day 7 continue link didn't work
//    - Current: state=newsletter, lastSentDay=10
//    - Fix: state=lead, lastSentDay=7 → tomorrow's cron sends Day 8
//    - Why: state-aware skip in drip-cron only processes state==='lead'
//
// 2. Pamela Cooper (mimi.cooper7@gmail.com)
//    - Replied 5/20 saying "only one email since May 18"
//    - Current: record stored as STRING (double-encoded JSON), state=tier-2
//    - Fix: parse string → object, set state=lead, write back as object
//    - Why: tier-2 cron not deployed yet (Phase 7); lead cron will pick her up.
//    - NOTE: When Phase 7 deploys, decide if Pamela should move back to tier-2
//      (she's a $30 paid buyer with paidTier:"2"). For now she gets daily drip.

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

const nowIso = new Date().toISOString();

// ─────────────────────────────────────────────────────────
// Belinda
// ─────────────────────────────────────────────────────────
const belindaKey = 'drip:btovarez@gmail.com';
const belindaRec = await kv.get(belindaKey);

console.log('\n=== BELINDA ===');
console.log('Before:', {
  state: belindaRec.state,
  lastSentDay: belindaRec.lastSentDay,
  paused: belindaRec.paused,
  unsubscribed: belindaRec.unsubscribed,
});

const belindaUpdated = {
  ...belindaRec,
  state: 'lead',
  stateEnteredAt: nowIso,
  stateChangedBy: 'inbox-triage-2026-05-21-belinda-continue-link-failed',
  prevState: belindaRec.state,
  prevLastSentDay: belindaRec.lastSentDay,
  lastSentDay: 7, // next cron fire → Day 8 (matches the email reply we sent)
};
await kv.set(belindaKey, belindaUpdated);
console.log('After:', {
  state: belindaUpdated.state,
  lastSentDay: belindaUpdated.lastSentDay,
});

// ─────────────────────────────────────────────────────────
// Pamela
// ─────────────────────────────────────────────────────────
const pamelaKey = 'drip:mimi.cooper7@gmail.com';
const pamelaRaw = await kv.get(pamelaKey);

console.log('\n=== PAMELA ===');
console.log('Raw type:', typeof pamelaRaw);

// Handle double-encoded JSON
const pamelaObj = typeof pamelaRaw === 'string' ? JSON.parse(pamelaRaw) : pamelaRaw;
console.log('Before (parsed):', {
  state: pamelaObj.state,
  lastSentDay: pamelaObj.lastSentDay,
  paidTier: pamelaObj.paidTier,
  paused: pamelaObj.paused,
  unsubscribed: pamelaObj.unsubscribed,
});

const pamelaUpdated = {
  ...pamelaObj,
  state: 'lead', // temporary — until Phase 7 tier-2 cron deploys
  stateEnteredAt: nowIso,
  stateChangedBy: 'inbox-triage-2026-05-21-pamela-missing-daily-emails',
  prevState: pamelaObj.state,
  doubleEncodingFixedAt: nowIso,
  doubleEncodingNote: 'Was stored as JSON string; re-saved as object',
};
await kv.set(pamelaKey, pamelaUpdated);
console.log('After:', {
  state: pamelaUpdated.state,
  lastSentDay: pamelaUpdated.lastSentDay,
});

// ─────────────────────────────────────────────────────────
// Verify both round-trip correctly
// ─────────────────────────────────────────────────────────
console.log('\n=== VERIFY ===');
const b2 = await kv.get(belindaKey);
const p2 = await kv.get(pamelaKey);
console.log('Belinda:', typeof b2 === 'object' ? '✓ object' : '✗ STILL STRING', '— state:', b2?.state, 'lastSentDay:', b2?.lastSentDay);
console.log('Pamela:', typeof p2 === 'object' ? '✓ object' : '✗ STILL STRING', '— state:', p2?.state, 'lastSentDay:', p2?.lastSentDay);

console.log('\nDone. Tomorrow\'s drip-cron will send:');
console.log('  - Belinda → Day 8');
console.log('  - Pamela → Day 2');
