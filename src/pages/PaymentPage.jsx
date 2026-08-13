// PaymentPage (route: /payment) — balance checkout for people who ALREADY
// paid the $197 reservation deposit on The Life Change Accelerator.
//
// 2026-08-13 (Joel: "make a new page for deposited people with the plans
// minus the deposit, keep the financing premium"). Every option here credits
// the $197 deposit against the $1,997 program price, so the base owed is
// $1,800. The installment options carry the same financing premium the main
// /allin/pay plans do:
//
//   balance-full   $1,800 one-time                     tier 'allin-balance-full'
//   balance-3pay   3 x $633 every 2 weeks = $1,899     tier 'allin-balance-3pay'
//   balance-6pay   6 x $333 every 2 weeks = $1,998     tier 'allin-balance-6pay'
//
// Joel pastes changemylifechallenge.com/payment into his reply to a deposit-payer; it is not
// linked from public pages and is noindexed. The subscriptions are capped by
// the webhook writing cancel_at, exactly like the /allin/pay plans.
//
// ⚠️ Adding or changing an option touches THREE files or someone gets billed
// forever: this page, api/create-embedded-checkout.js (ALLIN_PRICES +
// PLAN_BY_TIER + isSub), and api/triangle-webhook.js (resolveAllInPlan,
// ALLIN_SUB_PLANS, ALLIN_CANCEL_SECONDS, both plan-line email maps).
//
// Not wrapped in SiteLayout (focused checkout). ZERO em dashes in visible copy.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

const C = {
  cream: '#FFFFFF',
  paper: '#FAFAFA',
  ink: '#000000',
  inkSoft: '#1A1A1A',
  line: '#E2E2E2',
  muted: '#666666',
};
const SERIF = '"Fraunces", Georgia, serif';

// Every number here must match the live Stripe price it names. Totals are
// written out, not computed, so a wrong number shows up in the diff.
const OPTIONS = [
  {
    key: 'balance-full',
    tier: 'allin-balance-full',
    pill: 'Settle the balance in full',
    headline: '$1,800',
    cadence: 'One payment today.',
    total: 'Total $1,800 · with your deposit, $1,997 all settled',
    note: 'The lowest total. Nothing recurring, nothing to remember. You are fully paid.',
    best: true,
  },
  {
    key: 'balance-3pay',
    tier: 'allin-balance-3pay',
    pill: '3 payments',
    headline: '3 x $633',
    cadence: 'Every 2 weeks, 3 payments in total.',
    total: 'Total $1,899 on top of your deposit',
    note: 'First payment today, then two more. Finishes in about 6 weeks.',
  },
  {
    key: 'balance-6pay',
    tier: 'allin-balance-6pay',
    pill: '6 payments',
    headline: '6 x $333',
    cadence: 'Every 2 weeks, 6 payments in total.',
    total: 'Total $1,998 on top of your deposit',
    note: 'The smallest payment. First today, then five more, running alongside the 12 weeks.',
  },
];

export default function PaymentPage() {
  const [selected, setSelected] = useState('balance-full');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const option = OPTIONS.find((o) => o.key === selected) || OPTIONS[0];

  useEffect(() => {
    track('allin_balance_pay_view', { page: 'payment' });
    const prev = document.title;
    document.title = 'Settle Your Balance | The Life Change Accelerator';
    // Private back door for deposit-payers Joel has already spoken to.
    // Same robots handling as /allin/pay: mutate the site-wide tag, restore
    // on unmount.
    const robots = document.querySelector('meta[name="robots"]');
    const prevRobots = robots ? robots.getAttribute('content') : null;
    let injected = null;
    if (robots) {
      robots.setAttribute('content', 'noindex, nofollow');
    } else {
      injected = document.createElement('meta');
      injected.name = 'robots';
      injected.content = 'noindex, nofollow';
      document.head.appendChild(injected);
    }
    return () => {
      document.title = prev;
      if (robots && prevRobots !== null) robots.setAttribute('content', prevRobots);
      injected?.remove();
    };
  }, []);

  // Mount / remount the embedded checkout whenever the pay option changes.
  useEffect(() => {
    let checkout;
    let cancelled = false;
    setError('');

    async function mount() {
      if (!stripePromise) { setError('Checkout is not configured. Please email braveworksrn@gmail.com.'); return; }
      try {
        const res = await fetch('/api/create-embedded-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: option.tier,
            distinctId: getDistinctId(),
            abHomeVariant: getAbHomeVariant(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Could not start checkout');
        if (cancelled) return;
        const stripe = await stripePromise;
        if (cancelled) return;
        checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        if (cancelled) { checkout.destroy(); return; }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          checkout.mount(containerRef.current);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start checkout. Please try again.');
      }
    }
    mount();
    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch { /* already gone */ }
    };
  }, [option.tier]);

  return (
    <main style={{ background: C.cream, color: C.ink, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '48px 20px 72px' }}>

        <p style={{ fontSize: 12, letterSpacing: '0.18em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
          THE LIFE CHANGE ACCELERATOR
        </p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Your deposit is in. Here is the rest.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 8px' }}>
          Your $197 deposit already holds your place, and every option below credits it against the
          $1,997 program price. The remaining balance is $1,800.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 32px' }}>
          Settling it in one payment costs the least, and the longer a plan runs the more it comes to.
          The per-payment amount and the total are both on every card.
        </p>

        {/* ── the three options ─────────────────────────────────────── */}
        <div id="choose" role="radiogroup" aria-label="Payment option" style={{ margin: '0 0 28px', scrollMarginTop: 92 }}>
          {OPTIONS.map((o) => {
            const active = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setSelected(o.key); track('allin_balance_pay_option', { option: o.key }); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: active ? C.ink : C.cream,
                  color: active ? C.cream : C.ink,
                  border: `2px solid ${active ? C.ink : C.line}`,
                  borderRadius: 8, padding: '16px 18px', marginBottom: 10,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {o.pill}{o.best ? ' · lowest total' : ''}
                  </span>
                  <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700 }}>{o.headline}</span>
                </div>
                <div style={{ fontSize: 15, marginTop: 6, opacity: active ? 0.92 : 1, color: active ? C.cream : C.inkSoft }}>
                  {o.cadence}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{o.total}</div>
                <div style={{ fontSize: 13.5, marginTop: 6, color: active ? 'rgba(255,255,255,0.8)' : C.muted, lineHeight: 1.5 }}>
                  {o.note}
                </div>
              </button>
            );
          })}
        </div>

        {/* Plain-language billing terms for the installment plans. */}
        {option.key !== 'balance-full' && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '16px 18px', margin: '0 0 24px', background: C.paper }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              <strong>How this plan bills:</strong> your card is charged {option.headline.split(' x ')[1]} today
              and then automatically every 2 weeks until all {option.headline.split(' x ')[0]} payments are made.
              It stops on its own after the final payment. Nothing renews afterward. Your $197 deposit is separate
              and already paid. Questions, write to braveworksrn@gmail.com.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" style={{ border: `2px solid ${C.ink}`, borderRadius: 8, padding: '14px 16px', margin: '0 0 20px', background: C.paper, fontWeight: 600, fontSize: 14.5 }}>
            {error}
          </div>
        )}

        {/* Embedded Stripe checkout mounts here. */}
        <div ref={containerRef} style={{ minHeight: 420 }} />

        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.muted, margin: '28px 0 0', textAlign: 'center' }}>
          Payments are processed securely by Stripe. This program is education and lifestyle support
          alongside your doctor, never a replacement for them.
        </p>
      </div>
    </main>
  );
}
