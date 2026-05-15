// scripts/catch-up-drip-fire.mjs
//
// One-shot catch-up: fires today's due drip email to every engaged
// subscriber who didn't get one this morning. Run today (2026-05-15)
// to clear the backlog from the gap-protection bug:
//
//   • 2,712 zombies stranded at Day 0 (mostly beehiiv migration) — get Day 1
//   • 340 mc340 cohort stalled at Day 6 — get Day 7
//   • Anyone else lastSentDay > 0 whose lastSentAt is > 20 hours ago — get next day
//
// Will NOT double-send: skips records whose lastSentAt is < 20 hours ago
// (those already got today's email via the normal cron fire).
//
// Days 8+ honor the new buyer-or-opted-in gate (patched in drip-cron.js
// same commit).
//
// FLAGS:
//   --dry-run   show counts + first-recipient preview, send nothing
//   --send      execute
//   --limit=N   cap recipients (useful for staged rollouts)

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import crypto from 'node:crypto';
import { renderEmail, DAYS } from '../api/_drip-emails.js';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const SEND = argv.includes('--send');
const LIMIT = parseInt(argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10);

if (!DRY && !SEND) { console.error('Need --dry-run or --send'); process.exit(1); }
if (SEND && !process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }

const RATE_LIMIT_MS = 100;
const NO_DOUBLE_SEND_HOURS = 20; // skip if subscriber got an email in last 20h
const SECRET = process.env.DRIP_OPT_IN_SECRET || process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';

function signOptInToken(email) {
  const ts = Date.now();
  const payload = `${email.toLowerCase()}.${ts}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function hasBuyerTag(tags) {
  if (!Array.isArray(tags)) return false;
  return tags.some((t) =>
    t === 'bpquiz-purchaser' ||
    t === 'tier-1-buyer' ||
    t === 'tier-2-buyer' ||
    t === 'tier-3-buyer'
  );
}

const now = Date.now();
const NOW_ISO = new Date(now).toISOString();
const TWENTY_HOURS_MS = NO_DOUBLE_SEND_HOURS * 3600 * 1000;
const ONE_DAY_MS = 86400 * 1000;

console.log('━━━━━━━━━━━━ DRIP CATCH-UP FIRE ━━━━━━━━━━━━');
console.log('Mode:', DRY ? 'DRY RUN' : 'SEND');
console.log('Limit:', LIMIT || 'no limit');
console.log('');

// Pull all engaged drip:* records
const allKeys = await kv.keys('drip:*');
console.log(`Scanning ${allKeys.length} drip:* records...`);

const plan = []; // { key, sub, targetDay, action: 'reset-enrolledAt' | 'send-only' }
const stats = {
  scanned: 0,
  skippedExcluded: 0,    // unsubscribed/paused/complete
  skippedRecent: 0,      // lastSentAt < 20h
  skippedNoContent: 0,   // target day has no DAYS entry
  skippedBlockedAt7: 0,  // day 8+ but not buyer + not optedIn
  willResetEnrolledAt: 0,
  willFire: {},
};

for (const key of allKeys) {
  stats.scanned++;
  const sub = await kv.get(key);
  if (!sub || !sub.email) continue;
  if (sub.unsubscribed || sub.paused || sub.complete) { stats.skippedExcluded++; continue; }

  // No-double-send guard: if they got an email in the last 20h, skip
  if (sub.lastSentAt) {
    const sinceLastSent = now - new Date(sub.lastSentAt).getTime();
    if (sinceLastSent < TWENTY_HOURS_MS) { stats.skippedRecent++; continue; }
  }

  const lastSentDay = sub.lastSentDay || 0;
  const targetDay = lastSentDay + 1;

  // Cap at Day 12 (Days 13-30 not authored)
  if (!DAYS[targetDay]) { stats.skippedNoContent++; continue; }

  // Day 8+ gating: must be optedIn OR have a buyer tag
  if (targetDay > 7) {
    if (!sub.optedIn && !hasBuyerTag(sub.tags)) {
      stats.skippedBlockedAt7++;
      continue;
    }
  }

  // If their enrolledAt is too old (the zombie case), reset to now
  // so the cron's calendar cap will let them flow Day-2 tomorrow.
  let action = 'send-only';
  if (lastSentDay === 0 && sub.enrolledAt) {
    const enrolledAge = now - new Date(sub.enrolledAt).getTime();
    if (enrolledAge > 7 * ONE_DAY_MS) {
      action = 'reset-enrolledAt';
      stats.willResetEnrolledAt++;
    }
  }

  plan.push({ key, sub, targetDay, action });
  stats.willFire[targetDay] = (stats.willFire[targetDay] || 0) + 1;
}

const targets = LIMIT > 0 ? plan.slice(0, LIMIT) : plan;

console.log('');
console.log('━━━ PLAN ━━━');
console.log('Scanned:                          ' + stats.scanned);
console.log('Excluded (unsub/paused/complete): ' + stats.skippedExcluded);
console.log('Already got email in last 20h:    ' + stats.skippedRecent);
console.log('No content (Day 13+ unauthored):  ' + stats.skippedNoContent);
console.log('Day 8+ blocked (not buyer/opted): ' + stats.skippedBlockedAt7);
console.log('Will reset enrolledAt:            ' + stats.willResetEnrolledAt);
console.log('');
console.log('Will fire (' + targets.length + ' total):');
Object.entries(stats.willFire).sort((a,b)=>Number(a[0])-Number(b[0])).forEach(([d,n]) => {
  console.log('  Day ' + d.padEnd(3) + n);
});
console.log('');

if (DRY) {
  if (targets[0]) {
    console.log('— SAMPLE: first target —');
    console.log('  email:        ' + targets[0].sub.email);
    console.log('  lastSentDay:  ' + (targets[0].sub.lastSentDay || 0));
    console.log('  enrolledAt:   ' + targets[0].sub.enrolledAt);
    console.log('  source:       ' + targets[0].sub.source);
    console.log('  → fire Day:   ' + targets[0].targetDay);
    console.log('  → action:     ' + targets[0].action);
  }
  console.log('\nDRY RUN — no emails sent. Pass --send to fire.');
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
let sent = 0, failed = 0;
const failures = [];
console.log(`Firing to ${targets.length} subscribers at ${RATE_LIMIT_MS}ms intervals...`);
console.log('');

for (let i = 0; i < targets.length; i++) {
  const { key, sub, targetDay, action } = targets[i];
  try {
    const ctx = {
      email: sub.email,
      firstName: sub.firstName,
      optInToken: targetDay === 7 ? signOptInToken(sub.email) : undefined,
    };
    const payload = renderEmail(targetDay, ctx);
    const result = await resend.emails.send({ ...payload, to: sub.email });

    if (result.error) {
      failed++;
      failures.push({ email: sub.email, error: result.error.message || JSON.stringify(result.error) });
    } else {
      sent++;
      // Update KV: lastSentDay, lastSentAt, and optionally enrolledAt
      const update = {
        ...sub,
        lastSentDay: targetDay,
        lastSentAt: NOW_ISO,
      };
      if (action === 'reset-enrolledAt') {
        update.enrolledAt = NOW_ISO;
        update.enrolledAtPrevious = sub.enrolledAt;
        update.reactivatedAt = NOW_ISO;
      }
      await kv.set(key, update);
      if (sent % 100 === 0) console.log(`  ${sent}/${targets.length}...`);
    }
  } catch (err) {
    failed++;
    failures.push({ email: sub.email, error: err.message });
  }
  await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
}

console.log('');
console.log('━━━ DONE ━━━');
console.log('Sent:   ' + sent);
console.log('Failed: ' + failed);
if (failures.length) {
  const path = 'C:/Users/jpoll/AppData/Local/Temp/drip-catchup-failures.json';
  await import('node:fs').then(fs => fs.writeFileSync(path, JSON.stringify(failures, null, 2)));
  console.log('Failures logged: ' + path);
}
