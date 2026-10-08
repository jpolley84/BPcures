// api/habits-optin.js: the bpquiz.com/habits squeeze capture for the
// NEWSTART 30-Day Challenge (FB group + WhatsApp community).
//
// Joel, 2026-10-08: same shape as /cleanse (api/cleanse-optin.js). One job:
//   1. validate the email, keep the phone if it looks like one, never block on it
//   2. suppress anyone who already unsubscribed (drip:<email> tombstone is the
//      CAN-SPAM authority across this whole app)
//   3. record the lead in its own namespace so this funnel stays separable
//   4. email the guide LINK once per address, idempotently
//   5. answer with the download url either way, so the page can hand her the
//      PDF on the spot even if the mail rail is having a bad day
//
// The guide is LINKED, not attached: 3.4 MB of PDF in every inbox is how you
// earn spam complaints. Same call the 101 Foods funnel makes.
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { signUnsubToken } from './unsubscribe.js';
import { looksLikeValidEmail } from './_email-validation.js';
import { p, ctaButton, buildEmail, PALETTE } from './_triangle-email.js';

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const GUIDE_URL = `${SITE_URL}/downloads/newstart-30-day-workbook.pdf`;
const FROM = process.env.RESEND_FROM || 'Joel Polley, RN <joel@bpquiz.com>';

// Tags every habits lead carries on both rails, so this funnel stays
// separable in later segmentation. 'no-quiz': arrived without the quiz.
const TAGS = ['habits', 'newstart-challenge', 'no-quiz'];
const SOURCE = 'habits-squeeze';
// Resend campaign tag (see _resend.js) so opens/clicks bucket per funnel.
const CAMPAIGN = 'habits-newstart-challenge';
const WHATSAPP_URL = 'https://chat.whatsapp.com/EZWPWcpyRyg6szOe4Vy0rI';
const FB_GROUP_URL = 'https://www.facebook.com/groups/1381691747377452';

const K = {
  lead: (email) => `habits:lead:${email}`,
  set: 'habits:leads',
  sent: (email) => `habits:sent:${email}`,
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

function guideEmail({ firstName, unsubUrl }) {
  const hello = firstName ? `Welcome to the challenge, ${firstName}!` : 'Welcome to the challenge!';
  const bodyHtml = [
    p(`<strong>${hello}</strong> Here is your <strong>NEWSTART 30-Day Guide + Workbook</strong>.`),
    p('Inside: the 8 NEWSTART habits, how to pick your ONE elimination and ONE habit addition, '
      + 'and your 30-day tracker with weekly check-ins.'),
    ctaButton('Download the workbook', GUIDE_URL, { accent: PALETTE.accentClay }),
    p(`Join our WhatsApp community here: <a href="${WHATSAPP_URL}">${WHATSAPP_URL}</a>`),
    p(`And our Facebook group here: <a href="${FB_GROUP_URL}">${FB_GROUP_URL}</a>`),
    p('If you take blood pressure, blood sugar or other prescribed medication, talk with your prescribing '
      + 'clinician before making changes. Never stop or change prescribed medication on your own.'),
    p('Joel Polley, RN<br>BraveWorks RN'),
  ].join('');
  const bodyText = [
    `${hello} Here is your NEWSTART 30-Day Guide + Workbook.`,
    `Download: ${GUIDE_URL}`,
    `Join our WhatsApp community here: ${WHATSAPP_URL}`,
    `And our Facebook group here: ${FB_GROUP_URL}`,
    'If you take blood pressure, blood sugar or other prescribed medication, talk with your prescribing '
    + 'clinician before making changes. Never stop or change prescribed medication on your own.',
    'Joel Polley, RN, BraveWorks RN',
  ].join('\n\n');
  return buildEmail({
    preheader: 'Your NEWSTART 30-Day Workbook + community links are inside.',
    bodyHtml,
    bodyText,
    unsubUrl,
  });
}

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
      magnet: 'newstart-workbook',
      source: SOURCE,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    });
    await kv.sadd(K.set, email);
  } catch (err) {
    console.error('habits-optin: KV write failed', err.message);
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
          cohort: 'habits',
          enrolledAt: nowIso,
          firstSeen: nowIso,
          lastSentDay: 0,
          optedIn: true, // asking for the guide IS the opt-in
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
      console.error('habits-optin: drip enroll failed', err.message);
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
      console.warn('habits-optin: triangle enroll failed (non-fatal)', err.message);
    }
  }

  let emailed = false;
  if (!suppressed && process.env.RESEND_API_KEY) {
    let claimed = false;
    try {
      // One guide email per address, ever. A double submit re-saves the lead
      // (harmless) and never re-sends.
      claimed = Boolean(await kv.set(K.sent(email), new Date().toISOString(), { nx: true }));
    } catch { claimed = true; }
    if (claimed) {
      try {
        const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${signUnsubToken({ email })}`;
        const { html, text } = guideEmail({ firstName, unsubUrl });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: 'Welcome to the challenge! Your NEWSTART workbook',
          html,
          text,
          tags: [
            { name: 'campaign', value: CAMPAIGN },
            { name: 'funnel', value: 'habits' },
          ],
        });
        emailed = true;
      } catch (err) {
        console.error('habits-optin: send failed', err.message);
        // Release the guard so an honest retry can still deliver.
        try { await kv.del(K.sent(email)); } catch { /* noop */ }
      }
    }
  }

  return res.status(200).json({ ok: true, url: GUIDE_URL, emailed, suppressed, whatsapp: WHATSAPP_URL, facebook: FB_GROUP_URL });
}
