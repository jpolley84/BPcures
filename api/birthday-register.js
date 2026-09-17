// api/birthday-register.js — Joel's birthday bonus pop-up masterclass (2026-09-16).
//
// One-time class: Friday 2026-09-18, 11:00 AM Central / 12:00 PM Eastern, same
// Zoom room as the Monday class (ZOOM_MAIN). public/birthday/index.html posts
// here and redirects to /birthday/registered/ on data.ok.
//
// Why not api/masterclass-register.js: that endpoint is idempotent on
// masterclass:reg:<email>, so anyone already registered for Monday would get
// no Friday confirmation. This event keeps its own keys:
//   popup:2026-09-18:reg:<email>  -> { email, name, phone, joinedAt, source, utm? }
//   popup:2026-09-18:members      -> set of normalized emails (segment for replay/follow-up)
//   popup:2026-09-18:count        -> integer counter
// It also enrolls the lead drip exactly like the Monday class (enrollLeadDrip),
// tagged 'birthday-popup'. It does NOT add to masterclass:members.
//
// Contract:
//   POST { name?, email, phone?, source?, utm? }
//   200  { ok: true, already: boolean }
//   400  bad body / bad email · 405 non-POST · 410 class over · 500 storage

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { looksLikeValidEmail } from './_email-validation.js';
import {
  clean, escapeHtml, cleanUtm, enrollLeadDrip,
  ZOOM_JOIN_URL, ZOOM_MEETING_ID, ZOOM_PASSCODE,
} from './_masterclass-enroll.js';

export const EVENT_ID = '2026-09-18';
// 11:00 AM CDT = 16:00 UTC. Registration closes 90 minutes after start.
export const START_UTC_MS = Date.UTC(2026, 8, 18, 16, 0, 0);
const CLOSE_UTC_MS = START_UTC_MS + 90 * 60000;

const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const CALENDAR_ICS_URL = 'https://bpquiz.com/api/masterclass-calendar?event=birthday';
const CALENDAR_GOOGLE_URL = 'https://bpquiz.com/api/masterclass-calendar?event=birthday&google=1';

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

export function confirmationEmail({ firstName }) {
  const name = firstName ? escapeHtml(firstName) : 'friend';
  const postal = process.env.BUSINESS_POSTAL_ADDRESS
    ? `<p style="color:#9A9A9A;font-size:0.78rem;margin-top:0.4rem;">BraveWorks RN &middot; ${escapeHtml(process.env.BUSINESS_POSTAL_ADDRESS)}</p>`
    : '';
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#1E2B2A;line-height:1.6;background:#FAF6EF;">
<p style="font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;color:#B93C20;font-weight:700;margin:0 0 1rem;">The First Domino &middot; Free Birthday Masterclass</p>
<h2 style="margin:0 0 1rem;font-weight:600;">Your seat is saved, ${name}.</h2>
<p>Friday is my birthday, and I'm spending the morning teaching. I'm glad you're coming.</p>
<p><strong>Friday, September 18 at 11:00 AM Central</strong> (12:00 PM Eastern &middot; 10:00 AM Mountain &middot; 9:00 AM Pacific). One hour, live on Zoom.</p>
<div style="background:#F4E6DE;border-radius:12px;padding:1rem 1.2rem;margin:1.2rem 0;">
  <p style="margin:0 0 0.6rem;"><strong>Your join link (save this email):</strong></p>
  <p style="margin:0 0 0.6rem;"><a href="${ZOOM_JOIN_URL}" style="display:inline-block;background:#DB4E2E;color:#ffffff;text-decoration:none;font-weight:700;padding:0.7rem 1.4rem;border-radius:999px;">Join Friday's Class on Zoom &rarr;</a></p>
  <p style="margin:0;color:#4A5A58;font-size:0.9rem;">Meeting ID: <strong>${ZOOM_MEETING_ID}</strong> &middot; Passcode: <strong>${ZOOM_PASSCODE}</strong><br/>
  <a href="${CALENDAR_ICS_URL}" style="color:#B93C20;">Add it to your calendar</a> (or <a href="${CALENDAR_GOOGLE_URL}" style="color:#B93C20;">Google Calendar</a>) so Friday morning finds you ready.</p>
</div>
<p><strong>What we'll cover:</strong> 3 health myths that keep your blood pressure, blood sugar, and weight stuck, and the first domino: the one place to start so the next steps get easier.</p>
<p><strong>Come live.</strong> I have a birthday gift for everyone who's in the room.</p>
<p>Questions? Just reply. I read these myself.</p>
<p style="margin-top:2rem;">Joel Polley, RN<br/><span style="color:#9A9A9A;font-size:0.88rem;">BraveWorks RN &middot; BPQuiz.com</span></p>
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #E4DACE;">
<p style="color:#9A9A9A;font-size:0.78rem;margin:0;">You're getting this because you saved a seat at bpquiz.com/birthday. Educational content only, not medical advice. Never start, stop, or adjust medication without your doctor. Don't want class emails? Reply "remove" and I'll take you off.</p>
${postal}
</body></html>`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    if (Date.now() > CLOSE_UTC_MS) {
      return res.status(410).json({ ok: false, error: 'This class has ended. Join the next free class at bpquiz.com/masterclass.' });
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
    const source = clean(body.source, 40) || 'birthday-page';
    const utm = cleanUtm(body.utm);
    const recordKey = `popup:${EVENT_ID}:reg:${email}`;

    const existing = await kv.get(recordKey);
    if (existing && existing.email) {
      return res.status(200).json({ ok: true, already: true });
    }

    await kv.set(recordKey, {
      email,
      name,
      phone: clean(body.phone, 30),
      joinedAt: new Date().toISOString(),
      source,
      ...(utm ? { utm } : {}),
    });

    try {
      await kv.sadd(`popup:${EVENT_ID}:members`, email);
      await kv.incr(`popup:${EVENT_ID}:count`);
    } catch (err) {
      console.warn('birthday-register: sadd/incr failed (non-fatal)', err.message);
    }

    await enrollLeadDrip({ email, firstName, source, tag: 'birthday-popup' });

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          reply_to: REPLY_TO,
          campaign: 'birthday-popup-seat-saved',
          subject: 'Your seat is saved for Friday (11 AM Central)',
          html: confirmationEmail({ firstName }),
        });
      } catch (err) {
        console.warn('birthday-register: confirmation send failed (non-fatal)', err.message);
      }
    }

    return res.status(200).json({ ok: true, already: false });
  } catch (err) {
    console.error('birthday-register unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'Server error. Try again in a minute.' });
    }
  }
}
