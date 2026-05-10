// /api/continue — Day 7 opt-in handler for the BPQuiz drip.
//
// The Day 7 email has a button: "Yes, give me Days 8-30 →" pointing here
// with an HMAC-signed token in `?t=`. Clicking flips `optedIn:true` on the
// subscriber's KV record and redirects them to a thanks page.
//
// Token format (must match drip-cron.js signOptInToken):
//   base64url(`${email}.${ts}.${sig}`)
//   where sig = first 16 hex chars of HMAC-SHA256(SECRET, `${email}.${ts}`)
//
// Tokens have no expiry — once issued they remain valid (people sometimes click
// in their archive folder weeks later). The HMAC binds the click to the exact
// email it was sent in.

import { kv } from '@vercel/kv';
import crypto from 'node:crypto';

const SECRET = process.env.DRIP_OPT_IN_SECRET || process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

function verifyOptInToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const payload = parts.join('.');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
    if (sig !== expected) return null;
    const [email, ts] = parts;
    return { email, ts: Number(ts) };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const token = req.query?.t || req.url?.split('?t=')[1]?.split('&')[0];
  if (!token) {
    return res.status(400).send(renderErrorPage('No token provided. This link looks broken.'));
  }

  const verified = verifyOptInToken(token);
  if (!verified) {
    return res.status(400).send(renderErrorPage('This link is invalid or has been tampered with.'));
  }

  const key = `drip:${verified.email.toLowerCase()}`;
  let sub = await kv.get(key);

  // Defensive: if the sub record is gone (rare race condition), recreate
  // a minimal one so the opt-in still sticks.
  if (!sub) {
    sub = {
      email: verified.email,
      enrolledAt: new Date(verified.ts).toISOString(),
      lastSentDay: 7,
    };
  }

  await kv.set(key, {
    ...sub,
    optedIn: true,
    optedInAt: new Date().toISOString(),
  });

  // Friendly thanks page.
  return res.status(200).send(renderThanksPage(verified.email));
}

function renderThanksPage(email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>You're in — Days 8-30 are coming</title>
  <style>
    body { margin:0; padding:0; background:#FBF8F1; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#2C3E50; }
    .wrap { max-width:560px; margin:0 auto; padding:64px 24px; }
    h1 { font-family:Georgia,serif; font-size:32px; line-height:1.25; margin:0 0 16px; color:#B85A36; font-weight:500; }
    p { font-size:16px; line-height:1.65; color:#3A3A3A; margin:0 0 18px; }
    .stamp { font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#B85A36; font-weight:700; margin-bottom:18px; }
    .cta { display:inline-block; background:#B85A36; color:#FFFFFF; padding:14px 28px; border-radius:10px; text-decoration:none; font-weight:700; font-size:15px; margin-top:8px; }
    .footer { margin-top:48px; padding-top:24px; border-top:1px solid #E8E2D4; font-size:13px; color:#8A8A8A; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="stamp">You're in</div>
    <h1>Days 8-30 are coming.</h1>
    <p>Tomorrow, lie #2 hits your inbox at 7 AM CDT. By Day 30 you'll have the full protocol — every cuff reading, every doctor script, every meal architecture I've taught BraveWorks members for the past three years.</p>
    <p>One thing before then: if you don't have the BP Reset Kit yet, today's the last natural moment to grab it. Day 8 onward references the kit constantly.</p>
    <p><a class="cta" href="https://buy.stripe.com/00w6oH8k32zsfDR8VrfnO0A">Get the BP Reset Kit — $17 →</a></p>
    <p>See you in the morning.</p>
    <p style="font-weight:600; color:#2C3E50; margin-top:32px;">Joel<br/><span style="font-style:italic; font-weight:normal; color:#3A3A3A;">RN, BraveWorks</span></p>
    <div class="footer">
      Confirmed for: <strong>${escapeHtml(email)}</strong><br/>
      Question? Reply to any of my emails — I read them all.
    </div>
  </div>
</body>
</html>`;
}

function renderErrorPage(message) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Link issue</title>
<style>body{margin:0;padding:64px 24px;background:#FBF8F1;font-family:system-ui,sans-serif;color:#2C3E50;text-align:center;}h1{color:#B85A36;}p{font-size:16px;line-height:1.6;color:#3A3A3A;}</style>
</head><body>
<h1>Something went sideways.</h1>
<p>${escapeHtml(message)}</p>
<p>Reply to any of my emails and I'll add you manually. — Joel</p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
