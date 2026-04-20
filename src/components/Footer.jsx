import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => null);
    } finally {
      setStatus('done');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const year = new Date().getFullYear();

  return (
    <footer className="footer-root">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-newsletter">
            <span className="kicker" style={{ color: 'rgba(247, 243, 236, 0.55)' }}>The Journal</span>
            <h3>Quieter mornings. Clearer numbers. Written by a nurse.</h3>
            <p>Essays, protocols, and the occasional herb deep-dive. One email a week. No hype.</p>

            {status === 'done' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--clay-soft)', fontSize: '0.95rem' }}>
                <Check size={18} /> You're on the list.
              </div>
            ) : (
              <form className="newsletter-form" onSubmit={submit}>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
                  aria-label="Email address"
                />
                <button type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending' : 'Subscribe'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
            {status === 'error' && (
              <p style={{ color: 'var(--clay-soft)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                Please enter a valid email.
              </p>
            )}
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Health assessment</Link></li>
              <li><Link to="/shop">Apothecary</Link></li>
              <li><Link to="/shop?category=blood_pressure">Blood pressure</Link></li>
              <li><Link to="/shop?category=cortisol">Cortisol &amp; stress</Link></li>
              <li><Link to="/shop?category=blood_sugar">Blood sugar</Link></li>
              <li><Link to="/learn">Journal</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Follow</h4>
            <ul>
              <li>
                <a href="https://tiktok.com/@braveworksrn" target="_blank" rel="noopener noreferrer">
                  TikTok · @braveworksrn
                </a>
              </li>
              <li>
                <a href="https://instagram.com/braveworksrn" target="_blank" rel="noopener noreferrer">
                  Instagram · @braveworksrn
                </a>
              </li>
              <li>
                <a href="https://www.skool.com/how-to-be-your-own-doctor" target="_blank" rel="noopener noreferrer">
                  Skool · How to Be Your Own Doctor
                </a>
              </li>
              <li>
                <a href="mailto:hello@braveworksrn.com">hello@braveworksrn.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-fine">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>© {year} BraveWorks Health, LLC</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Joel Polley, RN · 20 yrs ICU &amp; ER</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/disclaimer">Disclaimer</a>
          </div>
        </div>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.72rem',
          lineHeight: 1.6,
          color: 'rgba(247, 243, 236, 0.4)',
          maxWidth: '72ch',
          position: 'relative',
          zIndex: 2,
        }}>
          Educational content only. Nothing on this site is medical advice, diagnosis, or treatment.
          Consult your physician before making changes to medications, supplements, or your clinical protocol.
        </p>
      </div>
    </footer>
  );
}
