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
// Strategy update 2026-05-05: REVERTED to Tier 1 ($17) front-of-funnel.
// Sales data showed the $47 default cut volume by ~40% with negligible AOV
// lift on cold TikTok traffic — 75% of buyers still hit the $17 downsell
// link even when $47 was the headline. Cold traffic needs an easy yes; the
// $47 Kit is now repositioned as an inline upsell (see upsellForConcern)
// and as a post-purchase OTO. Score is preserved for psychological commit
// but does not drive tier.
export function recommendForScore(products, concern, _score) {
  const tier1 = products.find(p => p.category === concern && p.tier === 1);
  if (tier1) return tier1;
  // Fallback if no Tier 1 exists for this category, return Tier 2.
  return products.find(p => p.category === concern && p.tier === 2) ?? null;
}

// The Tier 2 ($47) Kit shown as an upsell beneath the primary $17 CTA on
// the quiz result page ("Want the complete Kit? Upgrade to $47 →").
export function upsellForConcern(products, concern) {
  return products.find(p => p.category === concern && p.tier === 2) ?? null;
}

// Backward-compat alias. Older builds imported `downsellForConcern` to fetch
// the Tier 1 starter. After the 2026-05-05 revert, Tier 1 IS the primary
// recommendation, so this returns Tier 2 — i.e. the upsell offer. Kept as
// an alias so existing imports don't break; new code should use
// upsellForConcern for clarity.
export function downsellForConcern(products, concern) {
  return upsellForConcern(products, concern);
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
