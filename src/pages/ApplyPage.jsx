// /apply - private coaching application for Joel Polley, RN.
//
// 2026-06-09: replaces the old /apply -> /1on1 redirect. One questionnaire
// for the $1,997 90-Day Group and the four 1:1 tiers (Triangle Session,
// Inner Circle, Brave Household, Pillar Year). Tier preselected from
// ?tier=<slug> query param; defaults to "ninety".
//
// POSTs JSON to /api/coaching-apply with source: 'apply-page' (the endpoint
// also still serves the legacy /cohort2 payload). No payment collected here.
// Visual language mirrors CoachingPage.jsx: paper/ink/clay/gold tokens,
// Fraunces italic display, gold hairlines, framer-motion staggered reveals,
// prefers-reduced-motion respected. Inputs are 16px+ so iOS does not zoom.

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const TIERS = [
  { slug: 'ninety', name: 'The 90-Day Personalized Group', shortName: 'the 90-Day Group', price: '$1,997', cadence: '90 days, group' },
  { slug: 'triangle', name: 'The Triangle Session', shortName: 'the Triangle Session', price: '$1,500 one-time', cadence: 'One 90-minute 1:1' },
  { slug: 'inner-circle', name: 'The Inner Circle', shortName: 'the Inner Circle', price: '$1,500/month', cadence: 'Weekly 1:1' },
  { slug: 'household', name: 'The Brave Household', shortName: 'the Brave Household', price: '$5,000/month', cadence: 'Whole family' },
  { slug: 'pillar', name: 'The Pillar Year', shortName: 'the Pillar Year', price: '$50,000/year', cadence: 'Concierge year' },
];

const AGE_OPTIONS = ['Under 45', '45-54', '55-64', '65-74', '75+'];
const DURATION_OPTIONS = ['Under a year', '1-3 years', '3-10 years', 'Longer than 10'];
const MEDS_OPTIONS = ['None', '1', '2-3', '4 or more'];
const MATERIALS_OPTIONS = ['The free quiz', 'The $17 kit', 'The Weekly Reset community', 'The books', 'Not yet'];
const START_OPTIONS = ['This week', 'Within 30 days', 'Just exploring for now'];

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SERIF = "'Fraunces', 'Times New Roman', serif";

// 2026-07-09: application-funnel VSL slot (Annie-model "watch this first" take-
// away sell). Env seam so Joel can drop a Loom/YouTube/Vimeo URL later without
// a code change; until it is a real embeddable URL, the slot renders nothing
// (no empty placeholder box on a live page). "Build around it" per Joel.
const VSL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_COACHING_VSL_URL) || '';

// Fit-call booking (the "skip the line, book now" step on the thank-you state).
// Prefer a dedicated fit-call Calendly; fall back to the diagnostic-call var the
// welcome pages already use. Only treated as real when it is a Calendly URL, so
// an unset/garbage value degrades to the "we will email you to schedule" copy.
const RAW_FIT_CALENDLY =
  (typeof import.meta !== 'undefined' && import.meta.env &&
    (import.meta.env.VITE_CALENDLY_FIT_CALL_URL || import.meta.env.VITE_CALENDLY_DIAGNOSTIC_URL)) || '';
const HAS_FIT_CALENDLY = /calendly\.com/i.test(RAW_FIT_CALENDLY);

// Turn a Loom/YouTube/Vimeo share URL into an embeddable src. Anything that
// already looks like an /embed or a direct file is passed through. Returns null
// for values we cannot safely embed, so the slot just stays hidden.
function toEmbedSrc(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const loom = u.match(/loom\.com\/(?:share|embed)\/([\w-]+)/i);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/^https:\/\/.+\.(mp4|webm|m4v)(\?|$)/i.test(u) || /\/embed\//i.test(u)) return u;
  return null;
}

// The "watch this first" video block. Renders only when VSL_URL is a real,
// embeddable URL; otherwise nothing (so the page reads clean with no video).
function VideoSlot({ label }) {
  const src = toEmbedSrc(VSL_URL);
  if (!src) return null;
  const isFile = /\.(mp4|webm|m4v)(\?|$)/i.test(src);
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {label && (
        <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: MONO }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', background: '#000' }}>
        {isFile ? (
          <video src={src} controls playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        ) : (
          <iframe
            src={src}
            title="A word from Joel Polley, RN"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        )}
      </div>
    </div>
  );
}

function GoldHairline() {
  return <div aria-hidden="true" className="apply-hairline" />;
}

/* Numbered question wrapper: mono index + uppercase label, house style. */
function Question({ index, label, helper, optional, error, children }) {
  return (
    <div style={{ marginBottom: '2rem' }} id={`q-${index}`}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.55rem' }}>
        <span style={{ fontFamily: MONO, fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.08em', fontWeight: 700 }}>
          {String(index).padStart(2, '0')}
        </span>
        <label className="text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.14em', fontFamily: MONO, lineHeight: 1.5 }}>
          {label}
          {optional && <span style={{ color: 'var(--muted)', fontWeight: 500, textTransform: 'none', letterSpacing: '0.02em' }}> (optional)</span>}
        </label>
      </div>
      {helper && (
        <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 0.6rem' }}>{helper}</p>
      )}
      {children}
      {error && (
        <p className="text-sm" style={{ color: 'var(--clay-hover)', margin: '0.45rem 0 0', fontWeight: 600 }}>{error}</p>
      )}
    </div>
  );
}

export default function ApplyPage() {
  const reduce = useReducedMotion();
  const [searchParams] = useSearchParams();

  // Tier preselection from ?tier=<slug>; unknown or missing param -> ninety.
  const tierParam = searchParams.get('tier');
  const initialTier = useMemo(
    () => (TIERS.some((t) => t.slug === tierParam) ? tierParam : 'ninety'),
    [tierParam]
  );

  const [tier, setTier] = useState(initialTier);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    ageRange: '',
    bpReading: '',
    bpDuration: '',
    bpMedsCount: '',
    materialsUsed: [],
    winning90: '',
    triedAlready: '',
    whenStart: '',
    investmentAck: false,
    anythingElse: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedTier = TIERS.find((t) => t.slug === tier) || TIERS[0];

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleMaterial = (option) =>
    setForm((prev) => ({
      ...prev,
      materialsUsed: prev.materialsUsed.includes(option)
        ? prev.materialsUsed.filter((o) => o !== option)
        : [...prev.materialsUsed, option],
    }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required.';
    if (!form.ageRange) e.ageRange = 'Select your age range.';
    if (!form.bpReading.trim()) e.bpReading = 'A best guess is fine. Even "high" helps.';
    if (!form.bpDuration) e.bpDuration = 'Select how long.';
    if (!form.bpMedsCount) e.bpMedsCount = 'Select one. "None" is a fine answer.';
    if (form.materialsUsed.length === 0) e.materialsUsed = 'Check at least one. "Not yet" counts.';
    if (!form.winning90.trim()) e.winning90 = 'A sentence or two helps me read your application well.';
    if (!form.whenStart) e.whenStart = 'Select one.';
    if (!form.investmentAck) e.investmentAck = 'Please confirm before submitting.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setSubmitError('');
    const firstKey = Object.keys(e)[0];
    if (firstKey) {
      const order = ['name', 'email', 'phone', 'ageRange', 'bpReading', 'bpDuration', 'bpMedsCount', 'materialsUsed', 'winning90', 'triedAlready', 'whenStart', 'investmentAck'];
      const idx = order.indexOf(firstKey) + 1;
      const el = document.getElementById(`q-${idx}`);
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/coaching-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tier: selectedTier.slug,
          tierName: selectedTier.name,
          tierPrice: selectedTier.price,
          source: 'apply-page',
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.ok === false) {
        setSubmitError(out.error || 'Something went wrong sending your application. Your answers are still here. Try again, or email concierge@bpquiz.com directly.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } catch {
      setSubmitError('Network error. Your answers are still here. Try again, or email concierge@bpquiz.com directly.');
      setSubmitting(false);
    }
  }

  // Hero mount stagger, mirroring CoachingPage.
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  // Scroll reveal for form sections.
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      <style>{`
        .apply-hairline {
          height: 1px;
          width: 100%;
          border: 0;
          background: linear-gradient(90deg, transparent, rgba(200, 162, 82, 0.55) 22%, rgba(200, 162, 82, 0.55) 78%, transparent);
        }
        .apply-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 1rem; /* 16px: iOS does not zoom */
          line-height: 1.5;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: #FFFFFF;
          color: var(--ink);
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
        }
        .apply-input::placeholder { color: var(--muted); opacity: 1; }
        .apply-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(200, 162, 82, 0.2);
        }
        .apply-input.apply-input-error { border-color: var(--clay); }
        select.apply-input {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1.5L7 7.5L13 1.5' stroke='%237A7061' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 42px;
        }
        .apply-tier-card {
          transition: border-color 0.3s var(--ease-out), background 0.3s var(--ease-out),
                      box-shadow 0.3s var(--ease-out), transform 0.3s var(--ease-out);
        }
        .apply-tier-card:hover { border-color: var(--gold); transform: translateY(-2px); }
        .apply-check-row {
          transition: border-color 0.3s var(--ease-out), background 0.3s var(--ease-out);
        }
        .apply-check-row:hover { border-color: var(--gold); }
        .apply-submit {
          transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), opacity 0.3s var(--ease-out);
        }
        .apply-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -12px rgba(164, 75, 40, 0.55);
        }
        .apply-submit .apply-submit-arrow { transition: transform 0.3s var(--ease-out); }
        .apply-submit:hover:not(:disabled) .apply-submit-arrow { transform: translateX(4px); }
        @media (prefers-reduced-motion: reduce) {
          .apply-tier-card:hover, .apply-submit:hover:not(:disabled) { transform: none; }
        }
      `}</style>

      {/* HERO */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div
            {...rise(0)}
            className="mb-6 text-xs font-bold uppercase"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}
          >
            PRIVATE COACHING APPLICATION
          </motion.div>
          <motion.h1
            {...rise(0.12)}
            className="leading-tight mb-5"
            style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(1.9rem, 5vw, 3.1rem)', color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            Tell me where your numbers stand.
          </motion.h1>
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduce ? 0 : 1.1, delay: 0.5, ease: EASE }}
            style={{
              transformOrigin: 'left',
              height: 1,
              width: 'min(280px, 60%)',
              background: 'linear-gradient(90deg, var(--gold), rgba(200, 162, 82, 0))',
              marginBottom: '1.5rem',
            }}
          />
          <motion.p {...rise(0.28)} className="text-lg mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '58ch' }}>
            I read every application personally, usually within 48 hours. If I can help, I will tell you exactly how. If I cannot, I will tell you that too, and point you somewhere honest.
          </motion.p>
          <motion.p {...rise(0.38)} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--ink)' }}>
            Joel Polley, RN
          </motion.p>

          {/* "Watch this first" VSL slot (renders only when a video URL is set). */}
          <motion.div {...rise(0.48)} style={{ marginTop: '2.25rem' }}>
            <VideoSlot label="Watch this first" />
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {submitted ? (
        /* THANK-YOU STATE — Annie-model page 3: confirmation + book-now-to-skip
           -the-line + the 48-hour expectation. */
        <section className="py-16 sm:py-20" style={{ background: 'var(--paper)' }}>
          <div className="max-w-2xl mx-auto px-5">
            <motion.div {...rise(0)} className="text-center">
              <div
                aria-hidden="true"
                style={{ height: 1, width: 'min(220px, 60%)', margin: '0 auto 1.75rem', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
              />
              <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: MONO }}>
                Application received
              </div>
              <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', color: 'var(--ink)', marginBottom: '1.1rem' }}>
                You are on my desk.
              </h2>
              <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: '48ch', margin: '0 auto 2rem' }}>
                I read every application personally. You will hear from me within 48 hours, usually sooner. Watch your inbox, and your spam folder, for joel@bpquiz.com.
              </p>
            </motion.div>

            {/* Optional video (same slot as the hero). */}
            <motion.div {...rise(0.1)} style={{ marginBottom: '2rem' }}>
              <VideoSlot label="While you wait, watch this" />
            </motion.div>

            {/* Book now to skip the line. Renders the fit-call calendar when a
                Calendly URL is configured; otherwise sets the "I will email you
                to schedule" expectation so there is never a dead control. */}
            <motion.div {...rise(0.16)} style={{ background: 'var(--paper-warm)', border: '1px solid var(--line)', borderRadius: 14, padding: 'clamp(1.4rem, 3vw, 2rem)', maxWidth: 620, margin: '0 auto' }}>
              <div className="mb-2 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: MONO }}>
                Want to move faster?
              </div>
              <h3 style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)', color: 'var(--ink)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
                Skip the line. Book your fit call now.
              </h3>
              {HAS_FIT_CALENDLY ? (
                <>
                  <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: '1.1rem' }}>
                    Booking a time does not guarantee a spot, but it does move your application to the top of my stack, and it means we talk on the phone instead of by email. Pick a time that works for you.
                  </p>
                  <a
                    href={RAW_FIT_CALENDLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apply-submit"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clay-hover)', color: '#FFFFFF', fontWeight: 700, textDecoration: 'none', padding: '0.85rem 1.5rem', borderRadius: 10 }}
                  >
                    Pick my fit-call time
                    <ArrowRight size={16} className="apply-submit-arrow" />
                  </a>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
                  When I write back within the next 48 hours, my note includes a link to grab a fit-call time straight on my calendar. No need to do anything now, your application is already in front of me.
                </p>
              )}
            </motion.div>

            <div className="text-center" style={{ marginTop: '2rem' }}>
              <Link
                to="/coaching"
                className="text-sm font-semibold"
                style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Back to the coaching page
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* THE FORM */
        <form onSubmit={handleSubmit} noValidate>

          {/* TIER SELECTION */}
          <section className="py-14" style={{ background: 'var(--paper)' }}>
            <div className="max-w-2xl mx-auto px-5">
              <motion.div {...reveal(0)}>
                <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}>
                  WHICH PROGRAM
                </div>
                <h2 className="mb-6" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', color: 'var(--ink)', lineHeight: 1.2 }}>
                  What are you applying for?
                </h2>
              </motion.div>
              <motion.div {...reveal(0.08)} role="radiogroup" aria-label="Program tier" style={{ display: 'grid', gap: '0.75rem' }}>
                {TIERS.map((t) => {
                  const selected = tier === t.slug;
                  return (
                    <label
                      key={t.slug}
                      className="apply-tier-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        padding: '16px 18px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: selected ? 'var(--cream)' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: selected ? 'var(--clay)' : 'var(--line)',
                        boxShadow: selected ? '0 0 0 1px var(--clay)' : 'none',
                      }}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={t.slug}
                        checked={selected}
                        onChange={() => setTier(t.slug)}
                        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                      />
                      <span
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: `2px solid ${selected ? 'var(--clay)' : 'var(--line)'}`,
                          background: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clay)' }} />}
                      </span>
                      <span style={{ flexGrow: 1, minWidth: 0 }}>
                        <span className="block text-base font-semibold" style={{ color: 'var(--ink)', lineHeight: 1.3 }}>
                          {t.name}
                        </span>
                        <span className="block text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.06em' }}>
                          {t.cadence.toUpperCase()}
                        </span>
                      </span>
                      <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.15rem', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {t.price}
                      </span>
                    </label>
                  );
                })}
              </motion.div>
            </div>
          </section>

          <GoldHairline />

          {/* QUESTIONS */}
          <section className="py-14" style={{ background: 'var(--paper)' }}>
            <div className="max-w-2xl mx-auto px-5">

              <motion.div {...reveal(0)}>
                <Question index={1} label="Full name" error={errors.name}>
                  <input
                    className={`apply-input${errors.name ? ' apply-input-error' : ''}`}
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="First and last"
                  />
                </Question>

                <Question index={2} label="Email" error={errors.email}>
                  <input
                    className={`apply-input${errors.email ? ' apply-input-error' : ''}`}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@email.com"
                  />
                </Question>

                <Question index={3} label="Phone" optional helper="For a text if your application is accepted.">
                  <input
                    className="apply-input"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="555-555-5555"
                  />
                </Question>

                <Question index={4} label="Age range" error={errors.ageRange}>
                  <select
                    className={`apply-input${errors.ageRange ? ' apply-input-error' : ''}`}
                    value={form.ageRange}
                    onChange={(e) => set('ageRange', e.target.value)}
                  >
                    <option value="">Select one</option>
                    {AGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Question>
              </motion.div>

              <motion.div {...reveal(0.05)}>
                <Question index={5} label="Your most recent blood pressure reading, best guess is fine" error={errors.bpReading || errors.bpDuration}>
                  <input
                    className={`apply-input${errors.bpReading ? ' apply-input-error' : ''}`}
                    type="text"
                    value={form.bpReading}
                    onChange={(e) => set('bpReading', e.target.value)}
                    placeholder="e.g. 148/92"
                  />
                  <div style={{ marginTop: '0.85rem' }}>
                    <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.12em', fontFamily: MONO }}>
                      How long has it been elevated?
                    </div>
                    <select
                      className={`apply-input${errors.bpDuration ? ' apply-input-error' : ''}`}
                      value={form.bpDuration}
                      onChange={(e) => set('bpDuration', e.target.value)}
                    >
                      <option value="">Select one</option>
                      {DURATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </Question>

                <Question
                  index={6}
                  label="How many blood pressure medications are you currently on?"
                  helper="Whatever the number, your prescriber stays in charge of it. We work alongside your doctor, never instead of."
                  error={errors.bpMedsCount}
                >
                  <select
                    className={`apply-input${errors.bpMedsCount ? ' apply-input-error' : ''}`}
                    value={form.bpMedsCount}
                    onChange={(e) => set('bpMedsCount', e.target.value)}
                  >
                    <option value="">Select one</option>
                    {MEDS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Question>

                <Question index={7} label="Have you used any BraveWorks materials yet?" error={errors.materialsUsed}>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {MATERIALS_OPTIONS.map((o) => {
                      const checked = form.materialsUsed.includes(o);
                      return (
                        <label
                          key={o}
                          className="apply-check-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.7rem',
                            padding: '13px 16px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: checked ? 'var(--cream)' : '#FFFFFF',
                            border: `1px solid ${checked ? 'var(--sage-deep)' : 'var(--line)'}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMaterial(o)}
                            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                          />
                          <span
                            aria-hidden="true"
                            style={{
                              flexShrink: 0,
                              width: 19,
                              height: 19,
                              borderRadius: 5,
                              border: `1.5px solid ${checked ? 'var(--sage-deep)' : 'var(--line)'}`,
                              background: checked ? 'var(--sage-deep)' : '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {checked && <Check size={13} strokeWidth={3} style={{ color: '#FFFFFF' }} />}
                          </span>
                          <span className="text-base" style={{ color: 'var(--ink)', fontWeight: checked ? 600 : 400, lineHeight: 1.4 }}>{o}</span>
                        </label>
                      );
                    })}
                  </div>
                </Question>
              </motion.div>

              <motion.div {...reveal(0.05)}>
                <Question index={8} label="Describe what winning looks like for you 90 days from now." error={errors.winning90}>
                  <textarea
                    className={`apply-input${errors.winning90 ? ' apply-input-error' : ''}`}
                    rows={3}
                    style={{ resize: 'vertical', minHeight: 96 }}
                    value={form.winning90}
                    onChange={(e) => set('winning90', e.target.value)}
                    placeholder="Specific numbers, fewer pills with your doctor's blessing, energy back, sleeping through the night..."
                  />
                </Question>

                <Question index={9} label="What have you already tried?" optional>
                  <textarea
                    className="apply-input"
                    rows={2}
                    style={{ resize: 'vertical', minHeight: 72 }}
                    value={form.triedAlready}
                    onChange={(e) => set('triedAlready', e.target.value)}
                    placeholder="Diets, supplements, specialists, programs, anything that did or did not move the needle..."
                  />
                </Question>

                <Question index={10} label="If accepted, when do you want to start?" error={errors.whenStart}>
                  <select
                    className={`apply-input${errors.whenStart ? ' apply-input-error' : ''}`}
                    value={form.whenStart}
                    onChange={(e) => set('whenStart', e.target.value)}
                  >
                    <option value="">Select one</option>
                    {START_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Question>

                <Question index={11} label="Investment acknowledgment" error={errors.investmentAck}>
                  <label
                    className="apply-check-row"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.8rem',
                      padding: '16px 18px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: form.investmentAck ? 'var(--cream)' : '#FFFFFF',
                      border: `1px solid ${form.investmentAck ? 'var(--clay)' : errors.investmentAck ? 'var(--clay)' : 'var(--line)'}`,
                      boxShadow: form.investmentAck ? '0 0 0 1px var(--clay)' : 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.investmentAck}
                      onChange={(e) => set('investmentAck', e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        marginTop: 2,
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: `1.5px solid ${form.investmentAck ? 'var(--clay)' : 'var(--line)'}`,
                        background: form.investmentAck ? 'var(--clay)' : '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {form.investmentAck && <Check size={13} strokeWidth={3} style={{ color: '#FFFFFF' }} />}
                    </span>
                    <span className="text-base" style={{ color: 'var(--ink)', lineHeight: 1.55 }}>
                      I understand the investment for <strong>{selectedTier.name}</strong> is <strong>{selectedTier.price}</strong>, and I am ready to move on it if accepted.
                    </span>
                  </label>
                </Question>

                <Question index={12} label="Anything else I should know?" optional>
                  <textarea
                    className="apply-input"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: 80 }}
                    value={form.anythingElse}
                    onChange={(e) => set('anythingElse', e.target.value)}
                    placeholder="Anything I did not ask about that matters..."
                  />
                </Question>
              </motion.div>

              {/* SUBMIT */}
              <motion.div {...reveal(0.05)}>
                {submitError && (
                  <div
                    role="alert"
                    className="text-sm mb-4"
                    style={{
                      padding: '13px 16px',
                      background: '#FBEAE2',
                      border: '1px solid var(--clay)',
                      borderRadius: 10,
                      color: 'var(--clay-hover)',
                      lineHeight: 1.55,
                      fontWeight: 600,
                    }}
                  >
                    {submitError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="apply-submit inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-lg font-bold text-base"
                  style={{
                    background: 'var(--clay-hover)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.65 : 1,
                  }}
                >
                  {submitting ? 'Sending your application...' : 'Submit my application'}
                  {!submitting && <ArrowRight size={17} className="apply-submit-arrow" />}
                </button>
                <p className="text-xs text-center mt-4" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  No payment is collected here. I review first, then we talk.
                </p>
              </motion.div>

            </div>
          </section>
        </form>
      )}

      <GoldHairline />

      {/* Disclaimer */}
      <section className="py-10 px-5" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '64ch', margin: '0 auto' }}>
            All work with Joel Polley, RN, is education-based nursing consultation. It is not diagnosis, prescription, or a replacement for your physician. Any protocol we discuss works alongside your doctor, never instead of them. Never start, stop, or change a prescribed medication without your prescribing physician's supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
