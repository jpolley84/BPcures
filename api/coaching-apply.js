// /api/coaching-apply — handles applications for the 90-Day BP Triangle
// Freedom Sprint ($4,997 flagship, Joel + Annie co-coach).
//
// Application-only flow (Brunson high-ticket rule). No payment collected
// here. Submissions:
//   1. Stored in KV under coaching-app:<timestamp>:<email> with 90-day TTL
//   2. Emailed to Joel for manual review at BW_NOTIFY_EMAIL
//   3. Auto-acknowledged to the applicant
//
// 2026-05-12 — initial cohort price $4,997 / 5 slots.
//
// 2026-06-09 — EXTENDED for the new /apply questionnaire (ApplyPage.jsx).
// Same endpoint now serves two payload shapes, switched on
// `source: 'apply-page'`:
//   - legacy (/cohort2): name/email/whyNow/ageRange/investmentRange/whenStart
//     — validation, scoring, emails unchanged. Backward compatible.
//   - apply-page: tier-based application for the $1,997 90-Day Group and the
//     four 1:1 tiers. Tier slug validated against APPLY_TIERS (server-side
//     canonical name/price — client copy is not trusted). Tier name + price
//     go in Joel's notify subject + body; tier stored in the KV record;
//     applicant ack names the tier with the 48-hour promise.

import { Resend } from './_resend.js';
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

// 2026-05-14: changed default from brave.works.marketing@gmail.com to
// braveworksrn@gmail.com — Joel's primary operational inbox (where
// /api/waitlist-submit notifications also land). Previously, coaching
// applications were going to a separate inbox Joel doesn't monitor,
// which is why "we've had no applications" — they were arriving in
// a parallel inbox. Override with LAUNCHER_NOTIFY_EMAIL in Vercel env
// if a different routing is needed for any specific environment.
// 2026-08-11: was process.env.LAUNCHER_NOTIFY_EMAIL || 'braveworksrn@gmail.com'.
// LAUNCHER_NOTIFY_EMAIL is set in Vercel production (added 2026-04-29 for the
// Practice Launcher project) and was silently overriding the fallback, so every
// application notification went to a Launcher-era address instead of Joel. The
// sends succeeded, which is why nothing ever errored: applications simply
// arrived somewhere nobody reads. Damien Papillion applied HOT on 2026-08-06
// and sat five days because of it.
//
// This route belongs to BraveWorks, not to Launcher, so it no longer reads a
// LAUNCHER_* variable at all. Overriding is still possible via BW_NOTIFY_EMAIL.
const NOTIFY_EMAIL = process.env.BW_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
// 2026-08-12: Joel also gets a text on every completed Be There application
// (same Resend → Verizon email-to-SMS gateway the Calendly webhook uses).
const JOEL_SMS = process.env.JOEL_SMS || '7175859505@vtext.com';
// 2026-07-17: was 'coaching@bpquiz.com' — that address had ZERO successful
// sends ever in Resend's log (bpquiz.com domain shows status
// 'partially_failed' in Resend's /domains API, SPF/DKIM/DMARC not fully
// verified). The Resend SDK returned an { error } object instead of
// throwing, and the code below didn't check it, so Joel's application
// notifications silently vanished for at least 2 real "Be There"
// applicants (Sushma 7/16, Theresa O'Brien 7/17 HOT) before anyone
// noticed. joel@bpquiz.com has thousands of successful sends — use that
// instead, and the send-result checks added below make a future failure
// loud instead of silent.
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';

// 2026-06-09: canonical tier catalog for the /apply questionnaire. The page
// sends tierName/tierPrice too, but we resolve from the slug server-side so
// a tampered client can't rewrite prices in Joel's notify email.
const APPLY_TIERS = {
  'ninety': { name: 'The 90-Day Personalized Group', price: '$1,997' },
  'triangle': { name: 'The Triangle Session', price: '$1,500 one-time' },
  'inner-circle': { name: 'The Inner Circle', price: '$1,500/month' },
  'household': { name: 'The Brave Household', price: '$5,000/month' },
  'pillar': { name: 'The Pillar Year', price: '$50,000/year' },
};

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

  // 2026-06-09: /apply questionnaire submissions identify themselves with
  // source: 'apply-page'. They follow the tier-based path below and are NOT
  // subject to the Cohort 2 window (the 1:1 tiers are evergreen).
  const isApplyPage = req.body.source === 'apply-page';

  // 2026-07-16: third payload shape — the Be There 8-step prequalification
  // wizard (BeThereApplyPage.jsx), source: 'bethere-apply'. Fully additive;
  // legacy 'apply-page' and /cohort2 payloads are untouched.
  const isBeThere = req.body.source === 'bethere-apply';
  if (isBeThere) return handleBeThere(req, res);

  // 2026-08-12: fifth payload shape — the /apply partial capture, fired
  // client-side after step 2 (name/email/phone in hand). KV only, no emails:
  // it exists so a step-3 abandon still leaves Joel a contact to follow up.
  if (req.body.source === 'bethere-partial') return handleBeTherePartial(req, res);

  // 2026-08-10 (Joel): fourth payload shape — the /allin Quick Fit Application
  // (AllInPage.jsx), source: 'allin-apply'. /allin STOPPED being an instant
  // checkout on this date and became application-gated at $1,997, so this is
  // now the only way in through that page. Fully additive; the three Stripe
  // allin-* tiers in create-embedded-checkout.js are untouched so existing
  // payment links and the active $367 bi-weekly subscriber keep working.
  if (req.body.source === 'allin-apply') return handleAllIn(req, res);

  // 2026-05-18: Cohort 2 application window. The May 17 founding cohort
  // closed; this endpoint is now serving Cohort 2 applications (the
  // 90-day group program opening May 24, 2026). Window stays open
  // through Aug 31 to allow rolling enrollment + waitlist conversion.
  // Update when rolling Cohort 3. (Legacy path only — see isApplyPage.)
  const COHORT_2_CLOSE_ISO = '2026-08-31T23:59:59Z';
  if (!isApplyPage && Date.now() >= new Date(COHORT_2_CLOSE_ISO).getTime()) {
    return res.status(410).json({
      error: 'Cohort 2 applications closed. Email braveworksrn@gmail.com with subject "Next cohort" to be added to the waitlist for Cohort 3.',
    });
  }

  // 2026-05-14 panel-audit rewrite: form reduced from 17 fields → 7 to
  // kill apply-rate friction. Score/sleep/stress/past-failures/decision-
  // maker/etc all live on the fit call now where rapport carries them.
  // We STILL accept legacy fields if a stale client sends them (so the
  // API doesn't reject older form variants in flight).
  const {
    name, email, phone,
    ageRange, investmentRange, whyNow, whenStart,
    // legacy fields — optional, still scored if present
    bpRange, bpMeds, healthScore, sleepScore, stressScore,
    costOfInaction, commitment, pastAttempts, successLook,
    decisionMaker, foundMe,
    // 2026-06-09 apply-page fields
    tier, bpReading, bpDuration, bpMedsCount, materialsUsed,
    winning90, triedAlready, investmentAck, anythingElse,
  } = req.body;

  // Required-field validation. Shared: name + email.
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  let applyTier = null;
  if (isApplyPage) {
    // ---- /apply questionnaire path ----
    applyTier = APPLY_TIERS[tier];
    if (!applyTier) {
      return res.status(400).json({ error: 'Unknown program tier. Reload the page and try again.' });
    }
    if (!winning90 || typeof winning90 !== 'string' || !winning90.trim()) {
      return res.status(400).json({ error: 'The "what winning looks like" answer is required. Joel uses it to screen for fit.' });
    }
    if (!whenStart || !String(whenStart).trim()) {
      return res.status(400).json({ error: 'When you want to start is required' });
    }
    if (investmentAck !== true) {
      return res.status(400).json({ error: 'The investment acknowledgment is required' });
    }
  } else {
    // ---- legacy /cohort2 path — unchanged validation ----
    if (!whyNow || typeof whyNow !== 'string' || !whyNow.trim()) {
      return res.status(400).json({ error: '"Why now?" is required — Joel uses it to screen for fit' });
    }
    for (const [key, label] of [
      ['ageRange', 'Age range'],
      ['investmentRange', 'Investment range'],
      ['whenStart', 'When could you start'],
    ]) {
      if (!req.body[key] || !String(req.body[key]).trim()) {
        return res.status(400).json({ error: `${label} is required` });
      }
    }
  }

  const trimmedEmail = email.trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');

  // Score the application heuristically so Joel can spot top-of-stack
  // applicants in the email subject without reading the body. Higher
  // score = stronger fit signal.
  let fitScore = 0;
  if (isApplyPage) {
    // Apply-page scoring: tier weight + readiness + signal depth.
    if (tier === 'pillar' || tier === 'household') fitScore += 6;
    else if (tier === 'inner-circle' || tier === 'triangle') fitScore += 4;
    else fitScore += 3; // ninety
    if (whenStart === 'This week') fitScore += 3;
    else if (whenStart === 'Within 30 days') fitScore += 2;
    if (investmentAck === true) fitScore += 2;
    if (bpMedsCount === '2-3' || bpMedsCount === '4 or more') fitScore += 1;
    if (safe(winning90).length > 60) fitScore += 1;
    if (safe(phone).length > 6) fitScore += 1;
  } else {
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
  }
  // Max possible ~15 (legacy) / ~14 (apply-page). >=10 hot, 7-9 warm.
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
    // 2026-06-09: apply-page records carry the coaching tier (slug + canonical
    // name/price); legacy records keep the original Sprint program fields.
    ...(isApplyPage
      ? {
          source: 'apply-page',
          tier: tier,
          program: applyTier.name,
          price: applyTier.price,
          bpReading: safe(bpReading),
          bpDuration: safe(bpDuration),
          bpMedsCount: safe(bpMedsCount),
          materialsUsed: Array.isArray(materialsUsed) ? materialsUsed.map((m) => safe(String(m))).filter(Boolean) : [],
          winning90: safe(winning90),
          triedAlready: safe(triedAlready),
          investmentAck: true,
          anythingElse: safe(anythingElse),
        }
      : {
          program: 'BP Triangle Freedom Sprint',
          price: '$1,997 (founding) · regular $6,997',
          cohort: 'founding-cohort-1',
        }),
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
    const tierColor = application.fitTier === 'HOT' ? '#3F5A3C' : application.fitTier === 'WARM' ? '#A88A4A' : '#9C9485';
    const row = (label, value) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:180px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(value) || '<em style="color:#9C9485;">(blank)</em>'}</td></tr>`;

    let subject;
    let html;
    if (isApplyPage) {
      // Tier name + price lead the subject so Joel can triage from the
      // inbox list without opening. Fit tier rides along.
      subject = `[APPLICATION] ${applyTier.name} (${applyTier.price}) - ${application.name} [${application.fitTier} ${application.fitScore}]`;
      html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#2C2A26;background:#FBF8F1;">
      <div style="background:${tierColor};color:#FBF8F1;padding:14px 20px;border-radius:10px 10px 0 0;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Coaching application · fit ${application.fitTier} · score ${application.fitScore}/14</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(applyTier.name)} · ${escapeHtml(applyTier.price)}</div>
        <div style="font-size:16px;font-weight:600;margin-top:4px;">${escapeHtml(application.name)}</div>
        <div style="font-size:13px;opacity:0.85;">${escapeHtml(application.email)} · ${escapeHtml(application.phone) || 'no phone'}</div>
      </div>
      <div style="background:#FFFDF7;border:1px solid #E6DECE;border-top:none;border-radius:0 0 10px 10px;padding:16px 20px;">
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:0 0 8px;">Program</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Tier', `${applyTier.name} (${tier})`)}
          ${row('Investment', applyTier.price)}
          ${row('Investment acknowledged', 'Yes')}
          ${row('When they want to start', application.whenStart)}
        </table>
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Numbers</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Age range', application.ageRange)}
          ${row('Most recent BP reading', application.bpReading)}
          ${row('Elevated for', application.bpDuration)}
          ${row('BP medications', application.bpMedsCount)}
        </table>
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Their words</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('BraveWorks materials used', (application.materialsUsed || []).join(', '))}
          ${row('Winning in 90 days', application.winning90)}
          ${row('Already tried', application.triedAlready)}
          ${row('Anything else', application.anythingElse)}
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9C9485;">Reply directly to ${escapeHtml(application.email)}. Auto-ack with the 48-hour promise already sent to applicant.</p>
      </div>
    </body></html>`;
    } else {
      subject = `[App ${application.fitTier} ${application.fitScore}] ${application.name} — ${application.investmentRange || 'no $ range'}`;
      html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#2C2A26;background:#FBF8F1;">
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
    }
    // 2026-07-17: Resend's SDK returns { error } on a rejected send instead
    // of throwing — must check it explicitly or a failure looks identical
    // to success and Joel never finds out (this is exactly how 2 real
    // applications went silently missing before this fix).
    const sendResult = await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: trimmedEmail,
      subject,
      html,
    });
    if (sendResult.error) throw new Error(`Resend rejected notify send: ${JSON.stringify(sendResult.error)}`);
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

    // 2026-05-14: enroll the applicant in the drip:* nurture system so
    // they receive the 7-day educational arc while their application is
    // being reviewed. If they're already enrolled (took the quiz first),
    // don't overwrite — but tag them as a coaching-applicant.
    try {
      const dripKey = `drip:${trimmedEmail}`;
      const existing = await kv.get(dripKey);
      const applicantTags = ['coaching-applicant', `fit-${application.fitTier.toLowerCase()}`];
      if (isApplyPage) applicantTags.push(`tier-${tier}`);
      if (existing) {
        await kv.set(dripKey, {
          ...existing,
          isCoachingApplicant: true,
          coachingFitTier: application.fitTier,
          tags: Array.from(new Set([...(existing.tags || []), ...applicantTags])),
        });
      } else {
        await kv.set(dripKey, {
          email: trimmedEmail,
          firstName: safe(name).split(' ')[0] || '',
          cohort: 'coaching-applied',
          enrolledAt: new Date().toISOString(),
          lastSentDay: 0,
          optedIn: true, // applicants are already warm — auto-opt past Day 7
          isCoachingApplicant: true,
          coachingFitTier: application.fitTier,
          source: 'coaching-apply',
          tags: applicantTags,
        });
      }
    } catch (err) {
      console.warn('coaching-apply: drip enrollment failed (non-fatal)', err.message);
    }
  }

  // 3. Auto-acknowledgement to applicant
  try {
    const firstName = application.name.split(' ')[0] || 'there';
    let ackSubject;
    let ackHtml;
    if (isApplyPage) {
      // 2026-06-09 apply-page ack: tier named, 48-hour promise, Joel Polley RN
      // signature, education-only footer. No em dashes in copy.
      ackSubject = `Your application is in, ${firstName}`;
      ackHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2C3E50;line-height:1.6;">
      <p style="font-size:18px;color:#2C3E50;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;">Your application for <strong>${escapeHtml(applyTier.name)}</strong> just landed in my inbox. Thank you for putting your real picture in front of me.</p>
      <p style="margin:0 0 16px;">I read every application personally. You will hear from me within 48 hours, usually sooner. If I can help, I will tell you exactly how. If I cannot, I will tell you that too, and point you somewhere honest.</p>
      <p style="margin:0 0 16px;">No payment is collected until we have talked and we both say yes.</p>
      <p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Whatever we build together works alongside your doctor, never instead of.</p>
      <p style="margin:0 0 4px;color:#2C3E50;font-weight:600;">Joel Polley</p>
      <p style="margin:0 0 24px;font-size:14px;color:#4A4A4A;font-style:italic;">RN, BraveWorks</p>
      <p style="margin:0;font-size:12px;color:#9C9485;border-top:1px solid #E6DECE;padding-top:12px;">Everything we do is education-based nursing consultation, not medical advice. Your prescriber stays in charge of your medications.</p>
    </body></html>`;
    } else {
      ackSubject = 'Got your application — what happens next';
      ackHtml = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2C3E50;line-height:1.6;">
      <p style="font-size:18px;color:#2C3E50;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;">Your application for the <strong>BP Triangle Freedom Sprint</strong> just landed in my inbox. Thank you for putting your real picture in front of me.</p>
      <p style="margin:0 0 16px;">Here's what happens next:</p>
      <ol style="margin:0 0 16px;padding-left:20px;">
        <li style="margin:0 0 8px;">I read every application personally. You will hear from me within 48 hours, usually sooner.</li>
        <li style="margin:0 0 8px;">If we're a fit on the application, I'll reach out to schedule a 20-minute fit call by phone. Price and structure are walked through there.</li>
        <li style="margin:0 0 8px;">If we're a fit on the call, you'll get a Stripe invoice for the cohort. No payment is collected until that point.</li>
      </ol>
      <p style="margin:0 0 16px;">If we're not a fit for this cohort, I'll write back too — you go on the waitlist for the next opening, and the daily emails keep coming.</p>
      <p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Pills manage output. Protocol fixes input. AND not INSTEAD OF — that's the path we'd walk together.</p>
      <p style="margin:0 0 4px;color:#2C3E50;font-weight:600;">Joel</p>
      <p style="margin:0;font-size:14px;color:#4A4A4A;font-style:italic;">RN, BraveWorks</p>
    </body></html>`;
    }
    const ackResult = await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: ackSubject,
      html: ackHtml,
    });
    if (ackResult.error) console.error('coaching-apply: applicant ack rejected by Resend', JSON.stringify(ackResult.error));
  } catch (err) {
    console.error('coaching-apply: applicant ack failed', err.message);
  }

  return res.status(200).json({ ok: true, submittedAt });
}

// ---------------------------------------------------------------------------
// 2026-07-16: Be There prequalification handler (source: 'bethere-apply').
// Rate limit + body checks already ran in the main handler before dispatch.
//
// Fit scoring (exact rules, 2026-07-17):
//   COLD if investTier = 'I am not willing to invest at this time'. This is
//        the ONLY cold-lead path — everyone else gets the fit-call link.
//   HOT  if startWindow in {This week, Within two weeks} AND
//        dailyTime in {30 minutes or more / 15 to 30} AND
//        trackingWillingness in {Yes / Mostly}.
//   Else WARM.
// medsAlignment (off-meds-without-doctor) and groupsFeel ('not for me') are
// still recorded as advisory flags in Joel's notify email, but no longer
// affect the fit tier or gate the call link.
// ---------------------------------------------------------------------------
// 2026-07-20 REBUILD (modeled on the LifestyleU getfit application). The form
// is now lean (5 steps) and pre-qualifies her way. Three COLD paths, all exact
// string matches with BeThereApplyPage.jsx:
//   - the opt-in GATE answered "No" (self-ejected tire kicker),
//   - the cash-flow money bucket = month-to-month, no ability to invest,
//   - the doctor-alignment gate = wants off meds without her doctor (a real
//     liability disqualifier for an RN, not just a soft flag).
// HOT when she has the cash flow outright; everyone else WARM.
// Legacy fields (investTier, startWindow, dailyTime, trackingWillingness) may
// still arrive from a cached old client for a short while; scoreBeThere falls
// back to them so an in-flight old submission is never mis-scored.
// ---------------------------------------------------------------------------
// 2026-07-22 (Joel): DELAY the applicant ack. The /apply thank-you now says
// Joel will review the application and email if she is a good fit. An ack that
// lands in seconds saying "I have gone through your application" makes that
// claim obviously untrue and exposes the automation. Delaying it ~3 hours
// makes the page honest without changing a word of the email.
//
// Guard-railed to sane hours: never before 8am or after 9pm Central, so an
// 11pm applicant gets it at 8am rather than at 2 in the morning. Delivered by
// Resend's native scheduledAt (SDK 6.x), so no cron is involved.
function ctOffsetMs(d) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const ct = new Date(d.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return ct.getTime() - utc.getTime();
  } catch {
    return -5 * 3600 * 1000; // CDT fallback
  }
}

function applicantAckSendAt(now = new Date()) {
  const off = ctOffsetMs(now);
  let target = new Date(now.getTime() + 3 * 3600 * 1000);
  const ct = new Date(target.getTime() + off); // CT wall clock, read via getUTC*
  const hour = ct.getUTCHours();
  if (hour >= 21) {
    const bumped = Date.UTC(ct.getUTCFullYear(), ct.getUTCMonth(), ct.getUTCDate() + 1, 8, 0, 0);
    target = new Date(bumped - off);
  } else if (hour < 8) {
    const bumped = Date.UTC(ct.getUTCFullYear(), ct.getUTCMonth(), ct.getUTCDate(), 8, 0, 0);
    target = new Date(bumped - off);
  }
  return target.toISOString();
}

const BETHERE_OFF_MEDS_OLD = 'I was hoping to get off my medications without my doctor';
const BETHERE_OFF_MEDS = 'I was hoping to come off my medications without my doctor';
const BETHERE_GATE_NO = 'No. I will pass for now.';
const BETHERE_CASH_YES = 'Yes, I have the cash flow to invest in my health right now';
const BETHERE_CASH_NO = 'No, I am month to month and cannot invest right now';
const BETHERE_NOT_WILLING = 'I am not willing to invest at this time'; // legacy

// 2026-08-12: timeline strings, exact-sync with TIMELINE_OPTIONS in
// BeThereApplyPage.jsx. HOT now requires cash flow AND a near-term start;
// cash-yes + "just exploring" is WARM, not HOT.
const BETHERE_START_NOW = 'This week';
const BETHERE_START_TWO_WEEKS = 'Within two weeks';
const BETHERE_SPOUSE_NOT_ASKED = 'My spouse or partner, and I have not talked to them about it yet';
const BETHERE_EXPLORING = 'Just exploring for now';

function scoreBeThere(b) {
  // 2026-07-22 (Joel): "I dont want the want off my medications without my
  // doctor to screen anything out. also can't invest is also not a screen out.
  // just push everyone through to a call if they applied."
  //
  // So neither the off-meds answer NOR the cash-flow answer disqualifies
  // anyone any more. Both are still recorded as FLAGS on Joel's notify email
  // (see the flags array below), so he walks into the call knowing, but they
  // no longer route her away from one. The medication conversation is safer
  // had live with an RN than settled by an automated decline.
  //
  // The ONLY remaining COLD path is an explicit self-ejection: she answered
  // the opening gate with "No. I will pass for now." Sending that person a
  // "I would like to move forward" note would be tone deaf, so she still gets
  // the honest version instead.
  if (b.serious === BETHERE_GATE_NO) return 'COLD';
  if (b.cashFlow === BETHERE_CASH_YES) {
    // New clients send startTimeline; require a near-term start for HOT.
    // Old cached clients (no startTimeline) keep the previous cash-only HOT.
    if (b.startTimeline === undefined) return 'HOT';
    if (b.startTimeline === BETHERE_START_NOW || b.startTimeline === BETHERE_START_TWO_WEEKS) return 'HOT';
    return 'WARM';
  }
  // Legacy old-client fallbacks (only reached when the new fields are absent).
  if (
    b.cashFlow === undefined && b.serious === undefined &&
    (b.startWindow === 'This week' || b.startWindow === 'Within two weeks') &&
    (b.dailyTime === '30 minutes or more' || b.dailyTime === '15 to 30') &&
    (b.trackingWillingness === 'Yes' || b.trackingWillingness === 'Mostly')
  ) return 'HOT';
  return 'WARM';
}

// 2026-08-12: /apply partial capture (source: 'bethere-partial'). Fired
// client-side when step 2 completes, so a step-3 abandon still leaves a
// name + email + phone behind. KV ONLY — no notify, no ack, no drip enroll
// (a finished application overwrites the picture minutes later; abandons are
// surfaced by the coaching-application scan, key prefix coaching-partial:*).
async function handleBeTherePartial(req, res) {
  const b = req.body;
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');
  if (!looksLikeValidEmail(b.email)) return res.status(400).json({ error: 'Valid email is required' });
  const trimmedEmail = b.email.trim().toLowerCase();
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(`coaching-partial:${Date.now()}:${trimmedEmail}`, {
        source: 'bethere-partial',
        src: safe(b.src),
        firstName: safe(b.firstName),
        lastName: safe(b.lastName),
        email: trimmedEmail,
        phone: safe(b.phone),
        whyJoel: safe(b.whyJoel),
        goal: safe(b.goal),
        capturedAt: new Date().toISOString(),
      }, { ex: 30 * 86400 });
    } catch (err) {
      console.warn('coaching-apply(partial): KV store failed (non-fatal)', err.message);
    }
  }
  return res.status(200).json({ ok: true });
}

async function handleBeThere(req, res) {
  const b = req.body;
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');

  if (!safe(b.name)) return res.status(400).json({ error: 'Name is required' });
  if (!looksLikeValidEmail(b.email)) return res.status(400).json({ error: 'Valid email is required' });
  // The lean form's required set. `serious` present => new client; old clients
  // (no `serious`) fall back to the previous required set for a clean cutover.
  const isNewForm = b.serious !== undefined;
  if (isNewForm) {
    if (!safe(b.serious)) return res.status(400).json({ error: 'The opt-in question is required.' });
    if (safe(b.winning).length < 10) {
      return res.status(400).json({ error: 'The "what would winning look like" answer is required. Joel reads it first.' });
    }
    if (!safe(b.medsAlignment)) return res.status(400).json({ error: 'The alongside-your-doctor question is required.' });
    // cashFlow is only required when they passed the gate; a "No" answer bails
    // client-side before the money question is ever shown.
    if (b.serious !== BETHERE_GATE_NO && !safe(b.cashFlow)) {
      return res.status(400).json({ error: 'The willingness-to-invest question is required.' });
    }
  } else {
    if (safe(b.story).length < 20) return res.status(400).json({ error: 'The "in your own words" answer is required. Joel reads it first.' });
    if (safe(b.winning).length < 10) return res.status(400).json({ error: 'The "what would winning look like" answer is required.' });
    if (!safe(b.investTier)) return res.status(400).json({ error: 'The investment question is required' });
  }

  const trimmedEmail = b.email.trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const fitTier = scoreBeThere(b);
  const flags = [];
  if (b.medsAlignment === BETHERE_OFF_MEDS || b.medsAlignment === BETHERE_OFF_MEDS_OLD) flags.push('off-meds seeker');
  // 2026-07-22: cash flow no longer screens anyone out, so surface it here
  // instead. Joel still wants to know before he picks up the phone.
  if (b.cashFlow === BETHERE_CASH_NO || b.investTier === BETHERE_NOT_WILLING) flags.push('tight cash flow');
  if (b.serious === BETHERE_GATE_NO) flags.push('gate: not serious');
  if (b.partnerStatus === 'Yes, but they are not fully on board yet') flags.push('partner not on board');
  if (b.decisionAuthority === BETHERE_SPOUSE_NOT_ASKED) flags.push('spouse not consulted yet');
  if (b.startTimeline === BETHERE_EXPLORING) flags.push('just exploring');
  if (b.groupsFeel === 'Groups are not for me') flags.push('minor: groups not for her');

  const application = {
    source: 'bethere-apply',
    tier: 'be-there',
    program: 'Be There (90-day cohort)',
    name: safe(b.name),
    email: trimmedEmail,
    phone: safe(b.phone),
    // New lean-form fields.
    serious: safe(b.serious),
    whyJoel: safe(b.whyJoel),
    goal: safe(b.goal),
    // 2026-08-12 predictive fields (severity, timeline, decision authority)
    // + warm-traffic source tag. Occupation retired from the form; still
    // recorded below if an old cached client sends it.
    src: safe(b.src),
    bpNow: safe(b.bpNow),
    startTimeline: safe(b.startTimeline),
    decisionAuthority: safe(b.decisionAuthority),
    occupation: safe(b.occupation),
    partnerStatus: safe(b.partnerStatus),
    winning: safe(b.winning),
    medsAlignment: safe(b.medsAlignment),
    foundJoel: safe(b.foundJoel),
    socialHandle: safe(b.socialHandle),
    cashFlow: safe(b.cashFlow),
    // Legacy fields, still recorded if an old client submits them.
    ageRange: safe(b.ageRange),
    readingRange: safe(b.readingRange),
    medsCount: safe(b.medsCount),
    doctorRelationship: safe(b.doctorRelationship),
    story: safe(b.story),
    startWindow: safe(b.startWindow),
    pictureValue: safe(b.pictureValue),
    investTier: safe(b.investTier),
    decisionMakers: safe(b.decisionMakers),
    anythingElse: safe(b.anythingElse),
    flags,
    fitTier,
    submittedAt,
    status: 'pending-review',
  };

  // 1. Notify Joel FIRST — mandatory (same P0-3 ordering as the other paths).
  try {
    const tierColor = fitTier === 'HOT' ? '#3F5A3C' : fitTier === 'WARM' ? '#A88A4A' : '#9C9485';
    const row = (label, value) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:200px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(value) || '<em style="color:#9C9485;">(blank)</em>'}</td></tr>`;
    const wordsBlock = (label, text) =>
      `<div style="margin:0 0 14px;"><div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;margin:0 0 4px;">${escapeHtml(label)}</div><div style="background:#FFFFFF;border:1px solid #E6DECE;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;color:#2C2A26;white-space:pre-wrap;">${escapeHtml(text)}</div></div>`;

    const subject = `[BE THERE]${application.src === 'masterclass' ? ' [MASTERCLASS]' : ''} ${application.name} [${fitTier}]${flags.length ? ' [FLAGS: ' + flags.join('; ') + ']' : ''}`;
    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#2C2A26;background:#FBF8F1;">
      <div style="background:${tierColor};color:#FBF8F1;padding:14px 20px;border-radius:10px 10px 0 0;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Be There application · fit ${fitTier}${flags.length ? ' · ' + escapeHtml(flags.join('; ')) : ''}</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(application.name)}</div>
        <div style="font-size:13px;opacity:0.85;">${escapeHtml(application.email)} · ${escapeHtml(application.phone) || 'no phone'}</div>
      </div>
      <div style="background:#FFFDF7;border:1px solid #E6DECE;border-top:none;border-radius:0 0 10px 10px;padding:16px 20px;">
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:0 0 10px;">Her words</h3>
        ${wordsBlock('What winning looks like (90 days)', application.winning)}
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Fit</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Serious (opt-in gate)', application.serious)}
          ${row('Why Joel specifically', application.whyJoel)}
          ${row('What she wants', application.goal)}
          ${row('BP right now', application.bpNow)}
          ${row('Wants to start', application.startTimeline)}
          ${row('Decision authority', application.decisionAuthority)}
          ${row('Alongside-doctor framing', application.medsAlignment)}
        </table>
        ${(application.occupation || application.partnerStatus) ? `
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Her life (old form)</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${application.occupation ? row('Work', application.occupation) : ''}
          ${application.partnerStatus ? row('Significant other', application.partnerStatus) : ''}
        </table>` : ''}
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Investment + source</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Cash flow (no price shown)', application.cashFlow)}
          ${row('Source tag', application.src || 'none')}
          ${row('Found Joel via', application.foundJoel)}
          ${row('Social handle (vet before call)', application.socialHandle)}
        </table>
        ${(application.story || application.pictureValue || application.investTier) ? `
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9C9485;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Legacy fields (old form)</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${application.story ? row('Story', application.story) : ''}
          ${application.pictureValue ? row('Picture value ($)', application.pictureValue) : ''}
          ${application.investTier ? row('Old invest tier', application.investTier) : ''}
          ${application.decisionMakers ? row('Decision makers', application.decisionMakers) : ''}
        </table>` : ''}
        ${application.anythingElse ? `
        <h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Anything else</h3>
        <table style="width:100%;border-collapse:collapse;">${row('Anything else', application.anythingElse)}</table>` : ''}
        <p style="margin:24px 0 0;font-size:12px;color:#9C9485;">Reply directly to ${escapeHtml(application.email)}. ${fitTier === 'COLD' ? 'Applicant was routed to the free community and starter kit (no call link shown).' : 'Applicant was shown the fit-call booking link with the 48-hour promise.'} Auto-ack sent.</p>
      </div>
    </body></html>`;

    const sendResult = await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: trimmedEmail,
      subject,
      html,
    });
    if (sendResult.error) throw new Error(`Resend rejected notify send: ${JSON.stringify(sendResult.error)}`);
  } catch (err) {
    console.error('coaching-apply(bethere): notify email failed — returning 500 so applicant retries', err.message);
    return res.status(500).json({
      ok: false,
      error: 'We could not deliver your application right now. Please try again in a moment, or email braveworksrn@gmail.com directly.',
    });
  }

  // 1b. Text Joel too — every application, so nothing sits unseen in the
  // inbox. Non-fatal: a failed SMS never fails the application.
  try {
    const smsResult = await getResend().emails.send({
      from: FROM,
      to: JOEL_SMS,
      subject: 'BE THERE app',
      text: `${fitTier}${application.src === 'masterclass' ? ' MC' : ''}: ${application.name} · ${application.phone || 'no phone'} · starts ${application.startTimeline || '?'} · check email`,
    });
    if (smsResult.error) console.error('coaching-apply(bethere): Joel SMS rejected', JSON.stringify(smsResult.error));
  } catch (err) {
    console.error('coaching-apply(bethere): Joel SMS failed (non-fatal)', err.message);
  }

  // 2. KV store (existing coaching-app:* pattern, 90-day TTL) + drip tag.
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(`coaching-app:${Date.now()}:${trimmedEmail}`, application, { ex: 90 * 86400 });
    } catch (err) {
      console.error('coaching-apply(bethere): KV store failed (non-fatal)', err.message);
    }
    try {
      const dripKey = `drip:${trimmedEmail}`;
      const existing = await kv.get(dripKey);
      const applicantTags = ['coaching-applicant', `fit-${fitTier.toLowerCase()}`, 'tier-be-there'];
      if (existing) {
        await kv.set(dripKey, {
          ...existing,
          isCoachingApplicant: true,
          coachingFitTier: fitTier,
          tags: Array.from(new Set([...(existing.tags || []), ...applicantTags])),
        });
      } else {
        await kv.set(dripKey, {
          email: trimmedEmail,
          firstName: application.name.split(' ')[0] || '',
          cohort: 'coaching-applied',
          enrolledAt: submittedAt,
          lastSentDay: 0,
          optedIn: true,
          isCoachingApplicant: true,
          coachingFitTier: fitTier,
          source: 'coaching-apply',
          tags: applicantTags,
        });
      }
    } catch (err) {
      console.warn('coaching-apply(bethere): drip enrollment failed (non-fatal)', err.message);
    }
  }

  // 3. Auto-ack to applicant. No prices, no dashes, alongside-doctor footer.
  //
  // 2026-07-22 (Joel) REWRITE: "make the auto reply to the application be this
  // form of email instead of the calendly." Five of the first six applicants
  // were sent at a booking link and never booked, so the ack now opens a
  // REPLY conversation instead: screened, moving forward, phone or Zoom, and
  // she names the times.
  //
  // Deliberately NO fixed time slots here. A stored email cannot hold real
  // slots: they go stale, and every applicant would receive the identical
  // three, so two people booking the same slot is a matter of when. Inverting
  // it (she proposes, Joel confirms) is collision-proof and never rots.
  //
  // Branched on fit: only HOT/WARM get the move-forward invite. COLD exists
  // for real reasons (no cash flow, or wanting off medications without her
  // doctor, which is a liability disqualifier for an RN), so a COLD applicant
  // must never be told Joel wants to move forward.
  try {
    const firstName = application.name.split(' ')[0] || 'there';
    const isCold = fitTier === 'COLD';
    const ackSubject = isCold
      ? `Your Be There application is in, ${firstName}`
      : `Got your application, ${firstName} — one question before we talk`;

    // 2026-08-12 REWRITE: the ack is INSTANT again. Speed-to-lead research
    // (5-minute contact ≈ 21x qualification vs 30 minutes) beats the 3-hour
    // "look human" delay, and this body no longer claims Joel already read
    // the application, so instant delivery is honest. It opens the reply
    // thread (Joel's 07-22 no-booking-page rule stands), plants the "your
    // moment" question, and assigns the BP homework that lifts show rates.
    const movingForwardBody = `
      <p style="margin:0 0 16px;">Your application for <strong>Be There</strong> just landed in my inbox. Thank you for putting your real story in front of me. I read every one personally, and I will be looking at yours today.</p>
      <p style="margin:0 0 8px;">While I do, reply to this email and tell me three things:</p>
      <ol style="margin:0 0 16px;padding-left:20px;">
        <li style="margin:0 0 6px;"><strong>Phone or Zoom</strong>, whichever you prefer for a short conversation.</li>
        <li style="margin:0 0 6px;">Two or three times over the next week that suit you, and your time zone.</li>
        <li style="margin:0 0 6px;">And the one I care about most: <strong>what was the moment that made you decide to deal with this now, not someday?</strong> There is always a moment. A reading that scared you. Something a doctor said. Someone you do not want to leave behind. Twenty years in the ICU taught me the people who can name their moment are the ones who follow through.</li>
      </ol>
      <p style="margin:0 0 16px;">I will work around your schedule and send the confirmation back. No booking page to wrestle with.</p>
      <p style="margin:0 0 16px;">One small piece of homework before we talk: take your blood pressure tonight before bed, and again tomorrow morning before coffee. Bring both numbers to the call.</p>
      <p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Whatever we build together works alongside your doctor, never instead of them.</p>`;

    const coldBody = `
      <p style="margin:0 0 16px;">Your application for <strong>Be There</strong> just landed in my inbox. Thank you for putting your real story in front of me.</p>
      <p style="margin:0 0 16px;">I read every word personally. Based on what you shared, I do not think the 12 week program is the right step for you right now, and I would rather tell you that plainly than take your money for something that is not the fit.</p>
      <p style="margin:0 0 16px;">That is not the end of it. The free community and the daily emails are open to you, and there is real help in both. If your situation changes, write back and tell me. I will take another look.</p>
      <p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Whatever you do next, do it alongside your doctor, never instead of them.</p>`;

    const ackResult = await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: ackSubject,
      html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2C3E50;line-height:1.6;">
      <p style="font-size:18px;color:#2C3E50;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      ${isCold ? coldBody : movingForwardBody}
      <p style="margin:0 0 4px;color:#2C3E50;font-weight:600;">Joel Polley</p>
      <p style="margin:0 0 24px;font-size:14px;color:#4A4A4A;font-style:italic;">RN, BraveWorks</p>
      <p style="margin:0;font-size:12px;color:#9C9485;border-top:1px solid #E6DECE;padding-top:12px;">Everything we do is education-based nursing consultation, not medical advice. Your prescriber stays in charge of your medications.</p>
    </body></html>`,
    });
    if (ackResult.error) console.error('coaching-apply(bethere): applicant ack rejected by Resend', JSON.stringify(ackResult.error));
  } catch (err) {
    console.error('coaching-apply(bethere): applicant ack failed', err.message);
  }

  return res.status(200).json({ ok: true, submittedAt, fitTier });
}

// ---------------------------------------------------------------------------
// 2026-08-10: /allin Quick Fit Application (source: 'allin-apply').
//
// WHAT CHANGED AND WHY IT MATTERS: /allin used to take money on the page (three
// embedded Stripe tiers). Joel replaced it with an application, so nobody can
// buy from /allin any more. That is deliberate, but it means THIS handler is
// the only path from that page to a sale. If it 500s, the offer is dark, which
// is why the notify-Joel-first ordering below is kept exactly as the other
// paths have it.
//
// The page states a $200 reservation deposit against the $1,997 total. No money
// is touched here and no Stripe price is created; the $200 is collected AFTER
// acceptance, by Joel, out of band. NOTE the legacy allin-deposit Stripe price
// is $197, not $200. Do not point anyone at it from this flow without making a
// new price first, or the buyer is charged three dollars less than the page said.
//
// Fit scoring:
//   COLD  readiness = "I mostly need more information."
//         The page says plainly this is coaching and not an information
//         library. Someone who wants information is not a bad person, they are
//         a bad fit, and saying so beats selling a $1,997 answer to a question
//         they did not ask.
//   HOT   investment = "Pay in full"
//   WARM  everyone else
const ALLIN_READINESS_INFO = 'I mostly need more information.';
const ALLIN_PAY_FULL = 'Pay in full';
const ALLIN_NEEDS_DETAIL = 'I need to understand the program better first';

function scoreAllIn(b) {
  if (b.readiness === ALLIN_READINESS_INFO) return 'COLD';
  if (b.investment === ALLIN_PAY_FULL) return 'HOT';
  return 'WARM';
}

async function handleAllIn(req, res) {
  const b = req.body;
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');
  const safeList = (v) => (Array.isArray(v) ? v.map(safe).filter(Boolean) : []);

  if (!safe(b.name)) return res.status(400).json({ error: 'Name is required' });
  if (!looksLikeValidEmail(b.email)) return res.status(400).json({ error: 'Valid email is required' });
  if (!safeList(b.focus).length) return res.status(400).json({ error: 'Please tell us what you would most like help with.' });
  if (safe(b.happening).length < 10) return res.status(400).json({ error: 'The "what has been happening" answer is required. We read it first.' });
  if (safe(b.ninetyDays).length < 10) return res.status(400).json({ error: 'The "next 90 days" answer is required.' });
  if (safe(b.whyNow).length < 5) return res.status(400).json({ error: 'The "why does this matter now" answer is required.' });
  if (!safe(b.readiness)) return res.status(400).json({ error: 'Please pick the option that sounds most like you.' });
  if (!safe(b.investment)) return res.status(400).json({ error: 'Please tell us how you would prefer to handle the investment.' });

  const trimmedEmail = b.email.trim().toLowerCase();
  const submittedAt = new Date().toISOString();
  const fitTier = scoreAllIn(b);
  const flags = [];
  if (b.investment === ALLIN_NEEDS_DETAIL) flags.push('wants more detail before money');
  if (b.readiness === ALLIN_READINESS_INFO) flags.push('wants information, not coaching');
  // Same 7-15 digit phone shape the challenge paths use. Optional field: a bad
  // number is stored empty rather than rejected, so it can never cost a lead.
  const rawPhone = safe(b.phone).replace(/[^\d+]/g, '');
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const phone = phoneDigits.length >= 7 && phoneDigits.length <= 15 ? rawPhone : '';

  const application = {
    source: 'allin-apply',
    tier: 'allin',
    program: 'The Life Change Accelerator (12-week, $1,997)',
    name: safe(b.name),
    email: trimmedEmail,
    phone,
    focus: safeList(b.focus),
    happening: safe(b.happening),
    ninetyDays: safe(b.ninetyDays),
    whyNow: safe(b.whyNow),
    readiness: safe(b.readiness),
    investment: safe(b.investment),
    anythingElse: safe(b.anythingElse),
    flags,
    fitTier,
    submittedAt,
    status: 'pending-review',
  };

  // 1. Notify Joel FIRST — mandatory. Same P0-3 ordering as every other path:
  // if we cannot tell Joel, tell the applicant to retry rather than swallow a
  // lead nobody will ever see.
  try {
    const tierColor = fitTier === 'HOT' ? '#3F5A3C' : fitTier === 'WARM' ? '#A88A4A' : '#9C9485';
    const row = (label, value) =>
      '<tr><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#9C9485;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;width:200px;vertical-align:top;">' +
      escapeHtml(label) +
      '</td><td style="padding:8px 12px;border-bottom:1px solid #EFE9DA;color:#2C2A26;font-size:13px;line-height:1.55;white-space:pre-wrap;">' +
      (escapeHtml(value) || '<em style="color:#9C9485;">(blank)</em>') +
      '</td></tr>';
    const wordsBlock = (label, text) =>
      '<div style="margin:0 0 14px;"><div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;margin:0 0 4px;">' +
      escapeHtml(label) +
      '</div><div style="background:#FFFFFF;border:1px solid #E6DECE;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;color:#2C2A26;white-space:pre-wrap;">' +
      escapeHtml(text) +
      '</div></div>';

    const subject =
      '[ALL IN $1,997] ' + application.name + ' [' + fitTier + ']' +
      (flags.length ? ' [FLAGS: ' + flags.join('; ') + ']' : '');

    const html =
      '<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#2C2A26;background:#FBF8F1;">' +
      '<div style="background:' + tierColor + ';color:#FBF8F1;padding:14px 20px;border-radius:10px 10px 0 0;">' +
      '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Life Change Accelerator application &middot; fit ' + fitTier +
      (flags.length ? ' &middot; ' + escapeHtml(flags.join('; ')) : '') + '</div>' +
      '<div style="font-size:22px;font-weight:700;margin-top:6px;">' + escapeHtml(application.name) + '</div>' +
      '<div style="font-size:13px;opacity:0.85;">' + escapeHtml(application.email) + ' &middot; ' + (escapeHtml(application.phone) || 'no phone') + '</div>' +
      '</div>' +
      '<div style="background:#FFFDF7;border:1px solid #E6DECE;border-top:none;border-radius:0 0 10px 10px;padding:16px 20px;">' +
      '<h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:0 0 10px;">Her words</h3>' +
      wordsBlock('What has been happening', application.happening) +
      wordsBlock('If the next 90 days went really well', application.ninetyDays) +
      wordsBlock('Why this matters now', application.whyNow) +
      '<h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">Fit</h3>' +
      '<table style="width:100%;border-collapse:collapse;">' +
      row('Wants help with', application.focus.join(', ')) +
      row('Sounds most like her', application.readiness) +
      row('Investment preference', application.investment) +
      '</table>' +
      (application.anythingElse
        ? '<h3 style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;border-bottom:1px solid #E6DECE;padding-bottom:6px;margin:20px 0 8px;">For Annie</h3>' +
          '<table style="width:100%;border-collapse:collapse;">' + row('Anything else', application.anythingElse) + '</table>'
        : '') +
      '<p style="margin:24px 0 0;font-size:12px;color:#9C9485;">Reply directly to ' + escapeHtml(application.email) +
      '. No payment was taken and no place is reserved. ' +
      (fitTier === 'COLD'
        ? 'She said she mostly wants more information, so the ack does NOT say we are moving forward.'
        : 'The ack invites her to name times for a fit conversation.') +
      '</p></div></body></html>';

    const sendResult = await getResend().emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      replyTo: trimmedEmail,
      subject,
      html,
    });
    if (sendResult.error) throw new Error('Resend rejected notify send: ' + JSON.stringify(sendResult.error));
  } catch (err) {
    console.error('coaching-apply(allin): notify email failed — returning 500 so applicant retries', err.message);
    return res.status(500).json({
      ok: false,
      error: 'We could not deliver your application right now. Please try again in a moment, or email braveworksrn@gmail.com directly.',
    });
  }

  // 2. KV store + drip tag, same coaching-app:* pattern and 90-day TTL.
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set('coaching-app:' + Date.now() + ':' + trimmedEmail, application, { ex: 90 * 86400 });
    } catch (err) {
      console.error('coaching-apply(allin): KV store failed (non-fatal)', err.message);
    }
    try {
      const dripKey = 'drip:' + trimmedEmail;
      const existing = await kv.get(dripKey);
      const applicantTags = ['coaching-applicant', 'fit-' + fitTier.toLowerCase(), 'tier-allin'];
      if (existing) {
        await kv.set(dripKey, {
          ...existing,
          isCoachingApplicant: true,
          coachingFitTier: fitTier,
          tags: Array.from(new Set([...(existing.tags || []), ...applicantTags])),
        });
      } else {
        await kv.set(dripKey, {
          email: trimmedEmail,
          firstName: application.name.split(' ')[0] || '',
          cohort: 'coaching-applied',
          enrolledAt: submittedAt,
          lastSentDay: 0,
          optedIn: true,
          isCoachingApplicant: true,
          coachingFitTier: fitTier,
          source: 'allin-apply',
          tags: applicantTags,
        });
      }
    } catch (err) {
      console.warn('coaching-apply(allin): drip enrollment failed (non-fatal)', err.message);
    }
  }

  // 3. Delayed auto-ack (the same 3-hour, 8am-9pm Central guard Be There uses:
  // an instant "we have read your application" is a visible lie). NO price and
  // NO payment link in here. The page promised she will not be charged and will
  // get next steps before any payment decision, so the ack must not quietly
  // turn into a bill.
  try {
    const firstName = application.name.split(' ')[0] || 'there';
    const isCold = fitTier === 'COLD';
    const ackSubject = isCold
      ? 'Your application is in, ' + firstName
      : 'Your application, ' + firstName + ' (let us find a time)';

    const movingForwardBody =
      '<p style="margin:0 0 16px;">Your application for <strong>The Life Change Accelerator</strong> just landed with us. Thank you for writing it out honestly.</p>' +
      '<p style="margin:0 0 16px;">We read these personally. Based on what you shared, <strong>we would like to talk if you are still interested.</strong></p>' +
      '<p style="margin:0 0 16px;">Nothing has been charged and no place has been reserved yet. The next step is just a conversation.</p>' +
      '<p style="margin:0 0 8px;">Reply to this email and tell us two things:</p>' +
      '<ol style="margin:0 0 16px;padding-left:20px;">' +
      '<li style="margin:0 0 6px;">Phone or Zoom.</li>' +
      '<li style="margin:0 0 6px;">Two or three times over the next week that suit you, and your time zone.</li>' +
      '</ol>' +
      '<p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Everything we build together works alongside your doctor, never instead of them.</p>';

    const coldBody =
      '<p style="margin:0 0 16px;">Your application for <strong>The Life Change Accelerator</strong> just landed with us. Thank you for writing it out honestly.</p>' +
      '<p style="margin:0 0 16px;">You said you are mostly looking for more information right now. This program is coaching, not an information library, so we would rather tell you plainly that it is probably not the right step today than take your money for something that is not the fit.</p>' +
      '<p style="margin:0 0 16px;">The free emails and the community are open to you and there is real help in both. If what you are looking for changes, write back and we will take another look.</p>' +
      '<p style="margin:0 0 24px;font-style:italic;color:#4A4A4A;">Whatever you do next, do it alongside your doctor, never instead of them.</p>';

    const ackResult = await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: ackSubject,
      scheduledAt: applicantAckSendAt(),
      html:
        '<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2C3E50;line-height:1.6;">' +
        '<p style="font-size:18px;color:#2C3E50;margin:0 0 16px;">Hi ' + escapeHtml(firstName) + ',</p>' +
        (isCold ? coldBody : movingForwardBody) +
        '<p style="margin:0 0 4px;color:#2C3E50;font-weight:600;">Annie and Joel</p>' +
        '<p style="margin:0 0 24px;font-size:14px;color:#4A4A4A;font-style:italic;">RNs, BraveWorks</p>' +
        '<p style="margin:0;font-size:12px;color:#9C9485;border-top:1px solid #E6DECE;padding-top:12px;">Everything we do is education-based nursing consultation, not medical advice. Your prescriber stays in charge of your medications.</p>' +
        '</body></html>',
    });
    if (ackResult.error) console.error('coaching-apply(allin): applicant ack rejected by Resend', JSON.stringify(ackResult.error));
  } catch (err) {
    console.error('coaching-apply(allin): applicant ack failed', err.message);
  }

  return res.status(200).json({ ok: true, submittedAt, fitTier });
}
