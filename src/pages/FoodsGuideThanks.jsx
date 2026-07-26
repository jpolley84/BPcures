// FoodsGuideThanks - page 2 of the foods101-v1 funnel (spec: FUNNEL SPEC
// "101 Foods" Squeeze Funnel, codename foods101-v1).
//
// Brunson step 2: the tripwire OTO. The visitor just said yes to the free
// guide, so they are in buying mode right now. This page monetizes that
// moment: pattern interrupt on top, a short honest confirmation, then the $17
// kit as high on the page as it will go. Everything below the $17 CTA exists
// to justify the price, not to delay it.
//
// Route: /101foods-thanks. STANDALONE, not wrapped in SiteLayout (same rule as
// PayPage): zero nav, zero competing exits. The one intentional exit is the
// decline link, which is plain, visible, and honest. A no-exit OTO is a dark
// pattern and this brand cannot afford one.
//
// Honesty rules baked in:
//   - The confirmation only claims the guide was sent when it actually was.
//     ?capture=failed swaps in a repair form instead of a false confirmation.
//   - The masterclass block only claims a saved seat when the opt-in (which
//     auto registers) actually happened. Direct hits get "save your seat".
//   - No fake compare-at, no seat counters, no countdown on the $17 offer. The
//     only timer is the real Monday 7pm CT class, computed by the SAME
//     nextMondayCT() the site banner uses.
//   - Stack values and the $209 anchor come from src/data/kitStack.js, the one
//     source shared with the register, so the two can never drift.
//
// NEWSTART doctrine clean: plant based whole food framing only, and the copy
// passes the standing compliance greps. ZERO em dashes anywhere in this file.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { KIT_STACK, KIT_STACK_TOTAL, KIT_PRICE, KIT_FILE_COUNT } from '../data/kitStack.js';
import { nextMondayCT } from '../components/MasterclassBanner.jsx';
import { track, registerSuperProps } from '../utils/analytics.js';

const FUNNEL_VERSION = 'foods101-v1';

// Stress is Stage One of the Triangle Reset. This visitor never took the quiz,
// so there is no result to read: the standing rule is that the protocol always
// starts at stress. Same target the squeeze uses for its buy-ready link.
const CHECKOUT_URL = '/pay?tier=corner&corner=stress&src=foods101';
const GUIDE_PDF = '/downloads/101-foods-bp.pdf';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CTA_LABEL = `Yes, add the complete kit for $${KIT_PRICE}`;

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const wrap = {
  minHeight: '100vh',
  background: 'var(--cream, #FBF8F1)',
  color: 'var(--ink, #121110)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const shell = {
  maxWidth: 640,
  margin: '0 auto',
  // Tight top padding: the fold contract puts the $17 CTA above 844px on a
  // 390px viewport. Do not grow this without re-measuring.
  padding: '0.85rem 1.1rem 3.5rem',
};

const ctaStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  minHeight: 58,
  padding: '1rem 1.3rem',
  background: 'var(--clay, #B85A36)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1.25,
  boxShadow: '0 8px 22px rgba(184, 90, 54, 0.32)',
};

const microStyle = {
  textAlign: 'center',
  fontSize: '0.8rem',
  color: 'var(--muted, #7A7061)',
  margin: '0.55rem 0 0',
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  margin: '0 0 0.5rem',
};

// Countdown split. The timezone math itself is NOT duplicated: nextMondayCT()
// is imported from MasterclassBanner so there is one implementation of "when
// is the next class" on the whole site.
function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

// Every event carries these. Empty strings rather than undefined so a PostHog
// breakdown never shows a null bucket.
function baseProps() {
  const props = {
    funnel_version: FUNNEL_VERSION,
    entry: 'direct',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    viewport_w: 0,
  };
  try {
    props.entry = window.location.pathname === '/' ? 'homepage_b' : 'direct';
    props.viewport_w = window.innerWidth || 0;
    const params = new URLSearchParams(window.location.search);
    props.utm_source = params.get('utm_source') || '';
    props.utm_medium = params.get('utm_medium') || '';
    props.utm_campaign = params.get('utm_campaign') || '';
  } catch {
    /* defaults hold */
  }
  return props;
}

// Who is this visitor? Router state wins (the squeeze navigates with it), then
// the sessionStorage record the squeeze wrote, then ?email= on the URL, then
// the lead email PayPage already prefills from. Every path is optional: a cold
// direct hit renders the page fine with no email at all.
function readOptinContext(stateEmail, stateFirstName) {
  const ctx = {
    email: '',
    firstName: '',
    optin: false,
    captureFailed: false,
    source: 'direct',
  };

  const takeEmail = (value) => {
    const clean = String(value || '').trim().toLowerCase();
    return EMAIL_RE.test(clean) && clean.length <= 254 ? clean : '';
  };
  const takeName = (value) => String(value || '').trim().replace(/[<>]/g, '').slice(0, 40);

  try {
    const params = new URLSearchParams(window.location.search);
    ctx.captureFailed = params.get('capture') === 'failed';
    ctx.email = takeEmail(params.get('email'));
  } catch {
    /* no search params available */
  }

  const routed = takeEmail(stateEmail);
  if (routed) {
    ctx.email = routed;
    ctx.source = 'redirect';
  }
  if (stateFirstName) ctx.firstName = takeName(stateFirstName);

  try {
    const raw = sessionStorage.getItem('bpq_foods101');
    if (raw) {
      const rec = JSON.parse(raw);
      const stored = takeEmail(rec && rec.email);
      if (stored) {
        ctx.optin = true;
        if (!ctx.email) ctx.email = stored;
        if (!ctx.firstName) ctx.firstName = takeName(rec.firstName);
        // Fresh record means they landed here from the squeeze, not a bookmark.
        if (typeof rec.at === 'number' && Date.now() - rec.at < 30 * 60 * 1000) {
          ctx.source = 'redirect';
        }
      }
    }
  } catch {
    /* private mode or corrupt record: treat as a direct hit */
  }

  if (!ctx.email) {
    try {
      ctx.email = takeEmail(localStorage.getItem('bwbp_lead_email'));
    } catch {
      /* storage blocked */
    }
  }

  return ctx;
}

function StackRows() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {KIT_STACK.map((item) => (
        <li
          key={item.name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.8rem',
            alignItems: 'baseline',
            padding: '0.34rem 0',
            borderBottom: '1px dashed var(--line, #D8CFBD)',
            fontSize: '0.86rem',
            lineHeight: 1.45,
          }}
        >
          <span>{item.name}</span>
          <span style={{ whiteSpace: 'nowrap', color: 'var(--sage-deep, #2E3A30)', fontWeight: 600 }}>
            ${item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function FoodsGuideThanks() {
  const navigate = useNavigate();
  const location = useLocation();

  const ctx = useMemo(
    () => readOptinContext(location.state && location.state.email, location.state && location.state.firstName),
    // Read once on mount. The router state does not change under this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The guide is confirmed sent unless the squeeze told us the capture died.
  const [delivered, setDelivered] = useState(!ctx.captureFailed);
  // A seat is only claimed when the opt-in actually ran (it auto registers).
  const [registered, setRegistered] = useState(ctx.optin && !ctx.captureFailed);

  const [resendEmail, setResendEmail] = useState(ctx.email);
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendError, setResendError] = useState('');

  const [showBar, setShowBar] = useState(false);

  const offerRef = useRef(null);
  const ctaRef = useRef(null);
  const masterclassRef = useRef(null);
  const mountedAt = useRef(Date.now());

  // Countdown to the real Monday 7pm CT class.
  const [target, setTarget] = useState(() => nextMondayCT());
  const [left, setLeft] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = target.getTime() - Date.now();
      if (remaining <= 0) {
        const next = nextMondayCT();
        setTarget(next);
        setLeft(next.getTime() - Date.now());
      } else {
        setLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const { d, h, m, s } = parts(left);
  const classDate = useMemo(() => {
    try {
      return target.toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Monday';
    }
  }, [target]);

  // Page view.
  useEffect(() => {
    registerSuperProps({ funnel_version: FUNNEL_VERSION });
    track('foods101_thanks_viewed', {
      ...baseProps(),
      optin: ctx.optin,
      capture_failed: ctx.captureFailed,
      source: ctx.source,
    });
  }, [ctx.optin, ctx.captureFailed, ctx.source]);

  // Offer block seen (fires once).
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !offerRef.current) {
      return undefined;
    }
    const node = offerRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        track('foods101_oto_viewed', {
          ...baseProps(),
          seconds_to_view: Math.round((Date.now() - mountedAt.current) / 1000),
        });
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Masterclass block seen (fires once).
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !masterclassRef.current) {
      return undefined;
    }
    const node = masterclassRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        track('foods101_masterclass_block_viewed', { ...baseProps(), auto_registered: registered });
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [registered]);

  // Sticky bar once the primary CTA has scrolled off the TOP of the screen.
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !ctaRef.current) {
      return undefined;
    }
    const node = ctaRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const buyKit = useCallback(
    (placement) => {
      const base = baseProps();
      track('foods101_oto_cta_clicked', { ...base, placement, value: KIT_PRICE, corner: 'stress' });
      // Parity with variant A's funnel: without this the two arms cannot be
      // compared in the same PostHog funnel.
      track('checkout_clicked', {
        ...base,
        product: 'bp-corner-reset',
        value: 17.0,
        source: 'foods101-oto',
        corner: 'stress',
        placement,
      });
      // Meta pixel, same shape CheckoutPage.handleBuyNow fires, so paid
      // attribution matches between arms. Purchase fires server side.
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'AddToCart', {
            value: 17.0,
            currency: 'USD',
            content_name: 'BP Corner Reset',
            funnel_version: FUNNEL_VERSION,
          });
          window.fbq('track', 'InitiateCheckout', {
            value: 17.0,
            currency: 'USD',
            funnel_version: FUNNEL_VERSION,
          });
        }
      } catch {
        /* pixel errors must never block checkout */
      }
      navigate(CHECKOUT_URL);
    },
    [navigate],
  );

  const downloadGuide = useCallback((placement) => {
    track('foods101_guide_download_clicked', { ...baseProps(), placement });
  }, []);

  async function handleResend(event) {
    event.preventDefault();
    const clean = resendEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setResendError('Please enter a valid email address.');
      return;
    }
    setResendError('');
    setResendState('sending');
    track('foods101_guide_resend_submitted', baseProps());

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clean,
          name: ctx.firstName || '',
          magnet: 'foods101',
          source: 'foods101-thanks-retry',
          autoMasterclass: true,
          tags: ['foods101', 'no-quiz'],
        }),
      });
      if (!res.ok) {
        const err = new Error('resend failed');
        err.status = res.status;
        throw err;
      }
      setResendState('sent');
      setDelivered(true);
      setRegistered(true);
      try {
        localStorage.setItem('bwbp_lead_email', clean);
        sessionStorage.setItem(
          'bpq_foods101',
          JSON.stringify({ email: clean, firstName: ctx.firstName || '', at: Date.now() }),
        );
      } catch {
        /* storage blocked: the send still happened */
      }
      track('foods101_guide_resend_succeeded', baseProps());
    } catch (err) {
      setResendState('error');
      setResendError('That did not go through. Try once more, or email joel@bpquiz.com and I will send it by hand.');
      track('foods101_guide_resend_failed', { ...baseProps(), http_status: err.status || 0 });
    }
  }

  const countCell = (n, lbl) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 46 }}>
      <strong style={{ fontSize: '1.35rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(n).padStart(2, '0')}
      </strong>
      <span style={{ fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.82 }}>
        {lbl}
      </span>
    </span>
  );

  return (
    <div style={wrap}>
      <style>{`
        .bpq-cta { transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
        .bpq-cta:hover { background: var(--clay-hover, #A44B28); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(184, 90, 54, 0.38); }
        .bpq-cta:focus-visible { outline: 3px solid var(--sage-deep, #2E3A30); outline-offset: 3px; }
        .bpq-kit-poster {
          display: block; width: 100%; border: none; padding: 0; background: none;
          cursor: pointer; border-radius: 12px; overflow: hidden;
          box-shadow: 0 18px 40px rgba(18, 17, 16, 0.22);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .bpq-kit-poster:hover { transform: translateY(-3px); box-shadow: 0 26px 55px rgba(18, 17, 16, 0.28); }
        .bpq-kit-poster:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 3px; }
        .bpq-resend-input {
          width: 100%; min-height: 50px; font-size: 16px; font-family: inherit;
          padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid var(--line, #D8CFBD);
          background: #fff; color: var(--ink, #121110);
        }
        .bpq-resend-input:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 2px; }
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
          font-weight: 700; font-size: 1rem; padding: 13px 20px;
          border-radius: 999px; border: none; cursor: pointer;
        }
        @media (max-width: 720px) { .bpq-stickybar { display: block; } }
        @media (prefers-reduced-motion: reduce) {
          .bpq-cta, .bpq-kit-poster, .bpq-stickybar { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* ===== 1. Pattern interrupt. Urgent, and true: the guide really is
          sent, and the kit really is only offered here at this moment. ===== */}
      <div
        role="alert"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--clay, #B85A36)',
          color: '#FFFFFF',
          padding: '0.62rem 0.9rem',
          textAlign: 'center',
          fontSize: '0.86rem',
          lineHeight: 1.34,
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(18, 17, 16, 0.18)',
        }}
      >
        <strong style={{ fontWeight: 800, letterSpacing: '0.01em' }}>WAIT, DO NOT LEAVE THIS PAGE.</strong>{' '}
        {delivered
          ? 'Your guide is sent. This next part I only show here.'
          : 'Your guide needs one more step, and so does the part below.'}
      </div>

      <div style={shell}>
        {/* ===== 2. Confirmation, or the repair form if capture failed ===== */}
        <div
          style={{
            background: 'var(--sage-deep, #2E3A30)',
            color: 'var(--cream, #FBF8F1)',
            borderRadius: 12,
            padding: '0.75rem 0.9rem',
            margin: '0.7rem 0 0',
          }}
        >
          {delivered ? (
            <>
              <h1 style={{ ...serif, fontSize: '1.14rem', lineHeight: 1.24, margin: '0 0 0.3rem' }}>
                Congratulations. Your 101 Foods Guide is in your email.
              </h1>
              <p style={{ fontSize: '0.84rem', lineHeight: 1.5, margin: 0, opacity: 0.93 }}>
                {ctx.email ? (
                  <>
                    Sent to <strong style={{ wordBreak: 'break-word' }}>{ctx.email}</strong> from joel@bpquiz.com.{' '}
                  </>
                ) : (
                  <>Look for joel@bpquiz.com. </>
                )}
                Not there in two minutes? Check Promotions or Spam.{' '}
                <a
                  href={GUIDE_PDF}
                  onClick={() => downloadGuide('confirmation')}
                  style={{
                    color: 'var(--cream, #FBF8F1)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Or download it here.
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ ...serif, fontSize: '1.3rem', lineHeight: 1.2, margin: '0 0 0.4rem' }}>
                Your guide did not go out. Let us fix that.
              </h1>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.55, margin: '0 0 0.6rem', opacity: 0.93 }}>
                Something broke on our end, not yours. Put your email in again and I will send it now.
              </p>
              <form onSubmit={handleResend} noValidate>
                <label htmlFor="foods101-resend" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                  Your email address
                </label>
                <input
                  id="foods101-resend"
                  className="bpq-resend-input"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Your best email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bpq-cta"
                  disabled={resendState === 'sending'}
                  aria-busy={resendState === 'sending'}
                  style={{ ...ctaStyle, minHeight: 50, marginTop: '0.5rem', fontSize: '0.98rem' }}
                >
                  {resendState === 'sending' ? 'Sending your guide...' : 'Send it again'}
                </button>
                {resendError ? (
                  <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#FFD9C9' }}>
                    {resendError}
                  </p>
                ) : null}
              </form>
            </>
          )}

          {resendState === 'sent' ? (
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Sent. Check your inbox in about a minute, or{' '}
              <a
                href={GUIDE_PDF}
                onClick={() => downloadGuide('retry')}
                style={{ color: 'var(--cream, #FBF8F1)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                download it right here.
              </a>
            </p>
          ) : null}
        </div>

        {/* ===== 3. Transition. One line. Nothing goes between this and the
            offer: the fold contract depends on it. ===== */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '1rem',
            lineHeight: 1.45,
            color: 'var(--ink, #121110)',
            margin: '0.7rem 0 0.5rem',
          }}
        >
          Now here is the part a food list cannot do for you.
        </p>

        {/* ===== 4. THE OFFER. This is the fold. ===== */}
        <div ref={offerRef}>
          <h2
            style={{
              ...serif,
              fontSize: 'clamp(1.34rem, 5.2vw, 2rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              margin: '0 0 0.4rem',
            }}
          >
            Grab the complete step by step blueprint to steady your blood pressure{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>naturally</em>.
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.5,
              color: 'var(--ink-soft, #2B2824)',
              maxWidth: '46ch',
              margin: '0 0 0.55rem',
            }}
          >
            The guide tells you what to eat. The kit tells you what to do, in what order, starting
            tomorrow morning.
          </p>

          <p style={{ margin: '0 0 0.55rem', fontSize: '1rem', lineHeight: 1.4 }}>
            <span style={{ color: 'var(--muted, #7A7061)' }}>
              <s style={{ color: 'var(--clay, #B85A36)' }}>${KIT_STACK_TOTAL}</s> of material.
            </span>{' '}
            <strong style={{ fontWeight: 800 }}>You pay ${KIT_PRICE}, one time.</strong>
          </p>

          <button ref={ctaRef} type="button" className="bpq-cta" style={ctaStyle} onClick={() => buyKit('fold')}>
            {CTA_LABEL} <ArrowRight size={18} aria-hidden />
          </button>
          <p style={microStyle}>
            Instant download. {KIT_FILE_COUNT} files. 30 day Feel It or Free promise.
          </p>
        </div>

        {/* ===== 5. What is inside, shown not told ===== */}
        <div style={{ marginTop: '0.95rem' }}>
          <p style={{ ...labelStyle, textAlign: 'center', margin: '0 0 0.4rem' }}>What is inside the kit</p>
          <button
            type="button"
            className="bpq-kit-poster"
            onClick={() => buyKit('image')}
            aria-label={`See the complete 10-Day BP Reset Kit and add it for $${KIT_PRICE}`}
          >
            <picture>
              <source srcSet="/images/kit-vault-hero.webp" type="image/webp" />
              <img
                src="/images/kit-vault-hero.jpg"
                alt="The 10-Day BP Reset Kit: the protocols, herb guides, plant based recipes, doctor sheet, and trackers that come with the kit. By Joel Polley, RN."
                width="1672"
                height="941"
                loading="lazy"
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </picture>
          </button>
        </div>

        {/* ===== 6. The stack, itemized. Values and total come from the shared
            module, so the register and this page can never disagree. ===== */}
        <div
          style={{
            marginTop: '1rem',
            background: 'var(--paper-warm, #EFE8DB)',
            border: '1px solid var(--line, #D8CFBD)',
            borderRadius: 12,
            padding: '1rem 1.05rem',
          }}
        >
          <p style={labelStyle}>Everything you get today</p>
          <StackRows />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '0.8rem',
              marginTop: '0.7rem',
              fontSize: '0.92rem',
            }}
          >
            <span style={{ color: 'var(--muted, #7A7061)' }}>Total value</span>
            <s style={{ color: 'var(--clay, #B85A36)', fontWeight: 600 }}>${KIT_STACK_TOTAL}</s>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '0.8rem',
              marginTop: '0.25rem',
              fontSize: '1.05rem',
            }}
          >
            <span style={{ fontWeight: 700 }}>You pay today</span>
            <span style={{ color: 'var(--clay, #B85A36)', fontWeight: 800 }}>${KIT_PRICE}</span>
          </div>
        </div>

        {/* ===== 7. Risk reversal, same terms as the register ===== */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
            margin: '1.1rem 0 0',
            padding: '0.8rem 1rem',
            background: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: 12,
            fontSize: '0.85rem',
            lineHeight: 1.55,
            color: '#3E2451',
          }}
        >
          <ShieldCheck size={18} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: '#6C3483' }} />
          <p style={{ margin: 0 }}>
            <strong>Joel&rsquo;s promise:</strong> run the full 10-day plan. If you do not feel a
            difference, reply with the word <strong>REFUND</strong> and your money comes back. Keep
            the books either way. No hoops, no fine print.
          </p>
        </div>

        {/* ===== 8. Second CTA, then the honest way out ===== */}
        <div style={{ marginTop: '1.3rem' }}>
          <button type="button" className="bpq-cta" style={ctaStyle} onClick={() => buyKit('stack')}>
            {CTA_LABEL} <ArrowRight size={18} aria-hidden />
          </button>
          <p style={microStyle}>
            One time payment. Nothing renews. Your files open on the next screen.
          </p>

          {/* Clean decline. Same size text as the rest of the page, no shaming
              label, no hidden link. The guide they came for is already theirs. */}
          <p style={{ textAlign: 'center', margin: '0.9rem 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
            <Link
              to="/blog"
              onClick={() => track('foods101_oto_declined', { ...baseProps(), placement: 'below_stack' })}
              style={{
                color: 'var(--ink-soft, #2B2824)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              No thanks. My free guide is enough for now.
            </Link>
          </p>
        </div>

        {/* ===== 9. The masterclass. Free either way. ===== */}
        <div
          ref={masterclassRef}
          style={{
            marginTop: '2rem',
            background: 'var(--sage-deep, #2E3A30)',
            color: 'var(--cream, #FBF8F1)',
            borderRadius: 14,
            padding: '1.2rem 1.1rem',
          }}
        >
          <p style={{ ...labelStyle, color: 'var(--sage-soft, #C5CDBF)' }}>Also included, free</p>
          <h3 style={{ ...serif, fontSize: '1.3rem', lineHeight: 1.22, margin: '0 0 0.5rem' }}>
            {registered ? 'You are already booked for Monday night.' : 'Save your free seat for Monday night.'}
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 0.9rem', opacity: 0.93 }}>
            {registered ? (
              <>
                Beyond the Cuff runs live every Monday at 7pm Central. I saved you a seat when you
                asked for the guide. Your join link is in a second email from me.
              </>
            ) : (
              <>
                Beyond the Cuff runs live every Monday at 7pm Central. It is free, it is taught by a
                nurse, and the join link goes straight to your email.
              </>
            )}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.9rem',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 0.5rem',
              background: 'rgba(251, 248, 241, 0.1)',
              borderRadius: 10,
              marginBottom: '0.85rem',
            }}
            aria-label={`Time until the next class on ${classDate}`}
          >
            {countCell(d, 'days')}
            {countCell(h, 'hrs')}
            {countCell(m, 'min')}
            {countCell(s, 'sec')}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', margin: '0 0 0.9rem', opacity: 0.85 }}>
            Next class: {classDate}, 7pm Central
          </p>

          {/* /masterclass is a STATIC page (public/masterclass/), excluded from
              the SPA rewrite in vercel.json. Plain anchor, never a Link. */}
          <a
            href="/masterclass"
            onClick={() =>
              track('foods101_masterclass_cta_clicked', {
                ...baseProps(),
                placement: 'thanks_block',
                auto_registered: registered,
                days_out: d,
              })
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              width: '100%',
              minHeight: 50,
              background: 'var(--cream, #FBF8F1)',
              color: 'var(--sage-deep, #2E3A30)',
              fontWeight: 700,
              fontSize: '0.98rem',
              textDecoration: 'none',
              borderRadius: 999,
              padding: '0.8rem 1.1rem',
            }}
          >
            {registered ? 'See the class details' : 'Save my free seat'} <ArrowRight size={17} aria-hidden />
          </a>
        </div>

        {/* ===== 10. Compliance ===== */}
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.8rem',
            lineHeight: 1.55,
            maxWidth: '58ch',
            margin: '2rem auto 0',
          }}
        >
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>

      {/* ===== 11. Sticky mobile bar, after the offer CTA scrolls away ===== */}
      <div className={`bpq-stickybar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <button type="button" onClick={() => buyKit('sticky')} tabIndex={showBar ? 0 : -1}>
          Add the complete kit &middot; ${KIT_PRICE}
        </button>
      </div>
    </div>
  );
}
