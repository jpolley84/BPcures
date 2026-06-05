import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav-root${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <span className="nav-mark" aria-hidden="true">B</span>
          <span className="nav-wordmark">
            <span className="name">BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.15em', color: 'var(--clay)' }}>RN</span></span>
            <span className="sub">Joel Polley · Reg. Nurse</span>
          </span>
        </Link>

        <div className="nav-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* 2026-06-04 — Skool 7-day trial CTA in header for the new $27/mo group coaching offer */}
          <a
            href="https://www.skool.com/braveworksrn/about"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-clay btn-sm"
            style={{
              background: 'var(--clay)',
              color: 'var(--cream)',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            Join Skool · 7-day free
            <ArrowUpRight size={14} className="arrow" />
          </a>
          <Link to="/" className="btn btn-ink btn-sm" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Take the assessment
            <ArrowUpRight size={14} className="arrow" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
