import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, Check, ShieldCheck, Download, Clock, ArrowUpRight, ArrowLeft, CalendarDays,
} from 'lucide-react';
import { fetchProducts, getProductBySlug, getRelatedProducts } from '../utils/productLoader';
import ProductCard from '../components/ProductCard';

const CATEGORY_LABEL = {
  blood_pressure: 'Blood pressure',
  cortisol: 'Cortisol · Stress',
  blood_sugar: 'Blood sugar',
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setImgError(false);
    fetchProducts().then(products => {
      const p = getProductBySlug(products, slug);
      if (!p) setNotFound(true);
      else {
        setProduct(p);
        setRelated(getRelatedProducts(products, p));
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <section className="section surface-paper">
        <div className="shell" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <span className="kicker">Loading</span>
        </div>
      </section>
    );
  }

  if (notFound || !product) {
    return (
      <section className="section surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Not found</span>
          <h1 className="display-m" style={{ margin: '1rem 0' }}>This page has wandered off.</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>The protocol you're looking for doesn't exist, or was renamed.</p>
          <Link to="/shop" className="btn btn-ink">Back to the apothecary</Link>
        </div>
      </section>
    );
  }

  const isFree = product.price_cents === 0;
  const paymentLink = product.stripe_payment_link || product.gumroad_link;
  const monogram = (product.name || '').split(' ').slice(0, 2).map(w => w[0]).join('');

  return (
    <>
      {/* Breadcrumb + back */}
      <section className="surface-paper" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
        <div className="shell">
          <Link
            to="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: 'var(--muted)',
              letterSpacing: '0.06em',
            }}
          >
            <ArrowLeft size={14} /> Apothecary
          </Link>
        </div>
      </section>

      {/* Hero */}
      <section className="section surface-paper" style={{ paddingTop: '1rem' }}>
        <div className="shell">
          <div style={{
            display: 'grid',
            gap: 'clamp(2rem, 4vw, 4rem)',
            alignItems: 'start',
          }} className="pdpgrid">
            <style>{`
              @media (min-width: 860px) {
                .pdpgrid { grid-template-columns: 1fr 1.1fr !important; }
              }
            `}</style>

            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' }}
            >
              <div style={{
                aspectRatio: '4 / 5',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'var(--paper-warm)',
                border: '1px solid var(--line)',
                position: 'relative',
              }}>
                {product.cover_image && !imgError ? (
                  <img
                    src={product.cover_image}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                    color: 'var(--muted)',
                    opacity: 0.5,
                  }}>
                    {monogram}
                  </div>
                )}
                {product.badge && (
                  <span className="product-badge" style={{ top: '1.25rem', left: '1.25rem' }}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Meta strip */}
              <div style={{
                marginTop: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                fontSize: '0.82rem',
                color: 'var(--muted)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={14} /> Instant PDF
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> Daily plan
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={14} /> Nurse-designed
                </div>
              </div>
            </motion.div>

            {/* Right column: info + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="kicker kicker-dot">{CATEGORY_LABEL[product.category] ?? 'Protocol'}</span>
              <h1 className="display-l" style={{ margin: '0.75rem 0 0.75rem', lineHeight: 1.02 }}>
                {product.name}
              </h1>
              <p className="lede" style={{ color: 'var(--ink-soft)', margin: '0 0 1.5rem' }}>
                {product.headline}
              </p>

              {/* Rating */}
              {product.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)', marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--gold)' }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} fill={n <= Math.round(product.rating) ? 'currentColor' : 'none'} stroke="currentColor" />
                    ))}
                  </div>
                  <span className="tabular" style={{ fontSize: '0.88rem' }}>
                    {product.rating} · {product.review_count} readers
                  </span>
                </div>
              )}

              {/* Description */}
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.65, margin: '0 0 2rem', maxWidth: '60ch' }}>
                {product.description}
              </p>

              {/* Price + CTA */}
              <div style={{
                padding: '1.5rem 1.75rem',
                border: '1px solid var(--line)',
                borderRadius: 18,
                background: 'var(--cream)',
                marginBottom: '2rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 'clamp(1.75rem, 3vw, 2.2rem)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                  }}>
                    {isFree ? 'Free' : product.price}
                  </span>
                  {product.original_price && !isFree && (
                    <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '1rem' }}>
                      {product.original_price}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {paymentLink ? (
                    <a href={paymentLink} className="btn btn-ink btn-lg" style={{ flex: 1, minWidth: 200 }}>
                      {isFree ? 'Download free' : 'Secure checkout'}
                      <ArrowUpRight size={16} className="arrow" />
                    </a>
                  ) : (
                    <button className="btn btn-ghost btn-lg" disabled style={{ flex: 1 }}>
                      Coming soon
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={12} /> Instant delivery · Educational content · 30-day refund
                </p>
                {product.tier === 3 && (
                  <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--ink-soft)',
                    marginTop: '0.75rem',
                    padding: '0.75rem 0.9rem',
                    background: 'var(--sage-soft)',
                    border: '1px solid var(--sage)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    lineHeight: 1.45,
                  }}>
                    <CalendarDays size={14} style={{ color: 'var(--sage-deep)', marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>After purchase, join the "How to Be Your Own Doctor" Skool community — weekly live group coaching starts May 1.</span>
                  </p>
                )}
              </div>

              {/* Who it's for */}
              {product.who_for && (
                <div style={{ marginBottom: '2rem' }}>
                  <span className="eyebrow-num">Who it's for</span>
                  <p style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', maxWidth: '60ch' }}>
                    {product.who_for}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's inside */}
      {product.what_inside?.length > 0 && (
        <section className="section surface-warm">
          <div className="shell">
            <div className="section-label">
              <span className="num">Included</span>
              <span className="line" />
            </div>
            <h2 className="display-m" style={{ margin: '0 0 clamp(2rem, 4vw, 3rem)', maxWidth: '18ch' }}>
              Everything that ships with this <em className="ital-display" style={{ color: 'var(--clay)' }}>kit.</em>
            </h2>
            <ul className="ruled-list">
              {product.what_inside.map((item, i) => (
                <li key={i}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    {item}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Outcomes */}
      {product.outcomes?.length > 0 && (
        <section className="section surface-paper">
          <div className="shell">
            <div className="section-label">
              <span className="num">Expected outcomes</span>
              <span className="line" />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 'clamp(1rem, 2vw, 1.5rem)',
            }}>
              {product.outcomes.map((o, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    background: 'var(--cream)',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <Check size={18} style={{ color: 'var(--sage-deep)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: 1.5 }}>{o}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="section surface-warm">
          <div className="shell">
            <div className="section-label">
              <span className="num">Read next</span>
              <span className="line" />
            </div>
            <h2 className="display-m" style={{ margin: '0 0 clamp(2rem, 4vw, 3rem)', maxWidth: '18ch' }}>
              Readers of this kit also <em className="ital-display" style={{ color: 'var(--clay)' }}>reached for.</em>
            </h2>
            <div className="product-grid">
              {related.map(p => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Back CTA */}
      <section className="section-tight surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <Link to="/shop" className="btn btn-ghost">← All protocols</Link>
        </div>
      </section>
    </>
  );
}
