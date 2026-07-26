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
//   - The confirmation only claims the guide was sent when the opt-in really
//     ran. A cold direct hit with no opt-in signal, and ?capture=failed, both
//     get the repair form plus a direct download, never a false confirmation.
//   - An email address is only printed back to the visitor when it came from
//     THIS funnel. The shared 'bwbp_lead_email' key (also written by the quiz)
//     may prefill the repair field, but it is never shown as "sent to".
//   - The masterclass block only claims a saved seat when the opt-in (which
//     auto registers) actually happened. Direct hits get "save your seat".
//   - NO compare-at price anywhere. The $209 is the honest sum of the eleven
//     solo values, it has never been charged, so it is never struck through.
//   - No seat counters, no countdown on the $17 offer. The only timer is the
//     real Monday 7pm CT class, computed by the SAME nextMondayCT() the site
//     banner uses.
//   - Stack values and the $209 sum come from src/data/kitStack.js, the one
//     source shared with the register, so the two can never drift.
//
// NEWSTART doctrine clean: plant based whole food framing only, and the copy
// passes the standing compliance greps. ZERO em dashes anywhere in this file.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { KIT_STACK, KIT_STACK_TOTAL, KIT_PRICE, KIT_FILE_COUNT } from '../data/kitStack.js';
import { nextMondayCT } from '../components/MasterclassBanner.jsx';
import { track, getAbHomeVariant } from '../utils/analytics.js';

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

// Which arm sent them here. This page's own pathname is ALWAYS
// /101foods-thanks, so it can never tell the homepage-B arm from direct
// /101foods traffic: the answer has to come from the record the squeeze wrote.
// Absent or stale record reads 'unknown', which is the truth, rather than
// 'direct', which is a guess that happens to be wrong half the time.
const RECORD_KEYS = ['bpq_foods101', 'bpq_foods101_retry'];
const RECORD_FRESH_MS = 30 * 60 * 1000;

function readRecord() {
  try {
    for (const key of RECORD_KEYS) {
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      const rec = JSON.parse(raw);
      if (rec && typeof rec === 'object') return { key, rec };
    }
  } catch {
    /* private mode or corrupt record */
  }
  return { key: '', rec: null };
}

function readEntry() {
  const { rec } = readRecord();
  if (!rec || typeof rec.entry !== 'string' || !rec.entry) return 'unknown';
  // A bookmark opened next week must not replay last week's arm.
  if (typeof rec.at === 'number' && Date.now() - rec.at > RECORD_FRESH_MS) return 'unknown';
  return rec.entry;
}

// Every event carries these. Campaign params are deliberately NOT stamped
// here: posthog-js already carries the session's utm_* as super properties,
// and this page has no query string of its own, so writing empty strings over
// them would delete the campaign the visitor actually arrived on.
function baseProps() {
  const props = {
    funnel_version: FUNNEL_VERSION,
    entry: 'unknown',
    viewport_w: 0,
  };
  try {
    props.entry = readEntry();
    props.viewport_w = window.innerWidth || 0;
  } catch {
    /* defaults hold */
  }
  return props;
}

// Who is this visitor? Router state wins (the squeeze can navigate with it),
// then the sessionStorage record the squeeze wrote, then ?email= on the URL,
// then the lead email PayPage already prefills from. Every path is optional: a
// cold direct hit renders the page fine with no email at all.
//
// Two flags are load bearing and must not be collapsed into one:
//   optin        - this visitor really did submit the squeeze form. ONLY the
//                  router state and this funnel's own sessionStorage record
//                  set it. It is what licenses "your guide is sent".
//   emailFromOptin - the address came from this funnel, so it is safe to print
//                  back. 'bwbp_lead_email' is shared with the quiz gates
//                  (QuizPage, TriggerQuizPage), so an address read from there
//                  may prefill the repair field but is NEVER displayed.
function readOptinContext(state) {
  const ctx = {
    email: '',
    firstName: '',
    optin: false,
    emailFromOptin: false,
    captureFailed: false,
    suppressed: false,
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
    // The endpoints append &reason=suppressed for an unsubscribed address.
    // Nothing broke in that case, so the copy must not say it did.
    ctx.suppressed = params.get('reason') === 'suppressed';
    const queried = takeEmail(params.get('email'));
    if (queried) {
      ctx.email = queried;
      ctx.emailFromOptin = true;
    }
  } catch {
    /* no search params available */
  }

  // Router state, when the squeeze passes it. Storage independent, so a
  // private-mode or in-app-browser opt-in still gets the true confirmation.
  const routed = takeEmail(state && state.email);
  if (routed) {
    ctx.email = routed;
    ctx.emailFromOptin = true;
    ctx.optin = true;
    ctx.source = 'redirect';
  }
  if (state && state.optin) ctx.optin = true;
  if (state && state.firstName) ctx.firstName = takeName(state.firstName);

  try {
    const raw = sessionStorage.getItem('bpq_foods101');
    if (raw) {
      const rec = JSON.parse(raw);
      const stored = takeEmail(rec && rec.email);
      if (stored) {
        ctx.optin = true;
        if (!ctx.email) {
          ctx.email = stored;
          ctx.emailFromOptin = true;
        }
        if (!ctx.firstName) ctx.firstName = takeName(rec.firstName);
        // Fresh record means they landed here from the squeeze, not a bookmark.
        if (typeof rec.at === 'number' && Date.now() - rec.at < RECORD_FRESH_MS) {
          ctx.source = 'redirect';
        }
      }
    }
  } catch {
    /* private mode or corrupt record: treat as a direct hit */
  }

  // The squeeze writes this one when the capture died, purely so the repair
  // field prefills instead of making a 70 year old retype her address. It is
  // deliberately NOT an opt-in signal.
  if (!ctx.email) {
    try {
      const raw = sessionStorage.getItem('bpq_foods101_retry');
      if (raw) {
        const rec = JSON.parse(raw);
        const stored = takeEmail(rec && rec.email);
        if (stored) {
          ctx.email = stored;
          if (!ctx.firstName) ctx.firstName = takeName(rec.firstName);
        }
      }
    } catch {
      /* private mode or corrupt record */
    }
  }

  // Last resort, and prefill ONLY: this key is shared with the quiz gates, so
  // the address may belong to a different funnel entirely. emailFromOptin
  // stays false, which keeps it out of every line of visible copy.
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
    () => readOptinContext(location.state),
    // Read once on mount. The router state does not change under this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The guide is only confirmed sent when this visitor actually opted in AND
  // the capture did not fail. A cold direct hit has no opt-in signal at all,
  // so it gets the repair form and a download link, not a false confirmation.
  const [delivered, setDelivered] = useState(ctx.optin && !ctx.captureFailed);
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

  // Page view. funnel_version is NOT registered as a super property here:
  // posthog.register() is device-persistent for a year, so it would relabel
  // every later event on this device, including annie-v2 ones. baseProps()
  // already stamps funnel_version on all of this funnel's events.
  useEffect(() => {
    track('foods101_thanks_viewed', {
      ...baseProps(),
      optin: ctx.optin,
      capture_failed: ctx.captureFailed,
      suppressed: ctx.suppressed,
      source: ctx.source,
    });
  }, [ctx.optin, ctx.captureFailed, ctx.suppressed, ctx.source]);

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
      // compared in the same PostHog funnel. homepage_variant is the same
      // property name CheckoutPage fires, so the breakdown lines up.
      track('checkout_clicked', {
        ...base,
        product: 'bp-corner-reset',
        value: 17.0,
        source: 'foods101-oto',
        corner: 'stress',
        placement,
        homepage_variant: getAbHomeVariant(),
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
      let data = {};
      try {
        data = await res.json();
      } catch {
        /* tolerate an empty body */
      }

      // An unsubscribed address is a 200, but nothing was mailed. Saying
      // "sent" there would be a plain false statement, so it gets its own
      // state and its own copy. Do NOT flip delivered.
      if (data && data.suppressed) {
        setResendState('suppressed');
        track('foods101_guide_resend_suppressed', baseProps());
        return;
      }

      // Keep whatever the squeeze recorded (the arm, and anything added
      // later) instead of overwriting the record with a thinner one.
      const prior = readRecord().rec || {};

      setResendState(data && data.deduped ? 'deduped' : 'sent');
      setDelivered(true);
      setRegistered(true);
      try {
        localStorage.setItem('bwbp_lead_email', clean);
        sessionStorage.setItem(
          'bpq_foods101',
          JSON.stringify({ ...prior, email: clean, firstName: ctx.firstName || '', at: Date.now() }),
        );
      } catch {
        /* storage blocked: the send still happened */
      }
      track('foods101_guide_resend_succeeded', { ...baseProps(), deduped: Boolean(data && data.deduped) });
    } catch (err) {
      setResendState('error');
      setResendError('That did not go through. Try once more, or email joel@bpquiz.com and I will send it by hand.');
      track('foods101_guide_resend_failed', { ...baseProps(), http_status: err.status || 0 });
    }
  }

  // Repair branch copy. Three genuinely different situations land here, and
  // only one of them is an error on our side, so only one of them says so.
  const repairMode = ctx.suppressed ? 'suppressed' : ctx.captureFailed ? 'failed' : 'cold';
  const repairHead = {
    suppressed: 'Your guide is right here.',
    failed: 'Your guide did not go out. Let us fix that.',
    cold: 'Get your 101 Foods Guide.',
  }[repairMode];
  const repairBody = {
    suppressed:
      'You unsubscribed from my emails, so I cannot put this one in your inbox. Nothing broke, and the file is still yours.',
    failed: 'Something broke on our end, not yours. Put your email in again and I will send it now.',
    cold: 'Put your email in below and I will send it now, or take it straight from here.',
  }[repairMode];
  const repairCta = repairMode === 'failed' ? 'Send it again' : 'Send me the guide';

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
          sent. Do NOT claim the kit is exclusive to this page. The same
          $17 offer at the same CHECKOUT_URL is linked from the squeeze
          (FoodsGuideLanding.jsx), printed twice in the guide PDF
          (101-foods-bp.html), and sent in the evergreen drip
          (api/_evergreen-emails.js). ===== */}
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
          ? 'Your guide is sent. One more thing goes with it.'
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
                {ctx.emailFromOptin && ctx.email ? (
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
                {repairHead}
              </h1>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.55, margin: '0 0 0.6rem', opacity: 0.93 }}>
                {repairBody}{' '}
                <a
                  href={GUIDE_PDF}
                  onClick={() => downloadGuide('repair')}
                  style={{
                    color: 'var(--cream, #FBF8F1)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Download the guide right here.
                </a>
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
                  {resendState === 'sending' ? 'Sending your guide...' : repairCta}
                </button>
                {resendError ? (
                  <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#FFD9C9' }}>
                    {resendError}
                  </p>
                ) : null}
              </form>
            </>
          )}

          {resendState === 'sent' || resendState === 'deduped' ? (
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {resendState === 'deduped'
                ? 'You already have this one from me. Check your inbox, or '
                : 'Sent. Check your inbox in about a minute, or '}
              <a
                href={GUIDE_PDF}
                onClick={() => downloadGuide('retry')}
                style={{ color: 'var(--cream, #FBF8F1)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                download it right here.
              </a>
            </p>
          ) : null}

          {resendState === 'suppressed' ? (
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
              That address is unsubscribed, so I cannot mail it there.{' '}
              <a
                href={GUIDE_PDF}
                onClick={() => downloadGuide('suppressed')}
                style={{ color: 'var(--cream, #FBF8F1)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Download it right here.
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
            Grab the complete step by step blueprint built to help steady blood pressure{' '}
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

          {/* NOT a compare-at price. $209 is the honest sum of the eleven solo
              values in kitStack.js and has never been charged, so it is a
              plain span, never a strikethrough. Same sentence the guide
              itself prints, so the PDF and this page agree. */}
          <p style={{ margin: '0 0 0.55rem', fontSize: '1rem', lineHeight: 1.4 }}>
            <span style={{ color: 'var(--muted, #7A7061)' }}>
              Eleven documents,{' '}
              <span style={{ color: 'var(--clay, #B85A36)' }}>${KIT_STACK_TOTAL}</span> of material.
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

        {/* ===== 5. The stack, itemized. This sits DIRECTLY under the CTA on
            purpose. The kit poster used to sit here, and 200px of image
            between the button and the list pushed the first stack row a full
            screen below the fold on a 390px phone: the itemized eleven is
            what justifies the price, so it reads first and the poster
            reinforces it afterwards. Do not put anything back between the
            CTA block and this card. Values and total come from the shared
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
            <span style={{ color: 'var(--muted, #7A7061)' }}>Real value of the eleven documents</span>
            <span style={{ color: 'var(--clay, #B85A36)', fontWeight: 600 }}>${KIT_STACK_TOTAL}</span>
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

        {/* ===== 6. What is inside, shown not told. Below the itemized stack,
            not above it. ===== */}
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

        {/* ===== 10. Compliance. Same wording variant A already ships
            (CheckoutPage.jsx), so both arms of the test are held to the same
            standard. The audience is mostly ON medication, so the do-not-
            change-your-medication line is not optional. ===== */}
        <div
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.8rem',
            lineHeight: 1.55,
            maxWidth: '58ch',
            margin: '2rem auto 0',
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

      {/* ===== 11. Sticky mobile bar, after the offer CTA scrolls away ===== */}
      <div className={`bpq-stickybar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <button type="button" onClick={() => buyKit('sticky')} tabIndex={showBar ? 0 : -1}>
          Add the complete kit &middot; ${KIT_PRICE}
        </button>
      </div>
    </div>
  );
}
