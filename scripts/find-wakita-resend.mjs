// scripts/find-wakita-resend.mjs
//
// Phase-1 cleanup helper. Wakita Taylor (Joel's first $6,997 1:1 client,
// closed 2026-05-15) was hand-invoiced via Stripe outside the bpquiz.com
// webhook flow, so no drip:* record was created and the state-machine
// migration couldn't find her.
//
// Joel said her email exists in Resend's send history (he sent her the
// Week 1 agenda + Sunday kickoff on 2026-05-15/16). This script queries
// Resend's API to list recent emails and surface ones with "wakita" in
// the to/subject. Prints minimal info — no broader recipient dump.

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

if (!process.env.RESEND_API_KEY) {
  console.error('ERR: RESEND_API_KEY not set in env');
  process.exit(1);
}

// Resend list-emails endpoint. As of late 2025 the API exposes
// /emails?limit=N — pagination via after=<id>. We pull recent emails
// then filter by recipient or subject containing "wakita".
async function fetchPage(after) {
  const url = new URL('https://api.resend.com/emails');
  url.searchParams.set('limit', '100');
  if (after) url.searchParams.set('after', after);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Resend API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Wakita-distinctive subject patterns. Joel's Week 1 agenda + Sunday
// kickoff emails to her would carry one of these.
const WAKITA_PATTERNS = [
  /wakita/i,
  /sunday at 7 ?pm/i,
  /welcome to the (90-?day|sprint|coaching)/i,
  /week 1 agenda/i,
  /your 90-?day journey/i,
  /your coaching program/i,
  /freedom sprint/i,
];

// Recipients we EXCLUDE — these are the known broadcast/test/system
// addresses that shouldn't be the Wakita match.
const SYSTEM_RECIPIENTS = new Set([
  'braveworksrn@gmail.com',
  'brave.works.marketing@gmail.com',
  'joel@bpquiz.com',
  'noreply@bpquiz.com',
]);

const matches = [];
const seen = new Set();
let after;
let pages = 0;
const MAX_PAGES = 40; // up to 4,000 emails scanned

while (pages < MAX_PAGES) {
  // Throttle — Resend free tier is 5 req/sec. 250ms = 4/sec safe.
  if (pages > 0) await new Promise((r) => setTimeout(r, 250));
  const result = await fetchPage(after);
  const items = result.data || [];
  if (!items.length) break;
  for (const e of items) {
    const to = Array.isArray(e.to) ? e.to.join(',') : String(e.to || '');
    const subject = String(e.subject || '');
    const toLow = to.toLowerCase().trim();
    if (SYSTEM_RECIPIENTS.has(toLow)) continue;
    const patternHit = WAKITA_PATTERNS.find((re) => re.test(to) || re.test(subject));
    if (patternHit) {
      const sig = `${toLow}::${subject}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      matches.push({
        email: to,
        subject,
        sentAt: e.created_at,
        id: e.id,
        lastEvent: e.last_event,
        pattern: patternHit.source,
      });
    }
  }
  pages++;
  after = items[items.length - 1]?.id;
  if (!after) break;
}

console.log(`Scanned ~${pages * 100} recent Resend emails`);
console.log(`Found ${matches.length} hit(s) on Wakita-distinctive patterns:\n`);

for (const m of matches) {
  console.log(`  Email:        ${m.email}`);
  console.log(`  Subject:      ${m.subject}`);
  console.log(`  Sent:         ${m.sentAt}`);
  console.log(`  Status:       ${m.lastEvent}`);
  console.log(`  Matched by:   ${m.pattern}`);
  console.log(`  Resend ID:    ${m.id}`);
  console.log('');
}

if (matches.length === 0) {
  console.log('No matching sends in the scanned window. Try:');
  console.log('  1. Increase MAX_PAGES (currently 40 = ~4,000 emails)');
  console.log('  2. Add a custom subject pattern to WAKITA_PATTERNS');
  console.log('  3. Ask Joel to surface her email directly');
}
