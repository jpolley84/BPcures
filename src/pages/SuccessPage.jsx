import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Download, ArrowRight } from 'lucide-react';
import DownloadsSection from '../components/DownloadsSection';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();

  // Meta Pixel Purchase event — closes the attribution loop for ads.
  // Value/currency are static $17 baseline; if the buyer took the $30 OTO
  // upsell, the success URL carries ?upsell=accepted so we boost the value.
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.fbq) return;
      const upsellAccepted = searchParams.get('upsell') === 'accepted';
      const purchaseValue = upsellAccepted ? 47.00 : 17.00;
      window.fbq('track', 'Purchase', { value: purchaseValue, currency: 'USD' });
    } catch { /* pixel errors never block UX */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', padding: '3rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 640, width: '100%', textAlign: 'center', margin: '0 auto' }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1.2, 0.3, 1] }}
          style={{
            width: 72, height: 72, margin: '0 auto 2rem',
            borderRadius: '50%',
            background: 'var(--sage-soft)',
            border: '1px solid var(--sage)',
            display: 'grid', placeItems: 'center',
          }}
        >
          <Check size={32} style={{ color: 'var(--sage-deep)' }} />
        </motion.div>

        <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Order complete</span>

        <h1 className="display-l" style={{ margin: '1.5rem 0 1rem' }}>
          You just did something <em className="ital-display" style={{ color: 'var(--clay)' }}>most people never do.</em>
        </h1>

        <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 auto 1rem', maxWidth: '52ch' }}>
          You took your health into your own hands. That matters more than any single herb or protocol.
        </p>

        <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: '0 auto 1.5rem', maxWidth: '48ch' }}>
          Your protocol kit, 30-day challenge enrollment, and Skool community access are all on their way to your inbox. Check your email — everything you need is inside.
        </p>

        {/* 2026-05-20: inline downloads — customers report not getting confirmation emails.
            Show files immediately on the page so they never have to wait. */}
        <DownloadsSection title="Your files — download now" />

        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 auto 2rem', maxWidth: '44ch' }}>
          A copy of these links is also being emailed to you from Joel Polley, RN. If you don't see it within 5 minutes, check your spam or promotions folder.
        </p>

        <Link to="/library" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'var(--clay, #B85A36)',
          color: 'var(--cream, #FBF8F1)',
          padding: '1rem 2rem',
          borderRadius: 12,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1.05rem',
          letterSpacing: '0.02em',
          marginBottom: '1rem',
        }}>
          <Download size={18} />
          Get your downloads
          <ArrowRight size={16} />
        </Link>

        <div>
          <Link to="/" className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Return home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
