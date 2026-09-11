// QuizFirstHome — bpquiz.com '/'.
//
// 2026-08-27 (Joel, "ship it"): the homepage IS the quiz now. Question one is
// rendered in the hero, and tapping an answer carries it straight into
// /quiz at question two. Ported from the Economic Masonry assessment, where the
// landing page asks Q1 inline instead of asking someone to decide to start.
//
// WHY THIS REPLACED THE A/B SPLIT, from PostHog:
//   The old 50/50 (CheckoutPage vs FoodsGuideLanding) was already dead --
//   arm B took zero traffic from 2026-08-03 onward, so everyone had been
//   getting the sales letter for a month.
//   While both arms were live (Jul 20-31):
//     sales letter   1,747 visitors,  7.8% gave an email, $0.38/visitor
//     email squeeze  1,069 visitors, 22.0% gave an email, $0.31/visitor
//   The email gap was real (z~10). The revenue gap was NOT (z~0.43, p~0.67).
//   But squeeze-page emails earned $0.71 each, while QUIZ emails earn $4.18
//   (2,902 emails -> 158 buyers -> $12,128 since Jul 1).
//   Quiz-first breaks even at 9.1% email capture. The old quiz-first landing
//   got 45.5% of viewers to START, and ~68% of starters give an email, so the
//   expected capture is ~28%. That is the margin this bet rests on.
//
// KILL CRITERION (Joel, agreed before launch): watch revenue per visitor
// against the $0.38 baseline. If it is under $0.30 after three weeks, revert.
// Reverting = point '/' back at HomeSplit in App.jsx. Nothing else changed.
//
// The hero deliberately carries no price, no nav and no second CTA. The only
// thing to do is answer.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { track } from '../utils/analytics.js';
import { QUESTIONS } from '../data/triggerQuestions';
import ChallengeQuizBanner from '../components/ChallengeQuizBanner.jsx';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuizFirstHome() {
  const navigate = useNavigate();
  const q1 = QUESTIONS[0];

  useEffect(() => {
    track('quizfirst_landing_viewed', { page: 'home', version: 'quizfirst-home-2026-08-27' });
    track('home_variant_viewed', { variant: 'quizfirst', page: 'quizfirst-home' });
  }, []);

  function answer(key) {
    track('quizfirst_start_clicked', { page: 'home', answer: key });
    // The pick rides across as ?p=; TriggerQuizPage records it as Q1 and opens
    // on Q2, so she never answers the same question twice.
    navigate(`/quiz?p=${encodeURIComponent(key)}`);
  }

  return (
    <main className="qfh">
      <style>{`
        /* 2026-09-07 (Joel: "everything above the fold, desktop and mobile").
           Was inline styles; moved to a scoped block because fitting a fold
           needs HEIGHT media queries, which inline styles cannot express.
           Measured before: 951px tall on 1440x800 and 1175px on 375x812, so
           the disclaimer and part of the answer list sat below the fold on
           both. Nothing was removed to make it fit -- every element, including
           the legal line, is still here, just on a tighter type and spacing
           scale that steps down as the viewport gets shorter.

           One knob drives it: --u, the spacing unit. The three height
           breakpoints shrink --u and the type together, so the block keeps its
           proportions instead of collapsing unevenly. */
        .qfh{
          --u:1rem; --h1:clamp(1.5rem,5.2vw,2.15rem); --q:clamp(1.05rem,4vw,1.25rem);
          --opt:0.92rem; --sub:0.92rem; --fine:0.72rem; --dot:26px;
          min-height:100vh; min-height:100svh;
          background:var(--cream,#FBF8F1); color:var(--ink,#121110);
          font-family:'Inter',system-ui,sans-serif;
          /* Centred rather than top-aligned: once the block fits the fold, a
             top-aligned hero leaves all its slack in one lump at the bottom. */
          display:flex; align-items:center;
        }
        .qfh-wrap{width:100%;max-width:680px;margin:0 auto;padding:calc(var(--u)*1.4) 1.25rem calc(var(--u)*1.2);}
        /* Tall screens have room to spare, so spend it on presence instead of
           leaving the block looking shrunken on a big monitor. */
        @media (min-height:900px){
          .qfh{--u:1.15rem;--h1:clamp(1.9rem,5.6vw,2.5rem);--q:clamp(1.15rem,4vw,1.4rem);
               --opt:0.98rem;--sub:1rem;--photo:56px;--dot:28px;}
        }
        .qfh-eyebrow{
          display:inline-block;font-size:var(--fine);font-weight:700;letter-spacing:0.14em;
          text-transform:uppercase;color:var(--clay,#B85A36);margin-bottom:calc(var(--u)*0.55);
        }
        .qfh h1{
          font-family:'Fraunces',Georgia,serif;font-weight:550;font-size:var(--h1);
          line-height:1.13;letter-spacing:-0.01em;margin:0 0 calc(var(--u)*0.5);
        }
        .qfh-sub{font-size:var(--sub);line-height:1.5;color:var(--ink-soft,#2B2824);margin:0 0 calc(var(--u)*0.85);}
        .qfh-card{
          background:#fff;border:1px solid var(--line,#D8CFBD);border-radius:14px;
          padding:calc(var(--u)*0.8) calc(var(--u)*0.75);margin-bottom:calc(var(--u)*0.85);
        }
        .qfh-kicker{
          font-size:var(--fine);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
          color:var(--sage-deep,#2E3A30);margin-bottom:calc(var(--u)*0.35);
        }
        .qfh-card h2{
          font-family:'Fraunces',Georgia,serif;font-weight:550;font-size:var(--q);
          line-height:1.3;margin:0 0 calc(var(--u)*0.6);
        }
        .qfh-options{display:flex;flex-direction:column;gap:calc(var(--u)*0.45);}
        .qfh-option{
          display:flex;align-items:center;gap:0.7rem;text-align:left;width:100%;
          background:#fff;border:1.5px solid var(--line,#D8CFBD);border-radius:11px;
          padding:calc(var(--u)*0.5) calc(var(--u)*0.6);
          font-family:inherit;font-size:var(--opt);line-height:1.35;
          color:var(--ink,#121110);cursor:pointer;
          transition:border-color .15s ease,background .15s ease;
        }
        .qfh-option:hover{border-color:var(--sage-deep,#2E3A30);background:var(--cream,#FBF8F1);}
        .qfh-option:focus-visible{outline:2px solid var(--sage-deep,#2E3A30);outline-offset:2px;}
        .qfh-letter{
          flex-shrink:0;width:var(--dot);height:var(--dot);border-radius:50%;
          border:1.5px solid var(--line,#D8CFBD);display:inline-flex;align-items:center;
          justify-content:center;font-size:0.72rem;font-weight:700;color:var(--sage-deep,#2E3A30);
        }
        .qfh-bio{display:flex;align-items:center;gap:0.75rem;margin-bottom:calc(var(--u)*0.7);}
        .qfh-bio img{
          width:var(--photo,48px);height:var(--photo,48px);border-radius:50%;object-fit:cover;
          border:2px solid var(--line,#D8CFBD);flex-shrink:0;
        }
        .qfh-bio p{font-size:calc(var(--fine)*1.08);line-height:1.45;color:var(--ink-soft,#2B2824);margin:0;}
        .qfh-fine{
          font-size:var(--fine);line-height:1.45;color:var(--muted,#7A7061);margin:0;
          border-top:1px solid var(--line-soft,#E8E1D1);padding-top:calc(var(--u)*0.6);
        }
        .qfh-fine a{color:var(--muted,#7A7061);}

        /* Short viewports: laptops at 800 and under, and phones once the
           browser chrome is counted. Each step tightens the same knob. */
        @media (max-height:860px){
          .qfh{--u:0.82rem;--h1:clamp(1.35rem,4.6vw,1.85rem);--sub:0.86rem;--opt:0.88rem;--photo:42px;--dot:24px;}
        }
        @media (max-height:740px){
          .qfh{--u:0.62rem;--h1:clamp(1.2rem,4.2vw,1.6rem);--q:clamp(0.98rem,3.6vw,1.12rem);
               --sub:0.8rem;--opt:0.84rem;--fine:0.68rem;--photo:36px;--dot:22px;}
        }
        /* Touch targets stay tappable no matter how short the screen is. */
        @media (pointer:coarse){ .qfh-option{min-height:44px;} }
      `}</style>

      <section className="qfh-wrap">
        <ChallengeQuizBanner placement="home-hero" />
        <div className="qfh-eyebrow">Free &middot; 2 minutes &middot; No email to start</div>

        <h1>Find the one thing driving your blood pressure up.</h1>

        <p className="qfh-sub">
          {QUESTIONS.length} quick questions from a nurse who spent twenty years watching what
          actually moves the number. Start with the first one, right here.
        </p>

        {/* ── Question one, in the hero ─────────────────────────── */}
        <div className="qfh-card">
          <div className="qfh-kicker">Question 1 of {QUESTIONS.length}</div>
          <h2>{q1.title}</h2>
          <div className="qfh-options">
            {q1.options.map((opt, i) => (
              <button key={opt.key} type="button" className="qfh-option" onClick={() => answer(opt.key)}>
                <span aria-hidden="true" className="qfh-letter">{LETTERS[i]}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Who is asking ─────────────────────────────────────── */}
        <div className="qfh-bio">
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img src="/headshot.jpg" alt="Joel Polley, RN" width="48" height="48" />
          </picture>
          <p>
            <strong style={{ color: 'var(--ink, #121110)' }}>Joel Polley, RN.</strong> Twenty years
            in the ICU and ER, where he watched the same preventable emergency come through the
            doors again and again.
          </p>
        </div>

        <p className="qfh-fine">
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          Never start, stop, or change a medication without your doctor.{' '}
          <Link to="/privacy">Privacy</Link>
          {' · '}
          <Link to="/terms">Terms</Link>
        </p>
      </section>
    </main>
  );
}
