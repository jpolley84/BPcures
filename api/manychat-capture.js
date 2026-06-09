// POST /api/manychat-capture — bridge ManyChat in-DM email capture into KV.
//
// 2026-06-09: the @braveworksrn IG comment-to-DM flow (keyword "BP") captures
// emails inside ManyChat, but they never reached the bpquiz drip system — no
// drip:<email> record, no Day-0 email, no nurture. ManyChat's public API has
// no flow-edit endpoint and no bulk-subscriber export, so the only way to get
// these emails out is for the flow itself to POST them here at capture time
// (an "External Request" action in the ManyChat flow builder).
//
// Auth: shared secret in the x-manychat-secret header (MANYCHAT_CAPTURE_SECRET
// env var). No IP rate limit — ManyChat's servers share IPs and a viral
// comment spike would trip a per-IP limit.
//
// Enrolls as a 'lead' (source manychat-dm) and sends the instant Day-1 lead
// magnet, exactly like a quiz capture; the daily lead-cron then runs the arc.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { looksLikeValidEmail } from './_email-validation.js';

const SITE_URL = process.env.SITE_URL || 'https://bpquiz.com';
let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function alert(subject, text) {
  try {
    await getResend().emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: ['braveworksrn@gmail.com'],
      subject,
      text,
    });
  } catch { /* best effort */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Shared-secret auth. If the env var isn't set, fail closed.
  const secret = process.env.MANYCHAT_CAPTURE_SECRET;
  if (!secret || req.headers['x-manychat-secret'] !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { email, name, first_name } = req.body || {};
  const fname = name || first_name || '';
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!process.env.KV_REST_API_URL) {
    await alert('[ALERT] manychat-capture: KV unavailable', `Captured ${email} from ManyChat but KV_REST_API_URL is missing — lead lost.`);
    return res.status(500).json({ error: 'Storage unavailable' });
  }

  const emailLower = String(email).trim().toLowerCase();
  const dripKey = `drip:${emailLower}`;
  const nowIso = new Date().toISOString();
  let enrolled = false;

  // ── ENROLL FIRST (the captured email is the asset) ────────────────────
  try {
    const existing = await kv.get(dripKey);
    if (existing) {
      // Known contact — tag the source, never downgrade a buyer; re-opt
      // 'newsletter' records back into the lead arc (same rule as
      // lead-magnet.js / subscribe.js, 2026-06-09).
      const reEnterLead = !existing.state || existing.state === 'newsletter';
      await kv.set(dripKey, {
        ...existing,
        firstName: existing.firstName || fname,
        tags: Array.from(new Set([...(existing.tags || []), 'manychat-dm', 'instagram'])),
        ...(reEnterLead ? { state: 'lead', stateEnteredAt: nowIso } : {}),
      });
    } else {
      await kv.set(dripKey, {
        email: emailLower,
        firstName: fname,
        cohort: 'manychat',
        enrolledAt: nowIso,
        firstSeen: nowIso,
        lastSentDay: 0,
        optedIn: true, // DMing their email IS the opt-in
        source: 'manychat-dm',
        tags: ['manychat-dm', 'instagram'],
        state: 'lead',
        stateEnteredAt: nowIso,
      });
    }
    const dayKey = nowIso.slice(0, 10);
    try {
      await kv.sadd(`lead-log:${dayKey}`, emailLower);
      await kv.expire(`lead-log:${dayKey}`, 90 * 86400);
    } catch { /* non-fatal */ }
    enrolled = true;
  } catch (err) {
    await alert('[ALERT] manychat-capture: KV enroll failed', `${emailLower}\n${err.message}`);
    return res.status(500).json({ error: 'Capture failed' });
  }

  // ── SEND instant welcome (failure no longer loses the capture) ────────
  // Minimal welcome that points back to the quiz so they self-segment by
  // pressure; the daily lead-cron then runs the full arc.
  let sent = false;
  try {
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: emailLower,
      replyTo: 'braveworksrn@gmail.com',
      subject: 'Your BP Triangle plan — start here',
      html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2c2a26;line-height:1.6;">
        <p>Hey${fname ? ' ' + fname : ''},</p>
        <p>You asked about your blood pressure over on Instagram — here's the fastest way in.</p>
        <p>Take the free 90-second BP Triangle quiz and I'll send you a plan built for <em>your</em> body, not a generic pamphlet:</p>
        <p><a href="${SITE_URL}/quiz?utm_source=manychat&utm_medium=dm" style="display:inline-block;background:#B85A36;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Take the 90-second quiz →</a></p>
        <p>Talk soon,<br>Joel Polley, RN</p>
      </div>`,
      text: `Hey${fname ? ' ' + fname : ''},\n\nYou asked about your blood pressure on Instagram. Take the free 90-second BP Triangle quiz and I'll send you a plan built for your body:\n\n${SITE_URL}/quiz?utm_source=manychat&utm_medium=dm\n\nJoel Polley, RN`,
    });
    sent = true;
  } catch (err) {
    // Enroll already saved — lead-cron sends Day 0 tomorrow. Just flag it.
    await alert('[ALERT] manychat-capture: welcome send failed (lead saved)', `${emailLower}\n${err.message}\nThe lead is enrolled; the daily lead-cron will send Day 0.`);
  }

  return res.status(200).json({ success: true, enrolled, emailSent: sent });
}
