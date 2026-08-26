// TeaOtoConfirmedPage (route: /tea-oto-confirmed) — where Stripe returns a
// paid $67 Challenge OTO buyer.
//
// This page is not decoration: it is what CALLS api/tea-oto-confirm.js, which
// writes the seat to KV and sends the confirmation email. The kit webhook
// deliberately skips funnel 'challenge-oto', so if this fetch never fires the
// buyer is charged and hears nothing.
//
// It therefore tells the truth in every branch, including the ugly one. When
// the email fails, the server has already emailed Joel, and this page says the
// seat is saved and the details are coming by hand rather than claiming an
// email is sitting in an inbox that never received it.

import { useEffect, useMemo, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { track } from '../utils/analytics.js';

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };
const WINE = '#5a1725';
const GOLD = '#c6a05e';
const CREAM = '#fbf7f1';
const INK = '#191614';
const MUTED = '#5f574f';

function readSession() {
  try {
    return new URLSearchParams(window.location.search).get('session_id') || '';
  } catch {
    return '';
  }
}

export default function TeaOtoConfirmedPage() {
  const sessionId = useMemo(readSession, []);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionId) { if (!cancelled) setResult({ registered: false, reason: 'no_session' }); return; }
      try {
        const r = await fetch('/api/tea-oto-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const j = await r.json();
        if (!cancelled) {
          setResult(j);
          if (j.registered) track('tea_oto_purchase', { price: j.price || 67 });
        }
      } catch {
        // The charge already happened. Never imply it did not.
        if (!cancelled) setResult({ registered: false, reason: 'network' });
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const page = {
    minHeight: '100vh', background: CREAM, color: INK,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: 1.6, padding: '3rem 1.15rem 4rem',
  };
  const wrap = { maxWidth: 600, margin: '0 auto' };

  if (!result) {
    return <main style={page}><div style={wrap}><p style={{ color: MUTED }}>Saving your seat.</p></div></main>;
  }

  const ok = result.registered;

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={{
          width: 54, height: 54, borderRadius: 999,
          background: ok ? GOLD : '#e4dace',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 0 1.3rem',
        }}>
          {ok ? <Check size={28} color="#2b1408" /> : <AlertCircle size={28} color={WINE} />}
        </div>

        <h1 style={{ ...serif, fontSize: 'clamp(1.9rem, 6vw, 2.7rem)', color: WINE, margin: '0 0 1rem', lineHeight: 1.15 }}>
          {ok ? 'Your seat is saved.' : 'We are finishing this by hand.'}
        </h1>

        {ok ? (
          <>
            {result.startLabel ? (
              <p style={{ margin: '0 0 1.2rem', fontSize: '1.15rem' }}>
                The Change My Life Challenge starts <strong>{result.startLabel}</strong>
                {result.timeLabel ? <> at <strong>{result.timeLabel}</strong></> : null}.
              </p>
            ) : null}

            {result.emailed === false ? (
              <p style={{
                margin: '0 0 1.2rem', background: '#fff', borderLeft: `3px solid ${WINE}`,
                borderRadius: 10, padding: '1rem 1.2rem',
              }}>
                Your seat is registered, but our confirmation email did not go through.
                Joel has already been told and will send your room details himself. You
                do not need to do anything.
              </p>
            ) : (
              <p style={{ margin: '0 0 1.2rem' }}>
                Check your email. Your room details are in there. If you do not see it
                in a few minutes, look in your spam folder, then reply to any email
                from us and we will sort it out.
              </p>
            )}

            <p style={{ margin: '0 0 1.2rem' }}>
              Put it on your calendar now, while you are thinking about it. Bring
              something to write on. That is the whole ask.
            </p>

            <p style={{ margin: '0 0 2rem', color: MUTED }}>
              Your STEADY is packing separately and ships on its own. Nothing about
              this changed your tea order.
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 1.2rem', fontSize: '1.1rem' }}>
              Your payment went through. We could not finish saving your seat
              automatically, so a person is doing it.
            </p>
            <p style={{ margin: '0 0 2rem' }}>
              Email <a href="mailto:braveworksrn@gmail.com" style={{ color: WINE }}>braveworksrn@gmail.com</a> and
              we will confirm you by hand and send your room details. You will not be
              charged twice and you have not lost your seat.
            </p>
          </>
        )}

        <p style={{ margin: 0 }}>
          <a href="/" style={{ color: MUTED, fontSize: '0.95rem' }}>
            Back to BraveWorks RN
          </a>
        </p>
      </div>
    </main>
  );
}
