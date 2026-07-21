// /api/ops-state — passcode-gated dashboard state for /ops
//
// Auth: clients send `X-Ops-Pass` header. Compared with constant-time
// equality against process.env.OPS_DASHBOARD_PASSWORD.
//
// On every call we (in parallel, with timeouts):
//   1. Hit Stripe for charges (live revenue + customer count + today delta)
//   2. Hit Mailchimp for list size
//   3. Read data/ops-state.json (slow-changing state from the heartbeat cron)
//   4. Read data/activity-stream.json (24h chronological activity feed)
//
// data/ files are NOT under public/, so they're not directly fetchable
// from the web. Vercel includes the project tree in the function bundle,
// so we read them via process.cwd() at request time.
//
// Failures in any sub-call return a partial state with `error` markers per
// section — never let one outage 500 the whole endpoint.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
// Shared ET day boundaries so Overview ("today") and Trends (daily buckets)
// can never disagree about where a day starts.
import { etDayStartUnix, TZ } from './ops-trends.js';

const FETCH_TIMEOUT_MS = 5000;

// ── Auth ────────────────────────────────────────────────────────────
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  if (!expected) return { ok: false, reason: 'OPS_DASHBOARD_PASSWORD not configured' };
  const supplied = req.headers['x-ops-pass'] || req.headers['X-Ops-Pass'] || '';
  if (!supplied) return { ok: false, reason: 'missing X-Ops-Pass header' };
  if (!constantTimeEqual(String(supplied), String(expected))) {
    return { ok: false, reason: 'invalid passcode' };
  }
  return { ok: true };
}

// ── Fetch with timeout ──────────────────────────────────────────────
async function fetchWithTimeout(url, opts = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── Stripe ──────────────────────────────────────────────────────────
// ── Live activity feed ──────────────────────────────────────────────
// Replaces the old data/activity-stream.json, a file committed on
// 2026-04-30 that never updated again. The dashboard rendered it under a
// "24h" header showing time-of-day only, so an 11-week-old feed read as if
// it happened this morning (it still listed cold sends from the parked
// Practice Launcher campaign). Stale data presented as live is worse than
// no data, so the feed is now derived from real sources on every request.
//
// Sources: Stripe charges (sales, refunds) + KV tea ledger (orders placed,
// orders shipped). Every entry carries a real ISO timestamp so the client
// can render an honest date. Windowed to the last 24h, newest first.
// Best-effort product label for a Stripe charge, so the activity feed shows
// WHAT sold, not just the price (many products share a price). Priority:
// (1) the charge/payment-link description Stripe sets, (2) a known amount map,
// (3) fall back to the tea blend for a tea amount, (4) raw price. This is a
// display label, not billing truth.
const AMOUNT_PRODUCT = {
  1700: 'BP Reset Kit',
  1299: 'BP Cures book',
  2700: 'Weekly Reset',
  2900: 'SVUTU tea',
  4700: 'Complete Kit',
  9700: 'seminar / $97',
  29700: 'Diagnostic ($297)',
  69700: 'Be There (3-pay)',
  199700: 'Be There ($1,997)',
};
function productForCharge(c) {
  const desc = (c.description || '').trim();
  if (desc && !/^(subscription|payment|charge)\b/i.test(desc)) return desc.slice(0, 42);
  const meta = c.metadata || {};
  if (meta.product) return String(meta.product).slice(0, 42);
  if (meta.tier) return `tier: ${meta.tier}`;
  const mapped = AMOUNT_PRODUCT[c.amount];
  if (mapped) return mapped;
  if (c.amount === 4800 || c.amount === 12000 || c.amount === 5400 || c.amount === 3300) return 'SVUTU tea';
  return `$${((c.amount || 0) / 100).toFixed(2)} item`;
}

async function fetchActivity() {
  const events = [];
  const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
  const sinceUnix = Math.floor(sinceMs / 1000);

  // Sales + refunds from Stripe.
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) {
    try {
      const r = await fetchWithTimeout(
        `https://api.stripe.com/v1/charges?limit=100&created[gte]=${sinceUnix}`,
        { headers: { Authorization: `Bearer ${key}` } },
      );
      if (r.ok) {
        const d = await r.json();
        for (const c of d.data || []) {
          const who = c.billing_details?.email || c.receipt_email || 'unknown';
          const amt = `$${((c.amount || 0) / 100).toFixed(2)}`;
          const product = productForCharge(c);
          if (c.refunded) {
            events.push({ ts: new Date(c.created * 1000).toISOString(), type: 'refund', description: `Refund ${amt} · ${product} → ${who}` });
          } else if (c.status === 'succeeded') {
            // Show WHAT sold, not just the amount — many products share a price.
            events.push({ ts: new Date(c.created * 1000).toISOString(), type: 'sale', description: `${amt} · ${product} → ${who}` });
          }
        }
      }
    } catch { /* partial feed beats a 500 */ }
  }

  // Tea orders placed / shipped from the KV ledger.
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const hdrs = { Authorization: `Bearer ${kvToken}` };
      let cursor = '0';
      const keys = [];
      let guard = 0;
      do {
        const r = await fetchWithTimeout(`${kvUrl}/scan/${cursor}/match/tea:order:*/count/500`, { headers: hdrs });
        if (!r.ok) break;
        const j = await r.json();
        cursor = j.result?.[0] ?? '0';
        keys.push(...(j.result?.[1] || []));
      } while (cursor !== '0' && ++guard < 10);

      for (const k of keys) {
        const r = await fetchWithTimeout(`${kvUrl}/get/${encodeURIComponent(k)}`, { headers: hdrs });
        if (!r.ok) continue;
        const raw = (await r.json()).result;
        if (!raw) continue;
        let o;
        try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { continue; }
        const blend = o.blend === 'satin' ? 'Satin' : 'Steady';
        // The purchase itself already shows in the Stripe sale line above
        // (now product-labelled). Here we only add the SHIPPED action, which
        // is a distinct event the Stripe charge cannot represent.
        if (o.fulfilledAt && new Date(o.fulfilledAt).getTime() >= sinceMs) {
          events.push({ ts: new Date(o.fulfilledAt).toISOString(), type: 'tea-shipped', description: `Shipped · SVUTU ${blend} → ${o.email || 'unknown'}` });
        }
      }
    } catch { /* partial feed beats a 500 */ }
  }

  events.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return events.slice(0, 60);
}

async function fetchStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: 'STRIPE_SECRET_KEY missing' };
  try {
    const res = await fetchWithTimeout('https://api.stripe.com/v1/charges?limit=100', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { error: `Stripe ${res.status}` };
    const data = await res.json();
    const succeeded = (data.data || []).filter((c) => c.status === 'succeeded' && !c.refunded);
    const totalCents = succeeded.reduce((s, c) => s + (c.amount || 0), 0);

    // Today — boundary is midnight America/New_York (Joel is in Louisville),
    // NOT the server's local zone. Vercel functions run in UTC, so
    // setHours(0,0,0,0) previously rolled the day over at 8pm ET and pushed
    // evening sales onto "tomorrow".
    const todayUnix = etDayStartUnix(0);
    const today = succeeded.filter((c) => c.created >= todayUnix);
    const todayCents = today.reduce((s, c) => s + (c.amount || 0), 0);
    const todayOrders = today.length;

    // 7-day sparkline (cents per day, oldest → newest)
    const sparkline = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const startUnix = Math.floor(dayStart.getTime() / 1000);
      const endUnix = Math.floor(dayEnd.getTime() / 1000);
      const cents = succeeded
        .filter((c) => c.created >= startUnix && c.created < endUnix)
        .reduce((s, c) => s + (c.amount || 0), 0);
      sparkline.push(cents / 100);
    }

    return {
      customers: succeeded.length,
      revenueCents: totalCents,
      revenue: `$${(totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      todayCustomers: todayOrders,
      todayOrders,
      todayRevenueCents: todayCents,
      todayRevenue: `$${(todayCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      todayAovCents: todayOrders ? Math.round(todayCents / todayOrders) : 0,
      // Itemised so "today" is never just a total with no story behind it.
      todayProducts: Object.entries(
        today.reduce((acc, c) => {
          const label = `$${((c.amount || 0) / 100).toFixed(2)}`;
          acc[label] = acc[label] || { count: 0, cents: 0 };
          acc[label].count += 1;
          acc[label].cents += c.amount || 0;
          return acc;
        }, {}),
      )
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.cents - a.cents),
      dayStartsAt: new Date(todayUnix * 1000).toISOString(),
      timezone: TZ,
      sparkline7d: sparkline,
    };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ── Drip list (KV) ──────────────────────────────────────────────────
// 2026-05-17: replaced the Mailchimp fetcher. Mailchimp was retired
// 2026-05-14; KV drip:* is now the canonical subscriber store. This
// surfaces real engagement metrics the Mailchimp version couldn't
// (opted-in, paused, unsubscribed, buyer count) since we own the data.
async function fetchDripList() {
  if (!process.env.KV_REST_API_URL) return { error: 'KV not configured' };
  try {
    const { kv } = await import('@vercel/kv');
    // COUNT keys only via SCAN. The old version called kv.keys('drip:*')
    // (throws "too many keys" once the list is large) and then GET every
    // record (8,500 round-trips), which timed the dashboard out. The footer
    // only needs the subscriber total, so we page cursors and count.
    let total = 0;
    let cursor = '0';
    let guard = 0;
    do {
      const [next, batch] = await kv.scan(cursor, { match: 'drip:*', count: 1000 });
      cursor = next;
      total += batch.length;
    } while (cursor !== '0' && ++guard < 60);
    return { subscribers: total };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ── Today's funnel (O(1) counters) ─────────────────────────────────
// Quiz takers + brand-new drip emails today, read from the daily counters
// bumped at the quiz email gate (api/_ops-metrics.js). Counters are
// going-forward: they only reflect events after this shipped, which is
// correct for a "today" tile. Also returns the 7-day sum for context.
async function fetchFunnelToday() {
  try {
    const { kv } = await import('@vercel/kv');
    const { etDate } = await import('./_ops-metrics.js');
    const today = etDate();
    const days = [];
    for (let i = 0; i < 7; i++) days.push(etDate(new Date(Date.now() - i * 86400000)));
    const readSum = async (name) => {
      const vals = await Promise.all(days.map((d) => kv.get(`metric:${name}:${d}`)));
      const today0 = Number(vals[0]) || 0;
      const week = vals.reduce((s, v) => s + (Number(v) || 0), 0);
      return { today: today0, week };
    };
    const [quiz, drip] = await Promise.all([readSum('quiz'), readSum('drip-new')]);
    return { date: today, quizToday: quiz.today, quizWeek: quiz.week, dripToday: drip.today, dripWeek: drip.week };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ── Read committed JSON state ──────────────────────────────────────
function readJsonFile(absPath) {
  try {
    if (!fs.existsSync(absPath)) return null;
    const txt = fs.readFileSync(absPath, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return { _readError: e.message || String(e) };
  }
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — tightened 2026-05-13 audit. Was '*' (any origin); the passcode
  // header check still protects the data, but the open CORS made the
  // endpoint browse-able from any origin. Locked to bpquiz.com only.
  // Echo back the request origin when it matches the allowlist so the
  // pre-flight is consistent across www/non-www / preview deployments.
  const ALLOWED_ORIGINS = [
    'https://bpquiz.com',
    'https://www.bpquiz.com',
  ];
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://bpquiz.com');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Ops-Pass');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = checkAuth(req);
  if (!auth.ok) {
    return res.status(401).json({ error: 'Unauthorized', reason: auth.reason });
  }

  // data/ paths — Vercel serverless functions run with cwd at project root.
  // We deliberately read from data/ rather than public/ so the JSON state
  // (which can include operational notes) isn't directly web-fetchable.
  const dataDir = path.join(process.cwd(), 'data');
  const opsStatePath = path.join(dataDir, 'ops-state.json');
  const activityPath = path.join(dataDir, 'activity-stream.json');

  // Run live calls in parallel; read JSON state synchronously alongside
  const [stripe, dripList, activity, funnelToday] = await Promise.all([fetchStripe(), fetchDripList(), fetchActivity(), fetchFunnelToday()]);
  const heartbeat = readJsonFile(opsStatePath);

  // Compose response
  const response = {
    refreshedAt: new Date().toISOString(),
    stripe,
    // 2026-05-17: was `mailchimp` until Mailchimp retirement. Kept the
    // old key as an alias so any existing dashboard fetch that reads
    // response.mailchimp.subscribers keeps working until it's updated.
    dripList,
    mailchimp: dripList,
    pool: heartbeat?.pool || { error: 'No heartbeat data yet' },
    funnel: heartbeat?.funnel || { error: 'No heartbeat data yet' },
    // Live "Today's Funnel": quiz takers + new drip emails, from O(1) counters.
    funnelToday,
    crons: heartbeat?.crons || [],
    deploy: heartbeat?.deploy || { error: 'No heartbeat data yet' },
    replies: heartbeat?.replies || { count: 0, recent: [] },
    joelQueue: heartbeat?.joelQueue || [],
    // Live, derived per request. Genuinely the last 24h, so an empty array
    // means a quiet day and not a broken feed.
    activity,
    activityWindowHours: 24,
    heartbeatAge: heartbeat?.refreshedAt
      ? Math.floor((Date.now() - new Date(heartbeat.refreshedAt).getTime()) / 1000)
      : null,
  };

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(response);
}
