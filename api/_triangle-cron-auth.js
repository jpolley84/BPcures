// api/_cron-auth.js — shared cron-authentication helper (cloned from bpquiz).
//
// Accepts any of three auth paths:
//   1. Authorization: Bearer ${CRON_SECRET}      — Vercel cron (current spec;
//      Vercel auto-injects CRON_SECRET on every cron fire)
//   2. Authorization: Bearer ${CRON_AUTH_TOKEN}  — manual curl triggers
//   3. x-vercel-cron: 1                           — Vercel cron (legacy header)

export function isAuthorizedCron(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();

  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret && bearer && bearer === cronSecret) return true;

  const manualToken = process.env.CRON_AUTH_TOKEN || '';
  if (manualToken && bearer && bearer === manualToken) return true;

  if (req.headers['x-vercel-cron'] === '1') return true;

  return false;
}
