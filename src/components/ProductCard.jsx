import { Link } from 'react-router-dom';
import { Star, ArrowUpRight } from 'lucide-react';

const CATEGORY_LABEL = {
  blood_pressure: 'Blood Pressure',
  cortisol: 'Cortisol · Stress',
  blood_sugar: 'Blood Sugar',
};

export default function ProductCard({ product }) {
  const { slug, name, headline, price, original_price, category, cover_image, badge, rating, review_count, price_cents } = product;
  const isFree = price_cents === 0;
  const label = CATEGORY_LABEL[category] ?? 'Protocol';
  const [w, x] = (name || '').split(' ');
  const monogram = (w?.[0] ?? 'B') + (x?.[0] ?? 'W');

  return (
    <Link to={`/shop/${slug}`} className="product-card">
      <div className="product-cover">
        {cover_image ? (
          <img
            src={cover_image}
            alt={name}
            onError={e => {
              e.currentTarget.style.display = 'none';
              const sib = e.currentTarget.nextElementSibling;
              if (sib) sib.style.display = 'grid';
            }}
          />
        ) : null}
        <div
          className="product-cover-placeholder"
          style={{ display: cover_image ? 'none' : 'grid', position: 'absolute', inset: 0 }}
        >
          {monogram}
        </div>
        {badge && <span className="product-badge">{badge}</span>}
      </div>

      <div className="product-body">
        <span className="product-cat">{label}</span>
        <h3 className="product-title">{name}</h3>
        <p className="product-headline">{headline}</p>

        <div className="product-foot">
          <div className="product-price">
            <span className="now">{isFree ? 'Free' : price}</span>
            {original_price && !isFree && <span className="was">{original_price}</span>}
          </div>
          {rating && review_count > 0 && (
            <span className="product-rating">
              <Star size={12} fill="currentColor" stroke="none" style={{ color: 'var(--gold)' }} />
              <span className="tabular">{rating}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ opacity: 0.7 }}>{review_count}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
