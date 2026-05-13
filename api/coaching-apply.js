// /api/coaching-apply — handles applications for the 90-Day BP Triangle
// Freedom Sprint ($4,997 flagship, Joel + Annie co-coach).
//
// Application-only flow (Brunson high-ticket rule). No payment collected
// here. Submissions:
//   1. Stored in KV under coaching-app:<timestamp>:<email> with 90-day TTL
//   2. Emailed to Joel for manual review at LAUNCHER_NOTIFY_EMAIL
//   3. Auto-acknowledged to the applicant
//
// 2026-05-12 — initial cohort price $4,997 / 5 slots.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const NOTIFY_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';
const FROM = 'BP Triangle Freedom Sprint <coaching@bpquiz.com>';

// Cheap RFC-5322-ish shape check (mirrors what we added to
// purchase-confirmation.js to catch malformed Stripe deliveries).
function looksLikeValidEmail(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (t.length < 5 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body — expected JSON' });
  }

  const { name, email, phone, bpNumbers, currentMeds, whyNow, whyAFit } = req.body;

  // Required-field validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!whyNow || typeof whyNow !== 'string' || !whyNow.trim()) {
    return res.status(400).json({ error: '"Why now?" is required — Joel uses it to screen for fit' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const application = {
    name: name.trim(),
    email: trimmedEmail,
    phone: (phone || '').trim(),
    bpNumbers: (bpNumbers || '').trim(),
    currentMeds: (currentMeds || '').trim(),
    whyNow: whyNow.trim(),
    whyAFit: (whyAFit || '').trim(),
    submittedAt,
    status: 'pending-review',
    program: 'BP Triangle Freedom Sprint',
    price: '$4,997',
    cohort: 'cohort-1',
  };

  // 1. Store in KV (90-day TTL so old apps purge themselves)
  if (process.env.KV_REST_API_URL) {
    try {
      const kvKey = `coaching-app:${Date.now()}:${trimmedEmail}`;
      await kv.set(kvKey, application, { ex: 90 * 86400 });
    } catch (err) {
      console.error('coaching-apply: KV store failed', err.message);
      // Continue — KV failure shouldn't block the email notification.
    }
  }

  // 2. Email notification to Joel
  try {
    const subject = `[Coaching App] ${application.name} — ${application.email}`;
    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#2C3E50;">
      <h2 style="color:#6C3483;margin:0 0 8px;">New 90-Day Sprint Application</h2>
      <p style="font-size:13px;color:#9CA3AF;margin:0 0 24px;">Submitted ${submittedAt}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;width:140px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;font-weight:600;">${escapeHtml(application.name)}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;">Email</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;">${escapeHtml(application.email)}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;">${escapeHtml(application.phone) || '<em style="color:#9CA3AF;">(not provided)</em>'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;">BP numbers</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;">${escapeHtml(application.bpNumbers) || '<em style="color:#9CA3AF;">(blank)</em>'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;vertical-align:top;">Current meds</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;white-space:pre-wrap;">${escapeHtml(application.currentMeds) || '<em style="color:#9CA3AF;">(blank)</em>'}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;color:#9CA3AF;vertical-align:top;">Why now</td><td style="padding:8px 0;border-bottom:1px solid #E5E7EB;white-space:pre-wrap;">${escapeHtml(application.whyNow)}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;vertical-align:top;">Why a fit</td><td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(application.whyAFit) || '<em style="color:#9CA3AF;">(blank)</em>'}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;">Reply directly to ${escapeHtml(application.email)} when ready to schedule fit call.</p>
    </body></html>`;
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: trimmedEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('coaching-apply: notify email failed', err.message);
    // Don't block the user — Joel can find it in KV.
  }

  // 3. Auto-acknowledgement to applicant
  try {
    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2C3E50;line-height:1.6;">
      <p style="font-size:18px;color:#2C3E50;margin:0 0 16px;">Hi ${escapeHtml(application.name.split(' ')[0] || 'there')},</p>
      <p style="margin:0 0 16px;">Your application for the <strong>BP Triangle Freedom Sprint</strong> just landed in my inbox. Thank you for putting your real picture in front of me.</p>
      <p style="margin:0 0 16px;">Here's what happens next:</p>
      <ol style="margin:0 0 16px;padding-left:20px;">
        <li style="margin:0 0 8px;">I read every application personally. Usually inside 3-5 business days.</li>
        <li style="margin:0 0 8px;">If we're a fit on the application, I'll reach out to schedule a 20-minute fit call by phone. Price and structure are walked through there.</li>
        <li style="margin:0 0 8px;">If we're a fit on the call, you'll get a Stripe invoice for the cohort. No payment is collected until that point.</li>
      </ol>
      <p style="margin:0 0 16px;">If we're not a fit for this cohort, I'll write back too — you go on the waitlist for the next opening, and the daily emails keep coming.</p>
      <p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Pills manage output. Protocol fixes input. AND not INSTEAD OF — that's the path we'd walk together.</p>
      <p style="margin:0 0 4px;color:#2C3E50;font-weight:600;">Joel</p>
      <p style="margin:0;font-size:14px;color:#4A4A4A;font-style:italic;">RN, BraveWorks</p>
    </body></html>`;
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: 'Got your application — what happens next',
      html,
    });
  } catch (err) {
    console.error('coaching-apply: applicant ack failed', err.message);
  }

  return res.status(200).json({ ok: true, submittedAt });
}
