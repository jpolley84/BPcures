// scripts/enroll-drip-cohorts.mjs
//
// One-time migration: pull all subscribers from beehiiv, bucket them into
// 7 staggered cohorts of ~equal size, and write each as a `drip:{email}`
// record in Vercel KV.
//
// Cohort 0 enrolls today  → fires Day 1 today (or tomorrow's cron).
// Cohort 1 enrolls today + 1 day → fires Day 1 tomorrow.
// ... etc, through Cohort 6 enrolling today + 6 days.
//
// This spreads the daily send volume so we don't blast all 2,687 subs at
// 7 AM on the same morning (spam-folder risk + Resend rate limits).
//
// Usage (run from bpquiz-site/):
//   node --env-file=.env scripts/enroll-drip-cohorts.mjs --source beehiiv --dry-run
//   node --env-file=.env scripts/enroll-drip-cohorts.mjs --source beehiiv --commit
//   node --env-file=.env scripts/enroll-drip-cohorts.mjs --source csv --file tmp/subs.csv --commit
//
// Required env:
//   BEEHIIV_API_KEY, BEEHIIV_PUB_ID  (if --source beehiiv)
//   KV_REST_API_URL, KV_REST_API_TOKEN  (auto-set when Vercel KV is provisioned)
//
// CSV format (--source csv): two columns — email,first_name (header row required).

import { kv } from '@vercel/kv';
import fs from 'node:fs';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';
const COHORT_COUNT = 7;

// ─── CLI parsing ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

const SOURCE = value('--source') || 'beehiiv';
const FILE = value('--file');
const DRY_RUN = !flag('--commit');
const START_DATE = value('--start-date'); // optional ISO date; defaults to today

// ─── Sub fetchers ─────────────────────────────────────────────────────
async function fetchFromBeehiiv() {
  if (!process.env.BEEHIIV_API_KEY || !process.env.BEEHIIV_PUB_ID) {
    throw new Error('BEEHIIV_API_KEY or BEEHIIV_PUB_ID not set');
  }

  const all = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const url = `${BEEHIIV_API}/publications/${process.env.BEEHIIV_PUB_ID}/subscriptions?limit=${limit}&page=${page}&status=active`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`beehiiv fetch failed page ${page}: ${res.status} ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const data = json?.data || [];
    if (data.length === 0) break;
    all.push(...data.map((d) => ({
      email: d.email,
      firstName: d.custom_fields?.find?.((f) => f.name === 'FNAME')?.value || '',
    })));
    if (data.length < limit) break;
    page++;
    process.stdout.write(`\r  fetched ${all.length} from beehiiv...`);
  }
  console.log(`\n  ✓ ${all.length} active subscribers from beehiiv`);
  return all;
}

function fetchFromCsv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().toLowerCase();
  if (!header.includes('email')) {
    throw new Error(`CSV must have header row with 'email' column: ${header}`);
  }
  const cols = header.split(',').map((s) => s.trim());
  const emailIdx = cols.indexOf('email');
  const fnameIdx = cols.findIndex((c) => /first.?name|fname/i.test(c));
  return lines.map((line) => {
    const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    return {
      email: parts[emailIdx],
      firstName: fnameIdx >= 0 ? parts[fnameIdx] : '',
    };
  }).filter((r) => r.email && r.email.includes('@'));
}

// ─── Cohort assignment ────────────────────────────────────────────────
// Round-robin so the cohorts are balanced even with odd remainders.
function assignCohorts(subs) {
  const today = START_DATE ? new Date(START_DATE) : new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight local

  return subs.map((s, i) => {
    const cohort = i % COHORT_COUNT;
    const enrolledAt = new Date(today);
    enrolledAt.setDate(enrolledAt.getDate() + cohort);
    return {
      ...s,
      cohort,
      enrolledAt: enrolledAt.toISOString(),
    };
  });
}

// ─── KV writer ────────────────────────────────────────────────────────
async function writeToKV(records) {
  let written = 0;
  let skipped = 0;

  for (const r of records) {
    const key = `drip:${r.email.toLowerCase()}`;
    if (DRY_RUN) {
      console.log(`[DRY] ${key} → cohort ${r.cohort}, enrolledAt ${r.enrolledAt}`);
      written++;
      continue;
    }

    // Check for existing record — don't overwrite an in-progress sub.
    const existing = await kv.get(key);
    if (existing) {
      skipped++;
      continue;
    }

    await kv.set(key, {
      email: r.email.toLowerCase(),
      firstName: r.firstName || '',
      enrolledAt: r.enrolledAt,
      cohort: r.cohort,
      lastSentDay: 0,
      optedIn: false,
      paused: false,
      unsubscribed: false,
      complete: false,
      source: SOURCE,
      createdAt: new Date().toISOString(),
    });
    written++;

    if (written % 100 === 0) {
      process.stdout.write(`\r  wrote ${written}/${records.length} to KV...`);
    }
  }
  console.log(`\n  ✓ wrote ${written}, skipped ${skipped} existing`);
  return { written, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Drip Cohort Enrollment ===');
  console.log(`Source: ${SOURCE}`);
  console.log(`Mode:   ${DRY_RUN ? 'DRY RUN (use --commit to write)' : 'LIVE — writing to KV'}`);
  console.log('');

  let subs;
  if (SOURCE === 'beehiiv') {
    subs = await fetchFromBeehiiv();
  } else if (SOURCE === 'csv') {
    subs = fetchFromCsv(FILE);
    console.log(`  ✓ ${subs.length} from CSV`);
  } else {
    throw new Error(`Unknown source: ${SOURCE}. Use 'beehiiv' or 'csv'.`);
  }

  if (subs.length === 0) {
    console.log('No subscribers to enroll. Exiting.');
    return;
  }

  // De-dupe by email.
  const dedup = Array.from(new Map(subs.map((s) => [s.email.toLowerCase(), s])).values());
  console.log(`  ✓ ${dedup.length} unique emails after dedup`);

  // Assign cohorts.
  const records = assignCohorts(dedup);
  const cohortCounts = records.reduce((acc, r) => { acc[r.cohort] = (acc[r.cohort] || 0) + 1; return acc; }, {});
  console.log('Cohort distribution:');
  for (let i = 0; i < COHORT_COUNT; i++) {
    const startDate = records.find((r) => r.cohort === i)?.enrolledAt;
    console.log(`  Cohort ${i}: ${cohortCounts[i] || 0} subs, enrolls ${startDate?.slice(0, 10)}`);
  }
  console.log('');

  if (!process.env.KV_REST_API_URL && !DRY_RUN) {
    throw new Error('KV_REST_API_URL not set. Provision Vercel KV or run with --dry-run.');
  }

  await writeToKV(records);

  console.log('\n✓ Done.');
  console.log(DRY_RUN
    ? '\nThis was a dry run. Add --commit to write to KV.'
    : '\nNext: deploy. Cron will start firing at 7 AM CDT tomorrow.');
}

main().catch((err) => {
  console.error('\n✗ Fatal:', err.message);
  process.exit(1);
});
