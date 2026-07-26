// FoodsGuideLanding (codename foods101-v2) - the ONE-SCREEN squeeze for the
// "101 Foods And Herbs" guide. Homepage variant B and the direct /101foods route.
//
// 2026-07-26 (Joel): stripped to a single above-the-fold screen. Removed the
// "what is inside" section table, the trust band, the problem box, the about
// block, and the second CTA. What remains: the real guide cover, one headline,
// one line of subcopy, the email form, the consent line, and the compliance
// footer. The cover art is the hero, not a thumbnail beside bullets.
//
// Brunson lead funnel, step 1: one job, capture the email. No site nav, no
// competing offer above the fold. The only outbound links are the masterclass
// banner (owner mandate), the legally required Terms/Privacy/Disclaimer line,
// and one buy-ready text link at the very bottom that preserves the
// 2026-07-22 "skip the quiz" door.
//
// Cover asset: /images/foods101-cover.png (+ .webp). Until that file lands the
// onError fallback draws a same-footprint stand in so the fold never 404s.
//
// Standing rules honored: ZERO em dashes anywhere in this file, NEWSTART clean
// (plant foods, kitchen herbs, caffeine free teas only), no invented proof
// (20 yrs ICU/ER RN and 550,000+ followers are the only numbers, both
// previously verified by Joel), educational verbs only.
//
// Consent: the form does TWO things, so it discloses both before the address
// is taken. autoMasterclass: true registers the address for the free Monday
// class and sends a second email. The micro-copy under the CTA says so.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MasterclassBanner from '../components/MasterclassBanner';
import { track, identify } from '../utils/analytics.js';

const FUNNEL_VERSION = 'foods101-v2';
const CTA_LABEL = 'YES! Send Me My 101 Foods Guide';
const BUSY_LABEL = 'Sending your guide...';
const THANKS_ROUTE = '/101foods-thanks';

const wrap = {
  minHeight: '100vh',
  background: 'var(--cream, #FBF8F1)',
  color: 'var(--ink, #121110)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const shell = { maxWidth: 560, margin: '0 auto', padding: '1rem 1.25rem 2rem', textAlign: 'center' };
const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const eyebrowStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)', background: 'var(--sage-soft, #C5CDBF)',
  padding: '0.32rem 0.75rem', borderRadius: 999, marginBottom: '0.75rem', lineHeight: 1.25,
};

const h1Style = {
  ...serif, fontSize: 'clamp(1.7rem, 6vw, 2.4rem)', lineHeight: 1.1,
  letterSpacing: '-0.01em', margin: '0 0 0.55rem',
};

const subStyle = {
  fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--ink-soft, #2B2824)',
  maxWidth: '40ch', margin: '0 auto 1.15rem',
};

const ctaStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  width: '100%', minHeight: 54, padding: '0.7rem 1.1rem',
  background: 'var(--clay, #B85A36)', color: '#fff', border: 'none', borderRadius: 999,
  fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  lineHeight: 1.2, boxShadow: '0 8px 22px rgba(184, 90, 54, 0.32)',
};

const inputStyle = {
  display: 'block', width: '100%', minHeight: 50, padding: '0.75rem 0.9rem',
  fontSize: 16, fontFamily: 'inherit', color: 'var(--ink, #121110)', background: '#fff',
  border: '1px solid var(--line, #D8CFBD)', borderRadius: 10, boxSizing: 'border-box',
  textAlign: 'left',
};

const errStyle = { margin: '0.35rem 0 0', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 600, color: 'var(--clay, #B85A36)', textAlign: 'left' };

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
  } catch { return empty; }
}

function baseProps() {
  let entry = 'direct';
  let viewportW = 0;
  try {
    entry = window.location.pathname === '/' ? 'homepage_b' : 'direct';
    viewportW = window.innerWidth || 0;
  } catch { /* noop */ }
  return { funnel_version: FUNNEL_VERSION, entry, viewport_w: viewportW };
}

// The guide cover, front and centre. The real art is the file below; the
// fallback keeps the same footprint so a missing file never breaks the fold.
function GuideCover() {
  const [failed, setFailed] = useState(false);
  const frame = {
    width: 'clamp(200px, 52vw, 268px)',
    borderRadius: 10,
    boxShadow: '10px 14px 34px rgba(18, 17, 16, 0.24)',
    border: '1px solid var(--line, #D8CFBD)',
    transform: 'rotate(-1.5deg)',
    display: 'block',
    margin: '0 auto 1.25rem',
  };

  if (failed) {
    return (
      <div
        aria-hidden="true"
        style={{
          ...frame, aspectRatio: '3 / 4', background: 'var(--sage-deep, #2E3A30)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '1.5rem', textAlign: 'center', color: 'var(--cream, #FBF8F1)',
        }}
      >
        <span style={{ ...serif, fontStyle: 'italic', fontSize: '3.4rem', lineHeight: 1, color: 'var(--gold, #E3A83B)' }}>101</span>
        <span style={{ ...serif, fontSize: '1.05rem', lineHeight: 1.25 }}>Foods &amp; Herbs</span>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sage-soft, #C5CDBF)' }}>The Balanced BP Reset</span>
      </div>
    );
  }

  return (
    <picture>
      <source srcSet="/images/foods101-cover.webp" type="image/webp" />
      <img
        src="/images/foods101-cover.png"
        alt="The Balanced BP Reset, your 101 Foods and Herbs guide by Joel Polley, RN and Annie Chitate"
        width="268"
        fetchPriority="high"
        onError={() => setFailed(true)}
        style={frame}
      />
    </picture>
  );
}

export default function FoodsGuideLanding({ showBanner = true }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const emailRef = useRef(null);
  const nameRef = useRef(null);
  const focusFiredRef = useRef(false);

  useEffect(() => {
    let referrer = '';
    try { referrer = document.referrer || ''; } catch { /* noop */ }
    track('foods101_landing_viewed', { ...baseProps(), layout: 'squeeze-v2', referrer });
  }, []);

  function onFieldFocus(field) {
    if (focusFiredRef.current) return;
    focusFiredRef.current = true;
    track('foods101_form_focused', { ...baseProps(), field });
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
    if (!EMAIL_RE.test(cleanEmail) || /[\r\n]/.test(cleanEmail)) {
      setError({ field: 'email', msg: 'That email does not look right. Please check it and try again.' });
      track('foods101_optin_validation_failed', { ...base, reason: 'email_format' });
      try { emailRef.current?.focus(); } catch { /* noop */ }
      return;
    }

    setError(null);
    setBusy(true);
    track('foods101_optin_submitted', { ...base, has_name: Boolean(cleanName), position: 'fold' });
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

    const post = () => fetch('/api/lead-magnet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });

    const startedAt = Date.now();
    let res = await post().catch(() => null);
    if (!res || !res.ok) res = await post().catch(() => null);

    if (!res || !res.ok) {
      track('foods101_optin_failed', { ...base, stage: res ? 'server' : 'network', http_status: res ? res.status : 0 });
      try {
        sessionStorage.setItem('bpq_foods101_retry', JSON.stringify({ email: cleanEmail, firstName: cleanName, at: Date.now(), entry: base.entry }));
      } catch { /* private mode */ }
      setBusy(false);
      navigate(`${THANKS_ROUTE}?capture=failed`);
      return;
    }

    let data = {};
    try { data = await res.json(); } catch { /* tolerate empty body */ }

    try { localStorage.setItem('bwbp_lead_email', cleanEmail); } catch { /* private mode */ }
    try {
      sessionStorage.setItem('bpq_foods101', JSON.stringify({ email: cleanEmail, firstName: cleanName, at: Date.now(), entry: base.entry }));
    } catch { /* private mode */ }

    track('foods101_optin_succeeded', {
      ...base,
      deduped: Boolean(data.deduped),
      suppressed: Boolean(data.suppressed),
      email_sent: Boolean(data.emailSent),
      masterclass_registered: Boolean(data.masterclass && data.masterclass.registered),
      masterclass_already: Boolean(data.masterclass && data.masterclass.already),
      ms: Date.now() - startedAt,
    });

    setBusy(false);
    const dest = typeof data.redirect === 'string' && data.redirect ? data.redirect : THANKS_ROUTE;
    navigate(dest, { state: { optin: true, email: cleanEmail, firstName: cleanName } });
  }

  function onSkipToKit() {
    track('foods101_skip_optin_clicked', { ...baseProps(), value: 17, corner: 'stress' });
  }

  return (
    <div style={wrap}>
      <style>{`
        .bpq-cta { transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
        .bpq-cta:hover { background: var(--clay-hover, #A44B28); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(184, 90, 54, 0.38); }
        .bpq-cta:focus-visible { outline: 3px solid var(--sage-deep, #2E3A30); outline-offset: 3px; }
        .bpq-cta[disabled] { opacity: .72; cursor: progress; transform: none; }
        .bpq-field input:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 1px; border-color: var(--clay, #B85A36); }
        .bpq-field input::placeholder { color: var(--muted, #7A7061); opacity: 1; }
        .bpq-textlink { color: var(--clay, #B85A36); font-weight: 700; text-decoration: underline; }
      `}</style>

      {showBanner && <MasterclassBanner />}

      <div style={shell}>
        {/* Wordmark only. No nav on a squeeze. */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            paddingBottom: '0.4rem', marginBottom: '0.9rem',
            borderBottom: '1px solid var(--line-soft, #E8E1D1)',
          }}
        >
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
          <span style={{ ...serif, fontSize: '0.9rem', color: 'var(--sage-deep, #2E3A30)' }}>BraveWorks RN</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted, #7A7061)' }}>· Joel Polley, RN</span>
        </div>

        <span style={eyebrowStyle}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
          Free Guide · From A 20 Year ICU And ER Nurse
        </span>

        <h1 style={h1Style}>
          <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>101</em> Foods And Herbs
          That Help Steady Blood Pressure
        </h1>

        <p style={subStyle}>
          The plant foods, kitchen herbs, and caffeine free teas a nurse would point to first.
          Most of it is already at your grocery store.
        </p>

        <GuideCover />

        <form onSubmit={onSubmit} noValidate style={{ background: '#fff', border: '1px solid var(--line, #D8CFBD)', borderRadius: 12, padding: '0.8rem', textAlign: 'left' }}>
          <div className="bpq-field" style={{ marginBottom: '0.45rem' }}>
            <label htmlFor="foods101-name" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>First name</label>
            <input
              id="foods101-name" ref={nameRef} type="text" name="firstName" autoComplete="given-name"
              placeholder="First name" value={firstName} required
              onFocus={() => onFieldFocus('firstName')}
              onChange={(ev) => { setFirstName(ev.target.value); if (error && error.field === 'firstName') setError(null); }}
              aria-invalid={error && error.field === 'firstName' ? 'true' : undefined}
              style={{ ...inputStyle, borderColor: error && error.field === 'firstName' ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)' }}
            />
            {error && error.field === 'firstName' && <p role="alert" style={errStyle}>{error.msg}</p>}
          </div>

          <div className="bpq-field" style={{ marginBottom: '0.55rem' }}>
            <label htmlFor="foods101-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Your best email</label>
            <input
              id="foods101-email" ref={emailRef} type="email" name="email" inputMode="email"
              autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck="false"
              placeholder="Your best email" value={email} required
              onFocus={() => onFieldFocus('email')}
              onChange={(ev) => { setEmail(ev.target.value); if (error && error.field === 'email') setError(null); }}
              aria-invalid={error && error.field === 'email' ? 'true' : undefined}
              style={{ ...inputStyle, borderColor: error && error.field === 'email' ? 'var(--clay, #B85A36)' : 'var(--line, #D8CFBD)' }}
            />
            {error && error.field === 'email' && <p role="alert" style={errStyle}>{error.msg}</p>}
          </div>

          <button type="submit" className="bpq-cta" style={ctaStyle} disabled={busy} aria-busy={busy}>
            {busy ? BUSY_LABEL : CTA_LABEL}
            {!busy && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p style={{ fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--muted, #7A7061)', margin: '0.65rem 0 0' }}>
          Free. In your inbox in about a minute. Nothing to buy. You also get a free seat at
          Monday&apos;s live class, Beyond the Cuff, in a second email.
        </p>

        <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)', margin: '1.1rem 0 0' }}>
          Already know you want the full kit?{' '}
          <Link className="bpq-textlink" to="/pay?tier=corner&corner=stress&src=foods101" onClick={onSkipToKit}>
            Start Stage One for $17.
          </Link>
        </p>

        {/* Compliance footer, verbatim from variant A. */}
        <div style={{ color: 'var(--muted, #7A7061)', fontSize: '0.76rem', lineHeight: 1.55, maxWidth: '54ch', margin: '1.4rem auto 0' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            This is education and lifestyle support, not medical advice, diagnosis, or treatment.
            Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or
            adjust medication without your doctor.
          </p>
          <p style={{ margin: 0 }}>
            See our <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy Policy</Link>, and{' '}
            <Link to="/disclaimer">Disclaimer</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
