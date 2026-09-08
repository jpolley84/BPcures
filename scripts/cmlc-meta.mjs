// cmlc-meta.mjs — post-build step for changemylifechallenge.com.
//
// PROBLEM (found 2026-08-04, launch morning): the SPA's dist/index.html carries
// BPQuiz's <title> and og:* tags. Crawlers (Facebook, WhatsApp, iMessage, SMS
// preview bots) do not run JS, so every share of changemylifechallenge.com
// rendered a card for the 90-second BP quiz, including the retired "Pipe"
// wording. React's client-side document.title fixes the tab, not the card.
//
// FIX: emit dist/cmlc.html, a copy of the built index.html with the challenge's
// own title/description/OG/Twitter tags. vercel.json rewrites the ROOT of
// changemylifechallenge.com (host-conditioned) to /cmlc.html; every other path
// on that host still serves the normal SPA shell. Same JS bundle either way.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'dist/index.html');
if (!existsSync(src)) {
  console.error('cmlc-meta: dist/index.html not found, run vite build first');
  process.exit(1);
}

const TITLE = 'The Change My Life Challenge | September 14-16 · 3-Day Live Challenge with Annie and Joel, RNs';
const DESC =
  'Your blood pressure, hormones, sleep, weight, energy and mood are not separate problems. They are telling one connected story. Three live days with Annie Chitate, RN and Joel Polley, RN, September 14 to 16, 7pm ET.';
const OG_TITLE = 'The Change My Life Challenge';
const OG_DESC =
  '3-day live challenge with two registered nurses. See your numbers as one connected story and walk into your next appointment prepared. Sept 14 to 16, 7pm ET.';
const URL = 'https://changemylifechallenge.com/';
const IMG = 'https://changemylifechallenge.com/challenge-og.jpg';

let html = readFileSync(src, 'utf8');

const swaps = [
  [/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`],
  [/(<meta name="description" content=")[^"]*(")/, `$1${DESC}$2`],
  [/(<link rel="canonical" href=")[^"]*(")/, `$1${URL}$2`],
  [/(<meta property="og:site_name" content=")[^"]*(")/, '$1Change My Life Challenge$2'],
  [/(<meta property="og:title" content=")[^"]*(")/, `$1${OG_TITLE}$2`],
  [/(<meta property="og:description" content=")[^"]*(")/, `$1${OG_DESC}$2`],
  [/(<meta property="og:type" content=")[^"]*(")/, '$1website$2'],
  [/(<meta property="og:url" content=")[^"]*(")/, `$1${URL}$2`],
  [/(<meta property="og:image" content=")[^"]*(")/, `$1${IMG}$2`],
  [/(<meta property="og:image:width" content=")[^"]*(")/, '$1851$2'],
  [/(<meta property="og:image:height" content=")[^"]*(")/, '$1315$2'],
  [/(<meta property="og:image:alt" content=")[^"]*(")/, '$13-Day Live Challenge: Change My Life Challenge, with Annie Chitate, RN and Joel Polley, RN$2'],
  [/<meta property="product:price:amount" content="[^"]*" \/>\s*/, ''],
  [/<meta property="product:price:currency" content="[^"]*" \/>\s*/, ''],
  [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${OG_TITLE}$2`],
  [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${OG_DESC}$2`],
  // twitter:image was missed in the first pass (2026-08-04 evening): X/Twitter
  // does not fall back to og:image when a twitter:* card is declared, so shares
  // rendered the challenge headline over the BPQuiz kit photo.
  [/(<meta name="twitter:image" content=")[^"]*(")/, `$1${IMG}$2`],
];

let missed = 0;
for (const [re, repl] of swaps) {
  if (!re.test(html)) { missed += 1; console.warn('cmlc-meta: pattern not found:', re); }
  html = html.replace(re, repl);
}

writeFileSync(resolve(root, 'dist/cmlc.html'), html);
// stable OG image URL on the domain (the in-page banner is hash-named)
copyFileSync(resolve(root, 'src/assets/challenge-banner.jpg'), resolve(root, 'dist/challenge-og.jpg'));
console.log(`cmlc-meta: wrote dist/cmlc.html (+challenge-og.jpg), ${missed} patterns missed`);
