// AllInPage (route: /allin) — "The Life Change Accelerator" checkout.
//
// 2026-08-06 (Joel): restyled after the go.tvdhq.com streamlined checkout he
// supplied: NO offer stack, no value table, no crossed-out totals. One
// headline, one promise line, the photo of Annie and Joel, and the payment
// card. Renamed from "Life Beyond the Numbers / All In" to THE LIFE CHANGE
// ACCELERATOR. Pricing is UNCHANGED (same three Stripe tiers below), so
// api/create-embedded-checkout.js and triangle-webhook processAllIn need no
// changes and history in PostHog/Stripe stays joined.
//
// Three pay options (segmented control) each swap the embedded Checkout
// Session tier and REMOUNT the inline Stripe form:
//   full     one-time $1,997        (tier 'allin-full')
//   deposit  one-time $197 deposit  (tier 'allin-deposit')  balance later
//   plan     6 x $367 every 2 weeks (tier 'allin-plan')      $2,202 / 12 weeks
//
// Not wrapped in SiteLayout (focused checkout, no nav to leak clicks).
// ZERO em dashes in visible copy. Education alongside the doctor, never a
// replacement.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Lock } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';
// Annie + Joel, the photo Joel supplied 2026-08-06 for this page.
import heroImg from '../assets/life-change-accelerator.jpg';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

const OPTIONS = [
  { key: 'full', tier: 'allin-full', pill: 'Pay in full', headline: '$1,997 today', sub: 'One payment, all in. Best value.', value: 1997 },
  { key: 'plan', tier: 'allin-plan', pill: 'Payment plan', headline: '6 x $367', sub: 'Every 2 weeks across the 12 weeks. $2,202 total.', value: 367 },
  { key: 'deposit', tier: 'allin-deposit', pill: 'Deposit only', headline: '$197 to hold my spot', sub: 'Lock your place now. Balance arranged with Joel.', value: 197 },
];

// ─── palette (matches CaseReviewPage / brand vars) ───────────────────────
const C = {
  clay: 'var(--clay, #B85A36)',
  cream: 'var(--cream, #FBF8F1)',
  paper: 'var(--paper, #FEFCF7)',
  sage: 'var(--sage, #4A5D4E)',
  ink: 'var(--ink, #1E2B2A)',
  inkSoft: 'var(--ink-soft, #2B2824)',
  line: 'var(--line, #D8CFBD)',
  muted: 'var(--muted, #7A7061)',
};
const SERIF = '"Fraunces", Georgia, serif';

export default function AllInPage() {
  const [selected, setSelected] = useState('full');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const option = OPTIONS.find((o) => o.key === selected) || OPTIONS[0];

  useEffect(() => {
    track('allin_view', { page: 'allin' });
    const prev = document.title;
    document.title = 'The Life Change Accelerator | 90 Days with Annie and Joel, RNs';
    return () => { document.title = prev; };
  }, []);

  // Mount / remount the embedded checkout whenever the pay option changes.
  useEffect(() => {
    let checkout;
    let cancelled = false;
    setError('');

    async function init() {
      if (!stripePromise) {
        setError('Checkout is briefly unavailable. Please refresh the page.');
        return;
      }
      try {
        let email = '';
        try { email = localStorage.getItem('bwbp_lead_email') || ''; } catch { /* private mode */ }
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier: option.tier, email, ph_did: getDistinctId(), ab_variant: getAbHomeVariant() }),
            });
            if (!res.ok) throw new Error('start_failed');
            const data = await res.json();
            if (!data.clientSecret) throw new Error('no_secret');
            return data.clientSecret;
          },
        });
        if (cancelled) { checkout.destroy(); return; }
        checkout.mount(containerRef.current);
        track('allin_checkout_mounted', { plan: option.key, value: option.value });
      } catch {
        setError('Something went wrong starting checkout. Please pick an option again or refresh.');
      }
    }
    init();
    return () => {
      cancelled = true;
      try { if (checkout) checkout.destroy(); } catch { /* already gone */ }
    };
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.ink }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(1.1rem, 3vw, 2rem) 1.1rem' }}>
        {/* Headline block, reference-style: eyebrow, name, one promise line,
            one pointer line. Nothing else before the money. */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(1.1rem, 2.5vw, 1.8rem)' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem', fontWeight: 700, color: C.clay }}>
            90 days with two nurses in your corner
          </span>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.08, margin: '0.5rem auto 0.7rem', maxWidth: '18ch', fontWeight: 700 }}>
            The Life Change Accelerator
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.4vw, 1.15rem)', lineHeight: 1.5, maxWidth: '46ch', margin: '0 auto', color: C.inkSoft }}>
            Stop managing symptoms one at a time. Ninety days, one connected plan, with Annie
            Chitate, RN and Joel Polley, RN walking every week of it with you.
          </p>
          <p style={{ fontWeight: 800, fontSize: '1.02rem', margin: '0.9rem 0 0', color: C.ink }}>
            Secure your spot below
          </p>
        </div>

        {/* Photo | payment card. Mobile stacks. */}
        <div
          style={{
            display: 'grid',
            gap: 'clamp(1rem, 2.5vw, 1.8rem)',
            gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
            alignItems: 'start',
          }}
          className="allin-grid"
        >
          {/* LEFT — the photo, plus one quiet reassurance line */}
          <div>
            <img
              src={heroImg}
              alt="Annie Chitate, RN and Joel Polley, RN, standing back to back."
              width="1122"
              height="1402"
              style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 16, boxShadow: '0 24px 50px -28px rgba(30,43,42,.45)' }}
            />
            <p style={{ margin: '0.8rem 0 0', fontSize: '0.85rem', lineHeight: 1.55, color: C.muted, textAlign: 'center' }}>
              Education and lifestyle support alongside your doctor, never a replacement. Your
              doctor makes every call about your medication.
            </p>
          </div>

          {/* RIGHT — pay options + embedded checkout */}
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 'clamp(1.2rem, 2.5vw, 1.7rem)' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.7rem', fontWeight: 700, color: C.sage }}>
              Choose how you want to pay
            </span>

            {/* Segmented options */}
            <div style={{ display: 'grid', gap: '0.6rem', margin: '0.9rem 0 1.1rem' }}>
              {OPTIONS.map((o) => {
                const active = o.key === selected;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => { setSelected(o.key); track('allin_option_selected', { plan: o.key }); }}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: active ? C.cream : 'transparent',
                      border: active ? `2px solid ${C.clay}` : `2px solid ${C.line}`,
                      borderRadius: 12,
                      padding: '0.8rem 0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: active ? `5px solid ${C.clay}` : `2px solid ${C.muted}`,
                        background: '#fff',
                      }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted }}>{o.pill}</span>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: '1.05rem', color: C.ink }}>{o.headline}</span>
                      <span style={{ display: 'block', fontSize: '0.82rem', color: C.muted, marginTop: 1 }}>{o.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p role="alert" style={{ color: C.clay, fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{error}</p>
            )}

            {/* Embedded Stripe checkout (remounts on option change) */}
            <div ref={containerRef} key={selected} style={{ minHeight: 360 }} />

            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', margin: '0.9rem 0 0', fontSize: '0.78rem', color: C.muted }}>
              <Lock size={13} strokeWidth={2} aria-hidden /> 100 percent secure checkout by Stripe. Your card is encrypted.
            </p>
          </div>
        </div>

        {/* Compliance spine */}
        <p style={{ maxWidth: 720, margin: '1.4rem auto 0', textAlign: 'center', fontSize: '0.78rem', lineHeight: 1.6, color: C.muted }}>
          This program is education and lifestyle support, not medical advice, diagnosis, or
          treatment, and not a substitute for your physician. Annie Chitate and Joel Polley are
          Registered Nurses, not prescribing doctors.
        </p>
      </div>

      {/* Mobile: stack the two columns */}
      <style>{`
        @media (max-width: 820px) {
          .allin-grid { grid-template-columns: 1fr !important; }
          .allin-grid img { max-width: 420px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
