import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { sabbathStatus, reopenLabel } from '../utils/sabbath';

// =====================================================================
// SabbathGate — closes the BPQuiz storefront from sundown Friday to
// sundown Saturday (Fordsville, KY local sunset, recomputed every week).
//
// WHAT GETS CLOSED: the public storefront + funnel — the homepage,
// the quiz (/quiz, /start), and the other commerce/offer pages.
//
// WHAT STAYS OPEN (exempt prefixes below):
//   • Content/SEO   — /blog, /about, /privacy, /terms, /disclaimer
//                     (so Googlebot never sees a "closed" page → no SEO hit)
//   • Fulfillment   — /success, /upsell*, /library, /downloads, *-welcome
//                     (a paying customer can still reach what they bought)
//   • Ops + clients — /ops, /wakita, /luvenia, /intake, /apply
//                     (Joel's dashboard + white-label client intakes — their
//                      businesses don't observe Joel's Sabbath)
//
// HOST SCOPE: only the apex storefront (bpquiz.com / www.bpquiz.com).
// Vanity client subdomains are never gated.
//
// TEST OVERRIDES (query string):
//   ?sabbath=force  → always show the gate (verify the closed state anytime)
//   ?sabbath=off    → never show the gate (bypass during testing)
//
// FAIL-OPEN: sabbathStatus() returns inactive on any internal error, so a
// calculation bug can never black out the store for a week.
// =====================================================================

const EXEMPT_PREFIXES = [
  '/blog', '/learn', '/articles', '/about',
  '/privacy', '/terms', '/disclaimer',
  '/success', '/upsell', '/oto', '/library', '/downloads',
  '/coaching-welcome', '/sprint-welcome', '/seminar-welcome',
  // Tea fulfillment: post-purchase confirmation only. /pay stays GATED (Joel
  // 2026-07-12: tea rests with the store; the static /tea page carries its
  // own matching gate since it lives outside this React tree).
  '/tea-thanks',
  '/ops', '/wakita', '/luvenia', '/intake', '/apply',
  // App waitlist — email capture, not commerce. Nothing is sold there.
  '/waitlist', '/app',
];

function isStoreHost(hostname) {
  // 2026-08-21 (Joel): changemylifechallenge.com added — its SPA routes
  // (/payment, /challenge-confirmed) take money too. The static root page on
  // that host carries its own gate (public/sabbath-gate.js).
  return hostname === 'bpquiz.com' || hostname === 'www.bpquiz.com'
    || hostname === 'changemylifechallenge.com' || hostname === 'www.changemylifechallenge.com';
}

function isGatedPath(pathname) {
  return !EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));
}

export default function SabbathGate() {
  const { pathname, search } = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [remindState, setRemindState] = useState('idle'); // idle|busy|sent|error
  const [remindEmail, setRemindEmail] = useState('');

  // Re-evaluate every minute (so the gate lifts itself at Saturday sundown
  // without a reload) and whenever the tab regains focus.
  useEffect(() => {
    const tick = () => setNow(new Date());
    // 1s tick: the gate now shows a live countdown to Saturday sundown.
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const params = new URLSearchParams(search);
  const override = params.get('sabbath'); // 'force' | 'off' | null
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const status = sabbathStatus(now);
  const timeActive =
    override === 'force' ? true : override === 'off' ? false : status.active;
  const hostOk = override === 'force' || isStoreHost(hostname);
  const show = timeActive && hostOk && isGatedPath(pathname);

  // Lock background scroll only while the gate is visible.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  const reopen = reopenLabel(status.satSunset);
  const opensMs = status.satSunset ? status.satSunset.getTime() : Date.now() + 25 * 3600e3;
  const left = Math.max(0, opensMs - now.getTime());
  const pad = (n) => String(n).padStart(2, '0');
  const countdown = `${pad(Math.floor(left / 3600e3))}:${pad(Math.floor((left % 3600e3) / 60e3))}:${pad(Math.floor((left % 60e3) / 1e3))}`;

  const submitReminder = async (e) => {
    e.preventDefault();
    if (remindState === 'busy' || remindState === 'sent') return;
    setRemindState('busy');
    try {
      const r = await fetch('/api/sabbath-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: remindEmail.trim(), source: 'bpquiz', endsAtMs: opensMs }),
      });
      setRemindState(r.ok ? 'sent' : 'error');
    } catch {
      setRemindState('error');
    }
  };

  return (
    <div role="dialog" aria-label="Closed for the Sabbath" style={S.overlay}>
      <div style={S.card}>
        <div style={S.wordmark}>BraveWorks RN&nbsp;·&nbsp;BPQuiz.com</div>

        {/* Setting sun */}
        <svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true" style={{ margin: '4px auto 14px', display: 'block' }}>
          <line x1="6" y1="40" x2="62" y2="40" stroke="var(--clay, #B85A36)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="40" r="13" fill="var(--gold, #C8A252)" />
          <g stroke="var(--gold, #C8A252)" strokeWidth="2" strokeLinecap="round">
            <line x1="34" y1="14" x2="34" y2="6" />
            <line x1="16" y1="22" x2="11" y2="17" />
            <line x1="52" y1="22" x2="57" y2="17" />
            <line x1="9" y1="34" x2="3" y2="32" />
            <line x1="59" y1="34" x2="65" y2="32" />
          </g>
        </svg>

        <h1 style={S.h1}>Closed for the Sabbath</h1>

        <p style={S.body}>
          From sundown Friday to sundown Saturday, our family observes the
          Sabbath. It is not a glitch and nothing is wrong — we close
          everything we sell for one day each week, rest, and put our
          attention on God and on each other.
        </p>

        <div style={S.pill}>
          Reopening <strong style={{ color: 'var(--ink, #121110)' }}>{reopen}</strong>
        </div>

        <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, letterSpacing: '.04em', margin: '12px 0 2px' }}>
          {countdown}
        </div>
        <p style={S.sub}>until the doors open again</p>

        {remindState === 'sent' ? (
          <p style={{ ...S.sub, color: 'var(--gold, #C8A252)', fontWeight: 700 }}>
            Done. One email, right when the doors open. Rest well.
          </p>
        ) : (
          <form onSubmit={submitReminder} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 380, margin: '14px auto 0' }}>
            <input
              type="email" required placeholder="Your email" aria-label="Your email"
              value={remindEmail} onChange={(e) => setRemindEmail(e.target.value)}
              style={{ flex: '1 1 190px', minWidth: 0, padding: '11px 14px', borderRadius: 999, border: '1px solid var(--line, #E2D6C2)', background: '#fff', font: 'inherit', fontSize: 14 }}
            />
            <button type="submit" disabled={remindState === 'busy'} style={{ flex: '0 0 auto', padding: '11px 18px', borderRadius: 999, border: 0, background: 'var(--ink, #121110)', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
              {remindState === 'busy' ? 'ONE MOMENT' : 'EMAIL ME WHEN IT ENDS'}
            </button>
            {remindState === 'error' ? (
              <p role="alert" style={{ ...S.sub, color: '#8a1f2f', width: '100%', margin: '4px 0 0' }}>
                That did not go through. Please try again.
              </p>
            ) : null}
          </form>
        )}

        <div style={S.rule} />

        <p style={S.verse}>
          “Remember the Sabbath day, to keep it holy.”
          <span style={S.verseRef}> — Exodus 20:8</span>
        </p>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2147483000, // above everything
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background:
      'radial-gradient(120% 120% at 50% 0%, #FCF7EE 0%, #F2E9D7 55%, #E7D6BC 100%)',
    fontFamily:
      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    textAlign: 'center',
    background: 'rgba(255,255,255,0.62)',
    border: '1px solid var(--line, #D8CFBD)',
    borderRadius: 22,
    padding: 'clamp(28px, 6vw, 44px) clamp(22px, 5vw, 38px)',
    boxShadow: '0 24px 60px -24px rgba(31,26,23,0.30)',
  },
  wordmark: {
    fontSize: '0.72rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--clay, #B85A36)',
    fontWeight: 700,
    marginBottom: 18,
  },
  h1: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 'clamp(1.9rem, 1.4rem + 2.4vw, 2.6rem)',
    lineHeight: 1.1,
    color: 'var(--ink, #121110)',
    margin: '0 0 14px',
    letterSpacing: '-0.01em',
  },
  body: {
    fontSize: '1.05rem',
    lineHeight: 1.6,
    color: 'var(--ink-soft, #2B2824)',
    margin: '0 auto 20px',
    maxWidth: 380,
  },
  pill: {
    display: 'inline-block',
    padding: '0.6rem 1.1rem',
    borderRadius: 999,
    background: 'rgba(74,93,78,0.10)',
    border: '1px solid rgba(74,93,78,0.30)',
    color: 'var(--sage, #4A5D4E)',
    fontSize: '0.98rem',
    fontWeight: 500,
    marginBottom: 18,
  },
  sub: {
    fontSize: '0.95rem',
    lineHeight: 1.55,
    color: 'var(--muted, #7A7061)',
    margin: '0 auto',
    maxWidth: 360,
  },
  rule: {
    width: 54,
    height: 1,
    background: 'var(--line, #D8CFBD)',
    margin: '24px auto',
  },
  verse: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontStyle: 'italic',
    fontSize: '1rem',
    lineHeight: 1.5,
    color: 'var(--ink-soft, #2B2824)',
    margin: 0,
  },
  verseRef: {
    fontStyle: 'normal',
    color: 'var(--muted, #7A7061)',
    fontSize: '0.86rem',
  },
};
