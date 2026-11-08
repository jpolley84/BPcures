// api/joel-hidden-mistakes-sequence.js — "4 Hidden Health Mistakes" pre-class
// emails 2-6 for the live class Monday, November 9, 2026, 6 PM CT / 7 PM ET.
//
// Copy: Joel's Version 2 sequence, with the fixes shown to him in chat and
// approved 2026-11-08 ("just send all masterclass emails and waitlist starting
// email 2"). Email 1 is the seat-saved email in _masterclass-enroll.js.
//
// Audience (Joel chose "also all past registrants", 2026-11-08):
//   masterclass:members                     every past masterclass registrant
//   waitlist:masterclass                    the masterclass waitlist
//   masterclass:event:2026-11-09:members    this class's registrants
// minus drip:<email>.unsubscribed, the never-send guard (clients, Stripe
// payers, bwbp:neversend, Resend unsubscribes), and the coaching roster.
//
// Each email fires only inside its own window (FIRE_WINDOWS, UTC), so a cron
// that fires on the wrong day or a rerun sends nothing. A per-email KV sent-set
// makes every fire resumable: a second window picks up where the first stopped.
//
// Dry run:  GET ?email=N                       (auth required) -> counts + samples
// Manual:   GET ?email=N&mode=send + header x-confirm: SEND-HIDDEN-N
// Cron:     GET ?cron=1&email=N                 (window-guarded)

import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken, escapeHtml, FROM, REPLY } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';
import { neverSendGuard } from './_never_send.js';
import { ZOOM_JOIN_URL, ZOOM_MEETING_ID, ZOOM_PASSCODE } from './_masterclass-enroll.js';

export const config = { maxDuration: 300 };

const EVENT = '2026-11-09';
const CALENDAR_ICS_URL = 'https://bpquiz.com/api/masterclass-calendar';
const CALENDAR_GOOGLE_URL = 'https://bpquiz.com/api/masterclass-calendar?google=1';
const REGISTER_URL = 'https://bpquiz.com/masterclass';

// [start, end) in UTC. Email 2 goes out by hand on Joel's go (Sunday 11-08).
const FIRE_WINDOWS = {
  2: ['2026-11-08T19:00:00Z', '2026-11-09T00:30:00Z'], // Sun afternoon CT
  3: ['2026-11-09T01:00:00Z', '2026-11-09T01:45:00Z'], // Sun 7:00 PM CT
  4: ['2026-11-09T14:00:00Z', '2026-11-09T14:45:00Z'], // Mon 8:00 AM CT
  5: ['2026-11-09T23:00:00Z', '2026-11-09T23:40:00Z'], // Mon 5:00 PM CT
  6: ['2026-11-10T00:00:00Z', '2026-11-10T00:30:00Z'], // Mon 6:00 PM CT, live
};
const RATE_LIMIT_MS = 60;
const MAX_RUN_MS = 250 * 1000;
const SENT_SET_PREFIX = `hiddenmistakes:${EVENT}:sent:`; // + emailNum
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function tidyName(raw) {
  const s = String(raw || '').trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  if (!s) return 'there';
  const first = s.split(/\s+/)[0];
  if (!/^[\p{L}][\p{L}'\-]*$/u.test(first) || first.length < 2) return 'there';
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return first;
}

const unsubUrl = (email) => `https://bpquiz.com/api/unsubscribe?token=${signUnsubToken(email)}`;

const WHY = {
  waitlist: 'you joined the BraveWorks RN masterclass waitlist',
  registrant: 'you saved a seat for a BraveWorks RN masterclass',
};

function footerHtml(email, why) {
  return `<p style="font-size:11px;color:#8a99a8;line-height:1.55;margin:26px 0 0;border-top:1px solid #d9e5ed;padding-top:14px;">
    You're getting this because ${escapeHtml(why)}. Educational content only, not medical advice. Never start, stop, or adjust medication without your doctor.<br />
    Joel Polley, RN &middot; BraveWorks RN &middot; <a href="https://bpquiz.com" style="color:#8a99a8;">bpquiz.com</a> &middot; <a href="${unsubUrl(email)}" style="color:#8a99a8;">Unsubscribe</a>
  </p>`;
}

function footerText(email, why) {
  return `---
You're getting this because ${why}. Educational content only, not medical advice. Never start, stop, or adjust medication without your doctor.
Joel Polley, RN · BraveWorks RN · bpquiz.com
Unsubscribe: ${unsubUrl(email)}`;
}

function wrapHtml(bodyHtml, preheader, email, why) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#edf5fa;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf5fa;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-top:4px solid #d7b579;"><tr><td style="padding:30px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.65;color:#17334e;">
${bodyHtml}
${footerHtml(email, why)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const btn = (href, label) =>
  `<p style="margin:22px 0 8px;"><a href="${href}" style="display:inline-block;background:#102b47;color:#FFFFFF;text-decoration:none;font-weight:800;letter-spacing:.06em;padding:14px 24px;">${label} &rarr;</a></p>`;
const zoomLine = `<p style="margin:0 0 18px;font-size:14px;color:#334e65;">Meeting ID: <strong>${ZOOM_MEETING_ID}</strong> &middot; Passcode: <strong>${ZOOM_PASSCODE}</strong></p>`;
const zoomText = `Join on Zoom: ${ZOOM_JOIN_URL}\nMeeting ID: ${ZOOM_MEETING_ID} · Passcode: ${ZOOM_PASSCODE}`;

// Paragraph helpers: the copy is written once as a list of blocks and rendered
// to both HTML and plain text, so the two can never drift apart.
const P = (t) => ({ p: t });
const B = (t) => ({ b: t });
function render(blocks) {
  const html = blocks.map((x) => (x.raw ? x.raw : x.b ? `<p><strong>${escapeHtml(x.b)}</strong></p>` : `<p>${escapeHtml(x.p)}</p>`)).join('\n');
  const text = blocks.map((x) => (x.rawText !== undefined ? x.rawText : x.b || x.p)).filter((t) => t !== '').join('\n\n');
  return { html, text };
}

const EMAILS = {
  2: {
    subject: () => "Here's how to WIN with your health",
    preheader: "You've already done so much right. The next few steps will change everything.",
    blocks: (name) => [
      P(`Hey ${name},`),
      P('Think about what it took to build the life you have.'),
      P('The decisions. The discipline. The resources. The willingness to learn something new when what you were doing wasn\'t working.'),
      P('You didn\'t get here by accident.'),
      P('But here\'s something I\'ve noticed.'),
      B('The skills that make us successful in one area of life don\'t automatically give us the information we need in another.'),
      P('Especially when it comes to health.'),
      P('22 years as a nurse in the ER and ICU taught me that without health, we have NOTHING. I\'ve stood by the bedside of wealthy, successful, and even famous patients who would have traded anything for another chance with their health.'),
      P('After 10 years of coaching, one of the biggest frustrations I hear from my clients is feeling like they\'re guessing about their energy, blood pressure, blood sugar, or weight.'),
      P('Because every expert seems to have a different answer.'),
      P('And being given more advice isn\'t the same as being given clarity.'),
      B('That\'s why we\'re having this conversation on Monday.'),
      P('You will walk away with a different way to look at what\'s happening in your body.'),
      P('Imagine walking into the new year with more energy, a revived glow, and a body that makes you smile.'),
      { raw: `<p>Bring your friend or daughter. She deserves to thrive. She can save her own seat here: <a href="${REGISTER_URL}" style="color:#a4772d;font-weight:700;">bpquiz.com/masterclass</a></p>`, rawText: `Bring your friend or daughter. She deserves to thrive. She can save her own seat here: ${REGISTER_URL}` },
      P('See you Monday.'),
      { raw: '<p>Joel Polley, RN<br/>Brave Works RN</p>', rawText: 'Joel Polley, RN\nBrave Works RN' },
    ],
  },
  3: {
    subject: () => 'Hormones, blood pressure, diabetes, and more...',
    preheader: "Sometimes the next step isn't doing more.",
    blocks: (name) => [
      P(`Hey ${name},`),
      P('You\'ve probably been told some version of this:'),
      { raw: '<p>Eat better.<br/>Exercise more.<br/>Reduce your stress.<br/>Lose the weight.<br/>Follow the plan.</p>', rawText: 'Eat better.\nExercise more.\nReduce your stress.\nLose the weight.\nFollow the plan.' },
      P('And chances are, you\'ve already put real effort into some of those things.'),
      P('But here\'s the question I want you to consider:'),
      B('What if doing more isn\'t the answer because you\'re overlooking something important?'),
      P('As a nurse for more than 22 years, I\'ve seen how easily we can focus on individual numbers without connecting them to the bigger picture.'),
      P('Blood pressure. Blood sugar. Weight. Hormones. Daily habits.'),
      P('They\'re not all separate conversations.'),
      P('And understanding how different factors may connect could change the questions you ask and the decisions you make.'),
      P('Tomorrow, we\'re going to explore four mistakes that may be getting in the way of that understanding.'),
      B('Not another lecture about willpower. A NEW way to look at your health that can make all the difference.'),
      P('Come ready to see your body, and your numbers, in a whole new light.'),
      P('Monday. 6 PM Central / 7 PM Eastern.'),
      P('LIVE. No replay.'),
      P('Joel'),
    ],
  },
  4: {
    subject: () => "You've built the life. Now let's protect what's next.",
    preheader: 'Tonight is about more than improving numbers.',
    blocks: (name) => [
      P(`Hey ${name},`),
      P('Tonight, we\'re talking about your health.'),
      P('But I want you to think about something bigger than blood pressure, blood sugar, or the number on your scale.'),
      B('What do you still want to do with your life?'),
      P('Maybe it\'s traveling without worrying about your energy.'),
      P('Enjoying your marriage or feeling confident enough to date again.'),
      P('Being present with your children and grandchildren.'),
      P('Building something meaningful.'),
      P('Making a greater contribution.'),
      P('Or simply feeling confident that you\'re taking an informed, active role in your health.'),
      P('Whatever that looks like for you, I want you to keep it in mind tonight.'),
      P('Because we\'re not just talking about numbers.'),
      B('We\'re talking about the health that supports everything you still want to experience, create, and enjoy.'),
      P('And that\'s worth 90 minutes of your time.'),
      P('We\'re LIVE tonight at 6 PM Central / 7 PM Eastern.'),
      P('Set that time aside.'),
      P('I look forward to seeing you.'),
      P('Joel'),
    ],
  },
  5: {
    subject: () => 'We start in 60 minutes. Come ready for this question.',
    preheader: 'One question to think about before we begin.',
    blocks: (name) => [
      P(`Hey ${name},`),
      P('We\'re one hour away!'),
      P('Before we begin, here\'s something I want you to think about:'),
      B('If you knew exactly what to investigate next about your health, what would that change for you?'),
      P('Would you feel more confident?'),
      P('Would you make different decisions?'),
      P('Would you finally stop jumping from one piece of advice to the next?'),
      P('Tonight, we\'re going to examine four hidden health mistakes and begin connecting some important dots.'),
      P('Bring something to take notes with.'),
      P('And give yourself these 90 minutes without distractions.'),
      B('We start at 6 PM Central / 7 PM Eastern.'),
      { raw: btn(ZOOM_JOIN_URL, 'JOIN THE LIVE MASTERCLASS') + zoomLine, rawText: zoomText },
      P('See you soon!'),
      P('Joel'),
    ],
  },
  6: {
    subject: () => "We're LIVE. Here's where to join me.",
    preheader: 'The 4 Hidden Health Mistakes masterclass is starting right now.',
    blocks: (name) => [
      P(`Hey ${name},`),
      B('We\'re LIVE right now!'),
      P('If you\'ve been wondering what you may be overlooking when it comes to your blood pressure, blood sugar, and weight, this is the conversation I want you to be part of.'),
      { raw: '<p>We\'re getting into the <strong>four hidden health mistakes</strong> and why understanding the bigger picture matters.</p>', rawText: 'We\'re getting into the four hidden health mistakes and why understanding the bigger picture matters.' },
      { raw: btn(ZOOM_JOIN_URL, 'JOIN THE MASTERCLASS NOW') + zoomLine, rawText: zoomText },
      P('No replay.'),
      P('Come on in.'),
      P('Joel Polley, RN'),
    ],
  },
};

export function buildEmail(emailNum, firstName, email, kind) {
  const t = EMAILS[emailNum];
  const name = tidyName(firstName);
  const why = WHY[kind] || WHY.registrant;
  // render() escapes every P and B block, so the name goes in raw.
  const { html, text } = render(t.blocks(name));
  return {
    subject: t.subject(name),
    html: wrapHtml(html, t.preheader, email, why),
    text: `${text}\n\n${footerText(email, why)}`,
  };
}

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Every candidate with a first name and the reason she is on the list.
// Registrant wins over waitlist when someone is on both.
async function loadAudience() {
  const [members, waitlist, eventMembers] = await Promise.all([
    kv.smembers('masterclass:members'),
    kv.smembers('waitlist:masterclass'),
    kv.smembers(`masterclass:event:${EVENT}:members`),
  ]);
  const people = new Map();
  const add = (raw, kind) => {
    const e = String(raw || '').trim().toLowerCase();
    if (!e) return;
    const prev = people.get(e);
    if (!prev || (prev.kind === 'waitlist' && kind === 'registrant')) people.set(e, { email: e, kind, name: '' });
  };
  for (const e of waitlist || []) add(e, 'waitlist');
  for (const e of [...(members || []), ...(eventMembers || [])]) add(e, 'registrant');

  // Names and drip unsubscribe flags, in mget batches.
  const list = [...people.values()];
  const CHUNK = 300;
  for (let i = 0; i < list.length; i += CHUNK) {
    const slice = list.slice(i, i + CHUNK);
    const keys = slice.flatMap((p) => [`masterclass:reg:${p.email}`, `waitlist:masterclass:rec:${p.email}`, `drip:${p.email}`]);
    const recs = await kv.mget(...keys);
    slice.forEach((p, j) => {
      const [reg, wl, drip] = recs.slice(j * 3, j * 3 + 3);
      p.name = (reg && reg.name) || (wl && wl.name) || (drip && (drip.firstName || drip.name)) || '';
      p.unsubscribed = Boolean(drip && drip.unsubscribed);
    });
  }
  return list;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (!EMAILS[emailNum]) return res.status(400).json({ error: 'pass ?email=2..6' });
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-HIDDEN-${emailNum}`;
  const sendMode = cronMode || manualSend;
  if (sendMode) {
    const [start, end] = FIRE_WINDOWS[emailNum];
    const now = Date.now();
    if (now < Date.parse(start) || now >= Date.parse(end)) {
      return res.status(200).json({ ok: true, skipped: 'outside fire window', emailNum, window: FIRE_WINDOWS[emailNum], now: new Date(now).toISOString() });
    }
  }

  const startedAt = Date.now();
  let guard;
  try { guard = await neverSendGuard(); }
  catch (err) { return res.status(500).json({ error: 'never-send list unavailable; refusing to send', detail: err.message }); }

  let audience;
  try { audience = await loadAudience(); }
  catch (err) { return res.status(500).json({ error: 'audience load failed', detail: err.message }); }

  let sentAlready = new Set();
  try { sentAlready = new Set(await kv.smembers(SENT_SET)); } catch { /* empty */ }

  const stats = { candidates: audience.length, registrants: 0, waitlistOnly: 0, unsubscribed: 0, neverSend: 0, invalidEmail: 0, alreadySent: 0, eligible: 0 };
  const results = { sent: 0, failed: 0, errors: [], bailedOnTimeout: false };
  const samples = [];
  const resend = sendMode ? getResend() : null;

  for (const p of audience) {
    if (sendMode && Date.now() - startedAt > MAX_RUN_MS) { results.bailedOnTimeout = true; break; }
    if (p.unsubscribed) { stats.unsubscribed++; continue; }
    if (!EMAIL_RE.test(p.email)) { stats.invalidEmail++; continue; }
    if (guard.blocks(p.email)) { stats.neverSend++; continue; }
    if (sentAlready.has(p.email)) { stats.alreadySent++; continue; }
    stats.eligible++;
    if (p.kind === 'waitlist') stats.waitlistOnly++; else stats.registrants++;

    const built = buildEmail(emailNum, p.name, p.email, p.kind);
    if (!sendMode) {
      if (samples.length < 3) samples.push({ email: p.email, kind: p.kind, name: p.name || null, subject: built.subject, text: built.text });
      continue;
    }
    try {
      await resend.emails.send({ from: FROM, to: p.email, replyTo: REPLY, subject: built.subject, html: built.html, text: built.text });
      results.sent++;
      try { await kv.sadd(SENT_SET, p.email); } catch (err) { console.warn('hidden-mistakes: sadd failed', err.message); }
    } catch (err) {
      results.failed++;
      if (results.errors.length < 10) results.errors.push({ email: p.email, error: err.message });
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  return res.status(200).json({
    ok: true,
    emailNum,
    mode: sendMode ? (cronMode ? 'CRON-SEND' : 'SEND') : 'DRY-RUN',
    from: FROM,
    stats,
    ...guard.report(),
    ...(sendMode ? { results, sentSetSize: await kv.scard(SENT_SET).catch(() => null) } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
