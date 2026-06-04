import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Check, Activity } from 'lucide-react';

// Mini offer stack for the Skool community (The 30-Day Pressure Reset).
// Button opens the community in a NEW tab/window. Fresh localStorage key so
// returning visitors who dismissed the old quiz popup still see this one once.
const SKOOL_URL = 'https://www.skool.com/braveworksrn';
const POPUP_KEY = 'skoolOfferPopupShown';

const STACK = [
  'Weekly live group coaching with Joel, RN',
  'All 3 ten-day Resets: blood pressure, stress, blood sugar',
  'The full BraveWorks ebook library, always growing',
  'The Win Wall, a group working on it right beside you',
];

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(POPUP_KEY) === 'true') return;
    if (localStorage.getItem('purchaseCompleted') === 'true') return;

    const show = () => {
      if (localStorage.getItem(POPUP_KEY) === 'true') return;
      setVisible(true);
      localStorage.setItem(POPUP_KEY, 'true');
    };
    const onLeave = e => { if (e.clientY <= 0) show(); };
    const timer = setTimeout(show, 14000);

    document.addEventListener('mouseleave', onLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const close = () => setVisible(false);

  const joinSkool = () => {
    window.open(SKOOL_URL, '_blank', 'noopener,noreferrer');
    close();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={close}
        >
          <motion.div
            className="popup-card"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button className="popup-close" onClick={close} aria-label="Close">
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, margin: '0 auto 1rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--sage-soft) 0%, var(--clay-soft, #f4e8e1) 100%)',
                display: 'grid', placeItems: 'center',
              }}>
                <Activity size={30} style={{ color: 'var(--clay)' }} />
              </div>

              <span className="kicker kicker-dot" style={{ color: 'var(--clay)' }}>Nurse-led group coaching</span>

              <h2 className="display-s" style={{ marginTop: '0.6rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                The <em className="ital-display" style={{ color: 'var(--clay)' }}>30-Day Pressure Reset</em>
              </h2>

              <p style={{
                color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5,
                marginBottom: '1.1rem', maxWidth: '34ch', marginInline: 'auto',
              }}>
                A nurse and a group in your corner, helping you move your numbers one small step a day.
              </p>

              <ul style={{
                textAlign: 'left', listStyle: 'none', padding: 0,
                margin: '0 auto 1.1rem', maxWidth: '34ch',
                display: 'grid', gap: '0.55rem',
              }}>
                {STACK.map(item => (
                  <li key={item} style={{
                    display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                    fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--ink)',
                  }}>
                    <Check size={16} style={{ color: 'var(--sage-deep)', flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div style={{
                background: 'var(--paper-warm)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.1rem',
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                  <strong>$700+ of help for just $27 a month.</strong><br />
                  Your first 7 days are free.
                </p>
              </div>

              <button
                onClick={joinSkool}
                className="btn btn-ink"
                style={{ width: '100%', fontSize: '1.05rem', padding: '1rem 1.5rem' }}
              >
                Start free for 7 days
                <ArrowRight size={18} className="arrow" />
              </button>

              <p style={{
                fontSize: '0.75rem', color: 'var(--muted)',
                textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5,
              }}>
                Feel a difference in 30 days or your money back. AND not instead of your doctor.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
