// Triple-source lead scan: (A) daily lead-log set, (B) drip:* firstSeen field
// in last 24h, (C) Resend send-count of lead-magnet subject lines.
// Run any time to verify the quiz pipeline + measure traffic.
//
// Usage:  node scripts/scan-leads-today.mjs              # last 24h
//         node scripts/scan-leads-today.mjs 2026-06-03   # specific UTC day
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
for (const p of ['.env', '.env.local', '.env.production']) {
  const ep = path.resolve(p);
  if (fs.existsSync(ep)) dotenv.config({ path: ep, override: false });
}
const { kv } = await import('@vercel/kv');

const arg = process.argv[2];
const NOW_MS = Date.now();
const SINCE_MS = NOW_MS - 24 * 3600 * 1000;
const dayKey = arg || new Date(NOW_MS).toISOString().slice(0, 10);

console.log(`\n═══════════════════════════════════════════════════════════════════`);
console.log(`  LEAD-PIPELINE SCAN  ·  day=${dayKey}  ·  last-24h fallback also shown`);
console.log(`═══════════════════════════════════════════════════════════════════\n`);

// ─── A. Daily lead-log SET ──────────────────────────────────
console.log(`📊  SOURCE A · daily lead-log set (lead-log:${dayKey})`);
console.log(`────────────────────────────────────────────────────────────────────`);
const setCount = await kv.scard(`lead-log:${dayKey}`).catch(() => 0);
if (setCount > 0) {
  const emails = await kv.smembers(`lead-log:${dayKey}`);
  console.log(`   Quiz takers logged on ${dayKey}: ${setCount}\n`);
  for (const e of emails.slice(0, 25)) console.log(`      ${e}`);
  if (emails.length > 25) console.log(`      ... +${emails.length - 25} more`);
} else {
  console.log(`   0 entries. (Either no quiz takers OR instrumentation is new — set was deployed today.)`);
}

// Also scan recent days to catch any rollover noise
console.log(`\n   Recent-days set sizes:`);
const today = new Date(NOW_MS);
for (let i = 0; i < 7; i++) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - i);
  const k = d.toISOString().slice(0, 10);
  const n = await kv.scard(`lead-log:${k}`).catch(() => 0);
  console.log(`      ${k}:  ${n}`);
}

// ─── B. drip:* with firstSeen / enrolledAt in last 24h ──────
console.log(`\n\n📊  SOURCE B · drip:* records with firstSeen or enrolledAt in last 24h`);
console.log(`────────────────────────────────────────────────────────────────────`);
let cursor = 0, scanned = 0;
const recent = [];
do {
  const [next, batch] = await kv.scan(cursor, { match: 'drip:*', count: 500 });
  cursor = Number(next);
  for (const k of batch) {
    scanned++;
    const r = await kv.get(k);
    if (!r) continue;
    const ts = r.firstSeen || r.enrolledAt;
    if (!ts) continue;
    const ms = new Date(ts).getTime();
    if (ms >= SINCE_MS) {
      recent.push({
        email: k.replace(/^drip:/, ''),
        firstName: r.firstName || '?',
        state: r.state || '?',
        cohort: r.cohort || '?',
        ts,
      });
    }
  }
} while (cursor !== 0);

console.log(`   Scanned ${scanned} drip records.   New (24h): ${recent.length}\n`);
recent.sort((a, b) => new Date(b.ts) - new Date(a.ts));
for (const l of recent.slice(0, 25)) {
  console.log(`      ${l.ts}  ${l.firstName}  <${l.email}>  state=${l.state}  cohort=${l.cohort}`);
}
if (recent.length > 25) console.log(`      ... +${recent.length - 25} more`);

// ─── C. Resend send-count (proxy traffic indicator) ─────────
console.log(`\n\n📊  SOURCE C · Resend send-event proxy (last 24h, lead-magnet subject lines)`);
console.log(`────────────────────────────────────────────────────────────────────`);

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY) {
  console.log(`   RESEND_API_KEY not set — skipped`);
} else {
  // Resend API: GET /emails (returns last 100 by default, newest first)
  const r = await fetch('https://api.resend.com/emails?limit=100', {
    headers: { Authorization: `Bearer ${RESEND_KEY}` },
  });
  if (!r.ok) {
    console.log(`   Resend API error: ${r.status} ${await r.text()}`);
  } else {
    const j = await r.json();
    const list = j.data || j.emails || [];
    const sinceMs = SINCE_MS;
    const leadMagnetSubjects = new Set([
      'Your BP protocol is inside — Day 1 attached',
      "I've watched this move numbers — here's Day 1",
      'Your cortisol protocol — Day 1 inside',
      'Wired-tired? Day 1 of the fix is here',
      'Your glucose protocol — Day 1 inside',
      "Your A1C is creeping up — here's Day 1",
    ]);

    let leadMagnetSends = 0, totalIn24h = 0;
    const sample = [];
    for (const e of list) {
      const t = new Date(e.created_at || e.last_event_at || 0).getTime();
      if (t < sinceMs) continue;
      totalIn24h++;
      if (leadMagnetSubjects.has(e.subject || '')) {
        leadMagnetSends++;
        if (sample.length < 8) sample.push(e);
      }
    }

    console.log(`   Resend sends in last 24h (all): ${totalIn24h}   (page size = 100, so this is a floor)`);
    console.log(`   Of those, lead-magnet quiz-result sends: ${leadMagnetSends}\n`);
    if (sample.length) {
      console.log(`   Recent lead-magnet sends (sample):`);
      for (const e of sample) {
        const to = Array.isArray(e.to) ? e.to[0] : e.to;
        console.log(`      ${e.created_at}  →  ${to}  ·  ${e.subject}`);
      }
    }
  }
}

// ─── D. Reconciliation ──────────────────────────────────────
console.log(`\n\n📊  RECONCILIATION`);
console.log(`────────────────────────────────────────────────────────────────────`);
console.log(`   Source A (daily lead-log set, ${dayKey}):  ${setCount}`);
console.log(`   Source B (drip:* firstSeen in 24h):        ${recent.length}`);
console.log(`   Source C (Resend lead-magnet sends 24h):   see above`);
console.log(`\n   If all three are close, the quiz pipeline is healthy.`);
console.log(`   If C >> B/A, sends are going out but KV writes are failing.`);
console.log(`   If A/B > 0 but C = 0, KV writes work but Resend is failing.`);
console.log(`   If all three are 0 over multiple days, the quiz endpoint isn't being hit.\n`);
