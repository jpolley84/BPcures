// CaseReviewPage (route: /case-review) — the sales page for the $297
// "Joel's Eyes On Your Case" personal case review. NEW 2026-07-03.
//
// Copy source: src/data/caseReviewOffer.js (was orphaned; now imported here).
// Capacity: GET /api/case-review-slots -> { remaining, cap, threePayAvailable }.
//   remaining > 0  -> honest capacity line + two buy paths:
//                       $297 one-time  -> the live Stripe payment link
//                       3 x $99        -> inline embedded checkout via
//                                         POST /api/create-embedded-checkout
//                                         { tier:'casereview3', email }
//   remaining == 0 -> waitlist form -> POST /api/capture-lead
//                       { email, tags:['casereview-waitlist'] }
//   fetch fails    -> fail OPEN: the $297 payment link renders without the
//                     capacity line (never a dead sales page, never invented
//                     numbers).
//
// App.jsx wraps this route in SiteLayout, so this returns the section only.
// Compliance: education alongside the doctor; guarantee is product
// satisfaction only, never a health outcome. ZERO em-dashes in visible copy.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowRight, CheckCircle2, Stethoscope } from 'lucide-react';
import { CASE_REVIEW } from '../data/caseReviewOffer';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';

// One Stripe instance at module load (same pattern as PayPage.jsx). Null when
// the publishable key is unset, so the 3-pay path degrades to a clear message.
const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// ─── Inline style helpers (self-contained, CSS var fallbacks) ─────────────
const KICKER = {
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--sage, #4A5D4E)',
};
const CARD = {
  background: 'var(--cream, #FBF8F1)',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 14,
  padding: '1.4rem 1.5rem',
  margin: '1.25rem 0 0',
};
const BTN_CLAY = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.45rem',
  background: 'var(--clay, #B85A36)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '1.02rem',
  textDecoration: 'none',
  padding: '0.9rem 1.4rem',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  width: '100%',
};
const BTN_QUIET = {
  ...BTN_CLAY,
  background: 'transparent',
  color: 'var(--ink, #121110)',
  border: '2px solid var(--line, #D8CFBD)',
};
const SMALL = { fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)' };

// Full month name for the honest capacity line ("spots left in July").
function currentMonthName() {
  try {
    return new Date().toLocaleString('en-US', { month: 'long' });
  } catch {
    return 'this month';
  }
}

export default function CaseReviewPage() {
  // slots: undefined = loading, null = fetch failed (fail open), object = live.
  const [slots, setSlots] = useState(undefined);
  // 3-pay embedded checkout state.
  const [showThreePay, setShowThreePay] = useState(false);
  const [threePayError, setThreePayError] = useState('');
  const checkoutContainerRef = useRef(null);
  // Waitlist form state (only used when remaining === 0).
  const [waitEmail, setWaitEmail] = useState('');
  const [waitState, setWaitState] = useState('idle'); // idle | sending | done | error

  useEffect(() => {
    let alive = true;
    fetch('/api/case-review-slots')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d && typeof d.remaining === 'number' && typeof d.cap === 'number') setSlots(d);
        else setSlots(null);
      })
      .catch(() => { if (alive) setSlots(null); });
    return () => { alive = false; };
  }, []);

  // Mount the embedded 3-pay checkout when the buyer picks the split option.
  // Same init/destroy pattern as PayPage.jsx, different tier.
  useEffect(() => {
    if (!showThreePay) return;
    let checkout;
    let cancelled = false;

    async function init() {
      if (!stripePromise) {
        setThreePayError('The split-pay checkout is briefly unavailable. Please refresh, or use the one-time button above.');
        return;
      }
      try {
        let email = '';
        try {
          email = localStorage.getItem('bwbp_lead_email') || '';
        } catch {
          /* private mode */
        }
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier: 'casereview3', email, ph_did: getDistinctId(), ab_variant: getAbHomeVariant() }),
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
        checkout.mount(checkoutContainerRef.current);
        // The reveal button above is a UI toggle, not checkout intent; THIS is
        // where the 3-pay buyer actually reaches a payment form. Keeps the
        // 3-pay leg visible in funnels after checkout_clicked was removed
        // from the reveal (same event PayPage fires on mount).
        track('checkout_form_mounted', { tier: 'casereview3', product: 'case-review-3pay', value: 99 });
      } catch {
        setThreePayError('Something went wrong starting the split-pay checkout. Please try again, or use the one-time button above.');
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
  }, [showThreePay]);

  async function submitWaitlist(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitEmail)) {
      setWaitState('error');
      return;
    }
    setWaitState('sending');
    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitEmail.trim(), tags: ['casereview-waitlist'] }),
      });
      setWaitState(res.ok ? 'done' : 'error');
      if (res.ok) track('casereview_waitlist_joined');
    } catch {
      setWaitState('error');
    }
  }

  const soldOut = slots && slots.remaining === 0;
  const hasCapacityLine = slots && slots.remaining > 0;
  const threePayAvailable = Boolean(slots && slots.remaining > 0 && slots.threePayAvailable);

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      {/* ---- What it is ---- */}
      <div style={{ textAlign: 'center' }}>
        <span style={KICKER}>{CASE_REVIEW.kicker}</span>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', margin: '0.6rem auto 0.75rem', color: 'var(--ink, #121110)', maxWidth: '22ch', lineHeight: 1.15 }}>
          {CASE_REVIEW.headline}
        </h1>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '58ch', margin: '0 auto' }}>
          {CASE_REVIEW.body}
        </p>
      </div>

      {/* ---- What you get ---- */}
      <div style={CARD}>
        <span style={KICKER}>What you get</span>
        <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {CASE_REVIEW.includes.map((line) => (
            <li key={line} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} strokeWidth={2} style={{ color: 'var(--sage, #4A5D4E)', flexShrink: 0, marginTop: 2 }} aria-hidden />
              <span style={{ fontSize: '0.95rem', lineHeight: 1.55, color: 'var(--ink, #121110)' }}>{line}</span>
            </li>
          ))}
        </ul>
        <p style={{ ...SMALL, margin: '1rem 0 0' }}>
          Your written review arrives within 2 business days of Joel receiving your details.
        </p>
      </div>

      {/* ---- Honest capacity + buy paths ---- */}
      <div style={{ ...CARD, borderTop: '4px solid var(--clay, #B85A36)' }}>
        {slots === undefined && (
          <p style={{ ...SMALL, margin: 0 }}>Checking this month's availability…</p>
        )}

        {hasCapacityLine && (
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink, #121110)', margin: '0 0 1rem' }}>
            Joel takes {slots.cap} case reviews a month, because reading a case well takes time.{' '}
            {slots.remaining} spot{slots.remaining === 1 ? '' : 's'} left in {currentMonthName()}.
          </p>
        )}

        {!soldOut && slots !== undefined && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <a
              href={CASE_REVIEW.paymentLink}
              style={BTN_CLAY}
              onClick={() => track('checkout_clicked', { product: 'case-review', value: 297, source: 'case-review-page' })}
            >
              Reserve my review, {CASE_REVIEW.price}
              <ArrowRight size={17} strokeWidth={2} />
            </a>
            {threePayAvailable && !showThreePay && (
              <button
                type="button"
                style={BTN_QUIET}
                onClick={() => {
                  // 2026-07-13: renamed from checkout_clicked. This button only
                  // REVEALS the inline 3-pay form; no checkout is reached, so
                  // it was polluting the funnel denominator.
                  track('case_review_3pay_revealed', { product: 'case-review-3pay', value: 99, source: 'case-review-page' });
                  setShowThreePay(true);
                }}
              >
                Split it: 3 payments of $99
              </button>
            )}
          </div>
        )}

        {/* Inline embedded checkout for the 3-pay path. */}
        {showThreePay && (
          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ ...SMALL, margin: '0 0 0.75rem' }}>
              3 payments of $99, about one month apart. Same review, same 2 business days.
            </p>
            {threePayError && (
              <p role="alert" style={{ color: 'var(--clay, #B85A36)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
                {threePayError}
              </p>
            )}
            <div ref={checkoutContainerRef} style={{ minHeight: 320 }} />
          </div>
        )}

        {/* Sold out -> kind waitlist. */}
        {soldOut && (
          <div>
            <p style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink, #121110)', margin: '0 0 0.5rem' }}>
              {currentMonthName()} is full.
            </p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1rem' }}>
              Joel reads every case himself, so he caps the month at {slots.cap} and never rushes one.
              Leave your email and you will be first in line when the next spots open. No charge, no
              obligation.
            </p>
            {waitState === 'done' ? (
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sage-deep, #2E3A30)', margin: 0 }}>
                You are on the list. Joel will email you when a spot opens.
              </p>
            ) : (
              <form onSubmit={submitWaitlist} style={{ display: 'grid', gap: '0.6rem' }}>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={waitEmail}
                  onChange={(e) => { setWaitEmail(e.target.value); if (waitState === 'error') setWaitState('idle'); }}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    border: '1px solid var(--line, #D8CFBD)',
                    borderRadius: 10,
                    background: 'var(--paper, #FBF8F1)',
                    fontSize: '1rem',
                  }}
                />
                {waitState === 'error' && (
                  <p style={{ color: 'var(--clay, #B85A36)', fontSize: '0.85rem', margin: 0 }}>
                    That did not go through. Please check the email and try again.
                  </p>
                )}
                <button type="submit" style={BTN_CLAY} disabled={waitState === 'sending'}>
                  {waitState === 'sending' ? 'Saving…' : 'Save my spot in line'}
                  <ArrowRight size={17} strokeWidth={2} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ---- Satisfaction guarantee (product only, never outcomes) ---- */}
      <div style={{ ...CARD, background: 'var(--paper-warm, #EFE8DB)' }}>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
          <strong style={{ color: 'var(--ink, #121110)' }}>Joel's promise:</strong> read your written
          review, and if you feel it was not worth what you paid, reply to the email and your money
          comes back. That is a promise about the review itself. Nobody can promise what your numbers
          will do, and Joel will not pretend otherwise.
        </p>
      </div>

      {/* ---- Compliance spine ---- */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '1.5rem 0 0' }}>
        <Stethoscope size={18} strokeWidth={1.9} style={{ color: 'var(--sage, #4A5D4E)', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ ...SMALL, margin: 0 }}>
          This is education and lifestyle support, not medical advice, diagnosis, or treatment, and not
          a substitute for your physician. Joel is a Registered Nurse, not a prescribing doctor. Bring
          your review to your own doctor; they make every call about your medication. See our{' '}
          <Link to="/terms" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}
