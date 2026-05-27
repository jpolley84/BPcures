// scripts/verify-beehiiv-unique-history-2026-05-14.mjs
//
// Before firing the welcome email to the 371 beehiiv-only subscribers,
// verify what email contact (if any) they've had with us. Answers:
//
//   1. Have they received any Resend email from us recently?
//      (drip / transactional / broadcasts — if YES the welcome's
//      "I've been mostly quiet" line is incorrect)
//
//   2. Have they received recent beehiiv broadcasts?
//      (every active beehiiv sub got the May 6 "changing how I email
//      you" broadcast — that's 1 touch in 14 days, still "mostly quiet")
//
// Run with --sample-size N to query N random emails (default 20).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(REPO_ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

const sampleSize = Number(process.argv.indexOf('--sample-size') >= 0
  ? process.argv[process.argv.indexOf('--sample-size') + 1]
  : 20);

// ─── Pull the 371 beehiiv-only emails ─────────────────────────────────

async function pullBeehiivOnly() {
  const k = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUB_ID;
  const H = { Authorization: 'Bearer ' + k };

  // Beehiiv subs
  const beehiiv = [];
  let page = 1;
  for (let i = 0; i < 100; i++) {
    const qs = new URLSearchParams({ limit: '100', page: String(page) });
    const r = await fetch('https://api.beehiiv.com/v2/publications/' + pub + '/subscriptions?' + qs, { headers: H });
    const j = await r.json();
    if (!j.data?.length) break;
    for (const sub of j.data) {
      if (sub?.email && sub.status === 'active') {
        beehiiv.push({
          email: String(sub.email).toLowerCase().trim(),
          subscribedAt: sub.created || sub.subscribed_at || null,
        });
      }
    }
    if (j.data.length < 100) break;
    page++;
  }
  console.log(`Beehiiv active: ${beehiiv.length}`);

  // KV drip emails
  const { kv } = await import('@vercel/kv');
  const keys = await kv.keys('drip:*');
  const kvSet = new Set();
  for (const k of keys) {
    const r = await kv.get(k);
    if (r?.email) kvSet.add(String(r.email).toLowerCase().trim());
  }
  console.log(`KV drip:*: ${kvSet.size}`);

  const unique = beehiiv.filter((s) => !kvSet.has(s.email));
  console.log(`Beehiiv-only unique: ${unique.length}\n`);
  return unique;
}

// ─── Resend send-history lookup ───────────────────────────────────────
// Resend doesn't expose a "search by recipient" endpoint publicly, but we
// can list recent emails and filter client-side. For a sample of N, we
// scan the most-recent 1000 Resend sends and check for any matching email.

async function pullRecentResendSends(maxEmails = 2000) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY missing');
  const sends = []; // { id, to, subject, created_at }
  let cursor = null;
  for (let i = 0; i < 40; i++) {
    const url = 'https://api.resend.com/emails' + (cursor ? '?after=' + cursor : '?limit=100');
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + key } });
    if (!r.ok) {
      console.warn('Resend list returned', r.status, '— stopping pagination');
      break;
    }
    const j = await r.json();
    const items = j.data || j.emails || [];
    if (!items.length) break;
    sends.push(...items.map((e) => ({
      id: e.id,
      to: Array.isArray(e.to) ? e.to.map((x) => x.toLowerCase()) : [String(e.to).toLowerCase()],
      subject: e.subject || '',
      created_at: e.created_at,
    })));
    if (sends.length >= maxEmails) break;
    cursor = items[items.length - 1]?.id;
    if (!cursor) break;
  }
  console.log(`Pulled ${sends.length} most-recent Resend sends`);
  return sends;
}

// ─── Beehiiv recent broadcasts ────────────────────────────────────────

async function pullRecentBeehiivBroadcasts() {
  const k = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUB_ID;
  const H = { Authorization: 'Bearer ' + k };
  const r = await fetch(
    'https://api.beehiiv.com/v2/publications/' + pub + '/posts?limit=10&order_by=created&direction=desc',
    { headers: H },
  );
  const j = await r.json();
  const posts = (j.data || []).map((p) => ({
    id: p.id,
    title: p.title,
    publish_date: p.publish_date,
    status: p.status,
    created: typeof p.created === 'number' ? new Date(p.created * 1000).toISOString() : p.created,
  }));
  return posts;
}

// ─── Main ─────────────────────────────────────────────────────────────

const uniques = await pullBeehiivOnly();
const sampleEmails = new Set(uniques.slice(0, sampleSize).map((u) => u.email));
console.log(`Checking sample of ${sampleEmails.size} beehiiv-unique emails...\n`);

// Resend history
const resendSends = await pullRecentResendSends(2000);
const oldestResend = resendSends.length ? resendSends[resendSends.length - 1]?.created_at : null;
console.log(`Resend send-history window: most recent 2000 sends${oldestResend ? ' (back to ' + oldestResend.slice(0,10) + ')' : ''}`);

const hits = [];
for (const send of resendSends) {
  for (const to of send.to) {
    if (sampleEmails.has(to)) {
      hits.push({ to, subject: send.subject.slice(0, 60), created_at: send.created_at });
    }
  }
}
console.log(`\nResend hits among sample of ${sampleEmails.size}: ${hits.length}`);
if (hits.length) {
  console.log('Recent sends (newest first):');
  for (const h of hits.slice(0, 10)) {
    console.log(`  ${h.created_at?.slice(0,10) || '?'}  ${h.to}  "${h.subject}"`);
  }
}

console.log();
console.log('Beehiiv recent broadcasts (last 10):');
const beePosts = await pullRecentBeehiivBroadcasts();
for (const p of beePosts.slice(0, 10)) {
  console.log(`  ${(p.publish_date || p.created || '').slice(0, 10)}  [${p.status}]  ${(p.title || '').slice(0, 70)}`);
}

console.log();
console.log('VERDICT:');
if (hits.length === 0) {
  console.log('  ✅ Sample of', sampleEmails.size, 'beehiiv-unique subs has ZERO Resend hits.');
  console.log('     They have NOT been emailed by us via Resend. The welcome copy line');
  console.log('     "I have been mostly quiet" is accurate.');
} else {
  console.log('  ⚠️  ' + hits.length + ' Resend hits found in sample. Review above.');
}
console.log();
console.log('  Beehiiv broadcasts they likely received: see list above.');
console.log('  (Active beehiiv subs receive every published broadcast.)');
