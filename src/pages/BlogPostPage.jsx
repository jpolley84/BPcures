import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { fetchPost } from '../utils/blogLoader';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchPost(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
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

  if (notFound || !post) {
    return (
      <section className="section surface-paper">
        <div className="shell-tight" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>Not found</span>
          <h1 className="display-m" style={{ margin: '1rem 0' }}>This essay has wandered off.</h1>
          <Link to="/learn" className="btn btn-ink">Back to the journal</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="surface-paper" style={{ paddingTop: '2rem', paddingBottom: '1rem' }}>
        <div className="shell-tight">
          <Link to="/learn" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.82rem', color: 'var(--muted)', letterSpacing: '0.06em',
          }}>
            <ArrowLeft size={14} /> The Journal
          </Link>
        </div>
      </section>

      <article className="section surface-paper" style={{ paddingTop: '1rem' }}>
        <div className="shell-tight">
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}
          >
            <span className="kicker kicker-dot">Essay · Joel Polley, RN</span>
            <h1 className="display-l" style={{ margin: '1rem 0 1.5rem', lineHeight: 1.05 }}>
              {post.title}
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: '0.88rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>{formatDate(post.date || post.published_at)}</span>
              {post.reading_time && <span>· {post.reading_time} min read</span>}
            </div>
          </motion.header>

          {post.cover_image && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                marginBottom: 'clamp(2rem, 4vw, 3rem)',
                aspectRatio: '16 / 9',
                background: 'var(--paper-warm)',
              }}
            >
              <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          )}

          <motion.div
            className="blog-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ fontSize: '1.08rem', lineHeight: 1.7, maxWidth: '66ch' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div style={{
            marginTop: 'clamp(3rem, 5vw, 4rem)',
            padding: 'clamp(1.75rem, 3vw, 2.5rem)',
            border: '1px solid var(--line)',
            borderRadius: 20,
            background: 'var(--paper-warm)',
            textAlign: 'center',
          }}>
            <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>A nurse's protocol, made for you</span>
            <h2 className="display-s" style={{ margin: '1rem auto', maxWidth: '18ch' }}>
              Want <em className="ital-display" style={{ color: 'var(--clay)' }}>yours?</em>
            </h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '1.5rem', maxWidth: '48ch', marginInline: 'auto' }}>
              Take the 90-second assessment to get your personalized protocol — plus the Cook For Life cookbook, free.
            </p>
            <Link to="/" className="btn btn-ink btn-lg">
              Take the assessment <ArrowRight size={16} className="arrow" />
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
