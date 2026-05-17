import { useEffect, useMemo, useState } from 'react';
// Link removed — single-page funnel, no internal navigation needed
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Star, Quote, AlertCircle,
} from 'lucide-react';
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

const TOTAL_STEPS = 5;

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
    question: "Which Pressure feels strongest in your story?",
    subtitle: "Joel's map starts at the corner that moves the other two fastest.",
    options: [
      { value: 'stress', label: '🌿 Stress Pressure', desc: 'Wired by day. Awake at 3 AM. Your switch is stuck on.', score: 1 },
      { value: 'sugar', label: '🍯 Sugar Pressure', desc: 'Cravings, crashes, belly weight that will not go.', score: 1 },
      { value: 'pipes', label: '💗 Pipe Pressure', desc: 'Numbers stuck high for years. Maybe family history.', score: 1 },
      { value: 'all', label: '🔺 All three', desc: 'Joel, you pick — I trust the map.', score: 2 },
    ],
  },
  {
    id: 'duration',
    question: "How long has your blood pressure been on your mind?",
    subtitle: "Helps Joel set the pace of your map.",
    options: [
      { value: 'new', label: '🌷 A few months', desc: 'New, and I am getting ahead.', score: 0 },
      { value: 'moderate', label: '🌳 1 to 2 years', desc: 'Ready for a real plan.', score: 1 },
      { value: 'long', label: '🌾 3 to 5 years', desc: 'Ready for a path that works.', score: 2 },
      { value: 'very_long', label: '🌅 5 years or more', desc: 'I want this to be my last season with it.', score: 3 },
    ],
  },
  {
    id: 'medication',
    question: "Where are you with your pills?",
    subtitle: "So Joel can match your map to your dose.",
    options: [
      { value: 'on_meds', label: '💊 1 pill', desc: "And I'd love help alongside it.", score: 2 },
      { value: 'want_off', label: '💊💊 2 or more pills', desc: 'And I want to walk down with my doctor.', score: 3 },
      { value: 'no_meds', label: '🌅 No pills yet', desc: 'And I want to stay free.', score: 0 },
    ],
  },
  {
    id: 'barrier',
    question: "What would help you most right now?",
    subtitle: "Joel will weight your map toward this.",
    options: [
      { value: 'overwhelm', label: '📖 A simple plan I can follow', desc: 'One map. Not ten.', score: 1 },
      { value: 'tried_failed', label: '🩺 Proof from a real nurse', desc: 'Not a blog. Not a hunch.', score: 2 },
      { value: 'complex', label: '🪶 Steps that fit my real life', desc: 'Short steps. Real results.', score: 1 },
      { value: 'starting', label: '🌱 A starting line', desc: "I'm ready.", score: 0 },
    ],
  },
  {
    id: 'age',
    question: "What's your season?",
    subtitle: "Joel calibrates herb dosing and pacing to your season.",
    options: [
      { value: 'under_40', label: '🌷 Under 40', desc: 'Starting strong.', score: 0 },
      { value: '40_49', label: '🌳 40 to 49', desc: 'Acting wisely.', score: 0 },
      { value: '50_59', label: '🌾 50 to 59', desc: 'Getting serious.', score: 1 },
      { value: '60_plus', label: '🌅 60 and up', desc: 'Living well.', score: 1 },
    ],
  },
];

// PRESSURE_COPY — display strings for each of the Three Pressures.
// Replaces the old CONCERN_COPY (blood_pressure / cortisol / blood_sugar).
// Internal product-category mapping kept in PRESSURE_TO_CATEGORY below so
// existing Stripe links and products.json stay untouched.
const PRESSURE_COPY = {
  stress: {
    label: 'Stress Pressure',
    ital: 'Stress Pressure',
    score_label: 'Stress Pressure',
    teach: 'Your stress switch is stuck on — body squeezes the pipes all day.',
  },
  sugar: {
    label: 'Sugar Pressure',
    ital: 'Sugar Pressure',
    score_label: 'Sugar Pressure',
    teach: 'Sugar stays high — water sticks, vessel walls swell, BP climbs.',
  },
  pipes: {
    label: 'Pipe Pressure',
    ital: 'Pipe Pressure',
    score_label: 'Pipe Pressure',
    teach: 'Pipes got stiff — same blood, harder squeeze to push it through.',
  },
  all: {
    label: 'All three Pressures',
    ital: 'whole Triangle',
    score_label: 'Triangle Risk',
    teach: 'All three corners feed each other. Joel maps the loudest one first.',
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
      title: 'Trade 3 foods. Drop 7 points in 6 weeks.',
      body: 'Tufts University measured it: 7.2 mmHg systolic, in 6 weeks, from one simple swap. Your map names the 3 foods that hide in most kitchens — and the herb that does the heavy lifting.',
      hook: 'It grows in your grandmother\'s garden.',
    },
    {
      title: 'Walk 20 minutes after dinner. Move 3 numbers at once.',
      body: 'Pressure, blood sugar, and your sleep score — all three soften with one short stroll. Joel calls it the evening glide. It is free, it takes 20 minutes, and most women feel the first drop by day 3.',
      hook: 'Day 3 is the day the first women write Joel back.',
    },
    {
      title: 'Bed by 10. Cuff by 7. Smile by 8.',
      body: 'The hours before midnight do double the healing. Your map gives you Joel\'s 60-minute wind-down — the same routine he built for ICU nurses on night shift. Most women fall asleep faster by night two.',
      hook: 'Night two is the night your map starts working while you sleep.',
    },
  ],
  stress: [
    {
      title: 'Wind down 60 minutes. Wake up with calmer mornings.',
      body: 'A single 60-minute screen-free window in the evening shifts your morning cortisol more than any supplement. Joel built the routine for nurses on night shift — it works in any season of life.',
      hook: 'The first morning most women notice is morning 4.',
    },
    {
      title: 'Eat 2 real meals. Watch stress soften within a week.',
      body: 'Two warm meals — breakfast and lunch, plant-rich, no snacks between — keeps your stress curve flat all day. Most women feel the change within 7 mornings.',
      hook: 'Your map names the 7 foods that quiet the curve fastest.',
    },
    {
      title: 'Breathe 5 minutes a day. Shift your baseline in 2 weeks.',
      body: 'Slow belly-breathing tells your nervous system the day is safe. Five minutes, twice a day, moves your stress baseline in 14 days flat. Joel includes a printable card for your nightstand.',
      hook: 'The 4-7-8 count is on page one of your map.',
    },
  ],
  sugar: [
    {
      title: 'Eat in the right order. Cut spikes by 20 to 30 percent.',
      body: 'Start each meal with vegetables or fiber. Glucose rises slower, your insulin works less, and your post-meal crash flattens out. Most women have never been told this.',
      hook: 'Joel maps the exact bite-by-bite order — meal by meal, for 10 days.',
    },
    {
      title: 'Walk 10 minutes after eating. Lower glucose without a pill.',
      body: 'A short stroll after meals drives glucose into your muscles without extra insulin. Slow walking counts. Joel tracks this with his patients — it is the most consistent number-mover he has measured.',
      hook: 'The tracker shows you when to walk and how to measure the win.',
    },
    {
      title: 'Drink your gallon. Keep your numbers steady all day.',
      body: 'Even mild dehydration concentrates your blood sugar. Joel\'s water formula — half your body weight in ounces, working up to a gallon — keeps your baseline low and your kidneys filtering well.',
      hook: 'Your map includes the exact ounce target for your weight.',
    },
  ],
  all: [
    {
      title: '1 loop. 3 corners. 30 days to start it coming home.',
      body: 'Stress raises blood sugar. Blood sugar raises blood pressure. Sleep raises both back. Most women fix one corner and wait. Joel\'s map starts at the corner that moves the other two fastest — for you it changes the whole loop.',
      hook: 'Your map names your starting corner on page one.',
    },
    {
      title: 'Eat 2 meals. Walk 3 times. Move all 3 numbers.',
      body: 'Two plant-rich meals, three short walks, no snacks between. Joel calls it the simple rhythm. Most women feel the first change by day 4, and see numbers move by week 2.',
      hook: 'The exact times for both meals are on day one of your map.',
    },
    {
      title: 'Win your evening. Win the whole next day.',
      body: 'Hours before midnight do double the healing. Joel\'s 60-minute wind-down was built for ICU nurses — it sets your morning cortisol, your morning glucose, and your morning cuff reading. All three.',
      hook: 'Day 3 is the morning most women say: "wait, this is moving."',
    },
  ],
};

// Compute a 1–10 risk score from the answers.
//
// 2026-05-14 verified: scoring math is sound.
//   Raw range per question:
//     concern: 1 or 2          (BP/cort/sugar = 1; all = 2)
//     duration: 0..3
//     medication: 0/2/3
//     barrier: 0..2
//     age: 0..1
//   Min raw = 1 (concern always ≥1), max raw = 11 (2+3+3+2+1).
//   Normalized score range in practice: 2..10.
function computeRiskScore(answers) {
  let raw = 0;
  for (const q of QUESTIONS) {
    const ansVal = answers[q.id];
    const opt = q.options.find(o => o.value === ansVal);
    if (opt) raw += opt.score;
  }
  // Max raw across questions: 2+3+3+2+1 = 11 -> normalize to 1..10
  const normalized = Math.round((raw / 11) * 9) + 1;
  return Math.max(1, Math.min(10, normalized));
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

function Hero({ products }) {
  return (
    <section className="hero-root">
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
  const words = ['3', 'corners.', '30', 'days.', 'One', 'closed', 'pill', 'bottle.'];
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
        Your cuff number is the sum of <strong>three Pressures:</strong> Stress, Sugar, Pipes.
        Three corners. One loop. Calm the loudest one and the other two follow. Your doctor signs off.
        The bottle goes in the drawer.
      </motion.p>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: '0.75rem' }}
      >
        Linda did it in 11 days — 148/94 to 128/82. Paul slept through the night by day 4.
        Rachel's fasting glucose dropped 29 points in 3 weeks. Same map. Same nurse.
        Yours arrives today.
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
          <span className="role">20 years ICU &amp; Emergency · 326K across TikTok, Facebook &amp; Instagram</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ink-soft)' }}>
          <Star size={14} fill="currentColor" stroke="none" style={{ color: 'var(--gold)' }} />
          <span className="tabular" style={{ fontSize: '0.88rem' }}>4.9</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>· 1,200+ readers</span>
        </div>
      </motion.div>
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
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Bump checkout failed:', data.error);
        alert('Sorry — checkout failed. Try unchecking the bonus stack and retrying, or refresh the page.');
        setBumpLoading(false);
      }
    } catch (err) {
      console.error('Bump checkout error:', err);
      alert('Sorry — checkout error. Try unchecking the bonus stack and retrying, or refresh the page.');
      setBumpLoading(false);
    }
  }

  // pressure = customer-facing key (stress / sugar / pipes / all)
  // concern = internal products.json category (cortisol / blood_sugar / blood_pressure)
  // We translate so existing recommendForScore / upsellForConcern stay intact.
  const pressure = answers.pressure ?? 'pipes';
  const concern = PRESSURE_TO_CATEGORY[pressure] ?? 'blood_pressure';
  const riskScore = useMemo(() => computeRiskScore(answers), [answers]);

  async function submitEmail(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          category: concern,   // internal products.json key (back-compat)
          pressure,            // 2026-05-16: new Three-Pressures id (stress/sugar/pipes/all)
          riskScore,
          answers,
        }),
      }).catch(() => null);
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
                Where should Joel send your map?
              </h2>
              <p className="quiz-subtitle">
                Your map, hand-matched to your Triangle — plus the Cook For Life plant-based cookbook, free.
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
                  {loading ? 'Sending…' : 'Show me my map'}
                  <ArrowRight size={16} className="arrow" />
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Educational content only · Unsubscribe anytime
                </p>
              </form>
            </div>
          )}

          {phase === 'results' && (
            <div key="results">
              <span className="kicker kicker-dot" style={{ marginBottom: '0.75rem' }}>Your assessment · Complete</span>

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
                <div style={{
                  display: 'grid', placeItems: 'center',
                  width: 64, height: 64, flexShrink: 0,
                  borderRadius: '50%',
                  background: urgency.tone === 'urgent' ? 'var(--clay)' : urgency.tone === 'moderate' ? 'var(--gold)' : 'var(--sage)',
                  color: 'var(--cream)',
                  fontFamily: 'Fraunces, serif',
                }}>
                  <div style={{ fontSize: '1.6rem', lineHeight: 1, fontWeight: 500 }}>{riskScore}</div>
                  <div style={{ fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85, marginTop: '0.1rem' }}>/ 10</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow-num" style={{ color: 'var(--muted)' }}>Your dominant corner · {pressureCopy.label}</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', lineHeight: 1.25, marginTop: '0.15rem', color: 'var(--ink)' }}>
                    {answers.medication === 'want_off'
                      ? 'Joel matched you with a map for the women walking down with their doctor.'
                      : answers.medication === 'on_meds'
                      ? 'Joel matched you with a map that works beside your pills.'
                      : 'Joel matched you with a map for the women staying free from pills.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: urgency.tone === 'urgent' ? 'var(--clay)' : 'var(--muted)', marginTop: '0.4rem', fontWeight: 500 }}>
                    <AlertCircle size={12} />
                    1,247 women have walked this path. Women who score {riskScore}/10 and start <strong>{urgency.label}</strong> are usually the ones who write Joel back by day 4.
                  </div>
                </div>
              </div>

              <h2 className="display-s" style={{ marginBottom: '0.5rem' }}>
                {name ? `${name}, your` : 'Your'} <em className="ital-display" style={{ color: 'var(--clay)' }}>map</em> is ready.
              </h2>

              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink)', margin: '0.5rem 0 0.5rem' }}>
                Your Triangle leans hardest on <strong>{pressureCopy.label}</strong>. Joel's map starts there — because moving that corner moves the other two by week two.
              </p>

              <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0 0 0.5rem' }}>
                <em>{pressureCopy.teach}</em>
              </p>

              {/* Epiphany Bridge — Brunson belief break in Joel's voice, no negatives */}
              <p style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0.5rem 0 0.25rem', fontStyle: 'italic' }}>
                Twenty years in the ICU taught Joel one thing the textbooks left out: the women who got well fastest understood their Triangle. They knew which corner to love first. The map you are about to see is the same one Joel hands to his own family.
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
                A week from today you could be the woman who knows her Triangle by heart — and watches her cuff answer back. The map starts that shift on day one.
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
                      Complete the Pressure Triangle — add the Stack for +$12
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                      Adds the 10-Day Cortisol Cure and 10-Day Blood Sugar Reset protocols to your Starter — the other two corners of the Pressure Triangle. Normally $54 across both. One-time add-on at checkout.
                    </div>
                  </div>
                </div>
              )}

              {/* Buy button FIRST — above the stack */}
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
                      ? <>Send my map + Stack — $29 <ArrowRight size={16} className="arrow" /></>
                      : <>Send me my map — {recommended.price} <ArrowRight size={16} className="arrow" /></>
                  }
                </a>
              )}

              {/* Vacation-style offer stack — sell the feeling */}
              <div style={{
                padding: '1.5rem',
                background: 'var(--cream)',
                border: '1px solid var(--ink)',
                borderRadius: 18,
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 500, marginBottom: '0.75rem' }}>
                  1,247 women are already on this path
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', lineHeight: 1.2, marginBottom: '0.75rem', fontWeight: 500 }}>
                  Picture a Tuesday, <em style={{ color: 'var(--clay)' }}>6 months</em> from now.
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0 0 1.25rem' }}>
                  You wake at 7. Sunlight on the kitchen floor. Hibiscus tea on the table. You take the cuff out — first time in 3 weeks — and read <strong style={{ color: 'var(--ink)' }}>122 over 78.</strong> You write it in the journal. You text your daughter. Your pill bottle? Two shelves down, behind the floss. Hasn't opened in <strong style={{ color: 'var(--ink)' }}>47 days.</strong> That's where The Path to BP Freedom ends. Your first step starts today.
                </p>

                <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: '📋', label: 'The 10-day daily map — what to do each morning, in plain words', sub: 'Day 4 is the day most women write Joel: "wait, my numbers moved."' },
                    { icon: '🌿', label: 'Joel\'s 7 most-trusted herbs — names, doses, what to skip on pills', sub: 'Herb #3 surprised Linda\'s cardiologist.' },
                    { icon: '🩺', label: 'The 9-line doctor-visit script — word for word', sub: 'Most doctors say yes to step one before you finish the page.' },
                    { icon: '🍽️', label: 'Cook For Life — 45 plant-rich meals (bonus)', sub: 'Built around the 7 foods that quiet all three corners. Joel\'s grandmother\'s bean soup is page 22.' },
                    { icon: '👥', label: 'The Skool community — 1,247 women already walking', sub: 'Search "day 4" and read what is coming for you.' },
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

                {/* Price anchor — Kennedy 3-number compare. Driven by `recommended.price`. */}
                <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 0.75rem' }}>
                  One visit with a naturopath: $150 to $300. One month of brand-name pills with co-pay: $80 to $200. Your map, hand-matched to your Triangle, delivered to your inbox today: <strong style={{ color: 'var(--ink)' }}>{recommended?.price ?? '$17'}</strong>. One time. No refills. No co-pay.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
                    {recommended?.price ?? '$17'}
                  </span>
                  {recommended?.original_price && (
                    <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.95rem' }}>{recommended.original_price} value</span>
                  )}
                </div>

                {/* Guarantee — Hormozi + Kennedy */}
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(74, 103, 65, 0.08)',
                  border: '1px solid var(--sage)',
                  borderRadius: 10,
                  marginBottom: '0.75rem',
                }}>
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--sage-deep)', margin: 0, fontWeight: 500 }}>
                    Joel's promise: Walk the 30-day map. If your doctor and you haven't agreed to step down a single pill by day 30, Joel refunds every penny. No hoops. No fine print.
                  </p>
                </div>

                {/* Buy button SECOND — below the stack */}
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
                        ? <>Yes Joel — send my map + Stack ($29) <ArrowRight size={16} className="arrow" /></>
                        : <>Yes Joel — send my map ({recommended?.price ?? '$17'}) <ArrowRight size={16} className="arrow" /></>
                    }
                  </a>
                )}
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.6rem', textAlign: 'center' }}>
                  Inbox in 60 seconds · Skool community included · One-time. No subscription.
                </p>
              </div>

              {/* Tier-2 upsell — only the $47 BP Reset Kit appears here. The
                  $97 cohort offer was pulled from this page 2026-05-11 at
                  Joel's request; it now surfaces in the post-purchase email
                  instead. Two clean options on-page: $17 starter or $47
                  complete kit. */}
              {upsell && upsell.slug !== recommended?.slug && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1.15rem 1.15rem',
                  background: 'var(--paper-warm)',
                  border: '2px solid var(--ink)',
                  borderRadius: 12,
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Or — the complete kit (most women pick this)
                  </div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', lineHeight: 1.25, margin: '0 0 0.5rem', fontWeight: 500 }}>
                    Step up to <em style={{ color: 'var(--clay)' }}>{upsell.name}</em> — {upsell.price}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0 0 0.6rem', lineHeight: 1.5 }}>
                    Everything in the {recommended?.price ?? '$17'} starter — <strong>plus</strong>:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.85rem', display: 'grid', gap: '0.4rem' }}>
                    {[
                      'The Full-Stack BP path (weeks 2–4) — the protocol that locks the drop in',
                      'BP Reset Graduation phase — the pill-conversation script for Day 30',
                      'Joel\'s complete herb formulary with dosing ranges + med-interaction quick-ref',
                      'Printable BP tracker + daily readings log (the one Linda used)',
                      'All future updates to the BP Reset library — for life',
                    ].map((line, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--ink)' }}>
                        <span style={{ color: 'var(--sage-deep)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 0.75rem', fontStyle: 'italic', lineHeight: 1.45 }}>
                    Why most women pick this: the starter gets you started. The kit gets you to a closed pill bottle.
                  </p>
                  <a
                    href={upsell.stripe_payment_link}
                    target="_top"
                    rel="noopener"
                    style={{
                      display: 'inline-block',
                      fontSize: '0.92rem',
                      color: 'var(--cream)',
                      background: 'var(--ink)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      padding: '0.7rem 1.15rem',
                      borderRadius: 8,
                    }}
                  >
                    Send the complete kit — {upsell.price} →
                  </a>
                </div>
              )}
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
  fontSize: '0.95rem',
};

/* ------------------------------------------------------------------
   Triangle visual — the BP Triangle Method™ above-fold marker
   ------------------------------------------------------------------ */

function TriangleVisual() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
      <svg
        viewBox="0 0 600 320"
        style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block', margin: '0 auto' }}
        aria-label="The BP Triangle — Stress Pressure, Sugar Pressure, Pipe Pressure"
      >
        {/* Three sides of the triangle */}
        <motion.line
          x1="300" y1="55" x2="90" y2="245"
          stroke="var(--clay)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.line
          x1="300" y1="55" x2="510" y2="245"
          stroke="var(--clay)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.line
          x1="90" y1="245" x2="510" y2="245"
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
              Twenty years in the ICU taught Joel one thing the textbooks left out:
              the women who got well fastest understood their Triangle. They knew which corner to love first.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>
              The map you are about to see is the same one Joel hands his own family.
              Plain words. Real herbs. Real doses. A nurse who has been in the room — and on the other side of the cuff —
              walking you home.
            </p>
            <a href="#top" className="btn btn-ink" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Show me my Triangle
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
                "Most of my patients did not need one more pill.
                They needed someone to sit down and actually explain
                what was happening."
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
                  <div>ICU · Emergency · Naturopathic practitioner</div>
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
      d: 'Your stress switch is stuck on — body squeezes the pipes all day. Calmed by morning sunlight, hours before midnight, and 25 things to be grateful for.',
    },
    {
      n: '02',
      t: 'Sugar Pressure',
      d: 'Sugar stays high — water sticks, vessel walls swell, BP climbs. Calmed by two real meals, no snacks between, and a 10-minute walk after each.',
    },
    {
      n: '03',
      t: 'Pipe Pressure',
      d: 'Pipes got stiff — same blood, harder squeeze to push it through. Calmed by water, the walk, hibiscus tea, and the right form of magnesium.',
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
          Your cuff number is the sum of three Pressures — Stress, Sugar, and Pipes. Calm the loudest one and the other two follow. 1,247 women are on the path right now.
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
    quote: "148/94 to 128/82 in eleven days. My cardiologist asked what I changed. I showed her Joel's protocol. She made notes.",
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
        <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>90 seconds · Your map today</span>
        <h2 className="display-l" style={{ margin: '1.25rem auto 1.5rem', maxWidth: '22ch' }}>
          3 corners. 30 days. One closed pill <em className="ital-display" style={{ color: 'var(--clay)' }}>bottle.</em>
        </h2>
        <p className="lede" style={{ margin: '0 auto 1.5rem', maxWidth: '46ch' }}>
          90 seconds from now, you will have a map written for your Triangle — and your first step will already be on the calendar. 1,247 women are walking the same path. Yours starts today.
        </p>

        <a href="#top" className="btn btn-ink btn-lg" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'inline-flex' }}>
          Show me my Triangle
          <ArrowUpRight size={16} className="arrow" />
        </a>
      </div>
    </section>
  );
}