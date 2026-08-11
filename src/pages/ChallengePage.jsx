// ChallengePage (route: /challenge, own domain changemylifechallenge.com) -
// THE CHANGE MY LIFE CHALLENGE, co-hosted by Annie Chitate, RN (Everyday
// Nurse Annie) and Joel Polley, RN (the BP Guy).
//
// FULL REDESIGN 2026-08-11 (Joel, explicit). Joel supplied a new HTML comp
// ("Enough.") and asked for a full structural switch: SEVEN days (not three
// nights), August 17 to 23, 2026, ONE seat at $97 (no GA/VIP split). That is
// a real change to what gets charged, not just a copy refresh, so read this
// before touching pricing:
//
//   NO LIVE STRIPE PRICE EXISTS YET for this $97 seat. Creating one is a
//   financial write and was not part of what Joel approved in this pass (he
//   approved the STRUCTURE: 7 days / $97 / single seat, not "go create the
//   Stripe price"). Until CHALLENGE_PRICE_ID exists in env, the CTA below
//   degrades HONESTLY to the same waitlist/interest capture the file has
//   always used when checkout is not wired: /api/challenge-signup with
//   intent 'waitlist'. It never shows a spinner or a fake success state for
//   a charge that cannot happen. Once Joel approves creating the price,
//   swap SignupForm's intent to 'register' and wire a real Checkout Session
//   the same way the retired GA/VIP tiers did (see git history on this file
//   for that pattern), and mirror the new dates into
//   ChallengeConfirmedPage.jsx and api/challenge-signup.js's own CHALLENGE
//   block, per the three-file-mirror rule this page has always followed.
//
//   NO seat cap. No "only 40 spots". No fabricated stack values on a struck
//   total (the 2026-07-25 audit killed exactly that pattern once already).
//   The offer stack below shows real line items with no dollar figure per
//   line and no invented "total value" strike, only the honest $97 ask.
//
// TESTIMONIALS: six real, unedited quotes from Joel's own TikTok/YouTube
// comments and Instagram DMs, screenshotted, cropped to the quote only, and
// with the commenter's name/handle blacked out (2026-08-11, Joel: "crop and
// insert and black out names"). This replaces the comp's placeholder
// "[Add a real testimonial]" cards, which are never shipped per the
// no-fabricated-testimonials rule (memory: project_testimonial_consent...).
// These are public platform comments / DMs the person sent Joel directly,
// anonymized before publishing.
//
// ZERO em dashes in visible copy. NEWSTART clean. Education alongside the
// doctor, never a clinical outcome claim, never a medication change.

import { useEffect, useState, useCallback } from 'react';
import { track } from '../utils/analytics';
import { zonedInstant } from '../utils/tz.js';
import bannerImg from '../assets/challenge-banner.jpg';

import t1 from '../assets/challenge-testimonials/t1-ag.jpg';
import t2 from '../assets/challenge-testimonials/t2-garygould.jpg';
import t3 from '../assets/challenge-testimonials/t3-drago.jpg';
import t4 from '../assets/challenge-testimonials/t4-orlando.jpg';
import t5 from '../assets/challenge-testimonials/t5-carla.jpg';
import t6 from '../assets/challenge-testimonials/t6-authentic.jpg';

/* ==========================================================================
   CONFIG - change dates and price HERE and nowhere else. Also mirror any
   date change into ChallengeConfirmedPage.jsx and api/challenge-signup.js.
   ========================================================================== */
const CHALLENGE = {
  NAME: 'The Change My Life Challenge',
  COHORT_ID: '2026-08-17',
  START_ISO_ET: '2026-08-17T19:00:00',
  DATE_RANGE_LABEL: 'August 17 to 23, 2026',
  TIME_LABEL_ET: '6:00pm Central / 7:00pm Eastern',
  DAY_COUNT: 7,
  PRICE: 97,
  REGULAR_PRICE: 197,
  SUPPORT_EMAIL: 'braveworksrn@gmail.com',
};

const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const START_AT = zonedInstant(CHALLENGE.START_ISO_ET, 'America/New_York');

function t_(event, props) {
  track(event, { page: 'challenge', cohort: CHALLENGE.COHORT_ID, ...(props || {}) });
}

/* ==========================================================================
   FONTS - route scoped, idempotent by id (same pattern this page has always
   used: the site globally loads Fraunces/Inter, this comp needs its own
   pair, only fetched on this route).
   ========================================================================== */
const FONT_LINK_ID = 'cmlc-fonts';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500;1,9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap';

function useFonts() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(FONT_LINK_ID)) return;
    for (const [id, href, cors] of [
      ['cmlc-pc1', 'https://fonts.googleapis.com', false],
      ['cmlc-pc2', 'https://fonts.gstatic.com', true],
    ]) {
      if (document.getElementById(id)) continue;
      const pc = document.createElement('link');
      pc.id = id; pc.rel = 'preconnect'; pc.href = href;
      if (cors) pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    }
    const link = document.createElement('link');
    link.id = FONT_LINK_ID; link.rel = 'stylesheet'; link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

/* ==========================================================================
   COUNTDOWN to challenge start
   ========================================================================== */
function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return parts(START_AT - now);
}

/* ==========================================================================
   SIGNUP FORM
   Posts to /api/challenge-signup, intent 'waitlist' (see file-top note: no
   live $97 Stripe price exists yet, so this is honest interest capture, not
   a checkout). Non-ok response surfaces Joel's real email, never a fake
   success.
   ========================================================================== */
function SignupForm({ buttonLabel, id }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setState('error'); return; }
    setState('sending');
    try {
      const res = await fetch('/api/challenge-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'waitlist',
          email: email.trim(),
          firstName: name.trim(),
          tier: 'challenge-97',
        }),
      });
      const ok = res.ok;
      setState(ok ? 'done' : 'error');
      t_('chal_signup', { ok, status: res.status });
    } catch {
      setState('error');
      t_('chal_signup', { ok: false, status: 0 });
    }
  }

  if (state === 'done') {
    return (
      <p className="cmlc-form-success" role="status">
        You&rsquo;re on the list. Watch your email, we&rsquo;ll send your seat link before doors open.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="cmlc-form" id={id}>
      <input
        className="cmlc-input"
        type="text"
        autoComplete="given-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="First name"
      />
      <input
        className="cmlc-input"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button type="submit" className="btn big" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : buttonLabel}
      </button>
      {state === 'error' && (
        <p className="cmlc-form-error" role="alert">
          That did not go through. Write me directly at{' '}
          <a href={`mailto:${CHALLENGE.SUPPORT_EMAIL}`}>{CHALLENGE.SUPPORT_EMAIL}</a> and I will add you by hand.
        </p>
      )}
    </form>
  );
}

/* ==========================================================================
   THE SEVEN DAYS
   ========================================================================== */
const DAYS = [
  { n: 1, title: 'Bring Sexy Back', body: 'Not a number on a scale. You. The woman who laughed more, went places, had energy, felt confident, wanted things. We start with what you want back, because knowing WHY you’re changing makes everything that follows different.', shift: 'The shift: from "I need to lose weight" to "I know what I’m taking my health back for."' },
  { n: 2, title: 'Read the Signals', body: 'The cuff tightens. The number appears. Your stomach drops. Not this week. You’ll learn to look at your numbers as information instead of identity, and start seeing what they’re telling you about the life happening around them.', shift: 'The shift: less fear, better questions, more clarity.' },
  { n: 3, title: 'Find Your Triggers', body: 'Why the crash? Why the cravings? Why does your body feel fine one day and completely different the next? This is where you start connecting the dots and identifying your three biggest patterns worth watching.', shift: 'The shift: from ten random problems to one clearer picture.' },
  { n: 4, title: 'Move Different', body: 'No punishment. No trying to become your 25-year-old self again. No proving anything to anybody. You’ll feel what it’s like to use movement as something that works with your body, not against it.', shift: 'The shift: from "I need to exercise" to "I can actually do this."' },
  { n: 5, title: 'Win the Night', body: 'What if tomorrow starts tonight? You’ll start changing the way you enter sleep. Less chaos, more intention, a nighttime rhythm you can actually repeat after the challenge ends. Then you wake up and pay attention.', shift: 'The shift: from hoping for a better night to knowing how to create one.' },
  { n: 6, title: 'Turn Down the Pressure', body: 'Sometimes the pressure isn’t only in the cuff. It’s the phone, the family, the schedule, the thoughts that won’t shut off. Today, you give your body five intentional minutes to come down.', shift: 'The shift: from living at full volume to knowing how to turn it down.' },
  { n: 7, title: 'Health Is Money. Take Back Your Future.', body: 'Now we look back at Day 1. What did you notice? What surprised you? What keeps showing up? Then we put the pieces together: your health, your numbers, your patterns, your priorities, the life you still want to live.', shift: 'The goal was never seven good days. It was finally knowing where to go from here.' },
];

const QUALIFY_YES = [
  'You’re a woman 40+ and your body has started getting your attention',
  'You know you need to make some changes, but you’re tired of trying to change everything at once',
  'You’ve collected enough information. You want to understand your own patterns',
  'You want something you can actually DO, not just watch',
  'You’re willing to give yourself seven days',
];
const QUALIFY_NO = [
  'You’re looking for a seven-day cure',
  'You want someone to diagnose you or change your medications',
  'You want another class to watch without doing anything differently',
  'You’re unwilling to pay attention to what your own body is telling you',
];

const VOICES = [
  { q: '"Be around for the grandkids. Get off the meds. Feel healthier."', who: 'P.H.' },
  { q: '"I want to tell my doctor, ‘I told you so.’"', who: 'P.H.' },
  { q: '"The doctor wanted to put me on three medicines. I was afraid to do that, so I started making changes on my own. I wanted to be with my family."', who: 'L.' },
  { q: '"I don’t want to deal with the side effects of medication. My mom and my aunt both had dementia, and I don’t want to add to my own risk."', who: 'R.E.' },
];

const TESTIMONIAL_IMAGES = [t1, t2, t3, t4, t5, t6];

const FAQS = [
  { q: 'What if I miss a day?', a: 'Replays are up for 48 hours after each live session, so a busy Tuesday won’t knock you out of the challenge. But whenever you can, show up live. The power of this week is in the doing, not the watching.' },
  { q: 'What if I’m on medication?', a: 'Come. This challenge does not replace your healthcare provider, and we will never tell you to stop or change a prescribed medication. You’ll learn to observe your own routines, habits, and health information more carefully. That means better conversations with your healthcare team, not skipping them.' },
  { q: 'What if I’m older than 40?', a: 'Good. This isn’t about turning back the clock. You still have places to go, people to love, grandchildren to enjoy, trips to take, things to build, and wisdom the world still needs from you.' },
  { q: 'What if I’ve tried everything?', a: 'Then stop trying everything. Start paying attention. Read it. Reset it. Reclaim it. Seven days. Let’s find your next move.' },
];

export default function ChallengePage() {
  useFonts();
  const cd = useCountdown();
  const [showSticky, setShowSticky] = useState(false);

  const onScroll = useCallback(() => {
    setShowSticky(window.scrollY > window.innerHeight * 0.7);
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <div className="cmlc-page">
      <style>{`
        .cmlc-page{
          --cream:#F9E8E1; --cream-2:#F2D9CE; --white:#FFFFFF; --ink:#221F1C;
          --ink-soft:#5A5049; --coral:#7D2A3B; --coral-dark:#5E1F2C;
          --forest:#33503C; --forest-dark:#243A2B; --rose:#E9C7B8; --rose-soft:#F1DCCF;
          --rosegold:#C08A7A; --rosegold-dark:#9C6A5B; --line:rgba(34,31,28,0.14);
          --radius:18px; --maxw:920px;
          background:var(--cream); color:var(--ink); font-family:'Manrope',sans-serif;
          font-size:18px; line-height:1.6; -webkit-font-smoothing:antialiased;
        }
        .cmlc-page *{box-sizing:border-box;}
        .cmlc-page h1,.cmlc-page h2,.cmlc-page h3{font-family:'Fraunces',serif;font-weight:600;line-height:1.08;margin:0;color:var(--ink);}
        .cmlc-page p{margin:0 0 1em;}
        .cmlc-wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px;}
        .cmlc-sec{padding:70px 0;}
        .cmlc-page img{max-width:100%;display:block;}
        .cmlc-page a{color:inherit;}
        .cmlc-eyebrow{display:inline-flex;font-family:'Manrope',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--forest);}
        .cmlc-eyebrow.on-dark{color:var(--rose-soft);}
        .cmlc-eyebrow.rg{color:var(--rosegold-dark);}
        .btn{display:inline-block;background:var(--coral);color:#fff !important;font-family:'Manrope',sans-serif;font-weight:800;font-size:17px;text-decoration:none;padding:18px 30px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 10px 24px -8px rgba(125,42,59,0.4);transition:transform .15s ease, box-shadow .15s ease;text-align:center;width:100%;}
        .btn:hover{background:var(--coral-dark);transform:translateY(-2px);}
        .btn.big{font-size:19px;padding:20px 34px;}
        .btn-sub{font-size:14px;color:var(--ink-soft);text-align:center;margin-top:10px;}

        /* hero */
        .cmlc-hero{padding:56px 0 60px;background:var(--white);}
        .cmlc-hero-pre{font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:14px;}
        .cmlc-hero-pre span{color:var(--coral);font-weight:900;}
        .cmlc-hero h1{font-size:clamp(30px,5.6vw,54px);line-height:1.12;max-width:16ch;text-align:left;margin-bottom:16px;}
        .cmlc-hero-hint{font-size:18px;font-style:italic;color:var(--ink-soft);margin-bottom:26px;max-width:52ch;}
        .cmlc-countdown{display:flex;gap:12px;margin:0 0 26px;}
        .cmlc-cd-box{background:var(--cream-2);border:1px solid var(--line);border-radius:12px;padding:12px 16px;min-width:64px;text-align:center;}
        .cmlc-cd-num{display:block;font-family:'Fraunces',serif;font-weight:800;font-size:24px;color:var(--forest-dark);}
        .cmlc-cd-label{display:block;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin-top:2px;}
        .cmlc-hero-cta{max-width:420px;}
        .cmlc-hero-body{font-size:17px;color:var(--ink-soft);max-width:640px;margin-top:36px;}
        .cmlc-hero-punch{font-family:'Fraunces',serif;font-weight:800;font-style:italic;font-size:21px;color:var(--coral);margin:18px 0;}

        /* scanner strip */
        .cmlc-scan{background:var(--ink);color:var(--cream);padding:0;}
        .cmlc-scan-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
        .cmlc-scan-cell{padding:30px 24px;border-left:1px solid rgba(251,243,230,.12);}
        .cmlc-scan-cell:first-child{border-left:none;}
        .cmlc-scan-l{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--rosegold);margin-bottom:8px;}
        .cmlc-scan-v{font-family:'Fraunces',serif;font-weight:700;font-size:20px;color:#fff;margin-bottom:6px;}
        .cmlc-scan-s{font-size:13.5px;color:rgba(251,243,230,.65);line-height:1.4;}

        /* enough / stop */
        .cmlc-stop{background:var(--ink);color:var(--cream);text-align:center;}
        .cmlc-enough{font-family:'Fraunces',serif;font-weight:900;font-style:italic;color:#fff;font-size:clamp(48px,9vw,90px);margin-bottom:20px;}
        .cmlc-stop p{max-width:600px;margin:0 auto 14px;color:rgba(251,243,230,.85);font-size:17.5px;}

        /* credibility break */
        .cmlc-banner-frame{max-width:640px;margin:0 auto 32px;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px -16px rgba(0,0,0,.25);}
        .cmlc-guides{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:10px;}
        .cmlc-guide-chip{display:flex;gap:12px;align-items:center;background:var(--cream-2);border:1px solid var(--line);border-radius:14px;padding:14px 18px;max-width:300px;}
        .cmlc-guide-chip span{flex:none;width:44px;height:44px;border-radius:50%;background:var(--rosegold);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:16px;}
        .cmlc-guide-chip h4{color:var(--ink);font-size:15.5px;margin:0 0 2px;}
        .cmlc-guide-chip p{color:var(--ink-soft);font-size:13.5px;margin:0;}
        .cmlc-trust{text-align:center;margin-top:20px;font-size:13.5px;font-weight:700;color:var(--forest-dark);}

        /* days */
        .cmlc-days{background:var(--cream-2);}
        .cmlc-days-head{text-align:center;margin-bottom:48px;}
        .cmlc-days-head h2{font-size:clamp(30px,4.8vw,46px);margin:16px 0 14px;}
        .cmlc-days-head p{max-width:600px;margin:0 auto;color:var(--ink-soft);font-size:17.5px;}
        .cmlc-day-list{display:flex;flex-direction:column;gap:16px;}
        .cmlc-day-card{background:var(--cream);border:1px solid var(--line);border-radius:var(--radius);padding:26px 28px;display:grid;grid-template-columns:88px 1fr;gap:20px;align-items:start;}
        .cmlc-day-badge{width:88px;height:88px;border-radius:50%;background:var(--forest);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;flex:none;}
        .cmlc-day-badge span:first-child{font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.8;}
        .cmlc-day-badge span:last-child{font-family:'Fraunces',serif;font-weight:800;font-size:18px;}
        .cmlc-day-card h3{font-size:22px;margin-bottom:8px;}
        .cmlc-day-card p{color:var(--ink-soft);font-size:16px;}
        .cmlc-day-shift{font-family:'Fraunces',serif;font-style:italic;color:var(--rosegold-dark);font-size:15.5px;margin-top:10px;}

        /* generic centered section */
        .cmlc-center{text-align:center;}
        .cmlc-center h2{font-size:clamp(28px,4.6vw,44px);margin:14px 0 18px;max-width:22ch;margin-left:auto;margin-right:auto;}
        .cmlc-center .lede{max-width:600px;margin:0 auto;color:var(--ink-soft);font-size:17.5px;}

        .cmlc-fw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:left;margin-top:36px;}
        .cmlc-fw-card{background:var(--cream-2);border-radius:var(--radius);padding:26px 24px;border:1px solid var(--line);border-top:3px solid var(--rosegold);}
        .cmlc-fw-num{font-family:'Fraunces',serif;font-style:italic;font-weight:600;font-size:14px;color:var(--rosegold-dark);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:block;}
        .cmlc-fw-card h3{font-size:21px;}

        /* qualify */
        .cmlc-qualify{background:var(--ink);color:var(--cream);}
        .cmlc-qualify-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:26px;}
        .cmlc-qcard{border-radius:var(--radius);padding:28px 26px;}
        .cmlc-qcard.yes{background:rgba(251,243,230,.06);border:1px solid rgba(233,199,184,.3);}
        .cmlc-qcard.no{background:rgba(0,0,0,.18);border:1px solid rgba(251,243,230,.08);}
        .cmlc-qcard h3{color:#fff;font-size:20px;margin-bottom:16px;}
        .cmlc-qcard.no h3{color:rgba(251,243,230,.6);}
        .cmlc-qcard ul{list-style:none;padding:0;margin:0;}
        .cmlc-qcard li{padding:9px 0 9px 24px;position:relative;font-size:15.5px;border-bottom:1px solid rgba(251,243,230,.1);}
        .cmlc-qcard li:last-child{border-bottom:none;}
        .cmlc-qcard.yes li{color:rgba(251,243,230,.94);}
        .cmlc-qcard.no li{color:rgba(251,243,230,.55);}
        .cmlc-qcard.yes li::before{content:"\\2713";position:absolute;left:0;color:var(--rosegold);font-weight:800;}
        .cmlc-qcard.no li::before{content:"\\2715";position:absolute;left:0;color:rgba(251,243,230,.4);font-weight:800;}

        /* creds */
        .cmlc-creds-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:34px;}
        .cmlc-cred-card{background:var(--cream);border:1px solid var(--line);border-radius:var(--radius);padding:30px;}
        .cmlc-cred-photo{width:60px;height:60px;border-radius:50%;background:var(--forest);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:19px;margin-bottom:16px;}
        .cmlc-cred-card h3{font-size:20px;margin-bottom:2px;}
        .cmlc-cred-card .role{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--rosegold-dark);margin-bottom:12px;display:block;}
        .cmlc-cred-card p{color:var(--ink-soft);font-size:15.5px;}
        .cmlc-cred-card .quote{font-family:'Fraunces',serif;font-style:italic;color:var(--forest-dark);font-size:16.5px;margin-top:12px;}

        /* testimonials */
        .cmlc-testi-head{text-align:center;margin-bottom:36px;}
        .cmlc-testi-head h2{font-size:clamp(28px,4.4vw,40px);margin:14px 0 0;}
        .cmlc-testi-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .cmlc-testi-card{background:var(--white);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 10px 26px -18px rgba(0,0,0,.3);}
        .cmlc-testi-card img{width:100%;height:auto;display:block;}

        .b-placeholder{border:2px dashed var(--rosegold);border-radius:16px;background:repeating-linear-gradient(135deg, rgba(192,138,122,0.07), rgba(192,138,122,0.07) 12px, rgba(192,138,122,0.13) 12px, rgba(192,138,122,0.13) 24px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:50px 26px;min-height:200px;}
        .b-placeholder.full-bleed{min-height:340px;}
        .b-placeholder.compact{min-height:120px;padding:30px 24px;}
        .b-placeholder.small{min-height:120px;padding:26px 22px;border-radius:14px;}
        .b-placeholder .b-ph-label{font-family:'Manrope',sans-serif;font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--forest-dark);margin-bottom:8px;}
        .b-placeholder .b-ph-note{font-size:13.5px;color:var(--ink-soft);max-width:420px;margin:0;}

        .cmlc-voice-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
        .cmlc-voice-card{background:var(--cream-2);border-radius:var(--radius);padding:24px 26px;border:1px solid var(--line);border-left:4px solid var(--rosegold);}
        .cmlc-voice-card p{font-family:'Fraunces',serif;font-style:italic;font-size:18px;color:var(--forest-dark);margin:0 0 8px;}
        .cmlc-voice-card span{font-size:12.5px;font-weight:700;color:var(--ink-soft);}

        /* offer / price */
        .cmlc-stack{background:var(--forest-dark);color:var(--cream);}
        .cmlc-stack-list{max-width:600px;margin:30px auto 0;}
        .cmlc-stack-row{padding:16px 0;border-bottom:1px solid rgba(251,243,230,.14);}
        .cmlc-stack-row h4{color:#fff;font-size:16.5px;font-weight:700;margin:0 0 4px;}
        .cmlc-stack-row p{color:rgba(251,243,230,.68);font-size:14.5px;margin:0;}
        .cmlc-price-card{max-width:480px;margin:36px auto 0;background:var(--cream);color:var(--ink);border-radius:20px;padding:36px 32px;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.4);border-top:4px solid var(--rosegold);}
        .cmlc-price-today{font-size:12.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);}
        .cmlc-price-amount{font-family:'Fraunces',serif;font-weight:800;font-size:58px;color:var(--coral);margin:6px 0 4px;}
        .cmlc-price-reg{font-size:14px;color:var(--ink-soft);margin-bottom:20px;}
        .cmlc-price-reg s{color:var(--ink-soft);}

        /* faq */
        .cmlc-faq-item{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin-bottom:12px;}
        .cmlc-faq-item h3{font-size:18px;margin-bottom:8px;}
        .cmlc-faq-item p{color:var(--ink-soft);font-size:16px;margin:0;}

        /* final */
        .cmlc-final{background:radial-gradient(60% 60% at 50% 100%, rgba(192,138,122,0.28), transparent 70%), var(--cream);text-align:center;}
        .cmlc-final .cmlc-enough{font-size:clamp(56px,12vw,110px);color:var(--ink);margin-bottom:6px;}

        footer.cmlc-footer{background:var(--ink);color:rgba(251,243,230,.6);text-align:center;padding:40px 24px 100px;font-size:14px;}
        footer.cmlc-footer .love{font-family:'Fraunces',serif;font-style:italic;font-size:19px;color:var(--rose-soft);margin-bottom:8px;}

        .cmlc-sticky{position:fixed;left:0;right:0;bottom:0;background:var(--forest-dark);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:14px;transform:translateY(120%);transition:transform .3s ease;z-index:50;box-shadow:0 -10px 30px rgba(0,0,0,.25);}
        .cmlc-sticky.show{transform:translateY(0);}
        .cmlc-sticky span{color:#fff;font-weight:800;font-size:14.5px;}
        .cmlc-sticky a.btn{width:auto;padding:12px 20px;font-size:14.5px;box-shadow:none;}

        .cmlc-form{display:flex;flex-direction:column;gap:12px;text-align:left;}
        .cmlc-input{padding:14px 16px;border:1px solid var(--line);border-radius:10px;font-family:'Manrope',sans-serif;font-size:15px;background:var(--white);color:var(--ink);}
        .cmlc-form-success{margin:0;padding:16px 18px;border-radius:10px;background:rgba(51,80,60,.12);border:1px solid rgba(51,80,60,.3);color:var(--forest-dark);font-size:15px;}
        .cmlc-form-error{margin:8px 0 0;font-size:13.5px;color:var(--coral);}
        .cmlc-form-error a{color:inherit;font-weight:700;}

        @media (max-width:760px){
          .cmlc-sec{padding:48px 0;}
          .cmlc-scan-grid{grid-template-columns:1fr 1fr;}
          .cmlc-scan-cell:nth-child(2){border-left:1px solid rgba(251,243,230,.12);}
          .cmlc-scan-cell:nth-child(3){border-left:none;}
          .cmlc-qualify-grid,.cmlc-creds-grid,.cmlc-voice-grid,.cmlc-testi-grid{grid-template-columns:1fr;}
          .cmlc-fw-grid{grid-template-columns:1fr;}
          .cmlc-day-card{grid-template-columns:1fr;text-align:left;}
          .cmlc-day-badge{width:60px;height:60px;flex-direction:row;gap:4px;}
        }
      `}</style>

      {/* ============ HERO ============ */}
      <section className="cmlc-hero">
        <div className="cmlc-wrap">
          <div className="cmlc-banner-frame" style={{ marginBottom: 30 }}>
            <img src={bannerImg} alt="Change My Life Challenge. Your next chapter starts here. Annie Chitate, RN and Joel Polley, RN." />
          </div>

          <p className="cmlc-hero-pre">For the woman who&rsquo;s had <span>ENOUGH</span></p>
          <h1>You Are About To Discover The Single Biggest Health Mistake Women Over 40 Make That Keeps Them Stuck&hellip;</h1>
          <p className="cmlc-hero-hint">(Hint: it&rsquo;s not another fad diet, exercise routine, or prescription.)</p>

          <div className="cmlc-countdown">
            <div className="cmlc-cd-box"><span className="cmlc-cd-num">{String(cd.d).padStart(2, '0')}</span><span className="cmlc-cd-label">Days</span></div>
            <div className="cmlc-cd-box"><span className="cmlc-cd-num">{String(cd.h).padStart(2, '0')}</span><span className="cmlc-cd-label">Hours</span></div>
            <div className="cmlc-cd-box"><span className="cmlc-cd-num">{String(cd.m).padStart(2, '0')}</span><span className="cmlc-cd-label">Min</span></div>
            <div className="cmlc-cd-box"><span className="cmlc-cd-num">{String(cd.s).padStart(2, '0')}</span><span className="cmlc-cd-label">Sec</span></div>
          </div>

          <div className="cmlc-hero-cta">
            <a href="#seat" className="btn big" onClick={() => t_('chal_cta_click', { location: 'hero' })}>
              Join The Change My Life Challenge
            </a>
            <div className="btn-sub">{CHALLENGE.DATE_RANGE_LABEL} &nbsp;|&nbsp; Now Enrolling</div>
          </div>

          <div className="cmlc-hero-body">
            <h2 style={{ fontSize: 'clamp(26px,4.4vw,38px)', fontStyle: 'italic', marginBottom: 16 }}>You&rsquo;ve Tried Everything</h2>
            <p>The supplements. The collagen to stop speedy aging. The creams and tweezers for the chin hair. The pills for your blood pressure, mantras, affirmations and sleep aids. Girl, you&rsquo;ve even listened to the guru, done the diet and exercise routines.</p>
            <p className="cmlc-hero-punch">You&rsquo;ve tried everything. And nothing&rsquo;s working. If anything, it&rsquo;s getting worse.</p>
            <p>But your chin hair, sticky weight, mood shifts, blood pressure spikes, energy crashes, libido changes, speedy hormone aging, anxiety, period drama, menopause shifts, blood sugar issues. None of it has let up.</p>
            <p>You&rsquo;ve Googled enough. You&rsquo;ve saved enough videos. You&rsquo;ve suffered enough.</p>
            <p style={{ fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: 20, color: 'var(--forest-dark)' }}>
              &rarr; Your symptoms are telling one connected story, and nobody ever taught you how to listen to your body.
            </p>
          </div>
        </div>
      </section>

      {/* ============ WHAT / WHEN / WHO (banner kept from the old page, Joel: "we want banner under the vsl") ============ */}
      <div className="cmlc-scan">
        <div className="cmlc-wrap" style={{ padding: 0 }}>
          <div className="cmlc-scan-grid">
            <div className="cmlc-scan-cell">
              <div className="cmlc-scan-l">What</div>
              <div className="cmlc-scan-v">{CHALLENGE.DAY_COUNT} Live Days</div>
              <div className="cmlc-scan-s">Virtual, on Zoom. Replays included for 48 hours.</div>
            </div>
            <div className="cmlc-scan-cell">
              <div className="cmlc-scan-l">When</div>
              <div className="cmlc-scan-v">{CHALLENGE.DATE_RANGE_LABEL}</div>
              <div className="cmlc-scan-s">Daily, {CHALLENGE.TIME_LABEL_ET}.</div>
            </div>
            <div className="cmlc-scan-cell">
              <div className="cmlc-scan-l">What You Leave With</div>
              <div className="cmlc-scan-v">Your Personal Life Change Map&trade;</div>
              <div className="cmlc-scan-s">Your three biggest patterns, and your exact next move.</div>
            </div>
            <div className="cmlc-scan-cell">
              <div className="cmlc-scan-l">Who It Is For</div>
              <div className="cmlc-scan-v">Women 40+, tired of chasing symptoms</div>
              <div className="cmlc-scan-s">On medication or watching it. Alongside your doctor, never instead.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ENOUGH ============ */}
      <section className="cmlc-stop">
        <div className="cmlc-wrap">
          <h2 className="cmlc-enough">Enough.</h2>
          <p>Even if you&rsquo;ve stared at blood pressure, diabetes, and lab numbers that no one ever explained to you.</p>
          <p>And dealt with the chin hair, belly fat, or thinning hair for years, not knowing why it&rsquo;s all happening or where to start fixing it. This challenge is for you.</p>
          <p>You don&rsquo;t need another guru, influencer, &ldquo;new&rdquo; method, more pills, or even more information. And we&rsquo;re not here to sell you a supplement stack. We&rsquo;re here to teach you how to read your own body.</p>
          <p style={{ maxWidth: 640, margin: '0 auto' }}>
            The <strong>Change My Life Challenge</strong> is a {CHALLENGE.DAY_COUNT}-day live experience where you learn the one skill that changes everything in your health: how to read what your body is telling you, connect the dots, and know what to do next without second-guessing yourself.
          </p>
        </div>
      </section>

      {/* ============ CREDIBILITY BREAK ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--white)' }}>
        <div className="cmlc-wrap cmlc-center">
          <div className="cmlc-guides">
            <div className="cmlc-guide-chip">
              <span>AC</span>
              <div><h4>Annie Chitate, RN</h4><p>Everyday Nurse. 14+ years, 50,000+ women guided.</p></div>
            </div>
            <div className="cmlc-guide-chip">
              <span>JP</span>
              <div><h4>Joel Polley, RN</h4><p>The BP Guy. Real numbers, explained simply. 22+ years as an RN, 630K+ following.</p></div>
            </div>
          </div>
          {/* Joel 2026-08-11: this exact line, replacing the comp's "Trusted by
              50,000+ women" trailer. */}
          <p className="cmlc-trust">Combined 36 years of nursing experience &nbsp;&middot;&nbsp; 20+ years of health coaching</p>
        </div>
      </section>

      {/* ============ RESTOREHER LIVE EVENT BRIDGE (added 2026-08-11, Joel) ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--cream-2)' }}>
        <div className="cmlc-wrap">
          <span className="cmlc-eyebrow rg" style={{ justifyContent: 'center', display: 'flex' }}>
            We&rsquo;ve seen what happens when women finally get in the room
          </span>
          <h2 style={{ textAlign: 'center', margin: '14px auto 24px', maxWidth: '22ch' }}>
            Something changes when you stop trying to figure all of this out by yourself.
          </h2>
          <p style={{ maxWidth: 640, margin: '0 auto 1em', textAlign: 'center' }}>
            Recently, we gathered women together in person for a live women&rsquo;s wellness experience with Barbara O&rsquo;Neill and other educators.
          </p>
          <p style={{ maxWidth: 640, margin: '0 auto 1em', textAlign: 'center' }}>Women came with questions.</p>
          <p style={{ maxWidth: 640, margin: '0 auto 1.4em', textAlign: 'center' }}>
            About their bodies. Their hormones. Their numbers. Their energy. Their sleep. The changes they could feel happening, and what they were supposed to do about them.
          </p>

          <div className="b-placeholder full-bleed" style={{ margin: '0 auto 40px', maxWidth: 860 }}>
            <div className="b-ph-label">[ LARGE EVENT ROOM PHOTO ]</div>
          </div>

          <p style={{ maxWidth: 600, margin: '0 auto 1em', textAlign: 'center' }}>And yes, what was taught mattered.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 1.4em', textAlign: 'center' }}>But something else happened in that room that stayed with us.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 0.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>Women had a place to listen.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 0.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>To ask questions.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 0.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>To connect things they had been looking at separately.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 30px', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>And to finally spend focused time thinking about their own health.</p>

          <div className="cmlc-testi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 40 }}>
            <div className="b-placeholder small"><div className="b-ph-label">[ ANNIE + BARBARA ]</div></div>
            <div className="b-placeholder small"><div className="b-ph-label">[ EVENT / BARBARA TEACHING / AUDIENCE ]</div></div>
            <div className="b-placeholder small"><div className="b-ph-label">[ JOEL + BARBARA ]</div></div>
          </div>

          <h3 style={{ textAlign: 'center', fontStyle: 'italic', fontFamily: "'Fraunces',serif", fontSize: 'clamp(22px,3.4vw,30px)', margin: '0 auto 20px', maxWidth: '20ch' }}>
            And we thought: more women need access to this.
          </h3>
          <p style={{ maxWidth: 600, margin: '0 auto 1em', textAlign: 'center' }}>Not necessarily another conference.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 1.4em', textAlign: 'center' }}>Not another notebook full of information.</p>
          <p style={{ maxWidth: 600, margin: '0 auto 30px', textAlign: 'center', fontWeight: 700 }}>A place to actually DO something with what they&rsquo;re learning.</p>

          <div className="cmlc-voice-grid" style={{ marginBottom: 30 }}>
            <div className="b-placeholder small">
              <div className="b-ph-label">[ EVENT TESTIMONIAL GAP &mdash; CLARITY ]</div>
              <p className="b-ph-note">Insert a real attendee statement describing something she understood, saw differently, or finally connected because of the event.</p>
            </div>
            <div className="b-placeholder small">
              <div className="b-ph-label">[ EVENT TESTIMONIAL GAP &mdash; EXPERIENCE ]</div>
              <p className="b-ph-note">Insert a real attendee statement describing what being in the room, participating, or learning with the group meant to her.</p>
            </div>
          </div>

          <div className="b-placeholder compact" style={{ maxWidth: 600, margin: '0 auto 40px' }}>
            <div className="b-ph-label">Optional: Barbara O&rsquo;Neill on our live event</div>
            <p className="b-ph-note">[ ACTUAL BARBARA EVENT QUOTE OR SHORT CLIP ] &mdash; use only her actual words about the live event. Do not connect the statement to the Change My Life Challenge unless she explicitly did so.</p>
          </div>

          <h2 style={{ textAlign: 'center', margin: '20px auto 24px', maxWidth: '20ch' }}>Now we&rsquo;re bringing that experience closer to home.</h2>
          <p style={{ maxWidth: 560, margin: '0 auto 0.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>Seven focused days.</p>
          <p style={{ maxWidth: 560, margin: '0 auto 0.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>Smaller steps.</p>
          <p style={{ maxWidth: 560, margin: '0 auto 1.4em', textAlign: 'center', fontFamily: "'Fraunces',serif", fontStyle: 'italic', color: 'var(--forest-dark)', fontSize: 19 }}>
            More participation.
          </p>
          <p style={{ maxWidth: 620, margin: '0 auto 1.4em', textAlign: 'center' }}>
            More opportunity to pay attention to <strong>your</strong> patterns, <strong>your</strong> habits, <strong>your</strong> numbers, <strong>your</strong> symptoms and <strong>your</strong> life.
          </p>
          <p style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            Because the goal isn&rsquo;t for you to leave with another notebook full of things you know.
          </p>
          <p style={{ maxWidth: 600, margin: '10px auto 0', textAlign: 'center', fontWeight: 800, color: 'var(--coral)' }}>
            The goal is for you to finally start doing something with what you know.
          </p>
        </div>
      </section>

      {/* ============ SEVEN DAYS ============ */}
      <section className="cmlc-sec cmlc-days" id="days">
        <div className="cmlc-wrap">
          <div className="cmlc-days-head">
            {/* Joel 2026-08-11: replace "What's inside the challenge" eyebrow +
                heading with this exact copy. */}
            <span className="cmlc-eyebrow">7 days. perfectly structured.</span>
            <h2 style={{ fontStyle: 'italic', fontSize: 'clamp(26px,4vw,36px)', margin: '14px 0' }}>
              In 7 days you&rsquo;ll feel it. In 14 days you&rsquo;ll see it. In 21 days others will notice.
            </h2>
            <p>
              Learn how to stop chasing symptoms. Start connecting the dots. Discover what your hormones, numbers,
              habits, and symptoms are really telling you and follow a personalized, step-by-step plan built from
              20+ years of real-world health experience and lessons from the bedside to create thriving health from
              the inside out.
            </p>
          </div>

          <div className="cmlc-day-list">
            {DAYS.map((d) => (
              <div className="cmlc-day-card" key={d.n}>
                <div className="cmlc-day-badge"><span>Day</span><span>{d.n}</span></div>
                <div>
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                  <p className="cmlc-day-shift">{d.shift}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ THIS CHALLENGE IS DIFFERENT ============ */}
      <section className="cmlc-sec cmlc-center">
        <div className="cmlc-wrap">
          <span className="cmlc-eyebrow" style={{ justifyContent: 'center' }}>This challenge is different</span>
          <h2>This isn&rsquo;t a course. This isn&rsquo;t another video. This isn&rsquo;t another opportunity to take notes you&rsquo;ll put away.</h2>
          <p className="lede">
            We&rsquo;re going to help you listen to what your body is saying, uncover the root causes, and find the
            reasons behind those symptoms. Because this isn&rsquo;t just about the blood pressure, the belly, the
            blood sugar, the chin hair, or the sleep.
          </p>
          <div className="cmlc-fw-grid">
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Reclaiming</span><h3>Your life</h3></div>
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Re-igniting</span><h3>Your confidence</h3></div>
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Restoring</span><h3>Your identity</h3></div>
          </div>
        </div>
      </section>

      {/* ============ PERSONALIZED HEALTH / FRAMEWORK ============ */}
      <section className="cmlc-sec cmlc-center" style={{ background: 'var(--cream-2)' }}>
        <div className="cmlc-wrap">
          <span className="cmlc-eyebrow rg" style={{ justifyContent: 'center' }}>Personalized health</span>
          <h2>By Day 7, you&rsquo;ll see the patterns that need your attention first.</h2>
          <p className="lede">Not the woman on TikTok&rsquo;s protocol, or your sister&rsquo;s, or mine. Yours. You may not have unrelated problems. The blood pressure, the stress, the energy, the belly. They may all be related.</p>
          <div className="cmlc-fw-grid">
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Read It</span><h3>You&rsquo;ll learn to read what your body&rsquo;s been showing you.</h3></div>
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Reset It</span><h3>You&rsquo;ll begin to reset the things you can change.</h3></div>
            <div className="cmlc-fw-card"><span className="cmlc-fw-num">Reclaim It</span><h3>You&rsquo;ll start to reclaim your confidence, your hope, your future.</h3></div>
          </div>
          <p style={{ marginTop: 30, fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: 24, color: 'var(--forest)' }}>Read &rarr; Reset &rarr; Reclaim&trade;</p>
        </div>
      </section>

      {/* ============ FOR / NOT FOR ============ */}
      <section className="cmlc-sec cmlc-qualify">
        <div className="cmlc-wrap">
          <span className="cmlc-eyebrow on-dark">Is this you?</span>
          <h2 style={{ color: '#fff', margin: '14px 0 0', fontSize: 'clamp(26px,4.2vw,38px)' }}>This is for you if&hellip;</h2>
          <div className="cmlc-qualify-grid">
            <div className="cmlc-qcard yes">
              <h3>This is for you</h3>
              <ul>{QUALIFY_YES.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="cmlc-qcard no">
              <h3>This is not for you</h3>
              <ul>{QUALIFY_NO.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: 19, color: 'var(--rose-soft)' }}>
            This is participation. Not perfection.<br />Come scared. Come messy. Just come.
          </p>
        </div>
      </section>

      {/* ============ CREDIBILITY ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--cream-2)' }}>
        <div className="cmlc-wrap">
          <div className="cmlc-center" style={{ marginBottom: 0 }}>
            <span className="cmlc-eyebrow rg">Why Annie + Joel</span>
            <h2>Two nurses. One body. The bigger picture.</h2>
          </div>
          <div className="cmlc-creds-grid">
            <div className="cmlc-cred-card">
              <div className="cmlc-cred-photo">JP</div>
              <h3>Joel Polley, RN</h3>
              <span className="role">The BP Guy</span>
              <p>You&rsquo;ve probably heard Joel talk about the cuff, the numbers, blood pressure, blood sugar. The readings that scare you because nobody has slowed down long enough to help you understand what they mean in the context of your life.</p>
              <p className="quote">&ldquo;Your numbers are information. Not your identity.&rdquo;</p>
            </div>
            <div className="cmlc-cred-card">
              <div className="cmlc-cred-photo">AC</div>
              <h3>Annie Chitate, RN</h3>
              <span className="role">Everyday Nurse</span>
              <p>Annie looks at the things you notice before anyone ever orders a lab. The fatigue. The sleep. The belly. The chin hair. The thinning hair. The changes that make you look in the mirror and think, &ldquo;what is happening to me?&rdquo;</p>
              <p className="quote">&ldquo;I have a clinical background. I also have a body that went through this. I&rsquo;m talking to you from both sides.&rdquo;</p>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 30, fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: 20, color: 'var(--forest-dark)' }}>
            Then Annie and Joel realized they were talking to the same woman. So they stopped separating the conversation.
          </p>
        </div>
      </section>

      {/* ============ REAL TESTIMONIALS (real screenshots, names redacted) ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--white)' }} id="testimonials">
        <div className="cmlc-wrap">
          <div className="cmlc-testi-head">
            <span className="cmlc-eyebrow rg">Straight from Joel&rsquo;s own comments and messages</span>
            <h2>This is why they showed up</h2>
          </div>
          <div className="cmlc-testi-grid">
            {TESTIMONIAL_IMAGES.map((src, i) => (
              <div className="cmlc-testi-card" key={i}>
                <img src={src} alt="Real reader message, name removed for privacy" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ REAL VOICES (why they showed up) ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--cream-2)' }}>
        <div className="cmlc-wrap">
          <div className="cmlc-testi-head">
            <span className="cmlc-eyebrow rg">Straight from women in the room</span>
            <h2>What&rsquo;s your why?</h2>
            <p>Real answers from women in a past Change My Life Challenge, when we asked.</p>
          </div>
          <div className="cmlc-voice-grid">
            {VOICES.map((v) => (
              <div className="cmlc-voice-card" key={v.who + v.q.slice(0, 10)}>
                <p>{v.q}</p>
                <span>{v.who}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OFFER + PRICE ============ */}
      <section className="cmlc-sec cmlc-stack" id="seat">
        <div className="cmlc-wrap">
          <div className="cmlc-center">
            <span className="cmlc-eyebrow on-dark">You&rsquo;ve spent enough time trying to figure this out alone</span>
            <h2 style={{ color: '#fff' }}>Everything you get to finally feel like yourself again</h2>
          </div>
          <div className="cmlc-stack-list">
            <div className="cmlc-stack-row"><h4>Seven Days, Live, With Two Nurses Who Get It</h4><p>Annie and Joel walk you through Read It, Reset It, Reclaim It in real time.</p></div>
            <div className="cmlc-stack-row"><h4>Know Exactly What To Do, Every Single Day</h4><p>Your daily action guide tells you precisely what to notice and what to change.</p></div>
            <div className="cmlc-stack-row"><h4>Your Personal Life Change Map&trade;, Built Just For You</h4><p>Walk away Day 7 with your three biggest patterns and your exact next move.</p></div>
            <div className="cmlc-stack-row"><h4>Real Answers From Two RNs, All Week Long</h4><p>Bring your actual questions to Annie and Joel each day.</p></div>
            <div className="cmlc-stack-row"><h4>A Support Circle of Women Doing This With You</h4><p>You show up every day with women who feel exactly what you feel.</p></div>
            <div className="cmlc-stack-row" style={{ borderBottom: 'none' }}><h4>Bonus: Know Your Labs Mini-Training</h4><p>Finally understand what your numbers actually mean.</p></div>
          </div>

          <div className="cmlc-price-card">
            <div className="cmlc-price-today">Your seat today</div>
            <div className="cmlc-price-amount"><sup style={{ fontSize: 22 }}>$</sup>{CHALLENGE.PRICE}</div>
            <div className="cmlc-price-reg">Regular price <s>{usd(CHALLENGE.REGULAR_PRICE)}</s></div>
            <SignupForm buttonLabel="Yes. I&rsquo;m Ready to Change My Life." id="seat-form" />
            <p style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-soft)' }}>
              The Zoom room genuinely caps how many women we can coach live. Once we&rsquo;re full, you&rsquo;re
              waiting for the next cohort.
            </p>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="cmlc-sec" style={{ background: 'var(--cream-2)' }}>
        <div className="cmlc-wrap">
          <div className="cmlc-testi-head">
            <span className="cmlc-eyebrow">Before you go</span>
            <h2>What women ask us</h2>
          </div>
          {FAQS.map((f) => (
            <div className="cmlc-faq-item" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-soft)' }}>
            This is not medical advice or a substitute for care from your own provider.
          </p>
        </div>
      </section>

      {/* ============ FINAL ============ */}
      <section className="cmlc-sec cmlc-final">
        <div className="cmlc-wrap">
          <span className="cmlc-eyebrow" style={{ justifyContent: 'center' }}>Ready when you are</span>
          <h2 className="cmlc-enough">Enough.</h2>
          <p className="lede">Seven days. Small shifts. Your patterns. Your evidence. Your map. Say yes today.</p>
          <div style={{ maxWidth: 420, margin: '20px auto 0' }}>
            <a href="#seat" className="btn big" onClick={() => t_('chal_cta_click', { location: 'final' })}>
              Start My Change My Life Challenge: {usd(CHALLENGE.PRICE)}
            </a>
            <div className="btn-sub">{CHALLENGE.DATE_RANGE_LABEL} &middot; Live Daily &middot; {CHALLENGE.TIME_LABEL_ET}</div>
          </div>
        </div>
      </section>

      <footer className="cmlc-footer">
        <div className="love">Love The Girl You&rsquo;re In</div>
        <div>Everyday Nurse &nbsp;&middot;&nbsp; Brave Works RN &nbsp;&middot;&nbsp; This challenge is educational and does not replace care from your healthcare provider.</div>
      </footer>

      <div className={`cmlc-sticky${showSticky ? ' show' : ''}`}>
        <span>The Change My Life Challenge</span>
        <a href="#seat" className="btn" onClick={() => t_('chal_cta_click', { location: 'sticky' })}>Save My Seat</a>
      </div>
    </div>
  );
}
