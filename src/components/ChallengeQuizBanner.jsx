// ChallengeQuizBanner — the Sept 22-24 Change My Life Challenge strip shown
// at the start of the quiz (bpquiz.com '/' since 2026-08-27 renders Q1 in the
// hero, so "quiz start" includes the homepage) and on the results screen.
//
// ⚠️ NOT the same thing as components/ChallengeBanner.jsx — that is the
// self-retiring HomeSplit top strip from the August free cohort, still
// imported by HomeSplit, and it exports currentChallengeNight. This file was
// briefly written OVER it on 2026-09-11 and broke the build; hence the
// distinct name. Do not merge the two.
//
// The ENTIRE banner is one <a>, per Joel's spec. QuizFirstHome's doctrine is
// "no second CTA" (see that file's kill-criterion header) — this banner
// deliberately breaks that on Joel's direct order; if revenue-per-visitor
// dips under the $0.30 kill line, remove this first. Roll or remove after
// Sept 24 (cohort record: project_challenge_sept_cohort_2026-09-10).
import { track } from '../utils/analytics.js';

export default function ChallengeQuizBanner({ placement }) {
  return (
    <a
      href="https://changemylifechallenge.com/?utm_source=bpquiz&utm_medium=banner&utm_campaign=sept-cohort&utm_content=quiz"
      onClick={() => track('challenge_banner_click', { placement, cohort: '2026-09-22' })}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(120deg, #243A2B, #2E4A38 60%, #1c2e22)',
        borderRadius: 14,
        padding: '14px 18px',
        margin: '0 0 14px',
        boxShadow: '0 10px 26px rgba(36,58,43,0.28)',
        border: '1px solid rgba(233,199,184,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E9C7B8', marginBottom: 3 }}>
            Live Sept 22&ndash;24 &middot; The Change My Life Challenge
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35 }}>
            3 live days with Annie + Joel, RNs &mdash; find out what your body has been trying to tell you.
          </div>
        </div>
        <div style={{ flex: '0 0 auto', background: '#E9C7B8', color: '#243A2B', fontWeight: 800, fontSize: '0.8rem', borderRadius: 999, padding: '11px 16px', minHeight: 44, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          Save my seat &middot; $97 &rarr;
        </div>
      </div>
    </a>
  );
}
