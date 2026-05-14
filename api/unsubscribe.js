// /api/unsubscribe — RFC 8058 one-click unsubscribe endpoint.
//
// Lead-magnet emails (and any future transactional/marketing email sent via
// Resend) include this URL in two places:
//   1. The List-Unsubscribe header (machine-readable, used by Gmail/Yahoo/etc)
//   2. A footer link in the email body (human-readable)
//
// The token is HMAC-signed so a recipient can't forge unsubscribes for other
// addresses. We also support a `tag` parameter to scope the unsubscribe (e.g.,
// only stop the post-quiz nurture without dropping them from broadcasts).
//
// Behavior:
//   - GET  → renders a friendly confirmation page + applies the unsubscribe
//   - POST → applies + returns 200 (RFC 8058 one-click)
//
// On unsubscribe we:
//   - Set `unsubscribed: true` on the Vercel KV drip:<email> record
//   - OR if `tag=foo` is present, just remove that tag (preserves drip)
//   - Return a confirmation
//
// 2026-05-14: switched from Mailchimp to Vercel KV as the canonical
// subscriber store. Mailchimp was retired; the old call was silently
// failing AND not actually unsubscribing anyone from the daily drip-cron.
// See unsubscribeInKV() below for the new implementation.
//
// Required env vars:
//   UNSUB_SECRET           — 32-byte random for HMAC signing
//   KV_REST_API_URL/TOKEN  — auto-set when Vercel KV is provisioned
//
// Token format: base64url(`${email}.${ts}.${tag||''}.${sig}`) where
//   sig = first 16 hex chars of HMAC-SHA256(SECRET, `${email}.${ts}.${tag||''}`)

import crypto from 'node:crypto';

const SECRET = process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
}

export function signUnsubToken({ email, tag = '' }) {
  const ts = Date.now();
  const payload = `${email.toLowerCase()}.${ts}.${tag}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyUnsubToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length < 4) return null;
    const sig = parts.pop();
    const payload = parts.join('.');
    const expected = sign(payload);
    if (sig !== expected) return null;
    const [email, ts, tag] = parts;
    return { email, ts: Number(ts), tag: tag || null };
  } catch {
    return null;
  }
}

// 2026-05-14: rewrote to update Vercel KV `drip:*` records as the canonical
// unsubscribe path. Previously called Mailchimp which has been retired —
// the API call returned 4xx every time, logged an error 18+ times/day, AND
// the subscriber NEVER actually got removed from the daily drip-cron sends
// (which keys off `sub.unsubscribed === true` in the KV record).
//
// New behavior:
//   - Reads `drip:<email>` from KV
//   - Sets `unsubscribed: true` and `unsubscribedAt: ISO timestamp`
//   - drip-cron.js line 90 then skips them on every daily fire
//   - If the subscriber isn't in KV (rare — direct beehiiv signup or
//     orphaned record), creates a tombstone record so future enrollments
//     for that email respect the unsubscribe preference
async function unsubscribeInKV({ email, tag }) {
  if (!process.env.KV_REST_API_URL) {
    return { ok: false, reason: 'kv_not_configured' };
  }
  // Lazy-import KV so the module loads cleanly if env vars aren't set
  const { kv } = await import('@vercel/kv');
  const cleanEmail = email.trim().toLowerCase();
  const key = `drip:${cleanEmail}`;
  try {
    const existing = await kv.get(key);
    const unsubAt = new Date().toISOString();
    if (existing) {
      // Tag-scoped unsubscribe = remove the tag, keep the subscription
      if (tag) {
        const newTags = (existing.tags || []).filter((t) => t !== tag);
        await kv.set(key, { ...existing, tags: newTags, lastTagRemoved: tag, lastTagRemovedAt: unsubAt });
        return { ok: true, scope: 'tag', tag };
      }
      // Full unsubscribe — set flag, keep enrollment data for audit
      await kv.set(key, { ...existing, unsubscribed: true, unsubscribedAt: unsubAt });
      return { ok: true, scope: 'full' };
    }
    // No existing record — create a tombstone so a future re-enrollment
    // respects the unsubscribe preference.
    await kv.set(key, {
      email: cleanEmail,
      unsubscribed: true,
      unsubscribedAt: unsubAt,
      source: 'unsubscribe-tombstone',
      lastSentDay: 0,
    });
    return { ok: true, scope: 'tombstone' };
  } catch (err) {
    console.error('unsubscribe: KV update failed', err.message);
    return { ok: false, reason: err.message };
  }
}

const CONFIRMATION_HTML = (email) => `<!doctype html>
<html><head>
<meta charset="utf-8" />
<title>Unsubscribed — BraveWorks RN</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: Georgia, serif; background: #FBF8F1; color: #2C3E50; margin: 0; padding: 32px 16px; }
  .card { max-width: 480px; margin: 64px auto 0; background: #FFFFFF; border-radius: 18px; border: 1px solid rgba(0,0,0,0.06); padding: 32px 28px; }
  h1 { font-size: 24px; font-weight: 500; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; color: #3A3A3A; }
  .email { font-family: monospace; background: #F5F1E8; padding: 2px 6px; border-radius: 4px; }
  a { color: #B85A36; }
</style>
</head>
<body>
  <div class="card">
    <h1>You're unsubscribed.</h1>
    <p>The address <span class="email">${email}</span> has been removed from BraveWorks RN emails.</p>
    <p style="font-size: 13px; color: #5A5A5A;">If this was a mistake, just take the BP quiz again at <a href="https://bpquiz.com">bpquiz.com</a> to resubscribe.</p>
    <p style="font-size: 13px; color: #5A5A5A;">— Joel</p>
  </div>
</body></html>`;

export default async function handler(req, res) {
  const token = (req.query?.token) || (req.body?.token);
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const verified = verifyUnsubToken(token);
  if (!verified) return res.status(400).json({ error: 'Invalid token' });

  const { email, tag } = verified;

  const result = await unsubscribeInKV({ email, tag });
  if (!result.ok && result.reason !== 'kv_not_configured') {
    console.error('unsubscribe: KV update failed', result.reason);
    // Soft-fail — still confirm to user; we'd rather over-confirm than block.
  } else if (result.ok) {
    console.log(`unsubscribe: KV ${result.scope} for ${email}${tag ? ' (tag=' + tag + ')' : ''}`);
  }

  // POST = RFC 8058 one-click — bare 200 with no body.
  if (req.method === 'POST') return res.status(200).end();

  // GET = browser visit — friendly confirmation page.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(CONFIRMATION_HTML(email));
}
