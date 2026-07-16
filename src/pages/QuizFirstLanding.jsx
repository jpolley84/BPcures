// QuizFirstLanding — variant B of the homepage A/B split (see HomeSplit.jsx).
// Short quiz-first landing: free 2 minute check as the ONLY ask. No pricing,
// no nav. Mobile-first at 375px, brand tokens from index.css (cream / clay /
// sage / Fraunces). CTAs navigate to /quiz.
import { useEffect } from 'react';
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
  maxWidth: 680,
  margin: '0 auto',
  padding: '2.5rem 1.25rem 3rem',
};

const kickerStyle = {
  display: 'inline-block',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--clay, #B85A36)',
  marginBottom: '0.9rem',
};

const h1Style = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontWeight: 550,
  fontSize: 'clamp(1.9rem, 6.5vw, 2.7rem)',
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  margin: '0 0 1rem',
};

const subStyle = {
  fontSize: '1.02rem',
  lineHeight: 1.65,
  color: 'var(--ink-soft, #2B2824)',
  margin: '0 0 1.5rem',
};

const ctaStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '1rem 1.4rem',
  background: 'var(--clay, #B85A36)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const cardStyle = {
  background: 'var(--paper, #FFFFFF)',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 14,
  padding: '1.25rem 1.25rem',
};

const h2Style = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontWeight: 550,
  fontSize: 'clamp(1.35rem, 5vw, 1.7rem)',
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
  margin: '0 0 1rem',
};

const LIES = [
  {
    lie: 'Lie 1: "It is a disease."',
    body: 'It is a measurement. A smoke alarm. Treating the number without asking why is taking the battery out of the alarm.',
  },
  {
    lie: 'Lie 2: "It is your genetics."',
    body: 'Genetics writes the recipe. Lifestyle bakes the cake, and the hand doing the baking is yours.',
  },
  {
    lie: 'Lie 3: "Just cut the salt."',
    body: 'Salt is one corner of the picture. If cutting it barely moved your number, the real driver is probably somewhere else.',
  },
];

export default function QuizFirstLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    track('quizfirst_landing_viewed');
  }, []);

  function startCheck(position) {
    track('quizfirst_start_clicked', { position });
    navigate('/quiz');
  }

  return (
    <div style={wrap}>
      <div style={shell}>
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <span style={kickerStyle}>Free 2 minute pressure check</span>
        <h1 style={h1Style}>
          Which of the 5 hidden reasons is raising <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>YOUR</em> blood pressure?
        </h1>
        <p style={subStyle}>
          Take the free 2 minute check built by an ICU nurse with 20 years at the bedside.
          Get your score, find your loudest driver, and download the free guide your doctor
          never has time to walk you through.
        </p>

        <button type="button" style={ctaStyle} onClick={() => startCheck('top')}>
          Start My Free Check <ArrowRight size={18} />
        </button>

        {/* ─── Credibility row ──────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          margin: '1.75rem 0 2.25rem',
        }}>
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img
              src="/headshot.jpg"
              alt="Joel Polley, RN"
              width="64"
              height="64"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--line, #D8CFBD)',
                flexShrink: 0,
              }}
            />
          </picture>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            <strong style={{ color: 'var(--ink, #121110)' }}>Joel Polley, RN.</strong>{' '}
            20 years in the ICU and ER. Over 400,000 people follow his health teaching on
            Facebook and TikTok.
          </p>
        </div>

        {/* ─── The three lies ───────────────────────────────────── */}
        <h2 style={h2Style}>The three lies you have been told about blood pressure</h2>
        <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '2.25rem' }}>
          {LIES.map((item) => (
            <div key={item.lie} style={cardStyle}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--clay, #B85A36)',
                marginBottom: '0.4rem',
              }}>
                {item.lie}
              </div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* ─── What the 15 minute visit never covers ────────────── */}
        <h2 style={h2Style}>What a 15 minute visit never has time to tell you</h2>
        <p style={{ ...subStyle, marginBottom: '1.75rem' }}>
          When the chart says essential hypertension, it officially means high blood pressure
          with no identified cause. Nobody sat down long enough to find YOUR cause. This check
          looks at the five places it hides: stress, sugar, sodium, hormones, and sleep. Two
          minutes. Your loudest one, named.
        </p>

        <button type="button" style={ctaStyle} onClick={() => startCheck('bottom')}>
          Start My Free Check <ArrowRight size={18} />
        </button>

        {/* ─── Compliance footer (same pattern as PayPage) ──────── */}
        <p style={{
          textAlign: 'center',
          color: 'var(--muted, #7A7061)',
          fontSize: '0.8rem',
          maxWidth: '58ch',
          margin: '2rem auto 0',
        }}>
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
