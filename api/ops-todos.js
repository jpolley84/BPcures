// /api/ops-todos — the running action list on /ops.
//
// Two writers, deliberately different auth:
//   Joel  (X-Ops-Pass)      full read/write: create, tick off, reopen, delete
//   Agents(X-Agent-Token)   append-only: they raise items, they cannot tick
//                           them off or delete them.
//
// The append-only split is the point. An agent that can silently close its own
// items can hide a problem; that is the same class of failure as a dashboard
// showing an April feed under a "24h" header. Agents raise, Joel disposes.
//
// Dedupe: an agent re-raising the same issue every heartbeat would bury the
// list, so a stable `key` upserts instead of appending. Re-raising an item
// Joel already closed reopens it and bumps `raisedCount`, because a problem
// that comes back is louder than one that never left.
//
// Storage: KV list at ops:todos (single JSON array; this list is tens of
// items, not thousands).
import { kv } from '@vercel/kv';
import crypto from 'node:crypto';

const KEY = 'ops:todos';
const MAX = 300;
export const URGENCY = ['critical', 'high', 'normal', 'low'];

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a, 'utf8');
  const B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}
function isJoel(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  const got = req.headers['x-ops-pass'];
  return !!expected && typeof got === 'string' && constantTimeEqual(got, expected);
}
function isAgent(req) {
  // Falls back to the ops password so agents work before a dedicated token is
  // set, but a separate OPS_AGENT_TOKEN is preferred so agent credentials can
  // be rotated without locking Joel out of his own dashboard.
  const expected = process.env.OPS_AGENT_TOKEN || process.env.OPS_DASHBOARD_PASSWORD;
  const got = req.headers['x-agent-token'];
  return !!expected && typeof got === 'string' && constantTimeEqual(got, expected);
}

async function readAll() {
  try {
    const raw = await kv.get(KEY);
    if (!raw) return [];
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
async function writeAll(items) {
  await kv.set(KEY, items.slice(0, MAX));
}

const norm = (s, n = 400) => String(s ?? '').trim().slice(0, n);
const rank = (u) => {
  const i = URGENCY.indexOf(u);
  return i === -1 ? 2 : i;
};

// Open first, then by urgency, then newest.
function sortTodos(items) {
  return items.sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    const r = rank(a.urgency) - rank(b.urgency);
    if (r !== 0) return r;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });
}

export default async function handler(req, res) {
  const joel = isJoel(req);
  const agent = isAgent(req);
  if (!joel && !agent) return res.status(401).json({ error: 'Unauthorized' });
  res.setHeader('Cache-Control', 'no-store');
  const now = new Date().toISOString();

  if (req.method === 'GET') {
    const items = sortTodos(await readAll());
    const open = items.filter((t) => !t.done);
    return res.status(200).json({
      todos: items,
      counts: {
        open: open.length,
        critical: open.filter((t) => t.urgency === 'critical').length,
        high: open.filter((t) => t.urgency === 'high').length,
        done: items.length - open.length,
      },
    });
  }

  // Create / raise. Agents may do this; it is their only write.
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const title = norm(body.title, 200);
    if (!title) return res.status(400).json({ error: 'title required' });
    const urgency = URGENCY.includes(body.urgency) ? body.urgency : 'normal';
    const items = await readAll();
    const dedupeKey = norm(body.key, 120) || null;

    if (dedupeKey) {
      const existing = items.find((t) => t.key === dedupeKey);
      if (existing) {
        existing.raisedCount = (existing.raisedCount || 1) + 1;
        existing.lastRaisedAt = now;
        existing.updatedAt = now;
        // A recurring problem should not stay closed just because it was
        // ticked off once.
        if (existing.done) {
          existing.done = false;
          existing.reopenedAt = now;
        }
        // Escalation is allowed; silent de-escalation is not.
        if (rank(urgency) < rank(existing.urgency)) existing.urgency = urgency;
        if (body.detail) existing.detail = norm(body.detail);
        await writeAll(sortTodos(items));
        return res.status(200).json({ ok: true, upserted: true, todo: existing });
      }
    }

    const todo = {
      id: crypto.randomUUID(),
      key: dedupeKey,
      title,
      detail: norm(body.detail),
      urgency,
      source: norm(body.source, 60) || (agent && !joel ? 'agent' : 'joel'),
      link: norm(body.link, 300),
      done: false,
      raisedCount: 1,
      createdAt: now,
      updatedAt: now,
      lastRaisedAt: now,
    };
    items.unshift(todo);
    await writeAll(sortTodos(items));
    return res.status(200).json({ ok: true, todo });
  }

  // Tick off / reopen / edit. Joel only.
  if (req.method === 'PATCH') {
    if (!joel) return res.status(403).json({ error: 'Agents cannot close or edit items' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const items = await readAll();
    const t = items.find((x) => x.id === body.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (typeof body.done === 'boolean') {
      t.done = body.done;
      t.doneAt = body.done ? now : null;
    }
    if (body.urgency && URGENCY.includes(body.urgency)) t.urgency = body.urgency;
    if (typeof body.title === 'string' && body.title.trim()) t.title = norm(body.title, 200);
    if (typeof body.detail === 'string') t.detail = norm(body.detail);
    t.updatedAt = now;
    await writeAll(sortTodos(items));
    return res.status(200).json({ ok: true, todo: t });
  }

  // Delete. Joel only. Supports ?clearDone=1 to sweep the completed pile.
  if (req.method === 'DELETE') {
    if (!joel) return res.status(403).json({ error: 'Agents cannot delete items' });
    const items = await readAll();
    if (req.query?.clearDone) {
      const kept = items.filter((t) => !t.done);
      await writeAll(kept);
      return res.status(200).json({ ok: true, removed: items.length - kept.length });
    }
    const id = req.query?.id;
    const kept = items.filter((t) => t.id !== id);
    await writeAll(kept);
    return res.status(200).json({ ok: true, removed: items.length - kept.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
