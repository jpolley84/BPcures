// api/app-waitlist.js — BraveWorks BP iPhone-app waitlist signup.
//
// Contract:
//   POST { email, firstName?, source? }
//   200  { ok: true, position: number, already: boolean }
//
// Behavior:
//   - Validate email (shared validator — also blocks CRLF header injection,
//     which matters because the email lands in a Resend reply_to header).
//   - Idempotent: re-submitting an email returns the ORIGINAL position and
//     does not re-send the confirmation or bump the counter.
//   - New signup: position = INCR waitlist:app:count (1-based, real — never
//     seeded or faked), record at waitlist:app:<email>, email added to the
//     waitlist:app:members set so /send-campaign can segment the launch
//     broadcast later.
//   - Sends ONE transactional confirmation ("You're #N in line") via Resend.
//     Send failure is non-fatal — the signup is already stored.
//   - This endpoint does NOT enroll into the drip:* / bwbp:drip:* nurture
//     machines. Waitlist folks asked for app updates, not the BP course.
//     Launch + nurture emails go out via /send-campaign (dry-run + Joel
//     approval) against the waitlist:app:members set. See
//     APP_WAITLIST_EMAILS.md for the authored sequence.
//
// KV shapes:
//   waitlist:app:count            → integer counter (INCR)
//   waitlist:app:members          → set of normalized emails
//   waitlist:app:<email>          → { email, firstName, position, joinedAt,
//                                     source, utm? }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { looksLikeValidEmail } from './_email-validation.js';

const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

function clean(s, max = 80) {
  return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function confirmationEmail({ firstName, position }) {
  const name = firstName ? escapeHtml(firstName) : 'friend';
  // CAN-SPAM postal line: env-driven only, never hardcoded. This is a
  // one-time transactional confirm; ongoing sends happen via send-campaign
  // which carries its own unsubscribe + postal machinery.
  const postal = process.env.BUSINESS_POSTAL_ADDRESS
    ? `<p style="color:#9A9A9A;font-size:0.78rem;margin-top:0.4rem;">BraveWorks RN &middot; ${escapeHtml(process.env.BUSINESS_POSTAL_ADDRESS)}</p>`
    : '';
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#2C3E50;line-height:1.6;background:#FBF8F1;">
<p style="font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;font-weight:700;margin:0 0 1rem;">BraveWorks BP &middot; iPhone app</p>
<h2 style="margin:0 0 1rem;font-weight:600;">You're #${position} in line, ${name}.</h2>
<p>The BraveWorks BP app is in its final stretch before the App Store. You'll get one email from me the day it goes live, and your spot means you hear first.</p>
<p><strong>What the app does:</strong> log your blood pressure in seconds, watch your 30-day pattern, and print a one-page Doctor Report for your next appointment. Everything stays on your phone. No account. Free.</p>
<p><strong>While you wait:</strong> if you haven't taken the BP quiz yet, that's the best 2 minutes you can spend today &mdash; it tells you which of the Three Pressures is loudest for you. <a href="https://bpquiz.com/quiz" style="color:#B85A36;">Take it here</a>.</p>
<p>Questions? Just reply. I read these myself.</p>
<p style="margin-top:2rem;">&mdash; Joel Polley, RN<br/><span style="color:#9A9A9A;font-size:0.88rem;">BraveWorks RN &middot; BPQuiz.com</span></p>
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #E8E2D4;">
<p style="color:#9A9A9A;font-size:0.78rem;margin:0;">You're getting this because you joined the app waitlist at bpquiz.com/waitlist. Don't want launch updates? Reply "remove" and I'll take you off.</p>
${postal}
</body></html>`;
}

export default async function handler(req, res) {
  try {
    return await handleSignup(req, res);
  } catch (err) {
    console.error('app-waitlist unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'Server error. Try again in a minute.' });
    }
  }
}

async function handleSignup(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body, expected JSON' });
  }
  if (!looksLikeValidEmail(body.email)) {
    return res.status(400).json({ ok: false, error: 'That email doesn’t look right. Check it and try again.' });
  }
  if (!process.env.KV_REST_API_URL) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  const email = String(body.email).trim().toLowerCase();
  const firstName = clean(body.firstName);
  const source = clean(body.source, 40) || 'waitlist-page';
  const recordKey = `waitlist:app:${email}`;

  // Idempotent path — already on the list.
  const existing = await kv.get(recordKey);
  if (existing && existing.position) {
    return res.status(200).json({ ok: true, position: existing.position, already: true });
  }

  const position = await kv.incr('waitlist:app:count');
  const record = {
    email,
    firstName,
    position,
    joinedAt: new Date().toISOString(),
    source,
  };
  await kv.set(recordKey, record);
  try {
    await kv.sadd('waitlist:app:members', email);
  } catch (err) {
    // Set index is a convenience for the launch broadcast; the per-email
    // record above is the durable truth. Non-fatal.
    console.warn('app-waitlist: sadd failed (non-fatal)', err.message);
  }

  // Confirmation email — non-fatal if it bounces or Resend hiccups.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        reply_to: REPLY_TO,
        subject: `You're #${position} in line for BraveWorks BP`,
        html: confirmationEmail({ firstName, position }),
      });
    } catch (err) {
      console.warn('app-waitlist: confirmation send failed (non-fatal)', err.message);
    }
  }

  return res.status(200).json({ ok: true, position, already: false });
}
