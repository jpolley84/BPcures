// Edge Middleware (Vercel) — changemylifechallenge.com root shell swap.
//
// dist/index.html carries BPQuiz's <title>/og:* tags, and crawlers do not run
// JS, so shares of changemylifechallenge.com showed the BP quiz card. A
// vercel.json rewrite of "/" cannot fix this because the filesystem match for
// index.html wins before rewrites are evaluated. Middleware runs BEFORE the
// filesystem, so the challenge domain's root is rewritten to /cmlc.html, the
// crawler-correct copy of the shell emitted by scripts/cmlc-meta.mjs at build
// time. Same JS bundle, same page; only the static <head> differs.
//
// Every other host and every other path falls through untouched.

export const config = { matcher: '/' };

export default function middleware(request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  if (host === 'changemylifechallenge.com' || host === 'www.changemylifechallenge.com') {
    const dest = new URL('/cmlc.html', url);
    return new Response(null, { headers: { 'x-middleware-rewrite': dest.toString() } });
  }
  return undefined;
}
