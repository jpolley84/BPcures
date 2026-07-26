// api/_foods101-capture.js — the 101 Foods squeeze capture core (foods101-v1).
//
// Russell Brunson lead funnel, step 1: the squeeze page's ONLY job is the
// email. This module is what happens the moment it lands. It is deliberately a
// module and not a handler so two front doors can share it byte for byte:
//   - api/foods101-optin.js   the dedicated endpoint (canonical)
//   - api/lead-magnet.js      delegates when the body carries magnet:'foods101'
//
// What one capture does, in order:
//   1. Read the legacy drip:<email> record. It is the CAN-SPAM authority: both
//      unsubscribe endpoints tombstone it, so an opted-out address gets no
//      mail from here and no masterclass seat either.
//   2. Enroll / enrich BOTH mail rails (drip:* and bwbp:drip:*), tagged
//      'foods101' + 'no-quiz' with source 'foods101-squeeze' so this funnel
//      stays separable from quiz traffic in every later segmentation.
//   3. Claim a per-email idempotency guard, then send the guide email ONCE.
//      A double submit re-enrolls (harmless, idempotent) but never re-sends.
//      A FAILED send releases the guard so an honest retry can still deliver.
//   4. Stamp leadDay0Sent on the triangle record. LOAD-BEARING: without it
//      triangle-lead-cron's Day 0 safety net would later email a lead who
//      never took a quiz the line "your loudest driver is the one your quiz
//      named," which is both wrong and obviously automated.
//   5. Auto-register Monday night's masterclass (Joel: the class is an
//      automatic addition at opt-in, not a second decision). Non-fatal.
//   6. Alert Joel on any partial failure. A capture is never lost silently.
//
// The guide is LINKED, never attached. It is a large PDF and Resend's
// attachment ceiling plus inbox-provider size penalties are not worth it for a
// document that lives at a permanent public URL.
//
// Compliance spine: ZERO em dashes in visible copy. Educational verbs only
// (supports / steadies / helps), never treat / cure / reverse. NEWSTART clean:
// plant foods, kitchen herbs, caffeine free teas. The one-click unsubscribe +
// CAN-SPAM postal line come from _triangle-email.js's shared footer.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { signUnsubToken } from './unsubscribe.js';
import { p, ctaButton, buildEmail, PALETTE } from './_triangle-email.js';
import { registerMasterclass, escapeHtml } from './_masterclass-enroll.js';
import { bumpMetric } from './_ops-metrics.js';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// The magnet itself. Produced by scripts/build-101-foods-pdf.mjs into
// public/downloads/. Linked, not attached (see header note).
export const FOODS101_FILE = '101-foods-bp.pdf';
export const FOODS101_URL = `${SITE_URL}/downloads/${FOODS101_FILE}`;

export const FOODS101_SOURCE = 'foods101-squeeze';
export const FOODS101_TAGS = ['foods101', 'no-quiz'];

// Per-email send guard. TTL is long enough that a bookmark-and-resubmit weeks
// later does not re-mail, short enough that a genuine re-request next quarter
// still works.
const SEND_GUARD_TTL_S = 60 * 60 * 24 * 30;
const sendGuardKey = (email) => `foods101:sent:${email}`;

function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

// Sanitize caller-supplied tags the same way capture-lead.js does: short
// strings, bounded count. These are stored, never rendered into email HTML.
function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => (typeof t === 'string' ? t.trim().slice(0, 40) : ''))
    .filter(Boolean)
    .slice(0, 8);
}

function cleanUtmForStore(utm) {
  if (!utm || typeof utm !== 'object' || Array.isArray(utm)) return null;
  const out = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
    if (typeof utm[k] === 'string' && utm[k]) out[k] = utm[k].trim().slice(0, 60);
  }
  return Object.keys(out).length ? out : null;
}

// ─── The guide email ──────────────────────────────────────────────────
// Beat sheet (spec foods101-v1 §4.2.3): deliver the guide, point at the seven
// on page 3, one line of the nurse story, name the second email so the Monday
// seat does not read as a glitch, sign off, P.S. save this.
// ZERO offer in this email. The tripwire lives on the thank-you page, which is
// where the visitor already is when this sends.
//
// firstName is escaped: this module is reachable from an unauthenticated
// endpoint and the name is interpolated into Joel-branded HTML.
export function renderFoodsEmail({ firstName, unsubUrl, alreadyBooked = false }) {
  const safeName = escapeHtml(firstName) || 'there';

  const mondayHtml = alreadyBooked
    ? p('One more thing. You are already on the list for Monday night. <strong>Beyond the Cuff</strong> runs live every Monday at 7pm Central, and your join link is in the seat email I sent you the first time you signed up. Search my name if you cannot find it.')
    : p('One more thing. A second email from me is on its way right now with your seat for Monday night. <strong>Beyond the Cuff</strong> runs live every Monday at 7pm Central, and that email is the one carrying the join link. If it is not in your inbox in a few minutes, check Promotions.');

  const bodyHtml = [
    p(`Hey ${safeName},`),
    p('Here it is, exactly like I promised.'),
    p('<strong>101 Foods And Herbs That Help Steady Blood Pressure.</strong> Plant foods, kitchen herbs, and caffeine free teas, grouped so you know what goes in the cart this week instead of guessing in the supplement aisle.'),
    ctaButton('Open your 101 Foods guide (PDF)', FOODS101_URL),
    p('Do not try to read all 101 tonight. Turn to page 3. There are seven items on that page, and those seven are your whole first week. Buy those, use those, and let the other ninety four wait their turn.'),
    p(`If the button does not work in your email app, here is the plain link: <a href="${FOODS101_URL}" style="color:${PALETTE.accentClay};font-weight:700;">${FOODS101_URL}</a>`),
    p('I spent twenty years in ICU and emergency medicine watching careful people take every pill on time, cut the salt shaker, do everything they were told, and still watch the numbers climb. It was almost never effort. It was that nobody ever showed them what to put on the plate instead.'),
    p('That is what this list is for.'),
    mondayHtml,
    p('One trigger at a time.', { margin: '0 0 6px' }),
    p('Joel Polley, RN'),
    p('P.S. Save this email. The download link stays good, and you are going to want the list again the week after next.'),
  ].join('');

  const bodyText = `Hey ${firstName || 'there'},

Here it is, exactly like I promised.

101 Foods And Herbs That Help Steady Blood Pressure. Plant foods, kitchen herbs, and caffeine free teas, grouped so you know what goes in the cart this week instead of guessing in the supplement aisle.

Open your guide: ${FOODS101_URL}

Do not try to read all 101 tonight. Turn to page 3. There are seven items on that page, and those seven are your whole first week. Buy those, use those, and let the other ninety four wait their turn.

I spent twenty years in ICU and emergency medicine watching careful people take every pill on time, cut the salt shaker, do everything they were told, and still watch the numbers climb. It was almost never effort. It was that nobody ever showed them what to put on the plate instead.

That is what this list is for.

${alreadyBooked
  ? 'One more thing. You are already on the list for Monday night. Beyond the Cuff runs live every Monday at 7pm Central, and your join link is in the seat email I sent you the first time you signed up.'
  : 'One more thing. A second email from me is on its way right now with your seat for Monday night. Beyond the Cuff runs live every Monday at 7pm Central, and that email is the one carrying the join link. If it is not in your inbox in a few minutes, check Promotions.'}

One trigger at a time.
Joel Polley, RN

P.S. Save this email. The download link stays good, and you are going to want the list again the week after next.`;

  return buildEmail({
    preheader: 'Plus your seat for Monday night.',
    bodyHtml,
    bodyText,
    unsubUrl,
  });
}

/**
 * Run one 101 Foods capture.
 *
 * The email MUST already be validated by the caller (looksLikeValidEmail).
 * This function never throws for an expected condition; it reports what
 * happened and lets the HTTP layer choose a status code.
 *
 * @param {object}  opts
 * @param {string}  opts.email       validated address
 * @param {string} [opts.name]       first name from the squeeze form
 * @param {string[]}[opts.tags]      extra client tags (utm-derived)
 * @param {object} [opts.utm]        { utm_source, utm_medium, utm_campaign }
 * @param {string} [opts.source]     attribution label, defaults foods101-squeeze
 * @param {boolean}[opts.autoMasterclass] default true
 * @returns {Promise<{
 *   email: string, deduped: boolean, suppressed: boolean, enrolled: boolean,
 *   emailSent: boolean, masterclass: { registered: boolean, already: boolean },
 *   enrollError: string|null, sendError: string|null
 * }>}
 */
export async function captureFoods101({
  email,
  name,
  tags,
  utm,
  source,
  autoMasterclass = true,
} = {}) {
  const emailLower = String(email).trim().toLowerCase();
  const firstName = firstNameOf(name);
  const extraTags = cleanTags(tags);
  const normUtm = cleanUtmForStore(utm);
  const normSource = (typeof source === 'string' && source.trim() ? source.trim().slice(0, 40) : FOODS101_SOURCE);
  const allTags = Array.from(new Set([...FOODS101_TAGS, ...extraTags]));

  const result = {
    email: emailLower,
    deduped: false,
    suppressed: false,
    enrolled: false,
    emailSent: false,
    masterclass: { registered: false, already: false },
    enrollError: null,
    sendError: null,
  };

  const hasKv = Boolean(process.env.KV_REST_API_URL);

  // ── 1. CAN-SPAM gate ────────────────────────────────────────────────
  // drip:<email> is where both unsubscribe endpoints write their tombstone.
  // Read it once and reuse it below (the enroll needs it anyway).
  let legacyRecord = null;
  if (hasKv) {
    try {
      legacyRecord = await kv.get(`drip:${emailLower}`);
    } catch (err) {
      console.warn('foods101: legacy drip read failed (continuing)', err.message);
    }
  }
  const isUnsubscribed = Boolean(legacyRecord && legacyRecord.unsubscribed);
  if (isUnsubscribed) {
    result.suppressed = true;
    console.log(`foods101: suppressed capture for ${emailLower} (unsubscribed tombstone)`);
  }

  // ── 2. ENROLL FIRST, SEND SECOND ────────────────────────────────────
  // House rule since 2026-06-09: the captured email is the asset. Save it
  // before attempting delivery so a Resend outage cannot lose the lead.
  const nowIso = new Date().toISOString();
  let triangleWritable = false;

  if (hasKv) {
    // 2a. Legacy rail — drip:<email>. Subscriber store + suppression store.
    try {
      const dripKey = `drip:${emailLower}`;
      if (legacyRecord) {
        // Enrich only. Never demote a buyer. A record parked in 'newsletter'
        // (a dead end today) re-enters the lead arc, same rule as lead-magnet.
        const reEnterLead = !legacyRecord.state || legacyRecord.state === 'newsletter';
        const stateFields = !reEnterLead ? {} : {
          state: 'lead',
          stateEnteredAt: legacyRecord.state === 'newsletter'
            ? nowIso
            : (legacyRecord.stateEnteredAt || legacyRecord.enrolledAt || nowIso),
        };
        await kv.set(dripKey, {
          ...legacyRecord,
          firstName: firstName || legacyRecord.firstName || '',
          firstSeen: legacyRecord.firstSeen || legacyRecord.enrolledAt || nowIso,
          tags: Array.from(new Set([...(legacyRecord.tags || []), ...allTags])),
          lastCaptureAt: nowIso,
          ...(normUtm ? { utm: normUtm } : {}),
          ...stateFields,
        });
      } else {
        await kv.set(dripKey, {
          email: emailLower,
          firstName,
          cohort: 'foods101',
          enrolledAt: nowIso,
          firstSeen: nowIso,
          lastSentDay: 0,
          optedIn: true, // asking for the guide IS the opt-in
          source: normSource,
          // No riskScore, no answers: this lead never took a quiz.
          answers: {},
          tags: allTags,
          state: 'lead',
          stateEnteredAt: nowIso,
          ...(normUtm ? { utm: normUtm } : {}),
        });
      }
      result.enrolled = true;

      // Daily lead-log set (SCARD = "how many leads in the last 24h").
      // Deliberately NOT the triangles:* counter: that one is the public
      // "Triangles Mapped Today" quiz-completion number, and this lead never
      // took the quiz. Inflating it would be a fabricated stat.
      try {
        const dayKey = nowIso.slice(0, 10);
        await kv.sadd(`lead-log:${dayKey}`, emailLower);
        await kv.expire(`lead-log:${dayKey}`, 90 * 86400);
      } catch (logErr) {
        console.warn('foods101: daily lead-log write failed (non-fatal)', logErr.message);
      }
    } catch (err) {
      result.enrollError = err.message;
      console.error('foods101: legacy drip enroll failed', err.message);
    }

    // 2b. Triangle rail — bwbp:drip:<email>. This is the rail the live crons
    // read (triangle-lead-cron, then evergreen-cron). corner and trigger stay
    // null on purpose: no quiz was taken, so nothing may claim one was.
    if (!isUnsubscribed) {
      try {
        const triKey = `bwbp:drip:${emailLower}`;
        const triExisting = await kv.get(triKey);
        triangleWritable = true;
        if (triExisting) {
          if (triExisting.unsubscribed) {
            // Triangle rail was tombstoned independently. Respect it.
            triangleWritable = false;
            result.suppressed = true;
            console.log(`foods101: triangle record for ${emailLower} is unsubscribed, suppressing send`);
          } else {
            await kv.set(triKey, {
              ...triExisting,
              firstName: triExisting.firstName || firstName,
              tags: Array.from(new Set([...(triExisting.tags || []), ...allTags])),
              lastCaptureAt: nowIso,
            });
          }
        } else {
          await kv.set(triKey, {
            email: emailLower,
            firstName,
            corner: null,
            trigger: null,
            triggerName: null,
            readiness: null,
            scores: null,
            state: 'lead',
            stateEnteredAt: nowIso,
            enrolledAt: nowIso,
            source: normSource,
            tags: allTags,
            ...(normUtm ? { utm: normUtm } : {}),
          });
          await bumpMetric('drip-new');
        }
      } catch (triErr) {
        // Non-fatal: the legacy rail already holds the address.
        console.warn('foods101: triangle enroll failed (non-fatal)', triErr.message);
      }
    }
  }

  // Recompute after the triangle read: either tombstone suppresses the send.
  const suppressed = result.suppressed;

  // ── 3. IDEMPOTENCY GUARD, then SEND ─────────────────────────────────
  // NX claim, same pattern as the Stripe webhook's processing claim. Claimed
  // BEFORE the send so two concurrent submits cannot both mail; RELEASED on
  // failure so an honest retry can still deliver the guide.
  const guardKey = sendGuardKey(emailLower);
  let claimed = false;
  if (!suppressed) {
    if (hasKv) {
      try {
        const res = await kv.set(guardKey, { at: Date.now() }, { nx: true, ex: SEND_GUARD_TTL_S });
        claimed = Boolean(res);
      } catch (err) {
        // KV outage must not block a legitimate capture. Fail open: send.
        console.warn('foods101: send-guard claim failed (sending anyway)', err.message);
        claimed = true;
      }
    } else {
      claimed = true;
    }
    if (!claimed) {
      result.deduped = true;
      console.log(`foods101: dedupe skipped guide send to ${emailLower} (already sent)`);
    }
  }

  // Decide the Monday copy BEFORE sending, so the guide email never promises a
  // seat email that will not arrive (registerMasterclass is idempotent and
  // stays silent for an address that already has a seat).
  let alreadyBooked = false;
  if (hasKv && autoMasterclass) {
    try {
      const reg = await kv.get(`masterclass:reg:${emailLower}`);
      alreadyBooked = Boolean(reg && reg.email);
    } catch {
      /* fall back to the "second email is coming" copy */
    }
  } else if (!autoMasterclass) {
    alreadyBooked = true; // no seat email will be sent; do not promise one
  }

  if (!suppressed && claimed) {
    const unsubToken = signUnsubToken({ email: emailLower });
    const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
    const { html, text } = renderFoodsEmail({ firstName, unsubUrl, alreadyBooked });
    const subject = firstName
      ? `Your 101 Foods guide is inside, ${firstName}`
      : 'Your 101 Foods guide is inside';
    try {
      await getResend().emails.send({
        from: 'Joel Polley, RN <joel@bpquiz.com>',
        to: emailLower,
        replyTo: 'braveworksrn@gmail.com',
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      result.emailSent = true;

      // LOAD-BEARING. triangle-lead-cron's Day 0 safety net sends the
      // Blueprint email with quiz-flavored copy to any lead record without
      // this flag. A 101 Foods lead never took a quiz, so Day 0 must never
      // fire for them.
      if (triangleWritable) {
        try {
          const triKey = `bwbp:drip:${emailLower}`;
          const rec = await kv.get(triKey);
          if (rec && !rec.leadDay0Sent) {
            await kv.set(triKey, {
              ...rec,
              leadDay0Sent: true,
              leadDay0SentAt: new Date().toISOString(),
            });
          }
        } catch (flagErr) {
          console.warn('foods101: leadDay0Sent flag write failed (non-fatal)', flagErr.message);
        }
      }
    } catch (err) {
      result.sendError = err.message;
      console.error('foods101: resend failed', err.message);
      // Release the guard so the client's retry (and any later resend from the
      // thank-you page) can actually deliver. Without this, one Resend blip
      // would lock the address out of its own guide for 30 days.
      if (hasKv) {
        try {
          await kv.del(guardKey);
        } catch (delErr) {
          console.warn('foods101: send-guard release failed', delErr.message);
        }
      }
    }
  }

  // ── 4. MASTERCLASS AUTO-REGISTER ────────────────────────────────────
  // Joel: the class is an automatic addition at opt-in, not a second
  // decision. Never fatal to the capture, and never for a tombstoned address.
  if (autoMasterclass && !suppressed) {
    try {
      const r = await registerMasterclass({
        email: emailLower,
        name: firstName,
        source: FOODS101_SOURCE,
        utm: normUtm || undefined,
        sendConfirmation: true,
      });
      result.masterclass = { registered: true, already: Boolean(r.already) };
    } catch (err) {
      console.warn('foods101: masterclass auto-register failed (non-fatal)', err.message);
    }
  }

  // ── 5. ALERT on partial failure ─────────────────────────────────────
  // Never lose a capture silently. Mirrors lead-magnet.js's alert.
  if (result.enrollError || result.sendError) {
    try {
      await getResend().emails.send({
        from: 'BraveWorks Ops <noreply@bpquiz.com>',
        to: ['braveworksrn@gmail.com'],
        subject: `[ALERT] foods101 partial failure for ${emailLower}`,
        text: `A 101 Foods squeeze opt-in hit a partial capture failure.

Email: ${emailLower}
Source: ${normSource}
KV enroll: ${result.enrollError ? `FAILED - ${result.enrollError}` : 'ok'}
Guide send: ${result.sendError ? `FAILED - ${result.sendError}` : (result.deduped ? 'skipped (already sent)' : 'ok')}
Masterclass: ${result.masterclass.registered ? (result.masterclass.already ? 'already registered' : 'registered') : 'not registered'}

If the enroll failed, add them by hand (no cron knows this person exists).
If only the send failed, they did NOT get the guide: the triangle Day 0 safety net delivers the Blueprint, not the 101 Foods list, so this one needs a manual resend.`,
      });
    } catch (alertErr) {
      console.error('foods101: alert send also failed', alertErr.message);
    }
  }

  return result;
}
