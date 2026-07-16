// /coaching (and /coaching-vip) — "Life Beyond the Numbers", the Be There
// 90-day program landing.
//
// 2026-07-16 v2: full sales page built from Annie's life-beyond-the-numbers
// design (Fraunces + night/teal/sage/clay palette, kept as a scoped
// sub-brand system). Ecosystem accuracy pass applied:
//   - Credibility aligned to the verified claim used everywhere else
//     (20 years, ICU & Emergency Medicine). The draft's "22+ years nursing /
//     12+ years coaching" is unverified and NOT used.
//   - The draft's testimonials section ("Real Women. Real Change." with
//     quotes labeled real experiences) is OMITTED: no verified quotes exist
//     for this program yet. Reinstate only with real, attributed quotes.
//   - The webinar video (Joel explaining the program) is on the page, per
//     Joel's spec that the coaching page is "a video that explains the
//     coaching and has an application."
//   - Every CTA routes to /apply (the 8-step prequalification wizard). The
//     wizard's thank-you screen now carries the welcome video + investment
//     reveal, so this page's "what happens after you apply" steps are true.
// No pricing on this page. Zero em/en dashes in visible copy.
//
// UI/UX: scroll-reveal animations (IntersectionObserver, staggered,
// disabled under prefers-reduced-motion), breathing hero pulse rings,
// sticky mobile apply bar, animated FAQ accordion, focus-visible states.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { track } from '../utils/analytics';

// ---- scroll-reveal ---------------------------------------------------------
function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const els = Array.from(document.querySelectorAll('.lbn [data-rv]'));
    const revealAll = () => els.forEach((el) => el.classList.add('rv-in'));
    // FAIL-OPEN: content visibility must never depend on the observer
    // delivering callbacks (some webviews throttle or drop them).
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll();
      return undefined;
    }
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        fired = true;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('rv-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    const fallback = setTimeout(() => {
      if (!fired) revealAll();
    }, 1800);
    return () => {
      clearTimeout(fallback);
      io.disconnect();
    };
  }, []);
}

// ---- content ---------------------------------------------------------------
const IMAGINE_LINES = [
  'Imagine checking your blood pressure without holding your breath first.',
  'Imagine falling asleep fast, not lying awake worried about your heart.',
  'Imagine eating the food you love, without the guilt.',
  'Imagine one hard day staying just one hard day, not turning into a hard month.',
  'Imagine traveling without counting pills or looking for the nearest hospital.',
];

const GAP_QUESTIONS = [
  'What do you cook when your family wants something different?',
  'What do you order when you eat out?',
  'What do you do when you are too tired to cook one more meal?',
  'How do you handle stress when it will not go away?',
  'How do you move your body when your knees hurt?',
  'How do you know if you are even checking your pressure the right way?',
  'How do you bounce back after one hard day?',
];

const MED_CANT = [
  'Shop for your food or cook your meals',
  'Help you fall asleep at night',
  'Move your body for you',
  'Carry your stress',
  'Remind you what to ask your doctor',
  'Help you start again after a hard day',
];

const METHOD_STEPS = [
  { letter: 'B', title: "You'll Know Where to Start", body: 'We look at your day: your meals, your sleep, your stress. So you stop guessing and start with a clear plan.' },
  { letter: 'E', title: "You'll See What's Really Going On", body: 'No shame, no judgment. Just an honest look at what is helping you and what is not.' },
  { letter: 'T', title: "You'll Build Habits That Actually Fit", body: 'Small changes that work with your real life: your family, your job, your week.' },
  { letter: 'H', title: "You'll Learn to Bounce Back Fast", body: 'One hard day will not feel like failure anymore. You will know how to start again, right away.' },
  { letter: 'E', title: "You'll Walk Into Appointments Ready", body: 'Real questions. Real answers. You will finally feel prepared, not anxious.' },
  { letter: 'R', title: "You'll Feel Confident Again", body: 'The cuff stops feeling scary. One hard reading will not erase your progress.' },
  { letter: 'E', title: "You'll Keep the Life You Built", body: 'A simple plan for after the 90 days, so you keep feeling good, for good.' },
];

const GAINS = [
  { h: "You'll know exactly where to start.", p: 'So you stop feeling lost, and start feeling in control.' },
  { h: "You'll feel calm about food again.", p: 'So eating stops feeling like a test you are failing.' },
  { h: "You'll have real support every week.", p: 'So you are never doing this by yourself.' },
  { h: "You'll sleep better and carry less stress.", p: 'So you wake up ready for your day, not dreading it.' },
  { h: "You'll move your body without dreading it.", p: 'So movement finally feels good, not like punishment.' },
  { h: "You'll understand your own numbers.", p: 'So the cuff stops feeling like a judge.' },
  { h: "You'll walk into the doctor's office ready.", p: 'So you leave with answers, not more worry.' },
  { h: "You'll have people cheering you on.", p: 'So you never feel alone in this, not even once.' },
  { h: "You'll have a plan for after the 90 days.", p: 'So you keep the life you built, for good.' },
];

const FOR_YES = [
  'You are over 40 and worried about your blood pressure',
  'You are tired of advice that does not fit your life',
  'You still see your doctor and plan to keep seeing them',
  'You are willing to try, track, and show up',
  'You want support, not more shame',
  'You are ready to stop putting yourself last',
  'You want to be there for more of your life',
];

const FOR_NO = [
  'You need emergency medical care',
  'You want someone other than your doctor to change your medicine',
  'You are not willing to work with your doctor',
  'You want a quick fix with no effort',
  'You want a guaranteed result',
];

const OBJECTIONS = [
  {
    q: '"I\'ve tried before, and it didn\'t stick."',
    a: 'That makes sense. Most plans fail because you are doing them alone, not because you lack willpower. This time, you will have real support.',
  },
  {
    q: '"What if this doesn\'t work for my life?"',
    a: 'Your plan is built around your real week: your family, your job, your knees, your budget. Not a made-up version of your life.',
  },
  {
    q: '"I don\'t know if I have time for this right now."',
    a: 'You do not start with everything. You start with one small step and build from there, with someone helping you go at your own pace.',
  },
];

const APPLY_HELPS = [
  "What's happening for you right now",
  "What you've already tried",
  'What you want your health to make possible',
  'Your relationship with your doctor',
  "If you're ready for real support",
];

const APPLY_STEPS = [
  'Fill out your application',
  'Watch a short welcome video from Joel',
  'See the full cost and payment options',
  "Decide if you're ready",
  'Get access to book your call',
];

const FAQS = [
  {
    q: 'Can this help lower my blood pressure?',
    a: 'This program helps you work on food, stress, sleep, and movement, the things that support healthy blood pressure. Everyone is different, and we cannot promise a specific result.',
  },
  {
    q: 'Will Joel tell me to stop my medicine?',
    a: 'No. Only your doctor can change your medicine. Joel will never tell you to stop taking it.',
  },
  {
    q: 'Is this the same as seeing a doctor?',
    a: 'No. This is coaching and support. It does not replace your doctor or any medical care you are already getting.',
  },
  {
    q: 'What if my blood pressure is very high right now?',
    a: 'Please get medical help right away. If you have chest pain, trouble breathing, sudden weakness, trouble speaking, or feel faint, call for emergency help now. Do not wait to apply.',
  },
  {
    q: "What if I've already tried and failed before?",
    a: 'This program is made for exactly that. You have started before. This time, you will not be doing it alone.',
  },
  {
    q: 'How much does it cost?',
    a: 'You will see the full cost after you apply and watch a short video from Joel. You will not be asked to book anything until you know the price.',
  },
  {
    q: 'Why do I have to apply first?',
    a: 'This program is not right for everyone. The application helps us make sure it is a good fit for you before we take your time, or ours.',
  },
  {
    q: 'Can I use HSA or FSA money?',
    a: 'Maybe. Please check with your plan first, every plan is different.',
  },
];

// ---- small components ------------------------------------------------------
function ApplyButton({ label, position, dark, onApply }) {
  return (
    <div className="lbn-btnwrap">
      <button type="button" className="lbn-btn" onClick={() => onApply(position)}>
        {label}
      </button>
      <span className={`lbn-btnsub${dark ? ' on-dark' : ''}`}>
        Takes 8 to 10 minutes · No payment required to apply
      </span>
    </div>
  );
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className={`lbn-faq-item${open ? ' open' : ''}`}>
      <button type="button" className="lbn-faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{item.q}</span>
        <span className="plus" aria-hidden="true">+</span>
      </button>
      <div className="lbn-faq-a" aria-hidden={!open}>
        <p>{item.a}</p>
      </div>
    </div>
  );
}

// ---- page ------------------------------------------------------------------
export default function BeThereLandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(-1);
  const [showBar, setShowBar] = useState(false);
  const heroRef = useRef(null);

  useReveal();

  useEffect(() => {
    track('bethere_landing_viewed', { version: 'lbn-v2' });
  }, []);

  // Sticky mobile apply bar: appears once the hero scrolls out of view.
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !heroRef.current) {
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);

  function handleApply(position) {
    track('bethere_apply_clicked', { position, version: 'lbn-v2' });
    navigate('/apply');
  }

  return (
    <main className="lbn">
      <style>{`
        .lbn{
          --bg:#FBF7F0; --bg-soft:#F2ECDD; --night:#1F3634; --night-soft:#2C4643;
          --lteal:#2E4A47; --teal-deep:#213735; --lsage:#8FA189; --sage-lt:#DCE3D3;
          --lclay:#BE7A57; --clay-lt:#EAD1BE; --lnk:#2B2A26; --lnk-soft:#665F54;
          --lcream:#FBF7F0; --lwhite:#FFFDF8;
          --serif:'Fraunces', Georgia, serif;
          --sans:'Inter', 'Public Sans', -apple-system, sans-serif;
          font-family:var(--sans); color:var(--lnk); background:var(--bg);
          line-height:1.65; font-size:18px; -webkit-font-smoothing:antialiased;
        }
        .lbn *{margin:0;padding:0;box-sizing:border-box;}
        .lbn .wrap{max-width:920px;margin:0 auto;padding:0 28px;}
        .lbn .wrap-narrow{max-width:740px;margin:0 auto;padding:0 28px;}
        .lbn h1,.lbn h2,.lbn h3{font-family:var(--serif);font-weight:500;line-height:1.15;color:var(--night);}
        .lbn .eyebrow{
          font-size:13px;letter-spacing:0.18em;text-transform:uppercase;
          color:var(--lclay);font-weight:600;margin-bottom:18px;display:block;
        }
        .lbn .center{text-align:center;}

        /* reveal-on-scroll */
        .lbn [data-rv]{opacity:0;transform:translateY(26px);transition:opacity .7s ease, transform .7s cubic-bezier(0.22,1,0.36,1);}
        .lbn [data-rv].rv-in{opacity:1;transform:none;}
        .lbn [data-rv-child].rv-in > *{opacity:0;transform:translateY(18px);animation:lbnUp .65s cubic-bezier(0.22,1,0.36,1) forwards;}
        .lbn [data-rv-child].rv-in > *:nth-child(1){animation-delay:.05s}
        .lbn [data-rv-child].rv-in > *:nth-child(2){animation-delay:.15s}
        .lbn [data-rv-child].rv-in > *:nth-child(3){animation-delay:.25s}
        .lbn [data-rv-child].rv-in > *:nth-child(4){animation-delay:.35s}
        .lbn [data-rv-child].rv-in > *:nth-child(5){animation-delay:.45s}
        .lbn [data-rv-child].rv-in > *:nth-child(6){animation-delay:.55s}
        .lbn [data-rv-child].rv-in > *:nth-child(7){animation-delay:.65s}
        .lbn [data-rv-child].rv-in > *:nth-child(8){animation-delay:.75s}
        .lbn [data-rv-child].rv-in > *:nth-child(9){animation-delay:.85s}
        @keyframes lbnUp{to{opacity:1;transform:none;}}

        .lbn .lbn-btnwrap{display:inline-block;text-align:center;}
        .lbn .lbn-btn{
          display:inline-block;background:var(--lteal);color:var(--lcream);
          font-family:var(--sans);font-weight:600;font-size:17px;
          padding:18px 38px;border-radius:100px;border:none;cursor:pointer;
          box-shadow:0 8px 24px rgba(46,74,71,0.25);letter-spacing:0.01em;
          transition:transform .25s ease, box-shadow .25s ease, background .25s ease;
        }
        .lbn .lbn-btn:hover{background:var(--lclay);transform:translateY(-2px);box-shadow:0 12px 28px rgba(190,122,87,0.3);}
        .lbn .lbn-btn:focus-visible{outline:3px solid var(--lclay);outline-offset:3px;}
        .lbn .lbn-btnsub{display:block;font-size:13px;color:var(--lnk-soft);margin-top:12px;}
        .lbn .lbn-btnsub.on-dark{color:#B7BEB8;}

        /* hero */
        .lbn .hero{position:relative;padding:96px 0 70px;overflow:hidden;text-align:center;}
        .lbn .hero-pulse{position:absolute;top:0;left:0;right:0;width:100%;opacity:0.5;pointer-events:none;}
        .lbn .pulse-ring{animation:lbnBreathe 6s ease-in-out infinite;transform-origin:500px 80px;}
        @keyframes lbnBreathe{0%,100%{opacity:0.35;transform:scale(1);}50%{opacity:0.6;transform:scale(1.04);}}
        .lbn .hero-content{position:relative;z-index:2;}
        .lbn .hero h1{font-size:clamp(44px,7vw,78px);letter-spacing:-0.01em;margin-bottom:22px;}
        .lbn .hero .tagline{font-family:var(--serif);font-style:italic;font-size:clamp(19px,2.4vw,24px);color:var(--lteal);max-width:600px;margin:0 auto 22px;}
        .lbn .hero .headline2{font-family:var(--serif);font-weight:500;font-size:clamp(22px,2.8vw,29px);color:var(--lteal);max-width:640px;margin:34px auto 22px;line-height:1.3;}
        .lbn .hero .without-line{font-family:var(--serif);font-style:italic;font-size:19px;color:var(--lteal);max-width:520px;margin:0 auto 40px;}
        .lbn .hero .disclaimer{font-size:13px;color:var(--lnk-soft);opacity:0.7;max-width:520px;margin:22px auto 0;}
        .lbn .hero-stage > *{opacity:0;transform:translateY(18px);animation:lbnUp .8s cubic-bezier(0.22,1,0.36,1) forwards;}
        .lbn .hero-stage > *:nth-child(1){animation-delay:.05s}
        .lbn .hero-stage > *:nth-child(2){animation-delay:.15s}
        .lbn .hero-stage > *:nth-child(3){animation-delay:.3s}
        .lbn .hero-stage > *:nth-child(4){animation-delay:.45s}
        .lbn .hero-stage > *:nth-child(5){animation-delay:.6s}
        .lbn .hero-stage > *:nth-child(6){animation-delay:.75s}
        .lbn .hero-stage > *:nth-child(7){animation-delay:.9s}

        /* imagine */
        .lbn .imagine{padding:96px 0 90px;text-align:center;}
        .lbn .imagine h2{font-size:clamp(30px,4.2vw,44px);max-width:680px;margin:0 auto 46px;line-height:1.2;}
        .lbn .imagine-lines{max-width:600px;margin:0 auto 50px;text-align:left;}
        .lbn .imagine-lines p{font-size:18.5px;color:var(--lnk);padding:18px 0 18px 26px;border-left:3px solid var(--sage-lt);margin-bottom:4px;}
        .lbn .imagine-lines p:nth-child(even){border-left-color:var(--clay-lt);}
        .lbn .imagine-brand{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3.2vw,32px);color:var(--lteal);margin:20px auto 50px;}
        .lbn .imagine-forwho{max-width:520px;margin:0 auto 50px;background:var(--lwhite);border:1px solid var(--sage-lt);border-radius:20px;padding:34px 30px;text-align:left;}
        .lbn .imagine-forwho .label{display:block;text-align:center;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--lclay);font-weight:600;margin-bottom:20px;}
        .lbn .imagine-forwho ul{list-style:none;}
        .lbn .imagine-forwho li{font-size:17px;color:var(--lnk);padding:10px 0 10px 30px;border-bottom:1px solid #EFE9DB;position:relative;}
        .lbn .imagine-forwho li:last-child{border-bottom:none;}
        .lbn .imagine-forwho li:before{content:"✓";position:absolute;left:0;color:var(--lsage);font-weight:700;}
        .lbn .imagine-transition{font-family:var(--serif);font-style:italic;font-size:clamp(20px,2.6vw,25px);color:var(--lteal);max-width:520px;margin:0 auto 60px;}
        .lbn .imagine-quote{font-family:var(--serif);font-weight:500;font-size:clamp(26px,4vw,38px);color:var(--night);max-width:560px;margin:0 auto 44px;line-height:1.25;padding:0 20px;}
        .lbn .imagine-closer{font-size:18px;color:var(--lnk-soft);max-width:600px;margin:0 auto;}
        .lbn .imagine-closer b{color:var(--lnk);font-weight:600;}

        /* gap */
        .lbn .gap{background:var(--bg-soft);padding:90px 0;}
        .lbn .gap .wrap-narrow{text-align:center;}
        .lbn .gap h2{font-size:clamp(26px,3.6vw,36px);margin:0 auto 20px;max-width:600px;}
        .lbn .gap .intro{color:var(--lnk-soft);font-size:18px;max-width:480px;margin:0 auto 30px;}
        .lbn .q-list{text-align:left;max-width:480px;margin:0 auto 34px;list-style:none;}
        .lbn .q-list li{font-size:16.5px;color:var(--lnk-soft);padding:9px 0 9px 26px;position:relative;}
        .lbn .q-list li:before{content:"?";position:absolute;left:0;color:var(--lclay);font-weight:700;}
        .lbn .gap .punch{font-family:var(--serif);font-style:italic;color:var(--lteal);font-size:20px;max-width:480px;margin:0 auto;}

        /* reveal */
        .lbn .reveal{background:var(--bg-soft);padding:90px 0;}
        .lbn .reveal.on-white{background:var(--lwhite);}
        .lbn .reveal .wrap-narrow{text-align:center;}
        .lbn .reveal h2{font-size:clamp(28px,4vw,38px);margin-bottom:24px;}
        .lbn .reveal p{font-size:18px;color:var(--lnk-soft);margin-bottom:18px;}
        .lbn .pill-line{font-family:var(--serif);font-style:italic;color:var(--lteal);font-size:20px;margin-top:28px;}
        .lbn .med-list{max-width:520px;margin:26px auto 0;text-align:left;list-style:none;}
        .lbn .med-list li{font-size:16px;color:var(--lnk-soft);padding:10px 0 10px 26px;border-bottom:1px solid #E7E1D4;position:relative;}
        .lbn .med-list li:before{content:"·";position:absolute;left:0;color:var(--lclay);font-weight:700;}
        .lbn .med-list li:last-child{border-bottom:none;}

        /* three things */
        .lbn .triangle{padding:96px 0 90px;text-align:center;}
        .lbn .triangle h2{font-size:clamp(30px,4vw,42px);margin-bottom:14px;}
        .lbn .triangle .lede{color:var(--lnk-soft);max-width:480px;margin:0 auto 54px;}
        .lbn .tri-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .lbn .tri-card{background:var(--lwhite);border-radius:20px;padding:36px 24px;border-top:4px solid var(--lsage);transition:transform .3s ease, box-shadow .3s ease;}
        .lbn .tri-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(31,54,52,0.08);}
        .lbn .tri-card:nth-child(2){border-top-color:var(--lclay);}
        .lbn .tri-card:nth-child(3){border-top-color:var(--lteal);}
        .lbn .tri-card .ic{width:52px;height:52px;margin:0 auto 18px;}
        .lbn .tri-card h3{font-size:22px;margin-bottom:10px;}
        .lbn .tri-card p{font-size:16px;color:var(--lnk-soft);}

        /* method */
        .lbn .method{background:var(--teal-deep);padding:96px 0;color:#EFE9DC;}
        .lbn .method .eyebrow{color:var(--clay-lt);}
        .lbn .method h2{color:#FBF7F0;font-size:clamp(30px,4vw,42px);margin-bottom:16px;}
        .lbn .method p.intro{color:#C9D3CE;max-width:480px;margin-bottom:56px;}
        .lbn .t-step{display:grid;grid-template-columns:64px 1fr;gap:22px;padding:22px 0;border-bottom:1px solid rgba(255,255,255,0.12);}
        .lbn .t-step:last-child{border-bottom:none;}
        .lbn .t-letter{font-family:var(--serif);font-size:30px;color:var(--clay-lt);font-style:italic;}
        .lbn .t-step h3{color:#FBF7F0;font-size:19px;margin-bottom:6px;font-family:var(--sans);font-weight:600;}
        .lbn .t-step p{color:#C9D3CE;font-size:16px;}

        /* joel + video */
        .lbn .joel{padding:96px 0 60px;}
        .lbn .joel-grid{display:grid;grid-template-columns:220px 1fr;gap:48px;align-items:center;}
        .lbn .joel-photo{width:220px;height:220px;border-radius:50%;object-fit:cover;border:4px solid var(--sage-lt);box-shadow:0 14px 34px rgba(31,54,52,0.15);}
        .lbn .joel h2{font-size:clamp(26px,3.4vw,34px);margin-bottom:6px;}
        .lbn .joel .role{color:var(--lclay);font-weight:600;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:20px;}
        .lbn .joel p{color:var(--lnk-soft);font-size:17px;margin-bottom:14px;}
        .lbn .joel .bold-line{font-family:var(--serif);font-style:italic;color:var(--lteal);font-size:19px;}
        .lbn .video-sec{padding:0 0 96px;text-align:center;}
        .lbn .video-sec h2{font-size:clamp(24px,3vw,30px);margin-bottom:26px;}
        .lbn .video-frame{position:relative;max-width:740px;margin:0 auto;padding-top:min(56.25%, 416px);border-radius:20px;overflow:hidden;background:#0d1716;box-shadow:0 24px 60px rgba(31,54,52,0.25);}
        .lbn .video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}

        /* included */
        .lbn .included{background:var(--bg-soft);padding:96px 0;}
        .lbn .included .center-head{text-align:center;margin-bottom:56px;}
        .lbn .included h2{font-size:clamp(30px,4vw,42px);}
        .lbn .included .center-head p{color:var(--lnk-soft);max-width:480px;margin:14px auto 0;}
        .lbn .inc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
        .lbn .inc-card{background:var(--lwhite);border-radius:16px;padding:26px 24px;display:flex;gap:16px;align-items:flex-start;transition:transform .3s ease, box-shadow .3s ease;}
        .lbn .inc-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(31,54,52,0.07);}
        .lbn .inc-dot{width:10px;height:10px;border-radius:50%;background:var(--lclay);margin-top:8px;flex-shrink:0;}
        .lbn .inc-card h3{font-size:18px;font-family:var(--sans);font-weight:600;margin-bottom:5px;color:var(--night);}
        .lbn .inc-card p{font-size:15px;color:var(--lnk-soft);}

        /* group */
        .lbn .group{padding:96px 0;}
        .lbn .group .wrap-narrow{text-align:center;}
        .lbn .group h2{font-size:clamp(28px,4vw,38px);margin-bottom:26px;}
        .lbn .group p{color:var(--lnk-soft);font-size:17px;margin-bottom:16px;text-align:left;}
        .lbn .group .note{font-size:14px;color:var(--lnk-soft);opacity:0.8;border-top:1px solid #D8CFBB;padding-top:22px;margin-top:26px;text-align:left;}

        /* for / not for */
        .lbn .forwho{background:var(--bg-soft);padding:96px 0;}
        .lbn .forwho h2{text-align:center;font-size:clamp(30px,4vw,42px);margin-bottom:54px;}
        .lbn .fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
        .lbn .fw-card{border-radius:20px;padding:34px 30px;}
        .lbn .fw-yes{background:var(--sage-lt);}
        .lbn .fw-no{background:var(--lwhite);border:1px solid #E7E1D4;}
        .lbn .fw-card h3{font-family:var(--sans);font-weight:700;font-size:16px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:18px;}
        .lbn .fw-yes h3{color:var(--lteal);}
        .lbn .fw-no h3{color:var(--lnk-soft);}
        .lbn .fw-card ul{list-style:none;}
        .lbn .fw-card li{font-size:16px;color:var(--lnk);margin-bottom:12px;padding-left:24px;position:relative;}
        .lbn .fw-yes li:before{content:"✓";position:absolute;left:0;color:var(--lteal);font-weight:700;}
        .lbn .fw-no li:before{content:"·";position:absolute;left:0;color:var(--lnk-soft);font-weight:700;}
        .lbn .fw-note{text-align:center;max-width:560px;margin:40px auto 0;color:var(--lnk-soft);font-size:15.5px;}

        /* objections */
        .lbn .objections{padding:96px 0;}
        .lbn .objections .center-head{text-align:center;margin-bottom:50px;}
        .lbn .objections h2{font-size:clamp(28px,4vw,38px);max-width:600px;margin:0 auto;}
        .lbn .obj-card{max-width:680px;margin:0 auto 22px;background:var(--lwhite);border-radius:18px;padding:28px 30px;border-left:4px solid var(--lclay);}
        .lbn .obj-card .q{font-family:var(--serif);font-style:italic;font-size:19px;color:var(--night);margin-bottom:10px;}
        .lbn .obj-card .a{font-size:16px;color:var(--lnk-soft);}
        .lbn .objections .truth{max-width:600px;margin:40px auto 0;text-align:center;font-size:17px;color:var(--lnk-soft);}
        .lbn .objections .truth b{color:var(--lteal);font-family:var(--serif);font-style:italic;font-weight:500;}

        /* apply */
        .lbn .apply-section{background:var(--night);color:#EFE9DC;padding:104px 0;text-align:center;}
        .lbn .apply-section .eyebrow{color:var(--clay-lt);}
        .lbn .apply-section h2{color:#FBF7F0;font-size:clamp(28px,4vw,40px);max-width:640px;margin:0 auto 24px;}
        .lbn .apply-section .lede{color:#D8D2C3;font-size:17px;max-width:520px;margin:0 auto 34px;}
        .lbn .apply-list{max-width:480px;margin:0 auto 40px;text-align:left;list-style:none;background:rgba(255,253,248,0.05);border:1px solid rgba(255,253,248,0.15);border-radius:18px;padding:28px 30px;}
        .lbn .apply-list li{font-size:15.5px;color:#D8D2C3;padding:8px 0 8px 24px;position:relative;}
        .lbn .apply-list li:before{content:"·";position:absolute;left:0;color:var(--clay-lt);font-weight:700;}
        .lbn .apply-steps{max-width:480px;margin:0 auto 40px;text-align:left;list-style:none;counter-reset:step;}
        .lbn .apply-steps li{counter-increment:step;font-size:15.5px;color:#D8D2C3;padding:10px 0 10px 34px;position:relative;border-bottom:1px solid rgba(255,253,248,0.12);}
        .lbn .apply-steps li:last-child{border-bottom:none;}
        .lbn .apply-steps li:before{content:counter(step);position:absolute;left:0;top:8px;width:20px;height:20px;border-radius:50%;background:var(--lclay);color:#1F3634;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;}
        .lbn .apply-section .note{font-size:15px;color:#C9D3CE;font-style:italic;margin-bottom:36px;}
        .lbn .apply-section .steps-lede{color:#D8D2C3;font-size:15px;margin-bottom:16px;}

        /* faq */
        .lbn .faq{padding:96px 0;}
        .lbn .faq h2{text-align:center;font-size:clamp(28px,3.6vw,38px);margin-bottom:50px;}
        .lbn .lbn-faq-item{border-bottom:1px solid #E7E1D4;}
        .lbn .lbn-faq-q{
          display:flex;justify-content:space-between;align-items:center;width:100%;
          cursor:pointer;font-family:var(--sans);font-weight:600;font-size:18px;
          color:var(--night);background:none;border:none;text-align:left;padding:22px 0;
        }
        .lbn .lbn-faq-q:focus-visible{outline:2px solid var(--lclay);outline-offset:2px;border-radius:6px;}
        .lbn .lbn-faq-q .plus{font-size:22px;color:var(--lclay);transition:transform .3s ease;flex-shrink:0;margin-left:20px;}
        .lbn .lbn-faq-item.open .plus{transform:rotate(45deg);}
        .lbn .lbn-faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease;color:var(--lnk-soft);font-size:16px;}
        .lbn .lbn-faq-item.open .lbn-faq-a{max-height:260px;}
        .lbn .lbn-faq-a p{padding:0 40px 22px 0;}

        /* final */
        .lbn .final{background:linear-gradient(180deg, var(--bg) 0%, var(--sage-lt) 100%);padding:104px 0 100px;text-align:center;}
        .lbn .final h2{font-size:clamp(28px,4vw,38px);margin-bottom:20px;}
        .lbn .final .bethere{font-size:clamp(34px,5vw,52px);margin:10px 0 30px;}
        .lbn .final p.sub{color:var(--lnk-soft);font-size:18px;max-width:480px;margin:0 auto 22px;}
        .lbn .final .ps{max-width:520px;margin:50px auto 0;font-size:15px;color:var(--lnk-soft);text-align:left;border-top:1px solid #D8CFBB;padding-top:30px;}
        .lbn .final .ps b{color:var(--lnk);}
        .lbn .final .disclaimer{font-size:13px;color:var(--lnk-soft);opacity:0.75;max-width:480px;margin:30px auto 0;}
        .lbn .final .disclaimer a{color:var(--lnk-soft);}

        /* footer */
        .lbn .site-footer{background:var(--night-soft);padding:44px 0;text-align:center;}
        .lbn .site-footer p{font-size:12.5px;color:#B7BEB8;max-width:720px;margin:0 auto 14px;line-height:1.6;}
        .lbn .site-footer p:last-child{margin-bottom:0;}

        /* header + sticky bar */
        .lbn .topbrand{display:flex;justify-content:center;align-items:center;gap:10px;padding:18px 16px 0;font-size:14px;color:var(--lnk-soft);}
        .lbn .topbrand b{font-family:var(--serif);color:var(--night);font-weight:600;}
        .lbn .topbrand .dot{width:7px;height:7px;border-radius:50%;background:var(--lclay);}
        .lbn .stickybar{
          position:fixed;left:0;right:0;bottom:0;z-index:60;display:none;
          background:rgba(31,54,52,0.97);backdrop-filter:blur(8px);
          padding:12px 16px calc(12px + env(safe-area-inset-bottom));
          transform:translateY(110%);transition:transform .4s cubic-bezier(0.22,1,0.36,1);
          box-shadow:0 -8px 30px rgba(31,54,52,0.3);
        }
        .lbn .stickybar.show{transform:translateY(0);}
        .lbn .stickybar button{
          display:block;width:100%;max-width:520px;margin:0 auto;
          background:var(--lclay);color:#FFF8EF;font-family:var(--sans);font-weight:700;
          font-size:16px;padding:14px 20px;border-radius:100px;border:none;cursor:pointer;
        }

        @media(max-width:720px){
          .lbn{font-size:17px;}
          .lbn .tri-grid,.lbn .inc-grid,.lbn .fw-grid{grid-template-columns:1fr;}
          .lbn .joel-grid{grid-template-columns:1fr;text-align:center;}
          .lbn .joel-photo{margin:0 auto;}
          .lbn .hero{padding:64px 0 50px;}
          .lbn .imagine,.lbn .gap,.lbn .reveal,.lbn .triangle,.lbn .method,.lbn .joel,.lbn .included,.lbn .group,.lbn .forwho,.lbn .objections,.lbn .apply-section,.lbn .faq,.lbn .final{padding-top:64px;padding-bottom:64px;}
          .lbn .video-sec{padding-bottom:64px;}
          .lbn .stickybar{display:block;}
        }
        @media(prefers-reduced-motion: reduce){
          .lbn *{animation:none !important;transition:none !important;}
          .lbn [data-rv],.lbn .hero-stage > *,.lbn [data-rv-child].rv-in > *{opacity:1 !important;transform:none !important;}
        }
      `}</style>

      {/* ===== minimal brand row ===== */}
      <div className="topbrand">
        <span className="dot" aria-hidden="true" />
        <b>BraveWorks RN</b>
        <span>· Life Beyond the Numbers</span>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero" ref={heroRef}>
        <svg className="hero-pulse" viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
          <circle className="pulse-ring" cx="500" cy="80" r="40" fill="none" stroke="#BE7A57" strokeWidth="1" />
          <circle className="pulse-ring" cx="500" cy="80" r="90" fill="none" stroke="#8FA189" strokeWidth="1" style={{ animationDelay: '1s' }} />
          <circle className="pulse-ring" cx="500" cy="80" r="150" fill="none" stroke="#DCE3D3" strokeWidth="1" style={{ animationDelay: '2s' }} />
        </svg>
        <div className="wrap hero-content hero-stage">
          <span className="eyebrow">For Women Over 40</span>
          <h1>Life Beyond<br />the Numbers</h1>
          <p className="tagline">Get your health back. Get your confidence back. Get your life back.</p>
          <p className="headline2">
            What if you could live life beyond the numbers? Beyond waking up at 2:13 a.m. staring
            at the ceiling, panicking. Beyond the ER runs. Beyond the moments your chest is
            pounding before you have even done anything.
          </p>
          <p className="without-line">
            Without giving up the foods you love. Without hours at a gym you do not have time for.
            Without doing it alone.
          </p>
          <ApplyButton label="Start My Application" position="hero" onApply={handleApply} />
          <p className="disclaimer">
            This is coaching, not medical treatment. Keep taking your medicine unless your doctor
            tells you to stop.
          </p>
        </div>
      </section>

      {/* ===== IMAGINE ===== */}
      <section className="imagine">
        <div className="wrap">
          <h2 data-rv>Imagine What Could Be Different</h2>
          <div className="imagine-lines" data-rv data-rv-child>
            {IMAGINE_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="imagine-brand" data-rv>
            This is Life Beyond the Numbers<sup style={{ fontSize: '0.4em' }}>™</sup>
          </p>
          <div className="imagine-forwho" data-rv>
            <span className="label">This Is For You If</span>
            <ul>
              <li>You want to feel good again</li>
              <li>You want to be there for her wedding</li>
              <li>You want to hold the next grandbaby</li>
              <li>You want to enjoy your best days</li>
            </ul>
          </div>
          <p className="imagine-transition" data-rv>You want to be there. We want to help you get there.</p>
          <p className="imagine-quote" data-rv>Your health is the only thing you truly own.</p>
          <p className="imagine-closer" data-rv>
            Picture yourself <b>in</b> the pictures. At the wedding. At graduation. On the cruise.
            At the birthday dinner. Laughing at the cookout. Even an ordinary Tuesday, full of
            energy, ready for whatever comes next.
          </p>
        </div>
      </section>

      {/* ===== GAP ===== */}
      <section className="gap">
        <div className="wrap-narrow">
          <h2 data-rv>&ldquo;Watch Your Salt&rdquo; Is Not a Plan.</h2>
          <p className="intro" data-rv>
            You probably already know some of what you are supposed to do. That is not the
            problem. The problem is doing it in real life.
          </p>
          <ul className="q-list" data-rv data-rv-child>
            {GAP_QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <p className="intro" style={{ marginBottom: 6 }} data-rv>A list is not a plan.</p>
          <p className="punch" data-rv>
            You do not need more warnings. You need help turning what you know into what you
            actually do.
          </p>
        </div>
      </section>

      {/* ===== REVEAL ===== */}
      <section className="reveal on-white" style={{ background: 'var(--bg)' }}>
        <div className="wrap-narrow" data-rv>
          <h2>Your Number Is Not Your Future.</h2>
          <p>
            High blood pressure does not mean you did something wrong. It does not mean this is
            how your story ends, even if it runs in your family.
          </p>
          <p className="pill-line">That is why this program exists.</p>
        </div>
      </section>

      <section className="reveal on-white">
        <div className="wrap-narrow" data-rv>
          <h2 style={{ fontSize: 'clamp(24px,3vw,30px)', marginBottom: 20 }}>
            Your Medicine Helps. It Can&rsquo;t Do Everything.
          </h2>
          <p style={{ textAlign: 'left', maxWidth: 520, margin: '0 auto 8px' }}>
            This is not against medicine, and it is not against doctors. It is about the rest of
            your life, the part medicine cannot touch. Your medicine cannot:
          </p>
          <ul className="med-list">
            {MED_CANT.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="pill-line">
            Medicine is one part of your care. It was never meant to be the whole plan.
          </p>
        </div>
      </section>

      {/* ===== THREE THINGS ===== */}
      <section className="triangle">
        <div className="wrap">
          <span className="eyebrow" data-rv>What Actually Helps</span>
          <h2 data-rv>You Don&rsquo;t Need a Diagnosis. You Need to Feel Well.</h2>
          <p className="lede" data-rv>
            You do not need more medical words. You need to understand the three everyday things
            that affect how you feel.
          </p>
          <div className="tri-grid" data-rv data-rv-child>
            <div className="tri-card">
              <svg className="ic" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#8FA189" strokeWidth="2" />
                <path d="M14 30 L20 22 L26 32 L32 18 L38 26" fill="none" stroke="#8FA189" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Your Stress</h3>
              <p>The weight you carry every day. The sleep you keep missing. It never really turns off.</p>
            </div>
            <div className="tri-card">
              <svg className="ic" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#BE7A57" strokeWidth="2" />
                <path d="M26 14 L26 38 M17 20 L35 20 M17 32 L35 32" stroke="#BE7A57" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3>Your Food</h3>
              <p>Not just dessert. It is in your drinks, your sauces, and your favorite snacks too.</p>
            </div>
            <div className="tri-card">
              <svg className="ic" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#2E4A47" strokeWidth="2" />
                <path d="M16 34 C16 22, 36 22, 36 34" fill="none" stroke="#2E4A47" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="34" r="2.5" fill="#2E4A47" />
                <circle cx="36" cy="34" r="2.5" fill="#2E4A47" />
              </svg>
              <h3>Your Habits</h3>
              <p>How you move, sleep, and take care of yourself, day after day.</p>
            </div>
          </div>
          <p className="pill-line" style={{ maxWidth: 560, margin: '40px auto 0' }} data-rv>
            When these three things get easier, you feel better. That is really all this is about.
          </p>
        </div>
      </section>

      {/* ===== BE THERE METHOD ===== */}
      <section className="method">
        <div className="wrap">
          <span className="eyebrow" data-rv>Your Path Forward</span>
          <h2 data-rv>Here&rsquo;s How You Get There</h2>
          <p className="intro" data-rv>
            Seven simple steps. Not so you are perfect for 90 days, but so you build a life that
            still works on the hard days.
          </p>
          <div className="timeline" data-rv data-rv-child>
            {METHOD_STEPS.map((s, i) => (
              <div className="t-step" key={`${s.letter}-${i}`}>
                <div className="t-letter">{s.letter}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MEET JOEL ===== */}
      <section className="joel">
        <div className="wrap joel-grid" data-rv>
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img className="joel-photo" src="/headshot.jpg" alt="Joel Polley, RN" width="220" height="220" loading="lazy" />
          </picture>
          <div>
            <span className="eyebrow">Your Guide</span>
            <h2>Meet Joel Polley, RN</h2>
            <div className="role">20 Years a Nurse · ICU &amp; Emergency Medicine · Works Alongside Your Doctor</div>
            <p>
              Joel spent 20 years as a nurse, most of them in the ICU and the ER. He has seen
              what happens when high blood pressure goes on too long. And he has seen women
              told what to change, but never shown how.
            </p>
            <p>So he built a way to help. One that fits your real life, not a perfect one.</p>
            <p>
              He will not replace your doctor. He will not tell you to stop your medicine. He will
              help with everything that happens between your appointments:
            </p>
            <p className="bold-line">your actual life.</p>
            <div style={{ marginTop: 26 }}>
              <ApplyButton label="I'm Ready to Be There" position="joel" onApply={handleApply} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO ===== */}
      <section className="video-sec">
        <div className="wrap" data-rv>
          <h2>Hear It From Joel</h2>
          <div className="video-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/UdJvWCvUKww"
              title="Joel Polley, RN explains the Be There program"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU'LL GAIN ===== */}
      <section className="included">
        <div className="wrap">
          <div className="center-head" data-rv>
            <span className="eyebrow center" style={{ display: 'block' }}>What You&rsquo;ll Walk Away With</span>
            <h2>What You&rsquo;ll Gain</h2>
            <p>This is not a list of features. It is what you get, every single week.</p>
          </div>
          <div className="inc-grid" data-rv data-rv-child>
            {GAINS.map((g) => (
              <div className="inc-card" key={g.h}>
                <div className="inc-dot" />
                <div>
                  <h3>{g.h}</h3>
                  <p>{g.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY GROUP ===== */}
      <section className="group">
        <div className="wrap-narrow" data-rv>
          <h2>You Are Not the Only One</h2>
          <p>You will not be lost in a crowd. You will be with other women going through the same things.</p>
          <p>
            Someone will ask the question you were too embarrassed to ask. Someone will talk about
            cooking for a family that will not eat the same way. Someone will admit she had a hard
            week, and you will hear her get back up, without shame. And you will think: that is me
            too.
          </p>
          <p>
            You will pick up ideas you never thought of. You will feel less alone. And you will
            finally know that other women feel exactly what you feel.
          </p>
          <p className="note">
            Your private health details stay between you and your doctor. The group is for support
            and encouragement, not medical advice.
          </p>
        </div>
      </section>

      {/* ===== FOR / NOT FOR ===== */}
      <section className="forwho">
        <div className="wrap">
          <h2 data-rv>Is This Right for You?</h2>
          <div className="fw-grid" data-rv>
            <div className="fw-card fw-yes">
              <h3>Yes, If</h3>
              <ul>
                {FOR_YES.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
            <div className="fw-card fw-no">
              <h3>Not Right Now, If</h3>
              <ul>
                {FOR_NO.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="fw-note" data-rv>
            There is no shame if the timing is not right. This just helps make sure it is a good
            fit for you.
          </p>
        </div>
      </section>

      {/* ===== OBJECTIONS ===== */}
      <section className="objections">
        <div className="wrap-narrow">
          <div className="center-head" data-rv>
            <span className="eyebrow center" style={{ display: 'block' }}>Before You Apply</span>
            <h2>Let&rsquo;s Talk About What You&rsquo;re Thinking.</h2>
          </div>
          <div data-rv data-rv-child>
            {OBJECTIONS.map((o) => (
              <div className="obj-card" key={o.q}>
                <p className="q">{o.q}</p>
                <p className="a">{o.a}</p>
              </div>
            ))}
          </div>
          <p className="truth" data-rv>
            Here is the truth:{' '}
            <b>asking for help is not what holds women back. Waiting until it is an emergency is.</b>{' '}
            Asking now, before things get worse, is not weakness. It is smart.
          </p>
        </div>
      </section>

      {/* ===== APPLY ===== */}
      <section className="apply-section" id="apply">
        <div className="wrap-narrow">
          <span className="eyebrow" data-rv>Why We Start With an Application</span>
          <h2 data-rv>This is personal. You deserve more than a form before a real conversation.</h2>
          <p className="lede" data-rv>Your application helps us understand:</p>
          <ul className="apply-list" data-rv data-rv-child>
            {APPLY_HELPS.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ul>
          <p className="note" data-rv>
            This is not a free doctor visit. It is a short talk to see if this is the right fit,
            and by then, you will already know the cost.
          </p>
          <p className="steps-lede" data-rv>Here is what happens after you apply:</p>
          <ol className="apply-steps" data-rv data-rv-child>
            {APPLY_STEPS.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ol>
          <div data-rv>
            <ApplyButton label="Begin My Application" position="apply_section" dark onApply={handleApply} />
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="faq">
        <div className="wrap-narrow">
          <h2 data-rv>A Few Questions</h2>
          <div data-rv>
            {FAQS.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openFaq === i}
                onToggle={() => {
                  setOpenFaq(openFaq === i ? -1 : i);
                  if (openFaq !== i) track('bethere_faq_opened', { question: item.q });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL ===== */}
      <section className="final">
        <div className="wrap-narrow">
          <span className="eyebrow center" style={{ display: 'block' }} data-rv>One Last Thing</span>
          <h2 data-rv>The Number Matters. But Your Life Matters More.</h2>
          <p className="sub" data-rv>
            Behind that reading is a woman with places to go and people to love. You are not doing
            this to obsess over a number. You are doing this to stop letting that number run your
            life.
          </p>
          <p className="sub" data-rv>Get your health back. Get your confidence back. Get your life back.</p>
          <h2 className="bethere" data-rv>Be There.</h2>
          <div data-rv>
            <ApplyButton label="I'm Ready to Be There" position="final" onApply={handleApply} />
          </div>
          <div className="ps" data-rv>
            <p>
              <b>P.S.</b> You do not need to have this figured out before you apply. You just need
              to be done bracing yourself every time the cuff tightens. If that feels familiar, it
              is time to stop guessing. The application takes about ten minutes. What it protects
              is worth so much more.
            </p>
          </div>
          <p className="disclaimer" data-rv>
            Results are different for everyone. This program does not replace your doctor. See our{' '}
            <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <p>
          Life Beyond the Numbers is health education and coaching. It is not medical treatment,
          and it does not replace your doctor. Joining this program does not make Joel Polley or
          BraveWorks RN your doctor. Keep following your own doctor&rsquo;s advice. Never stop or
          change your medicine unless your doctor tells you to.
        </p>
        <p>
          Results are different for everyone. We cannot promise a specific blood pressure reading,
          medical result, or change in medicine.
        </p>
        <p>
          If you have chest pain, trouble breathing, fainting, sudden weakness, drooping on one
          side of your face, trouble speaking, confusion, or sudden vision changes, call for
          emergency help right away.
        </p>
      </footer>

      {/* ===== STICKY MOBILE CTA ===== */}
      <div className={`stickybar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <button type="button" onClick={() => handleApply('sticky_bar')} tabIndex={showBar ? 0 : -1}>
          Start My Application · Free
        </button>
      </div>
    </main>
  );
}
