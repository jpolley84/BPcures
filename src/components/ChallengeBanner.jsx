import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mail } from 'lucide-react';

export default function ChallengeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.convertkit.com/v3/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          api_key: import.meta.env.VITE_CONVERTKIT_API_KEY,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign up');
      }

      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError('Unable to sign up. Please try again.');
      console.error('Convertkit signup error:', err);
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
                FREE &middot; STARTS MAY 1
              </div>

              <h2 className="challenge-banner-headline">
                The 30-Day Reset Challenge
              </h2>

              <p className="challenge-banner-sub">
                Blood pressure. Cortisol. Blood sugar. Weight.
                One nurse-designed protocol &mdash; delivered to your inbox daily.
                Free downloads. DIY at your own pace. No credit card.
              </p>

              {!submitted ? (
                <form className="challenge-banner-form" onSubmit={handleSubmit}>
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
                    {loading ? 'Joining...' : 'Join Free'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              ) : (
                <motion.div
                  className="challenge-banner-confirmed"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  You're in. Check your inbox May 1st.
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
                Designed by Joel Polley, RN &mdash; 20 years ICU &amp; Emergency Medicine
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
