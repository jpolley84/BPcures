import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className={`nav-root${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={close}>
          <span className="nav-mark" aria-hidden="true">B</span>
          <span className="nav-wordmark">
            <span className="name">BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.15em', color: 'var(--clay)' }}>RN</span></span>
            <span className="sub">Joel Polley · Reg. Nurse</span>
          </span>
        </Link>

        <div className="nav-links">
          <NavLink end to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Assessment
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Apothecary
          </NavLink>
          <NavLink to="/learn" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Journal
          </NavLink>
          <a href="https://www.skool.com/how-to-be-your-own-doctor-8010/about" target="_blank" rel="noopener noreferrer" className="nav-link">
            Community
          </a>
        </div>

        <div className="nav-actions">
          <Link to="/" className="btn btn-ink btn-sm" onClick={close} style={{ display: 'none' }}>
            Begin <ArrowUpRight size={14} className="arrow" />
          </Link>
          <Link to="/shop" className="btn btn-ghost btn-sm hidden-mobile" onClick={close}>
            Shop
          </Link>
          <Link to="/" className="btn btn-ink btn-sm hidden-mobile" onClick={close}>
            Take assessment
            <ArrowUpRight size={14} className="arrow" />
          </Link>
          <button
            className="nav-hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <Link to="/" onClick={close}>
              <span>Assessment</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/shop" onClick={close}>
              <span>Apothecary</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/learn" onClick={close}>
              <span>Journal</span>
              <ArrowUpRight size={18} />
            </Link>
            <a href="https://www.skool.com/how-to-be-your-own-doctor-8010/about" target="_blank" rel="noopener noreferrer" onClick={close}>
              <span>Community</span>
              <ArrowUpRight size={18} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: none; }
        @media (min-width: 640px) { .hidden-mobile { display: inline-flex; } }
      `}</style>
    </nav>
  );
}
