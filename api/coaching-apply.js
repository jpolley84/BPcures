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
import { looksLikeValidEmail } from './_email-validation.js';

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

// 2026-05-14 hardening (audit P0-2): per-IP rate limit, mirrors the
// lead-magnet.js + challenge-signup.js pattern. Each apply triggers
// 2 Resend emails (Joel + applicant ack) — uncapped, an attacker could
// blow through Resend quota + burn sender reputation in minutes.
async function checkRateLimit(ip) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `ca-rl:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= 5) return { ok: false, count };
    if (count === 0) await kv.set(key, 1, { ex: 3600 });
    else await kv.incr(key);
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('coaching-apply: rate-limit check failed (allowing):', err.message);
    return { ok: true };
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2026-05-14 hardening: rate-limit BEFORE accepting body (so attackers
  // can't exhaust Resend quota or burn sender rep from one IP).
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    console.warn(`coaching-apply: rate-limited ip=${ip} count=${rl.count}`);
    return res.status(429).json({ error: 'Too many applications from this IP. Try again in an hour.' });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body — expected JSON' });
  }

  // Founding cohort closes 2026-05-17 23:59 ET = 2026-05-18 03:59 UTC.
  // Reject any submission attempted after that instant — defense in depth
  // beyond the frontend's UI-state check (someone could POST directly).
  // Update this constant + the matching one in CoachingPage.jsx when
  // rolling the next cohort.
  const FOUNDING_COHORT_CLOSE_ISO = '2026-05-18T03:59:00Z';
  if (Date.now() >= new Date(FOUNDING_COHORT_CLOSE_ISO).getTime()) {
    return res.status(410).json({
      error: 'Applications for the founding cohort closed 2026-05-17 11:59 PM ET. Email braveworksrn@gmail.com with subject "Next cohort" to be added to the waitlist.',
    });
  }

  // 2026-05-13: expanded from 7 fields to 17 to filter tire kickers using
  // Chris Do (diagnose-before-prescribe), Priestley (score-on-the-doors),
  // Myron Golden (cost-of-inaction), Hormozi (investment-range disqualifier),
  // and Brunson (decision-maker filter).
  const {
    name, email, phone,
    ageRange, bpRange, bpMeds,
    healthScore, sleepScore, stressScore,
    costOfInaction, commitment, pastAttempts, successLook,
    investmentRange, decisionMaker, whenStart, whyNow,
    foundMe,
  } = req.body;

  // Required-field validation — mirrors the page's required list.
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!whyNow || typeof whyNow !== 'string' || !whyNow.trim()) {
    return res.status(400).json({ error: '"Why now?" is required — Joel uses it to screen for fit' });
  }
  for (const [key, label] of [
    ['ageRange', 'Age range'], ['bpRange', 'BP range'],
    ['commitment', 'Commitment score'], ['investmentRange', 'Investment range'],
    ['decisionMaker', 'Decision maker'], ['whenStart', 'When could you start'],
  ]) {
    if (!req.body[key] || !String(req.body[key]).trim()) {
      return res.status(400).json({ error: `${label} is required` });
    }
  }

  const trimmedEmail = email.trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');

  // Score the application heuristically so Joel can spot top-of-stack
  // applicants in the email subject without reading the body. Higher
  // score = stronger fit signal.
  let fitScore = 0;
  if (commitment && commitment.startsWith('10')) fitScore += 4;
  else if (commitment && commitment.startsWith('8')) fitScore += 3;
  else if (commitment && commitment.startsWith('6')) fitScore += 1;
  if (investmentRange === '$5,000–$10,000' || investmentRange === '$10,000+') fitScore += 4;
  else if (investmentRange === '$2,000–$5,000') fitScore += 2;
  if (decisionMaker && decisionMaker.startsWith('Yes')) fitScore += 2;
  if (whenStart === 'This week' || whenStart === 'Within 30 days') fitScore += 2;
  if (bpMeds && (bpMeds === '2' || bpMeds === '3+' || bpMeds === 'I want OFF')) fitScore += 1;
  if (safe(costOfInaction).length > 80) fitScore += 1;
  if (safe(successLook).length > 60) fitScore += 1;
  // Max possible ~15. >=10 = hot. 7-9 = warm. <7 = needs more screening.
  const fitTier = fitScore >= 10 ? 'HOT' : fitScore >= 7 ? 'WARM' : 'COLD';

  const application = {
    name: safe(name),
    email: trimmedEmail,
    phone: safe(phone),
    ageRange: safe(ageRange),
    bpRange: safe(bpRange),
    bpMeds: safe(bpMeds),
    healthScore: safe(healthScore),
    sleepScore: safe(sleepScore),
    stressScore: safe(stressScore),
    costOfInaction: safe(costOfInaction),
    commitment: safe(commitment),
    pastAttempts: safe(pastAttempts),
    successLook: safe(successLook),
    investmentRange: safe(investmentRange),
    decisionMaker: safe(decisionMaker),
    whenStart: safe(whenStart),
    whyNow: safe(whyNow),
    foundMe: safe(foundMe),
    fitScore,
    fitTier,
    submittedAt,
    status: 'pending-review',
    program: 'BP Triangle Freedom Sprint',
    price: '$1,997 (founding) · regular $6,997',
    cohort: 'founding-cohort-1',
  };

  // 2026-05-14 hardening (audit P0-3): reordered. Joel's notification email
  // now fires FIRST and fails loud if Resend errors. Old order was:
  //   KV save → notify email (swallowed errors) → applicant ack
  // Risk: if Resend was down + KV silently failed, the user got 200 OK but
  // Joel never saw the application AND the application wasn't persisted.
  // New order: notify email first (FAIL THE REQUEST if it errors so the
  // applicant retries), then KV save as durable backup, then applicant ack.

  // 1. Email notification to Joel — FIRST, mandatory. If this fails, the
  // applicant has not actually applied as far as the funnel is concerned.
  try {
    const subject = `[App ${application.fitTier} ${application.fitScore}] ${application.name} — ${application.investmentRange || 'no $ range'}`;
    const tierColor = application.fitTier === 'HOT' ? '#3F5A3C' : application.fitTier === 'WARM' ? '#A88A4A' : '#9C9485';
    const row = (label, value) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:180px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(value) || '<em style="color:#9C9485;">(blank)</em>'}</td></tr>`;

    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#2C2A26;background:#FBF8F1;">
      <div style="background:${tierColor};color:#FBF8F1;padding:14px 20px;border-radius:10px 10px 0 0;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Fit tier — ${application.fitTier} · score ${application.fitScore}/15</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px;">${escapeHtml(application.name)}</div>
        <div style="font-size:13px;opacity:0.85;">${escapeHtml(application.email)} · ${escapeHtml(application.phone) || 'no phone'}</div>
      </div>
      <div style="background:#FFFDF7;border:1px solid #E6DECE;border-top:none;border-radius:0 0 10px 10px;padding:16px 20px;">
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:0 0 8px;">Snapshot</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Age range', application.ageRange)}
          ${row('BP usually runs', application.bpRange)}
          ${row('On BP meds', application.bpMeds)}
          ${row('Current health (1-10)', application.healthScore)}
          ${row('Sleep', application.sleepScore)}
          ${row('Stress (1-10)', application.stressScore)}
        </table>
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Mental state + commitment</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Cost of inaction', application.costOfInaction)}
          ${row('Commitment 1-10', application.commitment)}
          ${row('What hasn\'t worked before', application.pastAttempts)}
          ${row('What success looks like', application.successLook)}
        </table>
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Fit math</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Investment range', application.investmentRange)}
          ${row('Decision maker', application.decisionMaker)}
          ${row('When could start', application.whenStart)}
          ${row('Why now', application.whyNow)}
          ${row('How they found you', application.foundMe)}
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9C9485;">Reply directly to ${escapeHtml(application.email)} when ready to schedule the fit call. Auto-ack already sent to applicant.</p>
      </div>
    </body></html>`;
    await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: trimmedEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('coaching-apply: notify email failed — returning 500 so applicant retries', err.message);
    return res.status(500).json({
      ok: false,
      error: 'We could not deliver your application right now. Please try again in a moment, or email braveworksrn@gmail.com directly.',
    });
  }

  // 2. Store in KV (90-day TTL so old apps purge themselves) — durable
  // backup in case Joel's inbox is buried. Non-blocking; the notify email
  // above is the canonical record.
  if (process.env.KV_REST_API_URL) {
    try {
      const kvKey = `coaching-app:${Date.now()}:${trimmedEmail}`;
      await kv.set(kvKey, application, { ex: 90 * 86400 });
    } catch (err) {
      console.error('coaching-apply: KV store failed (non-fatal)', err.message);
    }
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
