// scripts/audit-3-tier2-buyers-history.mjs
//
// What HAS each of the 3 newly-stamped tier-2 buyers received?
// Reads the KV record + maps lastSentDay → universal drip subjects,
// then shows tag-derived broadcast history so we know what NOT to
// double-send when tier-2-cron starts firing them.

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
const { DAYS } = await import('../api/_drip-emails.js');
const { TIER_2_DAYS } = await import('../api/_tier-2-emails.js');

const BUYERS = [
  { email: 'blksuccessfem@aol.com',   name: 'Shenette Thompson' },
  { email: 'phyllisrene26@gmail.com', name: 'Phyllis Emery' },
  { email: 'dorajones56@icloud.com',  name: 'Dora Reeves' },
];

const DAY_MS = 86_400_000;

for (const buyer of BUYERS) {
  const key = `drip:${buyer.email}`;
  const sub = await kv.get(key);
  if (!sub) {
    console.log(`\n=== ${buyer.name} (${buyer.email}) ===`);
    console.log('  NO KV RECORD');
    continue;
  }

  console.log(`\n${'='.repeat(72)}`);
  console.log(`${buyer.name}  ·  ${buyer.email}`);
  console.log(`${'='.repeat(72)}`);
  console.log(`  state:            ${sub.state || '(unset)'}`);
  console.log(`  stateEnteredAt:   ${sub.stateEnteredAt || '(unset)'}`);
  console.log(`  enrolledAt:       ${sub.enrolledAt || '(unset)'}`);
  console.log(`  purchasedAt:      ${sub.purchasedAt || '(unset)'}`);
  console.log(`  cohort:           ${sub.cohort || '(unset)'}`);
  console.log(`  optedIn:          ${sub.optedIn}`);
  console.log(`  paused:           ${sub.paused || false}`);
  console.log(`  unsubscribed:     ${sub.unsubscribed || false}`);
  console.log(`  isPaidCustomer:   ${sub.isPaidCustomer || false}`);
  console.log(`  lastSentDay:      ${sub.lastSentDay || 0}`);
  console.log(`  lastSentAt:       ${sub.lastSentAt || '(unset)'}`);

  // Universal-drip history — Days 1 through lastSentDay
  const lastDay = Number(sub.lastSentDay) || 0;
  console.log(`\n  UNIVERSAL DRIP — Days received (1..${lastDay}):`);
  if (lastDay === 0) {
    console.log('    (none)');
  } else {
    for (let d = 1; d <= lastDay; d++) {
      const email = DAYS[d];
      if (email) {
        console.log(`    Day ${String(d).padStart(2)}:  "${email.subject}"`);
      } else {
        console.log(`    Day ${String(d).padStart(2)}:  (no email defined)`);
      }
    }
  }

  // Broadcast tags — anything beyond standard quiz/cohort tags hints
  // at a broadcast they got pulled into.
  const tags = Array.isArray(sub.tags) ? sub.tags : [];
  const broadcastTags = tags.filter((t) =>
    /^mc-bridge|seminar|reminder|monday-night|annie-|broadcast|cohort-reminder|zoom-closer/i.test(t)
  );
  if (broadcastTags.length) {
    console.log(`\n  BROADCAST TAGS (signal what one-off broadcasts hit this record):`);
    for (const t of broadcastTags) console.log(`    → ${t}`);
  }

  // Tier-2-sent flags — should all be unset, but check anyway in case
  // the cron has already fired against this record.
  const tier2Flags = Object.keys(sub).filter((k) => /^tier2Day\d+Sent$/.test(k));
  if (tier2Flags.length) {
    console.log(`\n  TIER-2 EMAILS ALREADY SENT (from cron):`);
    for (const f of tier2Flags) {
      const day = f.match(/\d+/)?.[0];
      const sentAt = sub[`${f}At`] || '(no timestamp)';
      console.log(`    ${f} = true (Day ${day}, sent ${sentAt})`);
    }
  } else {
    console.log(`\n  TIER-2 EMAILS ALREADY SENT (from cron):  none`);
  }

  // What WILL the tier-2-cron send them next?
  const enteredAt = sub.stateEnteredAt ? new Date(sub.stateEnteredAt).getTime() : null;
  const daysSinceEntered = enteredAt ? Math.floor((Date.now() - enteredAt) / DAY_MS) : -1;
  console.log(`\n  DAYS SINCE state='tier-2' ENTERED:  ${daysSinceEntered}`);
  console.log(`\n  TIER-2 SEQUENCE — what they WOULD receive going forward:`);
  const tier2Days = Object.keys(TIER_2_DAYS).map(Number).sort((a, b) => a - b);
  for (const d of tier2Days) {
    const email = TIER_2_DAYS[d];
    const subject = email?.subject || '(missing)';
    let status = '';
    if (d <= daysSinceEntered) status = '⚠ MISSED — cron won\'t fire (past day)';
    else if (d === daysSinceEntered + 1) status = '← next cron fire would send this';
    else status = `(future — fires in ${d - daysSinceEntered} day(s))`;
    console.log(`    Day ${String(d).padStart(2)}:  ${subject.padEnd(48)} ${status}`);
  }

  // Overlap risk — find universal-drip emails they already got
  // whose THEMES overlap with tier-2 sequence content (so we know
  // where double-coverage exists).
  const overlapNotes = [];
  if (lastDay >= 9 && DAYS[9]) {
    overlapNotes.push(`Universal Day 9 ("${DAYS[9].subject}") overlaps tier-2 Day 3 (Stress Pressure chapter)`);
  }
  if (lastDay >= 10 && DAYS[10]) {
    overlapNotes.push(`Universal Day 10 ("${DAYS[10].subject}") overlaps tier-2 Day 6 (Sugar Pressure chapter)`);
  }
  if (overlapNotes.length) {
    console.log(`\n  CONTENT OVERLAP RISK (universal drip already covered these themes):`);
    for (const n of overlapNotes) console.log(`    ⚠ ${n}`);
  }
}

console.log('\n' + '='.repeat(72));
console.log('END OF AUDIT');
