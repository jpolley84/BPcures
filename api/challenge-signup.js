import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';

// Per-IP rate limit. 2026-05-13 hardening: this endpoint was previously
// uncapped. A single attacker could spam unlimited POSTs → unlimited
// Resend welcome emails → sender-reputation burn + KV abuse. Now mirrors
// the lead-magnet rate-limit pattern (10 per IP per hour).
async function checkRateLimit(ip) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `cs-rl:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= 10) return { ok: false, count };
    if (count === 0) await kv.set(key, 1, { ex: 3600 });
    else await kv.incr(key);
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('challenge-signup: rate-limit check failed (allowing):', err.message);
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

// 2026-05-14: Mailchimp retired. Removed MAILCHIMP env vars + the
// mailchimpUpsert function. Subscriber enrollment now flows entirely
// through the Vercel KV drip:* store (enrollInDripKV below). Resend
// is the sending engine.

function renderAnnouncementEmail(firstName) {
  const name = (firstName || '').trim() || 'Friend';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN &middot; Twenty years ICU &amp; emergency</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:18px;line-height:1.55;color:#2C3E50;margin:0 0 18px;">
          Hey ${name},
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;ve been quiet for a few weeks. Here&#8217;s why.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          I built something. Thirty days. One email a day. One protocol. One body. It&#8217;s free.
        </p>
        <p style="font-family:Georgia,serif;font-size:17px;font-weight:600;color:#2C3E50;margin:0 0 18px;">
          Doors open Friday at 8 AM EST.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          For the last six months I&#8217;ve been watching the same conversation play out &#8212; in my DMs, in the Skool community, in every clinic I&#8217;ve ever worked. Women in their 40s, 50s and 60s on five medications, with blood sugar climbing, cortisol stuck on high, weight that won&#8217;t budge, and a doctor who won&#8217;t have the conversation they need to have.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          I kept thinking these were four problems.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          They&#8217;re not.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 18px;">
          They&#8217;re three corners of the same loop. I&#8217;m calling it <strong>The Pressure Triangle</strong>. Friday I&#8217;m walking you through how to break it in 30 days.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <div style="background:#F5F1E8;border-radius:14px;padding:22px 24px;margin-bottom:20px;">
          <p style="font-size:14px;line-height:1.7;color:#2C3E50;margin:0;">
            &#8594; The challenge itself is <strong>free</strong>. No card. No upsell wall. Go to <a href="https://bpquiz.com" style="color:#B85A36;font-weight:600;">BPQuiz.com</a> and sign up. You&#8217;re in.<br/><br/>
            &#8594; For people who want the full experience &#8212; the book, the live coaching, the deeper room &#8212; two upgrade paths open Friday. One has a <strong>hard cap on seats</strong>.<br/><br/>
            &#8594; Three women I&#8217;ll tell you about across the 30 days &#8212; Dorothy, Marcus, Neveah &#8212; are why I built this.
          </p>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 20px;">
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Tomorrow I&#8217;ll send you the full picture. Pricing. What&#8217;s inside. Why the cap exists.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 20px;">
          For tonight, sticky-note your laptop:
        </p>

        <div style="background:#2E3A30;border-radius:14px;padding:24px;text-align:center;margin-bottom:20px;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FBF8F1;letter-spacing:0.04em;">
            FRIDAY 8 AM. WATCH INBOX.
          </div>
        </div>

        <p style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:#7A7061;margin:0 0 18px;">
          Genetics writes the recipe. Lifestyle bakes the cake. Be your own doctor.
        </p>

        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">
          &#8212; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 20px;">
          Joel Polley, RN &nbsp;|&nbsp; BraveWorks RN<br/>
          TikTok: <a href="https://tiktok.com/@braveworksrn" style="color:#B85A36;">@braveworksrn</a>
        </p>

        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0 0 18px;">
          <strong>P.S.</strong> &#8212; If you&#8217;ve been waiting for me to put it all together &#8212; this is it.
        </p>

        <p style="font-family:Georgia,serif;font-size:13px;font-style:italic;color:#7A7061;line-height:1.6;margin:0;">
          &#8220;For I know the plans I have for you, declares the Lord &#8212; plans to prosper you, not to harm you, plans to give you hope and a future.&#8221; &#8212; Jeremiah 29:11
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN &middot; Joel Polley, RN &middot; Naturopathic practitioner &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a>
          <br/>Educational content only. Not medical advice. Always complement &#8212; never replace &#8212; care from your physician.
          <br/>You received this because you signed up for the 30-Day Pressure Triangle Challenge.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

// Enroll a new "Send my free map" signup into the Resend drip:* KV system.
// 2026-05-12 funnel-coherence fix: the /challenge page was previously
// double-pathing — Mailchimp tagged the user but the daily Resend drip
// (which actually delivers the 30-day Triangle arc) never knew about them.
// Now this is the single canonical source of truth.
async function enrollInDripKV(email, name) {
  if (!process.env.KV_REST_API_URL) {
    return { ok: false, reason: 'kv_not_configured' };
  }
  const key = `drip:${email.toLowerCase()}`;
  try {
    // Don't overwrite an in-progress sub. If they're already in the drip
    // (e.g., took the BPQuiz a few days ago, now also signed up via
    // /challenge), keep their existing enrollment + lastSentDay intact.
    const existing = await kv.get(key);
    if (existing) {
      return { ok: true, alreadyEnrolled: true, lastSentDay: existing.lastSentDay || 0 };
    }
    await kv.set(key, {
      email,
      firstName: name || '',
      cohort: 0,
      enrolledAt: new Date().toISOString(),
      lastSentDay: 0,
      optedIn: true, // signing up for the 30-day arc IS the opt-in; no Day-7 gate
      source: 'challenge-page',
      tags: ['30-day-challenge', 'pressure-triangle'],
    });
    return { ok: true, alreadyEnrolled: false };
  } catch (err) {
    console.error('challenge-signup: drip-kv enroll failed', err.message);
    return { ok: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate-limit FIRST so attackers can't exhaust Resend or burn sender rep.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    console.warn(`challenge-signup: rate-limited ip=${ip} count=${rl.count}`);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { email, name } = req.body || {};

  // Email shape + header-injection-safety check (was previously `.includes('@')`
  // only — too loose; let malformed addresses through which Resend then
  // silently rejected, leaving customers stuck without their welcome email).
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1. Enroll in Resend drip:* KV (the actual daily-arc delivery system).
  //    This is the new single source of truth as of 2026-05-12. Daily cron
  //    will start sending Day 1 → Day 30 tomorrow at 12:00 UTC.
  const dripResult = await enrollInDripKV(trimmedEmail, name);
  if (!dripResult.ok) {
    console.warn('challenge-signup: drip enrollment skipped', dripResult.reason);
  }

  // 2026-05-14: Mailchimp tagging removed. Drip:* KV is canonical;
  // the enrollInDripKV call above already tags this signup with
  // ['30-day-challenge', 'pressure-triangle']. No further list-side work.

  // 2. Send announcement email via Resend (welcome + expectation-setting).
  try {
    const html = renderAnnouncementEmail(name);
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: "I built something. Doors open Friday.",
      html,
    });
  } catch (err) {
    console.error('challenge-signup: resend failed', err.message);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }

  return res.status(200).json({
    success: true,
    dripEnrolled: dripResult.ok,
    alreadyEnrolled: dripResult.alreadyEnrolled || false,
  });
}
