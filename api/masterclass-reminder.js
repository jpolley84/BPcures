// api/masterclass-reminder.js — "Beyond the Cuff" pre-class reminders.
//
// 2026-07-20 (Joel): the confirmation email existed but nothing reminded
// registrants before the live class. This fires the 60-minute and 10-minute
// reminders (with the Zoom link) to everyone in masterclass:members.
//
// Trigger: Vercel cron, Mondays (class is every Monday 7pm CT):
//   stage=60 -> 0 23 * * 1   (6:00 pm CT / 23:00 UTC, CDT)
//   stage=10 -> 50 23 * * 1  (6:50 pm CT / 23:50 UTC, CDT)
// DST caveat: schedules are UTC. During CST (winter) 6pm CT = 00:00 UTC the
// NEXT day, so these fire an hour early Nov-Mar. Revisit at the fall change,
// or move to a self-checking "is it ~1h before 7pm CT" guard later.
//
// Idempotent: one KV marker per (CT class date, stage), so a double cron fire
// or a manual re-trigger never double-sends. Query flags:
//   ?stage=60|10   which reminder (required)
//   ?dry=1         count + log only, no send, no marker
//   ?only=<email>  send just to that address (manual test), no marker
//
// Auth: isAuthorizedCron (Vercel CRON_SECRET / x-vercel-cron / CRON_AUTH_TOKEN).
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { isAuthorizedCron } from './_cron-auth.js';

const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

// Keep in sync with api/masterclass-register.js (same weekly Zoom).
const ZOOM_JOIN_URL = 'https://us06web.zoom.us/j/81893444167?pwd=VjZjyy8kaLQefTdja5sCxmKrY07tqz.1';
const ZOOM_MEETING_ID = '818 9344 4167';
const ZOOM_PASSCODE = '846248';

const RATE_LIMIT_MS = 350;
export const config = { maxDuration: 300 };

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// CT calendar date (for the idempotency marker). CDT = UTC-5.
function ctDateKey(now = new Date()) {
  return new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 10);
}

function reminderEmail({ firstName, stage }) {
  const name = firstName ? escapeHtml(firstName) : 'friend';
  const sixty = stage === 60;
  const kicker = sixty ? 'We go live in one hour' : 'We are starting in 10 minutes';
  const lead = sixty
    ? `In one hour I go live for <strong>Beyond the Cuff</strong>, and I want you in the room. Tonight I am walking through the 3 hidden daily triggers quietly driving your numbers up. No new pills, no giving up your foods, just the three things and how to take charge of them.`
    : `We start in about ten minutes. Grab your spot now so you are settled before I begin. The first few minutes are where the whole thing gets framed, so getting in early matters.`;
  const btnLabel = sixty ? 'Save Your Spot / Join Zoom &rarr;' : 'Join the Masterclass Now &rarr;';
  const postal = process.env.BUSINESS_POSTAL_ADDRESS
    ? `<p style="color:#9A9A9A;font-size:0.78rem;margin-top:0.4rem;">BraveWorks RN &middot; ${escapeHtml(process.env.BUSINESS_POSTAL_ADDRESS)}</p>` : '';
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#1E2B2A;line-height:1.6;background:#FAF6EF;">
<p style="font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;color:#B93C20;font-weight:700;margin:0 0 1rem;">${sixty ? '🔴 Beyond the Cuff &middot; One Hour Out' : '🔴 Beyond the Cuff &middot; Starting Now'}</p>
<h2 style="margin:0 0 1rem;font-weight:600;">${escapeHtml(kicker)}, ${name}.</h2>
<p>${lead}</p>
<div style="background:#F4E6DE;border-radius:12px;padding:1rem 1.2rem;margin:1.2rem 0;text-align:center;">
  <p style="margin:0 0 0.7rem;"><a href="${ZOOM_JOIN_URL}" style="display:inline-block;background:#DB4E2E;color:#ffffff;text-decoration:none;font-weight:700;padding:0.8rem 1.6rem;border-radius:999px;font-size:1.05rem;">${btnLabel}</a></p>
  <p style="margin:0;color:#4A5A58;font-size:0.9rem;">Meeting ID: <strong>${ZOOM_MEETING_ID}</strong> &middot; Passcode: <strong>${ZOOM_PASSCODE}</strong></p>
</div>
<p>${sixty ? 'Bring a pen. You will want to write down which of the three is loudest for you.' : 'See you in there.'}</p>
<p style="margin-top:1.6rem;">&mdash; Joel Polley, RN<br/><span style="color:#9A9A9A;font-size:0.88rem;">BraveWorks RN &middot; BPQuiz.com</span></p>
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #E4DACE;">
<p style="color:#9A9A9A;font-size:0.78rem;margin:0;">You saved a seat at bpquiz.com/masterclass. Educational content only, not medical advice. Reply "remove" to stop class emails.</p>
${postal}
</body></html>`;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });
  const q = req.query || {};
  const stage = String(q.stage) === '10' ? 10 : String(q.stage) === '60' ? 60 : null;
  if (!stage) return res.status(400).json({ error: 'stage must be 60 or 10' });
  const dry = q.dry === '1';
  const only = typeof q.only === 'string' && q.only.includes('@') ? q.only.trim().toLowerCase() : null;

  // Idempotency: never send the same stage twice for the same class date.
  const marker = `masterclass:reminder:${ctDateKey()}:${stage}`;
  if (!dry && !only) {
    const already = await kv.get(marker);
    if (already) return res.status(200).json({ ok: true, skipped: 'already_sent', marker });
  }

  const emails = only ? [only] : (await kv.smembers('masterclass:members').catch(() => [])) || [];
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'no resend key' });
  const resend = new Resend(process.env.RESEND_API_KEY);

  let sent = 0, failed = 0;
  for (const email of emails) {
    if (!email || !email.includes('@')) continue;
    let firstName = '';
    try {
      const rec = await kv.get(`masterclass:reg:${email}`);
      firstName = (rec?.name || '').split(/\s+/)[0] || '';
    } catch { /* name is optional */ }
    if (dry) { sent++; console.log(`[DRY] reminder stage=${stage} -> ${email}`); continue; }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        reply_to: REPLY_TO,
        subject: stage === 60 ? 'We go live in one hour — Beyond the Cuff 🔴' : 'Starting now — join the masterclass 🔴',
        html: reminderEmail({ firstName, stage }),
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`masterclass-reminder stage=${stage} send failed ${email}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  if (!dry && !only) {
    try { await kv.set(marker, { at: new Date().toISOString(), stage, sent }, { ex: 6 * 3600 }); } catch { /* non-fatal */ }
  }
  console.log(`masterclass-reminder stage=${stage} done: sent=${sent} failed=${failed} dry=${dry} only=${only || ''}`);
  return res.status(200).json({ ok: true, stage, recipients: emails.length, sent, failed, dry, only: only || null });
}
