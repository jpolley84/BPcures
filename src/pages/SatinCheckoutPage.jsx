// SatinCheckoutPage (route: /satin) — SVUTU Satin embedded checkout.
//
// 2026-07-21 (Joel): move Annie's Satin tea (hormoneteas.com) from Stripe
// Payment Links onto the embedded rail so it earns a true post-purchase
// one-click "double your order for a friend" (like Steady). hormoneteas.com's
// buy buttons now link here. Satin-branded so the brand stays continuous even
// though checkout renders on bpquiz.com (the publishable key + one-click infra
// live here and are tested). Card saved off_session for the one-click double;
// shipping collected inline. Recognized by the webhook via metadata blend:satin.
//
// ?tier=tea-satin-48|tea-satin-120 preselects. Not wrapped in SiteLayout
// (focused checkout). ZERO em dashes.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId } from '../utils/analytics';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

const TIERS = [
  { tier: 'tea-satin-48', price: 48, name: 'Try Satin', sub: '1 pouch, about 50 to 60 cups', note: 'A full month of the daily cup.' },
  { tier: 'tea-satin-120', price: 120, name: '90-Day Ritual, 3 pouches', sub: 'Best value, free shipping', note: 'A 90-day supply makes the daily ritual easier to keep.' },
];

const C = {
  cream: '#FBF7EF', ruby: '#A0506A', rubyDeep: '#7C3B52', rubySoft: '#F4E6EC',
  ink: '#3B3228', muted: '#7D6F5E', line: '#E7DDCB', sage: '#5F6E45',
};
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Montserrat', system-ui, -apple-system, sans-serif";

export default function SatinCheckoutPage() {
  const initialTier = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tier');
  const [selected, setSelected] = useState(
    initialTier === 'tea-satin-120' ? 'tea-satin-120' : 'tea-satin-48'
  );
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const option = TIERS.find((t) => t.tier === selected) || TIERS[0];

  // Load Satin fonts (self-contained; graceful serif/sans fallback if blocked).
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Montserrat:wght@400;600;700&display=swap';
    document.head.appendChild(l);
    track('satin_checkout_view');
    return () => { if (l.parentNode) l.parentNode.removeChild(l); };
  }, []);

  useEffect(() => {
    let checkout;
    let cancelled = false;
    setError('');
    async function init() {
      if (!stripePromise) { setError('Checkout is briefly unavailable. Please refresh.'); return; }
      try {
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier: option.tier, ph_did: getDistinctId() }),
            });
            if (!res.ok) throw new Error('start_failed');
            const data = await res.json();
            if (!data.clientSecret) throw new Error('no_secret');
            return data.clientSecret;
          },
        });
        if (cancelled) { checkout.destroy(); return; }
        checkout.mount(containerRef.current);
        track('satin_checkout_mounted', { tier: option.tier, value: option.price });
      } catch {
        setError('Something went wrong starting checkout. Please pick an option again or refresh.');
      }
    }
    init();
    return () => { cancelled = true; try { if (checkout) checkout.destroy(); } catch { /* gone */ } };
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: SANS }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(1.4rem, 4vw, 2.4rem) 1.15rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '0.68rem', fontWeight: 700, color: C.ruby }}>
            SVUTU Satin
          </span>
          <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', margin: '0.5rem 0 0', color: C.ink }}>
            Start your Satin ritual.
          </h1>
        </div>

        {/* Tier selector */}
        <div style={{ display: 'grid', gap: '0.7rem', marginBottom: '1.3rem' }}>
          {TIERS.map((t) => {
            const active = t.tier === selected;
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => { setSelected(t.tier); track('satin_tier_selected', { tier: t.tier }); }}
                style={{
                  textAlign: 'left', cursor: 'pointer', background: active ? '#fff' : 'transparent',
                  border: active ? `2px solid ${C.ruby}` : `1.5px solid ${C.line}`,
                  borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                }}
              >
                <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: active ? `5px solid ${C.ruby}` : `2px solid ${C.muted}`, background: '#fff' }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '1rem', color: C.ink }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: '0.82rem', color: C.muted }}>{t.sub}</span>
                </span>
                <span style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 500, color: C.rubyDeep }}>${t.price}</span>
              </button>
            );
          })}
        </div>

        {error && <p role="alert" style={{ color: C.rubyDeep, fontSize: '0.9rem' }}>{error}</p>}

        {/* Embedded Stripe checkout */}
        <div ref={containerRef} key={selected} style={{ minHeight: 360 }} />

        <p style={{ textAlign: 'center', margin: '0.9rem 0 0', fontSize: '0.78rem', color: C.muted }}>
          Secure checkout by Stripe. Free US shipping. Ships in 5 to 7 business days.
        </p>
        <p style={{ textAlign: 'center', margin: '1.2rem 0 0', fontSize: '0.75rem', color: C.muted, lineHeight: 1.6 }}>
          Herbal wellness support, not medical advice. If the taste is not right for you, tell us after one cup and we will make it right.
        </p>
      </div>
    </div>
  );
}
