import { Resend } from 'resend';
import {
  scoreAnswers,
  tierForScore,
  TIER_DETAILS,
  QUESTIONS,
  buildSlug,
} from './_launcher-quiz-shared.js';

const RESEND_LAUNCHER_AUDIENCE_ID =
  process.env.RESEND_LAUNCHER_AUDIENCE_ID ||
  'ad46af78-a3b5-467f-8006-f56eeee26841';

const NOTIFY_EMAIL =
  process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function safeText(v, max = 500) {
  return String(v || '').slice(0, max);
}

function findOptionLabel(qid, value) {
  const q = QUESTIONS.find((x) => x.id === qid);
  if (!q) return value;
  const opt = q.options.find((o) => o.value === value);
  return opt ? opt.label : value;
}

async function addContactToResendAudience({ email, name, tierKey }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: 'no_key' };

  const [firstName, ...rest] = (name || '').trim().split(/\s+/);
  const lastName = rest.join(' ');

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${RESEND_LAUNCHER_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName || '',
          last_name: lastName || '',
          unsubscribed: false,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, body: text.slice(0, 200), tierKey };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, contactId: data?.id, tierKey };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function renderJoelNotification({ name, email, handle, answers, tier, score }) {
  const tierName = tier?.name || 'Unknown';

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Handle / Site', handle],
    ['Recommended Tier', `${tierName} (${tier?.price || ''})`],
    ['Composite Score', `${score.composite} / 100`],
    ['Revenue dim', score.revenue],
    ['Audience dim', score.audience],
    ['Infra dim', score.infra],
    ['Cert', findOptionLabel('cert', answers.cert)],
    ['Monthly revenue', findOptionLabel('revenue', answers.revenue)],
    ['Audience size', findOptionLabel('audience', answers.audience)],
    ['Niche specificity', findOptionLabel('niche', answers.niche)],
    ['Content cadence', findOptionLabel('cadence', answers.cadence)],
    ['Biggest blocker', findOptionLabel('blocker', answers.blocker)],
    ['Tech stack', findOptionLabel('stack', answers.stack)],
    ['Why now', answers.why_now || '(not provided)'],
  ];

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#7A7061;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;width:160px;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#121110;font-size:14px;line-height:1.55;">${escapeHtml(String(v ?? ''))}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:24px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:16px;border:1px solid #E8E1D1;">
      <tr><td style="padding:24px 24px 8px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B85A36;font-weight:600;">Practice Launcher Quiz</div>
        <h1 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:8px 0 0;color:#121110;">${escapeHtml(name || '(no name)')} · ${escapeHtml(tierName)}</h1>
        <p style="font-size:13px;color:#7A7061;margin:6px 0 0;">Score: ${score.composite}/100</p>
      </td></tr>
      <tr><td style="padding:8px 24px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${tableRows}
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = safeText(body.name, 80).trim();
  const email = safeText(body.email, 200).trim().toLowerCase();
  const handle = safeText(body.handle, 200).trim();
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : null;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!handle) return res.status(400).json({ error: 'A website or social handle is required' });
  if (!answers) return res.status(400).json({ error: 'Quiz answers are required' });

  // Sanitize answers — only keep known keys
  const allowedQuestionIds = new Set(QUESTIONS.map((q) => q.id).concat(['why_now']));
  const cleanAnswers = {};
  for (const k of Object.keys(answers)) {
    if (allowedQuestionIds.has(k)) {
      cleanAnswers[k] = safeText(answers[k], 1500);
    }
  }

  // Required choice questions present
  const requiredChoices = QUESTIONS.map((q) => q.id);
  for (const id of requiredChoices) {
    if (!cleanAnswers[id]) {
      return res.status(400).json({ error: `Missing answer: ${id}` });
    }
  }

  const score = scoreAnswers(cleanAnswers);
  const tierKey = tierForScore(score, cleanAnswers);
  const tier = TIER_DETAILS[tierKey];
  const slug = buildSlug({ email, name, handle, answers: cleanAnswers, tierKey, score });

  // Fire-and-forget Resend audience add — don't block the user
  addContactToResendAudience({ email, name, tierKey }).catch(() => {});

  // Joel notification email
  try {
    const html = renderJoelNotification({
      name,
      email,
      handle,
      answers: cleanAnswers,
      tier,
      score,
    });
    await getResend().emails.send({
      from: 'Practice Launcher Quiz <quiz@bpquiz.com>',
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `[Practice Launcher Quiz] ${name} / ${tier?.name || tierKey} — score ${score.composite}/100`,
      html,
    });
  } catch (err) {
    // Don't block the user on email failure — they still get their results
  }

  return res.status(200).json({
    slug,
    tierKey,
    tierName: tier?.name || tierKey,
    score,
  });
}
