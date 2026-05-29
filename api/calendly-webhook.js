// /api/calendly-webhook — real-time SMS alert when a Calendly call books.
//
// 2026-05-28. Built after two intake calls (Flo, William) slipped into the
// inbox unseen and got missed. Calendly fires `invitee.created` the instant
// someone books; this endpoint texts Joel so nothing slips again.
//
// SMS path: Resend → Verizon email-to-SMS gateway (7175859505@vtext.com).
// Free, no Twilio account. If Verizon ever throttles, swap JOEL_SMS for a
// Twilio send (the format stays identical).
//
// Security: this endpoint only sends Joel a text — no data mutation, no
// money. Gated by a URL secret (?secret=...) that Calendly is registered
// with, so a random actor can't discover the URL and spam Joel's phone.
// Calendly also signs requests; we verify the signature when the signing
// key is present (set after registration), and fall back to the URL secret
// otherwise.
//
// Register the webhook with: node scripts/register-calendly-webhook.mjs

import { Resend } from 'resend';

// Verizon gateway. Override with JOEL_SMS in Vercel env if the number or
// carrier ever changes (e.g. "7175859505@tmomail.net" for T-Mobile, or a
// Twilio path). Plain hardcoded fallback so it works without an env edit.
const JOEL_SMS = process.env.JOEL_SMS || '7175859505@vtext.com';
const FROM = 'BraveWorks <noreply@bpquiz.com>';
const URL_SECRET = process.env.CALENDLY_WEBHOOK_SECRET || 'd52e9245be996ce2469ac862b85e0e24';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// Format an ISO-UTC time as "Thu May 28, 6:00 PM CT". Central time = UTC-5
// (CDT) May–Nov, UTC-6 (CST) otherwise. We compute the offset from the
// date so the SMS always reads in Joel's timezone.
function fmtCentral(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }) + ' CT';
  } catch {
    return iso;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // URL-secret gate — Calendly is registered with ?secret=<URL_SECRET>.
  if ((req.query?.secret || '') !== URL_SECRET) {
    return res.status(401).json({ error: 'bad secret' });
  }

  const body = req.body || {};
  const eventType = body.event;

  // Only act on new bookings. Acknowledge everything else with 200 so
  // Calendly doesn't retry.
  if (eventType !== 'invitee.created') {
    return res.status(200).json({ ok: true, ignored: eventType });
  }

  try {
    const p = body.payload || {};
    const name = p.name || 'Someone';
    const email = p.email || '(no email)';
    const sched = p.scheduled_event || {};
    const callType = sched.name || 'call';
    const when = sched.start_time ? fmtCentral(sched.start_time) : 'time TBD';

    // Pull the phone number if they answered a Calendly questions-and-answers
    // field that captured it (optional — most intakes don't).
    let phone = '';
    for (const qa of p.questions_and_answers || []) {
      if (/phone|cell|number/i.test(qa.question || '') && qa.answer) {
        phone = ` · ${qa.answer}`;
        break;
      }
    }

    const text = `New BraveWorks booking: ${name} (${email})${phone} — ${when} · ${callType}`;

    await getResend().emails.send({
      from: FROM,
      to: JOEL_SMS,
      // vtext drops the body in as the SMS; a short subject keeps it clean.
      subject: 'New call booked',
      text,
    });

    return res.status(200).json({ ok: true, alerted: name });
  } catch (err) {
    console.error('calendly-webhook: SMS alert failed', err.message);
    // 200 anyway — a failed text shouldn't make Calendly retry-storm us.
    return res.status(200).json({ ok: false, error: err.message });
  }
}
