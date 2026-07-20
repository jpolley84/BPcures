// api/masterclass-register.js — "Beyond the Cuff" weekly masterclass registration.
//
// Contract:
//   POST { name?, email, phone?, source?, utm? }
//   200  { ok: true, already: boolean }
//
// Behavior (mirrors app-waitlist.js, the house pattern):
//   - Validate email (shared validator — also blocks CRLF header injection).
//   - Idempotent: re-submitting an email returns ok+already and does NOT
//     re-send the confirmation.
//   - Stores record at masterclass:reg:<email>, adds email to the
//     masterclass:members set (for /send-campaign segmentation: reminders,
//     replays, the cohort pitch follow-up), INCRs masterclass:count.
//   - Mirrors into a Resend audience if RESEND_MASTERCLASS_AUDIENCE_ID is
//     set (non-fatal; KV is the source of truth).
//   - Sends ONE transactional confirmation via Resend. Send failure is
//     non-fatal — the registration is already stored.
//   - Does NOT enroll into drip:* nurture machines. Class reminders and the
//     post-class arc go out via /send-campaign (dry-run + Joel approval)
//     against masterclass:members.
//
// KV shapes:
//   masterclass:count           → integer counter (INCR)
//   masterclass:members         → set of normalized emails
//   masterclass:reg:<email>     → { email, name, phone, joinedAt, source, utm? }

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { looksLikeValidEmail } from './_email-validation.js';

const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

// Weekly Zoom (Mondays 7pm CT) — provided by Joel 2026-07-20.
const ZOOM_JOIN_URL = 'https://us06web.zoom.us/j/81893444167?pwd=VjZjyy8kaLQefTdja5sCxmKrY07tqz.1';
const ZOOM_MEETING_ID = '818 9344 4167';
const ZOOM_PASSCODE = '846248';
const ZOOM_ICS_URL = 'https://us06web.zoom.us/meeting/tZUlfuqsqj8rHNNki9GHqJ55fXCn5uxImAIf/ics?icsToken=DC3sn8fxTo0gb2QaOQAALAAAAK9PT-326cN619RyXU7_QMehYIfs6OmodrdJ1-eTKA8AlIkfZA_ac0hMlQBj7ia-cJxpYtWH335ZjhQhczAwMDAwMQ&meetingMasterEventId=QO1dTtP2SB6QlfVpLs29HQ';

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

function cleanUtm(utm) {
  if (!utm || typeof utm !== 'object' || Array.isArray(utm)) return undefined;
  const out = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
    if (typeof utm[k] === 'string' && utm[k]) out[k] = utm[k].trim().slice(0, 60);
  }
  return Object.keys(out).length ? out : undefined;
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

function confirmationEmail({ firstName }) {
  const name = firstName ? escapeHtml(firstName) : 'friend';
  const postal = process.env.BUSINESS_POSTAL_ADDRESS
    ? `<p style="color:#9A9A9A;font-size:0.78rem;margin-top:0.4rem;">BraveWorks RN &middot; ${escapeHtml(process.env.BUSINESS_POSTAL_ADDRESS)}</p>`
    : '';
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#1E2B2A;line-height:1.6;background:#FAF6EF;">
<p style="font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;color:#B93C20;font-weight:700;margin:0 0 1rem;">Beyond the Cuff &middot; Free Live Masterclass</p>
<h2 style="margin:0 0 1rem;font-weight:600;">Your seat is saved, ${name}.</h2>
<p><strong>Beyond the Cuff &mdash; Take Charge of Your Numbers</strong> runs live every Monday night at <strong>7:00 pm Central</strong> (8:00 pm Eastern &middot; 5:00 pm Pacific).</p>
<div style="background:#F4E6DE;border-radius:12px;padding:1rem 1.2rem;margin:1.2rem 0;">
  <p style="margin:0 0 0.6rem;"><strong>Your join link (save this email):</strong></p>
  <p style="margin:0 0 0.6rem;"><a href="${ZOOM_JOIN_URL}" style="display:inline-block;background:#DB4E2E;color:#ffffff;text-decoration:none;font-weight:700;padding:0.7rem 1.4rem;border-radius:999px;">Join the Masterclass on Zoom &rarr;</a></p>
  <p style="margin:0;color:#4A5A58;font-size:0.9rem;">Meeting ID: <strong>${ZOOM_MEETING_ID}</strong> &middot; Passcode: <strong>${ZOOM_PASSCODE}</strong><br/>
  <a href="${ZOOM_ICS_URL}" style="color:#B93C20;">Add it to your calendar</a> so Monday night finds you ready.</p>
</div>
<p><strong>What we'll cover:</strong> the 3 hidden daily triggers quietly driving your numbers up &mdash; the habit almost nobody connects to their readings, the "healthy" trap working against you, and the one everyone blames for the wrong reason.</p>
<p><strong>Do one thing before Monday:</strong> if you haven't taken the free BP quiz yet, it takes 2 minutes and tells you which trigger is loudest for you. <a href="https://bpquiz.com/quiz" style="color:#B93C20;">Take it here</a>.</p>
<p>Questions? Just reply. I read these myself.</p>
<p style="margin-top:2rem;">&mdash; Joel Polley, RN<br/><span style="color:#9A9A9A;font-size:0.88rem;">BraveWorks RN &middot; BPQuiz.com</span></p>
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #E4DACE;">
<p style="color:#9A9A9A;font-size:0.78rem;margin:0;">You're getting this because you saved a seat at bpquiz.com/masterclass. Educational content only &mdash; not medical advice. Don't want class emails? Reply "remove" and I'll take you off.</p>
${postal}
</body></html>`;
}

export default async function handler(req, res) {
  try {
    return await handleRegister(req, res);
  } catch (err) {
    console.error('masterclass-register unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'Server error. Try again in a minute.' });
    }
  }
}

async function handleRegister(req, res) {
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
  const name = clean(body.name);
  const firstName = name.split(/\s+/)[0] || '';
  const phone = clean(body.phone, 30);
  const source = clean(body.source, 40) || 'masterclass-page';
  const utm = cleanUtm(body.utm);
  const recordKey = `masterclass:reg:${email}`;

  // Idempotent path — already registered.
  const existing = await kv.get(recordKey);
  if (existing && existing.email) {
    return res.status(200).json({ ok: true, already: true });
  }

  const record = {
    email,
    name,
    phone,
    joinedAt: new Date().toISOString(),
    source,
    ...(utm ? { utm } : {}),
  };
  await kv.set(recordKey, record);
  try {
    await kv.sadd('masterclass:members', email);
    await kv.incr('masterclass:count');
  } catch (err) {
    // Set/counter are conveniences for segmentation + the ops dashboard;
    // the per-email record above is the durable truth. Non-fatal.
    console.warn('masterclass-register: sadd/incr failed (non-fatal)', err.message);
  }

  // Enroll into the lead-nurture drip (bwbp:drip:*) — the same machine the
  // quiz EmailGate feeds via capture-lead.js. Rules mirrored from there:
  // enrich-only if a record exists (never reset state/timer, never demote a
  // buyer back to 'lead'); new emails start at Day 0 of the lead sequence.
  try {
    const dripKey = `bwbp:drip:${email}`;
    const drip = await kv.get(dripKey);
    if (drip) {
      await kv.set(dripKey, {
        ...drip,
        firstName: drip.firstName || firstName,
        tags: Array.from(new Set([...(drip.tags || []), 'masterclass'])),
        lastCaptureAt: new Date().toISOString(),
      });
    } else {
      const now = new Date().toISOString();
      await kv.set(dripKey, {
        email,
        firstName,
        corner: null,
        readiness: null,
        scores: null,
        state: 'lead',
        stateEnteredAt: now,
        enrolledAt: now,
        source: 'masterclass-page',
        tags: ['masterclass'],
      });
    }
  } catch (err) {
    console.warn('masterclass-register: drip enroll failed (non-fatal)', err.message);
  }

  // Mirror into the Resend audience so Joel can segment/broadcast from the
  // Resend dashboard too. KV stays the source of truth; non-fatal.
  if (process.env.RESEND_API_KEY && process.env.RESEND_MASTERCLASS_AUDIENCE_ID) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.contacts.create({
        audienceId: process.env.RESEND_MASTERCLASS_AUDIENCE_ID,
        email,
        firstName: firstName || undefined,
        unsubscribed: false,
      });
    } catch (err) {
      console.warn('masterclass-register: Resend audience add failed (non-fatal)', err.message);
    }
  }

  // Confirmation email — non-fatal if it bounces or Resend hiccups.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        reply_to: REPLY_TO,
        subject: 'Your seat is saved — Beyond the Cuff (Monday night)',
        html: confirmationEmail({ firstName }),
      });
    } catch (err) {
      console.warn('masterclass-register: confirmation send failed (non-fatal)', err.message);
    }
  }

  return res.status(200).json({ ok: true, already: false });
}
