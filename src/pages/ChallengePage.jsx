// ChallengePage (route: /challenge, own domain changemylifechallenge.com) -
// THE CHANGE MY LIFE CHALLENGE, co-hosted by Annie Chitate, RN (Everyday
// Nurse Annie) and Joel Polley, RN (the BP Guy).
//
// 2026-08-27 (Joel): SEPTEMBER WAITLIST. The Aug 24-30 cohort is closed and
// the next cohort is THREE days and PAID, so this page no longer enrols anyone
// into anything. It captures a waitlist.
//
// ⚠️ READ THIS BEFORE EDITING: this file is NOT what visitors see at
// changemylifechallenge.com. That domain is rewritten in middleware.js to the
// STATIC file public/challenge-b/index.html, and bpquiz.com/challenge is
// redirected away in vercel.json. This page is the SPA fallback and is kept in
// sync so the two surfaces never contradict each other. Editing this file alone
// changes nothing for real visitors -- that mistake has been made twice. Change
// the static file too, or instead.
//
//   Day 1 through Day 3, each a title, a two-line description, and the
//   next-day teaser. Compressed from seven on 2026-08-27.
//   A live-event proof bridge with real RestoreHER 2026 photos.
//   "JOIN THE SEPTEMBER WAITLIST" -> a name/email/phone capture.
//
// NO MENTION OF MONEY APPEARS ON THIS PAGE, IN EITHER DIRECTION (Joel,
// 2026-08-27, explicit): not a price, not "paid", not "free", not "no card".
// The struck-$97-beside-FREE block went with the free cohort. Do not put a
// number, or the absence of one, back on this page.
//
// The Stripe product and price still exist in the Stripe account
// (price_1U4NSeHseZnO3rRZfxzUCAjk, $97 one-time) and are simply unused here.
// September IS paid, so when the price is set: restore the checkout FIRST,
// verify a real charge end to end, and only then put a live price on the page.
// The old warning on this file still holds and is why the rails were pulled
// together rather than one at a time: a page that shows one number beside a
// button that charges another is the one unforgivable bug here.
//
// Cohort dates live in CHALLENGE below and are mirrored in
// ChallengeConfirmedPage.jsx and api/challenge-signup.js.
//
// ZERO em dashes in visible copy.

import { useEffect, useState } from 'react';
import { track } from '../utils/analytics';
import bannerImg from '../assets/challenge-banner.jpg';
import eventStage from '../assets/challenge-event/event-stage.jpg';
import eventBarbaraAnnie from '../assets/challenge-event/event-barbara-annie.jpg';
import eventRoom from '../assets/challenge-event/event-room.jpg';
import eventSpeakers from '../assets/challenge-event/event-vip.jpg';

/* ==========================================================================
   CONFIG - change dates and price HERE and nowhere else.

   2026-08-27: WAITLIST CAPTURE, and NO money language of any kind in the
   visible copy. Stripe is still GONE from this page: no
   loadStripe, no embedded checkout, no payment link. Name + email + phone post
   to /api/challenge-signup with intent 'waitlist', which writes an interest
   record, dedupes by EMAIL, and sends "you are on the list for the next one"
   with no Zoom link and no charge.

   PRICE was removed entirely. The old warning on this file was that a page
   showing one number beside a button charging another is the one unforgivable
   bug here. There is no button that charges anything AND no number quoted, so
   that class of bug cannot occur. When September's price is set, restore the
   checkout FIRST and only then put a number back on the page.

   COHORT_ID deliberately still reads 2026-08-24. Do NOT advance it while that
   cohort's records are live: the id is mirrored in api/challenge-signup.js and
   ChallengeConfirmedPage.jsx, and moving one without the others drops
   registrations into the wrong bucket. Waitlist entries land in the separate
   :interest key, so September signups stay cleanly retrievable regardless.
   ========================================================================== */
const CHALLENGE = {
  NAME: 'The Change My Life Challenge',
  // 2026-08-17: cohort moved to the following Monday. Mirrored in
  // api/challenge-signup.js (cohort, startIsoEt, closeMs, labels, nights).
  // Move ALL of them together or registrations land in the wrong bucket.
  COHORT_ID: '2026-08-24',
  DATE_RANGE_LABEL: 'September 2026',
  TIME_LABEL: 'Dates announced to the waitlist first',
  DAY_COUNT: 3,
  SUPPORT_EMAIL: 'braveworksrn@gmail.com',
};

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
   THE THREE DAYS - title + subtitle.
   2026-08-27: compressed from seven to three for the September cohort. The
   three kept are the arc that survives compression: diagnose, the mechanism,
   and the plan you leave with. Food, sleep, movement and the numbers teaching
   fold into those three rather than each getting a day.
   HISTORY of the seven-day sequence this replaced:
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
  {
    n: 1,
    title: 'What Happened to My Body?',
    body: [
      'The belly. The chin hair. The crashes. The mood. The sleep. The numbers.',
      'We slow all of it down and look at what your body has been trying to tell you.',
    ],
    next: 'Tomorrow: we start connecting those clues.',
  },
  {
    n: 2,
    title: 'Connect the Dots',
    body: [
      'Ten separate problems, or one pattern wearing ten disguises?',
      'Today all that noise narrows down to your Big 3, and you find out what your body actually responds to.',
    ],
    next: 'Tomorrow: we put the whole thing together.',
  },
  {
    n: 3,
    title: 'Take Back Your Future',
    body: [
      'Look back at Day 1. What kept showing up? What helped? What surprised you?',
      'All of it goes onto one page you keep: your Personal Life Change Map.',
    ],
    next: 'You do not leave with more information. You leave with your next move.',
  },
];

export default function ChallengePage() {
  // Waitlist capture. All three fields are REQUIRED (Joel, explicit
  // 2026-08-17: "name email phone number mandatory"). Phone is validated on
  // digit count rather than shape so a woman typing (502) 555-1234 or
  // 502.555.1234 or 5025551234 all pass.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  useEffect(() => {
    track('chal_checkout_view', { page: 'challenge', cohort: CHALLENGE.COHORT_ID });
    // 2026-08-24: measurement gap fix. The static challenge-b page fires
    // chal_page_view via pixels.js; this SPA route fired nothing comparable,
    // so the two surfaces could not be compared in one funnel. Same event
    // name, page prop distinguishes the surface. chal_checkout_view above is
    // kept untouched so existing queries keep working.
    track('chal_page_view', { page: 'spa-challenge', cohort: CHALLENGE.COHORT_ID });
    const prev = document.title;
    document.title = `${CHALLENGE.NAME} | September Waitlist, 3 Days Live with Annie and Joel, RNs`;
    return () => { document.title = prev; };
  }, []);

  async function register(e) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const digits = phone.replace(/\D/g, '');

    if (cleanName.length < 1) { setError('Please tell us your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError('Please check your email address.'); return; }
    if (digits.length < 10) { setError('Please enter a full phone number, including area code.'); return; }

    setError('');
    setState('sending');
    track('chal_waitlist_submit', { page: 'challenge', cohort: 'september-2026' });

    try {
      const res = await fetch('/api/challenge-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'waitlist',
          firstName: cleanName,
          email: cleanEmail,
          phone: phone.trim(),
          tier: 'challenge-ga',
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setState('done');
      track('chal_waitlist_ok', { page: 'challenge', cohort: 'september-2026' });
      // 2026-08-27: chal_waitlist is the cross-surface waitlist event (the
      // static challenge-b page fires the same name). Fired IN ADDITION to
      // chal_waitlist_ok, never instead of it. Note the old chal_signup /
      // chal_free_register_* events stop here: this surface no longer enrols
      // anyone, so a signup dashboard going flat from this date is the rename,
      // not a conversion collapse.
      track('chal_waitlist', { page: 'spa-challenge', cohort: 'september-2026' });
    } catch {
      // Never fake a success. If the save did not land she needs to know, and
      // she needs a human address that actually works.
      setState('idle');
      setError(`That did not go through. Please try again, or email ${CHALLENGE.SUPPORT_EMAIL} and we will add you by hand.`);
      track('chal_waitlist_fail', { page: 'challenge', cohort: 'september-2026' });
    }
  }

  const goToForm = (location) => {
    track('chal_buy_click', { page: 'challenge', cohort: CHALLENGE.COHORT_ID, location });
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        .cmlc .day h3{font-size:20px; color:var(--ink); margin-bottom:7px;}
        .cmlc .day p{font-size:15px; color:var(--ink-soft); line-height:1.55; margin-bottom:9px;}
        .cmlc .day p:last-child{margin-bottom:0;}
        .cmlc .day .daynext{font-size:13.5px; font-weight:700; color:var(--wine); margin-top:7px;}

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
          .cmlc .ev .strip{grid-template-columns:1fr;}
          .cmlc .ev .strip img{aspect-ratio:4/3;}
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
        /* --- 2026-08-17: live-event proof bridge. Real RestoreHER 2026 photos,
           placed after the two-nurse credibility block and before the ask. --- */
        .cmlc .ev{background:var(--paper);border-top:1px solid var(--line);padding:44px 0 48px;}
        .cmlc .ev .eyebrow{color:var(--wine);display:block;text-align:center;margin-bottom:10px;}
        .cmlc .ev h2{font-family:var(--serif);font-size:clamp(25px,4.2vw,35px);color:var(--wine);
          text-align:center;margin:0 auto 20px;max-width:20ch;line-height:1.15;}
        .cmlc .ev p{font-size:16px;color:var(--ink-soft);line-height:1.6;margin:0 0 13px;}
        .cmlc .ev .beat{font-family:var(--serif);font-style:italic;font-size:17.5px;
          color:var(--wine-deep);margin:0 0 6px;}
        .cmlc .ev figure{margin:24px 0;}
        .cmlc .ev img{width:100%;height:auto;display:block;border-radius:12px;
          box-shadow:0 16px 40px -22px rgba(0,0,0,.5);}
        .cmlc .ev .strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0;}
        .cmlc .ev .strip img{aspect-ratio:3/4;object-fit:cover;}
        .cmlc .ev .sub{font-family:var(--serif);font-style:italic;font-size:clamp(20px,3.2vw,26px);
          color:var(--wine);text-align:center;margin:30px auto 16px;max-width:22ch;line-height:1.2;}
        .cmlc .ev .punch{font-weight:700;color:var(--ink);}
        .cmlc .ev .bridge{margin-top:34px;padding-top:28px;border-top:1px solid var(--line);}
        .cmlc .ev .close{font-weight:800;color:var(--wine);font-size:17.5px;}

        /* --- 2026-08-17: FREE seat. Struck price + badge, and the register form
           that replaced the Stripe checkout entirely. --- */
        .cmlc .freeline{display:flex;align-items:center;justify-content:center;gap:16px;
          flex-wrap:wrap;margin-bottom:6px;}
        .cmlc .freeline .old{font-family:var(--serif);font-size:clamp(34px,7vw,52px);
          color:#e7c9a8;opacity:.75;text-decoration:line-through;text-decoration-thickness:3px;}
        .cmlc .freeline .free{font-family:var(--serif);font-weight:700;
          font-size:clamp(40px,9vw,68px);color:#1d1b18;background:var(--gold,#e8c979);
          padding:4px 26px;border-radius:10px;letter-spacing:.02em;line-height:1.1;
          transform:rotate(-3deg);box-shadow:0 10px 26px -12px rgba(0,0,0,.6);}
        .cmlc .lastfree{margin:10px auto 0;max-width:420px;font-size:14.5px;font-weight:800;
          letter-spacing:.02em;color:var(--gold);line-height:1.45;}
        .cmlc .regform{display:grid;gap:11px;max-width:420px;margin:18px auto 0;text-align:left;}
        .cmlc .regform label{font-size:12.5px;font-weight:700;letter-spacing:.06em;
          text-transform:uppercase;color:#e7c9a8;display:block;margin-bottom:5px;}
        .cmlc .regform input{width:100%;padding:13px 15px;font-size:16px;border-radius:9px;
          border:1px solid rgba(231,201,168,.35);background:rgba(255,255,255,.06);
          color:#fff;font-family:var(--sans);}
        .cmlc .regform input::placeholder{color:rgba(231,201,168,.5);}
        .cmlc .regform input:focus{outline:none;border-color:var(--gold,#e8c979);}
        .cmlc .regdone{max-width:460px;margin:16px auto 0;padding:18px 20px;border-radius:12px;
          background:rgba(232,201,121,.14);border:1px solid rgba(232,201,121,.5);
          color:#f4e6cf;font-size:15.5px;line-height:1.6;}
        .cmlc .regerr{max-width:420px;margin:12px auto 0;color:#ffd9d0;font-size:14px;line-height:1.5;}

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
          cannot promise a blood pressure number in three days, and a licensed
          nurse promising one is the kind of claim that ends careers. The
          hormone line is the wedge, because it is the thing no other BP page
          in this niche can honestly say. */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">{CHALLENGE.NAME} &middot; Live with Annie and Joel, RNs</span>
          <h1>Three Nights to Find Out What Is Actually Driving Your Numbers</h1>
          <p className="tagline">
            For women over 40 whose blood pressure, blood sugar and hormones are all pulling on
            the same rope. You leave with your own pattern on one page, and a plan you can hand
            your doctor.
          </p>
          <div className="when">
            <span>{CHALLENGE.DATE_RANGE_LABEL}</span>
            <span>{CHALLENGE.TIME_LABEL}</span>
            <span>Waitlist open, seats not yet released</span>
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
              <div className="n">3 nights</div>
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

      {/* ============ THE THREE DAYS ============ */}
      <section className="days">
        <div className="wrap">
          <h2>What Happens Each Day</h2>
          <p className="lede">One focus a day. Nothing to overhaul, everything to notice.</p>
          {DAYS.map((d) => (
            <div className="day" key={d.n}>
              <div className="daynum">Day {d.n}</div>
              <div>
                <h3>{d.title}</h3>
                {d.body.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
                <p className="daynext">{d.next}</p>
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
          <p className="lede">Read this honestly. If it is not you, keep your seat for someone it is.</p>
          <ul>
            <li><b>&#10003;</b><span>You are a woman over 40 and your blood pressure, blood sugar or hormones have all started talking at once.</span></li>
            <li><b>&#10003;</b><span>You are already on medication, you are taking it, and your numbers still are not where you want them.</span></li>
            <li><b>&#10003;</b><span>You are doing things you were told to do and you cannot tell which of them is actually working.</span></li>
            <li><b>&#10003;</b><span>You want to work with your doctor, not around them, and you want to walk in prepared.</span></li>
            <li><b>&#10003;</b><span>You can give one hour a night for three nights, or watch the replay within 48 hours.</span></li>
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

      {/* ============ LIVE EVENT PROOF BRIDGE (added 2026-08-17) ============
          Photos are the REAL RestoreHER Hormones 2026 event, reused from
          restoreherhormones-site. Nothing staged, nothing stock.

          COMPLIANCE, do not loosen: this says only that a live women's
          wellness event happened with Barbara O'Neill and other educators,
          and that women participated. It does NOT say or imply she created,
          teaches, sponsors, endorses or recommends this challenge. There is
          no Barbara quote here because we do not have one about the event on
          record. Do not add one from memory.

          No CTA inside this section on purpose. The ask is the next block. */}
      <section className="ev">
        <div className="wrap">
          <span className="eyebrow">We&rsquo;ve seen what happens when women get in the room</span>
          <h2>Something changes when you stop trying to figure all of this out by yourself.</h2>

          <p>
            Recently, we gathered women together in person for a live women&rsquo;s wellness
            experience with Barbara O&rsquo;Neill and other educators.
          </p>
          <p>Women came with questions.</p>
          <p>
            About their bodies. Their hormones. Their numbers. Their energy. Their sleep. The
            changes they could feel happening, and what they were supposed to do about them.
          </p>

          <figure>
            <img src={eventStage} alt="A full room of women at the RestoreHER Hormones live event, listening to a teaching session" loading="lazy" />
          </figure>

          <p>And yes, what was taught mattered.</p>
          <p>But something else happened in that room that stayed with us.</p>
          <p className="beat">Women had a place to listen.</p>
          <p className="beat">To ask questions.</p>
          <p className="beat">To connect things they had been looking at separately.</p>
          <p className="beat">And to finally spend focused time thinking about their own health.</p>

          <div className="strip">
            <img src={eventBarbaraAnnie} alt="Barbara O'Neill and Annie Chitate, RN together at the live event" loading="lazy" />
            <img src={eventRoom} alt="Women gathered around the table listening at the live event" loading="lazy" />
            <img src={eventSpeakers} alt="Barbara O'Neill, Annie Chitate, RN and other speakers at the live event" loading="lazy" />
          </div>

          <p className="sub">And we thought: more women need access to this.</p>
          <p>Not necessarily another conference.</p>
          <p>Not another notebook full of information.</p>
          <p className="punch">A place to actually DO something with what they are learning.</p>

          <div className="bridge">
            <p className="beat">Three focused days.</p>
            <p className="beat">Smaller steps.</p>
            <p className="beat">More participation.</p>
            <p>
              More opportunity to pay attention to <strong>your</strong> patterns,{' '}
              <strong>your</strong> habits, <strong>your</strong> numbers, <strong>your</strong>{' '}
              symptoms and <strong>your</strong> life.
            </p>
            <p>Because the goal is not for you to leave with another notebook full of things you know.</p>
            <p className="close">The goal is for you to finally start doing something with what you know.</p>
          </div>
        </div>
      </section>

      {/* ============ THE ASK - SEPTEMBER WAITLIST ============
          2026-08-27: no price, no charge rail, no free claim. September is a
          paid cohort whose price is not set, so this asks only to be on the
          list. Name, email and phone are all required. */}
      <section className="wrap" id="buy">
        <div className="buybox">
          <span className="eyebrow" style={{ color: '#e7c9a8' }}>The next cohort</span>
          <div className="freeline">
            <span className="free">September</span>
          </div>
          <div className="was">Three days, live, with Annie and Joel in September.</div>
          <div className="lastfree">Get the dates before seats open to anyone else.</div>

          {state === 'done' ? (
            <div className="regdone" role="status">
              <strong>You are on the list.</strong> We will email you the September dates before we
              open seats to anyone else. If nothing arrives, check spam, then write to{' '}
              {CHALLENGE.SUPPORT_EMAIL}.
            </div>
          ) : (
            <form className="regform" onSubmit={register} noValidate>
              <div>
                <label htmlFor="cmlc-name">Name</label>
                <input
                  id="cmlc-name" type="text" required autoComplete="given-name"
                  placeholder="Your name" value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="cmlc-email">Email</label>
                <input
                  id="cmlc-email" type="email" required autoComplete="email" inputMode="email"
                  placeholder="you@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="cmlc-phone">Phone</label>
                <input
                  id="cmlc-phone" type="tel" required autoComplete="tel" inputMode="tel"
                  placeholder="(555) 555-5555" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <button type="submit" className="btn" disabled={state === 'sending'}>
                {state === 'sending' ? 'ADDING YOU TO THE LIST...' : 'JOIN THE SEPTEMBER WAITLIST'}
              </button>
            </form>
          )}

          {error && <p className="regerr" role="alert">{error}</p>}

          <div className="btn-sub">
            Questions, write to {CHALLENGE.SUPPORT_EMAIL}
          </div>
        </div>

        <div className="assure">
          <div>Live with two RNs</div>
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
        <button type="button" onClick={() => goToForm('sticky')}>
          JOIN THE SEPTEMBER WAITLIST
        </button>
      </div>
    </div>
  );
}
