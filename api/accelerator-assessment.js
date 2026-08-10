// POST /api/accelerator-assessment
//
// Receives a Life Change Accelerator deep intake, stores it in KV (no TTL,
// these are client records for a 12-month program), generates a branded PDF,
// and emails Joel a structured summary with the PDF attached.
//
// Storage layout, so the read-all admin view stays cheap:
//   bwbp:accel:intake:<id>          the full record
//   bwbp:accel:intake:byemail:<em>  latest id for that member
//   bwbp:accel:intake:index         SET of ids
//
// Returns { ok, assessmentId } so the thank-you screen can offer a download at
// /api/accelerator-assessment-pdf?id=<assessmentId>.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { SECTION_MAP, HEADLINE_FIELDS, formatAnswer } from './_accelerator-schema.js';
import { generateAcceleratorPDF } from './_accelerator-pdf.js';

const NOTIFY = (process.env.ACCEL_NOTIFY_EMAILS || 'braveworksrn@gmail.com')
  .split(',').map((s) => s.trim()).filter(Boolean);
const FROM = 'BraveWorks Intake <intake@bpquiz.com>';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderEmailHtml(answers, submittedAt) {
  const headline = HEADLINE_FIELDS
    .map(([id, label]) => {
      const v = formatAnswer(answers[id]);
      if (!v) return '';
      return `<tr>
        <td style="padding:6px 12px;color:#9C9485;font-size:11px;text-transform:uppercase;letter-spacing:.06em;width:180px;vertical-align:top;">${esc(label)}</td>
        <td style="padding:6px 12px;color:#2C2A26;font-size:14px;font-weight:600;">${esc(v)}</td>
      </tr>`;
    }).join('');

  const sections = SECTION_MAP.map((s) => {
    const populated = s.fields.filter(([id]) => {
      const v = answers[id];
      if (Array.isArray(v)) return v.length > 0;
      return String(v ?? '').trim().length > 0;
    });
    if (!populated.length) return '';
    const rows = populated.map(([id, label]) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:.06em;text-transform:uppercase;width:200px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${esc(formatAnswer(answers[id]))}</td>
    </tr>`).join('');
    return `<h2 style="font-family:Georgia,serif;font-size:14px;color:#3F5A3C;margin:22px 0 6px;border-bottom:1px solid #E6DECE;padding-bottom:5px;letter-spacing:.05em;text-transform:uppercase;">${esc(s.title)}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
  }).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
<tr><td style="padding:24px 28px;">
  <div style="color:#B85A36;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Life Change Accelerator</div>
  <h1 style="font-family:Georgia,serif;font-size:24px;color:#2C2A26;margin:6px 0 4px;">${esc(formatAnswer(answers.full_name) || 'New intake')}</h1>
  <div style="color:#9C9485;font-size:12px;">Submitted ${esc(new Date(submittedAt).toLocaleString('en-US'))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#F7F3EC;border-radius:10px;margin:18px 0;">${headline}</table>
  <p style="color:#6B6355;font-size:13px;">Full intake is attached as a PDF. Every submission is also readable at <strong>/api/accelerator-assessments</strong>.</p>
  ${sections}
</td></tr></table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : null;
    if (!answers) return res.status(400).json({ error: 'Missing answers' });

    const email = String(answers.email || '').trim().toLowerCase();
    const name = formatAnswer(answers.full_name);
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Annie's scoring band from her assessment PDF: 0-2 minimal, 3-5 moderate,
    // 6+ significant. Computed here rather than asked, because making someone
    // count their own checkboxes is how you lose them on the last screen.
    const checked = Array.isArray(answers.hormone_symptoms) ? answers.hormone_symptoms.length : 0;
    if (checked > 0) {
      const band = checked <= 2 ? 'possible minimal symptoms'
        : checked <= 5 ? 'possible moderate imbalance'
        : 'possible significant hormonal distress';
      answers.hormone_symptom_count = `${checked} checked (${band})`;
    }

    const submittedAt = new Date().toISOString();
    const assessmentId = `accel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const record = { assessmentId, email, name, answers, submittedAt };

    // Persist first. If email fails we still have the intake.
    try {
      await kv.set(`bwbp:accel:intake:${assessmentId}`, record);
      await kv.set(`bwbp:accel:intake:byemail:${email}`, assessmentId);
      await kv.sadd('bwbp:accel:intake:index', assessmentId);
    } catch (err) {
      console.error('accelerator-assessment: KV write failed', err.message);
    }

    let pdf = null;
    try {
      pdf = await generateAcceleratorPDF({ answers, submittedAt });
    } catch (err) {
      console.error('accelerator-assessment: PDF generation failed', err.message);
    }

    const safeName = (name || 'member').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await getResend().emails.send({
        from: FROM,
        to: NOTIFY,
        replyTo: email,
        subject: `Accelerator intake: ${name}`,
        html: renderEmailHtml(answers, submittedAt),
        attachments: pdf
          ? [{ filename: `Accelerator-Intake-${safeName}.pdf`, content: pdf.toString('base64') }]
          : undefined,
      });
    } catch (err) {
      console.error('accelerator-assessment: notification email failed', err.message);
    }

    return res.status(200).json({ ok: true, assessmentId });
  } catch (err) {
    console.error('accelerator-assessment: unhandled', err);
    return res.status(500).json({ error: 'Something went wrong saving your assessment' });
  }
}
