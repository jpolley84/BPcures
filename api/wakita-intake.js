// POST /api/wakita-intake
//
// Receives Wakita Cirillo Browne's pre-call intake answers, stores them in
// KV with a 90-day TTL, generates a branded PDF, and emails Joel a
// structured summary with the PDF attached.
//
// Returns { ok, intakeId } so the success page can offer a download link
// at /api/wakita-intake-pdf?id=<intakeId>.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { SECTION_MAP, formatAnswer } from './_wakita-schema.js';
import { generateWakitaPDF } from './_wakita-pdf.js';

// 2026-05-14: changed default from brave.works.marketing@gmail.com to
// braveworksrn@gmail.com (Joel's primary operational inbox). See the
// matching note in coaching-apply.js for the reasoning.
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
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;">Pre-call intake submitted</div>
          <h1 style="font-family:Georgia,serif;font-size:22px;margin:6px 0 4px;color:#2C2A26;">Wakita Cirillo Browne</h1>
          <p style="font-size:12px;color:#9C9485;margin:0;">Submitted ${escapeHtml(submittedAt)} · Branded PDF is attached</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;">${sections}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Constant-time token comparison. We compare BUFFERS not strings so an
// attacker can't shave bits off by timing. Lengths-must-match first; if
// they don't, return false without leaking the secret length.
function tokensMatch(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string') return false;
  if (!supplied || !expected) return false;
  if (supplied.length !== expected.length) return false;
  try {
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    // crypto imported lazily — avoid top-of-file import to keep cold-start lean
    // when the token check short-circuits early on bad-shape inputs above.
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

  // 2026-05-14 hardening (audit P0-1): require WAKITA_INTAKE_SECRET token
  // to gate this endpoint when the secret is configured. Without a secret
  // configured this is a single-named-recipient form (Wakita) reachable
  // only via the private `/wakita` URL Joel texts her — URL-obscurity is
  // an acceptable bridge while env wiring catches up. Accept token from
  // EITHER ?token= or Authorization: Bearer.
  //
  // 2026-05-17 fix: changed unset-secret behavior from hard-500 to
  // warn-and-allow. The hard-500 cost Wakita her Sunday-night submission
  // because the env var was never wired in Vercel after the May-14
  // hardening commit. The form posted, the API rejected, she screenshotted.
  const expectedToken = process.env.WAKITA_INTAKE_SECRET || '';
  if (expectedToken) {
    const supplied =
      (req.query?.token && String(req.query.token)) ||
      String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() ||
      '';
    if (!tokensMatch(supplied, expectedToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('wakita-intake: WAKITA_INTAKE_SECRET not set — running ungated. Wire the env var in Vercel to re-enable the token check.');
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body — expected JSON' });
  }
  const answers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
  const submittedAt = String(req.body.submittedAt || new Date().toISOString());

  const intakeId = String(Date.now());

  // 1. Persist in KV with 90-day TTL — both the answers and a copy keyed
  //    by intakeId so the download endpoint can pull it back.
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(`wakita-intake:${intakeId}`, { intakeId, answers, submittedAt }, { ex: 90 * 86400 });
      // Also store as the "latest" pointer for easy lookup
      await kv.set('wakita-intake:latest', { intakeId, submittedAt }, { ex: 90 * 86400 });
    } catch (err) {
      console.error('wakita-intake: KV store failed', err.message);
    }
  }

  // 2. Generate branded PDF
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateWakitaPDF({ answers, submittedAt });
  } catch (err) {
    console.error('wakita-intake: PDF generation failed', err.message);
    // Don't fail the user — they can still download via the endpoint later
  }

  // 3. Email Joel with structured HTML + PDF attached
  try {
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: 'braveworksrn@gmail.com',
      subject: `[Wakita Week-1 deep-dive] Submitted — coaching call today`,
      html: renderEmailHtml(answers, submittedAt),
      attachments: pdfBuffer ? [{
        filename: 'wakita-intake.pdf',
        content: pdfBuffer.toString('base64'),
      }] : undefined,
    });
  } catch (err) {
    console.error('wakita-intake: email send failed', err.message);
    // KV save is the durable copy — don't fail submit
  }

  return res.status(200).json({ ok: true, intakeId, submittedAt });
}
