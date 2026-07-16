// TriggerLanding — variant B of the homepage A/B split (see HomeSplit.jsx).
// Annie-v2 quiz opt-in landing (2026-07-16): sells the free 5-question Hidden
// Triggers quiz, nothing else. Her structural notes are implemented here:
// a quiz CTA close to the top ABOVE the trust band, and the Blueprint PDF
// cover picture on the page. No pricing, no nav. CTAs navigate to /triggers.
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
  margin: '0 0 1rem',
};

const subStyle = {
  fontSize: '1.02rem',
  lineHeight: 1.65,
  color: 'var(--ink-soft, #2B2824)',
  margin: '0 0 1.4rem',
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
  borderRadius: 999,
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 8px 20px rgba(184, 90, 54, 0.28)',
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

const WALK_AWAY = [
  'Your #1 hidden blood pressure trigger, named and explained. Not a generic list.',
  '3 things to start today: an herb, a food swap, and one lifestyle shift, specific to your result.',
  'The full Blood Pressure Blueprint PDF: all 5 triggers explained in plain English, sent to your inbox.',
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

export default function TriggerLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    track('quizfirst_landing_viewed', { funnel_version: 'annie-v2' });
  }, []);

  function startQuiz(position) {
    track('quizfirst_start_clicked', { position, funnel_version: 'annie-v2' });
    navigate('/triggers');
  }

  return (
    <div style={wrap}>
      <div style={shell}>
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <span style={eyebrowStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
          Free · 5 Questions · About 90 Seconds
        </span>
        <h1 style={h1Style}>
          Your numbers aren&rsquo;t random.{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>
            In 90 seconds, you&rsquo;ll know exactly why.
          </em>
        </h1>
        <p style={subStyle}>
          Take the free quiz and finally see which hidden trigger is driving your blood
          pressure up. No fad diet, no supplement gamble, and no appointment that ends
          with more questions than answers.
        </p>

        {/* Quiz CTA above the trust band (Annie's edit, 2026-07-16) */}
        <button type="button" style={ctaStyle} onClick={() => startQuiz('top')}>
          Take the Free 90-Second Quiz <ArrowRight size={18} />
        </button>
        <p style={fineStyle}>Real, personal answer. Not a generic list.</p>

        {/* ─── Trust band ───────────────────────────────────────── */}
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
            { num: '20 Yrs', label: 'ICU & ER Nursing' },
            { num: '5', label: 'Hidden Triggers' },
            { num: 'RN', label: 'Founder, BraveWorks' },
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
                  fontSize: '1.15rem',
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

        {/* ─── What you'll walk away with + Blueprint cover ─────── */}
        <div
          style={{
            display: 'flex',
            gap: '1.1rem',
            alignItems: 'flex-start',
            background: 'var(--paper-warm, #EFE8DB)',
            borderRadius: 12,
            padding: '1.15rem 1.15rem',
            marginBottom: '1.5rem',
          }}
        >
          <picture style={{ flexShrink: 0 }}>
            <source srcSet="/images/blueprint-cover.webp" type="image/webp" />
            <img
              src="/images/blueprint-cover.png"
              alt="The Blood Pressure Blueprint, free guide by Joel Polley, RN"
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
          You&rsquo;re taking your medication. You&rsquo;re trying to eat better. And the
          numbers still climb. That&rsquo;s not a willpower problem. It&rsquo;s a signal
          nobody&rsquo;s taught you how to read yet.
        </div>

        <button type="button" style={ctaStyle} onClick={() => startQuiz('bottom')}>
          Take the Free 90-Second Quiz <ArrowRight size={18} />
        </button>
        <p style={fineStyle}>Takes less than 2 minutes. 5 questions. One real answer.</p>

        {/* ─── About Joel ───────────────────────────────────────── */}
        <div
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
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: '1.02rem' }}>
                Joel Polley, RN
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted, #7A7061)' }}>
                ICU &amp; Emergency Medicine · 20 Years · Founder, BraveWorks RN
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            Joel spent two decades on the front lines of ICU and emergency medicine, watching
            the same story repeat itself: patients doing everything right and still watching
            their numbers climb, with no one showing them where to actually look. BraveWorks RN
            exists to close that gap. Plain-language, nurse-built education for the everyday
            patterns quietly driving blood pressure up.
          </p>
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
    </div>
  );
}
