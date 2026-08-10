// /accelerator-assessment — the deep intake for the Life Change Accelerator
// founding cohort.
//
// Merges Joel's BP/numbers layer with Annie's full "Everyday Nurse Wellness
// Assessment" (general health, hormonal symptoms, cycle, lifestyle, stress,
// environment, postnatal, birth control) and the program logistics promised on
// the 2026-08-10 orientation call: shipping address for the 90-day tea, the
// plus-one, and the Monday/Tuesday/Wednesday meeting vote.
//
// Design notes:
//   - Mostly click-answer. These are women in their 50s-70s on phones; typing
//     long answers into a browser is where intakes die. Free text only where
//     the answer genuinely cannot be a button.
//   - One section per screen with a progress bar, so it never looks like a
//     97-question wall.
//   - Answers autosave to localStorage on every change. If she closes the tab
//     halfway through, she resumes where she left off rather than starting over.
//   - Field ids MUST match api/_accelerator-schema.js or they vanish from the
//     PDF Joel reads.

import { useState, useEffect, useMemo, useCallback } from 'react';
// Questions live in api/_accelerator-questions.js so the live form, the filled
// PDF, and the printable blank form all read the same list and cannot drift.
import { SECTIONS } from '../../api/_accelerator-questions.js';

const PAPER = '#FBF8F1';
const CARD = '#FFFDF7';
const INK = '#2C2A26';
const MUTED = '#9C9485';
const SAGE = '#3F5A3C';
const CLAY = '#B85A36';
const BORDER = '#E6DECE';

const STORAGE_KEY = 'bw:accel:intake:v1';

export default function AcceleratorAssessmentPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState('');

  // Resume where they left off.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          setAnswers(saved.answers || {});
          if (Number.isInteger(saved.step)) setStep(Math.min(saved.step, SECTIONS.length - 1));
        }
      }
    } catch { /* corrupt draft, start clean */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step })); } catch { /* quota */ }
  }, [answers, step]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const set = useCallback((id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }));
  }, []);

  const toggle = useCallback((id, choice) => {
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? a[id] : [];
      return { ...a, [id]: cur.includes(choice) ? cur.filter((c) => c !== choice) : [...cur, choice] };
    });
  }, []);

  const section = SECTIONS[step];
  const isLast = step === SECTIONS.length - 1;
  const pct = Math.round(((step + 1) / SECTIONS.length) * 100);

  const missing = useMemo(
    () => section.fields.filter((f) => f.required && !String(answers[f.id] ?? '').trim()),
    [section, answers]
  );

  async function submit() {
    const name = String(answers.full_name || '').trim();
    const email = String(answers.email || '').trim();
    if (!name || !email) {
      setError('We need your name and email. They are on the first screen.');
      setStep(0);
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const r = await fetch('/api/accelerator-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Something went wrong');
      setDoneId(j.assessmentId || '');
      setStatus('done');
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>&#10003;</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, margin: '0 0 12px', color: INK }}>
            Got it. Thank you.
          </h1>
          <p style={{ color: '#4a463f', fontSize: 17, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 18px' }}>
            Joel and Annie have your assessment. Your personalized welcome packet is
            built from exactly what you just told us, and your tea is going to the
            address you gave.
          </p>
          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 26px' }}>
            Next: watch for your 1:1 scheduling link. Until then, do not start
            anything new. Rest is allowed.
          </p>
          {doneId && (
            <a
              href={`/api/accelerator-assessment-pdf?id=${encodeURIComponent(doneId)}`}
              style={{
                display: 'inline-block', background: CLAY, color: '#fff', textDecoration: 'none',
                fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 9,
              }}
            >
              Download your copy
            </a>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
          color: CLAY, fontWeight: 700, marginBottom: 6,
        }}>
          Life Change Accelerator
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(24px,5vw,32px)', margin: '0 0 6px', color: INK }}>
          Your assessment
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
          Step {step + 1} of {SECTIONS.length} &middot; your answers save as you go
        </p>
        <div style={{ height: 6, background: BORDER, borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: SAGE, transition: 'width .3s' }} />
        </div>
      </div>

      {/* Paper escape hatch. A good share of this cohort would rather sit at the
          kitchen table with a pen than tap 123 fields on a phone, and forcing
          the screen is how you lose them entirely. Shown only on the first
          screen so it does not tempt anyone into abandoning a form they are
          already halfway through. */}
      {step === 0 && (
        <a
          href="/api/accelerator-assessment-blank"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            background: '#F7F3EC', border: `2px solid ${SAGE}`, borderRadius: 12,
            padding: '16px 20px', marginBottom: 22,
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">&#128424;</span>
          <span>
            <span style={{
              display: 'block', color: SAGE, fontSize: 17, fontWeight: 700, lineHeight: 1.3,
            }}>
              Rather fill this out by hand?
            </span>
            <span style={{ display: 'block', color: '#4a463f', fontSize: 14, lineHeight: 1.5, marginTop: 3 }}>
              Download and print the whole thing, then bring it to your 1:1 or
              email us a photo. Same questions, your kitchen table.
            </span>
          </span>
        </a>
      )}

      <div style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: 'clamp(18px,4vw,28px)',
      }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '0 0 6px', color: SAGE }}>
          {section.title}
        </h2>
        {section.blurb && (
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>{section.blurb}</p>
        )}

        {section.fields.map((f) => (
          <Field key={f.id || f.text} f={f} answers={answers} set={set} toggle={toggle} />
        ))}

        {error && (
          <p style={{
            color: '#8B2F2F', background: '#FBEDE9', border: '1px solid #E7C9C0',
            padding: '10px 14px', borderRadius: 8, fontSize: 14, marginTop: 18,
          }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`,
                borderRadius: 9, padding: '13px 22px', fontSize: 15, cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={status === 'sending'}
            onClick={() => {
              if (missing.length) {
                setError('Please fill in the highlighted field before moving on.');
                return;
              }
              setError('');
              if (isLast) submit(); else setStep((s) => s + 1);
            }}
            style={{
              flex: 1, minWidth: 180, background: status === 'sending' ? MUTED : CLAY,
              color: '#fff', border: 'none', borderRadius: 9, padding: '14px 26px',
              fontSize: 16, fontWeight: 700, cursor: status === 'sending' ? 'wait' : 'pointer',
            }}
          >
            {status === 'sending' ? 'Sending...' : isLast ? 'Send it to Joel and Annie' : 'Continue'}
          </button>
        </div>
      </div>

      <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, marginTop: 20, textAlign: 'center' }}>
        Confidential. Shared only with Joel and Annie. Education alongside your
        doctor, never instead of your doctor.
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
      <section style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(1.25rem,4vw,2.25rem) 1.25rem 3rem' }}>
        {children}
      </section>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label style={{
      display: 'block', fontSize: 15, fontWeight: 600, color: INK,
      marginBottom: 8, lineHeight: 1.5,
    }}>
      {children}{required && <span style={{ color: CLAY }}> *</span>}
    </label>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '13px 14px', fontSize: 16,
  border: `1px solid ${BORDER}`, borderRadius: 9, background: '#fff', color: INK,
  fontFamily: 'inherit',
};

function Field({ f, answers, set, toggle }) {
  if (f.kind === 'note') {
    return (
      <p style={{
        background: '#F7F3EC', borderLeft: `3px solid ${SAGE}`, padding: '12px 16px',
        borderRadius: '0 8px 8px 0', color: '#4a463f', fontSize: 14, lineHeight: 1.6,
        margin: '22px 0 18px',
      }}>{f.text}</p>
    );
  }

  const v = answers[f.id];

  return (
    <div style={{ marginBottom: 22 }}>
      <Label required={f.required}>{f.label}</Label>

      {f.kind === 'text' && (
        <input
          type={f.type || 'text'}
          value={v || ''}
          placeholder={f.placeholder || ''}
          onChange={(e) => set(f.id, e.target.value)}
          style={inputStyle}
        />
      )}

      {f.kind === 'textarea' && (
        <textarea
          rows={f.rows || 3}
          value={v || ''}
          placeholder={f.placeholder || ''}
          onChange={(e) => set(f.id, e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      )}

      {f.kind === 'radio' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {f.choices.map((c) => {
            const on = v === c;
            return (
              <button
                type="button"
                key={c}
                onClick={() => set(f.id, on ? '' : c)}
                style={{
                  textAlign: 'left', padding: '13px 16px', fontSize: 15, lineHeight: 1.5,
                  borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${on ? SAGE : BORDER}`,
                  background: on ? '#EFF3EC' : '#fff',
                  color: on ? SAGE : INK, fontWeight: on ? 600 : 400,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {f.kind === 'checks' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {f.choices.map((c) => {
            const on = Array.isArray(v) && v.includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggle(f.id, c)}
                style={{
                  textAlign: 'left', padding: '13px 16px', fontSize: 15, lineHeight: 1.5,
                  borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${on ? SAGE : BORDER}`,
                  background: on ? '#EFF3EC' : '#fff',
                  color: on ? SAGE : INK, fontWeight: on ? 600 : 400,
                }}
              >
                <span style={{ marginRight: 10, color: on ? SAGE : BORDER }}>{on ? '✓' : '▢'}</span>
                {c}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
