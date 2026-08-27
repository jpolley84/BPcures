// /apply — the LIFE CHANGE ACCELERATOR prequalification application.
//
// Reached at changemylifechallenge.com/apply (the SPA serves every path on that
// host except "/", which middleware.js rewrites to the static challenge page)
// and at bpquiz.com/apply.
//
// 2026-08-27 (Joel): the program is the "Life Change Accelerator", not "Be
// There", and it is run by JOEL AND ANNIE, not Joel alone. All visible copy
// says both names.
//
// 2026-08-27 (Joel, same day): "the application brings in people with blood
// pressure, hormones, diabetes, obesity etc so question 1 needs to go ... also
// everything is about blood pressure. need that changed."
//
// The opt-in gate is GONE. It asked her to confirm she was here to get her
// blood pressure down, which locked out three quarters of the people this form
// actually receives. Removing it takes the wizard from three steps to two.
//
// Consequence, on purpose: the gate was the ONLY path to a COLD score, so
// nobody scores COLD from the new form any more. That matches Joel's standing
// 2026-07-22 rule ("just push everyone through to a call if they applied").
// The COLD thank-you branch is KEPT as a defensive render: the API owns
// tiering, cached clients may still post `serious` for a while, and an
// unreachable branch is cheaper than a blank screen if tiering changes again.
//
// ⚠️ The INTERNAL identifiers are deliberately NOT renamed: source
// 'bethere-apply' / 'bethere-partial', tier 'be-there', the bethere_apply_*
// analytics events and the file name itself. Those are wire-format and
// analytics contracts - api/coaching-apply.js branches on the source string,
// KV keys are built from it, and renaming the events would sever every
// historical funnel report. Rename the label, not the wire.
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
// 2026-08-27 TRIM (Joel): "i need the application presell themselves ... some
// sort of money question about investment capability, is anyone else involved
// in your investment decision, i still want it only about 5-7 questions, mostly
// one click."
//
// Cut from ELEVEN questions to SEVEN, six of them one tap:
//   1. the gate (one click)          5. doctor-alignment (one click)
//   2. BP right now (one click)      6. investment decision-maker (one click)
//   3. why you are a good fit (TEXT) 7. investment capability (one click)
//   4. when you would start (one click)
//
// Removed: "why Joel specifically", "what do you want" (both overlapped the
// new good-fit answer), "how did you find Joel" (the ?src= tag and UTMs already
// carry attribution), and the optional social handle.
//
// The free-text question is now "why do you think you would be a good fit",
// which makes her argue her own case instead of describing an outcome. It still
// posts as the `winning` field ON PURPOSE: api/coaching-apply.js hard-requires
// `winning` and 400s without it, so renaming the field would break every
// submission. The label changed, the wire format did not.
//
// The doctor-alignment gate stays. It is a liability screen for an RN and a
// real disqualifier, not conversion fat.
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

// 2026-08-12 research pass: three new predictive questions (severity, start
// timeline, decision authority) replace occupation + bare partner status.
// Budget and timeline predict buying; severity = urgency in this niche; the
// decision question surfaces the spousal veto before the call instead of
// after it. Exact strings synced with scoreBeThere in api/coaching-apply.js.
// 2026-08-27: was a blood-pressure severity ladder (160+, 140 to 159, ...).
// The Accelerator takes blood pressure, hormones, blood sugar and weight, and a
// woman applying for hormone help had no honest answer to a BP-number question.
// This asks what is actually going on instead.
//
// ⚠️ Still posts as the `bpNow` field. The name is a wire contract with
// api/coaching-apply.js and the notify email; the QUESTION changed, not the
// field. Do not rename it without changing the API in the same commit.
//
// "More than one" is deliberately an option and is the highest-value answer on
// the form: stacked conditions are exactly who this program is for.
const CONDITION_OPTIONS = [
  'Blood pressure that will not come down',
  'Hormones: the mood, the sleep, the chin hair, the changes',
  'Blood sugar, prediabetes or diabetes',
  'Weight that will not move no matter what I try',
  'More than one of these, and they all showed up together',
  'Something is wrong and I do not know what it is yet',
];

const TIMELINE_START_NOW = 'This week';
const TIMELINE_TWO_WEEKS = 'Within two weeks';
const TIMELINE_OPTIONS = [
  TIMELINE_START_NOW,
  TIMELINE_TWO_WEEKS,
  'In the next month or two',
  'Just exploring for now',
];

// 2026-08-27 (Joel): reframed from "part of this decision" to the INVESTMENT
// decision, which is the stall this question exists to surface before the call.
// ⚠️ The third string is EXACT-SYNCED with BETHERE_SPOUSE_NOT_ASKED in
// api/coaching-apply.js, where it raises the "spouse not consulted yet" flag on
// Joel's notify email. Do not reword it without changing the API constant too.
const DECISION_OPTIONS = [
  'No, this one is mine to make',
  'My spouse or partner, and they are already on board with me investing in this',
  'My spouse or partner, and I have not talked to them about it yet',
];

// Doctor-alignment gate. Kept from the old form: it is a liability screen for
// an RN and a genuine disqualifier. The middle option scores COLD.
const OFF_MEDS = 'I was hoping to come off my medications without my doctor';
const ALIGN_OPTIONS = ['Yes, that is exactly what I want', OFF_MEDS, 'I am not sure'];

// The money question, her way: cash-flow buckets, NO price shown. The third
// option is the sole affordability disqualifier and scores COLD; the first
// scores HOT. Exact strings synced with api/coaching-apply.js.
const CASH_YES = 'Yes, I have the cash flow to invest in my health right now';
const CASH_MAYBE = 'I may or may not, but I am resourceful and have access to what I need';
const CASH_NO = 'No, I am month to month and cannot invest right now';
const CASHFLOW_OPTIONS = [CASH_YES, CASH_MAYBE, CASH_NO];

// 2026-07-27: collapsed 5 steps to 3. PostHog showed 61 people started the
// wizard and only 12 finished (80% abandon). Every "Continue" tap is a place
// to leak, so we cut the number of taps in half: the gate stays standalone
// (it is the commitment device), then everything else folds into two screens.
// No fields removed, so scoring (serious / medsAlignment / cashFlow) and the
// API contract are untouched.
const STEP_TITLES = [
  'About you',
  'Last few',
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
  // 2026-08-12: warm-traffic source tag (?src=masterclass from /coaching or a
  // direct masterclass link). Recorded on the application for attribution.
  const src = useMemo(() => (searchParams.get('src') || '').slice(0, 40), [searchParams]);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null); // { fitTier } after submit
  const topRef = useRef(null);

  const [form, setForm] = useState({
    // Step 1 — you, what is going on, and her own case for herself
    firstName: '', lastName: '', email: '', phone: '',
    bpNow: '', winning: '',
    // Step 2 — the four one-tap qualifiers
    startTimeline: '', medsAlignment: '', decisionAuthority: '', cashFlow: '',
  });

  useEffect(() => {
    track('bethere_apply_started');
    // 2026-08-27: the SPA shell ships BPQuiz's title, which is the wrong brand
    // on changemylifechallenge.com/apply. Set it per-route and restore on exit.
    const prev = document.title;
    document.title = 'The Life Change Accelerator | Application';
    return () => { document.title = prev; };
  }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = 'Your first name helps Joel and Annie greet you.';
      if (!form.lastName.trim()) e.lastName = 'Last name too, please.';
      if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email so Joel and Annie can write back.';
      if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'A real phone number, in case your application moves forward.';
      if (!form.bpNow) e.bpNow = 'Pick the closest one.';
      if (form.winning.trim().length < 10) e.winning = 'This is the one Joel and Annie read first. A sentence or two is plenty.';
    }
    if (s === 2) {
      if (!form.startTimeline) e.startTimeline = 'Pick one.';
      if (!form.medsAlignment) e.medsAlignment = 'Pick one.';
      if (!form.decisionAuthority) e.decisionAuthority = 'Pick one.';
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
    // 2026-08-12: partial capture. By the end of the first step we hold name,
    // email and phone; an abandon on the last step used to lose all of it.
    // Fire-and-forget so Joel can follow up abandons (KV only, no emails
    // server-side). 2026-08-27: moved from step 2 to step 1 when the gate was
    // removed and the wizard went from three steps to two.
    if (step === 1) {
      try {
        fetch('/api/coaching-apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'bethere-partial',
            src,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            bpNow: form.bpNow,
          }),
        }).catch(() => {});
      } catch { /* never block the wizard */ }
    }
    const next = step + 1;
    setStep(next);
    track('bethere_apply_step', { step: next });
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Local mirror of the server scoring; fallback only if the response has no
  // fitTier. Kept in sync with scoreBeThere in api/coaching-apply.js.
  function localFit() {
    // Mirrors scoreBeThere. 2026-08-27: the gate is gone, so COLD is no longer
    // reachable from this form; HOT requires cash flow AND a near-term start.
    if (
      form.cashFlow === CASH_YES &&
      (form.startTimeline === TIMELINE_START_NOW || form.startTimeline === TIMELINE_TWO_WEEKS)
    ) return 'HOT';
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
          src,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          bpNow: form.bpNow,
          startTimeline: form.startTimeline,
          decisionAuthority: form.decisionAuthority,
          // Posts as `winning` on purpose: the API hard-requires this field.
          // The QUESTION is now "why would you be a good fit", not "what does
          // winning look like". See the header note.
          winning: form.winning.trim(),
          medsAlignment: form.medsAlignment,
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
                The Life Change Accelerator is not the right next step for you today, and that is
                completely okay. The best place to start is the free community and the free quiz.
                Joel and Annie are active in both, and everything you learn there still moves your
                numbers.
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
                <strong>Check your email in the next few minutes.</strong> Your first note from Joel
                and Annie is already on its way with your next step.
              </p>
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 1.5rem' }}>
                When it lands, <strong>just reply to it.</strong> That reply is how we find a time to
                talk. One small thing you can do tonight: write down the three symptoms that bother
                you most, and when each one is at its worst. Bring that to the call.
              </p>
              <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '46ch', margin: '0 auto' }}>
                Add joel@bpquiz.com to your contacts so it does not slip into spam. That is the only
                thing you need to do right now.
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

        {/* STEP 1 — about you, what is going on, and her own case */}
        {step === 1 && (
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
            <Field label="What is going on with your health right now?" helper="The closest one is fine. There is no wrong answer here." error={errors.bpNow}>
              <OptionList name="What is going on" options={CONDITION_OPTIONS} value={form.bpNow} onChange={(v) => set('bpNow', v)} />
            </Field>
            <Field label="Why do you think you would be a good fit for this?" helper="This is the one Joel and Annie read first. Make your case: where you are, what you have already tried, and what you want to be different." error={errors.winning}>
              <textarea className="bt-input" rows={4} style={{ resize: 'vertical', minHeight: 100 }} value={form.winning} onChange={(e) => set('winning', e.target.value)} placeholder="Tell Joel and Annie why you." />
            </Field>
          </>
        )}

        {/* STEP 2 — the four one-tap qualifiers */}
        {step === 2 && (
          <>
            <Field label="If this is a fit, when would you want to start?" error={errors.startTimeline}>
              <OptionList name="Start timeline" options={TIMELINE_OPTIONS} value={form.startTimeline} onChange={(v) => set('startTimeline', v)} />
            </Field>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem', padding: '1rem 1.1rem', background: '#FFFFFF', border: '1px solid var(--sage-soft, #C5CDBF)', borderRadius: 12 }}>
              Joel and Annie coach alongside your doctor, never instead of them. Nobody here will
              ever tell you to change a medication. Only your doctor does that.
            </p>
            <Field label="Does that sit right with you?" error={errors.medsAlignment}>
              <OptionList name="Meds alignment" options={ALIGN_OPTIONS} value={form.medsAlignment} onChange={(v) => set('medsAlignment', v)} />
            </Field>
            <Field label="Is anyone else part of the decision to invest in this?" error={errors.decisionAuthority}>
              <OptionList name="Decision authority" options={DECISION_OPTIONS} value={form.decisionAuthority} onChange={(v) => set('decisionAuthority', v)} />
            </Field>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              If Joel and Annie could show you a real way to turn this around and keep it that way,
              making them the last coaches you ever need for this, would you be willing and able to
              invest in getting the help to do it?
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
              {submitting ? 'Sending your application...' : 'Send my application to Joel and Annie'}
            </button>
          )}
          {step > 1 && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button type="button" className="bt-back" onClick={goBack}>Go back a step</button>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: '58ch', margin: '2.5rem auto 0', textAlign: 'center' }}>
          Nothing is bought here. Joel and Annie review first, then you talk. This is education and
          lifestyle support, not medical advice, diagnosis, or treatment. See our{' '}
          <Link to="/terms" style={{ color: 'var(--muted, #7A7061)' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--muted, #7A7061)' }}>Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
