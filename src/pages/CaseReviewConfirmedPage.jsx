// CaseReviewConfirmedPage (route: /case-review-confirmed) — NEW 2026-07-03.
//
// The $297 "Joel's Eyes On Your Case" Stripe payment link redirects here after
// purchase (after_completion -> /case-review-confirmed?session_id=...). The
// route did not exist before, so a fresh $297 buyer 404'd into the catch-all
// and landed back on the homepage sales letter. This page is the warm landing:
// confirm, tell them exactly what to send, and bridge softly to the community.
//
// App.jsx wraps this route in SiteLayout, so this returns the section only.
// POST-PURCHASE page: noindex,nofollow set on mount (same pattern as
// WelcomePage.jsx). No price pressure anywhere on this page.
// Compliance: education alongside the doctor. ZERO em-dashes in visible copy.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, Users, Stethoscope } from 'lucide-react';
import { CASE_REVIEW } from '../data/caseReviewOffer';

const SKOOL_TRIAL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SKOOL_TRIAL_URL) ||
  'https://www.skool.com/braveworksrn/about';

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
const SMALL = { fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)' };
const BTN_CLAY = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: 'var(--clay, #B85A36)',
  color: '#FFFFFF',
  fontWeight: 700,
  textDecoration: 'none',
  padding: '0.7rem 1.15rem',
  borderRadius: 10,
};

export default function CaseReviewConfirmedPage() {
  // Keep this post-purchase page out of search indexes; restore on unmount so
  // the tag never leaks onto the next SPA route.
  useEffect(() => {
    const prior = document.querySelector('meta[name="robots"]');
    const priorContent = prior ? prior.getAttribute('content') : null;
    let tag = prior;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (priorContent !== null) {
        tag.setAttribute('content', priorContent);
      } else if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    };
  }, []);

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      {/* ---- Warm confirmation ---- */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={KICKER}>
          <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} aria-hidden />
          Reserved
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)', margin: '0.6rem auto 0.5rem', color: 'var(--ink, #121110)', maxWidth: '22ch', lineHeight: 1.15 }}>
          Joel has your case.
        </h1>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '54ch', margin: '0 auto' }}>
          Thank you for trusting him with it. Your written review, {CASE_REVIEW.name}, arrives within
          2 business days of Joel receiving your details below. Plain language, your exact next moves,
          ready to bring to your doctor.
        </p>
      </div>

      {/* ---- What to send (the one action) ---- */}
      <div style={{ ...CARD, borderTop: '4px solid var(--clay, #B85A36)' }}>
        <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', color: 'var(--ink, #121110)', fontWeight: 700 }}>
          <Mail size={18} strokeWidth={2} aria-hidden /> One thing to do right now
        </span>
        <p style={{ margin: '0.6rem 0 0.75rem', color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6 }}>
          Check your inbox for your purchase confirmation email and reply to it with:
        </p>
        <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', color: 'var(--ink, #121110)', lineHeight: 1.7, fontSize: '0.95rem' }}>
          <li>Your last two blood pressure readings, with the date and time of day</li>
          <li>Your current medication list, names and doses, straight off the bottles</li>
          <li>One or two lines on what you have already tried and where you keep getting stuck</li>
        </ul>
        <p style={{ ...SMALL, margin: 0 }}>
          That reply is what starts the clock. The more plainly you write it, the better Joel can read
          your case. If you cannot find the email, check spam for a message from Joel Polley, RN.
        </p>
      </div>

      {/* ---- Skool trial card ---- */}
      <div style={{ ...CARD, borderTop: '4px solid var(--sage, #4A5D4E)' }}>
        <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', color: 'var(--sage-deep, #2E3A30)', fontWeight: 600 }}>
          <Users size={18} strokeWidth={2} aria-hidden /> While you wait
        </span>
        <p style={{ margin: '0.5rem 0 0.9rem', color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6 }}>
          Your purchase includes a 7-day free trial of the Weekly Reset community. Wednesday nights,
          live with Joel, RN. It is a good room to sit in while your review is being written.
        </p>
        <a href={SKOOL_TRIAL_URL} style={BTN_CLAY} target="_blank" rel="noopener">
          Start your free trial
          <ArrowRight size={17} strokeWidth={2} />
        </a>
      </div>

      {/* ---- Soft bridge onward (no price, no pressure) ---- */}
      <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', maxWidth: '58ch', margin: '1.5rem auto 0', textAlign: 'center' }}>
        And after your review lands: if you read it and find yourself wanting Joel closer for the next
        90 days, just reply to that same email and ask about the group. No pressure either way. The
        review stands on its own.
      </p>

      {/* ---- Compliance spine ---- */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '1.75rem 0 0' }}>
        <Stethoscope size={18} strokeWidth={1.9} style={{ color: 'var(--sage, #4A5D4E)', flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ ...SMALL, margin: 0 }}>
          Your review is education and lifestyle support, not medical advice, diagnosis, or treatment.
          Bring it to your own doctor; they make every call about your medication. See our{' '}
          <Link to="/terms" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--clay, #B85A36)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}
