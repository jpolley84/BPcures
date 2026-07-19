// /api/ops-orders — order management for the /ops dashboard.
//
// 2026-07-19 (Joel): "a dashboard I can log into and see all these orders and
// mark them fulfilled or pending or new, same with bpquiz.com kits and upsells."
//
// GET  -> { tea: [...], kits: [...], summary: {...} }
// POST -> { id, status } marks a TEA order new | pending | fulfilled
//
// Auth: same X-Ops-Pass header + OPS_DASHBOARD_PASSWORD as /api/ops-state.
//
// TEA orders are the permanent KV ledger (tea:order:*) written by
// recordTeaSale(). They are physical goods, so they carry real fulfillment
// state. IMPORTANT: api/tea-daily-cron.js keys its open/fulfilled lists off
// the boolean `fulfilled`, so we keep that in sync with `status` on every
// write, or the shipping digest and this dashboard would disagree.
//
// KIT / upsell orders are DIGITAL and auto-delivered by the webhook, so they
// are read-only here (a ledger to see, not a worklist). Sourced from Stripe
// charges so nothing is missed when a KV write failed.
import { kv } from '@vercel/kv';
import { sendTeaShipped, firstNameOf } from './_tea-shipped-email.js';
import Stripe from 'stripe';
import crypto from 'node:crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── Auth (mirrors ops-state.js) ─────────────────────────────────────
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a, 'utf8'), B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  try { return crypto.timingSafeEqual(A, B); } catch { return false; }
}
function checkAuth(req) {
  const expected = process.env.OPS_DASHBOARD_PASSWORD;
  if (!expected) return false;
  const supplied = req.headers['x-ops-pass'] || '';
  return constantTimeEqual(String(supplied), String(expected));
}

const VALID_STATUS = new Set(['new', 'pending', 'fulfilled']);

// Amount -> product label for the Stripe-sourced digital ledger.
const AMOUNT_LABEL = {
  1700: '$17 Reset Kit',
  2700: '$27 Complete upgrade (OTO)',
  4700: '$47 Complete Kit',
  9700: '$97 Sprint (buyer flash)',
  29700: '$297 Sprint / Case Review',
  9900: '$99 Sprint 3-pay',
  199700: '$1,997 Coaching',
  69700: '$697 Coaching 3-pay',
  1299: '$12.99 BP Cures book',
};
// Tea amounts live in the KV ledger; exclude them from the digital list so a
// tea sale is never double-counted across both tables.
const TEA_AMOUNTS = new Set([4800, 12000]);

function statusOf(o) {
  if (o.status && VALID_STATUS.has(o.status)) return o.status;
  return o.fulfilled ? 'fulfilled' : 'new';
}
function blendOf(o) {
  const n = (o.items && o.items[0] && o.items[0].name) || '';
  return /satin/i.test(n) ? 'satin' : 'steady';
}

async function loadTea() {
  let cursor = '0';
  const keys = [];
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'tea:order:*', count: 500 });
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');
  const rows = [];
  for (let i = 0; i < keys.length; i += 50) {
    const slice = keys.slice(i, i + 50);
    const vals = await Promise.all(slice.map((k) => kv.get(k).catch(() => null)));
    vals.forEach((o, j) => {
      if (!o) return;
      rows.push({
        id: slice[j],
        date: o.at || null,
        email: (o.email || '').toLowerCase(),
        name: o.name || '',
        blend: blendOf(o),
        item: (o.items && o.items[0] && o.items[0].name) || '',
        qty: (o.items && o.items[0] && o.items[0].qty) || 1,
        amountCents: o.amountCents || 0,
        address: o.address || null,
        subscription: !!o.subscription,
        status: statusOf(o),
        fulfilledAt: o.fulfilledAt || null,
        note: o.fulfilledNote || o.opsNote || '',
        // Flag the known bad-data case so Joel does not ship blind.
        addressLooksLikeName: !!(o.name && o.address && o.name === o.address.line1),
      });
    });
  }
  rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return rows;
}

// excludeIds: payment ids already present in the TEA ledger. The $17 1-Week
// Sampler (prod_Upwbtp9VC0HglB) collides exactly with the $17 Reset Kit price,
// so amount alone cannot tell them apart. Samplers were backfilled into the tea
// ledger keyed by payment id (scripts/backfill-sampler-orders-2026-07-19.mjs);
// excluding those ids here is what keeps a sampler from showing up as BOTH a
// tea order and a "$17 Reset Kit" in the digital list.
async function loadKits(limit = 100, excludeIds = new Set()) {
  const out = [];
  try {
    const charges = await stripe.charges.list({ limit });
    for (const c of charges.data) {
      if (c.status !== 'succeeded' || c.refunded) continue;
      if (TEA_AMOUNTS.has(c.amount)) continue; // tea lives in the KV ledger
      const pi = typeof c.payment_intent === 'string' ? c.payment_intent : c.payment_intent?.id;
      if (excludeIds.has(c.id) || (pi && excludeIds.has(pi))) continue; // already a tea order
      const md = c.metadata || {};
      const label =
        AMOUNT_LABEL[c.amount] ||
        (md.offer || md.kind || md.tier ? `${md.offer || md.kind || md.tier}` : `$${(c.amount / 100).toFixed(2)}`);
      out.push({
        id: c.id,
        date: new Date(c.created * 1000).toISOString(),
        email: (c.billing_details?.email || c.receipt_email || '').toLowerCase(),
        name: c.billing_details?.name || '',
        label,
        amountCents: c.amount,
        corner: md.corner || '',
        funnel: md.funnel || md.brand || '',
        refunded: !!c.refunded,
      });
    }
  } catch (err) {
    return { error: err.message, rows: [] };
  }
  return { rows: out };
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  // ── Mark a tea order new | pending | fulfilled ──
  if (req.method === 'POST') {
    const { id, status, note } = req.body || {};
    if (!id || typeof id !== 'string' || !id.startsWith('tea:order:')) {
      return res.status(400).json({ error: 'Valid tea order id required' });
    }
    if (!VALID_STATUS.has(status)) {
      return res.status(400).json({ error: 'status must be new, pending, or fulfilled' });
    }
    try {
      const existing = await kv.get(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });
      const now = new Date().toISOString();
      // Only a NEW transition into fulfilled earns a shipped email, so
      // re-saving an already-shipped order never re-notifies the buyer.
      const newlyFulfilled = status === 'fulfilled' && !existing.fulfilled;
      await kv.set(id, {
        ...existing,
        status,
        // Keep the boolean in sync: tea-daily-cron's open/fulfilled lists read it.
        fulfilled: status === 'fulfilled',
        fulfilledAt: status === 'fulfilled' ? (existing.fulfilledAt || now) : null,
        ...(typeof note === 'string' && note ? { opsNote: note.slice(0, 300) } : {}),
        ...(newlyFulfilled ? { shippedEmailAt: now } : {}),
        statusUpdatedAt: now,
      });

      // Tell the buyer their tea is on the way. Analytics of the human kind:
      // before this existed, orders shipped silently and buyers wrote in asking
      // where their tea was. Never blocks the status write.
      let notified = false;
      if (newlyFulfilled) {
        notified = await sendTeaShipped({
          email: existing.email,
          firstName: firstNameOf(existing.name),
          blend: existing.blend || 'steady',
          items: existing.items,
          orderRef: String(existing.sessionId || '').slice(-8).toUpperCase(),
        });
      }
      return res.status(200).json({ ok: true, id, status, notified });
    } catch (err) {
      console.error('ops-orders POST failed', err.message);
      return res.status(500).json({ error: 'Update failed' });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Tea first: its payment ids are what de-duplicate the Stripe-sourced list.
  const tea = await loadTea().catch((e) => ({ error: e.message }));
  const teaRows = Array.isArray(tea) ? tea : [];
  const teaPaymentIds = new Set(teaRows.map((r) => String(r.id).replace(/^tea:order:/, '')));
  const kits = await loadKits(100, teaPaymentIds).catch((e) => ({ error: e.message, rows: [] }));

  const kitRows = kits.rows || [];
  const sum = (rows) => rows.reduce((n, r) => n + (r.amountCents || 0), 0);
  const byStatus = (s) => teaRows.filter((r) => r.status === s);

  return res.status(200).json({
    tea: teaRows,
    teaError: Array.isArray(tea) ? null : tea.error || null,
    kits: kitRows,
    kitsError: kits.error || null,
    summary: {
      teaTotal: teaRows.length,
      teaNew: byStatus('new').length,
      teaPending: byStatus('pending').length,
      teaFulfilled: byStatus('fulfilled').length,
      teaOpenRevenueCents: sum(teaRows.filter((r) => r.status !== 'fulfilled')),
      teaRevenueCents: sum(teaRows),
      teaSteady: teaRows.filter((r) => r.blend === 'steady').length,
      teaSatin: teaRows.filter((r) => r.blend === 'satin').length,
      kitCount: kitRows.length,
      kitRevenueCents: sum(kitRows),
    },
    generatedAt: new Date().toISOString(),
  });
}
