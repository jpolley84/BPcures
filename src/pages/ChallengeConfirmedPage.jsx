// ChallengeConfirmedPage (route: /challenge-confirmed)
//
// The return_url of the Three Pressures Challenge embedded checkout
// (api/create-embedded-checkout.js sets
//  /challenge-confirmed?session_id={CHECKOUT_SESSION_ID}&tier=challenge-ga|challenge-vip).
//
// 2026-07-26: this page was MISSING when the challenge shipped, which meant a
// buyer completed payment and landed on the SPA's catch-all with no
// confirmation, no Zoom details, and no evidence anything had happened. That is
// the worst moment in any funnel to show someone nothing.
//
// It POSTs { intent:'register', sessionId } to /api/challenge-signup on mount.
// That endpoint is the single source of truth: it retrieves the Checkout
// Session server-side and requires status complete + payment_status paid +
// metadata.offer === 'challenge' before it will email the Zoom link, and it
// takes the buyer's address from the SESSION, never from anything this page
// sends. So this page cannot be used to mail a stranger the join details.
//
// Registration is ALSO triggered independently by api/triangle-webhook.js on
// checkout.session.completed. Both paths are idempotent per session id, so a
// buyer who closes the tab before this page loads still gets their seat. This
// page is the fast path and the receipt, not the only path.
//
// ZERO em dashes in visible copy.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../utils/analytics.js';

const CLAY = 'var(--clay, #B85A36)';
const INK = 'var(--ink, #1E2B2A)';
const CREAM = 'var(--cream, #FAF6EF)';

const SUPPORT_EMAIL = 'braveworksrn@gmail.com';

// Kept in sync with the CHALLENGE config block in src/pages/ChallengePage.jsx.
const NIGHTS = [
  ['Night 1', 'Monday, August 3', 'Your Real Number'],
  ['Night 2', 'Tuesday, August 4', 'Stress Pressure'],
  ['Night 3', 'Wednesday, August 5', 'Sugar Pressure'],
  ['Night 4', 'Thursday, August 6', 'Sodium Pressure'],
  ['Night 5', 'Friday, August 7', 'The Conversation'],
];

function readParams() {
  try {
    const p = new URLSearchParams(window.location.search);
    const sid = p.get('session_id') || '';
    const tier = p.get('tier') || '';
    return {
      sessionId: /^cs_[A-Za-z0-9_]+$/.test(sid) ? sid : '',
      tier: tier === 'challenge-vip' || tier === 'challenge-ga' ? tier : '',
    };
  } catch {
    return { sessionId: '', tier: '' };
  }
}

export default function ChallengeConfirmedPage() {
  const [{ sessionId, tier }] = useState(readParams);
  // 'working' | 'confirmed' | 'already' | 'nosession' | 'failed'
  const [state, setState] = useState(sessionId ? 'working' : 'nosession');
  const [email, setEmail] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    track('chal_confirmed_view', {
      page: 'challenge-confirmed',
      tier: tier || 'unknown',
      has_session: Boolean(sessionId),
    });

    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/challenge-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: 'register', sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.ok) {
          if (data.email) setEmail(String(data.email));
          setState(data.already ? 'already' : 'confirmed');
          track('chal_registered', { tier: tier || data.tier || 'unknown', already: Boolean(data.already) });
        } else {
          setState('failed');
          track('chal_register_failed', { tier: tier || 'unknown', status: res.status });
        }
      } catch {
        if (!cancelled) {
          setState('failed');
          track('chal_register_failed', { tier: tier || 'unknown', status: 0 });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, tier]);

  const isVip = tier === 'challenge-vip';

  return (
    <div style={{ background: CREAM, minHeight: '100vh', color: INK, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.1rem 3rem' }}>

        <div style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: CLAY, fontWeight: 800, marginBottom: '0.9rem' }}>
          BraveWorks RN
        </div>

        {state === 'working' && (
          <>
            <h1 style={{ fontSize: '1.55rem', margin: '0 0 0.5rem', lineHeight: 1.15 }}>Saving your seat.</h1>
            <p style={{ color: '#4A5A58' }}>One moment. Do not close this page.</p>
          </>
        )}

        {(state === 'confirmed' || state === 'already') && (
          <>
            <h1 style={{ fontSize: '1.55rem', margin: '0 0 0.5rem', lineHeight: 1.15 }}>
              You are in{isVip ? ', and you are VIP' : ''}.
            </h1>
            <p style={{ fontSize: '1.02rem', color: '#3A4A48' }}>
              {state === 'already'
                ? 'You were already registered, so nothing was charged twice and nothing was sent twice.'
                : 'Your seat for The Three Pressures Challenge is confirmed.'}
              {' '}
              {email
                ? <>Your confirmation is on its way to <strong>{email}</strong>.</>
                : 'Your confirmation is on its way to the address you paid with.'}
            </p>

            <div style={{ background: '#FFFFFF', border: '1px solid #E4DACE', borderRadius: 12, padding: '1rem 1.1rem', margin: '1.2rem 0' }}>
              <p style={{ margin: '0 0 0.6rem', fontWeight: 700 }}>Your five nights</p>
              {NIGHTS.map(([n, date, title]) => (
                <div key={n} style={{ display: 'flex', gap: '0.6rem', padding: '0.32rem 0', fontSize: '0.93rem', borderBottom: '1px solid #F2EAE0' }}>
                  <span style={{ color: CLAY, fontWeight: 700, minWidth: 56 }}>{n}</span>
                  <span style={{ flex: 1 }}>{date}</span>
                  <span style={{ color: '#6A7A78' }}>{title}</span>
                </div>
              ))}
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.93rem', color: '#4A5A58' }}>
                Every night starts at 7:00pm CT, which is 8:00pm ET, and runs about an hour.
              </p>
            </div>

            <div style={{ background: '#F4E6DE', borderRadius: 12, padding: '0.9rem 1.1rem', margin: '1.2rem 0' }}>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>What happens next</p>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#3A4A48' }}>
                Watch your inbox for the join details. Save that email. It is the same room all five nights,
                so you only need the one link. If it has not arrived within about an hour, check your spam
                folder first, then write to {SUPPORT_EMAIL} and I will send it by hand.
              </p>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#4A5A58' }}>
              Your seat also includes the 10-Day BP Reset Kit. It is already in your library.
            </p>
            <Link
              to="/library"
              style={{ display: 'inline-block', background: CLAY, color: '#fff', fontWeight: 800, textDecoration: 'none', padding: '0.8rem 1.4rem', borderRadius: 999, minHeight: 48, lineHeight: '2rem' }}
            >
              Open my library
            </Link>
          </>
        )}

        {state === 'nosession' && (
          <>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem', lineHeight: 1.15 }}>Nothing to confirm here.</h1>
            <p style={{ color: '#3A4A48' }}>
              This page confirms a challenge seat right after checkout, and it did not receive a
              checkout to confirm. If you just paid and landed here, nothing is lost: write to{' '}
              {SUPPORT_EMAIL} and I will sort it out personally.
            </p>
            <Link to="/challenge" style={{ color: CLAY, fontWeight: 700 }}>See the challenge</Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem', lineHeight: 1.15 }}>
              Your payment went through. The confirmation did not.
            </h1>
            <p style={{ color: '#3A4A48' }}>
              Your seat is safe. Payment and registration are two separate steps on my side, and the
              second one did not answer just now. It usually completes on its own within a few minutes,
              and your confirmation will arrive without you doing anything.
            </p>
            <p style={{ color: '#3A4A48' }}>
              If nothing has arrived in an hour, write to <strong>{SUPPORT_EMAIL}</strong> and mention
              the challenge. I will find your payment and send the join details by hand.
            </p>
          </>
        )}

        {/* Same medication language as every other page that touches blood pressure. */}
        <div style={{ marginTop: '2.2rem', paddingTop: '0.9rem', borderTop: '1px solid #E4DACE', fontSize: '0.76rem', color: '#8A8A8A', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 0.4rem' }}>
            Educational and lifestyle content only. Not medical advice, diagnosis, or treatment.
            Joel Polley is a Registered Nurse, not a prescribing physician. Never start, stop, or
            adjust medication without your doctor.
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/terms" style={{ color: '#8A8A8A' }}>Terms</Link>{' · '}
            <Link to="/privacy" style={{ color: '#8A8A8A' }}>Privacy Policy</Link>{' · '}
            <Link to="/disclaimer" style={{ color: '#8A8A8A' }}>Disclaimer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
