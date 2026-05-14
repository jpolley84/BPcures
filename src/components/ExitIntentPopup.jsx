import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Activity } from 'lucide-react';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem('quizPopupShown');
    if (hasShown === 'true') return;
    if (localStorage.getItem('purchaseCompleted') === 'true') return;

    const onLeave = e => {
      if (localStorage.getItem('quizPopupShown') === 'true') return;
      if (e.clientY <= 0) {
        setVisible(true);
        localStorage.setItem('quizPopupShown', 'true');
      }
    };
    const timer = setTimeout(() => {
      if (localStorage.getItem('quizPopupShown') !== 'true') {
        setVisible(true);
        localStorage.setItem('quizPopupShown', 'true');
      }
    }, 14000);

    document.addEventListener('mouseleave', onLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const close = () => setVisible(false);

  const takeQuiz = () => {
    close();
    window.location.href = '/quiz';
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
                width: 64, height: 64, margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--sage-soft) 0%, var(--clay-soft, #f4e8e1) 100%)',
                display: 'grid', placeItems: 'center',
              }}>
                <Activity size={30} style={{ color: 'var(--clay)' }} />
              </div>

              <span className="kicker kicker-dot" style={{ color: 'var(--clay)' }}>Free · 2-minute quiz</span>

              <h2 className="display-s" style={{ marginTop: '0.75rem', marginBottom: '0.75rem', lineHeight: 1.25 }}>
                Which corner of the<br />
                <em className="ital-display" style={{ color: 'var(--clay)' }}>BP Triangle</em> is yours?
              </h2>

              <p style={{
                color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6,
                marginBottom: '1.75rem', maxWidth: '28ch', marginInline: 'auto',
              }}>
                Vascular, cortisol, or blood sugar — find your root cause and get a personalized protocol.
              </p>

              <button
                onClick={takeQuiz}
                className="btn btn-ink"
                style={{ width: '100%', fontSize: '1.05rem', padding: '1rem 1.5rem' }}
              >
                Take the free quiz
                <ArrowRight size={18} className="arrow" />
              </button>

              <p style={{
                fontSize: '0.75rem', color: 'var(--muted)',
                textAlign: 'center', marginTop: '0.75rem',
              }}>
                No email required to start · Results in 2 minutes
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
