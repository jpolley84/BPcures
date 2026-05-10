// Resend webhook handler — auto-suppress on bounce + alert on complaint.
//
// Setup (one-time, manual): in the Resend dashboard → Webhooks → Add endpoint:
//   URL:    https://bpquiz.com/api/resend-bounce
//   Events: email.bounced, email.complained, email.delivered (delivered for telemetry only)
//   Save the signing secret to Vercel env as RESEND_WEBHOOK_SECRET (optional but recommended).
//
// Behavior:
//   - email.bounced       → mark contact unsubscribed in the Practice Launcher Prospects audience
//   - email.complained    → mark unsubscribed AND email Joel an alert (complaints damage sender reputation fast)
//   - email.delivered     → telemetry only (logged, no action)
//
// Failure mode is graceful: any individual API failure logs and returns 200 so Resend stops retrying.
// Worst case: a bounced contact stays in the audience and gets one more cold send before the next bounce.
//
// 2026-05-10 hardened: when RESEND_WEBHOOK_SECRET is set we verify the Svix
// signature before doing anything. Resend's secret format is `whsec_<base64>`;
// the signature header is `svix-signature: v1,<b64sig> [v1,<b64sig>...]`.
// Until Joel sets the secret in Vercel env we accept unsigned (with a warning
// log) so the existing webhook keeps flowing — no silent failure on the day
// of activation.

import crypto from 'node:crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
const AUDIENCE_ID = process.env.RESEND_LAUNCHER_AUDIENCE_ID || 'ad46af78-a3b5-467f-8006-f56eeee26841';
const ALERT_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';

const SUPPRESS_EVENTS = new Set(['email.bounced', 'email.complained']);

// Disable Vercel's automatic body parsing so we can read the raw body for
// signature verification. The Svix signature is computed over the exact bytes
// the sender transmitted; re-serialized JSON won't match.
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

// Verify the Svix signature on a Resend webhook delivery. Returns true if the
// signature is valid, false otherwise. Reject window is 5 minutes — older
// timestamps are treated as replay attempts even if the HMAC matches.
function verifySvixSignature({ rawBody, headers, secret }) {
  if (!secret) return null; // no secret configured — caller decides
  const id = headers['svix-id'];
  const ts = headers['svix-timestamp'];
  const sigHeader = headers['svix-signature'];
  if (!id || !ts || !sigHeader) return false;

  // Replay window: reject if the timestamp is more than 5 minutes off.
  const tsMs = Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return false;
  }

  // Secret format: `whsec_<base64>`. Strip the prefix and decode.
  const secretBytes = Buffer.from(
    secret.startsWith('whsec_') ? secret.slice(6) : secret,
    'base64'
  );

  const signedPayload = `${id}.${ts}.${rawBody.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  // Header may contain multiple signatures, space-separated, each prefixed
  // with version. Check for any match.
  const candidates = sigHeader
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3));

  for (const c of candidates) {
    // Constant-time compare — both buffers must be the same length or the
    // comparison throws, so guard against length mismatch first.
    if (c.length === expected.length) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(c), Buffer.from(expected))) {
          return true;
        }
      } catch { /* length mismatch — already guarded but be safe */ }
    }
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read raw body (we disabled the auto-parser).
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('[resend-bounce] body read error:', err.message);
    return res.status(400).json({ error: 'Could not read body' });
  }

  // Verify signature when secret is configured. If verification returns null
  // (no secret), warn but continue — keeps the webhook flowing through the
  // setup window. Returns false (signature mismatch / replay) → reject.
  const verified = verifySvixSignature({
    rawBody,
    headers: req.headers,
    secret: RESEND_WEBHOOK_SECRET,
  });
  if (verified === false) {
    console.warn('[resend-bounce] signature verification FAILED — rejecting');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  if (verified === null) {
    console.warn('[resend-bounce] RESEND_WEBHOOK_SECRET not set — accepting unsigned (set the secret in Vercel env to harden)');
  }

  // Parse the now-verified body.
  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (!event || !event.type) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  const { type, data } = event;

  // Resend webhook payload shape varies by event; check common fields
  const email =
    data?.to?.[0] ||
    data?.email ||
    data?.recipient ||
    data?.bounce?.email ||
    data?.complaint?.email;

  if (!email) {
    console.log(`[resend-bounce] ${type} (no email field)`);
    return res.status(200).json({ ok: true, note: 'no email in event' });
  }

  console.log(`[resend-bounce] ${type} ${email}`);

  if (!SUPPRESS_EVENTS.has(type)) {
    // Telemetry only — no action
    return res.status(200).json({ ok: true });
  }

  // Suppress in the audience
  let suppressed = false;
  if (RESEND_API_KEY && AUDIENCE_ID) {
    try {
      const r = await fetch(
        `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unsubscribed: true }),
        }
      );
      suppressed = r.ok;
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        console.error(`[resend-bounce] suppress ${r.status}: ${email} | ${body.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`[resend-bounce] suppress error: ${email} | ${err.message}`);
    }
  }

  // Alert Joel on complaints — these are sender-reputation killers, not just bounces
  if (type === 'email.complained' && RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Resend Webhook <noreply@bpquiz.com>',
          to: [ALERT_EMAIL],
          subject: '[ALERT] Spam complaint on Practice Launcher outreach',
          text: [
            `Recipient: ${email}`,
            `Event type: ${type}`,
            `Received: ${new Date().toISOString()}`,
            ``,
            `Auto-suppressed in audience: ${suppressed ? 'yes' : 'NO (manual cleanup needed)'}`,
            ``,
            `Why this matters: complaint rate >0.1% damages sender reputation across the entire`,
            `outreach.bpquiz.com domain. One complaint is noise; three in a week needs investigation.`,
            ``,
            `Action: investigate the most recent send to ${email} — what subject line, what body?`,
            `Pattern across complaints will reveal which lead segment / message is triggering them.`,
          ].join('\n'),
        }),
      });
    } catch (err) {
      console.error(`[resend-bounce] alert email error: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, suppressed, type });
}
