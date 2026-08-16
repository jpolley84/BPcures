// api/shopify-customer-webhook.js — Shopify customers -> the KV drip -> Resend.
//
// WHY (2026-08-16, Joel): the community popup on hormoneteas.com writes email
// into Shopify's own customer list, where it just sits. Nothing on bpquiz.com
// knows those people exist, so they never enter the state machine and Resend
// never sends them anything. This is the bridge.
//
// Subscribe to customers/create AND customers/update in Shopify. Update matters
// as much as create: a checkout customer who ticks the marketing box LATER only
// ever produces an update, and without it we would miss them forever.
//
// ── THE CONSENT RULE, WHICH IS THE WHOLE POINT ──────────────────────────
// Only customers whose email_marketing_consent.state === 'subscribed' are
// written. A buyer who checked out WITHOUT ticking the marketing box is NOT a
// subscriber, and adding them to a drip would be exactly the CAN-SPAM problem
// the unsubscribe work in this codebase exists to avoid. Skips are logged with
// the reason so a "why is nobody importing" question has an answer in the logs
// rather than a guess.
//
// Reuses the drip record shape from api/capture-lead.js on purpose: same
// `bwbp:drip:<email>` key, same fields, same enrich-never-clobber rule. A tea
// subscriber who later takes the quiz (or the reverse) must be ONE person in
// one sequence, not two records racing each other.
//
// HMAC verification is the same helper the order webhook uses, so both Shopify
// endpoints share one trust model and one secret.

import crypto from 'node:crypto';
import { kv } from '@vercel/kv';

// Raw body is required for HMAC: Vercel's parser would reformat the JSON and
// every signature check would fail. Identical to shopify-tea-webhook.js.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function verifyShopifyHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(hmacHeader), 'utf8');
  // Length check first: timingSafeEqual THROWS on a length mismatch.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Shopify has shipped several consent shapes over the years. Read the modern
 * one first, fall back to the legacy boolean, and treat anything unrecognized
 * as NOT subscribed. Defaulting to "yes" here would mail people who never
 * agreed, so the ambiguous case must always fail closed.
 */
export function isSubscribed(customer) {
  const c = customer?.email_marketing_consent;
  if (c && typeof c.state === 'string') return c.state.toLowerCase() === 'subscribed';
  if (typeof customer?.accepts_marketing === 'boolean') return customer.accepts_marketing;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('shopify-customer-webhook: SHOPIFY_WEBHOOK_SECRET missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('shopify-customer-webhook: could not read body', err.message);
    return res.status(400).json({ error: 'bad_body' });
  }

  if (!verifyShopifyHmac(rawBody, req.headers['x-shopify-hmac-sha256'], secret)) {
    // 401 on a bad signature. Anyone can POST here; only Shopify can sign.
    console.warn('shopify-customer-webhook: HMAC verification failed');
    return res.status(401).json({ error: 'bad_signature' });
  }

  let customer;
  try {
    customer = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'bad_json' });
  }

  const email = String(customer?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(200).json({ ok: true, skipped: 'no_email' });
  }

  if (!isSubscribed(customer)) {
    // 200, not an error: Shopify fired correctly, we simply decline to enroll.
    // Returning non-200 would make Shopify retry forever for every guest buyer.
    console.log('shopify-customer-webhook: skip, not subscribed',
      email, customer?.email_marketing_consent?.state ?? 'no_consent_field');
    return res.status(200).json({ ok: true, skipped: 'not_subscribed' });
  }

  const topic = String(req.headers['x-shopify-topic'] || 'customers/unknown');
  const firstName = String(customer?.first_name || '').trim().slice(0, 60);
  const dripKey = `bwbp:drip:${email}`;

  try {
    const existing = await kv.get(dripKey);

    if (existing) {
      // Enrich only, mirroring capture-lead.js. Never clobber state or
      // stateEnteredAt: this person may be mid-sequence, and resetting the
      // timer would re-send emails they already got.
      await kv.set(dripKey, {
        ...existing,
        firstName: existing.firstName || firstName,
        tags: Array.from(new Set([...(existing.tags || []), 'tea-community'])),
        shopifyCustomerId: existing.shopifyCustomerId || customer?.id || null,
        lastCaptureAt: new Date().toISOString(),
      });
      console.log('shopify-customer-webhook: enriched existing lead', email, topic);
      return res.status(200).json({ ok: true, created: false, enriched: true });
    }

    const now = new Date().toISOString();
    await kv.set(dripKey, {
      email,
      firstName,
      phone: '',
      corner: null,
      readiness: null,
      scores: null,
      state: 'lead',
      stateEnteredAt: now,
      enrolledAt: now,
      source: 'tea-community-popup',
      tags: ['tea-community'],
      shopifyCustomerId: customer?.id || null,
    });
    console.log('shopify-customer-webhook: NEW drip lead', email, topic);
    return res.status(200).json({ ok: true, created: true });
  } catch (err) {
    // 500 so Shopify retries. Losing a subscriber to a transient KV blip is
    // worse than a duplicate webhook, and the upsert above is idempotent.
    console.error('shopify-customer-webhook: KV write failed', err.message);
    return res.status(500).json({ error: 'kv_write_failed' });
  }
}
