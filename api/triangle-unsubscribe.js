// api/_unsubscribe.js — CAN-SPAM unsubscribe token + endpoint.
//
// Skeleton cloned from bpquiz-site's unsubscribe mechanic. The state-machine
// engine (_state-cron.js) imports signUnsubToken to stamp a one-click
// List-Unsubscribe header on every email. The default export is the GET
// endpoint the link points at.
//
// Phase 2 (agent #4 — Email + delivery): finalized. The HMAC token secret is
// UNSUB_SECRET (falls back to CRON_SECRET). The GET endpoint writes the KV
// opt-out (unsubscribed:true) so the engine + crons skip the address, and
// returns a small branded confirmation page.

import crypto from 'node:crypto';
import { kv } from '@vercel/kv';

// 2026-08-02 — SECRET is read lazily, not at module scope. Local broadcast
// scripts import this module BEFORE their dotenv.config() runs (ESM imports
// are hoisted), so a module-scope read locked in the 'dev-unsub-secret'
// fallback and every locally-sent email carried a token the production
// endpoint rejected ("That link did not work" → spam complaints, CAN-SPAM
// exposure). Signing now reads env at call time; verification accepts any
// historical signing secret so links already sitting in inboxes work again.
const signingSecret = () => process.env.UNSUB_SECRET || process.env.CRON_SECRET || 'dev-unsub-secret';
const verifySecrets = () => [
  process.env.UNSUB_SECRET,
  process.env.CRON_SECRET,
  // Grandfather tokens minted by local scripts that fell back before this fix.
  // Tradeoff: a forged unsubscribe is possible for a known address — accepted,
  // because honoring every real unsubscribe click matters more.
  'dev-unsub-secret',
].filter(Boolean);

export function signUnsubToken({ email }) {
  const e = String(email || '').trim().toLowerCase();
  const sig = crypto.createHmac('sha256', signingSecret()).update(e).digest('hex').slice(0, 24);
  return Buffer.from(`${e}:${sig}`).toString('base64url');
}

export function verifyUnsubToken(token) {
  try {
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const idx = decoded.lastIndexOf(':');
    if (idx < 0) return null;
    const email = decoded.slice(0, idx);
    const sig = decoded.slice(idx + 1);
    for (const secret of verifySecrets()) {
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 24);
      if (sig === expected) return email;
    }
    return null;
  } catch {
    return null;
  }
}

function confirmationPage({ ok }) {
  const heading = ok ? 'You are unsubscribed' : 'That link did not work';
  const body = ok
    ? 'You will not get any more emails from this list. No hard feelings, and thank you for the time you spent here. Your kit links, if you bought one, never expire.'
    : 'This unsubscribe link is invalid or expired. If you keep getting emails you did not ask for, just reply to one and I will take you off by hand.';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading} . BraveWorks RN</title></head>
<body style="margin:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">
    <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#4A6741;font-weight:700;margin-bottom:24px;">BraveWorks RN</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2C3E50;margin:0 0 16px;">${heading}</h1>
    <p style="font-size:16px;line-height:1.6;color:#3A3A3A;margin:0;">${body}</p>
    <p style="font-size:12px;color:#9A9A9A;margin:40px 0 0;">BraveWorks RN &middot; Joel Polley, RN</p>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  const token = req.query?.token || '';
  const email = verifyUnsubToken(token);
  if (!email) {
    return res.status(400).send(confirmationPage({ ok: false }));
  }
  // Mark opt-out so the engine + crons skip this address. CAN-SPAM honors the
  // request whether or not we already have a record (create a tombstone if not).
  try {
    const dripKey = `bwbp:drip:${email}`;
    const existing = await kv.get(dripKey);
    const now = new Date().toISOString();
    if (existing) {
      await kv.set(dripKey, { ...existing, unsubscribed: true, unsubscribedAt: now });
    } else {
      await kv.set(dripKey, { email, unsubscribed: true, unsubscribedAt: now, source: 'unsub-direct' });
    }
  } catch (err) {
    // Even if the write fails, show success: the user did their part, and the
    // List-Unsubscribe header path remains. Log for follow-up.
    console.error('unsubscribe: KV write failed', err.message);
  }
  // 2026-07-03 — CROSS-MACHINE UNSUBSCRIBE (CAN-SPAM). The same address can
  // also live in the LEGACY drip:* machine (lead-cron + tier crons). One
  // click must stop ALL mail, so we tombstone the legacy record too.
  // Best-effort: a failure here never blocks the confirmation.
  try {
    const legacyKey = `drip:${email}`;
    const legacyExisting = await kv.get(legacyKey);
    const now = new Date().toISOString();
    if (legacyExisting) {
      if (!legacyExisting.unsubscribed) {
        await kv.set(legacyKey, { ...legacyExisting, unsubscribed: true, unsubscribedAt: now });
      }
    } else {
      await kv.set(legacyKey, {
        email,
        unsubscribed: true,
        unsubscribedAt: now,
        source: 'unsubscribe-cross-tombstone',
        lastSentDay: 0,
      });
    }
  } catch (err) {
    console.error('unsubscribe: legacy cross-tombstone failed', err.message);
  }
  return res.status(200).send(confirmationPage({ ok: true }));
}
