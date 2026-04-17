import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchManifest } from '../utils/blogLoader';

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManifest()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--light-gray)' }}>
      <div className="gradient-navy py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
            BraveWorks RN
          </p>
          <h1 className="text-4xl font-bold text-white mb-4">Health Blog</h1>
          <p className="text-base" style={{ color: '#cbd5e1' }}>
            Evidence-based protocols by Joel Polley, RN
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading && (
          <div className="text-center py-20" style={{ color: 'var(--muted-gray)' }}>
            Loading articles…
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <p style={{ color: 'var(--muted-gray)' }}>No articles yet — check back soon.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {posts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="card-elevated block"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full object-cover rounded-t-2xl"
                    style={{ height: '180px' }}
                  />
                ) : (
                  <div
                    className="w-full rounded-t-2xl gradient-navy flex items-center justify-center"
                    style={{ height: '120px' }}
                  >
                    <span className="text-2xl font-bold" style={{ color: 'var(--gold)', opacity: 0.7 }}>BW</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--purple)' }}>
                    {post.date}{post.reading_time ? ` · ${post.reading_time} min read` : ''}
                  </p>
                  <h2 className="text-lg font-bold mb-2 leading-snug" style={{ color: 'var(--navy)' }}>
                    {post.title}
                  </h2>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--dark-gray)' }}>
                    {post.excerpt}
                  </p>
                  <span className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>
                    Read article &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="py-12 px-4 text-center" style={{ background: 'var(--navy)' }}>
        <p className="text-white mb-4 text-base">Ready to take control of your blood pressure?</p>
        <a
          href="https://BPQuiz.com"
          className="btn-standard gradient-purple-btn text-white font-bold px-8"
          style={{ display: 'inline-flex', height: '48px' }}
        >
          Take the BP Quiz &rarr;
        </a>
      </div>
    </div>
  );
}
