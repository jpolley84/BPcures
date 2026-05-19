// api/seminar-signup.js — signup for the May 18-23 Couples Intimacy +
// Sexual Health Seminar (Annie Chitate, RN co-host; Joel presents Thu).
//
// Pattern mirrors challenge-signup.js: rate-limit by IP → validate email
// → enroll in KV drip:* (no overwrite) → fire confirmation email via
// Resend with the Zoom link.
//
// Tag = ['annie-seminar', 'intimacy-week'] so we can blast attendees
// later (replay link, hormone bundle pitch, BP Triangle drip enrollment).
//
// UTM params captured on signup → saved to KV for source attribution
// (TikTok bio vs FB post vs IG profile, etc.)

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';

const ZOOM_URL = 'https://tinyurl.com/2p3b449n';

// Per-IP rate limit — mirrors challenge-signup (10/hr/IP). Prevents
// signup-form abuse → Resend reputation burn.
async function checkRateLimit(ip) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `seminar-rl:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= 10) return { ok: false, count };
    if (count === 0) await kv.set(key, 1, { ex: 3600 });
    else await kv.incr(key);
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('seminar-signup: rate-limit check failed (allowing):', err.message);
    return { ok: true };
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function renderConfirmationEmail({ firstName, partnerJoining }) {
  const name = (firstName || '').trim() || 'Friend';
  const partnerLine = partnerJoining
    ? `<p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">You marked that your partner is joining you. Forward this email to them so they have the link on their phone too.</p>`
    : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN &middot; Annie Chitate, RN</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">
          You&#8217;re in, ${name}.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Save this email. The same Zoom link works for all six sessions.
        </p>
        ${partnerLine}
      </td></tr>

      <tr><td style="padding:0 28px;">
        <div style="background:#2E3A30;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:10px;">Your Zoom link</div>
          <a href="${ZOOM_URL}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;margin-bottom:12px;">
            Join the live session &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:8px;line-height:1.5;">
            ${ZOOM_URL}
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 24px;">
        <div style="font-family:Georgia,serif;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;font-weight:700;margin-bottom:12px;">
          When the sessions run
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;color:#3A3A3A;">
          <tr><td style="padding:6px 0;border-bottom:1px solid #F0EDE5;"><strong style="color:#2C3E50;">Mon May 18 &ndash; Sat May 23</strong> &mdash; 1 PM ET daily &middot; same Zoom link every day</td></tr>
          <tr><td style="padding:6px 0;border-bottom:1px solid #F0EDE5;"><strong style="color:#2C3E50;">Annie Chitate, RN</strong> &mdash; hormones and intimacy (Mon, Tue, Wed, Fri, Sat)</td></tr>
          <tr><td style="padding:6px 0;background:#F5F1E8;"><strong style="color:#B85A36;">Thursday May 21</strong> &mdash; Joel Polley, RN on BP meds, circulation &amp; libido</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 28px 24px;">
        <div style="background:#F5F1E8;border-radius:14px;padding:20px 22px;">
          <p style="font-size:14px;line-height:1.65;color:#3A3A3A;margin:0 0 10px;">
            <strong style="color:#2C3E50;">How to get the most out of this:</strong>
          </p>
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">&rarr; Join on a device with a camera (small group; we keep it personal)</p>
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">&rarr; Bring questions &mdash; we answer live, no scripts</p>
          <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">&rarr; If you have a partner, invite them. The Thursday + Friday sessions are designed for two.</p>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 24px;">
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          See you in the room.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 4px;">
          Joel Polley, RN &middot; The Blood Pressure Guy
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN &middot; Joel Polley, RN &middot; Annie Chitate, RN<br/>
          Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.<br/>
          You received this because you signed up for the Couples Intimacy &amp; Sexual Health Seminar at bpquiz.com/seminar.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

async function enrollInDripKV(email, name, extras = {}) {
  if (!process.env.KV_REST_API_URL) {
    return { ok: false, reason: 'kv_not_configured' };
  }
  const key = `drip:${email.toLowerCase()}`;
  try {
    const existing = await kv.get(key);
    if (existing) {
      // Already on list. Append seminar tags + UTM source without
      // overwriting their current cohort/lastSentDay state.
      const existingTags = Array.isArray(existing.tags) ? existing.tags : [];
      const mergedTags = Array.from(new Set([...existingTags, 'annie-seminar', 'intimacy-week']));
      await kv.set(key, {
        ...existing,
        tags: mergedTags,
        seminarSignupAt: new Date().toISOString(),
        seminarPartnerJoining: !!extras.partnerJoining,
        seminarUtmSource: extras.utmSource || existing.seminarUtmSource || null,
        seminarUtmMedium: extras.utmMedium || existing.seminarUtmMedium || null,
        seminarUtmCampaign: extras.utmCampaign || existing.seminarUtmCampaign || null,
      });
      return { ok: true, alreadyEnrolled: true };
    }
    await kv.set(key, {
      email,
      firstName: name || '',
      cohort: 0,
      enrolledAt: new Date().toISOString(),
      lastSentDay: 0,
      optedIn: true,
      source: 'seminar-page',
      tags: ['annie-seminar', 'intimacy-week'],
      seminarSignupAt: new Date().toISOString(),
      seminarPartnerJoining: !!extras.partnerJoining,
      seminarUtmSource: extras.utmSource || null,
      seminarUtmMedium: extras.utmMedium || null,
      seminarUtmCampaign: extras.utmCampaign || null,
    });
    return { ok: true, alreadyEnrolled: false };
  } catch (err) {
    console.error('seminar-signup: drip-kv enroll failed', err.message);
    return { ok: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    console.warn(`seminar-signup: rate-limited ip=${ip} count=${rl.count}`);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { email, firstName, partnerJoining, utmSource, utmMedium, utmCampaign } = req.body || {};

  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  const dripResult = await enrollInDripKV(trimmedEmail, firstName, {
    partnerJoining,
    utmSource,
    utmMedium,
    utmCampaign,
  });
  if (!dripResult.ok) {
    console.warn('seminar-signup: drip enrollment skipped', dripResult.reason);
  }

  try {
    const html = renderConfirmationEmail({ firstName, partnerJoining });
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: "You're in — here's your Zoom link",
      html,
    });
  } catch (err) {
    console.error('seminar-signup: resend failed', err.message);
    return res.status(500).json({ error: 'Failed to send confirmation email' });
  }

  return res.status(200).json({
    success: true,
    redirectUrl: '/seminar/welcome',
    dripEnrolled: dripResult.ok,
    alreadyEnrolled: dripResult.alreadyEnrolled || false,
  });
}
