import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Check, ExternalLink, Star, Quote, Phone, AlertCircle, Users,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import {
  fetchProducts,
  getFeaturedProducts,
  recommendForScore,
  urgencyWindow,
} from '../utils/productLoader';

const TOTAL_STEPS = 4;

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
];

const CONCERN_COPY = {
  blood_pressure: { label: 'Blood pressure', ital: 'blood pressure', score_label: 'BP Risk' },
  cortisol: { label: 'Stress response', ital: 'cortisol', score_label: 'Cortisol Risk' },
  blood_sugar: { label: 'Blood sugar', ital: 'glucose', score_label: 'Glucose Risk' },
  all: { label: 'Whole system', ital: 'systems', score_label: 'Whole-System Risk' },
};

// Compute a 1–10 risk score from the answers.
function computeRiskScore(answers) {
  let raw = 0;
  for (const q of QUESTIONS) {
    const ansVal = answers[q.id];
    const opt = q.options.find(o => o.value === ansVal);
    if (opt) raw += opt.score;
  }
  // Max raw across questions: 3+3+3+2 = 11 -> normalize to 1..10
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

  const featured = useMemo(() => getFeaturedProducts(products).slice(0, 4), [products]);

  return (
    <>
      <Hero products={products} />
      <RotatingConcerns />
      <FeaturedProtocols products={featured} />
      <NursesNote />
      <HowItWorks />
      <Testimonials />
      <LearnStrip />
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
        Nurse-designed protocols for blood pressure, cortisol, and blood sugar —
        without the overmedication, the contradictions, or the guesswork.
        Start with a 90-second assessment.
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

  // Risk score + tier recommendation (computed here so submitEmail can send them)
  const concern = answers.concern === 'all' ? 'blood_pressure' : (answers.concern ?? 'blood_pressure');
  const riskScore = useMemo(() => computeRiskScore(answers), [answers]);
  const tier = tierForScore(riskScore);

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
        }),
      }).catch(() => null);
    } finally {
      setLoading(false);
      setPhase('results');
    }
  }
  const recommended = useMemo(
    () => recommendForScore(products, concern, riskScore),
    [products, concern, riskScore]
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
                Two or three nurse-designed options, hand-matched to your answers. You'll also receive the Cook For Life cookbook — free.
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
                    {riskScore <= 3 && 'Mild — early-stage. The starter is enough.'}
                    {riskScore > 3 && riskScore <= 6 && 'Moderate — the complete kit is the right call.'}
                    {riskScore > 6 && 'Elevated — premium tier with coaching is recommended.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: urgency.tone === 'urgent' ? 'var(--clay)' : 'var(--muted)', marginTop: '0.4rem', fontWeight: 500 }}>
                    <AlertCircle size={12} />
                    Recommend acting <strong>{urgency.label}</strong>.
                  </div>
                </div>
              </div>

              <h2 className="display-s" style={{ marginBottom: '0.5rem' }}>
                {name ? `${name}, your` : 'Your'} <em className="ital-display" style={{ color: 'var(--clay)' }}>
                  {concernCopy.ital}
                </em> protocol is ready.
              </h2>
              <p className="quiz-subtitle" style={{ marginBottom: '1.25rem' }}>
                Joel matched you to <strong>Level {tier}</strong> based on your answers.
              </p>

              {recommended ? (
                <div style={{
                  position: 'relative',
                  padding: '1.5rem',
                  background: tier === 3 ? 'var(--sage-deep)' : tier === 2 ? 'var(--paper-warm)' : 'var(--cream)',
                  color: tier === 3 ? 'var(--cream)' : 'var(--ink)',
                  border: `${tier === 2 ? 2 : 1}px solid ${tier === 3 ? 'var(--sage-deep)' : 'var(--ink)'}`,
                  borderRadius: 18,
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 500, marginBottom: '0.5rem' }}>
                    Recommended · Level 0{tier} · {recommended.tier_label}
                  </div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', lineHeight: 1.15, marginBottom: '0.5rem', fontWeight: 500 }}>
                    {recommended.name}
                  </div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.5, opacity: 0.85, margin: '0 0 1rem' }}>
                    {recommended.headline}
                  </p>
                  {tier === 3 && (
                    <div style={{
                      background: 'rgba(251,248,241,0.12)',
                      border: '1px solid rgba(251,248,241,0.28)',
                      borderRadius: 12,
                      padding: '0.9rem 1rem',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', marginBottom: '0.5rem' }}>
                        <Star size={13} fill="currentColor" stroke="none" style={{ color: 'var(--clay-soft)', flexShrink: 0, marginTop: '0.1rem' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.35, color: 'var(--cream)' }}>
                            BONUS: FREE Virtual Ticket to Barbara O'Neill LIVE
                          </div>
                          <div style={{ fontSize: '0.74rem', opacity: 0.8, marginTop: '0.15rem', color: 'var(--cream)' }}>
                            $297 value INCLUDED · June 24–25, 2026
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '0.45rem', borderTop: '1px solid rgba(251,248,241,0.15)' }}>
                        <a
                          href="https://everydaynurse.com/event-virtual"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--clay-soft)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                          Event details <ExternalLink size={10} />
                        </a>
                        <a
                          href="https://www.skool.com/how-to-be-your-own-doctor-8010/about"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'rgba(251,248,241,0.65)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                          <Users size={10} /> Join community on Skool
                        </a>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {recommended.price}
                    </span>
                    {recommended.original_price && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.95rem' }}>
                        {recommended.original_price}
                      </span>
                    )}
                  </div>
                  <a
                    href={recommended.stripe_payment_link}
                    className="btn btn-lg"
                    target="_top"
                    rel="noopener"
                    style={{
                      background: tier === 3 ? 'var(--clay)' : 'var(--ink)',
                      color: 'var(--cream)',
                      width: '100%',
                    }}
                  >
                    {tier === 3 ? 'Join the 30-Day Challenge — Starts May 1' : tier === 2 ? 'Get the complete kit' : 'Start with the guide'}
                    <ArrowRight size={16} className="arrow" />
                  </a>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '1rem' }}>
                <Link to={`/shop?category=${concern}`} className="btn-link">
                  Compare all 3 levels →
                </Link>
                <Link to="/shop" className="btn-link" style={{ color: 'var(--muted)' }}>
                  Other categories →
                </Link>
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
   Featured protocols
   ------------------------------------------------------------------ */

function FeaturedProtocols({ products }) {
  return (
    <section className="section surface-paper">
      <div className="shell">
        <header style={{ marginBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
          <div className="section-label">
            <span className="num">01 · Apothecary</span>
            <span className="line" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2rem', alignItems: 'end' }}>
            <h2 className="display-m" style={{ maxWidth: '18ch', margin: 0 }}>
              Protocols that don't feel like <em className="ital-display" style={{ color: 'var(--clay)' }}>homework.</em>
            </h2>
            <Link to="/shop" className="btn btn-ghost" style={{ alignSelf: 'end' }}>
              View all
              <ArrowUpRight size={16} className="arrow" />
            </Link>
          </div>
        </header>

        <div className="product-grid">
          {products.map(p => <ProductCard key={p.slug} product={p} />)}
        </div>
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
              I spent twenty years watching what actually helped patients in ICU and emergency medicine —
              and twenty years watching what we prescribed make things worse.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '1.25rem' }}>
              Everything I publish here is built backward from that bedside view. The protocols
              are what I tell friends and family. The herbs I recommend are the ones I've seen
              move numbers. The advice is plain English — because if you don't understand it,
              you won't do it.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>
              No cures. No hype. Educational content only. But written by someone who's been in
              the room.
            </p>
            <Link to="/learn" className="btn btn-ink">
              Read the journal
              <ArrowUpRight size={16} className="arrow" />
            </Link>
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
      d: 'Four short questions. Ninety seconds. No account required.',
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
    quote: "My bottom number dropped nine points by day five. My cardiologist asked what I changed. I told her. She made notes.",
    author: 'Linda M.',
    meta: 'BP Reset Kit · Age 62',
  },
  {
    quote: "Joel is the only nurse on TikTok who sounds like a nurse at a bedside. I bought because of that tone.",
    author: 'Paul D.',
    meta: 'Cortisol Reset · Age 48',
  },
  {
    quote: "I finally understand why my blood sugar swings affect my blood pressure. The cookbook alone is worth the price.",
    author: 'Rachel T.',
    meta: 'Complete Bundle · Age 55',
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
   Learn strip — prominent link to Journal
   ------------------------------------------------------------------ */

function LearnStrip() {
  return (
    <section className="section-tight surface-paper">
      <div className="shell">
        <div className="section-label">
          <span className="num">05 · The Journal</span>
          <span className="line" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2rem', alignItems: 'end' }}>
          <h2 className="display-m" style={{ margin: 0, maxWidth: '20ch' }}>
            Plain-English essays. No clickbait. No cures.
          </h2>
          <Link to="/learn" className="btn btn-ink">
            Read the journal <ArrowUpRight size={16} className="arrow" />
          </Link>
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
        <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Start here</span>
        <h2 className="display-l" style={{ margin: '1.25rem auto 1.5rem', maxWidth: '16ch' }}>
          Four questions. Your <em className="ital-display" style={{ color: 'var(--clay)' }}>first move.</em>
        </h2>
        <p className="lede" style={{ margin: '0 auto 2rem' }}>
          It really does take ninety seconds. And you can always come back to the apothecary.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="#top" className="btn btn-ink btn-lg" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Take the assessment <ArrowRight size={16} className="arrow" />
          </a>
          <Link to="/shop" className="btn btn-ghost btn-lg">
            Browse the apothecary
          </Link>
        </div>
      </div>
    </section>
  );
}
