// PayPage (route: /pay) — EMBEDDED Stripe checkout, ported into bpquiz-site so
// the reverted old site charges the new Triangle kits INLINE (no buy.stripe.com
// redirect, which was the step cold buyers abandoned).
//
// 2026-07-13 checkout overhaul (10-expert panel + leak audit):
//   - Standalone route (App.jsx no longer wraps this in SiteLayout): the old
//     Navbar dangled a competing FREE Skool CTA above the card form. This page
//     now renders its own minimal locked header with zero exits.
//   - Order-summary card restates the offer at the point of payment (product,
//     price, contents recap, one-time, delivery promise).
//   - Branded Feel-It-or-Free promise replaces the generic guarantee line.
//   - Instrumented: pay_page_viewed / checkout_form_mounted /
//     checkout_start_failed — this was the funnel's only blind page.
//   - Loading + retry states, Sabbath-aware session minting.
//
// 2026-07-16 Annie-v2 kit frame: the $17 kit branch adopts Annie's checkout
// frame (personalized trigger hook, what's-inside value stack, nurse bio,
// FAQ) with the Stripe form embedded right on the page: no more clicks at
// this point. Corners expanded from the 3 Triangle corners to all 5 quiz
// triggers (sleep = The Midnight Drift, stillness = The Stillness Trigger),
// each a real product set in api/_kit-manifest.js.
//
// Contract (shared with api/create-embedded-checkout.js):
//   POST { tier?='corner', corner?, email? } -> { clientSecret }
// tier is read from ?tier= (corner|complete|tea-48|tea-120). corner is read
// from ?corner= (URL wins), else the quiz result in sessionStorage bp_quiz,
// else null. On completion Stripe returns the top frame to return_url
// (/welcome or /tea-thanks), configured server-side. ZERO em-dashes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId } from '../utils/analytics.js';
import { sabbathStatus } from '../utils/sabbath';

// One Stripe instance at module load (Stripe's recommended pattern). Null when
// the publishable key is not set, so the page degrades to a clear message.
const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// 2026-07-10: tea-48 / tea-120 added — the bpquiz.com/tea buy buttons come
// here instead of redirecting to buy.stripe.com. The API branch collects the
// shipping address in-checkout.
// 2026-07-13: 'top2' REMOVED — create-embedded-checkout has no top2 price, so
// accepting it here rendered a $17 order card and then looped 400 -> retry
// forever. Stale top2 links now degrade to the $17 corner offer instead of a
// dead register.
const VALID_TIERS = new Set(['corner', 'complete', 'tea-48', 'tea-120']);
// 2026-07-16: all 5 quiz triggers are valid corners. Keep in sync with
// api/create-embedded-checkout.js VALID_CORNERS and api/_kit-manifest.js
// ALL_CORNERS.
const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium', 'sleep', 'stillness']);
const TEA_TIERS = new Set(['tea-48', 'tea-120']);

// label = short product label; triggerName = the quiz result name used in the
// personalized hook and the "Built for your ..." badge.
const TRIGGER_META = {
  stress: { label: 'Stress', triggerName: 'The Stress Spike' },
  sugar: { label: 'Sugar', triggerName: 'The Sugar Surge' },
  sodium: { label: 'Sodium', triggerName: 'The Sodium Trap' },
  sleep: { label: 'Midnight Drift', triggerName: 'The Midnight Drift' },
  stillness: { label: 'Stillness', triggerName: 'The Stillness Trigger' },
};

function readContext() {
  // URL params are parsed OUTSIDE the storage reads: a blocked sessionStorage
  // (Chrome "block all cookies", some in-app webviews) or a corrupt bp_quiz
  // value must never discard the ?tier=/?corner= the buy link carried, or a
  // $47 complete link silently degrades to the generic $17 register.
  let tier = 'corner';
  let corner = null;
  let sabbathOverride = null; // 'force' | 'off' | null
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tier');
    tier = VALID_TIERS.has(t) ? t : 'corner';
    // ?corner= wins (the sale-first buy links pass corner=stress so a
    // quiz-skipper gets the Stress kit), else the quiz result, else null.
    const urlCorner = params.get('corner');
    if (VALID_CORNERS.has(urlCorner)) corner = urlCorner;
    sabbathOverride = params.get('sabbath');
  } catch {
    /* defaults hold */
  }
  if (!corner) {
    try {
      const quiz = JSON.parse(sessionStorage.getItem('bp_quiz') || '{}');
      if (quiz && VALID_CORNERS.has(quiz.corner)) corner = quiz.corner;
    } catch {
      /* private mode / corrupt record */
    }
  }
  let email = '';
  try {
    email = localStorage.getItem('bwbp_lead_email') || '';
  } catch {
    /* private mode */
  }
  return { tier, corner, email, sabbathOverride };
}

// Mirrors SabbathGate's host scope: only the apex storefront rests.
function isStoreHost() {
  try {
    const h = window.location.hostname;
    return h === 'bpquiz.com' || h === 'www.bpquiz.com';
  } catch {
    return false;
  }
}

// What the buyer is paying for, restated at the point of payment. Contents
// mirror api/_kit-manifest.js modulesForTier() EXACTLY (corner tier ships 11
// files — the trigger's protocol + formulary + doctor sheet plus the full
// 8-item library; complete ships 19). If the manifest changes, this copy and
// the CheckoutPage stack change with it, or buyers hit the not-received gap
// at the exact point of payment.
function orderSummary(tier, corner) {
  if (tier === 'complete') {
    return {
      title: 'The Complete BP Reset Kit',
      price: '$47',
      body: 'All three corners of the Triangle (Stress, Sugar, and Sodium), each with its 10-day protocol, herb formulary, and doctor sheet, plus the Freedom Finale and the full library: the Master Blood Pressure Document, Top 10 Herbs Deep Dive, Cook For Life Cookbook, White Coat Syndrome Guide, BP FAQ, the Overmedicated Boomers book, your BP Tracker, the Triangle Meal Plan, and doctor visit templates. 19 downloads in all.',
    };
  }
  const meta = TRIGGER_META[corner];
  const forTrigger = meta ? `all made for your ${meta.label} trigger` : 'all made for your loudest trigger';
  return {
    title: meta ? `Your ${meta.label} Reset Kit` : 'The 10-Day Reset Kit',
    price: '$17',
    body: `Your simple 10-day plan, your herb guide, and your bring-to-your-doctor sheet, ${forTrigger}. Plus the full library: the Master Blood Pressure Document, Top 10 Herbs Deep Dive, Cook For Life Cookbook, White Coat Syndrome Guide, BP FAQ, the Overmedicated Boomers book, your BP Tracker, and the Triangle Meal Plan. 11 downloads in all.`,
  };
}

const TEA_SUMMARY = {
  'tea-48': { title: 'Steady, 1-Month Supply', price: '$48', body: 'One 100g pouch, 50 to 60 cups of the daily ritual. Caffeine-free.' },
  'tea-120': { title: 'Steady, The Daily Ritual (90 days)', price: '$120', body: 'Three 100g pouches, roughly 150 to 180 cups. Caffeine-free. Ships free.' },
};

const WHATS_INSIDE = [
  {
    title: 'Your Trigger, Actually Addressed',
    text: 'A plan built for your #1 cause. Not a one-size list everyone gets.',
  },
  {
    title: 'Become The Person Who Started',
    text: 'Most people mean to start. This helps you really do it. Today, not someday.',
  },
  {
    title: '10 Minutes To Your First Step',
    text: 'No homework. No list of 20 things to buy. Open it and you will know your first step.',
  },
  {
    title: 'Built By A Nurse, Not An Influencer',
    text: '20 years of ICU and ER nursing decided what belongs in here.',
  },
];

const FAQ = [
  {
    q: 'Is this a subscription?',
    a: 'No. You pay $17 one time. It is yours to keep. Nothing renews.',
  },
  {
    q: 'What do I get right away?',
    a: 'Everything, right away. Your files open on the next screen, and a copy goes to your email in about a minute. Nothing ships. No waiting.',
  },
  {
    q: 'What if it is not the right fit?',
    a: 'Run the full 10-day plan. If you do not feel a difference, reply with the word REFUND and your money comes back. Keep everything either way.',
  },
];

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const sectionLabel = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  margin: '0 0 0.8rem',
};

export default function PayPage() {
  const { tier, corner, email: initialEmail, sabbathOverride } = useMemo(readContext, []);
  // Prefill locks Stripe's email field (customer_email is not editable in
  // embedded checkout), so a typo'd quiz email or a shared device needs an
  // escape hatch: clearing this re-creates the session with a typeable field.
  const [email, setEmail] = useState(initialEmail);
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Bumped by the resting-watch interval the moment the Sabbath ends, so the
  // register wakes itself (SabbathGate's overlay lifts itself the same way; a
  // one-shot check here would leave a buyer staring at a dead page after
  // Saturday sundown).
  const [sabbathTick, setSabbathTick] = useState(0);
  const isTea = TEA_TIERS.has(tier);
  const isKit = tier === 'corner';
  const kit = orderSummary(tier, corner);
  const tea = TEA_SUMMARY[tier];
  const meta = corner ? TRIGGER_META[corner] : null;

  useEffect(() => {
    track('pay_page_viewed', { tier, ...(corner ? { corner } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let checkout;
    let cancelled = false;

    // While the Sabbath overlay covers this page, do not mint a Stripe session
    // underneath it (they expire unpaid and pollute the created-session count).
    // Fail open exactly like SabbathGate: any doubt, the register works.
    const isResting = () => {
      const status = sabbathStatus(new Date());
      return (
        sabbathOverride === 'force' ||
        (status.active && sabbathOverride !== 'off' && isStoreHost())
      );
    };
    if (isResting()) {
      // Watch for sundown: the moment the Sabbath ends, bump sabbathTick so
      // this effect re-runs and mounts the form (matching SabbathGate's
      // self-lifting overlay).
      const id = setInterval(() => {
        if (!isResting()) setSabbathTick((t) => t + 1);
      }, 60 * 1000);
      return () => clearInterval(id);
    }

    async function init() {
      if (!stripePromise) {
        setError('Checkout is briefly unavailable. Please refresh in a moment, or use the button on the previous page again.');
        track('checkout_start_failed', { tier, stage: 'no_key' });
        return;
      }
      try {
        const stripe = await stripePromise;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await fetch('/api/create-embedded-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tier, corner, email, ph_did: getDistinctId() }),
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
        setMounted(true);
        setError('');
        track('checkout_form_mounted', { tier });
      } catch (err) {
        setMounted(false);
        setError('The order form did not load. Your card was NOT charged. Tap below to try again.');
        track('checkout_start_failed', {
          tier,
          // 'no_secret' is a session-creation failure too (API 200 without a
          // clientSecret); only true mount/stripe-js failures land in 'mount'.
          stage:
            err && (err.message === 'start_failed' || err.message === 'no_secret')
              ? 'create_session'
              : 'mount',
        });
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
  }, [tier, corner, email, sabbathOverride, retryKey, sabbathTick]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #FBF8F1)' }}>
      {/* Minimal locked header: no nav, no competing offers, no exits. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.9rem 1rem',
          borderBottom: '1px solid var(--line, #E5DFD2)',
          background: '#fff',
        }}
      >
        <span style={{ fontWeight: 800, color: 'var(--ink, #121110)', letterSpacing: '-0.01em' }}>
          BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.12em', color: 'var(--clay, #B85A36)' }}>RN</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--dark-gray, #555)' }}>
          <Lock size={13} aria-hidden /> Secure checkout · Joel Polley, Reg. Nurse
        </span>
      </header>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 2.5rem) 1.25rem' }}>
        {/* ─── Hero (Annie-v2 frame for the $17 kit) ─────────────── */}
        {isKit ? (
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--sage-deep, #2E3A30)',
                background: 'var(--sage-soft, #C5CDBF)',
                padding: '0.35rem 0.9rem',
                borderRadius: 999,
                marginBottom: '0.9rem',
              }}
            >
              BraveWorks BP Reset Kit
            </span>
            <h1
              style={{
                ...serif,
                fontSize: 'clamp(1.55rem, 5vw, 2.2rem)',
                lineHeight: 1.18,
                margin: '0 auto 0.7rem',
                maxWidth: '18ch',
                color: 'var(--ink, #121110)',
              }}
            >
              Finally Get Ahead Of{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>
                {meta ? meta.triggerName.replace('The ', 'the ') : 'the Trigger'}
              </em>{' '}
              That&rsquo;s Been Driving Your Numbers Up
            </h1>
            <p
              style={{
                fontSize: '0.98rem',
                lineHeight: 1.6,
                color: 'var(--ink-soft, #2B2824)',
                maxWidth: '56ch',
                margin: '0 auto 0.6rem',
              }}
            >
              Get the exact next step for your trigger. Start today. No big course. No
              subscription. No more guessing.
            </p>
            <p
              style={{
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: 'var(--sage-deep, #2E3A30)',
                maxWidth: '52ch',
                margin: '0 auto',
              }}
            >
              Why $17? Because I never want price to be the reason someone does not start.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', margin: '0 0 0.5rem', color: 'var(--navy, #1a2b4a)' }}>
              {isTea ? 'Your Steady is almost on its way.' : `${kit.title}. ${kit.price}, one time.`}
            </h1>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--dark-gray, #555)', marginBottom: '1.1rem' }}>
          <span>Encrypted, secured by Stripe</span>
          <span>{isTea ? '60-day guarantee · Ships in 5 to 7 business days' : '30-day Feel-It-or-Free promise'}</span>
        </div>

        {/* Order summary: the offer, restated where the money changes hands. */}
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto 1.25rem',
            padding: '1rem 1.1rem',
            background: '#fff',
            border: '1px solid var(--line, #E5DFD2)',
            borderRadius: 12,
            fontSize: '0.9rem',
            lineHeight: 1.55,
            color: 'var(--ink-soft, #2B2824)',
          }}
        >
          {isKit && meta && (
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.66rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--clay, #B85A36)',
                background: '#F7EAE6',
                padding: '0.3rem 0.7rem',
                borderRadius: 999,
                marginBottom: '0.55rem',
              }}
            >
              Built for your {meta.triggerName.replace('The ', '')}
            </span>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontWeight: 700, color: 'var(--ink, #121110)', marginBottom: '0.35rem' }}>
            <span>{isTea ? tea.title : kit.title}</span>
            <span>{isTea ? tea.price : kit.price}</span>
          </div>
          <p style={{ margin: '0 0 0.45rem' }}>{isTea ? tea.body : kit.body}</p>
          {!isTea && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--dark-gray, #555)' }}>
              One payment. Not a subscription. Nothing renews. Your kit opens on the next
              screen, and a copy goes to your email in about a minute.
            </p>
          )}
          {isTea && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--dark-gray, #555)' }}>
              One-time order. Blended by hand in small, dated batches and shipped to your door.
            </p>
          )}
        </div>

        {error && (
          <div style={{ textAlign: 'center', margin: '0 auto 1rem', maxWidth: '52ch' }}>
            <p role="alert" style={{ color: 'var(--clay, #b85a36)', margin: '0 0 0.7rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setRetryKey((k) => k + 1);
              }}
              style={{
                background: 'var(--clay, #B85A36)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Stripe mounts the embedded card form here: checkout right on the
            page, no further clicks. */}
        {!mounted && !error && (
          <p style={{ textAlign: 'center', color: 'var(--dark-gray, #666)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
            Opening your secure checkout. One moment.
          </p>
        )}
        <div ref={containerRef} style={{ maxWidth: 680, margin: '0 auto', minHeight: 320 }} />

        {/* Stripe locks a prefilled email field. Give the buyer a way out of a
            typo'd or someone-else's saved email without leaving the page. */}
        {mounted && email && (
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--dark-gray, #666)', margin: '0.6rem auto 0' }}>
            Wrong email on the form?{' '}
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('bwbp_lead_email');
                } catch {
                  /* private mode */
                }
                setEmail('');
                setMounted(false);
                setError('');
                setRetryKey((k) => k + 1);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--clay, #B85A36)',
                textDecoration: 'underline',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              Tap here to type a different one
            </button>
            .
          </p>
        )}

        {/* Risk reversal, restated in full at the point of payment. Terms match
            CheckoutPage's live Feel-It-or-Free block verbatim in substance. */}
        {!isTea && (
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
              maxWidth: 560,
              margin: '1.25rem auto 0',
              padding: '0.8rem 1rem',
              background: '#FAF5FF',
              border: '1px solid #E9D5FF',
              borderRadius: 12,
              fontSize: '0.85rem',
              lineHeight: 1.55,
              color: '#3E2451',
            }}
          >
            <ShieldCheck size={18} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: '#6C3483' }} />
            <p style={{ margin: 0 }}>
              <strong>Joel's promise:</strong> run the full 10-day plan. If you do not feel a
              difference, reply with the word <strong>REFUND</strong> and your money comes back.
              Keep the books either way. No hoops, no fine print.
            </p>
          </div>
        )}

        {/* ─── Annie-v2 trust stack under the register (kit only) ── */}
        {isKit && (
          <div style={{ maxWidth: 560, margin: '2rem auto 0' }}>
            <div style={sectionLabel}>What&rsquo;s Inside</div>
            {WHATS_INSIDE.map((item, i) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid var(--line, #E5DFD2)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--sage-soft, #C5CDBF)',
                    color: 'var(--sage-deep, #2E3A30)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--ink, #121110)', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.87rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)' }}>{item.text}</div>
                </div>
              </div>
            ))}

            {/* Nurse bio */}
            <div
              style={{
                display: 'flex',
                gap: '0.9rem',
                alignItems: 'flex-start',
                background: 'var(--paper-warm, #EFE8DB)',
                borderRadius: 12,
                padding: '1.1rem 1.15rem',
                margin: '1.4rem 0',
              }}
            >
              <picture>
                <source srcSet="/headshot.webp" type="image/webp" />
                <img
                  src="/headshot.jpg"
                  alt="Joel Polley, RN"
                  width="52"
                  height="52"
                  loading="lazy"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--line, #D8CFBD)',
                    flexShrink: 0,
                  }}
                />
              </picture>
              <div>
                <div style={{ ...serif, fontSize: '0.98rem', color: 'var(--sage-deep, #2E3A30)', marginBottom: 3 }}>
                  Joel Polley, RN
                </div>
                <p style={{ fontSize: '0.87rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
                  ICU &amp; ER nurse, 20 years. I built this because &ldquo;eat better, move
                  more, stress less&rdquo; never told anyone how. This kit starts where the
                  free quiz ends.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div style={sectionLabel}>Questions</div>
            {FAQ.map((item) => (
              <div key={item.q} style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--line, #E5DFD2)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.91rem', color: 'var(--sage-deep, #2E3A30)', marginBottom: 4 }}>
                  {item.q}
                </div>
                <div style={{ fontSize: '0.87rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)' }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'var(--dark-gray, #666)', fontSize: '0.8rem', maxWidth: '58ch', margin: '1.5rem auto 0' }}>
          This is education and lifestyle support, not medical advice, diagnosis, or treatment. See our{' '}
          <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </div>
  );
}
