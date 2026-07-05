// PayPage (route: /pay) — EMBEDDED Stripe checkout, ported into bpquiz-site so
// the reverted old site charges the new Triangle kits INLINE (no buy.stripe.com
// redirect, which was the step cold buyers abandoned). App.jsx wraps this in the
// old SiteLayout (Navbar + Footer), so this component returns the section only.
//
// Contract (shared with api/create-embedded-checkout.js):
//   POST { tier?='corner', corner?, email? } -> { clientSecret }
// tier is read from ?tier= (corner|top2|complete). corner is read from ?corner=
// (URL wins, so the sale-first buy links pass corner=stress), else the quiz
// result in sessionStorage bp_quiz, else null. On completion Stripe returns the
// top frame to return_url (/welcome), configured server-side. ZERO em-dashes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';

// One Stripe instance at module load (Stripe's recommended pattern). Null when
// the publishable key is not set, so the page degrades to a clear message.
const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

const VALID_TIERS = new Set(['corner', 'top2', 'complete']);
const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium']);

function readContext() {
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tier');
    const tier = VALID_TIERS.has(t) ? t : 'corner';
    // ?corner= wins (the sale-first buy links pass corner=stress so a
    // quiz-skipper gets the Stress kit), else the quiz result, else null.
    const urlCorner = params.get('corner');
    const quiz = JSON.parse(sessionStorage.getItem('bp_quiz') || '{}');
    const corner = VALID_CORNERS.has(urlCorner)
      ? urlCorner
      : VALID_CORNERS.has(quiz.corner)
        ? quiz.corner
        : null;
    let email = '';
    try {
      email = localStorage.getItem('bwbp_lead_email') || '';
    } catch {
      /* private mode */
    }
    return { tier, corner, email };
  } catch {
    return { tier: 'corner', corner: null, email: '' };
  }
}

export default function PayPage() {
  const { tier, corner, email } = useMemo(readContext, []);
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let checkout;
    let cancelled = false;

    async function init() {
      if (!stripePromise) {
        setError('Checkout is briefly unavailable. Please refresh in a moment, or use the button on the previous page again.');
        return;
      }
      try {
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier, corner, email }),
            });
            if (!res.ok) throw new Error('start_failed');
            const data = await res.json();
            if (!data.clientSecret) throw new Error('no_secret');
            return data.clientSecret;
          },
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        checkout.mount(containerRef.current);
      } catch {
        setError('Something went wrong starting checkout. Please try again.');
      }
    }

    init();
    return () => {
      cancelled = true;
      try {
        if (checkout) checkout.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [tier, corner, email]);

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 600, color: 'var(--sage, #5a7d5a)', margin: '0 0 0.4rem' }}>
          Secure checkout
        </p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0 0 0.6rem', color: 'var(--navy, #1a2b4a)' }}>
          You are seconds from your reset.
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--dark-gray, #555)' }}>
          <span>Encrypted, secured by Stripe</span>
          <span>30-day money-back guarantee</span>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--clay, #b85a36)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1rem' }}>
          {error}
        </p>
      )}

      {/* Stripe mounts the embedded card form here. */}
      <div ref={containerRef} style={{ maxWidth: 680, margin: '0 auto', minHeight: 320 }} />

      <p style={{ textAlign: 'center', color: 'var(--dark-gray, #666)', fontSize: '0.8rem', maxWidth: '58ch', margin: '1.5rem auto 0' }}>
        This is education and lifestyle support, not medical advice, diagnosis, or treatment. See our{' '}
        <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </section>
  );
}
