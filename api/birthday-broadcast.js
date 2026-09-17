// api/birthday-broadcast.js — invite sequence for Joel's birthday masterclass
// (Friday 2026-09-18, 11 AM CT, bpquiz.com/birthday), both lists (2026-09-17).
//
// ?list=joel   Joel's list: drip:* + bwbp:drip:*, minus unsubscribed, paused, and
//              current coaching clients (state tier-4). Same audience rules as
//              api/joel-masterclass-broadcast.js.
// ?list=annie  Annie's list: KV hash rhhmc:segment (her export minus Joel's list,
//              loaded 2026-09-14 by scripts/load-annie-masterclass-segment-2026-09-14.mjs),
//              minus Resend audience RESEND_RHH_UNSUB_AUDIENCE_ID. Same rules as
//              api/annie-masterclass-broadcast.js.
//
// SAFETY MODEL (per /send-campaign):
//   - Default is DRY-RUN: counts eligibles and returns 3 rendered samples. Sends nothing.
//   - Send requires ?mode=send&list=<joel|annie>&email=<N> AND header
//     `x-confirm: SEND-BIRTHDAY-<LIST>-<N>` (e.g. SEND-BIRTHDAY-JOEL-1).
//   - No cron. Every fire is manual.
//   - Resume-safe: KV set bdayblast:<list>:sent:<N>. A 250s fire moves about
//     1,400 emails; re-fire until eligible is 0.
//
// Auth: isAuthorizedCron (Authorization: Bearer $CRON_SECRET).

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM as JOEL_FROM, REPLY as JOEL_REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

const REGISTER_URL = 'https://bpquiz.com/birthday';
const MAX_RUN_MS = 250 * 1000;

const ANNIE_FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const ANNIE_REPLY = 'annie@restoreherhormones.com';
const ANNIE_UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const ANNIE_SEGMENT_KEY = 'rhhmc:segment';

// ---------- Joel wrapper (matches joel-masterclass-broadcast.js) ----------
const joelUnsubUrl = (email) => `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;
function joelWrap(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF8F1;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);"><tr><td style="padding:30px 28px;font-size:15px;line-height:1.65;color:#2C3E50;">
${bodyHtml}
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
    BraveWorks RN &middot; Joel Polley, RN &middot; <a href="https://bpquiz.com" style="color:#9A9A9A;">bpquiz.com</a><br />
    Educational content only. Not medical advice. Always complement, never replace, care from your physician.<br />
    <a href="${joelUnsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a> &middot; You're on the BraveWorks RN list at ${escapeHtml(email)}.
  </p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
const joelFooterText = (email) => `---
BraveWorks RN · Joel Polley, RN · bpquiz.com
Educational content only. Not medical advice. Always complement, never replace, care from your physician.
Unsubscribe: ${joelUnsubUrl(email)}
You're on the BraveWorks RN list at ${email}.`;

// ---------- Annie wrapper (matches annie-masterclass-broadcast.js) ----------
const annieUnsubUrl = (email) => `https://restoreherhormones.com/api/unsubscribe?email=${encodeURIComponent(email)}`;
function annieWrap(bodyHtml, preheader, email) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f4f1;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f1;"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid rgba(0,0,0,.06);"><tr><td style="padding:30px 28px;font-size:16px;line-height:1.65;color:#222;">
${bodyHtml}
<p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:24px 0 0;">
  Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.<br/>
  It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC &middot; 240 W Dixie Ave Ste 5 &middot; Elizabethtown, KY 42701<br/>
  <a href="${annieUnsubUrl(email)}" style="color:#9A9A9A;">Unsubscribe</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
const annieFooterText = (email) => `---
Educational information only. Annie Chitate, RN and Everyday Nurse LLC are not responsible for how this information is used, and nothing here is medical advice.
It is not a substitute for personal care from your own healthcare provider. Everyday Nurse LLC · 240 W Dixie Ave Ste 5 · Elizabethtown, KY 42701

Unsubscribe: ${annieUnsubUrl(email)}`;

const btn = (label, color, ink) =>
  `<p style="text-align:center;margin:24px 0;"><a href="${REGISTER_URL}" style="display:inline-block;background:${color};color:${ink};padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:800;">${label} &rarr;</a></p>`;

// ---------- Copy ----------
const EMAILS = {
  joel: {
    1: {
      subject: () => "Tomorrow is my birthday. I'm the one giving the gift.",
      preheader: 'A free birthday masterclass, Friday 11 AM Central.',
      html: (name, email) => joelWrap(`
<p>${escapeHtml(name)},</p>
<p>Tomorrow is my birthday.</p>
<p>I don't want a party. I want to spend the morning with you.</p>
<p>So tomorrow, Friday, at <strong>11 AM Central / 12 PM Eastern</strong>, I'm doing a free birthday masterclass. One hour. Live on Zoom.</p>
<p><strong>DISCOVER THE #1 PROBLEM KEEPING YOU SICK</strong><br>(Hint: you fall for it every day.)</p>
<p>For 20 years I worked in the ER and ICU. I watched good people do everything they were told and still roll into my trauma bay.</p>
<p>Not because they were lazy.</p>
<p>Because of one problem nobody ever pointed out to them. It hides in plain sight, and most of us fall for it every single day.</p>
<p>Tomorrow, I'm going to show you what it is.</p>
<p>And because it's my birthday, I'm giving a gift to everyone who comes live. I'm not telling you what it is yet. I'll tell you this much: it's the gift I wish someone had handed me when my own blood pressure started climbing.</p>
${btn('SAVE MY FREE SEAT', '#C9A85C', '#10312A')}
<p>Joel Polley, RN<br>BraveWorks RN</p>
<p>P.S. Hit reply and tell me one thing: which number do you most want to change? I read these.</p>`, 'A free birthday masterclass, Friday 11 AM Central.', email),
      text: (name, email) => `${name},

Tomorrow is my birthday.

I don't want a party. I want to spend the morning with you.

So tomorrow, Friday, at 11 AM Central / 12 PM Eastern, I'm doing a free birthday masterclass. One hour. Live on Zoom.

DISCOVER THE #1 PROBLEM KEEPING YOU SICK
(Hint: you fall for it every day.)

For 20 years I worked in the ER and ICU. I watched good people do everything they were told and still roll into my trauma bay.

Not because they were lazy.

Because of one problem nobody ever pointed out to them. It hides in plain sight, and most of us fall for it every single day.

Tomorrow, I'm going to show you what it is.

And because it's my birthday, I'm giving a gift to everyone who comes live. I'm not telling you what it is yet. I'll tell you this much: it's the gift I wish someone had handed me when my own blood pressure started climbing.

SAVE MY FREE SEAT: ${REGISTER_URL}

Joel Polley, RN
BraveWorks RN

P.S. Hit reply and tell me one thing: which number do you most want to change? I read these.
${joelFooterText(email)}`,
    },
  },
  annie: {
    1: {
      subject: () => "Girl, it's my husband's birthday tomorrow (and he's giving YOU the gift)",
      preheader: 'Meet Joel. Free birthday masterclass, Friday 11 AM Central.',
      html: (name, email) => annieWrap(`
<p>${escapeHtml(name)},</p>
<p>Can I brag on my husband for a minute?</p>
<p>His name is Joel Polley. He's a registered nurse, like me. He spent 20 years in the ER and ICU, the place where the stretchers come in.</p>
<p>Girl, he has seen it all.</p>
<p>He's the blood pressure and numbers side of our house. I'm the hormone side. Yes, our dinner conversations get very nerdy.</p>
<p>Tomorrow is Joel's birthday.</p>
<p>And instead of a party, he said, "I want to teach."</p>
<p>So tomorrow, Friday, at <strong>11 AM Central / 12 PM Eastern</strong>, Joel is doing a free birthday masterclass:</p>
<p><strong>DISCOVER THE #1 PROBLEM KEEPING YOU SICK</strong><br>(Hint: you fall for it every day.)</p>
<p>If your blood pressure, blood sugar, or weight started creeping up right when your hormones started shifting... this one is for you.</p>
<p>And here's the part I love. Because it's his birthday, Joel is giving a gift to everyone who shows up live. He's keeping it a surprise until tomorrow.</p>
${btn('SAVE YOUR FREE SEAT', '#ecd88d', '#1f1a16')}
<p>Come celebrate with us, girl.</p>
<p>Everyday Nurse Annie</p>
<p>P.S. Don't forget to Love The Girl You're In.<br>P.P.S. Hit reply with "Happy birthday Joel" and I'll make sure he sees every one.</p>`, 'Meet Joel. Free birthday masterclass, Friday 11 AM Central.', email),
      text: (name, email) => `${name},

Can I brag on my husband for a minute?

His name is Joel Polley. He's a registered nurse, like me. He spent 20 years in the ER and ICU, the place where the stretchers come in.

Girl, he has seen it all.

He's the blood pressure and numbers side of our house. I'm the hormone side. Yes, our dinner conversations get very nerdy.

Tomorrow is Joel's birthday.

And instead of a party, he said, "I want to teach."

So tomorrow, Friday, at 11 AM Central / 12 PM Eastern, Joel is doing a free birthday masterclass:

DISCOVER THE #1 PROBLEM KEEPING YOU SICK
(Hint: you fall for it every day.)

If your blood pressure, blood sugar, or weight started creeping up right when your hormones started shifting... this one is for you.

And here's the part I love. Because it's his birthday, Joel is giving a gift to everyone who shows up live. He's keeping it a surprise until tomorrow.

SAVE YOUR FREE SEAT: ${REGISTER_URL}

Come celebrate with us, girl.

Everyday Nurse Annie

P.S. Don't forget to Love The Girl You're In.
P.P.S. Hit reply with "Happy birthday Joel" and I'll make sure he sees every one.
${annieFooterText(email)}`,
    },
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

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Returns [{ email, name }] eligible before the sent-set check, plus stats.
async function joelAudience() {
  const keys = [...(await scanKeys('drip:*')), ...(await scanKeys('bwbp:drip:*'))];
  const stats = { total: 0, unsub: 0, paused: 0, coachingClient: 0, noEmail: 0, invalidEmail: 0, duplicate: 0 };
  const seen = new Set();
  const out = [];
  for (let i = 0; i < keys.length; i += 500) {
    const chunk = keys.slice(i, i + 500);
    let recs;
    try { recs = await kv.mget(...chunk); } catch { continue; }
    for (const rec of recs) {
      stats.total++;
      if (!rec || !rec.email) { stats.noEmail++; continue; }
      if (rec.unsubscribed) { stats.unsub++; continue; }
      if (rec.paused) { stats.paused++; continue; }
      if (rec.state === 'tier-4') { stats.coachingClient++; continue; }
      const email = String(rec.email).toLowerCase().trim();
      if (!EMAIL_RE.test(email)) { stats.invalidEmail++; continue; }
      if (seen.has(email)) { stats.duplicate++; continue; }
      seen.add(email);
      out.push({ email, name: (rec.firstName || '').trim() });
    }
  }
  return { people: out, stats };
}

async function annieAudience() {
  const segment = (await kv.hgetall(ANNIE_SEGMENT_KEY)) || {};
  const emails = Object.keys(segment);
  if (emails.length === 0) throw new Error('segment empty: run scripts/load-annie-masterclass-segment-2026-09-14.mjs');
  const resend = getResend();
  const unsub = new Set();
  let after;
  for (;;) {
    const { data, error } = await resend.contacts.list({ audienceId: ANNIE_UNSUB_AUDIENCE_ID, limit: 100, ...(after ? { after } : {}) });
    if (error) throw new Error('suppression list unavailable: ' + error.message); // never send without it
    const items = data?.data || [];
    for (const c of items) unsub.add(String(c.email).toLowerCase());
    if (!data?.has_more || items.length === 0) break;
    after = items[items.length - 1].id;
  }
  const stats = { segment: emails.length, unsub: 0 };
  const out = [];
  for (const email of emails) {
    const e = String(email).toLowerCase().trim();
    if (unsub.has(e)) { stats.unsub++; continue; }
    out.push({ email: e, name: String(segment[email] || '').trim() });
  }
  return { people: out, stats };
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const list = String(req.query?.list || '');
  const emailNum = Number(req.query?.email);
  const template = EMAILS[list]?.[emailNum];
  if (!template) return res.status(400).json({ error: `unknown list/email: list=${list} email=${req.query?.email}` });

  const sendMode = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-BIRTHDAY-${list.toUpperCase()}-${emailNum}`;
  const SENT_SET = `bdayblast:${list}:sent:${emailNum}`;
  const from = list === 'joel' ? JOEL_FROM : ANNIE_FROM;
  const replyTo = list === 'joel' ? JOEL_REPLY : ANNIE_REPLY;
  const unsubFor = list === 'joel' ? joelUnsubUrl : annieUnsubUrl;
  const startedAt = Date.now();

  let audience;
  try {
    audience = list === 'joel' ? await joelAudience() : await annieAudience();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  const sentList = await kv.smembers(SENT_SET);
  const alreadySent = new Set((sentList || []).map((e) => String(e).toLowerCase()));

  const stats = { ...audience.stats, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;
  const pace = list === 'joel' ? 70 : 90;

  for (const p of audience.people) {
    if (alreadySent.has(p.email)) { stats.alreadySent++; continue; }
    stats.eligible++;
    const name = p.name || 'there';
    const subject = template.subject(name);
    if (!sendMode) {
      if (samples.length < 3) samples.push({ email: p.email, firstName: p.name || null, subject, preheader: template.preheader, text: template.text(name, p.email) });
      continue;
    }
    if (Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }
    try {
      await resend.emails.send({
        from, to: p.email, replyTo, subject,
        html: template.html(name, p.email),
        text: template.text(name, p.email),
        headers: { 'List-Unsubscribe': `<${unsubFor(p.email)}>` },
      });
      results.sent++;
      try { await kv.sadd(SENT_SET, p.email); } catch (err) { console.warn('birthday-broadcast: sadd failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: p.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, pace));
  }

  console.log('[birthday-broadcast]', JSON.stringify({ list, emailNum, mode: sendMode ? 'SEND' : 'DRY-RUN', stats, results: sendMode ? results : undefined }));
  return res.status(200).json({
    ok: true, list, emailNum,
    mode: sendMode ? 'SEND' : 'DRY-RUN',
    from, stats,
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
