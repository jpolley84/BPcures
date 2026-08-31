// AllInPage (route: /allin) — "The Life Change Accelerator" APPLICATION.
//
// ── 2026-08-30: THE PRICE AND THE OFFER CHANGED ──────────────────────────
// The offer is now the LIVE, NOT JUST EXIST stack Joel supplied as a deck:
// $7,500 for a full year, reservable with a $500 deposit, with the balance
// payable in full or over 6, 9 or 12 MONTHLY payments. Everything numeric on
// this page comes from that deck. The old figures ($1,997 price, $197
// deposit, $4,997 "next enrollment") are dead; where they still appear below
// it is in historical notes, not in anything a visitor reads.
//
// The page still takes NO payment itself. What changed on 2026-08-30 is that
// the deposit is now stated loudly above the fold and LINKS to /allin/pay,
// because Joel asked for "ONLY $500 down to reserve your spot today" as the
// eye-catching element. A visitor can either reserve there or apply here.
//
// ── 2026-08-10: THIS PAGE STOPPED TAKING MONEY ───────────────────────────
// Joel supplied new copy that turns /allin from an instant checkout into an
// application. Read that sentence twice before editing: until today this page
// mounted three embedded Stripe Checkout Sessions (allin-full $1,997,
// allin-plan 6 x $367, allin-deposit $197) and a visitor could buy in one
// click. She cannot any more. Every CTA now scrolls to a form that takes NO
// payment, and the page says so in four separate places because the copy
// promises it in four separate places.
//
// What that means operationally:
//   - The only path from this page to revenue is /api/coaching-apply with
//     source 'allin-apply'. If that endpoint breaks, this offer is dark.
//   - The three allin-* Stripe tiers in api/create-embedded-checkout.js are
//     DELIBERATELY LEFT INTACT. Existing payment links still work, and the
//     active 6 x $367 subscriber keeps billing. Do not delete them because
//     this page no longer calls them.
//   - The reservation deposit was $197 here until 2026-08-30 and is now
//     $500, matching the live allin-deposit Stripe price. If that number ever
//     changes, change BOTH the DEPOSIT constant below and the Stripe price,
//     or the page promises one figure and charges another.
//
// ── WHY THERE IS NO TESTIMONIAL SECTION ──────────────────────────────────
// Joel's copy has a "REAL WOMEN. REAL RESULTS." block with three quotes
// marked [REAL TESTIMONIAL]. Those are placeholders, not real quotes, and
// this section is intentionally NOT rendered rather than shipped with
// invented proof. The workspace rule is absolute: if a person is not in
// testimonials/CONSENT-LOG.md, they do not get published.
//
// Checked the log on 2026-08-10. Of the ten consented entries, exactly two are
// cleared to sit beside a price at all (Long Monie, unattributed; Tiffany
// Morris, first name only). Neither is a coaching client and neither describes
// a result, so putting them under a "REAL RESULTS" heading next to the price
// would be a claim the consent does not cover. Susan Crowley is explicitly
// barred in writing from appearing near a price. So the honest options were
// invent quotes, misuse consented ones, or ship without the block. Shipped
// without. Add it back when real accelerator clients have consented.
//
// ── OTHER RULES THIS FILE KEEPS ──────────────────────────────────────────
// Not wrapped in SiteLayout (focused page, no nav to leak clicks).
// ZERO em dashes in visible copy. Education alongside the doctor, never a
// replacement: no claim here says the program lowers anything.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '../utils/analytics';
import ClosingSoonBanner from '../components/ClosingSoonBanner';
// Annie + Joel in navy scrubs, supplied by Joel 2026-08-10 to replace the
// 08-06 photo. The source PNG arrived letterboxed with 237px of black above
// and 464px below; those bars were cropped off before import, because on a
// white page they render as black bands that read as a broken image rather
// than as a design. Source kept in ~/Downloads/"Untitled design.png".
import heroImg from '../assets/annie-joel-scrubs.jpg';

// ─── palette (monochrome, unchanged from the 2026-08-06 restyle) ─────────
const C = {
  cream: '#FFFFFF',
  paper: '#FAFAFA',
  ink: '#000000',
  inkSoft: '#1A1A1A',
  line: '#E2E2E2',
  muted: '#666666',
};
const SERIF = '"Fraunces", Georgia, serif';

// ─── 2026-08-30: the LIVE, NOT JUST EXIST deck ───────────────────────
// Every figure below is lifted from Joel's own offer deck rather than
// invented here. TOTAL_VALUE is the deck's stacked value ($6,000 + $8,000 +
// $5,000 + $2,500), NOT a former price the program ever sold at, and it is
// labelled "total value" on the page for exactly that reason. The old
// "NEXT ENROLLMENT $4,997" struck line is gone: with the price at $7,500 it
// implied the next cohort would be CHEAPER, which was nonsense.
const PRICE = '$7,500';
// The deposit. This number and the live allin-deposit Stripe price are the
// same thing: change one, change the other, or the page promises a figure
// Stripe does not charge. ($197 until 2026-08-30, $500 since.)
const DEPOSIT = '$500';
const TOTAL_VALUE = '$21,500';

// ─── the 90-day intensive, phase by phase. The week labels are the
// intensive's own weeks; the surrounding year is described further down. ──
// ─── WHAT YOU GET, straight from the deck ───────────────────────────
const WHAT_YOU_GET = [
  'Personal Health Review',
  'Your 90-Day Health Plan',
  'Personal Case Manager',
  'Weekly Coaching + Live Q&A',
  'Expert Sessions',
  'Monthly Progress Reviews',
  'Community + Accountability for one year',
];

// The three phases with the deck's stated values, then the bonuses. These add
// to TOTAL_VALUE above; if you change one, change that.
const VALUE_STACK = [
  {
    phase: 'PHASE 1',
    name: 'Understand what is going on',
    lead: 'Stop guessing. Know what deserves your attention first.',
    value: '$6,000',
    items: [
      'Personal Health Review',
      'Your Top 3 Health Priorities',
      'Know Your Numbers: BP, A1C, blood sugar and labs',
      'Doctor Conversation Guide',
      'Personal Case Manager Kickoff',
    ],
  },
  {
    phase: 'PHASE 2',
    name: 'Make it work in real life',
    lead: 'Eat better. Move better. Stay consistent.',
    value: '$8,000',
    items: [
      'Personalized Food Plan',
      'Meal and Recipe App built around foods you like',
      'Personal Movement Plan',
      'Green, Yellow and Red Day Plan',
      'Herbs and Supplements Guidance',
      'Weekly Coaching + Accountability',
      'Monthly Progress Review',
    ],
  },
  {
    phase: 'PHASE 3',
    name: 'Get more of your life back',
    lead: 'Feel stronger. Feel like yourself. Go live.',
    value: '$5,000',
    items: [
      'Hair, Skin and Confidence Program',
      'Bring Sexy Back Sessions',
      'Expert Q&A Sessions',
      'Your Next Chapter Planning',
      '12-Month Community and Support',
    ],
  },
  {
    phase: 'FAST-ACTION BONUSES',
    name: 'For women who start now',
    lead: 'These are not more courses. They help you start better.',
    value: '$2,500',
    items: [
      'Your Next 5 Years Session: what are you getting healthy for?',
      'Life Change Starter Box: something real arrives at your house',
      'Bring Your +1: your spouse, partner or adult daughter can start too',
      'Make Your Own Hair and Skin Products',
    ],
  },
];

// Page 7 of the deck. The reason any of this matters.
const SO_YOU_CAN = [
  'Be there for your family',
  'Keep moving',
  'Feel like yourself again',
  'Bring sexy back',
  'Take the trip',
  'Finish the book',
  'Run the business',
  'Complete your purpose',
];

const PHASES = [
  {
    n: '01',
    name: 'MAP',
    weeks: 'Weeks 0 to 2',
    lead: 'Step back.',
    body: 'Look at your numbers, symptoms, routines, priorities and real life.',
    question: 'What deserves my attention first?',
    close: 'You leave this phase with direction instead of another giant to-do list.',
  },
  {
    n: '02',
    name: 'RESET',
    weeks: 'Weeks 2 to 5',
    lead: 'Now we begin.',
    body: 'Small, realistic shifts around the foundations influencing how you feel and function.',
    close: 'Not a punishment plan. Not trying to become a different woman overnight. We begin building the conditions for change.',
  },
  {
    n: '03',
    name: 'REBUILD',
    weeks: 'Weeks 5 to 8',
    lead: 'Food. Movement. Stress. Home routines.',
    body: 'The things that have to work when you leave the coaching call and go back to your actual life.',
    close: 'This is where knowing starts becoming doing.',
  },
  {
    n: '04',
    name: 'LIVE IT',
    weeks: 'Weeks 9 to 12',
    lead: 'Because your life is not lived inside a coaching program.',
    body: 'It is lived at work. With family. At restaurants. On vacation. During holidays. And during weeks when everything goes sideways.',
    close: 'This is where we work on making what you have built something you can actually live.',
  },
];

const SUPPORT = [
  { title: 'LIVE COACHING WITH ANNIE + JOEL', body: 'Ask questions. Get direction. Work through what is getting in the way.' },
  { title: 'PROGRESS + COURSE CORRECTION', body: 'Because sometimes the first plan needs adjusting. That is normal.' },
  { title: 'ACCOUNTABILITY + COMMUNITY', body: 'A place to keep showing up instead of quietly disappearing when life happens.' },
  { title: 'NURSE-LED HEALTH EDUCATION', body: 'So you can better understand your numbers, symptoms, patterns and the questions worth taking back to your healthcare team.' },
];

const BUILT_IN = [
  { title: 'KNOW YOUR LABS CONFIDENCE KIT', body: 'So the H’s, L’s and health numbers stop feeling like a foreign language.' },
  { title: 'GLOW FAST-TRACK', body: 'Focused support around some of the hair, skin and confidence concerns that make you say: "I just want to feel like myself again."' },
  { title: 'BRING YOUR PERSON PASS', body: 'Because sometimes making changes gets easier when the person living beside you understands what you are doing.' },
  { title: 'PRIVATE MIDPOINT CALIBRATION', body: 'A deeper check-in during the process to look at what is working, what is not and where to adjust.' },
  { title: '7-DAY COMEBACK RESET', body: 'Because missing a week should not turn into missing a year. We built a way back in.' },
];

// ─── form options. These strings are the contract with the API scorer in
// api/coaching-apply.js (scoreAllIn). Change one here, change it there. ───
const FOCUS_OPTIONS = [
  'Blood pressure', 'Blood sugar', 'Hormonal changes', 'Belly / weight changes',
  'Sleep / energy', 'Hair / skin', 'Stress', 'Several of these',
];
const READINESS_OPTIONS = [
  'I mostly need more information.',
  'I know a lot, but I need help implementing it.',
  'I have been trying things, but I need help knowing what to change or adjust.',
  'I am ready for personalized support and accountability.',
];
const INVESTMENT_OPTIONS = [
  'Pay in full',
  'Payment plan',
  'Explore available financing',
  'I need to understand the program better first',
];

// ─── small presentational helpers ────────────────────────────────────────
function Section({ children, bg = C.cream, id, tight }) {
  return (
    <section id={id} style={{ background: bg, padding: tight ? '48px 20px' : '72px 20px', scrollMarginTop: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function H({ children, size = 32, align = 'left', style }) {
  return (
    <h2 style={{
      fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.15,
      color: C.ink, margin: '0 0 20px', textAlign: align, letterSpacing: '-0.01em', ...style,
    }}>{children}</h2>
  );
}

function P({ children, style }) {
  return <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 16px', ...style }}>{children}</p>;
}

// The staccato one-line-per-thought rhythm the copy is written in.
function Beats({ lines, style }) {
  return (
    <div style={{ margin: '0 0 20px', ...style }}>
      {lines.map((l, i) => (
        <p key={i} style={{ fontSize: 17, lineHeight: 1.6, color: C.inkSoft, margin: '0 0 10px' }}>{l}</p>
      ))}
    </div>
  );
}

function Cta({ onClick, label = 'SEE IF WE ARE A GOOD FIT', sub, tight }) {
  return (
    <div style={{ textAlign: 'center', margin: tight ? '20px 0 0' : '32px 0 0' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'inline-block', background: C.ink, color: C.cream, border: 'none',
          padding: '18px 34px', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em',
          borderRadius: 4, cursor: 'pointer', width: '100%', maxWidth: 420,
        }}
      >
        {label}
      </button>
      <p style={{ fontSize: 11.5, letterSpacing: '0.06em', color: C.muted, margin: '12px 0 0', lineHeight: 1.6 }}>
        {sub || 'NO PAYMENT TO APPLY · APPLYING DOES NOT GUARANTEE OR RESERVE A COACHING PLACE'}
      </p>
    </div>
  );
}

export default function AllInPage() {
  const formRef = useRef(null);

  useEffect(() => {
    track('allin_view', { page: 'allin', mode: 'application' });
    const prev = document.title;
    document.title = 'The Life Change Accelerator | Coaching with Annie and Joel, RNs';
    return () => { document.title = prev; };
  }, []);

  const toForm = () => {
    track('allin_cta_click', { page: 'allin' });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main style={{ background: C.cream, color: C.ink, fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Sticky closing-tonight bar. Renders null once the deadline passes,
          so this page quietly returns to normal rather than showing a dead
          timer. See the component header for why it never rolls over. */}
      <ClosingSoonBanner href="#apply" label="Apply now" />

      {/* ── HERO ──────────────────────────────────────────────────────
          2026-08-10 rebuild (Joel): words first, picture last. The old hero
          led with the photo and a quoted question; this one leads with the
          reader. Requirements he set: call out the woman over 40 by name,
          sentence form not staccato beats, bigger and bolder, braver, the
          apply button ABOVE THE FOLD with a skip-the-line link under it, and
          the $4,997 struck through.

          ⚠️ ON THE STRUCK $4,997. It is labelled "Next enrollment" and NOT
          "regular price", "was", or "value", and that wording is load-bearing.
          $4,997 has never been charged for this program. Presenting a price
          nobody has paid as a former price is a fictitious-former-price claim,
          which is the exact pattern already flagged on Annie's /rising page.

          2026-08-30: the struck "NEXT ENROLLMENT $4,997" is GONE. With the
          price now $7,500 it claimed the next cohort would be CHEAPER than
          today's, which is both false and a reason to wait. What replaced it
          is the deck's own stacked value ($21,500), which is labelled "total
          value" and is not presented as a price anyone ever paid. */}
      <Section tight>
        <p style={{ fontSize: 12.5, letterSpacing: '0.2em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
          FOR WOMEN OVER 40
        </p>

        {/* ABOVE THE FOLD, and it is measured, not hoped: hook, one promise,
            the price, the button. Everything that explains the program sits
            BELOW the button. First build put the CTA at 1153px on a 720px
            laptop, which is not above the fold on any screen a real person
            owns. If you add a line up here, re-measure. */}
        <h1 style={{
          fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(31px, 5.4vw, 48px)',
          lineHeight: 1.05, margin: '0 0 16px', letterSpacing: '-0.03em',
        }}>
          A full year of coaching. Not another 90 days, and not on your own.
        </h1>

        <p style={{ fontSize: 'clamp(17px, 2.1vw, 21px)', lineHeight: 1.5, color: C.ink, margin: '0 0 18px', fontWeight: 700 }}>
          Live, not just exist. A year of nurse-led coaching with Annie and Joel, RNs, for the woman
          over 40 who is done doing this by herself.
        </p>

        {/* The deposit, big, above the fold. Joel, 2026-08-30. It is a LINK
            to /allin/pay, not decoration: a woman who reads "$500 down" and
            then finds only an application form has been told a thing the page
            will not let her do. The full price sits directly under it in the
            same block, because "$500 down" without "$7,500 total" one line
            later is the kind of half-truth that comes back as a refund. */}
        <a
          href="/allin/pay"
          style={{
            display: 'block', textDecoration: 'none', background: C.ink, color: C.cream,
            borderRadius: 8, padding: 'clamp(20px, 4vw, 28px) 20px', margin: '0 0 18px',
            textAlign: 'center',
          }}
        >
          <span style={{
            display: 'block', fontFamily: SERIF, fontWeight: 700, lineHeight: 1.02,
            fontSize: 'clamp(30px, 6.4vw, 46px)', letterSpacing: '-0.02em',
          }}>
            ONLY {DEPOSIT} DOWN
          </span>
          <span style={{
            display: 'block', fontFamily: SERIF, fontWeight: 700, lineHeight: 1.1,
            fontSize: 'clamp(19px, 3.6vw, 26px)', margin: '6px 0 0',
          }}>
            to reserve your spot today
          </span>
          <span style={{
            display: 'block', fontSize: 13, letterSpacing: '0.04em', margin: '14px 0 0',
            opacity: 0.82, lineHeight: 1.6,
          }}>
            {PRICE} total · {TOTAL_VALUE} in value · monthly plans up to 12 months
          </span>
          <span style={{
            display: 'inline-block', marginTop: 16, border: `1px solid ${C.cream}`,
            borderRadius: 4, padding: '11px 26px', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.09em',
          }}>
            RESERVE MY SPOT
          </span>
        </a>

        <Cta onClick={toForm} tight label="OR APPLY FIRST AND TALK TO US" />

        {/* ── below the button ─────────────────────────────────────── */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 'clamp(17px, 2.1vw, 20px)', lineHeight: 1.6, color: C.inkSoft, margin: '0 0 20px' }}>
            You have watched the videos, bought the supplements and started over on more Mondays than you
            can count. Somewhere along the way getting healthy turned into seven different projects you
            are managing by yourself, and nobody is looking at all of them together.
          </p>
          <p style={{ fontSize: 'clamp(17px, 2.1vw, 20px)', lineHeight: 1.6, color: C.ink, margin: '0 0 20px', fontWeight: 700 }}>
            You do not need another folder of information. You need someone to tell you what to work on
            first, and then walk it with you.
          </p>
          <p style={{ fontSize: 'clamp(16px, 2vw, 18.5px)', lineHeight: 1.65, color: C.inkSoft, margin: '0 0 20px' }}>
            That is what this is. Every week you are in a live room with Annie and Joel, bringing your
            questions, your numbers and your real life. Guest speakers join us for the things worth
            hearing from someone else. Ninety days of hands-on transformation, then the room, the
            coaching and the accountability stay open to you for a full year. For the first time in
            almost a year, we are opening a small number of places.
          </p>
          <p style={{ fontSize: 15.5, lineHeight: 1.65, color: C.inkSoft, margin: '0 0 14px', fontWeight: 700 }}>
            Live, not just exist. So you can:
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '8px 22px', margin: 0,
          }}>
            {SO_YOU_CAN.map((line) => (
              <p key={line} style={{ fontSize: 16, lineHeight: 1.6, color: C.inkSoft, margin: 0 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* ── IT IS NOT JUST ONE THING ─────────────────────────────────── */}
      <Section bg={C.paper}>
        <H>Maybe it is not just one thing any more.</H>
        <Beats lines={[
          'The blood pressure started changing.',
          'Then the blood sugar.',
          'Or the belly.',
          'The sleep.',
          'The energy.',
          'The hormones.',
          'The hair.',
          'The stress.',
        ]} />
        <P>And somewhere along the way, trying to get healthy started feeling like seven different projects.</P>
        <P style={{ fontWeight: 600 }}>So you keep asking:</P>
        <Beats lines={[
          'What do I fix first?',
          'What actually matters?',
          'What am I missing?',
          'And what do I do when what I have been trying is not working?',
        ]} />
        <H size={26} style={{ margin: '32px 0 16px' }}>You do not need another folder of information.</H>
        <P>You want someone to help you figure out:</P>
        <Beats lines={[
          'What deserves my attention first?',
          'What can I realistically change?',
          'What am I missing?',
          'And how do I make all of this work in my real life?',
        ]} />
        <P style={{ fontSize: 20, fontWeight: 600 }}>You need a map. And then you need help walking it.</P>
      </Section>

      {/* ── THIS IS COACHING ─────────────────────────────────────────── */}
      <Section>
        <H>This is coaching.</H>
        <Beats lines={[
          'Not another information library.',
          'Not another giant list of things you should be doing.',
          'Not another program you buy, watch for two weeks and quietly stop opening.',
        ]} />
        <P>This is guided support.</P>
        <P>A place to bring your questions. Your numbers. Your symptoms. Your patterns. Your real life.</P>
        <P>And get help turning what you know into something you can actually do.</P>
      </Section>

      {/* ── IMAGINE ──────────────────────────────────────────────────── */}
      <Section bg={C.paper}>
        <H>Imagine not having to figure out the next step by yourself.</H>
        <P>Imagine looking at the changes happening in your body and having a clearer idea of what deserves attention first.</P>
        <P>Imagine knowing what you are working on this week instead of trying to fix everything Monday morning.</P>
        <P>Imagine having someone to ask:</P>
        <Beats lines={[
          '"This is not working like I expected. What do I adjust?"',
          '"Life got crazy. How do I get back on track?"',
          '"Am I focusing on the right thing?"',
        ]} />
        <P>That is the kind of support this was built to provide.</P>
      </Section>

      {/* ── THE PATH ─────────────────────────────────────────────────
          2026-08-30: reworded from "Your 12-week life change path". The hero
          now promises a year, and a page that promises a year up top and
          sells twelve weeks in the middle contradicts itself in front of a
          $7,500 decision. The 90 days did not shrink and the week labels on
          each phase are unchanged: what changed is that the 90 days is now
          described as the first stretch OF the year rather than the whole
          thing. See the note beside the CONTINUATION section below. */}
      <Section>
        <H>Your first 90 days, and then the rest of your year</H>
        <P>We do not start by throwing everything at you. We move in order.</P>
        <P style={{ fontWeight: 600 }}>The first 90 days are the intensive. Here is how they run.</P>
        {PHASES.map((p) => (
          <div key={p.n} style={{ borderTop: `1px solid ${C.line}`, padding: '28px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
              <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.muted }}>{p.n}</span>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.06em' }}>{p.name}</span>
            </div>
            <p style={{ fontSize: 12.5, letterSpacing: '0.12em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
              {p.weeks.toUpperCase()}
            </p>
            <P style={{ fontWeight: 600 }}>{p.lead}</P>
            <P>{p.body}</P>
            {p.question && (
              <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3 }}>
                {p.question}
              </p>
            )}
            <P style={{ color: C.muted }}>{p.close}</P>
          </div>
        ))}
      </Section>

      {/* ── SUPPORT ──────────────────────────────────────────────────── */}
      <Section bg={C.paper}>
        <H>And you are not doing it alone.</H>
        <P>Through your 90-day intensive, and then for the rest of your year, you will have access to:</P>
        {SUPPORT.map((s) => (
          <div key={s.title} style={{ margin: '0 0 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.title}</p>
            <p style={{ fontSize: 16.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </Section>

      {/* ── THE REST OF THE YEAR ─────────────────────────────────────
          ⚠️ READ BEFORE CHANGING. This section is where the page's duration
          claim is actually cashed. The deck says "90 days of nurse-led
          transformation + one full year in the community", and Joel asked for
          the headline to say a year of coaching. Those are only both true if
          the coaching does not stop at day 90, so this section states exactly
          what continues and for how long: guided coaching months 4 to 6, then
          live monthly sessions and the community through month 12.
          If the real delivery is community-only after day 90, this section
          and the H1 are the two places to correct, together. Do not soften
          one and leave the other. */}
      <Section>
        <H size={26}>What happens after the first 90 days?</H>
        <P>You are not handed a certificate and shown the door.</P>
        <P>The intensive is 90 days. Your year is 12 months. We do not expect your life to suddenly become perfect on Week 13, so the support does not stop there.</P>
        <H size={26} style={{ margin: '24px 0 12px' }}>Months 4 to 6: continuation coaching</H>
        <P>Guided coaching after your intensive, to help you keep implementing what you built instead of quietly drifting back.</P>
        <P>Because sometimes the hardest part is not starting. It is continuing.</P>

        <H size={26} style={{ margin: '44px 0 16px' }}>&ldquo;And what if life hits me again later?&rdquo;</H>
        <P>Then you still have somewhere to go. For the rest of your 12 months you keep:</P>
        <H size={26} style={{ margin: '24px 0 12px' }}>Live monthly sessions and the community, through month 12</H>
        <P>A monthly rhythm of masterclass, live Q&amp;A and a coaching call, plus the community, your curriculum, recordings, resource library and support tools. Including future Change My Life Challenge experiences and available digital support resources.</P>
        <P>So instead of saying &ldquo;I fell off, I guess I am starting from zero again,&rdquo; you know where to return.</P>
      </Section>

      {/* ── BUILT IN ─────────────────────────────────────────────────── */}
      <Section bg={C.paper}>
        <H>We also built in the things that tend to stop women.</H>
        <P>Not random bonuses. The things that can make it harder to keep going.</P>
        {BUILT_IN.map((s) => (
          <div key={s.title} style={{ margin: '0 0 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.title}</p>
            <p style={{ fontSize: 16.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </Section>

      {/* ── MORE THAN A NUMBER ───────────────────────────────────────── */}
      <Section>
        <H>This is about more than getting a better number.</H>
        <P>It is about what your health gives you access to.</P>
        <Beats lines={[
          'The trip.', 'The grandbaby.', 'The graduation.', 'The wedding.',
          'The business.', 'Dinner out.', 'Dancing again.',
        ]} />
        <P>Feeling present in the room instead of wondering how soon you can go home.</P>
        <P>Having enough left at the end of the day to enjoy the people you have been working so hard for.</P>
        <P style={{ fontWeight: 600 }}>You do not have to become somebody else.</P>
        <P>You need support becoming more available for the life that is already yours.</P>
      </Section>

      {/*
        REAL WOMEN. REAL RESULTS. section intentionally NOT rendered here.
        See the header of this file. Three [REAL TESTIMONIAL] placeholders are
        not proof, and no consented testimonial in testimonials/CONSENT-LOG.md
        is cleared to appear as a coaching result beside this price.
      */}

      {/* ── WHAT YOU GET ─────────────────────────────────────────────
          Joel, 2026-08-30, from the LIVE, NOT JUST EXIST deck. The phase
          values ($6,000 / $8,000 / $5,000 / $2,500) are the deck's own and
          they sum to TOTAL_VALUE. They are labelled "value", never "was" or
          "regular price", because nothing here has ever sold separately at
          those numbers and calling them a former price would be a lie. */}
      <Section>
        <H>What you get</H>
        <P style={{ fontWeight: 700, color: C.ink, fontSize: 18.5 }}>
          Ninety days of nurse-led transformation, plus one full year in the community.
        </P>
        <div style={{ borderTop: `1px solid ${C.line}`, margin: '0 0 24px' }}>
          {WHAT_YOU_GET.map((item) => (
            <p key={item} style={{
              display: 'flex', gap: 12, alignItems: 'baseline', margin: 0,
              padding: '13px 0', borderBottom: `1px solid ${C.line}`,
              fontSize: 17, lineHeight: 1.5, color: C.inkSoft,
            }}>
              <span aria-hidden="true" style={{ fontWeight: 700, color: C.ink }}>+</span>
              <span>{item}</span>
            </p>
          ))}
        </div>
        <P style={{ margin: 0 }}>Do less, in the right order. Here is how it is built.</P>
      </Section>

      {/* ── THE STACK, phase by phase ────────────────────────────────── */}
      <Section bg={C.paper}>
        {VALUE_STACK.map((block) => (
          <div key={block.phase} style={{
            border: `1px solid ${C.line}`, borderRadius: 8, background: C.cream,
            padding: '22px 20px', margin: '0 0 16px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              gap: 14, flexWrap: 'wrap', margin: '0 0 6px',
            }}>
              <span style={{ fontSize: 12, letterSpacing: '0.16em', fontWeight: 700, color: C.muted }}>
                {block.phase}
              </span>
              <span style={{ fontSize: 12.5, letterSpacing: '0.06em', fontWeight: 700, color: C.ink }}>
                {block.value} VALUE
              </span>
            </div>
            <h3 style={{
              fontFamily: SERIF, fontSize: 26, fontWeight: 700, lineHeight: 1.15,
              color: C.ink, margin: '0 0 8px', letterSpacing: '-0.01em',
            }}>
              {block.name}
            </h3>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: C.muted, margin: '0 0 16px' }}>
              {block.lead}
            </p>
            {block.items.map((item) => (
              <p key={item} style={{
                display: 'flex', gap: 11, alignItems: 'baseline',
                fontSize: 16.5, lineHeight: 1.55, color: C.inkSoft, margin: '0 0 9px',
              }}>
                <span aria-hidden="true" style={{ fontWeight: 700, color: C.ink }}>+</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        ))}

        <div style={{
          border: `2px solid ${C.ink}`, borderRadius: 8, background: C.cream,
          padding: '22px 20px', textAlign: 'center', margin: '24px 0 0',
        }}>
          <p style={{ fontSize: 12.5, letterSpacing: '0.16em', fontWeight: 700, color: C.muted, margin: '0 0 4px' }}>
            TOTAL VALUE
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: C.muted, margin: '0 0 18px' }}>
            {TOTAL_VALUE}
          </p>
          <p style={{ fontSize: 12.5, letterSpacing: '0.16em', fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>
            YOUR INVESTMENT
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(40px, 8vw, 54px)', fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1 }}>
            {PRICE}
          </p>
        </div>
      </Section>

      {/* ── PRICE ────────────────────────────────────────────────────── */}
      <Section>
        <H>Only {DEPOSIT} down to reserve your spot today</H>
        <P>The investment for a full year of this coaching is:</P>
        <p style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, margin: '0 0 20px' }}>{PRICE} total</p>
        <P>You can reserve your place today with:</P>
        <p style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, margin: '0 0 16px' }}>{DEPOSIT}</p>
        <P>
          That {DEPOSIT} comes off the price, not on top of it. The remaining balance can be paid in
          full or spread over 6, 9 or 12 monthly payments, and you pick which on the next page.
        </P>
        <P style={{ color: C.muted, fontSize: 15.5 }}>
          Places are limited because the room is small and it is the two of us in it every week.
        </P>
        <div style={{ textAlign: 'center', margin: '28px 0 0' }}>
          <a
            href="/allin/pay"
            style={{
              display: 'inline-block', background: C.ink, color: C.cream, textDecoration: 'none',
              padding: '18px 34px', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em',
              borderRadius: 4, width: '100%', maxWidth: 420, boxSizing: 'border-box',
            }}
          >
            RESERVE MY SPOT FOR {DEPOSIT}
          </a>
        </div>
      </Section>

      {/* ── MEET THEM ─────────────────────────────────────────────────
          The photo, moved here from the hero on 2026-08-10 (Joel: "move our
          picture down towards the bottom of the page"). It lands better here
          than at the top: by this point she has read what the program is and
          what it costs, so the faces answer "who am I actually doing this
          with" at the moment that question matters, right before the page
          starts qualifying her. */}
      <Section bg={C.paper}>
        <img
          src={heroImg}
          alt="Annie and Joel, registered nurses"
          style={{ width: '100%', borderRadius: 8, display: 'block', margin: '0 0 22px' }}
        />
        <H size={26} align="center" style={{ margin: '0 0 12px' }}>Annie and Joel, RNs</H>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: 0, textAlign: 'center' }}>
          Two registered nurses who coach this together, every week, live. Plus the guest speakers we
          bring in when someone else is the right person to hear it from.
        </p>
      </Section>

      {/* ── NOT FOR EVERYBODY ────────────────────────────────────────── */}
      <Section>
        <H>I do not want everybody to join.</H>
        <P>This is personal coaching. I want to make sure:</P>
        <Beats lines={[
          'We can actually help you.',
          'You are looking for support, not just more information.',
          'You are ready to participate.',
          'You are willing to be coached.',
        ]} />
        <P>And that this makes sense for where you are right now.</P>
        <P>If that is you, the next step is simple. Tell us a little about what is going on. We will see if we are a good fit.</P>
      </Section>

      {/* ── THE FORM ─────────────────────────────────────────────────── */}
      <div ref={formRef}>
        <Section bg={C.paper} id="apply">
          <div style={{ border: `2px solid ${C.ink}`, borderRadius: 8, padding: '24px 20px', margin: '0 0 32px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.5 }}>
              No payment is required to apply. Submitting this form does not guarantee acceptance or reserve a place in the program.
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>You will not be charged by submitting this form.</p>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              This application is simply the first step to determine whether the coaching experience is a good fit for you.
              If you are accepted, you will receive your next steps before making any payment decision.
            </p>
          </div>
          <H>Quick fit application</H>
          <ApplyForm />
        </Section>
      </div>

      {/*
        Skip-the-line door. Deliberately quiet and deliberately LAST: the offer
        is application-first by design, so this must not compete with the form
        above it. It exists because a woman who already decided should not be
        made to fill in an application to hand over money, and because Joel
        needs a link to paste into a reply once he has said yes.
      */}
      <Section tight>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: C.muted, textAlign: 'center', margin: 0 }}>
          Already know this is for you and would rather not wait?{' '}
          <a href="/allin/pay" style={{ color: C.ink, fontWeight: 700 }}>Enroll now and choose how you want to pay.</a>
        </p>
      </Section>

      <footer style={{ background: C.cream, padding: '32px 20px 56px', borderTop: `1px solid ${C.line}` }}>
        <p style={{ maxWidth: 720, margin: '0 auto', fontSize: 12.5, lineHeight: 1.7, color: C.muted, textAlign: 'center' }}>
          Everything here is education-based nursing consultation, not medical advice, and it works alongside your
          doctor rather than instead of them. Your prescriber stays in charge of your medications.
        </p>
      </footer>
    </main>
  );
}

/* ==========================================================================
   QUICK FIT APPLICATION
   POSTs to /api/coaching-apply with source 'allin-apply'. The endpoint owns
   the rate limiter, validation, KV write, Joel's notify email and the delayed
   applicant ack. A non-ok response is surfaced honestly with a real address to
   fall back on, never swallowed into a fake success state: this form is now
   the ONLY application path into the program, so a silent failure is a lost sale AND a
   woman who thinks she applied.
   ========================================================================== */
function ApplyForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [focus, setFocus] = useState([]);
  const [happening, setHappening] = useState('');
  const [ninetyDays, setNinetyDays] = useState('');
  const [whyNow, setWhyNow] = useState('');
  const [readiness, setReadiness] = useState('');
  const [investment, setInvestment] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('');

  const toggleFocus = (opt) =>
    setFocus((cur) => (cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]));

  async function submit(e) {
    e.preventDefault();
    setErrMsg('');
    if (!name.trim()) return setErrMsg('Please tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErrMsg('Please check your email address.');
    if (!focus.length) return setErrMsg('Please pick at least one thing you would like help with.');
    if (happening.trim().length < 10) return setErrMsg('Please tell us a little about what has been happening.');
    if (ninetyDays.trim().length < 10) return setErrMsg('Please tell us what you would want to be different in 90 days.');
    if (!whyNow.trim()) return setErrMsg('Please tell us why changing this matters to you now.');
    if (!readiness) return setErrMsg('Please pick the option that sounds most like you.');
    if (!investment) return setErrMsg('Please tell us how you would prefer to handle the investment.');

    setState('sending');
    try {
      const res = await fetch('/api/coaching-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'allin-apply',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          focus,
          happening: happening.trim(),
          ninetyDays: ninetyDays.trim(),
          whyNow: whyNow.trim(),
          readiness,
          investment,
          anythingElse: anythingElse.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setErrMsg(data.error || 'That did not go through. Please try again in a moment.');
        track('allin_apply_submit', { ok: false, status: res.status });
        return;
      }
      track('allin_apply_submit', { ok: true, fitTier: data.fitTier || null });
      // 2026-08-10 (Joel): a dedicated thank-you page, not an inline block, so
      // she gets a full screen with the two doors on it (ask a question, or
      // skip the wait and check out). setState('done') is left below as the
      // fallback render in case navigation is ever blocked.
      setState('done');
      navigate('/allin/thank-you');
    } catch {
      setState('error');
      setErrMsg('That did not go through. Please check your connection and try again.');
      track('allin_apply_submit', { ok: false, status: 0 });
    }
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px', fontSize: 16, border: `1px solid ${C.line}`,
    borderRadius: 5, background: C.cream, color: C.ink, fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 15.5, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.5 };
  const groupStyle = { margin: '0 0 28px' };
  const choiceStyle = {
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px',
    border: `1px solid ${C.line}`, borderRadius: 5, marginBottom: 8, cursor: 'pointer',
    fontSize: 15.5, lineHeight: 1.5, background: C.cream,
  };

  if (state === 'done') {
    return (
      <div role="status" style={{ border: `2px solid ${C.ink}`, borderRadius: 8, padding: '28px 22px' }}>
        <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, margin: '0 0 14px' }}>Your application is in.</p>
        <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 12px' }}>
          Nothing was charged and no place has been reserved. We read these personally, so give us a little time.
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.7, color: C.inkSoft, margin: 0 }}>
          You will hear back by email with your next steps. If anything changes in the meantime, write to{' '}
          <a href="mailto:braveworksrn@gmail.com" style={{ color: C.ink, fontWeight: 700 }}>braveworksrn@gmail.com</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-name">Your name</label>
        <input id="ai-name" style={inputStyle} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-email">Email address</label>
        <input id="ai-email" style={inputStyle} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-phone">Phone number (optional)</label>
        <input id="ai-phone" style={inputStyle} type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
        <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>Only used to reach you about your application. No marketing texts.</p>
      </div>

      <div style={groupStyle}>
        <span style={labelStyle}>What would you most like help with right now?</span>
        {FOCUS_OPTIONS.map((opt) => (
          <label key={opt} style={choiceStyle}>
            <input type="checkbox" checked={focus.includes(opt)} onChange={() => toggleFocus(opt)} style={{ marginTop: 3 }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-happening">What has been happening?</label>
        <textarea id="ai-happening" style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={happening} onChange={(e) => setHappening(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-ninety">If the next 90 days went really well, what would you most want to be different?</label>
        <textarea id="ai-ninety" style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} value={ninetyDays} onChange={(e) => setNinetyDays(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-why">Why does changing this matter to you now?</label>
        <textarea id="ai-why" style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={whyNow} onChange={(e) => setWhyNow(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <span style={labelStyle}>Which sounds most like you?</span>
        {READINESS_OPTIONS.map((opt) => (
          <label key={opt} style={choiceStyle}>
            <input type="radio" name="ai-readiness" checked={readiness === opt} onChange={() => setReadiness(opt)} style={{ marginTop: 3 }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>

      <div style={groupStyle}>
        <span style={labelStyle}>If we are a fit, how would you prefer to handle the {PRICE} investment?</span>
        {INVESTMENT_OPTIONS.map((opt) => (
          <label key={opt} style={choiceStyle}>
            <input type="radio" name="ai-investment" checked={investment === opt} onChange={() => setInvestment(opt)} style={{ marginTop: 3 }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ai-else">Anything you would like Annie to know? (optional)</label>
        <textarea id="ai-else" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={state === 'sending'}
        style={{
          width: '100%', background: C.ink, color: C.cream, border: 'none', padding: '18px 24px',
          fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 4,
          cursor: state === 'sending' ? 'default' : 'pointer', opacity: state === 'sending' ? 0.6 : 1,
        }}
      >
        {state === 'sending' ? 'SENDING...' : 'SEE IF WE ARE A GOOD FIT'}
      </button>

      <p style={{ fontSize: 12.5, letterSpacing: '0.05em', color: C.muted, margin: '14px 0 0', textAlign: 'center', lineHeight: 1.7 }}>
        NO PAYMENT TODAY.<br />
        APPLYING DOES NOT GUARANTEE ACCEPTANCE OR RESERVE A PLACE.
      </p>

      {errMsg && (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 15, color: C.ink, fontWeight: 600, lineHeight: 1.6 }}>
          {errMsg}{' '}
          <a href="mailto:braveworksrn@gmail.com" style={{ color: C.ink }}>braveworksrn@gmail.com</a>
        </p>
      )}
    </form>
  );
}
