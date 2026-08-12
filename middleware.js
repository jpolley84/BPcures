// Edge Middleware (Vercel) — changemylifechallenge.com root.
//
// 2026-08-12 (Joel): challenge is off for now. changemylifechallenge.com and
// bpquiz.com/challenge both redirect to bpquiz.com/masterclass.
//
// The old cmlc.html crawler-shell swap (dist/index.html carried BPQuiz's
// <title>/og:* tags, so shares of this domain showed the BP quiz card) is
// moot while the domain is just a redirect — nothing renders here to have
// wrong meta tags. Middleware runs BEFORE vercel.json routing/filesystem, so
// it's still the right place to force this: a vercel.json redirect alone
// would arrive too late, after this domain's own routing already resolved.
//
// To bring the challenge back: revert this file to rewrite '/' → '/cmlc.html'
// (see git history) and revert the matching vercel.json redirects.

export const config = { matcher: '/:path*' };

export default function middleware(request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  if (host === 'changemylifechallenge.com' || host === 'www.changemylifechallenge.com') {
    return Response.redirect('https://bpquiz.com/masterclass', 307);
  }
  return undefined;
}
