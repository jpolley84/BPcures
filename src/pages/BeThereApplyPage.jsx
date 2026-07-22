// /apply — the Be There cohort prequalification application.
//
// 2026-07-20 REBUILD: modeled on the LifestyleU "getfit" application Joel sent.
// Her form pre-qualifies with six sharp moves, and we now use all of them:
//   1. a negative opt-in GATE ("yes I'm serious" / "no I'll pass") as a
//      commitment device that self-ejects tire kickers,
//   2. a "why work with him specifically" question that makes the applicant
//      sell themselves before any call,
//   3. a concrete goal selector,
//   4. a decision-unit / significant-other question (handles the "let me ask
//      my husband" stall before it happens on the call),
//   5. a social handle for vetting,
//   6. a MONEY question by cash-flow bucket with NO PRICE shown, so nobody
//      abandons the form over a dollar figure; price is handled live on the
//      call, where Joel closes.
//
// We kept exactly two things her lean form does not have, because they are a
// nurse's non-negotiables, not conversion fat:
//   - one free-text "what would winning look like" (Joel reads it first), and
//   - the doctor-alignment gate ("alongside your doctor, never instead"),
//     which is both a liability screen and a real disqualifier.
//
// The previous 8-step clinical intake (readings, meds count, sleep, sodium
// corner, etc.) is retired from the form. That depth belongs on the fit call,
// not in front of a cold lead deciding whether to finish an application.
//
// POSTs to /api/coaching-apply with source: 'bethere-apply'; the API scores
// fit (HOT / WARM / COLD) and the thank-you screen branches on it.
//
// HARD RULES honored: no pricing or dollar amounts in visible copy, zero
// em/en dashes, plain warm RN voice, education alongside her doctor,
// mobile-first at 375px.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { track } from '../utils/analytics';

const SERIF = "'Fraunces', 'Times New Roman', serif";

// 2026-07-22: the fit-call booking link was REMOVED from the thank-you screen.
// Applicants now wait for Joel's email instead of self-booking, so there is no
// FIT_CALL_URL here any more. The env vars (VITE_CALENDLY_FIT_CALL_URL /
// VITE_CALENDLY_DIAGNOSTIC_URL) are still used elsewhere in the site.

// ---- Option sets (visible copy: no dashes, no prices) ----

// STEP 1 — the gate. The "No" option is the whole point: making someone
// declare intent out loud lifts completion and show-rate, and shames the
// merely curious into self-selecting out. "No" scores COLD (see scoreBeThere
// in api/coaching-apply.js, kept in exact-string sync with GATE_NO here).
const GATE_YES = 'Yes. I am ready to do the work to get my numbers down.';
const GATE_NO = 'No. I will pass for now.';
const GATE_OPTIONS = [GATE_YES, GATE_NO];

// STEP 3 — "why him specifically" makes them argue Joel's value to themselves.
const WHY_JOEL_OPTIONS = [
  'He is a real ICU and ER nurse, not just a coach',
  'He treats the root cause, not just the number',
  'He works alongside my doctor, not against him',
  'I trust his approach after following his videos',
  'I am out of other options and need this to work',
  'All of the above',
];

const GOAL_OPTIONS = [
  'Get my blood pressure down naturally',
  'Lower or come off medications, with my doctor',
  'Understand what is actually driving my numbers',
  'Feel in control of my health again',
  'I am not sure yet, I just know something has to change',
];

// STEP 4 — significant other. Identifies the decision unit so the "let me ask
// my spouse" stall can be handled on the call, not after it.
const PARTNER_OPTIONS = [
  'Yes, and they support me doing this',
  'Yes, but they are not fully on board yet',
  'Yes, and we decide things like this together',
  'No, it is just me',
];

// Doctor-alignment gate. Kept from the old form: it is a liability screen for
// an RN and a genuine disqualifier. The middle option scores COLD.
const OFF_MEDS = 'I was hoping to come off my medications without my doctor';
const ALIGN_OPTIONS = ['Yes, that is exactly what I want', OFF_MEDS, 'I am not sure'];

// STEP 5 — discovery + the money question.
const FOUND_OPTIONS = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'A friend', 'Other'];

// The money question, her way: cash-flow buckets, NO price shown. The third
// option is the sole affordability disqualifier and scores COLD; the first
// scores HOT. Exact strings synced with api/coaching-apply.js.
const CASH_YES = 'Yes, I have the cash flow to invest in my health right now';
const CASH_MAYBE = 'I may or may not, but I am resourceful and have access to what I need';
const CASH_NO = 'No, I am month to month and cannot invest right now';
const CASHFLOW_OPTIONS = [CASH_YES, CASH_MAYBE, CASH_NO];

const STEP_TITLES = [
  'One honest question',
  'You',
  'What you want',
  'Your life right now',
  'Last things',
];
const TOTAL_STEPS = STEP_TITLES.length;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Radio-style option list (big touch targets for phones).
function OptionList({ name, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={name} style={{ display: 'grid', gap: '0.5rem' }}>
      {options.map((o) => {
        const selected = value === o;
        return (
          <label
            key={o}
            className="bt-opt"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '13px 15px', borderRadius: 10, cursor: 'pointer',
              background: '#FFFFFF',
              border: `1px solid ${selected ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)'}`,
              boxShadow: selected ? '0 0 0 1px var(--clay, #B85A36)' : 'none',
            }}
          >
            <input
              type="radio"
              name={name}
              value={o}
              checked={selected}
              onChange={() => onChange(o)}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
            />
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0, width: 19, height: 19, borderRadius: '50%',
                border: `2px solid ${selected ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF',
              }}
            >
              {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />}
            </span>
            <span style={{ color: 'var(--ink, #121110)', fontSize: '1rem', lineHeight: 1.45, fontWeight: selected ? 600 : 400 }}>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function Field({ label, helper, optional, error, children }) {
  return (
    <div style={{ marginBottom: '1.6rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--ink, #121110)', lineHeight: 1.4 }}>
          {label}
          {optional && <span style={{ color: 'var(--muted, #7A7061)', fontWeight: 500 }}> (optional)</span>}
        </span>
      </div>
      {helper && <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.88rem', lineHeight: 1.55, margin: '0 0 0.55rem' }}>{helper}</p>}
      {children}
      {error && <p style={{ color: 'var(--clay-hover, #A44B28)', fontSize: '0.85rem', margin: '0.4rem 0 0', fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

export default function BeThereApplyPage() {
  const [searchParams] = useSearchParams();
  const tier = useMemo(() => searchParams.get('tier') || 'be-there', [searchParams]);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null); // { fitTier } after submit
  const topRef = useRef(null);

  const [form, setForm] = useState({
    // Step 1 — gate
    serious: '',
    // Step 2 — you
    firstName: '', lastName: '', email: '', phone: '',
    // Step 3 — what you want
    whyJoel: '', goal: '',
    // Step 4 — your life
    occupation: '', partnerStatus: '', winning: '', medsAlignment: '',
    // Step 5 — last things
    foundJoel: '', socialHandle: '', cashFlow: '',
  });

  useEffect(() => {
    track('bethere_apply_started');
  }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  // If they tap "No" on the gate, there is no reason to march them through the
  // rest. Record it and drop straight to the (gentle) cold thank-you.
  function bailOnGate() {
    track('bethere_apply_submitted', { fit: 'COLD', gate: 'no' });
    setResult({ fitTier: 'COLD' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.serious) e.serious = 'Pick one. An honest answer helps us both.';
    }
    if (s === 2) {
      if (!form.firstName.trim()) e.firstName = 'Your first name helps Joel greet you.';
      if (!form.lastName.trim()) e.lastName = 'Last name too, please.';
      if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email so Joel can write back.';
      if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'A real phone number, in case your application moves forward.';
    }
    if (s === 3) {
      if (!form.whyJoel) e.whyJoel = 'Pick the closest one.';
      if (!form.goal) e.goal = 'Pick one.';
    }
    if (s === 4) {
      if (!form.occupation.trim()) e.occupation = 'A word or two is plenty.';
      if (!form.partnerStatus) e.partnerStatus = 'Pick one.';
      if (form.winning.trim().length < 10) e.winning = 'This is the most important answer. A sentence or two is plenty.';
      if (!form.medsAlignment) e.medsAlignment = 'Pick one.';
    }
    if (s === 5) {
      if (!form.foundJoel) e.foundJoel = 'Pick one.';
      if (!form.cashFlow) e.cashFlow = 'Pick the honest one. It only decides the next step, not your worth.';
    }
    return e;
  }

  function goBack() {
    if (step > 1) {
      setStep(step - 1);
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goNext() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    // The gate: a "No" ends it here, kindly.
    if (step === 1 && form.serious === GATE_NO) {
      bailOnGate();
      return;
    }
    const next = step + 1;
    setStep(next);
    track('bethere_apply_step', { step: next });
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Local mirror of the server scoring; fallback only if the response has no
  // fitTier. Kept in sync with scoreBeThere in api/coaching-apply.js.
  function localFit() {
    if (form.serious === GATE_NO) return 'COLD';
    if (form.cashFlow === CASH_NO) return 'COLD';
    if (form.medsAlignment === OFF_MEDS) return 'COLD';
    if (form.cashFlow === CASH_YES) return 'HOT';
    return 'WARM';
  }

  async function handleSubmit() {
    const e = validateStep(TOTAL_STEPS);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/coaching-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'bethere-apply',
          tier,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          serious: form.serious,
          whyJoel: form.whyJoel,
          goal: form.goal,
          occupation: form.occupation.trim(),
          partnerStatus: form.partnerStatus,
          winning: form.winning.trim(),
          medsAlignment: form.medsAlignment,
          foundJoel: form.foundJoel,
          socialHandle: form.socialHandle.trim(),
          cashFlow: form.cashFlow,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.ok === false) {
        setSubmitError(out.error || 'Something went wrong sending your application. Your answers are still here. Try again, or email concierge@bpquiz.com directly.');
        setSubmitting(false);
        return;
      }
      const fitTier = out.fitTier || localFit();
      track('bethere_apply_submitted', { fit: fitTier });
      setResult({ fitTier });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError('Network error. Your answers are still here. Try again, or email concierge@bpquiz.com directly.');
      setSubmitting(false);
    }
  }

  // ---- Thank-you screens ----
  if (result) {
    const cold = result.fitTier === 'COLD';
    return (
      <main className="min-h-screen" style={{ background: 'var(--cream, #FBF8F1)', color: 'var(--ink, #121110)' }}>
        <section style={{ maxWidth: 620, margin: '0 auto', padding: '3.5rem 1.25rem 4rem', textAlign: 'center' }}>
          <div className="text-xs font-bold uppercase" style={{ color: 'var(--clay, #B85A36)', letterSpacing: '0.14em', marginBottom: '1rem' }}>
            {cold ? 'THANK YOU' : 'APPLICATION RECEIVED'}
          </div>
          {cold ? (
            <>
              <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 1.2, margin: '0 0 1rem' }}>
                Thank you for being honest.
              </h1>
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 2rem' }}>
                Be There is not the right next step for you today, and that is completely okay.
                The best place to start is the free community and the free quiz. Joel is active in
                both, and everything you learn there still moves your numbers.
              </p>
              <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 380, margin: '0 auto' }}>
                <a
                  href="https://www.skool.com/braveworksrn/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', background: 'var(--clay, #B85A36)', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none', padding: '0.95rem 1.3rem', borderRadius: 10 }}
                >
                  Join the free community
                </a>
                <a
                  href="https://bpquiz.com"
                  style={{ display: 'block', background: '#FFFFFF', color: 'var(--sage-deep, #2E3A30)', fontWeight: 700, textDecoration: 'none', padding: '0.95rem 1.3rem', borderRadius: 10, border: '1px solid var(--line, #D8CFBD)' }}
                >
                  Take the free quiz
                </a>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 1.2, margin: '0 0 1rem' }}>
                Your application is in.
              </h1>
              {/* 2026-07-22 (Joel): the booking link is gone. Five of the first
                  six applicants were sent at a calendar and never booked, so the
                  next step is now an email from Joel, not a page they have to
                  act on. "switch to check your email i will review the
                  application and if i feel they are a good fit i'll send them an
                  email with the next steps." */}
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 1.5rem' }}>
                <strong>Check your email.</strong>
              </p>
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 1.5rem' }}>
                Joel reads every word himself. He will review your application, and if he feels you
                are a good fit, he will send you an email with the next steps.
              </p>
              <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '46ch', margin: '0 auto' }}>
                Nothing else for you to do right now. If you do not see anything from him, check your
                spam folder before you assume the worst.
              </p>
            </>
          )}
          <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: '58ch', margin: '3rem auto 0' }}>
            This is education and lifestyle support, not medical advice, diagnosis, or treatment. See our{' '}
            <Link to="/terms" style={{ color: 'var(--muted, #7A7061)' }}>Terms</Link> and{' '}
            <Link to="/privacy" style={{ color: 'var(--muted, #7A7061)' }}>Privacy Policy</Link>.
          </p>
        </section>
      </main>
    );
  }

  // ---- The wizard ----
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream, #FBF8F1)', color: 'var(--ink, #121110)' }}>
      <style>{`
        .bt-input {
          width: 100%; padding: 14px 16px; font-size: 1rem; line-height: 1.5;
          border: 1px solid var(--line, #D8CFBD); border-radius: 10px;
          background: #FFFFFF; color: var(--ink, #121110);
          font-family: inherit; box-sizing: border-box; outline: none;
        }
        .bt-input::placeholder { color: var(--muted, #7A7061); opacity: 1; }
        .bt-input:focus { border-color: var(--clay, #B85A36); box-shadow: 0 0 0 3px rgba(184, 90, 54, 0.15); }
        .bt-next {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; background: var(--clay, #B85A36); color: #FFFFFF;
          border: none; border-radius: 10px; cursor: pointer;
          font-weight: 700; font-size: 1.05rem; padding: 1rem 1.4rem; font-family: inherit;
          transition: background 0.25s ease;
        }
        .bt-next:hover:not(:disabled) { background: var(--clay-hover, #A44B28); }
        .bt-next:disabled { opacity: 0.65; cursor: wait; }
        .bt-back {
          background: none; border: none; cursor: pointer; font-family: inherit;
          color: var(--muted, #7A7061); font-size: 0.9rem; font-weight: 600;
          padding: 0.5rem 0; text-decoration: underline; text-underline-offset: 3px;
        }
      `}</style>

      <section ref={topRef} style={{ maxWidth: 620, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
        {/* Progress indicator */}
        <div aria-label={`Step ${step} of ${TOTAL_STEPS}`} style={{ marginBottom: '1.75rem' }}>
          <div className="text-xs font-bold uppercase" style={{ color: 'var(--clay, #B85A36)', letterSpacing: '0.14em', marginBottom: '0.6rem' }}>
            STEP {step} OF {TOTAL_STEPS}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {STEP_TITLES.map((t, i) => (
              <div
                key={t}
                aria-hidden="true"
                style={{
                  flex: 1, height: 4, borderRadius: 999,
                  background: i < step ? 'var(--sage, #4A5D4E)' : 'var(--line-soft, #E8E1D1)',
                }}
              />
            ))}
          </div>
        </div>

        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 5vw, 2.1rem)', lineHeight: 1.2, margin: '0 0 1.5rem' }}>
          {STEP_TITLES[step - 1]}
        </h1>

        {/* STEP 1 — the gate */}
        {step === 1 && (
          <>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              To be clear, you are here because you are serious about getting your blood pressure
              down naturally, without adding more pills. Is that right?
            </p>
            <Field label="" error={errors.serious}>
              <OptionList name="Serious gate" options={GATE_OPTIONS} value={form.serious} onChange={(v) => set('serious', v)} />
            </Field>
          </>
        )}

        {/* STEP 2 — you */}
        {step === 2 && (
          <>
            <Field label="First name" error={errors.firstName}>
              <input className="bt-input" type="text" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input className="bt-input" type="text" autoComplete="family-name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="bt-input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
            </Field>
            <Field label="Phone" helper="For a text if your application moves forward." error={errors.phone}>
              <input className="bt-input" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="555 555 5555" />
            </Field>
          </>
        )}

        {/* STEP 3 — what you want */}
        {step === 3 && (
          <>
            <Field label="What makes you want to work with Joel specifically?" error={errors.whyJoel}>
              <OptionList name="Why Joel" options={WHY_JOEL_OPTIONS} value={form.whyJoel} onChange={(v) => set('whyJoel', v)} />
            </Field>
            <Field label="Which of these best describes what you want?" error={errors.goal}>
              <OptionList name="Goal" options={GOAL_OPTIONS} value={form.goal} onChange={(v) => set('goal', v)} />
            </Field>
          </>
        )}

        {/* STEP 4 — your life right now */}
        {step === 4 && (
          <>
            <Field label="What is your current work, and how long have you done it?" error={errors.occupation}>
              <input className="bt-input" type="text" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="e.g. Retired teacher, 8 years" />
            </Field>
            <Field label="Do you have a significant other?" error={errors.partnerStatus}>
              <OptionList name="Partner status" options={PARTNER_OPTIONS} value={form.partnerStatus} onChange={(v) => set('partnerStatus', v)} />
            </Field>
            <Field label="If the next 90 days went perfectly, what would winning look like for you?" helper="This is the most important answer on the whole application. Paint the real picture. Joel reads it first." error={errors.winning}>
              <textarea className="bt-input" rows={4} style={{ resize: 'vertical', minHeight: 100 }} value={form.winning} onChange={(e) => set('winning', e.target.value)} placeholder="Paint the picture for Joel." />
            </Field>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem', padding: '1rem 1.1rem', background: '#FFFFFF', border: '1px solid var(--sage-soft, #C5CDBF)', borderRadius: 12 }}>
              Joel coaches alongside your doctor, never instead of them. Nobody here will ever tell
              you to change a medication. Only your doctor does that.
            </p>
            <Field label="Does that sit right with you?" error={errors.medsAlignment}>
              <OptionList name="Meds alignment" options={ALIGN_OPTIONS} value={form.medsAlignment} onChange={(v) => set('medsAlignment', v)} />
            </Field>
          </>
        )}

        {/* STEP 5 — last things + the money question */}
        {step === 5 && (
          <>
            <Field label="How did you find Joel?" error={errors.foundJoel}>
              <OptionList name="How found Joel" options={FOUND_OPTIONS} value={form.foundJoel} onChange={(v) => set('foundJoel', v)} />
            </Field>
            <Field label="Your Instagram handle or Facebook name" optional helper="So Joel can put a face to your story before you talk.">
              <input className="bt-input" type="text" value={form.socialHandle} onChange={(e) => set('socialHandle', e.target.value)} placeholder="@yourhandle" />
            </Field>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              If Joel could show you a real way to get your numbers down and keep them there, making
              him the last coach you ever need for this, would you be willing and able to invest in
              getting the help to do it?
            </p>
            <Field label="" error={errors.cashFlow}>
              <OptionList name="Cash flow" options={CASHFLOW_OPTIONS} value={form.cashFlow} onChange={(v) => set('cashFlow', v)} />
            </Field>
          </>
        )}

        {/* Errors on submit */}
        {submitError && (
          <div role="alert" style={{ padding: '13px 16px', background: '#FBEAE2', border: '1px solid var(--clay, #B85A36)', borderRadius: 10, color: 'var(--clay-hover, #A44B28)', lineHeight: 1.55, fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
            {submitError}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ marginTop: '0.5rem' }}>
          {step < TOTAL_STEPS ? (
            <button type="button" className="bt-next" onClick={goNext}>Continue</button>
          ) : (
            <button type="button" className="bt-next" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending your application...' : 'Send my application to Joel'}
            </button>
          )}
          {step > 1 && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button type="button" className="bt-back" onClick={goBack}>Go back a step</button>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: '58ch', margin: '2.5rem auto 0', textAlign: 'center' }}>
          Nothing is bought here. Joel reviews first, then you talk. This is education and lifestyle
          support, not medical advice, diagnosis, or treatment. See our{' '}
          <Link to="/terms" style={{ color: 'var(--muted, #7A7061)' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--muted, #7A7061)' }}>Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
