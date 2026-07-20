// /coaching (and /coaching-vip) — "Life Beyond the Numbers", the Be There
// 90-day program landing.
//
// 2026-07-17 v3: full rebuild on Annie's high-converting sales-page draft
// (Life-Beyond-the-Numbers-Sales-Page.html) at Joel's direction: her section
// order, her copy, her two-column editorial layout, plus her explicit design
// notes (big bold BE THERE tease with a gap before the breakdown, gold
// accents, visual panels, contrast tables, big serif band lines).
//
// Ecosystem-accuracy rules preserved from v2 (do NOT regress these):
//   - Credibility stays the verified claim: 20 years RN, ICU & Emergency
//     Medicine. Annie's draft's "22+ years nursing / 12+ years coaching" is
//     unverified and NOT used.
//   - Testimonials section OMITTED until real attributed quotes exist
//     (Joel-approved decision; draft only had placeholder screenshots).
//   - Every CTA routes to /apply (the prequalification wizard). The wizard's
//     thank-you screen carries the welcome video + investment reveal, so the
//     "what happens after you apply" steps on this page stay true.
//   - No pricing on this page. Zero em/en dashes in visible copy (draft copy
//     adapted to periods/commas). Compliance footer + hero disclaimer kept.
//   - Image slots render as branded visual panels (no "PLACEHOLDER" text on
//     a live page); swap in real photography when Annie supplies it.
//
// UI/UX: scroll-reveal (IntersectionObserver, fail-open), pulse hero rings,
// sticky mobile apply bar, animated FAQ accordion, reduced-motion safe.

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { track } from '../utils/analytics';

// ---- scroll-reveal ---------------------------------------------------------
function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const els = Array.from(document.querySelectorAll('.lbn [data-rv]'));
    const pending = new Set(els);
    const reveal = (el) => {
      el.classList.add('rv-in');
      pending.delete(el);
    };
    const revealAll = () => pending.forEach((el) => reveal(el));
    // FAIL-OPEN: content visibility must never depend on the observer
    // delivering callbacks.
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealAll();
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    // Safety net for webviews that throttle or drop IO callbacks AFTER the
    // initial delivery (the old `fired` flag was defeated by that initial
    // delivery and never actually protected below-fold content): on every
    // scroll/resize, rAF-throttled, reveal any still-hidden element whose
    // rect is inside the viewport. Cheap (Set shrinks to zero) and keeps the
    // staggered reveal effect intact in healthy browsers.
    let rafId = 0;
    const sweep = () => {
      rafId = 0;
      if (!pending.size) return;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) reveal(el);
      });
    };
    const onScroll = () => {
      if (!rafId && pending.size) rafId = requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    sweep();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
    };
  }, []);
}

// ---- content ---------------------------------------------------------------
const PAYOFFS = [
  {
    label: 'So You Can Be There',
    h: 'For the people who still need your laugh, your voice, and your seat at the table.',
    p: 'For the wedding. The graduation. The new grandbaby. The birthday dinner. The cookout. The ordinary Tuesday no one knows will become a memory.',
  },
  {
    label: 'So You Can Go',
    h: 'Book the trip without planning the whole vacation around what might go wrong.',
    p: 'Walk through the airport. Get on the cruise. Visit the children. Say yes to the weekend away, and feel like your life is still yours.',
  },
  {
    label: 'So You Can Show Up',
    h: 'Bring your full self back to your business, your purpose, and the work you still want to do.',
    p: 'Stop hiding because you feel tired, worried, or unlike yourself. Turn the camera on. Lead the room. Make plans beyond the next scare.',
  },
  {
    label: 'So You Can Feel Like You Again',
    h: 'Wake up with more energy, more trust in yourself, and less fear of your own body.',
    p: 'Enjoy your food without guilt. Move without punishment. Look in the mirror and see a woman rebuilding, not waiting for something bad to happen.',
  },
];

const ROOT_LIST = [
  'Years of stress that never truly turned off.',
  'Food choices built around survival, convenience, family, and habit.',
  'Sleep that keeps getting pushed to the bottom of the list.',
  'Plans so strict that one hard day made the whole thing collapse.',
];

const NOT_LIST = [
  'Another miracle pill or supplement stack.',
  'A detox you suffer through and never repeat.',
  'A list of forbidden foods that makes family meals miserable.',
  'Hours of exercise that punish your knees and your schedule.',
  'A perfect plan that only works during a perfect week.',
];

const IS_LIST = [
  'Simple shifts you can repeat.',
  'Food that still feels like food.',
  'Movement that meets you where you are.',
  'Stress and sleep changes that work in a real home.',
  'A way to bounce back before one hard day becomes one hard month.',
];

const TRIANGLE_CARDS = [
  {
    h: 'Pressure',
    p: 'The weight you carry. The people you care for. The worries you keep swallowing. The sleep your mind keeps interrupting.',
    so: 'So you can feel calmer in your body instead of living on alert.',
  },
  {
    h: 'Plate',
    p: 'The salt, sugar, drinks, sauces, portions, and everyday food patterns that add up quietly. Not because you are careless, but because nobody showed you a realistic way through.',
    so: 'So you can enjoy food and still feel proud of how you are caring for yourself.',
  },
  {
    h: 'Pattern',
    p: 'The way you sleep, move, monitor, recover, restart, and keep promises to yourself when life gets busy.',
    so: 'So healthy stops being something you visit and becomes the way you live.',
  },
];

// Approved, permission-granted testimonials ONLY. Source of truth:
// bpquiz-site/docs/testimonials.md. Every entry must have documented consent
// and carries "Results not typical." NEVER add a quote here without a matching
// GRANTED entry in that ledger. Joel's additional client wins get appended as
// he confirms permission for each.
const TESTIMONIALS = [
  {
    quote: 'My blood pressure is back to normal, 124/80. Reduced salt, started little exercises. I had a trigger that elevated it, and since then things have got back to normal.',
    name: 'BraveWorks reader',
    note: 'Shared with permission · results not typical',
  },
];

const METHOD_STEPS = [
  { letter: 'B', title: 'Build Your Baseline', body: 'See what your days really look like, without shame, so you stop trying to fix everything and know where to begin.' },
  { letter: 'E', title: 'Examine Your Inputs', body: 'Find the stress, food, sleep, and routine patterns that keep pulling you backward.', strong: 'Clarity replaces guessing.' },
  { letter: 'T', title: 'Transform the Small Things', body: 'Make simple shifts that work with your family, your budget, your body, and your week.', strong: 'Small enough to start. Strong enough to matter.' },
  { letter: 'H', title: 'Hold the Pattern', body: 'Learn how to keep going when motivation leaves, and how to restart fast when life gets messy.' },
  { letter: 'E', title: 'Equip Yourself', body: 'Understand your patterns, track what matters, and stop walking through your health feeling confused and powerless.' },
  { letter: 'R', title: 'Reclaim Your Confidence', body: 'Stop treating every reading, meal, or hard day like a verdict. Begin seeing yourself as a woman who knows how to care for herself.' },
  { letter: 'E', title: 'Extend the Life You Love', body: 'Build your travel plan, holiday plan, hard-week plan, and life-after-the-program plan, so this becomes your new normal.' },
];

const POSSIBILITIES = [
  { h: 'At Night', p: 'You settle down without the whole house feeling the fear in the room.' },
  { h: 'At the Table', p: 'You eat food you enjoy, make smarter choices, and do not feel punished.' },
  { h: 'On the Trip', p: 'You are present in the moment instead of scanning for everything that could go wrong.' },
  { h: 'In Your Business', p: 'You bring your energy back to the work, purpose, and people that still need your voice.' },
  { h: 'In the Mirror', p: 'You see a woman taking her life back, not waiting to be rescued by the next shortcut.' },
  { h: 'With Your Family', p: 'Your children see you making strong, steady choices instead of living from scare to scare.' },
];

// INCLUDED (offer stack) removed 2026-07-17 per Joel; the program is revealed
// on the fit call, not itemized on the page.

const FOR_YES = [
  'To wake up and feel like your body is working with you again.',
  'To check the cuff without letting it control the rest of your day.',
  'To take the trip, grow the business, attend the wedding, and hold the grandbaby.',
  'To enjoy food without fear and move without punishment.',
  'To give your children a different picture of what getting older can look like.',
  'To become present in your life and powerful in your choices.',
  'To look ahead and feel excited, not afraid.',
];

const FOR_NO = [
  'One miracle pill, tea, powder, or supplement to do all the work.',
  'A toxic shortcut that asks nothing of you and changes nothing for long.',
  'A punishment plan built on bland food and exhausting workouts.',
  'A one-week burst followed by another month of starting over.',
  'Someone else to care more about your life than you are ready to.',
];

const APPLY_STEPS = [
  'Complete the qualification questions',
  'Receive calendar access if the program looks like a fit',
  'Talk with Joel about your case and everything the program involves',
  'Use the call to make a clear decision',
];

const FAQS = [
  {
    q: 'What if I already know what I should be doing?',
    a: 'Knowing is not the same as having a plan that survives work, family, stress, travel, and hard weeks. This is about turning what you know into what you live.',
  },
  {
    q: 'What if I have tried before and could not stay consistent?',
    a: 'This was built for the woman who has started, stopped, restarted, and blamed herself. You begin with support, simpler shifts, and a plan for how to bounce back.',
  },
  {
    q: 'Will I have to give up all the food I love?',
    a: 'No. A plan you hate is a plan you will leave. You will learn how to make smarter choices and still enjoy eating like a real person with a real family and a real life.',
  },
  {
    q: 'Do I have to exercise for hours?',
    a: 'No. The goal is not to punish your body. It is to build movement you can repeat at your current starting point and grow from there.',
  },
  {
    q: 'Will Joel tell me to stop my medicine?',
    a: 'No. Only your doctor can change your medicine. Joel will never tell you to stop taking it.',
  },
  {
    q: 'What if my blood pressure is very high right now?',
    a: 'Please get medical help right away. If you have chest pain, trouble breathing, sudden weakness, trouble speaking, or feel faint, call for emergency help now. Do not wait to apply.',
  },
  {
    q: 'Why do I have to apply?',
    a: 'Because this is personal work and it is not the right fit for every woman. The application helps both sides see whether your goals, readiness, and desired support match the experience.',
  },
  {
    q: 'When will I see the investment?',
    a: 'On your call with Joel. If your application looks like a fit, you receive calendar access, and Joel goes over everything the program involves, including the investment and payment options, so you can make a clear decision together.',
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

function GoldDivider() {
  return (
    <div className="gold-divider" aria-hidden="true">
      <span className="line" /><span className="dot" /><span className="line" />
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
    track('bethere_landing_viewed', { version: 'lbn-v3-annie' });
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
    track('bethere_apply_clicked', { position, version: 'lbn-v3-annie' });
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
          --gold:#C9A44C; --gold-soft:#EFE1BC; --gold-deep:#9C7B2E;
          --serif:'Fraunces', Georgia, serif;
          --sans:'Inter', 'Public Sans', -apple-system, sans-serif;
          font-family:var(--sans); color:var(--lnk); background:var(--bg);
          line-height:1.65; font-size:18px; -webkit-font-smoothing:antialiased;
        }
        .lbn *{margin:0;padding:0;box-sizing:border-box;}
        .lbn .wrap{max-width:980px;margin:0 auto;padding:0 28px;}
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

        /* gold divider */
        .lbn .gold-divider{display:flex;align-items:center;justify-content:center;gap:14px;max-width:220px;margin:0 auto;padding:40px 0;}
        .lbn .gold-divider .line{height:1px;flex:1;background:linear-gradient(90deg, transparent, var(--gold), transparent);}
        .lbn .gold-divider .dot{width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;}

        /* branded visual panels (real photography swaps in here later) */
        .lbn .vpanel{
          min-height:400px;display:flex;flex-direction:column;align-items:center;justify-content:center;
          text-align:center;padding:38px;border-radius:26px;
          background:linear-gradient(150deg, rgba(143,161,137,.34), rgba(234,209,190,.7));
          border:1px solid rgba(201,164,76,.35);
          box-shadow:0 20px 55px rgba(31,54,52,.12);
          font-family:var(--serif);font-style:italic;color:var(--lteal);
        }
        .lbn .vpanel .big{font-size:clamp(24px,3vw,32px);line-height:1.3;max-width:320px;}
        .lbn .vpanel.dark{
          background:linear-gradient(150deg,#2B403E,#172826);
          color:#EFE9DC;border-color:rgba(201,164,76,.4);box-shadow:none;min-height:460px;
        }
        .lbn .vpanel .clock{font-size:clamp(52px,7vw,84px);font-weight:600;color:var(--gold);font-style:normal;letter-spacing:0.02em;line-height:1;}
        .lbn .vpanel .clock-sub{margin-top:14px;font-size:17px;color:#C9D3CE;max-width:280px;}
        .lbn .vpanel svg{margin-bottom:22px;}
        .lbn .vpanel.photo{padding:0;position:relative;overflow:hidden;}
        .lbn .vpanel.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block;}
        .lbn .final-banner{display:block;width:100%;border-radius:22px;margin:0 0 50px;box-shadow:0 18px 44px rgba(31,54,52,.18);border:1px solid rgba(201,164,76,.35);}
        .lbn .apply-banner{display:block;width:100%;border-radius:18px;margin:0 0 44px;border:1px solid rgba(201,164,76,.4);}

        /* hero */
        .lbn .hero{position:relative;padding:84px 0 76px;overflow:hidden;}
        .lbn .hero-pulse{position:absolute;top:0;left:0;right:0;width:100%;opacity:0.45;pointer-events:none;}
        .lbn .pulse-ring{animation:lbnBreathe 6s ease-in-out infinite;transform-origin:500px 80px;}
        @keyframes lbnBreathe{0%,100%{opacity:0.35;transform:scale(1);}50%{opacity:0.6;transform:scale(1.04);}}
        .lbn .hero-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:56px;align-items:center;position:relative;z-index:2;}
        .lbn .hero h1{font-size:clamp(42px,6.4vw,72px);letter-spacing:-0.01em;margin-bottom:20px;}
        .lbn .hero .tagline{font-family:var(--serif);font-style:italic;font-size:clamp(21px,2.6vw,28px);color:var(--lteal);margin:0 0 22px;}
        .lbn .hero p.sub{font-size:18.5px;color:var(--lnk-soft);max-width:640px;margin:0 0 18px;}
        .lbn .hero .headline2{font-family:var(--serif);font-weight:500;font-size:clamp(21px,2.6vw,27px);color:var(--lteal);max-width:650px;margin:26px 0 30px;line-height:1.35;}
        .lbn .hero .disclaimer{font-size:13px;color:var(--lnk-soft);opacity:0.7;max-width:520px;margin:22px 0 0;}
        .lbn .hero-stage > *{opacity:0;transform:translateY(18px);animation:lbnUp .8s cubic-bezier(0.22,1,0.36,1) forwards;}
        .lbn .hero-stage > *:nth-child(1){animation-delay:.05s}
        .lbn .hero-stage > *:nth-child(2){animation-delay:.15s}
        .lbn .hero-stage > *:nth-child(3){animation-delay:.3s}
        .lbn .hero-stage > *:nth-child(4){animation-delay:.45s}
        .lbn .hero-stage > *:nth-child(5){animation-delay:.6s}
        .lbn .hero-stage > *:nth-child(6){animation-delay:.75s}
        .lbn .hero-stage > *:nth-child(7){animation-delay:.9s}

        /* night */
        .lbn .night{background:var(--night);color:#EFE9DC;padding:96px 0;}
        .lbn .night-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:center;}
        .lbn .night .eyebrow{color:var(--gold);}
        .lbn .night h2{color:#FBF7F0;font-size:clamp(30px,4vw,42px);margin-bottom:30px;}
        .lbn .night .lines p{font-size:18.5px;color:#D8D2C3;margin:0 0 15px;}
        .lbn .night .closer{font-family:var(--serif);font-style:italic;font-size:22px;color:#EFC9A9;margin-top:30px;}

        /* turn band */
        .lbn .turn-band{padding:70px 0;background:var(--clay-lt);text-align:center;position:relative;}
        .lbn .turn-band:before,.lbn .turn-band:after{
          content:"";position:absolute;left:50%;transform:translateX(-50%);
          width:160px;height:1px;background:linear-gradient(90deg,transparent,var(--gold-deep),transparent);
        }
        .lbn .turn-band:before{top:34px;}
        .lbn .turn-band:after{bottom:34px;}
        .lbn .turn-band p{font-family:var(--serif);font-size:clamp(26px,3.8vw,42px);line-height:1.22;color:var(--night);max-width:880px;margin:0 auto;}

        /* desire / payoffs */
        .lbn .desire{padding:100px 0 90px;text-align:center;}
        .lbn .desire h2{font-size:clamp(30px,4vw,42px);margin-bottom:14px;}
        .lbn .desire .sub{color:var(--lnk-soft);font-size:18px;max-width:520px;margin:0 auto 50px;}
        .lbn .payoff-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px;max-width:880px;margin:0 auto;}
        .lbn .payoff-card{
          background:var(--lwhite);border:1px solid var(--sage-lt);border-radius:20px;
          padding:30px;text-align:left;box-shadow:0 12px 32px rgba(31,54,52,.07);
          border-top:3px solid var(--gold);
          transition:transform .3s ease, box-shadow .3s ease;
        }
        .lbn .payoff-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(31,54,52,.11);}
        .lbn .payoff-card:nth-child(2),.lbn .payoff-card:nth-child(3){background:var(--sage-lt);}
        .lbn .payoff-card .label{display:block;margin-bottom:10px;color:var(--gold-deep);font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;}
        .lbn .payoff-card h3{font-size:23px;margin-bottom:12px;}
        .lbn .payoff-card p{font-size:16px;color:var(--lnk-soft);}
        .lbn .desire .quote{
          font-family:var(--serif);font-weight:500;font-size:clamp(25px,3.6vw,36px);
          color:var(--night);max-width:600px;margin:58px auto 44px;line-height:1.28;
        }

        /* root cause (dark) */
        .lbn .root{background:var(--teal-deep);padding:96px 0;color:#EFE9DC;}
        .lbn .root-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;}
        .lbn .root .eyebrow{color:var(--gold);}
        .lbn .root h2{color:#FBF7F0;font-size:clamp(28px,4vw,40px);margin-bottom:20px;}
        .lbn .root p.intro{color:#C9D3CE;font-size:17.5px;margin-bottom:16px;}
        .lbn .root-list{list-style:none;margin-top:24px;}
        .lbn .root-list li{position:relative;padding:15px 17px 15px 48px;margin-bottom:12px;border:1px solid rgba(201,164,76,.3);border-radius:15px;color:#EDF0EC;font-size:16.5px;}
        .lbn .root-list li:before{content:'✓';position:absolute;left:18px;top:14px;color:var(--gold);font-weight:700;}
        .lbn .root .no-shame{font-family:var(--serif);font-style:italic;font-size:22px;color:var(--gold-soft);margin-top:28px;}

        /* contrast */
        .lbn .contrast{background:var(--lwhite);padding:96px 0;}
        .lbn .contrast .head{text-align:center;max-width:810px;margin:0 auto;}
        .lbn .contrast h2{font-size:clamp(28px,4vw,38px);margin-bottom:24px;}
        .lbn .contrast .pill-line{font-family:var(--serif);font-style:italic;color:var(--lteal);font-size:20px;margin-top:8px;}
        .lbn .contrast-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:920px;margin:44px auto 0;}
        .lbn .contrast-card{padding:32px;border-radius:22px;}
        .lbn .contrast-no{background:#F5E7DE;border:1px solid #E9C8B5;}
        .lbn .contrast-yes{background:var(--sage-lt);border:1px solid #C6D5BE;}
        .lbn .contrast-card h3{font-family:var(--sans);font-weight:700;font-size:16px;letter-spacing:0.04em;text-transform:uppercase;}
        .lbn .contrast-no h3{color:#A95A43;}
        .lbn .contrast-yes h3{color:var(--lteal);}
        .lbn .contrast-card ul{list-style:none;margin-top:18px;}
        .lbn .contrast-card li{position:relative;padding-left:29px;margin-bottom:12px;font-size:16px;}
        .lbn .contrast-no li:before{content:'×';position:absolute;left:0;color:#A95A43;font-weight:700;}
        .lbn .contrast-yes li:before{content:'✓';position:absolute;left:0;color:var(--lteal);font-weight:700;}

        /* triangle */
        .lbn .triangle{padding:96px 0 90px;text-align:center;}
        .lbn .triangle h2{font-size:clamp(30px,4vw,42px);margin-bottom:14px;}
        .lbn .triangle .lede{color:var(--lnk-soft);max-width:480px;margin:0 auto 54px;}
        .lbn .tri-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .lbn .tri-card{background:var(--lwhite);border-radius:20px;padding:36px 24px;border-top:4px solid var(--lsage);transition:transform .3s ease, box-shadow .3s ease;text-align:left;}
        .lbn .tri-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(31,54,52,0.08);}
        .lbn .tri-card:nth-child(2){border-top-color:var(--lclay);}
        .lbn .tri-card:nth-child(3){border-top-color:var(--gold);}
        .lbn .tri-card h3{font-size:24px;margin-bottom:10px;}
        .lbn .tri-card p{font-size:16px;color:var(--lnk-soft);}
        .lbn .tri-card .so-that{margin-top:18px;color:var(--lteal);font-weight:700;font-size:15.5px;}

        /* BE THERE tease */
        .lbn .tease{background:var(--night);padding:88px 0 56px;text-align:center;overflow:hidden;}
        .lbn .tease .eyebrow{color:var(--gold);}
        .lbn .tease h2{color:#EFE9DC;font-size:clamp(22px,3vw,30px);font-weight:400;max-width:640px;margin:0 auto 6px;line-height:1.4;}
        .lbn .tease .gap-line{height:26px;}
        .lbn .tease .bethere-big{
          font-family:var(--serif);font-weight:600;font-style:italic;
          font-size:clamp(58px,13vw,148px);line-height:0.92;letter-spacing:-0.01em;
          color:var(--gold);
          background:linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 45%, var(--gold-deep) 100%);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
          margin:8px 0 18px;
        }
        .lbn .tease .sub{color:#C9D3CE;font-size:18px;max-width:520px;margin:0 auto;}

        /* method breakdown */
        .lbn .method{background:var(--teal-deep);padding:60px 0 96px;color:#EFE9DC;}
        .lbn .method .eyebrow{color:var(--clay-lt);}
        .lbn .method h2{color:#FBF7F0;font-size:clamp(28px,4vw,40px);margin-bottom:16px;}
        .lbn .method p.intro{color:#C9D3CE;max-width:520px;margin-bottom:56px;}
        .lbn .t-step{display:grid;grid-template-columns:64px 1fr;gap:22px;padding:22px 0;border-bottom:1px solid rgba(255,255,255,0.12);}
        .lbn .t-step:last-child{border-bottom:none;}
        .lbn .t-letter{
          font-family:var(--serif);font-size:34px;font-weight:600;font-style:italic;
          color:var(--gold);text-shadow:0 0 18px rgba(201,164,76,0.35);
        }
        .lbn .t-step h3{color:#FBF7F0;font-size:19px;margin-bottom:6px;font-family:var(--sans);font-weight:600;}
        .lbn .t-step p{color:#C9D3CE;font-size:16px;}
        .lbn .t-step p strong{color:#FFF;}

        /* joel */
        .lbn .joel{padding:96px 0;}
        .lbn .joel-grid{display:grid;grid-template-columns:260px 1fr;gap:52px;align-items:center;}
        .lbn .joel-photo{width:260px;height:260px;border-radius:26px;object-fit:cover;border:1px solid rgba(201,164,76,.45);box-shadow:0 18px 44px rgba(31,54,52,0.16);}
        .lbn .joel h2{font-size:clamp(26px,3.4vw,34px);margin-bottom:6px;}
        .lbn .joel .role{color:var(--gold-deep);font-weight:600;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:20px;}
        .lbn .joel p{color:var(--lnk-soft);font-size:17px;margin-bottom:14px;}
        .lbn .joel .bold-line{font-family:var(--serif);font-style:italic;color:var(--lteal);font-size:19px;}

        /* possibility */
        .lbn .possible{background:var(--sage-lt);padding:96px 0;}
        .lbn .possible .center-head{text-align:center;margin-bottom:52px;}
        .lbn .possible h2{font-size:clamp(30px,4vw,42px);}
        .lbn .possible .center-head p{color:var(--lnk-soft);max-width:480px;margin:14px auto 0;}
        .lbn .possibility-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:940px;margin:0 auto;}
        .lbn .possibility-card{background:rgba(255,253,248,.9);border:1px solid rgba(46,74,71,.1);border-left:3px solid var(--gold);border-radius:18px;padding:26px;text-align:left;}
        .lbn .possibility-card h3{font-size:21px;margin-bottom:8px;}
        .lbn .possibility-card p{font-size:15.5px;color:var(--lnk-soft);}

        /* included / offer stack */
        .lbn .included{background:var(--lwhite);padding:96px 0;}
        .lbn .included .center-head{text-align:center;margin-bottom:56px;}
        .lbn .included h2{font-size:clamp(30px,4vw,42px);}
        .lbn .included .center-head p{color:var(--lnk-soft);max-width:520px;margin:14px auto 0;}
        .lbn .inc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
        .lbn .inc-card{background:var(--bg);border:1px solid var(--sage-lt);border-radius:16px;padding:26px 24px;display:flex;gap:16px;align-items:flex-start;transition:transform .3s ease, box-shadow .3s ease;}
        .lbn .inc-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(31,54,52,0.07);}
        .lbn .inc-dot{width:10px;height:10px;border-radius:50%;background:var(--gold);margin-top:8px;flex-shrink:0;}
        .lbn .inc-card h3{font-size:18px;font-family:var(--sans);font-weight:600;margin-bottom:5px;color:var(--night);}
        .lbn .inc-card p{font-size:15px;color:var(--lnk-soft);}
        .lbn .inc-card .offer-payoff{color:var(--lteal);font-weight:700;margin-top:10px;}

        /* group */
        .lbn .group{background:var(--bg-soft);padding:96px 0;}
        .lbn .group-grid{display:grid;grid-template-columns:1.06fr .94fr;gap:52px;align-items:center;}
        .lbn .group h2{font-size:clamp(28px,4vw,38px);margin-bottom:26px;}
        .lbn .group p{color:var(--lnk-soft);font-size:17px;margin-bottom:16px;}
        .lbn .group .exact{font-family:var(--serif);font-style:italic;font-size:23px;color:var(--lteal);}
        .lbn .group .note{font-size:14px;color:var(--lnk-soft);opacity:0.8;border-top:1px solid #D8CFBB;padding-top:22px;margin-top:26px;}

        /* for / not for */
        .lbn .forwho{padding:96px 0;}
        .lbn .forwho h2{text-align:center;font-size:clamp(28px,4vw,40px);margin-bottom:54px;}
        .lbn .fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
        .lbn .fw-card{border-radius:20px;padding:34px 30px;}
        .lbn .fw-yes{background:var(--sage-lt);border-top:3px solid var(--gold);}
        .lbn .fw-no{background:var(--lwhite);border:1px solid #E7E1D4;}
        .lbn .fw-card h3{font-family:var(--sans);font-weight:700;font-size:16px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:18px;}
        .lbn .fw-yes h3{color:var(--lteal);}
        .lbn .fw-no h3{color:var(--lnk-soft);}
        .lbn .fw-card ul{list-style:none;}
        .lbn .fw-card li{font-size:16px;color:var(--lnk);margin-bottom:12px;padding-left:24px;position:relative;}
        .lbn .fw-yes li:before{content:"✓";position:absolute;left:0;color:var(--lteal);font-weight:700;}
        .lbn .fw-no li:before{content:"·";position:absolute;left:0;color:var(--lnk-soft);font-weight:700;}

        /* apply */
        .lbn .apply-section{background:var(--night);color:#EFE9DC;padding:104px 0;text-align:center;}
        .lbn .apply-section .eyebrow{color:var(--gold);}
        .lbn .apply-section h2{color:#FBF7F0;font-size:clamp(28px,4vw,40px);max-width:640px;margin:0 auto 24px;}
        .lbn .apply-section .lede{color:#D8D2C3;font-size:17px;max-width:520px;margin:0 auto 34px;}
        .lbn .apply-steps{max-width:480px;margin:0 auto 40px;text-align:left;list-style:none;counter-reset:step;}
        .lbn .apply-steps li{counter-increment:step;font-size:15.5px;color:#D8D2C3;padding:11px 0 11px 38px;position:relative;border-bottom:1px solid rgba(255,253,248,0.12);}
        .lbn .apply-steps li:last-child{border-bottom:none;}
        .lbn .apply-steps li:before{content:counter(step);position:absolute;left:0;top:9px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:#1F3634;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;}
        .lbn .apply-section .note{font-size:15px;color:#C9D3CE;font-style:italic;margin-bottom:36px;max-width:480px;margin-left:auto;margin-right:auto;}
        .lbn .apply-section .lbn-btn{background:var(--lclay);}
        .lbn .apply-section .lbn-btn:hover{background:var(--gold-deep);}

        /* trust bar (hero social proof) */
        .lbn .trust-bar{display:flex;align-items:center;gap:20px;margin-top:22px;flex-wrap:wrap;}
        .lbn .trust-stat{display:flex;flex-direction:column;line-height:1.15;}
        .lbn .trust-stat .tnum{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:26px;color:var(--gold-deep);}
        .lbn .trust-stat .tlbl{font-size:12.5px;color:var(--lnk-soft);letter-spacing:.01em;}
        .lbn .trust-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);opacity:.5;}
        /* testimonials */
        .lbn .wins{padding:92px 0;background:linear-gradient(180deg,#FBF9F4,#F6F2E9);}
        .lbn .wins .eyebrow,.lbn .wins h2{text-align:center;}
        .lbn .wins h2{font-size:clamp(26px,3.4vw,36px);margin:6px auto 44px;max-width:760px;}
        .lbn .wins-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px;max-width:960px;margin:0 auto;}
        .lbn .win-card{position:relative;background:#fff;border:1px solid rgba(46,74,71,.09);border-top:3px solid var(--gold);border-radius:18px;padding:34px 28px 26px;box-shadow:0 10px 30px rgba(70,60,35,.06);}
        .lbn .win-mark{position:absolute;top:8px;left:20px;font-family:'Fraunces',Georgia,serif;font-size:64px;line-height:1;color:var(--gold);opacity:.35;}
        .lbn .win-card blockquote{margin:0 0 18px;font-size:17px;line-height:1.6;color:var(--lnk);position:relative;z-index:1;}
        .lbn .win-card figcaption{display:flex;flex-direction:column;border-top:1px solid #EEE7D8;padding-top:12px;}
        .lbn .win-name{font-weight:600;color:var(--lnk);font-size:14.5px;}
        .lbn .win-note{font-size:12px;color:var(--lnk-soft);font-style:italic;}
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
        .lbn .lbn-faq-q .plus{font-size:22px;color:var(--gold-deep);transition:transform .3s ease;flex-shrink:0;margin-left:20px;}
        .lbn .lbn-faq-item.open .plus{transform:rotate(45deg);}
        .lbn .lbn-faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease;color:var(--lnk-soft);font-size:16px;}
        .lbn .lbn-faq-item.open .lbn-faq-a{max-height:640px;}
        .lbn .lbn-faq-a p{padding:0 40px 22px 0;}

        /* final */
        .lbn .final{background:linear-gradient(180deg, var(--bg) 0%, var(--sage-lt) 100%);padding:104px 0 100px;text-align:center;}
        .lbn .final .eyebrow{color:var(--gold-deep);}
        .lbn .final h2{font-size:clamp(28px,4vw,40px);margin-bottom:20px;}
        .lbn .final .brand-lines{font-family:var(--serif);font-style:italic;font-size:clamp(22px,3vw,30px);color:var(--lteal);margin:30px auto 36px;line-height:1.45;}
        .lbn .final .bethere{
          font-family:var(--serif);font-weight:600;font-style:italic;
          font-size:clamp(44px,8vw,84px);margin:10px 0 34px;
          background:linear-gradient(180deg, var(--gold-deep) 0%, var(--gold) 60%, var(--gold-deep) 100%);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        .lbn .final p.sub{color:var(--lnk-soft);font-size:18px;max-width:520px;margin:0 auto 22px;}
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
        .lbn .topbrand .dot{width:7px;height:7px;border-radius:50%;background:var(--gold);}
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

        @media(max-width:840px){
          .lbn{font-size:17px;}
          .lbn .hero-grid,.lbn .night-grid,.lbn .root-grid,.lbn .group-grid{grid-template-columns:1fr;}
          .lbn .payoff-grid,.lbn .contrast-grid,.lbn .fw-grid,.lbn .inc-grid{grid-template-columns:1fr;}
          .lbn .tri-grid,.lbn .possibility-grid{grid-template-columns:1fr;}
          .lbn .joel-grid{grid-template-columns:1fr;text-align:center;}
          .lbn .joel-photo{margin:0 auto;}
          .lbn .vpanel{min-height:280px;}
          .lbn .hero{padding:60px 0 50px;}
          .lbn .night,.lbn .desire,.lbn .root,.lbn .contrast,.lbn .triangle,.lbn .method,.lbn .joel,.lbn .possible,.lbn .included,.lbn .group,.lbn .forwho,.lbn .apply-section,.lbn .faq,.lbn .final{padding-top:64px;padding-bottom:64px;}
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
          <circle className="pulse-ring" cx="500" cy="80" r="40" fill="none" stroke="#C9A44C" strokeWidth="1" />
          <circle className="pulse-ring" cx="500" cy="80" r="90" fill="none" stroke="#8FA189" strokeWidth="1" style={{ animationDelay: '1s' }} />
          <circle className="pulse-ring" cx="500" cy="80" r="150" fill="none" stroke="#DCE3D3" strokeWidth="1" style={{ animationDelay: '2s' }} />
        </svg>
        <div className="wrap hero-grid">
          <div className="hero-stage">
            <span className="eyebrow">For Women Over 40 Who Are Done Letting the Cuff Run Their Life</span>
            <h1>Your Blood-Pressure Reading Is Not Your Future.</h1>
            <p className="tagline">Reclaim your health. Reclaim your confidence. Reclaim your life. Fully.</p>
            <p className="sub">
              You are not looking for one more warning, one more pill to add, one more food to
              fear, or one more plan you cannot keep.
            </p>
            <p className="sub">
              You want to understand what keeps pulling your health in the wrong direction, and
              make simple shifts you can still live with next month, next year, and on the days
              life gets hard.
            </p>
            <p className="headline2">
              Life Beyond the Numbers&trade; is a 90-day root-cause wellness coaching experience
              that helps you get underneath the stress, food patterns, sleep, movement, and daily
              habits that keep pulling you backward. So you can feel stronger, steadier, and free
              to live your life again.
            </p>
            <ApplyButton label="Apply to Work With Joel" position="hero" onApply={handleApply} />
            <div className="trust-bar" data-rv>
              <div className="trust-stat"><span className="tnum">550,000+</span><span className="tlbl">following Joel across platforms</span></div>
              <div className="trust-dot" aria-hidden="true" />
              <div className="trust-stat"><span className="tnum">1,300+</span><span className="tlbl">women inside the community</span></div>
            </div>
            <p className="disclaimer">
              This is coaching, not medical treatment. Keep taking your medicine unless your
              doctor tells you to stop.
            </p>
          </div>
          <div className="vpanel photo">
            <img src="/coaching/hero-joel.jpg" alt="Joel Polley, RN, walking a sunlit stone path" loading="eager" />
          </div>
        </div>
      </section>

      {/* ===== 3 A.M. ===== */}
      <section className="night">
        <div className="wrap night-grid">
          <div className="vpanel dark" data-rv aria-hidden="true">
            <p className="clock">3:07 a.m.</p>
            <p className="clock-sub">The house is quiet. The cuff is on the nightstand. Again.</p>
          </div>
          <div data-rv>
            <span className="eyebrow">The Thought She Does Not Say Out Loud</span>
            <h2>It Is 3:07 A.M. And You Are Checking It Again.</h2>
            <div className="lines">
              <p>The house is quiet.</p>
              <p>You wrap the cuff around your arm because maybe the first number was wrong.</p>
              <p>You tell yourself not to panic.</p>
              <p>
                Then the number appears, and your mind jumps straight to your mother. Your aunt.
                Your grandmother. The family member who &ldquo;had pressure&rdquo; until something
                happened.
              </p>
              <p>
                You are wondering whether your children are going to see that frightened look on
                your face again. Whether another bad night will become another rushed trip.
                Whether this is slowly becoming the story of your life.
              </p>
            </div>
            <p className="closer">
              &ldquo;I do not want my family living scared that something is about to happen to
              me.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ===== TURN BAND ===== */}
      <section className="turn-band">
        <div className="wrap" data-rv>
          <p>
            That fear is not the end of this story. It is the moment you stop waiting for another
            scare and start rebuilding the life you want to stay here for.
          </p>
        </div>
      </section>

      {/* ===== DESIRE / PAYOFFS ===== */}
      <section className="desire">
        <div className="wrap">
          <span className="eyebrow" data-rv>The Payoff Behind the Payoff</span>
          <h2 data-rv>You Want the Numbers to Change Because You Want Your Life Back.</h2>
          <p className="sub" data-rv>
            Not a smaller life built around fear. A fuller life built around what still matters
            to you.
          </p>
          <div className="payoff-grid" data-rv data-rv-child>
            {PAYOFFS.map((c) => (
              <div className="payoff-card" key={c.label}>
                <span className="label">{c.label}</span>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
          <p className="quote" data-rv>
            You are not trying to become obsessed with a better number. You are trying to become
            the woman who can make plans again.
          </p>
          <div data-rv>
            <ApplyButton label="I Want My Life Back" position="desire" onApply={handleApply} />
          </div>
        </div>
      </section>

      {/* ===== ROOT CAUSE ===== */}
      <section className="root">
        <div className="wrap root-grid">
          <div data-rv>
            <span className="eyebrow">Your Body Is Not Betraying You</span>
            <h2>There Is a Reason You Keep Getting Pulled Backward.</h2>
            <p className="intro">
              You are not lazy. You are not weak. You are not failing because you could not live
              on bland food, force yourself through painful workouts, or stay perfect while
              carrying everyone else.
            </p>
            <p className="intro">Your body has been responding to what it has been asked to carry.</p>
            <ul className="root-list">
              {ROOT_LIST.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
            <p className="no-shame">
              You do not need more shame. You need to change the inputs in a way your real life
              can hold.
            </p>
          </div>
          <div className="vpanel photo" data-rv>
            <img src="/coaching/home-joel.jpg" alt="Joel Polley, RN, at home" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ===== CONTRAST ===== */}
      <section className="contrast">
        <div className="wrap">
          <div className="head" data-rv>
            <span className="eyebrow center" style={{ display: 'block' }}>A Different Kind of Wellness Plan</span>
            <h2>You Do Not Have to Hate Your Life to Change Your Health.</h2>
            <p className="pill-line">
              No hamster-wheel exercise. No joyless plate. No toxic shortcut that leaves you right
              back where you started.
            </p>
          </div>
          <div className="contrast-grid" data-rv>
            <div className="contrast-card contrast-no">
              <h3>This Is Not&hellip;</h3>
              <ul>
                {NOT_LIST.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
            <div className="contrast-card contrast-yes">
              <h3>This Is&hellip;</h3>
              <ul>
                {IS_LIST.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ===== BP TRIANGLE ===== */}
      <section className="triangle">
        <div className="wrap">
          <span className="eyebrow" data-rv>The BP Triangle</span>
          <h2 data-rv>Three Places We Look Before We Blame You.</h2>
          <p className="lede" data-rv>Because a number does not happen in a vacuum. It sits inside a life.</p>
          <div className="tri-grid" data-rv data-rv-child>
            {TRIANGLE_CARDS.map((c) => (
              <div className="tri-card" key={c.h}>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
                <p className="so-that">{c.so}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BE THERE TEASE ===== */}
      <section className="tease">
        <div className="wrap" data-rv>
          <span className="eyebrow">The BE THERE Method</span>
          <h2>Seven steps from &ldquo;I know better&rdquo; to &ldquo;this is how I live now.&rdquo; So you can&hellip;</h2>
          <div className="gap-line" aria-hidden="true" />
          <p className="bethere-big">BE THERE.</p>
          <p className="sub">Here is exactly what each letter means.</p>
        </div>
      </section>

      {/* ===== METHOD BREAKDOWN ===== */}
      <section className="method">
        <div className="wrap">
          <span className="eyebrow" data-rv>The Breakdown</span>
          <h2 data-rv>Rebuilding Trust With Yourself, One Repeatable Shift at a Time.</h2>
          <p className="intro" data-rv>This is not about doing everything overnight.</p>
          <div className="timeline" data-rv data-rv-child>
            {METHOD_STEPS.map((s, i) => (
              <div className="t-step" key={`${s.letter}-${i}`}>
                <div className="t-letter">{s.letter}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>
                    {s.body}
                    {s.strong ? <> <strong>{s.strong}</strong></> : null}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {/* Renders ONLY real, permission-granted wins from docs/testimonials.md.
          Empty array -> section is skipped, never a "coming soon" placeholder,
          never an invented quote. Grows as Joel confirms consent for more. */}
      {TESTIMONIALS.length > 0 && (
        <section className="wins">
          <div className="wrap">
            <span className="eyebrow" data-rv>In Their Words</span>
            <h2 data-rv>Women Who Stopped Letting the Number Run the Room.</h2>
            <div className="wins-grid" data-rv data-rv-child>
              {TESTIMONIALS.map((t, i) => (
                <figure className="win-card" key={i}>
                  <div className="win-mark" aria-hidden="true">&ldquo;</div>
                  <blockquote>{t.quote}</blockquote>
                  <figcaption>
                    <span className="win-name">{t.name}</span>
                    <span className="win-note">{t.note}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MEET JOEL ===== */}
      <section className="joel">
        <div className="wrap joel-grid" data-rv>
          <img className="joel-photo" src="/coaching/joel-scrubs.jpg" alt="Joel Polley, RN, in navy scrubs with a stethoscope" width="260" height="260" loading="lazy" />
          <div>
            <span className="eyebrow">Your Guide</span>
            <h2>Joel Has Seen What Happens When People Wait Too Long.</h2>
            <div className="role">20 Years as a Registered Nurse · ICU &amp; Emergency Medicine</div>
            <p>Joel has worked on the crisis side of health.</p>
            <p>
              He has seen the frightened family. The rushed decisions. The moment everyone wishes
              they had paid attention earlier.
            </p>
            <p>But he has also seen the quieter problem.</p>
            <p>
              Women leave with instructions, but no one walks into their kitchen, their schedule,
              their stress, their family habits, or the hard week that knocks the whole plan down.
            </p>
            <p className="bold-line">
              Joel helps you work on the life behind the number. That is where the real change has
              to live.
            </p>
            <div style={{ marginTop: 26 }}>
              <ApplyButton label="Apply to Work With Joel" position="joel" onApply={handleApply} />
            </div>
          </div>
        </div>
      </section>

      {/* Video removed 2026-07-17 per Joel (landing page AND the /apply
          thank-you screen). No welcome video anywhere in the coaching funnel. */}

      {/* ===== WHAT STARTS TO FEEL POSSIBLE ===== */}
      <section className="possible">
        <div className="wrap">
          <div className="center-head" data-rv>
            <span className="eyebrow center" style={{ display: 'block' }}>What Starts to Feel Possible</span>
            <h2>A Life Where Health Does Not Take Over Every Room.</h2>
            <p>You are still living. Still building. Still becoming. Your plan should make room for that.</p>
          </div>
          <div className="possibility-grid" data-rv data-rv-child>
            {POSSIBILITIES.map((c) => (
              <div className="possibility-card" key={c.h}>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer stack section removed 2026-07-17 per Joel. The program is
          revealed on the fit call, not itemized on the page. */}

      {/* ===== WHY GROUP ===== */}
      <section className="group">
        <div className="wrap group-grid">
          <div data-rv>
            <span className="eyebrow">Why Group Coaching Works</span>
            <h2>Another Woman Will Ask the Question You Did Not Know You Needed Answered.</h2>
            <p>Someone will talk about cooking for a family that does not want to change.</p>
            <p>Someone else will ask what to do when she travels.</p>
            <p>
              Another woman will admit she had a hard week and disappeared, and you will hear Joel
              help her stand back up without shame.
            </p>
            <p className="exact">&ldquo;That is exactly what I do.&rdquo;</p>
            <p>
              You gain more real-life questions, more examples, more ways to learn, and more women
              reminding you that you are not doing this alone.
            </p>
            <p className="note">
              Your private health details stay between you and your doctor. The group is for
              support and encouragement, not medical advice.
            </p>
          </div>
          {/* Visual panel: swap for real group photography (sisterhood,
              dignity, forward movement) when supplied. */}
          <div className="vpanel" data-rv aria-hidden="true">
            <svg width="96" height="56" viewBox="0 0 96 56" fill="none">
              <circle cx="24" cy="22" r="11" stroke="#C9A44C" strokeWidth="2" fill="none" />
              <circle cx="48" cy="16" r="11" stroke="#C9A44C" strokeWidth="2" fill="none" />
              <circle cx="72" cy="22" r="11" stroke="#C9A44C" strokeWidth="2" fill="none" />
              <path d="M10 52 C18 38, 30 38, 38 48 M34 46 C42 32, 54 32, 62 46 M58 48 C66 38, 78 38, 86 52" stroke="#C9A44C" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <p className="big">You will not be doing this alone.</p>
          </div>
        </div>
      </section>

      {/* Testimonials intentionally omitted until real, attributed quotes
          exist (draft only carried placeholder screenshots). */}

      {/* ===== FOR / NOT FOR ===== */}
      <section className="forwho">
        <div className="wrap">
          <h2 data-rv>This Is for the Woman Who Can Still See the Life She Wants.</h2>
          <div className="fw-grid" data-rv>
            <div className="fw-card fw-yes">
              <h3>This Is for You If Your Wildest Dream Is&hellip;</h3>
              <ul>
                {FOR_YES.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
            <div className="fw-card fw-no">
              <h3>This Is Not for You If You Want&hellip;</h3>
              <ul>
                {FOR_NO.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ===== APPLY ===== */}
      <section className="apply-section" id="apply">
        <div className="wrap-narrow">
          {/* Brand banner: dark green + gold artwork sits naturally on this
              dark section, right above the application ask. */}
          <img
            className="apply-banner"
            data-rv
            src="/coaching/banner-lbn.jpg"
            alt="Life Beyond the Numbers. Joel Polley, BraveWorks RN. Get your life back."
            loading="lazy"
          />
          <span className="eyebrow" data-rv>The Next Step</span>
          <h2 data-rv>Apply to Work With Joel.</h2>
          <p className="lede" data-rv>
            You do not have to have everything figured out. You only have to be ready to stop
            pretending another warning will change what support can change.
          </p>
          <ol className="apply-steps" data-rv data-rv-child>
            {APPLY_STEPS.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ol>
          <p className="note" data-rv>
            Answer honestly. This is not about impressing Joel. It is about seeing whether the
            program fits the woman you are ready to become.
          </p>
          <div data-rv>
            <ApplyButton label="Begin My Application" position="apply_section" dark onApply={handleApply} />
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="faq">
        <div className="wrap-narrow">
          <h2 data-rv>What You May Be Wondering</h2>
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
          {/* The closing visual is the point of the whole page: in the
              picture with the family, not watching from the side. */}
          <img
            className="final-banner"
            data-rv
            src="/coaching/family-joel.jpg"
            alt="Joel Polley with his family"
            loading="lazy"
          />
          <span className="eyebrow center" style={{ display: 'block' }} data-rv>
            The Number Matters. But the Life Behind It Matters More.
          </span>
          <h2 data-rv>You Still Have Places to Go, People to Love, Work to Do, and Memories to Make.</h2>
          <p className="sub" data-rv>
            You are not applying because you want to spend the rest of your life thinking about
            blood pressure. You are applying because you are ready to stop letting it control
            your peace, your plans, and the way your family looks at you when another scare
            happens.
          </p>
          <p className="brand-lines" data-rv>
            Reclaim your health.<br />Reclaim your confidence.<br />Reclaim your life. Fully.
          </p>
          <p className="bethere" data-rv>Be There.</p>
          <div data-rv>
            <ApplyButton label="Apply to Work With Joel" position="final" onApply={handleApply} />
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
          Apply to Work With Joel · Free to Apply
        </button>
      </div>
    </main>
  );
}
