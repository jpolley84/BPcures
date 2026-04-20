import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { fetchManifest } from '../utils/blogLoader';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function LearnPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManifest()
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      <section className="section surface-paper" style={{ paddingBottom: 'clamp(1rem, 3vw, 2rem)' }}>
        <div className="shell">
          <div className="section-label">
            <span className="num">The Journal · Edition 01</span>
            <span className="line" />
          </div>
          <motion.h1
            className="display-l"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ margin: '0 0 1rem', maxWidth: '20ch' }}
          >
            Plain-English essays <em className="ital-display" style={{ color: 'var(--clay)' }}>from the bedside.</em>
          </motion.h1>
          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Two decades of ICU and emergency nursing, translated into articles you can actually
            act on. No clickbait. No cures. No hype.
          </motion.p>
        </div>
      </section>

      {/* Featured post */}
      {loading ? (
        <section className="section surface-paper" style={{ paddingTop: 0 }}>
          <div className="shell">
            <p style={{ color: 'var(--muted)' }}>Loading essays…</p>
          </div>
        </section>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {featured && <FeaturedPost post={featured} />}
          {rest.length > 0 && (
            <section className="section surface-warm" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)' }}>
              <div className="shell">
                <div className="section-label">
                  <span className="num">Recent</span>
                  <span className="line" />
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                }}>
                  {rest.map((post, i) => (
                    <motion.div
                      key={post.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.6, delay: i * 0.06 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Subscribe CTA */}
      <section className="section surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center' }}>
          <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Want these in your inbox?</span>
          <h2 className="display-m" style={{ margin: '1.25rem auto 1rem', maxWidth: '20ch' }}>
            One essay, <em className="ital-display" style={{ color: 'var(--clay)' }}>once a week.</em>
          </h2>
          <p style={{ color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 auto 2rem' }}>
            Take the assessment to receive the journal, your personalized protocol, and the Cook For Life cookbook — free.
          </p>
          <Link to="/" className="btn btn-ink btn-lg">
            Take the assessment <ArrowRight size={16} className="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}

function FeaturedPost({ post }) {
  return (
    <section className="section-tight surface-paper" style={{ paddingBottom: 'clamp(3rem, 5vw, 4rem)' }}>
      <div className="shell">
        <Link to={`/learn/${post.slug}`} style={{ display: 'block' }}>
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'grid',
              gap: 'clamp(1.5rem, 3vw, 3rem)',
              padding: 'clamp(1.5rem, 3vw, 2.5rem)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              background: 'var(--cream)',
              alignItems: 'center',
              transition: 'border-color 0.5s var(--ease-out)',
            }}
            className="feat-post"
          >
            <style>{`
              @media (min-width: 860px) {
                .feat-post { grid-template-columns: 1.1fr 1fr !important; }
              }
              .feat-post:hover { border-color: var(--ink-soft) !important; }
            `}</style>

            <div style={{
              aspectRatio: '4 / 3',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--paper-warm)',
            }}>
              {post.cover_image ? (
                <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'Fraunces, serif', fontStyle: 'italic',
                  fontSize: 'clamp(3rem, 7vw, 5rem)', color: 'var(--muted)', opacity: 0.5,
                }}>J</div>
              )}
            </div>

            <div>
              <span className="kicker kicker-dot">Featured essay</span>
              <h2 className="display-m" style={{ margin: '1rem 0 1rem', lineHeight: 1.05 }}>
                {post.title}
              </h2>
              {post.excerpt && (
                <p style={{ color: 'var(--ink-soft)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                  {post.excerpt}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                <span>{formatDate(post.published_at)} · {post.read_time ?? '6 min read'}</span>
                <span className="btn-link" style={{ color: 'var(--ink)' }}>
                  Read essay <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </motion.article>
        </Link>
      </div>
    </section>
  );
}

function PostCard({ post }) {
  return (
    <Link to={`/learn/${post.slug}`} style={{
      display: 'grid',
      gap: '1rem',
      padding: '1.5rem',
      background: 'var(--cream)',
      border: '1px solid var(--line)',
      borderRadius: 18,
      height: '100%',
      transition: 'border-color 0.5s var(--ease-out), transform 0.6s var(--ease-out)',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-soft)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      {post.cover_image && (
        <div style={{
          aspectRatio: '3 / 2',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--paper-warm)',
        }}>
          <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div>
        <span className="eyebrow-num">{formatDate(post.published_at)}</span>
        <h3 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '1.3rem',
          fontWeight: 500,
          lineHeight: 1.2,
          margin: '0.4rem 0 0.5rem',
          letterSpacing: '-0.015em',
        }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
            {post.excerpt}
          </p>
        )}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.78rem' }}>
        <span>{post.read_time ?? '5 min read'}</span>
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="section surface-paper" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)' }}>
      <div className="shell">
        <div style={{
          padding: 'clamp(2.5rem, 5vw, 4rem)',
          border: '1px dashed var(--line)',
          borderRadius: 24,
          textAlign: 'center',
          background: 'var(--paper-warm)',
        }}>
          <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Coming soon</span>
          <h2 className="display-m" style={{ margin: '1.25rem auto 1rem', maxWidth: '18ch' }}>
            The first essays are <em className="ital-display" style={{ color: 'var(--clay)' }}>in the kiln.</em>
          </h2>
          <p style={{ color: 'var(--ink-soft)', maxWidth: '52ch', margin: '0 auto 2rem' }}>
            Joel is assembling the journal now. In the meantime, take the assessment and you'll be the first to hear when new pieces drop.
          </p>
          <Link to="/" className="btn btn-ink">
            Take the assessment <ArrowRight size={16} className="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
