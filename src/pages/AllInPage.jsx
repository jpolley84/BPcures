// AllInPage (route: /allin) — "The Life Change Accelerator" APPLICATION.
//
// ── 2026-08-10: THIS PAGE STOPPED TAKING MONEY ───────────────────────────
// (Deposit note, same day: Joel's copy said $200, the live Stripe deposit
// price is $197, and he chose "make it the 197". The page and Stripe now
// agree, so the deposit is a real purchasable option on /allin/pay rather
// than something collected by hand.)
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
//   - The reservation deposit is $197 and matches the live allin-deposit
//     Stripe price exactly, so it is purchasable on /allin/pay. It was $200
//     in the supplied copy for a few hours on 2026-08-10; Joel resolved the
//     mismatch downward ("make it the 197") rather than minting a new price.
//     If that number ever changes, change BOTH the DEPOSIT constant below and
//     the Stripe price, or the page promises one figure and charges another.
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
// a result, so putting them under a "REAL RESULTS" heading next to $1,997
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
import { track } from '../utils/analytics';
import ClosingSoonBanner from '../components/ClosingSoonBanner';
// Annie + Joel, the photo Joel supplied 2026-08-06.
import heroImg from '../assets/life-change-accelerator.jpg';

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

const PRICE = '$1,997';
// 2026-08-10 (Joel): "make it the 197". His copy said $200; the live Stripe
// deposit price is $197 and he chose to match the page to Stripe rather than
// mint a new price. So this number and price_1TvOUL...ZG8iyG9S are now the
// same thing, and the "$200 collected out of band" caveat in the file header
// is retired. Change one, change the other.
const DEPOSIT = '$197';
const NEXT_PRICE = '$4,997';

// ─── the 12-week path ────────────────────────────────────────────────────
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

function Cta({ onClick, label = 'SEE IF WE ARE A GOOD FIT', sub }) {
  return (
    <div style={{ textAlign: 'center', margin: '32px 0 0' }}>
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
      <ClosingSoonBanner href="#apply" label="Apply before midnight" />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <Section tight>
        <p style={{ fontSize: 12, letterSpacing: '0.18em', color: C.muted, margin: '0 0 16px', fontWeight: 700 }}>
          FOR THE WOMAN WHO HAS BEEN ASKING...
        </p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 38, lineHeight: 1.12, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
          &ldquo;Annie, how can I actually work with you?&rdquo;
        </h1>
        <img
          src={heroImg}
          alt="Annie and Joel, registered nurses"
          style={{ width: '100%', borderRadius: 8, display: 'block', margin: '0 0 28px' }}
        />
        <Beats lines={[
          'Maybe you have watched the videos.',
          'Downloaded the guides.',
          'Bought the supplements.',
          'Tried eating differently.',
          'Started walking.',
          'Promised yourself you would finally get serious.',
          'And yet you are still sitting there thinking...',
        ]} />
        <H size={30} style={{ margin: '28px 0 24px' }}>
          &ldquo;I know a lot. I just do not know what I should be doing for ME.&rdquo;
        </H>
        <P>If that is you, keep reading.</P>
        <P>For the first time in almost a year, I am opening a small number of coaching places.</P>
        <P>And this is the final opportunity to enter this coaching experience at:</P>
        <p style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, margin: '0 0 8px' }}>{PRICE}</p>
        <Cta onClick={toForm} />
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

      {/* ── THE 12-WEEK PATH ─────────────────────────────────────────── */}
      <Section>
        <H>Your 12-week life change path</H>
        <P>We do not start by throwing everything at you. We move in order.</P>
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
        <P>Throughout your 12-week intensive, you will have access to:</P>
        {SUPPORT.map((s) => (
          <div key={s.title} style={{ margin: '0 0 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.title}</p>
            <p style={{ fontSize: 16.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </Section>

      {/* ── CONTINUATION + ECOSYSTEM ─────────────────────────────────── */}
      <Section>
        <H size={26}>&ldquo;But what if I need more than 12 weeks?&rdquo;</H>
        <P>We thought about that too.</P>
        <P>Your intensive transformation is 12 weeks. But we do not expect your life to suddenly become perfect on Week 13.</P>
        <P>So your experience also includes:</P>
        <H size={26} style={{ margin: '24px 0 12px' }}>3 months of continuation support</H>
        <P>Additional guided support after your initial 12 weeks to help you keep implementing what you have built.</P>
        <P>Because sometimes the hardest part is not starting. It is continuing.</P>

        <H size={26} style={{ margin: '44px 0 16px' }}>&ldquo;And what if life hits me again later?&rdquo;</H>
        <P>That is why you do not simply lose everything when the intensive ends. You will also have:</P>
        <H size={26} style={{ margin: '24px 0 12px' }}>Up to 12 months of ecosystem access</H>
        <P>A place to return to your curriculum, recordings, resource library and support tools. Including future Change My Life Challenge experiences and available digital support resources.</P>
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

      {/* ── PRICE ────────────────────────────────────────────────────── */}
      <Section bg={C.paper}>
        <H>The final {PRICE} enrollment</H>
        <P>The investment for this coaching experience is:</P>
        <p style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, margin: '0 0 20px' }}>{PRICE} total</p>
        <P>If you are accepted and decide to join, you may reserve your place with:</P>
        <p style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, margin: '0 0 16px' }}>{DEPOSIT}</p>
        <P>That {DEPOSIT} is applied toward your {PRICE} total. Payment options may also be available.</P>
        <P>When we open this level of coaching again, the planned enrollment price is:</P>
        <p style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, margin: '0 0 16px' }}>{NEXT_PRICE}</p>
        <P>I am telling you that plainly because some of you have been waiting for me to coach again. I do not want you finding out afterward that this door was open today.</P>
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
   the ONLY way into a $1,997 program, so a silent failure is a lost sale AND a
   woman who thinks she applied.
   ========================================================================== */
function ApplyForm() {
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
      setState('done');
      track('allin_apply_submit', { ok: true, fitTier: data.fitTier || null });
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
