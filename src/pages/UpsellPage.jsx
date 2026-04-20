import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const STRIPE_BOOK_PRICE_ID = import.meta.env.VITE_STRIPE_BOOK_PRICE_ID;

export default function UpsellPage() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function addBook() {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_BOOK_PRICE_ID,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div style={{
        background: 'var(--sage-soft)',
        borderBottom: '1px solid var(--sage)',
        padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '0.65rem',
      }}>
        <Check size={18} style={{ color: 'var(--sage-deep)' }} />
        <span style={{ fontSize: '0.92rem', color: 'var(--sage-deep)', fontWeight: 500 }}>
          Your order is confirmed.
        </span>
      </div>

      <section className="section surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>
              One-time offer · Before you go
            </span>
            <h1 className="display-l" style={{ margin: '1.5rem auto 1rem', maxWidth: '18ch' }}>
              You have the protocol. Want <em className="ital-display" style={{ color: 'var(--clay)' }}>the book?</em>
            </h1>
            <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 auto 2.5rem', maxWidth: '54ch' }}>
              Overmedicated Boomers — the complete book on prescription overload, written for the generation nobody warned.
              Add it to your order for <strong style={{ color: 'var(--ink)' }}>$9 today only</strong> (normally $24.99).
            </p>

            <div style={{
              padding: 'clamp(1.75rem, 3vw, 2.5rem)',
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: 20,
              marginBottom: '2rem',
              textAlign: 'left',
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem' }}>
                {[
                  'How polypharmacy became an epidemic — and who profits.',
                  '12 most commonly over-prescribed drugs to seniors.',
                  'What to ask your doctor before adding a new prescription.',
                  'Safe tapering — with your doctor\'s guidance.',
                ].map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    <Check size={16} style={{ color: 'var(--sage-deep)', marginTop: '0.2rem', flexShrink: 0 }} />
                    <span style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <p style={{ color: 'var(--clay)', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={addBook} disabled={processing} className="btn btn-ink btn-lg">
                {processing ? 'Processing…' : 'Yes — add the book for $9'}
                <ArrowRight size={16} className="arrow" />
              </button>
              <Link to="/success" className="btn btn-ghost btn-lg">
                No thanks, take me to my downloads
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
