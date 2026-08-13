// api/shopify-tea-webhook.js — Shopify → tea ledger bridge.
//
// WHY THIS EXISTS (2026-08-03): hormoneteas.com was repointed to the Shopify
// store h1vygf-kk, so tea orders placed there never touched the KV ledger that
// every fulfillment surface is built on — no `/ops` worklist row, no nightly
// shipping digest line, no "your tea is on its way" email. The first Shopify
// order (#1001, Vernetha Jackson, 2026-08-02) was found only by opening the
// Shopify admin by hand. This endpoint closes that gap: a paid Shopify order
// lands in `tea:order:*` in exactly the shape recordTeaSale() writes, so it
// flows through the digest, /ops, and scripts/tea-mark-fulfilled.mjs with no
// downstream changes anywhere.
//
// Registered in Shopify: Settings → Notifications → Webhooks
//   URL:    https://bpquiz.com/api/shopify-tea-webhook
//   Topics: "Order payment" (orders/paid)      → writes the ledger row
//           "Order cancelled" (orders/cancelled) → takes it off the worklist
//   Format: JSON
// Env: SHOPIFY_WEBHOOK_SECRET (the signing secret Shopify shows on that page).
//
// DELIBERATELY NOT DONE HERE:
//   - No buyer RECEIPT. Shopify already sends its own order confirmation; ours
//     would be a second, conflicting invoice. The shipped notice still fires
//     normally later, because that is driven by the ledger row this endpoint
//     creates (mark-fulfilled → sendTeaShipped).
//   - UPDATE 2026-08-13 (Joel): we DO now send a brewing/onboarding email via
//     _tea-welcome-email.js. It is explicitly not a receipt (no totals, no line
//     items, and it says so in the first line) — it carries the steeping method,
//     the 30-day promise and the not-a-medicine line, none of which fit in
//     Shopify's template. Kill switch: TEA_WELCOME_EMAIL=0.
//   - No Resend "Tea Buyers" audience tag and no PostHog purchase capture.
//     Those are marketing side effects on the Stripe path; flip
//     SHOPIFY_BRIDGE_TAG_AUDIENCE=1 to opt the audience tag in.
//
// Failure semantics mirror the Stripe webhook: a bad signature is 401, an
// ignored topic is 200, and a genuine KV failure is 500 so Shopify RETRIES
// (~48h with backoff) rather than silently dropping a paid order on the floor.

import crypto from 'node:crypto';
import { kv } from '@vercel/kv';
import { chicagoDateKey } from './triangle-webhook.js';
import { sendTeaWelcome, firstNameOf } from './_tea-welcome-email.js';

// Shopify posts the raw JSON body and signs those exact bytes. Vercel's body
// parser would re-serialize and break the HMAC, so read the stream ourselves.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Shopify's HMAC is base64 SHA-256 of the raw body under the shared secret.
// timingSafeEqual needs equal lengths, so length-check before comparing.
export function verifyShopifyHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(hmacHeader), 'utf8');
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}

// Steady vs Satin. The store currently sells the merged "Steady" product, but
// a Satin SKU could land here later. ops-orders.js re-derives blend from
// items[0].name with /satin/i, so the composed item name below must carry the
// blend word for the dashboard and the stored field to agree.
export function blendOfOrder(order) {
  const haystack = (order.line_items || [])
    .map((li) => `${li.title || ''} ${li.variant_title || ''}`)
    .join(' ');
  return /satin/i.test(haystack) ? 'satin' : 'steady';
}

// "Steady" + "1-Month Supply (100g pouch)" -> "SVUTU Steady — 1-Month Supply
// (100g pouch)", matching the Stripe-path naming so both rails read alike in
// the digest and on the packing list.
export function mapLineItems(order, blend) {
  const brand = blend === 'satin' ? 'SVUTU Satin' : 'SVUTU Steady';
  return (order.line_items || []).map((li) => {
    const title = String(li.title || 'Tea').trim();
    const variant = String(li.variant_title || '').trim();
    // The Shopify product is just "Steady", so `${brand} — ${title}` would read
    // "SVUTU Steady — Steady". Collapse when the brand already contains the title.
    const base =
      /^svutu/i.test(title) || brand.toLowerCase().includes(title.toLowerCase())
        ? (/^svutu/i.test(title) ? title : brand)
        : `${brand} — ${title}`;
    return {
      name: variant && !/^default title$/i.test(variant) ? `${base} — ${variant}` : base,
      qty: li.quantity || 1,
    };
  });
}

export function mapAddress(order) {
  const a = order.shipping_address || order.billing_address || {};
  return {
    line1: a.address1 || '',
    line2: a.address2 || '',
    city: a.city || '',
    state: a.province_code || a.province || '',
    postal_code: a.zip || '',
    country: a.country_code || a.country || '',
  };
}

// Total the customer actually paid, shipping included. Shopify charges $8
// shipping where the Stripe tea rail shipped free, so this figure is the money
// received, not the product subtotal.
export function amountCentsOf(order) {
  const total = parseFloat(order.total_price ?? order.current_total_price ?? '0');
  return Number.isFinite(total) ? Math.round(total * 100) : 0;
}

// Build the ledger record. Same field-for-field shape as recordTeaSale() so
// tea-daily-cron.js, ops-orders.js and tea-mark-fulfilled.mjs all treat a
// Shopify order identically to a Stripe one.
export function buildLedgerRecord(order) {
  const blend = blendOfOrder(order);
  const a = order.shipping_address || order.billing_address || {};
  const name =
    [a.first_name, a.last_name].filter(Boolean).join(' ').trim() ||
    a.name ||
    [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ').trim() ||
    '';
  return {
    // Shopify's created_at is the true order time; fall back to now.
    at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    sessionId: `shopify-${order.id}`,
    blend,
    email: order.email || order.contact_email || order.customer?.email || '',
    name,
    items: mapLineItems(order, blend),
    amountCents: amountCentsOf(order),
    subscription: false,
    source: 'shopify',
    address: mapAddress(order),
    // Shopify-only context, ignored by the shared surfaces but invaluable when
    // reconciling a row against the store admin.
    shopifyOrderId: String(order.id),
    shopifyOrderNumber: order.name || '',
  };
}

async function handleOrderPaid(order) {
  const dedupeId = `shopify-${order.id}`;
  const dedupeKey = `tea:sale:${dedupeId}`;

  // Shopify retries; never double-write a row a human may already have acted on.
  const already = await kv.get(dedupeKey).catch(() => null);
  if (already) return { recorded: false, deduplicated: true, id: dedupeId };

  const record = buildLedgerRecord(order);

  // Permanent per-order ledger — the source of truth for every worklist.
  await kv.set(`tea:order:${dedupeId}`, { ...record, fulfilled: false, fulfilledAt: null });

  // Redundant 21-day day-bucket, written for parity with the Stripe path.
  try {
    const dayKey = `tea:sales:${chicagoDateKey()}`;
    await kv.rpush(dayKey, JSON.stringify(record));
    await kv.expire(dayKey, 60 * 60 * 24 * 21);
  } catch (err) {
    console.warn('shopify-tea-webhook: day-bucket write failed (non-fatal)', err.message);
  }

  // Optional parity with the Stripe path's marketing tag. Off unless asked for.
  if (process.env.SHOPIFY_BRIDGE_TAG_AUDIENCE === '1' && record.blend === 'steady' && record.email) {
    try {
      const [first, ...rest] = String(record.name).trim().split(/\s+/);
      await fetch(`https://api.resend.com/audiences/${process.env.TEA_AUDIENCE_ID || 'e70381dc-129d-45a4-9eff-e51e90e8da2b'}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: record.email.toLowerCase(), first_name: first || '', last_name: rest.join(' '), unsubscribed: false }),
      });
    } catch (err) {
      console.warn('shopify-tea-webhook: audience tag failed (non-fatal)', err.message);
    }
  }

  await kv.set(dedupeKey, { recordedAt: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 }).catch(() => {});

  // Brewing/onboarding email. NOT a receipt: Shopify already sent one, and a
  // second invoice would just confuse her. This carries the steeping method,
  // the 30-day promise and the not-a-medicine line, which Shopify's template
  // cannot. Guarded by its own NX key so a Shopify retry cannot double-send,
  // and set BEFORE the send so a crash mid-send fails closed (a missed email
  // beats a duplicate one). Entirely non-fatal: the ledger row above is what
  // fulfillment depends on, and it is already committed.
  let welcomed = false;
  if (record.blend === 'steady' && record.email && process.env.TEA_WELCOME_EMAIL !== '0') {
    try {
      const claimed = await kv.set(`tea:welcome:${dedupeId}`, new Date().toISOString(), {
        nx: true,
        ex: 60 * 60 * 24 * 30,
      });
      if (claimed) {
        const out = await sendTeaWelcome({ email: record.email, firstName: firstNameOf(record.name) });
        welcomed = out.sent;
        if (!out.sent) console.warn(`shopify-tea-webhook: welcome email not sent (${out.reason})`);
      }
    } catch (err) {
      console.warn('shopify-tea-webhook: welcome email step failed (non-fatal)', err.message);
    }
  }

  return { recorded: true, id: dedupeId, blend: record.blend, amountCents: record.amountCents, email: record.email, welcomed };
}

// A cancelled or fully-refunded order must leave the open worklist so nobody
// ships it. The digest and /ops both key "open" off `fulfilled`, so we set that
// flag and carry a loud note explaining why, rather than deleting the money
// record. If the row was already shipped, we leave it alone and just note it.
async function handleOrderCancelled(order) {
  const id = `tea:order:shopify-${order.id}`;
  const existing = await kv.get(id).catch(() => null);
  if (!existing) return { updated: false, reason: 'not_in_ledger' };
  const alreadyShipped = !!existing.fulfilled && !existing.cancelledAt;
  await kv.set(id, {
    ...existing,
    cancelledAt: new Date().toISOString(),
    fulfilled: true, // keeps it off the open worklist
    fulfilledAt: existing.fulfilledAt || new Date().toISOString(),
    opsNote: alreadyShipped
      ? 'CANCELLED in Shopify AFTER it shipped — check whether a refund is owed'
      : 'CANCELLED in Shopify — do not ship',
  });
  return { updated: true, alreadyShipped };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('shopify-tea-webhook: SHOPIFY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const rawBody = await readRawBody(req);
  if (!verifyShopifyHmac(rawBody, req.headers['x-shopify-hmac-sha256'], secret)) {
    console.error('shopify-tea-webhook: HMAC verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const topic = String(req.headers['x-shopify-topic'] || '');
  let order;
  try {
    order = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (!order?.id) return res.status(400).json({ error: 'Missing order id' });

  try {
    if (topic === 'orders/paid') {
      const result = await handleOrderPaid(order);
      console.log('shopify-tea-webhook: orders/paid', JSON.stringify(result));
      return res.status(200).json({ ok: true, topic, ...result });
    }
    if (topic === 'orders/cancelled') {
      const result = await handleOrderCancelled(order);
      console.log('shopify-tea-webhook: orders/cancelled', JSON.stringify(result));
      return res.status(200).json({ ok: true, topic, ...result });
    }
    return res.status(200).json({ ok: true, ignored: topic });
  } catch (err) {
    // 500 so Shopify retries — a paid order must never be lost to a transient
    // KV failure (the exact way order #1001 went missing in the first place).
    console.error('shopify-tea-webhook: processing failed', topic, err.message);
    return res.status(500).json({ error: 'Processing failed' });
  }
}
