// ChallengePage (route: /challenge, own domain changemylifechallenge.com) -
// THE CHANGE MY LIFE CHALLENGE, co-hosted by Annie Chitate, RN (Everyday
// Nurse Annie) and Joel Polley, RN (the BP Guy).
//
// 2026-08-14 REBUILD (Joel, explicit, "overhaul the page to just be a
// checkout page"). The long sales page is retired. What remains is the short
// path: what the seven days are, and one button that takes the money.
//
//   Day 1 through Day 7, each as a title + one-line subtitle.
//   "CHANGE MY LIFE NOW" -> the live Stripe payment link.
//
// The $97 seat is now REAL and sellable: product + price
// (price_1U4NSeHseZnO3rRZfxzUCAjk, $97 one-time) + payment link created
// 2026-08-14. The link is card-only and redirects to /challenge-confirmed
// with the session id, which is what registers the seat. The old honest
// "waitlist fallback" is gone because the thing it was waiting on now exists.
//
// If the price ever changes, change it in Stripe AND in CHALLENGE.PRICE here.
// A page that says $97 next to a link that charges something else is the one
// unforgivable bug on this file.
//
// Cohort dates live in CHALLENGE below and are mirrored in
// ChallengeConfirmedPage.jsx and api/challenge-signup.js.
//
// ZERO em dashes in visible copy.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId } from '../utils/analytics';
import bannerImg from '../assets/challenge-banner.jpg';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

/* ==========================================================================
   CONFIG - change dates, price, and the buy link HERE and nowhere else.
   ========================================================================== */
const CHALLENGE = {
  NAME: 'The Change My Life Challenge',
  COHORT_ID: '2026-08-17',
  DATE_RANGE_LABEL: 'August 17 to 23, 2026',
  TIME_LABEL: '6:00pm Central / 7:00pm Eastern',
  DAY_COUNT: 7,
  PRICE: 97,
  REGULAR_PRICE: 197,
  // Checkout tier in api/create-embedded-checkout.js. Mounted INLINE rather
  // than sending buyers to the Stripe payment link that also exists for this
  // price (https://buy.stripe.com/aFa5kDbwfeia0IXefLfnO1R). The link works,
  // but payment links inherit the account payment-method configuration and
  // cannot override it, so that route shows the "Pay with Link" email wall
  // before the card fields. This rail is card-first. Use the payment link
  // only where a raw URL is required (a DM, a bio link).
  TIER: 'cmlc-97',
  SUPPORT_EMAIL: 'braveworksrn@gmail.com',
};

const usd = (n) => '$' + Number(n).toLocaleString('en-US');

/* ==========================================================================
   THE SEVEN DAYS - title + subtitle, kept from the approved 08-11 copy.
   ========================================================================== */
const DAYS = [
  { n: 1, title: 'Bring Sexy Back', sub: 'From "I need to lose weight" to "I know what I am taking my health back for."' },
  { n: 2, title: 'Read the Signals', sub: 'Your numbers become information instead of identity. Less fear, better questions.' },
  { n: 3, title: 'Find Your Triggers', sub: 'From ten random problems to one clearer picture, and the three patterns worth watching.' },
  { n: 4, title: 'Move Different', sub: 'No punishment, no proving anything. From "I need to exercise" to "I can actually do this."' },
  { n: 5, title: 'Win the Night', sub: 'Tomorrow starts tonight. Stop hoping for a better night and learn how to create one.' },
  { n: 6, title: 'Turn Down the Pressure', sub: 'The pressure is not only in the cuff. Five intentional minutes to bring your body down.' },
  { n: 7, title: 'Take Back Your Future', sub: 'Your patterns, your priorities, and a clear answer to where you go from here.' },
];

export default function ChallengePage() {
  const [payOpen, setPayOpen] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    track('chal_checkout_view', { page: 'challenge', cohort: CHALLENGE.COHORT_ID });
    const prev = document.title;
    document.title = `${CHALLENGE.NAME} | 7 Days Live with Annie and Joel, RNs`;
    return () => { document.title = prev; };
  }, []);

  // Mount the embedded checkout the first time she asks for it, then scroll it
  // into view. Nothing loads Stripe until she says yes, so the page stays fast.
  useEffect(() => {
    if (!payOpen) return undefined;
    let checkout;
    let cancelled = false;

    (async () => {
      if (!stripePromise) {
        setError(`Checkout is not configured. Please email ${CHALLENGE.SUPPORT_EMAIL}.`);
        return;
      }
      try {
        const res = await fetch('/api/create-embedded-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: CHALLENGE.TIER, distinctId: getDistinctId() }),
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
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start checkout. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch { /* already gone */ }
    };
  }, [payOpen]);

  const buy = (location) => {
    track('chal_buy_click', { page: 'challenge', cohort: CHALLENGE.COHORT_ID, location });
    setPayOpen(true);
    if (payOpen && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="cmlc">
      <style>{`
        .cmlc{
          --ink:#171310; --ink-soft:#584c44; --cream:#fbf6ef; --paper:#fffdf9;
          --wine:#7a1f30; --wine-deep:#571422; --gold:#c9a44c; --gold-deep:#8a642b;
          --line:#e4d8c8;
          --serif:'Fraunces',Georgia,serif;
          --sans:'Inter',system-ui,-apple-system,sans-serif;
          background:var(--cream); color:var(--ink);
          font-family:var(--sans); line-height:1.6; min-height:100vh;
        }
        .cmlc *{box-sizing:border-box; margin:0; padding:0;}
        .cmlc .wrap{width:min(760px,calc(100% - 36px)); margin:0 auto;}
        .cmlc h1,.cmlc h2,.cmlc h3{font-family:var(--serif); font-weight:600; line-height:1.1;}

        .cmlc .hero{padding:40px 0 30px; text-align:center;}
        .cmlc .eyebrow{
          font-size:11.5px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--gold-deep); font-weight:700; display:block; margin-bottom:14px;
        }
        .cmlc h1{font-size:clamp(34px,7vw,58px); color:var(--wine); margin-bottom:14px;}
        .cmlc .tagline{
          font-family:var(--serif); font-style:italic;
          font-size:clamp(18px,3.4vw,23px); color:var(--ink-soft); margin-bottom:18px;
        }
        .cmlc .when{
          display:inline-flex; flex-wrap:wrap; gap:8px 16px; justify-content:center;
          font-size:14px; font-weight:600; color:var(--ink-soft);
          border-top:1px solid var(--line); border-bottom:1px solid var(--line);
          padding:12px 18px;
        }
        .cmlc .banner{
          display:block; width:100%; border-radius:16px; margin:26px 0 0;
          border:1px solid var(--line);
        }

        .cmlc .days{padding:38px 0 8px;}
        .cmlc .days h2{
          font-size:clamp(24px,4.6vw,34px); text-align:center;
          color:var(--wine); margin-bottom:6px;
        }
        .cmlc .days .lede{text-align:center; color:var(--ink-soft); font-size:15.5px; margin-bottom:26px;}
        .cmlc .day{
          display:grid; grid-template-columns:56px 1fr; gap:16px; align-items:start;
          background:var(--paper); border:1px solid var(--line); border-radius:14px;
          padding:18px 20px; margin-bottom:10px;
        }
        .cmlc .daynum{
          font-family:var(--serif); font-size:13px; font-weight:700; letter-spacing:.08em;
          text-transform:uppercase; color:var(--gold-deep); padding-top:4px;
        }
        .cmlc .day h3{font-size:20px; color:var(--ink); margin-bottom:5px;}
        .cmlc .day p{font-size:15px; color:var(--ink-soft); line-height:1.55;}

        .cmlc .buybox{
          background:var(--wine); color:#fff7ec; border-radius:18px;
          padding:34px 26px; margin:30px 0 26px; text-align:center;
        }
        .cmlc .buybox .price{
          font-family:var(--serif); font-size:60px; font-weight:600;
          color:#fff; line-height:1;
        }
        .cmlc .buybox .price sup{font-size:26px; vertical-align:super;}
        .cmlc .buybox .was{
          font-size:14px; color:#e7c9a8; margin-top:8px;
        }
        .cmlc .buybox .was s{opacity:.85;}
        .cmlc .btn{
          display:block; width:100%; max-width:440px; margin:22px auto 0;
          background:var(--gold); color:#3a2708; text-decoration:none;
          font-family:var(--sans); font-weight:800; font-size:18px; letter-spacing:.03em;
          padding:20px 24px; border-radius:100px;
          box-shadow:0 14px 30px rgba(0,0,0,.25);
          transition:transform .2s ease, background .2s ease;
        }
        .cmlc .btn:hover{background:#e0bc63; transform:translateY(-2px);}
        .cmlc .btn{border:none; cursor:pointer; text-align:center;}
        .cmlc .btn-sub{font-size:13px; color:#e7c9a8; margin-top:12px; line-height:1.5;}

        .cmlc .paywrap{
          background:var(--paper); border:1px solid var(--line); border-radius:16px;
          padding:20px 18px; margin:0 0 26px; scroll-margin-top:16px;
        }
        .cmlc .payhead{
          font-size:14px; font-weight:700; color:var(--ink);
          text-align:center; margin-bottom:14px;
        }
        .cmlc .payerr{
          font-size:14px; font-weight:600; color:var(--wine);
          text-align:center; line-height:1.5;
        }

        .cmlc .assure{
          display:grid; grid-template-columns:repeat(3,1fr); gap:12px;
          margin-bottom:34px; text-align:center;
        }
        .cmlc .assure div{
          background:var(--paper); border:1px solid var(--line); border-radius:12px;
          padding:14px 10px; font-size:12.5px; color:var(--ink-soft); font-weight:600;
        }

        .cmlc footer{
          border-top:1px solid var(--line); padding:26px 0 40px;
          text-align:center; font-size:12px; color:var(--ink-soft);
        }
        .cmlc footer .love{
          font-family:var(--serif); font-style:italic; font-size:17px;
          color:var(--wine); margin-bottom:10px;
        }
        .cmlc footer p{max-width:600px; margin:0 auto; line-height:1.6;}

        .cmlc .sticky{
          position:fixed; left:0; right:0; bottom:0; z-index:60;
          background:rgba(122,31,48,.97); backdrop-filter:blur(8px);
          padding:11px 14px calc(11px + env(safe-area-inset-bottom));
          box-shadow:0 -6px 24px rgba(0,0,0,.25);
        }
        .cmlc .sticky button{
          display:block; width:100%; max-width:440px; margin:0 auto;
          background:var(--gold); color:#3a2708; border:none; cursor:pointer;
          font-family:var(--sans); font-weight:800; font-size:16px; text-align:center;
          padding:14px 18px; border-radius:100px;
        }
        .cmlc .tail{height:86px;}

        @media(max-width:560px){
          .cmlc .day{grid-template-columns:1fr; gap:4px;}
          .cmlc .assure{grid-template-columns:1fr;}
        }
      `}</style>

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Live with Annie and Joel, RNs</span>
          <h1>{CHALLENGE.NAME}</h1>
          <p className="tagline">Seven days. Small shifts. Your patterns, your evidence, your map.</p>
          <div className="when">
            <span>{CHALLENGE.DATE_RANGE_LABEL}</span>
            <span>{CHALLENGE.TIME_LABEL}</span>
            <span>Live daily, replays for 48 hours</span>
          </div>
          <img className="banner" src={bannerImg} alt={CHALLENGE.NAME} loading="eager" />
        </div>
      </section>

      {/* ============ THE SEVEN DAYS ============ */}
      <section className="days">
        <div className="wrap">
          <h2>What Happens Each Day</h2>
          <p className="lede">One focus a day. Nothing to overhaul, everything to notice.</p>
          {DAYS.map((d) => (
            <div className="day" key={d.n}>
              <div className="daynum">Day {d.n}</div>
              <div>
                <h3>{d.title}</h3>
                <p>{d.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CHECKOUT ============ */}
      <section className="wrap" id="buy">
        <div className="buybox">
          <span className="eyebrow" style={{ color: '#e7c9a8' }}>Your seat</span>
          <div className="price"><sup>$</sup>{CHALLENGE.PRICE}</div>
          <div className="was">One payment. Regular price <s>{usd(CHALLENGE.REGULAR_PRICE)}</s></div>
          <button type="button" className="btn" onClick={() => buy('main')}>
            CHANGE MY LIFE NOW
          </button>
          <div className="btn-sub">
            Secure Stripe checkout &middot; All seven days included &middot; Questions, write to {CHALLENGE.SUPPORT_EMAIL}
          </div>
        </div>

        {/* Embedded checkout mounts here on the first click. */}
        {payOpen && (
          <div className="paywrap">
            {error ? (
              <p className="payerr" role="alert">{error}</p>
            ) : (
              <p className="payhead">Enter your details below to lock your seat.</p>
            )}
            <div ref={containerRef} style={{ minHeight: error ? 0 : 420 }} />
          </div>
        )}

        <div className="assure">
          <div>Live daily with two RNs</div>
          <div>Replays for 48 hours</div>
          <div>Works alongside your doctor</div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="love">Love The Girl You&rsquo;re In</div>
          <p>
            Everyday Nurse &middot; BraveWorks RN. This challenge is educational and does not replace
            care from your healthcare provider. Nobody here will tell you to stop or change a
            prescribed medication. Only your doctor does that.
          </p>
        </div>
      </footer>

      <div className="tail" />
      <div className="sticky">
        <button type="button" onClick={() => buy('sticky')}>
          CHANGE MY LIFE NOW &middot; {usd(CHALLENGE.PRICE)}
        </button>
      </div>
    </div>
  );
}
