// 1:1 BP Triangle Premium waitlist application — POST handler.
//
// Emails Joel the full application body via Resend and sends the applicant
// a soft auto-confirm. The email to Joel IS the primary record — replies
// route to applicant via reply_to so Joel can respond directly. No payment
// is collected here; the path is intake → screen → call → invoice.
//
// Env vars required:
//   RESEND_API_KEY — Resend API key (already set for the live drip engine)
//
// Note: an earlier version persisted to Vercel KV at `waitlist:1on1:{...}`
// for queryable indexing, but the @vercel/kv import was triggering
// ERR_MODULE_NOT_FOUND in production despite being identical to the working
// drip-cron import. Removed for now — KV indexing can be reintroduced
// later if/when application volume warrants a dashboard view.

import { Resend } from 'resend';
import { looksLikeValidEmail } from './_email-validation.js';

const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const NOTIFY_TO = 'braveworksrn@gmail.com';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildJoelEmail(app) {
  const triedList = (app.triedAlready || []).map(t => `<li>${escapeHtml(t)}</li>`).join('');
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 640px; margin: 0 auto; padding: 1.5rem; color: #2C3E50;">
<h2 style="margin-top:0;">New 1:1 Application — ${escapeHtml(app.firstName)} ${escapeHtml(app.lastName)}</h2>
<p style="color:#5A5A5A;font-size:0.95rem;margin-bottom:1.5rem;">Submitted: ${escapeHtml(app.submittedAt)}</p>

<h3>Contact</h3>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #eee;">
<tr><td style="background:#FBF8F1;font-weight:600;width:30%;">Name</td><td>${escapeHtml(app.firstName)} ${escapeHtml(app.lastName)}</td></tr>
<tr><td style="background:#FBF8F1;font-weight:600;">Email</td><td><a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a></td></tr>
<tr><td style="background:#FBF8F1;font-weight:600;">Phone</td><td>${escapeHtml(app.phone)}</td></tr>
<tr><td style="background:#FBF8F1;font-weight:600;">Age</td><td>${escapeHtml(app.ageRange)}</td></tr>
<tr><td style="background:#FBF8F1;font-weight:600;">Best time to talk</td><td>${escapeHtml(app.timeToTalk)}</td></tr>
</table>

<h3 style="margin-top:1.5rem;">Their situation</h3>
<p style="background:#F5F1E8;padding:1rem;border-radius:8px;border-left:3px solid #B85A36;white-space:pre-wrap;margin:0;">${escapeHtml(app.bpSituation)}</p>
<p style="color:#5A5A5A;font-size:0.88rem;margin-top:0.5rem;"><strong>Years with issue:</strong> ${escapeHtml(app.yearsWithIssue)} · <strong>On BP meds:</strong> ${escapeHtml(app.onMedication)}</p>

<h3 style="margin-top:1.5rem;">What they've tried</h3>
<ul>${triedList}</ul>
${app.triedOther ? `<p style="color:#5A5A5A;font-size:0.9rem;"><em>${escapeHtml(app.triedOther)}</em></p>` : ''}

<h3 style="margin-top:1.5rem;">Why now</h3>
<p style="background:#F5F1E8;padding:1rem;border-radius:8px;border-left:3px solid #4A6741;white-space:pre-wrap;margin:0;">${escapeHtml(app.whyNow)}</p>

<h3 style="margin-top:1.5rem;">Why Joel specifically</h3>
<p style="background:#F5F1E8;padding:1rem;border-radius:8px;border-left:3px solid #4A6741;white-space:pre-wrap;margin:0;">${escapeHtml(app.whyJoel)}</p>

<h3 style="margin-top:1.5rem;">What success looks like in 90 days</h3>
<p style="background:#F5F1E8;padding:1rem;border-radius:8px;border-left:3px solid #4A6741;white-space:pre-wrap;margin:0;">${escapeHtml(app.successIn90Days)}</p>

${app.anythingElse ? `<h3 style="margin-top:1.5rem;">Anything else</h3><p style="background:#F5F1E8;padding:1rem;border-radius:8px;white-space:pre-wrap;margin:0;">${escapeHtml(app.anythingElse)}</p>` : ''}

<hr style="margin:2rem 0;border:none;border-top:1px solid #eee;">
<p style="color:#9A9A9A;font-size:0.82rem;">Reply directly to this email to reach the applicant — replies are routed via Resend reply_to.</p>
</body></html>`;
}

function buildApplicantEmail(app) {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 580px; margin: 0 auto; padding: 1.5rem; color: #2C3E50; line-height:1.6;">
<p>Hi ${escapeHtml(app.firstName)},</p>
<p>Got your 1:1 application — thanks for taking the time to share all of that. I read every one of these personally.</p>
<p>The BP Triangle 1:1 cohort is small by design. <strong>I'll be in touch when we have an opening</strong> — typically within 1&ndash;2 weeks. If you don't hear back by then, the cohort is full and you'll be on the list for the next round.</p>
<p>In the meantime, you should be receiving the BP Triangle starter sequence in your inbox over the next 7 days. Read those — they cover the foundation we'd build on together if we end up working 1:1.</p>
<p>If anything urgent comes up before I reach out, just reply to this email.</p>
<p style="margin-top:2rem;">— Joel Polley, RN<br/><span style="color:#9A9A9A;font-size:0.88rem;">BraveWorks RN · BPQuiz.com</span></p>
</body></html>`;
}

async function readJsonBody(req) {
  // Try Vercel's auto-parsed body first
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  // Fall back to reading the raw stream — happens when Vercel doesn't auto-parse
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Wrap the whole handler so any unexpected error returns clean JSON
  // (otherwise Vercel returns a generic 500 HTML page that the React form
  // can't display).
  try {
    return await handleApplication(req, res);
  } catch (err) {
    console.error('waitlist-submit unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'Server error. Try again or email braveworksrn@gmail.com directly.' });
    }
  }
}

async function handleApplication(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const app = await readJsonBody(req);
  if (!app || typeof app !== 'object') {
    return res.status(400).json({ ok: false, error: 'Empty or invalid request body — must be JSON.' });
  }

  // Required-field validation
  const required = ['firstName', 'lastName', 'email', 'phone', 'ageRange', 'bpSituation', 'yearsWithIssue', 'onMedication', 'whyNow', 'whyJoel', 'successIn90Days', 'timeToTalk'];
  const missing = required.filter(k => !app[k] || (typeof app[k] === 'string' && !app[k].trim()));
  if (missing.length) {
    return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
  }
  // 2026-05-13 hardening: tightened email check to the shared validator,
  // which also blocks CRLF (\r\n) header-injection. Critical here because
  // `app.email` flows directly into the Resend `reply_to:` header on the
  // notification email below — without the CRLF check, a crafted email
  // value could inject arbitrary mail headers.
  if (!looksLikeValidEmail(app.email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email format' });
  }
  if (!Array.isArray(app.triedAlready) || app.triedAlready.length === 0) {
    return res.status(400).json({ ok: false, error: 'Select at least one item under "what you have tried"' });
  }

  // Add server-side timestamp
  const submittedAt = new Date().toISOString();
  app.submittedAt = submittedAt;

  // Send notification + auto-confirm
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Email service not configured. Email braveworksrn@gmail.com directly.' });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Notification to Joel — this is the primary record. reply_to set to
  // applicant so Joel can respond directly from his inbox. `app.email` has
  // been shape-validated + CRLF-injection-checked above; safe to use here.
  const trimmedApplicantEmail = app.email.trim();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: NOTIFY_TO,
    reply_to: trimmedApplicantEmail,
    subject: `[1:1 APPLICATION] ${app.firstName} ${app.lastName} — BP Triangle`,
    html: buildJoelEmail(app),
  });

  // Auto-confirm to applicant
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: app.email,
    reply_to: REPLY_TO,
    subject: 'Got your 1:1 application — Joel',
    html: buildApplicantEmail(app),
  });

  return res.status(200).json({ ok: true, submittedAt });
}
