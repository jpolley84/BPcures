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

    // Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayUnix = Math.floor(todayStart.getTime() / 1000);
    const today = succeeded.filter((c) => c.created >= todayUnix);
    const todayCents = today.reduce((s, c) => s + (c.amount || 0), 0);

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
      todayCustomers: today.length,
      todayRevenueCents: todayCents,
      todayRevenue: `$${(todayCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      sparkline7d: sparkline,
    };
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ── Mailchimp ───────────────────────────────────────────────────────
async function fetchMailchimp() {
  const key = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID || '1550e2956c';
  if (!key || !key.includes('-')) return { error: 'MAILCHIMP_API_KEY missing/malformed' };
  try {
    const dc = key.split('-')[1];
    const auth = Buffer.from(`anystring:${key}`).toString('base64');
    const res = await fetchWithTimeout(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) return { error: `Mailchimp ${res.status}` };
    const data = await res.json();
    return {
      subscribers: data.stats?.member_count ?? 0,
      campaigns: data.stats?.campaign_count ?? 0,
    };
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
  // CORS — allow same-origin with custom header
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  const [stripe, mailchimp] = await Promise.all([fetchStripe(), fetchMailchimp()]);
  const heartbeat = readJsonFile(opsStatePath);
  const activityRaw = readJsonFile(activityPath);

  // Compose response
  const response = {
    refreshedAt: new Date().toISOString(),
    stripe,
    mailchimp,
    pool: heartbeat?.pool || { error: 'No heartbeat data yet' },
    funnel: heartbeat?.funnel || { error: 'No heartbeat data yet' },
    crons: heartbeat?.crons || [],
    deploy: heartbeat?.deploy || { error: 'No heartbeat data yet' },
    replies: heartbeat?.replies || { count: 0, recent: [] },
    joelQueue: heartbeat?.joelQueue || [],
    activity: Array.isArray(activityRaw) ? activityRaw : (activityRaw?.events || []),
    heartbeatAge: heartbeat?.refreshedAt
      ? Math.floor((Date.now() - new Date(heartbeat.refreshedAt).getTime()) / 1000)
      : null,
  };

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(response);
}
