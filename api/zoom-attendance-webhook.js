// /api/zoom-attendance-webhook — real-time SMS the instant a guest actually
// joins a 1:1 Zoom room. Companion to calendly-webhook.js, which alerts on
// BOOKING; this alerts on ATTENDANCE, which nothing in the stack tracked
// before 2026-08-12.
//
// WHY THIS EXISTS: Zoom's own "Meeting assets are ready" email fires whenever
// the HOST joins and leaves a named meeting, whether or not a guest was ever
// in the room. On 2026-08-12 that email arrived for "Jennifer and Joel
// Polley" and looked exactly like proof she showed up — it was actually proof
// Joel opened the room, alone, and closed it. Two 1:1 no-shows that same
// morning could not be told apart from real meetings without asking Joel to
// remember whether he'd seen a face on screen. This endpoint replaces that
// guess with an event Zoom fires only when a second participant's connection
// actually opens: participant.joined.
//
// SETUP (one-time, Joel):
//   1. marketplace.zoom.us → Develop → Build App → Server-to-Server OAuth
//   2. Scope: meeting:read  (read-only; this endpoint never controls meetings)
//   3. Feature → Event Subscriptions → add:
//        - meeting.participant_joined
//        - meeting.participant_left
//   4. Copy the Secret Token (webhook signing) into Vercel as
//      ZOOM_WEBHOOK_SECRET_TOKEN. No other Zoom credential is needed — this
//      endpoint only receives and verifies webhooks, it never calls the Zoom
//      API, so no Account ID / Client ID / Client Secret required.
//   5. Set the subscription URL to
//      https://bpquiz.com/api/zoom-attendance-webhook
//
// SECURITY: Zoom's URL-validation handshake (`endpoint.url_validation`) is
// answered per Zoom's documented HMAC-SHA256 challenge-response, using
// ZOOM_WEBHOOK_SECRET_TOKEN. Every other event is verified against Zoom's
// `x-zm-signature` header before anything runs. An unverified request is
// rejected with 401 and never reaches the alert logic.
//
// MATCHING: the host (Joel or Annie) is never alerted on. Everyone else who
// joins the account's meetings triggers a text — this only receives events
// for OUR Zoom account, so there is no volume concern.
//
// NOT built as part of this pass, on purpose: the "10 minutes past start,
// nobody joined" no-show alert. That needs the expected roster (today's
// Calendly bookings, already captured by calendly-webhook.js /
// calendly-poll-cron.js) cross-referenced on a timer, which is a second,
// separable piece — this endpoint only does live join/leave confirmation.

import crypto from 'node:crypto';
import { Resend } from 'resend';

const JOEL_SMS = process.env.JOEL_SMS || '7175859505@vtext.com';
const FROM = 'BraveWorks <noreply@bpquiz.com>';
const SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function fmtCentral(ms) {
  try {
    return new Date(ms).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric', minute: '2-digit',
    }) + ' CT';
  } catch {
    return '';
  }
}

// Zoom's documented signature scheme:
//   message = `v0:${timestamp}:${rawBody}`
//   signature = "v0=" + HMAC_SHA256(message, secretToken)
// Compared with a constant-time check so response timing can't leak it.
function verifySignature(rawBody, timestamp, signatureHeader) {
  if (!SECRET || !timestamp || !signatureHeader) return false;
  const message = `v0:${timestamp}:${rawBody}`;
  const expected = 'v0=' + crypto.createHmac('sha256', SECRET).update(message).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Vercel's default body parser JSON.stringifies before we can see the exact
// bytes Zoom signed. Reading the raw stream keeps the signature check exact.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = await readRawBody(req);
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return res.status(400).json({ error: 'invalid JSON' });
  }

  // Zoom's one-time endpoint-ownership handshake. Must be answered even
  // before signature verification, per Zoom's spec — the plainToken IS the
  // proof, verified by echoing back its HMAC.
  if (body.event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken;
    if (!plainToken || !SECRET) return res.status(400).json({ error: 'not configured' });
    const encryptedToken = crypto.createHmac('sha256', SECRET).update(plainToken).digest('hex');
    return res.status(200).json({ plainToken, encryptedToken });
  }

  const signature = req.headers['x-zm-signature'];
  const timestamp = req.headers['x-zm-request-timestamp'];
  if (!verifySignature(raw, timestamp, signature)) {
    return res.status(401).json({ error: 'bad signature' });
  }

  if (body.event !== 'meeting.participant_joined') {
    return res.status(200).json({ ok: true, ignored: body.event });
  }

  try {
    // Zoom's documented shape for this event is payload.object.participant
    // (singular) — one event per participant join, not a batch.
    const meeting = body.payload?.object || {};
    const participant = meeting.participant || {};
    const name = participant.user_name || 'Someone';
    const email = participant.email || '';

    // Never alert on the host joining their own room — that is the exact
    // false signal this endpoint exists to replace.
    const isHost = participant.id && meeting.host_id && participant.id === meeting.host_id;
    if (isHost || /^(joel polley|annie chitate)$/i.test(name.trim())) {
      return res.status(200).json({ ok: true, ignored: 'host' });
    }

    const when = fmtCentral(Date.now());
    const text = `${name}${email ? ` (${email})` : ''} just joined the Zoom room — ${when}`;

    await getResend().emails.send({
      from: FROM,
      to: JOEL_SMS,
      subject: 'Guest joined',
      text,
    });

    return res.status(200).json({ ok: true, alerted: name });
  } catch (err) {
    console.error('zoom-attendance-webhook: alert failed', err.message);
    // 200 regardless — a failed text must not make Zoom retry-storm the hook.
    return res.status(200).json({ ok: false, error: err.message });
  }
}
