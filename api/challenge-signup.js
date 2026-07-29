// api/challenge-signup.js — The Three Pressures Challenge, cohort 2026-08-04.
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
//     The ONLY path that emails the Zoom join details, because the Zoom room
//     IS the product. The seat is proven by retrieving the Stripe Checkout
//     Session server-side and requiring: status complete, payment_status paid,
//     metadata.offer === 'challenge', metadata.cohort === this cohort. The
//     buyer's address comes from the SESSION, never from the request body, so
//     a stranger cannot POST someone else's email and be sent the link.
//     Idempotent per session id and per email. 200 { ok, already, tier, ... }
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
import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';
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
  cohort: '2026-08-04',
  name: 'The Three Pressures Challenge',
  subtitle: 'Three nights live with Joel Polley, RN',
  // 2026-07-28 (Joel): the call moved to SEVEN PM EASTERN. It previously ran
  // 7:00pm CT, which is 8:00pm ET. 7:00pm ET is 6:00pm CT, so the instant below
  // is now expressed in EASTERN wall time and every label moved with it. The
  // same change is mirrored in src/pages/ChallengePage.jsx (START_ISO_ET) and
  // api/create-embedded-checkout.js (CHALLENGE_START_ET).
  startIsoEt: '2026-08-04T19:00:00',
  startLabel: 'Tuesday, August 4',
  endLabel: 'Thursday, August 6',
  timeEt: '7:00pm ET',
  timeCt: '6:00pm CT',
  timeWindowEt: '7:00pm to 8:00pm ET',
  nightLength: 'about 60 minutes',
  logDueLabel: 'Friday, August 7',
  refundByLabel: 'August 16',
  // 2026-07-27 (Joel): founding-cohort seat is $17 (the kit price). $97 is the
  // NEXT cohort. Must match ChallengePage SEAT_PRICE and what Stripe charges.
  seatPriceLabel: '$17',
  // 2026-07-28 (Joel): VIP is $47 and is now a seat sold on /challenge, not a
  // post-purchase upsell. It adds a FOURTH session on Sunday morning.
  // This key was referenced twice in the guarantee copy below but never
  // defined, so every VIP confirmation rendered the refund amount blank.
  vipPriceLabel: '$47',
  vipDayLabel: 'Sunday, August 9',
  vipTimeEt: '11:00am ET',
  vipTimeCt: '10:00am CT',
  vipLength: 'about 90 minutes',
  pageUrl: `${SITE_URL}/challenge`,
  nights: [
    { n: 1, date: 'Tuesday, August 4', title: 'Your Real Number' },
    { n: 2, date: 'Wednesday, August 5', title: 'The Three Pressures' },
    { n: 3, date: 'Thursday, August 6', title: 'The Conversation' },
  ],
};

// Zoom details for THIS cohort. Env only. There is deliberately no fallback to
// the weekly "Beyond the Cuff" room in _masterclass-enroll.js: that is a
// different, free class. Night 1 is a Tuesday, so it no longer collides with
// that Monday class, but they are still separate rooms and separate audiences.
const ZOOM = {
  url: (process.env.CHALLENGE_ZOOM_URL || '').trim(),
  meetingId: (process.env.CHALLENGE_ZOOM_MEETING_ID || '').trim(),
  passcode: (process.env.CHALLENGE_ZOOM_PASSCODE || '').trim(),
  icsUrl: (process.env.CHALLENGE_ZOOM_ICS_URL || '').trim(),
};

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
          <strong style="color:${PALETTE.ink};">Night ${night.n} &middot; ${night.date}</strong><br/>
          ${night.title}
        </td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">${rows}</table>`;
}

function nightsText() {
  return CHALLENGE.nights.map((n) => `Night ${n.n} . ${n.date} . ${n.title}`).join('\n');
}

// ─── Zoom block: honest when the room is not set up yet ───────────────
// CHALLENGE_ZOOM_URL is a placeholder until Joel creates the cohort's room. An
// email that prints a dead button is worse than one that says plainly that the
// link is coming, so the unset case renders a promise instead of a link.
function zoomHtml() {
  if (!ZOOM.url) {
    return callout({
      kicker: 'Your join link',
      body: `The Zoom room for this cohort goes out in its own email before ${esc(CHALLENGE.startLabel)}. Watch for it, and if it has not landed by Tuesday afternoon, reply to this email and I will send it to you by hand.`,
    });
  }
  const details = [
    ZOOM.meetingId ? `Meeting ID: <strong>${esc(ZOOM.meetingId)}</strong>` : '',
    ZOOM.passcode ? `Passcode: <strong>${esc(ZOOM.passcode)}</strong>` : '',
  ]
    .filter(Boolean)
    .join(' &middot; ');
  const ics = ZOOM.icsUrl
    ? `<p style="font-size:14px;line-height:1.6;color:${PALETTE.muted};margin:6px 0 0;"><a href="${esc(ZOOM.icsUrl)}" style="color:${PALETTE.clay};">Add all three nights to your calendar</a>.</p>`
    : '';
  return `<div style="background:${PALETTE.paperWarm};border-radius:12px;padding:20px 22px;margin:0 0 24px;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${PALETTE.sage};font-weight:700;margin-bottom:10px;">Your join link, save this email</div>
    ${ctaButton('Join the challenge on Zoom', esc(ZOOM.url))}
    ${details ? `<p style="font-size:14px;line-height:1.6;color:${PALETTE.inkSoft};margin:0;">${details}</p>` : ''}
    ${ics}
    <p style="font-size:13px;line-height:1.6;color:${PALETTE.muted};margin:10px 0 0;">The same link works all three nights.</p>
  </div>`;
}

function zoomText() {
  if (!ZOOM.url) {
    return `Your join link: the Zoom room for this cohort goes out in its own email before ${CHALLENGE.startLabel}. If it has not landed by Tuesday afternoon, reply to this email and I will send it by hand.`;
  }
  const bits = [`Join on Zoom: ${ZOOM.url}`];
  if (ZOOM.meetingId) bits.push(`Meeting ID: ${ZOOM.meetingId}`);
  if (ZOOM.passcode) bits.push(`Passcode: ${ZOOM.passcode}`);
  if (ZOOM.icsUrl) bits.push(`Add to calendar: ${ZOOM.icsUrl}`);
  bits.push('The same link works all three nights.');
  return bits.join('\n');
}

// ─── Email 1: paid seat confirmation ──────────────────────────────────
// Wording follows the approved /challenge copy document. Zero em dashes in
// visible copy. No clinical outcome promised anywhere. No seat count, no
// countdown, no scarcity: the only deadline is that Night 1 is live.
function registrationEmail({ firstName, isVip, email }) {
  const name = firstName ? esc(firstName) : 'friend';
  const unsubUrl = unsubUrlFor(email);
  const provenance = `you registered for ${CHALLENGE.name} at bpquiz.com/challenge`;

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
          `It sits on Sunday and not inside the week for one reason: by Sunday you finally have three days of your own readings to look at. There is nothing to look at on Tuesday. We read real logs out loud together, including yours if you want it read, and I show you what the pattern across a week is actually saying.`
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
  const guaranteeHtml = p(
    `<strong>Your guarantee.</strong> Your seat is fully refundable for any reason right up until ${esc(CHALLENGE.startLabel)} at ${esc(CHALLENGE.timeEt)}. Change your mind, reply REFUND, done. After that I cannot un-hold a live call, so here is what replaces it: be on all three nights or watch all three replays, then email me your completed 3-Day Log by ${esc(CHALLENGE.logDueLabel)}. If you did that and still feel the week was not worth ${esc(priceLabel)}, reply REFUND by ${esc(CHALLENGE.refundByLabel)} and I send back the full ${esc(priceLabel)}. You keep the kit, the workbook, and the replays. The 10-Day BP Reset Kit inside your seat also carries its own 30-day Feel-It-or-Free promise either way.`
  );

  const bodyHtml = [
    p(`Hey ${name},`),
    p(
      `Your seat is saved for <strong>${esc(CHALLENGE.name)}</strong>. Three nights, live, ${esc(CHALLENGE.startLabel)} through ${esc(CHALLENGE.endLabel)}, ${esc(CHALLENGE.timeEt)} and ${esc(CHALLENGE.timeCt)}, ${esc(CHALLENGE.nightLength)} a night. You can watch from your own chair with the camera off.`
    ),
    zoomHtml(),
    h2('The three nights'), // 3-night schedule
    nightsHtml(),
    p(
      `Every night has a replay, posted by noon CT the next day, and it is yours to keep. If Wednesday is your grandson's ball game, watch it Thursday morning. The work still stacks.`
    ),
    h2('Two things before Tuesday'),
    p(
      `<strong>One.</strong> Find your home blood pressure cuff and put it somewhere you will see it. That is the only equipment for the whole week.`
    ),
    p(
      `<strong>Two.</strong> Your 10-Day BP Reset Kit comes in a separate email from me. If it has not landed within the hour, reply to this one and I will send it by hand.`
    ),
    vipHtml,
    h2('The plain part'),
    guaranteeHtml,
    p(
      `And the thing that matters more than anything else in the week, said up front: you never start, stop, or adjust a medication on your own. Your doctor makes every one of those calls. My job is to walk you in with better information than you have ever had.`
    ),
    p(`I will see you Tuesday night.`),
    p(`Joel<br/><span style="color:${PALETTE.muted};font-size:14px;">Joel Polley, RN &middot; BraveWorks RN &middot; Louisville, Kentucky</span>`),
  ].join('');

  const bodyText = `Hey ${firstName || 'friend'},

Your seat is saved for ${CHALLENGE.name}. Three nights, live, ${CHALLENGE.startLabel} through ${CHALLENGE.endLabel}, ${CHALLENGE.timeEt} and ${CHALLENGE.timeCt}, ${CHALLENGE.nightLength} a night. You can watch from your own chair with the camera off.

${zoomText()}

THE THREE NIGHTS
${nightsText()}

Every night has a replay, posted by noon CT the next day, and it is yours to keep.

TWO THINGS BEFORE TUESDAY
One. Find your home blood pressure cuff. That is the only equipment for the whole week.
Two. Your 10-Day BP Reset Kit comes in a separate email. If it has not landed within the hour, reply to this one and I will send it by hand.
${
  isVip
    ? `
YOUR BONUS DAY
You have the VIP seat, so you get a fourth live session: ${CHALLENGE.vipDayLabel} at ${CHALLENGE.vipTimeEt} (${CHALLENGE.vipTimeCt}), about ninety minutes.
It sits on Sunday because by then you finally have three days of your own readings to look at. We read real logs out loud together, including yours if you want it read, and I show you what the pattern across a week is actually saying.
Then questions until they run out, and a second pass at the doctor conversation using whatever your own log turned up. The Bonus Day has a replay too.
`
    : ''
}
YOUR GUARANTEE. Your seat is fully refundable for any reason right up until ${CHALLENGE.startLabel} at ${CHALLENGE.timeEt}. After that I cannot un-hold a live call, so here is what replaces it: be on all three nights or watch all three replays, then email me your completed 3-Day Log by ${CHALLENGE.logDueLabel}. If you did that and still feel the week was not worth ${priceLabel}, reply REFUND by ${CHALLENGE.refundByLabel} and I send back the full ${priceLabel}. You keep the kit, the workbook, and the replays. The kit also carries its own 30-day Feel-It-or-Free promise either way.

You never start, stop, or adjust a medication on your own. Your doctor makes every one of those calls. My job is to walk you in with better information than you have ever had.

I will see you Tuesday night.

Joel
Joel Polley, RN . BraveWorks RN . Louisville, Kentucky`;

  return {
    html: emailShell(bodyHtml + footerHtml({ unsubUrl, provenance }), {
      preheader: `Three nights, ${CHALLENGE.startLabel} through ${CHALLENGE.endLabel}, ${CHALLENGE.timeEt}. Everything you need is in here.`,
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
      : p(`Registration for the ${esc(CHALLENGE.startLabel)} cohort is closed. Night 1 is already underway.`),
    isSeatLink
      ? p(
          `The second the payment link is working I will send it straight to this address. If you would rather not wait, reply to this email and I will sort it out with you directly.`
        )
      : p(
          `You are on the list. When I put the next three nights on the calendar you will hear from me before anyone else. No charge for being on the list, and no spam.`
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
    : `Registration for the ${CHALLENGE.startLabel} cohort is closed. Night 1 is already underway.\n\nYou are on the list. When I put the next three nights on the calendar you will hear from me before anyone else. No charge for being on the list, and no spam.`
}

While you wait, the free BP quiz takes about two minutes and tells you which of the three pressures is loudest for you: ${SITE_URL}/quiz

Joel
Joel Polley, RN . BraveWorks RN`;

  return {
    html: emailShell(bodyHtml + footerHtml({ unsubUrl, provenance }), {
      preheader: isSeatLink
        ? 'Nothing was charged. I will send you the seat link as soon as it is working.'
        : 'You are on the list for the next three nights.',
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
    owes: isVip ? ['three-nights', 'replays', 'workbook', 'kit', 'qa', '48-hour-answer'] : ['three-nights', 'replays', 'workbook', 'kit'],
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
      subject: `Your seat is saved: three nights, starting ${CHALLENGE.startLabel}`,
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

// ─── Intent: waitlist / seat-link (no seat, no Zoom link) ─────────────
async function handleInterest(req, res, mode) {
  const rawEmail = req.body?.email;
  if (!looksLikeValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'invalidEmail', message: 'Valid email is required' });
  }
  const email = rawEmail.trim().toLowerCase();
  const firstName = firstNameOf(req.body?.firstName || req.body?.name || '');
  const wantedTier = ['challenge-ga', 'challenge-vip'].includes(req.body?.tier) ? req.body.tier : null;

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
  if (!['register', 'waitlist', 'seat-link'].includes(intent)) {
    return res.status(400).json({ error: 'unknownIntent' });
  }

  // Rate-limit FIRST so nobody can exhaust Resend or burn sender reputation.
  const ip = getClientIp(req);
  const rl =
    intent === 'register'
      ? await checkRateLimit(ip, { prefix: 'cs-rl-reg', limit: 60 })
      : await checkRateLimit(ip, { prefix: 'cs-rl', limit: 10 });
  if (!rl.ok) {
    console.warn(`challenge-signup: rate-limited ip=${ip} intent=${intent} count=${rl.count}`);
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    if (intent === 'register') return await handleRegister(req, res);
    return await handleInterest(req, res, intent);
  } catch (err) {
    console.error(`challenge-signup: unhandled failure (intent=${intent})`, err.message);
    return res.status(500).json({ error: 'signupFailed' });
  }
}
