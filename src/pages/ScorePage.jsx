// ScorePage (route: /score?e=<email>&t=<token>) — NEW 2026-07-03.
//
// Tokenized "see my saved result" page for email links. The lead emails can
// now link a reader back to their own quiz result instead of a generic page.
//
// Contract: GET /api/score-get?e=<email>&t=<token>
//   200 -> { corner, riskScore, readiness?, firstName? }
//   4xx/5xx or malformed -> gentle fallback that points to /quiz (a stale or
//   forwarded link should never show an error wall or someone else's data).
//
// We show ONE score (the riskScore the API returns) and the loudest corner.
// We do NOT invent per-corner numbers the API never sent.
//
// App.jsx wraps this route in SiteLayout, so this returns the section only.
// Compliance: the score is a lifestyle-driver read, never a clinical measure.
// ZERO em-dashes in visible copy.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { track } from '../utils/analytics';

const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium']);

const CORNER_LABEL = { stress: 'Stress', sugar: 'Sugar', sodium: 'Sodium' };

// A short, honest read per corner. 4th-grade plain words, no promises.
const CORNER_READ = {
  stress: 'Stress raises cortisol, and cortisol tells your body to hold on to sodium. That pushes your blood pressure up. Calming this corner is where your plan starts.',
  sugar: 'Sugar spikes insulin, and insulin tells your body to hold on to sodium and water. That pushes your numbers up. Steadying this corner is where your plan starts.',
  sodium: 'Held sodium pulls in water and strains your vessels. That is the corner your blood pressure is measured at. Draining this corner is where your plan starts.',
};

const KICKER = {
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--sage, #4A5D4E)',
};
const CARD = {
  background: 'var(--cream, #FBF8F1)',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 14,
  padding: '1.4rem 1.5rem',
  margin: '1.25rem 0 0',
};
const BTN_CLAY = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.45rem',
  background: 'var(--clay, #B85A36)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '1.02rem',
  textDecoration: 'none',
  padding: '0.9rem 1.4rem',
  borderRadius: 10,
  width: '100%',
};
const BTN_QUIET = {
  ...BTN_CLAY,
  background: 'transparent',
  color: 'var(--ink, #121110)',
  border: '2px solid var(--line, #D8CFBD)',
};
const SMALL = { fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)' };

export default function ScorePage() {
  // 'loading' | 'ok' | 'fallback'
  const [state, setState] = useState('loading');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams(window.location.search);
    const e = params.get('e') || '';
    const t = params.get('t') || '';
    if (!e || !t) {
      setState('fallback');
      return () => { alive = false; };
    }
    fetch(`/api/score-get?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        const corner = d && VALID_CORNERS.has(d.corner) ? d.corner : null;
        const score = d && Number.isFinite(Number(d.riskScore)) ? Math.max(1, Math.min(10, Math.round(Number(d.riskScore)))) : null;
        if (corner && score) {
          setResult({
            corner,
            score,
            firstName: typeof d.firstName === 'string' ? d.firstName.trim() : '',
          });
          setState('ok');
          track('score_page_viewed', { corner, risk_score: score });
        } else {
          setState('fallback');
        }
      })
      .catch(() => { if (alive) setState('fallback'); });
    return () => { alive = false; };
  }, []);

  if (state === 'loading') {
    return (
      <section style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted, #7A7061)' }}>Finding your result…</p>
      </section>
    );
  }

  // Gentle fallback: expired, invalid, or missing token. No error wall.
  if (state === 'fallback') {
    return (
      <section style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem', textAlign: 'center' }}>
        <span style={KICKER}>Your Triangle</span>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', margin: '0.6rem auto 0.5rem', color: 'var(--ink, #121110)', maxWidth: '24ch', lineHeight: 1.2 }}>
          That link has expired, but your result is 90 seconds away.
        </h1>
        <p style={{ fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '48ch', margin: '0 auto 1.5rem' }}>
          Saved results only live for a little while, to keep your answers private. Take the free
          quiz again and your fresh result, and your plan, will be right there.
        </p>
        <Link to="/quiz" style={{ ...BTN_CLAY, width: 'auto', display: 'inline-flex' }}>
          Retake the 90-second quiz
          <ArrowRight size={17} strokeWidth={2} />
        </Link>
      </section>
    );
  }

  const label = CORNER_LABEL[result.corner];
  const read = CORNER_READ[result.corner];

  return (
    <section style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={KICKER}>Your saved result</span>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)', margin: '0.6rem auto 0.4rem', color: 'var(--ink, #121110)', maxWidth: '22ch', lineHeight: 1.15 }}>
          {result.firstName ? `${result.firstName}, your loudest corner is ${label}.` : `Your loudest corner is ${label}.`}
        </h1>
      </div>

      {/* ---- The one score, plainly ---- */}
      <div style={{ ...CARD, display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
        <div style={{
          display: 'grid', placeItems: 'center', flexShrink: 0,
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--clay, #B85A36)', color: '#FFFFFF',
          fontFamily: 'Fraunces, Georgia, serif',
        }}>
          <div style={{ fontSize: '1.6rem', lineHeight: 1, fontWeight: 500 }}>{result.score}</div>
          <div style={{ fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85, marginTop: '0.1rem' }}>/ 10</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink, #121110)', marginBottom: '0.25rem' }}>
            {label} score: {result.score} out of 10
          </div>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            {read}
          </p>
        </div>
      </div>

      <p style={{ ...SMALL, margin: '0.75rem 0 0' }}>
        This score reads how loudly this corner shows up in your answers. It is a lifestyle read, not
        a medical measurement, and it can change as your habits change.
      </p>

      {/* ---- Next steps ---- */}
      <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0 0' }}>
        <a
          href={`/pay?tier=corner&corner=${result.corner}`}
          style={BTN_CLAY}
          onClick={() => track('checkout_clicked', { product: 'bp-corner-reset', corner: result.corner, source: 'score-page' })}
        >
          Start my {label} reset, $17
          <ArrowRight size={17} strokeWidth={2} />
        </a>
        <Link to="/quiz" style={BTN_QUIET}>
          Retake the 90-second quiz
        </Link>
      </div>

      {/* ---- Compliance spine ---- */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '1.75rem 0 0' }}>
        <Stethoscope size={18} strokeWidth={1.9} style={{ color: 'var(--sage, #4A5D4E)', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ ...SMALL, margin: 0 }}>
          Education and lifestyle support, alongside your doctor, never instead of. See our{' '}
          <Link to="/terms" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}
