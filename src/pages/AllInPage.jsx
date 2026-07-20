// AllInPage (route: /allin) — the $1,997 "All In" 90-Day Program checkout.
//
// 2026-07-20 (Joel): "a checkout site bpquiz.com/allin ... offer stack on the
// left and the checkout embedded stripe on the right. they can do the deposit
// only, pay the whole thing, or sign up for the payments. put placeholders on
// the offer stack with the value and the added up value at the bottom $12,997
// worth crossed out, $1,997 today or payment plans. all above the fold."
//
// Layout: desktop = two columns (offer stack | checkout). Mobile = stacked.
// Three pay options (segmented control) each swap the embedded Checkout Session
// tier and REMOUNT the inline Stripe form:
//   full     one-time $1,997        (tier 'allin-full')
//   deposit  one-time $197 deposit  (tier 'allin-deposit')  balance later
//   plan     6 x $367 every 2 weeks (tier 'allin-plan')      $2,202 / 12 weeks
// Fulfillment + Joel-notify live in api/triangle-webhook.js (processAllIn).
//
// NOTE: the OFFER-STACK line items below are PLACEHOLDERS (values sum to
// $12,997). Joel confirms/edits the real deliverables + values. Not wrapped in
// SiteLayout (focused checkout, no nav to leak clicks) — same as PayPage.
// ZERO em dashes in visible copy. Education alongside the doctor, never a
// replacement.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Check, ShieldCheck, Lock } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId } from '../utils/analytics';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// ─── OFFER STACK — "Life Beyond the Numbers": A 90-Day Personalized Health
// Restoration Experience for Women Over 50 (Joel's updated copy, 2026-07-20).
// The 9 experience components map onto the prior value table (assessment +
// pathway combined into one line) so the $10,614 total holds exactly.
const STACK = [
  { label: 'Your Pressure & Root-Driver Assessment, plus your Personalized 90-Day Health Pathway', value: 997 },
  { label: 'Your Numbers Without Fear Safety Plan', value: 497 },
  { label: 'The Numbers Decoded System, plus your Doctor Visit Advocacy Kit', value: 697 },
  { label: 'The Food Freedom Blood-Sugar & Pressure Plan', value: 997 },
  { label: 'The Herbal Support & Safety Vault, plus your Steady Start Box', value: 797 },
  { label: 'The Smarter Movement Method', value: 797 },
  { label: 'Weekly Nurse-Led Coaching with Joel', value: 1800 },
  { label: 'The Life Beyond the Numbers Community', value: 997 },
  { label: '4 Included Bonuses (Symptom Sorting, Restaurant & Celebration Survival, 15-Minute Busy Woman, Stay-Beyond Maintenance)', value: 1288 },
  { label: 'Fast-Action Bonuses (Private Root-Driver Clarity Session + RestoreHER Replay Pathway)', value: 1747 },
];
const TOTAL_VALUE = STACK.reduce((s, i) => s + i.value, 0); // 10,614

const OPTIONS = [
  { key: 'full', tier: 'allin-full', pill: 'Pay in full', headline: '$1,997 today', sub: 'One payment, all in. Best value.', value: 1997 },
  { key: 'plan', tier: 'allin-plan', pill: 'Payment plan', headline: '6 x $367', sub: 'Every 2 weeks across the 12 weeks. $2,202 total.', value: 367 },
  { key: 'deposit', tier: 'allin-deposit', pill: 'Deposit only', headline: '$197 to hold my spot', sub: 'Lock your place now. Balance arranged with Joel.', value: 197 },
];

const usd = (n) => '$' + n.toLocaleString('en-US');

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

export default function AllInPage() {
  const [selected, setSelected] = useState('full');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const option = OPTIONS.find((o) => o.key === selected) || OPTIONS[0];

  useEffect(() => {
    track('allin_view', { page: 'allin' });
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
              body: JSON.stringify({ tier: option.tier, email, ph_did: getDistinctId() }),
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
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(1.1rem, 3vw, 2rem) 1.1rem' }}>
        {/* Top strip */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(1rem, 2.5vw, 1.6rem)' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem', fontWeight: 700, color: C.clay }}>
            Life Beyond the Numbers &middot; A 90-Day Health Restoration for Women Over 50
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.2rem)', lineHeight: 1.12, margin: '0.5rem auto 0', maxWidth: '20ch', fontWeight: 700 }}>
            You are all in. Let's build your 12 weeks.
          </h1>
        </div>

        {/* Two columns, above the fold on desktop */}
        <div
          style={{
            display: 'grid',
            gap: 'clamp(1rem, 2.5vw, 1.8rem)',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            alignItems: 'start',
          }}
          className="allin-grid"
        >
          {/* LEFT — offer stack */}
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 'clamp(1.2rem, 2.5vw, 1.7rem)' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.7rem', fontWeight: 700, color: C.sage }}>
              Here is everything you get
            </span>
            <ul style={{ listStyle: 'none', margin: '0.9rem 0 0', padding: 0, display: 'grid', gap: '0.7rem' }}>
              {STACK.map((item) => (
                <li key={item.label} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <Check size={17} strokeWidth={2.5} style={{ color: C.clay, flexShrink: 0, marginTop: 3 }} aria-hidden />
                  <span style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.45, color: C.inkSoft }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: C.muted, whiteSpace: 'nowrap' }}>{usd(item.value)}</span>
                </li>
              ))}
            </ul>

            <div style={{ borderTop: `1px solid ${C.line}`, margin: '1.1rem 0 0', paddingTop: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total value</span>
                <span style={{ fontWeight: 700, fontSize: '1.15rem', color: C.muted, textDecoration: 'line-through' }}>{usd(TOTAL_VALUE)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.ink }}>Your price today</span>
                <span style={{ fontWeight: 800, fontSize: '1.7rem', color: C.clay }}>$1,997</span>
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: C.muted }}>
                or a deposit to hold your spot, or 6 payments across the 12 weeks.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '1.1rem', background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, padding: '0.75rem 0.85rem' }}>
              <ShieldCheck size={18} strokeWidth={2} style={{ color: C.sage, flexShrink: 0, marginTop: 1 }} aria-hidden />
              <p style={{ margin: 0, fontSize: '0.83rem', lineHeight: 1.5, color: C.inkSoft }}>
                Joel walks all 12 weeks with you. This is education and lifestyle support alongside your doctor, never a replacement. Your doctor makes every call about your medication.
              </p>
            </div>
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
              <Lock size={13} strokeWidth={2} aria-hidden /> Secure checkout by Stripe. Your card is encrypted.
            </p>
          </div>
        </div>

        {/* Compliance spine */}
        <p style={{ maxWidth: 720, margin: '1.4rem auto 0', textAlign: 'center', fontSize: '0.78rem', lineHeight: 1.6, color: C.muted }}>
          This program is education and lifestyle support, not medical advice, diagnosis, or treatment, and not a substitute for your physician. Joel Polley is a Registered Nurse, not a prescribing doctor.
        </p>
      </div>

      {/* Mobile: stack the two columns */}
      <style>{`
        @media (max-width: 820px) {
          .allin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
