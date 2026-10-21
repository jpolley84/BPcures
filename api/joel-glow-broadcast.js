// api/joel-heart-month-broadcast.js - October heart-health opener, Joel's list.
//
// One email, no offer and no lead magnet, on Joel's explicit instruction
// 2026-10-04: the whole ask is a one-letter reply (A/B/C/D) that decides what
// he teaches first. A link would compete with the vote, and a pure reply-ask
// lifts deliverability for everything sent after it.
//
// Audience: drip:* + bwbp:drip:* minus unsubscribed, paused, and current
// coaching clients (state === 'tier-4'). Joel confirmed clients are excluded.
//
// Cloned from api/joel-masterclass-broadcast.js. Everything below the EMAILS
// block is that file byte for byte, because that scan/resume/cron-guard code
// moved 10,999 emails with zero failures on 2026-09-14. Only the constants
// and the copy changed.
//
// Scheduled: 2026-10-05 08:00 America/New_York = 12:00 UTC.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { neverSendGuard } from './_never_send.js';

const REGISTER_URL = 'https://bpquiz.com/masterclass/v3/';
// ARMED 2026-10-05 on Joel's go after he read both dry runs.
// Guard compares this to today's date in America/Chicago. Fires at
// 12:00 UTC = 08:00 America/New_York = 07:00 America/Chicago, so the
// date matches on every window in vercel.json and on no other day.
// Per-email fire dates, America/Chicago. Option 1 schedule Joel
// approved 2026-10-06: Fri 10-09 and Sat 10-10 are rest days, and
// Day 6 + Day 7 both land on class day 10-12.

const FIRE_DATES = {"1": "2026-10-21"};
const CRON_FIRE_DATE = '2026-10-21';
const RATE_LIMIT_MS = 70;
const MAX_RUN_MS = 250 * 1000;
const SENT_FLAG_PREFIX = 'joelGlowOct26'; // + emailNum, e.g. joelMcInvite1Sent
const SENT_SET_PREFIX = 'joelglow:sent:'; // + emailNum

// 2026-10-19: buyers type their own names at checkout, so the store holds
// "MAMIE", "Shirley." and the occasional handle. Printing those verbatim in a
// greeting reads as shouting or as a mistake, so normalise before rendering.
function tidyName(raw) {
  const s = String(raw || '').trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  if (!s) return 'there';
  const first = s.split(/\s+/)[0];
  if (!/^[\p{L}][\p{L}'\-]*$/u.test(first)) return 'there';
  if (first.length < 2) return 'there';
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return first;
}

function unsubUrl(email) {
  return `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;
}

function disclaimerHtml(email) {
  const safeUnsub = unsubUrl(email);
  return `<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
    BraveWorks RN &middot; Joel Polley, RN &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a><br />
    Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.<br />
    <a href="${safeUnsub}" style="color:#9A9A9A;">Unsubscribe</a> &middot; You're on the BraveWorks RN list at ${escapeHtml(email)}.
  </p>`;
}

function disclaimerText(email) {
  return `---
BraveWorks RN · Joel Polley, RN · bpquiz.com
Educational content only. Not medical advice. Always complement — never replace — care from your physician.
Unsubscribe: ${unsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;
}

function wrapHtml(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);"><tr><td style="padding:30px 28px;font-size:15px;line-height:1.65;color:#2C3E50;">
${bodyHtml}
${disclaimerHtml(email)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const EMAILS = {
  1: {
    subject: "A woman wrote to us at 4 in the morning",
    preheader: "She looked at something she had been avoiding.",
    html: (name, email) => wrapHtml(`<p>Hey \${escapeHtml(name)},</p><p><strong>An email came in the dead of the night.</strong></p><p>I read it at 4:03 AM and answered it before Annie ever saw it.</p><p>Here's the backstory.</p><p>We had just finished Day 1 of our live Change My Life Challenge.</p><p>And later that night, a woman wrote to us flustered.</p><p>She was in angst because an exercise we did in class, plus the homework, made her stop and look at things she had not really wanted to face.</p><p>Not another diet.</p><p>Not another workout.</p><p>Not another long list of things to do.</p><p>Just a simple exercise designed to help people find the stuck points that have been keeping them stuck.</p><p>And THAT was the hard part. Because sometimes seeing the boulders that have us trapped is the most difficult part of the whole thing.</p><p>Can I be honest with you?</p><p>Recently Annie and I joined a coaching group for 23,000 for the year, because even coaches need coaches.</p><p>At some point I thought, have we made a mistake?</p><p>There is nothing tangible in it. It is not like what we do, where we coach somebody to get their blood pressure down and as a side effect the diabetes improves, the weight comes off, the hormones settle.</p><p>Research says getting your blood pressure under control can add an average of 5 good years to your life. That is priceless.</p><p>But the truth is, investing in myself at that level left me feeling exactly like the woman who wrote that email. Flustered, looking straight at <strong>everything</strong> that still needs work.</p><p>Maybe you know that feeling.</p><p>The holidays are coming.</p><p><em>Life is happening.</em></p><p>Everybody needs something from you.</p><p>You are tired.</p><p>And before you know it, you are making that same promise to yourself all over again.</p><p>"I'll deal with all of it after this season is over."</p><p>But what if the answer is not simply trying harder?</p><p><strong>What if part of moving forward is finally understanding what has been holding you back?</strong></p><p>Maybe your hair, your skin, your weight, or your sleep changed too.</p><p>None of that means your story is over.</p><p>You still have a whole life to live.</p><p>So think about something tonight.</p><p><strong>If you could feel different in just ONE area of your life before this year ends, what would it be?</strong></p><p>Because the person you were built to be still has dreams, plans, and a lot of living left to do.</p><p>Do yourself a favor today and do one kind thing for yourself. You are worth it.</p><p>I'm cheering for you.</p><p>Joel Polley, RN</p><p>P.S. Sometimes the biggest change starts with one question you finally give yourself permission to answer.</p>`, "She looked at something she had been avoiding.", email),
    text: (name, email) => `Hey \${name},

An email came in the dead of the night.

I read it at 4:03 AM and answered it before Annie ever saw it.

Here's the backstory.

We had just finished Day 1 of our live Change My Life Challenge.

And later that night, a woman wrote to us flustered.

She was in angst because an exercise we did in class, plus the homework, made her stop and look at things she had not really wanted to face.

Not another diet.

Not another workout.

Not another long list of things to do.

Just a simple exercise designed to help people find the stuck points that have been keeping them stuck.

And THAT was the hard part. Because sometimes seeing the boulders that have us trapped is the most difficult part of the whole thing.

Can I be honest with you?

Recently Annie and I joined a coaching group for 23,000 for the year, because even coaches need coaches.

At some point I thought, have we made a mistake?

There is nothing tangible in it. It is not like what we do, where we coach somebody to get their blood pressure down and as a side effect the diabetes improves, the weight comes off, the hormones settle.

Research says getting your blood pressure under control can add an average of 5 good years to your life. That is priceless.

But the truth is, investing in myself at that level left me feeling exactly like the woman who wrote that email. Flustered, looking straight at everything that still needs work.

Maybe you know that feeling.

The holidays are coming.

Life is happening.

Everybody needs something from you.

You are tired.

And before you know it, you are making that same promise to yourself all over again.

"I'll deal with all of it after this season is over."

But what if the answer is not simply trying harder?

What if part of moving forward is finally understanding what has been holding you back?

Maybe your hair, your skin, your weight, or your sleep changed too.

None of that means your story is over.

You still have a whole life to live.

So think about something tonight.

If you could feel different in just ONE area of your life before this year ends, what would it be?

Because the person you were built to be still has dreams, plans, and a lot of living left to do.

Do yourself a favor today and do one kind thing for yourself. You are worth it.

I'm cheering for you.

Joel Polley, RN

P.S. Sometimes the biggest change starts with one question you finally give yourself permission to answer.`,
  },
};
let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

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


// Current coaching clients never receive a bulk send. Do not rely on
// state === 'tier-4' for this: an /allin purchase writes state:'buyer', so
// the tier check silently matches nobody. On 2026-09-28 that is how 13
// clients were emailed an offer for the program they were already paying
// for. The bwbp:allin:* key space is the roster, and this load fails closed.
async function loadCoachingClients() {
  const emails = new Set();
  let cursor = 0;
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'bwbp:allin:*', count: 500 });
    cursor = next;
    for (const k of batch) {
      if (k.startsWith('bwbp:allindone:')) continue;
      emails.add(k.slice('bwbp:allin:'.length).trim().toLowerCase());
    }
  } while (String(cursor) !== '0');
  if (!emails.size) throw new Error('coaching-client exclusion list came back empty; refusing to send');
  return emails;
}


// Tonight's encore adds two exclusions the heart runway did not have:
// the challenge waitlist (they get their own $97 VIP sequence) and anyone
// who typed their email into last night's Zoom chat. Both were loaded into
// KV from Joel's local files, because a serverless function cannot read
// his Zoom recording folder.
const LAUNCH_SKIP = new Set(["aprilj@yorku.ca", "arvandersh@gmail.com", "bankablefinancial@gmail.com", "boydwanda@mail.com", "brightnessmalo482@gmail.com", "cc_sanders@comcast.net", "dclarepurpose2@gmail.com", "despitetheirony@icloud.com", "dssatlanta@live.com", "grahamjoanne2@gmail.com", "ivawmoore@yahoo.com", "jonmarksmom@yahoo.com", "kathy022254@yahoo.com", "keyb81@gmail.com", "ladylee4200@gmail.com", "lavbennett@yahoo.com", "lee36330@hotmail.com", "linda.berry@mac.com", "lionahalliman@gmail.com", "llady1_2000@yahoo.com", "maybelline_torres@yahoo.com", "monica.fogle@yahoo.com", "ngwitozzi@yahoo.com", "nikosanders1@gmail.com", "reikiway@comcast.net", "rmitchhood2@outlook.com", "roxanneauguste@yahoo.com", "sgldblndl@hotmail.com", "sophiankosi4sibongile@gmail.com", "t1412@hotmail.com", "tamarabeckfordmd@gmail.com", "travelconsult@mega.bw", "tsbeckford@gmail.com", "vernesterhodge@yahoo.com", "wilhelminajohn815@yahoo.com", "wordmomma55@gmail.com", "yraaid@gmail.com"]);

async function challengeBuyers() {
  const out = new Set();
  for (const key of ['challenge:2026-10-19:vip', 'challenge:2026-10-19:ga']) {
    try { const members = await kv.smembers(key);
      for (const m of members || []) out.add(String(m).trim().toLowerCase());
    } catch { /* non-fatal */ }
  }
  // 2026-10-18: people already spoken to tonight get skipped. The /coach
  // registrants had their own two emails, and tonight's Zoom and Facebook
  // audience got the gift plus a deadline email.
  for (const e of LAUNCH_SKIP) out.add(e);
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const emailNum = Number(req.query?.email);
  if (![1].includes(emailNum)) {
    return res.status(400).json({ error: 'pass ?email=1' });
  }
  const template = EMAILS[emailNum];
  const SENT_FLAG = `${SENT_FLAG_PREFIX}${emailNum}Sent`;
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  if (cronMode) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
    if (today !== fireDate) return res.status(200).json({ ok: true, skipped: 'cron date guard', today, fireDate, emailNum });
  }
  const manualSend =
    req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-LAUNCH-${emailNum}`;
  const sendMode = cronMode || manualSend;

  let allKeys = [];
  try {
    allKeys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  } catch (err) {
    return res.status(500).json({ error: 'kv scan failed', detail: err.message });
  }

  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const encoreSkip = await challengeBuyers();
  // Never-send guard (2026-10-07): Accelerator roster + bwbp:allin:* + Stripe
  // coaching payers + bwbp:neversend + Resend unsubscribes, built fresh per run.
  // Fails closed: if the list cannot be built, nothing sends.
  let guard;
  try { guard = await neverSendGuard(); }
  catch (err) { return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message }); }
  const stats = { total: 0, eligible: 0, alreadySent: 0, unsub: 0, paused: 0, neverSend: 0, coachingClient: 0, noEmail: 0, duplicate: 0, invalidEmail: 0, dupSuppressed: 0 };
  const seen = new Set();
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const resend = sendMode ? getResend() : null;

  // Read records in mget batches (one KV round trip per 500 keys) instead of
  // one kv.get per key — per-key reads capped a 250s fire at ~1,300 sends.
  const CHUNK = 500;
  outer:
  for (let ci = 0; ci < allKeys.length; ci += CHUNK) {
    const keyChunk = allKeys.slice(ci, ci + CHUNK);
    let recs;
    try { recs = await kv.mget(...keyChunk); } catch { continue; }
    for (let ri = 0; ri < keyChunk.length; ri++) {
    const k = keyChunk[ri];
    const rec = recs[ri];
    stats.total++;
    if (sendMode && Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break outer; }

    if (!rec || !rec.email) { stats.noEmail++; continue; }
    if (rec.unsubscribed) { stats.unsub++; continue; }
    if (rec.paused) { stats.paused++; continue; }
    if (guard.blocks(rec.email)) { stats.neverSend++; continue; }
    if (rec.state === 'tier-4' || coachingClients.has(String(rec.email || '').trim().toLowerCase())) { stats.coachingClient++; continue; }
    if (encoreSkip.has(String(rec.email || '').trim().toLowerCase())) { stats.encoreSkip = (stats.encoreSkip || 0) + 1; continue; }

    const emailKey = String(rec.email).toLowerCase().trim();
    if (rec[SENT_FLAG]) { stats.alreadySent++; continue; }
    if (!EMAIL_RE.test(emailKey)) { stats.invalidEmail++; continue; }
    if (seen.has(emailKey)) { stats.duplicate++; continue; }
    seen.add(emailKey);

    if (sendMode) {
      let inSet = 0;
      try { inSet = await kv.sismember(SENT_SET, emailKey); } catch { /* treat as not-sent */ }
      if (inSet) {
        stats.dupSuppressed++;
        try { await kv.set(k, { ...rec, [SENT_FLAG]: true }); } catch { /* next fire re-checks */ }
        continue;
      }
    }
    stats.eligible++;

    if (!sendMode) {
      if (samples.length < 3) {
        const name = tidyName(rec.firstName);
        const subject = typeof template.subject === 'function' ? template.subject(name) : template.subject;
        samples.push({ email: rec.email, firstName: rec.firstName || null, subject, text: template.text(name, rec.email) });
      }
      continue;
    }

    const name = tidyName(rec.firstName);
    const subject = typeof template.subject === 'function' ? template.subject(name) : template.subject;
    try {
      await resend.emails.send({
        from: FROM,
        to: rec.email,
        replyTo: REPLY,
        subject,
        html: template.html(name, rec.email),
        text: template.text(name, rec.email),
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, emailKey); } catch (err) { console.warn('joelmc-blast: sadd failed', err.message); }
      try { await kv.set(k, { ...rec, [SENT_FLAG]: true }); } catch (err) { console.warn('joelmc-blast: flag write failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: rec.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  return res.status(200).json({
    ok: true,
    emailNum,
    mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN',
    from: FROM,
    stats,
    ...guard.report(),
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
