// TriggerLanding — variant B of the homepage A/B split (see HomeSplit.jsx).
// Annie-v2 quiz opt-in landing, redesigned 2026-07-16 (late) to the
// researched top-converting opt-in anatomy (ScoreApp/Interact quiz-funnel
// doctrine + Leadpages/ClickFunnels squeeze anatomy + Unbounce/NN-g/CXL
// element evidence, 46 sourced findings):
//   fold = eyebrow + headline + hero poster + first-person CTA;
//   then trust band (real numbers only), numbered how-it-works,
//   result preview (Blueprint mockup) + benefit bullets, agitation,
//   second CTA, author bio, short sober FAQ, final CTA, compliance
//   footer, sticky mobile CTA bar.
// Owner mandates honored: the poster stays large at the top; a quiz CTA
// stays above the trust band; ~3rd-grade copy; ZERO em/en dashes; no
// invented proof (20 yrs RN; 550,000+ followers per Joel, 2026-07-16). One-job
// page: every action routes to /triggers.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { track } from '../utils/analytics.js';

const wrap = {
  minHeight: '100vh',
  background: 'var(--cream, #FBF8F1)',
  color: 'var(--ink, #121110)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const shell = {
  maxWidth: 640,
  margin: '0 auto',
  padding: '2.25rem 1.25rem 3rem',
};

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  background: 'var(--sage-soft, #C5CDBF)',
  padding: '0.4rem 0.9rem',
  borderRadius: 999,
  marginBottom: '1.1rem',
};

const h1Style = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontWeight: 550,
  fontSize: 'clamp(1.9rem, 6.5vw, 2.6rem)',
  lineHeight: 1.16,
  letterSpacing: '-0.01em',
  margin: '0 0 0.9rem',
};

const ctaStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '1.05rem 1.4rem',
  background: 'var(--clay, #B85A36)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  fontSize: '1.08rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 8px 22px rgba(184, 90, 54, 0.32)',
};

const fineStyle = {
  textAlign: 'center',
  fontSize: '0.82rem',
  color: 'var(--muted, #7A7061)',
  margin: '0.7rem 0 0',
};

const labelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  marginBottom: '0.7rem',
};

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

// First-person, outcome-specific CTA (research: first-person button copy and
// value language outperform generic labels). Same words on every button.
const CTA_LABEL = 'Show Me My Hidden Trigger';

const HOW_IT_WORKS = [
  { n: '1', title: 'Answer 5 easy questions', body: 'About 90 seconds. Tap your answers. No typing.' },
  { n: '2', title: 'See your #1 hidden trigger', body: 'Named right away, in plain words. Plus 3 things to start today.' },
  { n: '3', title: 'Get your free Blueprint', body: 'All 5 triggers, sent to your email. Yours to keep.' },
];

// Blind-bullet flavor (research: tease the outcome, keep the answer inside).
const WALK_AWAY = [
  'The #1 hidden thing pushing your pressure up. Most people guess this wrong.',
  'The herb, the food swap, and the one habit picked for your result.',
  'The free Blood Pressure Blueprint: all 5 triggers in plain words.',
];

// Short, sober objection-handlers (research: FAQ at the point of hesitation).
const FAQ = [
  { q: 'Is it really free?', a: 'Yes. The quiz is free and the Blueprint guide is free. No card, ever.' },
  { q: 'How long does it take?', a: 'About 90 seconds. It is 5 questions, and you just tap your answers.' },
  { q: 'What do you do with my email?', a: 'We send your free Blueprint and helpful notes from Joel. No spam. You can stop them anytime with one click.' },
  { q: 'Is this medical advice?', a: 'No. This is education to use alongside your doctor, never instead of them.' },
];

function Check() {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'var(--sage, #4A5D4E)',
        color: '#fff',
        fontSize: '0.68rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
      }}
    >
      ✓
    </span>
  );
}

function CtaBlock({ position, onStart }) {
  return (
    <>
      <button type="button" style={ctaStyle} className="bpq-cta" onClick={() => onStart(position)}>
        {CTA_LABEL} <ArrowRight size={18} />
      </button>
      <p style={fineStyle}>Free · 5 questions · About 90 seconds · No card, ever</p>
    </>
  );
}

export default function TriggerLanding() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(-1);
  const [showBar, setShowBar] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    track('quizfirst_landing_viewed', { funnel_version: 'annie-v2', layout: 'optin-v3' });
  }, []);

  // Entrance animation strategy: sections are VISIBLE BY DEFAULT and only
  // gain a keyframes entrance (animation-fill-mode: backwards) with a small
  // stagger. Fail-safe by construction: if animations never run (throttled
  // webview, no JS, reduced motion, ancient browser), the natural state is
  // fully visible. No IntersectionObserver dependency for content.

  // Sticky mobile CTA bar once the hero scrolls away (research: bottom
  // sticky CTAs win on mobile, not desktop; the bar is mobile-only in CSS).
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window) || !heroRef.current) {
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(heroRef.current);
    return () => io.disconnect();
  }, []);

  function startQuiz(position) {
    track('quizfirst_start_clicked', { position, funnel_version: 'annie-v2', layout: 'optin-v3' });
    navigate('/triggers');
  }

  return (
    <div style={wrap}>
      <style>{`
        @keyframes bpqUp { from { opacity: 0; transform: translateY(22px); } }
        [data-bpqrv] { animation: bpqUp .7s cubic-bezier(0.22,1,0.36,1) backwards; }
        .bpq-cta { transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
        .bpq-cta:hover { background: var(--clay-hover, #A44B28); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(184, 90, 54, 0.38); }
        .bpq-cta:focus-visible { outline: 3px solid var(--sage-deep, #2E3A30); outline-offset: 3px; }
        .bpq-hero-row { display: flex; flex-direction: column; gap: 0.9rem; }
        .bpq-hero-row .bpq-hero-steps { width: 100%; min-width: 0; }
        .bpq-hero-poster {
          display: block; width: 100%;
          border: none; padding: 0; background: none;
          cursor: pointer; border-radius: 12px; overflow: hidden;
          box-shadow: 0 18px 40px rgba(18, 17, 16, 0.22);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .bpq-hero-poster:hover { transform: translateY(-3px); box-shadow: 0 32px 65px rgba(18, 17, 16, 0.3); }
        .bpq-hero-poster:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 3px; }
        /* Two doors under the kit poster: quiz, or straight to checkout. */
        .bpq-hero-doors { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.9rem; }
        .bpq-door {
          width: 100%; border-radius: 10px; padding: 0.95rem 1.1rem; cursor: pointer;
          font-size: 1rem; font-weight: 700; font-family: inherit; line-height: 1.25;
          transition: transform .12s ease, background .15s ease, border-color .15s ease;
        }
        .bpq-door:hover { transform: translateY(-1px); }
        .bpq-door-primary { background: var(--clay, #B85A36); color: #fff; border: 2px solid var(--clay, #B85A36); }
        .bpq-door-primary:hover { background: var(--clay-deep, #9C4527); }
        .bpq-door-secondary { background: transparent; color: var(--ink, #121110); border: 2px solid var(--line, #D8CFBD); }
        .bpq-door-secondary:hover { border-color: var(--ink, #121110); }
        .bpq-door:focus-visible { outline: 3px solid var(--clay, #B85A36); outline-offset: 2px; }
        .bpq-door-note { margin: 0.2rem 0 0; font-size: 0.8rem; line-height: 1.5; color: var(--muted, #7A7061); text-align: center; }
        @media (min-width: 640px) {
          .bpq-hero-doors { flex-direction: row; flex-wrap: wrap; }
          .bpq-door { flex: 1 1 0; min-width: 210px; }
          .bpq-door-note { flex-basis: 100%; }
        }
        .bpq-stickybar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: none;
          background: rgba(46, 58, 48, 0.97); backdrop-filter: blur(8px);
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          transform: translateY(110%); transition: transform .4s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 -8px 30px rgba(18, 17, 16, 0.3);
        }
        .bpq-stickybar.show { transform: translateY(0); }
        .bpq-stickybar button {
          display: block; width: 100%; max-width: 520px; margin: 0 auto;
          background: var(--clay, #B85A36); color: #fff; font-family: inherit;
          font-weight: 700; font-size: 1rem; padding: 13px 20px;
          border-radius: 999px; border: none; cursor: pointer;
        }
        .bpq-faq-a { max-height: 0; overflow: hidden; transition: max-height .35s ease; }
        .bpq-faq-item.open .bpq-faq-a { max-height: 180px; }
        .bpq-faq-item.open .bpq-plus { transform: rotate(45deg); }
        @media (max-width: 720px) { .bpq-stickybar { display: block; } }
        @media (prefers-reduced-motion: reduce) {
          [data-bpqrv], .bpq-cta, .bpq-hero-poster, .bpq-stickybar { animation: none !important; transition: none !important; transform: none !important; }
        }
      `}</style>

      <div style={shell}>
        {/* ─── FOLD: eyebrow + headline + poster + first-person CTA ─── */}
        <div ref={heroRef}>
          <span style={eyebrowStyle}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
            Free 90-Second Blood Pressure Check
          </span>
          <h1 style={h1Style}>
            Your numbers aren&rsquo;t random.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>
              In 90 seconds, you&rsquo;ll know exactly why.
            </em>
          </h1>

          {/* Hero row: the 10-Day BP Reset Kit vault image (2026-07-17,
              Joel) full-width and clickable, with the 1-2-3 how-it-works
              steps stacked below. */}
          <div className="bpq-hero-row" style={{ margin: '0.2rem 0 1.2rem' }}>
            <button
              type="button"
              className="bpq-hero-poster"
              onClick={() => startQuiz('hero_poster')}
              aria-label="The 10-Day BP Reset Kit library. Take the free 90-second quiz to find your trigger."
            >
              <picture>
                <source srcSet="/images/kit-vault-hero.webp" type="image/webp" />
                <img
                  src="/images/kit-vault-hero.jpg"
                  alt="The 10-Day BP Reset Kit: a complete library of protocols, herb guides, recipes, and tools to help you calm the three pressures behind your numbers. By Joel Polley, RN."
                  width="1672"
                  height="941"
                  fetchPriority="high"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </picture>
            </button>

            {/* 2026-07-22 (Joel) TEST: the kit poster used to be quiz-only, so
                someone who already wanted the kit had no way to buy it and
                then never saw it again. Two doors now: take the quiz, or skip
                straight to checkout. Skip goes to the $17 STRESS corner as
                STAGE ONE of the Triangle Reset, per Joel: "we always start
                with stress." That fixes the no-corner problem (a skip buyer
                has no quiz result) without guessing, and keeps the quiz
                meaningful since it sets which stage comes next. */}
            <div className="bpq-hero-doors">
              <button
                type="button"
                className="bpq-door bpq-door-primary"
                onClick={() => startQuiz('hero_doors')}
              >
                Take the free 90-second quiz
              </button>
              <button
                type="button"
                className="bpq-door bpq-door-secondary"
                onClick={() => {
                  track('skip_quiz_clicked', { source: 'hero_doors', tier: 'corner', corner: 'stress', stage: 1, value: 17 });
                  navigate('/pay?tier=corner&corner=stress&src=skipquiz');
                }}
              >
                Skip the quiz. Start Stage One, $17
              </button>
              <p className="bpq-door-note">
                Stage One of the full Triangle Reset is stress, because that is where we always start. The quiz is free and tells you which stage comes after it.
              </p>
            </div>

            <div className="bpq-hero-steps">
              <div style={{ ...labelStyle, marginBottom: '0.55rem' }}>How it works</div>
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: '0.7rem',
                    alignItems: 'flex-start',
                    background: '#fff',
                    border: '1px solid var(--line, #D8CFBD)',
                    borderRadius: 10,
                    padding: '0.7rem 0.8rem',
                    marginBottom: '0.55rem',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--clay, #B85A36)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3, marginBottom: 2 }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--ink-soft, #2B2824)' }}>
                      {step.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz CTA above the trust band (co-designer mandate). */}
          <CtaBlock position="top" onStart={startQuiz} />
        </div>

        {/* ─── Trust band: real numbers only ────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.5rem',
            background: 'var(--sage-deep, #2E3A30)',
            borderRadius: 12,
            padding: '1rem 1.1rem',
            margin: '1.5rem 0 1.75rem',
          }}
        >
          {[
            { num: '20 Yrs', label: 'ICU & ER Nurse' },
            { num: '550,000+', label: 'Follow His Teaching' },
            { num: 'Free', label: '90-Second Check' },
          ].map((chip, i) => (
            <div
              key={chip.label}
              style={{
                flex: 1,
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(251, 248, 241, 0.15)' : 'none',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--cream, #FBF8F1)',
                  lineHeight: 1.2,
                }}
              >
                {chip.num}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.58rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--sage-soft, #C5CDBF)',
                  marginTop: 3,
                }}
              >
                {chip.label}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Result preview + benefit bullets ─────────────────── */}
        <div
          data-bpqrv
          style={{
            display: 'flex',
            gap: '1.1rem',
            alignItems: 'flex-start',
            background: 'var(--paper-warm, #EFE8DB)',
            borderRadius: 12,
            padding: '1.15rem 1.15rem',
            marginBottom: '1.6rem',
          }}
        >
          <picture style={{ flexShrink: 0 }}>
            <source srcSet="/images/blueprint-cover.webp" type="image/webp" />
            <img
              src="/images/blueprint-cover.png"
              alt="The Blood Pressure Blueprint, your free guide by Joel Polley, RN"
              width="104"
              height="135"
              loading="lazy"
              style={{
                width: 104,
                height: 'auto',
                borderRadius: 6,
                border: '1px solid var(--line, #D8CFBD)',
                boxShadow: '6px 8px 18px rgba(18, 17, 16, 0.18)',
                transform: 'rotate(-2deg)',
              }}
            />
          </picture>
          <div>
            <div style={labelStyle}>What you&rsquo;ll walk away with</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {WALK_AWAY.map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'flex-start',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-soft, #2B2824)',
                    marginBottom: '0.6rem',
                  }}
                >
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Agitation ────────────────────────────────────────── */}
        <div
          data-bpqrv
          style={{
            background: 'var(--paper-warm, #EFE8DB)',
            borderLeft: '3px solid var(--clay, #B85A36)',
            borderRadius: '0 10px 10px 0',
            padding: '1rem 1.2rem',
            fontSize: '0.98rem',
            lineHeight: 1.65,
            color: 'var(--ink-soft, #2B2824)',
            marginBottom: '1.6rem',
          }}
        >
          You take your medicine. You try to eat better. And the numbers still climb.
          That is not about willpower. It is a signal no one has taught you how to read
          yet.
        </div>

        <div data-bpqrv>
          <CtaBlock position="mid" onStart={startQuiz} />
        </div>

        {/* ─── About Joel ───────────────────────────────────────── */}
        <div
          data-bpqrv
          style={{
            marginTop: '2.1rem',
            paddingTop: '1.6rem',
            borderTop: '1px solid var(--line, #D8CFBD)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.85rem' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="56"
                height="56"
                loading="lazy"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--line, #D8CFBD)',
                  flexShrink: 0,
                }}
              />
            </picture>
            <div>
              <div style={{ ...serif, fontSize: '1.02rem' }}>Joel Polley, RN</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted, #7A7061)' }}>
                ICU &amp; Emergency Medicine · 20 Years · Founder, BraveWorks RN
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            Joel spent 20 years as a nurse in the ICU and the ER. He saw the same story over
            and over: people doing everything right, and their numbers still climbing. No one
            showed them where to look. He built BraveWorks RN to fix that. Plain words. Real
            help. Made by a nurse.
          </p>
        </div>

        {/* ─── Mini FAQ ─────────────────────────────────────────── */}
        <div data-bpqrv style={{ marginTop: '2rem' }}>
          <div style={{ ...labelStyle, textAlign: 'center' }}>Quick questions</div>
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className={`bpq-faq-item${openFaq === i ? ' open' : ''}`}
              style={{ borderBottom: '1px solid var(--line, #D8CFBD)' }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                aria-expanded={openFaq === i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--ink, #121110)',
                  textAlign: 'left',
                  padding: '0.85rem 0',
                }}
              >
                <span>{item.q}</span>
                <span
                  className="bpq-plus"
                  aria-hidden="true"
                  style={{ color: 'var(--clay, #B85A36)', fontSize: '1.2rem', marginLeft: 12, transition: 'transform .3s ease' }}
                >
                  +
                </span>
              </button>
              <div className="bpq-faq-a" aria-hidden={openFaq !== i}>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: '0 0 0.85rem' }}>
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Final CTA ────────────────────────────────────────── */}
        <div data-bpqrv style={{ marginTop: '1.8rem' }}>
          <CtaBlock position="bottom" onStart={startQuiz} />
        </div>

        {/* ─── Compliance footer ────────────────────────────────── */}
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.8rem',
            maxWidth: '58ch',
            margin: '2rem auto 0',
          }}
        >
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>

      {/* ─── Sticky mobile CTA (mobile only, after hero) ─────────── */}
      <div className={`bpq-stickybar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <button type="button" onClick={() => startQuiz('sticky_bar')} tabIndex={showBar ? 0 : -1}>
          {CTA_LABEL} · Free
        </button>
      </div>
    </div>
  );
}
