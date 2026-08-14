#!/usr/bin/env node
// Drift guard for the /go/<product> attribution interstitial.
//
// api/go.js keeps its own destination table because a Vercel function cannot
// read vercel.json at runtime. That duplication is the risk: if someone changes
// where /tea points and misses api/go.js, then DM tea traffic silently goes to
// the OLD store while the rest of the site goes to the new one, and nobody
// finds out from an error — only from a revenue dip.
//
// This test asserts the two tables agree, and that the rewrite that makes the
// route reachable is actually present and ordered ahead of the SPA catch-all.
//
//   node tests/verify-go-destinations.mjs
//
// Exit 0 = in sync. Non-zero = do NOT deploy.

import { readFileSync } from 'node:fs';
import { DESTINATIONS } from '../api/go.js';

const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const redirects = vercel.redirects || [];
const rewrites = vercel.rewrites || [];

let failed = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failed++; };
const pass = (msg) => console.log(`  PASS  ${msg}`);

// 1. Every product in the table must match its bare-path redirect exactly.
for (const [product, dest] of Object.entries(DESTINATIONS)) {
  const redirect = redirects.find((r) => r.source === `/${product}`);
  if (!redirect) {
    fail(`vercel.json has no redirect for /${product}, but api/go.js claims one`);
  } else if (redirect.destination !== dest) {
    fail(`/${product} DRIFTED\n        vercel.json: ${redirect.destination}\n        api/go.js:   ${dest}`);
  } else {
    pass(`/${product} destination matches vercel.json`);
  }
}

// 2. The rewrite must exist, or /go/tea renders the SPA and the tag never fires.
const goRewrite = rewrites.find((r) => r.source === '/go/:product');
if (!goRewrite) {
  fail('vercel.json has no /go/:product rewrite — the interstitial is unreachable');
} else if (!goRewrite.destination.startsWith('/api/go')) {
  fail(`/go/:product rewrite points at ${goRewrite.destination}, expected /api/go`);
} else {
  pass('/go/:product rewrite present and pointed at /api/go');
}

// 3. Order matters: Vercel takes the first matching rewrite. If the SPA
//    catch-all is ahead of it, /go/tea returns index.html with a 200 and the
//    visitor sees a blank React route instead of the product page.
const goIndex = rewrites.findIndex((r) => r.source === '/go/:product');
const catchAllIndex = rewrites.findIndex((r) => r.destination === '/index.html');
if (goIndex !== -1 && catchAllIndex !== -1 && goIndex > catchAllIndex) {
  fail(`/go/:product rewrite is at index ${goIndex}, AFTER the SPA catch-all at ${catchAllIndex}`);
} else if (goIndex !== -1) {
  pass(`/go/:product is ordered ahead of the SPA catch-all (${goIndex} < ${catchAllIndex})`);
}

// 4. The three off-site keywords are the reason this exists. If one loses its
//    entry, the nudge starts lying to that segment.
for (const required of ['tea', 'magnesium', 'saffron']) {
  if (!DESTINATIONS[required]) {
    fail(`api/go.js DESTINATIONS is missing "${required}" — its DM link cannot write bw-landed`);
  }
}

console.log(failed ? `\n${failed} failure(s)` : '\nAll /go destination checks passed.');
process.exit(failed ? 1 : 0);
