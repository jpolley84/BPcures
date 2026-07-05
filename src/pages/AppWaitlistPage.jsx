// /waitlist — BraveWorks BP iPhone-app waitlist.
//
// Standalone page (no SiteLayout, like the other conversion pages): one job,
// capture the email above the fold. POSTs to /api/app-waitlist which returns
// a real position-in-line number; the success state shows it. The form
// renders twice (hero + bottom band) off ONE shared state so both flip to
// the success card together.
//
// Design: editorial-apothecary tokens from src/index.css (paper/ink/clay,
// Fraunces + Inter + JetBrains Mono). CSS-only entrance motion, honored
// prefers-reduced-motion. Phone preview is a real mini component with
// sample data, labeled as such. No health claims anywhere on this page
// (NEWSTART Lens 2 ship gate): the app logs, charts, and reports. It never
// promises outcomes.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { track, identify } from '../utils/analytics';

const SPARK_POINTS = '4,34 22,28 40,31 58,24 76,27 94,20 112,23 130,16 148,19';

function PhonePreview() {
  return (
    <div className="wl-phone-wrap" aria-hidden="true">
      <div className="wl-phone">
        <div className="wl-screen">
          <div className="wl-screen-top">
            <span className="wl-screen-brand">BraveWorks BP</span>
            <span className="wl-screen-date">Today</span>
          </div>
          <div className="wl-reading">
            <span className="wl-reading-num">118<span className="wl-reading-slash">/</span>76</span>
            <span className="wl-reading-meta">PULSE 64</span>
          </div>
          <div className="wl-chart">
            <svg viewBox="0 0 152 40" preserveAspectRatio="none">
              <polyline
                className="wl-spark"
                points={SPARK_POINTS}
                fill="none"
                stroke="var(--clay)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="wl-chart-label">Last 30 days</div>
          </div>
          <div className="wl-rows">
            <div className="wl-row"><span>Fri 7:05 am</span><span>122/79</span></div>
            <div className="wl-row"><span>Thu 7:12 am</span><span>125/81</span></div>
          </div>
          <div className="wl-report-btn">Doctor Report</div>
        </div>
      </div>
      <p className="wl-phone-caption">App preview. Sample readings.</p>
    </div>
  );
}

function WaitlistForm({ id, email, setEmail, status, position, already, onSubmit, error }) {
  if (status === 'done') {
    return (
      <div className="wl-success" role="status">
        <p className="wl-success-line">
          {already ? `You're already on the list. Spot #${position}.` : `You're in. Spot #${position}.`}
        </p>
        <p className="wl-success-sub">
          Check your inbox for your confirmation. You'll hear from me the day the app goes live.
        </p>
      </div>
    );
  }
  return (
    <form className="wl-form" onSubmit={onSubmit} noValidate>
      <label className="wl-label" htmlFor={`wl-email-${id}`}>Email address</label>
      <div className="wl-form-row">
        <input
          id={`wl-email-${id}`}
          className="wl-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="wl-btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Saving your spot…' : 'Join the waitlist'}
        </button>
      </div>
      {error && <p className="wl-error" role="alert">{error}</p>}
      <p className="wl-microcopy">
        One email at launch. A couple while you wait. Unsubscribe anytime.
      </p>
    </form>
  );
}

export default function AppWaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null);
  const [already, setAlready] = useState(false);

  useEffect(() => {
    document.title = 'BraveWorks BP iPhone App · Join the Waitlist | BPQuiz.com';
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) {
      meta.setAttribute('content',
        'BraveWorks BP: log your blood pressure in seconds, see your 30-day pattern, and bring your doctor a one-page report. Free on iPhone. Join the waitlist.');
    }
    track('waitlist_viewed');
    return () => { if (meta && prev !== null) meta.setAttribute('content', prev); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('That email doesn’t look right. Check it and try again.');
      return;
    }
    setStatus('sending');
    try {
      const utm = new URLSearchParams(window.location.search);
      const res = await fetch('/api/app-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: utm.get('utm_source') ? `waitlist-${utm.get('utm_source')}` : 'waitlist-page',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `signup ${res.status}`);
      setPosition(data.position);
      setAlready(Boolean(data.already));
      setStatus('done');
      identify(email.trim(), { source: 'app-waitlist' });
      track('waitlist_joined', { position: data.position, already: Boolean(data.already) });
    } catch (err) {
      setStatus('idle');
      setError(typeof err?.message === 'string' && err.message.length < 120 && !err.message.startsWith('signup')
        ? err.message
        : 'That didn’t go through. Give it another try in a few seconds.');
    }
  }

  const formProps = { email, setEmail, status, position, already, onSubmit: handleSubmit, error };

  return (
    <div className="wl-page">
      <style>{waitlistCss}</style>

      <header className="wl-header">
        <Link to="/" className="wl-wordmark">BPQuiz.com</Link>
        <span className="wl-header-note">by Joel Polley, RN</span>
      </header>

      <main>
        {/* ── Hero: the one job. Form is above the fold on every viewport. ── */}
        <section className="wl-hero">
          <div className="wl-hero-copy">
            <p className="wl-eyebrow">BraveWorks BP · iPhone app · launching soon</p>
            <h1 className="wl-h1">Know your numbers. Show your doctor.</h1>
            <p className="wl-sub">
              Log your pressure in seconds, see your 30-day pattern, and hand your
              doctor a one-page report. Free on iPhone.
            </p>
            <WaitlistForm id="hero" {...formProps} />
          </div>
          <PhonePreview />
        </section>

        {/* ── Proof: who built it. ── */}
        <section className="wl-proof">
          <img
            className="wl-proof-photo"
            src="/headshot.webp"
            alt="Joel Polley, RN"
            width="72"
            height="72"
            loading="lazy"
          />
          <p className="wl-proof-text">
            Built by <strong>Joel Polley, RN</strong>, 20 years in the ICU.
            More than 400,000 people follow his plain-language blood pressure
            teaching on TikTok and Facebook.
          </p>
        </section>

        {/* ── What it does: three rows, typography does the work. ── */}
        <section className="wl-features">
          <h2 className="wl-h2">What it does</h2>
          <div className="wl-feature">
            <h3 className="wl-h3">Log a reading in seconds</h3>
            <p>Systolic, diastolic, pulse. Two taps and it's saved. No account to make, nothing to set up.</p>
          </div>
          <div className="wl-feature">
            <h3 className="wl-h3">See your pattern, not just today's number</h3>
            <p>One reading can scare you. Thirty days on a chart tells you what's actually going on.</p>
          </div>
          <div className="wl-feature">
            <h3 className="wl-h3">One tap makes the Doctor Report</h3>
            <p>A clean one-page PDF of your readings to print, email, or hand over at your next appointment.</p>
          </div>
        </section>

        {/* ── Privacy: the differentiator, stated plainly. ── */}
        <section className="wl-privacy">
          <h2 className="wl-h2">Everything stays on your phone</h2>
          <p>
            No account. No cloud. Your readings never leave your pocket unless
            you choose to share them. And there's a "Clear my data" button in
            Settings that wipes it all.
          </p>
        </section>

        {/* ── Quick answers ── */}
        <section className="wl-faq">
          <h2 className="wl-h2">Quick answers</h2>
          <dl>
            <dt>When does it come out?</dt>
            <dd>It's in final review for the App Store. Waitlist members get the email the day it's live.</dd>
            <dt>What does it cost?</dt>
            <dd>Nothing. The app is free.</dd>
            <dt>Does it replace my doctor or my medication?</dt>
            <dd>No. It's a tracking and reporting tool you use alongside your doctor, never instead of one.</dd>
          </dl>
        </section>

        {/* ── Bottom band: same ask, same label. ── */}
        <section className="wl-bottom">
          <h2 className="wl-h2 wl-bottom-h2">Get your number in line</h2>
          <WaitlistForm id="bottom" {...formProps} />
        </section>
      </main>

      <footer className="wl-footer">
        <p className="wl-disclaimer">
          BraveWorks BP is an educational tracking tool. It does not diagnose or
          treat anything. Use it alongside your doctor, never instead of one.
        </p>
        <nav className="wl-footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </nav>
        <p className="wl-copyright">© 2026 BraveWorks RN</p>
      </footer>
    </div>
  );
}

const waitlistCss = `
.wl-page {
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}
.wl-page main { flex: 1; }
.wl-page section { padding-inline: clamp(1.25rem, 5vw, 3rem); }

/* Header */
.wl-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 1.1rem clamp(1.25rem, 5vw, 3rem);
  border-bottom: 1px solid var(--line-soft);
}
.wl-wordmark {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
}
.wl-header-note { font-size: var(--step--1); color: var(--ink-soft); }

/* Hero */
.wl-hero {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
  padding-block: clamp(2.25rem, 6vh, 4.5rem);
}
.wl-eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--clay);
  margin: 0 0 1rem;
}
.wl-h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(2.1rem, 1.4rem + 3.2vw, 3.6rem);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.05;
  margin: 0 0 1rem;
  text-wrap: balance;
}
.wl-sub {
  font-size: var(--step-1);
  line-height: 1.55;
  color: var(--ink-soft);
  max-width: 34ch;
  margin: 0 0 1.75rem;
  text-wrap: pretty;
}

/* Form */
.wl-label {
  display: block;
  font-size: var(--step--1);
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 0.4rem;
}
.wl-form-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.wl-input {
  flex: 1 1 220px;
  font: inherit;
  font-size: 1rem;
  padding: 0.85rem 1rem;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: #FFFFFF;
  color: var(--ink);
  min-height: 48px;
}
.wl-input::placeholder { color: #8A8175; }
.wl-input:focus-visible {
  outline: 2px solid var(--clay);
  outline-offset: 1px;
  border-color: var(--clay);
}
.wl-btn {
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.85rem 1.5rem;
  min-height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--clay);
  color: #FFFFFF;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s var(--ease-out), transform 0.12s var(--ease-out);
}
.wl-btn:hover { background: var(--clay-hover); }
.wl-btn:active { transform: translateY(1px); }
.wl-btn:disabled { opacity: 0.7; cursor: default; }
.wl-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.wl-error { color: #9A2B22; font-size: var(--step--1); margin: 0.5rem 0 0; }
.wl-microcopy { color: var(--ink-soft); font-size: var(--step--1); margin: 0.7rem 0 0; }
.wl-success {
  background: #FFFFFF;
  border: 1.5px solid var(--sage);
  border-radius: 14px;
  padding: 1.2rem 1.3rem;
}
.wl-success-line {
  font-family: 'Fraunces', Georgia, serif;
  font-size: var(--step-2);
  margin: 0 0 0.35rem;
}
.wl-success-sub { margin: 0; color: var(--ink-soft); font-size: var(--step-0); }

/* Phone preview */
.wl-phone-wrap { justify-self: center; }
.wl-phone {
  width: min(240px, 62vw);
  background: var(--ink);
  border-radius: 34px;
  padding: 12px;
  box-shadow: 0 24px 48px -20px rgba(43, 40, 36, 0.45);
}
.wl-screen {
  background: var(--cream);
  border-radius: 24px;
  padding: 1rem 0.9rem 1.1rem;
}
.wl-screen-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.9rem;
}
.wl-screen-brand {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.8rem;
  font-weight: 600;
}
.wl-screen-date {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.wl-reading { display: flex; flex-direction: column; margin-bottom: 0.8rem; }
.wl-reading-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.wl-reading-slash { color: var(--clay); }
.wl-reading-meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.wl-chart {
  background: #FFFFFF;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.55rem 0.55rem 0.4rem;
  margin-bottom: 0.7rem;
}
.wl-chart svg { display: block; width: 100%; height: 40px; }
.wl-spark {
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  animation: wl-draw 1.4s var(--ease-out) 0.5s forwards;
}
.wl-chart-label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 0.3rem;
}
.wl-rows { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.8rem; }
.wl-row {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.62rem;
  color: var(--ink-soft);
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 0.35rem;
}
.wl-report-btn {
  background: var(--clay);
  color: #FFFFFF;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.5rem;
}
.wl-phone-caption {
  text-align: center;
  font-size: 0.72rem;
  color: var(--muted);
  margin: 0.7rem 0 0;
}

/* Proof strip */
.wl-proof {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  max-width: 1100px;
  margin: 0 auto;
  padding-block: 1.6rem;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}
.wl-proof-photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.wl-proof-text { margin: 0; max-width: 52ch; color: var(--ink-soft); font-size: var(--step-0); }

/* Features */
.wl-features { max-width: 720px; margin: 0 auto; padding-block: clamp(2.5rem, 7vh, 4.5rem); }
.wl-h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: var(--step-3);
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0 0 1.6rem;
  text-wrap: balance;
}
.wl-feature { padding-block: 1.3rem; border-top: 1px solid var(--line-soft); }
.wl-feature:last-child { border-bottom: 1px solid var(--line-soft); }
.wl-h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: var(--step-2);
  font-weight: 500;
  margin: 0 0 0.4rem;
}
.wl-feature p { margin: 0; color: var(--ink-soft); max-width: 58ch; }

/* Privacy band */
.wl-privacy {
  background: var(--paper-warm);
  padding-block: clamp(2.25rem, 6vh, 3.5rem);
}
.wl-privacy h2, .wl-privacy p { max-width: 720px; margin-inline: auto; }
.wl-privacy h2 { margin-bottom: 0.8rem; }
.wl-privacy p { color: var(--ink-soft); max-width: 58ch; margin-left: auto; margin-right: auto; }

/* FAQ */
.wl-faq { max-width: 720px; margin: 0 auto; padding-block: clamp(2.5rem, 7vh, 4rem); }
.wl-faq dl { margin: 0; }
.wl-faq dt { font-weight: 600; margin-top: 1.1rem; }
.wl-faq dd { margin: 0.3rem 0 0; color: var(--ink-soft); max-width: 58ch; }

/* Bottom band */
.wl-bottom {
  background: var(--paper-deep);
  padding-block: clamp(2.5rem, 7vh, 4rem);
}
.wl-bottom > * { max-width: 620px; margin-inline: auto; }
.wl-bottom-h2 { margin-bottom: 1.2rem; text-align: left; }

/* Footer */
.wl-footer {
  border-top: 1px solid var(--line-soft);
  padding: 1.6rem clamp(1.25rem, 5vw, 3rem) 2rem;
  font-size: var(--step--1);
  color: var(--ink-soft);
}
.wl-disclaimer { max-width: 62ch; margin: 0 0 0.8rem; }
.wl-footer-links { display: flex; gap: 1.2rem; margin-bottom: 0.6rem; }
.wl-footer-links a { color: var(--ink-soft); }
.wl-copyright { margin: 0; color: var(--muted); }

/* Entrance motion: staggered rise on the hero only. */
@keyframes wl-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes wl-draw { to { stroke-dashoffset: 0; } }
.wl-hero-copy > * { animation: wl-rise 0.7s var(--ease-out) both; }
.wl-hero-copy > *:nth-child(1) { animation-delay: 0.05s; }
.wl-hero-copy > *:nth-child(2) { animation-delay: 0.14s; }
.wl-hero-copy > *:nth-child(3) { animation-delay: 0.23s; }
.wl-hero-copy > *:nth-child(4) { animation-delay: 0.32s; }
.wl-phone-wrap { animation: wl-rise 0.8s var(--ease-out) 0.3s both; }

@media (prefers-reduced-motion: reduce) {
  .wl-hero-copy > *, .wl-phone-wrap { animation: none; }
  .wl-spark { animation: none; stroke-dashoffset: 0; }
  .wl-btn { transition: none; }
}

/* Mobile: stack, form stays first (above the fold). */
@media (max-width: 760px) {
  .wl-hero { grid-template-columns: 1fr; padding-block: 1.75rem 2.5rem; }
  .wl-phone-wrap { margin-top: 0.5rem; }
  .wl-proof { flex-direction: row; }
  .wl-form-row { flex-direction: column; }
  .wl-btn { width: 100%; }
}
`;
