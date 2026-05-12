// api/_cron-auth.js — shared cron-authentication helper.
//
// 2026-05-12: rewrote after discovering all three crons (drip / postiz /
// zoom-closer) were returning 401 on every fire. Root cause: Vercel
// changed its cron-auth mechanism. The legacy `x-vercel-cron: 1` header
// is no longer reliably set. Current spec (per Vercel docs) is:
//
//   Authorization: Bearer ${process.env.CRON_SECRET}
//
// where CRON_SECRET is an env var YOU set in Vercel project settings,
// and Vercel auto-injects that same value into the Authorization header
// on every cron-triggered request.
//
// This helper checks three auth paths in order — accept any:
//   1. Authorization: Bearer ${CRON_SECRET}        — Vercel cron (current)
//   2. Authorization: Bearer ${CRON_AUTH_TOKEN}    — manual curl triggers
//   3. x-vercel-cron: 1                            — Vercel cron (legacy)
//
// Setup required (one-time per project):
//   • In Vercel project Settings → Environment Variables, add:
//       CRON_SECRET = <any strong random string, e.g. openssl rand -hex 32>
//   • That same value is auto-sent by Vercel on every cron fire.
//   • Optional: CRON_AUTH_TOKEN for manual curl triggers (separate value).
//
// Usage from a cron handler:
//   import { isAuthorizedCron } from './_cron-auth.js';
//   if (!isAuthorizedCron(req)) {
//     return res.status(401).json({ error: 'unauthorized' });
//   }

export function isAuthorizedCron(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();

  // 1. Vercel cron (current spec): Authorization: Bearer ${CRON_SECRET}
  const cronSecret = process.env.CRON_SECRET || '';
  if (cronSecret && bearer && bearer === cronSecret) return true;

  // 2. Manual curl trigger: Authorization: Bearer ${CRON_AUTH_TOKEN}
  const manualToken = process.env.CRON_AUTH_TOKEN || '';
  if (manualToken && bearer && bearer === manualToken) return true;

  // 3. Vercel cron (legacy header): x-vercel-cron: 1
  if (req.headers['x-vercel-cron'] === '1') return true;

  return false;
}

// Optional diagnostic — returns which path succeeded (or null). Useful for
// debug logging in handlers without leaking the actual secret value.
export function cronAuthSource(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  if (process.env.CRON_SECRET && bearer === process.env.CRON_SECRET) return 'vercel-bearer';
  if (process.env.CRON_AUTH_TOKEN && bearer === process.env.CRON_AUTH_TOKEN) return 'manual-bearer';
  if (req.headers['x-vercel-cron'] === '1') return 'vercel-header-legacy';
  return null;
}
