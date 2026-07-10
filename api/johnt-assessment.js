// POST /api/johnt-assessment
//
// Receives John Treadwell's 30-day program assessment (completed by his
// daughter Berneita on his behalf), stores it in KV with a 90-day TTL,
// generates a branded PDF, and emails Joel a structured summary with the
// PDF attached. Single-recipient — this is a private 1:1 client, not
// shared with Annie.
//
// Returns { ok, assessmentId } so the thank-you screen can offer a
// download link at /api/johnt-assessment-pdf?id=<assessmentId>.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { SECTION_MAP, formatAnswer } from './_johnt-schema.js';
import { generateJohnTPDF } from './_johnt-pdf.js';

const NOTIFY_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
const FROM = 'BraveWorks Intake <intake@bpquiz.com>';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderEmailHtml(answers, submittedAt) {
  const sections = SECTION_MAP.map((s) => {
    const populated = s.fields.filter(([id]) => {
      const v = answers[id];
      if (Array.isArray(v)) return v.length > 0;
      return String(v ?? '').trim().length > 0;
    });
    if (populated.length === 0) return '';
    const rows = populated.map(([id, label]) => {
      const v = formatAnswer(answers[id]);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:200px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(v)}</td>
      </tr>`;
    }).join('');
    return `
      <h2 style="font-family:Georgia,serif;font-size:14px;color:#3F5A3C;margin:20px 0 6px;border-bottom:1px solid #E6DECE;padding-bottom:5px;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(s.title)}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>
    `;
  }).join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#FFFDF7;border-radius:14px;border:1px solid #E6DECE;">
        <tr><td style="padding:24px 24px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;">30-day program assessment submitted</div>
          <h1 style="font-family:Georgia,serif;font-size:22px;margin:6px 0 4px;color:#2C2A26;">John Treadwell</h1>
          <p style="font-size:12px;color:#9C9485;margin:0;">Submitted ${escapeHtml(submittedAt)} · Branded PDF is attached</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;">${sections}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Constant-time token comparison — same pattern as the Wakita/Luvenia intakes.
function tokensMatch(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string') return false;
  if (!supplied || !expected) return false;
  if (supplied.length !== expected.length) return false;
  try {
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('node:crypto').timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Gated when JOHNT_ASSESSMENT_SECRET is set; otherwise the private
  // /JohnT URL (texted/emailed directly to Berneita) is the bridge, same
  // pattern as the Wakita intake.
  const expectedToken = process.env.JOHNT_ASSESSMENT_SECRET || '';
  if (expectedToken) {
    const supplied =
      (req.query?.token && String(req.query.token)) ||
      String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() ||
      '';
    if (!tokensMatch(supplied, expectedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('johnt-assessment: JOHNT_ASSESSMENT_SECRET not set — running ungated.');
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body — expected JSON' });
  }
  const answers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
  const submittedAt = String(req.body.submittedAt || new Date().toISOString());

  const assessmentId = String(Date.now());

  // 1. Persist in KV with 90-day TTL
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(`johnt-assessment:${assessmentId}`, { assessmentId, answers, submittedAt }, { ex: 90 * 86400 });
      await kv.set('johnt-assessment:latest', { assessmentId, submittedAt }, { ex: 90 * 86400 });
    } catch (err) {
      console.error('johnt-assessment: KV store failed', err.message);
    }
  }

  // 2. Generate branded PDF
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateJohnTPDF({ answers, submittedAt });
  } catch (err) {
    console.error('johnt-assessment: PDF generation failed', err.message);
  }

  // 3. Email Joel with structured HTML + PDF attached
  try {
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: 'braveworksrn@gmail.com',
      subject: `[John Treadwell] Assessment submitted — 30-day program`,
      html: renderEmailHtml(answers, submittedAt),
      attachments: pdfBuffer ? [{
        filename: 'john-treadwell-assessment.pdf',
        content: pdfBuffer.toString('base64'),
      }] : undefined,
    });
  } catch (err) {
    console.error('johnt-assessment: email send failed', err.message);
  }

  return res.status(200).json({ ok: true, assessmentId, submittedAt });
}
