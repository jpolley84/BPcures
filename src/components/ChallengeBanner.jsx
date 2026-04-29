import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mail } from 'lucide-react';

export default function ChallengeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/challenge-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to sign up');
      }

      setSubmitted(true);
      setEmail('');
      setName('');
    } catch (err) {
      setError('Unable to sign up. Please try again.');
      console.error('Challenge signup error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="challenge-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="challenge-banner-inner">
            <button
              className="challenge-banner-close"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>

            <div className="challenge-banner-content">
              <div className="challenge-banner-badge">
                <span className="challenge-banner-pulse" />
                FREE 30-DAY CHALLENGE &middot; STARTS MAY 1
              </div>

              <h2 className="challenge-banner-headline">
                The Pressure Triangle
              </h2>

              <p className="challenge-banner-sub">
                Blood pressure. Cortisol. Blood sugar. They're not three problems &mdash; they're three corners of the same loop.
                One email a day. One protocol. One body. No card. No upsell wall.
              </p>

              {!submitted ? (
                <form className="challenge-banner-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="First name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="challenge-banner-input"
                    style={{ flex: '0 0 auto', maxWidth: '160px' }}
                  />
                  <div className="challenge-banner-input-wrap">
                    <Mail size={16} className="challenge-banner-input-icon" />
                    <input
                      type="email"
                      placeholder="Your email — we'll save your spot"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="challenge-banner-input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="challenge-banner-cta"
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join the Challenge'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              ) : (
                <motion.div
                  className="challenge-banner-confirmed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  You're in! Friday 8 AM EST &mdash; watch your inbox.
                </motion.div>
              )}

              {error && (
                <motion.p
                  className="challenge-banner-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              <p className="challenge-banner-proof">
                Joel Polley, RN &mdash; 20 years ICU &amp; Emergency &middot; Free. No card required.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
