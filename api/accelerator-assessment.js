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
// After a successful save it also stamps the buyer's cohort record,
//   bwbp:allin:<em>                 status -> 'assessment_received', assessmentId, assessmentAt
// but only if that record already exists (read-merge-write, never created here).
//
// Returns { ok, assessmentId } so the thank-you screen can offer a download at
// /api/accelerator-assessment-pdf?id=<assessmentId>.

import { Resend } from './_resend.js';
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

// ── Stamp the buyer's cohort record ─────────────────────────────────────────
// processAllIn (triangle-webhook.js) writes bwbp:allin:<email> with
// status 'awaiting_assessment' and nothing ever moved it off that value, so
// every All-In buyer read as "no assessment yet" forever and anything keyed on
// that status was blind. Rules:
//   - read-merge-write: hand-stamped fields (agreementSignedAt, agreementSentAt)
//     survive untouched
//   - never create the record: a non-buyer can submit this form
//   - only move from 'awaiting_assessment'. A later re-submission refreshes
//     assessmentId/assessmentAt on an 'assessment_received' record so it keeps
//     agreeing with bwbp:accel:intake:byemail:<email>. 'withdrawn', 'active',
//     or any other status is left exactly as it is.
//   - non-fatal: a KV failure here must never fail the intake response
const ALLIN_STAMPABLE = new Set(['awaiting_assessment', 'assessment_received']);

// Pure. Returns { next } with the merged record to write, or { skip } with why not.
export function planAllInAssessmentUpdate(rec, assessmentId, assessmentAt) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return { skip: 'no_record' };
  if (!ALLIN_STAMPABLE.has(rec.status)) return { skip: `status:${rec.status ?? 'missing'}` };
  return { next: { ...rec, status: 'assessment_received', assessmentId, assessmentAt } };
}

async function markAllInAssessmentReceived(email, assessmentId, assessmentAt) {
  const key = `bwbp:allin:${email}`;
  try {
    const rec = await kv.get(key);
    const plan = planAllInAssessmentUpdate(rec, assessmentId, assessmentAt);
    if (plan.skip) return { updated: false, reason: plan.skip };
    await kv.set(key, plan.next);
    return { updated: true };
  } catch (err) {
    console.error('accelerator-assessment: could not stamp assessment on the coaching record (non-fatal)', email, err.message);
    return { updated: false, reason: 'kv_error' };
  }
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
    let saved = false;
    try {
      await kv.set(`bwbp:accel:intake:${assessmentId}`, record);
      await kv.set(`bwbp:accel:intake:byemail:${email}`, assessmentId);
      await kv.sadd('bwbp:accel:intake:index', assessmentId);
      saved = true;
    } catch (err) {
      console.error('accelerator-assessment: KV write failed', err.message);
    }

    // Only after the intake itself is on disk. assessmentAt = submittedAt so the
    // cohort record and the intake record carry the same timestamp.
    if (saved) await markAllInAssessmentReceived(email, assessmentId, submittedAt);

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
