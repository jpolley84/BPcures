import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { QUESTIONS } from '../utils/launcherQuiz';

const TOTAL_STEPS = QUESTIONS.length;

const cream = 'var(--cream)';
const ink = 'var(--ink)';
const muted = 'var(--muted)';
const line = 'var(--line)';
const sageDeep = 'var(--sage-deep)';
const sageSoft = 'var(--sage-soft)';
const clay = 'var(--clay)';

export default function LauncherQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [whyNow, setWhyNow] = useState('');
  const [applyFm0, setApplyFm0] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-check FM#0 if landed from /launcher with ?fm0=1
  useEffect(() => {
    if (searchParams.get('fm0') === '1') {
      setApplyFm0(true);
    }
  }, [searchParams]);

  const q = QUESTIONS[step];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const canAdvance = useMemo(() => {
    if (!q) return false;
    if (q.type === 'choice') return Boolean(answers[q.id]);
    if (q.type === 'multi') {
      const v = answers[q.id];
      const arr = Array.isArray(v) ? v : [];
      return arr.length > 0;
    }
    if (q.type === 'text') {
      return q.optional ? true : Boolean((whyNow || '').trim().length > 0);
    }
    if (q.type === 'identity') {
      return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }
    if (q.type === 'handle') return handle.trim().length > 2;
    return false;
  }, [q, answers, whyNow, name, email, handle]);

  function chooseChoice(value) {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    // Auto-advance for single-choice
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    }, 240);
  }

  function toggleMulti(value) {
    if (!q) return;
    const max = q.maxSelect || 2;
    setAnswers((prev) => {
      const cur = Array.isArray(prev[q.id]) ? prev[q.id] : [];
      let next;
      if (cur.includes(value)) {
        next = cur.filter((v) => v !== value);
      } else if (cur.length >= max) {
        // Replace the oldest selection — gentle UX
        next = [...cur.slice(1), value];
      } else {
        next = [...cur, value];
      }
      return { ...prev, [q.id]: next };
    });
  }

  function next() {
    if (!canAdvance) return;
    if (q.type === 'text') {
      setAnswers((prev) => ({ ...prev, [q.id]: whyNow.trim() }));
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
    setError('');
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      // Normalize multi-select arrays into comma-separated strings for transport
      const normAnswers = {};
      for (const k of Object.keys(answers)) {
        const v = answers[k];
        normAnswers[k] = Array.isArray(v) ? v.join(',') : v;
      }
      const finalAnswers = {
        ...normAnswers,
        why_now: (whyNow || '').trim(),
        apply_fm0: applyFm0 ? 'true' : 'false',
      };

      const res = await fetch('/api/launcher-quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          handle: handle.trim(),
          apply_fm0: applyFm0,
          answers: finalAnswers,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed');
      }

      const { slug } = await res.json();
      if (!slug) throw new Error('No diagnostic slug returned');
      navigate(`/launcher/results/${encodeURIComponent(slug)}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar step={step} progress={progress} />

      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1.25rem, 4vw, 2rem)' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: cream,
              border: `1px solid ${line}`,
              borderRadius: 24,
              padding: 'clamp(1.5rem, 3.5vw, 2.5rem)',
              boxShadow: '0 30px 60px -30px rgba(46, 58, 48, 0.18)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${step}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: muted,
                  }}
                >
                  Question {String(step + 1).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
                </span>

                <h2
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
                    fontWeight: 400,
                    lineHeight: 1.18,
                    letterSpacing: '-0.018em',
                    fontVariationSettings: '"SOFT" 60, "opsz" 72',
                    color: ink,
                    margin: '0.65rem 0 0.5rem',
                  }}
                >
                  {q.question}
                </h2>

                {q.subtitle && (
                  <p style={{ color: muted, fontSize: '0.9rem', lineHeight: 1.55, margin: '0 0 1.5rem' }}>
                    {q.subtitle}
                  </p>
                )}

                {q.type === 'choice' && (
                  <ChoiceList q={q} selected={answers[q.id]} onChoose={chooseChoice} />
                )}

                {q.type === 'multi' && (
                  <MultiList
                    q={q}
                    selected={Array.isArray(answers[q.id]) ? answers[q.id] : []}
                    onToggle={toggleMulti}
                  />
                )}

                {q.type === 'text' && (
                  <textarea
                    value={whyNow}
                    onChange={(e) => setWhyNow(e.target.value)}
                    placeholder={q.placeholder || ''}
                    rows={5}
                    style={textareaStyle}
                  />
                )}

                {q.type === 'identity' && (
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    <input
                      type="text"
                      placeholder="First name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '0.78rem', color: muted, margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                      I personally review every diagnostic. No spam. Unsubscribe anytime.
                    </p>
                  </div>
                )}

                {q.type === 'handle' && (
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    <input
                      type="text"
                      placeholder="@yourhandle, yoursite.com, or full URL"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '0.78rem', color: muted, margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                      I'll personally look at your work before recommending a tier — this is the input that shapes everything I tell you on the next page.
                    </p>

                    <Fm0Checkbox checked={applyFm0} onToggle={() => setApplyFm0((v) => !v)} />
                  </div>
                )}

                {error && (
                  <p style={{ color: clay, fontSize: '0.85rem', marginTop: '1rem' }}>{error}</p>
                )}
              </motion.div>
            </AnimatePresence>

            <Nav
              onBack={back}
              onNext={next}
              canBack={step > 0 && !submitting}
              canNext={canAdvance && !submitting}
              isLast={step === TOTAL_STEPS - 1}
              submitting={submitting}
              autoAdvance={q?.type === 'choice'}
            />
          </motion.div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: muted, lineHeight: 1.5 }}>
            10 questions across 5 dimensions. 4 minutes. No spam, no autoplay video, no scroll trap.
          </p>
        </div>
      </main>
    </div>
  );

  function ChoiceList({ q, selected, onChoose }) {
    return (
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {q.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChoose(opt.value)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.1rem',
                background: isSelected ? sageSoft : 'var(--paper)',
                border: `1px solid ${isSelected ? sageDeep : line}`,
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.3s, background 0.3s, transform 0.3s',
              }}
            >
              <div>
                <span style={{ fontWeight: 500, fontSize: '0.98rem', color: ink, display: 'block', marginBottom: '0.15rem' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: '0.82rem', color: muted, lineHeight: 1.45 }}>{opt.desc}</span>
              </div>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: isSelected ? sageDeep : cream,
                  border: `1px solid ${isSelected ? sageDeep : line}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cream }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  function MultiList({ q, selected, onToggle }) {
    const max = q.maxSelect || 2;
    return (
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            color: muted,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin: '0 0 0.25rem',
          }}
        >
          {selected.length} of {max} selected
        </p>
        {q.options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.1rem',
                background: isSelected ? sageSoft : 'var(--paper)',
                border: `1px solid ${isSelected ? sageDeep : line}`,
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.3s, background 0.3s, transform 0.3s',
              }}
            >
              <div>
                <span style={{ fontWeight: 500, fontSize: '0.98rem', color: ink, display: 'block', marginBottom: '0.15rem' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: '0.82rem', color: muted, lineHeight: 1.45 }}>{opt.desc}</span>
              </div>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: isSelected ? sageDeep : cream,
                  border: `1px solid ${isSelected ? sageDeep : line}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontSize: '0.82rem',
                  color: cream,
                  fontWeight: 600,
                }}
              >
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
}

/* ----------------------------------------------------------------
   Founding Member #0 checkbox — styled to match the multi-select
   options (sage-soft when active, sage-deep border, square check).
   ---------------------------------------------------------------- */
function Fm0Checkbox({ checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'flex-start',
        gap: '0.85rem',
        padding: '1rem 1.1rem',
        background: checked ? sageSoft : 'var(--paper)',
        border: `1px solid ${checked ? sageDeep : line}`,
        borderRadius: 14,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.3s, background 0.3s',
        width: '100%',
        marginTop: '0.5rem',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: checked ? sageDeep : cream,
          border: `1px solid ${checked ? sageDeep : line}`,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          fontSize: '0.82rem',
          color: cream,
          fontWeight: 600,
          marginTop: '0.15rem',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <div>
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 500,
            fontSize: '1rem',
            color: ink,
            display: 'block',
            marginBottom: '0.3rem',
            letterSpacing: '-0.01em',
            fontVariationSettings: '"SOFT" 60, "opsz" 72',
          }}
        >
          Apply to be Founding Member #0
        </span>
        <span style={{ fontSize: '0.82rem', color: muted, lineHeight: 1.55, display: 'block' }}>
          One free Tier 2 install ($9,997 value) in exchange for being the case study. Joel picks one applicant by May 7. Audience size doesn't matter — alignment and willingness to publish results does.
        </span>
      </div>
    </button>
  );
}

function TopBar({ step, progress }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247, 243, 236, 0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${line}`,
      }}
    >
      <div className="shell" style={{ padding: '0.95rem clamp(1.25rem, 4vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <a href="/launcher" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: ink, textDecoration: 'none' }}>
          <span
            style={{
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${ink}`,
              borderRadius: '50%',
              fontFamily: 'Fraunces, serif',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              fontVariationSettings: '"SOFT" 100',
            }}
          >
            JP
          </span>
          <span
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 500,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            Practice Diagnostic
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: muted,
              letterSpacing: '0.14em',
            }}
          >
            {String(Math.min(step + 1, TOTAL_STEPS)).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
          </span>
          <div style={{ width: 120, height: 3, background: line, borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: clay,
                transition: 'width 0.6s cubic-bezier(0.16, 1.2, 0.3, 1)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Nav({ onBack, onNext, canBack, canNext, isLast, submitting, autoAdvance }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: `1px solid ${line}`,
      }}
    >
      <button
        onClick={onBack}
        disabled={!canBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.55rem 0.85rem',
          color: canBack ? ink : muted,
          opacity: canBack ? 1 : 0.4,
          cursor: canBack ? 'pointer' : 'default',
          background: 'transparent',
          border: 'none',
          font: 'inherit',
          fontSize: '0.88rem',
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {!autoAdvance && (
        <button
          onClick={onNext}
          disabled={!canNext}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.85rem 1.5rem',
            background: canNext ? ink : muted,
            color: cream,
            borderRadius: 12,
            fontWeight: 600,
            fontSize: '0.92rem',
            border: 'none',
            cursor: canNext ? 'pointer' : 'default',
            opacity: canNext ? 1 : 0.55,
            transition: 'background 0.3s, opacity 0.3s',
          }}
        >
          {submitting ? 'Sending…' : isLast ? 'Show me my diagnostic' : 'Next'}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.95rem 1.1rem',
  border: `1px solid ${line}`,
  borderRadius: 12,
  background: 'var(--paper)',
  fontSize: '0.95rem',
  color: ink,
  fontFamily: 'inherit',
  outline: 'none',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 120,
  lineHeight: 1.55,
};
