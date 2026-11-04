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

const FIRE_DATES = { '1': '2026-10-19', '2': '2026-10-19', '3': '2026-10-19' };
const CRON_FIRE_DATE = '2026-10-19';
const RATE_LIMIT_MS = 70;
const MAX_RUN_MS = 250 * 1000;
const SENT_FLAG_PREFIX = 'joelLaunchOct19'; // + emailNum, e.g. joelMcInvite1Sent
const SENT_SET_PREFIX = 'joellaunch:sent:'; // + emailNum

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
    subject: "There are only 73 days left in 2026",
    preheader: "We have no next challenge date on the calendar.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p>Annie here.</p><p>You know what I was thinking about this morning?</p><p><strong>There are only 73 days left in 2026.</strong></p><p>Girl, where did this year GO?!</p><p>And I have something important to tell you.</p><p><strong>We honestly don't know when we'll be able to host another LIVE Change My Life Challenge.</strong></p><p>November is already packed. The holidays are coming. And we have NOT scheduled another one.</p><p>That's why I don't want you to miss this.</p><p>I remember a time when all I wanted was to fit back into THAT dress.</p><p>And after trying and struggling, I started wondering whether the changes I wanted were even possible for ME anymore.</p><p>Maybe you've had those moments too.</p><p>When the mirror doesn't quite look like you.</p><p>When the energy is gone before the day even starts.</p><p>When getting dressed isn't as fun as it used to be.</p><p>But here's what I want you to picture...</p><p><strong>December 31, 2026.</strong></p><p>Imagine standing in front of that mirror with a different kind of confidence.</p><p>Not because everything is perfect.</p><p>But because for the last ten weeks, you've been showing up for YOURSELF.</p><p>Learning your body.</p><p>Understanding your blood pressure.</p><p>Making little changes that actually fit your life.</p><p>And finally keeping some of the promises you've made to YOU.</p><p>Girl, can you imagine how GOOD that would feel?!</p><p><strong>Well, tonight is your opportunity to get started.</strong></p><p>Our <strong>5-Day Change My Life Challenge</strong> begins at 7 PM Eastern, 6 PM Central!</p><p>Joel and I will help you start making sense of your health and build a personal plan for your next 90 days.</p><p>Five LIVE days. Two nurses. Real guidance.</p><p>And your seat is just <strong>$97</strong>.</p><p style="margin:26px 0;"><a href="https://changemylifechallenge.com/" style="display:inline-block;background:#B85A36;color:#FFFFFF;text-decoration:none;font-weight:800;padding:16px 28px;border-radius:9px;">CLICK HERE TO GET YOUR SEAT BEFORE WE START TONIGHT &rarr;</a></p><p>Sis, you're allowed to feel beautiful.</p><p>You're allowed to feel strong.</p><p>You're allowed to enjoy the woman looking back at you in the mirror.</p><p>And you're certainly worth the time it takes to care for her.</p><p><strong>We can't promise we'll have another opportunity like this before the year ends.</strong></p><p>But we can tell you this one starts TONIGHT.</p><p>I'm cheering for you, sis!</p><p>Annie Chitate &amp; Joel<br>Everyday Nurse</p><p>P.S. Remember to Love The Girl You're In. And don't miss your opportunity to invest in HER.</p>`, "We have no next challenge date on the calendar.", email),
    text: (name, email) => `Hey ${name},

Annie here.

You know what I was thinking about this morning?

There are only 73 days left in 2026.

Girl, where did this year GO?!

And I have something important to tell you.

We honestly don't know when we'll be able to host another LIVE Change My Life Challenge.

November is already packed. The holidays are coming. And we have NOT scheduled another one.

That's why I don't want you to miss this.

I remember a time when all I wanted was to fit back into THAT dress.

And after trying and struggling, I started wondering whether the changes I wanted were even possible for ME anymore.

Maybe you've had those moments too.

When the mirror doesn't quite look like you.

When the energy is gone before the day even starts.

When getting dressed isn't as fun as it used to be.

But here's what I want you to picture...

December 31, 2026.

Imagine standing in front of that mirror with a different kind of confidence.

Not because everything is perfect.

But because for the last ten weeks, you've been showing up for YOURSELF.

Learning your body.

Understanding your blood pressure.

Making little changes that actually fit your life.

And finally keeping some of the promises you've made to YOU.

Girl, can you imagine how GOOD that would feel?!

Well, tonight is your opportunity to get started.

Our 5-Day Change My Life Challenge begins at 7 PM Eastern, 6 PM Central!

Joel and I will help you start making sense of your health and build a personal plan for your next 90 days.

Five LIVE days. Two nurses. Real guidance.

And your seat is just $97.

CLICK HERE TO GET YOUR SEAT BEFORE WE START TONIGHT:
https://changemylifechallenge.com/

Sis, you're allowed to feel beautiful.

You're allowed to feel strong.

You're allowed to enjoy the woman looking back at you in the mirror.

And you're certainly worth the time it takes to care for her.

We can't promise we'll have another opportunity like this before the year ends.

But we can tell you this one starts TONIGHT.

I'm cheering for you, sis!

Annie Chitate & Joel
Everyday Nurse

P.S. Remember to Love The Girl You're In. And don't miss your opportunity to invest in HER.

${disclaimerText(email)}`,
  },
  2: {
    subject: "January 1, 2027 is coming. Ready or not.",
    preheader: "Just over a dollar a day for your 90-day plan.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p><strong>January 1, 2027, is coming.</strong></p><p>Ready or not.</p><p>And when it arrives, I want you to have something to celebrate beyond the New Year.</p><p>You have new habits.</p><p>Your blood pressure numbers are starting to make sense.</p><p>You understand more about why your body has been changing.</p><p>BEST OF ALL? You've discovered that taking care of yourself doesn't have to take over your whole day.</p><p>And maybe, just maybe...</p><p><strong>You're proud of yourself again.</strong></p><p>Because that's worth something, isn't it?</p><p>That's worth smiling about.</p><p>But there's something else you need to know.</p><p><strong>This could be our last LIVE Change My Life Challenge of 2026.</strong></p><p>November is packed. December is filling up. And Joel and I have no idea when we'll be able to bring everyone together like this again.</p><p>We've seen what can happen when women finally stop guessing and start taking action.</p><p>And we'd LOVE for you to experience that.</p><p>But we can't promise another date.</p><p><strong>Tonight, the doors to this experience are OPEN.</strong></p><p>For $97, you'll get five LIVE days with us, practical steps to begin improving your daily habits, help understanding your numbers, and guidance for building your personal 90-day health plan.</p><p>$97. That's just over a dollar a day for the 90-day plan you will build.</p><p><strong>It's where you learn how to BEGIN.</strong></p><p>Girl, listen.</p><p>We spend so much of our lives making sure everybody else has what they need.</p><p>And somehow, taking care of our own health becomes the thing we keep postponing.</p><p><strong>But you are somebody worth taking care of, too.</strong></p><p>And with 73 days left this year, there's still a lot of living to do.</p><p style="margin:26px 0;"><a href="https://changemylifechallenge.com/" style="display:inline-block;background:#B85A36;color:#FFFFFF;text-decoration:none;font-weight:800;padding:16px 28px;border-radius:9px;">YES, I'M WORTH IT. REGISTER ME FOR $97 &rarr;</a></p><p>We begin at <strong>7 PM Eastern, 6 PM Central TONIGHT.</strong></p><p>You can't buy back yesterday.</p><p>But you've got a say in what happens next.</p><p>See you tonight,</p><p>Annie &amp; Joel<br>Everyday Nurse</p><p>P.S. We have no next challenge date to give you. If you've been waiting for the right time, please don't assume you'll have another chance next month.</p>`, "Just over a dollar a day for your 90-day plan.", email),
    text: (name, email) => `Hey ${name},

January 1, 2027, is coming.

Ready or not.

And when it arrives, I want you to have something to celebrate beyond the New Year.

You have new habits.

Your blood pressure numbers are starting to make sense.

You understand more about why your body has been changing.

BEST OF ALL? You've discovered that taking care of yourself doesn't have to take over your whole day.

And maybe, just maybe...

You're proud of yourself again.

Because that's worth something, isn't it?

That's worth smiling about.

But there's something else you need to know.

This could be our last LIVE Change My Life Challenge of 2026.

November is packed. December is filling up. And Joel and I have no idea when we'll be able to bring everyone together like this again.

We've seen what can happen when women finally stop guessing and start taking action.

And we'd LOVE for you to experience that.

But we can't promise another date.

Tonight, the doors to this experience are OPEN.

For $97, you'll get five LIVE days with us, practical steps to begin improving your daily habits, help understanding your numbers, and guidance for building your personal 90-day health plan.

$97. That's just over a dollar a day for the 90-day plan you will build.

It's where you learn how to BEGIN.

Girl, listen.

We spend so much of our lives making sure everybody else has what they need.

And somehow, taking care of our own health becomes the thing we keep postponing.

But you are somebody worth taking care of, too.

And with 73 days left this year, there's still a lot of living to do.

YES, I'M WORTH IT. REGISTER ME FOR $97:
https://changemylifechallenge.com/

We begin at 7 PM Eastern, 6 PM Central TONIGHT.

You can't buy back yesterday.

But you've got a say in what happens next.

See you tonight,

Annie & Joel
Everyday Nurse

P.S. We have no next challenge date to give you. If you've been waiting for the right time, please don't assume you'll have another chance next month.

${disclaimerText(email)}`,
  },
  3: {
    subject: "We start tonight. 7 PM Eastern.",
    preheader: "Five live days start tonight at 7 PM Eastern, 6 PM Central.",
    html: (name, email) => wrapHtml(`<p>Hey ${escapeHtml(name)},</p><p><strong>WE START TONIGHT.</strong></p><p>Our 5-Day Change My Life Challenge begins at 7 PM Eastern, 6 PM Central.</p><p>And before we go live, there's something you NEED to know.</p><p><strong>WE HAVE NO IDEA WHEN THE NEXT CHALLENGE WILL BE.</strong></p><p>November is packed.</p><p>The holidays are coming.</p><p>And another LIVE challenge is NOT on our calendar.</p><p>So here's my one last question for you.</p><p><strong>What would it mean to finish 2026 knowing you finally started taking your health seriously?</strong></p><p>Not another promise to yourself.</p><p>Actual steps. Actual support. A personal plan.</p><p>There are 73 days left this year.</p><p>You can begin using them differently TONIGHT.</p><p>Five LIVE days with Annie and Joel.</p><p><strong>Registration: $97.</strong></p><p style="margin:26px 0;"><a href="https://changemylifechallenge.com/" style="display:inline-block;background:#B85A36;color:#FFFFFF;text-decoration:none;font-weight:800;padding:16px 28px;border-radius:9px;">CLICK HERE. GRAB YOUR SEAT. JOIN US TONIGHT. &rarr;</a></p><p>Girl, you've waited long enough.</p><p>We can't promise you another challenge.</p><p><strong>But we have a seat for you TONIGHT.</strong></p><p>Annie &amp; Joel</p><p>P.S. Click the link, register, check your confirmation email, and come join us tonight at 7 PM Eastern, 6 PM Central.</p>`, "Five live days start tonight at 7 PM Eastern, 6 PM Central.", email),
    text: (name, email) => `Hey ${name},

WE START TONIGHT.

Our 5-Day Change My Life Challenge begins at 7 PM Eastern, 6 PM Central.

And before we go live, there's something you NEED to know.

WE HAVE NO IDEA WHEN THE NEXT CHALLENGE WILL BE.

November is packed.

The holidays are coming.

And another LIVE challenge is NOT on our calendar.

So here's my one last question for you.

What would it mean to finish 2026 knowing you finally started taking your health seriously?

Not another promise to yourself.

Actual steps. Actual support. A personal plan.

There are 73 days left this year.

You can begin using them differently TONIGHT.

Five LIVE days with Annie and Joel.

Registration: $97.

CLICK HERE. GRAB YOUR SEAT. JOIN US TONIGHT.:
https://changemylifechallenge.com/

Girl, you've waited long enough.

We can't promise you another challenge.

But we have a seat for you TONIGHT.

Annie & Joel

P.S. Click the link, register, check your confirmation email, and come join us tonight at 7 PM Eastern, 6 PM Central.

${disclaimerText(email)}`,
  },
};let _resend = null;
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
  if (![1, 2, 3].includes(emailNum)) {
    return res.status(400).json({ error: 'pass ?email=1..3' });
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
