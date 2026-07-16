// /coaching (and /coaching-vip) — the Be There cohort landing page.
//
// 2026-07-16: replaces CoachingOptinPage on these routes. Deliberately
// MINIMAL: kicker, one headline, two-sentence sub, the webinar video, ONE
// clay CTA to /apply, a reassurance line, and the compliance footer. No
// pricing anywhere (the application handles investment fit), no tiers, no
// feature grids, no testimonials. Zero em/en dashes in visible copy.

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { track } from '../utils/analytics';

const SERIF = "'Fraunces', 'Times New Roman', serif";

export default function BeThereLandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    track('bethere_landing_viewed');
  }, []);

  function handleApply() {
    track('bethere_apply_clicked');
    navigate('/apply');
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream, #FBF8F1)', color: 'var(--ink, #121110)' }}>
      <style>{`
        .bethere-cta {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; max-width: 420px;
          background: var(--clay, #B85A36); color: #FFFFFF;
          border: none; border-radius: 10px; cursor: pointer;
          font-weight: 700; font-size: 1.08rem; letter-spacing: 0.01em;
          padding: 1rem 1.4rem; font-family: inherit;
          transition: background 0.25s ease, transform 0.25s ease;
        }
        .bethere-cta:hover { background: var(--clay-hover, #A44B28); transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { .bethere-cta:hover { transform: none; } }
      `}</style>

      <section style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.25rem 4rem', textAlign: 'center' }}>
        <div
          className="text-xs font-bold uppercase"
          style={{ color: 'var(--clay, #B85A36)', letterSpacing: '0.14em', marginBottom: '1rem' }}
        >
          THE BE THERE COHORT
        </div>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            fontSize: 'clamp(1.9rem, 6vw, 3rem)',
            lineHeight: 1.15,
            margin: '0 0 1rem',
            color: 'var(--ink, #121110)',
          }}
        >
          What if someone was actually there with you?
        </h1>

        <p
          style={{
            color: 'var(--ink-soft, #2B2824)',
            fontSize: '1.05rem',
            lineHeight: 1.65,
            maxWidth: '54ch',
            margin: '0 auto 2rem',
          }}
        >
          Be There is Joel's 90 day cohort. A small group walking the BP Triangle together,
          each with a personalized plan, and a nurse in your corner every week.
        </p>

        {/* Webinar video: responsive 16:9, lazy, privacy-enhanced domain. */}
        <div
          style={{
            position: 'relative',
            paddingTop: '56.25%',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--line, #D8CFBD)',
            background: '#000',
            marginBottom: '2rem',
          }}
        >
          <iframe
            src="https://www.youtube-nocookie.com/embed/UdJvWCvUKww"
            title="Be There, a word from Joel Polley, RN"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>

        <button type="button" className="bethere-cta" onClick={handleApply}>
          Begin My Application
        </button>

        <p
          style={{
            color: 'var(--muted, #7A7061)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            maxWidth: '46ch',
            margin: '1rem auto 0',
          }}
        >
          Nothing to buy on this page. The application takes about 5 minutes and tells us both
          whether this is your fit.
        </p>

        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.8rem',
            maxWidth: '58ch',
            margin: '3rem auto 0',
            lineHeight: 1.6,
          }}
        >
          This is education and lifestyle support, not medical advice, diagnosis, or treatment. See our{' '}
          <Link to="/terms" style={{ color: 'var(--muted, #7A7061)' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--muted, #7A7061)' }}>Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
