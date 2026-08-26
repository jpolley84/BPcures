// TeaOtoPage (route: /tea-oto) — the $67 Change My Life Challenge one-time
// offer that rides on a paid Shopify tea order.
//
// Reached ONLY from the tokenized link in the tea welcome email
// (api/_tea-welcome-email.js). The token carries the buyer's email and a
// signed issue time; api/tea-oto-checkout.js enforces the 24 hour window
// server side. The countdown below is decoration, not the gate.
//
// Copy rules this page follows (house style, see OtoCompletePage.jsx):
//   * 3rd grade language, ZERO em dashes
//   * the one-time frame must be TRUE. It is: $67 exists only behind a signed
//     token that expires, and nowhere else on the site. We never say "this
//     price disappears forever" because the Challenge itself will run again.
//   * no invented testimonials, no invented numbers, no medical promises
//
// Every state renders something calm and useful. A dead or expired link sends
// the reader to the quiz rather than a wall.
//
// 2026-08-26 (Joel): the dead-link and decline paths used to point at the FREE
// masterclass. The masterclass was pulled from ALL advertising on 2026-08-26 --
// it still runs for people already registered, it is just never linked or sold.
// Both paths now go to the quiz, which is the evergreen entry point.

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Lock, Clock } from 'lucide-react';
import { track } from '../utils/analytics.js';

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const WINE = '#5a1725';
const GOLD = '#c6a05e';
const CREAM = '#fbf7f1';
const INK = '#191614';
const MUTED = '#5f574f';

function readToken() {
  try {
    const p = new URLSearchParams(window.location.search);
    return { token: p.get('t') || '', declined: p.get('declined') === '1' };
  } catch {
    return { token: '', declined: false };
  }
}

function useCountdown(expiresMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresMs) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresMs]);
  if (!expiresMs) return null;
  const left = Math.max(0, expiresMs - now);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return { h, m, s, done: left <= 0 };
}

export default function TeaOtoPage() {
  const { token, declined } = useMemo(readToken, []);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/tea-oto-checkout?t=${encodeURIComponent(token)}`);
        const j = await r.json();
        if (!cancelled) setInfo(j);
      } catch {
        // A network failure must not render a broken page. Treat it as closed
        // and show the free class, which is always a true and useful offer.
        if (!cancelled) setInfo({ state: 'closed' });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const countdown = useCountdown(info?.expiresMs);

  useEffect(() => {
    if (info?.state) track('tea_oto_view', { state: info.state });
  }, [info?.state]);

  async function buy() {
    setBusy(true);
    setError('');
    track('tea_oto_click', {});
    try {
      const r = await fetch('/api/tea-oto-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token }),
      });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setError(
        j.error === 'expired' ? 'This offer ran out. The free class below is still open.'
          : j.error === 'offer_closed' ? 'This offer is closed right now. The free class below is still open.'
          : 'Something went wrong on our end. Please try again.'
      );
    } catch {
      setError('Something went wrong on our end. Please try again.');
    }
    setBusy(false);
  }

  const page = {
    minHeight: '100vh', background: CREAM, color: INK,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: 1.6, padding: '2rem 1.15rem 4rem',
  };
  const wrap = { maxWidth: 640, margin: '0 auto' };
  const eyebrow = {
    fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase',
    color: '#8a642b', fontWeight: 700, margin: '0 0 1rem',
  };

  if (!info) {
    return <main style={page}><div style={wrap}><p style={{ color: MUTED }}>One moment.</p></div></main>;
  }

  // ── Closed / expired / broken link ───────────────────────────────────
  // One shared fallback. It never blames the reader and always gives them the
  // free class, which needs no token and no cohort.
  if (info.state !== 'live') {
    const headline = info.state === 'expired'
      ? 'This one ran out.'
      : info.state === 'bad_token' || info.state === 'no_token'
        ? 'This link is not working.'
        : 'This offer is not open right now.';
    return (
      <main style={page}>
        <div style={wrap}>
          <p style={eyebrow}>BraveWorks RN</p>
          <h1 style={{ ...serif, fontSize: 'clamp(1.9rem, 6vw, 2.6rem)', color: WINE, margin: '0 0 1rem' }}>
            {headline}
          </h1>
          <p style={{ margin: '0 0 1.5rem', fontSize: '1.05rem' }}>
            Your tea is still on its way, and nothing is wrong with your order. This
            page just had a deadline on it.
          </p>
          <p style={{ margin: '0 0 1.5rem', fontSize: '1.05rem' }}>
            The quiz is always open, and it is the same teaching the Challenge is
            built on. Start there.
          </p>
          <a
            href="/quiz"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: WINE, color: '#fff', textDecoration: 'none',
              padding: '1rem 1.6rem', borderRadius: 999, fontWeight: 700,
            }}
          >
            Take the quiz <ArrowRight size={18} />
          </a>
        </div>
      </main>
    );
  }

  // ── Live offer ────────────────────────────────────────────────────────
  return (
    <main style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Your order is in. One thing before you go.</p>

        <h1 style={{ ...serif, fontSize: 'clamp(2rem, 7vw, 3rem)', color: WINE, margin: '0 0 1rem', lineHeight: 1.15 }}>
          You just bought the tea. Want the plan that goes with it?
        </h1>

        <p style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>
          STEADY is one cup a day. It does one job and it does it quietly. The
          Change My Life Challenge is the other half: {info.daysAway === 0 ? 'live' : `${info.daysAway} days from now`} we
          sit down together and build the plan that the tea is supposed to be part of.
        </p>

        {/* Returned from a cancelled Stripe checkout. Say something human and
            get out of the way, rather than silently re-showing the same page
            as if nothing happened. */}
        {declined ? (
          <p style={{
            margin: '0 0 1.25rem', background: '#fff', borderLeft: `3px solid ${GOLD}`,
            borderRadius: 10, padding: '0.9rem 1.1rem', color: MUTED,
          }}>
            No problem, nothing was charged. Your seat is still here if you want it.
          </p>
        ) : null}

        <div style={{
          background: '#fff', border: `1px solid #e4dace`, borderLeft: `3px solid ${GOLD}`,
          borderRadius: 12, padding: '1.3rem 1.4rem', margin: '0 0 1.5rem',
        }}>
          <p style={{ margin: '0 0 0.9rem', fontWeight: 700 }}>What happens on the call</p>
          {[
            'You put your numbers, your energy and your sleep on one page, so you can finally see the pattern instead of guessing.',
            'You learn which of the three pressures is actually driving yours: stress, sugar or sodium.',
            'You leave with one plan you can hand your doctor, in plain words, on one sheet of paper.',
            'You get the room live, so you can ask your own question out loud.',
          ].map((t) => (
            <p key={t} style={{ margin: '0 0 0.65rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Check size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 4 }} />
              <span>{t}</span>
            </p>
          ))}
          <p style={{ margin: '0.9rem 0 0', color: MUTED, fontSize: '0.95rem' }}>
            Starts {info.startLabel} at {info.timeLabel}. Come live if you can.
          </p>
        </div>

        <div style={{
          background: WINE, color: '#fff', borderRadius: 14,
          padding: '1.5rem 1.4rem', margin: '0 0 1.25rem', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>
            Because you just ordered tea
          </p>
          <p style={{ margin: '0 0 0.2rem' }}>
            <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '1.3rem' }}>${info.anchor}</span>
            <span style={{ ...serif, fontSize: '3rem', marginLeft: '0.6rem' }}>${info.price}</span>
          </p>
          {countdown && !countdown.done ? (
            <p style={{
              margin: '0.6rem 0 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              fontSize: '0.95rem', opacity: 0.9,
            }}>
              <Clock size={16} /> {countdown.h}h {countdown.m}m {countdown.s}s left
            </p>
          ) : (
            <p style={{ margin: '0.6rem 0 1rem', fontSize: '0.95rem', opacity: 0.9 }}>Good for 24 hours.</p>
          )}

          <button
            type="button"
            onClick={buy}
            disabled={busy}
            style={{
              width: '100%', background: GOLD, color: '#2b1408', border: 'none',
              padding: '1.15rem 1.5rem', borderRadius: 999, fontWeight: 800,
              fontSize: '1.1rem', cursor: busy ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {busy ? 'One moment...' : <>Save my seat for ${info.price} <ArrowRight size={19} /></>}
          </button>

          <p style={{ margin: '0.8rem 0 0', fontSize: '0.82rem', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={13} /> Secure checkout. One payment, not a subscription.
          </p>
        </div>

        {error ? (
          <p style={{ color: '#8a1f2f', margin: '0 0 1rem', fontWeight: 600 }}>{error}</p>
        ) : null}

        <p style={{ margin: '0 0 1.5rem', color: MUTED, fontSize: '0.95rem' }}>
          Straight answer on the price: ${info.price} is only on this page, only for the
          next 24 hours, and only because you just ordered STEADY. Everywhere else the
          seat is ${info.anchor}. If you miss it, the Challenge will run again at ${info.anchor},
          and the free class is always there.
        </p>

        <p style={{ margin: '0 0 2rem', color: MUTED, fontSize: '0.9rem' }}>
          The Challenge is teaching, not treatment. It joins the plan your doctor gave
          you, it does not replace it. Do not start, stop or change any medication
          because of something you hear on the call.
        </p>

        <p style={{ margin: 0, textAlign: 'center' }}>
          <a href="/quiz" style={{ color: MUTED, fontSize: '0.95rem' }}>
            No thanks, just show me where to start
          </a>
        </p>
      </div>
    </main>
  );
}
