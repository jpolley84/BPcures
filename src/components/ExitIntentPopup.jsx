import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Check, BookOpen } from 'lucide-react';

// Exit-intent / dwell popup. Variant A of the homepage sells the $17 kit hard;
// this is the soft landing for a visitor about to bounce. Instead of asking for
// the sale again, it offers the FREE 101 Foods and Herbs guide (the same lead
// magnet variant B leads with), which captures the email and drops the visitor
// into the nurture sequence that sells the $17 kit later. Same-tab navigation to
// /101foods (the guide opt-in). Fresh localStorage key so visitors who saw the
// prior quiz popup still get this one once.
const GUIDE_URL = '/101foods?utm_source=exit_intent&utm_medium=popup&utm_campaign=foods101';
const POPUP_KEY = 'foodsGuideExitPopupShown';

const STACK = [
  '101 everyday foods, kitchen herbs, and caffeine free teas',
  'Grouped so you know exactly what goes in the cart this week',
  'From a nurse, free, in your inbox in about a minute',
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

  const goToGuide = () => {
    window.location.href = GUIDE_URL;
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
                <BookOpen size={30} style={{ color: 'var(--clay)' }} />
              </div>

              <span className="kicker kicker-dot" style={{ color: 'var(--clay)' }}>Before you go</span>

              <h2 className="display-s" style={{ marginTop: '0.6rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                Get the free <em className="ital-display" style={{ color: 'var(--clay)' }}>101</em> Foods &amp; Herbs guide
              </h2>

              <p style={{
                color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5,
                marginBottom: '1.1rem', maxWidth: '34ch', marginInline: 'auto',
              }}>
                The plant foods, kitchen herbs, and caffeine free teas a nurse would point to first for steadier blood pressure. Yours free, nothing to buy.
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
                  <strong>100% free.</strong><br />
                  In your inbox in about a minute.
                </p>
              </div>

              <button
                onClick={goToGuide}
                className="btn btn-ink"
                style={{ width: '100%', fontSize: '1.05rem', padding: '1rem 1.5rem' }}
              >
                Send me the free guide
                <ArrowRight size={18} className="arrow" />
              </button>

              <p style={{
                fontSize: '0.75rem', color: 'var(--muted)',
                textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5,
              }}>
                Free and private. Education alongside your doctor, never instead.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
