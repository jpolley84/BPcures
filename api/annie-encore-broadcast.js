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

const FIRE_DATES = { '2': '2026-10-13', '3': '2026-10-13' };
const CRON_FIRE_DATE = '2026-10-13';
const FROM = 'Everyday Nurse Annie <annie@restoreherhormones.com>';
const REPLY_TO = 'annie@restoreherhormones.com';
const REGISTER_URL = 'https://restoreherhormones.com/masterclass';
const UNSUB_AUDIENCE_ID = process.env.RESEND_RHH_UNSUB_AUDIENCE_ID || '090e08a1-fb12-4cd7-9aa1-7ce0d8686e94';
const RATE_LIMIT_MS = 90; // matches the local script's pace (0 failures on 8.5k); Resend latency adds ~100ms per send
const MAX_RUN_MS = 250 * 1000;
const SEGMENT_KEY = 'rhhmc:segment';
const SENT_SET_PREFIX = 'rhhencore:sent:';

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
  2: {
    subject: () => "We start in two hours. There is no replay.",
    preheader: "306,616 women. Tonight at 6 PM Central, live, no recording.",
    html: (name, email) => wrapHtml(`<p>${escapeHtml(name)},</p><p>I want you to see something.</p><p>In 2024, in America:</p><p><strong>294,070</strong> women died from cancer. All cancers combined.<br>But <strong>306,616</strong> women died from heart disease.<br>And another <strong>93,596</strong> women died from strokes.</p><p><strong>Heart disease took more women&rsquo;s lives than all cancers combined.</strong></p><p>Those numbers stopped us in our tracks. Because when someone says cancer, everybody pays attention. But when someone says high blood pressure, we almost treat it like it is normal. It is common. That does not mean we should ignore it.</p><p>Last night we talked about this, and about why so many women are taking pills, trying diets, buying supplements, and still do not understand what is driving their symptoms.</p><p>We shared the story of one of our coaching clients. After six weeks of working with us, she reported that her blood pressure had moved from readings in the 150s and 160s to <strong>109/75</strong>. Her weight was down 30 pounds.</p><p style="color:#777;font-size:14px;">That is her individual experience, not a promise of what will happen for everyone.</p><p>But imagine finally understanding what changes may matter most for YOU. Imagine knowing where to start. Imagine having more energy for the people and things you love.</p><p>That is the conversation we are having <strong>tonight</strong>.</p><p>Last night, a woman joined toward the end and kept asking about the recording. She did not want to miss what we were teaching. We had to tell her there is no replay.</p><p>So we decided to open the room again.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0;border:2px solid #DB4E2E;border-radius:12px;border-collapse:separate;overflow:hidden;"><tr><td colspan="2" style="background:#DB4E2E;color:#fff;padding:10px 14px;font-weight:800;letter-spacing:.06em;font-size:13px;">WHEN AND WHERE</td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">When</td><td style="padding:9px 14px;font-size:16px;"><strong>Tonight, in just over two hours</strong></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Time</td><td style="padding:9px 14px;font-size:16px;"><strong>6:00 PM Central &middot; 7:00 PM Eastern</strong></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Meeting ID</td><td style="padding:9px 14px;font-size:16px;"><strong>828 5171 5003</strong></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Passcode</td><td style="padding:9px 14px;font-size:16px;"><strong>027302</strong></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Replay</td><td style="padding:9px 14px;font-size:16px;"><strong>None</strong></td></tr></table><p style="text-align:center;margin:26px 0;"><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="display:inline-block;background:#DB4E2E;color:#fff;text-decoration:none;font-weight:800;padding:16px 34px;border-radius:999px;font-size:17px;">CLICK HERE TO JOIN ON ZOOM &rarr;</a></p><p>Please do not wait until tomorrow to wish you had been there. Your health deserves your attention today.</p><p>Everyday Nurse Annie &amp; Joel</p><p style="color:#777;font-size:14px;">P.S. We are going to show you the four hidden reasons behind so many of the symptoms women struggle with. Once you see how the pieces fit together, you may never look at your health the same way again.</p>`, email, "306,616 women. Tonight at 6 PM Central, live, no recording."),
    text: (name, email) => `${name},

I want you to see something.

In 2024, in America:

294,070 women died from cancer. All cancers combined.
But 306,616 women died from heart disease.
And another 93,596 women died from strokes.

Heart disease took more women's lives than all cancers combined.

Those numbers stopped us in our tracks. Because when someone says cancer, everybody pays attention. But when someone says high blood pressure, we almost treat it like it is normal. It is common. That does not mean we should ignore it.

Last night we talked about this, and about why so many women are taking pills, trying diets, buying supplements, and still do not understand what is driving their symptoms.

We shared the story of one of our coaching clients. After six weeks of working with us, she reported that her blood pressure had moved from readings in the 150s and 160s to 109/75. Her weight was down 30 pounds.

That is her individual experience, not a promise of what will happen for everyone.

But imagine finally understanding what changes may matter most for YOU. Imagine knowing where to start. Imagine having more energy for the people and things you love.

That is the conversation we are having tonight.

Last night, a woman joined toward the end and kept asking about the recording. She did not want to miss what we were teaching. We had to tell her there is no replay.

So we decided to open the room again.

WHEN AND WHERE
When:       Tonight, in just over two hours
Time:       6:00 PM Central / 7:00 PM Eastern
Meeting ID: 828 5171 5003
Passcode:   027302
Replay:     None

JOIN ON ZOOM: https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1

Please do not wait until tomorrow to wish you had been there. Your health deserves your attention today.

Everyday Nurse Annie & Joel

P.S. We are going to show you the four hidden reasons behind so many of the symptoms women struggle with. Once you see how the pieces fit together, you may never look at your health the same way again.
${DISCLAIMER_TEXT(email)}`,
  },
  3: {
    subject: () => "WE ARE LIVE RIGHT NOW",
    preheader: "The room is open. Come as you are.",
    html: (name, email) => wrapHtml(`<p style="font-size:21px;"><strong>WE JUST WENT LIVE!</strong></p><p>Our free masterclass is happening <strong>RIGHT NOW</strong>, and we do not want you to miss it.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0;border:2px solid #DB4E2E;border-radius:12px;border-collapse:separate;overflow:hidden;"><tr><td colspan="2" style="background:#DB4E2E;color:#fff;padding:10px 14px;font-weight:800;letter-spacing:.06em;font-size:13px;">HAPPENING RIGHT NOW</td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Join</td><td style="padding:9px 14px;font-size:16px;"><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="color:#B93C20;font-weight:800;">CLICK TO JOIN ON ZOOM</a></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Meeting ID</td><td style="padding:9px 14px;font-size:16px;"><strong>828 5171 5003</strong></td></tr><tr><td style="padding:9px 14px;color:#6b6b6b;font-size:14px;width:104px;">Passcode</td><td style="padding:9px 14px;font-size:16px;"><strong>027302</strong></td></tr></table><p style="text-align:center;margin:26px 0;"><a href="https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1" style="display:inline-block;background:#DB4E2E;color:#fff;text-decoration:none;font-weight:800;padding:16px 34px;border-radius:999px;font-size:17px;">JOIN THE MASTERCLASS NOW &rarr;</a></p><p>Last night, women were asking for the recording. We did not have one. So we are teaching it again tonight. And there will be <strong>no replay</strong> of this one either.</p><p>We are showing you:</p><ul style="margin:0 0 1em 1.1em;padding:0;"><li style="margin:.35em 0;">Why your symptoms may keep coming back</li><li style="margin:.35em 0;">The four hidden reasons behind your health struggles</li><li style="margin:.35em 0;">How to stop guessing and start making changes in the right order</li></ul><p>If you are making dinner, come. If you are just getting home from work, come. If you can only listen, that is okay too.</p><p><strong>You do not have to be camera-ready. You just have to be in the room.</strong></p><p>Come as you are.</p><p>Everyday Nurse Annie &amp; Joel</p>`, email, "The room is open. Come as you are."),
    text: (name, email) => `WE JUST WENT LIVE!

Our free masterclass is happening RIGHT NOW, and we do not want you to miss it.

HAPPENING RIGHT NOW
Join:       https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1
Meeting ID: 828 5171 5003
Passcode:   027302

Last night, women were asking for the recording. We did not have one. So we are teaching it again tonight. And there will be no replay of this one either.

We are showing you:

- Why your symptoms may keep coming back
- The four hidden reasons behind your health struggles
- How to stop guessing and start making changes in the right order

If you are making dinner, come. If you are just getting home from work, come. If you can only listen, that is okay too.

You do not have to be camera-ready. You just have to be in the room.

Come as you are.

Everyday Nurse Annie & Joel
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
async function encoreExtraExclusions() {
  const out = new Set();
  for (const key of ['encore:waitlist:flat', 'encore:attended:2026-10-12']) {
    const members = await kv.smembers(key);
    if (!members || !members.length) throw new Error(`${key} is empty; refusing to send`);
    for (const m of members) out.add(String(m).trim().toLowerCase());
  }
  return out;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });

  const emailNum = Number(req.query?.email);
  if (![2, 3].includes(emailNum)) return res.status(400).json({ error: 'pass ?email=2 or 3' });
  const template = EMAILS[emailNum];
  const SENT_SET = `${SENT_SET_PREFIX}${emailNum}`;

  const cronMode = req.query?.cron === '1';
  const fireDate = FIRE_DATES[String(emailNum)] || CRON_FIRE_DATE;
  if (cronMode && todayChicago() !== fireDate) {
    return res.status(200).json({ ok: true, skipped: 'cron date guard', today: todayChicago(), fireDate, emailNum });
  }
  const manualSend = req.query?.mode === 'send' && req.headers['x-confirm'] === `SEND-ENCORE-${emailNum}`;
  const sendMode = cronMode || manualSend;

  const startedAt = Date.now();
  const coachingClients = await loadCoachingClients();
  const encoreSkip = await encoreExtraExclusions();
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
    ...guard.report(),
    ...(sendMode ? { results } : { samples }),
    runtimeMs: Date.now() - startedAt,
  });
}
