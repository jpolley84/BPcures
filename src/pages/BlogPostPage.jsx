import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPost } from '../utils/blogLoader';

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--light-gray)' }}>
        <p style={{ color: 'var(--muted-gray)' }}>Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: 'var(--light-gray)' }}>
        <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Article not found.</p>
        <Link to="/blog" style={{ color: 'var(--purple)' }}>&larr; Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--light-gray)' }}>
      <div className="gradient-navy px-4 pt-10 pb-12">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/blog"
            className="text-sm font-semibold inline-block mb-6"
            style={{ color: 'var(--gold)', textDecoration: 'none' }}
          >
            &larr; All articles
          </Link>
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full rounded-2xl mb-6 object-cover"
              style={{ maxHeight: '360px' }}
            />
          )}
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{post.title}</h1>
          <div className="flex gap-4 flex-wrap" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            <span>By Joel Polley, RN</span>
            <span>{post.date}</span>
            {post.reading_time && <span>{post.reading_time} min read</span>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div
          className="blog-content bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-10 text-center">
          <p className="mb-4 font-semibold" style={{ color: 'var(--navy)' }}>
            Want a personalized protocol?
          </p>
          <a
            href="https://BPQuiz.com"
            className="btn-standard gradient-purple-btn text-white font-bold px-8"
            style={{ display: 'inline-flex', height: '48px' }}
          >
            Take the Free BP Quiz &rarr;
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link to="/blog" style={{ color: 'var(--purple)', fontSize: '0.9rem' }}>
            &larr; Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
