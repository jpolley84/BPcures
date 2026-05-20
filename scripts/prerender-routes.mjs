// scripts/prerender-routes.mjs
//
// 2026-05-20 — fix the SEO ceiling. The SPA returns the same generic
// index.html for every route, so Google's first-pass crawler sees the
// homepage title + meta on blog posts. JSON-LD schema lives inside the
// blog post's index.json body field — invisible to crawlers until JS
// renders. Result: 13 of 14 sitemap URLs unindexed 2 days after GSC
// verification, blog pillar articles can't rank.
//
// Fix: post-build script reads dist/index.html as a template, customizes
// it per route with proper <title>, meta description, OG tags, canonical
// URL, and embedded JSON-LD schema. Writes to dist/blog/<slug>/index.html
// (and dist/about/joel/index.html). Vercel's static-file lookup runs
// before the SPA-fallback rewrite, so these custom HTMLs win.
//
// What stays SPA-rendered: the actual article markdown body. Google's
// second-pass renderer picks up the JS-rendered content. The first-pass
// signal (title + meta + schema) is what gets us into the index fast.
//
// Run after `npm run build`. Wired as a "postbuild" script in package.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const blogDir = path.join(projectRoot, 'public', 'blog');

if (!fs.existsSync(distDir)) {
  console.error('prerender-routes: dist/ not found — run `npm run build` first');
  process.exit(1);
}

const shellHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// ─── Per-route metadata ────────────────────────────────────────────────
//
// /blog/<slug> entries are derived from public/blog/<slug>/index.json.
// Other routes are hand-curated below — these are pages we want optimized
// for SEO that don't have a per-route data file.

const STATIC_ROUTES = [
  {
    route: '/about/joel',
    title: 'Joel Polley, RN — The Blood Pressure Guy | About',
    description:
      'Joel Polley, RN — 20 years ICU and emergency medicine, naturopathic practitioner, founder of BraveWorks RN. Author of the BP Triangle Method and the BP Reset Kit. Featured on TikTok @braveworksrn (155K+).',
    ogType: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': 'https://bpquiz.com/about/joel#person',
          name: 'Joel Polley',
          jobTitle: 'Registered Nurse, Naturopathic Practitioner',
          description:
            '20 years in ICU and emergency medicine. Founder of BraveWorks RN and The Blood Pressure Guy. Naturopathic practitioner specializing in cardiovascular and metabolic health.',
          url: 'https://bpquiz.com/about/joel',
          sameAs: [
            'https://www.tiktok.com/@braveworksrn',
            'https://www.instagram.com/braveworksrn',
            'https://bpquiz.com',
          ],
          worksFor: {
            '@type': 'Organization',
            name: 'BraveWorks RN',
            url: 'https://bpquiz.com',
          },
          knowsAbout: [
            'Hypertension',
            'Blood Pressure',
            'Cortisol',
            'Insulin Resistance',
            'Naturopathy',
            'Cardiovascular Health',
          ],
        },
        {
          '@type': 'MedicalBusiness',
          name: 'BraveWorks RN',
          url: 'https://bpquiz.com',
          founder: { '@id': 'https://bpquiz.com/about/joel#person' },
          medicalSpecialty: 'Cardiovascular',
        },
      ],
    },
  },
];

// ─── Blog routes — derived from public/blog/*/index.json ───────────────

function loadBlogRoutes() {
  if (!fs.existsSync(blogDir)) return [];
  const slugs = fs.readdirSync(blogDir).filter((name) => {
    const idx = path.join(blogDir, name, 'index.json');
    return fs.existsSync(idx);
  });

  const routes = [];
  for (const slug of slugs) {
    try {
      const post = JSON.parse(fs.readFileSync(path.join(blogDir, slug, 'index.json'), 'utf-8'));
      const title = post.title ? `${post.title} | BraveWorks RN` : `${slug} | BraveWorks RN`;
      const description = post.excerpt || 'BraveWorks RN — natural blood pressure protocols by Joel Polley, RN.';

      // Pull the JSON-LD <script> block out of the body markdown so we
      // can inject it into <head>. Crawlers find structured data faster
      // in <head> than buried in body content.
      let jsonLdScript = '';
      if (post.body) {
        const m = post.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (m) jsonLdScript = m[0];
      }

      routes.push({
        route: `/blog/${slug}`,
        title,
        description,
        ogType: 'article',
        jsonLdScriptRaw: jsonLdScript,
        publishedDate: post.date || null,
        author: post.author || 'Joel Polley',
        tags: post.tags || [],
      });
    } catch (err) {
      console.warn(`prerender-routes: skipping ${slug} — failed to load index.json:`, err.message);
    }
  }
  return routes;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function customizeHtml({ route, title, description, ogType = 'article', jsonLdScriptRaw, jsonLd, publishedDate, author }) {
  const canonical = `https://bpquiz.com${route}`;
  let html = shellHtml;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`);

  // Replace <meta name="description">
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(description)}" />`
  );

  // Replace <link rel="canonical">
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  // Replace OG tags (title / description / type / url)
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeAttr(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeAttr(description)}" />`
  );
  html = html.replace(
    /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${ogType}" />`
  );
  html = html.replace(
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${canonical}" />`
  );

  // Add article-specific meta if available
  let articleMeta = '';
  if (ogType === 'article') {
    if (publishedDate) {
      articleMeta += `<meta property="article:published_time" content="${escapeAttr(publishedDate)}" />\n    `;
    }
    if (author) {
      articleMeta += `<meta property="article:author" content="${escapeAttr(author)}" />\n    `;
    }
  }

  // Build JSON-LD script tag
  let schemaBlock = '';
  if (jsonLdScriptRaw) {
    schemaBlock = jsonLdScriptRaw;
  } else if (jsonLd) {
    schemaBlock = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  }

  // Inject article meta + schema right before </head>
  const headInjection = `${articleMeta}${schemaBlock}\n  </head>`;
  html = html.replace('</head>', headInjection);

  return html;
}

function writeRoute(route, html) {
  // Strip leading slash, treat as directory
  const relativePath = route.replace(/^\//, '');
  const outDir = path.join(distDir, relativePath);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  fs.writeFileSync(outFile, html, 'utf-8');
  return outFile;
}

// ─── Run ───────────────────────────────────────────────────────────────

const blogRoutes = loadBlogRoutes();
const allRoutes = [...STATIC_ROUTES, ...blogRoutes];

console.log(`prerender-routes: ${allRoutes.length} routes to write (${blogRoutes.length} blog + ${STATIC_ROUTES.length} static)`);

let ok = 0;
let errors = 0;
for (const r of allRoutes) {
  try {
    const html = customizeHtml(r);
    const file = writeRoute(r.route, html);
    const rel = path.relative(projectRoot, file);
    console.log(`  ✓ ${r.route.padEnd(48)} → ${rel}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${r.route} — ${err.message}`);
    errors++;
  }
}

console.log(`\nprerender-routes: ${ok} written, ${errors} failed.`);
if (errors > 0) process.exit(1);
