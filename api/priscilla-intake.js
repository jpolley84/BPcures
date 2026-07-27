// api/priscilla-intake.js — the deep 90-Day intake behind /priscilla-assessment.
// Priscilla Harlins ($1,997 All-In). On submit: store in KV (90-day TTL) and
// email Joel every answer grouped by section, her structured labs, and any
// uploaded lab photos/PDFs attached, then confirm to her with the onboarding
// Calendly link. Uploaded documents ride in as base64 in the JSON body, so the
// body cap is raised and attachments are validated hard.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const JOEL_NOTIFY = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
const CALENDLY_URL = process.env.CALENDLY_BOOKING_URL || 'https://calendly.com/braveworksrn/60min';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const MAX_ATTACHMENTS = 8;
const MAX_ATTACH_BYTES = 4_000_000;
const ALLOWED_ATTACH = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/i;
const LAB_LABELS = {
  bp: 'Latest BP', platelets: 'Platelet count', a1c: 'A1C / glucose', cholesterol: 'Cholesterol (total/LDL)',
  potassium: 'Potassium', magnesium: 'Magnesium', kidney: 'Kidney (eGFR/creatinine)', thyroid: 'Thyroid (TSH)', hormones: 'Hormone labs',
};

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid body' });

  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required' });

  // Ordered [{section,label,value}] straight from the page.
  const answers = Array.isArray(req.body.answers)
    ? req.body.answers.slice(0, 120).map((a) => ({ section: clean(a.section, 120), label: clean(a.label, 200), value: clean(a.value, 4000) }))
    : [];
  const answered = answers.filter((a) => a.value);
  if (answered.length < 3) return res.status(400).json({ error: 'Please fill in the assessment before sending' });

  const labs = {};
  const rawLabs = req.body.labs && typeof req.body.labs === 'object' ? req.body.labs : {};
  for (const key of Object.keys(LAB_LABELS)) { const v = clean(rawLabs[key], 80); if (v) labs[key] = v; }

  const attachments = [];
  const rawAtt = Array.isArray(req.body.attachments) ? req.body.attachments.slice(0, MAX_ATTACHMENTS) : [];
  let total = 0;
  for (const a of rawAtt) {
    if (!a || typeof a.contentBase64 !== 'string') continue;
    if (!ALLOWED_ATTACH.test(String(a.type || '').toLowerCase())) continue;
    const bytes = Math.ceil((a.contentBase64.length * 3) / 4);
    if (bytes <= 0 || total + bytes > MAX_ATTACH_BYTES) continue;
    total += bytes;
    attachments.push({ filename: clean(a.filename, 120) || `document-${attachments.length + 1}`, content: a.contentBase64 });
  }

  const submittedAt = new Date().toISOString();

  // Store (never let a KV hiccup block the buyer's submission).
  try {
    await kv.set(`bwbp:priscilla-intake:${email}`, { name, email, answers, labs, attachmentNames: attachments.map((a) => a.filename), submittedAt }, { ex: 120 * 86400 });
    const dripKey = `bwbp:drip:${email}`;
    const drip = await kv.get(dripKey);
    if (drip) await kv.set(dripKey, { ...drip, priscillaIntakeAt: submittedAt });
  } catch (err) { console.error('priscilla-intake KV write failed', err.message); }

  // Group answers by section for Joel's email.
  const order = [];
  const bySection = new Map();
  for (const a of answers) {
    if (!bySection.has(a.section)) { bySection.set(a.section, []); order.push(a.section); }
    bySection.get(a.section).push(a);
  }
  const sectionHtml = order.map((sec) => {
    const rows = bySection.get(sec).map((a) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;width:210px;vertical-align:top;">${esc(a.label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${esc(a.value) || '<span style="color:#B9B2A3;">(blank)</span>'}</td></tr>`).join('');
    return `<h2 style="font-family:Georgia,serif;font-size:14px;color:#3F5A3C;margin:22px 0 6px;border-bottom:1px solid #E6DECE;padding-bottom:5px;letter-spacing:0.05em;text-transform:uppercase;">${esc(sec)}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
  }).join('');
  const labHtml = Object.keys(labs).length
    ? `<h2 style="font-family:Georgia,serif;font-size:14px;color:#3F5A3C;margin:22px 0 6px;border-bottom:1px solid #E6DECE;padding-bottom:5px;letter-spacing:0.05em;text-transform:uppercase;">Recent lab values</h2>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${Object.entries(labs).map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;text-transform:uppercase;width:210px;">${esc(LAB_LABELS[k])}</td><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;">${esc(v)}</td></tr>`).join('')}</table>`
    : '';
  const attachNote = attachments.length ? `<p style="margin:18px 0 0;font-size:13px;color:#3F5A3C;"><strong>${attachments.length} document(s) attached:</strong> ${attachments.map((a) => esc(a.filename)).join(', ')}</p>` : '<p style="margin:18px 0 0;font-size:13px;color:#9C9485;">No documents uploaded.</p>';

  const joelHtml = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#FBF8F1;color:#2C2A26;">
    <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#B85A36;font-weight:800;margin:0 0 6px;">90-Day Foundation Intake</p>
    <h1 style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px;">${esc(name || email)}</h1>
    <p style="font-size:13px;color:#7A7061;margin:0 0 12px;">${esc(email)} · submitted ${submittedAt}</p>
    ${sectionHtml}${labHtml}${attachNote}
  </div>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'BraveWorks Intake <intake@bpquiz.com>',
      to: JOEL_NOTIFY,
      replyTo: email,
      subject: `[90-DAY INTAKE] ${name || email} — build the plan`,
      html: joelHtml,
      ...(attachments.length ? { attachments } : {}),
    });
  } catch (err) {
    console.error('priscilla-intake Joel alert failed', err.message);
    return res.status(500).json({ error: 'Could not deliver, please try again' });
  }

  // Confirm to her, with the onboarding call link.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: email,
      replyTo: JOEL_NOTIFY,
      subject: 'Got your foundation. Now book our call.',
      text: `Hi ${name ? name.split(' ')[0] : 'there'},\n\nYour 90-Day foundation just landed on my desk, and I have read enough already to tell you this was worth every minute.\n\nOne step left, and it is the one that starts everything: book our 90-Day onboarding call. Pick a time here:\n\n${CALENDLY_URL}\n\nBefore we talk I will sit down with everything you sent, your answers, your numbers, and any documents you uploaded, and I will come to the call with your plan already taking shape.\n\nTalk soon,\nJoel Polley, RN\n\nThis is education and lifestyle support alongside your doctor, never instead of them. Your doctor makes every medication call.`,
    });
  } catch (err) { console.error('priscilla-intake buyer confirm failed', err.message); }

  return res.status(200).json({ ok: true });
}
