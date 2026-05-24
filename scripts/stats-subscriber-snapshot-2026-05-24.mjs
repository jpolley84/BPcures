// scripts/stats-subscriber-snapshot-2026-05-24.mjs
//
// Read-only census of every drip:* record in KV.
// Answers: total, by state, by source, by cohort, recent enrollments,
// drip-day distribution per state, exclusions (unsub/paused/complete).

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
const now = Date.now();
const DAY = 86400000;

const stats = {
  total: 0,
  brokenString: 0,
  byState: {},
  bySource: {},
  byCohort: {},
  bySourceState: {}, // source × state grid
  unsubscribed: 0,
  paused: 0,
  complete: 0,
  active: 0, // not unsub, not paused, not complete
  // Recency
  enrolledLast24h: 0,
  enrolledLast7d: 0,
  enrolledLast30d: 0,
  // Quiz-takers (cohort=quiz OR source=quiz-lead-magnet)
  quizTakers: 0,
  quizTakersLast7d: 0,
  // Paid customers
  paidCustomers: 0,
  // Days-in-state for lead state
  leadDayDistribution: {}, // lastSentDay → count
  // Days-since-state for tier states (using stateEnteredAt)
  tier1DaysSinceDistribution: {},
  tier2DaysSinceDistribution: {},
  tier3DaysSinceDistribution: {},
  tier4DaysSinceDistribution: {},
};

for (const key of allKeys) {
  stats.total++;
  const raw = await kv.get(key);
  if (raw === null || raw === undefined) continue;

  let sub;
  if (typeof raw === 'string') {
    stats.brokenString++;
    try { sub = JSON.parse(raw); } catch { continue; }
  } else {
    sub = raw;
  }
  if (!sub || typeof sub !== 'object') continue;

  const state = sub.state || '(unset)';
  const source = sub.source || '(none)';
  const cohort = sub.cohort || '(none)';

  stats.byState[state] = (stats.byState[state] || 0) + 1;
  stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  stats.byCohort[cohort] = (stats.byCohort[cohort] || 0) + 1;

  const srcStateKey = `${source}|${state}`;
  stats.bySourceState[srcStateKey] = (stats.bySourceState[srcStateKey] || 0) + 1;

  if (sub.unsubscribed) stats.unsubscribed++;
  if (sub.paused) stats.paused++;
  if (sub.complete) stats.complete++;
  if (!sub.unsubscribed && !sub.paused && !sub.complete) stats.active++;
  if (sub.isPaidCustomer) stats.paidCustomers++;

  // Recency by enrolledAt
  if (sub.enrolledAt) {
    const e = new Date(sub.enrolledAt).getTime();
    if (!Number.isNaN(e)) {
      const age = now - e;
      if (age < DAY) stats.enrolledLast24h++;
      if (age < 7 * DAY) stats.enrolledLast7d++;
      if (age < 30 * DAY) stats.enrolledLast30d++;
    }
  }

  // Quiz takers
  const isQuiz = cohort === 'quiz' || source === 'quiz-lead-magnet';
  if (isQuiz) {
    stats.quizTakers++;
    if (sub.enrolledAt) {
      const e = new Date(sub.enrolledAt).getTime();
      if (!Number.isNaN(e) && now - e < 7 * DAY) stats.quizTakersLast7d++;
    }
  }

  // Day distribution per state
  if (state === 'lead') {
    const d = sub.lastSentDay || 0;
    stats.leadDayDistribution[d] = (stats.leadDayDistribution[d] || 0) + 1;
  }
  for (const ts of ['tier-1', 'tier-2', 'tier-3', 'tier-4']) {
    if (state === ts && sub.stateEnteredAt) {
      const ent = new Date(sub.stateEnteredAt).getTime();
      if (!Number.isNaN(ent)) {
        const daysSince = Math.floor((now - ent) / DAY);
        const distKey =
          ts === 'tier-1' ? 'tier1DaysSinceDistribution' :
          ts === 'tier-2' ? 'tier2DaysSinceDistribution' :
          ts === 'tier-3' ? 'tier3DaysSinceDistribution' :
          'tier4DaysSinceDistribution';
        stats[distKey][daysSince] = (stats[distKey][daysSince] || 0) + 1;
      }
    }
  }
}

// Print
const line = (s) => console.log(s);
const eq = '═'.repeat(60);

line(eq);
line('SUBSCRIBER SNAPSHOT — ' + new Date().toISOString());
line(eq);
line(`Total drip:* records:        ${stats.total}`);
line(`  Active (not unsub/paused/complete): ${stats.active}`);
line(`  Unsubscribed:              ${stats.unsubscribed}`);
line(`  Paused:                    ${stats.paused}`);
line(`  Complete (Day 30+):        ${stats.complete}`);
line(`  Broken JSON string type:   ${stats.brokenString}`);
line(`  Paid customers:            ${stats.paidCustomers}`);

line('\n' + eq);
line('BY STATE');
line(eq);
const stateOrder = ['lead', 'tier-1', 'tier-2', 'tier-3', 'tier-4', 'newsletter', '(unset)'];
for (const s of stateOrder) {
  const n = stats.byState[s] || 0;
  if (n > 0) line(`  ${s.padEnd(15)} ${String(n).padStart(5)}`);
}
for (const [s, n] of Object.entries(stats.byState)) {
  if (!stateOrder.includes(s)) line(`  ${s.padEnd(15)} ${String(n).padStart(5)}`);
}

line('\n' + eq);
line('BY SOURCE');
line(eq);
const sources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
for (const [s, n] of sources) line(`  ${s.padEnd(30)} ${String(n).padStart(5)}`);

line('\n' + eq);
line('BY COHORT (top 15)');
line(eq);
const cohorts = Object.entries(stats.byCohort).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [c, n] of cohorts) line(`  ${c.padEnd(40)} ${String(n).padStart(5)}`);

line('\n' + eq);
line('RECENCY');
line(eq);
line(`  Enrolled in last 24h:   ${stats.enrolledLast24h}`);
line(`  Enrolled in last 7d:    ${stats.enrolledLast7d}`);
line(`  Enrolled in last 30d:   ${stats.enrolledLast30d}`);
line(`  Quiz takers (total):    ${stats.quizTakers}`);
line(`  Quiz takers (last 7d):  ${stats.quizTakersLast7d}`);

line('\n' + eq);
line('LEAD STATE — Day distribution (lastSentDay)');
line(eq);
const leadDays = Object.entries(stats.leadDayDistribution).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
for (const [d, n] of leadDays) line(`  Day ${String(d).padStart(2)}:   ${String(n).padStart(5)}  ${'█'.repeat(Math.min(50, Math.ceil(n / 5)))}`);

line('\n' + eq);
line('TIER-1 STATE — days since state entry');
line(eq);
const t1 = Object.entries(stats.tier1DaysSinceDistribution).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
for (const [d, n] of t1) line(`  ${String(d).padStart(3)}d post-buy:  ${n}`);

line('\n' + eq);
line('TIER-2 STATE — days since state entry');
line(eq);
const t2 = Object.entries(stats.tier2DaysSinceDistribution).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
for (const [d, n] of t2) line(`  ${String(d).padStart(3)}d post-buy:  ${n}`);

line('\n' + eq);
line('TIER-3 STATE — days since state entry');
line(eq);
const t3 = Object.entries(stats.tier3DaysSinceDistribution).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
for (const [d, n] of t3) line(`  ${String(d).padStart(3)}d post-buy:  ${n}`);

line('\n' + eq);
line('TIER-4 STATE — days since state entry');
line(eq);
const t4 = Object.entries(stats.tier4DaysSinceDistribution).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
for (const [d, n] of t4) line(`  ${String(d).padStart(3)}d post-buy:  ${n}`);
