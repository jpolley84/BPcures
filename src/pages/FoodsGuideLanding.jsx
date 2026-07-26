// FoodsGuideLanding (codename foods101-v1) - PAGE 1 of the "101 Foods"
// squeeze funnel. Replaces TriggerLanding as homepage variant B and also
// serves the direct route /101foods.
//
// Brunson lead funnel, step 1: this page has exactly ONE job, capture the
// email. No site nav, no footer menu, no competing offer above the fold.
// The only outbound links are the masterclass banner (owner mandate, and the
// measured leak via masterclass_banner_click), the legally required
// Terms/Privacy/Disclaimer line, and one buy-ready text link at the very
// bottom that preserves the 2026-07-22 "skip the quiz" door.
//
// Hook: the number (101) plus the specificity (foods AND herbs, for blood
// pressure). Story: the nurse who watched people do everything right.
// Offer: the guide free now, the sequence for $17 on the thank-you page.
//
// Visual system inherited from TriggerLanding (cream / clay / sage tokens,
// .bpq-cta rules, bpqUp visible-by-default entrance, reduced-motion block).
//
// Standing rules honored: ZERO em dashes in visible copy (and none in this
// file at all), NEWSTART clean (plant foods, kitchen herbs, caffeine free
// teas only), no invented proof (20 yrs ICU/ER RN and 550,000+ followers are
// the only numbers, both previously verified by Joel), educational verbs
// only (supports / steadies / helps), never cure or treat.
//
// Consent: this form does TWO things, so it discloses both before the address
// is taken. The payload sends autoMasterclass: true, which registers the
// address for the free Monday class and sends a second email. The micro-copy
// under the CTA says so. Do not quietly widen what the form does without
// widening that sentence at the same time.
//
// The compliance footer is copied verbatim from variant A (CheckoutPage.jsx
// :1061 to :1067). The audience is mostly ON blood pressure medication, so
// the "never start, stop, or adjust medication without your doctor" line is
// mandatory, and keeping it identical across arms keeps the A/B honest.
//
// Props: showBanner - HomeSplit already renders MasterclassBanner above both
// A/B variants, so it passes showBanner={false}. The direct /101foods route
// renders the banner itself (default true).
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MasterclassBanner from '../components/MasterclassBanner';
import { track, identify } from '../utils/analytics.js';

const FUNNEL_VERSION = 'foods101-v1';
const CTA_LABEL = 'YES! Send Me My 101 Foods Guide';
const BUSY_LABEL = 'Sending your guide...';
const THANKS_ROUTE = '/101foods-thanks';

/* ─── tokens (inherited, not invented) ─────────────────────────────── */

const wrap = {
  minHeight: '100vh',
  background: 'var(--cream, #FBF8F1)',
  color: 'var(--ink, #121110)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

// Top padding is 1rem, not the 1.75rem in the spec sketch: the live
// MasterclassBanner measures 79px at 390px (it wraps), not the 44px the fold
// budget assumed, and the wordmark header is an addition.
//
// FOLD TARGET: 390 x 659, NOT 390 x 844. 844 is the full logical screen of an
// iPhone 12/13/14 with zero browser chrome, which no real visitor ever sees.
// Safari on load shows about 659px with the address bar expanded, and about
// 745px once it collapses. Budget against 659 and measure at 390x659 and
// 375x667. The email input and the submit button both have to clear it.
const shell = {
  maxWidth: 640,
  margin: '0 auto',
  padding: '1rem 1.25rem 2.5rem',
};

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  background: 'var(--sage-soft, #C5CDBF)',
  padding: '0.32rem 0.7rem',
  borderRadius: 999,
  marginBottom: '0.45rem',
  lineHeight: 1.25,
};

const h1Style = {
  ...serif,
  fontSize: 'clamp(1.75rem, 6.2vw, 2.45rem)',
  lineHeight: 1.08, // tightened from 1.14 for the 659px fold budget; do not
  // go below this, the descenders in "Steady Blood Pressure" need the room
  letterSpacing: '-0.01em',
  margin: '0 0 0.5rem',
};

const subStyle = {
  fontSize: '0.9rem',
  lineHeight: 1.45,
  color: 'var(--ink-soft, #2B2824)',
  maxWidth: '42ch',
  margin: '0 0 0.5rem',
};

const ctaStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  minHeight: 54, // comfortably over the 48px touch-target floor
  padding: '0.7rem 1.1rem',
  background: 'var(--clay, #B85A36)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1.2,
  boxShadow: '0 8px 22px rgba(184, 90, 54, 0.32)',
};

const inputStyle = {
  display: 'block',
  width: '100%',
  minHeight: 50,
  padding: '0.75rem 0.9rem',
  fontSize: 16, // 16px exactly: anything smaller triggers the iOS zoom
  fontFamily: 'inherit',
  color: 'var(--ink, #121110)',
  background: '#fff',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 10,
  boxSizing: 'border-box',
};

const errStyle = {
  margin: '0.35rem 0 0',
  fontSize: '0.82rem',
  lineHeight: 1.4,
  fontWeight: 600,
  color: 'var(--clay, #B85A36)',
};

const labelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  marginBottom: '0.7rem',
};

/* ─── copy ─────────────────────────────────────────────────────────── */

// Three bullets, not four. The fourth cost 41px of fold budget and the row
// is floored by the cover art anyway, so the fourth bought nothing.
const PROBLEMS = [
  'You take the pills. The numbers still climb.',
  'You were told to cut salt. Nobody said what to eat instead.',
  'Seven minutes with the doctor, and half of it is the cuff.',
];

// SOURCE OF TRUTH: the ten .sectionhead h2 + .range pairs in
// content/101-foods/101-foods-bp.html (lines 665, 739, 866, 958, 1032, 1093,
// 1183, 1270, 1326, 1368). These names and counts were read off that file,
// not invented to hit a total. If the guide is re-cut, re-read the .range
// lines and update here, or this table starts lying about the artifact.
// Item ranges are noted so the arithmetic can be re-checked in one pass.
const GUIDE_SECTIONS = [
  ['The Foundation Ten', 10],                          // items 1 to 10
  ['Greens and vegetables', 19],                       // 11 to 29
  ['Fruits and sweet plants', 13],                     // 30 to 42
  ['Beans, lentils and soy', 10],                      // 43 to 52
  ['Grains and smart carbs', 8],                       // 53 to 60
  ['Nuts, seeds and good fats', 12],                   // 61 to 72
  ['Kitchen herbs and spices', 12],                    // 73 to 84
  ['Caffeine free drinks and infusions', 7],           // 85 to 91
  ['Ferments, sea vegetables and flavour builders', 5], // 92 to 96
  ['Herbs to ask your prescriber about first', 5],     // 97 to 101
];

const TRUST_CHIPS = [
  { num: '20 Yrs', label: 'ICU & ER Nurse' },
  { num: '550,000+', label: 'Follow His Teaching' },
  { num: 'Free', label: '101 Foods Guide' },
];

/* ─── helpers ──────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readUtm() {
  const empty = { utm_source: '', utm_medium: '', utm_campaign: '' };
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      utm_source: q.get('utm_source') || '',
      utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '',
    };
  } catch {
    return empty;
  }
}

// Base props ride on every event this page fires, so no event can be
// orphaned from the arm it belongs to.
//
// Deliberately NO utm_* here. posthog-js already attaches the session's
// campaign params to every event; spreading readUtm() in would overwrite
// those with empty strings whenever this particular URL has no utm on it,
// which is exactly how campaign attribution died before. readUtm() is kept
// for the two places that genuinely need an explicit value: the /api/lead
// -magnet payload and buildTags().
function baseProps() {
  let entry = 'direct';
  let viewportW = 0;
  try {
    entry = window.location.pathname === '/' ? 'homepage_b' : 'direct';
    viewportW = window.innerWidth || 0;
  } catch { /* noop */ }
  return { funnel_version: FUNNEL_VERSION, entry, viewport_w: viewportW };
}

function Check() {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'var(--sage, #4A5D4E)',
        color: '#fff',
        fontSize: '0.62rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
      }}
    >
      ✓
    </span>
  );
}

// The cover art is produced by the guide build (public/images/foods101-cover
// .webp + .png). Until that asset lands, onError swaps in a CSS drawn stand
// in with the same footprint, so the fold never breaks on a 404.
function GuideCover() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className="bpq-cover"
        style={{
          flexShrink: 0,
          width: 96,
          height: 124,
          borderRadius: 6,
          border: '1px solid var(--line, #D8CFBD)',
          background: 'var(--cream, #FBF8F1)',
          boxShadow: '6px 8px 18px rgba(18, 17, 16, 0.18)',
          transform: 'rotate(-2deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '0.5rem',
          textAlign: 'center',
        }}
      >
        <span style={{ ...serif, fontStyle: 'italic', fontSize: '2rem', lineHeight: 1, color: 'var(--clay, #B85A36)' }}>
          101
        </span>
        <span style={{ fontSize: '0.52rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted, #7A7061)', lineHeight: 1.3 }}>
          Foods And Herbs
        </span>
      </div>
    );
  }

  return (
    <picture style={{ flexShrink: 0 }}>
      <source srcSet="/images/foods101-cover.webp" type="image/webp" />
      <img
        src="/images/foods101-cover.png"
        className="bpq-cover"
        alt="101 Foods And Herbs That Help Steady Blood Pressure, a free guide by Annie Chitate, RN and Joel Polley, RN"
        width="96"
        height="124"
        fetchPriority="high"
        onError={() => setFailed(true)}
        style={{
          display: 'block',
          width: 96,
          height: 'auto',
          borderRadius: 6,
          border: '1px solid var(--line, #D8CFBD)',
          boxShadow: '6px 8px 18px rgba(18, 17, 16, 0.18)',
          transform: 'rotate(-2deg)',
        }}
      />
    </picture>
  );
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function FoodsGuideLanding({ showBanner = true }) {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null); // { field, msg }
  const [busy, setBusy] = useState(false);
  const [showBar, setShowBar] = useState(false);

  const formRef = useRef(null);
  const emailRef = useRef(null);
  const nameRef = useRef(null);
  const heroRef = useRef(null);
  const focusFiredRef = useRef(false);
  // Which CTA sent the visitor to the form last. The form itself lives in
  // the fold, so 'fold' is the honest default; the scroll CTAs overwrite it
  // and that is what gets attributed on submit.
  const positionRef = useRef('fold');

  // No registerSuperProps({ funnel_version }) here on purpose. posthog
  // .register writes a PERSISTENT device level super property (about a year),
  // so it would stamp foods101-v1 on every later event that device ever
  // fires, including annie-v2 pages. baseProps() already puts funnel_version
  // on every event this page sends, so the register call bought nothing and
  // cost accuracy everywhere else.
  useEffect(() => {
    let referrer = '';
    try { referrer = document.referrer || ''; } catch { /* noop */ }
    track('foods101_landing_viewed', { ...baseProps(), layout: 'squeeze-v1', referrer });
  }, []);

  // Sticky mobile CTA bar once the hero scrolls away. Mobile only in CSS.
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !heroRef.current) {
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);

  function onFieldFocus(field) {
    if (focusFiredRef.current) return;
    focusFiredRef.current = true;
    track('foods101_form_focused', { ...baseProps(), field });
  }

  function jumpToForm(position) {
    positionRef.current = position;
    let smooth = true;
    try {
      smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch { /* noop */ }
    try {
      formRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    } catch { /* noop */ }
    window.setTimeout(() => {
      try { emailRef.current?.focus({ preventScroll: true }); } catch { /* noop */ }
    }, smooth ? 420 : 0);
  }

  function buildTags() {
    let tags = ['foods101', 'no-quiz'];
    try {
      const q = new URLSearchParams(window.location.search);
      tags = tags.concat(
        ['utm_source', 'utm_medium', 'utm_campaign']
          .map((k) => (q.get(k) ? `${k.replace('utm_', '')}-${q.get(k)}` : null))
          .filter(Boolean),
      );
    } catch { /* noop */ }
    return tags;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    const cleanName = firstName.trim();
    const cleanEmail = email.trim();
    const base = baseProps();

    if (!cleanName) {
      setError({ field: 'firstName', msg: 'Please add your first name so Joel knows who to write to.' });
      track('foods101_optin_validation_failed', { ...base, reason: 'name_missing' });
      try { nameRef.current?.focus(); } catch { /* noop */ }
      return;
    }
    if (!cleanEmail) {
      setError({ field: 'email', msg: 'Please add your email so we know where to send the guide.' });
      track('foods101_optin_validation_failed', { ...base, reason: 'email_missing' });
      try { emailRef.current?.focus(); } catch { /* noop */ }
      return;
    }
    // The regex rejects whitespace, which covers CR and LF header injection.
    if (!EMAIL_RE.test(cleanEmail) || /[\r\n]/.test(cleanEmail)) {
      setError({ field: 'email', msg: 'That email does not look right. Please check it and try again.' });
      track('foods101_optin_validation_failed', { ...base, reason: 'email_format' });
      try { emailRef.current?.focus(); } catch { /* noop */ }
      return;
    }

    setError(null);
    setBusy(true);

    const position = positionRef.current;
    track('foods101_optin_submitted', { ...base, has_name: Boolean(cleanName), position });
    identify(cleanEmail, { name: cleanName });

    const payload = JSON.stringify({
      email: cleanEmail,
      name: cleanName,
      magnet: 'foods101',
      source: 'foods101-squeeze',
      autoMasterclass: true,
      tags: buildTags(),
      utm: readUtm(),
    });

    const post = () =>
      fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

    const startedAt = Date.now();
    let res = await post().catch(() => null);
    if (!res || !res.ok) {
      res = await post().catch(() => null);
    }

    if (!res || !res.ok) {
      // Never trap them on a dead form: the OTO is where the money is, so
      // the thank-you page still loads and offers a resend.
      track('foods101_optin_failed', {
        ...base,
        stage: res ? 'server' : 'network',
        http_status: res ? res.status : 0,
      });
      // Handed to the thank-you page so its resend field prefills instead of
      // making a 70 year old retype her address. Deliberately NOT the
      // bpq_foods101 key, which means "this person really did opt in".
      // `entry` rides along because the thank-you page sits at
      // /101foods-thanks and can never work out which arm sent it.
      try {
        sessionStorage.setItem(
          'bpq_foods101_retry',
          JSON.stringify({ email: cleanEmail, firstName: cleanName, at: Date.now(), entry: base.entry }),
        );
      } catch { /* private mode */ }
      setBusy(false);
      navigate(`${THANKS_ROUTE}?capture=failed`);
      return;
    }

    let data = {};
    try { data = await res.json(); } catch { /* tolerate an empty body */ }

    try { localStorage.setItem('bwbp_lead_email', cleanEmail); } catch { /* private mode */ }
    try {
      sessionStorage.setItem(
        'bpq_foods101',
        JSON.stringify({ email: cleanEmail, firstName: cleanName, at: Date.now(), entry: base.entry }),
      );
    } catch { /* private mode */ }

    track('foods101_optin_succeeded', {
      ...base,
      deduped: Boolean(data.deduped),
      // Suppressed means a previously unsubscribed address: the API returns
      // 200 and routes to ?capture=failed, but nothing broke and no email
      // went out. Without this prop those look identical to real failures.
      suppressed: Boolean(data.suppressed),
      email_sent: Boolean(data.emailSent),
      masterclass_registered: Boolean(data.masterclass && data.masterclass.registered),
      masterclass_already: Boolean(data.masterclass && data.masterclass.already),
      ms: Date.now() - startedAt,
    });

    setBusy(false);
    // Router state, not just sessionStorage: the thank-you page must be able
    // to tell a real opt-in from a cold direct hit even when Web Storage is
    // blocked (private mode, in app browsers), because it decides whether to
    // claim "your guide is sent" on the strength of it.
    const dest = typeof data.redirect === 'string' && data.redirect ? data.redirect : THANKS_ROUTE;
    navigate(dest, { state: { optin: true, email: cleanEmail, firstName: cleanName } });
  }

  function onSkipToKit() {
    track('foods101_skip_optin_clicked', { ...baseProps(), value: 17, corner: 'stress' });
  }

  return (
    <div style={wrap}>
      <style>{`
        @keyframes bpqUp { from { opacity: 0; transform: translateY(22px); } }
        [data-bpqrv] { animation: bpqUp .7s cubic-bezier(0.22,1,0.36,1) backwards; }
        .bpq-cta { transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
        .bpq-cta:hover { background: var(--clay-hover, #A44B28); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(184, 90, 54, 0.38); }
        .bpq-cta:focus-visible { outline: 3px solid var(--sage-deep, #2E3A30); outline-offset: 3px; }
        .bpq-cta[disabled] { opacity: .72; cursor: progress; transform: none; }
        .bpq-fold-row { display: flex; gap: 0.9rem; align-items: flex-start; }
        .bpq-field { width: 100%; }
        .bpq-field input:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 1px; border-color: var(--clay, #B85A36); }
        .bpq-field input::placeholder { color: var(--muted, #7A7061); opacity: 1; }
        .bpq-textlink { color: var(--clay, #B85A36); font-weight: 700; text-decoration: underline; }
        .bpq-stickybar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: none;
          background: rgba(46, 58, 48, 0.97); backdrop-filter: blur(8px);
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          transform: translateY(110%); transition: transform .4s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 -8px 30px rgba(18, 17, 16, 0.3);
        }
        .bpq-stickybar.show { transform: translateY(0); }
        .bpq-stickybar button {
          display: block; width: 100%; max-width: 520px; margin: 0 auto;
          background: var(--clay, #B85A36); color: #fff; font-family: inherit;
          font-weight: 700; font-size: 1rem; min-height: 48px; padding: 13px 20px;
          border-radius: 999px; border: none; cursor: pointer;
        }
        @media (max-width: 720px) { .bpq-stickybar { display: block; } }
        @media (prefers-reduced-motion: reduce) {
          [data-bpqrv], .bpq-cta, .bpq-stickybar { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>

      {showBanner && <MasterclassBanner />}

      <div style={shell}>
        {/* Wordmark only. A squeeze page carries no nav, so this is text,
            not a link: there is nowhere to go but the form. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingBottom: '0.3rem',
            marginBottom: '0.35rem',
            borderBottom: '1px solid var(--line-soft, #E8E1D1)',
          }}
        >
          <span style={{ ...serif, fontSize: '0.85rem', lineHeight: 1.2, color: 'var(--sage-deep, #2E3A30)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
            BraveWorks RN
          </span>
          <span style={{ fontSize: '0.68rem', lineHeight: 1.2, fontWeight: 600, color: 'var(--muted, #7A7061)' }}>
            Joel Polley, RN
          </span>
        </div>

        {/* ─── FOLD ─────────────────────────────────────────────── */}
        <div ref={heroRef}>
          <span style={eyebrowStyle}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
            Free Guide · From A 20 Year ICU And ER Nurse
          </span>

          <h1 style={h1Style}>
            <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>101</em> Foods And Herbs
            That Help Steady Blood Pressure
          </h1>

          <p style={subStyle}>
            The plant foods, kitchen herbs, and caffeine free teas a nurse would point to if he had
            twenty minutes with you and nothing to sell. Most of it is already at your grocery store.
          </p>

          {/* Cover and problem bullets sit side by side even at 390px. The
              fold contract depends on this row NOT stacking. Row height is
              floored by the cover (about 127px), so three bullets is the
              efficient count: a fourth adds height, a second saves nothing. */}
          <div className="bpq-fold-row" style={{ margin: '0 0 0.55rem' }}>
            <GuideCover />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: '1 1 0', minWidth: 0 }}>
              {PROBLEMS.map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    gap: '0.45rem',
                    alignItems: 'flex-start',
                    fontSize: '0.8rem',
                    lineHeight: 1.35,
                    color: 'var(--ink-soft, #2B2824)',
                    marginBottom: '0.42rem',
                  }}
                >
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── The form. One job. ─────────────────────────────── */}
          <form
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            style={{
              background: '#fff',
              border: '1px solid var(--line, #D8CFBD)',
              borderRadius: 12,
              padding: '0.7rem',
            }}
          >
            <div className="bpq-field" style={{ marginBottom: '0.4rem' }}>
              <label htmlFor="foods101-name" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                First name
              </label>
              <input
                id="foods101-name"
                ref={nameRef}
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                required
                onFocus={() => onFieldFocus('firstName')}
                onChange={(ev) => { setFirstName(ev.target.value); if (error && error.field === 'firstName') setError(null); }}
                aria-invalid={error && error.field === 'firstName' ? 'true' : undefined}
                aria-describedby={error && error.field === 'firstName' ? 'foods101-err' : undefined}
                style={{
                  ...inputStyle,
                  borderColor: error && error.field === 'firstName' ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)',
                }}
              />
              {error && error.field === 'firstName' && (
                <p id="foods101-err" role="alert" style={errStyle}>{error.msg}</p>
              )}
            </div>

            <div className="bpq-field" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="foods101-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                Your best email
              </label>
              <input
                id="foods101-email"
                ref={emailRef}
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                placeholder="Your best email"
                value={email}
                required
                onFocus={() => onFieldFocus('email')}
                onChange={(ev) => { setEmail(ev.target.value); if (error && error.field === 'email') setError(null); }}
                aria-invalid={error && error.field === 'email' ? 'true' : undefined}
                aria-describedby={error && error.field === 'email' ? 'foods101-err' : undefined}
                style={{
                  ...inputStyle,
                  borderColor: error && error.field === 'email' ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)',
                }}
              />
              {error && error.field === 'email' && (
                <p id="foods101-err" role="alert" style={errStyle}>{error.msg}</p>
              )}
            </div>

            <button type="submit" className="bpq-cta" style={ctaStyle} disabled={busy} aria-busy={busy}>
              {busy ? BUSY_LABEL : CTA_LABEL}
              {!busy && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          {/* Consent disclosure. Submitting this form ALSO registers the
              address for the free Monday class (autoMasterclass: true in the
              onSubmit payload) and sends a second email. That has to be said
              here, before the address is taken, not on the thank-you page
              afterwards. Do not promise an unsubscribe the seat emails do
              not carry. */}
          <p style={{ textAlign: 'center', fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--muted, #7A7061)', margin: '0.6rem 0 0' }}>
            Free. In your inbox in about a minute. Nothing to buy. You also get a free seat at
            Monday&apos;s live class, Beyond the Cuff, in a second email.
          </p>
        </div>

        {/* ─── What is inside ───────────────────────────────────── */}
        <div
          data-bpqrv
          style={{
            background: 'var(--paper-warm, #EFE8DB)',
            borderRadius: 12,
            padding: '1.15rem 1.15rem',
            margin: '1.5rem 0 1rem',
          }}
        >
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '46ch', margin: '0 auto 1rem' }}>
            Inside: 101 everyday plant foods, kitchen herbs, and caffeine free teas that support
            healthy blood pressure, grouped so you know exactly what goes in the cart this week.
          </p>

          <div style={{ ...labelStyle, textAlign: 'center', marginBottom: '0.6rem' }}>What is inside the guide</div>
          <ul style={{ listStyle: 'none', margin: '0 0 0.9rem', padding: 0 }}>
            {GUIDE_SECTIONS.map(([name, count]) => (
              <li
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'var(--ink-soft, #2B2824)',
                  padding: '0.32rem 0',
                  borderBottom: '1px dashed var(--line, #D8CFBD)',
                }}
              >
                <span style={{ flex: '1 1 auto' }}>{name}</span>
                <span style={{ flexShrink: 0, fontWeight: 700, color: 'var(--sage-deep, #2E3A30)' }}>{count}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            Plus a ten day starter that names the single item to add on each day, beginning with
            spinach, water and oats. And a page to read before you change anything, on what to ask
            your prescriber first.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--muted, #7A7061)', margin: '0 0 1.5rem' }}>
          Your information is never shared with anyone. Every guide email carries a one click
          unsubscribe link.
        </p>

        {/* ─── Trust band: real numbers only ────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.5rem',
            background: 'var(--sage-deep, #2E3A30)',
            borderRadius: 12,
            padding: '1rem 1.1rem',
            marginBottom: '1.5rem',
          }}
        >
          {TRUST_CHIPS.map((chip, i) => (
            <div
              key={chip.label}
              style={{
                flex: 1,
                textAlign: 'center',
                borderRight: i < TRUST_CHIPS.length - 1 ? '1px solid rgba(251, 248, 241, 0.15)' : 'none',
              }}
            >
              <span style={{ display: 'block', ...serif, fontWeight: 600, fontSize: '1.1rem', color: 'var(--cream, #FBF8F1)', lineHeight: 1.2 }}>
                {chip.num}
              </span>
              <span style={{ display: 'block', fontSize: '0.58rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sage-soft, #C5CDBF)', marginTop: 3 }}>
                {chip.label}
              </span>
            </div>
          ))}
        </div>

        {/* ─── The problem, named ───────────────────────────────── */}
        <div
          data-bpqrv
          style={{
            background: 'var(--paper-warm, #EFE8DB)',
            borderLeft: '3px solid var(--clay, #B85A36)',
            borderRadius: '0 10px 10px 0',
            padding: '1rem 1.2rem',
            fontSize: '0.98rem',
            lineHeight: 1.65,
            color: 'var(--ink-soft, #2B2824)',
            marginBottom: '1.6rem',
          }}
        >
          You take your medicine. You cut the salt. And the numbers still climb. Nobody ever handed
          you the other half of the sentence, which is what to put on the plate instead. That is the
          whole reason this list exists.
        </div>

        {/* ─── About Joel ───────────────────────────────────────── */}
        <div data-bpqrv style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--line, #D8CFBD)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.85rem' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="56"
                height="56"
                loading="lazy"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--line, #D8CFBD)',
                  flexShrink: 0,
                }}
              />
            </picture>
            <div>
              <div style={{ ...serif, fontSize: '1.02rem' }}>Joel Polley, RN</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted, #7A7061)' }}>
                ICU &amp; Emergency Medicine · 20 Years · Founder, BraveWorks RN
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            Joel spent 20 years as a nurse in the ICU and the ER. He saw the same story over
            and over: people doing everything right, and their numbers still climbing. No one
            showed them where to look. He built BraveWorks RN to fix that. Plain words. Real
            help. Made by a nurse.
          </p>
        </div>

        {/* ─── Second CTA: back to the one form ─────────────────── */}
        <div data-bpqrv style={{ marginTop: '1.8rem' }}>
          <button type="button" className="bpq-cta" style={ctaStyle} onClick={() => jumpToForm('bottom')}>
            {CTA_LABEL} <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--muted, #7A7061)', margin: '0.6rem 0 0' }}>
            Free. In your inbox in about a minute. Nothing to buy. You also get a free seat at
            Monday&apos;s live class, Beyond the Cuff, in a second email.
          </p>
        </div>

        {/* ─── Buy-ready escape hatch. One line, below everything.
            Carries the 2026-07-22 learning: someone who already wants the
            kit used to have no door at all. Stage One is stress because
            that is where the protocol always starts. ───────────────── */}
        <p style={{ textAlign: 'center', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)', margin: '1.4rem 0 0' }}>
          Already know you want the full kit?{' '}
          <Link className="bpq-textlink" to="/pay?tier=corner&corner=stress&src=foods101" onClick={onSkipToKit}>
            Start Stage One for $17.
          </Link>
        </p>

        {/* ─── Compliance footer ────────────────────────────────────
            Wording is copied verbatim from variant A (CheckoutPage.jsx:1061
            to :1067) so both A/B arms carry the identical disclosure and the
            treatment arm is never held to the weaker standard. The audience
            is mostly ON medication, so the do-not-adjust line is required,
            not optional. /terms /privacy /disclaimer are all real SPA routes
            (App.jsx:385-387), so <Link> is correct here; the plain <a> rule
            applies only to the static /masterclass page. ─────────────── */}
        <div
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            maxWidth: '58ch',
            margin: '1.6rem auto 0',
          }}
        >
          <p style={{ margin: '0 0 0.5rem' }}>
            This is education and lifestyle support, not medical advice, diagnosis, or treatment.
            Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or
            adjust medication without your doctor.
          </p>
          <p style={{ margin: '0 0 0.5rem' }}>
            These statements have not been evaluated by the FDA. This product is not intended to
            diagnose, treat, or prevent any disease.
          </p>
          <p style={{ margin: '0 0 0.5rem' }}>
            Results not typical. Most readers see modest results or none.
          </p>
          <p style={{ margin: 0 }}>
            See our <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy Policy</Link>, and{' '}
            <Link to="/disclaimer">Disclaimer</Link>.
          </p>
        </div>
      </div>

      {/* ─── Sticky mobile CTA (mobile only, after the hero) ─────── */}
      <div className={`bpq-stickybar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <button type="button" onClick={() => jumpToForm('sticky')} tabIndex={showBar ? 0 : -1}>
          Send Me My 101 Foods Guide · Free
        </button>
      </div>
    </div>
  );
}
