import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, CalendarDays } from 'lucide-react';
import { fetchProducts, getProductBySlug } from '../utils/productLoader';

const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

export default function SuccessPage() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!slug) return;
    fetchProducts().then(products => {
      setProduct(getProductBySlug(products, slug));
    });
  }, [slug]);

  const isCoaching = product?.tier === 3;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', display: 'grid', placeItems: 'center', padding: '3rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}
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
          Thank you, <em className="ital-display" style={{ color: 'var(--clay)' }}>truly.</em>
        </h1>

        {isCoaching ? (
          <>
            <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 auto 2rem', maxWidth: '52ch' }}>
              Your receipt is on its way. Before you do anything else — join the Skool community. The 30-Day Challenge kicks off May 1.
            </p>
            <div style={{
              padding: '1.5rem',
              border: '1px solid var(--sage)',
              background: 'var(--sage-soft)',
              borderRadius: 16,
              marginBottom: '2rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', color: 'var(--sage-deep)' }}>
                <CalendarDays size={18} />
                <strong style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem' }}>Next step: join the Skool community</strong>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', margin: '0 0 1rem', lineHeight: 1.55 }}>
                The 30-Day Challenge starts May 1. Join the "How to Be Your Own Doctor" Skool community now to get oriented — weekly live group coaching begins on day one.
              </p>
              <a
                href={SKOOL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ink btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Join the Skool Community <ArrowRight size={16} className="arrow" />
              </a>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/downloads" className="btn btn-ghost btn-lg">
                View downloads
              </Link>
              <Link to="/" className="btn btn-ghost btn-lg">
                Return home
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 auto 2.5rem', maxWidth: '52ch' }}>
              Your receipt is on its way to your inbox. Your downloads are ready now — everything arrives instantly, nothing ships.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/downloads" className="btn btn-ink btn-lg">
                View downloads <ArrowRight size={16} className="arrow" />
              </Link>
              <Link to="/" className="btn btn-ghost btn-lg">
                Return home
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  );
}
