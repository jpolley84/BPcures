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

        <div className="nav-actions">
          <Link to="/" className="btn btn-ink btn-sm" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Take the assessment
            <ArrowUpRight size={14} className="arrow" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
