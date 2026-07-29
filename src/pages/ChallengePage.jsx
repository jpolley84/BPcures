// ChallengePage (route: /challenge) - the sales page for "The Three Pressures
// Challenge", a 3 night LIVE paid cohort.
//
// REDESIGNED 2026-07-28 (Joel). Joel supplied an HTML comp he wanted this route
// to look like: the ivory / gold / cocoa editorial layout from the Women of
// Power "5-Day Rising" build (Cormorant Garamond display over Manrope body, a
// dark scanner strip, a bordered curriculum table, a two column qualify grid,
// an accordion FAQ, a sticky rail). That DESIGN SYSTEM is ported here in full.
//
// The CONTENT is not ported and must never be. That comp is Annie Chitate's
// venture (everydaynurse / RestoreHER / Women of Power). This domain is Joel's
// (BraveWorks RN, blood pressure). The two businesses are deliberately kept
// separate everywhere, so this page carries Joel's challenge, in Joel's voice,
// under Joel's brand, wearing the comp's clothes. Do not paste Women of Power
// copy, Annie's name, or that event's dates onto this route.
//
// WHY THE OLD PAGE DIED, AND WHAT THIS ONE MAY NOT DO
// The May build at this route was retired 2026-07-04 for price jump countdowns,
// 50 seat caps, a Monday 10 PM class that no longer existed, an expired
// RestoreHER ticket bonus, and a signup form whose endpoint 410s. The
// 2026-07-25 full system audit then found fabricated testimonials and phantom
// compare-at prices across the site. So this page carries hard rules:
//   - NO seat cap. No "only 40 spots". No "12 left".
//   - NO tier shown as SOLD OUT.
//   - NO invented value tags and NO stack totals. The supplied comp puts a
//     "($997 value)" on every bullet and a struck "Total value $3,679" under
//     each tier. Those are exactly the 16 CFR 233 findings that killed this
//     route once. They are NOT ported. The only dollar figures here are prices
//     something has actually sold for ($17 kit and founding seat, $47 VIP) or
//     genuinely will sell for ($97 next cohort).
//   - Struck prices are allowed ONLY as FORWARD-LOOKING REGULAR PRICES, and
//     only the two Joel confirmed on 2026-07-29 he will actually charge:
//     $97 General and $297 VIP, starting with cohort 2. Every strikethrough on
//     the page is labelled "Regular price", never "was" or "originally", and
//     the price-reasoning block states outright that nobody has ever paid those
//     figures for this challenge. That forward framing is the whole legal
//     basis (16 CFR 233.1 permits a bona fide regular price). A bare
//     "<s>$97</s> $17" implying a former price would NOT be allowed, which is
//     what the comp does ("from <s>$197</s> $67") and what retired this route.
//     If cohort 2 does not sell at those prices, the strikethroughs come down.
//   - NO fake deadline. There is ONE real deadline and it is honest: a live
//     Tuesday night call cannot be attended on Wednesday. The countdown targets
//     that instant and degrades to a closed-doors waitlist when it passes.
//   - NO testimonials. Joel has no consented ones. The comp ships three
//     placeholder quotes marked "replace with real" and two [VERIFY] stat
//     cards; none of that is ported. Where a launch page would put social
//     proof, this page puts earned authority instead.
//
// STRIPE STATUS: as of 2026-07-28 neither CHALLENGE_GA_PRICE_ID nor
// CHALLENGE_VIP_PRICE_ID exists in .env, .env.local, or Vercel. Creating them
// is a financial write and Joel has not approved it. api/create-embedded-checkout.js
// reads both with NO hardcoded fallback and fails loudly when unset. This page
// therefore degrades honestly: a click that cannot reach a payment form shows
// the "Checkout is not open yet" card and captures the interest at
// /api/challenge-signup. It never shows a spinner that does not resolve.
//
// Standalone: own minimal header, no site Navbar, no competing exits. The only
// outbound links are the legally required Disclaimer / Terms / Privacy.
// Mobile first: the comp is a 1180px desktop layout, and this audience is
// largely 50+ on a phone from Facebook, so every multi column block collapses
// to one column below 760px and is rebuilt upward, not scaled down.
//
// ZERO em dashes in visible copy. NEWSTART clean. Education alongside the
// doctor, never a clinical outcome claim, never a medication change.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { KIT_FILE_COUNT, KIT_PRICE } from '../data/kitStack';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';

/* ==========================================================================
   CHALLENGE CONFIG - change prices and dates HERE and nowhere else.
   Every date, time and dollar string on the page derives from this object, so
   one edit moves the whole page. Three other files mirror it and must be
   changed in the same commit:
     api/create-embedded-checkout.js  (CHALLENGE_COHORT, CHALLENGE_START_*)
     api/challenge-signup.js          (its own CHALLENGE block)
     src/pages/ChallengeConfirmedPage.jsx (NIGHTS + logistics strings)
   The two Stripe price ids are SERVER side only:
     process.env.CHALLENGE_GA_PRICE_ID   ($17 seat)
     process.env.CHALLENGE_VIP_PRICE_ID  ($47 seat)
   with no fallback, so a missing id fails loudly instead of charging the
   wrong product. Nothing about them is exposed to the browser.
   ========================================================================== */
const CHALLENGE = {
  NAME: 'The Three Pressures Challenge',
  SUBTITLE: 'Three nights live with Joel Polley, RN',
  // Must match api/create-embedded-checkout.js and api/challenge-signup.js exactly,
  // or PostHog events cannot be joined to Stripe metadata or the KV records.
  COHORT_ID: '2026-08-04',

  // 2026-07-28 (Joel): the call moved to SEVEN PM EASTERN. It previously ran
  // 7:00pm CT, which is 8:00pm ET, so this pulls the whole cohort one hour
  // earlier for eastern viewers and keeps the "seven o'clock" line true for
  // the timezone most of this list actually lives in. The instant below is
  // therefore resolved against America/New_York, not America/Chicago.
  START_ISO_ET: '2026-08-04T19:00:00',
  START_DATE_LABEL: 'Tuesday, August 4',
  END_DATE_LABEL: 'Thursday, August 6',
  // Three consecutive nights, Tue/Wed/Thu Aug 4 to 6. The week ends Thursday,
  // so nothing collides with the Sabbath gate (Friday sundown to Saturday
  // sundown) and no date is skipped.
  DATE_RANGE_LABEL: 'August 4 to 6',
  DATE_RANGE_SHORT: 'Aug 4 to 6',
  TIME_LABEL_ET: '7:00pm ET',
  TIME_END_ET: '8:00pm ET',
  TIME_WINDOW_ET: '7:00pm to 8:00pm ET',
  TIME_LABEL_CT: '6:00pm CT',
  NIGHT_LENGTH: 'one hour',

  // FOUNDING COHORT pricing. The seat is $17 for this first cohort and $97 for
  // the next one.
  //
  // NEXT_COHORT_PRICE is deliberately a FUTURE price, not a struck past one.
  // The $97 has never been charged, so rendering it as a crossed-out "was"
  // would be a phantom compare-at, which is the exact 16 CFR 233 finding the
  // 2026-07-25 audit raised three times on this site and the reason this route
  // was retired on 2026-07-04. Stated as "the next cohort is $97" it is simply
  // true, and it stays true only if cohort 2 actually sells at $97. Do not
  // restyle this as a strikethrough without changing what it claims.
  SEAT_PRICE: 17,
  NEXT_COHORT_PRICE: 97,
  SEAT_TIER: 'challenge-ga',

  // REGULAR PRICES, shown struck through beside the founding price.
  //
  // 2026-07-29 (Joel, explicit): these are the REAL cohort-2 prices and he has
  // confirmed he will charge them. That confirmation is the entire legal basis
  // for the strikethrough, so read this before touching it.
  //
  // 16 CFR 233.1 permits comparing to your own regular price only when that
  // price is bona fide: actually charged, or genuinely intended to be charged,
  // rather than invented to manufacture a discount. This challenge has NEVER
  // sold at any price (it is Cohort One, and the proof section says so), so a
  // bare "<s>$97</s>" implying a former price for THIS product would be a
  // fictitious former price, which is exactly the finding that retired this
  // route on 2026-07-04 and appeared three times in the 2026-07-25 audit.
  //
  // What makes it lawful here is the FORWARD framing: every strikethrough on
  // this page is labelled "Regular price", never "was" or "originally", and the
  // copy states plainly that the regular price starts at the next cohort.
  // Checked before shipping: $97 has 10 lifetime charges but none for this
  // product (5 RestoreHER replay, 2 case review, 3 for the discontinued 30-Day
  // Reset Challenge VIP); $297 has exactly 1 lifetime charge and it is the
  // Sprint, a different offer.
  //
  // IF COHORT 2 DOES NOT ACTUALLY SELL AT $97 / $297, THESE MUST COME DOWN.
  // A regular price that never materialises is retroactively fictitious.
  GA_REGULAR_PRICE: 97,
  VIP_REGULAR_PRICE: 297,

  // 2026-07-28 (Joel): VIP is now a SEAT SOLD ON THIS PAGE, not a post-purchase
  // upsell. It is everything in the $17 seat plus a fourth session: a bonus
  // day on Sunday morning. It was previously described as "live Q and A plus
  // replays, sold only on /challenge-upgrade" and that page was never built,
  // so VIP was sellable nowhere. Both definitions cannot coexist; this one is
  // current. api/create-embedded-checkout.js already routes challenge-vip.
  VIP_PRICE: 47,
  VIP_TIER: 'challenge-vip',
  VIP_DAY_LABEL: 'Sunday, August 9',
  VIP_DAY_SHORT: 'Sunday Aug 9',
  VIP_TIME_ET: '11:00am ET',
  VIP_TIME_CT: '10:00am CT',
  VIP_LENGTH: 'about 90 minutes',

  LOG_DUE_LABEL: 'Friday, August 7',
  REFUND_BY_LABEL: 'August 16',
  SUPPORT_EMAIL: 'braveworksrn@gmail.com',
};

const NIGHT_COUNT = 3;
const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const SEAT_PER_NIGHT = (CHALLENGE.SEAT_PRICE / NIGHT_COUNT).toFixed(2);    // 5.67

/* ── Stripe: one instance at module load (same pattern as PayPage / AllInPage).
      Null when the publishable key is unset, which routes straight to the
      honest "checkout is not open yet" card instead of a dead button. ── */
const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

/* ── palette, lifted from the supplied comp ───────────────────────────────── */
const C = {
  ivory: '#F5EFE7',
  cream: '#E8DDD0',
  ink: '#11100F',
  cocoa: '#35231D',
  // The comp's bronze was #8A603D. It measures 4.10:1 on the cream section
  // background (#E8DDD0), which fails WCAG AA for body text, and bronze is the
  // eyebrow / accent colour on three cream sections (Tickets, Host, FAQ).
  // Darkened until it clears AA on every surface it is used over:
  // cream 4.82:1, ivory 5.65:1, white 6.45:1. Do not restore #8A603D.
  bronze: '#7D5636',
  gold: '#D5A84B',
  goldSoft: '#E8C979',
  white: '#FFFFFF',
  text: '#2B241D',
  dim: '#5B4F43',
  creamText: '#EDE3D5',
  creamDim: '#C6B8A6',
};
const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const SANS = '"Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/* ==========================================================================
   FONTS
   The comp is built on Cormorant Garamond + Manrope. The site globally loads
   Fraunces + Inter (index.html), so those two families are injected HERE and
   only here: a route scoped <link> rather than a global one, so no other page
   pays the fetch. Idempotent by element id, and never removed on unmount
   because a second visit should not refetch.
   ========================================================================== */
const FONT_LINK_ID = 'tpc-fonts';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap';

function useChallengeFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(FONT_LINK_ID)) return;
    // preconnect first so the CSS request does not pay DNS + TLS serially
    for (const [id, href, cors] of [
      ['tpc-pc1', 'https://fonts.googleapis.com', false],
      ['tpc-pc2', 'https://fonts.gstatic.com', true],
    ]) {
      if (document.getElementById(id)) continue;
      const pc = document.createElement('link');
      pc.id = id;
      pc.rel = 'preconnect';
      pc.href = href;
      if (cors) pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    }
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

/* ==========================================================================
   TIMEZONE + COUNTDOWN
   zoneOffsetMs resolves a real IANA offset at an instant instead of hardcoding
   -4 or -5, so the November DST change cannot slide the target by an hour.
   ========================================================================== */
function zoneOffsetMs(d, timeZone) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(d.toLocaleString('en-US', { timeZone }));
    return local.getTime() - utc.getTime();
  } catch {
    return -4 * 3600 * 1000; // EDT fallback
  }
}

// 'YYYY-MM-DDTHH:mm:ss' read as wall time in `timeZone`, returned as a real
// instant. Two passes: the first uses the offset at the naive instant, the
// second re-reads the offset at the corrected instant, which is what makes it
// correct on either side of a DST boundary.
export function zonedInstant(isoLocal, timeZone = 'America/New_York') {
  const [datePart, timePart = '00:00:00'] = String(isoLocal).split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  const naive = Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, s || 0);
  let instant = naive - zoneOffsetMs(new Date(naive), timeZone);
  instant = naive - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

const START_AT = zonedInstant(CHALLENGE.START_ISO_ET, 'America/New_York');

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/* ==========================================================================
   ANALYTICS
   Every event is prefixed chal_ and stamped with the cohort, so this funnel is
   separable from the kit funnel, the quiz funnel, /allin, /coaching and the
   homepage A/B test in PostHog. Event names are unchanged from the previous
   build so existing PostHog insights keep resolving.
   ========================================================================== */
function t(event, props) {
  track(event, { page: 'challenge', cohort: CHALLENGE.COHORT_ID, ...(props || {}) });
}

/* ==========================================================================
   THE CURRICULUM
   Three nights, plus the VIP fourth session rendered as the highlighted last
   row of the same table (the comp's `.day.last` treatment).
   ========================================================================== */
const NIGHTS = [
  {
    n: '01',
    when: 'TUE AUG 4',
    title: 'Your Real Number',
    promise:
      'Most home readings are wrong in a way that changes decisions. Tonight you learn to take one you can actually trust.',
    walk: 'A correct reading, taken tonight in both arms, and the first line of your 3-Day Log.',
  },
  {
    n: '02',
    when: 'WED AUG 5',
    title: 'The Three Pressures',
    promise:
      'Stress, sugar and sodium pull on each other, which is why working just one never holds. Tonight you take all three.',
    walk: 'One page for tomorrow: your wind down, your plate, and the one label rule.',
  },
  {
    n: '03',
    when: 'THU AUG 6',
    title: 'The Conversation',
    promise:
      'The night this whole week was built for. You do not walk into that office hoping. You walk in prepared.',
    walk: 'Your finished log, your one page summary, and the exact words written down.',
  },
];

// The VIP row. Rendered inside the same table, gold tinted, and clearly marked
// as included only with the $47 seat so nobody buys the $17 expecting it.
const VIP_NIGHT = {
  n: '04',
  when: 'SUN AUG 9',
  title: 'The Bonus Day',
  promise:
    'A fourth session on Sunday morning, after you have three days of your own readings in hand. We read them together and answer the questions the first three nights raised.',
  walk: 'Your own numbers looked at out loud, and your questions answered before your appointment.',
};

/* ==========================================================================
   TIERS
   Two seats. No third tier: the comp ships a $497 "Platinum VIP" column and
   Joel removed it, so there is nothing between $47 and the ladder above.
   NOTE ON BULLETS: the comp renders excluded rows as struck-through "out"
   items inside the cheaper column. That pattern is kept because it is honest
   comparison, not invented value. What is NOT kept is the "($997 value)" tag
   the comp puts beside every bullet.
   ========================================================================== */
const GA_ITEMS = [
  `All three live nights on Zoom, ${CHALLENGE.DATE_RANGE_LABEL}, ${CHALLENGE.TIME_WINDOW_ET}`,
  'Thirty minutes of live Q and A after every night, cameras and microphones optional',
  {
    lead: 'The 48-Hour Answer:',
    rest: ' any question you submit by 5:00pm ET gets answered. Live on that night’s call if there is time, and in writing within 48 hours if there is not.',
  },
  'The replay of every night, teaching and Q and A both, posted by noon the next day and yours to keep',
  'The 3-Night Workbook, one printable page per night, so nothing depends on you taking notes',
  'The 3-Day Log sheet you fill in from Night 1 and hand to your doctor on Night 3',
  'The Doctor Conversation Sheet used on Night 3',
  `The complete 10-Day BP Reset Kit, all ${KIT_FILE_COUNT} downloads, delivered the minute you register`,
];

const TIERS = [
  {
    key: CHALLENGE.SEAT_TIER,
    name: 'General',
    who: 'For the person who wants to be in the room.',
    price: CHALLENGE.SEAT_PRICE,
    regular: CHALLENGE.GA_REGULAR_PRICE,
    time: `${CHALLENGE.DATE_RANGE_LABEL} · ${CHALLENGE.TIME_WINDOW_ET}`,
    cta: `Save my seat, ${usd(CHALLENGE.SEAT_PRICE)}`,
    featured: false,
    note: `Founding cohort price. Regular price ${usd(CHALLENGE.GA_REGULAR_PRICE)} from the next cohort on.`,
    items: GA_ITEMS,
    out: [
      `The Bonus Day, ${CHALLENGE.VIP_DAY_SHORT}, where we read your three days of readings together`,
      'Your questions answered live on the Bonus Day',
    ],
  },
  {
    key: CHALLENGE.VIP_TIER,
    name: 'VIP',
    who: 'For the person who wants their own numbers looked at.',
    price: CHALLENGE.VIP_PRICE,
    regular: CHALLENGE.VIP_REGULAR_PRICE,
    time: `${CHALLENGE.DATE_RANGE_LABEL} plus ${CHALLENGE.VIP_DAY_SHORT}`,
    cta: `Save my VIP seat, ${usd(CHALLENGE.VIP_PRICE)}`,
    featured: true,
    ribbon: 'Includes the fourth day',
    note: `Founding cohort price. Regular price ${usd(CHALLENGE.VIP_REGULAR_PRICE)} from the next cohort on.`,
    items: [
      { lead: 'Everything in General.', rest: '' },
      {
        lead: `The Bonus Day, ${CHALLENGE.VIP_DAY_LABEL}, ${CHALLENGE.VIP_TIME_ET}:`,
        rest: ` a fourth live session, ${CHALLENGE.VIP_LENGTH}, three days after the challenge ends and with your own readings finally in hand.`,
      },
      'We read real logs out loud together, including yours if you want it read, and I show you what the pattern across a week is actually saying',
      'Open questions until they run out, not until the hour does',
      'A second pass at the doctor conversation, with the exact wording for whatever your log turned up',
      'The Bonus Day replay, yours to keep alongside the other three',
    ],
    out: [],
  },
];

/* ==========================================================================
   THE SO-YOU-CAN LIST (the comp's two column serif list)
   ========================================================================== */
const SO_YOU_CAN = [
  ['So you finally know ', 'what the number is made of', ', instead of only what it is.'],
  ['So you can take a reading at home and ', 'trust it', '.'],
  ['So the cuff tightening on your arm stops feeling like a verdict.'],
  ['So you understand why the dose went up that year you did everything right.'],
  ['So you walk into that appointment with ', 'a page in your hand', ', not a hope in your chest.'],
  ['So you can ask about your own labs and understand the answer.'],
  ['So you stop guessing which of the three pressures is the one pulling hardest on you.'],
  ['So a normal grocery store is enough. ', 'No supplements to buy', '.'],
  ['So your family stops asking how it went and hearing "fine, I guess."'],
  ['So you and your doctor are on ', 'the same side of the table', '.'],
  ['So the next twenty years are something you are steering, not watching.'],
  ['So you never again nod along to something about your own body that you did not follow.'],
];

/* ==========================================================================
   PROOF, WITHOUT TESTIMONIALS
   Every figure here is something Joel has actually done. The comp's three
   placeholder quotes and its two [VERIFY] stat cards are deliberately absent.
   ========================================================================== */
const PROOF = [
  {
    n: '20',
    h: 'Years at the bedside',
    p: 'Registered nurse, most of it in intensive care and the emergency department. The one standing at the head of the bed at three in the morning.',
  },
  {
    n: '3',
    h: 'Nights, then it is done',
    p: 'Not a course you will not finish. Three evenings, one hour each, and you build the thing in the room instead of taking it home as homework.',
  },
  {
    n: '1',
    h: 'Page in your hand Thursday',
    p: 'Three days of your own readings, taken correctly, with the questions written underneath in your own handwriting.',
  },
];

const QUALIFY_YES = [
  'You have a blood pressure number you have been managing for a while, and nobody ever really explained it to you.',
  'You take a medication, or your doctor said "let us watch it," and you want to understand what is underneath the number either way.',
  'You are willing to take a reading three days in a row and write it down.',
  'You want to work alongside your doctor, not around them.',
  'You would rather have one hour a night for three nights than another PDF you never open.',
];

const QUALIFY_NO = [
  'You want someone to tell you to stop taking your medication. I will never do that, and I will say so on every night.',
  'You want a guarantee that a number will move. Nobody honest can give you that.',
  'You want to buy the replays and never show up. This one only pays you back if you do the work.',
  'You are looking for a supplement to buy at the end. There is not one.',
];

/* ==========================================================================
   FAQ
   ========================================================================== */
const FAQ = [
  {
    q: 'Is this medical advice? Are you telling me to change my medication?',
    a: 'No, and absolutely not. This is education and lifestyle support, not medical advice, diagnosis, or treatment. I am a registered nurse, not your prescribing physician. Everything I teach is meant to work alongside your doctor’s care and never instead of it. Never start, stop, or adjust medication without your doctor. If anything I say ever seems to contradict your doctor, your doctor wins.',
    open: true,
  },
  {
    q: 'Will any of this interfere with my blood pressure medication?',
    a: 'That is exactly the right question to ask, and the honest answer is that I cannot answer it for you specifically, because I do not know your history, your kidneys, or your other prescriptions. What I can tell you is that everything on Night 2 is food, water, sleep, sunlight, walking and breathing. On Night 3 I teach you how to bring all of it to your doctor and ask directly. That conversation is the whole point of the week.',
    open: true,
  },
  {
    q: 'What is the difference between General and VIP?',
    a: `General is the three live nights, the replays, the workbook, the log, and the ${usd(KIT_PRICE)} kit. VIP is all of that plus a fourth session on ${CHALLENGE.VIP_DAY_LABEL} at ${CHALLENGE.VIP_TIME_ET}, which is the one where we read real logs out loud and I answer questions until they run out. The reason it sits on Sunday and not inside the week is simple: on Sunday you finally have three days of your own readings to look at. There is nothing to look at on Tuesday. If you only want the teaching, take General. If you want your own numbers looked at before you see your doctor, take VIP.`,
  },
  {
    q: 'Do I have to be on camera?',
    a: 'No. Ever. Most people keep the camera off and the microphone off the entire week, and that is completely normal. You can sit in your recliner in whatever you are already wearing. Questions can be typed instead of spoken, on every night including the Bonus Day.',
  },
  {
    q: 'What if I miss a night?',
    a: 'You get the replay of every night, posted by noon the next day, and it is yours to keep. Nothing is scheduled to expire. If Wednesday is your grandson’s ball game, watch it Thursday morning with breakfast. The work still stacks.',
  },
  {
    q: 'So is this just replays? Why do I need to show up live?',
    a: 'It is genuinely live. I am on the call, not a recording of me, and I answer real questions from real people in the room. The replays exist so life does not knock you out of the week, not so you can skip it. The people who show up live get more out of it, every time.',
  },
  {
    q: 'I am not technical. Is Zoom hard?',
    a: 'No. You will get one email with one blue link. Tap the link, and you are in. That is the entire technical requirement. If it does not work, reply to that email and we will get you in before the call starts. You do not need an account, a password, or a camera.',
  },
  {
    q: 'I am 68 and I take four pills. Is this for me?',
    a: 'Yes. Most of the people in this room will be over fifty and already on medication. That is who I built it for. If you take nothing yet and your doctor said "let us watch it," you are also in the right place, and honestly you may get the most out of it.',
  },
  {
    q: 'How much time will this take each day?',
    a: 'One hour a night for the call, and each night’s action is designed to fit in the time you already spend. A ten minute walk after a meal. Ten minutes of morning light. Writing two numbers on a page. I am not asking you to add an hour of chores to your day.',
  },
  {
    q: 'Do I need to buy anything? Supplements, equipment, special food?',
    a: 'No. You need a home blood pressure cuff, and if you already take readings at home you already own one. Everything about food is built from ordinary grocery store plants. There is no supplement I am going to tell you to buy at the end, and there is no product pitch on Night 3.',
  },
  {
    q: `What is the difference between this and the ${usd(KIT_PRICE)} kit?`,
    a: 'The kit is the written protocol you follow at your own pace. This is three live nights where I teach you the reasoning behind it, answer questions in real time, and walk you to the doctor conversation at the end. Your seat includes the kit, so you are not choosing between them.',
  },
  {
    q: 'What if it does not work for me?',
    a: `Read the guarantee section above, because I wrote it plainly on purpose. Short version: the kit inside your seat carries a 30-day Feel-It-or-Free promise either way. Your seat is refundable for any reason right up until we start, and refundable in full after that if you did the work and still felt it was not worth it. And I will say the thing most people will not say: results are not typical, most readers see modest results or none, and the people who see the most are the people who actually do the work.`,
  },
  {
    q: 'Will something be sold at the end?',
    a: 'I would rather tell you now than surprise you on Thursday. The three nights stand completely on their own. You will leave with your log and your doctor conversation whether you ever buy anything else or not. If you want to keep going with support afterward there will be an invitation, and you are free to ignore it. There is no pitch inside Night 3.',
  },
  {
    q: 'Is this a Christian program?',
    a: 'I am a Christian and it shows up in how I teach, particularly on the night we talk about rest and gratitude. You will not be preached at, and you do not have to share my faith to belong in that room. Everything taught is plant based, natural, and practical.',
  },
];

/* ==========================================================================
   PAGE
   ========================================================================== */
export default function ChallengePage() {
  useChallengeFonts();

  const [left, setLeft] = useState(() => START_AT.getTime() - Date.now());
  const doorsClosed = left <= 0;

  // Checkout state machine: idle -> mounting -> mounted | failed.
  // 'failed' is a real, readable card, never a spinner that never resolves.
  const [activeTier, setActiveTier] = useState(null);
  const [checkoutState, setCheckoutState] = useState('idle');
  // Why the checkout failed. Only 'already_purchased' is treated specially:
  // that one means the buyer ALREADY PAID (api/_dupe-guard.js caught a repeat
  // of the same tier inside 30 minutes), so showing them the generic
  // "checkout is not open yet, nothing was charged" card would be a lie.
  const [checkoutError, setCheckoutError] = useState(null);
  // Bumped on every seat click. Without it, clicking the SAME tier again after
  // a failure would not change activeTier, the effect would never re-run, and
  // the buyer would sit on a spinner forever. That is the one state this page
  // is not allowed to have.
  const [checkoutAttempt, setCheckoutAttempt] = useState(0);
  const checkoutRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const startedAlready = START_AT.getTime() - Date.now() <= 0;
    t('chal_page_view', {
      doors_open: !startedAlready,
      seat_price: CHALLENGE.SEAT_PRICE,
      vip_price: CHALLENGE.VIP_PRICE,
    });
    if (startedAlready) t('chal_doors_closed_view');
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLeft(START_AT.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Choose a seat: record the click, arm the checkout panel, scroll to it.
  const chooseTier = useCallback((tierKey, location, price) => {
    t('chal_cta_click', { location, tier: tierKey, price });
    setActiveTier(tierKey);
    setCheckoutState('mounting');
    setCheckoutError(null);
    setCheckoutAttempt((n) => n + 1);
    window.setTimeout(() => {
      try {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch { /* older Safari */ }
    }, 40);
  }, []);

  // Mount (or remount) the embedded Stripe checkout for the chosen tier.
  // A watchdog guarantees the buyer sees an answer either way: the server has
  // NO fallback price id for these tiers on purpose, so a missing
  // CHALLENGE_GA_PRICE_ID / CHALLENGE_VIP_PRICE_ID must surface as a clear
  // message rather than a hang.
  useEffect(() => {
    // Doors closing mid-session tears the form down: nobody buys a seat to a
    // call that is already running.
    if (!activeTier || doorsClosed) return undefined;
    let checkout;
    let cancelled = false;
    let settled = false;

    const fail = (reason) => {
      if (cancelled || settled) return;
      settled = true;
      setCheckoutError(reason);
      setCheckoutState('failed');
      t('chal_checkout_failed', { tier: activeTier, reason });
    };

    // 12s, not 3s. A 50+ audience on mobile data was being shown the failure
    // card while Stripe was still legitimately loading.
    const watchdog = window.setTimeout(() => fail('timeout'), 12000);

    async function init() {
      if (!stripePromise) {
        fail('no_publishable_key');
        return;
      }
      try {
        let email = '';
        try { email = localStorage.getItem('bwbp_lead_email') || ''; } catch { /* private mode */ }
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tier: activeTier,
                email,
                ph_did: getDistinctId(),
                ab_variant: getAbHomeVariant(),
              }),
            });
            if (!res.ok) {
              // The endpoint answers a missing CHALLENGE_*_PRICE_ID with
              // { error: 'challengeCheckoutUnavailable', code, ... }. Carry
              // that code into the failure event so the reason is legible in
              // PostHog instead of a generic start_failed.
              let code = `http_${res.status}`;
              try {
                const body = await res.json();
                code = body.code || body.error || code;
              } catch { /* non-JSON error body */ }
              throw new Error(code);
            }
            const data = await res.json();
            if (!data.clientSecret) throw new Error('no_secret');
            return data.clientSecret;
          },
        });
        if (cancelled) { checkout.destroy(); return; }
        checkout.mount(checkoutRef.current);
        if (settled) { checkout.destroy(); return; }
        settled = true;
        window.clearTimeout(watchdog);
        setCheckoutState('mounted');
        t('chal_checkout_mounted', {
          tier: activeTier,
          price: activeTier === CHALLENGE.VIP_TIER ? CHALLENGE.VIP_PRICE : CHALLENGE.SEAT_PRICE,
        });
      } catch (err) {
        fail(err && err.message ? String(err.message).slice(0, 60) : 'init_error');
      }
    }

    init();
    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      try { if (checkout) checkout.destroy(); } catch { /* already gone */ }
    };
  }, [activeTier, checkoutAttempt, doorsClosed]);

  const goToSeats = useCallback((location) => {
    t('chal_cta_click', { location, tier: 'seats_anchor' });
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToWaitlist = useCallback((location) => {
    t('chal_cta_click', { location, tier: 'waitlist_anchor' });
    document.getElementById('next-cohort')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const ctx = { doorsClosed, chooseTier, goToSeats, goToWaitlist };

  return (
    <div className="tpc" style={{ background: C.ivory, color: C.text }}>
      <ChallengeStyles />

      <Announce doorsClosed={doorsClosed} />
      <SiteHeader {...ctx} />

      <Hero {...ctx} left={left} />
      <Scanner />
      <Reframe />
      <Identity />
      <SoYouCan {...ctx} />
      <Nights {...ctx} />
      <Artifact />
      <Tickets
        {...ctx}
        activeTier={activeTier}
        checkoutState={checkoutState}
        checkoutError={checkoutError}
        checkoutRef={checkoutRef}
        panelRef={panelRef}
      />
      <PriceReasoning />
      <Proof {...ctx} />
      <Qualify />
      <Host />
      <Guarantee />
      <Deadline {...ctx} left={left} />
      <Faq />
      <Close {...ctx} />
      <PageFooter />

      <StickyBar {...ctx} activeTier={activeTier} />
    </div>
  );
}

/* ==========================================================================
   SCOPED CSS
   Everything is namespaced under .tpc so nothing here can leak into another
   page. Mobile first: the comp's multi column blocks are declared as single
   column and widened at breakpoints, never the reverse.
   ========================================================================== */
function ChallengeStyles() {
  return (
    <style>{`
      /* overflow-x must be CLIP, not HIDDEN. 'hidden' makes .tpc a scroll
         container, which silently kills position:sticky on .tpc-header (the
         nav stopped pinning and scrolled away with the page). 'clip' contains
         any stray overflow without creating a scroll container. */
      .tpc { font-family: ${SANS}; font-size: 17px; line-height: 1.6; overflow-x: clip; }
      .tpc h1, .tpc h2, .tpc h3, .tpc h4 { font-family: ${SERIF}; font-weight: 600; line-height: 1.06; margin: 0; color: ${C.ink}; }
      .tpc p { margin: 0 0 1em; }
      .tpc-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
      .tpc-narrow { max-width: 760px; }
      .tpc-eyebrow { font-weight: 700; letter-spacing: .24em; text-transform: uppercase; font-size: .68rem; color: ${C.bronze}; }
      .tpc-sec { padding: 56px 0; }
      .tpc-ink { background: ${C.ink}; color: ${C.creamText}; }
      .tpc-cocoa { background: ${C.cocoa}; color: ${C.creamText}; }
      .tpc-creamsec { background: ${C.cream}; }
      .tpc-ink h2, .tpc-ink h3, .tpc-ink h4, .tpc-cocoa h2, .tpc-cocoa h3, .tpc-cocoa h4 { color: ${C.white}; }
      .tpc-ink .tpc-eyebrow, .tpc-cocoa .tpc-eyebrow { color: ${C.goldSoft}; }
      .tpc-head { text-align: center; max-width: 860px; margin: 0 auto 36px; }
      .tpc-head h2 { font-size: clamp(1.9rem, 5.2vw, 3rem); }
      .tpc-head p { margin-top: 14px; color: ${C.dim}; }
      .tpc-ink .tpc-head p, .tpc-cocoa .tpc-head p { color: ${C.creamDim}; }
      .tpc-head .tpc-eyebrow { margin-bottom: 12px; display: block; }

      /* buttons */
      .tpc-btn {
        display: inline-flex; align-items: center; justify-content: center; text-align: center;
        font-family: ${SANS}; font-weight: 700; letter-spacing: .02em; font-size: .95rem;
        min-height: 54px; padding: 16px 28px; border-radius: 5px; cursor: pointer; border: none;
        transition: background .25s ease, transform .25s ease; line-height: 1.3; width: 100%;
        text-decoration: none;
      }
      .tpc-btn-gold { background: ${C.gold}; color: ${C.ink}; box-shadow: 0 14px 34px -16px rgba(213,168,75,.9); }
      .tpc-btn-gold:hover { background: ${C.goldSoft}; }
      .tpc-btn-ink { background: ${C.ink}; color: #fff; }
      .tpc-btn-ink:hover { background: #2a231c; }
      .tpc-btn-out { background: transparent; border: 1.5px solid ${C.gold}; color: ${C.ink}; }
      .tpc-btn-out:hover { background: ${C.gold}; }
      .tpc-btn:active { transform: scale(.988); }
      .tpc-btn:disabled { opacity: .7; cursor: default; }
      .tpc-cta { text-align: center; margin: 34px 0 0; }
      .tpc-cta-sub { font-size: .8rem; color: ${C.dim}; margin-top: 12px; }
      .tpc-link {
        display: inline-flex; align-items: center; gap: .35rem; min-height: 48px;
        background: none; border: none; font-family: ${SANS}; font-size: .92rem; font-weight: 600;
        cursor: pointer; text-decoration: underline; text-underline-offset: 4px; color: ${C.bronze};
      }
      .tpc-btn:focus-visible, .tpc-link:focus-visible, .tpc-fq:focus-visible, .tpc-input:focus-visible {
        outline: 3px solid ${C.bronze}; outline-offset: 2px;
      }

      /* announce + header */
      .tpc-announce {
        background: ${C.ink}; color: ${C.creamText}; text-align: center; font-size: .68rem;
        letter-spacing: .12em; text-transform: uppercase; font-weight: 600; padding: 10px 16px;
        display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
      }
      .tpc-announce i { width: 4px; height: 4px; border-radius: 50%; background: ${C.gold}; flex: none; }
      .tpc-announce b { color: ${C.goldSoft}; }
      .tpc-header {
        position: sticky; top: 0; z-index: 60; background: rgba(245,239,231,.94);
        backdrop-filter: blur(10px); border-bottom: 1px solid rgba(138,96,61,.16);
      }
      .tpc-nav { display: flex; align-items: center; justify-content: space-between; min-height: 62px; gap: 12px; }
      .tpc-mark { display: flex; align-items: center; gap: .5rem; }
      .tpc-mark span.badge {
        width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
        border: 1px solid rgba(138,96,61,.45); font-family: ${SERIF}; font-style: italic;
        font-size: .72rem; color: ${C.bronze};
      }
      .tpc-mark span.name { font-size: .68rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: ${C.ink}; }
      .tpc-nav-cta { width: auto; min-height: 44px; padding: 10px 18px; font-size: .72rem; }

      /* hero */
      .tpc-hero { padding: 34px 0 52px; background: radial-gradient(110% 60% at 50% -8%, #FCF8F1, transparent 60%), ${C.ivory}; text-align: center; }
      .tpc-kick { font-size: .68rem; letter-spacing: .24em; text-transform: uppercase; font-weight: 700; color: ${C.bronze}; margin-bottom: 14px; }
      .tpc-pres { font-family: ${SERIF}; font-style: italic; font-size: 1.05rem; color: ${C.bronze}; margin-bottom: 4px; }
      .tpc-name { font-family: ${SERIF}; font-size: clamp(2.3rem, 9vw, 4.4rem); font-weight: 700; line-height: 1; letter-spacing: .01em; margin-bottom: 18px; color: ${C.ink}; }
      .tpc-name span { color: ${C.gold}; }
      .tpc-h1 { font-size: clamp(1.35rem, 4.6vw, 2.1rem); line-height: 1.22; margin: 0 auto 18px; max-width: 24ch; font-weight: 600; }
      .tpc-h1 span { color: ${C.bronze}; }
      .tpc-sub { max-width: 640px; margin: 0 auto 22px; font-size: 1.02rem; color: ${C.text}; }
      .tpc-strip { display: inline-block; border: 1px solid ${C.gold}; border-radius: 4px; padding: 11px 22px; font-family: ${SERIF}; font-size: clamp(1.05rem, 3.4vw, 1.35rem); font-weight: 600; margin-bottom: 24px; }
      .tpc-strip b { color: ${C.bronze}; }
      .tpc-dateline { font-weight: 700; letter-spacing: .1em; text-transform: uppercase; font-size: .78rem; color: ${C.ink}; margin-bottom: 16px; line-height: 1.6; }
      .tpc-price { font-family: ${SERIF}; font-size: clamp(1.4rem, 5vw, 1.9rem); font-weight: 600; margin-bottom: 6px; color: ${C.ink}; }
      .tpc-price b { color: ${C.bronze}; }
      /* No opacity fade on struck prices. At .6 the hero strike measured
         2.78:1, failing AA even at large-text size, and a regular price the
         buyer cannot read is a disclosure that does not disclose. The
         strikethrough itself carries the de-emphasis. */
      .tpc-price s { color: ${C.dim}; font-weight: 500; text-decoration-thickness: 2px; }
      .tpc-pricenote { font-size: .82rem; color: ${C.dim}; margin-bottom: 20px; }
      .tpc-herobtn { max-width: 520px; margin: 0 auto; }

      /* countdown */
      .tpc-cd { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
      .tpc-cd > div { min-width: 58px; }
      .tpc-cd .n { font-family: ${SERIF}; font-size: 2rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
      .tpc-cd .l { font-size: .56rem; letter-spacing: .18em; text-transform: uppercase; margin-top: 5px; }

      /* scanner */
      .tpc-scan { background: ${C.cocoa}; }
      .tpc-scan-grid { display: grid; grid-template-columns: 1fr; }
      .tpc-scan-grid > div { padding: 26px 4px; border-bottom: 1px solid rgba(213,168,75,.25); }
      .tpc-scan-grid > div:last-child { border-bottom: none; }
      .tpc-scan-grid .l { font-size: .62rem; letter-spacing: .2em; text-transform: uppercase; color: ${C.goldSoft}; font-weight: 700; margin-bottom: 8px; }
      .tpc-scan-grid .v { font-family: ${SERIF}; font-size: 1.35rem; color: #fff; line-height: 1.2; }
      .tpc-scan-grid .s { font-size: .84rem; color: ${C.creamDim}; margin-top: 5px; }

      /* reframe + identity */
      .tpc-reframe { text-align: center; background: linear-gradient(180deg, ${C.ivory}, ${C.cream}); }
      .tpc-reframe .small { font-family: ${SERIF}; font-size: clamp(1.3rem, 4.4vw, 2rem); color: ${C.dim}; margin-bottom: 6px; }
      .tpc-reframe .big { font-family: ${SERIF}; font-size: clamp(2rem, 7.4vw, 4rem); font-weight: 700; line-height: 1.08; color: ${C.ink}; }
      .tpc-reframe .big span { color: ${C.gold}; }
      .tpc-reframe .body { max-width: 620px; margin: 24px auto 0; color: ${C.dim}; }
      .tpc-ident { background: radial-gradient(80% 100% at 50% 0%, rgba(213,168,75,.16), transparent 60%), ${C.ink}; padding: 60px 0; text-align: center; }
      .tpc-ident .you { font-family: ${SERIF}; font-size: clamp(1.3rem, 4.6vw, 2.1rem); font-weight: 600; color: #fff; line-height: 1.5; max-width: 900px; margin: 0 auto; }
      .tpc-ident .you span { color: ${C.goldSoft}; }
      .tpc-ident .end { font-family: ${SERIF}; font-style: italic; font-size: clamp(1.2rem, 4vw, 1.8rem); color: ${C.gold}; margin-top: 22px; }

      /* so you can */
      .tpc-soyou { max-width: 880px; margin: 0 auto; }
      .tpc-soyou p { font-family: ${SERIF}; font-size: 1.22rem; line-height: 1.34; color: ${C.ink}; margin: 0 0 16px; padding-left: 18px; border-left: 2px solid ${C.gold}; break-inside: avoid; }
      .tpc-soyou p b { color: ${C.bronze}; font-style: italic; }
      .tpc-soyou-punch { text-align: center; max-width: 760px; margin: 44px auto 0; font-family: ${SERIF}; font-size: clamp(1.4rem, 5vw, 2.2rem); font-weight: 600; color: ${C.bronze}; line-height: 1.24; }

      /* days table */
      .tpc-days { max-width: 1000px; margin: 0 auto; border: 1px solid rgba(213,168,75,.35); border-radius: 10px; overflow: hidden; }
      .tpc-day { display: grid; grid-template-columns: 1fr; border-bottom: 1px solid rgba(213,168,75,.22); }
      .tpc-day:last-child { border-bottom: none; }
      .tpc-day.hdr { display: none; background: rgba(213,168,75,.12); }
      .tpc-day.hdr div { font-size: .62rem; letter-spacing: .18em; text-transform: uppercase; color: ${C.goldSoft}; font-weight: 700; padding: 14px 22px; }
      .tpc-day .d { padding: 20px 22px 0; font-family: ${SERIF}; font-size: 1.4rem; font-weight: 700; color: ${C.gold}; display: flex; align-items: baseline; gap: 12px; }
      .tpc-day .d em { font-family: ${SANS}; font-style: normal; font-size: .62rem; letter-spacing: .18em; color: ${C.creamDim}; font-weight: 700; }
      .tpc-day .t { padding: 10px 22px 0; }
      .tpc-day .t h3 { font-size: 1.4rem; color: #fff; margin-bottom: 6px; }
      .tpc-day .t p { font-size: .92rem; color: ${C.creamDim}; margin: 0; }
      .tpc-day .o { padding: 14px 22px 22px; font-size: .94rem; color: ${C.creamText}; }
      .tpc-day .o b { color: ${C.goldSoft}; }
      .tpc-day.last { background: linear-gradient(90deg, rgba(213,168,75,.2), rgba(213,168,75,.06)); }
      .tpc-vip-flag { display: inline-block; font-family: ${SANS}; font-size: .58rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: ${C.ink}; background: ${C.gold}; border-radius: 3px; padding: 4px 8px; margin-bottom: 8px; }

      /* artifact */
      .tpc-rm { display: grid; grid-template-columns: 1fr; gap: 36px; align-items: center; }
      .tpc-book { display: flex; justify-content: center; perspective: 1400px; }
      .tpc-book-c {
        width: min(280px, 78vw); aspect-ratio: 3/4; background: linear-gradient(150deg, #FBF6EC, ${C.cream});
        border-radius: 4px 8px 8px 4px; box-shadow: -13px 0 0 -2px #d8c9b2, 0 40px 70px -26px rgba(17,16,15,.5);
        padding: 34px 26px; display: flex; flex-direction: column; position: relative; transform: rotateY(-11deg);
      }
      .tpc-book-c::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 13px; background: linear-gradient(90deg, rgba(0,0,0,.16), transparent); }
      .tpc-book-b { font-weight: 700; letter-spacing: .18em; font-size: .55rem; text-transform: uppercase; color: ${C.bronze}; }
      .tpc-book-r { width: 36px; height: 1px; background: ${C.gold}; margin: 16px 0; }
      .tpc-book-t { font-family: ${SERIF}; font-size: 1.8rem; font-weight: 600; line-height: 1.08; color: ${C.ink}; }
      .tpc-book-s { margin-top: auto; font-size: .58rem; letter-spacing: .14em; text-transform: uppercase; color: ${C.dim}; }
      .tpc-rm-boxes { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 22px; }
      .tpc-rb { background: ${C.white}; border: 1px solid rgba(138,96,61,.22); border-radius: 8px; padding: 20px 18px; }
      .tpc-rb .n { font-family: ${SERIF}; font-size: 1.15rem; color: ${C.gold}; font-weight: 700; }
      .tpc-rb h4 { font-size: 1.05rem; margin: 4px 0 5px; }
      .tpc-rb p { font-size: .88rem; color: ${C.dim}; margin: 0; }

      /* tickets */
      .tpc-tiers { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; max-width: 900px; margin: 0 auto; }
      .tpc-tier { background: ${C.white}; border: 1px solid rgba(138,96,61,.24); border-radius: 10px; padding: 26px 22px; display: flex; flex-direction: column; position: relative; }
      .tpc-tier.feat { border: 2px solid ${C.gold}; box-shadow: 0 30px 60px -34px rgba(138,96,61,.55); }
      .tpc-tier.active { border: 3px solid ${C.bronze}; }
      .tpc-ribbon { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: ${C.gold}; color: ${C.ink}; font-size: .6rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; white-space: nowrap; }
      .tpc-tier h3 { font-size: 1.9rem; }
      .tpc-tier .who { font-size: .88rem; color: ${C.dim}; margin: 6px 0 14px; }
      /* .85rem not .78rem: this line is the compare-at disclosure and the
         audience is largely 50+, so it may not be the smallest text on the
         card. Solid colour, no opacity, for the same reason as above. */
      .tpc-tier .reg { font-size: .85rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.dim}; margin-bottom: 3px; }
      .tpc-tier .reg s { text-decoration-thickness: 2px; }
      .tpc-tier .amt { font-family: ${SERIF}; font-size: 3rem; font-weight: 700; line-height: 1; color: ${C.ink}; }
      .tpc-tier .time { font-size: .8rem; color: ${C.bronze}; font-weight: 700; margin-top: 8px; letter-spacing: .04em; }
      .tpc-tier .rule { height: 1px; background: rgba(138,96,61,.2); margin: 18px 0; }
      .tpc-tier ul { list-style: none; margin: 0 0 20px; padding: 0; display: grid; gap: 11px; flex: 1; }
      .tpc-tier li { font-size: .92rem; line-height: 1.5; color: ${C.text}; padding-left: 22px; position: relative; }
      .tpc-tier li::before { content: "\\2713"; position: absolute; left: 0; top: 0; color: ${C.gold}; font-weight: 700; }
      .tpc-tier li.out { color: #9a9086; }
      .tpc-tier li.out::before { content: "\\2717"; color: #c3b9ad; }
      .tpc-tier li b { color: ${C.ink}; }
      .tpc-tier .note { font-size: .74rem; color: ${C.dim}; text-align: center; margin-top: 10px; }

      /* proof */
      .tpc-pgrid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 34px; }
      .tpc-pcard { border: 1px solid rgba(213,168,75,.3); border-radius: 10px; padding: 24px 22px; background: rgba(213,168,75,.05); }
      .tpc-pcard .n { font-family: ${SERIF}; font-size: 2.6rem; font-weight: 700; color: ${C.gold}; line-height: 1; }
      .tpc-pcard h4 { font-size: 1.15rem; color: #fff; margin: 8px 0 6px; }
      .tpc-pcard p { font-size: .9rem; color: ${C.creamDim}; margin: 0; }
      .tpc-proof-lead { max-width: 760px; margin: 0 auto; text-align: center; }
      .tpc-proof-lead .big { font-family: ${SERIF}; font-size: clamp(1.7rem, 5.4vw, 2.6rem); font-weight: 600; color: #fff; line-height: 1.14; margin-bottom: 18px; }
      .tpc-proof-lead p { color: ${C.creamDim}; }
      .tpc-proof-lead b { color: ${C.goldSoft}; }

      /* qualify */
      .tpc-qgrid { display: grid; grid-template-columns: 1fr; gap: 20px; max-width: 1000px; margin: 0 auto; }
      .tpc-q { border-radius: 10px; padding: 26px 22px; }
      .tpc-q.yes { background: ${C.white}; border: 1px solid rgba(138,96,61,.24); }
      .tpc-q.no { background: rgba(138,96,61,.07); border: 1px solid rgba(138,96,61,.16); }
      .tpc-q h3 { font-size: 1.4rem; margin-bottom: 14px; }
      .tpc-q ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
      .tpc-q li { font-size: .94rem; line-height: 1.5; color: ${C.text}; padding-left: 20px; position: relative; }
      .tpc-q.yes li::before { content: "\\2713"; position: absolute; left: 0; color: ${C.gold}; font-weight: 700; }
      .tpc-q.no li::before { content: "\\2022"; position: absolute; left: 2px; color: ${C.bronze}; font-weight: 700; }

      /* host */
      .tpc-an { display: grid; grid-template-columns: 1fr; gap: 30px; align-items: center; max-width: 1000px; margin: 0 auto; }
      .tpc-an-q { font-family: ${SERIF}; font-style: italic; font-size: clamp(1.4rem, 4.6vw, 2rem); color: ${C.ink}; line-height: 1.2; margin-bottom: 16px; }
      .tpc-an-hi { font-family: ${SERIF}; font-size: 1.35rem; color: ${C.bronze}; margin: 16px 0; line-height: 1.25; }
      .tpc-an-n { font-family: ${SERIF}; font-size: 1.3rem; font-weight: 700; color: ${C.ink}; margin-top: 20px; }
      .tpc-an-n span { display: block; font-family: ${SANS}; font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: ${C.bronze}; font-weight: 700; margin-top: 5px; }
      .tpc-ph { background: linear-gradient(160deg, ${C.cocoa}, ${C.ink}); border-radius: 10px; aspect-ratio: 4/5; display: grid; place-items: center; padding: 24px; text-align: center; }
      .tpc-ph .cap { font-family: ${SERIF}; font-style: italic; color: ${C.creamDim}; font-size: 1rem; }

      /* guarantee */
      .tpc-gbox { max-width: 760px; margin: 0 auto; border: 1px solid ${C.gold}; border-radius: 10px; padding: 34px 24px; text-align: center; background: ${C.white}; }
      .tpc-gseal { width: 52px; height: 52px; border-radius: 50%; border: 1.5px solid ${C.gold}; color: ${C.gold}; display: grid; place-items: center; margin: 0 auto 16px; font-size: 1.3rem; }
      .tpc-gbox h3 { font-size: 1.9rem; margin-bottom: 14px; }
      .tpc-gbox p { color: ${C.dim}; }
      .tpc-promise { text-align: left; border-top: 1px solid rgba(138,96,61,.18); padding-top: 18px; margin-top: 18px; }
      .tpc-promise .lbl { font-size: .64rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: ${C.bronze}; margin-bottom: 8px; }
      .tpc-promise p { color: ${C.text}; font-size: .95rem; margin: 0 0 .7em; }

      /* faq */
      .tpc-faq { max-width: 800px; margin: 0 auto; }
      .tpc-fi { border-bottom: 1px solid rgba(138,96,61,.2); }
      .tpc-fq {
        width: 100%; background: none; border: none; text-align: left; cursor: pointer;
        font-family: ${SANS}; font-size: 1rem; font-weight: 700; color: ${C.ink};
        padding: 18px 32px 18px 0; position: relative; min-height: 56px; line-height: 1.4;
      }
      .tpc-fq::after { content: "+"; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: ${C.gold}; font-size: 1.4rem; font-weight: 400; }
      .tpc-fi.open .tpc-fq::after { content: "\\2212"; }
      .tpc-fa { display: none; padding: 0 0 18px; }
      .tpc-fi.open .tpc-fa { display: block; }
      .tpc-fa p { font-size: .95rem; line-height: 1.65; color: ${C.dim}; margin: 0; }

      /* forms */
      .tpc-input { width: 100%; font-size: 16px; min-height: 50px; padding: 12px 14px; border: 1px solid rgba(138,96,61,.3); border-radius: 6px; background: #fff; color: ${C.ink}; font-family: ${SANS}; }
      .tpc-form { display: grid; gap: 10px; text-align: left; }
      .tpc-form label span { display: block; font-size: .78rem; font-weight: 700; margin-bottom: 4px; color: ${C.text}; }

      /* checkout */
      .tpc-checkout { max-width: 900px; margin: 22px auto 0; background: ${C.white}; border: 1px solid rgba(138,96,61,.24); border-radius: 10px; padding: 20px 18px; scroll-margin-top: 80px; }
      .tpc-spin { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(138,96,61,.25); border-top-color: ${C.bronze}; animation: tpc-spin .9s linear infinite; }
      @keyframes tpc-spin { to { transform: rotate(360deg); } }

      /* final */
      .tpc-final { background: ${C.ink}; color: ${C.creamText}; text-align: center; padding: 66px 0; }
      .tpc-final .lines { font-family: ${SERIF}; font-size: clamp(1.25rem, 4.4vw, 1.9rem); line-height: 1.5; color: ${C.creamText}; max-width: 780px; margin: 0 auto; }
      .tpc-final .rocket { font-family: ${SERIF}; font-size: clamp(2rem, 7.4vw, 3.4rem); font-weight: 700; color: #fff; margin: 26px 0 8px; line-height: 1.1; }
      .tpc-final .fire { font-family: ${SERIF}; font-style: italic; font-size: clamp(1.15rem, 4vw, 1.6rem); color: ${C.goldSoft}; margin-bottom: 30px; }
      .tpc-final .signoff { font-family: ${SERIF}; font-style: italic; font-size: 1.3rem; color: #fff; margin-top: 30px; }

      /* footer */
      .tpc-footer { background: ${C.cocoa}; color: ${C.creamDim}; padding: 44px 0 108px; text-align: center; font-size: .8rem; line-height: 1.7; }
      .tpc-footer .fb { font-family: ${SERIF}; font-size: 1.5rem; color: #fff; }
      .tpc-footer .fs { font-size: .64rem; letter-spacing: .18em; text-transform: uppercase; color: ${C.gold}; margin: 6px 0 18px; }
      .tpc-footer a { color: ${C.creamText}; text-decoration: underline; text-underline-offset: 3px; }
      .tpc-footer .disc { max-width: 620px; margin: 20px auto 0; font-size: .72rem; color: rgba(198,184,166,.75); }
      .tpc-flinks { margin-top: 16px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; font-size: .74rem; }

      /* sticky */
      .tpc-sticky {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 70; background: ${C.ink};
        border-top: 1px solid rgba(213,168,75,.3); padding-bottom: env(safe-area-inset-bottom);
        transition: transform .35s cubic-bezier(.22,1,.36,1);
      }
      .tpc-sticky-in { max-width: 1180px; margin: 0 auto; min-height: 64px; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .tpc-sticky span { font-size: .72rem; font-weight: 700; color: ${C.goldSoft}; line-height: 1.35; letter-spacing: .04em; }
      .tpc-sticky button { width: auto; min-height: 46px; padding: 0 20px; font-size: .82rem; border-radius: 999px; white-space: nowrap; flex: none; }

      @media (min-width: 620px) {
        .tpc-rm-boxes { grid-template-columns: 1fr 1fr; }
        .tpc-pgrid { grid-template-columns: repeat(3, 1fr); }
        .tpc-scan-grid { grid-template-columns: 1fr 1fr; }
        .tpc-scan-grid > div { padding: 30px 24px; border-right: 1px solid rgba(213,168,75,.25); }
        .tpc-scan-grid > div:nth-child(2n) { border-right: none; }
        .tpc-scan-grid > div:nth-child(n+3) { border-bottom: none; }
      }
      @media (min-width: 760px) {
        .tpc { font-size: 18px; }
        .tpc-sec { padding: 84px 0; }
        .tpc-wrap { padding: 0 32px; }
        .tpc-soyou { column-count: 2; column-gap: 44px; }
        .tpc-tiers { grid-template-columns: 1fr 1fr; }
        .tpc-qgrid { grid-template-columns: 1fr 1fr; }
        .tpc-an { grid-template-columns: .8fr 1.2fr; }
        .tpc-rm { grid-template-columns: .8fr 1.2fr; gap: 52px; }
        .tpc-days .tpc-day { grid-template-columns: 120px 1fr 1fr; }
        .tpc-day.hdr { display: grid; }
        .tpc-day .d { padding: 26px 22px; border-right: 1px solid rgba(213,168,75,.22); display: block; }
        .tpc-day .t { padding: 26px 22px; border-right: 1px solid rgba(213,168,75,.22); }
        .tpc-day .o { padding: 26px 22px; display: flex; align-items: center; }
        .tpc-sticky { display: none; }
        .tpc-footer { padding-bottom: 44px; }
        .tpc-gbox { padding: 44px 40px; }
        .tpc-btn { width: auto; }
        .tpc-herobtn .tpc-btn { width: 100%; }
      }
      @media (min-width: 1000px) {
        .tpc-scan-grid { grid-template-columns: repeat(4, 1fr); }
        .tpc-scan-grid > div { border-bottom: none; border-right: 1px solid rgba(213,168,75,.25); }
        .tpc-scan-grid > div:last-child { border-right: none; }
        .tpc-scan-grid > div:nth-child(2n) { border-right: 1px solid rgba(213,168,75,.25); }
      }
      @media (prefers-reduced-motion: reduce) {
        .tpc-btn, .tpc-sticky { transition: none; }
        .tpc-spin { animation-duration: 3s; }
        .tpc-book-c { transform: none; }
      }
    `}</style>
  );
}

/* ==========================================================================
   ANNOUNCE + HEADER
   ========================================================================== */
function Announce({ doorsClosed }) {
  return (
    <div className="tpc-announce">
      <span>{CHALLENGE.NAME}</span>
      <i aria-hidden />
      <span><b>{CHALLENGE.DATE_RANGE_LABEL}, 2026</b></span>
      <i aria-hidden />
      <span>
        {doorsClosed
          ? 'This cohort has started'
          : `Doors close ${CHALLENGE.START_DATE_LABEL} at ${CHALLENGE.TIME_LABEL_ET}`}
      </span>
    </div>
  );
}

// Brand mark is deliberately NOT a link: this is a sales page and a logo that
// navigates home is a competing exit.
function SiteHeader({ doorsClosed, goToSeats, goToWaitlist }) {
  return (
    <header className="tpc-header">
      <div className="tpc-wrap">
        <nav className="tpc-nav">
          <div className="tpc-mark">
            <span className="badge" aria-hidden>JP</span>
            <span className="name">BraveWorks RN</span>
          </div>
          <button
            type="button"
            className="tpc-btn tpc-btn-gold tpc-nav-cta"
            onClick={() => (doorsClosed ? goToWaitlist('nav') : goToSeats('nav'))}
          >
            {doorsClosed ? 'Next Cohort' : 'Save My Seat'}
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ==========================================================================
   HERO
   ========================================================================== */
function Hero({ doorsClosed, chooseTier, goToSeats, goToWaitlist, left }) {
  return (
    <section className="tpc-hero" id="top">
      <div className="tpc-wrap">
        <div className="tpc-kick">Live on Zoom &middot; Three Nights &middot; Founding Cohort</div>
        <div className="tpc-pres">BraveWorks RN presents</div>
        <div className="tpc-name">The Three <span>Pressures</span> Challenge</div>

        <h1 className="tpc-h1">
          You got the prescription. <span>Did anyone ever give you the explanation?</span>
        </h1>

        <p className="tpc-sub">
          Three nights, live, with a nurse who spent twenty years in an ICU watching what these
          numbers actually do. By Thursday you will know what your number is made of, how to take a
          reading you can trust, and the exact words to bring to your next appointment.
        </p>

        <div className="tpc-strip">
          This is <b>NOT</b> another list of things to cut out. It is <b>the explanation.</b>
        </div>

        <div className="tpc-dateline">
          {CHALLENGE.START_DATE_LABEL} to {CHALLENGE.END_DATE_LABEL}
          <br />
          {CHALLENGE.TIME_WINDOW_ET} &middot; {CHALLENGE.TIME_LABEL_CT} &middot; one hour a night
        </div>

        <div style={{ marginBottom: 26 }}>
          <Countdown left={left} label="Doors close when Night 1 begins" tone="light" />
        </div>

        {/* "Regular" sits inside the strike element's own line on purpose. The
            hero is what gets screenshotted and pasted into a Facebook comment
            without the note underneath it, and a bare struck $97 next to $17
            reads as a former price. */}
        <div className="tpc-price">
          Regular <s>{usd(CHALLENGE.GA_REGULAR_PRICE)}</s>, founding cohort{' '}
          <b>{usd(CHALLENGE.SEAT_PRICE)}</b>
        </div>
        <div className="tpc-pricenote">
          Founding cohort pricing. Regular price {usd(CHALLENGE.GA_REGULAR_PRICE)} for General and{' '}
          {usd(CHALLENGE.VIP_REGULAR_PRICE)} for VIP, starting with the next cohort.
        </div>

        <div className="tpc-herobtn">
          {doorsClosed ? (
            <button type="button" className="tpc-btn tpc-btn-ink" onClick={() => goToWaitlist('hero')}>
              Tell me about the next one
            </button>
          ) : (
            <button
              type="button"
              className="tpc-btn tpc-btn-gold"
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'hero', CHALLENGE.SEAT_PRICE)}
            >
              Yes! Save My Seat, {usd(CHALLENGE.SEAT_PRICE)}
            </button>
          )}
          <div className="tpc-cta-sub">
            Joel Polley, RN &middot; 20 years ICU and emergency &middot; Every seat includes the{' '}
            {usd(KIT_PRICE)} 10-Day BP Reset Kit.
          </div>
          <div style={{ marginTop: 6 }}>
            <button type="button" className="tpc-link" onClick={() => goToSeats('hero_secondary')}>
              Compare the two seats
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   COUNTDOWN
   Fixed target. When it passes it does not go negative and does not freeze: it
   states plainly that the cohort has started.
   ========================================================================== */
function Countdown({ left, label, tone = 'light' }) {
  const dark = tone === 'dark';
  const closed = left <= 0;
  const { d, h, m, s } = parts(left);
  const numColor = dark ? C.white : C.ink;
  const lblColor = dark ? C.creamDim : C.bronze;

  if (closed) {
    return (
      <p style={{ margin: 0, fontWeight: 700, fontSize: '.95rem', color: dark ? C.creamText : C.ink }}>
        Night 1 is already underway. This cohort has started.
      </p>
    );
  }

  const cell = (n, l) => (
    <div key={l}>
      <div className="n" style={{ color: numColor }}>{String(n).padStart(2, '0')}</div>
      <div className="l" style={{ color: lblColor }}>{l}</div>
    </div>
  );

  return (
    <div>
      <p
        style={{
          margin: '0 0 10px', fontSize: '.62rem', fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: lblColor,
        }}
      >
        {label}
      </p>
      <div
        className="tpc-cd"
        aria-label={`${d} days, ${h} hours, ${m} minutes and ${s} seconds until Night 1`}
      >
        {cell(d, 'Days')}{cell(h, 'Hours')}{cell(m, 'Minutes')}{cell(s, 'Seconds')}
      </div>
    </div>
  );
}

/* ==========================================================================
   SCANNER STRIP
   ========================================================================== */
function Scanner() {
  return (
    <div className="tpc-scan">
      <div className="tpc-wrap">
        <div className="tpc-scan-grid">
          <div>
            <div className="l">What</div>
            <div className="v">3 Live Nights</div>
            <div className="s">Virtual, on Zoom. Replays included and yours to keep.</div>
          </div>
          <div>
            <div className="l">When</div>
            <div className="v">{CHALLENGE.DATE_RANGE_LABEL}</div>
            <div className="s">One hour a night, {CHALLENGE.TIME_WINDOW_ET}.</div>
          </div>
          <div>
            <div className="l">What You Leave With</div>
            <div className="v">Your 3-Day Log</div>
            <div className="s">One page, your own readings, the questions written down.</div>
          </div>
          <div>
            <div className="l">Who It Is For</div>
            <div className="v">Anyone managing a number</div>
            <div className="s">On medication or watching it. Alongside your doctor, never instead.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   REFRAME
   ========================================================================== */
function Reframe() {
  return (
    <section className="tpc-sec tpc-reframe">
      <div className="tpc-wrap">
        <div className="small">You do not need more willpower.</div>
        <div className="big">
          You have had willpower<br />for twenty years.<br />You need <span>the explanation.</span>
        </div>
        <p className="body">
          You cut the salt. You walked. You took the pill exactly as written. And the number still
          does whatever it wants, and nobody ever sat down and drew you a picture of why.{' '}
          <strong>That is not a discipline problem. That is an information problem, and it is the
          only kind of problem I can actually help with.</strong>
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   IDENTITY
   ========================================================================== */
function Identity() {
  return (
    <div className="tpc-ident">
      <div className="tpc-wrap">
        <span className="tpc-eyebrow" style={{ display: 'block', marginBottom: 20 }}>
          Who I Built These Three Nights For
        </span>
        <div className="you">
          You who got handed a slip of paper and no explanation.<br />
          You who has <span>taken the pill for nine years</span> and still cannot say what it does.<br />
          You whose dose went up the year you <span>did everything right.</span><br />
          You who feels your stomach drop every time the cuff tightens.
        </div>
        <div className="end">You are not a difficult patient. You are an uninformed one, and that is fixable.</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SO YOU CAN
   ========================================================================== */
function SoYouCan({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section className="tpc-sec" style={{ background: `linear-gradient(180deg, ${C.ivory}, ${C.cream})` }}>
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">Why Three Nights</span>
          <h2>So You Can&hellip;</h2>
        </div>
        <div className="tpc-soyou">
          {SO_YOU_CAN.map((row, i) => (
            <p key={i}>
              {row[0]}
              {row[1] ? <b>{row[1]}</b> : null}
              {row[2] || ''}
            </p>
          ))}
        </div>
        <p className="tpc-soyou-punch">
          You have been managing one number for years.<br />
          Three nights is enough to learn what is behind it.
        </p>
        <div className="tpc-cta">
          {doorsClosed ? (
            <button type="button" className="tpc-btn tpc-btn-ink" onClick={() => goToWaitlist('after_soyoucan')}>
              Tell me about the next one
            </button>
          ) : (
            <button
              type="button"
              className="tpc-btn tpc-btn-ink"
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_soyoucan', CHALLENGE.SEAT_PRICE)}
            >
              Yes! Save My Seat
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   THE NIGHTS TABLE
   Three nights, plus the VIP fourth day as the highlighted final row.
   ========================================================================== */
function Nights({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section className="tpc-sec tpc-ink" id="nights">
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">The Curriculum</span>
          <h2 style={{ color: '#fff' }}>Three Nights. Three Pressures. One Conversation.</h2>
          <p>
            Your blood pressure has three everyday drivers. Stress. Sugar. Sodium. They pull on each
            other, which is why working just one of them never holds. You walk away from every
            single night with something done, not something to think about.
          </p>
        </div>

        <div className="tpc-days">
          <div className="tpc-day hdr">
            <div>Night</div>
            <div>The Session</div>
            <div>What You Walk Away With</div>
          </div>

          {NIGHTS.map((night) => (
            <div className="tpc-day" key={night.n}>
              <div className="d">
                {night.n}
                <em>{night.when}</em>
              </div>
              <div className="t">
                <h3>{night.title}</h3>
                <p>{night.promise}</p>
              </div>
              <div className="o">{night.walk}</div>
            </div>
          ))}

          <div className="tpc-day last">
            <div className="d">
              {VIP_NIGHT.n}
              <em>{VIP_NIGHT.when}</em>
            </div>
            <div className="t">
              <span className="tpc-vip-flag">VIP seat only</span>
              <h3>{VIP_NIGHT.title}</h3>
              <p>{VIP_NIGHT.promise}</p>
            </div>
            <div className="o">
              <span>
                <b>{VIP_NIGHT.walk}</b>
                <br />
                {CHALLENGE.VIP_DAY_LABEL}, {CHALLENGE.VIP_TIME_ET} ({CHALLENGE.VIP_TIME_CT}).
              </span>
            </div>
          </div>
        </div>

        <p style={{ margin: '26px 0 0', textAlign: 'center', fontFamily: SERIF, fontSize: '1.4rem', color: C.goldSoft }}>
          Three nights. Three things done. Nothing to catch up on.
        </p>

        <div className="tpc-cta">
          {doorsClosed ? (
            <button type="button" className="tpc-btn tpc-btn-gold" onClick={() => goToWaitlist('after_nights')}>
              Tell me about the next one
            </button>
          ) : (
            <button
              type="button"
              className="tpc-btn tpc-btn-gold"
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_nights', CHALLENGE.SEAT_PRICE)}
            >
              Yes! Save My Seat, {usd(CHALLENGE.SEAT_PRICE)}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   THE ARTIFACT
   ========================================================================== */
function Artifact() {
  return (
    <section className="tpc-sec">
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">The Artifact</span>
          <h2>You Do Not Leave With Notes.<br />You Leave With the Page in Your Hand.</h2>
        </div>
        <div className="tpc-rm">
          <div className="tpc-book">
            <div className="tpc-book-c">
              <div className="tpc-book-b">BraveWorks RN</div>
              <div className="tpc-book-r" />
              <div className="tpc-book-t">The 3-Day Log</div>
              <div className="tpc-book-s">Three Pressures Challenge &middot; Cohort One</div>
            </div>
          </div>
          <div>
            <p style={{ color: C.dim }}>
              One page. Not a workbook you will never open. Not twenty new rules. Three days of your
              own readings and four things written underneath them, on a single sheet a busy doctor
              will actually look at:
            </p>
            <div className="tpc-rm-boxes">
              <div className="tpc-rb">
                <div className="n">01</div>
                <h4>Your Real Numbers</h4>
                <p>Three days, both arms, taken correctly, at the same times, in your own home.</p>
              </div>
              <div className="tpc-rb">
                <div className="n">02</div>
                <h4>What You Changed</h4>
                <p>The three things you adjusted across stress, sugar and sodium, and why each one.</p>
              </div>
              <div className="tpc-rb">
                <div className="n">03</div>
                <h4>Your Questions</h4>
                <p>What to ask about your medication, what to ask about your labs, in your own handwriting.</p>
              </div>
              <div className="tpc-rb">
                <div className="n">04</div>
                <h4>The Opening Line</h4>
                <p>The exact words that start the conversation instead of starting a fight.</p>
              </div>
            </div>
            <p style={{ fontFamily: SERIF, fontSize: '1.3rem', color: C.bronze, marginTop: 24, lineHeight: 1.3 }}>
              You will not walk in hoping. You will walk in prepared, for the first time in years.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   TICKETS
   ========================================================================== */
function Tickets({
  doorsClosed, chooseTier, goToWaitlist, activeTier, checkoutState, checkoutError,
  checkoutRef, panelRef,
}) {
  return (
    <section className="tpc-sec tpc-creamsec" id="tickets">
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">Choose Your Seat</span>
          <h2>Two Ways In</h2>
          <p>
            Both seats include all three live nights, all three replays, and the full 10-Day BP
            Reset Kit, which this site sells on its own for {usd(KIT_PRICE)}. The only difference is
            the fourth day.
          </p>
        </div>

        <div className="tpc-tiers">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.key}
              tier={tier}
              doorsClosed={doorsClosed}
              active={activeTier === tier.key}
              onChoose={() => chooseTier(tier.key, 'tier_card', tier.price)}
              onWaitlist={() => goToWaitlist('tier_card')}
            />
          ))}
        </div>

        {/* Single checkout mount point, directly under the cards. */}
        <div ref={panelRef}>
          {doorsClosed ? null : (
            <CheckoutPanel
              activeTier={activeTier}
              state={checkoutState}
              error={checkoutError}
              containerRef={checkoutRef}
            />
          )}
        </div>

        {doorsClosed && (
          <div className="tpc-checkout" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 14px', color: C.text }}>
              <strong>Registration for the August cohort is closed.</strong> Night 1 is already
              underway. Leave your name and email and I will tell you first when the next one is on
              the calendar.
            </p>
            <button type="button" className="tpc-btn tpc-btn-ink" onClick={() => goToWaitlist('tickets_closed')}>
              Tell me about the next one
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 30, fontSize: '.88rem', color: C.dim }}>
          Doors close {CHALLENGE.START_DATE_LABEL} at {CHALLENGE.TIME_LABEL_ET}, because that is when
          Night 1 begins. Regular prices of {usd(CHALLENGE.GA_REGULAR_PRICE)} and{' '}
          {usd(CHALLENGE.VIP_REGULAR_PRICE)} start with the next cohort.
        </p>
      </div>
    </section>
  );
}

function TierCard({ tier, doorsClosed, active, onChoose, onWaitlist }) {
  return (
    <div className={`tpc-tier${tier.featured ? ' feat' : ''}${active ? ' active' : ''}`}>
      {tier.ribbon ? <div className="tpc-ribbon">{tier.ribbon}</div> : null}
      <h3>{tier.name}</h3>
      <div className="who">{tier.who}</div>
      {/* "Regular price" label, never "was". See GA_REGULAR_PRICE in the config
          block for why the wording is load bearing. */}
      <div className="reg">
        Regular price <s>{usd(tier.regular)}</s>
      </div>
      <div className="amt">{usd(tier.price)}</div>
      <div className="time">{tier.time}</div>
      <div className="rule" />
      <ul>
        {tier.items.map((item, i) => {
          const isObj = typeof item === 'object';
          return (
            <li key={i}>
              {isObj ? (<><b>{item.lead}</b>{item.rest}</>) : item}
            </li>
          );
        })}
        {tier.out.map((item, i) => (
          <li className="out" key={`out-${i}`}>{item}</li>
        ))}
      </ul>
      {doorsClosed ? (
        <button type="button" className="tpc-btn tpc-btn-out" onClick={onWaitlist}>
          Tell me about the next one
        </button>
      ) : (
        <button
          type="button"
          className={`tpc-btn ${tier.featured ? 'tpc-btn-gold' : 'tpc-btn-out'}`}
          onClick={onChoose}
        >
          {tier.cta}
        </button>
      )}
      <div className="note">{tier.note}</div>
    </div>
  );
}

/* ==========================================================================
   CHECKOUT PANEL
   Three honest states. There is no fourth state where the buyer waits forever.
   ========================================================================== */
function CheckoutPanel({ activeTier, state, error, containerRef }) {
  if (!activeTier) return null;
  const tier = TIERS.find((x) => x.key === activeTier);
  const failed = state === 'failed';
  const duplicate = failed && error === 'already_purchased';

  return (
    <div className="tpc-checkout">
      <p
        style={{
          margin: 0, fontSize: '.62rem', fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.bronze,
        }}
      >
        {duplicate
          ? 'You already have this seat'
          : failed
            ? 'One moment of honesty'
            : `Checkout · ${tier ? tier.name : ''} seat`}
      </p>

      {!failed && (
        <p style={{ margin: '8px 0 14px', fontSize: '.85rem', color: C.dim }}>
          Secure checkout by Stripe. One payment. Nothing here renews.
        </p>
      )}

      {state === 'mounting' && (
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', padding: '18px 0' }}>
          <span className="tpc-spin" aria-hidden />
          <span style={{ fontSize: '.95rem', color: C.text }} role="status">Opening checkout...</span>
        </div>
      )}

      {/* Stripe mounts here. Hidden until it actually mounts so a failed attempt
          never leaves an empty grey box on the page. */}
      <div
        ref={containerRef}
        style={{ display: state === 'mounted' ? 'block' : 'none', minHeight: state === 'mounted' ? 320 : 0 }}
      />

      {duplicate ? <AlreadyPurchased tier={tier} /> : failed ? <CheckoutUnavailable tier={tier} /> : null}
    </div>
  );
}

// api/_dupe-guard.js answered 409 already_purchased: this email completed a
// paid checkout for this same tier inside the last 30 minutes. Telling them
// "nothing was charged" here would be false and is exactly the confusion that
// produced duplicate charges and then chargebacks in the first place.
function AlreadyPurchased({ tier }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ margin: '0 0 12px', fontSize: '.95rem', lineHeight: 1.6, color: C.text }}>
        <strong>Your order already went through.</strong> That payment was taken, so I have not
        opened a second one. Check your inbox for the receipt and your confirmation
        {tier ? ` for the ${tier.name} seat` : ''}. If it has not landed within the hour, look in
        your spam folder first, then write to{' '}
        <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`} style={{ color: C.bronze, fontWeight: 700 }}>
          {CHALLENGE.SUPPORT_EMAIL}
        </a>{' '}
        and I will sort it out by hand.
      </p>
      <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.6, color: C.dim }}>
        Genuinely meant to buy a second seat, for a spouse or a friend? Write to that same address
        and I will set it up by hand so you are not charged twice by accident.
      </p>
    </div>
  );
}

function CheckoutUnavailable({ tier }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ margin: '0 0 12px', fontSize: '.95rem', lineHeight: 1.6, color: C.text }}>
        <strong>Checkout is not open yet.</strong> This one is on me, not on you. The payment link
        for this challenge is not live at the moment. Leave your name and email and I will send you
        the seat link the second it is working, or write me directly at{' '}
        <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`} style={{ color: C.bronze, fontWeight: 700 }}>
          {CHALLENGE.SUPPORT_EMAIL}
        </a>.
      </p>
      <SignupForm
        intent="seat-link"
        tier={tier ? tier.key : undefined}
        buttonLabel="Send me the seat link"
        successLine="You are on the list. I will send the seat link the moment it is live."
        microcopy="Nothing was charged."
        event="chal_seatlink_submit"
      />
    </div>
  );
}

/* ==========================================================================
   PRICE REASONING
   Every figure here is derived from real transaction prices. No stack totals,
   no compare-at, no invented value tags.
   ========================================================================== */
function PriceReasoning() {
  return (
    <section className="tpc-sec" style={{ paddingTop: 0 }}>
      <div className="tpc-wrap tpc-narrow">
        <div style={{ background: C.white, border: '1px solid rgba(138,96,61,.22)', borderRadius: 10, padding: '28px 24px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: 14 }}>Why it costs what it costs.</h3>
          <p style={{ color: C.dim, fontSize: '.96rem' }}>
            A founding seat is {usd(CHALLENGE.SEAT_PRICE)}, and it includes the 10-Day BP Reset Kit,
            all {KIT_FILE_COUNT} documents, which sells on this site for exactly {usd(KIT_PRICE)} on
            its own. So the kit is the whole ticket price and the three live nights ride along with
            it. That is {'$'}{SEAT_PER_NIGHT} a night.
          </p>
          <p style={{ color: C.dim, fontSize: '.96rem' }}>
            VIP is {usd(CHALLENGE.VIP_PRICE)} and the difference is one thing: the fourth day on{' '}
            {CHALLENGE.VIP_DAY_LABEL}, where we read real logs out loud and I answer questions until
            they run out. There is no third tier, no upsell during the calls, and nothing here
            renews. One payment, and the week is yours.
          </p>
          <p style={{ color: C.dim, fontSize: '.96rem', margin: 0 }}>
            <strong style={{ color: C.ink }}>About the crossed out prices.</strong> The regular
            prices are {usd(CHALLENGE.GA_REGULAR_PRICE)} and{' '}
            {usd(CHALLENGE.VIP_REGULAR_PRICE)}, and that is what the next cohort pays. They are not
            prices anybody was ever charged for this challenge, because this is the first time it
            has been run. I would rather fill this first room than protect the price, so the
            founding cohort gets it at {usd(CHALLENGE.SEAT_PRICE)} and{' '}
            {usd(CHALLENGE.VIP_PRICE)}. That is the whole trick, and there is not a second one.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   PROOF, WITHOUT TESTIMONIALS
   This is where a launch page puts a wall of quotes. Joel has no consented
   ones, so this is earned authority instead, which is true and does not
   require anyone else's words.
   ========================================================================== */
function Proof({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section className="tpc-sec tpc-ink">
      <div className="tpc-wrap">
        <div className="tpc-proof-lead">
          <span className="tpc-eyebrow" style={{ display: 'block', marginBottom: 16 }}>Let Us Be Honest</span>
          <div className="big">You will not find testimonials on this page.</div>
          <p>
            This is <b>Cohort One.</b> The Three Pressures Challenge has never been run before.
          </p>
          <p>
            I could have waited a year, run it quietly, collected the quotes, then shown you a wall
            of smiling strangers and charged four times as much. Half the internet does that, and a
            good number of those quotes were written by somebody who was paid to write them. I will
            not do it. If a customer&rsquo;s words ever appear on this page, that customer will have
            said yes in writing first.
          </p>
          <p><b>But then you would not be here.</b> You would be in cohort five, paying full price.</p>
          <p>So here is what I can show you instead.</p>
        </div>

        <div className="tpc-pgrid">
          {PROOF.map((card) => (
            <div className="tpc-pcard" key={card.h}>
              <div className="n">{card.n}</div>
              <h4>{card.h}</h4>
              <p>{card.p}</p>
            </div>
          ))}
        </div>

        <div className="tpc-cta">
          {doorsClosed ? (
            <button type="button" className="tpc-btn tpc-btn-gold" onClick={() => goToWaitlist('after_proof')}>
              Tell me about the next one
            </button>
          ) : (
            <button
              type="button"
              className="tpc-btn tpc-btn-gold"
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_proof', CHALLENGE.SEAT_PRICE)}
            >
              I Will Be One of the First, {usd(CHALLENGE.SEAT_PRICE)}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   QUALIFY
   ========================================================================== */
function Qualify() {
  return (
    <section className="tpc-sec">
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">Read This Part Carefully</span>
          <h2>Who This Is For</h2>
        </div>
        <div className="tpc-qgrid">
          <div className="tpc-q yes">
            <h3>This is for you if&hellip;</h3>
            <ul>
              {QUALIFY_YES.map((row) => <li key={row}>{row}</li>)}
            </ul>
          </div>
          <div className="tpc-q no">
            <h3>This is not for you if&hellip;</h3>
            <ul>
              {QUALIFY_NO.map((row) => <li key={row}>{row}</li>)}
            </ul>
            <p style={{ marginTop: 18, marginBottom: 0, fontSize: '.88rem', color: C.dim }}>
              Everything here is education and lifestyle support that works alongside your doctor.
              Your doctor makes every medication call. Every single one.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   HOST
   ========================================================================== */
function Host() {
  return (
    <section className="tpc-sec tpc-creamsec">
      <div className="tpc-wrap">
        <div className="tpc-an">
          <div className="tpc-ph">
            <div className="cap">Joel Polley, RN<br />Louisville, Kentucky</div>
          </div>
          <div>
            <span className="tpc-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Your Host</span>
            <div className="tpc-an-q">
              &ldquo;I got tired of meeting people at the worst possible moment.&rdquo;
            </div>
            <p style={{ color: C.dim }}>
              For twenty years I worked intensive care and emergency. I am the nurse who stood at the
              head of the bed at three in the morning. I hung the drip when the pressure would not
              come down, and I sat with the family in the hallway afterward.
            </p>
            <p style={{ color: C.dim }}>
              People arrived on four medications who could not tell me what a single one of them did.
              Not because they were not smart. Because nobody ever had fifteen spare minutes. And I
              saw how many readings were simply wrong: wrong cuff, wrong arm, wrong position, taken
              thirty seconds after somebody rushed down a hallway. Then real decisions got made on
              that number.
            </p>
            <div className="tpc-an-hi">
              The pill was never the enemy and never the whole answer. It quiets one corner. The
              other two keep pulling.
            </div>
            <p style={{ color: C.dim }}>
              I left the bedside to teach this because everything I knew kept arriving ten years too
              late to be useful. Three nights is early. Three nights is useful. That is why I am
              doing it live instead of writing another PDF.
            </p>
            <div className="tpc-an-n">
              Joel Polley, RN
              <span>BraveWorks RN &middot; 20 Years ICU and Emergency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   GUARANTEE
   ========================================================================== */
function Guarantee() {
  return (
    <section className="tpc-sec">
      <div className="tpc-wrap">
        <div className="tpc-gbox">
          <div className="tpc-gseal" aria-hidden>&#10022;</div>
          <h3>Three Promises, Written Plainly</h3>
          <p>
            I am not asking you to trust me. I am asking you to show up, and letting you keep your
            money if I do not hold up my end.
          </p>

          <div className="tpc-promise">
            <div className="lbl">Promise 1 &middot; The kit, either way</div>
            <p>
              Every seat includes the 10-Day BP Reset Kit, and that kit carries the same promise it
              always has on this site. Run the full 10-day plan. If you do not feel a difference,
              reply with the word REFUND and your money comes back. Keep the books either way. No
              hoops, no fine print. Thirty days.
            </p>
          </div>

          <div className="tpc-promise">
            <div className="lbl">Promise 2 &middot; Change your mind before we start</div>
            <p>
              Your seat is fully refundable for any reason right up until {CHALLENGE.START_DATE_LABEL}{' '}
              at {CHALLENGE.TIME_LABEL_ET}. Change your mind, reply REFUND, done. No reason needed.
              That applies to both seats.
            </p>
          </div>

          <div className="tpc-promise">
            <div className="lbl">Promise 3 &middot; The did-the-work guarantee</div>
            <p>
              Once Night 1 has happened I cannot un-hold a live call, so here is what replaces a
              blanket refund after that point.
            </p>
            <p>
              Do the work. That means: be on all three nights or watch all three replays, and email
              me your completed 3-Day Log by {CHALLENGE.LOG_DUE_LABEL}. That is the thing I am asking
              you to build anyway, and I tell you where to send it on Night 1.
            </p>
            <p style={{ marginBottom: 0 }}>
              If you did that and you still feel the week was not worth what you paid, reply REFUND
              by {CHALLENGE.REFUND_BY_LABEL} and I send back every dollar. You keep the kit. You keep
              the workbook. You keep the replays. I do not ask you to prove anything else and I do
              not ask you why.
            </p>
          </div>

          <p style={{ margin: '20px 0 0', fontSize: '.78rem', color: C.dim }}>
            Refunds are processed within 5 to 10 business days to the original payment method, same
            as everything else on this site.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   DEADLINE
   Priestley: the cohort start date IS the demand engineering. No manufactured
   scarcity is needed, and none is permitted here.
   ========================================================================== */
function Deadline({ doorsClosed, left }) {
  return (
    <section className="tpc-sec tpc-cocoa">
      <div className="tpc-wrap tpc-narrow">
        <div className="tpc-head" style={{ marginBottom: 26 }}>
          <span className="tpc-eyebrow">One Real Deadline</span>
          <h2 style={{ color: '#fff' }}>
            Doors close {CHALLENGE.START_DATE_LABEL} at {CHALLENGE.TIME_LABEL_ET}, because that is
            when we start.
          </h2>
        </div>

        <p style={{ color: C.creamDim }}>
          There is no price jump waiting on Wednesday. There is no seat counter ticking down. There
          is no bonus that disappears at midnight. I have taken all of that off this page on purpose,
          because a trust brand cannot run a fake clock.
        </p>
        <p style={{ color: C.creamDim }}>
          There is exactly one real deadline, and it is this: Night 1 is live at{' '}
          {CHALLENGE.TIME_LABEL_ET} on {CHALLENGE.START_DATE_LABEL}. You cannot join a call that has
          already happened. When that clock hits zero, registration for this cohort closes and this
          page stops taking new seats.
        </p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <Countdown left={left} label="Night 1 begins in" tone="dark" />
        </div>

        <div id="next-cohort" style={{ scrollMarginTop: 80 }}>
          {doorsClosed ? (
            <div style={{ background: 'rgba(245,239,231,.07)', border: '1px solid rgba(213,168,75,.3)', borderRadius: 10, padding: '24px 20px' }}>
              <p style={{ color: C.creamText, fontSize: '.96rem' }}>
                <strong>Registration for the August cohort is closed.</strong> Leave your name and
                email and I will tell you first when the next one is on the calendar. No spam, and no
                charge for being on the list.
              </p>
              <SignupForm
                intent="waitlist"
                buttonLabel="Tell me about the next one"
                successLine="You are on the list. Watch your inbox."
                microcopy="Free. Unsubscribe anytime."
                event="chal_waitlist_submit"
                onDark
              />
            </div>
          ) : (
            <p style={{ margin: 0, textAlign: 'center', fontSize: '.85rem', color: C.creamDim }}>
              Once that clock reaches zero this page stops taking seats and shows a form for the next
              cohort instead.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SIGNUP FORM (waitlist + seat-link capture)
   Posts to /api/challenge-signup, which owns the per-IP rate limiter, the
   email validation and the KV write. A non-ok response is surfaced honestly
   with Joel's real address as the fallback, never swallowed into a fake
   success state.
   ========================================================================== */
function SignupForm({ intent, tier, buttonLabel, successLine, microcopy, event, onDark }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState('error');
      return;
    }
    setState('sending');
    try {
      // intent is EXPLICIT. The endpoint defaults an intent-less body to
      // 'waitlist', and a seat-link capture silently filed as a waitlist would
      // lose the one signal that matters: a live buyer hit a dead checkout.
      const res = await fetch('/api/challenge-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          email: email.trim(),
          firstName: name.trim(),
          ...(tier ? { tier } : {}),
        }),
      });
      const ok = res.ok;
      setState(ok ? 'done' : 'error');
      t(event, { intent, tier: tier || null, ok, status: res.status });
    } catch {
      setState('error');
      t(event, { intent, tier: tier || null, ok: false, status: 0 });
    }
  }

  if (state === 'done') {
    return (
      <p
        style={{
          margin: 0, padding: '16px 18px', borderRadius: 8,
          background: onDark ? 'rgba(213,168,75,.14)' : 'rgba(213,168,75,.12)',
          border: '1px solid rgba(213,168,75,.4)',
          color: onDark ? C.creamText : C.text, fontSize: '.95rem',
        }}
        role="status"
      >
        {successLine}
      </p>
    );
  }

  const labelColor = onDark ? C.creamText : C.text;

  return (
    <form onSubmit={submit} className="tpc-form">
      <label>
        <span style={{ color: labelColor }}>First name</span>
        <input
          className="tpc-input"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
        />
      </label>
      <label>
        <span style={{ color: labelColor }}>Email address</span>
        <input
          className="tpc-input"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <button type="submit" className="tpc-btn tpc-btn-gold" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : buttonLabel}
      </button>
      {state === 'error' && (
        <p style={{ margin: 0, fontSize: '.85rem', color: onDark ? C.goldSoft : C.bronze }} role="alert">
          That did not go through. Check the address, or write me directly at{' '}
          <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>
            {CHALLENGE.SUPPORT_EMAIL}
          </a>{' '}
          and I will add you by hand.
        </p>
      )}
      <p style={{ margin: 0, fontSize: '.76rem', color: onDark ? C.creamDim : C.dim }}>{microcopy}</p>
    </form>
  );
}

/* ==========================================================================
   FAQ
   Accordion on every viewport. First two open by default.
   ========================================================================== */
function Faq() {
  const [open, setOpen] = useState(() => {
    const init = new Set();
    FAQ.forEach((item, i) => { if (item.open) init.add(i); });
    return init;
  });

  const toggle = (i) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
        t('chal_faq_open', { index: i, question: FAQ[i].q.slice(0, 80) });
      }
      return next;
    });
  };

  return (
    <section className="tpc-sec tpc-creamsec">
      <div className="tpc-wrap">
        <div className="tpc-head">
          <span className="tpc-eyebrow">Answers</span>
          <h2>The Questions People Actually Ask Me</h2>
        </div>
        <div className="tpc-faq">
          {FAQ.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div className={`tpc-fi${isOpen ? ' open' : ''}`} key={item.q}>
                <button
                  type="button"
                  className="tpc-fq"
                  aria-expanded={isOpen}
                  aria-controls={`tpc-fa-${i}`}
                  id={`tpc-fq-${i}`}
                  onClick={() => toggle(i)}
                >
                  {item.q}
                </button>
                <div className="tpc-fa" id={`tpc-fa-${i}`} role="region" aria-labelledby={`tpc-fq-${i}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   THE CLOSE
   ========================================================================== */
function Close({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section className="tpc-final">
      <div className="tpc-wrap">
        <span className="tpc-eyebrow" style={{ color: C.goldSoft, display: 'block', marginBottom: 20 }}>
          One More Thing
        </span>
        <div className="lines">
          Every appointment you left with more questions than you came in with.<br />
          Every number read out loud without an explanation.<br />
          Every year you did what you were told and watched it go up anyway.<br />
          <em style={{ color: C.goldSoft }}>None of that was you failing.</em>
        </div>
        <div className="rocket">Nobody drew you the picture.</div>
        <div className="fire">Three nights is where <b style={{ fontStyle: 'normal' }}>we draw it.</b></div>

        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          {doorsClosed ? (
            <button type="button" className="tpc-btn tpc-btn-gold" onClick={() => goToWaitlist('final_close')}>
              Tell me about the next one
            </button>
          ) : (
            <button
              type="button"
              className="tpc-btn tpc-btn-gold"
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'final_close', CHALLENGE.SEAT_PRICE)}
            >
              Yes! Save My Seat, {CHALLENGE.DATE_RANGE_LABEL}
            </button>
          )}
          <p style={{ fontSize: '.8rem', color: C.creamDim, marginTop: 14 }}>
            {CHALLENGE.DATE_RANGE_LABEL} &middot; {CHALLENGE.TIME_WINDOW_ET} &middot; one hour a
            night &middot; replays included &middot; secure checkout
          </p>
        </div>

        <div className="signoff">Joel</div>
        <p style={{ fontSize: '.78rem', color: C.creamDim, margin: '4px 0 0' }}>
          Joel Polley, RN &middot; BraveWorks RN
        </p>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '.95rem', color: 'rgba(198,184,166,.7)', marginTop: 26 }}>
          Genetics writes the recipe. Lifestyle bakes the cake. Be your own steward.
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   FOOTER
   The medication disclaimer block is copied byte for byte from
   src/pages/CheckoutPage.jsx. Do not paraphrase, shorten, or reorder.
   ========================================================================== */
function PageFooter() {
  return (
    <footer className="tpc-footer">
      <div className="tpc-wrap">
        <div className="fb">BraveWorks RN</div>
        <div className="fs">{CHALLENGE.NAME} &middot; Cohort One</div>
        <p style={{ margin: 0 }}>Stress. Sugar. Sodium. Alongside your doctor, never instead of them.</p>
        <p className="disc">
          These statements have not been evaluated by the FDA. This product is not intended to
          diagnose, treat, or prevent any disease.
        </p>
        <p className="disc">
          Educational and lifestyle content only. Joel Polley is a Registered Nurse, not a
          prescribing physician. Never start, stop, or adjust medication without your doctor.
        </p>
        <p className="disc">Results not typical. Most readers see modest results or none.</p>
        <div className="tpc-flinks">
          <a href="/disclaimer">Disclaimer</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <span style={{ opacity: .7 }}>&copy; 2026 BraveWorks RN. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

/* ==========================================================================
   STICKY MOBILE BAR
   Appears past scrollY 600, same threshold CheckoutPage uses. Slides in via
   transform instead of popping. Hidden at 760px and up.
   ========================================================================== */
function StickyBar({ doorsClosed, chooseTier, goToWaitlist, goToSeats, activeTier }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Once a tier is chosen the bar must stop being a GA button. Calling
  // chooseTier(SEAT_TIER) here would tear down a mounted VIP checkout, remount
  // GA, and silently move a buyer who had already picked the $47 seat onto the
  // $17 one. After a choice it just scrolls back to the open form.
  const chosen = activeTier ? TIERS.find((x) => x.key === activeTier) : null;

  return (
    <div
      className="tpc-sticky"
      style={{ transform: show ? 'translateY(0)' : 'translateY(115%)' }}
      // No aria-hidden: the button inside stays focusable, and a focusable
      // element inside an aria-hidden subtree is an accessibility violation.
      // The bar is moved off screen by transform, which is enough.
      inert={show ? undefined : true}
    >
      <div className="tpc-sticky-in">
        <span>
          {doorsClosed
            ? 'August cohort has started'
            : chosen
              ? `${chosen.name} seat · ${usd(chosen.price)}`
              : `${NIGHT_COUNT} Nights Live · ${CHALLENGE.DATE_RANGE_SHORT} · from ${usd(CHALLENGE.SEAT_PRICE)}`}
        </span>
        <button
          type="button"
          className="tpc-btn tpc-btn-gold"
          tabIndex={show ? 0 : -1}
          onClick={() => {
            if (doorsClosed) return goToWaitlist('sticky_bar');
            if (chosen) return goToSeats('sticky_bar_return');
            return chooseTier(CHALLENGE.SEAT_TIER, 'sticky_bar', CHALLENGE.SEAT_PRICE);
          }}
        >
          {doorsClosed ? 'Next cohort' : chosen ? 'Back to checkout' : 'Save my seat'}
        </button>
      </div>
    </div>
  );
}
