// ChallengePage (route: /challenge) - the sales page for "The Three Pressures
// Challenge", a 5 night LIVE paid cohort. REBUILT WHOLESALE 2026-07-26.
//
// WHY THE OLD PAGE DIED, AND WHAT THIS ONE MAY NOT DO
// The May build at this route was retired 2026-07-04 for price jump countdowns,
// 50 seat caps, a Monday 10 PM class that no longer existed, an expired
// RestoreHER ticket bonus, and a signup form whose endpoint 410s. The
// 2026-07-25 full system audit then found fabricated testimonials and phantom
// compare-at prices across the site. So this page carries hard rules:
//   - NO seat cap. No "only 40 spots". No "12 left".
//   - NO tier shown as SOLD OUT.
//   - NO invented value tags. The only dollar figures on this page are prices
//     something has actually sold for ($17 kit, $47 GA, $97 VIP) and arithmetic
//     derived from them. KIT_STACK_TOTAL ($209) is deliberately NOT used as an
//     anchor: it is a sum of per item value tags, which is exactly the pattern
//     the audit spent a week removing.
//   - NO fake deadline. There is ONE real deadline and it is honest: a live
//     Monday night call cannot be attended on Tuesday. The countdown targets
//     that instant and degrades to a closed-doors waitlist when it passes.
//   - NO testimonials. Joel has no consented ones. Where a launch page would
//     put social proof, this page puts earned authority instead.
//
// STRIPE STATUS: no price exists for this challenge yet. Creating one is a
// financial write and Joel has not approved it. api/create-embedded-checkout.js
// reads process.env.CHALLENGE_GA_PRICE_ID with NO
// hardcoded fallback and fails loudly when they are unset. This page therefore
// degrades honestly: a click that cannot reach a payment form shows the
// "Checkout is not open yet" card within 3 seconds and captures the interest at
// /api/challenge-signup. It never shows a spinner that does not resolve.
//
// Standalone: own minimal header, no site Navbar, no competing exits. The only
// outbound links are the legally required Disclaimer / Terms / Privacy.
// Mobile first: fold budgeted against 390 x 659 (real iPhone Safari with the
// address bar expanded), inputs at 16px so iOS does not zoom on focus, tap
// targets 48px.
//
// ZERO em dashes in visible copy. NEWSTART clean. Education alongside the
// doctor, never a clinical outcome claim, never a medication change.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowRight, Check, ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { KIT_FILE_COUNT, KIT_PRICE } from '../data/kitStack';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';

/* ==========================================================================
   CHALLENGE CONFIG - change prices and dates HERE and nowhere else.
   Tier prices are ORCHESTRATOR DEFAULTS chosen 2026-07-26, not dictated by
   Joel. Every price string on the page is derived from SEAT_PRICE
   and KIT_PRICE, so one edit here moves the whole page.
   The two Stripe price ids are SERVER side only:
     process.env.CHALLENGE_GA_PRICE_ID   (the single seat)
   with no fallback, so a missing id fails loudly instead of charging the
   wrong product. Nothing about them is exposed to the browser.
   ========================================================================== */
const CHALLENGE = {
  NAME: 'The Three Pressures Challenge',
  SUBTITLE: 'Five nights live with Joel Polley, RN',
  // Must match api/create-embedded-checkout.js and api/challenge-signup.js exactly,
  // or PostHog events cannot be joined to Stripe metadata or the KV records.
  COHORT_ID: '2026-08-04',

  // Tue Aug 4, 7:00pm CT. Doors close at this exact instant.
  // 2026-07-26 (Joel): moved off Monday. That also clears the collision with
  // the FREE Beyond the Cuff masterclass, which runs Mondays at this same hour.
  START_ISO_CT: '2026-08-04T19:00:00',
  START_DATE_LABEL: 'Tuesday, August 4',
  END_DATE_LABEL: 'Sunday, August 9',
  // Five nights, NOT five consecutive dates: Saturday is the Sabbath and this
  // site's own gate closes commerce Friday sundown to Saturday sundown, so
  // Night 5 moves to Sunday rather than running on it.
  DATE_RANGE_LABEL: 'August 4 to 9',
  DATE_RANGE_SHORT: 'Aug 4',
  TIME_LABEL_CT: '7:00pm CT',
  TIME_LABEL_ET: '8:00pm ET',
  NIGHT_LENGTH: 'about 60 minutes',

  // 2026-07-26 (Joel): "it will be 97 for the 5 day challenge". ONE seat, one
  // price. The two-tier GA/VIP split is gone; the single seat carries what VIP
  // carried, since that is what $97 was buying.
  SEAT_PRICE: 97,
  SEAT_TIER: 'challenge-ga',

  LOG_DUE_LABEL: 'Monday, August 10',
  REFUND_BY_LABEL: 'August 19',
  SUPPORT_EMAIL: 'braveworksrn@gmail.com',
};

const NIGHT_COUNT = 5;
const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const SEAT_PER_NIGHT = (CHALLENGE.SEAT_PRICE / NIGHT_COUNT).toFixed(2);    // 19.40
const SEAT_LESS_KIT = CHALLENGE.SEAT_PRICE - KIT_PRICE;                    // 80
const SEAT_LESS_KIT_PER_NIGHT = Math.round(SEAT_LESS_KIT / NIGHT_COUNT);   // 16

/* ── Stripe: one instance at module load (same pattern as PayPage / AllInPage).
      Null when the publishable key is unset, which routes straight to the
      honest "checkout is not open yet" card instead of a dead button. ── */
const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

/* ── palette ─────────────────────────────────────────────────────────────── */
const C = {
  ink: 'var(--ink, #121110)',
  inkSoft: 'var(--ink-soft, #2B2824)',
  paper: 'var(--paper, #F7F3EC)',
  paperWarm: 'var(--paper-warm, #EFE8DB)',
  cream: 'var(--cream, #FBF8F1)',
  line: 'var(--line, #D8CFBD)',
  muted: 'var(--muted, #7A7061)',
  sage: 'var(--sage, #4A5D4E)',
  sageDeep: 'var(--sage-deep, #2E3A30)',
  sageSoft: 'var(--sage-soft, #C5CDBF)',
  clay: 'var(--clay, #B85A36)',
  claySoft: 'var(--clay-soft, #E8B799)',
  gold: 'var(--gold, #C8A252)',
};

/* ==========================================================================
   TIMEZONE + COUNTDOWN
   ctOffsetMs is the approach used by MasterclassBanner.jsx: resolve the real
   America/Chicago offset at an instant instead of hardcoding -5 or -6, so the
   November DST change cannot slide the target by an hour. MasterclassBanner
   targets a RECURRING weekday; this targets a FIXED datetime, so the helper
   below converts one CT wall clock string into one real instant.
   ========================================================================== */
function ctOffsetMs(d) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const ct = new Date(d.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return ct.getTime() - utc.getTime();
  } catch {
    return -5 * 3600 * 1000; // CDT fallback
  }
}

// 'YYYY-MM-DDTHH:mm:ss' read as America/Chicago wall time, returned as a real
// instant. Two passes: the first uses the offset at the naive instant, the
// second re-reads the offset at the corrected instant, which is what makes it
// correct on either side of a DST boundary.
export function ctInstant(isoLocal) {
  const [datePart, timePart = '00:00:00'] = String(isoLocal).split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  const naive = Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, s || 0);
  let instant = naive - ctOffsetMs(new Date(naive));
  instant = naive - ctOffsetMs(new Date(instant));
  return new Date(instant);
}

const START_AT = ctInstant(CHALLENGE.START_ISO_CT);

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
   homepage A/B test in PostHog.
   ========================================================================== */
function t(event, props) {
  track(event, { page: 'challenge', cohort: CHALLENGE.COHORT_ID, ...(props || {}) });
}

/* ==========================================================================
   NIGHT CURRICULUM
   ========================================================================== */
const NIGHTS = [
  {
    n: 1,
    when: 'TUESDAY, AUGUST 4',
    title: 'Your Real Number',
    promise: 'Most home readings are wrong in a way that changes decisions. Tonight you learn to take one you can actually trust.',
    cover: 'How to sit, where the cuff goes, why the first reading is almost never the right one, why the doctor’s office reading runs high on so many people, and why the number moves between morning and night on purpose.',
    walk: 'Take a correct reading tonight, in both arms, and write the first line in your 5-Day Log.',
  },
  {
    n: 2,
    when: 'WEDNESDAY, AUGUST 5',
    title: 'Stress Pressure',
    promise: 'The pressure that runs at 2am, in the parking lot, and every time the phone rings at the wrong hour.',
    cover: 'What the stress hormone does to a blood vessel and to sodium in your body, why sleep before midnight is worth more than sleep after it, ten minutes of morning light and what it does to the whole next day, slow breathing you can do sitting in a chair, and gratitude practiced out loud as the one thing Joel has watched calm a room fastest.',
    walk: 'Run tonight’s wind down and tomorrow’s first ten minutes, both written on one page.',
  },
  {
    n: 3,
    when: 'THURSDAY, AUGUST 6',
    title: 'Sugar Pressure',
    promise: 'The corner almost nobody connects to blood pressure, and the one that changes the most in a week.',
    cover: 'What a spike does to the inside of a vessel, why the 3pm crash and the 9pm snack are the same event, two meals instead of six, the plate that does not require counting anything, and the ten minute walk after eating that does the work of a much longer one.',
    walk: 'Build tomorrow’s plate, and take one walk after one meal. That is the whole assignment.',
  },
  {
    n: 4,
    when: 'FRIDAY, AUGUST 7',
    title: 'Sodium Pressure',
    promise: 'It was never the salt shaker. It is the bread, the jar, the can, and the restaurant.',
    cover: 'Where sodium actually hides in a normal American week, why potassium matters at least as much as sodium and where to get it from plants, how much water is enough and when to stop drinking it, and how to read one label in ten seconds.',
    walk: 'Run a fifteen minute kitchen sweep and read any label in the store without doing math.',
  },
  {
    n: 5,
    when: 'SUNDAY, AUGUST 9',
    title: 'The Conversation',
    promise: 'The night this whole week was built for. You do not walk into that office hoping. You walk in prepared.',
    cover: 'How to put five days of readings on one page a busy doctor will actually look at, the exact words that open the conversation instead of starting a fight, what to ask about your current medication, what to ask about your labs, how to ask for a follow up date, and the one line that keeps you and your doctor on the same side of the table.',
    walk: 'Your completed log, your one page summary filled in, and the words written down. And with this said plainly, because it matters more than anything else in the week: you never start, stop, or adjust a medication on your own. Your doctor makes every one of those calls. Your job is to walk in with better information than you have ever had.',
    walkLabel: 'You walk away with:',
  },
];

/* ==========================================================================
   TIERS
   ========================================================================== */
// 2026-07-26 (Joel): ONE seat at $97. The GA/VIP split is gone. Everything that
// was behind the VIP wall is simply included, because $97 was the VIP price.
// A single-option page also removes the classic two-tier failure mode, where a
// reader spends their decision energy comparing columns instead of deciding.
const TIERS = [
  {
    key: CHALLENGE.SEAT_TIER,
    kicker: 'YOUR SEAT',
    price: CHALLENGE.SEAT_PRICE,
    priceLine: `${usd(CHALLENGE.SEAT_PRICE)} one time`,
    underPrice: `That is $${SEAT_PER_NIGHT} a night, and ${usd(KIT_PRICE)} of it is a kit you keep forever. One payment, nothing after the five nights.`,
    headline: 'Everything is included. There is no upgrade to buy.',
    cta: `Save my seat, ${usd(CHALLENGE.SEAT_PRICE)}`,
    accent: C.clay,
    items: [
      `All five live nights with Joel on Zoom, ${CHALLENGE.DATE_RANGE_LABEL}, ${CHALLENGE.TIME_LABEL_CT}, ${CHALLENGE.NIGHT_LENGTH} each`,
      'Thirty minutes of live Q and A after every night. Cameras optional, microphone optional. Type your question if you would rather not speak.',
      { lead: 'The 48-Hour Answer:', rest: ' any question you submit by 5:00pm CT gets answered. Live on that night’s call if there is time, and in writing within 48 hours if there is not. Every question, every night, all five nights.' },
      'The replay of every night, teaching and Q and A both, posted by noon CT the next day and yours to keep',
      'The 5-Night Workbook, one printable page per night, so nothing depends on you taking notes',
      'The 5-Day Log sheet you fill in from Night 1 and hand to your doctor on Night 5',
      'The Doctor Conversation Sheet used on Night 5: the opening words, what to ask about your medication, what to ask about your labs, and how to ask for a follow up date',
      `The complete 10-Day BP Reset Kit, all ${KIT_FILE_COUNT} downloads, delivered the minute you register`,
    ],
  },
];

/* ==========================================================================
   FAQ
   ========================================================================== */
const FAQ = [
  {
    q: 'Is this medical advice? Are you telling me to change my medication?',
    a: 'No, and absolutely not. This is education and lifestyle support, not medical advice, diagnosis, or treatment. I am a registered nurse, not your prescribing physician. Everything I teach is meant to work alongside your doctor’s care and never instead of it. Never start, stop, or adjust medication without your doctor. If anything I say ever seems to contradict your doctor, your doctor wins.',
  },
  {
    q: 'Will any of this interfere with my blood pressure medication?',
    a: 'That is exactly the right question to ask, and the honest answer is that I cannot answer it for you specifically, because I do not know your history, your kidneys, or your other prescriptions. What I can tell you is that everything on Nights 2, 3 and 4 is food, water, sleep, sunlight, walking and breathing. On Night 5 I teach you how to bring all of it to your doctor and ask directly. That conversation is the whole point of the week.',
  },
  {
    q: 'Do I have to be on camera?',
    a: 'No. Ever. Most people keep the camera off and the microphone off the entire week, and that is completely normal. You can sit in your recliner in whatever you are already wearing. VIP questions can be typed instead of spoken.',
  },
  {
    q: 'What if I miss a night?',
    a: 'You get the replay of every night, posted by noon CT the next day, and it is yours to keep. Nothing is scheduled to expire. If Wednesday is your grandson’s ball game, watch it Thursday morning with breakfast. The work still stacks.',
  },
  {
    q: 'So is this just replays? Why do I need to show up live?',
    a: 'It is genuinely live. I am on the call, not a recording of me, and on VIP nights I answer real questions from real people in the room. The replays exist so life does not knock you out of the week, not so you can skip it. The people who show up live get more out of it, every time.',
  },
  {
    q: 'I am not technical. Is Zoom hard?',
    a: 'No. You will get one email with one blue link. Tap the link, and you are in. That is the entire technical requirement. If it does not work, reply to that email and we will get you in before the call starts. You do not need an account, a password, or a camera.',
  },
  {
    q: 'I am 68 and I take four pills. Is this for me?',
    a: 'Yes. Most of the people in this room will be over fifty and already on medication. That is who I built it for. If you take nothing yet and your doctor said "let’s watch it," you are also in the right place, and honestly you may get the most out of it.',
  },
  {
    q: 'How much time will this take each day?',
    a: 'One hour a night for the call, and each night’s action is designed to fit in the time you already spend. A ten minute walk after a meal. Ten minutes of morning light. Writing two numbers on a page. I am not asking you to add an hour of chores to your day.',
  },
  {
    q: 'Do I need to buy anything? Supplements, equipment, special food?',
    a: 'No. You need a home blood pressure cuff, and if you already take readings at home you already own one. Everything about food is built from ordinary grocery store plants. There is no supplement I am going to tell you to buy at the end, and there is no product pitch on Night 5.',
  },
  {
    q: `What is the difference between this and the ${usd(KIT_PRICE)} kit?`,
    a: 'The kit is the written protocol you follow at your own pace. This is five live nights where I teach you the reasoning behind it, answer questions in real time, and walk you to the doctor conversation at the end. Both tiers of the challenge include the kit, so you are not choosing between them.',
  },
  {
    q: 'What if it does not work for me?',
    a: `Read the guarantee section above, because I wrote it plainly on purpose. Short version: the kit inside your seat carries a 30-day Feel-It-or-Free promise either way. Your seat is refundable for any reason right up until we start, and refundable in full after that if you did the work and still felt it was not worth it. And I will say the thing most people will not say: results are not typical, most readers see modest results or none, and the people who see the most are the people who actually do the work.`,
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
  const [left, setLeft] = useState(() => START_AT.getTime() - Date.now());
  const doorsClosed = left <= 0;

  // Checkout state machine: idle -> mounting -> mounted | failed.
  // 'failed' is a real, readable card, never a spinner that never resolves.
  const [activeTier, setActiveTier] = useState(null);
  const [checkoutState, setCheckoutState] = useState('idle');
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
    setCheckoutAttempt((n) => n + 1);
    window.setTimeout(() => {
      try {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch { /* older Safari */ }
    }, 40);
  }, []);

  // Mount (or remount) the embedded Stripe checkout for the chosen tier.
  // A 3 second watchdog guarantees the buyer sees an answer either way: the
  // server has NO fallback price id for these tiers on purpose, so a missing
  // CHALLENGE_GA_PRICE_ID must surface as a clear
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
          price: CHALLENGE.SEAT_PRICE,
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
    document.getElementById('seats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToWaitlist = useCallback((location) => {
    t('chal_cta_click', { location, tier: 'waitlist_anchor' });
    document.getElementById('next-cohort')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const ctx = { doorsClosed, chooseTier, goToSeats, goToWaitlist };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: '100vh', paddingBottom: 92 }}>
      <ChallengeStyles />
      <MiniHeader />

      <Hero {...ctx} left={left} />
      <Problem />
      <AuthorityShort />
      <Nights {...ctx} />
      <ValueBand />
      <Seats
        {...ctx}
        activeTier={activeTier}
        checkoutState={checkoutState}
        checkoutRef={checkoutRef}
        panelRef={panelRef}
      />
      <PriceReasoning />
      <AuthorityLong {...ctx} />
      <Guarantee {...ctx} />
      <Urgency {...ctx} left={left} />
      <Faq />
      <FaqCta {...ctx} />
      <Close {...ctx} />
      <MedicationDisclaimer />
      <PageFooter />

      <StickyBar {...ctx} />
    </div>
  );
}

/* ==========================================================================
   SCOPED CSS
   Media queries, the sticky bar, spinner keyframes and focus rings. Class
   prefix chal- so nothing here can leak into another page.
   ========================================================================== */
function ChallengeStyles() {
  return (
    <style>{`
      .chal-wrap { max-width: 720px; margin: 0 auto; padding-left: 18px; padding-right: 18px; }
      .chal-wide { max-width: 900px; }
      .chal-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
        width: 100%; min-height: 54px; padding: 0.9rem 1.2rem; border: none; border-radius: 12px;
        font-weight: 800; font-size: 1.02rem; line-height: 1.25; cursor: pointer;
        text-decoration: none; text-align: center;
        transition: transform 0.12s ease, background 0.16s ease;
      }
      .chal-btn:active { transform: scale(0.988); }
      .chal-btn:disabled { opacity: 0.7; cursor: default; }
      .chal-link {
        display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;
        min-height: 48px; padding: 0.5rem 0.25rem; background: none; border: none;
        font-size: 0.95rem; font-weight: 600; cursor: pointer;
        text-decoration: underline; text-underline-offset: 4px;
      }
      .chal-tiers { display: grid; gap: 1.1rem; }
      .chal-input {
        width: 100%; font-size: 16px; min-height: 50px; padding: 0.7rem 0.85rem;
        border: 1px solid ${C.line}; border-radius: 10px; background: #FFFFFF; color: ${C.ink};
        font-family: inherit;
      }
      .chal-faq-q {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem;
        width: 100%; min-height: 56px; padding: 0.85rem 0; background: none; border: none;
        text-align: left; cursor: pointer; font-family: inherit; font-size: 1rem;
        font-weight: 700; line-height: 1.4; color: ${C.ink};
      }
      .chal-sticky {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
        background: ${C.sageDeep}; border-top: 1px solid rgba(251,248,241,0.14);
        padding-bottom: env(safe-area-inset-bottom);
        transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
      }
      .chal-spin {
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid ${C.line}; border-top-color: ${C.clay};
        animation: chal-spin 0.9s linear infinite;
      }
      @keyframes chal-spin { to { transform: rotate(360deg); } }
      .chal-btn:focus-visible, .chal-link:focus-visible, .chal-faq-q:focus-visible, .chal-input:focus-visible {
        outline: 3px solid ${C.clay}; outline-offset: 2px;
      }
      @media (min-width: 860px) {
        .chal-tiers { grid-template-columns: 1fr 1fr; align-items: start; }
        .chal-sticky { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chal-btn, .chal-sticky { transition: none; }
        .chal-spin { animation-duration: 3s; }
      }
    `}</style>
  );
}

/* ==========================================================================
   MINIMAL HEADER
   Brand mark only. Deliberately NOT a link: this is a sales page and a logo
   that navigates home is a competing exit.
   ========================================================================== */
function MiniHeader() {
  return (
    <header
      style={{
        background: C.sageDeep, color: C.cream,
        padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '0.55rem',
        justifyContent: 'center',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 20, height: 20, borderRadius: '50%', background: 'rgba(251,248,241,0.1)',
          border: '1px solid rgba(251,248,241,0.28)', display: 'grid', placeItems: 'center',
          fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.6rem', lineHeight: 1,
        }}
      >
        JP
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        BraveWorks RN
      </span>
    </header>
  );
}

/* ==========================================================================
   HERO
   Fold budget, measured at 390 x 659 (iPhone Safari, address bar expanded):
     header strip            0   ->  36
     eyebrow                52   ->  67
     H1 (3 lines @ 30/1.14) 79   -> 182
     subheadline (3 lines) 194   -> 269
     date + time block     281   -> 335
     the promise (4 lines) 347   -> 439
     PRIMARY CTA (54px)    453   -> 507
     trust microline       517   -> 555
     secondary text link   565   -> 609
   Countdown starts around 625, i.e. just below the fold, which is the stated
   priority order: the button never moves down to make room for the clock.
   ========================================================================== */
function Hero({ doorsClosed, chooseTier, goToWaitlist, left }) {
  return (
    <section style={{ background: C.cream, borderBottom: `1px solid ${C.line}`, paddingTop: 16, paddingBottom: 22 }}>
      <div className="chal-wrap">
        <p
          style={{
            margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: C.clay, lineHeight: 1.35,
          }}
        >
          Live on Zoom &middot; {CHALLENGE.DATE_RANGE_LABEL} &middot; Joel Polley, RN
        </p>

        <h1
          style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 30, lineHeight: 1.14,
            letterSpacing: '-0.02em', margin: '12px 0 0', color: C.ink,
          }}
        >
          You got the prescription.{' '}
          <span style={{ color: C.clay }}>Did anyone ever give you the explanation?</span>
        </h1>

        <p style={{ margin: '12px 0 0', fontSize: 16.5, lineHeight: 1.5, color: C.inkSoft }}>
          Five nights, live, with a nurse who spent twenty years in an ICU watching what these numbers actually do.
        </p>

        {/* Date and time block: the rest of the approved subheadline, promoted
            to its own scannable row so the fold carries the logistics. */}
        <div
          style={{
            margin: '12px 0 0', padding: '8px 12px', border: `1px solid ${C.line}`,
            borderLeft: `4px solid ${C.sage}`, borderRadius: 10, background: C.paperWarm,
            fontSize: 13, lineHeight: 1.4, fontWeight: 600, color: C.inkSoft,
          }}
        >
          {CHALLENGE.DATE_RANGE_LABEL} &middot; {CHALLENGE.TIME_LABEL_CT}, {CHALLENGE.TIME_LABEL_ET} &middot; one hour a night, from your own chair.
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.44, fontWeight: 700, color: C.ink }}>
          By Friday you will know what your number is made of, how to take a reading you can trust, and the exact words to bring to your next appointment.
        </p>

        <div style={{ marginTop: 14 }}>
          {doorsClosed ? (
            <button type="button" className="chal-btn" style={{ background: C.sage, color: C.cream }} onClick={() => goToWaitlist('hero')}>
              Tell me about the next one <ArrowRight size={17} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="chal-btn"
              style={{ background: C.clay, color: '#FFFFFF' }}
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'hero', CHALLENGE.SEAT_PRICE)}
            >
              Save my seat, {usd(CHALLENGE.SEAT_PRICE)} <ArrowRight size={17} aria-hidden />
            </button>
          )}
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.5, color: C.muted }}>
          Joel Polley, RN &middot; 20 years ICU and emergency &middot; Every seat includes the {usd(KIT_PRICE)} 10-Day BP Reset Kit.
        </p>

        <div style={{ marginTop: 10 }}>
          <a
            href="#nights"
            className="chal-link"
            style={{ color: C.clay }}
            onClick={() => t('chal_cta_click', { location: 'hero_secondary', tier: 'nights_anchor' })}
          >
            See what happens each night
          </a>
        </div>

        <div style={{ marginTop: 14 }}>
          <Countdown left={left} label="Doors close when Night 1 begins:" tone="light" />
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   COUNTDOWN
   Fixed target. When it passes it does not go negative and does not freeze: it
   states plainly that the cohort has started and points at the waitlist.
   ========================================================================== */
function Countdown({ left, label, tone = 'light' }) {
  const dark = tone === 'dark';
  const closed = left <= 0;
  const { d, h, m, s } = parts(left);

  const box = {
    border: `1px solid ${dark ? 'rgba(251,248,241,0.22)' : C.line}`,
    background: dark ? 'rgba(251,248,241,0.06)' : C.paperWarm,
    borderRadius: 12, padding: '10px 12px', textAlign: 'center',
  };

  if (closed) {
    return (
      <div style={box}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, fontWeight: 700, color: dark ? C.cream : C.ink }}>
          Night 1 is already underway. This cohort has started.
        </p>
      </div>
    );
  }

  const cell = (n, lbl) => (
    <span key={lbl} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <strong
        style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.5rem', lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums', color: dark ? C.cream : C.ink,
        }}
      >
        {String(n).padStart(2, '0')}
      </strong>
      <span
        style={{
          fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3,
          color: dark ? 'rgba(251,248,241,0.65)' : C.muted,
        }}
      >
        {lbl}
      </span>
    </span>
  );

  return (
    <div style={box}>
      <p
        style={{
          margin: '0 0 6px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: dark ? C.claySoft : C.clay,
        }}
      >
        {label}
      </p>
      <div
        style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}
        aria-label={`${d} days, ${h} hours, ${m} minutes and ${s} seconds until Night 1`}
      >
        {cell(d, 'days')}{cell(h, 'hrs')}{cell(m, 'min')}{cell(s, 'sec')}
      </div>
    </div>
  );
}

/* ==========================================================================
   PROBLEM
   ========================================================================== */
function Problem() {
  return (
    <section style={{ padding: '38px 0 34px' }}>
      <div className="chal-wrap">
        <Kicker>The part nobody had time for</Kicker>
        <H2>The appointment was fifteen minutes. Twelve of them were paperwork.</H2>

        <Body>
          You got a cuff on your arm, a number read out loud, and a slip of paper. Lisinopril. Losartan. Amlodipine. Hydrochlorothiazide. Metoprolol. Maybe two of them. Maybe four.
        </Body>
        <Body>Nobody sat down and drew you a picture of what the number is made of.</Body>
        <Body>
          Nobody told you that the reading they took, right after you rushed in from the parking lot and sat down talking, with your arm resting somewhere near your knee, is probably not your real number.
        </Body>
        <Body>Nobody explained why the dose went up last year when you were doing everything they told you.</Body>
        <Body>
          So here is what happens. Year after year, you take the pill. You watch the number. You feel a small drop in your stomach every time the cuff tightens, because you do not know what it is about to say, and you do not know what you could have done differently anyway.
        </Body>
        <Body>
          That is not a discipline problem. That is an information problem. And it is the only kind of problem I can actually help with.
        </Body>

        <blockquote
          style={{
            margin: '22px 0 0', padding: '14px 16px', borderLeft: `4px solid ${C.clay}`,
            background: C.paperWarm, borderRadius: '0 12px 12px 0',
          }}
        >
          <p style={{ margin: 0, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.12rem', lineHeight: 1.45, color: C.ink }}>
            You have been managing one number for years. Five nights is enough to learn what is behind it.
          </p>
        </blockquote>

        <p style={{ margin: '18px 0 0', fontSize: '1rem', lineHeight: 1.6, fontWeight: 700, color: C.ink }}>
          This is not about doing more. It is about finally seeing the thing you have been fighting blind.
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   AUTHORITY, SHORT
   ========================================================================== */
function AuthorityShort() {
  return (
    <section style={{ padding: '0 0 34px' }}>
      <div className="chal-wrap">
        <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '18px 18px' }}>
          <Kicker tone="sage">Who is teaching this</Kicker>
          <p style={{ margin: '10px 0 0', fontSize: '1rem', lineHeight: 1.62, color: C.inkSoft }}>
            Joel Polley has been a registered nurse for twenty years, most of it in intensive care and the emergency department. He is the one who was in the room at 3am. He now teaches natural, plant based, doctor alongside health at bpquiz.com, and he is the only person who will be on these calls.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   THE FIVE NIGHTS
   Hormozi Value Equation: this section is the Time Delay crusher. Five
   evenings, five finished things, a physical artifact on Friday.
   ========================================================================== */
function Nights({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section id="nights" style={{ background: C.paperWarm, padding: '38px 0 36px', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="chal-wrap">
        <Kicker>What happens each night</Kicker>
        <H2>Five nights. Three pressures. One conversation.</H2>

        <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.65, color: C.inkSoft }}>
          Your blood pressure has three everyday drivers. Stress. Sugar. Sodium. We call them the Three Pressures, and they pull on each other, which is why working just one of them never holds. Monday we find your real number. Tuesday, Wednesday and Thursday we take the pressures one at a time. Friday we put it all in your hand for your doctor. You walk away from every single night with something done, not something to think about.
        </p>

        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {NIGHTS.map((night) => (
            <article
              key={night.n}
              style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px 16px' }}
            >
              <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.clay }}>
                Night {night.n} &middot; {night.when}
              </p>
              <h3 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.3rem', lineHeight: 1.2, color: C.ink }}>
                {night.title}
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, fontWeight: 600, color: C.inkSoft }}>
                {night.promise}
              </p>
              <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>
                <strong style={{ color: C.ink }}>We cover: </strong>
                {night.cover}
              </p>
              <div
                style={{
                  marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`,
                  display: 'flex', gap: '0.55rem', alignItems: 'flex-start',
                }}
              >
                <Check size={17} strokeWidth={2.6} style={{ color: C.sage, flexShrink: 0, marginTop: 3 }} aria-hidden />
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: C.inkSoft }}>
                  <strong style={{ color: C.ink }}>{night.walkLabel || 'You walk away able to: '}</strong>
                  {night.walkLabel ? ' ' : ''}
                  {night.walk}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: '1.05rem', fontWeight: 800, color: C.ink }}>
          Five nights. Five things done. Nothing to catch up on.
        </p>

        <div style={{ marginTop: 16 }}>
          {doorsClosed ? (
            <button type="button" className="chal-btn" style={{ background: C.sage, color: C.cream }} onClick={() => goToWaitlist('after_nights')}>
              Tell me about the next one <ArrowRight size={17} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="chal-btn"
              style={{ background: C.clay, color: '#FFFFFF' }}
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_nights', CHALLENGE.SEAT_PRICE)}
            >
              Save my seat for all five nights, {usd(CHALLENGE.SEAT_PRICE)} <ArrowRight size={17} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   VALUE BAND
   The Effort and Sacrifice half of the Value Equation, stated as what the week
   actually costs the buyer in time and friction.
   ========================================================================== */
const VALUE_ROWS = [
  { k: 'One hour a night', v: `${CHALLENGE.NIGHT_LENGTH} on Zoom, five nights, then the week is over.` },
  { k: 'From your own chair', v: 'Camera off, microphone off, whatever you are already wearing.' },
  { k: 'Nothing to buy', v: 'The home cuff you already own. Ordinary grocery store plants. No supplements.' },
  { k: 'Nothing to catch up on', v: 'One action per night, sized to the time you already spend.' },
  { k: 'No note taking', v: 'One printable page per night, plus a short morning email with that day’s single action.' },
  { k: 'Replays included', v: 'Every night posted by noon CT the next day, yours to keep.' },
];

function ValueBand() {
  return (
    <section style={{ padding: '36px 0 32px' }}>
      <div className="chal-wrap">
        <Kicker tone="sage">What it costs you, besides money</Kicker>
        <H2>One hour a night. That is the ask.</H2>
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          {VALUE_ROWS.map((row) => (
            <div key={row.k} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Check size={17} strokeWidth={2.6} style={{ color: C.clay, flexShrink: 0, marginTop: 3 }} aria-hidden />
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.inkSoft }}>
                <strong style={{ color: C.ink }}>{row.k}. </strong>{row.v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SEATS: the two tiers + the single checkout mount point
   ========================================================================== */
function Seats({ doorsClosed, chooseTier, goToWaitlist, activeTier, checkoutState, checkoutRef, panelRef }) {
  return (
    <section id="seats" style={{ background: C.sageDeep, color: C.cream, padding: '38px 0 36px' }}>
      <div className="chal-wrap chal-wide">
        <Kicker tone="onDark">Two ways in</Kicker>
        <h2
          style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)',
            lineHeight: 1.16, letterSpacing: '-0.02em', margin: '8px 0 10px', color: C.cream,
          }}
        >
          Pick your seat.
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.6, color: 'rgba(251,248,241,0.82)' }}>
          Both tiers get all five live nights and all five replays. Both include the full 10-Day BP Reset Kit, which is the kit this site sells on its own for {usd(KIT_PRICE)}. The difference is whether you want to ask me questions directly.
        </p>

        <div className="chal-tiers">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.key}
              tier={tier}
              doorsClosed={doorsClosed}
              onChoose={() => chooseTier(tier.key, 'tier_card', tier.price)}
              onWaitlist={() => goToWaitlist('tier_card')}
              active={activeTier === tier.key}
            />
          ))}
        </div>

        {/* Single checkout mount point, directly under the cards. */}
        <div ref={panelRef} style={{ marginTop: 20 }}>
          {doorsClosed ? null : (
            <CheckoutPanel activeTier={activeTier} state={checkoutState} containerRef={checkoutRef} />
          )}
        </div>

        {doorsClosed && (
          <div
            style={{
              marginTop: 18, border: '1px solid rgba(251,248,241,0.22)', borderRadius: 14,
              padding: '16px', background: 'rgba(251,248,241,0.06)',
            }}
          >
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(251,248,241,0.9)' }}>
              <strong style={{ color: C.cream }}>Registration for the August cohort is closed.</strong>{' '}
              Night 1 is already underway. Leave your name and email below and I will tell you first when the next one is on the calendar.
            </p>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="chal-btn" style={{ background: C.clay, color: '#FFFFFF' }} onClick={() => goToWaitlist('seats_closed')}>
                Tell me about the next one <ArrowRight size={17} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TierCard({ tier, doorsClosed, onChoose, onWaitlist, active }) {
  return (
    <div
      style={{
        background: C.cream, color: C.ink, borderRadius: 16,
        border: active ? `3px solid ${C.clay}` : `1px solid ${C.line}`,
        padding: '18px 16px', display: 'flex', flexDirection: 'column',
      }}
    >
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.clay }}>
        {tier.kicker}
      </p>
      <p style={{ margin: '8px 0 0', fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, lineHeight: 1, color: C.ink }}>
        {tier.priceLine}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: C.muted }}>{tier.underPrice}</p>
      <h3 style={{ margin: '12px 0 0', fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.2rem', lineHeight: 1.25, color: C.ink }}>
        {tier.headline}
      </h3>

      <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: '0.65rem', flex: 1 }}>
        {tier.items.map((item, i) => {
          const isObj = typeof item === 'object';
          return (
            <li key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
              <Check size={17} strokeWidth={2.6} style={{ color: C.clay, flexShrink: 0, marginTop: 3 }} aria-hidden />
              <span style={{ fontSize: 14.5, lineHeight: 1.55, color: C.inkSoft }}>
                {isObj ? (<><strong style={{ color: C.ink }}>{item.lead}</strong>{item.rest}</>) : item}
              </span>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 18 }}>
        {doorsClosed ? (
          <button type="button" className="chal-btn" style={{ background: C.sage, color: C.cream }} onClick={onWaitlist}>
            Tell me about the next one
          </button>
        ) : (
          <button
            type="button"
            className="chal-btn"
            style={{ background: C.clay, color: '#FFFFFF' }}
            onClick={onChoose}
          >
            {tier.cta} <ArrowRight size={17} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   CHECKOUT PANEL
   Three honest states. There is no fourth state where the buyer waits forever.
   ========================================================================== */
function CheckoutPanel({ activeTier, state, containerRef }) {
  if (!activeTier) return null;
  const tier = TIERS.find((x) => x.key === activeTier);
  const failed = state === 'failed';

  return (
    <div
      style={{
        background: C.cream, color: C.ink, borderRadius: 16, border: `1px solid ${C.line}`,
        padding: '16px', scrollMarginTop: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.sage }}>
        {failed ? 'One moment of honesty' : `Checkout · ${tier ? tier.kicker : ''}`}
      </p>

      {!failed && (
        <p style={{ margin: '6px 0 12px', fontSize: 14, lineHeight: 1.5, color: C.muted }}>
          <Lock size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} aria-hidden />
          Secure checkout by Stripe. One payment. Nothing here renews.
        </p>
      )}

      {state === 'mounting' && (
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', padding: '18px 0' }}>
          <span className="chal-spin" aria-hidden />
          <span style={{ fontSize: 15, color: C.inkSoft }} role="status">Opening checkout...</span>
        </div>
      )}

      {/* Stripe mounts here. Hidden until it actually mounts so a failed attempt
          never leaves an empty grey box on the page. */}
      <div ref={containerRef} style={{ display: state === 'mounted' ? 'block' : 'none', minHeight: state === 'mounted' ? 320 : 0 }} />

      {failed && <CheckoutUnavailable tier={tier} />}
    </div>
  );
}

function CheckoutUnavailable({ tier }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.6, color: C.ink }}>
        <strong>Checkout is not open yet.</strong> This one is on me, not on you. The payment link for this challenge is not live at the moment. Leave your name and email and I will send you the seat link the second it is working, or write me directly at{' '}
        <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`} style={{ color: C.clay, fontWeight: 700 }}>
          {CHALLENGE.SUPPORT_EMAIL}
        </a>.
      </p>
      <SignupForm
        intent="seat-link"
        tier={tier ? tier.key : undefined}
        buttonLabel="Send me the seat link"
        buttonBg={C.clay}
        successLine="You are on the list. I will send the seat link the moment it is live."
        microcopy="Nothing was charged."
        event="chal_seatlink_submit"
      />
    </div>
  );
}

/* ==========================================================================
   PRICE REASONING
   Every figure below is derived from real transaction prices. No stack totals,
   no compare-at, no invented value tags.
   ========================================================================== */
function PriceReasoning() {
  return (
    <section style={{ padding: '32px 0 30px' }}>
      <div className="chal-wrap">
        <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '18px 16px' }}>
          <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: '1.25rem', lineHeight: 1.25, color: C.ink }}>
            Why it costs what it costs.
          </h3>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.65, color: C.inkSoft }}>
            A seat is {usd(CHALLENGE.SEAT_PRICE)} and includes the {usd(KIT_PRICE)} kit, so the five live nights come out to {usd(SEAT_LESS_KIT)}. That is {usd(SEAT_LESS_KIT_PER_NIGHT)} a night for an hour with a nurse, and a written answer to every question you ask.
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.65, color: C.inkSoft }}>
            There is no third tier, no upsell during the calls, and nothing here renews. One payment, and the week is yours.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   AUTHORITY, LONG
   This is where a launch page puts a testimonial block. Joel has no consented
   testimonials, so this is earned authority instead, which is true and does
   not require anyone else's words.
   ========================================================================== */
const ICU_LESSONS = [
  {
    lead: 'I watched what happens when nobody explains anything.',
    rest: ' People arrived on four medications who could not tell me what a single one of them did. Not because they were not smart. Because nobody ever had fifteen spare minutes.',
  },
  {
    lead: 'I saw how many readings were simply wrong.',
    rest: ' Wrong cuff, wrong arm, wrong position, taken thirty seconds after somebody rushed down a hallway. Then real decisions got made on that number.',
  },
  {
    lead: 'I learned that the body always tells you what is driving it, if you know how to read the pattern.',
    rest: ' Not one number. The pattern across a week. That is the single most useful thing I know, and it is teachable in an evening.',
  },
  {
    lead: 'I found out the pill was never the enemy and never the whole answer.',
    rest: ' The medication does an important job. It quiets one corner. The other two keep pulling. That is not a controversial opinion. That is just how the loop works.',
  },
];

function AuthorityLong({ goToSeats }) {
  return (
    <section style={{ background: C.ink, color: C.cream, padding: '38px 0 34px' }}>
      <div className="chal-wrap">
        <Kicker tone="onDark">Why I teach this the way I do</Kicker>
        <h2
          style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(1.55rem, 5.4vw, 2.05rem)',
            lineHeight: 1.18, letterSpacing: '-0.02em', margin: '8px 0 16px', color: C.cream,
          }}
        >
          I do not have a wall of testimonials. I have twenty years of nights.
        </h2>

        <DarkBody>
          I am not going to show you a row of smiling strangers with quotes under them. Half the internet does that, and a good number of those quotes were written by somebody who was paid to write them. I will not do it. If I ever put a customer&rsquo;s words on this page, that customer will have said yes in writing first.
        </DarkBody>
        <DarkBody>So instead, here is what actually qualifies me.</DarkBody>
        <DarkBody>
          For twenty years I worked intensive care and emergency. I am the nurse who stood at the head of the bed at three in the morning. I am the one who hung the drip when the pressure would not come down, and the one who sat with the family in the hallway afterward.
        </DarkBody>
        <DarkBody>Here is what those years taught me that I could not have learned anywhere else.</DarkBody>

        <div style={{ display: 'grid', gap: '0.85rem', margin: '18px 0 0' }}>
          {ICU_LESSONS.map((row) => (
            <div key={row.lead} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Check size={18} strokeWidth={2.6} style={{ color: C.sageSoft, flexShrink: 0, marginTop: 3 }} aria-hidden />
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(251,248,241,0.86)' }}>
                <strong style={{ color: C.cream }}>{row.lead}</strong>{row.rest}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <DarkBody>
            I left the bedside to teach this because I got tired of meeting people at the worst possible moment, when everything I knew arrived ten years too late to be useful to them.
          </DarkBody>
          <DarkBody>
            Five nights is early. Five nights is useful. That is why I am doing it live instead of writing another PDF.
          </DarkBody>
        </div>

        <p style={{ margin: '18px 0 0', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(251,248,241,0.7)' }}>
          Joel Polley, RN &middot; BraveWorks RN &middot; Louisville, Kentucky
        </p>

        <div style={{ marginTop: 6 }}>
          <button type="button" className="chal-link" style={{ color: C.claySoft }} onClick={() => goToSeats('authority_long')}>
            See the two seats <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   GUARANTEE
   Myron's asymmetry: the paid up tier carries the performance guarantee, the
   entry tier does not. Adapted so it is not a trap: the VIP condition is
   identical to the homework, and GA gets a clean pre-event window plus the
   kit's own promise, so nobody is ever left refund-less.
   ========================================================================== */
function Guarantee({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section style={{ padding: '38px 0 34px' }}>
      <div className="chal-wrap">
        <Kicker tone="sage">Your protection</Kicker>
        <H2>Three promises, all written plainly.</H2>

        <PromiseCard title="Promise 1 · The kit, either way">
          Every seat includes the 10-Day BP Reset Kit, and that kit carries the same promise it always has on this site. Run the full 10-day plan. If you do not feel a difference, reply with the word REFUND and your money comes back. Keep the books either way. No hoops, no fine print. Thirty days.
        </PromiseCard>

        <PromiseCard title="Promise 2 · Change your mind before we start">
          <>
            Your seat is fully refundable for any reason right up until {CHALLENGE.START_DATE_LABEL} at {CHALLENGE.TIME_LABEL_CT}. Change your mind, reply REFUND, done. No reason needed.
          </>
        </PromiseCard>

        <PromiseCard title="Promise 3 · The did-the-work guarantee">
          <>
            Once Night 1 has happened I cannot un-hold a live call, so here is what replaces a blanket refund after that point.
            <br /><br />
            Do the work. That means: be on all five nights or watch all five replays, and email me your completed 5-Day Log by {CHALLENGE.LOG_DUE_LABEL}. That is the thing I am asking you to build anyway, and I tell you where to send it on Night 1.
            <br /><br />
            If you did that and you still feel the week was not worth {usd(CHALLENGE.SEAT_PRICE)}, reply REFUND by {CHALLENGE.REFUND_BY_LABEL} and I send back the full {usd(CHALLENGE.SEAT_PRICE)}. You keep the kit. You keep the workbook. You keep the replays. I do not ask you to prove anything else and I do not ask you why.
          </>
        </PromiseCard>

        <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: 1.6, color: C.muted }}>
          Refunds are processed within 5 to 10 business days to the original payment method, same as everything else on this site.
        </p>

        <div style={{ marginTop: 18 }}>
          {doorsClosed ? (
            <button type="button" className="chal-btn" style={{ background: C.sage, color: C.cream }} onClick={() => goToWaitlist('after_guarantee')}>
              Tell me about the next one <ArrowRight size={17} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="chal-btn"
              style={{ background: C.clay, color: '#FFFFFF' }}
              onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_guarantee', CHALLENGE.SEAT_PRICE)}
            >
              Save my seat, {usd(CHALLENGE.SEAT_PRICE)} <ArrowRight size={17} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PromiseCard({ title, children }) {
  return (
    <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px', marginBottom: '0.9rem' }}>
      <p style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.sage }}>
        <ShieldCheck size={15} strokeWidth={2.4} aria-hidden />
        <span>{title}</span>
      </p>
      <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.65, color: C.inkSoft }}>{children}</p>
    </div>
  );
}

/* ==========================================================================
   URGENCY
   Priestley: the cohort start date IS the demand engineering. No manufactured
   scarcity is needed, and none is permitted here.
   ========================================================================== */
function Urgency({ doorsClosed, left }) {
  return (
    <section style={{ background: C.paperWarm, padding: '36px 0 34px', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="chal-wrap">
        <Kicker>One real deadline</Kicker>
        <H2>Doors close Monday at {CHALLENGE.TIME_LABEL_CT}, because that is when we start.</H2>

        <Body>
          There is no price jump waiting on Tuesday. There is no seat counter ticking down. There is no bonus that disappears at midnight. I have taken all of that off this page on purpose, because a trust brand cannot run a fake clock.
        </Body>
        <Body>
          There is exactly one real deadline, and it is this: Night 1 is live at {CHALLENGE.TIME_LABEL_CT} on {CHALLENGE.START_DATE_LABEL}. You cannot join a call that has already happened. When that clock hits zero, registration for this cohort closes and this page stops taking new seats.
        </Body>
        <Body>
          If you are reading this on Sunday, you have time. If you are reading it Monday afternoon, you have hours. If you are reading it Tuesday, I am sorry, and you can leave your email below for whenever I run the next one.
        </Body>

        <div style={{ marginTop: 18 }}>
          <Countdown left={left} label="Night 1 begins in:" tone="light" />
        </div>

        <div id="next-cohort" style={{ marginTop: 18, scrollMarginTop: 16 }}>
          {doorsClosed ? (
            <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 15.5, lineHeight: 1.6, color: C.ink }}>
                <strong>Registration for the August cohort is closed.</strong> Night 1 is already underway. Leave your name and email and I will tell you first when the next one is on the calendar. No spam, and no charge for being on the list.
              </p>
              <SignupForm
                intent="waitlist"
                buttonLabel="Tell me about the next one"
                buttonBg={C.sage}
                successLine="You are on the list. Watch your inbox."
                microcopy="Free. Unsubscribe anytime."
                event="chal_waitlist_submit"
              />
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.muted }}>
              Once that clock reaches zero this page stops taking seats and shows a form for the next cohort instead.
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
function SignupForm({ intent, tier, buttonLabel, buttonBg, successLine, microcopy, event }) {
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
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: C.paperWarm, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px' }}>
        <Check size={19} strokeWidth={2.6} style={{ color: C.sage, flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.ink }}>{successLine}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '0.6rem' }}>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4, color: C.inkSoft }}>First name</span>
        <input
          className="chal-input"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
        />
      </label>
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4, color: C.inkSoft }}>Email address</span>
        <input
          className="chal-input"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        className="chal-btn"
        style={{ background: buttonBg, color: '#FFFFFF' }}
        disabled={state === 'sending'}
      >
        {state === 'sending' ? 'Sending...' : buttonLabel}
      </button>
      {state === 'error' && (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.clay }} role="alert">
          That did not go through. Check the address, or write me directly at{' '}
          <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`} style={{ color: C.clay, fontWeight: 700 }}>{CHALLENGE.SUPPORT_EMAIL}</a> and I will add you by hand.
        </p>
      )}
      <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{microcopy}</p>
    </form>
  );
}

/* ==========================================================================
   FAQ
   Accordion on every viewport. First two open by default.
   ========================================================================== */
function Faq() {
  const [open, setOpen] = useState(() => new Set([0, 1]));

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
    <section style={{ padding: '38px 0 20px' }}>
      <div className="chal-wrap">
        <Kicker>Straight answers</Kicker>
        <H2>The questions people actually ask me.</H2>

        <div style={{ borderTop: `1px solid ${C.line}` }}>
          {FAQ.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div key={item.q} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  className="chal-faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`chal-faq-a-${i}`}
                  id={`chal-faq-q-${i}`}
                  onClick={() => toggle(i)}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={20}
                    aria-hidden
                    style={{
                      flexShrink: 0, marginTop: 2, color: C.clay,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {isOpen && (
                  <p
                    id={`chal-faq-a-${i}`}
                    role="region"
                    aria-labelledby={`chal-faq-q-${i}`}
                    style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.65, color: C.inkSoft }}
                  >
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqCta({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section style={{ padding: '4px 0 34px' }}>
      <div className="chal-wrap">
        {doorsClosed ? (
          <button type="button" className="chal-btn" style={{ background: C.sage, color: C.cream }} onClick={() => goToWaitlist('after_faq')}>
            Tell me about the next one <ArrowRight size={17} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="chal-btn"
            style={{ background: C.clay, color: '#FFFFFF' }}
            onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'after_faq', CHALLENGE.SEAT_PRICE)}
          >
            Save my seat, {usd(CHALLENGE.SEAT_PRICE)} <ArrowRight size={17} aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   THE CLOSE
   ========================================================================== */
function Close({ doorsClosed, chooseTier, goToWaitlist }) {
  return (
    <section style={{ background: C.sageDeep, color: C.cream, padding: '40px 0 36px' }}>
      <div className="chal-wrap" style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(1.8rem, 6.4vw, 2.5rem)',
            lineHeight: 1.12, letterSpacing: '-0.02em', margin: '0 0 18px', color: C.cream,
          }}
        >
          Five nights. Then you know.
        </h2>

        <div style={{ textAlign: 'left' }}>
          <DarkBody>Here is what I want for you, and I am going to say it as plainly as I know how.</DarkBody>
          <DarkBody>
            I want you to sit down at the end of next Friday with a piece of paper in your hand. Five days of your own readings, taken correctly, at the same times, in your own home. Underneath them, three things you changed and why. And down at the bottom, in your own handwriting, the questions you are going to ask at your next appointment.
          </DarkBody>
          <DarkBody>
            Not hoping. Not guessing. Not sitting there while somebody reads a number off a machine and writes something down without telling you what it means.
          </DarkBody>
          <DarkBody>Prepared. For the first time in years.</DarkBody>
          <DarkBody>
            That is the whole thing. That is what five evenings buys you. Whether your number does anything at all in that week is between you, your body, and your doctor, and I will never promise you otherwise. But walking in prepared is entirely within your reach, and it starts Monday at seven.
          </DarkBody>
          <DarkBody>I have watched a lot of people meet this too late. Not you. Not this time.</DarkBody>
          <DarkBody>I will see you Monday night.</DarkBody>
        </div>

        <p style={{ margin: '18px 0 0', textAlign: 'left', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.2rem', color: C.cream }}>
          Joel
        </p>
        <p style={{ margin: '2px 0 0', textAlign: 'left', fontSize: 13, color: 'rgba(251,248,241,0.68)' }}>
          Joel Polley, RN &middot; BraveWorks RN
        </p>

        <div style={{ marginTop: 22 }}>
          {doorsClosed ? (
            <button type="button" className="chal-btn" style={{ background: C.clay, color: '#FFFFFF', fontSize: '1.08rem', minHeight: 58 }} onClick={() => goToWaitlist('final_close')}>
              Tell me about the next one <ArrowRight size={18} aria-hidden />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="chal-btn"
                style={{ background: C.clay, color: '#FFFFFF', fontSize: '1.08rem', minHeight: 58 }}
                onClick={() => chooseTier(CHALLENGE.SEAT_TIER, 'final_close', CHALLENGE.SEAT_PRICE)}
              >
                Yes, save my seat for {CHALLENGE.START_DATE_LABEL.replace('Tuesday, ', '')} <ArrowRight size={18} aria-hidden />
              </button>
            </>
          )}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: 'rgba(251,248,241,0.68)' }}>
          {CHALLENGE.DATE_RANGE_LABEL} &middot; {CHALLENGE.TIME_LABEL_CT}, {CHALLENGE.TIME_LABEL_ET} &middot; one hour a night &middot; replays included &middot; secure checkout
        </p>

        <p style={{ margin: '24px 0 0', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(251,248,241,0.5)' }}>
          Genetics writes the recipe. Lifestyle bakes the cake. Be your own steward.
        </p>
      </div>
    </section>
  );
}

/* ==========================================================================
   MEDICATION DISCLAIMER
   Copied byte for byte from src/pages/CheckoutPage.jsx (variant A's footer
   legal block). Do not paraphrase, shorten, or reorder.
   ========================================================================== */
function MedicationDisclaimer() {
  return (
    <section style={{ background: C.paperWarm, padding: '26px 0' }}>
      <div className="chal-wrap">
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px' }}>
            These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, or prevent any disease.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Educational and lifestyle content only. Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or adjust medication without your doctor.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Results not typical. Most readers see modest results or none.
          </p>
        </div>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer style={{ background: C.ink, color: 'rgba(251,248,241,0.5)', padding: '20px 0 26px', textAlign: 'center', fontSize: 12, lineHeight: 1.7 }}>
      <div className="chal-wrap">
        <p style={{ margin: '0 0 8px' }}>
          <a href="/disclaimer" style={{ color: 'rgba(251,248,241,0.6)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Disclaimer</a>
          {' · '}
          <a href="/terms" style={{ color: 'rgba(251,248,241,0.6)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a>
          {' · '}
          <a href="/privacy" style={{ color: 'rgba(251,248,241,0.6)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy</a>
        </p>
        <p style={{ margin: 0 }}>&copy; 2026 BraveWorks RN. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ==========================================================================
   STICKY MOBILE BAR
   Appears past scrollY 600, same threshold CheckoutPage uses. Slides in via
   transform instead of popping. Hidden at 860px and up.
   ========================================================================== */
function StickyBar({ doorsClosed, chooseTier, goToWaitlist }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="chal-sticky"
      style={{ transform: show ? 'translateY(0)' : 'translateY(115%)' }}
      aria-hidden={!show}
    >
      <div
        style={{
          maxWidth: 720, margin: '0 auto', minHeight: 64, padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, lineHeight: 1.35 }}>
          {doorsClosed
            ? 'August cohort has started'
            : `${NIGHT_COUNT} Nights Live · ${CHALLENGE.DATE_RANGE_SHORT} · ${usd(CHALLENGE.SEAT_PRICE)}`}
        </span>
        <button
          type="button"
          onClick={() =>
            doorsClosed
              ? goToWaitlist('sticky_bar')
              : chooseTier(CHALLENGE.SEAT_TIER, 'sticky_bar', CHALLENGE.SEAT_PRICE)}
          style={{
            background: C.clay, color: '#FFFFFF', border: 'none', borderRadius: 999,
            fontWeight: 800, fontSize: 14, minHeight: 48, padding: '0 20px',
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
          tabIndex={show ? 0 : -1}
        >
          {doorsClosed ? 'Next cohort' : 'Save my seat'}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SMALL SHARED BITS
   ========================================================================== */
function Kicker({ children, tone = 'clay' }) {
  const color = tone === 'sage' ? C.sage : tone === 'onDark' ? C.claySoft : C.clay;
  return (
    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>
      {children}
    </p>
  );
}

function H2({ children }) {
  return (
    <h2
      style={{
        fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 'clamp(1.55rem, 5.4vw, 2.05rem)',
        lineHeight: 1.18, letterSpacing: '-0.02em', margin: '8px 0 16px', color: C.ink,
      }}
    >
      {children}
    </h2>
  );
}

function Body({ children }) {
  return <p style={{ margin: '0 0 14px', fontSize: 15.5, lineHeight: 1.68, color: C.inkSoft }}>{children}</p>;
}

function DarkBody({ children }) {
  return <p style={{ margin: '0 0 14px', fontSize: 15.5, lineHeight: 1.68, color: 'rgba(251,248,241,0.85)' }}>{children}</p>;
}
