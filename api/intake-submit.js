// POST /api/intake-submit?slug=karen-bush&token=...
//
// Body: { answers: { [qid]: string }, sectionIndex: number }
// On success:
//   1. Validates required (load-bearing) questions
//   2. Writes the markdown answers to KV under <slug>:submission
//      (Vercel runtime is read-only — Joel's heartbeat or manual workflow
//      pulls this back into the repo at voice/<slug>/intake-bundle/intake-form-answers.md)
//   3. Burns the token (sets <slug>:used)
//   4. Emails Joel a notification
//   5. Returns 200 with a thank-you redirect

import { Resend } from 'resend';
import {
  checkToken,
  storeSet,
  readJsonBody,
} from './_intake-shared.js';

const NOTIFY_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';
const FROM = 'Practice Launcher Intake <intake@bpquiz.com>';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Load-bearing question IDs — refuse submit if any are blank.
// Mirror IntakeFormPage.jsx required: true questions.
const REQUIRED_IDS = [
  'q1_full_name',
  'q5_the_moment',
  'q8_ideal_client',
  'q12_direct_speech',
  'q25_tuesday_morning',
];

// Section + question metadata mirrored from IntakeFormPage.jsx so the
// generated markdown reads cleanly without depending on the React bundle.
// If you add or rename a question on the form, mirror it here.
const SECTIONS = [
  {
    title: 'Identity',
    items: [
      ['q1_full_name', 'Full name + how you want to be addressed'],
      ['q2_designation', 'Professional designation + credentials'],
      ['q3_years_in_practice', 'Years in practice — total + in this niche'],
      ['q4_location', 'Where they practice from — geographic + virtual'],
    ],
  },
  {
    title: 'Origin Story',
    items: [
      ['q5_the_moment', 'The moment they decided this is what they wanted to do'],
      ['q6_first_year', 'What the first year looked like'],
      ['q7_elevator_pitch', "Their 'what do you do' answer in their voice"],
    ],
  },
  {
    title: 'Niche + Audience',
    items: [
      ['q8_ideal_client', 'Ideal client — described specifically'],
      ['q9_sick_of_hearing', 'What their ideal client is sick of hearing'],
      ['q10_90_day_result', '90-day result they deliver'],
      ['q11_surprising_question', 'The surprising client question'],
    ],
  },
  {
    title: 'Voice + Phrasing',
    items: [
      ['q12_direct_speech', 'Direct speech sample — how they talk to a client'],
      ['q13_signature_phrase', 'Signature phrase they repeat'],
      ['q14_banned_phrase', 'Phrase they hate from other practitioners'],
      ['q15_humor', 'Humor comfort level'],
      ['q16_vulnerability', 'Vulnerability comfort level'],
    ],
  },
  {
    title: 'Faith + Values',
    items: [
      ['q17_faith_posture', 'Faith posture'],
      ['q17b_faith_notes', 'Faith notes'],
      ['q18_off_limits', 'Off-limits topics'],
      ['q19_healing_approach', 'Healing approach descriptors'],
    ],
  },
  {
    title: 'Existing Assets',
    items: [
      ['q20_voice_canon', 'Existing content treated as voice canon'],
      ['q21_email_list', 'Existing email list — platform, size, last broadcast'],
      ['q22_existing_offers', 'Existing offers — pricing + conversion'],
      ['q23_tech_stack', 'Tech stack — what stays, what gets retired'],
      ['q24_what_failed', "What they've tried that didn't work"],
    ],
  },
  {
    title: 'Future Self',
    items: [
      ['q25_tuesday_morning', '12-months-out Tuesday morning, in detail'],
      ['q26_10k_client', 'Client at $10K/month — who, charging what, turning what away'],
      ['q27_headline', 'Headline they want to read about their business'],
      ['q28_edge_of_expansion', 'The version of the work that scares them to commit publicly'],
    ],
  },
  {
    title: 'Logistics',
    items: [
      ['q29_calendly', 'Calendly URL'],
      ['q30_stripe', 'Stripe status'],
      ['q31_domain', 'Domain ownership'],
      ['q32_email_forwarding', 'Email forwarding preference'],
      ['q33_async_channel', 'Preferred async channel for the install'],
      ['q34_audio_links', 'Voice-training audio links'],
    ],
  },
];

function buildMarkdown({ slug, clientName, clientEmail, answers, submittedAt }) {
  const date = new Date(submittedAt).toISOString().slice(0, 10);
  const head = [
    `# Voice Intake — ${clientName || slug}`,
    '',
    `*Submitted ${new Date(submittedAt).toUTCString()} via async intake form (\`/intake/${slug}\`).*`,
    `*Source: \`bpquiz-site/api/intake-submit.js\`. Mirrors questions in \`voice/intake-questions.md\`.*`,
    '',
    `- **Client slug:** \`${slug}\``,
    `- **Client name:** ${clientName || '(not provided)'}`,
    `- **Client email:** ${clientEmail || '(not provided)'}`,
    `- **Submission date:** ${date}`,
    '',
    '---',
    '',
  ].join('\n');

  const body = SECTIONS.map((section, idx) => {
    const lines = [`## Part ${idx + 1} — ${section.title}`, ''];
    for (const [qid, label] of section.items) {
      const v = (answers[qid] || '').trim();
      lines.push(`### ${qid} — ${label}`);
      lines.push('');
      lines.push(v || '*(not answered)*');
      lines.push('');
    }
    return lines.join('\n');
  }).join('\n---\n\n');

  return head + body + '\n---\n\n*This file is the source of truth for the voice-profile-generator agent.*\n';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderJoelEmail({ slug, clientName, clientEmail, answers, submittedAt }) {
  const previewKeys = [
    ['Origin moment', answers.q5_the_moment],
    ['Ideal client', answers.q8_ideal_client],
    ['Direct speech sample', answers.q12_direct_speech],
    ['Tuesday morning at 12 months', answers.q25_tuesday_morning],
  ];
  const previewRows = previewKeys
    .map(([label, v]) => {
      const text = String(v || '').trim();
      const snippet = text.length > 320 ? text.slice(0, 320) + '...' : text;
      return `<tr><td style="padding:10px 14px;border-bottom:1px solid #E8E1D1;color:#7A7061;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:200px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:10px 14px;border-bottom:1px solid #E8E1D1;color:#121110;font-size:13px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(snippet) || '<em>not answered</em>'}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F3EC;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EC;">
  <tr><td align="center" style="padding:24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#FBF8F1;border-radius:16px;border:1px solid #E8E1D1;">
      <tr><td style="padding:24px 24px 12px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;">Practice Launcher · Voice Intake submitted</div>
        <h1 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:8px 0 0;color:#121110;">${escapeHtml(clientName || slug)} just finished the intake form.</h1>
        <p style="font-size:13px;color:#7A7061;margin:6px 0 0;">slug: <code>${escapeHtml(slug)}</code> · email: ${escapeHtml(clientEmail || 'unknown')}</p>
      </td></tr>
      <tr><td style="padding:8px 24px 16px;">
        <p style="font-size:14px;line-height:1.55;color:#2B2824;margin:0 0 12px;">
          Voice-profile generation has been queued. Run:
        </p>
        <pre style="background:#2E3A30;color:#FBF8F1;padding:12px 14px;border-radius:8px;font-size:12px;line-height:1.5;overflow-x:auto;">node tools/voice-profile-generator.js \\
  --intake-bundle voice/${escapeHtml(slug)}/intake-bundle/intake-form-answers.md \\
  --client-slug ${escapeHtml(slug)}</pre>
        <p style="font-size:12px;color:#7A7061;margin:8px 0 0;">(once you've pulled the markdown out of KV with <code>node tools/intake-export.js --slug ${escapeHtml(slug)}</code> &mdash; or whatever export script you wire up)</p>
      </td></tr>
      <tr><td style="padding:8px 24px 16px;">
        <h2 style="font-family:Georgia,serif;font-size:16px;color:#121110;margin:12px 0 12px;">Quick preview &mdash; the four load-bearing answers</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E8E1D1;border-radius:8px;overflow:hidden;">
          ${previewRows}
        </table>
      </td></tr>
      <tr><td style="padding:8px 24px 24px;">
        <p style="font-size:12px;color:#7A7061;margin:0;">Submitted ${new Date(submittedAt).toUTCString()}.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const slug = String(req.query?.slug || '').trim();
  const token = String(req.query?.token || '').trim();

  const tk = await checkToken(slug, token);
  if (!tk.ok) {
    return res.status(tk.status).json({ ok: false, error: tk.message });
  }

  const body = await readJsonBody(req);
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};

  // Validate load-bearing answers
  const missing = REQUIRED_IDS.filter((id) => !String(answers[id] || '').trim());
  if (missing.length > 0) {
    return res.status(400).json({
      ok: false,
      error: `Some load-bearing answers are blank. Fill in: ${missing.join(', ')}.`,
      missing,
    });
  }

  const submittedAt = Date.now();
  const clientName = tk.active.clientName || '';
  const clientEmail = tk.active.clientEmail || '';

  const markdown = buildMarkdown({ slug, clientName, clientEmail, answers, submittedAt });

  // Persist final submission. Heartbeat agent / manual export pulls this back
  // into the repo at voice/<slug>/intake-bundle/intake-form-answers.md.
  await storeSet(`${slug}:submission`, {
    submittedAt,
    clientName,
    clientEmail,
    answers,
    markdown,
  });

  // Burn the token — checkToken() sees this on subsequent calls and returns 410.
  await storeSet(`${slug}:used`, { submittedAt });

  // Notify Joel. Don't block on email failure — submission is already durable.
  try {
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: clientEmail || undefined,
      subject: `[Intake submitted] ${clientName || slug} — voice profile generation queued`,
      html: renderJoelEmail({ slug, clientName, clientEmail, answers, submittedAt }),
      text:
        `Voice intake submitted by ${clientName || slug} (${clientEmail || 'unknown email'}).\n\n` +
        `Pull markdown from KV: <slug>:submission\n` +
        `Then run: node tools/voice-profile-generator.js --intake-bundle voice/${slug}/intake-bundle/intake-form-answers.md --client-slug ${slug}\n`,
    });
  } catch (err) {
    console.error('intake-submit: notify email failed', err.message);
  }

  return res.status(200).json({
    ok: true,
    slug,
    redirect: '/intake/thanks',
    message: 'Intake submitted. Joel will review within 48 hours.',
  });
}
