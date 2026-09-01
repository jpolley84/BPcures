// AllInPage (route: /allin) — "Life Change Accelerator" CHECKOUT.
//
// ── 2026-08-30: THIS PAGE TAKES MONEY AGAIN ──────────────────────────────
// Joel supplied a finished design (life_change_accelerator_checkout_v2.html)
// and asked for it wired up, with the checkout section made into the real
// Stripe checkout. So this is no longer the application page it had been
// since 2026-08-10. It is a direct-response checkout: $500 deposit, credited
// toward a $7,500 investment, balance scheduled on /payment.
//
// The design is HIS, ported rather than reinvented. His CSS is kept close to
// verbatim, with two deliberate changes:
//   1. EVERY selector is scoped under `.lca`. His file was a standalone
//      document and styled bare `body`, `h1`, `input`, `details` and `footer`.
//      Dropped into this SPA unscoped, those rules survive client-side
//      navigation and restyle every other page the visitor then visits.
//   2. The payment form is gone. His markup had name/email/phone inputs and a
//      placeholder card box, with a comment in his own file saying not to
//      collect raw card data in custom HTML. It is right. Stripe's embedded
//      checkout collects email and card itself, so hand-rolled duplicates of
//      those fields are both redundant and a liability.
//
// ── WHAT JOEL ASKED FOR ON TOP OF THE DESIGN ─────────────────────────────
//   - The checkout section is the real Stripe checkout (allin-deposit, $500).
//   - Annie and Joel's photo is on the page.
//   - A guarantee section ABOVE THE FOLD: the 30-day feel-it guarantee. His
//     design only had it far down the left column plus a small note inside
//     the payment card, so the band above the checkout grid is new.
//
// ── ⚠️ TWO THINGS THAT WILL BITE IF LEFT ALONE ───────────────────────────
//   1. CLOSE_AT is a REAL deadline, and when it passes this page STOPS
//      SELLING. That is his design ("Enrollment Closed"). It is also two days
//      out. If nobody moves the date, /allin quietly stops taking money.
//      Softened only in that the closed state still routes to /apply instead
//      of dead-ending on a disabled button, because a dead end here is a lost
//      lead on top of a lost sale.
//   2. SPOTS is a scarcity claim shown to customers. It must stay true. The
//      workspace already has a fake compare-at flagged on Annie's /rising
//      page; a spot counter that never moves is the same defect.
//
// ── RULES THIS FILE STILL KEEPS ──────────────────────────────────────────
// Not wrapped in SiteLayout (focused page, no nav to leak clicks).
// ZERO em dashes in visible copy: his supplied copy had several and they are
// converted to colons or commas, wording otherwise untouched.
// No testimonials. Still nothing in testimonials/CONSENT-LOG.md cleared to
// appear as a coaching result beside this price, so the page ships without
// proof rather than with invented proof.
// Education alongside the doctor, never a replacement. The guarantee says in
// writing that it does not promise a medical result.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';
import { zonedInstant } from '../utils/tz.js';
import heroImg from '../assets/annie-joel-scrubs.jpg';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// ─── the numbers. One place each. ────────────────────────────────────────
const DEPOSIT = '$500';
const PRICE = '$7,500';
const BALANCE = '$7,000';
const TOTAL_VALUE = '$21,500';

// ⚠️ Live scarcity claim, rendered to customers twice. Keep it true.
const SPOTS = 9;

// ⚠️ REAL DEADLINES, from Joel's design. He wrote Central and the page says
// "CT" out loud, so there is no ambiguity for the reader. Both labels below
// are DERIVED from these instants, never typed twice, because the one thing
// that reliably rots on a page like this is a hand-typed date left behind
// after the constant moved.
const FAST_ACTION_ISO_CT = '2026-08-31T23:59:59';
const CLOSE_ISO_CT = '2026-09-01T23:59:59';
const FAST_ACTION_AT = zonedInstant(FAST_ACTION_ISO_CT, 'America/Chicago');
const CLOSE_AT = zonedInstant(CLOSE_ISO_CT, 'America/Chicago');

const ctDate = (d) => new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Chicago',
}).format(d);
const ctTime = (d) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago',
}).format(d);

const CLOSE_LABEL = `${ctDate(CLOSE_AT)} at ${ctTime(CLOSE_AT)} CT`;
const FAST_LABEL = `${ctDate(FAST_ACTION_AT)} at ${ctTime(FAST_ACTION_AT)} CT`;

// The long label wraps to two lines on a 375px phone and the red bar grows to
// 105px, which is an eighth of the screen spent on a date. Same instant, same
// derivation, fewer characters. Shown only under 560px.
const CLOSE_LABEL_SHORT = `${new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Chicago',
}).format(CLOSE_AT)} · ${ctTime(CLOSE_AT)} CT`;

// ─── the offer stack, from the LIVE, NOT JUST EXIST deck ─────────────────
const PHASES = [
  {
    kicker: 'Step 1',
    title: 'The Life-Change Blueprint',
    value: 'Your numbers',
    items: [
      'Finally know what YOUR body needs, and do it in about 15 minutes a day',
      '12 weeks of nurse-led transformation, so you stop guessing and get lasting results',
      'Weekly coaching plus live Q&A, with your questions answered in real time',
      'Answers in language you can understand and actually implement',
    ],
    payoff: 'Do less, in the right order. That is the whole method.',
  },
  {
    kicker: 'Step 2',
    title: 'Understand what your body is saying',
    value: 'Clarity',
    items: [
      'Know Your Labs: understand your numbers and walk into your appointment able to talk about them without fear',
      'Decode Your Symptoms System: finally understand what your body has been trying to tell you',
      'The Normal Numbers Blueprint: get your numbers into a range you can be proud of',
      'Doctor Conversation Guide, root-driver clarity and symptom sorting',
    ],
    payoff: 'You stop being a passenger in your own health.',
  },
  {
    kicker: 'Step 3',
    title: 'Make it work in your real life',
    value: 'Food + movement',
    items: [
      'Food That Loves You Back Playbook: meals your family LOVES that are deeply nourishing, so you pass on generational health',
      '90 days of budget-friendly meal plans, plus our food experts',
      'The Easy-Fit System: the right kind of movement for YOU, personalized, that keeps working for up to 48 hours',
      'Age-appropriate and doable even if you are starting from a chair or a wheelchair',
      'Herbs and Supplements Guidance: not more supplements, a few of the right ones in the right order',
    ],
    payoff: 'Less is more. Let your body lose the weight.',
  },
  {
    kicker: 'Step 4',
    title: 'Get your life back, not just your numbers',
    value: 'The whole you',
    items: [
      'Bring Sexy Back: get your energy, your confidence and your drive back',
      'The Healing Circle: community, accountability, guidance and 24-hour support',
      'Exclusive access to our expert team, including a naturopath, a trauma expert and 36 years of nurse advice',
      'A full year with us, not just the 90 days',
    ],
    payoff: 'Community is everything. Stop doing this alone.',
  },
];

// The email's three bonuses, in its own words.
const BONUSES = [
  {
    name: 'Two For One',
    body: 'Bring someone you love with you. Healing, with built-in accountability.',
  },
  {
    name: 'Skin + Hair Bonus',
    body: 'Learn with Annie how to create your own natural skin and hair products and, if you want, how to turn what you make into something you can sell.',
  },
  {
    name: 'One-on-One Coaching Session',
    body: 'Personal eyes on YOUR situation, so you can win well before the 90 days are up, even though you have a full year with us.',
  },
];

// Deck slide 9. The reason any of this matters.
const SO_YOU_CAN = [
  'Be there',
  'Be healed',
  'Enjoy the kids',
  'Bring sexy back',
  'Take the trip',
  'Write the book',
  'Run the business',
  'Say YES to purpose',
];

const FAQ = [
  {
    q: 'What am I paying today?',
    a: `${DEPOSIT} today. It is credited toward the full ${PRICE} Life Change Accelerator investment.`,
  },
  {
    q: 'What happens with the remaining balance?',
    a: `After your ${DEPOSIT} deposit, the remaining ${BALANCE} is placed on the payment schedule you choose. `
      + 'Payment terms are available up to 12 months, and you pick yours on the next page.',
  },
  {
    q: `Why are there only ${SPOTS} spots?`,
    a: 'This program includes personalized review, case management and ongoing human support. The cohort is '
      + 'intentionally limited so the team can actually pay attention to the people inside it.',
  },
  {
    q: 'What happens right after I reserve?',
    a: 'You choose your payment schedule, then you receive onboarding instructions, complete your Personal '
      + 'Health Review, and begin identifying your top priorities and first 90-day plan.',
  },
];

const GUARANTEE_BODY = 'Give us 30 days of honest participation. Complete your Personal Health Review, attend '
  + 'your scheduled coaching, and follow the first-step plan you agree on with your team. If, before the 30-day '
  + 'window closes, you still cannot point to a meaningful shift in your clarity, confidence, consistency, or an '
  + 'agreed personal progress marker, tell us. We’ll review your participation with you and, if you met the '
  + 'participation requirements, refund the program payments you made to us.';

const GUARANTEE_SMALL = 'This guarantee does not promise a specific medical result and does not replace '
  + 'individualized medical care. Individual outcomes vary.';

// ─── Joel's stylesheet, scoped. See the note at the top of the file for why
// every selector carries the `.lca` prefix. ──────────────────────────────
const CSS = `
.lca {
  --ivory:#fbf8f0; --paper:#fff; --ink:#111; --muted:#6b675f; --line:#ded8cc;
  --gold:#d7aa28; --gold-soft:#f7edc9; --red:#c9252d; --red-dark:#a91920;
  --shadow:0 18px 46px rgba(32,26,13,.10); --radius:18px; --max:1180px;
  background:var(--ivory); color:var(--ink); line-height:1.5;
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased; min-height:100vh;
}
.lca *,.lca *::before,.lca *::after { box-sizing:border-box; }
.lca a { color:inherit; }

.lca .closebar { background:var(--red); color:#fff; border-bottom:1px solid rgba(0,0,0,.12); }
.lca .closebar.is-closed { background:var(--ink); }
.lca .closebar-inner { max-width:var(--max); margin:0 auto; padding:10px 24px 12px;
  display:grid; grid-template-columns:1fr auto; gap:18px; align-items:center; }
.lca .close-copy { font-size:12px; font-weight:850; letter-spacing:.055em; text-transform:uppercase; }
.lca .countdown { display:flex; align-items:center; gap:7px; font-variant-numeric:tabular-nums; }
.lca .time-box { min-width:49px; background:#fff; color:var(--red-dark); border-radius:7px;
  padding:6px 7px 5px; text-align:center; line-height:1; box-shadow:inset 0 0 0 1px rgba(0,0,0,.05); }
.lca .time-num { display:block; font-weight:900; font-size:18px; letter-spacing:-.02em; }
.lca .time-label { display:block; margin-top:3px; font-size:8px; font-weight:800;
  letter-spacing:.08em; text-transform:uppercase; }

.lca .page { max-width:var(--max); margin:0 auto; padding:46px 24px 72px; }
.lca .brand-line { display:flex; align-items:center; gap:11px; margin-bottom:16px;
  font-size:12px; font-weight:900; letter-spacing:.11em; text-transform:uppercase; }
.lca .brand-line::before { content:""; width:34px; height:4px; border-radius:99px; background:var(--gold); }
.lca h1 { font-size:clamp(38px,5.4vw,68px); line-height:1; letter-spacing:-.05em;
  margin:0 0 17px; max-width:820px; }
.lca .subhead { max-width:800px; color:#3f3b34; font-size:clamp(17px,2vw,20px); margin-bottom:24px; }
.lca .program-strip { display:flex; flex-wrap:wrap; gap:10px; margin:22px 0 0; }
.lca .program-pill { padding:8px 11px; border:1px solid var(--line); background:rgba(255,255,255,.62);
  border-radius:999px; font-size:13px; font-weight:750; }
.lca .program-pill strong { font-weight:900; }

/* ── the above-the-fold guarantee band (Joel, 2026-08-30) ── */
.lca .save-spot { display:block; text-decoration:none; text-align:center; background:var(--ink);
  color:#fff; border-radius:12px; padding:16px 22px; margin:0 0 18px; font-size:19px;
  font-weight:900; letter-spacing:-.02em; box-shadow:var(--shadow);
  transition:transform .12s ease, background .12s ease; }
.lca .save-spot:hover { transform:translateY(-1px); background:#242424; }
.lca .save-spot-sub { display:block; margin-top:4px; font-size:12.5px; font-weight:750;
  letter-spacing:0; color:#cfc9bd; }

.lca .guarantee-band { display:grid; grid-template-columns:auto minmax(0,1fr); gap:18px;
  align-items:start; background:var(--ink); color:#fff; border-radius:var(--radius);
  padding:20px 22px; margin-bottom:0; }
.lca .guarantee-seal { width:74px; height:74px; border-radius:50%; display:grid; place-content:center;
  text-align:center; border:2px solid var(--gold); color:var(--gold); line-height:1.05; }
.lca .guarantee-seal .n { display:block; font-size:25px; font-weight:950; letter-spacing:-.04em; }
.lca .guarantee-seal .d { display:block; font-size:9px; font-weight:900; letter-spacing:.1em; }
.lca .guarantee-band h2 { font-size:23px; letter-spacing:-.03em; margin:2px 0 6px; }
.lca .guarantee-band p { margin:0; color:#ece7dd; font-size:14.5px; }
.lca .guarantee-band .more { display:inline-block; margin-top:9px; font-size:13px; font-weight:850;
  color:var(--gold); }

.lca .checkout-grid { margin-top:34px; display:grid; grid-template-columns:minmax(0,1.18fr) minmax(360px,.82fr);
  gap:42px; align-items:start; }
.lca .offer-side { min-width:0; }

/* ── who you are doing this with ── */
.lca .coaches { display:flex; align-items:center; gap:15px; border:1px solid var(--line);
  background:rgba(255,255,255,.72); border-radius:var(--radius); padding:14px 16px; margin-bottom:8px; }
.lca .coaches img { width:78px; height:78px; border-radius:50%; object-fit:cover;
  object-position:50% 22%; flex:none; }
.lca .coaches .who { font-size:16px; font-weight:900; letter-spacing:-.02em; margin:0 0 3px; }
.lca .coaches .what { font-size:13.5px; color:var(--muted); margin:0; }

.lca .offer-summary { padding:25px 0 22px; border-top:1px solid var(--line); }
.lca .offer-summary h2,.lca .section h2 { font-size:29px; line-height:1.08; letter-spacing:-.035em; margin:0 0 9px; }
.lca .offer-summary p,.lca .section p { margin:0; color:var(--muted); }
.lca .phase { padding:25px 0 27px; border-top:1px solid var(--line); }
.lca .phase-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:12px; }
.lca .phase-kicker { font-size:11px; font-weight:900; letter-spacing:.11em; text-transform:uppercase;
  color:#5f584b; margin-bottom:6px; }
.lca .phase h3 { font-size:25px; line-height:1.08; letter-spacing:-.025em; margin:0; }
.lca .value-tag { white-space:nowrap; padding:7px 10px; border-radius:8px; background:var(--gold-soft);
  border:1px solid #e9d58d; font-size:12px; font-weight:900; }
.lca .phase ul,.lca .bonus-list,.lca .check-list { list-style:none; padding:0; margin:0; }
.lca .phase li,.lca .bonus-list li,.lca .check-list li { position:relative; padding:7px 0 7px 26px; font-size:15.5px; }
.lca .phase li::before,.lca .bonus-list li::before,.lca .check-list li::before {
  content:"✓"; position:absolute; left:0; top:7px; color:#b88700; font-weight:950; }
.lca .micro-payoff { margin-top:14px; font-weight:780; color:#24211d; }

.lca .bonus-box,.lca .guarantee-box,.lca .fast-box,.lca .value-box {
  border:1px solid var(--line); border-radius:var(--radius); padding:23px; margin-top:22px;
  background:rgba(255,255,255,.76); }
.lca .bonus-box h3,.lca .guarantee-box h3,.lca .fast-box h3,.lca .value-box h3 {
  margin:0 0 7px; font-size:22px; letter-spacing:-.025em; }
.lca .fast-box { background:#fffdf7; border-color:#ddc77f; }
.lca .fast-deadline { margin-top:14px; font-size:13px; font-weight:850; color:#594817; }
.lca .fast-countdown { margin-top:5px; font-size:25px; font-weight:900; letter-spacing:-.035em;
  font-variant-numeric:tabular-nums; }
.lca .soyoucan-box { border:1px solid var(--line); border-radius:var(--radius); padding:23px;
  margin-top:22px; background:rgba(255,255,255,.76); }
.lca .soyoucan-box h3 { margin:0 0 14px; font-size:22px; letter-spacing:-.025em; }
.lca .soyoucan-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:9px 18px; }
.lca .soyoucan-grid span { font-size:16px; font-weight:750; }
.lca .soyoucan-grid span::before { content:"✓"; color:#b88700; font-weight:950; margin-right:8px; }

.lca .value-box { background:var(--ink); color:#fff; border:0; }
.lca .value-box .phase-kicker { color:#cfc9bd; }
.lca .value-total { display:flex; align-items:baseline; justify-content:space-between; gap:20px;
  margin-top:9px; padding-top:15px; border-top:1px solid rgba(255,255,255,.2); }
.lca .value-total span:first-child { color:#d7d2c8; font-size:14px; }
.lca .value-total strong { font-size:34px; letter-spacing:-.04em; }

.lca .payment-card { position:sticky; top:18px; border:1px solid #d7d0c4; border-radius:22px;
  background:var(--paper); box-shadow:var(--shadow); overflow:hidden; }
.lca .payment-head { padding:23px 24px 18px; border-bottom:1px solid var(--line); }
.lca .spots { display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:900;
  letter-spacing:.08em; text-transform:uppercase; background:var(--ink); color:#fff;
  border-radius:999px; padding:8px 11px; margin-bottom:15px; }
.lca .spots-dot { width:7px; height:7px; border-radius:50%; background:var(--gold); }
.lca .payment-head h2 { font-size:30px; line-height:1.04; letter-spacing:-.04em; margin:0 0 8px; }
.lca .payment-head p { margin:0; color:var(--muted); font-size:14px; }

.lca .price-block { padding:19px 24px; background:#faf7ee; border-bottom:1px solid var(--line); }
.lca .price-line { display:flex; align-items:baseline; justify-content:space-between; gap:16px;
  padding:4px 0; font-size:14px; }
.lca .price-line strong { font-size:15px; }
.lca .strike { text-decoration:line-through; color:#79736a; }
.lca .due-now { margin-top:12px; padding-top:14px; border-top:1px solid var(--line);
  display:flex; align-items:baseline; justify-content:space-between; gap:18px; }
.lca .due-now .label { font-weight:850; }
.lca .due-now .amount { font-size:38px; font-weight:950; letter-spacing:-.05em; }

.lca .payment-body { padding:22px 24px 24px; }
.lca .mini-guarantee { border:1px solid #ead999; background:#fffaf0; border-radius:13px;
  padding:13px 14px; margin-bottom:19px; font-size:13px; line-height:1.42; }
.lca .mini-guarantee strong { display:block; margin-bottom:3px; }
.lca .stripe-mount { min-height:320px; }
.lca .pay-error { border:1px solid #e6b8ba; background:#fdf3f3; color:#8d2026; border-radius:10px;
  padding:13px 14px; font-size:13.5px; line-height:1.5; }
.lca .pay-error a { font-weight:850; }
.lca .closed-panel { text-align:center; padding:6px 0 2px; }
.lca .closed-panel h3 { margin:0 0 8px; font-size:20px; letter-spacing:-.02em; }
.lca .closed-panel p { margin:0 0 16px; font-size:14px; color:var(--muted); }
.lca .closed-panel a { display:block; text-decoration:none; background:var(--ink); color:#fff;
  border-radius:11px; padding:15px 18px; font-size:15px; font-weight:900; }
.lca .secure-note { text-align:center; color:#6c655b; font-size:12px; margin-top:12px; }
.lca .terms-note { font-size:12px; color:#6c655b; margin-top:14px; line-height:1.5; }
.lca .next-steps { padding:22px 24px; border-top:1px solid var(--line); background:#faf7ee; }
.lca .next-steps h3 { margin:0 0 9px; font-size:17px; }
.lca .next-steps ol { margin:0; padding-left:20px; color:#3a362f; font-size:13px; }
.lca .next-steps li { padding:3px 0; }

.lca .section { border-top:1px solid var(--line); padding-top:31px; margin-top:40px; }
.lca .guarantee-box { background:#191919; color:#fff; border:0; }
.lca .guarantee-box .phase-kicker { color:#d6c889; }
.lca .guarantee-box p { color:#ece7dd; margin-bottom:0; }
.lca .guarantee-box .small { font-size:12px; color:#bbb5aa; margin-top:13px; }
.lca .faq { display:grid; gap:10px; }
.lca details { border:1px solid var(--line); border-radius:12px; padding:0 16px; background:rgba(255,255,255,.68); }
.lca summary { cursor:pointer; list-style:none; padding:16px 0; font-weight:820; }
.lca summary::-webkit-details-marker { display:none; }
.lca details p { margin:-3px 0 17px; font-size:14px; color:#5e574d; }

.lca .scroll-prompt { display:none; }

.lca .apply-out { margin-top:26px; font-size:13.5px; color:var(--muted); text-align:center; }
.lca .apply-out a { font-weight:850; color:var(--ink); }

.lca footer { max-width:var(--max); margin:0 auto; padding:24px 24px 48px; color:#7a7268;
  font-size:11px; border-top:1px solid var(--line); }
.lca .footer-links { display:flex; flex-wrap:wrap; gap:14px; margin-bottom:10px; }
.lca .mobile-cta { display:none; }

@media (max-width:880px) {
  .lca .closebar-inner { grid-template-columns:1fr; gap:8px; }
  .lca .countdown { justify-content:flex-start; }
  .lca .page { padding-top:34px; }
  .lca .checkout-grid { grid-template-columns:1fr; gap:28px; }
  .lca .payment-card { position:static; }

  /* Joel, 2026-08-30: the checkout goes UP. Stacked, the payment card used
     to land after every phase, bonus, value block and FAQ, about 5,000px
     down. Reordering rather than moving it in the markup keeps the desktop
     two-column layout exactly as designed, and keeps the DOM order sane for
     a screen reader (offer, then checkout, then the prompt). */
  .lca .payment-card { order:1; }
  .lca .scroll-prompt { order:2; }
  .lca .offer-side { order:3; }

  .lca .scroll-prompt { display:flex; align-items:center; justify-content:center; gap:10px;
    text-decoration:none; border:1px dashed #c6bda9; border-radius:999px; padding:13px 18px;
    margin:-6px 0 -4px; color:#5f584b; background:rgba(255,255,255,.5); }
  .lca .scroll-prompt-t { font-size:13.5px; font-weight:850; letter-spacing:.01em; }
  .lca .scroll-prompt-a { font-size:16px; font-weight:900; color:var(--ink); }
  .lca .mobile-cta { display:block; position:sticky; bottom:0; z-index:30;
    background:rgba(251,248,240,.96); border-top:1px solid var(--line);
    padding:10px 14px max(10px,env(safe-area-inset-bottom)); backdrop-filter:blur(10px); }
  .lca .mobile-cta a { display:block; text-decoration:none; text-align:center; background:var(--ink);
    color:#fff; padding:14px 16px; border-radius:10px; font-weight:900; }
}
@media (max-width:560px) {
  .lca h1 { font-size:41px; margin-bottom:10px; }
  .lca .page { padding-left:18px; padding-right:18px; padding-top:26px; }
  .lca .phase h3 { font-size:22px; }
  .lca .payment-head h2 { font-size:26px; }
  .lca .time-box { min-width:44px; }
  .lca .time-num { font-size:16px; }
  .lca .phase-head { align-items:flex-start; }
  /* Joel asked for the guarantee above the fold. On a 375x812 phone his
     desktop spacing pushed the band's top to 679px, so only the seal peeked
     over the edge. Everything below buys back the ~110px that lets the seal,
     the heading and the body land on the first screen. The band stays a
     two-column layout here rather than stacking, because stacking the seal
     above the text costs more height than the seal is worth. */
  .lca .subhead { margin-bottom:16px; font-size:16.5px; }
  .lca .program-strip { gap:8px; margin:16px 0 0; }
  .lca .program-pill { padding:7px 10px; font-size:12.5px; }
  .lca .brand-line { margin-bottom:12px; }
  .lca .guarantee-band { padding:15px; gap:13px; margin-bottom:0; }
  .lca .guarantee-seal { width:56px; height:56px; }
  .lca .guarantee-seal .n { font-size:20px; }
  .lca .guarantee-band h2 { font-size:20px; }
  .lca .guarantee-band p { font-size:14px; }
}
.lca .narrow-only { display:none; }

/* Touch targets. Measured on the live page at 375px: these links rendered
   16 to 20px tall, well under the ~44px a thumb can hit reliably. Two of them
   matter a lot: "Read the full guarantee terms" is the link off the band Joel
   asked to feature, and "Apply first" is the only path left for someone who
   is not ready to pay today. Keyed on pointer:coarse as well as width, since
   a tablet is a touch device at 800px. */
@media (min-width:881px) {
  /* Desktop shows the payment card in the right column, so the jump is a
     short hop rather than a rescue. Sized to the copy instead of the page. */
  .lca .save-spot { display:inline-block; margin-bottom:22px; padding:15px 30px; }
}

@media (max-width:880px), (pointer:coarse) {
  .lca .guarantee-band .more { display:inline-block; padding:10px 2px 4px; margin-top:0; }
  .lca .apply-out a { display:inline-block; padding:13px 6px; }
  .lca .footer-links a { display:inline-block; padding:11px 0; }
  .lca .mini-guarantee a { display:inline-block; padding:6px 2px; }
}

@media (max-width:560px) {
  /* One copy of a sentence is shown, never both. Rendering both and letting
     CSS choose avoids a resize listener and the flash of the wrong string. */
  .lca .wide-only { display:none; }
  .lca .narrow-only { display:inline; }
  .lca p.narrow-only { display:block; }

  /* 8px is below what a 55-year-old reader can comfortably resolve, and these
     four labels sit under the only numbers on the page that are ticking. */
  .lca .time-label { font-size:9px; }

  /* The sticky Secure My Spot bar covers roughly the bottom 88px, so the real
     mobile fold is ~724px, not 812. Everything above the guarantee band is on
     a budget to keep the band inside that. */
  .lca .program-strip { gap:7px; margin:16px 0 0; }
  .lca .program-pill { padding:6px 9px; font-size:12px; }
  .lca .save-spot { padding:13px 18px; font-size:18px; margin-bottom:12px; }
  .lca .save-spot-sub { margin-top:3px; }
}

@media (prefers-reduced-motion:reduce) { .lca * { transition:none !important; } }
`;

const two = (n) => String(Math.floor(n)).padStart(2, '0');

function parts(msLeft) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function AllInPage() {
  const mountRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');

  const closeLeft = CLOSE_AT.getTime() - now;
  const fastLeft = FAST_ACTION_AT.getTime() - now;
  const closed = closeLeft <= 0;
  const cd = parts(closeLeft);
  const fd = parts(fastLeft);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    track('allin_view', { page: 'allin', mode: 'checkout', closed });
    const prev = document.title;
    document.title = 'Life Change Accelerator | Secure Your Spot';
    // His design used `html { scroll-behavior: smooth }`. Set it here and put
    // it back on unmount so it does not follow the visitor around the SPA.
    const root = document.documentElement;
    const prevScroll = root.style.scrollBehavior;
    root.style.scrollBehavior = 'smooth';
    return () => {
      document.title = prev;
      root.style.scrollBehavior = prevScroll;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── the real checkout. $500 deposit, tier allin-deposit. ─────────────
  // No balancePlan is sent on purpose: this page does not ask her to pick a
  // schedule, so /payment opens on "settle in full" and she chooses there.
  // The deposit is credited either way; see api/create-embedded-checkout.js.
  useEffect(() => {
    if (closed) return undefined;
    let checkout;
    let cancelled = false;
    setError('');

    async function mount() {
      if (!stripePromise) {
        setError('Checkout is not configured yet.');
        return;
      }
      try {
        const res = await fetch('/api/create-embedded-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'allin-deposit',
            distinctId: getDistinctId(),
            abHomeVariant: getAbHomeVariant(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Could not start checkout');
        if (cancelled) return;
        const stripe = await stripePromise;
        if (cancelled) return;
        checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        if (cancelled) { checkout.destroy(); return; }
        if (mountRef.current) {
          mountRef.current.innerHTML = '';
          checkout.mount(mountRef.current);
          track('allin_checkout_mounted', { tier: 'allin-deposit' });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start checkout. Please try again.');
      }
    }
    mount();
    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch { /* already gone */ }
    };
  }, [closed]);

  return (
    <div className="lca">
      <style>{CSS}</style>

      <div className={`closebar${closed ? ' is-closed' : ''}`}>
        <div className="closebar-inner">
          <div className="close-copy">
            {closed ? 'Enrollment for this cohort is closed' : (
              <>
                <span className="wide-only">{`Enrollment closes ${CLOSE_LABEL}`}</span>
                <span className="narrow-only">{`Closes ${CLOSE_LABEL_SHORT}`}</span>
              </>
            )}
          </div>
          {!closed && (
            <>
              {/* One static sentence for screen readers. A region that updates
                  every second is unusable with one. */}
              <p className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', margin: -1 }}>
                {`Enrollment closes ${CLOSE_LABEL}.`}
              </p>
              <div className="countdown" aria-hidden="true">
                <div className="time-box"><span className="time-num">{two(cd.days)}</span><span className="time-label">Days</span></div>
                <div className="time-box"><span className="time-num">{two(cd.hours)}</span><span className="time-label">Hours</span></div>
                <div className="time-box"><span className="time-num">{two(cd.minutes)}</span><span className="time-label">Min</span></div>
                <div className="time-box"><span className="time-num">{two(cd.seconds)}</span><span className="time-label">Sec</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      <main className="page">
        <div className="brand-line">Life Change Accelerator</div>
        <h1>Stop guessing. Start getting your life back.</h1>
        <div className="subhead">
          <strong>90 days of nurse-led transformation, plus one full year of community and support.</strong>
          <br />
          <span className="wide-only">
            Secure your place today with a <strong>{DEPOSIT} deposit</strong>. Your deposit is credited
            toward the full {PRICE} investment, with payment terms available up to 12 months.
          </span>
          <span className="narrow-only">
            Secure your place with a <strong>{DEPOSIT} deposit</strong>, credited toward the full
            {' '}{PRICE}. Payment terms up to 12 months.
          </span>
        </div>

        {/* ── SAVE MY SPOT (Joel, 2026-08-30) ─────────────────────────
            Skips the whole offer column and lands on the checkout. This is
            not a nicety on phones: the grid stacks, so the payment card sits
            below every phase, bonus, value and FAQ block, roughly 5,000px
            down. Someone who already decided should not have to read the
            pitch again to pay.

            It sits ABOVE the guarantee band, and the pills moved BELOW it,
            because on a 375px phone the band only clears the fold if nothing
            else is inserted before it. Order here is load-bearing; re-measure
            if you move anything. */}
        {!closed && (
          <a
            className="save-spot"
            href="#checkout"
            onClick={() => track('allin_save_spot_click', { placement: 'hero' })}
          >
            Save My Spot
            <span className="save-spot-sub">ONLY {DEPOSIT} today. Enrollment closes soon.</span>
          </a>
        )}

        {/* ── ABOVE THE FOLD GUARANTEE (Joel, 2026-08-30) ──────────────
            He asked for this specifically. It sits between the hero and the
            checkout grid so it is read before the price is, on both layouts.
            The full terms stay in the long guarantee box further down; this
            band summarises and links to it rather than restating it loosely,
            because two differently worded guarantees on one page is how you
            end up arguing about which one applies. */}
        <section className="guarantee-band" aria-labelledby="guarantee-band-h">
          <div className="guarantee-seal" aria-hidden="true">
            <span className="n">30</span>
            <span className="d">DAY</span>
          </div>
          <div>
            <h2 id="guarantee-band-h">The 30-Day Feel It Guarantee</h2>
            <p className="wide-only">
              Give it 30 honest days. Show up, complete your Personal Health Review, and follow the first
              steps you agree on with your team. If you still cannot point to a real shift by the end of
              that window, tell us and we refund the program payments you made to us.
            </p>
            <p className="narrow-only">
              Give it 30 honest days. If you show up, do the agreed first steps and still cannot point to
              a real shift, tell us and we refund your program payments.
            </p>
            <a className="more" href="#guarantee">Read the full guarantee terms</a>
          </div>
        </section>

        {/* Moved below the guarantee band on 2026-08-30. The third pill used
            to read "Protected by our 30-Day Feel It Guarantee" and is gone:
            with the band sitting directly above it, that pill restated the
            same promise two inches away, which is the opposite of succinct. */}
        <div className="program-strip">
          <div className="program-pill"><strong>{SPOTS} spots</strong> in this cohort</div>
          <div className="program-pill"><strong>{DEPOSIT}</strong> secures your place</div>
          <div className="program-pill">Deposit credited toward your <strong>{PRICE}</strong></div>
        </div>

        <div className="checkout-grid">
          <section className="offer-side" aria-label="Offer summary">
            {/* Annie and Joel, as asked. High on the page: she is about to
                hand over money to two people she has mostly met through a
                phone screen. */}
            <div className="coaches">
              {/* NOT lazy. It shipped lazy for one deploy and simply never
                  loaded on production: the element sat at complete=false with
                  natural size 0x0 while the same URL decoded fine on demand,
                  so the card rendered as text beside an empty hole. This is a
                  78px trust element near the top of a page asking for $500,
                  which is the last thing that should be deferred. Explicit
                  width/height so it reserves its box either way. */}
              <img src={heroImg} alt="Annie and Joel, registered nurses" width="78" height="78" />
              <div>
                <p className="who">Annie and Joel, RNs</p>
                <p className="what">
                  Two registered nurses who coach this together, live, every week. Plus the guest
                  experts we bring in when someone else is the right person to hear it from.
                </p>
              </div>
            </div>

            <div className="offer-summary" id="whats-inside" style={{ scrollMarginTop: 14 }}>
              <h2>Do less. In the right order.</h2>
              <p>
                All the right steps, in the right order. 90 days of nurse-led transformation and a
                full year of coaching, built around the exact problems women told us they wanted
                help solving.
              </p>
            </div>

            {PHASES.map((p) => (
              <div className="phase" key={p.kicker}>
                <div className="phase-head">
                  <div>
                    <div className="phase-kicker">{p.kicker}</div>
                    <h3>{p.title}</h3>
                  </div>
                  <div className="value-tag">{p.value}</div>
                </div>
                <ul>
                  {p.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
                <div className="micro-payoff">{p.payoff}</div>
              </div>
            ))}

            <div className="bonus-box">
              <div className="phase-kicker">Your bonuses</div>
              <h3>You get these too.</h3>
              <ul className="bonus-list">
                {BONUSES.map((b) => (
                  <li key={b.name}><strong>{b.name}:</strong> {b.body}</li>
                ))}
              </ul>
              <div className="micro-payoff">Because getting your health back should make life bigger, not smaller.</div>
            </div>

            {fastLeft > 0 && (
              <div className="fast-box">
                <div className="phase-kicker">Fast-action bonuses</div>
                <h3>Start by {FAST_LABEL} and receive:</h3>
                <ul className="bonus-list">
                  <li><strong>Your Next 5 Years Session:</strong> get clear on what you are getting healthy for.</li>
                  <li><strong>Life Change Starter Box:</strong> something real arrives at your house to help you begin.</li>
                </ul>
                <div className="fast-deadline">Fast-action window closes in:</div>
                <div className="fast-countdown">
                  {`${two(fd.days)}d ${two(fd.hours)}h ${two(fd.minutes)}m ${two(fd.seconds)}s`}
                </div>
              </div>
            )}

            <div className="soyoucan-box">
              <div className="phase-kicker">So you can</div>
              <h3>Because it was never really about the numbers.</h3>
              <div className="soyoucan-grid">
                {SO_YOU_CAN.map((line) => <span key={line}>{line}</span>)}
              </div>
            </div>

            <div className="value-box">
              <div className="phase-kicker">Total coaching value</div>
              <h3>Everything above is valued at {TOTAL_VALUE}.</h3>
              <div className="value-total">
                <span>Your investment</span>
                <strong>{PRICE}</strong>
              </div>
            </div>

            <div className="guarantee-box" id="guarantee" style={{ scrollMarginTop: 24 }}>
              <div className="phase-kicker">Protected by</div>
              <h3>The 30-Day Feel It Guarantee</h3>
              <p>{GUARANTEE_BODY}</p>
              <div className="small">{GUARANTEE_SMALL}</div>
            </div>

            <div className="section">
              <h2>Quick answers before you reserve your place.</h2>
              <div className="faq">
                {FAQ.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="apply-out">
                Not ready to reserve? <a href="/apply">Apply first and talk to us</a>.
              </p>
            </div>
          </section>

          <aside className="payment-card" id="checkout" aria-label="Checkout" style={{ scrollMarginTop: 14 }}>
            <div className="payment-head">
              {!closed && (
                <div className="spots"><span className="spots-dot" /> {SPOTS} spots available</div>
              )}
              <h2>{closed ? 'Enrollment closed.' : 'Secure your spot.'}</h2>
              <p>
                {closed
                  ? 'This cohort has closed. Apply below and we will tell you the moment the next one opens.'
                  : `${DEPOSIT} today reserves your place and is applied to your ${PRICE} investment.`}
              </p>
            </div>

            <div className="price-block">
              <div className="price-line"><span>Total coaching value</span><strong className="strike">{TOTAL_VALUE}</strong></div>
              <div className="price-line"><span>Your investment</span><strong>{PRICE}</strong></div>
              <div className="price-line"><span>Payment terms</span><strong>Up to 12 months</strong></div>
              <div className="due-now">
                <span className="label">Due today</span>
                <span className="amount">{closed ? '—' : DEPOSIT}</span>
              </div>
            </div>

            <div className="payment-body">
              {closed ? (
                <div className="closed-panel">
                  <h3>The doors are closed for this cohort.</h3>
                  <p>
                    Tell us about what is going on and we will reach out when the next cohort opens.
                  </p>
                  <a href="/apply">Apply for the next cohort</a>
                </div>
              ) : (
                <>
                  <div className="mini-guarantee">
                    <strong>The 30-Day Feel It Guarantee</strong>
                    Show up, follow your agreed first steps, and give the process 30 honest days.
                    {' '}
                    <a href="#guarantee">See the full guarantee</a> on this page.
                  </div>

                  {error ? (
                    <div className="pay-error" role="alert">
                      {error}
                      {' '}
                      Email <a href="mailto:braveworksrn@gmail.com">braveworksrn@gmail.com</a> and we
                      will take it from there.
                    </div>
                  ) : (
                    <div className="stripe-mount" ref={mountRef} />
                  )}

                  <div className="secure-note">
                    Secure checkout by Stripe · Your {DEPOSIT} deposit is applied to your {PRICE} investment
                  </div>

                  <div className="terms-note">
                    By reserving your place you agree to the program terms, payment agreement and guarantee
                    terms. The remaining {BALANCE} is paid on the schedule you choose on the next page.
                  </div>
                </>
              )}
            </div>

            {!closed && (
              <div className="next-steps">
                <h3>What happens next</h3>
                <ol>
                  <li>Your place is reserved.</li>
                  <li>You choose your payment schedule.</li>
                  <li>You receive onboarding instructions.</li>
                  <li>You complete your Personal Health Review.</li>
                  <li>You receive your first 90-day plan.</li>
                </ol>
              </div>
            )}
          </aside>

          {/* ── KEEP SCROLLING (Joel, 2026-08-30) ───────────────────────
              Only exists on phones. On desktop the offer column sits beside
              the payment card and is already in view, so a prompt telling
              you to scroll would be pointing at something you can see.
              On mobile the card is now ABOVE the offer, so without this the
              page reads as though it ends at the checkout. */}
          <a className="scroll-prompt" href="#whats-inside">
            <span className="scroll-prompt-t">Keep scrolling to see what is inside</span>
            <span className="scroll-prompt-a" aria-hidden="true">↓</span>
          </a>
        </div>
      </main>

      {!closed && (
        <div className="mobile-cta">
          <a href="#checkout">Secure My Spot · {DEPOSIT} Today</a>
        </div>
      )}

      <footer>
        <div className="footer-links">
          <a href="/terms">Program Terms</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="mailto:braveworksrn@gmail.com">Contact Support</a>
        </div>
        <div>
          Life Change Accelerator is an educational and coaching program and is not a substitute for
          diagnosis, treatment, or medical care from your licensed healthcare professional. Individual
          results vary. If you have an urgent or emergency medical concern, seek appropriate medical
          care immediately.
        </div>
      </footer>
    </div>
  );
}
