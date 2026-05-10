// 1:1 BP Triangle Premium Coaching with Joel Polley, RN — application form.
//
// $1,297 single-pay tier, application-gated. Joel screens applications,
// approves a small number per cohort, then runs a sales call (Calendly) and
// invoices on close. There is no Stripe payment link for this tier — the
// path is intake → screen → call → invoice.
//
// This page is a multi-step "more detailed quiz" that captures fit signal
// (stage, history, motivation, fit-with-Joel, expectations, availability)
// then ends with a "we'll be in touch when we have an opening" message.
//
// Submit posts to /api/waitlist-submit which persists to Vercel KV
// (`waitlist:1on1:{iso}:{emailHash}`) and sends two Resend emails — one
// to Joel with full application body, one to the applicant with the soft
// "we'll review and reach out" auto-confirm.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = [
  { id: 'name', label: 'Who are we talking to?' },
  { id: 'context', label: 'Tell us about you' },
  { id: 'history', label: 'Your BP / health history' },
  { id: 'tried', label: 'What you’ve tried' },
  { id: 'why', label: 'Why this, why now' },
  { id: 'fit', label: 'What success looks like' },
];

const PROGRESS_STEPS = STEPS.length + 1; // +1 for the final "submitted" screen

const colors = {
  paper: '#FBF8F1',
  ink: '#2C3E50',
  inkSoft: '#5A5A5A',
  clay: '#B85A36',
  sage: '#B8CFB0',
  sageDeep: '#4A6741',
  sageSoft: '#E8F1E5',
  cream: '#F5F1E8',
  line: 'rgba(0,0,0,0.08)',
  muted: '#9A9A9A',
};

function inputStyle(error) {
  return {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    border: `1px solid ${error ? colors.clay : colors.line}`,
    borderRadius: 10,
    background: '#FFFFFF',
    color: colors.ink,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  };
}

function fieldLabel(text) {
  return (
    <label style={{
      display: 'block',
      fontSize: '0.78rem',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: colors.clay,
      fontWeight: 600,
      marginBottom: '0.5rem',
    }}>{text}</label>
  );
}

export default function WaitlistApplicationPage() {
  const [step, setStep] = useState(0); // 0..STEPS.length-1, STEPS.length = submitted
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ageRange: '',
    bpSituation: '',
    yearsWithIssue: '',
    onMedication: '',
    triedAlready: [],
    triedOther: '',
    whyNow: '',
    whyJoel: '',
    successIn90Days: '',
    timeToTalk: '',
    anythingElse: '',
  });

  function set(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function toggleTried(option) {
    setData(prev => ({
      ...prev,
      triedAlready: prev.triedAlready.includes(option)
        ? prev.triedAlready.filter(o => o !== option)
        : [...prev.triedAlready, option],
    }));
  }

  function canAdvance() {
    if (step === 0) return data.firstName.trim() && data.lastName.trim() && data.email.trim() && /\S+@\S+\.\S+/.test(data.email);
    if (step === 1) return data.phone.trim() && data.ageRange;
    if (step === 2) return data.bpSituation.trim().length >= 10 && data.yearsWithIssue;
    if (step === 3) return data.triedAlready.length > 0 && data.onMedication;
    if (step === 4) return data.whyNow.trim().length >= 15 && data.whyJoel.trim().length >= 15;
    if (step === 5) return data.successIn90Days.trim().length >= 15 && data.timeToTalk;
    return false;
  }

  async function submit() {
    if (!canAdvance()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/waitlist-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, submittedAt: new Date().toISOString() }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setSubmitError(out.error || 'Something went wrong. Try again or email braveworksrn@gmail.com directly.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Network error. Try again or email braveworksrn@gmail.com directly.');
      setSubmitting(false);
    }
  }

  const progressPct = submitted
    ? 100
    : Math.round(((step + 1) / PROGRESS_STEPS) * 100);

  return (
    <main style={{ minHeight: '100vh', background: colors.paper, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '0.78rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: colors.clay,
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}>1:1 Premium Coaching · Application</span>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            color: colors.ink,
            margin: '0.5rem 0 0.75rem',
            lineHeight: 1.2,
          }}>
            BP Triangle 1:1 with <em style={{ color: colors.clay }}>Joel Polley, RN</em>
          </h1>
          <p style={{ color: colors.inkSoft, fontSize: '0.95rem', maxWidth: '50ch', margin: '0 auto', lineHeight: 1.55 }}>
            Limited cohort. Application + screening + sales call. We&rsquo;ll review yours and reach out when we have an opening.
          </p>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              height: 6,
              background: colors.cream,
              borderRadius: 999,
              overflow: 'hidden',
              border: `1px solid ${colors.line}`,
            }}>
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: colors.clay,
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: colors.muted,
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        )}

        {/* Steps */}
        <div style={{
          background: '#FFFFFF',
          padding: 'clamp(1.5rem, 3vw, 2rem)',
          borderRadius: 16,
          border: `1px solid ${colors.line}`,
        }}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: 'center', padding: '1rem 0' }}
              >
                <div style={{
                  display: 'inline-flex',
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: colors.sageSoft,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <Check size={28} style={{ color: colors.sageDeep }} />
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: colors.ink, margin: '0 0 0.75rem' }}>
                  Application received.
                </h2>
                <p style={{ color: colors.inkSoft, lineHeight: 1.6, maxWidth: '46ch', margin: '0 auto 1rem' }}>
                  Thanks for sharing all of that — Joel reads every one of these personally.
                </p>
                <p style={{ color: colors.inkSoft, lineHeight: 1.6, maxWidth: '46ch', margin: '0 auto 1.5rem' }}>
                  The 1:1 cohort is small by design. <strong>We&rsquo;ll be in touch when we have an opening</strong> — typically within 1&ndash;2 weeks. If you don&rsquo;t hear back by then, the cohort is full and you&rsquo;ll be on the list for the next round.
                </p>
                <p style={{ color: colors.muted, fontSize: '0.85rem', maxWidth: '40ch', margin: '0 auto' }}>
                  In the meantime, keep an eye on your inbox for the BP Triangle starter sequence.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.35rem',
                  color: colors.ink,
                  margin: '0 0 1.25rem',
                }}>{STEPS[step].label}</h2>

                {step === 0 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        {fieldLabel('First name')}
                        <input style={inputStyle()} value={data.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First" />
                      </div>
                      <div>
                        {fieldLabel('Last name')}
                        <input style={inputStyle()} value={data.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last" />
                      </div>
                    </div>
                    <div>
                      {fieldLabel('Email')}
                      <input type="email" style={inputStyle()} value={data.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      {fieldLabel('Phone (for the call if we reach out)')}
                      <input type="tel" style={inputStyle()} value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="555-555-5555" />
                    </div>
                    <div>
                      {fieldLabel('Age range')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                        {['Under 45', '45–54', '55–64', '65–74', '75+'].map(o => (
                          <button key={o} type="button" onClick={() => set('ageRange', o)} style={{
                            padding: '12px 10px', border: `1px solid ${data.ageRange === o ? colors.clay : colors.line}`,
                            background: data.ageRange === o ? colors.clay : '#FFFFFF',
                            color: data.ageRange === o ? '#FFFFFF' : colors.ink,
                            borderRadius: 10, fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500,
                          }}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      {fieldLabel('What’s going on with your BP / health right now?')}
                      <textarea
                        style={{ ...inputStyle(), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                        value={data.bpSituation}
                        onChange={e => set('bpSituation', e.target.value)}
                        placeholder="Most recent readings, symptoms, what your doctor said, anything we should know..."
                      />
                      <div style={{ fontSize: '0.78rem', color: colors.muted, marginTop: '0.35rem' }}>
                        At least a sentence or two. The more context, the better the screen.
                      </div>
                    </div>
                    <div>
                      {fieldLabel('How long has this been an issue?')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                        {['< 1 year', '1–3 years', '3–10 years', '10+ years'].map(o => (
                          <button key={o} type="button" onClick={() => set('yearsWithIssue', o)} style={{
                            padding: '12px 10px', border: `1px solid ${data.yearsWithIssue === o ? colors.clay : colors.line}`,
                            background: data.yearsWithIssue === o ? colors.clay : '#FFFFFF',
                            color: data.yearsWithIssue === o ? '#FFFFFF' : colors.ink,
                            borderRadius: 10, fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500,
                          }}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      {fieldLabel('What have you already tried? (check all)')}
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {[
                          'BP medication (current)',
                          'BP medication (in the past, stopped)',
                          'Diet and lifestyle changes',
                          'Supplements / herbs',
                          'Functional / naturopathic doctor',
                          'Multiple cardiologists',
                          'BraveWorks materials (BP Cures, Reset Kit, etc.)',
                          'Honestly, not much yet',
                        ].map(o => {
                          const checked = data.triedAlready.includes(o);
                          return (
                            <button key={o} type="button" onClick={() => toggleTried(o)} style={{
                              padding: '12px 14px', border: `1px solid ${checked ? colors.clay : colors.line}`,
                              background: checked ? colors.sageSoft : '#FFFFFF',
                              color: colors.ink,
                              borderRadius: 10, fontSize: '0.92rem', cursor: 'pointer', textAlign: 'left',
                              display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: checked ? 600 : 400,
                            }}>
                              <span style={{
                                width: 18, height: 18, borderRadius: 4,
                                border: `1px solid ${checked ? colors.clay : colors.line}`,
                                background: checked ? colors.clay : 'transparent',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {checked && <Check size={12} style={{ color: '#FFFFFF' }} />}
                              </span>
                              <span>{o}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      {fieldLabel('On BP medication right now?')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                        {['Yes', 'No', 'Used to be'].map(o => (
                          <button key={o} type="button" onClick={() => set('onMedication', o)} style={{
                            padding: '12px 10px', border: `1px solid ${data.onMedication === o ? colors.clay : colors.line}`,
                            background: data.onMedication === o ? colors.clay : '#FFFFFF',
                            color: data.onMedication === o ? '#FFFFFF' : colors.ink,
                            borderRadius: 10, fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500,
                          }}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      {fieldLabel('Why now? What changed?')}
                      <textarea
                        style={{ ...inputStyle(), minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                        value={data.whyNow}
                        onChange={e => set('whyNow', e.target.value)}
                        placeholder="Doctor warning, scary reading, partner pushing, milestone birthday, just tired of figuring this out alone..."
                      />
                    </div>
                    <div>
                      {fieldLabel('Why work with Joel specifically? (and not your current doctor)')}
                      <textarea
                        style={{ ...inputStyle(), minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                        value={data.whyJoel}
                        onChange={e => set('whyJoel', e.target.value)}
                        placeholder="What pulled you toward 1:1 with a nurse + naturopathic approach vs. the standard route..."
                      />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      {fieldLabel('What does success look like in 90 days?')}
                      <textarea
                        style={{ ...inputStyle(), minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                        value={data.successIn90Days}
                        onChange={e => set('successIn90Days', e.target.value)}
                        placeholder="Specific numbers, off a medication, more energy, sleeping through the night, etc..."
                      />
                    </div>
                    <div>
                      {fieldLabel('Best time to talk if we have an opening')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                        {['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends', 'Anytime'].map(o => (
                          <button key={o} type="button" onClick={() => set('timeToTalk', o)} style={{
                            padding: '12px 10px', border: `1px solid ${data.timeToTalk === o ? colors.clay : colors.line}`,
                            background: data.timeToTalk === o ? colors.clay : '#FFFFFF',
                            color: data.timeToTalk === o ? '#FFFFFF' : colors.ink,
                            borderRadius: 10, fontSize: '0.92rem', cursor: 'pointer', fontWeight: 500,
                          }}>{o}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      {fieldLabel('Anything else we should know? (optional)')}
                      <textarea
                        style={{ ...inputStyle(), minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                        value={data.anythingElse}
                        onChange={e => set('anythingElse', e.target.value)}
                        placeholder="Anything we didn't ask about that matters..."
                      />
                    </div>
                  </div>
                )}

                {submitError && (
                  <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#FEEFEA', border: `1px solid ${colors.clay}`, borderRadius: 10, color: colors.clay, fontSize: '0.9rem' }}>
                    {submitError}
                  </div>
                )}

                {/* Nav buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                  {step > 0 ? (
                    <button onClick={() => setStep(s => s - 1)} disabled={submitting} style={{
                      padding: '12px 18px', background: 'transparent', color: colors.inkSoft,
                      border: `1px solid ${colors.line}`, borderRadius: 10, fontSize: '0.95rem',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : <span />}

                  {step < STEPS.length - 1 ? (
                    <button onClick={() => canAdvance() && setStep(s => s + 1)} disabled={!canAdvance()} style={{
                      padding: '12px 22px',
                      background: canAdvance() ? colors.clay : '#D8D2C5',
                      color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: canAdvance() ? 'pointer' : 'not-allowed',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={submit} disabled={!canAdvance() || submitting} style={{
                      padding: '12px 22px',
                      background: canAdvance() && !submitting ? colors.clay : '#D8D2C5',
                      color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: canAdvance() && !submitting ? 'pointer' : 'wait',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      {submitting ? 'Submitting…' : 'Submit application'}
                      {!submitting && <ArrowRight size={16} />}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: colors.muted, fontSize: '0.78rem', marginTop: '1.25rem', maxWidth: '46ch', margin: '1.25rem auto 0' }}>
          1:1 is $1,297 single-pay. We screen carefully so we only take on people who&rsquo;ll get real results. No payment is collected at application.
        </p>
      </div>
    </main>
  );
}
