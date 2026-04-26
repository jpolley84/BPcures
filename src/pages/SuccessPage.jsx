import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SuccessPage() {
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

        <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 auto 1.5rem', maxWidth: '52ch' }}>
          Your protocol kit is on its way to your inbox. Check your email — everything you need is inside, including your downloads and next steps.
        </p>

        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 auto 2.5rem', maxWidth: '44ch' }}>
          Don't see it? Check your spam or promotions folder. It comes from Joel Polley, RN.
        </p>

        <Link to="/" className="btn btn-ghost btn-lg">
          Return home
        </Link>
      </motion.div>
    </main>
  );
}
