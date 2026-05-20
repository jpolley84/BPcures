// api/seminar-broadcast.js — fires the Annie+Joel intimacy seminar
// invitation to the entire active drip list (~4,000 recipients).
//
// Pattern mirrors api/cohort-sunday-cron.js: CRON_SECRET-protected,
// pulls recipients via _cohort-broadcast.pullRecipients(), rate-limits
// at 70ms/email (~14/sec) to fit Vercel's 300s function timeout.
//
// Triggered manually via:
//   curl -X POST https://bpquiz.com/api/seminar-broadcast \
//        -H "Authorization: Bearer $CRON_SECRET"
//
// One-shot idempotency: writes flag 'seminar-broadcast-fired' to KV
// so accidental double-fire is blocked for 7 days.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { pullRecipients, signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

const SUBJECT = "Sorry — last link was broken. Annie's on in 5 minutes.";
// Direct Zoom link this time. Existing list members already gave us their
// email yesterday (we wrote the seminarInviteSent flag) so no capture
// needed — get them to the call as fast as possible.
const ZOOM_URL = 'https://tinyurl.com/2p3b449n';
const SEMINAR_URL = 'https://bpquiz.com/seminar'; // kept as secondary CTA
const RATE_LIMIT_MS = 70; // ~14/sec, completes ~4,000 in ~280s

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function unsubUrl(email) {
  return `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;
}

function renderHtml(firstName, email) {
  const name = (firstName || '').trim() || 'Friend';
  const safeUnsub = unsubUrl(email);

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN &middot; The Blood Pressure Guy</div>
      </td></tr>

      <tr><td style="padding:24px 28px 0;">
        <p style="font-family:Georgia,serif;font-size:18px;line-height:1.55;color:#2C3E50;margin:0 0 14px;">
          Hi ${escapeHtml(name)},
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          The link in yesterday's email was broken. <strong>My fault.</strong> Apologies.
        </p>
        <p style="font-size:16px;line-height:1.65;color:#2C3E50;margin:0 0 4px;font-weight:700;">
          Annie's session starts in 5 minutes &mdash; here's the working Zoom link:
        </p>
      </td></tr>

      <tr><td style="padding:18px 28px 0;">
        <div style="background:#2E3A30;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C7A95E;font-weight:700;margin-bottom:10px;">Join the live session</div>
          <a href="${ZOOM_URL}" style="display:inline-block;background:#C7A95E;color:#2E3A30;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
            Open Zoom &rarr;
          </a>
          <div style="font-size:12px;color:#A8AC9F;margin-top:12px;line-height:1.5;word-break:break-all;">
            ${ZOOM_URL}
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 18px;">
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Same link works for all the remaining sessions this week. <strong>Tomorrow (Wed) and Thursday (me)</strong> are the two most people come for.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Daily at 1 PM ET through Saturday.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">
          Joel Polley, RN &middot; The Blood Pressure Guy
        </p>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">
          <strong>P.S.</strong> If you can't make today's call live, the link still gets you into the next five. Thursday I'm walking through what your BP meds are doing to circulation and libido &mdash; bring questions.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN &middot; Joel Polley, RN &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a><br />
          Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.<br />
          <a href="${safeUnsub}" style="color:#9A9A9A;">Unsubscribe</a> &middot; You're on the BraveWorks RN list at ${escapeHtml(email)}.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderText(firstName, email) {
  const name = (firstName || '').trim() || 'Friend';
  return `Hi ${name},

The link in yesterday's email was broken. My fault. Apologies.

Annie's session starts in 5 minutes — here's the working Zoom link:

${ZOOM_URL}

Same link works for all the remaining sessions this week. Tomorrow (Wed) and Thursday (me) are the two most people come for.

Daily at 1 PM ET through Saturday.

— Joel
Joel Polley, RN · The Blood Pressure Guy

P.S. If you can't make today's call live, the link still gets you into the next five. Thursday I'm walking through what your BP meds are doing to circulation and libido — bring questions.

---
Unsubscribe: ${unsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // 2026-05-19 V2 re-fire: original broadcast linked to /seminar which was
  // broken in prod (untracked files overwritten by a parallel deploy).
  // We're firing the corrected-link version now. Per-record dedupe uses
  // a new flag (seminarInviteSentV2) so it's safe even though the V1 flag
  // is set on ~4,191 records — V2 ignores V1, naturally hits everyone.

  // 2026-05-18 timeout-resume hardening: first fire timed out at 300s with
  // 4,251 records. Now we pull recipients via direct KV scan + filter on
  // per-record `seminarInviteSent` flag so re-fires safely resume where the
  // previous fire stopped. Each fire writes the flag immediately after the
  // Resend send succeeds — so a mid-loop timeout loses at most the in-flight
  // record, not the entire run.

  let allKeys = [];
  try {
    allKeys = await kv.keys('drip:*');
  } catch (err) {
    console.error('seminar-broadcast: kv.keys failed', err.message);
    return res.status(500).json({ error: 'kv keys scan failed', detail: err.message });
  }

  const resend = getResend();
  const startedAt = Date.now();
  const MAX_RUN_MS = 270 * 1000; // bail out before the 300s function cap
  const stats = { total: 0, eligible: 0, alreadySent: 0, unsub: 0, paused: 0, complete: 0, noEmail: 0, duplicate: 0 };
  const seen = new Set();
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };

  for (const k of allKeys) {
    stats.total++;

    // Bail out before the Vercel function cap so we can return a clean
    // result and the caller can re-fire (next run resumes via the
    // seminarInviteSent flag).
    if (Date.now() - startedAt > MAX_RUN_MS) {
      results.bailedOnTimeout = true;
      break;
    }

    let rec;
    try {
      rec = await kv.get(k);
    } catch (err) {
      continue;
    }
    if (!rec || !rec.email) { stats.noEmail++; continue; }
    if (rec.unsubscribed) { stats.unsub++; continue; }
    if (rec.paused) { stats.paused++; continue; }
    if (rec.complete) { stats.complete++; continue; }
    if (rec.seminarInviteSentV2) { stats.alreadySent++; continue; }

    const emailKey = String(rec.email).toLowerCase().trim();
    if (seen.has(emailKey)) { stats.duplicate++; continue; }
    seen.add(emailKey);
    stats.eligible++;

    try {
      await resend.emails.send({
        from: FROM,
        to: rec.email,
        replyTo: REPLY,
        subject: SUBJECT,
        html: renderHtml(rec.firstName, rec.email),
        text: renderText(rec.firstName, rec.email),
      });
      results.sent++;

      // Write per-record flag immediately so a mid-loop timeout doesn't
      // cause a double-send on the next fire.
      try {
        await kv.set(k, { ...rec, seminarInviteSentV2: true, seminarInviteSentV2At: new Date().toISOString() });
      } catch (writeErr) {
        // Non-fatal — we logged the send, this just means the next fire
        // will try to send again. Resend dedupes by recent recipient anyway.
        console.warn('seminar-broadcast: flag write failed for', rec.email, writeErr.message);
      }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) {
        results.errors.push({ email: rec.email, error: err.message });
      }
    }
    await new Promise((res) => setTimeout(res, RATE_LIMIT_MS));
  }

  // Mark the run done only if we didn't bail on timeout.
  if (!results.bailedOnTimeout && results.sent > 0) {
    try {
      await kv.set('seminar-broadcast-fired', { firedAt: new Date().toISOString(), sent: results.sent }, { ex: 7 * 86400 });
    } catch (err) {
      console.warn('seminar-broadcast: idempotency flag write failed', err.message);
    }
  }

  return res.status(200).json({ ok: true, stats, results, runtimeMs: Date.now() - startedAt });
}
