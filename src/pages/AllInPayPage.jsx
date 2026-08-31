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
// ─── 2026-08-30 (Joel): $7,500, and every plan starts with a $500 deposit ──
// "7500 pay in full at the top with stripe link. then the payment options like
// we had them but when they click its a 500 deposite link then signs them up
// for the remaining payments."
//
// So there are now exactly TWO things that take money on this page:
//   1. pay in full, $7,500, one link
//   2. a $500 deposit, which carries the plan she picked into /payment
//
// The plan cards are NOT subscriptions any more. Tapping one selects the plan
// and charges $500; /payment then opens with that plan pre-selected and the
// $7,000 balance on it. The deposit is CREDITED, so pay-in-full stays the
// cheapest route and no card is charged twice for the same money.
//
// Totals rise with the length of the plan, deliberately, and every card shows
// the per-payment amount AND the total before she picks. Never show a plan
// without its total: financing that hides its cost is how a $7,500 program
// turns into a complaint.
//
// ⚠️ NOTHING HERE IS LIVE UNTIL THE STRIPE PRICES EXIST and their ids are set
// as env vars in Vercel. See the required list in api/create-embedded-checkout.js.
const DEPOSIT_LABEL = '$500';

const OPTIONS = [
  {
    key: 'full',
    tier: 'allin-full',
    pill: 'Pay in full',
    headline: '$7,500',
    cadence: 'One payment today.',
    total: 'Total $7,500',
    note: 'The lowest total. Nothing recurring, nothing to remember.',
    best: true,
  },
  {
    key: '6pay',
    tier: 'allin-deposit',
    balancePlan: '6pay',
    pill: '6 months',
    headline: '6 x $1,295',
    cadence: 'A $500 deposit today, then 6 monthly payments.',
    total: 'Total $8,270 with your deposit',
    note: 'The $500 comes off the price. Six months, paid off well before your year is done.',
  },
  {
    key: '9pay',
    tier: 'allin-deposit',
    balancePlan: '9pay',
    pill: '9 months',
    headline: '9 x $935',
    cadence: 'A $500 deposit today, then 9 monthly payments.',
    total: 'Total $8,915 with your deposit',
    note: 'The $500 comes off the price. Nine months, a smaller amount each time.',
  },
  {
    key: '12pay',
    tier: 'allin-deposit',
    balancePlan: '12pay',
    pill: '12 months',
    headline: '12 x $750',
    cadence: 'A $500 deposit today, then 12 monthly payments.',
    total: 'Total $9,500 with your deposit',
    note: 'The smallest monthly amount and the highest total. Spreads across a full year.',
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
            // Every plan card charges the SAME $500 deposit; balancePlan is what
            // tells /payment which plan to open with. Without it the deposit
            // lands and the balance becomes something to chase by hand, which
            // is exactly how the last round left money uncollected.
            ...(option.balancePlan ? { balancePlan: option.balancePlan } : {}),
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
          Every option enrolls you in the same full year of coaching with the same support.
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
        {/* 2026-08-30: every plan now charges a $500 DEPOSIT today, not the
            first installment. The old copy here said "your card is charged
            {per-payment} today", which under this flow is simply untrue and is
            the kind of thing that becomes a chargeback. What she is agreeing to
            is stated in the order it happens: $500 now, the rest on a schedule
            she sets up in the next screen. */}
        {option.balancePlan && (
          <div style={{ border: `2px solid ${C.ink}`, borderRadius: 8, padding: '16px 18px', margin: '0 0 24px', background: C.paper }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              <strong>Read this before you pay:</strong> your card is charged{' '}
              <strong>{DEPOSIT_LABEL} today</strong>, not {option.headline.split(' x ')[1]}. That {DEPOSIT_LABEL}{' '}
              comes off the price and holds your place. On the very next screen you set up the
              remaining {option.headline.split(' x ')[0]} monthly payments of {option.headline.split(' x ')[1]},
              billed automatically once a month, for {option.total.replace('Total ', '').replace(' with your deposit', ' in total including the deposit')}.
              The plan stops on its own after the final payment and nothing renews. If you would rather
              settle the whole thing today for less, choose Pay in full above. Questions, write to
              braveworksrn@gmail.com.
            </p>
          </div>
        )}
        {option.key === 'full' && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '16px 18px', margin: '0 0 24px', background: C.paper }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: 0 }}>
              <strong>How this bills:</strong> one payment of $7,500 today. Nothing recurring, nothing to
              remember, nothing renews. This is the lowest total of any option on this page.
              Questions, write to braveworksrn@gmail.com.
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
