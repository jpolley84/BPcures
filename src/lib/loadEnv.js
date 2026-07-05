// src/lib/loadEnv.js — the env access pattern (frontend side).
//
// Convention mirrored from bpquiz-site:
//   - Backend (api/*.js)  reads process.env.X directly.
//   - Frontend (src/**)   reads import.meta.env.VITE_X, with a sane fallback,
//     through this helper so every call-site is consistent and missing vars
//     are visible (warn once) instead of silently undefined.
//
// Reuse the SAME var names already set for bpquiz-site (see .env.example).
// Never hardcode secrets — only VITE_-prefixed PUBLIC values are exposed to
// the browser bundle (publishable key, price IDs, site URL). Secret keys
// (STRIPE_SECRET_KEY, RESEND_API_KEY, ANTHROPIC_API_KEY) stay server-side.

const warned = new Set();

/**
 * Read a public (VITE_-prefixed) env var on the client.
 * @param {string} name      e.g. 'VITE_STRIPE_ENTRY_PRICE_ID'
 * @param {string} [fallback] used when the var is unset (dev / preview)
 */
export function loadEnv(name, fallback = '') {
  const val = import.meta.env?.[name];
  if (val === undefined || val === '') {
    if (!warned.has(name) && import.meta.env?.DEV) {
      warned.add(name);
      console.warn(`[loadEnv] ${name} is not set — using fallback "${fallback}"`);
    }
    return fallback;
  }
  return val;
}

// Convenience accessors for the values the funnel uses most. Phase 2 agents
// can import these directly instead of re-typing var names.
export const SITE_URL = () => loadEnv('VITE_SITE_URL', 'https://braveworks-bp.vercel.app');
export const STRIPE_PUBLISHABLE_KEY = () => loadEnv('VITE_STRIPE_PUBLISHABLE_KEY');
// $27 entry corner — reuses the live bpquiz $27 price id as the fallback.
export const STRIPE_ENTRY_PRICE_ID = () =>
  loadEnv('VITE_STRIPE_ENTRY_PRICE_ID', 'price_1TlYAFHseZnO3rRZoOCNHviq');
// $47 full triangle — set VITE_STRIPE_TRIANGLE_PRICE_ID in env (no public
// fallback id is exposed for $47 in bpquiz-site; the live $47 product is
// reached via payment link buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k).
export const STRIPE_TRIANGLE_PRICE_ID = () => loadEnv('VITE_STRIPE_TRIANGLE_PRICE_ID');
