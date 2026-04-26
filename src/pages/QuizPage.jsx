import { useEffect, useMemo, useState } from 'react';
// Link removed — single-page funnel, no internal navigation needed
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Star, Quote, AlertCircle,
} from 'lucide-react';
import {
  fetchProducts,
  recommendForScore,
  urgencyWindow,
} from '../utils/productLoader';

const TOTAL_STEPS = 5;

// Each option carries a `score` (0–3) that contributes to a 1–10 risk score.
const QUESTIONS = [
  {
    id: 'concern',
    question: "Where does your body need the most attention right now?",
    subtitle: "We'll build your starting protocol around this.",
    options: [
      { value: 'blood_pressure', label: 'Blood pressure', desc: 'Elevated readings, on medication, or trying to prevent.', score: 1 },
      { value: 'cortisol', label: 'Chronic stress & cortisol', desc: 'Wired-tired, poor sleep, stress-driven symptoms.', score: 1 },
      { value: 'blood_sugar', label: 'Blood sugar', desc: 'Pre-diabetes, crashes, cravings, weight gain.', score: 1 },
      { value: 'all', label: 'All three — not sure where to start', desc: 'These systems pull each other. Let Joel decide.', score: 2 },
    ],
  },
  {
    id: 'duration',
    question: "How long has this been part of your life?",
    subtitle: "Calibrates the intensity of your protocol.",
    options: [
      { value: 'new', label: 'Less than 6 months', desc: 'Recently noticed — or recently diagnosed.', score: 0 },
      { value: 'moderate', label: '6 months to 2 years', desc: "Bothers you, but still manageable.", score: 1 },
      { value: 'long', label: '2 to 5 years', desc: "Chronic. Gradual creep.", score: 2 },
      { value: 'very_long', label: 'More than 5 years', desc: "Long-term. Tried things. Nothing stuck.", score: 3 },
    ],
  },
  {
    id: 'medication',
    question: "Are you currently on a prescription for this?",
    subtitle: "So Joel can flag interactions before they happen.",
    options: [
      { value: 'on_meds', label: 'Yes — want natural support alongside', desc: "Complementing, not replacing.", score: 2 },
      { value: 'want_off', label: "Yes — want to reduce my dependence", desc: "With your doctor's blessing.", score: 3 },
      { value: 'no_meds', label: "No — getting ahead of it naturally", desc: "Prevention over prescription.", score: 0 },
    ],
  },
  {
    id: 'barrier',
    question: "What's been in the way until now?",
    subtitle: "This shapes which protocol we recommend first.",
    options: [
      { value: 'overwhelm', label: 'Information overload', desc: 'Everyone online contradicts everyone else.', score: 1 },
      { value: 'tried_failed', label: "Tried things — nothing held", desc: 'You need something clinically backed.', score: 2 },
      { value: 'complex', label: "Too complicated to maintain", desc: 'You need a protocol that actually fits a life.', score: 1 },
      { value: 'starting', label: "Just starting research", desc: "You want nurse-level guidance from the start.", score: 0 },
    ],
  },
  {
    id: 'age',
    question: "What's your age range?",
    subtitle: "Helps Joel calibrate herb dosing and lifestyle fit.",
    options: [
      { value: 'under_40', label: 'Under 40', desc: 'Getting ahead of it early.', score: 0 },
      { value: '40_49', label: '40–49', desc: 'Noticing changes. Smart to act now.', score: 0 },
      { value: '50_59', label: '50–59', desc: 'The decade most people get serious.', score: 1 },
      { value: '60_plus', label: '60+', desc: 'Experience on your side. Protocols matter more.', score: 1 },
    ],
  },
];

const CONCERN_COPY = {
  blood_pressure: { label: 'Blood pressure', ital: 'blood pressure', score_label: 'BP Risk' },
  cortisol: { label: 'Stress response', ital: 'cortisol', score_label: 'Cortisol Risk' },
  blood_sugar: { label: 'Blood sugar', ital: 'glucose', score_label: 'Glucose Risk' },
  all: { label: 'Whole system', ital: 'systems', score_label: 'Whole-System Risk' },
};

// Tips shown on the results page — 3 per category, each with a desire-creating hook
const RESULT_TIPS = {
  blood_pressure: [
    {
      title: 'Your sodium intake is likely double what your body can handle',
      body: 'Most people consume 3,400mg of sodium daily without realizing it. Even a two-week reduction moves systolic readings in most people — it\'s the fastest single lever you have.',
      hook: 'The full protocol shows you exactly which foods to swap and which herb amplifies the effect.',
    },
    {
      title: 'Evening walks are moving numbers faster than morning ones',
      body: 'Not for weight loss — for vasodilation. Twenty minutes after dinner drops systolic pressure more consistently than any other single habit change Joel tracks.',
      hook: 'Day 3 of the protocol adds the walking timing that moves diastolic numbers too.',
    },
    {
      title: 'Poor sleep is silently raising your blood pressure every night',
      body: 'Less than 7 hours elevates cortisol, which raises blood pressure. Fix the sleep and every other lever works better — this one compounds everything.',
      hook: 'The protocol includes Joel\'s herb-based sleep stack that patients say works by night two.',
    },
  ],
  cortisol: [
    {
      title: 'Your evening screen time is keeping cortisol elevated past midnight',
      body: 'Blue light suppresses melatonin and locks cortisol into overdrive. A single 60-minute wind-down window changes your morning cortisol curve faster than any supplement.',
      hook: 'The protocol gives you Joel\'s exact evening routine — the one he built for nurses working night shifts.',
    },
    {
      title: 'Skipping meals is triggering stress responses you can\'t feel',
      body: 'Your adrenals respond to low blood sugar like a threat. Protein, fat, and fiber every 4 hours keeps the cortisol curve flat — most people feel the difference within a week.',
      hook: 'The cookbook and meal timing guide inside the kit make this automatic — no willpower required.',
    },
    {
      title: 'Your breathing pattern is wired for fight-or-flight',
      body: 'Slow diaphragmatic breathing activates the vagus nerve, which directly lowers cortisol. Five minutes once a day shifts your baseline within two weeks.',
      hook: 'The protocol includes a printable 5-minute breathwork card you can keep on your nightstand.',
    },
  ],
  blood_sugar: [
    {
      title: 'The order you eat your food matters more than what you eat',
      body: 'Starting a meal with vegetables or fiber slows glucose absorption and flattens the post-meal spike by 20–30%. Most people have never been told this.',
      hook: 'The protocol maps out exactly what to eat first, second, and third — meal by meal for 10 days.',
    },
    {
      title: 'A 10-minute walk after eating is more powerful than most medications',
      body: 'A short walk after meals drives glucose into muscle cells without needing extra insulin. Even a slow stroll counts — it\'s the most consistent intervention Joel has tracked.',
      hook: 'The daily tracker inside the kit shows you exactly when to walk and how to measure the difference.',
    },
    {
      title: 'Dehydration is raising your blood sugar without you knowing',
      body: 'When you\'re dehydrated, your blood sugar concentrates. Consistent water intake keeps your baseline lower and your kidneys filtering properly.',
      hook: 'The protocol includes Joel\'s hydration formula calibrated to your body weight and activity level.',
    },
  ],
  all: [
    {
      title: 'These three systems are pulling each other in a loop',
      body: 'High cortisol raises blood sugar. High blood sugar raises blood pressure. Poor sleep raises cortisol. Most people treat one and wonder why the others won\'t budge.',
      hook: 'Joel\'s protocol addresses all three systems in sequence — starting with the one that unlocks the others.',
    },
    {
      title: 'Your meal timing might be the single biggest hidden driver',
      body: 'Skipping meals spikes cortisol and blood sugar simultaneously. Eating the wrong foods first amplifies the damage. Small timing shifts create outsized results.',
      hook: 'The cookbook and daily plan inside the kit restructure your meals without changing your grocery list.',
    },
    {
      title: 'Evening habits are compounding the damage while you sleep',
      body: 'Screens, late meals, and disrupted sleep create a cascade that raises all three markers overnight. Fix the evening and the mornings start changing within days.',
      hook: 'The 10-day protocol rebuilds your evening routine one step at a time — most people feel it by day three.',
    },
  ],
};

// Compute a 1–10 risk score from the answers.
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

        {/* Pulse line — decorative ECG SVG */}
        <div style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          <PulseLine />
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  const words = ['Quieter', 'numbers.', 'Steadier', 'mornings.', 'Written', 'by', 'a', 'nurse.'];
  return (
    <div className="hero-copy">
      <motion.div
        className="hero-meta"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="dot" />
        <span>Edition 01 · Spring 2026</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>BraveWorks RN</span>
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
            {i === 0 ? <em style={{ fontStyle: 'italic', color: 'var(--clay)', fontVariationSettings: '"SOFT" 100, "opsz" 144' }}>{w}</em> : w}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Your doctor added another pill. Your numbers barely moved.
        What if the answer isn't more medication — it's what 20 years of ICU nursing
        actually taught Joel about blood pressure, cortisol, and blood sugar?
        Take the 90-second assessment.
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
          <span className="role">20 years ICU &amp; Emergency · 116K on TikTok</span>
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

  const concern = answers.concern === 'all' ? 'blood_pressure' : (answers.concern ?? 'blood_pressure');
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
          category: concern,
          riskScore,
          answers,
        }),
      }).catch(() => null);
    } finally {
      setLoading(false);
      setPhase('results');
    }
  }
  // Always recommend the tier-1 starter ($17) regardless of score
  const recommended = useMemo(
    () => recommendForScore(products, concern, 1),
    [products, concern]
  );
  const urgency = urgencyWindow(riskScore);
  const concernCopy = CONCERN_COPY[answers.concern] ?? CONCERN_COPY.blood_pressure;

  return (
    <motion.div
      className="quiz-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="quiz-topbar">
        <span className="label">The Assessment · 90 sec</span>
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
        <AnimatePresence mode="wait">
          {phase === 'quiz' && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          )}

          {phase === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="kicker kicker-dot" style={{ marginBottom: '0.75rem' }}>One last step</span>
              <h2 className="quiz-question">
                Where should Joel send your protocol?
              </h2>
              <p className="quiz-subtitle">
                Your personalized protocol, hand-matched to your answers — plus the Cook For Life plant-based cookbook, free.
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
                  {loading ? 'Sending…' : 'Show my protocol'}
                  <ArrowRight size={16} className="arrow" />
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Educational content only · No spam · Unsubscribe anytime
                </p>
              </form>
            </motion.div>
          )}

          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
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
                  <div className="eyebrow-num" style={{ color: 'var(--muted)' }}>{concernCopy.score_label} Score</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', lineHeight: 1.25, marginTop: '0.15rem', color: 'var(--ink)' }}>
                    {answers.medication === 'want_off'
                      ? 'Joel matched you with a protocol designed for people reducing medication.'
                      : answers.medication === 'on_meds'
                      ? 'Joel matched you with a protocol that complements your current prescriptions.'
                      : 'Joel matched you with a prevention-first starter protocol.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: urgency.tone === 'urgent' ? 'var(--clay)' : 'var(--muted)', marginTop: '0.4rem', fontWeight: 500 }}>
                    <AlertCircle size={12} />
                    At this score, every week you wait makes the next change harder. Recommend acting <strong>{urgency.label}</strong>.
                  </div>
                </div>
              </div>

              <h2 className="display-s" style={{ marginBottom: '0.5rem' }}>
                {name ? `${name}, here's` : 'Here\'s'} what's driving your <em className="ital-display" style={{ color: 'var(--clay)' }}>
                  {concernCopy.ital}
                </em> — and how to fix it.
              </h2>

              {/* Epiphany Bridge — break the false belief before tips */}
              <p style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0.5rem 0 0.25rem', fontStyle: 'italic' }}>
                In twenty years of ICU and emergency nursing, Joel noticed something his training never explained —
                the patients who improved fastest weren't the ones on the most medications.
                They were the ones who understood what was actually driving their numbers.
              </p>

              {/* 3 Tips — each creates desire for the full protocol */}
              <div style={{ margin: '1.25rem 0', display: 'grid', gap: '0.75rem' }}>
                {(RESULT_TIPS[answers.concern] || RESULT_TIPS.blood_pressure).map((tip, i) => (
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

              {/* Identity nudge — Hardy */}
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0 0 1rem', fontWeight: 500 }}>
                The version of you with normal readings would start today. People who score {riskScore}/10 and act in the first 48 hours see the fastest results.
              </p>

              {/* Buy button FIRST — above the stack */}
              {recommended && (
                <a
                  href={recommended.stripe_payment_link}
                  className="btn btn-lg"
                  target="_top"
                  rel="noopener"
                  style={{
                    background: 'var(--clay)',
                    color: 'var(--cream)',
                    width: '100%',
                    marginBottom: '1.25rem',
                    fontSize: '1.05rem',
                    padding: '1rem',
                  }}
                >
                  Start lowering your numbers today — {recommended.price}
                  <ArrowRight size={16} className="arrow" />
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
                  What 1,200+ readers already have
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', lineHeight: 1.2, marginBottom: '0.75rem', fontWeight: 500 }}>
                  Imagine waking up and your numbers are just… <em style={{ color: 'var(--clay)' }}>normal.</em>
                </h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: '0 0 1.25rem' }}>
                  No dread before the cuff goes on. No arguing with your doctor about another pill.
                  Just a morning where you feel rested, your head is clear, and the numbers say what you already feel — you're getting better.
                </p>

                <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: '📋', label: 'The full 10-day nurse-designed protocol', sub: 'Daily steps, herb dosing, and the "why" behind each one — so you actually stick with it.' },
                    { icon: '🌿', label: 'Joel\'s complete herb formulary', sub: 'The exact herbs, doses, and timing Joel gives family. No guesswork.' },
                    { icon: '📊', label: 'Printable tracker + readings log', sub: 'Watch your numbers move. Most people see it within the first week.' },
                    { icon: '🍽️', label: 'Cook For Life — plant-based cookbook', sub: '45 recipes built around the foods that lower your numbers, not fight them.' },
                    { icon: '👥', label: 'Free Skool community access', sub: 'Join "How to Be Your Own Doctor" — ask Joel anything, connect with people on the same path.' },
                    { icon: '🗓️', label: 'Free 30-Day Challenge enrollment', sub: 'Daily protocol emails for 30 days. You\'re automatically signed up — nothing extra to do.' },
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

                {/* Price anchor — Kennedy */}
                <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 0.75rem' }}>
                  A single naturopath visit runs $150–300. A month of prescriptions with co-pays runs more. This is $17 — launch pricing while Joel builds 1,000 case studies.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
                    $17
                  </span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.95rem' }}>$197 value</span>
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
                    Joel's guarantee: Complete the 30-day challenge. If you haven't eliminated at least one prescription with your doctor's blessing, Joel refunds every penny. No hoops. No fine print.
                  </p>
                </div>

                {/* Buy button SECOND — below the stack */}
                {recommended && (
                  <a
                    href={recommended.stripe_payment_link}
                    className="btn btn-lg"
                    target="_top"
                    rel="noopener"
                    style={{
                      background: 'var(--ink)',
                      color: 'var(--cream)',
                      width: '100%',
                    }}
                  >
                    Start my protocol today
                    <ArrowRight size={16} className="arrow" />
                  </a>
                )}
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.6rem', textAlign: 'center' }}>
                  Instant delivery · 30-day challenge included · Community access included
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
   Pulse line — decorative ECG SVG (animates on load)
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
  const line = (
    <>
      Blood pressure <span className="dot">·</span>
      <em>cortisol</em> <span className="dot">·</span>
      Insulin resistance <span className="dot">·</span>
      Sleep <span className="dot">·</span>
      <em>HRV</em> <span className="dot">·</span>
      Vagal tone <span className="dot">·</span>
      Polypharmacy <span className="dot">·</span>
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
              Twenty years of ICU and emergency nursing taught Joel one thing: the patients who got better fastest
              understood what was driving their numbers — not just which pills to take.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>
              These protocols exist so you can have that same understanding. Plain English, real herbs,
              real dosing — the same advice Joel gives family. No cures, no hype. Just a nurse who's been in the room,
              handing you the playbook.
            </p>
            <a href="#top" className="btn btn-ink" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Take the assessment
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
                "Most of my patients didn't need another prescription.
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
  const steps = [
    {
      n: '01',
      t: 'Take the assessment',
      d: 'Five short questions. Ninety seconds. No account required.',
    },
    {
      n: '02',
      t: 'Get matched with a protocol',
      d: 'Joel has 11 protocols. You receive the two or three closest to your situation — with the reasoning behind each pick.',
    },
    {
      n: '03',
      t: 'Follow the daily plan',
      d: 'Every protocol is daily PDFs, herb dosing charts, a tracker, and a nurse-written explanation of why each step works.',
    },
  ];

  return (
    <section className="section surface-paper">
      <div className="shell">
        <div className="section-label">
          <span className="num">03 · Method</span>
          <span className="line" />
        </div>
        <h2 className="display-m" style={{ maxWidth: '18ch', margin: '0 0 clamp(2.5rem, 5vw, 4rem)' }}>
          A kinder way to get <em className="ital-display" style={{ color: 'var(--clay)' }}>unstuck.</em>
        </h2>

        <ul className="ruled-list">
          {steps.map(s => (
            <li key={s.n}>
              <span className="num">{s.n}</span>
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, margin: '0 0 0.35rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {s.t}
                </h3>
                <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '56ch' }}>{s.d}</p>
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
        <h2 className="display-m" style={{ maxWidth: '18ch', margin: '0 0 clamp(2.5rem, 5vw, 4rem)', color: 'var(--cream)' }}>
          What readers have <em className="ital-display" style={{ color: 'var(--clay-soft)' }}>written back.</em>
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
        <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>90 seconds · No account required</span>
        <h2 className="display-l" style={{ margin: '1.25rem auto 1.5rem', maxWidth: '20ch' }}>
          Your numbers won't change until <em className="ital-display" style={{ color: 'var(--clay)' }}>you do.</em>
        </h2>
        <p className="lede" style={{ margin: '0 auto 1.5rem', maxWidth: '42ch' }}>
          Take the assessment. Get a nurse-matched protocol. See your first numbers move within a week.
        </p>

        <a href="#top" className="btn btn-ink btn-lg" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'inline-flex' }}>
          Take the assessment
          <ArrowUpRight size={16} className="arrow" />
        </a>
        )}
      </div>
    </section>
  );
}

