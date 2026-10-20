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

// 2026-07-16 GRACE SECRET. UNSUB_SECRET was never set in prod, so every
// token sent before today (including the 6,313-recipient freegift broadcast)
// is signed with the old fallback string. Now that a real UNSUB_SECRET is
// set, those in-flight links MUST keep working (CAN-SPAM) — so verification
// accepts the legacy secret for tokens whose embedded timestamp predates the
// grace deadline. New tokens are signed ONLY with the real secret. Remove
// GRACE_* after 2027-07-01.
const GRACE_SECRET = 'CHANGE-ME-IN-VERCEL-ENV';
const GRACE_DEADLINE_MS = Date.parse('2027-07-01T00:00:00Z');

function signWith(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
}

function sign(payload) {
  return signWith(SECRET, payload);
}

export function signUnsubToken({ email, tag = '' }) {
  const ts = Date.now();
  const payload = `${email.toLowerCase()}.${ts}.${tag}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

// 2026-10-16 FIX: there are TWO token shapes in the wild and this function
// understood only one of them.
//   4-field  `email.ts.tag.sig`   minted here by signUnsubToken()
//   3-field  `email.ts.sig`       minted by _cohort-broadcast.js, which never
//                                 had a tag field
// The old code always popped three fields, so on a 3-field token it read the
// signature, then took the TIMESTAMP as the tag and the address's TLD as the
// timestamp, leaving `email` short by its last dot segment. Every broadcast
// built on _cohort-broadcast.js (both WMD endpoints, both encore endpoints,
// masterclass, heart month, seminar, birthday, the cohort crons, restoreher
// replay) therefore unsubscribed "person@hotmail" instead of
// "person@hotmail.com" and then showed the recipient a confirmation page
// saying they had been removed. That is a CAN-SPAM problem, and it is how
// bongi269@hotmail.com kept receiving mail after unsubscribing twice.
//
// Rather than guess the shape from the field count, try both parses and keep
// whichever one the signature actually validates. The HMAC decides, so a
// malformed or forged token still fails closed.
export function verifyUnsubToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];

    // Candidate parses. Each yields the exact payload string its minter
    // signed, so the signature check below tells us which one is real.
    const candidates = [];
    if (parts.length >= 4) {
      const email = parts.slice(0, -3).join('.');
      const ts = parts[parts.length - 3];
      const tag = parts[parts.length - 2];
      candidates.push({ email, ts, tag, payload: `${email}.${ts}.${tag}` });
    }
    {
      const email = parts.slice(0, -2).join('.');
      const ts = parts[parts.length - 2];
      // Two payload shapes share this token string, so try both:
      //   `email.ts`   the original 3-field minter
      //   `email.ts.`  _cohort-broadcast.js signs WITH a trailing separator but
      //                emits only `email.ts.sig`, dropping the empty tag field.
      //                Missing this candidate 400'd every broadcast unsubscribe
      //                link, including the 20,022 launch emails on 2026-10-19.
      candidates.push({ email, ts, tag: '', payload: `${email}.${ts}` });
      candidates.push({ email, ts, tag: '', payload: `${email}.${ts}.` });
    }

    for (const c of candidates) {
      if (!c.email.includes('@')) continue;
      // The timestamp must be digits. Without this, a 3-field token's 4-field
      // parse yields payload `local@domain . tld . ts`, which is exactly what
      // the 3-field minter signed, so the signature validates against an email
      // missing its TLD. That candidate always has a non-numeric ts (the TLD),
      // so this one check is what makes the right candidate win.
      if (!/^\d+$/.test(String(c.ts))) continue;
      const tsNum = Number(c.ts);
      const current = signWith(SECRET, c.payload);
      // Legacy-signed tokens: honored only while the grace window is open and
      // only for tokens minted before the deadline (timestamp is inside the
      // signed payload, so it can't be forged forward).
      const grace =
        SECRET !== GRACE_SECRET && Date.now() < GRACE_DEADLINE_MS && tsNum < GRACE_DEADLINE_MS
          ? signWith(GRACE_SECRET, c.payload)
          : null;
      if (sig === current || sig === grace) {
        return { email: c.email, ts: tsNum, tag: c.tag || null };
      }
    }
    return null;
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
      await tombstoneTriangleRecord({ kv, cleanEmail, unsubAt });
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
    await tombstoneTriangleRecord({ kv, cleanEmail, unsubAt });
    return { ok: true, scope: 'tombstone' };
  } catch (err) {
    console.error('unsubscribe: KV update failed', err.message);
    return { ok: false, reason: err.message };
  }
}

// 2026-07-03 — CROSS-MACHINE UNSUBSCRIBE (CAN-SPAM). The same address can
// live in BOTH email machines: the legacy drip:* store (this endpoint) and
// the triangle bwbp:drip:* store (triangle-unsubscribe.js). One click must
// stop ALL mail, so a full unsubscribe here also tombstones the triangle
// record. Best-effort: a failure here never blocks the primary unsubscribe.
async function tombstoneTriangleRecord({ kv, cleanEmail, unsubAt }) {
  try {
    const triKey = `bwbp:drip:${cleanEmail}`;
    const triExisting = await kv.get(triKey);
    if (triExisting) {
      if (!triExisting.unsubscribed) {
        await kv.set(triKey, { ...triExisting, unsubscribed: true, unsubscribedAt: unsubAt });
      }
    } else {
      await kv.set(triKey, {
        email: cleanEmail,
        unsubscribed: true,
        unsubscribedAt: unsubAt,
        source: 'unsubscribe-cross-tombstone',
      });
    }
  } catch (err) {
    console.error('unsubscribe: triangle cross-tombstone failed', err.message);
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

// 2026-07-10 — LEGACY braveworks-bp TOKENS. Every drip email sent by the
// retired braveworks-bp deployment (pre-2026-07-05) carries an unsubscribe
// link of the form braveworks-bp.vercel.app/api/unsubscribe?token=<T>, and
// that domain now redirects wholesale to bpquiz.com — meaning those tokens
// land HERE. Their format is base64url(`${email}:${sig24}`) where sig24 is
// the first 24 hex chars of HMAC-SHA256(UNSUB_SECRET||CRON_SECRET, email)
// (see braveworks-bp/api/unsubscribe.js). Without this fallback every one
// of those recipients gets a 400 instead of an unsubscribe — a CAN-SPAM
// problem. Full-scope only (legacy tokens carry no tag).
function verifyLegacyBwbpToken(token) {
  try {
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const idx = decoded.lastIndexOf(':');
    if (idx === -1) return null;
    const email = decoded.slice(0, idx);
    const sig = decoded.slice(idx + 1);
    if (!email.includes('@') || !/^[0-9a-f]{24}$/.test(sig)) return null;
    for (const secret of [process.env.UNSUB_SECRET, process.env.CRON_SECRET]) {
      if (!secret) continue;
      const expected = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 24);
      if (sig === expected) return { email, ts: null, tag: null };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const token = (req.query?.token) || (req.body?.token);
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const verified = verifyUnsubToken(token) || verifyLegacyBwbpToken(token);
  if (!verified) return res.status(400).json({ error: 'Invalid token' });

  // 2026-07-16: tag-scoped unsubscribes (remove one tag, keep the
  // subscription) are honored ONLY for tags in this allowlist. Any other tag
  // (e.g. 'freegift-broadcast', used purely as a campaign label in tokens)
  // must behave as a FULL unsubscribe — the email's link says "Unsubscribe",
  // and anything less is a CAN-SPAM problem.
  const TAG_SCOPED = new Set([]);
  const { email } = verified;
  const tag = verified.tag && TAG_SCOPED.has(verified.tag) ? verified.tag : null;

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
