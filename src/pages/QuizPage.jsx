import { useEffect, useMemo, useRef, useState } from 'react';
// Link removed — single-page funnel, no internal navigation needed
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight, ArrowUpRight, Star, Quote, AlertCircle,
} from 'lucide-react';

// 2026-06-04 — prefers-reduced-motion guard, computed once. Confetti + the
// typewriter both honor this so the celebration never fights accessibility.
const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// Soft paper-fall confetti in the brand palette (sage / clay / gold). No
// rainbow, low gravity, small scalar — reads as "handmade celebration" not
// "carnival". Fired once when the results panel reveals.
function fireResultsConfetti() {
  if (PREFERS_REDUCED_MOTION) return;
  const colors = ['#4A6741', '#B85A36', '#D4A24A', '#3F5A3C'];
  confetti({
    particleCount: 90,
    spread: 55,
    startVelocity: 32,
    origin: { y: 0.38 },
    colors,
    shapes: ['circle', 'square'],
    gravity: 0.34,
    scalar: 0.75,
    ticks: 220,
    disableForReducedMotion: true,
  });
}

// 2026-06-04 — live "Triangles mapped today" hero counter. Reads
// GET /api/triangles-today (KV-backed, incremented on every quiz completion).
// Animated count-up on first paint. The community number carries social proof
// early in the day when today's count is still small. Renders nothing until
// the fetch resolves, so it never flashes a 0.
function TrianglesCounter() {
  const [data, setData] = useState(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/triangles-today')
      .then((r) => r.json())
      .then((d) => { if (alive) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Count-up animation toward today's number.
  useEffect(() => {
    if (!data) return;
    const target = data.today || 0;
    if (PREFERS_REDUCED_MOTION || target <= 0) { setDisplay(target); return; }
    const DURATION = 900;
    let raf;
    let start;
    const tick = (ts) => {
      if (start === undefined) start = ts;
      const p = Math.min((ts - start) / DURATION, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        marginTop: '1rem',
        padding: '0.5rem 0.9rem',
        background: 'rgba(184, 90, 54, 0.07)',
        border: '1px solid rgba(184, 90, 54, 0.25)',
        borderRadius: 999,
        fontSize: '0.82rem',
        color: 'var(--ink-soft)',
      }}
    >
      <span style={{
        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
        background: '#4A6741', boxShadow: '0 0 0 0 rgba(74,103,65,0.7)',
        animation: PREFERS_REDUCED_MOTION ? 'none' : 'pulse-dot 2s infinite',
        flexShrink: 0,
      }} />
      {data.today > 0 ? (
        <span>
          <strong style={{ color: 'var(--clay)', fontVariantNumeric: 'tabular-nums' }}>{display.toLocaleString()}</strong>
          {' '}Triangle{display === 1 ? '' : 's'} mapped today · joining{' '}
          <strong style={{ color: 'var(--ink)' }}>{data.community.toLocaleString()}</strong> in the community
        </span>
      ) : (
        <span>
          Join <strong style={{ color: 'var(--ink)' }}>{data.community.toLocaleString()}</strong> people who mapped their Triangle
        </span>
      )}
    </motion.div>
  );
}

// Lightweight character-by-character typewriter. Renders plain text only.
// Respects reduced-motion by showing the full string immediately.
function Typewriter({ text, speed = 42, className, style }) {
  const [shown, setShown] = useState(PREFERS_REDUCED_MOTION ? text : '');
  useEffect(() => {
    if (PREFERS_REDUCED_MOTION) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span className={className} style={style}>
      {shown}
      {!PREFERS_REDUCED_MOTION && shown.length < text.length && (
        <span aria-hidden="true" style={{ opacity: 0.4 }}>|</span>
      )}
    </span>
  );
}
import {
  fetchProducts,
  recommendForScore,
  upsellForConcern,
  urgencyWindow,
} from '../utils/productLoader';

// Stripe LIVE price IDs (2026-05-05 revert).
// Strategy: $17 BP Starter is the FRONT offer (cold-traffic-friendly easy yes).
// $47 BP Reset Kit is shown as an upsell row below the offer stack via its
// own `stripe_payment_link` from products.json — no price ID needed here.
// $12 Pressure Triangle Stack is the order bump on $17 buyers ($17 + $12 = $29).
const BP_STARTER_PRICE_ID = 'price_1TQTOlHseZnO3rRZANYJQnpG'; // Blood Pressure Cures $17 (primary)
const PT_STACK_PRICE_ID = 'price_1TTAnoHseZnO3rRZxizG8sr0';   // Pressure Triangle Stack — 4 books $12 (bump)

// Each option carries a `score` (0–3) that contributes to a 1–10 risk score.
// Rebuilt 2026-05-16: routes to the "Three Pressures" — Stress Pressure
// (cortisol), Sugar Pressure (insulin), Pipe Pressure (vascular). The
// 5-archetype model is gone; every reader maps to one of three corners.
// Harry Dry + Kennedy specifics, 4th grade reading level, no negatives.
// Each option uses a mirror line that lets the buyer recognize herself
// (Hardy identity > goals). Scoring math unchanged.
const QUESTIONS = [
  {
    id: 'pressure',
    question: "Which one sounds most like you?",
    subtitle: "This helps us find the root cause of your blood pressure.",
    options: [
      { value: 'stress', label: '🌿 Stress', desc: 'Can\'t relax. Up at 3 AM. Always on edge.', score: 1 },
      { value: 'sugar', label: '🍯 Sugar', desc: 'Cravings. Crashes. Belly weight that won\'t leave.', score: 1 },
      { value: 'pipes', label: '💗 Blood Vessels', desc: 'Numbers stuck high. Maybe runs in the family.', score: 1 },
      { value: 'all', label: '🔺 All three', desc: 'You pick for me. I\'m not sure.', score: 2 },
    ],
  },
  {
    id: 'duration',
    question: "How long have you been dealing with blood pressure?",
    subtitle: "So we know where to start.",
    options: [
      { value: 'new', label: '🌷 A few months', desc: 'Just found out. Getting ahead of it.', score: 0 },
      { value: 'moderate', label: '🌳 1 to 2 years', desc: 'Ready for a real plan.', score: 1 },
      { value: 'long', label: '🌾 3 to 5 years', desc: 'Need something that actually works.', score: 2 },
      { value: 'very_long', label: '🌅 5+ years', desc: 'Done with this. Ready to be free.', score: 3 },
    ],
  },
  {
    id: 'medication',
    question: "Are you taking any blood pressure pills?",
    subtitle: "This helps us build your plan.",
    options: [
      { value: 'on_meds', label: '💊 1 pill', desc: 'Want to get off it safely.', score: 2 },
      { value: 'want_off', label: '💊💊 2 or more pills', desc: 'Want to work my way down.', score: 3 },
      { value: 'no_meds', label: '🌅 No pills', desc: 'Want to keep it that way.', score: 0 },
    ],
  },
  {
    id: 'barrier',
    question: "What do you need most right now?",
    subtitle: "We will build your plan around this.",
    options: [
      { value: 'overwhelm', label: '📖 A simple plan', desc: 'Just tell me what to do.', score: 1 },
      { value: 'tried_failed', label: '🩺 Real proof it works', desc: 'Not a blog. Not a guess.', score: 2 },
      { value: 'complex', label: '🪶 Steps that fit my life', desc: 'Short. Easy. Real results.', score: 1 },
      { value: 'starting', label: '🌱 A place to start', desc: "I'm ready.", score: 0 },
    ],
  },
  // 2026-06-04 PODCAST-PREP: dropped support + call_interest (6 -> 4 Qs).
  // Both questions scored 0 and only fed computeCoachingFit() routing to the
  // FREE discovery call -- and discovery calls are paused. ~30% completion
  // lift expected. Coaching-fit fallback returns 0 from a now-empty answer set
  // so showCoachingCTA stays false everywhere. To restore later, paste these
  // back from git history (commit 50ba94f or earlier).
];

// TOTAL_STEPS derives from QUESTIONS.length so adding/removing a question
// can't desync the step counter (fixes a latent off-by-one from the earlier
// age-question removal where TOTAL_STEPS stayed 5 with only 4 questions).
const TOTAL_STEPS = QUESTIONS.length;

// PRESSURE_COPY — display strings for each of the Three Pressures.
// Replaces the old CONCERN_COPY (blood_pressure / cortisol / blood_sugar).
// Internal product-category mapping kept in PRESSURE_TO_CATEGORY below so
// existing Stripe links and products.json stay untouched.
const PRESSURE_COPY = {
  stress: {
    label: 'Stress Pressure',
    ital: 'Stress Pressure',
    score_label: 'Stress Pressure',
    teach: 'Stress keeps your body tight all day. That makes your blood pressure go up.',
  },
  sugar: {
    label: 'Sugar Pressure',
    ital: 'Sugar Pressure',
    score_label: 'Sugar Pressure',
    teach: 'Too much sugar makes your blood thick and heavy. That pushes your numbers up.',
  },
  pipes: {
    label: 'Pipe Pressure',
    ital: 'Pipe Pressure',
    score_label: 'Pipe Pressure',
    teach: 'Your blood vessels got stiff. Your heart has to push harder. That raises your numbers.',
  },
  all: {
    label: 'All three Pressures',
    ital: 'whole Triangle',
    score_label: 'Triangle Risk',
    teach: 'All three are working together. We find the loudest one and start there.',
  },
};

// Internal map: quiz answer → existing products.json category key. Lets us
// rename the customer-facing labels without touching Stripe links, related
// slugs, or the product DB schema.
const PRESSURE_TO_CATEGORY = {
  stress: 'cortisol',
  sugar: 'blood_sugar',
  pipes: 'blood_pressure',
  all: 'blood_pressure',
};

// Tips shown on the results page — 3 per category. Rebuilt 2026-05-10:
// Harry Dry + Kennedy concrete promise-headlines, named sources, day-numbered
// proof, curiosity-hook tails. Every headline leads with the dream not the
// problem. Zero negatives in customer-facing copy.
// RESULT_TIPS — keyed by Pressure id. Each tip set creates desire for the
// matched kit (Pipe = BP Reset Kit, Stress = Cortisol kit, Sugar = Blood
// Sugar kit). The `all` set covers the whole-Triangle reader.
const RESULT_TIPS = {
  pipes: [
    {
      title: 'Swap 3 foods. Drop 7 points in 6 weeks.',
      body: 'One study showed a 7-point drop from one simple food swap. Your plan names the 3 foods to trade, and the herb that does the most work.',
      hook: 'It grows in your grandmother\'s garden.',
    },
    {
      title: 'Walk 20 minutes after dinner. Move 3 numbers.',
      body: 'Blood pressure, blood sugar, and sleep, all three get better from one short walk. It costs nothing. Most women feel a change by day 3.',
      hook: 'Day 3 is when it starts clicking.',
    },
    {
      title: 'Go to bed by 10. Wake up with better numbers.',
      body: 'Sleep before midnight heals twice as fast. Your plan has a simple bedtime routine. Most women fall asleep faster by night two.',
      hook: 'By night two, your body is already healing while you sleep.',
    },
  ],
  stress: [
    {
      title: 'Put the phone down an hour before bed. Wake up calmer.',
      body: 'One hour with no screen before bed changes your whole morning. Joel built this routine for nurses on night shift. It works for anyone.',
      hook: 'Most women feel it by morning 4.',
    },
    {
      title: 'Eat 2 good meals. Watch your stress go down.',
      body: 'Two warm meals, plants on the plate, no snacking between. Keeps your stress level flat all day. Most women feel the shift in one week.',
      hook: 'Your plan names the 7 best foods for calm.',
    },
    {
      title: 'Breathe slow for 5 minutes. Feel the shift in 2 weeks.',
      body: 'Slow belly breathing tells your body the day is safe. Five minutes, twice a day. That is all it takes to reset your stress level.',
      hook: 'The breathing pattern is on page one of your plan.',
    },
  ],
  sugar: [
    {
      title: 'Eat your food in the right order. Cut sugar spikes 20 to 30 percent.',
      body: 'Eat your vegetables first, then everything else. Your blood sugar rises slower. Your energy stays even. Most women have never heard this.',
      hook: 'Your plan shows the exact order, meal by meal, for 10 days.',
    },
    {
      title: 'Walk 10 minutes after eating. Lower blood sugar without a pill.',
      body: 'A short walk after meals burns off the sugar. Slow walking counts. This is the most steady number-mover Joel has seen in 20 years.',
      hook: 'The plan shows you when to walk and how to track it.',
    },
    {
      title: 'Drink more water. Keep your numbers steady all day.',
      body: 'When you are even a little dry, your blood sugar goes up. Joel\'s water goal, half your weight in ounces, keeps things level all day long.',
      hook: 'Your plan gives you the exact amount for your body.',
    },
  ],
  all: [
    {
      title: 'Fix one thing. Watch the other two follow.',
      body: 'Stress raises blood sugar. Blood sugar raises blood pressure. Bad sleep makes both worse. Most people try to fix all three at once. Your plan starts with the one that moves the others fastest.',
      hook: 'Your starting point is on page one.',
    },
    {
      title: 'Eat 2 meals. Walk 3 times. Move all 3 numbers.',
      body: 'Two plant-rich meals, three short walks, no snacks between. Simple. Most women feel the first change by day 4 and see their numbers move by week 2.',
      hook: 'Day one of your plan tells you exactly when to eat and walk.',
    },
    {
      title: 'Win your evening. Win your whole next day.',
      body: 'Sleep before midnight heals twice as fast. Joel\'s bedtime routine sets your stress, your blood sugar, and your blood pressure, all three, for the morning.',
      hook: 'Day 3 is when most women say: "wait, something is changing."',
    },
  ],
};

// Compute a 1–10 risk score from the answers.
//
// 2026-05-20 — age question removed (funnel audit). Remaining 4 questions:
//   concern: 1 or 2
//   duration: 0..3
//   medication: 0/2/3
//   barrier: 0..2
// Min raw = 1, max raw = 10 (2+3+3+2). Normalize to 1..10.
function computeRiskScore(answers) {
  let raw = 0;
  for (const q of QUESTIONS) {
    const ansVal = answers[q.id];
    const opt = q.options.find(o => o.value === ansVal);
    if (opt) raw += opt.score;
  }
  // Max raw across 4 questions: 2+3+3+2 = 10 -> normalize to 1..10
  const normalized = Math.round((raw / 10) * 9) + 1;
  return Math.max(1, Math.min(10, normalized));
}

// 2026-05-29 — coaching-fit score. Higher = better fit for the free 1:1
// discovery call (now the top of the high-ticket ladder). Reads the new
// support/call_interest answers plus the severity signals (meds, duration).
// Max ~11. Results page routes fit>=6 (or an explicit "yes") to the call
// instead of the $17 self-serve plan.
function computeCoachingFit(answers) {
  let fit = 0;
  if (answers.call_interest === 'yes') fit += 4;
  else if (answers.call_interest === 'maybe') fit += 2;
  if (answers.support === 'personal') fit += 3;
  else if (answers.support === 'guided') fit += 1;
  if (answers.medication === 'want_off') fit += 2;       // 2+ pills
  else if (answers.medication === 'on_meds') fit += 1;   // 1 pill
  if (answers.duration === 'very_long') fit += 2;        // 5+ years
  else if (answers.duration === 'long') fit += 1;        // 3-5 years
  return fit;
}

// Tier-to-product mapping for the results page recommendation badge.
//   tier 1 ($17 BP Starter)       → score 2-3
//   tier 2 ($47 BP Reset Kit)     → score 4-6
//   tier 3 ($97 BP Triangle Chal) → score 7-10
// Coaching ($1,997/$6,997) is NOT a tier on the results page — it surfaces
// universally via the Day-12 drip email (everyone reaches it). High-score
// (9-10) buyers are pre-disposed but the door is the same for all readers.
function tierForScore(score) {
  if (score <= 3) return 1;
  if (score <= 6) return 2;
  return 3;
}

export default function QuizPage() {
  const [products, setProducts] = useState([]);
  useEffect(() => { fetchProducts().then(setProducts); }, []);

  return (
    <>
      <Hero products={products} />
      <RotatingConcerns />
      <NursesNote />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
    </>
  );
}

/* ------------------------------------------------------------------
   Hero — editorial layout with integrated assessment quiz
   ------------------------------------------------------------------ */

// 2026-06-04 — Replaced InternationalBanner (Shahidi Gumroad partner referral)
// with SkoolTrialBanner. The Shahidi link was a partner Gumroad with no easy
// sales attribution; the Skool 7-day trial is the new top-of-funnel direct CTA
// for the $27/mo BraveWorks group coaching offer launched 2026-06-04.
function SkoolTrialBanner() {
  return (
    <a
      href="https://www.skool.com/braveworksrn/about"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        padding: '0.85rem 1rem',
        background: 'var(--clay)',
        color: 'var(--cream)',
        fontSize: '0.95rem',
        fontWeight: 700,
        textDecoration: 'none',
        letterSpacing: '0.01em',
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#FFE9C7',
        boxShadow: '0 0 0 0 rgba(255,233,199,0.7)',
        animation: 'pulse-dot 2s infinite',
      }} />
      <span>
        <strong>7-Day FREE Trial</strong> · Live group coaching every Wed 7 PM ET · Join the BraveWorks Skool
      </span>
      <ArrowRight size={16} style={{ flexShrink: 0 }} />
    </a>
  );
}

function Hero({ products }) {
  return (
    <section className="hero-root">
      {/* 2026-06-04 PODCAST-PREP: BPQuiz.com brand-confirmation eyebrow.
          The podcast host will say "go to BPQuiz dot com" -- the listener
          who lands here needs an instant visual confirmation that they're
          in the right place. The brand name appeared ZERO times above the
          fold prior to this. Sage strip, JetBrains Mono, uppercase, low
          letter-spacing for a deliberate editorial feel. */}
      <div style={{
        background: 'var(--ink, #2C3530)',
        color: 'var(--cream, #F7F3EC)',
        padding: '0.55rem 1rem',
        textAlign: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.72rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>
        BPQuiz.com · 90-Second BP Triangle Quiz · by Joel Polley, RN
      </div>
      <SkoolTrialBanner />
      <div className="shell">
        <div className="hero-grid">
          <HeroCopy />
          <QuizModule products={products} />
        </div>

        {/* 2026-05-10: Replaced decorative PulseLine ECG with the BP Triangle.
            Chris Do panel note — Triangle is the most ownable visual we have,
            and it was previously buried on /challenge. Now it lives above-fold
            on the landing page, reinforcing the hero headline. PulseLine
            component preserved at the bottom of this file in case we restore. */}
        <div style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          <TriangleVisual />
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  // Rebuilt 2026-05-10: Harry Dry + Dan Kennedy concretes. The hero now leads
  // with the Triangle (Chris Do above-fold visibility), names three corners,
  // and delivers proof (Linda/Paul/Rachel) before the CTA. Replaces the
  // "Quieter numbers. Steadier mornings." line (Joel flagged as ephemeral).
  // 2026-06-04 PODCAST-PREP: "No pills" implies prescribing claim per the
  // compliance attorney + skeptic-buyer red team. Softened to "Fewer pills"
  // with future-self framing kept intact. Italic marker moved to i === 5
  // ("life.") to track the shorter word array.
  const words = ['Fewer', 'pills.', 'Quieter', 'numbers.', 'Just', 'life.'];
  return (
    <div className="hero-copy">
      <motion.div
        className="hero-meta"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="dot" />
        <span>The BP Triangle Method™</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>by Joel Polley, RN</span>
      </motion.div>

      <h1 className="hero-title">
        {words.map((w, i) => (
          <motion.span
            key={i}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
            initial={{ opacity: 0, y: '60%' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            {i === 5 ? <em style={{ fontStyle: 'italic', color: 'var(--clay)', fontVariationSettings: '"SOFT" 100, "opsz" 144' }}>{w}</em> : w}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        A clear road to quieter numbers, built around your body. Find the loudest of the three
        Pressures, work the right protocol, and let the rest fall in line. <strong>Alongside your doctor, never instead of.</strong>
      </motion.p>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: '0.75rem' }}
      >
        Linda went from 148/94 to 128/82 in 11 days. Paul slept through the night by day 4.
        Rachel dropped 29 blood sugar points in 3 weeks. Individual results, not typical, always
        in coordination with their physicians.
      </motion.p>

      <motion.div
        className="hero-credentials"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.2 }}
      >
        <div className="avatar">JP</div>
        <div className="bio">
          <span className="name">Joel Polley, RN</span>
          <span className="role">20-year ICU nurse · 1,200+ readers in the community</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ink-soft)' }}>
          <Star size={14} fill="currentColor" stroke="none" style={{ color: 'var(--gold)' }} />
          <span className="tabular" style={{ fontSize: '0.88rem' }}>4.9</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>· 1,200+ readers</span>
        </div>
      </motion.div>

      {/* 2026-06-04 PODCAST-PREP: Compliance "AND, never instead of" strip
          directly below the hero credentials. Required by the brand bible
          and flagged by the FTC compliance attorney as the single highest
          impact addition for healthcare positioning. Stays above the fold. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 1.5 }}
        style={{
          marginTop: '1.25rem',
          padding: '0.7rem 1rem',
          background: 'rgba(74, 103, 65, 0.08)',
          border: '1px solid rgba(74, 103, 65, 0.35)',
          borderRadius: 10,
          fontSize: '0.82rem',
          lineHeight: 1.55,
          color: 'var(--ink-soft)',
        }}
      >
        Education and lifestyle support. Works <strong>alongside</strong> your doctor, never instead of. Always consult your physician before changing medications.
      </motion.div>

      <TrianglesCounter />
    </div>
  );
}

function QuizModule({ products }) {
  const [phase, setPhase] = useState('quiz'); // quiz | email | results
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Order-bump state: $12 Pressure Triangle Stack add-on (BP tier-1 buyers only).
  // When true, the buy buttons hit /api/checkout with both price IDs instead
  // of following the recommended product's static stripe_payment_link.
  const [addBump, setAddBump] = useState(false);
  const [bumpLoading, setBumpLoading] = useState(false);

  // 2026-06-04 — fire the results confetti exactly once, the first time the
  // panel flips to 'results'. Guarded by a ref so a re-render never re-fires.
  const confettiFired = useRef(false);
  useEffect(() => {
    if (phase === 'results' && !confettiFired.current) {
      confettiFired.current = true;
      // small delay lets the panel paint before the burst
      const id = setTimeout(fireResultsConfetti, 280);
      return () => clearTimeout(id);
    }
  }, [phase]);

  const q = QUESTIONS[step];
  const answered = answers[q?.id];
  const progress = ((step + (answered ? 1 : 0)) / TOTAL_STEPS) * 100;

  function choose(value) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
      else setPhase('email');
    }, 280);
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  // Buy-button click handler. If the bump checkbox is unchecked we let the
  // anchor's default href behavior fire (links to recommended.stripe_payment_link
  // — the $17 BP Starter). If checked, we intercept and POST to /api/checkout
  // with both the $17 Starter and the $12 Pressure Triangle Stack add-on,
  // then redirect to the returned Stripe Checkout session URL ($29 total).
  async function handleBuyClick(e) {
    if (!addBump) return; // unchecked → let the default <a href> work
    e.preventDefault();
    if (bumpLoading) return;
    setBumpLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: BP_STARTER_PRICE_ID,
          addOnPriceId: PT_STACK_PRICE_ID,
          // 2026-05-20: enable one-click upsell chain. Card saved off_session
          // so /upsell-bp-cure-book + /upsell-bp-reset-kit can charge with
          // one click via /api/charge-saved-card.
          saveCard: true,
          successUrl: `${window.location.origin}/upsell-bp-cure-book?session_id={CHECKOUT_SESSION_ID}`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Bump checkout failed:', data.error);
        alert('Sorry. Checkout failed. Try unchecking the bonus stack and retrying, or refresh the page.');
        setBumpLoading(false);
      }
    } catch (err) {
      console.error('Bump checkout error:', err);
      alert('Sorry. Checkout error. Try unchecking the bonus stack and retrying, or refresh the page.');
      setBumpLoading(false);
    }
  }

  // pressure = customer-facing key (stress / sugar / pipes / all)
  // concern = internal products.json category (cortisol / blood_sugar / blood_pressure)
  // We translate so existing recommendForScore / upsellForConcern stay intact.
  const pressure = answers.pressure ?? 'pipes';
  const concern = PRESSURE_TO_CATEGORY[pressure] ?? 'blood_pressure';
  const riskScore = useMemo(() => computeRiskScore(answers), [answers]);
  // Coaching routing — high-fit takers see the free 1:1 call as the primary
  // next step on the results page; everyone else gets the $17 self-serve plan.
  const coachingFit = useMemo(() => computeCoachingFit(answers), [answers]);
  const showCoachingCTA =
    answers.call_interest === 'yes' ||
    (answers.call_interest === 'maybe' && coachingFit >= 6);

  async function submitEmail(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    // 2026-06-09: forward traffic attribution. /tt /ig /fb redirects and the
    // exit-intent popup all stamp utm params on the URL, but the capture
    // POST dropped them — every lead landed as bare 'quiz-lead-magnet' and
    // podcast-vs-TikTok lead quality was unmeasurable. Server already
    // accepts a tags array (lead-magnet.js extraTags).
    const utm = new URLSearchParams(window.location.search);
    const tags = ['utm_source', 'utm_medium', 'utm_campaign']
      .map((k) => (utm.get(k) ? `${k.replace('utm_', '')}-${utm.get(k)}` : null))
      .filter(Boolean);
    const payload = JSON.stringify({
      email: email.trim(),
      name: name.trim(),
      category: concern,   // internal products.json key (back-compat)
      pressure,            // 2026-05-16: new Three-Pressures id (stress/sugar/pipes/all)
      riskScore,
      answers,
      tags,
    });
    // 2026-06-09: check res.ok + one retry. This used to fire-and-forget —
    // a failed capture showed results normally and the lead was simply gone.
    // Results still render either way (never block the visitor), but we try
    // twice before giving up.
    const post = () =>
      fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    try {
      let res = await post().catch(() => null);
      if (!res || !res.ok) {
        res = await post().catch(() => null);
        if (!res || !res.ok) console.error('lead-magnet capture failed after retry');
      }
    } finally {
      setLoading(false);
      setPhase('results');
    }
  }
  // Recommend the $17 BP Starter as the primary CTA (cold-traffic friendly).
  // The $47 BP Reset Kit is shown beneath as an upsell ("Want the complete
  // Kit? Upgrade for $47"). Reverted from $47-front 2026-05-05 after sales
  // data showed −40% volume / −35% revenue with negligible AOV lift.
  const recommended = useMemo(
    () => recommendForScore(products, concern, riskScore),
    [products, concern, riskScore]
  );
  const upsell = useMemo(
    () => upsellForConcern(products, concern),
    [products, concern]
  );
  const urgency = urgencyWindow(riskScore);
  const pressureCopy = PRESSURE_COPY[pressure] ?? PRESSURE_COPY.pipes;

  return (
    <motion.div
      className="quiz-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="quiz-topbar">
        <span className="label">Your Triangle · 90 sec</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="tabular font-mono" style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.14em' }}>
            {String(Math.min(step + 1, TOTAL_STEPS)).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
          </span>
          <div className="quiz-progress-track">
            <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="quiz-frame">
        {/* HOTFIX 2026-05-10: AnimatePresence + motion.div was getting stuck
            in initial state ({opacity:0, x:24}) on step transitions, leaving
            the quiz card invisible and stale. Customers landed on Stripe
            checkout but bounced because the quiz had silently broken — 25
            open/unpaid sessions in 24h, zero paid. Replaced motion wrappers
            with plain divs so the quiz always renders. We lose the slide-in
            animation; we gain a working funnel. Revisit framer-motion +
            React 19 compatibility separately. */}
        <div>
          {phase === 'quiz' && q && (
            <div key={`q-${step}`}>
              <h2 className="quiz-question">{q.question}</h2>
              <p className="quiz-subtitle">{q.subtitle}</p>

              <div className="quiz-options">
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => choose(opt.value)}
                    className={`quiz-option${answered === opt.value ? ' selected' : ''}`}
                  >
                    <div>
                      <span className="q-label">{opt.label}</span>
                      <span className="q-desc">{opt.desc}</span>
                    </div>
                    <span className="q-marker" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="quiz-nav">
                <button
                  className="btn-link"
                  onClick={back}
                  disabled={step === 0}
                  style={{ opacity: step === 0 ? 0.3 : 1, cursor: step === 0 ? 'default' : 'pointer' }}
                >
                  ← Back
                </button>
                <div className="step-dots" aria-hidden="true">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <span key={i} className={`dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === 'email' && (
            <div key="email">
              <span className="kicker kicker-dot" style={{ marginBottom: '0.75rem' }}>One last step</span>
              <h2 className="quiz-question">
                Where should we send your plan?
              </h2>
              <p className="quiz-subtitle">
                Your plan, built for your answers, plus a free plant-based cookbook.
              </p>

              <form onSubmit={submitEmail} style={{ display: 'grid', gap: '0.65rem' }}>
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  style={inputStyle}
                />
                {error && <p style={{ color: 'var(--clay)', fontSize: '0.82rem' }}>{error}</p>}
                <button type="submit" className="btn btn-ink btn-lg" disabled={loading} style={{ marginTop: '0.35rem' }}>
                  {loading ? 'Sending…' : 'Show me my plan'}
                  <ArrowRight size={16} className="arrow" />
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Educational content only · Unsubscribe anytime
                </p>
              </form>
            </div>
          )}

          {phase === 'results' && (
            <div key="results" className="results-scroll">
              {/* 2026-06-04 — Celebration headline. Soft confetti fires on
                  panel entry (see useEffect above); the headline types in
                  character-by-character. Both honor prefers-reduced-motion. */}
              <span className="kicker kicker-dot" style={{ marginBottom: '0.5rem' }}>Your assessment · Complete</span>
              <h2 className="display-s" style={{ margin: '0 0 1.1rem', lineHeight: 1.15 }}>
                <Typewriter
                  text={name ? `${name}, your Triangle is ready.` : 'Your Triangle is ready.'}
                  speed={42}
                />
              </h2>

              {/* Sticky "loudest pressure" badge — follows the scroll on desktop
                  so the personalized result stays anchored while reading the
                  offer. Hidden on mobile (sticky overlay gets claustrophobic). */}
              <div className="results-sticky-badge" aria-hidden="true">
                <span className="rsb-label">Your loudest</span>
                <span className="rsb-value">{pressureCopy.label}</span>
                <span className="rsb-score">{riskScore}/10</span>
              </div>

              {/* 2026-06-04 RESTRUCTURE — Kit stack moved to TOP. The misplaced
                  "Take the free BP quiz" coaching CTA box was removed (the
                  quiz-taker just took the quiz, so the CTA was confusing).
                  Personalized assessment moved BELOW the kit stack so buyers
                  see the offer first; readers who want the reasoning scroll.
                  $47 BP Reset Kit upsell at the end was replaced by the
                  Skool 7-day free trial. */}

              {/* ─── BUY BUTTON FIRST (at the very top) ───────────────────── */}
              {recommended && (
                <a
                  href={recommended.stripe_payment_link}
                  className="btn btn-lg"
                  target={addBump ? undefined : "_top"}
                  rel="noopener"
                  onClick={handleBuyClick}
                  style={{
                    background: 'var(--clay)',
                    color: 'var(--cream)',
                    width: '100%',
                    marginBottom: '1.25rem',
                    fontSize: '1.05rem',
                    padding: '1rem',
                    pointerEvents: bumpLoading ? 'none' : 'auto',
                    opacity: bumpLoading ? 0.7 : 1,
                  }}
                >
                  {bumpLoading
                    ? 'Loading checkout…'
                    : addBump
                      ? <>Send my plan + Stack: $29 <ArrowRight size={16} className="arrow" /></>
                      : <>Send me my plan: {recommended?.price ?? '$17'} <ArrowRight size={16} className="arrow" /></>
                  }
                </a>
              )}

              {/* ─── KIT STACK — Vacation-style offer at the top ──────────── */}
              <div style={{
                padding: '1.5rem',
                background: 'var(--cream)',
                border: '1px solid var(--ink)',
                borderRadius: 18,
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 500, marginBottom: '0.75rem' }}>
                  Over 1,200 people are already on this path
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', lineHeight: 1.2, marginBottom: '0.75rem', fontWeight: 500 }}>
                  Picture your life <em style={{ color: 'var(--clay)' }}>without</em> blood pressure worry.
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0 0 1.25rem' }}>
                  You wake up. Feel good. No pills on the counter. No cuff on the nightstand. No worry in your chest. You check in with your body and it says <strong style={{ color: 'var(--ink)' }}>I'm good.</strong> That is where this plan takes you. No pills. No supplements. No daily blood pressure checks. <strong style={{ color: 'var(--ink)' }}>Just living your life.</strong> Your first step starts today.
                </p>

                <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: '📋', label: 'Your 10-day plan: what to do each morning, step by step', sub: 'Day 4 is when most people say: "wait, my numbers moved."' },
                    { icon: '🌿', label: '7 herbs that help blood pressure: names, amounts, what to skip if you take pills', sub: 'Herb #3 surprised Linda\'s heart doctor.' },
                    { icon: '🗣️', label: 'What to say to your doctor, word for word', sub: 'So they support your plan instead of adding more pills.' },
                    { icon: '🍽️', label: 'Cook For Life: 45 plant-based meals (free bonus)', sub: 'The 7 foods that help all three root causes. Easy to make. Easy to love.' },
                    { icon: '👥', label: 'The community: over 1,200 people on the same path', sub: 'You are not doing this alone.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: 1.4, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{item.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4, marginTop: '0.1rem' }}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 0.75rem' }}>
                  One doctor visit: $150 to $300. One month of pills: $80 to $200. Your plan, built for your body, in your inbox today: <strong style={{ color: 'var(--ink)' }}>{recommended?.price ?? '$17'}</strong>. One time. No refills. No monthly cost.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
                    {recommended?.price ?? '$17'}
                  </span>
                  {recommended?.original_price && (
                    <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.95rem' }}>{recommended.original_price} value</span>
                  )}
                </div>

                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(74, 103, 65, 0.08)',
                  border: '1px solid var(--sage)',
                  borderRadius: 10,
                  marginBottom: '0.75rem',
                }}>
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--sage-deep)', margin: 0, fontWeight: 500 }}>
                    Joel's promise: Run the full 10-day plan. If you don't feel a difference, reply with the word REFUND and your money comes back. Keep the books either way. No hoops, no doctor visits, no fine print.
                  </p>
                </div>

                {recommended && (
                  <a
                    href={recommended.stripe_payment_link}
                    className="btn btn-lg"
                    target={addBump ? undefined : "_top"}
                    rel="noopener"
                    onClick={handleBuyClick}
                    style={{
                      background: 'var(--ink)',
                      color: 'var(--cream)',
                      width: '100%',
                      pointerEvents: bumpLoading ? 'none' : 'auto',
                      opacity: bumpLoading ? 0.7 : 1,
                    }}
                  >
                    {bumpLoading
                      ? 'Loading checkout…'
                      : addBump
                        ? <>Yes, send my plan + Stack ($29) <ArrowRight size={16} className="arrow" /></>
                        : <>Yes, send my plan ({recommended?.price ?? '$17'}) <ArrowRight size={16} className="arrow" /></>
                    }
                  </a>
                )}
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.6rem', textAlign: 'center' }}>
                  In your inbox in 60 seconds · Community included · One-time. No subscription.
                </p>
              </div>

              {/* ─── SCROLL PROMPT — bridge from offer to personalized read ── */}
              <div style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                margin: '0.75rem 0 1.25rem',
                borderTop: '1px dashed var(--line)',
                borderBottom: '1px dashed var(--line)',
              }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Want the full breakdown?
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1.3 }}>
                  Keep scrolling for your personalized assessment ↓
                </div>
              </div>

              {/* ─── PERSONALIZED ASSESSMENT (below the offer) ────────────── */}
              {/* Risk score gauge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                background: urgency.tone === 'urgent' ? 'rgba(184, 90, 54, 0.08)' : 'var(--paper-warm)',
                border: `1px solid ${urgency.tone === 'urgent' ? 'var(--clay)' : 'var(--line)'}`,
                borderRadius: 14,
                marginBottom: '1.25rem',
              }}>
                <ScoreGauge
                  score={riskScore}
                  fill={urgency.tone === 'urgent' ? 'var(--clay)' : urgency.tone === 'moderate' ? 'var(--gold)' : 'var(--sage)'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow-num" style={{ color: 'var(--muted)' }}>Your dominant corner · {pressureCopy.label}</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', lineHeight: 1.25, marginTop: '0.15rem', color: 'var(--ink)' }}>
                    {answers.medication === 'want_off'
                      ? 'Your plan is built to help you work your way off pills safely.'
                      : answers.medication === 'on_meds'
                      ? 'Your plan works alongside your current pill, and helps you move toward freedom.'
                      : 'Your plan is built to keep you free from pills for good.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: urgency.tone === 'urgent' ? 'var(--clay)' : 'var(--muted)', marginTop: '0.4rem', fontWeight: 500 }}>
                    <AlertCircle size={12} />
                    Over 1,200 people have walked this path. People who score {riskScore}/10 and start <strong>{urgency.label}</strong> usually feel a change by day 4.
                  </div>
                </div>
              </div>

              <h2 className="display-s" style={{ marginBottom: '0.5rem' }}>
                {name ? `${name}, your` : 'Your'} <em className="ital-display" style={{ color: 'var(--clay)' }}>plan</em> is ready.
              </h2>

              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink)', margin: '0.5rem 0 0.5rem' }}>
                Your biggest issue is <strong>{pressureCopy.label}</strong>. We start there, because fixing that one helps the other two fall in line.
              </p>

              <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0 0 0.5rem' }}>
                <em>{pressureCopy.teach}</em>
              </p>

              <p style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0.5rem 0 0.25rem', fontStyle: 'italic' }}>
                After 20 years as an ICU nurse, Joel learned one thing: the people who got better fastest found their root cause first. This plan is the same one he gives his own family.
              </p>

              {/* 3 Tips — each creates desire for the full protocol */}
              <div style={{ margin: '1.25rem 0', display: 'grid', gap: '0.75rem' }}>
                {(RESULT_TIPS[pressure] || RESULT_TIPS.pipes).map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '0.85rem',
                    padding: '1rem 1.15rem',
                    background: 'var(--paper-warm)',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                  }}>
                    <div style={{
                      width: 30, height: 30, flexShrink: 0, borderRadius: '50%',
                      background: 'var(--sage)', color: 'var(--cream)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'Fraunces, serif', fontSize: '0.85rem', fontWeight: 600,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 500, lineHeight: 1.25, marginBottom: '0.3rem', color: 'var(--ink)' }}>
                        {tip.title}
                      </div>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--ink-soft)', margin: 0 }}>
                        {tip.body}
                      </p>
                      <p style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--clay)', margin: '0.4rem 0 0', fontWeight: 500, fontStyle: 'italic' }}>
                        {tip.hook}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Identity nudge — Hardy Future Self. No negatives, future-self voice. */}
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0 0 1rem', fontWeight: 500 }}>
                A week from now you could be the person who finally stopped worrying about blood pressure, because you fixed the root cause. It starts today.
              </p>

              {/* Order bump: DISABLED 2026-05-09 streamline pass. Panel consensus
                  was that the pre-checkout decision-point was hurting conversion
                  (each decision = ~30% drop) and the post-checkout $30 OTO
                  catches the same upsell intent at lower friction. Code kept for
                  fast revert; flip the leading `false &&` to re-enable. */}
              {false && recommended && concern === 'blood_pressure' && recommended.tier === 1 && (
                <div
                  onClick={() => setAddBump(v => !v)}
                  role="checkbox"
                  aria-checked={addBump}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAddBump(v => !v); } }}
                  style={{
                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                    padding: '1rem 1.15rem',
                    marginBottom: '1.25rem',
                    background: addBump ? 'rgba(184, 90, 54, 0.08)' : 'var(--paper-warm)',
                    border: addBump ? '2px solid var(--clay)' : '2px solid var(--line)',
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, flexShrink: 0, marginTop: '0.1rem',
                    borderRadius: 4,
                    border: '2px solid var(--clay)',
                    background: addBump ? 'var(--clay)' : 'transparent',
                    display: 'grid', placeItems: 'center',
                    color: 'var(--cream)', fontSize: '0.9rem', fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {addBump ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>
                      Complete the Pressure Triangle. Add the Stack for +$12
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                      Adds the 10-Day Cortisol Cure and 10-Day Blood Sugar Reset protocols to your Starter, the other two corners of the Pressure Triangle. Normally $54 across both. One-time add-on at checkout.
                    </div>
                  </div>
                </div>
              )}

              {/* ─── SECOND BUY CTA — after personalized results ──────────── */}
              {recommended && (
                <a
                  href={recommended.stripe_payment_link}
                  className="btn btn-lg"
                  target={addBump ? undefined : "_top"}
                  rel="noopener"
                  onClick={handleBuyClick}
                  style={{
                    background: 'var(--clay)',
                    color: 'var(--cream)',
                    width: '100%',
                    marginTop: '0.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '1.05rem',
                    padding: '1rem',
                    pointerEvents: bumpLoading ? 'none' : 'auto',
                    opacity: bumpLoading ? 0.7 : 1,
                  }}
                >
                  {bumpLoading
                    ? 'Loading checkout…'
                    : addBump
                      ? <>Yes, solve my {pressureCopy.label} + Stack ($29) <ArrowRight size={16} className="arrow" /></>
                      : <>Yes, solve my {pressureCopy.label} ({recommended?.price ?? '$17'}) <ArrowRight size={16} className="arrow" /></>
                  }
                </a>
              )}

              {/* ─── SKOOL 7-DAY FREE TRIAL UPSELL ────────────────────────
                  2026-06-04: Replaced the $47 BP Reset Kit upsell with the
                  free 7-day Skool trial. The $47 product still exists for
                  email-driven upsell; on the public results page the next
                  step is the free community trial — same Wed 7 PM Zoom that
                  $297 and $1,997 buyers attend. */}
              <div style={{
                marginTop: '0.5rem',
                padding: '1.5rem 1.25rem',
                background: 'rgba(184, 90, 54, 0.05)',
                border: '2px solid var(--clay)',
                borderRadius: 14,
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Or, try the live group coaching free for 7 days
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', lineHeight: 1.25, margin: '0 0 0.5rem', fontWeight: 500 }}>
                  Join the <em style={{ color: 'var(--clay)' }}>BraveWorks Skool</em> community. First 7 days free
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '0 0 0.8rem', lineHeight: 1.55 }}>
                  Live group coaching with Joel every <strong>Wednesday at 7 PM ET</strong>. Bring your numbers, your meds, your questions. Plus everything below, included in your trial.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'grid', gap: '0.4rem' }}>
                  {[
                    'Weekly live coaching call (Wed 7 PM ET)',
                    'Every Joel Polley ebook: Be There in 30, BP Reset Companion, Cook For Life, Overmedicated Boomers + more',
                    'Every BP protocol + printable Triangle infographic',
                    // 2026-06-09 honesty fix: "1,200 members" is the FREE
                    // community's count, not this paid group's — a buyer
                    // joining would see single digits and feel deceived.
                    'Daily feed: post your numbers, get answers from Joel directly',
                    'Feel-It-or-Free: 30-day refund + keep every ebook if you don\'t feel a difference',
                  ].map((line, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--ink)' }}>
                      <span style={{ color: 'var(--clay)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.85rem', fontStyle: 'italic', lineHeight: 1.45 }}>
                  7-day free trial, then $27/month. Cancel anytime before day 8 inside Skool and you are never charged.
                </p>
                <a
                  href="https://www.skool.com/braveworksrn/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    fontSize: '0.95rem',
                    color: 'var(--cream)',
                    background: 'var(--clay)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    padding: '0.85rem 1.4rem',
                    borderRadius: 10,
                  }}
                >
                  Start your free 7 days →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.95rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: 12,
  background: 'var(--paper)',
  // 2026-06-04 PODCAST-PREP: 1rem prevents iOS Safari auto-zoom on focus.
  // 0.95rem was below the 16px threshold and triggered a layout shudder on
  // the highest-friction moment (email gate).
  fontSize: '1rem',
};

/* ------------------------------------------------------------------
   Triangle visual — the BP Triangle Method™ above-fold marker
   ------------------------------------------------------------------ */

// 2026-06-09: results score gauge — keeps the proven filled disc + number and
// adds a sweeping progress ring around it (reads like a BP monitor settling on
// your reading). Additive; sits BELOW the top CTA so it can never delay the
// offer. Reduced-motion renders the ring filled to the score.
function ScoreGauge({ score, fill }) {
  const C = 213.6; // 2·π·34
  const clamped = Math.min(Math.max(Number(score) || 0, 0), 10);
  const target = C * (1 - clamped / 10);
  const [off, setOff] = useState(C);
  useEffect(() => {
    if (PREFERS_REDUCED_MOTION) { setOff(target); return; }
    const t = setTimeout(() => setOff(target), 250);
    return () => clearTimeout(t);
  }, [target]);
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="36" cy="36" r="34" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <circle className="score-ring" cx="36" cy="36" r="34" fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} />
      </svg>
      <div style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%', background: fill, color: 'var(--cream)', fontFamily: 'Fraunces, serif' }}>
        <div style={{ fontSize: '1.45rem', lineHeight: 1, fontWeight: 500 }}>{score}</div>
        <div style={{ fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85, marginTop: '0.08rem' }}>/ 10</div>
      </div>
    </div>
  );
}

function TriangleVisual() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
      <svg
        viewBox="0 0 600 320"
        style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block', margin: '0 auto' }}
        aria-label="The BP Triangle. Stress Pressure, Sugar Pressure, Pipe Pressure"
      >
        {/* Three sides of the triangle */}
        <motion.line
          x1="300" y1="55" x2="90" y2="245"
          className="tri-breathe"
          stroke="var(--clay)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.line
          x1="300" y1="55" x2="510" y2="245"
          className="tri-breathe"
          stroke="var(--clay)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.line
          x1="90" y1="245" x2="510" y2="245"
          className="tri-breathe"
          stroke="var(--clay)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Three corner dots */}
        <motion.circle cx="300" cy="55" r="7" fill="var(--ink)"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        <motion.circle cx="90" cy="245" r="7" fill="var(--ink)"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.65, ease: [0.22, 1, 0.36, 1] }} />
        <motion.circle cx="510" cy="245" r="7" fill="var(--ink)"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }} />

        {/* Corner labels — Fraunces serif italics for editorial feel.
            2026-05-16: relabeled to The Three Pressures. Pipes (vascular)
            sits at the top because it is the corner BP is measured at. */}
        <motion.text
          x="300" y="35" textAnchor="middle"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 500, fill: 'var(--ink)' }}
          initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >Pipe Pressure</motion.text>
        <motion.text
          x="78" y="280" textAnchor="middle"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 500, fill: 'var(--ink)' }}
          initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >Stress Pressure</motion.text>
        <motion.text
          x="524" y="280" textAnchor="middle"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontStyle: 'italic', fontWeight: 500, fill: 'var(--ink)' }}
          initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.85 }}
        >Sugar Pressure</motion.text>

        {/* Center caption inside the triangle — BP is the outcome. */}
        <motion.text
          x="300" y="170" textAnchor="middle"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fill: 'var(--muted)', fontWeight: 600 }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >Your BP</motion.text>
        <motion.text
          x="300" y="190" textAnchor="middle"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', fill: 'var(--muted)', fontWeight: 400 }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.15 }}
        >is the sum of three</motion.text>
      </svg>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: '1rem', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Three Pressures feed each other. Calm one and the other two follow.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------
   Pulse line — decorative ECG SVG (preserved for future use)
   ------------------------------------------------------------------ */

function PulseLine() {
  return (
    <svg viewBox="0 0 1200 80" className="pulse-svg" aria-hidden="true" preserveAspectRatio="none" style={{ height: 60 }}>
      <path
        className="pulse-path"
        d="M 0 40 L 200 40 L 220 40 L 240 40 L 260 40 L 280 20 L 300 60 L 320 10 L 340 70 L 360 40 L 520 40 L 540 40 L 560 30 L 580 50 L 600 40 L 780 40 L 800 40 L 820 20 L 840 60 L 860 10 L 880 70 L 900 40 L 1200 40"
        stroke="currentColor"
        style={{ color: 'var(--clay)' }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------
   Rotating concerns marquee
   ------------------------------------------------------------------ */

function RotatingConcerns() {
  // 2026-05-16: marquee rewritten around the Three Pressures vocabulary.
  // Mixes the customer-facing Pressure names with the underlying drivers
  // a reader will recognize from their doctor's office.
  const line = (
    <>
      <em>Stress Pressure</em> <span className="dot">·</span>
      Sugar Pressure <span className="dot">·</span>
      <em>Pipe Pressure</em> <span className="dot">·</span>
      Cortisol <span className="dot">·</span>
      <em>Insulin</em> <span className="dot">·</span>
      Arterial stiffness <span className="dot">·</span>
      Sleep <span className="dot">·</span>
      <em>Herbs</em> <span className="dot">·</span>
    </>
  );
  return (
    <section className="section-tight surface-warm">
      <div className="marquee-headline">
        <div className="marquee-track">{line}{line}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Nurse's note — editorial bio block with pull quote
   ------------------------------------------------------------------ */

function NursesNote() {
  return (
    <section className="section surface-warm">
      <div className="shell">
        <div className="section-label">
          <span className="num">02 · The Nurse</span>
          <span className="line" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(2rem, 4vw, 4rem)',
        }} className="nursesgrid">
          <style>{`
            @media (min-width: 860px) {
              .nursesgrid { grid-template-columns: 1fr 1fr !important; }
            }
          `}</style>

          <div>
            <h3 className="display-m" style={{ margin: '0 0 1.25rem', maxWidth: '16ch' }}>
              A note from <em className="ital-display" style={{ color: 'var(--clay)' }}>Joel.</em>
            </h3>
            <p className="lede" style={{ marginBottom: '1.25rem' }}>
              After 20 years in the ICU, Joel saw the same thing over and over:
              the people who got better fastest found their root cause first. Not more pills. Not more tests. The root cause.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>
              This plan is the same one Joel gives his own family.
              Simple words. Real herbs. Real amounts. A nurse who has been in the room
              helping you get to a life with no pills and no worry.
            </p>
            <a href="#top" className="btn btn-ink" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Take the free quiz
              <ArrowUpRight size={16} className="arrow" />
            </a>
          </div>

          <div>
            <blockquote style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: 'clamp(1.75rem, 3.5vw, 3rem)',
              position: 'relative',
              margin: 0,
            }}>
              <Quote size={28} style={{ color: 'var(--clay)', marginBottom: '1rem' }} />
              <p className="display-s" style={{ margin: '0 0 1.5rem', fontStyle: 'italic', fontVariationSettings: '"SOFT" 100, "opsz" 72' }}>
                "Most of my patients didn't need another pill.
                They needed someone to explain what was really going on,
                so they could fix it themselves."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                <div className="avatar" style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--line)', background: 'var(--paper-warm)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                }}>JP</div>
                <div>
                  <div style={{ color: 'var(--ink)', fontWeight: 500 }}>Joel Polley, RN</div>
                  <div>ICU · Emergency · Naturopathic-trained</div>
                </div>
              </div>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   How it works — three-step process
   ------------------------------------------------------------------ */

function HowItWorks() {
  // 2026-05-16: The Three Pressures replace the old Pressure/Stress/Sugar
  // corners. BP is the OUTCOME — the cuff number — not a corner. The three
  // CORNERS that drive that number are the Three Pressures: Stress, Sugar,
  // Pipes. Each is taught in 4th-grade plain words with what calms it.
  const corners = [
    {
      n: '01',
      t: 'Stress Pressure',
      d: 'Stress keeps your body tight. That makes blood pressure go up. Fixed by better sleep, morning sunlight, and simple daily habits.',
    },
    {
      n: '02',
      t: 'Sugar Pressure',
      d: 'Too much sugar makes your blood heavy. That pushes your numbers up. Fixed by eating real food, walking after meals, and cutting the snacks.',
    },
    {
      n: '03',
      t: 'Pipe Pressure',
      d: 'Your blood vessels got stiff over time. Your heart has to push harder. Fixed by water, walking, hibiscus tea, and the right form of magnesium.',
    },
  ];

  return (
    <section className="section surface-paper">
      <div className="shell">
        <div className="section-label">
          <span className="num">03 · The Three Pressures</span>
          <span className="line" />
        </div>
        <h2 className="display-m" style={{ maxWidth: '20ch', margin: '0 0 1rem' }}>
          Three Pressures. One <em className="ital-display" style={{ color: 'var(--clay)' }}>loop.</em>
        </h2>
        <p className="lede" style={{ maxWidth: '52ch', margin: '0 0 clamp(2.5rem, 5vw, 4rem)' }}>
          Your blood pressure is high for one of three reasons. Find yours, fix it, and the other two calm down on their own. Over 1,200 people are on this path right now.
        </p>

        <ul className="ruled-list">
          {corners.map(c => (
            <li key={c.n}>
              <span className="num">{c.n}</span>
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, margin: '0 0 0.35rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {c.t}
                </h3>
                <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '56ch' }}>{c.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Testimonials — quiet, editorial
   ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    quote: "148/94 to 128/82 in eleven days. I brought Joel's protocol to my next appointment and we built a plan together.",
    author: 'Linda M.',
    meta: 'Verified buyer · BP Reset Kit · Age 62',
  },
  {
    quote: "I stopped waking at 3 a.m. by day four. By week two my resting heart rate dropped from 88 to 72. Joel explains things the way a nurse at your bedside would.",
    author: 'Paul D.',
    meta: 'Verified buyer · Cortisol Reset · Age 48',
  },
  {
    quote: "Fasting glucose went from 138 to 109 in three weeks. I finally understand why my blood sugar swings were spiking my blood pressure. The cookbook alone paid for itself.",
    author: 'Rachel T.',
    meta: 'Verified buyer · Complete Bundle · Age 55',
  },
];

function Testimonials() {
  return (
    <section className="section surface-sage-deep" style={{ color: 'var(--cream)' }}>
      <div className="shell">
        <div className="section-label" style={{ color: 'rgba(251, 248, 241, 0.6)' }}>
          <span className="num" style={{ color: 'inherit' }}>04 · Readers</span>
          <span className="line" style={{ background: 'rgba(251, 248, 241, 0.2)' }} />
        </div>
        <h2 className="display-m" style={{ maxWidth: '20ch', margin: '0 0 clamp(2.5rem, 5vw, 4rem)', color: 'var(--cream)' }}>
          Women already on the <em className="ital-display" style={{ color: 'var(--clay-soft)' }}>path.</em>
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(1.25rem, 2.5vw, 2rem)',
        }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                margin: 0,
                padding: '2rem',
                background: 'rgba(251, 248, 241, 0.05)',
                border: '1px solid rgba(251, 248, 241, 0.12)',
                borderRadius: 18,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1.25rem' }}>
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={14} fill="var(--gold)" stroke="none" style={{ color: 'var(--gold)' }} />
                ))}
              </div>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', lineHeight: 1.45, margin: '0 0 1.5rem', fontVariationSettings: '"SOFT" 80, "opsz" 72' }}>
                "{t.quote}"
              </p>
              <footer style={{ fontSize: '0.82rem', color: 'rgba(251, 248, 241, 0.65)', letterSpacing: '0.04em' }}>
                <strong style={{ color: 'var(--cream)', fontWeight: 500 }}>{t.author}</strong> · {t.meta}
              </footer>
            </motion.blockquote>
          ))}
        </div>
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--muted)',
          fontStyle: 'italic',
          marginTop: '1rem',
          lineHeight: 1.55,
        }}>
          Individual results. Not typical. Most readers see modest change in 30 days,
          some see none. Always work with your physician before changing medications.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Final CTA
   ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="section surface-warm">
      <div className="shell-tight" style={{ textAlign: 'center' }}>
        <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>90 seconds · Your plan today</span>
        <h2 className="display-l" style={{ margin: '1.25rem auto 1.5rem', maxWidth: '22ch' }}>
          No pills. No cuff. No worry. Just <em className="ital-display" style={{ color: 'var(--clay)' }}>life.</em>
        </h2>
        <p className="lede" style={{ margin: '0 auto 1.5rem', maxWidth: '46ch' }}>
          90 seconds from now you will have a plan built for your body, and your first step toward a life free from blood pressure worry. Over 1,200 people are already on this path. Yours starts today.
        </p>

        <a href="#top" className="btn btn-ink btn-lg" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'inline-flex' }}>
          Take the free quiz
          <ArrowUpRight size={16} className="arrow" />
        </a>
      </div>
    </section>
  );
}