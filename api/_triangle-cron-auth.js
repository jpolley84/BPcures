// api/_cron-auth.js — shared cron-authentication helper (cloned from bpquiz).
//
// Accepts any of three auth paths:
//   1. Authorization: Bearer ${CRON_SECRET}      — Vercel cron (current spec;
//      Vercel auto-injects CRON_SECRET on every cron fire)
//   2. Authorization: Bearer ${CRON_AUTH_TOKEN}  — manual curl triggers
//   3. x-vercel-cron: 1                           — Vercel cron (legacy header),
//      ONLY when neither secret is configured
//
// ⚠️ SECURITY FIX 2026-08-02: path 3 used to return true unconditionally.
// `x-vercel-cron` is a plain request header anyone can send, so in a public
// repo that made every cron endpoint anonymously callable (verified live by
// the 2026-07-25 audit: 200 with the header, 401 without). It is now a
// bootstrap-only fallback. Keep this file in sync with api/_cron-auth.js.

export function isAuthorizedCron(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();

  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret && bearer && bearer === cronSecret) return true;

  const manualToken = process.env.CRON_AUTH_TOKEN || '';
  if (manualToken && bearer && bearer === manualToken) return true;

  // Bootstrap fallback ONLY — a request header is not a credential.
  if (!cronSecret && !manualToken && req.headers['x-vercel-cron'] === '1') return true;

  return false;
}
