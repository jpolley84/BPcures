// scripts/email-stats.mjs — read-only email performance report, per campaign.
//
//   node scripts/email-stats.mjs                      all campaigns with KV counters
//   node scripts/email-stats.mjs --since=2026-08-20   only campaigns that sent on/after that date
//   node scripts/email-stats.mjs --campaign=challenge-free-2026-08-24-e3
//   node scripts/email-stats.mjs --legacy             add the pre-counter fallback (Resend
//                                                     emails.list bucketed by subject + last_event)
//   node scripts/email-stats.mjs --legacy --limit=4000 --json
//
// Source of truth = KV counters written by api/_resend.js (sent) and
// api/resend-bounce.js (delivered/opened/clicked/bounced/complained +
// unique opened_by / clicked_by sets). Counters start 2026-08-23; anything
// older only exists in Resend's own log, which the --legacy mode pages
// through (last_event per email, bucketed by subject) — that view has NO
// unique-open math, it is a ceiling at best.
//
// Rates: open rate = unique opens / delivered (falls back to sent when no
// delivered events were recorded); click rate = unique clicks / delivered.
// Nothing here writes anything.

import dotenv from 'dotenv';
for (const p of ['.env', '.env.local', '.env.production']) dotenv.config({ path: p, override: false, quiet: true });
import { subjectFallback } from '../api/_resend.js';

// Legacy bucket key: same low-cardinality subject slug the send layer uses,
// plus: drop a trailing ", FirstName" so "Here's your result, Denise" and
// "Here's your result, Jan" share one bucket.
function legacyKey(e) {
  const subject = String(e.subject || '').replace(/,\s+[A-Z][\w'-]*(\s+[A-Z][\w'-]*)?\s*$/, '');
  return subjectFallback({ subject, from: e.from });
}

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const has = (n) => process.argv.includes(`--${n}`);
const SINCE = arg('since') ? new Date(arg('since')) : null;
const ONLY = arg('campaign') || null;
const LEGACY = has('legacy');
const LEGACY_LIMIT = Number(arg('limit') || 2000);
const JSON_OUT = has('json');

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
const RESEND_KEY = process.env.RESEND_API_KEY;
const PREFIX = 'email:stats:';
const COUNTERS = ['sent', 'sent_events', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'delayed'];

async function kv(commands) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set');
  const r = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`KV ${r.status}: ${await r.text()}`);
  const out = await r.json();
  return out.map((x) => x.result);
}

const pct = (num, den) => (den > 0 ? `${((100 * num) / den).toFixed(1)}%` : '—');
const n = (v) => Number(v || 0);

async function kvReport() {
  let [campaigns] = await kv([['SMEMBERS', `${PREFIX}campaigns`]]);
  campaigns = (campaigns || []).filter((c) => !ONLY || c === ONLY).sort();
  if (!campaigns.length) return [];

  const cmds = [];
  for (const c of campaigns) {
    for (const k of COUNTERS) cmds.push(['GET', `${PREFIX}${c}:${k}`]);
    cmds.push(['SCARD', `${PREFIX}${c}:opened_by`]);
    cmds.push(['SCARD', `${PREFIX}${c}:clicked_by`]);
    cmds.push(['GET', `${PREFIX}${c}:first_sent_at`]);
    cmds.push(['GET', `${PREFIX}${c}:last_sent_at`]);
    cmds.push(['HGETALL', `${PREFIX}${c}:links`]);
  }
  const res = await kv(cmds);
  const per = COUNTERS.length + 5;
  const rows = [];
  campaigns.forEach((c, i) => {
    const base = i * per;
    const row = { campaign: c };
    COUNTERS.forEach((k, j) => { row[k] = n(res[base + j]); });
    row.unique_opens = n(res[base + COUNTERS.length]);
    row.unique_clicks = n(res[base + COUNTERS.length + 1]);
    row.first_sent_at = res[base + COUNTERS.length + 2] || null;
    row.last_sent_at = res[base + COUNTERS.length + 3] || null;
    const linksArr = res[base + COUNTERS.length + 4] || [];
    row.links = {};
    for (let k = 0; k < linksArr.length; k += 2) row.links[linksArr[k]] = n(linksArr[k + 1]);
    // sent = our INCR at send time; fall back to Resend's email.sent events
    row.sent_total = row.sent || row.sent_events;
    const denom = row.delivered || row.sent_total;
    row.open_rate = pct(row.unique_opens, denom);
    row.click_rate = pct(row.unique_clicks, denom);
    row.bounce_rate = pct(row.bounced, row.sent_total);
    rows.push(row);
  });
  return rows.filter((r) => !SINCE || (r.last_sent_at && new Date(r.last_sent_at) >= SINCE));
}

// ── Legacy fallback: page Resend's email log, bucket by subject ─────────
async function legacyReport() {
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY not set');
  const buckets = new Map();
  let after = null;
  let fetched = 0;
  while (fetched < LEGACY_LIMIT) {
    const qs = new URLSearchParams({ limit: '100' });
    if (after) qs.set('after', after);
    const r = await fetch(`https://api.resend.com/emails?${qs}`, { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    const body = await r.json();
    const data = body.data || [];
    if (!data.length) break;
    let stop = false;
    for (const e of data) {
      fetched++;
      const created = new Date(e.created_at);
      if (SINCE && created < SINCE) { stop = true; break; }
      const tagCampaign = Array.isArray(e.tags) ? (e.tags.find((t) => t.name === 'campaign') || {}).value : null;
      const key = tagCampaign ? `tag:${tagCampaign}` : legacyKey(e);
      if (ONLY && key !== `tag:${ONLY}`) continue;
      const b = buckets.get(key) || { key, total: 0, first: e.created_at, last: e.created_at, events: {} };
      b.total++;
      if (e.created_at < b.first) b.first = e.created_at;
      if (e.created_at > b.last) b.last = e.created_at;
      b.events[e.last_event || 'unknown'] = (b.events[e.last_event || 'unknown'] || 0) + 1;
      buckets.set(key, b);
    }
    if (stop || !body.has_more) break;
    after = data[data.length - 1].id;
  }
  return { fetched, buckets: [...buckets.values()].sort((a, b) => b.total - a.total) };
}

function printKv(rows) {
  console.log(`\nEMAIL STATS (KV counters, since ${SINCE ? SINCE.toISOString().slice(0, 10) : 'start 2026-08-23'})`);
  if (!rows.length) { console.log('  (no campaigns with counters yet)'); return; }
  const head = ['campaign', 'sent', 'deliv', 'uniq_open', 'open%', 'uniq_click', 'click%', 'bounce', 'compl', 'last_sent'];
  const data = rows.map((r) => [r.campaign, r.sent_total, r.delivered, r.unique_opens, r.open_rate, r.unique_clicks, r.click_rate, r.bounced, r.complained, (r.last_sent_at || '').slice(0, 16)]);
  const w = head.map((h, i) => Math.max(h.length, ...data.map((d) => String(d[i]).length)));
  const line = (cols) => cols.map((c, i) => String(c).padEnd(w[i])).join('  ');
  console.log('  ' + line(head));
  console.log('  ' + w.map((x) => '-'.repeat(x)).join('  '));
  for (const d of data) console.log('  ' + line(d));
  const tot = rows.reduce((a, r) => ({ sent: a.sent + r.sent_total, del: a.del + r.delivered, op: a.op + r.unique_opens, cl: a.cl + r.unique_clicks }), { sent: 0, del: 0, op: 0, cl: 0 });
  console.log(`\n  TOTAL sent=${tot.sent} delivered=${tot.del} unique_opens=${tot.op} (${pct(tot.op, tot.del || tot.sent)}) unique_clicks=${tot.cl} (${pct(tot.cl, tot.del || tot.sent)})`);
  const withLinks = rows.filter((r) => Object.keys(r.links).length);
  if (withLinks.length) {
    console.log('\n  Top clicked links:');
    for (const r of withLinks) {
      const top = Object.entries(r.links).sort((a, b) => b[1] - a[1]).slice(0, 3);
      for (const [l, c] of top) console.log(`    ${r.campaign}  ${c}x  ${l}`);
    }
  }
}

function printLegacy({ fetched, buckets }) {
  console.log(`\nLEGACY (Resend log, last_event per email, ${fetched} emails scanned, bucketed by tag/subject)`);
  for (const b of buckets.slice(0, 60)) {
    const ev = Object.entries(b.events).map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`  ${String(b.total).padStart(5)}  ${b.key.slice(0, 60).padEnd(60)}  ${b.last.slice(0, 10)}  ${ev}`);
  }
  console.log('  note: last_event is the LAST state only (an opened email that later bounced shows bounced); opens/clicks here are a floor, not a rate.');
}

const out = { generated_at: new Date().toISOString(), since: SINCE ? SINCE.toISOString() : null };
try {
  out.kv = await kvReport();
} catch (err) {
  out.kv_error = err.message;
}
if (LEGACY) {
  try { out.legacy = await legacyReport(); } catch (err) { out.legacy_error = err.message; }
}

if (JSON_OUT) {
  console.log(JSON.stringify(out, null, 2));
} else {
  if (out.kv_error) console.log(`KV error: ${out.kv_error}`); else printKv(out.kv);
  if (LEGACY) { if (out.legacy_error) console.log(`Legacy error: ${out.legacy_error}`); else printLegacy(out.legacy); }
}
