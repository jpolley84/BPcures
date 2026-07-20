// /api/ops-trends — 7d / 30d history for the /ops Trends tab.
//
// The Overview tab answers "how is TODAY going" and resets at midnight.
// This answers "is today good or bad relative to normal", which the reset
// deliberately throws away. Keeping them in separate tabs means the daily
// number is never quietly inflated by a rolling window.
//
// Day boundaries are America/New_York (Joel is in Louisville), NOT UTC and
// NOT the server's local zone. A UTC midnight cut would roll the day over at
// 8pm ET and make an evening sale land on "tomorrow".
//
// Auth: same X-Ops-Pass header as the rest of /ops.
import crypto from 'node:crypto';

export const TZ = 'America/New_York';
const FETCH_TIMEOUT_MS = 8000;

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  if (!expected) return false;
  const got = req.headers['x-ops-pass'];
  return typeof got === 'string' && constantTimeEqual(got, expected);
}

async function fetchWithTimeout(url, opts = {}, ms = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// "2026-07-19" for an instant, in ET. Using en-CA gives ISO-shaped output.
export function etDayKey(dateLike) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateLike));
}

// How far ahead of UTC the zone is, in ms, at a given instant. Negative for
// ET. Measured via formatToParts so it never depends on the SERVER's local
// zone, which is UTC on Vercel and something else on a laptop.
function tzOffsetMs(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
    .formatToParts(date)
    .reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUTC - date.getTime();
}

// Epoch seconds for the START of the ET day that contains `ref`, offset by
// `daysBack`. Correct across DST because the offset is measured at the target
// instant rather than hardcoded.
//
// An earlier version subtracted the offset in the wrong direction and mixed in
// the server's local zone, which put "midnight" at 7pm the PREVIOUS day. That
// would have shifted every daily number by five hours and silently attributed
// evening sales to the wrong day, so the return value is unit-tested below.
export function etDayStartUnix(daysBack = 0, ref = new Date()) {
  const key = etDayKey(new Date(ref.getTime() - daysBack * 86400000));
  const [y, m, d] = key.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  // ET is behind UTC (offset negative), so subtracting it moves forward to
  // the correct instant: 00:00 UTC - (-4h) = 04:00 UTC = 00:00 ET.
  let ts = utcMidnight - tzOffsetMs(new Date(utcMidnight), TZ);
  // Refine once: on a DST boundary the offset at the first guess can differ
  // from the offset at the real local midnight.
  const refined = utcMidnight - tzOffsetMs(new Date(ts), TZ);
  if (refined !== ts) ts = refined;
  return Math.floor(ts / 1000);
}

async function stripeDaily(days) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: 'STRIPE_SECRET_KEY missing' };
  const since = etDayStartUnix(days - 1);
  const charges = [];
  let startingAfter = null;
  let guard = 0;
  try {
    do {
      const qs = new URLSearchParams({ limit: '100', 'created[gte]': String(since) });
      if (startingAfter) qs.set('starting_after', startingAfter);
      const r = await fetchWithTimeout(`https://api.stripe.com/v1/charges?${qs}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!r.ok) return { error: `Stripe ${r.status}` };
      const j = await r.json();
      charges.push(...(j.data || []));
      startingAfter = j.has_more ? j.data[j.data.length - 1]?.id : null;
    } while (startingAfter && ++guard < 20);
  } catch (err) {
    return { error: err.message };
  }

  // Seed every day so a zero-revenue day renders as 0 rather than vanishing.
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(etDayKey(new Date(Date.now() - i * 86400000)), { date: null, cents: 0, orders: 0, refundedCents: 0 });
  }
  for (const [k, v] of buckets) v.date = k;

  const products = new Map();
  for (const c of charges) {
    const k = etDayKey(c.created * 1000);
    const b = buckets.get(k);
    if (!b) continue;
    if (c.refunded) {
      b.refundedCents += c.amount_refunded || 0;
      continue;
    }
    if (c.status !== 'succeeded') continue;
    b.cents += c.amount || 0;
    b.orders += 1;
    const label = `$${((c.amount || 0) / 100).toFixed(2)}`;
    const p = products.get(label) || { amount: c.amount || 0, count: 0, cents: 0 };
    p.count += 1;
    p.cents += c.amount || 0;
    products.set(label, p);
  }

  const series = [...buckets.values()];
  const totalCents = series.reduce((s, b) => s + b.cents, 0);
  const totalOrders = series.reduce((s, b) => s + b.orders, 0);
  return {
    series,
    totalCents,
    totalOrders,
    refundedCents: series.reduce((s, b) => s + b.refundedCents, 0),
    avgPerDayCents: Math.round(totalCents / days),
    aov: totalOrders ? Math.round(totalCents / totalOrders) : 0,
    bestDay: series.reduce((a, b) => (b.cents > (a?.cents ?? -1) ? b : a), null),
    products: [...products.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 12),
  };
}

async function posthogDaily(days) {
  const host = (process.env.POSTHOG_API_HOST || 'https://us.posthog.com').replace(/\/$/, '');
  const project = process.env.POSTHOG_PROJECT_ID || '467819';
  const key = process.env.POSTHOG_PERSONAL_API_KEY || '';
  if (!key) {
    return {
      error: 'POSTHOG_PERSONAL_API_KEY missing',
      why: 'Revenue trends work without it. Traffic trends need a PostHog personal key (phx_...); the key already in env is the client write key and cannot read analytics.',
    };
  }
  const sql = `
    SELECT toDate(timestamp) AS d, count() AS views, count(DISTINCT person_id) AS visitors
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY d ORDER BY d`;
  try {
    const r = await fetchWithTimeout(`${host}/api/projects/${project}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql } }),
    });
    if (!r.ok) return { error: `PostHog ${r.status}` };
    const j = await r.json();
    const series = (j.results || []).map((row) => ({
      date: String(row[0]).slice(0, 10),
      views: Number(row[1]) || 0,
      visitors: Number(row[2]) || 0,
    }));
    return {
      series,
      totalViews: series.reduce((s, x) => s + x.views, 0),
      totalVisitors: series.reduce((s, x) => s + x.visitors, 0),
    };
  } catch (err) {
    return { error: err.message };
  }
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const days = Math.min(Math.max(parseInt(req.query?.days, 10) || 7, 1), 90);
  const [revenue, traffic] = await Promise.all([stripeDaily(days), posthogDaily(days)]);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ days, timezone: TZ, refreshedAt: new Date().toISOString(), revenue, traffic });
}
