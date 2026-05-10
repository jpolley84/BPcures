// Shared helpers for the /api/intake-* endpoints.
//
// Storage: Vercel KV (Upstash Redis) when KV_REST_API_URL + KV_REST_API_TOKEN
// are set. Falls back to a per-instance in-memory map so dev works without
// provisioning. The in-memory fallback is NOT durable across cold starts on
// Vercel — Joel must provision KV before sending the first real intake link.
//
// Token model:
//   <slug>:active   = { token: '<token>', clientName, clientEmail, createdAt }
//   <slug>:progress = { answers: {...}, sectionIndex, lastSaved }
//   <slug>:used     = { submittedAt, answers, ... } (set on submit; presence = burned)

import crypto from 'node:crypto';

const KV_URL = process.env.KV_REST_API_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || '';
const HAS_KV = Boolean(KV_URL && KV_TOKEN);

// In-memory fallback (per-instance only)
const memStore = new Map();

function memGet(key) {
  return memStore.has(key) ? JSON.parse(memStore.get(key)) : null;
}
function memSet(key, value) {
  memStore.set(key, JSON.stringify(value));
}
function memDel(key) {
  memStore.delete(key);
}

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!r.ok) return null;
  const data = await r.json().catch(() => ({}));
  if (!data || data.result == null) return null;
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return data.result;
  }
}

async function kvSet(key, value) {
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
  return r.ok;
}

async function kvDel(key) {
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

export async function storeGet(key) {
  if (HAS_KV) return kvGet(key);
  return memGet(key);
}

export async function storeSet(key, value) {
  if (HAS_KV) return kvSet(key, value);
  memSet(key, value);
  return true;
}

export async function storeDel(key) {
  if (HAS_KV) return kvDel(key);
  memDel(key);
  return true;
}

export function isKvConfigured() {
  return HAS_KV;
}

// ── Slug + token validation ────────────────────────────────────────
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function validSlug(s) {
  return typeof s === 'string' && SLUG_RE.test(s);
}

export function constantTimeEqual(a, b) {
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

// Returns { ok: true, active } | { ok: false, status, message }
export async function checkToken(slug, token) {
  if (!validSlug(slug)) {
    return { ok: false, status: 400, message: 'Invalid slug' };
  }
  if (!token || typeof token !== 'string' || token.length < 10) {
    return { ok: false, status: 400, message: 'Missing token' };
  }

  // Burned?
  const used = await storeGet(`${slug}:used`);
  if (used) {
    return { ok: false, status: 410, message: 'Intake already submitted' };
  }

  const active = await storeGet(`${slug}:active`);
  if (!active || !active.token) {
    return { ok: false, status: 404, message: 'No active intake link for this slug' };
  }
  if (!constantTimeEqual(active.token, token)) {
    return { ok: false, status: 403, message: 'Invalid token' };
  }
  return { ok: true, active };
}

// JSON helper
export function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}
