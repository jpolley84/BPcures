// /api/wakita-intake — receives Wakita Cirillo Browne's pre-call intake
// from the WakitaIntakePage form.
//
// 1. Stores answers in KV under `wakita-intake:<timestamp>` (90-day TTL)
// 2. Emails Joel a structured summary so he can read it on his phone
// 3. Returns { ok: true } to the page

import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const NOTIFY_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';
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

// Section + field label map. Mirrors WakitaIntakePage.jsx — if you rename or
// add a field on the page, mirror it here so the email reads right.
const SECTION_MAP = [
  { title: 'Quick vitals', fields: [
    ['bp_recent', 'Most recent home BP'],
    ['bp_typical', 'Typical BP pattern'],
    ['bp_meds', 'BP medications'],
    ['weight', 'Weight'],
    ['height', 'Height'],
    ['waist', 'Waist'],
  ]},
  { title: 'How you feel right now', fields: [
    ['pain_status', 'Pain status'],
    ['pain_pattern', 'Pain quality'],
    ['melena_status', 'Melena status'],
    ['reflux', 'Reflux'],
    ['bloating', 'Bloating'],
    ['bowels', 'Bowels'],
    ['energy', 'Energy'],
    ['sleep', 'Sleep'],
    ['mood', 'Mood'],
    ['other_symptoms', 'Other symptoms'],
  ]},
  { title: 'Medications', fields: [
    ['ppi_status', 'PPI (pantoprazole)'],
    ['bentyl_status', 'Bentyl (dicyclomine)'],
    ['simethicone_use', 'Simethicone'],
    ['tylenol_use', 'Tylenol'],
    ['benadryl_use', 'Benadryl + itching'],
    ['nsaid_history', 'NSAID history'],
  ]},
  { title: 'Bio Life regimen (Mexico)', fields: [
    ['biolife_started', 'Started Bio Life'],
    ['biolife_feelings', 'Bio Life subjective'],
    ['biolife_side_effects', 'Bio Life side effects'],
    ['biolife_selenium_dose', 'Selenium Plus dose'],
    ['biolife_chaparro_response', 'Chaparro Amargo reaction'],
    ['biolife_pink_powder', 'Pink powder identity'],
    ['mexico_notes', 'Mexico clinic notes'],
  ]},
  { title: 'Existing supplements', fields: [
    ['supps_still_taking', 'Still taking'],
    ['supps_dropped', 'Already dropped'],
    ['supps_other', 'Other supplements/meds/herbs'],
  ]},
  { title: 'Diet', fields: [
    ['breakfast', 'Breakfast'],
    ['lunch', 'Lunch'],
    ['dinner', 'Dinner'],
    ['snacks', 'Snacks'],
    ['water', 'Water'],
    ['coffee_tea', 'Coffee/tea'],
    ['alcohol', 'Alcohol'],
    ['sugar_sweets', 'Sweets/soda/juice'],
    ['gluten_dairy', 'Suspected food triggers'],
  ]},
  { title: 'Lifestyle + stress', fields: [
    ['movement', 'Movement'],
    ['stress_now', 'Stress 1-10 + drivers'],
    ['stress_signal', 'Body stress signal'],
    ['sun_time', 'Sun time'],
    ['home', 'Home life'],
    ['work', 'Work'],
  ]},
  { title: 'Family history', fields: [
    ['fam_htn', 'HTN'],
    ['fam_diabetes', 'Diabetes'],
    ['fam_cardiac', 'Cardiac'],
    ['fam_cancer', 'Cancer'],
    ['fam_autoimmune', 'Autoimmune'],
    ['fam_gi', 'GI'],
  ]},
  { title: 'Personal history', fields: [
    ['pcp_status', 'PCP status'],
    ['asa_grade_iii', 'ASA Grade III context'],
    ['menopause', 'Menopause + HRT'],
    ['surgeries', 'Surgeries'],
    ['allergies', 'Allergies'],
    ['smoke_vape', 'Smoking/vaping'],
  ]},
  { title: 'Goals', fields: [
    ['why_now', 'Why now'],
    ['top_3_goals', 'Top 3 90-day goals'],
    ['biggest_fear', 'Biggest fear'],
    ['past_attempts', 'Past attempts'],
    ['support_at_home', 'Support at home'],
  ]},
  { title: 'Questions for Joel', fields: [
    ['questions_for_joel', 'Her questions'],
    ['preferred_followup', 'Preferred follow-up channel'],
  ]},
];

function renderEmailHtml(answers, submittedAt) {
  const sections = SECTION_MAP.map((s) => {
    const rows = s.fields.map(([id, label]) => {
      const v = String(answers[id] || '').trim();
      const cell = v ? escapeHtml(v) : '<em style="color:#9C9485;">(blank)</em>';
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:200px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${cell}</td>
      </tr>`;
    }).join('');
    return `
      <h2 style="font-family:Georgia,serif;font-size:15px;color:#3F5A3C;margin:24px 0 8px;border-bottom:1px solid #E6DECE;padding-bottom:6px;">${escapeHtml(s.title)}</h2>
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
          <p style="font-size:12px;color:#9C9485;margin:0;">Submitted ${escapeHtml(submittedAt)} · Call: tomorrow noon</p>
        </td></tr>
        <tr><td style="padding:8px 24px 24px;">${sections}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderEmailText(answers, submittedAt) {
  const lines = [`Wakita Cirillo Browne — pre-call intake submitted ${submittedAt}`, ''];
  for (const s of SECTION_MAP) {
    lines.push(`## ${s.title}`);
    for (const [id, label] of s.fields) {
      const v = String(answers[id] || '').trim();
      lines.push(`${label}: ${v || '(blank)'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body — expected JSON' });
  }
  const answers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
  const submittedAt = String(req.body.submittedAt || new Date().toISOString());

  // 1. Persist in KV with 90-day TTL
  if (process.env.KV_REST_API_URL) {
    try {
      const kvKey = `wakita-intake:${Date.now()}`;
      await kv.set(kvKey, { answers, submittedAt, client: 'wakita-cirillo-browne' }, { ex: 90 * 86400 });
    } catch (err) {
      console.error('wakita-intake: KV store failed', err.message);
      // Continue — email is the main thing
    }
  }

  // 2. Email Joel
  try {
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: 'braveworksrn@gmail.com',
      subject: `[Wakita intake] Submitted — call tomorrow at noon`,
      html: renderEmailHtml(answers, submittedAt),
      text: renderEmailText(answers, submittedAt),
    });
  } catch (err) {
    console.error('wakita-intake: email failed', err.message);
    // KV save was the durable copy — don't fail the user's submit
  }

  return res.status(200).json({ ok: true, submittedAt });
}
