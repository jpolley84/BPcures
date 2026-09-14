// api/joel-masterclass-broadcast.js — 3-email invite sequence for the joint
// "4 Biggest Mistakes" masterclass (Joel's side).
//
// Audience: Joel's full active list — same drip:* + bwbp:drip:* pool used
// by api/restoreher-replay-broadcast.js for the prior Annie-intro blast —
// EXCLUDING current coaching clients (state === 'tier-4', per
// api/stripe-webhook.js's purchaseToState mapping) and anyone
// unsubscribed/paused.
//
// CTA points at /masterclass/v3/ directly (NOT the bare /masterclass A/B
// entry point) so every email reader lands on copy that matches what they
// just read, instead of a 50/50 chance of the "Life Beyond the Numbers"
// control page.
//
// SAFETY MODEL (per /send-campaign):
//   - Default mode is DRY-RUN: scans, counts eligibles, renders samples,
//     sends NOTHING.
//   - Real fire requires ?mode=send&email=<1|2|3> AND header
//     `x-confirm: SEND-MASTERCLASS-<N>` matching the email number.
//   - Per-record flag makes re-fires resume-safe (Vercel 300s cap).
//
// Dry-run:
//   curl -s "https://bpquiz.com/api/joel-masterclass-broadcast?email=1" \
//        -H "Authorization: Bearer $CRON_SECRET"
// Send:
//   curl -s -X POST "https://bpquiz.com/api/joel-masterclass-broadcast?mode=send&email=1" \
//        -H "Authorization: Bearer $CRON_SECRET" -H "x-confirm: SEND-MASTERCLASS-1"

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

const REGISTER_URL = 'https://bpquiz.com/masterclass/v3/';
const RATE_LIMIT_MS = 70;
const MAX_RUN_MS = 250 * 1000;
const SENT_FLAG_PREFIX = 'joelMcInvite'; // + emailNum, e.g. joelMcInvite1Sent
const SENT_SET_PREFIX = 'joelmcblast:sent-emails:'; // + emailNum

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
    subject: 'Your numbers may not be the whole problem',
    preheader: 'Free pop-up masterclass today at 6 PM Central.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>If your blood pressure is creeping up...</p>
<p>Your A1C is moving the wrong way...</p>
<p>Your weight is getting harder to control...</p>
<p>And your energy is getting worse...</p>
<p>there is a good chance you have been told to do the usual things.</p>
<p>Eat better.<br>Exercise more.<br>Lose weight.<br>Take your medication.<br>Manage your stress.</p>
<p>And maybe you've done all of that.</p>
<p>But the numbers still are not where you want them.</p>
<p>That is why today at <strong>6 PM Central</strong>, Annie and I are doing a special pop-up masterclass:</p>
<p><strong>THE 4 BIGGEST MISTAKES MAKING YOUR FATIGUE, BLOOD PRESSURE, WEIGHT, A1C, CHIN HAIR &amp; OTHER HORMONE SYMPTOMS WORSE AFTER 40</strong></p>
<p>And here is the hint...</p>
<p><strong>It is not eating better, exercising more, taking supplements, or having more discipline.</strong></p>
<p>Because sometimes the problem is not that you are doing nothing.</p>
<p>Sometimes you are doing a lot...<br><strong>but you are focused on the wrong things.</strong></p>
<p>Today we are going to help you connect the numbers with the symptoms.</p>
<p><strong>Two nurses. One masterclass.<br>Your numbers. Your symptoms. One connected story.</strong></p>
<p>I'll bring the blood pressure and numbers side.</p>
<p>Annie will bring the hormone side.</p>
<p>And together, we're going to show you what may have been getting missed.</p>
<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:#C9A85C;color:#10312A;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">REGISTER HERE &rarr;</a></p>
<p>Come live if you can.</p>
<p>Joel Polley, RN<br>BraveWorks RN</p>
<p>P.S. Annie is also my wife. So yes, we talk about blood pressure and hormones at home too. 😂</p>`, 'Free pop-up masterclass today at 6 PM Central.', email),
    text: (name, email) => `${name},

If your blood pressure is creeping up... Your A1C is moving the wrong way... Your weight is getting harder to control... And your energy is getting worse... there is a good chance you have been told to do the usual things.

Eat better. Exercise more. Lose weight. Take your medication. Manage your stress.

And maybe you've done all of that. But the numbers still are not where you want them.

That is why today at 6 PM Central, Annie and I are doing a special pop-up masterclass:

THE 4 BIGGEST MISTAKES MAKING YOUR FATIGUE, BLOOD PRESSURE, WEIGHT, A1C, CHIN HAIR & OTHER HORMONE SYMPTOMS WORSE AFTER 40

And here is the hint... It is not eating better, exercising more, taking supplements, or having more discipline.

Because sometimes the problem is not that you are doing nothing. Sometimes you are doing a lot... but you are focused on the wrong things.

Today we are going to help you connect the numbers with the symptoms.

Two nurses. One masterclass. Your numbers. Your symptoms. One connected story.

I'll bring the blood pressure and numbers side. Annie will bring the hormone side. And together, we're going to show you what may have been getting missed.

REGISTER HERE: ${REGISTER_URL}

Come live if you can.

Joel Polley, RN
BraveWorks RN

P.S. Annie is also my wife. So yes, we talk about blood pressure and hormones at home too.
${disclaimerText(email)}`,
  },
  2: {
    subject: (name) => `${name}, the cuff may only be showing you the symptom`,
    preheader: 'We go live at 6 PM Central.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>One of the biggest mistakes I see people make with blood pressure is this:</p>
<p>They start believing the number <strong>is</strong> the problem.</p>
<p>So every decision becomes about the cuff.</p>
<p>Less salt.<br>More pills.<br>More worry.<br>Check it again.<br>Check it again.<br>Check it again.</p>
<p>But here is the question I want you to ask:</p>
<p><strong>What is driving the number?</strong></p>
<p>Because the cuff can tell you something is happening. It does not always tell you <strong>why</strong>.</p>
<p>And for women over 40, that matters.</p>
<p>Because the woman dealing with rising blood pressure may also be dealing with fatigue, stubborn weight, sleep problems, blood sugar changes, mood changes, chin hair, hot flashes or brain fog.</p>
<p>That is why I asked Annie to join me tonight.</p>
<p>Hormones are her world. Blood pressure and numbers are mine.</p>
<p>And if we only talk about one side, we may miss the bigger story.</p>
<p><strong>ONE BODY. MANY SIGNALS.</strong></p>
<p>Tonight at <strong>6 PM Central / 7 PM Eastern</strong>, we're breaking down the <strong>4 biggest mistakes</strong> people make when their symptoms and their numbers start moving in the wrong direction.</p>
<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:#C9A85C;color:#10312A;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">JOIN THE LIVE MASTERCLASS &rarr;</a></p>
<p>Come a few minutes early. Bring your questions.</p>
<p>Joel Polley, RN<br>BraveWorks RN</p>
<p>P.S. If you have ever thought, <strong>"Why are my numbers changing when I'm already doing the right things?"</strong> this is the room to be in.</p>`, 'We go live at 6 PM Central.', email),
    text: (name, email) => `${name},

One of the biggest mistakes I see people make with blood pressure is this: they start believing the number IS the problem.

So every decision becomes about the cuff. Less salt. More pills. More worry. Check it again. Check it again. Check it again.

But here is the question I want you to ask: what is driving the number?

Because the cuff can tell you something is happening. It does not always tell you why.

And for women over 40, that matters. Because the woman dealing with rising blood pressure may also be dealing with fatigue, stubborn weight, sleep problems, blood sugar changes, mood changes, chin hair, hot flashes or brain fog.

That is why I asked Annie to join me tonight. Hormones are her world. Blood pressure and numbers are mine. And if we only talk about one side, we may miss the bigger story.

ONE BODY. MANY SIGNALS.

Tonight at 6 PM Central / 7 PM Eastern, we're breaking down the 4 biggest mistakes people make when their symptoms and their numbers start moving in the wrong direction.

JOIN THE LIVE MASTERCLASS: ${REGISTER_URL}

Come a few minutes early. Bring your questions.

Joel Polley, RN
BraveWorks RN

P.S. If you have ever thought, "Why are my numbers changing when I'm already doing the right things?" this is the room to be in.
${disclaimerText(email)}`,
  },
  3: {
    subject: (name) => `${name}, WE ARE LIVE. Are you coming?`,
    preheader: 'Join us right now.',
    html: (name, email) => wrapHtml(`
<p>${escapeHtml(name)},</p>
<p>We are live.</p>
<p>Annie and I just started.</p>
<p>If your blood pressure, A1C, weight, fatigue or hormone symptoms have been getting worse after 40...</p>
<p><strong>come get in the room.</strong></p>
<p>We're breaking down the <strong>4 biggest mistakes</strong> right now.</p>
<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:#C9A85C;color:#10312A;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">JOIN US LIVE &rarr;</a></p>
<p>See you inside.</p>
<p>Joel</p>`, 'Join us right now.', email),
    text: (name, email) => `${name},

We are live. Annie and I just started.

If your blood pressure, A1C, weight, fatigue or hormone symptoms have been getting worse after 40... come get in the room.

We're breaking down the 4 biggest mistakes right now.

JOIN US LIVE: ${REGISTER_URL}

See you inside.

Joel
${disclaimerText(email)}`,
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

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const emailNum = Number(req.query?.email);
  if (![1, 2, 3].includes(emailNum)) {
    return res.status(400).json({ error: 'pass ?email=1, 2, or 3' });
  }
  const template = EMAILS[emailNum];
  const SENT_FLAG = `${SENT_FLAG_PREFIX}${emailNum}Sent`;
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const sendMode =
    req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-MASTERCLASS-${emailNum}`;

  let allKeys = [];
  try {
    allKeys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  } catch (err) {
    return res.status(500).json({ error: 'kv scan failed', detail: err.message });
  }

  const startedAt = Date.now();
  const stats = { total: 0, eligible: 0, alreadySent: 0, unsub: 0, paused: 0, coachingClient: 0, noEmail: 0, duplicate: 0, invalidEmail: 0, dupSuppressed: 0 };
  const seen = new Set();
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const resend = sendMode ? getResend() : null;

  for (const k of allKeys) {
    stats.total++;
    if (sendMode && Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }

    let rec;
    try { rec = await kv.get(k); } catch { continue; }
    if (!rec || !rec.email) { stats.noEmail++; continue; }
    if (rec.unsubscribed) { stats.unsub++; continue; }
    if (rec.paused) { stats.paused++; continue; }
    if (rec.state === 'tier-4') { stats.coachingClient++; continue; } // current coaching clients — excluded per Joel

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
        const name = (rec.firstName || '').trim() || 'there';
        const subject = typeof template.subject === 'function' ? template.subject(name) : template.subject;
        samples.push({ email: rec.email, firstName: rec.firstName || null, subject, text: template.text(name, rec.email) });
      }
      continue;
    }

    const name = (rec.firstName || '').trim() || 'there';
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

  return res.status(200).json({
    ok: true,
    emailNum,
    mode: sendMode ? 'SEND' : 'DRY-RUN',
    from: FROM,
    stats,
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
