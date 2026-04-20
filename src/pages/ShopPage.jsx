import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, ExternalLink, Phone, Star, ShieldCheck, Users } from 'lucide-react';
import {
  fetchProducts,
  getTierLadder,
  CATEGORIES,
} from '../utils/productLoader';

const TIER_META = {
  1: {
    label: 'Level 01 · Starter',
    eyebrow: 'Start here',
    cta: 'Start with the guide',
    surface: 'var(--cream)',
    border: 'var(--line)',
    tagline: "You're on 1–2 pills and wondering if there's a better way. This is your first step — the guide your doctor never gave you.",
  },
  2: {
    label: 'Level 02 · Complete System',
    eyebrow: 'Most Popular',
    cta: 'Get the complete kit',
    surface: 'var(--paper-warm)',
    border: 'var(--ink)',
    tagline: "You're tired of adding pills that don't fix the problem. This is the complete protocol — herbs, foods, and the daily plan to start seeing real numbers.",
  },
  3: {
    label: 'Level 03 · 30-Day Challenge',
    eyebrow: 'Group Coaching + Live Event · Starts May 1',
    cta: 'Join the 30-Day Challenge — Starts May 1',
    surface: 'var(--sage-deep)',
    border: 'var(--sage-deep)',
    tagline: "You're on 3–5 medications and you're done guessing. 30 days of guided coaching, daily emails, weekly live sessions, and a nurse in your corner. This is where transformation happens.",
  },
};

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const initialCategory = params.get('category');

  useEffect(() => {
    fetchProducts().then(p => { setProducts(p); setLoading(false); });
  }, []);

  const ladder = useMemo(() => getTierLadder(products), [products]);

  // Selected category — default to first available
  const [selected, setSelected] = useState(initialCategory || 'blood_pressure');

  useEffect(() => {
    if (selected === 'blood_pressure') setParams({});
    else setParams({ category: selected });
  }, [selected]); // eslint-disable-line

  const activeCat = CATEGORIES.find(c => c.id === selected) ?? CATEGORIES[0];
  const tiers = ladder[activeCat.id] ?? {};

  return (
    <>
      {/* ============================================================
          Header — editorial intro
          ============================================================ */}
      <section className="section surface-paper" style={{ paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <div className="shell">
          <div className="section-label">
            <span className="num">The Apothecary · Three Levels</span>
            <span className="line" />
          </div>

          <motion.h1
            className="display-l"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ margin: '0 0 1rem', maxWidth: '22ch' }}
          >
            Pick your concern. Then pick your <em className="ital-display" style={{ color: 'var(--clay)' }}>level.</em>
          </motion.h1>

          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Three concerns. Three levels each. The starter is the cheapest way in.
            The complete kit is what most readers buy. The 30-Day Challenge includes
            daily email coaching, weekly live group sessions in Skool, and a FREE
            Barbara O'Neill LIVE event ticket — starts May 1.
          </motion.p>

          {/* Category tabs */}
          <div role="tablist" aria-label="Health concern" style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--line)',
          }}>
            {CATEGORIES.map(c => {
              const active = c.id === selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(c.id)}
                  className={`chip${active ? ' active' : ''}`}
                  style={{
                    padding: '0.85rem 1.4rem',
                    fontSize: '1rem',
                    minHeight: 48,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          Three-tier comparison
          ============================================================ */}
      <section className="section surface-paper" style={{ paddingTop: 0 }}>
        <div className="shell">
          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading…</p>
          ) : (
            <motion.div
              key={activeCat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="tier-grid"
            >
              <style>{`
                .tier-grid {
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: clamp(1.25rem, 2vw, 1.75rem);
                  align-items: stretch;
                }
                @media (min-width: 900px) {
                  .tier-grid { grid-template-columns: repeat(3, 1fr); }
                }
                .tier-card {
                  display: flex;
                  flex-direction: column;
                  position: relative;
                  border-radius: 22px;
                  padding: clamp(1.75rem, 3vw, 2.5rem);
                  border: 1px solid var(--line);
                  background: var(--cream);
                  transition: transform 0.5s var(--ease-out), border-color 0.4s var(--ease-out), box-shadow 0.5s var(--ease-out);
                }
                .tier-card:hover { transform: translateY(-4px); }
                .tier-card.t-2 {
                  border: 2px solid var(--ink);
                  background: var(--paper-warm);
                  box-shadow: 0 30px 60px -30px rgba(46, 58, 48, 0.25);
                }
                @media (min-width: 900px) {
                  .tier-card.t-2 { transform: scale(1.03); }
                  .tier-card.t-2:hover { transform: scale(1.03) translateY(-4px); }
                }
                .tier-card.t-3 {
                  background: var(--sage-deep);
                  color: var(--cream);
                  border-color: var(--sage-deep);
                }
                .tier-card.t-3 .tier-eyebrow,
                .tier-card.t-3 .tier-title,
                .tier-card.t-3 .tier-headline,
                .tier-card.t-3 .tier-feature,
                .tier-card.t-3 .tier-price-now,
                .tier-card.t-3 .tier-price-was {
                  color: inherit;
                }
                .tier-card.t-3 .tier-feature { color: rgba(251, 248, 241, 0.85); }
                .tier-ribbon {
                  position: absolute;
                  top: -14px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: var(--ink);
                  color: var(--cream);
                  padding: 0.4rem 1rem;
                  border-radius: 999px;
                  font-size: 0.68rem;
                  font-weight: 600;
                  letter-spacing: 0.18em;
                  text-transform: uppercase;
                  white-space: nowrap;
                }
                .tier-card.t-3 .tier-ribbon { background: var(--clay); color: var(--cream); }
                .tier-eyebrow {
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 0.7rem;
                  letter-spacing: 0.18em;
                  text-transform: uppercase;
                  color: var(--muted);
                  margin-bottom: 0.75rem;
                }
                .tier-title {
                  font-family: 'Fraunces', serif;
                  font-size: clamp(1.45rem, 2.4vw, 1.85rem);
                  font-weight: 500;
                  line-height: 1.15;
                  letter-spacing: -0.018em;
                  margin: 0 0 0.6rem;
                  color: var(--ink);
                }
                .tier-headline {
                  font-size: 1rem;
                  line-height: 1.5;
                  color: var(--ink-soft);
                  margin: 0 0 1.5rem;
                  min-height: 3em;
                }
                .tier-price {
                  display: flex;
                  align-items: baseline;
                  gap: 0.6rem;
                  margin-bottom: 1.5rem;
                  padding-bottom: 1.5rem;
                  border-bottom: 1px solid var(--line);
                }
                .tier-card.t-3 .tier-price { border-color: rgba(251, 248, 241, 0.18); }
                .tier-price-now {
                  font-family: 'Fraunces', serif;
                  font-size: clamp(2.4rem, 4vw, 3.2rem);
                  font-weight: 500;
                  letter-spacing: -0.025em;
                  line-height: 1;
                  color: var(--ink);
                }
                .tier-price-was {
                  text-decoration: line-through;
                  color: var(--muted);
                  font-size: 1rem;
                }
                .tier-features {
                  list-style: none;
                  padding: 0;
                  margin: 0 0 2rem;
                  display: grid;
                  gap: 0.75rem;
                  flex: 1;
                }
                .tier-feature {
                  display: grid;
                  grid-template-columns: 22px 1fr;
                  gap: 0.7rem;
                  align-items: start;
                  font-size: 0.95rem;
                  line-height: 1.5;
                  color: var(--ink-soft);
                }
                .tier-feature svg { margin-top: 0.2rem; flex-shrink: 0; }
                .tier-cta {
                  width: 100%;
                  padding: 1.05rem 1.4rem;
                  border-radius: 999px;
                  font-size: 1rem;
                  font-weight: 500;
                  text-align: center;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                  transition: transform 0.4s var(--ease-out), background 0.3s var(--ease-out), color 0.3s var(--ease-out);
                  border: 1px solid transparent;
                  text-decoration: none;
                }
                .tier-cta:hover { transform: translateY(-1px); }
                .tier-cta.t-1 { background: var(--cream); color: var(--ink); border-color: var(--ink); }
                .tier-cta.t-1:hover { background: var(--ink); color: var(--cream); }
                .tier-cta.t-2 { background: var(--ink); color: var(--cream); }
                .tier-cta.t-2:hover { background: var(--clay); }
                .tier-cta.t-3 { background: var(--clay); color: var(--cream); }
                .tier-cta.t-3:hover { background: var(--clay-hover); }
                .tier-coaching-tag {
                  display: inline-flex;
                  align-items: center;
                  gap: 0.4rem;
                  padding: 0.5rem 0.85rem;
                  border-radius: 999px;
                  background: rgba(251, 248, 241, 0.12);
                  color: var(--cream);
                  font-size: 0.75rem;
                  letter-spacing: 0.08em;
                  font-weight: 500;
                  margin-bottom: 1.25rem;
                }
                .tier-detail-link {
                  display: inline-flex;
                  align-items: center;
                  gap: 0.35rem;
                  color: var(--muted);
                  font-size: 0.78rem;
                  letter-spacing: 0.06em;
                  margin-top: 0.85rem;
                  text-decoration: none;
                }
                .tier-detail-link:hover { color: var(--ink); }
                .tier-card.t-3 .tier-detail-link { color: rgba(251, 248, 241, 0.6); }
                .tier-card.t-3 .tier-detail-link:hover { color: var(--cream); }
                .tier-bonus-callout {
                  background: rgba(251, 248, 241, 0.12);
                  border: 1px solid rgba(251, 248, 241, 0.28);
                  border-radius: 12px;
                  padding: 0.9rem 1rem;
                  margin-bottom: 1.25rem;
                }
                .tier-bonus-title {
                  font-size: 0.83rem;
                  font-weight: 700;
                  line-height: 1.35;
                  letter-spacing: 0.01em;
                  color: var(--cream);
                }
                .tier-bonus-sub {
                  font-size: 0.76rem;
                  opacity: 0.82;
                  margin: 0.2rem 0 0.6rem;
                  color: var(--cream);
                }
                .tier-event-link {
                  display: inline-flex;
                  align-items: center;
                  gap: 0.3rem;
                  font-size: 0.72rem;
                  color: var(--clay-soft);
                  text-decoration: underline;
                  text-underline-offset: 2px;
                  margin-right: 0.85rem;
                }
                .tier-event-link:hover { opacity: 0.75; }
                .tier-skool-link {
                  display: inline-flex;
                  align-items: center;
                  gap: 0.3rem;
                  font-size: 0.72rem;
                  color: rgba(251, 248, 241, 0.65);
                  text-decoration: underline;
                  text-underline-offset: 2px;
                }
                .tier-skool-link:hover { color: var(--cream); }
                .tier-tagline-block {
                  border-radius: 12px;
                  padding: 1rem 1.15rem;
                  margin-bottom: 1.5rem;
                  background: rgba(139, 115, 85, 0.09);
                }
                .tier-card.t-2 .tier-tagline-block {
                  background: rgba(46, 58, 48, 0.06);
                }
                .tier-card.t-3 .tier-tagline-block {
                  background: rgba(251, 248, 241, 0.12);
                  border: 1px solid rgba(251, 248, 241, 0.18);
                }
                .tier-tagline {
                  font-family: 'Fraunces', serif;
                  font-size: clamp(0.95rem, 1.6vw, 1.05rem);
                  font-style: italic;
                  font-weight: 400;
                  line-height: 1.55;
                  color: var(--ink-soft);
                }
                .tier-card.t-3 .tier-tagline { color: rgba(251, 248, 241, 0.9); }
              `}</style>

              {[1, 2, 3].map(t => {
                const product = tiers[t];
                if (!product) {
                  return (
                    <div key={t} className={`tier-card t-${t}`}>
                      <span className="tier-eyebrow">{TIER_META[t].label}</span>
                      <h3 className="tier-title">Coming soon</h3>
                      <p className="tier-headline">This tier is being prepared.</p>
                    </div>
                  );
                }

                return (
                  <div key={product.slug} className={`tier-card t-${t}`}>
                    {t === 2 && <span className="tier-ribbon">★ Most Popular</span>}
                    {t === 3 && <span className="tier-ribbon">★ STARTS MAY 1 · Live Event Ticket ($297 Value) Included</span>}

                    <div className="tier-tagline-block">
                      <p className="tier-tagline">{TIER_META[t].tagline}</p>
                    </div>

                    <span className="tier-eyebrow">{TIER_META[t].label}</span>
                    <h3 className="tier-title">{product.name}</h3>
                    <p className="tier-headline">{product.headline}</p>

                    {t === 3 && (
                      <div className="tier-bonus-callout">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                          <Star size={14} fill="currentColor" stroke="none" style={{ color: 'var(--clay-soft)', flexShrink: 0, marginTop: '0.15rem' }} />
                          <div>
                            <div className="tier-bonus-title">BONUS: FREE Virtual Ticket to Barbara O'Neill LIVE</div>
                            <p className="tier-bonus-sub">$297 value INCLUDED · June 24–25, 2026</p>
                            <a href="https://everydaynurse.com/event-virtual" target="_blank" rel="noopener noreferrer" className="tier-event-link">
                              View event details <ExternalLink size={10} />
                            </a>
                            <a href="https://www.skool.com/how-to-be-your-own-doctor-8010/about" target="_blank" rel="noopener noreferrer" className="tier-skool-link">
                              <Users size={10} /> Join community on Skool
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="tier-price">
                      <span className="tier-price-now">{product.price}</span>
                      {product.original_price && (
                        <span className="tier-price-was">{product.original_price}</span>
                      )}
                    </div>

                    <ul className="tier-features">
                      {(product.what_inside ?? []).slice(0, t === 3 ? 7 : 5).map((f, i) => (
                        <li key={i} className="tier-feature">
                          <Check size={14} style={{ color: t === 3 ? 'var(--clay-soft)' : 'var(--sage-deep)' }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={product.stripe_payment_link}
                      className={`tier-cta t-${t}`}
                      target="_top"
                      rel="noopener"
                    >
                      {TIER_META[t].cta}
                      <ArrowRight size={16} />
                    </a>

                    <Link to={`/shop/${product.slug}`} className="tier-detail-link">
                      Read full details <ArrowUpRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================================================
          Trust strip — clinical reassurance
          ============================================================ */}
      <section className="section-tight surface-warm">
        <div className="shell">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            alignItems: 'center',
          }}>
            {[
              { icon: ShieldCheck, label: 'Nurse-designed', sub: '20 yrs ICU & ER' },
              { icon: Star, label: '4.9 / 5', sub: '1,200+ readers' },
              { icon: Check, label: 'Instant delivery', sub: 'PDFs to your inbox' },
              { icon: Phone, label: 'Real coaching', sub: 'Premium tier only' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <item.icon size={20} style={{ color: 'var(--sage-deep)' }} />
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', lineHeight: 1.1, fontWeight: 500 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                    {item.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Quiz CTA — for the undecided
          ============================================================ */}
      <section className="section surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Not sure which level?</span>
          <h2 className="display-m" style={{ margin: '1.25rem auto 1rem', maxWidth: '22ch' }}>
            Take the 90-second assessment. Joel will <em className="ital-display" style={{ color: 'var(--clay)' }}>pick the level for you.</em>
          </h2>
          <p style={{ color: 'var(--ink-soft)', maxWidth: '54ch', margin: '0 auto 2rem' }}>
            You'll get a clinical risk score, an urgency window, and the exact tier matched
            to your situation — no guessing.
          </p>
          <Link to="/" className="btn btn-ink btn-lg">
            Take the assessment <ArrowRight size={16} className="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
