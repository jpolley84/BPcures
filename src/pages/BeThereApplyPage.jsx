// /apply — the Be There cohort prequalification application.
//
// 2026-07-16: replaces ApplyPage.jsx on the /apply route (the old file stays
// in the repo, unrouted). An 8-step wizard, one section per screen, progress
// dots, back button, state preserved across steps. POSTs to
// /api/coaching-apply with source: 'bethere-apply'; the API scores fit
// (HOT / WARM / COLD) and the thank-you screen branches on it.
//
// Legacy ?tier= links still land here; the tier defaults to 'be-there'.
// HARD RULES honored: no pricing or dollar amounts in visible copy, zero
// em/en dashes, fourth-grade reading level, warm RN voice, education
// alongside her doctor, mobile-first at 375px.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { track } from '../utils/analytics';

const SERIF = "'Fraunces', 'Times New Roman', serif";

// Fit-call booking link for accepted-track applicants (HOT / WARM).
const FIT_CALL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env &&
    (import.meta.env.VITE_CALENDLY_FIT_CALL_URL || import.meta.env.VITE_CALENDLY_DIAGNOSTIC_URL)) ||
  'https://calendly.com/braveworksrn/60min';

// Welcome video shown on the accepted-track thank-you screen (the landing
// page promises: application -> welcome video -> full cost -> decide -> book).
// Env seam first, else the live Be There webinar.
const WELCOME_VIDEO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_COACHING_VSL_URL) ||
  'https://www.youtube-nocookie.com/embed/UdJvWCvUKww';

// ---- Option sets (visible copy: no dashes, no prices) ----
const AGE_OPTIONS = ['Under 45', '45 to 54', '55 to 64', '65 to 74', '75 plus'];
const READING_OPTIONS = ['Under 130/80', '130s to 140s', '150s to 160s', '170 plus', 'I do not know'];
const HOME_CHECK_OPTIONS = ['Yes, most days', 'Sometimes', 'I own a cuff but rarely use it', 'No cuff at home'];
const MEDS_OPTIONS = ['None', 'One', 'Two', 'Three or more'];
const DOCTOR_OPTIONS = ['We work well together', 'Fine but visits feel rushed', 'Frustrated or dismissed', 'I do not have a regular doctor'];
const DURATION_OPTIONS = ['Under 1 year', '1 to 3 years', '3 to 10 years', 'Over 10 years'];
const TRIED_OPTIONS = ['Cut salt', 'Walking or exercise', 'Weight loss', 'Herbs or supplements', 'A diet program', 'Stress work', 'Prayer', 'Nothing formal yet'];
const HAPPENED_OPTIONS = ['Worked for a while then faded', 'Numbers barely moved', 'Could not stick with it', 'Never really committed'];
const CORNER_OPTIONS = ['Stress', 'Sugar', 'Sodium', 'Honestly not sure'];
const SLEEP_OPTIONS = ['Solid most nights', 'Okay', 'Broken or short', 'Rough'];
const STRESS_OPTIONS = ['Calm', 'Manageable', 'Heavy', 'Crushing'];
const START_OPTIONS = ['This week', 'Within two weeks', 'Within a month', 'Just exploring for now'];
const TIME_OPTIONS = ['30 minutes or more', '15 to 30', 'Under 15', 'Honestly none right now'];
const TRACKING_OPTIONS = ['Yes', 'Mostly', 'That sounds hard'];
const PLANT_OPTIONS = ['Excited', 'Willing to try', 'Hesitant', 'That is not for me'];
const ALIGN_OPTIONS = ['Yes, that is what I want', 'I was hoping to get off my medications without my doctor', 'Not sure'];
const GROUPS_OPTIONS = ['I love learning with others', 'Prefer one on one but open to a group', 'Groups are not for me'];
// 2026-07-17 (Joel): replaced the old 3-option investComfort question with a
// direct dollar-tier question. "Not willing" is the SOLE cold-lead signal now
// (see scoreBeThere in api/coaching-apply.js, kept in exact-string sync with
// NOT_WILLING here) - every other applicant gets the fit-call link, no more
// gating on the old multi-factor flag/exploring heuristic.
const NOT_WILLING = 'I am not willing to invest at this time';
const INVEST_TIER_OPTIONS = ['$5,000 to $9,999 a year', '$10,000 to $24,999 a year', '$25,000 or more a year', NOT_WILLING];
const DECISION_OPTIONS = ['Just me', 'My spouse or partner and me', 'An adult child or family member'];
const FOUND_OPTIONS = ['TikTok', 'Facebook', 'YouTube', 'A friend', 'Other'];
const WATCHED_OPTIONS = ['Yes, all of it', 'Some of it', 'Not yet'];

const STEP_TITLES = [
  'About you',
  'Your pressure today',
  'Your story',
  'The three corners',
  'Readiness',
  'How we work',
  'The honest question',
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
              background: selected ? '#FFFFFF' : '#FFFFFF',
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

// Multi-select checkbox list.
function CheckList({ name, options, values, onToggle }) {
  return (
    <div role="group" aria-label={name} style={{ display: 'grid', gap: '0.5rem' }}>
      {options.map((o) => {
        const checked = values.includes(o);
        return (
          <label
            key={o}
            className="bt-opt"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '13px 15px', borderRadius: 10, cursor: 'pointer',
              background: '#FFFFFF',
              border: `1px solid ${checked ? 'var(--sage, #4A5D4E)' : 'var(--line, #D8CFBD)'}`,
              boxShadow: checked ? '0 0 0 1px var(--sage, #4A5D4E)' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(o)}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
            />
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0, width: 19, height: 19, borderRadius: 5,
                border: `1.5px solid ${checked ? 'var(--sage, #4A5D4E)' : 'var(--line, #D8CFBD)'}`,
                background: checked ? 'var(--sage, #4A5D4E)' : '#FFFFFF',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: 13, fontWeight: 700, lineHeight: 1,
              }}
            >
              {checked ? '✓' : ''}
            </span>
            <span style={{ color: 'var(--ink, #121110)', fontSize: '1rem', lineHeight: 1.45, fontWeight: checked ? 600 : 400 }}>{o}</span>
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
  // Legacy ?tier= links still work; everything defaults to the Be There cohort.
  const tier = useMemo(() => searchParams.get('tier') || 'be-there', [searchParams]);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null); // { fitTier } after submit
  const topRef = useRef(null);

  const [form, setForm] = useState({
    // Step 1
    firstName: '', email: '', phone: '', ageRange: '',
    // Step 2
    readingRange: '', homeCheck: '', medsCount: '', doctorRelationship: '',
    // Step 3
    concernDuration: '', tried: [], whatHappened: '', story: '',
    // Step 4
    loudestCorner: '', sleep: '', stressLevel: '',
    // Step 5
    whyThisWeek: '', startWindow: '', dailyTime: '', trackingWillingness: '', plantBased: '',
    // Step 6
    medsAlignment: '', groupsFeel: '',
    // Step 7
    winning: '', pictureValue: '', investTier: '', decisionMakers: '',
    // Step 8
    foundJoel: '', watchedVideo: '', anythingElse: '',
  });

  useEffect(() => {
    track('bethere_apply_started');
  }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };
  const toggleTried = (o) =>
    setForm((prev) => ({
      ...prev,
      tried: prev.tried.includes(o) ? prev.tried.filter((x) => x !== o) : [...prev.tried, o],
    }));

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = 'Your first name helps Joel greet you.';
      if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email so Joel can write back.';
      if (!form.ageRange) e.ageRange = 'Pick one.';
    }
    if (s === 2) {
      if (!form.readingRange) e.readingRange = 'Pick the closest one. A guess is fine.';
      if (!form.homeCheck) e.homeCheck = 'Pick one.';
      if (!form.medsCount) e.medsCount = 'Pick one. None is a fine answer.';
      if (!form.doctorRelationship) e.doctorRelationship = 'Pick one.';
    }
    if (s === 3) {
      if (!form.concernDuration) e.concernDuration = 'Pick one.';
      if (form.tried.length === 0) e.tried = 'Check at least one. Nothing formal yet counts.';
      if (!form.whatHappened) e.whatHappened = 'Pick the closest one.';
      if (form.story.trim().length < 20) e.story = 'A few honest sentences help Joel read your case well.';
    }
    if (s === 4) {
      if (!form.loudestCorner) e.loudestCorner = 'Pick one. Not sure is a fine answer.';
      if (!form.sleep) e.sleep = 'Pick one.';
      if (!form.stressLevel) e.stressLevel = 'Pick one.';
    }
    if (s === 5) {
      if (form.whyThisWeek.trim().length < 10) e.whyThisWeek = 'A sentence is plenty.';
      if (!form.startWindow) e.startWindow = 'Pick one.';
      if (!form.dailyTime) e.dailyTime = 'Pick one.';
      if (!form.trackingWillingness) e.trackingWillingness = 'Pick one.';
      if (!form.plantBased) e.plantBased = 'Pick one.';
    }
    if (s === 6) {
      if (!form.medsAlignment) e.medsAlignment = 'Pick one.';
      if (!form.groupsFeel) e.groupsFeel = 'Pick one.';
    }
    if (s === 7) {
      if (form.winning.trim().length < 10) e.winning = 'This is the most important answer. A sentence or two is plenty.';
      if (!form.pictureValue.trim()) e.pictureValue = 'A dollar figure, even a rough one, is what Joel needs here.';
      if (!form.investTier) e.investTier = 'Pick one. Honesty helps us both.';
      if (!form.decisionMakers) e.decisionMakers = 'Pick one.';
    }
    if (s === 8) {
      if (!form.foundJoel) e.foundJoel = 'Pick one.';
      if (!form.watchedVideo) e.watchedVideo = 'Pick one.';
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
    const next = step + 1;
    setStep(next);
    track('bethere_apply_step', { step: next });
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Local mirror of the server scoring, used only as a fallback if the
  // response does not carry fitTier.
  function localFit() {
    // 2026-07-17: cold is now decided SOLELY by the investment-tier answer
    // (see NOT_WILLING). Every other applicant is warm/hot and gets the
    // fit-call link - no more gating on the meds-alignment flag or the
    // exploring+no-time combo.
    if (form.investTier === NOT_WILLING) return 'COLD';
    const hot =
      (form.startWindow === 'This week' || form.startWindow === 'Within two weeks') &&
      (form.dailyTime === '30 minutes or more' || form.dailyTime === '15 to 30') &&
      (form.trackingWillingness === 'Yes' || form.trackingWillingness === 'Mostly');
    return hot ? 'HOT' : 'WARM';
  }

  async function handleSubmit() {
    const e = validateStep(8);
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
          name: form.firstName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          ageRange: form.ageRange,
          readingRange: form.readingRange,
          homeCheck: form.homeCheck,
          medsCount: form.medsCount,
          doctorRelationship: form.doctorRelationship,
          concernDuration: form.concernDuration,
          tried: form.tried,
          whatHappened: form.whatHappened,
          story: form.story.trim(),
          loudestCorner: form.loudestCorner,
          sleep: form.sleep,
          stressLevel: form.stressLevel,
          whyThisWeek: form.whyThisWeek.trim(),
          startWindow: form.startWindow,
          dailyTime: form.dailyTime,
          trackingWillingness: form.trackingWillingness,
          plantBased: form.plantBased,
          medsAlignment: form.medsAlignment,
          groupsFeel: form.groupsFeel,
          winning: form.winning.trim(),
          pictureValue: form.pictureValue.trim(),
          investTier: form.investTier,
          decisionMakers: form.decisionMakers,
          foundJoel: form.foundJoel,
          watchedVideo: form.watchedVideo,
          anythingElse: form.anythingElse.trim(),
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

  const inputStyle = {};

  // ---- Thank-you screens ----
  if (result) {
    const cold = result.fitTier === 'COLD';
    return (
      <main className="min-h-screen" style={{ background: 'var(--cream, #FBF8F1)', color: 'var(--ink, #121110)' }}>
        <section style={{ maxWidth: 620, margin: '0 auto', padding: '3.5rem 1.25rem 4rem', textAlign: 'center' }}>
          <div className="text-xs font-bold uppercase" style={{ color: 'var(--clay, #B85A36)', letterSpacing: '0.14em', marginBottom: '1rem' }}>
            APPLICATION RECEIVED
          </div>
          {cold ? (
            <>
              <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 1.2, margin: '0 0 1rem' }}>
                Thank you for your honesty.
              </h1>
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 2rem' }}>
                The best next step for you today is the free community and the starter kit.
                Both meet you right where you are, and Joel is active in both.
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
                  Start with the free quiz
                </a>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 1.2, margin: '0 0 1rem' }}>
                Your application is in.
              </h1>
              <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 1.75rem' }}>
                Joel reads every word. Three steps left: watch his short welcome video, see
                the cost, and book your call.
              </p>

              {/* Step 1: the welcome video (the landing page promises it here). */}
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--line, #D8CFBD)',
                  background: '#000',
                  marginBottom: '1.5rem',
                }}
              >
                <iframe
                  src={WELCOME_VIDEO_URL}
                  title="A welcome from Joel Polley, RN"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>

              {/* Step 2: everything included, then the price. Joel-confirmed
                  contents (2026-07-17): weekly live group call, personalized
                  day-by-day protocol, private community, 1:1 access to Joel,
                  full kit stack (tracker, herb formulary, doctor sheet). No
                  invented per-item dollar values, just what she actually gets. */}
              <div
                style={{
                  maxWidth: 460,
                  margin: '0 auto 1.75rem',
                  background: '#FFFFFF',
                  border: '1px solid var(--line, #D8CFBD)',
                  borderRadius: 12,
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', marginBottom: 10 }}>
                  Everything Included
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 1.1rem', padding: 0, textAlign: 'left' }}>
                  {[
                    ['Weekly live group call with Joel', 'Every week for 90 days, real time, real questions.'],
                    ['Your personalized day-by-day protocol', 'Built around your loudest corner, not a generic plan.'],
                    ['Private community access', 'Other women doing this alongside you, every day.'],
                    ['1:1 access to Joel between calls', 'Message him directly when something comes up.'],
                    ['The full kit stack', 'Herb Formulary, BP tracker, and your Bring This To Your Doctor sheet.'],
                  ].map(([h, p]) => (
                    <li key={h} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                      <span style={{ color: 'var(--sage, #4A5D4E)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: '0.94rem', color: 'var(--ink, #121110)' }}>{h}</span>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted, #7A7061)', lineHeight: 1.5 }}>{p}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ borderTop: '1px solid var(--line, #D8CFBD)', paddingTop: '1.1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', marginBottom: 6 }}>
                    The Cost
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: SERIF, fontSize: '1.15rem', fontWeight: 600, color: 'var(--muted, #7A7061)', textDecoration: 'line-through', textDecorationColor: 'var(--clay, #B85A36)', textDecorationThickness: '2px' }}>
                      $4,997 value
                    </span>
                    <span style={{ fontFamily: SERIF, fontSize: '2rem', fontWeight: 600, color: 'var(--ink, #121110)', lineHeight: 1.2 }}>
                      $1,997
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0.4rem 0 0' }}>
                  This covers everything above for the full 90 days. Payment plans are there if you need one. You pay
                  nothing today. The call is free.
                </p>
              </div>

              {/* Step 3: book. */}
              <a
                href={FIT_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('bethere_call_booked_clicked')}
                style={{ display: 'inline-block', width: '100%', maxWidth: 380, background: 'var(--clay, #B85A36)', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none', padding: '1rem 1.4rem', borderRadius: 10 }}
              >
                Book my fit call
              </a>
              <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '44ch', margin: '1rem auto 0' }}>
                If the calendar does not work for you, Joel will reach out within 48 hours.
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

        {/* STEP 1 — About you */}
        {step === 1 && (
          <>
            <Field label="First name" error={errors.firstName}>
              <input className="bt-input" type="text" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" style={inputStyle} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="bt-input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
            </Field>
            <Field label="Phone" optional helper="For a text if your application moves forward.">
              <input className="bt-input" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="555 555 5555" />
            </Field>
            <Field label="Age range" error={errors.ageRange}>
              <OptionList name="Age range" options={AGE_OPTIONS} value={form.ageRange} onChange={(v) => set('ageRange', v)} />
            </Field>
          </>
        )}

        {/* STEP 2 — Your pressure today */}
        {step === 2 && (
          <>
            <Field label="Where does your reading usually land?" error={errors.readingRange}>
              <OptionList name="Current reading range" options={READING_OPTIONS} value={form.readingRange} onChange={(v) => set('readingRange', v)} />
            </Field>
            <Field label="Do you check at home?" error={errors.homeCheck}>
              <OptionList name="Home checking" options={HOME_CHECK_OPTIONS} value={form.homeCheck} onChange={(v) => set('homeCheck', v)} />
            </Field>
            <Field label="How many blood pressure medications are you on?" helper="Whatever the number, your doctor stays in charge of it." error={errors.medsCount}>
              <OptionList name="BP medications count" options={MEDS_OPTIONS} value={form.medsCount} onChange={(v) => set('medsCount', v)} />
            </Field>
            <Field label="How is your relationship with your doctor?" error={errors.doctorRelationship}>
              <OptionList name="Relationship with your doctor" options={DOCTOR_OPTIONS} value={form.doctorRelationship} onChange={(v) => set('doctorRelationship', v)} />
            </Field>
          </>
        )}

        {/* STEP 3 — Your story */}
        {step === 3 && (
          <>
            <Field label="How long has your pressure been a concern?" error={errors.concernDuration}>
              <OptionList name="How long a concern" options={DURATION_OPTIONS} value={form.concernDuration} onChange={(v) => set('concernDuration', v)} />
            </Field>
            <Field label="What have you tried?" helper="Check all that fit." error={errors.tried}>
              <CheckList name="What have you tried" options={TRIED_OPTIONS} values={form.tried} onToggle={toggleTried} />
            </Field>
            <Field label="What usually happened?" error={errors.whatHappened}>
              <OptionList name="What usually happened" options={HAPPENED_OPTIONS} value={form.whatHappened} onChange={(v) => set('whatHappened', v)} />
            </Field>
            <Field label="Tell Joel what is going on in your own words. What have the last two years with your health looked like?" error={errors.story}>
              <textarea className="bt-input" rows={5} style={{ resize: 'vertical', minHeight: 120 }} value={form.story} onChange={(e) => set('story', e.target.value)} placeholder="Take your time. Joel reads every word." />
            </Field>
          </>
        )}

        {/* STEP 4 — The three corners */}
        {step === 4 && (
          <>
            <Field label="Which corner feels loudest in your life right now?" error={errors.loudestCorner}>
              <OptionList name="Loudest corner" options={CORNER_OPTIONS} value={form.loudestCorner} onChange={(v) => set('loudestCorner', v)} />
            </Field>
            <Field label="How is your sleep?" error={errors.sleep}>
              <OptionList name="Sleep" options={SLEEP_OPTIONS} value={form.sleep} onChange={(v) => set('sleep', v)} />
            </Field>
            <Field label="A typical day's stress?" error={errors.stressLevel}>
              <OptionList name="Typical stress" options={STRESS_OPTIONS} value={form.stressLevel} onChange={(v) => set('stressLevel', v)} />
            </Field>
          </>
        )}

        {/* STEP 5 — Readiness */}
        {step === 5 && (
          <>
            <Field label="What made this the week you applied?" error={errors.whyThisWeek}>
              <textarea className="bt-input" rows={3} style={{ resize: 'vertical', minHeight: 88 }} value={form.whyThisWeek} onChange={(e) => set('whyThisWeek', e.target.value)} placeholder="A sentence is plenty." />
            </Field>
            <Field label="If accepted, when would you want to start?" error={errors.startWindow}>
              <OptionList name="Start window" options={START_OPTIONS} value={form.startWindow} onChange={(v) => set('startWindow', v)} />
            </Field>
            <Field label="How much time could you give this daily?" error={errors.dailyTime}>
              <OptionList name="Daily time" options={TIME_OPTIONS} value={form.dailyTime} onChange={(v) => set('dailyTime', v)} />
            </Field>
            <Field label="Willing to log morning and evening readings daily?" error={errors.trackingWillingness}>
              <OptionList name="Tracking willingness" options={TRACKING_OPTIONS} value={form.trackingWillingness} onChange={(v) => set('trackingWillingness', v)} />
            </Field>
            <Field label="How do you feel about eating more plant-based whole foods?" error={errors.plantBased}>
              <OptionList name="Plant-based foods" options={PLANT_OPTIONS} value={form.plantBased} onChange={(v) => set('plantBased', v)} />
            </Field>
          </>
        )}

        {/* STEP 6 — How we work */}
        {step === 6 && (
          <>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem', padding: '1rem 1.1rem', background: '#FFFFFF', border: '1px solid var(--sage-soft, #C5CDBF)', borderRadius: 12 }}>
              Joel coaches alongside your doctor, never instead of them. Nobody here will ever tell you
              to change a medication. Only your doctor does that.
            </p>
            <Field label="Does that sit right with you?" error={errors.medsAlignment}>
              <OptionList name="Meds alignment" options={ALIGN_OPTIONS} value={form.medsAlignment} onChange={(v) => set('medsAlignment', v)} />
            </Field>
            <Field label="How do you feel about groups?" error={errors.groupsFeel}>
              <OptionList name="Groups" options={GROUPS_OPTIONS} value={form.groupsFeel} onChange={(v) => set('groupsFeel', v)} />
            </Field>
          </>
        )}

        {/* STEP 7 — The honest question */}
        {step === 7 && (
          <>
            <Field label="If the next 90 days went perfectly, what would winning look like for you?" helper="This is the most important question on the whole application. Paint the real picture." error={errors.winning}>
              <textarea className="bt-input" rows={4} style={{ resize: 'vertical', minHeight: 100 }} value={form.winning} onChange={(e) => set('winning', e.target.value)} placeholder="Paint the picture for Joel." />
            </Field>
            <Field label="What would you say that picture is worth to you, in dollars?" helper="Whatever number is honest. Joel is not going to hold you to it, he just wants to understand how you see it." error={errors.pictureValue}>
              <input className="bt-input" type="text" inputMode="numeric" value={form.pictureValue} onChange={(e) => set('pictureValue', e.target.value)} placeholder="e.g. $50,000" />
            </Field>
            <p style={{ color: 'var(--ink-soft, #2B2824)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              Be There is a serious 90 day commitment of time and resources, built to hold that picture
              for the next 20 years, not just the next 90 days.
            </p>
            <Field label="What are you willing to invest right now to have that picture for the next 20 years?" error={errors.investTier}>
              <OptionList name="Investment tier" options={INVEST_TIER_OPTIONS} value={form.investTier} onChange={(v) => set('investTier', v)} />
            </Field>
            <Field label="Who is part of this decision?" error={errors.decisionMakers}>
              <OptionList name="Decision makers" options={DECISION_OPTIONS} value={form.decisionMakers} onChange={(v) => set('decisionMakers', v)} />
            </Field>
          </>
        )}

        {/* STEP 8 — Last things */}
        {step === 8 && (
          <>
            <Field label="How did you find Joel?" error={errors.foundJoel}>
              <OptionList name="How found Joel" options={FOUND_OPTIONS} value={form.foundJoel} onChange={(v) => set('foundJoel', v)} />
            </Field>
            <Field label="Did you watch the video on the last page?" error={errors.watchedVideo}>
              <OptionList name="Watched video" options={WATCHED_OPTIONS} value={form.watchedVideo} onChange={(v) => set('watchedVideo', v)} />
            </Field>
            <Field label="Anything else Joel should know?" optional>
              <textarea className="bt-input" rows={3} style={{ resize: 'vertical', minHeight: 80 }} value={form.anythingElse} onChange={(e) => set('anythingElse', e.target.value)} placeholder="Anything that matters that we did not ask about." />
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
