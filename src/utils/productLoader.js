// Product loader + tiered shop helpers.
// Schema (per product):
//   slug, name, headline, description, category, tier (1|2|3),
//   tier_label, price, price_cents, original_price,
//   stripe_payment_link, gumroad_link, cover_image, badge,
//   rating, review_count, featured, who_for, what_inside,
//   outcomes, related_slugs

export const CATEGORIES = [
  { id: 'blood_pressure', label: 'Blood Pressure', short: 'BP' },
  { id: 'cortisol', label: 'Cortisol & Stress', short: 'Cortisol' },
  { id: 'blood_sugar', label: 'Blood Sugar', short: 'Blood Sugar' },
];

export const TIER_LABEL = {
  1: 'Starter',
  2: 'Most Popular',
  3: '30-Day Challenge',
};

export async function fetchProducts() {
  try {
    const res = await fetch('/products.json');
    if (!res.ok) return [];
    const data = await res.json();
    // Tolerate both array and { products: [...] } legacy shape.
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
  } catch {
    return [];
  }
}

export function filterByCategory(products, category) {
  if (!category || category === 'all') return products;
  return products.filter(p => p.category === category);
}

export function getFeaturedProducts(products) {
  return products.filter(p => p.featured);
}

export function getProductBySlug(products, slug) {
  return products.find(p => p.slug === slug) ?? null;
}

export function getRelatedProducts(products, product) {
  if (!product?.related_slugs?.length) return [];
  return product.related_slugs
    .map(slug => products.find(p => p.slug === slug))
    .filter(Boolean)
    .slice(0, 3);
}

// Group products into the canonical 3-tier ladder per category.
// Returns: { blood_pressure: { 1: prod, 2: prod, 3: prod }, ... }
export function getTierLadder(products) {
  const ladder = {};
  for (const cat of CATEGORIES) {
    const cats = products.filter(p => p.category === cat.id);
    ladder[cat.id] = {
      1: cats.find(p => p.tier === 1) ?? null,
      2: cats.find(p => p.tier === 2) ?? null,
      3: cats.find(p => p.tier === 3) ?? null,
    };
  }
  return ladder;
}

// Recommend a product for a quiz concern.
// Strategy update 2026-05-03: front-of-funnel is ALWAYS Tier 2 (the $47 Kit).
// Score is kept in the UI for psychological commitment but no longer drives
// product tier — putting people on the right rung at the start (Hormozi).
// The Tier 1 ($17) starter is shown as a downsell beneath the primary CTA;
// see downsellForConcern. The Tier 3 ($397) is removed from front-of-funnel
// and only re-pitched in the post-purchase drip on Day 14 / Day 28.
// The `score` arg is preserved for API compatibility but unused.
export function recommendForScore(products, concern, _score) {
  const tier2 = products.find(p => p.category === concern && p.tier === 2);
  if (tier2) return tier2;
  // Fallback: if no Tier 2 exists for this category, return Tier 1.
  return products.find(p => p.category === concern && p.tier === 1) ?? null;
}

// The Tier 1 starter shown as the "if $47 isn't right today" downsell
// beneath the primary CTA on the quiz result page.
export function downsellForConcern(products, concern) {
  return products.find(p => p.category === concern && p.tier === 1) ?? null;
}

// Backwards compatibility for QuizPage: pick the Tier 2 product as the
// primary recommendation, falling back to Tier 1.
export function getRecommendationsForConcern(products, concern) {
  const c = concern === 'all' ? 'blood_pressure' : concern;
  const cats = products.filter(p => p.category === c);
  return [
    cats.find(p => p.tier === 2),
    cats.find(p => p.tier === 1),
    cats.find(p => p.tier === 3),
  ].filter(Boolean);
}

// Urgency window in days based on risk score.
export function urgencyWindow(score) {
  if (score >= 7) return { days: 30, label: 'within 30 days', tone: 'urgent' };
  if (score >= 4) return { days: 60, label: 'within 60 days', tone: 'moderate' };
  return { days: 90, label: 'within 90 days', tone: 'mild' };
}
