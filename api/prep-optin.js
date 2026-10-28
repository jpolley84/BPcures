// api/prep-optin.js: the bpquiz.com/prep capture (the PREP lead magnet).
//
// Joel, 2026-10-27: "Build the 90-Day Health Prep checklist opt-in for PREP, tag them
// for Black Friday early access." Same shape as /cleanse (api/cleanse-optin.js). One job:
//   1. validate the email, keep the phone if it looks like one, never block on it
//   2. suppress anyone who already unsubscribed (drip:<email> tombstone is the
//      CAN-SPAM authority across this whole app)
//   3. record the lead in its own namespace, and on the Black Friday early-access list
//   4. email the checklist LINK once per address, idempotently
//   5. answer with the download url either way, so the page can hand it over on the spot
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken } from './unsubscribe.js';
import { looksLikeValidEmail } from './_email-validation.js';
import { p, ctaButton, buildEmail, PALETTE, REPLY_TO } from './_triangle-email.js';

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const GUIDE_URL = `${SITE_URL}/downloads/90-day-health-prep-checklist.pdf`;
const FROM = process.env.RESEND_FROM || 'Joel Polley, RN <joel@bpquiz.com>';

// 'bf-early-access' is the Black Friday list: the program announcement goes to this
// tag first. 'no-quiz' matches the 101 Foods convention: no Triangle quiz taken.
const TAGS = ['prep', 'health-prep-checklist', 'bf-early-access', 'no-quiz'];
const SOURCE = 'prep-squeeze';

const K = {
  lead: (email) => `prep:lead:${email}`,
  set: 'prep:leads',
  sent: (email) => `prep:sent:${email}`,
  earlyAccess: 'bf:early-access',
};

function cleanName(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}
// Digits only, 7-15 after stripping formatting. A bad phone is stored empty and
// NEVER rejects the capture: the email is the thing we actually need.
function cleanPhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  const count = digits.replace(/\D/g, '').length;
  return count >= 7 && count <= 15 ? digits.slice(0, 20) : '';
}

export function checklistEmail({ firstName, unsubUrl }) {
  const hello = firstName ? `${firstName}, here` : 'Here';
  // The early-access sentence is word for word the same on the page, in the DM, and in the video
  // caption. "Before Black Friday" expires on 2026-11-27: change it here and on the page after that.
  const bodyHtml = [
    p(`${hello} is your <strong>90-Day Health Prep Checklist</strong>.`),
    p('Inside: how to check your blood pressure at home the right way, your danger line, the medicine list to '
      + 'write down now, the salt trap in many canned and boxed prep foods, and a simple 90-day plan with a '
      + '7-day blood pressure log.'),
    ctaButton('Download the checklist', GUIDE_URL, { accent: PALETTE.accentClay }),
    p('Start with page 1 this week: get your numbers and your medicine list in order.'),
    p('You are also on the early-access list for our <strong>8-week health preparation program</strong>. '
      + 'We will email you the details before Black Friday.'),
    p('This checklist is education, not medical advice. If you take blood pressure, blood sugar or other '
      + 'medicine, talk with your doctor before you change how you eat. Never stop or change a medicine on your own.'),
    p('Joel Polley, RN<br>BraveWorks RN'),
  ].join('');
  const bodyText = [
    `${hello} is your 90-Day Health Prep Checklist.`,
    'Inside: how to check your blood pressure at home the right way, your danger line, the medicine list to '
    + 'write down now, the salt trap in many canned and boxed prep foods, and a simple 90-day plan with a '
    + '7-day blood pressure log.',
    `Download: ${GUIDE_URL}`,
    'Start with page 1 this week: get your numbers and your medicine list in order.',
    'You are also on the early-access list for our 8-week health preparation program. '
    + 'We will email you the details before Black Friday.',
    'This checklist is education, not medical advice. If you take blood pressure, blood sugar or other '
    + 'medicine, talk with your doctor before you change how you eat. Never stop or change a medicine on your own.',
    'Joel Polley, RN, BraveWorks RN',
  ].join('\n\n');
  return buildEmail({
    preheader: 'Your 90-Day Health Prep Checklist is inside.',
    bodyHtml,
    bodyText,
    unsubUrl,
  });
}

export const SUBJECT = 'Your 90-Day Health Prep Checklist';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const rawEmail = body.email;
  if (!looksLikeValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'invalidEmail', message: 'Please check your email address.' });
  }
  const email = String(rawEmail).trim().toLowerCase();
  const firstName = cleanName(body.firstName || body.name).split(' ')[0];
  const phone = cleanPhone(body.phone);

  // Already unsubscribed? Record nothing new and send nothing, but still hand
  // her the file she just asked for. Suppression is about mail, not access.
  let suppressed = false;
  try {
    const drip = await kv.get(`drip:${email}`);
    suppressed = Boolean(drip && (drip.unsubscribed || drip.status === 'unsubscribed'));
  } catch { /* KV down: fall through and try to deliver */ }

  const nowIso = new Date().toISOString();

  try {
    const existing = await kv.get(K.lead(email));
    await kv.set(K.lead(email), {
      email,
      firstName: firstName || existing?.firstName || '',
      phone: phone || existing?.phone || '',
      magnet: 'health-prep-checklist',
      source: SOURCE,
      bfEarlyAccess: true,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    });
    await kv.sadd(K.set, email);
    if (!suppressed) await kv.sadd(K.earlyAccess, email);
  } catch (err) {
    console.error('prep-optin: KV write failed', err.message);
  }

  // ─── The list. Both mail rails, tagged, same as every other lead magnet ───
  // drip:<email> is the legacy subscriber + suppression store; bwbp:drip:<email>
  // is the rail the live crons read. corner/trigger stay null: this lead never
  // took the quiz, and nothing here may pretend she did.
  if (!suppressed) {
    try {
      const dripKey = `drip:${email}`;
      const legacy = await kv.get(dripKey);
      if (legacy) {
        const reEnterLead = !legacy.state || legacy.state === 'newsletter';
        await kv.set(dripKey, {
          ...legacy,
          firstName: firstName || legacy.firstName || '',
          phone: phone || legacy.phone || '',
          firstSeen: legacy.firstSeen || legacy.enrolledAt || nowIso,
          tags: Array.from(new Set([...(legacy.tags || []), ...TAGS])),
          lastCaptureAt: nowIso,
          ...(reEnterLead ? { state: 'lead', stateEnteredAt: legacy.stateEnteredAt || nowIso } : {}),
        });
      } else {
        await kv.set(dripKey, {
          email,
          firstName,
          phone,
          cohort: 'prep',
          enrolledAt: nowIso,
          firstSeen: nowIso,
          lastSentDay: 0,
          optedIn: true, // asking for the checklist IS the opt-in
          source: SOURCE,
          answers: {},
          tags: TAGS,
          state: 'lead',
          stateEnteredAt: nowIso,
        });
      }
      try {
        const dayKey = nowIso.slice(0, 10);
        await kv.sadd(`lead-log:${dayKey}`, email);
        await kv.expire(`lead-log:${dayKey}`, 90 * 86400);
      } catch { /* non-fatal counter */ }
    } catch (err) {
      console.error('prep-optin: drip enroll failed', err.message);
    }

    try {
      const triKey = `bwbp:drip:${email}`;
      const tri = await kv.get(triKey);
      if (tri) {
        // A rail tombstoned on its own still means do not mail.
        if (tri.unsubscribed) {
          suppressed = true;
        } else {
          await kv.set(triKey, {
            ...tri,
            firstName: tri.firstName || firstName,
            phone: tri.phone || phone,
            tags: Array.from(new Set([...(tri.tags || []), ...TAGS])),
            lastCaptureAt: nowIso,
          });
        }
      } else {
        await kv.set(triKey, {
          email,
          firstName,
          phone,
          corner: null,
          trigger: null,
          triggerName: null,
          readiness: null,
          scores: null,
          state: 'lead',
          stateEnteredAt: nowIso,
          enrolledAt: nowIso,
          source: SOURCE,
          tags: TAGS,
        });
      }
    } catch (err) {
      console.warn('prep-optin: triangle enroll failed (non-fatal)', err.message);
    }
  }

  let emailed = false;
  if (!suppressed && process.env.RESEND_API_KEY) {
    let claimed = false;
    try {
      // One checklist email per address, ever. A double submit re-saves the lead
      // (harmless) and never re-sends.
      claimed = Boolean(await kv.set(K.sent(email), new Date().toISOString(), { nx: true }));
    } catch { claimed = true; }
    if (claimed) {
      try {
        const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${signUnsubToken({ email })}`;
        const { html, text } = checklistEmail({ firstName, unsubUrl });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM,
          to: email,
          replyTo: REPLY_TO, // the template footer invites a reply; land it in the monitored inbox
          subject: SUBJECT,
          html,
          text,
        });
        emailed = true;
      } catch (err) {
        console.error('prep-optin: send failed', err.message);
        // Release the guard so an honest retry can still deliver.
        try { await kv.del(K.sent(email)); } catch { /* noop */ }
      }
    }
  }

  return res.status(200).json({ ok: true, url: GUIDE_URL, emailed, suppressed });
}
