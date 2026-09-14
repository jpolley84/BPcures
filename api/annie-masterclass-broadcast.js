// api/annie-masterclass-broadcast.js — Annie's 3-email invite sequence for
// the joint "4 Biggest Mistakes" masterclass, hosted on bpquiz's Vercel
// project because restoreherhormones has no KV and this one Resend account
// already sends from Annie's verified domain.
//
// Audience: KV hash `rhhmc:segment` {email: firstName} — Annie's ClickFunnels
// export filtered to LTV < $297 minus anyone also on Joel's list (standing
// rule: Joel's list wins on overlap). Loaded by
// scripts/load-annie-masterclass-segment-2026-09-14.mjs. Suppression: every
// contact in Resend audience RESEND_RHH_UNSUB_AUDIENCE_ID (fed by
// restoreherhormones.com/api/unsubscribe) is skipped.
//
// SAFETY MODEL (per /send-campaign):
//   - Default is DRY-RUN.
//   - Manual send: ?mode=send&email=N + header x-confirm: SEND-MASTERCLASS-N.
//   - Cron send: ?cron=1&email=N, Vercel-cron authorized, AND today in
//     America/Chicago === CRON_FIRE_DATE. Any other day the cron is a no-op,
//     so the vercel.json entries self-disarm after class day.
//   - Resume-safe: KV set rhhmc:sent:<N> — every fire skips already-sent.

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { escapeHtml } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

const CRON_FIRE_DATE = '2026-09-14';
const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'annie@restoreherhormones.com';
const REGISTER_URL = 'https://restoreherhormones.com/masterclass';
const UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const RATE_LIMIT_MS = 150; // slower than Joel's endpoint: both may run in the same cron window
const MAX_RUN_MS = 250 * 1000;
const SEGMENT_KEY = 'rhhmc:segment';
const SENT_SET_PREFIX = 'rhhmc:sent:';

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
    subject: () => 'Girl, I’m doing a pop-up masterclass today',
    preheader: "It's not genetics. It's not JUST aging.",
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>You know that feeling when you look at your body and think...</p>
<p><strong>"What in the world is happening to me?"</strong></p>
<p>The fatigue.<br>The weight that won't move.<br>The chin hair.<br>The thinning hair.<br>The brain fog.</p>
<p>Then maybe your blood pressure starts creeping up.<br>Your A1C starts moving in the wrong direction.</p>
<p>Girl...</p>
<p><strong>What if these are not a bunch of random problems?</strong></p>
<p>What if your symptoms and your numbers are telling <strong>one connected story?</strong></p>
<p>Today at <strong>6 PM Central</strong>, Joel and I are doing a special pop-up masterclass:</p>
<p><strong>THE 4 BIGGEST MISTAKES MAKING YOUR FATIGUE, BLOOD PRESSURE, WEIGHT, A1C, CHIN HAIR &amp; OTHER HORMONE SYMPTOMS WORSE AFTER 40</strong></p>
<p>And here's the hint...</p>
<p><strong>It's not eating better, exercising more, taking supplements, or having more discipline.</strong></p>
<p>Because I KNOW you've tried.</p>
<p>The diets.<br>The supplements.<br>The videos.<br>The doctors.<br>The promise that THIS Monday you're going to get serious.</p>
<p>And somehow...<br><strong>it just keeps getting worse.</strong></p>
<p>Today we're going to help you connect some dots.</p>
<p><strong>Two nurses. One masterclass.<br>Your symptoms. Your numbers. One connected story.</strong></p>
<p>It's free, but you need to register here:</p>
${BTN('REGISTER HERE')}
<p>Come as you are, girl.</p>
<p>I think some things are finally going to make sense.</p>
<p>Everyday Nurse Annie</p>
<p>P.S. Don't forget to Love The Girl You're In.</p>
<p>P.P.S. Joel is bringing the blood pressure and numbers side. I'm bringing the hormone side. And yes girl... he is also my husband 😂. Pray for us. We're both going to have microphones.</p>`, email, "It's not genetics. It's not JUST aging."),
    text: (name, email) => `${name},

You know that feeling when you look at your body and think...

"What in the world is happening to me?"

The fatigue. The weight that won't move. The chin hair. The thinning hair. The brain fog.

Then maybe your blood pressure starts creeping up. Your A1C starts moving in the wrong direction.

Girl... What if these are not a bunch of random problems? What if your symptoms and your numbers are telling one connected story?

Today at 6 PM Central, Joel and I are doing a special pop-up masterclass:

THE 4 BIGGEST MISTAKES MAKING YOUR FATIGUE, BLOOD PRESSURE, WEIGHT, A1C, CHIN HAIR & OTHER HORMONE SYMPTOMS WORSE AFTER 40

And here's the hint... It's not eating better, exercising more, taking supplements, or having more discipline.

Because I KNOW you've tried. The diets. The supplements. The videos. The doctors. The promise that THIS Monday you're going to get serious.

And somehow... it just keeps getting worse.

Today we're going to help you connect some dots.

Two nurses. One masterclass. Your symptoms. Your numbers. One connected story.

It's free, but you need to register here: ${REGISTER_URL}

Come as you are, girl. I think some things are finally going to make sense.

Everyday Nurse Annie

P.S. Don't forget to Love The Girl You're In.
P.P.S. Joel is bringing the blood pressure and numbers side. I'm bringing the hormone side. And yes girl... he is also my husband. Pray for us. We're both going to have microphones.
${DISCLAIMER_TEXT(email)}`,
  },
  2: {
    subject: (name) => `${name}, do you ever look in the mirror and think... what happened?`,
    preheader: 'We go live at 6 PM Central.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>I remember being in that place.</p>
<p>You see another woman who looks put together. She has energy. Her clothes seem to fit. She looks confident.</p>
<p>And then you go home, stand in front of your closet, try on shirt after shirt and finally grab the one that hides your belly.</p>
<p>Later, when nobody is watching, you look a little harder in the bathroom mirror.</p>
<p>The chin hair. The changing face. The tired eyes.</p>
<p>And somewhere inside you're thinking...</p>
<p><strong>"When did I stop looking like ME?"</strong></p>
<p>Girl, I know that feeling.</p>
<p>And what made it worse was believing this was just what happened to women. You get older. Your hormones change. Your weight changes. Your numbers start changing. And you're supposed to just accept it.</p>
<p><strong>No.</strong></p>
<p>That is exactly why Joel and I are having this conversation tonight.</p>
<p>Because your chin hair may not just be about chin hair. Your fatigue may not just be about sleep. Your blood pressure may not just be about salt. Your weight may not just be about food.</p>
<p><strong>ONE BODY. MANY SIGNALS.</strong></p>
<p>Tonight we're showing you the <strong>4 biggest mistakes</strong> women over 40 are making while trying to get their health back.</p>
<p>And one of the biggest mistakes is treating every symptom like it is a completely separate problem.</p>
<p>We go live at <strong>6 PM Central / 7 PM Eastern.</strong></p>
<p>Here is your link:</p>
${BTN('JOIN THE LIVE MASTERCLASS')}
<p>Come a few minutes early. Bring a notebook. And girl, come ready to connect some dots.</p>
<p>Everyday Nurse Annie</p>
<p>P.S. Don't forget to Love The Girl You're In.</p>
<p>P.P.S. If you've ever thought, <strong>"My tests say normal, but I do NOT feel normal,"</strong> you especially need to be in this room.</p>`, email, 'We go live at 6 PM Central.'),
    text: (name, email) => `${name},

I remember being in that place.

You see another woman who looks put together. She has energy. Her clothes seem to fit. She looks confident.

And then you go home, stand in front of your closet, try on shirt after shirt and finally grab the one that hides your belly.

Later, when nobody is watching, you look a little harder in the bathroom mirror. The chin hair. The changing face. The tired eyes.

And somewhere inside you're thinking... "When did I stop looking like ME?"

Girl, I know that feeling. And what made it worse was believing this was just what happened to women. You get older. Your hormones change. Your weight changes. Your numbers start changing. And you're supposed to just accept it.

No. That is exactly why Joel and I are having this conversation tonight.

Because your chin hair may not just be about chin hair. Your fatigue may not just be about sleep. Your blood pressure may not just be about salt. Your weight may not just be about food.

ONE BODY. MANY SIGNALS.

Tonight we're showing you the 4 biggest mistakes women over 40 are making while trying to get their health back. And one of the biggest mistakes is treating every symptom like it is a completely separate problem.

We go live at 6 PM Central / 7 PM Eastern. Here is your link: ${REGISTER_URL}

Come a few minutes early. Bring a notebook. And girl, come ready to connect some dots.

Everyday Nurse Annie

P.S. Don't forget to Love The Girl You're In.
P.P.S. If you've ever thought, "My tests say normal, but I do NOT feel normal," you especially need to be in this room.
${DISCLAIMER_TEXT(email)}`,
  },
  3: {
    subject: (name) => `${name}, WE ARE LIVE. Are you coming?`,
    preheader: 'Join us right now.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>Girl...</p>
<p><strong>WE ARE LIVE.</strong></p>
<p>Joel and I just started.</p>
<p>If your fatigue, weight, blood pressure, A1C, chin hair or hormone symptoms have been getting worse after 40...</p>
<p>come get in this room.</p>
<p>We're exposing the <strong>4 biggest mistakes</strong> right now.</p>
${BTN('JOIN US LIVE')}
<p>Come on. We're waiting on you. ❤️</p>
<p>Everyday Nurse Annie</p>
<p>P.S. Don't forget to Love The Girl You're In.</p>`, email, 'Join us right now.'),
    text: (name, email) => `${name},

Girl... WE ARE LIVE.

Joel and I just started.

If your fatigue, weight, blood pressure, A1C, chin hair or hormone symptoms have been getting worse after 40... come get in this room.

We're exposing the 4 biggest mistakes right now.

JOIN US LIVE: ${REGISTER_URL}

Come on. We're waiting on you.

Everyday Nurse Annie

P.S. Don't forget to Love The Girl You're In.
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

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![1, 2, 3].includes(emailNum)) return res.status(400).json({ error: 'pass ?email=1, 2, or 3' });
  const template = EMAILS[emailNum];
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  if (cronMode && todayChicago() !== CRON_FIRE_DATE) {
    return res.status(200).json({ ok: true, skipped: 'cron date guard', today: todayChicago(), fireDate: CRON_FIRE_DATE });
  }
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-MASTERCLASS-${emailNum}`;
  const sendMode = cronMode || manualSend;

  const startedAt = Date.now();
  const segment = (await kv.hgetall(SEGMENT_KEY)) || {};
  const emails = Object.keys(segment);
  if (emails.length === 0) return res.status(500).json({ error: 'segment empty — run scripts/load-annie-masterclass-segment-2026-09-14.mjs' });

  let unsub;
  try { unsub = await loadUnsubSet(); }
  catch (err) { return res.status(500).json({ error: err.message }); } // never send without the suppression list

  const alreadySentList = await kv.smembers(SENT_SET);
  const alreadySent = new Set((alreadySentList || []).map((e) => String(e).toLowerCase()));

  const stats = { segment: emails.length, unsub: 0, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;

  for (const email of emails) {
    if (unsub.has(email)) { stats.unsub++; continue; }
    if (alreadySent.has(email)) { stats.alreadySent++; continue; }
    stats.eligible++;
    const name = (segment[email] || '').trim() || 'there';
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
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
