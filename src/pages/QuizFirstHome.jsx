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

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

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
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--cream, #FBF8F1)',
        color: 'var(--ink, #121110)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '2.25rem 1.25rem 3rem' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--clay, #B85A36)',
            marginBottom: '0.9rem',
          }}
        >
          Free &middot; 2 minutes &middot; No email to start
        </div>

        <h1
          style={{
            ...serif,
            fontSize: 'clamp(1.9rem, 6.5vw, 2.7rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            margin: '0 0 0.9rem',
          }}
        >
          Find the one thing driving your blood pressure up.
        </h1>

        <p
          style={{
            fontSize: '1.02rem',
            lineHeight: 1.65,
            color: 'var(--ink-soft, #2B2824)',
            margin: '0 0 1.6rem',
          }}
        >
          {QUESTIONS.length} quick questions from a nurse who spent twenty years watching what
          actually moves the number. Start with the first one, right here.
        </p>

        {/* ── Question one, in the hero ─────────────────────────── */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line, #D8CFBD)',
            borderRadius: 16,
            padding: '1.25rem 1.1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--sage-deep, #2E3A30)',
              marginBottom: '0.55rem',
            }}
          >
            Question 1 of {QUESTIONS.length}
          </div>
          <h2
            style={{
              ...serif,
              fontSize: 'clamp(1.2rem, 4.5vw, 1.45rem)',
              lineHeight: 1.35,
              margin: '0 0 1.1rem',
            }}
          >
            {q1.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q1.options.map((opt, i) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => answer(opt.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  textAlign: 'left',
                  background: '#fff',
                  border: '1.5px solid var(--line, #D8CFBD)',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  fontSize: '0.95rem',
                  lineHeight: 1.45,
                  color: 'var(--ink, #121110)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1.5px solid var(--line, #D8CFBD)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--sage-deep, #2E3A30)',
                  }}
                >
                  {LETTERS[i]}
                </span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Who is asking ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem' }}>
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img
              src="/headshot.jpg"
              alt="Joel Polley, RN"
              width="56"
              height="56"
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
          <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            <strong style={{ color: 'var(--ink, #121110)' }}>Joel Polley, RN.</strong> Twenty years
            in the ICU and ER, where he watched the same preventable emergency come through the
            doors again and again.
          </p>
        </div>

        <p
          style={{
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: 'var(--muted, #7A7061)',
            margin: 0,
            borderTop: '1px solid var(--line-soft, #E8E1D1)',
            paddingTop: '1.1rem',
          }}
        >
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          Never start, stop, or change a medication without your doctor.{' '}
          <Link to="/privacy" style={{ color: 'var(--muted, #7A7061)' }}>Privacy</Link>
          {' · '}
          <Link to="/terms" style={{ color: 'var(--muted, #7A7061)' }}>Terms</Link>
        </p>
      </section>
    </main>
  );
}
