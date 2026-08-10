// AllInPayPage (route: /allin/pay) — the "skip the line" checkout for The Life
// Change Accelerator.
//
// WHY THIS EXISTS: /allin became an application on 2026-08-10 and stopped
// taking money. That is right for a $1,997 program, but it left a woman who
// already knows she wants in with no way to buy. This page is her door. It is
// NOT linked from anywhere prominent and is not indexed: it sits behind one
// quiet line at the bottom of /allin and gets pasted into replies by Joel.
//
// FOUR WAYS TO PAY, all embedded inline (no bounce to a Stripe-hosted page).
// The installment plans are Stripe SUBSCRIPTIONS billing every 2 weeks, and
// each is CAPPED BY THE WEBHOOK writing cancel_at, because Stripe has no
// native "charge exactly N times" for a recurring price:
//
//   full   $1,997 one-time                        tier 'allin-full'
//   3pay   3 x $699 every 2 weeks   = $2,097      tier 'allin-3pay'
//   plan   6 x $367 every 2 weeks   = $2,202      tier 'allin-plan'
//   9pay   9 x $267 every 2 weeks   = $2,403      tier 'allin-9pay'
//
// The totals rise with the length of the plan. That is deliberate and it is
// stated on the card in plain numbers rather than buried: she can see exactly
// what the convenience costs before she picks. Never show a plan without its
// total, and never round the total down.
//
// ⚠️ If you add a fifth option you must touch THREE files or someone gets
// billed forever: this page, api/create-embedded-checkout.js (ALLIN_PRICES +
// PLAN_BY_TIER), and api/triangle-webhook.js (resolveAllInPlan,
// ALLIN_SUB_PLANS, ALLIN_CANCEL_SECONDS, and both plan-line email maps).
//
// Not wrapped in SiteLayout (focused checkout, no nav to leak clicks).
// ZERO em dashes in visible copy.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { ShieldCheck, Lock } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';
import ClosingSoonBanner from '../components/ClosingSoonBanner';

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

// Every number here must match the live Stripe price it names. The totals are
// written out rather than computed at render time so a wrong number is visible
// in the diff instead of appearing only on screen.
const OPTIONS = [
  {
    key: 'full',
    tier: 'allin-full',
    pill: 'Pay in full',
    headline: '$1,997',
    cadence: 'One payment today.',
    total: 'Total $1,997',
    note: 'The lowest total. Nothing recurring, nothing to remember.',
    best: true,
  },
  {
    key: '3pay',
    tier: 'allin-3pay',
    pill: '3 payments',
    headline: '3 x $699',
    cadence: 'Every 2 weeks, 3 payments in total.',
    total: 'Total $2,097',
    note: 'First payment today, then two more. Finishes in about 6 weeks.',
  },
  {
    key: 'plan',
    tier: 'allin-plan',
    pill: '6 payments',
    headline: '6 x $367',
    cadence: 'Every 2 weeks, 6 payments in total.',
    total: 'Total $2,202',
    note: 'First payment today, then five more. Runs alongside the 12 weeks.',
  },
  {
    key: '9pay',
    tier: 'allin-9pay',
    pill: '9 payments',
    headline: '9 x $267',
    cadence: 'Every 2 weeks, 9 payments in total.',
    total: 'Total $2,403',
    note: 'The smallest payment. First today, then eight more, about 18 weeks.',
  },
  // 2026-08-10 (Joel: "make it the 197"). The deposit is NOT an installment
  // plan and must never read like one: it is a one-time hold with $1,800 still
  // owed, arranged with Joel. isDeposit drives its own warning block so nobody
  // can mistake $197 for the price of the program.
  {
    key: 'deposit',
    tier: 'allin-deposit',
    pill: 'Deposit to hold my place',
    headline: '$197',
    cadence: 'One payment today. This is not the full price.',
    total: '$1,800 balance still to arrange',
    note: 'Locks your place now. Joel contacts you to arrange the remaining $1,800 before the program starts.',
    isDeposit: true,
  },
];

export default function AllInPayPage() {
  const [selected, setSelected] = useState('full');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const option = OPTIONS.find((o) => o.key === selected) || OPTIONS[0];

  useEffect(() => {
    track('allin_pay_view', { page: 'allin-pay' });
    const prev = document.title;
    document.title = 'Enroll | The Life Change Accelerator';
    // Not a page we want in search results: it is the back door for people
    // Joel has already spoken to, not a public sales page.
    //
    // MUTATE the site-wide robots tag rather than appending a second one.
    // index.html already ships `index, follow`; appending left two conflicting
    // tags in the head. Google resolves that by taking the most restrictive,
    // so it happened to work, but relying on a tie-break rule for whether a
    // checkout page gets indexed is not a thing to leave in the code. Restore
    // the original on unmount so client-side navigation away does not leave
    // the rest of the site noindexed.
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
      {/* Same deadline as /allin. The CTA scrolls to the options rather than
          off to the application, because everyone here already decided. */}
      <ClosingSoonBanner href="#choose" label="Enroll now" />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '48px 20px 72px' }}>

        <p style={{ fontSize: 12, letterSpacing: '0.18em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
          THE LIFE CHANGE ACCELERATOR
        </p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Choose how you want to pay.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 8px' }}>
          Every option enrolls you in the same 12-week program with the same support.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 32px' }}>
          Paying in full costs the least, and the longer a plan runs the more it comes to. The per-payment amount
          and the total are both on every card below. The last option is a deposit that holds your place rather
          than paying for the program, and it says so.
        </p>

        {/* ── the four options ─────────────────────────────────────── */}
        <div id="choose" role="radiogroup" aria-label="Payment option" style={{ margin: '0 0 28px', scrollMarginTop: 92 }}>
          {OPTIONS.map((o) => {
            const active = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setSelected(o.key); track('allin_pay_option', { option: o.key }); }}
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

        {/* Plain-language terms. Auto-billing must never be a surprise, and a
            deposit must never be mistaken for the price. Two separate blocks
            on purpose: the deposit has no "N x $X" to parse and saying "how
            this plan bills" over a one-time hold would be a lie. */}
        {option.isDeposit && (
          <div style={{ border: `2px solid ${C.ink}`, borderRadius: 8, padding: '16px 18px', margin: '0 0 24px', background: C.paper }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              <strong>Read this before you pay:</strong> $197 today reserves your place. It is not the price of the
              program. The program is $1,997 in total, so $1,800 remains and Joel will contact you to arrange it
              before the 12 weeks begin. If you would rather settle the whole thing now, choose one of the options
              above instead. Questions, write to braveworksrn@gmail.com.
            </p>
          </div>
        )}
        {!option.isDeposit && option.key !== 'full' && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '16px 18px', margin: '0 0 24px', background: C.paper }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              <strong>How this plan bills:</strong> your card is charged {option.headline.split(' x ')[1]} today
              and then automatically every 2 weeks until all {option.headline.split(' x ')[0]} payments are made,
              for a total of {option.total.replace('Total ', '')}. It stops on its own after the final payment.
              Nothing renews afterward. Questions about your plan, write to braveworksrn@gmail.com.
            </p>
          </div>
        )}

        {/* ── embedded Stripe ──────────────────────────────────────── */}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 8, minHeight: 320 }}>
          {error ? (
            <p style={{ padding: '24px 16px', fontSize: 15.5, lineHeight: 1.65, color: C.ink, margin: 0 }}>
              {error} You can also write to{' '}
              <a href="mailto:braveworksrn@gmail.com" style={{ color: C.ink, fontWeight: 700 }}>braveworksrn@gmail.com</a>{' '}
              and we will take it from there.
            </p>
          ) : (
            <div ref={containerRef} />
          )}
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', margin: '20px 0 0', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted }}>
            <Lock size={14} /> Secure checkout by Stripe
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted }}>
            <ShieldCheck size={14} /> Card details never touch our servers
          </span>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.7, color: C.muted, margin: '28px 0 0', textAlign: 'center' }}>
          Not sure yet? <a href="/allin" style={{ color: C.ink, fontWeight: 700 }}>Read the full page and apply instead.</a>
        </p>

        <p style={{ fontSize: 12.5, lineHeight: 1.7, color: C.muted, margin: '28px 0 0', textAlign: 'center' }}>
          Everything here is education-based nursing consultation, not medical advice, and it works alongside your
          doctor rather than instead of them. Your prescriber stays in charge of your medications.
        </p>
      </div>
    </main>
  );
}
