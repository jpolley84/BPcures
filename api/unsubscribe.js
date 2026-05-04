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
//   - Remove the contact from the master Mailchimp list (status: 'unsubscribed')
//   - OR if `tag=foo` is present, just remove that tag (preserves broadcasts)
//   - Return a confirmation
//
// Required env vars:
//   UNSUB_SECRET       — 32-byte random for HMAC signing (any high-entropy string)
//   MAILCHIMP_API_KEY  — already set
//   MAILCHIMP_LIST_ID  — defaults to '1550e2956c'
//
// Token format: base64url(`${email}.${ts}.${tag||''}.${sig}`) where
//   sig = first 16 hex chars of HMAC-SHA256(SECRET, `${email}.${ts}.${tag||''}`)

import crypto from 'node:crypto';

const SECRET = process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '1550e2956c';

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

async function mcUnsubscribe({ email, tag }) {
  if (!MAILCHIMP_API_KEY) {
    console.warn('unsubscribe: MAILCHIMP_API_KEY not set, skipping');
    return { ok: false, reason: 'no_key' };
  }
  const dc = MAILCHIMP_API_KEY.split('-').pop();
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
  const auth = `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`;
  const subscriberHash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');

  if (tag) {
    // Tag-scoped unsubscribe — remove just one tag, leave the contact subscribed.
    const r = await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: [{ name: tag, status: 'inactive' }] }),
    });
    return { ok: r.ok, status: r.status };
  }

  // Full unsubscribe — flip status.
  const r = await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`, {
    method: 'PATCH',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'unsubscribed' }),
  });
  return { ok: r.ok, status: r.status };
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

  const result = await mcUnsubscribe({ email, tag });
  if (!result.ok && result.reason !== 'no_key') {
    console.error('unsubscribe: mailchimp call failed', result.status);
    // Soft-fail — still confirm to user; we'd rather over-confirm than block.
  }

  // POST = RFC 8058 one-click — bare 200 with no body.
  if (req.method === 'POST') return res.status(200).end();

  // GET = browser visit — friendly confirmation page.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(CONFIRMATION_HTML(email));
}
