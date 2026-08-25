// api/challenge-signup.js — The Change My Life Challenge, cohort 2026-08-24 (Aug 24-30).
// 2026-08-17: the seat is FREE. Stripe was removed from ChallengePage.jsx, so the
// live path into this file is intent 'free-register' (name + email + phone). The
// paid cmlc-97 branches below are dormant, not deleted, in case it goes paid again.
//
// Three live nights with Joel Polley, RN. Tuesday 2026-08-04 through Thursday
// 2026-08-06, 7:00pm to 8:00pm ET (6:00pm CT), about 60 minutes a night.
// TWO seats, both sold from bpquiz.com/challenge through
// api/create-embedded-checkout.js:
//   'challenge-ga'   $17 founding (2026-07-27, Joel; $97 next cohort)
//   'challenge-vip'  $47, adds the Bonus Day, Sunday 2026-08-09, 11:00am ET
// Nights run Tue, Wed, Thu (Aug 4-6). The week ends Thursday and the Bonus Day
// is a Sunday, so nothing collides with the Sabbath gate (Friday sundown to
// Saturday sundown) and no date is skipped.
//
// ── WHAT REPLACED WHAT (2026-07-26) ───────────────────────────────────
// This file used to serve the RETIRED free 30-Day Pressure Triangle Challenge.
// It sent a stale "Doors open Friday at 8 AM EST" announcement and enrolled
// signups into the LEGACY drip:* store, and it was hard-disabled behind a 410
// on 2026-06-23 for exactly that reason. All of that is gone. What is kept, on
// purpose: the per-IP rate limiter (fail-open), the shared email-shape and
// header-injection check, and the "never overwrite an in-progress subscriber
// record" rule.
//
// ── CONTRACT ──────────────────────────────────────────────────────────
//   POST { intent, ... }   intent is one of:
//
//   'register'   { sessionId }                      -> paid seat confirmation
//     The paid path (VIP since 2026-08-03; GA historically). The seat is
//     proven by retrieving the Stripe Checkout Session server-side and
//     requiring: status complete, payment_status paid,
//     metadata.offer === 'challenge', metadata.cohort === this cohort. The
//     buyer's address comes from the SESSION, never from the request body, so
//     a stranger cannot POST someone else's email and be sent the link.
//     Idempotent per session id and per email. 200 { ok, already, tier, ... }
//
//   'free-register' { email, firstName? }           -> FREE GA seat (2026-08-03)
//     GA went free; this is its whole registration path. No Stripe, proof of
//     nothing beyond a working address. Sends the same confirmation email in
//     its 'free' variant: no kit promise (kit is VIP-only now), no refund
//     language, and an honest VIP invitation instead. Same K.reg record shape
//     as the paid path, amountCents 0, owes WITHOUT 'kit'. Idempotent per
//     email. Note the emailed Zoom details now go to unpaid addresses too;
//     that is inherent to a free cohort, not a leak.
//
//   'waitlist'   { email, firstName? }              -> doors-closed capture
//     "Tell me about the next one." No Zoom link, no seat, no charge.
//
//   'seat-link'  { email, firstName?, tier? }       -> honest-degrade capture
//     Fired by the page when create-embedded-checkout returns
//     CHALLENGE_PRICE_NOT_CONFIGURED. Captures the interest, tells the buyer
//     nothing was charged, and alerts Joel that a live buyer hit a dead
//     checkout. No Zoom link.
//
//   429 on rate limit, 400 on a bad body, 502 when Resend fails on a path
//   whose whole purpose is the email.
//
// ── KV KEYS ───────────────────────────────────────────────────────────
//   challenge:2026-08-04:reg:<email>       registration record (durable truth)
//   challenge:2026-08-04:members           SET of registered emails
//   challenge:2026-08-04:count             INCR, ops only
//   challenge:2026-08-04:session:<cs_id>   NX idempotency claim per Stripe session
//   challenge:2026-08-04:interest:<email>  waitlist / seat-link record
//   challenge:2026-08-04:interest          SET of interested emails
//   cs-rl:<ip> / cs-rl-reg:<ip>            per-IP rate limit counters
//
// Dedupe is by EMAIL (SADD / per-email record), never by a per-request flag.
// That is the 2026-07-20 lesson from the broadcast that double-sent 3,310
// people. The counter is for the ops dashboard only. There is NO seat cap on
// this cohort, so the count must never be rendered as scarcity anywhere.
//
// KV KEY NOTE, deliberate break with the old file: the retired version wrote
// signups into `drip:<email>`, the LEGACY 30-day arc store. That is actively
// wrong now. `drip:*` still drives drip-cron's retired Pressure Triangle
// sequence, so a 2026 registrant landing there would start receiving a dead
// 30-email arc. New registrants are enriched into `bwbp:drip:<email>`, the
// current triangle machine, using the same enrich-only rules as
// _masterclass-enroll.js: never reset state, never demote a buyer, never
// restart a timer.
//
// ── THE AMOUNT COLLISION, AND HOW IT IS HANDLED (RESOLVED 2026-07-26) ──
// A challenge sale is $97 (9700), an amount ALREADY mapped to a kit tier in
// triangle-webhook.js AMOUNT_TO_TIER. Routing by price would therefore deliver
// a challenge buyer the wrong product. The checkout stamps
// metadata.offer = 'challenge', and triangle-webhook.js now branches on that
// marker BEFORE the amount lookup, calling this endpoint's 'register' intent.
// That branch THROWS on failure rather than returning, so Stripe retries
// instead of the buyer being silently lost.
//
// ── ENV ───────────────────────────────────────────────────────────────
//   Required to take registrations:
//     STRIPE_SECRET_KEY, RESEND_API_KEY, KV_REST_API_URL / KV_REST_API_TOKEN
//   Required before the confirmation email is honest:
//     CHALLENGE_ZOOM_URL           the cohort's own Zoom room, NOT the free
//                                  Monday masterclass room
//     CHALLENGE_ZOOM_MEETING_ID    optional
//     CHALLENGE_ZOOM_PASSCODE      optional
//     CHALLENGE_ZOOM_ICS_URL       optional, add-to-calendar link
//   Required before ANY marketing email goes out (CAN-SPAM):
//     BUSINESS_POSTAL_ADDRESS      no hardcoded fallback, ever
//   Optional:
//     CHALLENGE_SIGNUP_DISABLED=1  kill switch (see below)
//     JOEL_NOTIFY_EMAIL            defaults to braveworksrn@gmail.com
//     UNSUB_SECRET                 signs the one-click unsubscribe token
//
// The old CHALLENGE_SIGNUP_ENABLED=1 opt-IN guard is inverted to
// CHALLENGE_SIGNUP_DISABLED=1, an opt-OUT kill switch. Reason: the guard
// existed to stop a stale announcement blasting out, and that announcement no
// longer exists. Leaving it opt-in would 410 the page's honest-degrade capture
// on the day it ships, which is the one thing the degrade path must not do.

import Stripe from 'stripe';
import { Resend } from './_resend.js';
import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';
import { captureEvent } from './_posthog.js';
import { signUnsubToken } from './triangle-unsubscribe.js';
import {
  FROM,
  REPLY_TO,
  SITE_URL,
  PALETTE,
  POSTAL_ADDRESS,
  p,
  h2,
  ctaButton,
  callout,
  emailShell,
} from './_triangle-email.js';

// ==== CHALLENGE CONFIG - change dates/labels HERE and nowhere else ====
// Mirrors the config block on src/pages/ChallengePage.jsx. The prices live in
// Stripe (env-driven, see api/create-embedded-checkout.js) and are quoted here
// only as display strings for the confirmation email.
const CHALLENGE = {
  // 2026-08-17: cohort id ALIGNED with api/create-embedded-checkout.js
  // (both the 'cmlc-97' branch and CHALLENGE_COHORT) and ChallengePage.jsx
  // COHORT_ID. The previous mismatch ('2026-08-04' here vs '2026-08-17' on the
  // checkout metadata) made handleRegister reject every paid cmlc-97 session:
  // charged and never seated. If the cohort ever moves again, move ALL THREE.
  cohort: '2026-08-24',
  // 2026-08-03 (Joel, explicit): renamed to the Women of Power Rising
  // Challenge, co-hosted with Annie Chitate, RN (Everyday Nurse Annie).
  // "Connected story" positioning; mechanics unchanged.
  // 2026-08-03 (later same evening): renamed again to the Change My Life
  // Challenge, now on its own domain changemylifechallenge.com.
  name: 'The Change My Life Challenge',
  subtitle: 'Seven days live with Annie Chitate, RN and Joel Polley, RN',
  // 2026-07-28 (Joel): the call moved to SEVEN PM EASTERN. It previously ran
  // 7:00pm CT, which is 8:00pm ET. 7:00pm ET is 6:00pm CT, so the instant below
  // is now expressed in EASTERN wall time and every label moved with it. The
  // same change is mirrored in src/pages/ChallengePage.jsx (START_ISO_ET) and
  // api/create-embedded-checkout.js (CHALLENGE_START_ET).
  startIsoEt: '2026-08-24T19:00:00',
  // 2026-08-05 (Joel): registration closes at MIDNIGHT ending Wednesday
  // 2026-08-05 ET. Note this is NOT endLabel: Night 3 still runs on the
  // Thursday for everyone already registered. Mirrors CHALLENGE.CLOSE_ISO_ET in
  // src/pages/ChallengePage.jsx and CHALLENGE_CLOSE_MS in
  // api/create-embedded-checkout.js.
  //
  // Stored as a resolved UTC instant, not an ET wall string: August 2026 is
  // inside EDT (UTC-4), so midnight ending Wednesday is exactly
  // 2026-08-06T04:00:00Z. If the date moves, re-resolve it rather than assuming
  // the offset.
  // Doors for the FREE path close at midnight ET ending Sunday, August 30
  // (end of the cohort; late joiners still get 48-hour replays). EDT is UTC-4,
  // so that instant is 2026-08-31T04:00:00Z. Re-resolved for the 08-24 move
  // rather than assuming the old offset still applied.
  closeMs: Date.parse('2026-08-31T04:00:00Z'),
  closeLabel: 'Sunday night',
  startLabel: 'Monday, August 24',
  endLabel: 'Sunday, August 30',
  timeEt: '7:00pm ET',
  timeCt: '6:00pm CT',
  timeWindowEt: '7:00pm to 8:00pm ET',
  nightLength: 'about 60 minutes',
  logDueLabel: 'Tuesday, September 1',
  refundByLabel: 'September 1',
  // 2026-07-27 (Joel): founding-cohort seat is $17 (the kit price). $97 is the
  // NEXT cohort. Must match ChallengePage SEAT_PRICE and what Stripe charges.
  // 2026-08-17: the live seat is the $97 cmlc-97 tier (single seat, no GA/VIP
  // split). The VIP labels below are legacy and unreachable from the page.
  seatPriceLabel: 'Free',
  // 2026-07-28 (Joel): VIP is $47 and is now a seat sold on /challenge, not a
  // post-purchase upsell. It adds a FOURTH session on Sunday morning.
  // This key was referenced twice in the guarantee copy below but never
  // defined, so every VIP confirmation rendered the refund amount blank.
  vipPriceLabel: '$47',
  vipDayLabel: 'Sunday, August 9',
  vipTimeEt: '11:00am ET',
  vipTimeCt: '10:00am CT',
  vipLength: 'about 90 minutes',
  pageUrl: 'https://changemylifechallenge.com/',
  // Day titles mirror DAYS in src/pages/ChallengePage.jsx. These were still
  // the pre-2026-08-17 sequence, so confirmation emails were listing days
  // that no longer matched the page. Corrected with the date move.
  nights: [
    { n: 1, date: 'Monday, August 24', title: 'What Happened to My Body?' },
    { n: 2, date: 'Tuesday, August 25', title: 'Connect the Dots' },
    { n: 3, date: 'Wednesday, August 26', title: 'Stop Guessing With Food' },
    { n: 4, date: 'Thursday, August 27', title: 'Bring Sexy Back' },
    { n: 5, date: 'Friday, August 28', title: 'Move Different' },
    { n: 6, date: 'Saturday, August 29', title: 'Know Your Numbers Without Fear' },
    { n: 7, date: 'Sunday, August 30', title: 'Take Back Your Future' },
  ],
};

// Zoom details for THIS cohort. Env only. There is deliberately no fallback to
// the weekly "Life Beyond the Numbers" room in _masterclass-enroll.js: that is a
// different, free class. Night 1 is a Tuesday, so it no longer collides with
// that Monday class, but they are still separate rooms and separate audiences.
const ZOOM = {
  url: (process.env.CHALLENGE_ZOOM_URL || '').trim(),
  meetingId: (process.env.CHALLENGE_ZOOM_MEETING_ID || '').trim(),
  passcode: (process.env.CHALLENGE_ZOOM_PASSCODE || '').trim(),
  icsUrl: (process.env.CHALLENGE_ZOOM_ICS_URL || '').trim(),
};

// 2026-08-24: show-up tracking. The welcome email's Zoom CTA goes through
// api/go-zoom.js, which captures chal_zoom_click server-side and 302s to
// CHALLENGE_ZOOM_URL. The e param lets the click resolve to the registrant's
// PostHog person (distinct_id = lowercased email, same as everywhere server
// side). Meeting ID and passcode still render in plain text below the button,
// so a reader who prefers to open Zoom manually loses nothing.
function zoomTrackedUrl(email) {
  const base = `${SITE_URL}/api/go-zoom?c=${encodeURIComponent(CHALLENGE.cohort)}`;
  return email ? `${base}&e=${encodeURIComponent(String(email).trim().toLowerCase())}` : base;
}

const JOEL_EMAIL = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
const FROM_INTERNAL = 'BraveWorks Ops <noreply@bpquiz.com>';

const K = {
  reg: (email) => `challenge:${CHALLENGE.cohort}:reg:${email}`,
  members: `challenge:${CHALLENGE.cohort}:members`,
  count: `challenge:${CHALLENGE.cohort}:count`,
  session: (id) => `challenge:${CHALLENGE.cohort}:session:${id}`,
  interest: (email) => `challenge:${CHALLENGE.cohort}:interest:${email}`,
  interestSet: `challenge:${CHALLENGE.cohort}:interest`,
};

// ─── Rate limit (kept from the previous file, unchanged semantics) ────
// Per-IP, fail-open. 2026-05-13 hardening: this endpoint was once uncapped, so
// one attacker could spam unlimited POSTs into unlimited Resend sends and burn
// sender reputation. Two buckets now, because the two paths have different
// abuse surfaces:
//   cs-rl      10/hr  paths that email an address taken from the REQUEST BODY
//   cs-rl-reg  60/hr  the paid-seat path, whose address comes from a Stripe
//                     session. Higher because a buyer refreshing the
//                     confirmation page re-POSTs, and locking a paying
//                     customer out of their own Zoom link is worse than a few
//                     extra Stripe reads. The work itself is idempotent.
async function checkRateLimit(ip, { prefix = 'cs-rl', limit = 10 } = {}) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `${prefix}:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= limit) return { ok: false, count };
    if (count === 0) await kv.set(key, 1, { ex: 3600 });
    else await kv.incr(key);
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('challenge-signup: rate-limit check failed (allowing):', err.message);
    return { ok: true };
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// ─── Sanitizers ───────────────────────────────────────────────────────
// EVERY value that reaches email HTML goes through esc(). That includes values
// that came back from Stripe: customer_details.name is typed by the buyer into
// a form, so it is user-supplied even though it arrives via a trusted API.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strips ASCII control characters (CR and LF included, so nothing can be
// smuggled into a mail header), then trims and caps the length.
// Phone shape, shared by every path that accepts one from a request body
// (free seat + waitlist). Digits and a leading + survive; 7-15 digits is the
// E.164 range. Anything outside it returns '' rather than throwing, because on
// every one of these forms the EMAIL is the thing that matters and a bad phone
// must never block the capture. The paid path does not use this: Stripe
// validates the number itself and it is read from the session.
function normalizePhoneOrEmpty(input) {
  const raw = String(input || '').replace(/[^\d+]/g, '');
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? raw : '';
}

function clean(s, max = 80) {
  return typeof s === 'string' ? s.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

function firstNameOf(full) {
  return clean(full).split(/\s+/)[0] || '';
}

// ─── Shared email furniture ───────────────────────────────────────────
// The medication disclaimer is VERBATIM from src/pages/CheckoutPage.jsx. Do
// not paraphrase, shorten, or reorder it. It ships under Joel's RN licence.
const MED_DISCLAIMER_LINES = [
  'These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, or prevent any disease.',
  'Educational and lifestyle content only. Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or adjust medication without your doctor.',
  'Results not typical. Most readers see modest results or none.',
];

// Compliance footer. Written here rather than reusing complianceFooterHtml()
// from _triangle-email.js because that one states a consent basis ("you asked
// for my BP teaching") that is not true for someone who just bought a seat.
// Postal address is env-driven and the line disappears entirely when unset.
function footerHtml({ unsubUrl, provenance }) {
  const disclaimer = MED_DISCLAIMER_LINES.map(
    (line) =>
      `<p style="font-size:12px;line-height:1.6;color:${PALETTE.muted};margin:0 0 8px;">${line}</p>`
  ).join('');
  const unsubLink = unsubUrl
    ? ` <a href="${unsubUrl}" style="color:${PALETTE.muted};text-decoration:underline;">Unsubscribe from my emails</a>.`
    : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:32px;border-top:1px solid ${PALETTE.line};">
    <tr><td style="padding-top:20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;border-collapse:separate;">
        <tr><td style="padding:14px 16px;background:${PALETTE.paperWarm};border-radius:10px;">${disclaimer}</td></tr>
      </table>
      <p style="font-size:11px;line-height:1.65;color:${PALETTE.muted};margin:0;">
        You are getting this because ${esc(provenance)}.${unsubLink}<br/>
        BraveWorks RN &middot; Joel Polley, RN${POSTAL_ADDRESS ? ` &middot; ${esc(POSTAL_ADDRESS)}` : ''}
      </p>
    </td></tr>
  </table>`;
}

function footerText({ unsubUrl, provenance }) {
  return `--
${MED_DISCLAIMER_LINES.join('\n\n')}

You are getting this because ${provenance}.${unsubUrl ? `\nUnsubscribe: ${unsubUrl}` : ''}
BraveWorks RN . Joel Polley, RN${POSTAL_ADDRESS ? ' . ' + POSTAL_ADDRESS : ''}`;
}

function unsubUrlFor(email) {
  try {
    return `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email })}`;
  } catch (err) {
    console.warn('challenge-signup: unsub token failed', err.message);
    return '';
  }
}

// ─── The three-night schedule block ───────────────────────────────────
function nightsHtml() {
  const rows = CHALLENGE.nights
    .map(
      (night) => `<tr>
        <td style="padding:9px 0;border-bottom:1px solid ${PALETTE.lineSoft};font-size:14px;line-height:1.55;color:${PALETTE.inkSoft};">
          <strong style="color:${PALETTE.ink};">Day ${night.n} &middot; ${night.date}</strong><br/>
          ${night.title}
        </td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">${rows}</table>`;
}

function nightsText() {
  return CHALLENGE.nights.map((n) => `Day ${n.n} . ${n.date} . ${n.title}`).join('\n');
}

// ─── Zoom block: honest when the room is not set up yet ───────────────
// CHALLENGE_ZOOM_URL is a placeholder until Joel creates the cohort's room. An
// email that prints a dead button is worse than one that says plainly that the
// link is coming, so the unset case renders a promise instead of a link.
function zoomHtml(email) {
  if (!ZOOM.url) {
    return callout({
      kicker: 'Your join link',
      body: `The Zoom room for this cohort goes out in its own email before each live session. If it has not landed an hour before the call, reply to this email and I will send it to you by hand.`,
    });
  }
  const details = [
    ZOOM.meetingId ? `Meeting ID: <strong>${esc(ZOOM.meetingId)}</strong>` : '',
    ZOOM.passcode ? `Passcode: <strong>${esc(ZOOM.passcode)}</strong>` : '',
  ]
    .filter(Boolean)
    .join(' &middot; ');
  const ics = ZOOM.icsUrl
    ? `<p style="font-size:14px;line-height:1.6;color:${PALETTE.muted};margin:6px 0 0;"><a href="${esc(ZOOM.icsUrl)}" style="color:${PALETTE.clay};">Add all seven days to your calendar</a>.</p>`
    : '';
  return `<div style="background:${PALETTE.paperWarm};border-radius:12px;padding:20px 22px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:10px;">Your join link, save this email</div>
    ${ctaButton('Join the challenge on Zoom', esc(zoomTrackedUrl(email)))}
    ${details ? `<p style="font-size:14px;line-height:1.6;color:${PALETTE.inkSoft};margin:0;">${details}</p>` : ''}
    ${ics}
    <p style="font-size:13px;line-height:1.6;color:${PALETTE.muted};margin:10px 0 0;">The same link works all seven days.</p>
  </div>`;
}

function zoomText(email) {
  if (!ZOOM.url) {
    return `Your join link: the Zoom room for this cohort goes out in its own email before each live session. If it has not landed an hour before the call, reply to this email and I will send it by hand.`;
  }
  const bits = [`Join on Zoom: ${zoomTrackedUrl(email)}`];
  if (ZOOM.meetingId) bits.push(`Meeting ID: ${ZOOM.meetingId}`);
  if (ZOOM.passcode) bits.push(`Passcode: ${ZOOM.passcode}`);
  if (ZOOM.icsUrl) bits.push(`Add to calendar: ${ZOOM.icsUrl}`);
  bits.push('The same link works all seven days.');
  return bits.join('\n');
}

// ─── Email 1: paid seat confirmation ──────────────────────────────────
// Wording follows the approved /challenge copy document. Zero em dashes in
// visible copy. No clinical outcome promised anywhere. No seat count, no
// countdown, no scarcity: the only deadline is that Night 1 is live.
function registrationEmail({ firstName, isVip, email, free = false }) {
  const name = firstName ? esc(firstName) : 'friend';
  const unsubUrl = unsubUrlFor(email);
  const provenance = `you registered for ${CHALLENGE.name} at changemylifechallenge.com`;

  // 2026-07-28: VIP is the FOURTH DAY, not a nightly side room. The previous
  // copy here described a 5-night cohort with a pre-call VIP room and promised
  // an "expanded Doctor Conversation Sheet on Night 5". There is no Night 5.
  const vipHtml = isVip
    ? [
        h2('Your Bonus Day'),
        p(
          `You have the VIP seat, so you get a fourth live session: <strong>${esc(CHALLENGE.vipDayLabel)} at ${esc(CHALLENGE.vipTimeEt)}</strong> (${esc(CHALLENGE.vipTimeCt)}), about ninety minutes.`
        ),
        p(
          `It is a smaller, private session with Annie and Joel. It sits on Sunday and not inside the week for one reason: by Sunday you finally have three days of your own readings to look at. There is nothing to look at on Tuesday. We read real logs out loud together, including yours if you want it read, and show you what the pattern across a week is actually saying.`
        ),
        p(
          `Then questions, until they run out rather than until the hour does, and a second pass at the doctor conversation using whatever your own log turned up. The Bonus Day has a replay too, and it is yours to keep alongside the other three.`
        ),
      ].join('')
    : '';

  // 2026-07-28: BOTH tiers get the same three promises, because that is what
  // /challenge advertises. The GA branch previously said "after Night 1 the
  // live portion is not refundable", which directly contradicted Promise 3 on
  // the sales page ("reply REFUND by August 16 and I send back every dollar",
  // written with no tier restriction and rendered to every reader). The page is
  // the offer the buyer accepted, so the receipt may not narrow it afterward.
  // Only the price label differs between tiers.
  const priceLabel = isVip ? CHALLENGE.vipPriceLabel : CHALLENGE.seatPriceLabel;
  // 2026-08-03: the FREE seat has no refund to promise and no kit to deliver
  // (kit moved into VIP), so its "plain part" is a plain statement instead of
  // a guarantee, and its second prep item becomes the honest VIP invitation.
  const guaranteeHtml = free
    ? p(
        `<strong>Your seat is free.</strong> Nothing was charged, nothing renews, and there is no fine print to read twice. The only thing this seat costs is showing up, and the replays cover you if life gets in the way.`
      )
    : p(
        `<strong>Your guarantee: Show Up and Do the Work.</strong> Your seat is fully refundable for any reason right up until ${esc(CHALLENGE.startLabel)} at ${esc(CHALLENGE.timeEt)}. Change your mind, reply REFUND, done. After that I cannot un-hold a live room, so here is what replaces it: attend or watch all seven sessions within the available replay period, complete your daily action guides, and finish your Personal Life Change Map. If you did the work and, at the end of Day 7, you genuinely do not believe the week delivered the value of your ${esc(priceLabel)}, send us your completed Life Change Map by ${esc(CHALLENGE.logDueLabel)} (within 48 hours of Day 7) and we refund the full ${esc(priceLabel)}. No argument, no endless hoops. We are not guaranteeing a number on the scale, a blood pressure reading, or any medical outcome; we are guaranteeing the chance to go through the full process with us and leave with a clearer next move.`
      );

  const secondPrepHtml = free
    ? p(
        `<strong>Two.</strong> Keep a notebook nearby. Each day has a short action guide, and writing down what you notice is most of the work.`
      )
    : p(
        `<strong>Two.</strong> Your Day 1 action guide arrives by email before the first session, and each day's guide follows the same way. If a guide has not landed by an hour before that day's call, reply to this email and I will send it by hand.`
      );

  const bodyHtml = [
    p(`Hey ${name},`),
    p(
      `Your ${free ? 'free ' : ''}seat is saved for <strong>${esc(CHALLENGE.name)}</strong>. Seven days, live, ${esc(CHALLENGE.startLabel)} through ${esc(CHALLENGE.endLabel)}, ${esc(CHALLENGE.timeEt)} and ${esc(CHALLENGE.timeCt)}, ${esc(CHALLENGE.nightLength)} a day. You can watch from your own chair with the camera off.`
    ),
    zoomHtml(email),
    h2('The seven days'),
    nightsHtml(),
    p(
      `Every session has a replay, up for 48 hours afterward. If one evening is your grandson's ball game, watch the replay the next morning. The work still stacks.`
    ),
    h2('Two things before Day 1'),
    p(
      `<strong>One.</strong> Find your home blood pressure cuff and put it somewhere you will see it. That is the only equipment for the whole week.`
    ),
    secondPrepHtml,
    vipHtml,
    h2('The plain part'),
    guaranteeHtml,
    p(
      `And the thing that matters more than anything else in the week, said up front: you never start, stop, or adjust a medication on your own. Your doctor makes every one of those calls. Our job is to walk you in with better information than you have ever had.`
    ),
    p(`We will see you on the next live night, and the replays cover anything you missed.`),
    p(`Annie and Joel<br/><span style="color:${PALETTE.muted};font-size:14px;">Annie Chitate, RN &middot; Joel Polley, RN &middot; Louisville, Kentucky</span>`),
  ].join('');

  const bodyText = `Hey ${firstName || 'friend'},

Your ${free ? 'free ' : ''}seat is saved for ${CHALLENGE.name}. Seven days, live, ${CHALLENGE.startLabel} through ${CHALLENGE.endLabel}, ${CHALLENGE.timeEt} and ${CHALLENGE.timeCt}, ${CHALLENGE.nightLength} a day. You can watch from your own chair with the camera off.

${zoomText(email)}

THE SEVEN DAYS
${nightsText()}

Every session has a replay, up for 48 hours afterward.

TWO THINGS BEFORE DAY 1
One. Find your home blood pressure cuff. That is the only equipment for the whole week.
${
  free
    ? `Two. Keep a notebook nearby. Each day has a short action guide, and writing down what you notice is most of the work.`
    : `Two. Your Day 1 action guide arrives by email before the first session, and each day's guide follows the same way. If a guide has not landed by an hour before that day's call, reply to this email and I will send it by hand.`
}
${
  isVip
    ? `
YOUR BONUS DAY
You have the VIP seat, so you get a fourth live session: ${CHALLENGE.vipDayLabel} at ${CHALLENGE.vipTimeEt} (${CHALLENGE.vipTimeCt}), about ninety minutes.
It is a smaller, private session with Annie and Joel. It sits on Sunday because by then you finally have three days of your own readings to look at. We read real logs out loud together, including yours if you want it read, and show you what the pattern across a week is actually saying.
Then questions until they run out, and a second pass at the doctor conversation using whatever your own log turned up. The Bonus Day has a replay too.
`
    : ''
}
${
  free
    ? `YOUR SEAT IS FREE. Nothing was charged, nothing renews, and there is no fine print to read twice. The only thing this seat costs is showing up, and the replays cover you if life gets in the way.`
    : `YOUR GUARANTEE. Your seat is fully refundable for any reason right up until ${CHALLENGE.startLabel} at ${CHALLENGE.timeEt}. After that I cannot un-hold a live call, so here is what replaces it: attend or watch all seven sessions within the available replay period, complete your daily action guides, and finish your Personal Life Change Map. If you did the work and at the end of Day 7 you genuinely do not believe the week delivered the value of your ${priceLabel}, send us your completed Life Change Map by ${CHALLENGE.logDueLabel} (within 48 hours of Day 7) and we refund the full ${priceLabel}. No argument, no endless hoops. We are not guaranteeing a number on the scale, a blood pressure reading, or any medical outcome.`
}

You never start, stop, or adjust a medication on your own. Your doctor makes every one of those calls. Our job is to walk you in with better information than you have ever had.

We will see you on the next live night, and the replays cover anything you missed.

Annie and Joel
Annie Chitate, RN . Joel Polley, RN . Louisville, Kentucky`;

  return {
    html: emailShell(bodyHtml + footerHtml({ unsubUrl, provenance }), {
      preheader: `Seven days, ${CHALLENGE.startLabel} through ${CHALLENGE.endLabel}, ${CHALLENGE.timeEt}. Everything you need is in here.`,
    }),
    text: `${bodyText}\n\n${footerText({ unsubUrl, provenance })}`,
    unsubUrl,
  };
}

// ─── Email 2: interest capture (waitlist / dead checkout) ─────────────
// Never carries the Zoom link. Never implies a seat was reserved.
function interestEmail({ firstName, email, mode }) {
  const name = firstName ? esc(firstName) : 'friend';
  const unsubUrl = unsubUrlFor(email);
  const isSeatLink = mode === 'seat-link';
  const provenance = isSeatLink
    ? `you asked me to send you the seat link for ${CHALLENGE.name}`
    : `you asked to hear about the next ${CHALLENGE.name}`;

  const bodyHtml = [
    p(`Hey ${name},`),
    isSeatLink
      ? p(
          `You tried to grab a seat and checkout was not open. That one is on me, not on you. <strong>Nothing was charged.</strong>`
        )
      : p(`Registration for the ${esc(CHALLENGE.startLabel)} cohort is closed. Doors shut ${esc(CHALLENGE.closeLabel)} at midnight.`),
    isSeatLink
      ? p(
          `The second the payment link is working I will send it straight to this address. If you would rather not wait, reply to this email and I will sort it out with you directly.`
        )
      : p(
          `You are on the list. When I put the next challenge on the calendar you will hear from me before anyone else. No charge for being on the list, and no spam.`
        ),
    callout({
      kicker: 'While you wait',
      body: `The free BP quiz takes about two minutes and tells you which of the three pressures is loudest for you. <a href="${SITE_URL}/quiz" style="color:${PALETTE.clay};font-weight:600;">Take it here</a>.`,
    }),
    p(`Joel<br/><span style="color:${PALETTE.muted};font-size:14px;">Joel Polley, RN &middot; BraveWorks RN</span>`),
  ].join('');

  const bodyText = `Hey ${firstName || 'friend'},

${
  isSeatLink
    ? 'You tried to grab a seat and checkout was not open. That one is on me, not on you. Nothing was charged.\n\nThe second the payment link is working I will send it straight to this address. If you would rather not wait, reply to this email and I will sort it out with you directly.'
    : `Registration for the ${CHALLENGE.startLabel} cohort is closed. Doors shut ${CHALLENGE.closeLabel} at midnight.\n\nYou are on the list. When I put the next challenge on the calendar you will hear from me before anyone else. No charge for being on the list, and no spam.`
}

While you wait, the free BP quiz takes about two minutes and tells you which of the three pressures is loudest for you: ${SITE_URL}/quiz

Joel
Joel Polley, RN . BraveWorks RN`;

  return {
    html: emailShell(bodyHtml + footerHtml({ unsubUrl, provenance }), {
      preheader: isSeatLink
        ? 'Nothing was charged. I will send you the seat link as soon as it is working.'
        : 'You are on the list for the next challenge.',
    }),
    text: `${bodyText}\n\n${footerText({ unsubUrl, provenance })}`,
    unsubUrl,
  };
}

// ─── KV helpers ───────────────────────────────────────────────────────

// Enrich the CURRENT triangle store. Enrich-only, mirroring
// _masterclass-enroll.js: never reset state, never demote a buyer back to
// 'lead', never restart a timer. Non-fatal.
async function touchTriangleRecord(email, firstName, tags, { promoteToBuyer = false } = {}) {
  if (!process.env.KV_REST_API_URL) return;
  try {
    const key = `bwbp:drip:${email}`;
    const existing = await kv.get(key);
    const now = new Date().toISOString();
    if (existing) {
      await kv.set(key, {
        ...existing,
        firstName: existing.firstName || firstName,
        tags: Array.from(new Set([...(existing.tags || []), ...tags])),
        lastCaptureAt: now,
      });
      return;
    }
    await kv.set(key, {
      email,
      firstName,
      corner: null,
      readiness: null,
      scores: null,
      // A brand-new address that arrived by BUYING a seat is not a lead. An
      // address that only asked about the next cohort is.
      state: promoteToBuyer ? 'buyer' : 'lead',
      stateEnteredAt: now,
      enrolledAt: now,
      source: 'challenge-page',
      tags,
    });
  } catch (err) {
    console.warn('challenge-signup: triangle record enrich failed (non-fatal)', err.message);
  }
}

async function notifyJoel(subject, text) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await getResend().emails.send({
      from: FROM_INTERNAL,
      to: JOEL_EMAIL,
      subject,
      text,
    });
  } catch (err) {
    console.warn('challenge-signup: Joel notification failed (non-fatal)', err.message);
  }
}

// ─── Intent: register (paid seat) ─────────────────────────────────────
async function handleRegister(req, res) {
  const sessionId = clean(req.body?.sessionId || req.body?.session_id, 120);
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'invalidSession', message: 'Missing or malformed session id.' });
  }

  // The seat is proven by Stripe, not by anything the caller sent.
  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('challenge-signup: session retrieve failed', err.message);
    return res.status(404).json({ error: 'sessionNotFound' });
  }

  const md = session.metadata || {};
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  if (md.offer !== 'challenge' || md.cohort !== CHALLENGE.cohort) {
    console.warn(`challenge-signup: session ${sessionId} is not a ${CHALLENGE.cohort} challenge seat`);
    return res.status(400).json({ error: 'notAChallengeSeat' });
  }
  if (session.status !== 'complete' || !paid) {
    return res.status(402).json({ error: 'notPaid', status: session.status, paymentStatus: session.payment_status });
  }

  const rawEmail = session.customer_details?.email || '';
  if (!looksLikeValidEmail(rawEmail)) {
    console.error(`challenge-signup: paid session ${sessionId} has no usable email`);
    await notifyJoel(
      `Challenge seat paid but no email on the session (${sessionId})`,
      `A ${CHALLENGE.name} seat was paid for but Stripe returned no usable customer email, so the confirmation could not be sent.\n\nSession: ${sessionId}\nTier: ${md.tier || 'unknown'}\n\nLook the session up in Stripe, find the address, and register them by hand.`
    );
    return res.status(422).json({ error: 'noEmailOnSession' });
  }
  const email = rawEmail.trim().toLowerCase();
  const isVip = md.tier === 'challenge-vip' || md.seat === 'vip';
  const tier = isVip ? 'challenge-vip' : 'challenge-ga';
  const firstName = firstNameOf(session.customer_details?.name || '');

  // Idempotency, two layers.
  //   1. confirmationSentAt on the per-email record is the DURABLE dedupe. A
  //      buyer refreshing the confirmation page must never trigger a second
  //      email, and dedupe is by EMAIL, not by a per-request flag.
  //   2. A short-lived NX lock on the session id is only a concurrency guard
  //      for two tabs landing at the same instant. It is released when the
  //      send fails, so a paying customer can retry instead of being locked
  //      out of their own Zoom link, and it expires on its own regardless.
  const kvUp = Boolean(process.env.KV_REST_API_URL);
  if (kvUp) {
    try {
      const existing = await kv.get(K.reg(email));
      if (existing && existing.confirmationSentAt) {
        return res
          .status(200)
          .json({ ok: true, already: true, emailed: true, tier, firstName, email, cohort: CHALLENGE.cohort });
      }
    } catch (err) {
      console.warn('challenge-signup: registration lookup failed (continuing)', err.message);
    }

    try {
      const claimed = await kv.set(
        K.session(sessionId),
        { email, tier, at: new Date().toISOString() },
        { nx: true, ex: 900 }
      );
      if (!claimed) {
        return res.status(200).json({ ok: true, already: true, tier, firstName, email, cohort: CHALLENGE.cohort });
      }
    } catch (err) {
      // Fail open: a duplicate confirmation beats a paying customer with no
      // Zoom link. Same trade-off claimSession() makes in triangle-webhook.
      console.warn('challenge-signup: session claim failed (fail-open)', err.message);
    }
  }

  const record = {
    email,
    firstName,
    fullName: clean(session.customer_details?.name || ''),
    // 2026-08-09 (Joel): phone_number_collection is enabled on the challenge
    // Checkout Session (api/create-embedded-checkout.js), so Stripe asks for a
    // number at the pay screen and validates it. Read from the SESSION, never
    // from the request body, for the same reason the email is: a stranger must
    // not be able to attach their own number to somebody else's seat. Empty
    // string when absent so the field always exists on the record.
    phone: clean(session.customer_details?.phone || ''),
    tier,
    seat: isVip ? 'vip' : 'ga',
    cohort: CHALLENGE.cohort,
    challenge: 'three-pressures',
    amountCents: session.amount_subtotal ?? session.amount_total ?? null,
    currency: session.currency || 'usd',
    stripeSessionId: sessionId,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
    registeredAt: new Date().toISOString(),
    source: 'challenge-checkout',
    // Delivery obligations Joel owes this seat, written down so the ops
    // dashboard and any later cron can read them instead of re-deriving.
    // 2026-08-03: VIP gained the Bonus Day; the kit is VIP-only now. The paid
    // GA branch below is unreachable from the page (GA went free) but stays
    // correct for any in-flight session that paid $17 under the old terms.
    // 2026-08-17 ($97 cmlc-97 seat): what the LIVE page sells. No kit, no VIP.
    // (The isVip branch is unreachable from the live page; kept for any
    // in-flight legacy session.)
    owes: isVip
      ? ['three-nights', 'replays', 'workbook', 'kit', 'bonus-day', 'qa', '48-hour-answer']
      : ['seven-days', 'replays', 'daily-guides', 'life-change-map', 'labs-mini-training', 'qa', 'support-circle'],
    confirmationSentAt: null,
  };

  if (kvUp) {
    try {
      await kv.set(K.reg(email), record);
    } catch (err) {
      // The record is the durable truth. If it cannot be written, the seat is
      // effectively invisible to ops, so this one IS fatal and Stripe-side
      // proof still exists for a manual fix.
      console.error('challenge-signup: registration write failed', err.message);
      // Release the concurrency lock before bailing, exactly as the send-failure
      // path below does. Without this the buyer's own retry (a refresh of
      // /challenge-confirmed, or Stripe's webhook re-delivery) hits the lock,
      // reads as "already in progress", and the seat stays unwritten until the
      // 15 minute TTL expires. Their retry is the cheapest recovery we have.
      try {
        await kv.del(K.session(sessionId));
      } catch {
        /* the TTL clears it anyway */
      }
      await notifyJoel(
        `Challenge registration could not be saved (${email})`,
        `A paid ${CHALLENGE.name} seat could not be written to KV.\n\nEmail: ${email}\nTier: ${tier}\nSession: ${sessionId}\n\nRegister them by hand.`
      );
      return res.status(500).json({ error: 'storageFailed' });
    }
    try {
      // Dedupe by EMAIL, never by a per-request flag (2026-07-20 lesson).
      await kv.sadd(K.members, email);
      await kv.incr(K.count);
    } catch (err) {
      console.warn('challenge-signup: members/count write failed (non-fatal)', err.message);
    }
    await touchTriangleRecord(email, firstName, ['challenge-2026-08', isVip ? 'challenge-vip' : 'challenge-ga'], {
      promoteToBuyer: true,
    });
  }

  const { html, text } = registrationEmail({ firstName, isVip, email });
  const unsubUrl = unsubUrlFor(email);
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      campaign: 'challenge-seat-saved-paid',
      subject: `Your seat is saved: seven days, starting ${CHALLENGE.startLabel}`,
      html,
      text,
      ...(unsubUrl
        ? {
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }
        : {}),
    });
    if (kvUp) {
      try {
        await kv.set(K.reg(email), { ...record, confirmationSentAt: new Date().toISOString() });
      } catch {
        /* stamp only, non-fatal */
      }
    }
  } catch (err) {
    console.error('challenge-signup: confirmation send failed', err.message);
    // Release the concurrency lock so a refresh retries the send rather than
    // reading as "already confirmed". confirmationSentAt was never stamped, so
    // the durable dedupe correctly still says this seat is unconfirmed.
    if (kvUp) {
      try {
        await kv.del(K.session(sessionId));
      } catch {
        /* the 15 minute TTL clears it anyway */
      }
    }
    await notifyJoel(
      `Challenge confirmation did NOT send (${email})`,
      `A paid ${CHALLENGE.name} seat is registered but the confirmation email failed.\n\nEmail: ${email}\nTier: ${tier}\nSession: ${sessionId}\nError: ${err.message}\n\nThey have no Zoom details. Send them by hand.`
    );
    // The seat IS registered, so tell the page the truth: registered, not
    // emailed. It can show "check your email, and if nothing arrives reply".
    return res.status(200).json({
      ok: true,
      already: false,
      emailed: false,
      tier,
      firstName,
      email,
      cohort: CHALLENGE.cohort,
    });
  }

  await notifyJoel(
    `New ${isVip ? 'VIP' : 'GA'} seat: ${CHALLENGE.name}`,
    `${record.fullName || '(no name)'} <${email}>
Tier: ${tier}
Cohort: ${CHALLENGE.cohort}
Session: ${sessionId}
${isVip ? '\nVIP. You owe this person live Q and A after every night plus a written answer within 48 hours to every question they submit.' : ''}`
  );

  return res.status(200).json({
    ok: true,
    already: false,
    emailed: true,
    tier,
    firstName,
    email,
    cohort: CHALLENGE.cohort,
  });
}

// ─── Intent: free-register (the free GA seat, 2026-08-03) ─────────────
// GA went FREE on 2026-08-03 (Joel). The free seat carries the three nights,
// replays and workbook. It does NOT carry the kit: the kit moved into the $47
// VIP seat (Joel's explicit call, same day). This handler is the free seat's
// whole registration path: no Stripe, no session, proof of nothing beyond a
// working email address. It reuses the SAME K.reg record shape as the paid
// path so the ops dashboard, the digest, and any later cron read one shape.
async function handleFreeRegister(req, res) {
  const rawEmail = req.body?.email;
  if (!looksLikeValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'invalidEmail', message: 'Valid email is required' });
  }
  const email = rawEmail.trim().toLowerCase();
  const firstName = firstNameOf(req.body?.firstName || req.body?.name || '');

  const kvUp = Boolean(process.env.KV_REST_API_URL);

  // Idempotent by EMAIL, exactly like the paid path. A second submit (or a
  // paid VIP buyer who also fills the free form) never gets a second email.
  if (kvUp) {
    try {
      const existing = await kv.get(K.reg(email));
      if (existing && existing.confirmationSentAt) {
        return res
          .status(200)
          .json({ ok: true, already: true, emailed: true, tier: existing.tier || 'challenge-ga', firstName, email, cohort: CHALLENGE.cohort });
      }
    } catch (err) {
      console.warn('challenge-signup: free registration lookup failed (continuing)', err.message);
    }
  }

  const record = {
    email,
    firstName,
    fullName: clean(req.body?.name || firstName),
    // 2026-08-09 (Joel): OPTIONAL on the free seat. Same 7-15 digit shape check
    // the waitlist uses; anything else is stored empty rather than rejected, so
    // a mistyped number can never cost somebody a free seat. Body-sourced is
    // fine here because there is no payment to impersonate: the only thing a
    // bad actor could do is attach a wrong number to an address they already
    // typed. Never used for auto-SMS.
    phone: normalizePhoneOrEmpty(req.body?.phone),
    tier: 'challenge-ga',
    seat: 'ga',
    cohort: CHALLENGE.cohort,
    challenge: 'three-pressures',
    amountCents: 0,
    currency: 'usd',
    stripeSessionId: null,
    stripeCustomerId: null,
    registeredAt: new Date().toISOString(),
    source: 'challenge-free-registration',
    // NO 'kit' here. The kit belongs to VIP only since 2026-08-03. If you add
    // it back you are promising 17 downloads to every free signup.
    owes: ['three-nights', 'replays', 'workbook'],
    confirmationSentAt: null,
  };

  if (kvUp) {
    try {
      await kv.set(K.reg(email), record);
      await kv.sadd(K.members, email);
      await kv.incr(K.count);
    } catch (err) {
      console.error('challenge-signup: free registration write failed', err.message);
      return res.status(500).json({ error: 'storageFailed' });
    }
    // A free registrant is a LEAD, not a buyer. promoteToBuyer stays false.
    await touchTriangleRecord(email, firstName, ['challenge-2026-08', 'challenge-ga', 'challenge-free'], {
      promoteToBuyer: false,
    });
  }

  // 2026-08-24: server-side signup backstop. The night of Aug 23, KV recorded
  // ~30 signups while only 1 client-side signup event reached PostHog (ad
  // blockers eat posthog-js). This event fires from the server so it cannot be
  // blocked. DIFFERENT name from the client's chal_signup on purpose, so
  // nothing double-counts in existing queries. Reached only on a NEW
  // registration (the confirmationSentAt dedupe above already returned for
  // repeats), so one human = one event. Non-fatal by contract.
  await captureEvent({
    distinctId: email,
    event: 'chal_signup_server',
    properties: { cohort: CHALLENGE.cohort, tier: 'free', source: 'challenge-free-registration' },
  });

  const { html, text } = registrationEmail({ firstName, isVip: false, email, free: true });
  const unsubUrl = unsubUrlFor(email);
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      campaign: 'challenge-seat-saved-free',
      subject: `Your free seat is saved: seven days, starting ${CHALLENGE.startLabel}`,
      html,
      text,
      ...(unsubUrl
        ? {
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }
        : {}),
    });
    if (kvUp) {
      try {
        await kv.set(K.reg(email), { ...record, confirmationSentAt: new Date().toISOString() });
      } catch { /* stamp only, non-fatal */ }
    }
  } catch (err) {
    console.error('challenge-signup: free confirmation send failed', err.message);
    // The seat IS registered; tell the page the truth so it can say "check
    // your email, and if nothing arrives reply". No lock to release: the free
    // path has no session lock, and confirmationSentAt was never stamped, so
    // a resubmit retries the send.
    return res.status(200).json({ ok: true, already: false, emailed: false, tier: 'challenge-ga', firstName, email, cohort: CHALLENGE.cohort });
  }

  return res.status(200).json({ ok: true, already: false, emailed: true, tier: 'challenge-ga', firstName, email, cohort: CHALLENGE.cohort });
}

// ─── Intent: waitlist / seat-link (no seat, no Zoom link) ─────────────
async function handleInterest(req, res, mode) {
  const rawEmail = req.body?.email;
  if (!looksLikeValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'invalidEmail', message: 'Valid email is required' });
  }
  const email = rawEmail.trim().toLowerCase();
  const firstName = firstNameOf(req.body?.firstName || req.body?.name || '');
  const wantedTier = ['challenge-ga', 'challenge-vip'].includes(req.body?.tier) ? req.body.tier : null;
  // Phone (2026-08-04, Joel): the next-cohort waitlist now collects a phone
  // number. Digits only, 7-15 after stripping formatting; anything else is
  // stored as empty rather than rejected, so a bad phone never blocks the
  // email capture. Kept alongside the record, never used for auto-SMS.
  const phone = normalizePhoneOrEmpty(req.body?.phone);

  const kvUp = Boolean(process.env.KV_REST_API_URL);
  let already = false;
  if (kvUp) {
    try {
      const existing = await kv.get(K.interest(email));
      already = Boolean(existing && existing.email);
      await kv.set(K.interest(email), {
        email,
        firstName: firstName || existing?.firstName || '',
        cohort: CHALLENGE.cohort,
        reason: mode, // 'waitlist' | 'seat-link'
        phone: phone || existing?.phone || '',
        wantedTier: wantedTier || existing?.wantedTier || null,
        firstSeenAt: existing?.firstSeenAt || new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      });
      await kv.sadd(K.interestSet, email);
    } catch (err) {
      console.warn('challenge-signup: interest write failed (non-fatal)', err.message);
    }
    await touchTriangleRecord(email, firstName, ['challenge-interest', `challenge-${mode}`]);
  }

  // Second and later submissions from the same address get the record update
  // but no repeat email. Dedupe is by EMAIL.
  if (already) {
    return res.status(200).json({ ok: true, already: true });
  }

  const { html, text } = interestEmail({ firstName, email, mode });
  const unsubUrl = unsubUrlFor(email);
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject:
        mode === 'seat-link'
          ? 'Nothing was charged. I will send you the seat link.'
          : `You are on the list for the next ${CHALLENGE.name}`,
      html,
      text,
      ...(unsubUrl
        ? {
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }
        : {}),
    });
  } catch (err) {
    console.error('challenge-signup: interest send failed', err.message);
    // The address is captured either way, so do not tell the visitor it failed
    // when their name IS on the list. Surface it to Joel instead.
    await notifyJoel(
      `Challenge interest ack did NOT send (${email})`,
      `Captured ${email} as ${mode} for cohort ${CHALLENGE.cohort} but the acknowledgement email failed: ${err.message}`
    );
    return res.status(200).json({ ok: true, already: false, emailed: false });
  }

  if (mode === 'seat-link') {
    // A live buyer hit a dead checkout. Joel needs to know today, not in a
    // weekly report, because this is a sale in progress.
    await notifyJoel(
      `Challenge checkout was NOT open for a live buyer (${email})`,
      `${firstName || '(no name)'} <${email}> tried to buy a ${CHALLENGE.name} seat${wantedTier ? ` (${wantedTier})` : ''} and got the "checkout is not open yet" state.

Nothing was charged. They are expecting you to send them the seat link.

Cause is almost always CHALLENGE_GA_PRICE_ID / CHALLENGE_VIP_PRICE_ID missing in Vercel. Check the function logs for the exact reason code.`
    );
  }

  return res.status(200).json({ ok: true, already: false, emailed: true });
}

// ─── Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Kill switch, opt-OUT. See the env note in the header.
  if (process.env.CHALLENGE_SIGNUP_DISABLED === '1') {
    return res.status(410).json({ error: 'This signup has closed.', disabled: true });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body, expected JSON' });
  }

  const explicit = typeof req.body.intent === 'string' ? req.body.intent : '';
  const intent = explicit || (req.body.sessionId || req.body.session_id ? 'register' : 'waitlist');
  if (!['register', 'free-register', 'waitlist', 'seat-link'].includes(intent)) {
    return res.status(400).json({ error: 'unknownIntent' });
  }

  // Rate-limit FIRST so nobody can exhaust Resend or burn sender reputation.
  // free-register gets its own bucket: it is the page's PRIMARY signup now
  // (2026-08-03, GA went free), so it needs more headroom than the interest
  // forms, but it sends a real confirmation email so it cannot share
  // register's near-unlimited bucket either.
  const ip = getClientIp(req);
  const rl =
    intent === 'register'
      ? await checkRateLimit(ip, { prefix: 'cs-rl-reg', limit: 60 })
      : intent === 'free-register'
        ? await checkRateLimit(ip, { prefix: 'cs-rl-free', limit: 20 })
        : await checkRateLimit(ip, { prefix: 'cs-rl', limit: 10 });
  if (!rl.ok) {
    console.warn(`challenge-signup: rate-limited ip=${ip} intent=${intent} count=${rl.count}`);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    if (intent === 'register') return await handleRegister(req, res);
    // Doors (2026-08-05). A free seat can no longer be claimed after the close
    // instant, so the request degrades into the next-cohort waitlist instead of
    // being rejected: the person still gets captured and still gets an honest
    // answer, they just do not get a seat or a Zoom link. 'register' is
    // deliberately ABOVE this line. It is the paid path, and its seat was
    // already bought and paid for; refusing it here would take someone's money
    // and give them nothing. create-embedded-checkout.js is what stops new paid
    // sessions being created after the close.
    if (intent === 'free-register' && Date.now() >= CHALLENGE.closeMs) {
      console.warn('challenge-signup: free-register after doors closed, degrading to waitlist');
      return await handleInterest(req, res, 'waitlist');
    }
    if (intent === 'free-register') return await handleFreeRegister(req, res);
    return await handleInterest(req, res, intent);
  } catch (err) {
    console.error(`challenge-signup: unhandled failure (intent=${intent})`, err.message);
    return res.status(500).json({ error: 'signupFailed' });
  }
}
