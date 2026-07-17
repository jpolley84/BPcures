// SprintAssessmentPage (route: /sprint-assessment) — the deep assessment
// every $297/$97 Sprint buyer fills out after purchase. Submission POSTs to
// api/sprint-assessment.js, which emails Joel every answer ([ACTION]) and
// confirms receipt to the buyer. Linked from the case-review confirmation
// email and /case-review-confirmed. Standalone page, no nav, ZERO em dashes.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { track } from '../utils/analytics.js';

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const QUESTIONS = [
  { key: 'readings', label: 'Your recent blood pressure readings', hint: 'The last few numbers you remember, and when you took them. Rough is fine.', rows: 3 },
  { key: 'meds', label: 'Medications and supplements you take now', hint: 'Names are enough. I never change your medications. Your doctor owns that.', rows: 3 },
  { key: 'tried', label: 'What have you already tried for your pressure?', hint: 'Diets, walking, apps, anything. Tell me what stuck and what did not.', rows: 4 },
  { key: 'health', label: 'The rest of your health picture', hint: 'Sleep, stress, energy, any diagnoses you live with.', rows: 4 },
  { key: 'struggle', label: 'What is the hardest part right now?', hint: 'Be honest. This is the question that shapes your plan the most.', rows: 3 },
  { key: 'goal', label: 'What does winning look like in 30 days?', hint: 'A number, a feeling, a doctor visit that goes differently. Your words.', rows: 3 },
  { key: 'notes', label: 'Anything else I should know?', hint: 'Optional.', rows: 3 },
];

function readEmailParam() {
  try {
    return new URLSearchParams(window.location.search).get('email') || '';
  } catch {
    return '';
  }
}

export default function SprintAssessmentPage() {
  const prefillEmail = useMemo(readEmailParam, []);
  const [fields, setFields] = useState({ name: '', email: prefillEmail, age: '' });
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const setA = (key) => (e) => setAnswers((a) => ({ ...a, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      setError('Please enter the email you used at checkout.');
      return;
    }
    setBusy(true);
    setError('');
    track('sprint_assessment_submitted');
    try {
      const res = await fetch('/api/sprint-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, ...answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
        window.scrollTo({ top: 0 });
      } else {
        setError(data.error || 'That did not go through. Please try again.');
      }
    } catch {
      setError('That did not go through. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 0.95rem',
    borderRadius: 10,
    border: '1.5px solid var(--line, #D8CFBD)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    background: '#fff',
    color: 'var(--ink, #121110)',
  };
  const labelStyle = { display: 'block', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--ink, #121110)' };
  const hintStyle = { fontSize: '0.82rem', color: 'var(--muted, #7A7061)', margin: '0 0 0.5rem' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #FBF8F1)', fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--ink, #121110)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--line, #E5DFD2)', background: '#fff' }}>
        <span style={{ fontWeight: 800 }}>
          BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.12em', color: 'var(--clay, #B85A36)' }}>RN</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--dark-gray, #555)' }}>
          <Lock size={13} aria-hidden /> Your Sprint assessment · Read by Joel only
        </span>
      </header>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 2.25rem) 1.25rem 3rem' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <CheckCircle2 size={44} aria-hidden style={{ color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.8rem' }} />
            <h1 style={{ ...serif, fontSize: '1.8rem', margin: '0 0 0.6rem' }}>Your case is on Joel&rsquo;s desk.</h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '46ch', margin: '0 auto' }}>
              Check your email for confirmation. Your 30-day plan lands within 2 business
              days, with the link to pick your 1:1 call time.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', lineHeight: 1.2, margin: '0 0 0.6rem' }}>
              Tell me about your case.
            </h1>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1.5rem' }}>
              This takes about 10 minutes, and it is the most important 10 minutes of your
              Sprint. The more honest you are here, the better your 30-day plan gets. I read
              every word myself.
            </p>

            <form onSubmit={submit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Your name</label>
                <input style={inputStyle} value={fields.name} onChange={set('name')} autoComplete="name" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>The email you used at checkout</label>
                <input style={inputStyle} type="email" value={fields.email} onChange={set('email')} autoComplete="email" required />
              </div>
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={labelStyle}>Your age range</label>
                <input style={inputStyle} value={fields.age} onChange={set('age')} placeholder="For example: 55 to 64" />
              </div>

              {QUESTIONS.map((q) => (
                <div key={q.key} style={{ marginBottom: '1.4rem' }}>
                  <label style={labelStyle}>{q.label}</label>
                  <p style={hintStyle}>{q.hint}</p>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={q.rows} value={answers[q.key] || ''} onChange={setA(q.key)} />
                </div>
              ))}

              {error && (
                <p role="alert" style={{ color: 'var(--clay, #B85A36)', fontSize: '0.9rem', margin: '0 0 0.9rem' }}>{error}</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '1rem 1.4rem',
                  background: busy ? 'var(--sage-deep, #2E3A30)' : 'var(--clay, #B85A36)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: '1.05rem', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {busy ? 'Sending your case to Joel...' : <>Send My Case To Joel <ArrowRight size={18} /></>}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted, #7A7061)', margin: '0.7rem 0 0' }}>
                Education and lifestyle support alongside your doctor, never instead of them.
                See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
