// challenge-b-pk.mjs — post-build step for changemylifechallenge.com.
//
// public/challenge-b/index.html is a STATIC page (no Vite bundle), so it
// cannot read import.meta.env. Its embedded Stripe checkout needs the
// publishable key, which only exists as VITE_STRIPE_PUBLISHABLE_KEY in the
// Vercel build environment. This step stamps it into the built copy.
//
// If the env var is missing (local dev without .env), the %%STRIPE_PK%%
// placeholder is left in place and the page's own JS shows an email fallback
// instead of a dead pay button — loud warning here, graceful degrade there.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'dist/challenge-b/index.html');

if (!existsSync(file)) {
  console.error('challenge-b-pk: dist/challenge-b/index.html not found, run vite build first');
  process.exit(1);
}

const pk = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
let html = readFileSync(file, 'utf8');

if (!html.includes('%%STRIPE_PK%%')) {
  console.warn('challenge-b-pk: placeholder %%STRIPE_PK%% not found (already stamped?), leaving file untouched');
  process.exit(0);
}

if (!pk.startsWith('pk_')) {
  console.warn(
    'challenge-b-pk: ⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set — the challenge page will show its ' +
      'email fallback instead of checkout. Fine locally, a P0 on the production deploy.'
  );
  process.exit(0);
}

writeFileSync(file, html.split('%%STRIPE_PK%%').join(pk));
console.log(`challenge-b-pk: stamped publishable key (${pk.slice(0, 8)}…) into dist/challenge-b/index.html`);
