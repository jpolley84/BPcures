// scripts/import-mc340-to-drip.mjs
//
// Imports the 340 Mailchimp 30-day-challenge cohort into the Resend
// `drip:*` KV system so the self-healing daily cron picks them up
// starting at Day 7 tomorrow.
//
// USAGE:
//   node --env-file=.env.production scripts/import-mc340-to-drip.mjs --dry-run
//   node --env-file=.env.production scripts/import-mc340-to-drip.mjs --commit
//
// Record shape (matches scripts/enroll-drip-cohorts.mjs convention):
//   key:   drip:<lowercased email>
//   value: { email, firstName, cohort: 'mc340', enrolledAt, lastSentDay: 6,
//            lastSentAt: '2026-05-06T12:00:00Z' (Day 6 from Mailchimp),
//            optedIn: true, source: 'mailchimp-30day-import' }
//
// Math: enrolledAt = 2026-05-01 (real Mailchimp Day 1). Today (May 12) =
// computedDay 12. lastSentDay = 6. gap = 6 (below the 7-day auto-pause
// threshold). Tomorrow's cron sends `lastSentDay + 1 = Day 7`. Day after
// Day 8. Then Day 9-12 (new Triangle Method content). After that, Days
// 13-30 will be authored next week.
//
// Idempotent: if a drip:<email> already exists, we DON'T overwrite —
// preserves any newer enrollment state (e.g., a buyer who took the
// BPQuiz between May 6 and now and got into the new system separately).

import fs from 'node:fs';
import { kv } from '@vercel/kv';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const COMMIT = argv.includes('--commit');
const LIST_PATH = argv.find((a) => a.startsWith('--list='))?.split('=')[1]
  || 'C:/Users/jpoll/AppData/Local/Temp/mc_30day_members.json';

if (!DRY_RUN && !COMMIT) {
  console.error('Required flag: --dry-run or --commit');
  process.exit(1);
}
if (!process.env.KV_REST_API_URL) {
  console.error('KV_REST_API_URL not set');
  process.exit(1);
}

const members = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8'));
console.log(`Loaded ${members.length} members from ${LIST_PATH}`);

// Mailchimp Day 1 = 2026-05-01 12:00 UTC. lastSentDay=6 means they got
// the May 6 12:00 UTC send. Tomorrow's cron computes day=7 → sends Day 7.
const ENROLLED_AT = '2026-05-01T12:00:00.000Z';
const LAST_SENT_AT = '2026-05-06T12:00:00.000Z';

let wouldWrite = 0, alreadyExists = 0, skipped = 0, errors = 0;
const failures = [];

for (const m of members) {
  const email = (m.email_address || m.email || '').trim().toLowerCase();
  const firstName = (m.merge_fields?.FNAME || m.firstName || '').trim();
  if (!email || !email.includes('@')) { skipped++; continue; }

  const key = `drip:${email}`;
  const record = {
    email,
    firstName,
    cohort: 'mc340',
    enrolledAt: ENROLLED_AT,
    lastSentDay: 6,
    lastSentAt: LAST_SENT_AT,
    optedIn: true,
    source: 'mailchimp-30day-import',
    importedAt: new Date().toISOString(),
    tags: ['30-day-challenge', 'pressure-triangle', 'mc-bridge-2026-05-12'],
  };

  try {
    // MERGE semantics (changed from skip-if-exists 2026-05-12):
    // The 340 are on the canonical Mailchimp 30-day cohort. The bridge
    // email just told them "Day 7 tomorrow" — so we must force lastSentDay=6
    // regardless of any newer beehiiv-import state. BUT preserve any
    // safety flags (unsubscribed, paused, complete) from existing records.
    const existing = await kv.get(key);
    let merged = record;
    if (existing) {
      alreadyExists++;
      // Preserve unsubscribe + opt-out flags. Override progression state.
      merged = {
        ...existing,
        ...record,
        unsubscribed: existing.unsubscribed || false,
        paused: existing.paused || false,
        complete: existing.complete || false,
      };
    }
    if (DRY_RUN) {
      if (!existing) wouldWrite++;
    } else {
      await kv.set(key, merged);
      wouldWrite++;
      if (wouldWrite % 50 === 0) console.log(`  ${wouldWrite} written...`);
    }
  } catch (err) {
    errors++;
    failures.push({ email, reason: err.message });
    console.error(`  ✗ ${email}: ${err.message}`);
  }
}

console.log(`\nDONE — written: ${wouldWrite}, already-existed (skipped): ${alreadyExists}, invalid-skipped: ${skipped}, errors: ${errors}`);
if (failures.length) {
  fs.writeFileSync('C:/Users/jpoll/AppData/Local/Temp/import-mc340-failures.json', JSON.stringify(failures, null, 2));
  console.log('Failures logged to %TEMP%/import-mc340-failures.json');
}
