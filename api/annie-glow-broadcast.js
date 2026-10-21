// api/annie-heart-month-broadcast.js - October heart-health opener, Annie's list.
//
// One email, no offer and no lead magnet, on Joel's explicit instruction
// 2026-10-04: the whole ask is a one-letter reply (A/B/C/D).
//
// Audience: KV hash rhhmc:segment, minus the Resend suppression audience.
// Anyone on Joel's list was already removed from that segment, so nobody
// receives both emails (feedback_overlap_joels_list_wins).
//
// Cloned from api/annie-masterclass-broadcast.js, byte for byte below the
// EMAILS block. Only the constants and the copy changed.
//
// Scheduled: 2026-10-05 08:00 America/New_York = 12:00 UTC.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { escapeHtml } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { neverSendGuard } from './_never_send.js';

// ARMED 2026-10-05 on Joel's go after he read both dry runs.
// Guard compares this to today's date in America/Chicago. Fires at
// 12:00 UTC = 08:00 America/New_York = 07:00 America/Chicago, so the
// date matches on every window in vercel.json and on no other day.
// Per-email fire dates, America/Chicago. Option 1 schedule Joel
// approved 2026-10-06: Fri 10-09 and Sat 10-10 are rest days, and
// Day 6 + Day 7 both land on class day 10-12.

const FIRE_DATES = {"1": "2026-10-21"};
const CRON_FIRE_DATE = '2026-10-21';
const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'annie@restoreherhormones.com';
const REGISTER_URL = 'https://restoreherhormones.com/masterclass';
const UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const RATE_LIMIT_MS = 90; // matches the local script's pace (0 failures on 8.5k); Resend latency adds ~100ms per send
const MAX_RUN_MS = 250 * 1000;
const SEGMENT_KEY = 'rhhmc:segment';
const SENT_SET_PREFIX = 'annieglow:sent:';

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
  return `https://restoreherhormones.com/api/unsubscribe?email=${encodeURIComponent(email)}`;
}

const DISCLAIMER_HTML = (email) => `
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
  Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.<br/>
  It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC &middot; 240 W Dixie Ave Ste 5 &middot; Elizabethtown, KY 42701<br/>
  <a href="${unsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a>
</p>`;

const DISCLAIMER_TEXT = (email) => `---
Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.
It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC · 240 W Dixie Ave Ste 5 · Elizabethtown, KY 42701

Unsubscribe: ${unsubUrl(email)}`;

function wrapHtml(bodyHtml, email, preheader) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f4f1;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.06);"><tr><td style="padding:30px 28px;font-size:16px;line-height:1.65;color:#222;">
${bodyHtml}
${DISCLAIMER_HTML(email)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const BTN = (label) => `<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:#ecd88d;color:#1f1a16;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">${label} &rarr;</a></p>`;

const EMAILS = {
  1: {
    subject: () => "I got an email in the dead of the night",
    preheader: "She looked at something she had been avoiding.",
    html: (name, email) => wrapHtml(`<p>Hey \${escapeHtml(name)},</p><p><strong>I got an email in the dead of the night.</strong></p><p>My husband showed it to me at 4:03 AM</p><p>He had already responded to it...</p><p>Here's the backstory.</p><p>We had just finished Day 1 of our live Change My Life Challenge.</p><p>And later that night, a woman wrote to us flustered</p><p>She was in angst because an exercise we had done in class plus the homework had made her stop and look at things she hadn't really wanted to face.</p><p>Not another diet.</p><p>Not another workout.</p><p>Not another long list of things to do.</p><p>Just a simple exercise that is designed to help women find the stuck points that have been keeping them stuck.</p><p>And THAT was the hard part. because sometimes seeing the boulders that seem to have us trapped can be difficult.</p><p>Can I be honest?</p><p>Recently Joel and I joined a coaching group for 23,000 for the year because hey...even coaches need coaches</p><p>At some point I thought... have we made a mistake?</p><p>there's nothing tangible in the coaching... it's not like how we coach women to get rid of blood pressure and as a side effect they drop diabetes, lose weight, balance hormones and more...</p><p>Research says when a woman gets her blood pressure under control it can add and average of 5 great years to her life... that's priceless!</p><p>But the truth is investing in myself at that high level made me feel kinda like that woman who wrote the email. Really flustered to finally see the reality of <strong>everything</strong> that needs to be worked on</p><p>Maybe you feel overwhelmed.</p><p>Holidays are coming</p><p><em>Life is happening.</em></p><p>Everybody needs something.</p><p>You are tired.</p><p>And before you know it, you're making that same promise to yourself all over again.</p><p>"I'll face it all after this season is over"</p><p>But what if the answer isn't simply trying harder?</p><p><strong>What if part of moving forward is finally understanding what's been holding you back?</strong></p><p>Maybe your hair, your skin, your weight, or your sleep changed too.</p><p>But none of those changes means your story is over.</p><p>You still have a whole life to live.</p><p>And I want you to think about something tonight.</p><p><strong>If you could feel different in just ONE area of your life before this year ends, what would it be?</strong></p><p>Because the girl in you still has dreams, plans, and a whole lot of living to do.</p><p>Please do me a favor and something nice for you today...</p><p>...Love the Girl You're In. She's worth it.</p><p>I'm cheering for you!</p><p>Everyday Nurse Annie</p><p>P.S. Sometimes the biggest change begins with one question you finally give yourself permission to answer.</p>`, email, "She looked at something she had been avoiding."),
    text: (name, email) => `Hey \${name},

I got an email in the dead of the night.

My husband showed it to me at 4:03 AM

He had already responded to it...

Here's the backstory.

We had just finished Day 1 of our live Change My Life Challenge.

And later that night, a woman wrote to us flustered

She was in angst because an exercise we had done in class plus the homework had made her stop and look at things she hadn't really wanted to face.

Not another diet.

Not another workout.

Not another long list of things to do.

Just a simple exercise that is designed to help women find the stuck points that have been keeping them stuck.

And THAT was the hard part. because sometimes seeing the boulders that seem to have us trapped can be difficult.

Can I be honest?

Recently Joel and I joined a coaching group for 23,000 for the year because hey...even coaches need coaches

At some point I thought... have we made a mistake?

there's nothing tangible in the coaching... it's not like how we coach women to get rid of blood pressure and as a side effect they drop diabetes, lose weight, balance hormones and more...

Research says when a woman gets her blood pressure under control it can add and average of 5 great years to her life... that's priceless!

But the truth is investing in myself at that high level made me feel kinda like that woman who wrote the email. Really flustered to finally see the reality of everything that needs to be worked on

Maybe you feel overwhelmed.

Holidays are coming

Life is happening.

Everybody needs something.

You are tired.

And before you know it, you're making that same promise to yourself all over again.

"I'll face it all after this season is over"

But what if the answer isn't simply trying harder?

What if part of moving forward is finally understanding what's been holding you back?

Maybe your hair, your skin, your weight, or your sleep changed too.

But none of those changes means your story is over.

You still have a whole life to live.

And I want you to think about something tonight.

If you could feel different in just ONE area of your life before this year ends, what would it be?

Because the girl in you still has dreams, plans, and a whole lot of living to do.

Please do me a favor and something nice for you today...

...Love the Girl You're In. She's worth it.

I'm cheering for you!

Everyday Nurse Annie

P.S. Sometimes the biggest change begins with one question you finally give yourself permission to answer.

${DISCLAIMER_TEXT(email)}`,
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

async function loadUnsubSet() {
  const resend = getResend();
  const set = new Set();
  let after;
  for (;;) {
    const { data, error } = await resend.contacts.list({ audienceId: UNSUB_AUDIENCE_ID, limit: 100, ...(after ? { after } : {}) });
    if (error) throw new Error('suppression list unavailable: ' + error.message);
    const items = data?.data || [];
    for (const c of items) set.add(String(c.email).toLowerCase());
    if (!data?.has_more || items.length === 0) break;
    after = items[items.length - 1].id;
  }
  return set;
}

function todayChicago() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
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
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![1].includes(emailNum)) return res.status(400).json({ error: 'pass ?email=1' });
  const template = EMAILS[emailNum];
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
  if (cronMode && todayChicago() !== fireDate) {
    return res.status(200).json({ ok: true, skipped: 'cron date guard', today: todayChicago(), fireDate, emailNum });
  }
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-LAUNCH-${emailNum}`;
  const sendMode = cronMode || manualSend;

  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const encoreSkip = await challengeBuyers();
  const segment = (await kv.hgetall(SEGMENT_KEY)) || {};
  const emails = Object.keys(segment);
  if (emails.length === 0) return res.status(500).json({ error: 'segment empty — run scripts/load-annie-masterclass-segment-2026-09-14.mjs' });

  let unsub;
  try { unsub = await loadUnsubSet(); }
  catch (err) { return res.status(500).json({ error: err.message }); } // never send without the suppression list

  // Never-send guard (2026-10-07): Accelerator roster + bwbp:allin:* + Stripe
  // coaching payers + bwbp:neversend + Resend unsubscribes, built fresh per run.
  // Fails closed: if the list cannot be built, nothing sends.
  let guard;
  try { guard = await neverSendGuard(); }
  catch (err) { return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message }); }

  const alreadySentList = await kv.smembers(SENT_SET);
  const alreadySent = new Set((alreadySentList || []).map((e) => String(e).toLowerCase()));

  const stats = { segment: emails.length, unsub: 0, neverSend: 0, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;

  for (const email of emails) {
    if (unsub.has(email)) { stats.unsub++; continue; }
    if (guard.blocks(email)) { stats.neverSend++; continue; }
    if (alreadySent.has(email)) { stats.alreadySent++; continue; }
    if (coachingClients.has(String(email).trim().toLowerCase())) { stats.coachingClient = (stats.coachingClient || 0) + 1; continue; }
    if (encoreSkip.has(String(email).trim().toLowerCase())) { stats.encoreSkip = (stats.encoreSkip || 0) + 1; continue; }
    stats.eligible++;
    const name = tidyName(segment[email]);
    const subject = template.subject(name);

    if (!sendMode) {
      if (samples.length < 3) samples.push({ email, firstName: segment[email] || null, subject, text: template.text(name, email) });
      continue;
    }
    if (Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }
    try {
      await resend.emails.send({
        from: FROM, to: email, replyTo: REPLY_TO, subject,
        html: template.html(name, email), text: template.text(name, email),
        headers: { 'List-Unsubscribe': `<${unsubUrl(email)}>` },
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, email); } catch (err) { console.warn('annie-mc: sadd failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log('[annie-masterclass-broadcast]', JSON.stringify({ emailNum, mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN', stats, results: sendMode ? results : undefined }));
  return res.status(200).json({
    ok: true, emailNum,
    mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN',
    from: FROM, stats,
    ...guard.report(),
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
