import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Check } from 'lucide-react';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const hasShown = localStorage.getItem('cookbookPopupShown');
    if (hasShown === 'true') return;
    if (localStorage.getItem('purchaseCompleted') === 'true') return;

    const onLeave = e => {
      if (localStorage.getItem('cookbookPopupShown') === 'true') return;
      if (e.clientY <= 0) {
        setVisible(true);
        localStorage.setItem('cookbookPopupShown', 'true');
      }
    };
    const timer = setTimeout(() => {
      if (localStorage.getItem('cookbookPopupShown') !== 'true') {
        setVisible(true);
        localStorage.setItem('cookbookPopupShown', 'true');
      }
    }, 14000);

    document.addEventListener('mouseleave', onLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const close = () => setVisible(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

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

            {!done ? (
              <>
                <span className="kicker kicker-dot">Free · For readers</span>
                <h2 className="display-s" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  The <em className="ital-display" style={{ color: 'var(--clay)' }}>Cook For Life</em> Cookbook
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                  45+ plant-forward recipes built around blood-pressure herbs, a 14-day meal plan, and a 4-day reset — from a nurse who's spent two decades watching what works.
                </p>

                <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
                  <input
                    type="email"
                    placeholder="your.email@domain.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.95rem 1.1rem',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      background: 'var(--paper)',
                      fontSize: '0.95rem',
                    }}
                  />
                  {error && <p style={{ color: 'var(--clay)', fontSize: '0.82rem' }}>{error}</p>}
                  <button type="submit" className="btn btn-ink" disabled={loading}>
                    {loading ? 'Sending…' : 'Send the cookbook'}
                    <ArrowRight size={16} className="arrow" />
                  </button>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    Delivered instantly · No spam · Unsubscribe anytime
                  </p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingBlock: '1rem' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 1.5rem',
                  borderRadius: '50%', background: 'var(--sage-soft)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Check size={26} style={{ color: 'var(--sage-deep)' }} />
                </div>
                <h2 className="display-s" style={{ marginBottom: '0.5rem' }}>
                  Check your inbox.
                </h2>
                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                  Your Cook For Life cookbook is on its way.
                </p>
                <button onClick={close} className="btn btn-ghost">Close</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
