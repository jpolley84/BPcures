// allin-meta.mjs — post-build step for changemylifechallenge.com/allin.
//
// Same crawler problem cmlc-meta.mjs fixes for the domain root (2026-09-01,
// Joel: shares of /allin showed his photo with the BP Triangle quiz card).
// Emits dist/allin-share.html — the built index.html with Accelerator
// title/OG/Twitter tags. middleware.js rewrites changemylifechallenge.com/allin
// (host-conditioned) to it; same JS bundle, React renders AllInPage as normal.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'dist/index.html');
if (!existsSync(src)) {
  console.error('allin-meta: dist/index.html not found, run vite build first');
  process.exit(1);
}

const TITLE = 'The Life Change Accelerator | 90-Day Coaching with Annie and Joel, RNs';
const DESC =
  'A 90-day nurse-led coaching experience for women 40+. Weekly live coaching with Annie Chitate, RN and Joel Polley, RN, your personalized plan, and a community that will not let you do this alone.';
const OG_TITLE = 'The Life Change Accelerator';
const OG_DESC =
  '90 days of nurse-led coaching with Annie and Joel, RNs. Your personalized plan, weekly live coaching, and real accountability. Education alongside your doctor, never instead.';
const URL = 'https://changemylifechallenge.com/allin';
const IMG = 'https://changemylifechallenge.com/allin-og.jpg';

let html = readFileSync(src, 'utf8');

const swaps = [
  [/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`],
  [/(<meta name="description" content=")[^"]*(")/, `$1${DESC}$2`],
  [/(<link rel="canonical" href=")[^"]*(")/, `$1${URL}$2`],
  [/(<meta property="og:site_name" content=")[^"]*(")/, '$1The Life Change Accelerator$2'],
  [/(<meta property="og:title" content=")[^"]*(")/, `$1${OG_TITLE}$2`],
  [/(<meta property="og:description" content=")[^"]*(")/, `$1${OG_DESC}$2`],
  [/(<meta property="og:type" content=")[^"]*(")/, '$1website$2'],
  [/(<meta property="og:url" content=")[^"]*(")/, `$1${URL}$2`],
  [/(<meta property="og:image" content=")[^"]*(")/, `$1${IMG}$2`],
  [/(<meta property="og:image:width" content=")[^"]*(")/, '$11400$2'],
  [/(<meta property="og:image:height" content=")[^"]*(")/, '$11200$2'],
  [/(<meta property="og:image:alt" content=")[^"]*(")/, '$1Annie Chitate, RN and Joel Polley, RN — The Life Change Accelerator$2'],
  [/<meta property="product:price:amount" content="[^"]*" \/>\s*/, ''],
  [/<meta property="product:price:currency" content="[^"]*" \/>\s*/, ''],
  [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${OG_TITLE}$2`],
  [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${OG_DESC}$2`],
  [/(<meta name="twitter:image" content=")[^"]*(")/, `$1${IMG}$2`],
];

let missed = 0;
for (const [re, repl] of swaps) {
  if (!re.test(html)) { missed += 1; console.warn('allin-meta: pattern not found:', re); }
  html = html.replace(re, repl);
}

writeFileSync(resolve(root, 'dist/allin-share.html'), html);
// stable OG image: the Annie + Joel duo photo already in public/
copyFileSync(resolve(root, 'public/annie-joel-scrubs.jpg'), resolve(root, 'dist/allin-og.jpg'));
console.log(`allin-meta: wrote dist/allin-share.html (+allin-og.jpg), ${missed} patterns missed`);
