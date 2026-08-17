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
   PROOF QUOTE - deliberately EMPTY until a consented one exists.
   ==========================================================================
   The funnel review said "social proof immediately", and it is right. It is
   still null, because this page had seven fabricated testimonials stripped out
   of it once before and that is not happening twice.

   To fill it, you need BOTH:
     1. a real, DETAILED result from a real past participant (a thank-you note
        or a "loved it!" is NOT a testimonial), and
     2. a written consent record in the consent library.

   Then set: { quote: '...', name: 'First L., City' }
   Leave it null and the block simply does not render. An empty proof slot
   costs conversions. An invented one costs the license.
   ========================================================================== */
const TESTIMONIAL = {
  // CONSENTED 2026-08-07. Consent log row "Long Monie".
  // He said yes in writing: "Sure, u can use my comment, no name please."
  //
  // Chosen for THIS page specifically because the consent log marks it one of
  // the only entries carrying NO health claim, which is what makes it legal to
  // stand beside a price. Susan Crowley, Anita and Betty are all consented too
  // and all carry an explicit "never near a price" restriction, so they cannot
  // appear on a page with a checkout on it.
  //
  // 🔴 NO NAME. Not full, not first, not an initial. His words, and it binds.
  // 🔴 Quoted VERBATIM including "u" and "Thank u". Do not tidy his spelling.
  //    Same rule the library applies to Sally Alves: quote exactly or
  //    paraphrase openly, never silently correct someone's voice.
  quote: 'Thank u for sharing that information by getting to the point and not tricking viewers into an online infomercial.',
  name: 'Facebook viewer, name withheld at his request',
};

/* --------------------------------------------------------------------------
   CANDIDATES harvested 2026-08-16 from the WhatsApp screenshot set.
   Edited and ready. NOT live, because none of them has a consent record yet.
   Get a written yes, log it in the consent library, then move the chosen one
   up into TESTIMONIAL above. Nothing else needs to change.

   ⚠️ TWO FROM THAT SET ARE PERMANENTLY DISQUALIFIED, do not resurrect them:

   1. TikTok "AG.....8" (A1C 10.3 -> 5.6, lost 20 lbs). His result came after
      he "stopped cold turkey" on TWO blood pressure medications. Publishing it
      contradicts this page's own footer promise, models unsupervised
      medication cessation, and is the single worst liability an RN could put
      in front of this audience. Not usable trimmed either: the medication
      stopping IS the story.
   2. Instagram "garygould59" (cardiologist stopped Plavix, tapered Metoprolol).
      Supervised, so it is honest, but a testimonial whose arc is "I came off
      my medication" invites the exact inference we spend this whole page
      refusing. Leave it out.

   Also seen in the same screenshots and worth knowing about: a negative
   comment, "just messed me up 100x worse - never again" (MarieFrancedeClaffouty).
   Not a testimonial problem, a service-recovery one. Somebody should reach out.
   -------------------------------------------------------------------------- */
/* CANDIDATES, kept as a COMMENT on purpose.
   As real code these were exported, which meant an unconsented private DM
   (name and all) shipped inside the public JS bundle and was downloadable by
   anyone, even though nothing rendered it. A comment is stripped at build.
   To go live: paste the chosen quote into TESTIMONIAL above, after consent.

   export const TESTIMONIAL_CANDIDATES = [
     {
       // STRONGEST. Third-party verified outcome (a DOT medical examiner, not a
       // self-reported cuff reading), a specific routine, zero medication change,
       // and he volunteered his full name unprompted.
       consent: 'PENDING - private DM, must ask before publishing',
       source: 'Facebook/Instagram DM, "Mr.J"',
       quote:
         "I'm a truck driver. My day starts early and ends at 7:30, 8 o'clock at night, so walking "
         + 'every night is hard. What I do now is at least 30 minutes of exercise before bed, a lot of '
         + 'green leaf, blueberries, avocado, organic beet juice, and no truck stop food. I passed my '
         + 'DOT physical and my blood pressure was normal. You have made a big difference.',
       name: 'Orlando James, over-the-road truck driver',
     },
     {
       // Weaker: a feeling, not a result. Fine as a secondary, never as the only one.
       consent: 'PENDING - public IG comment, still ask',
       source: 'Instagram comment, margiemartin700',
       quote:
         'I am 62 years old and I was feeling pretty bad. You have no earthly idea how much I '
         + 'appreciate you. I am feeling so much better.',
       name: 'Margie M., 62',
     },
   ];
*/

/* ==========================================================================
   THE SEVEN DAYS - title + subtitle.
   UPDATED 2026-08-16 to the finalized buyer-aligned sequence (same sequence
   now live on the B-test page). Changes from the 08-11 copy this replaced:
     - Day 1 is now "What Happened to My Body?" (the recognition beat) rather
       than opening on Bring Sexy Back.
     - Day 2 "Connect the Dots" names the Big 3 patterns.
     - Day 3 "Stop Guessing With Food" is new; there was no food day before.
     - Day 4 absorbs the old "Win the Night" into Bring Sexy Back.
     - Day 5 absorbs the old "Turn Down the Pressure" into Move Different.
     - Day 6 "Know Your Numbers Without Fear" replaces the old Day 2 signals
       beat and is where the numbers teaching now lives.
     - Day 7 keeps Take Back Your Future and makes the Personal Life Change
       Map the explicit takeaway.
   Subtitles are the day's "shift" line, which is the pattern the previous
   copy used. Apostrophes are spelled out ("I am", "do not") to match this
   file's existing convention and keep the single-quoted strings clean.
   ========================================================================== */
const DAYS = [
  { n: 1, title: 'What Happened to My Body?', sub: 'From "Something is wrong with me" to "My body has been giving me clues."' },
  { n: 2, title: 'Connect the Dots', sub: 'From ten separate problems to the three patterns worth your attention first.' },
  { n: 3, title: 'Stop Guessing With Food', sub: 'Not another diet. From "tell me what to follow" to "I know how my body responds."' },
  { n: 4, title: 'Bring Sexy Back', sub: 'From "I do not feel like myself anymore" to "I am starting to recognize her again."' },
  { n: 5, title: 'Move Different', sub: 'No punishment, no proving anything. Movement and reset you can actually repeat.' },
  { n: 6, title: 'Know Your Numbers Without Fear', sub: 'Less fear, better questions, more clarity. Context instead of panic.' },
  { n: 7, title: 'Take Back Your Future', sub: 'Build your Personal Life Change Map. Your patterns, your priorities, your next move.' },
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
          .cmlc .proof-row{grid-template-columns:1fr;}
          .cmlc .leads{grid-template-columns:1fr;}
        }

        /* --- 2026-08-16: blocks added to follow the Omar funnel review.
           Order on the page is now outcome headline -> proof -> the days ->
           who it is for -> who is leading it -> one ask. --- */
        .cmlc .proof{background:var(--paper);border-top:1px solid var(--line);
          border-bottom:1px solid var(--line);padding:26px 0;}
        .cmlc .proof-row{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:center;}
        .cmlc .proof-row .n{font-family:var(--serif);font-size:30px;color:var(--wine);line-height:1.1;}
        .cmlc .proof-row .l{font-size:12.5px;color:var(--ink-soft);margin-top:6px;}
        .cmlc .quote{max-width:620px;margin:22px auto 0;text-align:center;font-family:var(--serif);
          font-style:italic;font-size:18px;color:var(--wine-deep);line-height:1.5;}
        .cmlc .quote cite{display:block;font-style:normal;font-family:var(--sans);
          font-size:12.5px;color:var(--ink-soft);margin-top:8px;}
        .cmlc .forwho{padding:44px 0;}
        .cmlc .forwho h2{font-family:var(--serif);font-size:clamp(26px,4.4vw,36px);color:var(--wine);margin:0 0 6px;}
        .cmlc .forwho .lede{color:var(--ink-soft);margin:0 0 18px;}
        .cmlc .forwho ul{list-style:none;padding:0;margin:0;display:grid;gap:11px;}
        .cmlc .forwho li{display:flex;gap:11px;align-items:flex-start;font-size:16px;line-height:1.55;}
        .cmlc .forwho li b{color:var(--gold-deep);flex:0 0 auto;}
        .cmlc .notfor{margin-top:20px;padding:14px 16px;border-left:3px solid var(--line);
          color:var(--ink-soft);font-size:14.5px;line-height:1.6;background:var(--paper);border-radius:0 10px 10px 0;}
        .cmlc .leads{padding:10px 0 46px;display:grid;grid-template-columns:1fr 1fr;gap:22px;}
        .cmlc .lead{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:20px;}
        .cmlc .lead h3{font-family:var(--serif);font-size:21px;color:var(--wine);margin:0 0 4px;}
        .cmlc .lead .role{font-size:12px;letter-spacing:.1em;text-transform:uppercase;
          color:var(--gold-deep);font-weight:700;margin:0 0 10px;}
        .cmlc .lead p{margin:0;font-size:15px;line-height:1.6;color:var(--ink-soft);}
      `}</style>

      {/* ============ HERO ============
          Outcome first, name second. The old hero led with the program name,
          which tells a scroller the TOPIC and not what she gets. The headline
          below is deliberately about CLARITY, not a millimetre drop: two RNs
          cannot promise a blood pressure number in seven days, and a licensed
          nurse promising one is the kind of claim that ends careers. The
          hormone line is the wedge, because it is the thing no other BP page
          in this niche can honestly say. */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">{CHALLENGE.NAME} &middot; Live with Annie and Joel, RNs</span>
          <h1>Seven Nights to Find Out What Is Actually Driving Your Numbers</h1>
          <p className="tagline">
            For women over 40 whose blood pressure, blood sugar and hormones are all pulling on
            the same rope. You leave with your own pattern on one page, and a plan you can hand
            your doctor.
          </p>
          <div className="when">
            <span>{CHALLENGE.DATE_RANGE_LABEL}</span>
            <span>{CHALLENGE.TIME_LABEL}</span>
            <span>Live daily, replays for 48 hours</span>
          </div>
          <img className="banner" src={bannerImg} alt={CHALLENGE.NAME} loading="eager" />
        </div>
      </section>

      {/* ============ PROOF ============
          Sits immediately under the hero on purpose.

          ⚠️ EVERY LINE HERE MUST BE A VERIFIED FACT. This page had seven
          fabricated testimonials removed once already. Nothing goes in this
          block without a record in the consent library, and a thank-you note
          is not a testimonial (see the testimonial-bar rule). The quote below
          renders ONLY when TESTIMONIAL is filled in, so the honest state of
          "we do not have a consented quote yet" shows nothing rather than
          something invented. Follower counts are deliberately absent: they
          live in PLATFORM-STATS.md and are never hardcoded. */}
      <section className="proof">
        <div className="wrap">
          <div className="proof-row">
            <div>
              <div className="n">20 years</div>
              <div className="l">ICU and ER nursing, at the bedside when the numbers stopped being numbers</div>
            </div>
            <div>
              <div className="n">Two RNs</div>
              <div className="l">Blood pressure and hormones taught together, by the two people who live it</div>
            </div>
            <div>
              <div className="n">7 nights</div>
              <div className="l">Live and unscripted, not a recorded course you watch alone</div>
            </div>
          </div>
          {TESTIMONIAL ? (
            <blockquote className="quote">
              &ldquo;{TESTIMONIAL.quote}&rdquo;
              <cite>{TESTIMONIAL.name}</cite>
            </blockquote>
          ) : null}
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

      {/* ============ WHO THIS IS FOR ============
          Self-selection, stated plainly. The "not for you" box is not a
          throwaway: naming who should NOT buy is what makes the yes credible,
          and it is the cheapest refund prevention on the page. */}
      <section className="forwho">
        <div className="wrap">
          <h2>Who This Is For</h2>
          <p className="lede">Read this honestly. If it is not you, keep your ninety seven dollars.</p>
          <ul>
            <li><b>&#10003;</b><span>You are a woman over 40 and your blood pressure, blood sugar or hormones have all started talking at once.</span></li>
            <li><b>&#10003;</b><span>You are already on medication, you are taking it, and your numbers still are not where you want them.</span></li>
            <li><b>&#10003;</b><span>You are doing things you were told to do and you cannot tell which of them is actually working.</span></li>
            <li><b>&#10003;</b><span>You want to work with your doctor, not around them, and you want to walk in prepared.</span></li>
            <li><b>&#10003;</b><span>You can give one hour a night for seven nights, or watch the replay within 48 hours.</span></li>
          </ul>
          <div className="notfor">
            <strong>This is not for you if</strong> you want someone to tell you to stop your medication,
            or you want a number fixed in a week without changing anything. Nobody here will do either.
            We teach, you decide, your doctor prescribes.
          </div>
        </div>
      </section>

      {/* ============ WHO IS LEADING IT ============
          Short. Authority in service of her problem, not a resume. */}
      <section className="wrap leads">
        <div className="lead">
          <p className="role">Your nurse for the numbers</p>
          <h3>Joel Polley, RN</h3>
          <p>
            Twenty years in ICU and emergency rooms. He watched the same preventable emergency
            roll through the doors over and over, and got tired of meeting people on the worst
            day instead of years before it.
          </p>
        </div>
        <div className="lead">
          <p className="role">Your nurse for the hormones</p>
          <h3>Annie Chitate, RN</h3>
          <p>
            She works with women over 40 whose hormones changed the rules on them. Blood pressure
            and blood sugar do not behave the same after that shift, and most plans never account
            for it. Hers does.
          </p>
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
