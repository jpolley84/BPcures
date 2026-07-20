// api/restoreher-replay-broadcast.js — "I begged my wife to do this for you"
// One-shot blast to Joel's full active list (drip:* + bwbp:drip:* pools),
// introducing Annie + the $97 RestoreHER replay deal.
//
// SAFETY MODEL (per /send-campaign):
//   - Default mode is DRY-RUN: scans, counts eligibles, renders samples,
//     sends NOTHING.
//   - Real fire requires ?mode=send AND header `x-confirm: SEND-REPLAY-BLAST`.
//   - Per-record flag `rhhReplayBlastSent` makes re-fires resume-safe
//     (Vercel 300s cap — expect 2-3 fires for the full list).
//
// Dry-run:
//   curl -s "https://bpquiz.com/api/restoreher-replay-broadcast" \
//        -H "Authorization: Bearer $CRON_SECRET"
// Send:
//   curl -s -X POST "https://bpquiz.com/api/restoreher-replay-broadcast?mode=send" \
//        -H "Authorization: Bearer $CRON_SECRET" -H "x-confirm: SEND-REPLAY-BLAST"

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

const SUBJECT = 'I begged my wife to do this for you';
const PREVIEW = "Barbara O'Neill + Annie. Both days. $97 for my readers only.";
const PAGE_URL = 'https://restoreherhormones.com';
const CHECKOUT_URL = 'https://buy.stripe.com/dRmbJ16bV1vo63h2x3fnO1H';
const RATE_LIMIT_MS = 70; // ~14/sec
const MAX_RUN_MS = 250 * 1000;
const SENT_FLAG = 'rhhReplayBlastSent';
// 2026-07-20 POST-INCIDENT: per-key flags don't dedupe the SAME EMAIL living
// under two keys (drip:* + bwbp:drip:*) across separate fires — the in-memory
// `seen` set resets every invocation, so pool-duplicated people got a second
// copy once fires crossed into the bwbp pool. This KV SET of already-emailed
// addresses makes dedupe persistent: backfilled from flagged keys each pass,
// checked before every send, duplicate keys get flag-suppressed (no send).
const SENT_SET = 'rhhblast:sent-emails';

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
  const name = (firstName || '').trim() || 'there';
  const safeUnsub = unsubUrl(email);

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(PREVIEW)}</div>
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
          You know me as the blood pressure guy. Today I want you to meet the other RN in my house.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          My wife <strong>Annie</strong> is a registered nurse, a mother of six, and for the last ten years she has helped women fix the hormone problems behind the 2am wake-ups, the stubborn belly, the mood swings, the thinning hair, and the "your labs are fine" that doesn't feel fine.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Last month she did something big.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          She rented a room in Louisville and put <strong>Barbara O'Neill</strong> on stage for two full days. Yes, that Barbara O'Neill. Women flew in from across the country and paid $497 a seat. 17+ sessions on hormones, sleep, energy, weight, gut health, and how the body was designed to heal.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          I watched that room change people. At one point a 13-year-old girl read a poem about loving being a girl. The room cried. Then it cheered.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Here's the deal part.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          Every session was recorded. Annie is releasing the replays at $297. But because you're on my list &mdash; and because I asked her nicely &mdash; <strong>she's giving my readers the whole thing for $97.</strong>
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 4px;">
          That's both replay days, the watch guide, the symptom-to-session map that tells you exactly which session to watch first, all the bonuses, plus an invitation to a live virtual Q&amp;A for replay buyers. Watch while you cook, drive, or fold laundry. 14 days of access, at your pace.
        </p>
      </td></tr>

      <tr><td style="padding:18px 28px 0;">
        <div style="background:#10312A;border-radius:14px;padding:28px 24px;text-align:center;margin-bottom:22px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C9A85C;font-weight:700;margin-bottom:6px;">The RestoreHER replay &middot; limited-time deal</div>
          <div style="font-size:14px;color:#E8DBB8;margin-bottom:14px;"><s style="color:#8AA098;">$297</s> &nbsp;<strong style="font-size:20px;color:#C9A85C;">$97</strong> for my readers</div>
          <a href="${PAGE_URL}" style="display:inline-block;background:#C9A85C;color:#10312A;padding:16px 36px;border-radius:999px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">
            See what's inside &rarr;
          </a>
        </div>
      </td></tr>

      <tr><td style="padding:0 28px 18px;">
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          And if you're a man reading this: this is the email you forward to your wife, your daughter, your sister, or your mom. Trust me.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 14px;">
          As always: nothing here replaces your doctor. It works alongside them, the same way everything I teach does.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#3A3A3A;margin:0 0 6px;">
          &mdash; Joel
        </p>
        <p style="font-size:13px;color:#7A7A7A;margin:0 0 18px;">
          Joel Polley, RN &middot; BraveWorks
        </p>
        <p style="font-size:14px;line-height:1.6;color:#3A3A3A;margin:0;">
          <strong>P.S.</strong> Already know you want it? Direct checkout is here: <a href="${CHECKOUT_URL}" style="color:#B85A36;">grab the replay for $97</a>. The $97 price is a limited-time deal for this release only.
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
  const name = (firstName || '').trim() || 'there';
  return `Hi ${name},

You know me as the blood pressure guy. Today I want you to meet the other RN in my house.

My wife Annie is a registered nurse, a mother of six, and for the last ten years she has helped women fix the hormone problems behind the 2am wake-ups, the stubborn belly, the mood swings, the thinning hair, and the "your labs are fine" that doesn't feel fine.

Last month she did something big.

She rented a room in Louisville and put Barbara O'Neill on stage for two full days. Yes, that Barbara O'Neill. Women flew in from across the country and paid $497 a seat. 17+ sessions on hormones, sleep, energy, weight, gut health, and how the body was designed to heal.

I watched that room change people. At one point a 13-year-old girl read a poem about loving being a girl. The room cried. Then it cheered.

Here's the deal part.

Every session was recorded. Annie is releasing the replays at $297. But because you're on my list — and because I asked her nicely — she's giving my readers the whole thing for $97.

That's both replay days, the watch guide, the symptom-to-session map that tells you exactly which session to watch first, all the bonuses, plus an invitation to a live virtual Q&A for replay buyers. Watch while you cook, drive, or fold laundry. 14 days of access, at your pace.

See what's inside and grab the $97 deal: ${PAGE_URL}

And if you're a man reading this: this is the email you forward to your wife, your daughter, your sister, or your mom. Trust me.

As always: nothing here replaces your doctor. It works alongside them, the same way everything I teach does.

— Joel
Joel Polley, RN · BraveWorks

P.S. Already know you want it? Direct checkout: ${CHECKOUT_URL} — the $97 price is a limited-time deal for this release only.

---
Unsubscribe: ${unsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;
}

// SCAN-based key drain (kv.keys is disabled at our scale on Upstash)
async function scanKeys(pattern) {
  const keys = [];
  let cursor = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: pattern, count: 500 });
    keys.push(...batch);
    cursor = next;
  } while (String(cursor) !== '0');
  return keys;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const sendMode =
    req.query?.mode === 'send' && req.headers['x-confirm'] === 'SEND-REPLAY-BLAST';

  let allKeys = [];
  try {
    allKeys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  } catch (err) {
    return res.status(500).json({ error: 'kv scan failed', detail: err.message });
  }

  const startedAt = Date.now();
  const stats = { total: 0, eligible: 0, alreadySent: 0, unsub: 0, paused: 0, noEmail: 0, duplicate: 0, invalidEmail: 0, dupSuppressed: 0 };
  const seen = new Set();
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const resend = sendMode ? getResend() : null;

  // Backfill accumulator: emails of already-flagged keys, pushed to SENT_SET
  // in chunks so the set covers sends from before this dedupe existed.
  const backfill = [];
  async function flushBackfill(force = false) {
    if (backfill.length === 0 || (!force && backfill.length < 300)) return;
    const chunk = backfill.splice(0, backfill.length);
    try { await kv.sadd(SENT_SET, ...chunk); } catch (err) {
      console.warn('rhh-blast: backfill sadd failed', err.message);
    }
  }

  for (const k of allKeys) {
    stats.total++;

    if (sendMode && Date.now() - startedAt > MAX_RUN_MS) {
      results.bailedOnTimeout = true;
      break;
    }

    let rec;
    try {
      rec = await kv.get(k);
    } catch {
      continue;
    }
    if (!rec || !rec.email) { stats.noEmail++; continue; }
    if (rec.unsubscribed) { stats.unsub++; continue; }
    if (rec.paused) { stats.paused++; continue; }

    const emailKey = String(rec.email).toLowerCase().trim();

    if (rec[SENT_FLAG]) {
      stats.alreadySent++;
      if (sendMode && EMAIL_RE.test(emailKey)) { backfill.push(emailKey); await flushBackfill(); }
      continue;
    }

    if (!EMAIL_RE.test(emailKey)) { stats.invalidEmail++; continue; }
    if (seen.has(emailKey)) { stats.duplicate++; continue; }
    seen.add(emailKey);

    // Persistent cross-fire dedupe: if this email already got the blast from
    // another key, flag-suppress this key without sending.
    if (sendMode) {
      let inSet = 0;
      try { inSet = await kv.sismember(SENT_SET, emailKey); } catch { /* treat as not-sent */ }
      if (inSet) {
        stats.dupSuppressed++;
        try {
          await kv.set(k, { ...rec, [SENT_FLAG]: true, rhhReplayBlastSuppressed: 'duplicate-email', rhhReplayBlastSentAt: new Date().toISOString() });
        } catch { /* next fire re-checks */ }
        continue;
      }
    }
    stats.eligible++;

    if (!sendMode) {
      // Dry-run: capture 3 rendered samples (incl. one missing-name fallback)
      if (samples.length < 3) {
        const wantFallback = samples.length === 2;
        if (!wantFallback || !(rec.firstName || '').trim()) {
          samples.push({
            key: k,
            email: rec.email,
            firstName: rec.firstName || null,
            subject: SUBJECT,
            text: renderText(rec.firstName, rec.email),
          });
        } else if (wantFallback) {
          samples.push({
            key: k,
            email: rec.email,
            firstName: null,
            note: 'forced missing-name fallback render',
            subject: SUBJECT,
            text: renderText('', rec.email),
          });
        }
      }
      continue;
    }

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
      try {
        await kv.sadd(SENT_SET, emailKey);
      } catch (err) {
        console.warn('rhh-blast: sadd failed for', rec.email, err.message);
      }
      try {
        await kv.set(k, { ...rec, [SENT_FLAG]: true, rhhReplayBlastSentAt: new Date().toISOString() });
      } catch (writeErr) {
        console.warn('rhh-blast: flag write failed for', rec.email, writeErr.message);
      }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: rec.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  if (sendMode) await flushBackfill(true);

  let uniqueEmailed = null;
  try { uniqueEmailed = await kv.scard(SENT_SET); } catch { /* informational */ }

  return res.status(200).json({
    ok: true,
    uniqueEmailed,
    mode: sendMode ? 'SEND' : 'DRY-RUN',
    from: FROM,
    subject: SUBJECT,
    stats,
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
