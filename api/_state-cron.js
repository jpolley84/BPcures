// api/_state-cron.js — shared engine for the 5 per-state crons
// (lead-cron / tier-1-cron / tier-2-cron / tier-3-cron / tier-4-cron).
//
// Phase 2 of the state-machine email rebuild (2026-05-17 spec). Each
// tier-cron is a thin wrapper that calls runStateCron() with its own
// state name, days map, and sent-flag function. The engine handles:
//
//   1. Vercel cron auth check
//   2. Env var sanity (RESEND_API_KEY, KV_REST_API_URL)
//   3. KV scan of `drip:*` records
//   4. State filter — only subscribers in this exact state advance
//   5. Day computation from `stateEnteredAt` (NOT enrolledAt — state
//      machine uses entry-into-state as Day 0 of each sequence)
//   6. Per-day idempotency via per-email sent flag (tier1Day0Sent,
//      tier1Day3Sent, etc.) — re-running the cron never double-sends
//   7. Sub-state guards: unsubscribed, complete, paused → skip
//   8. Stop conditions per state (handled by transition logic
//      elsewhere — this cron just respects whatever state it finds)
//   9. Resend send with unsubscribe headers
//  10. Rate-limit (100ms = ~10/sec, Resend free-tier ceiling)
//  11. JOEL_NOTIFY alert on elevated error rate
//  12. Summary log + JSON response
//
// Engine never modifies state — only sets sent flags. State transitions
// happen in stripe-webhook.js (purchase events) or lead-magnet.js (quiz
// capture). This separation keeps the cron idempotent and testable.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './unsubscribe.js';
import { isAuthorizedCron } from './_cron-auth.js';

const RATE_LIMIT_MS = 100;       // ~10/sec — Resend free-tier ceiling
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const JOEL_NOTIFY = process.env.JOEL_NOTIFY || 'braveworksrn@gmail.com';
const ERROR_ALERT_THRESHOLD = 3; // Alert if 3+ errors in one run

function daysBetween(isoA, now = Date.now()) {
  const a = new Date(isoA).getTime();
  if (Number.isNaN(a)) return -1;
  return Math.floor((now - a) / 86400000);
}

async function alertJoel(resend, subject, text) {
  try {
    await resend.emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: JOEL_NOTIFY,
      subject,
      text,
    });
  } catch (err) {
    console.error('alertJoel send failed:', err.message);
  }
}

/**
 * Run the per-state cron for ONE tier.
 *
 * @param {object} cfg
 * @param {object} cfg.req                  — Vercel request object
 * @param {object} cfg.res                  — Vercel response object
 * @param {string} cfg.state                — KV state value to filter ('lead' | 'tier-1' | ...)
 * @param {object} cfg.daysMap              — Day-number → email-object (e.g. TIER_1_DAYS)
 * @param {(day: number) => string} cfg.sentFlag — Returns the KV field name for a day's sent flag
 * @param {string} cfg.from                 — From header
 * @param {string} cfg.replyTo              — Reply-To header
 * @param {string} [cfg.dryRunEnv]          — Env var name to check for dry-run (e.g. 'TIER_1_DRY_RUN')
 * @param {string} cfg.label                — Human label for logs (e.g. 'tier-1-cron')
 */
export async function runStateCron({
  req, res, state, daysMap, sentFlag, from, replyTo, dryRunEnv, label,
}) {
  // Cron auth (Vercel Bearer / x-vercel-cron / manual CRON_AUTH_TOKEN)
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not set' });
  }
  if (!process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'KV_REST_API_URL not set' });
  }

  const DRY_RUN = dryRunEnv && process.env[dryRunEnv] === '1';
  const resend = new Resend(process.env.RESEND_API_KEY);
  const allKeys = await kv.keys('drip:*');
  console.log(`${label}: scanning ${allKeys.length} drip records, state=${state}`);

  const summary = {
    label,
    state,
    scanned: 0,
    inState: 0,
    sentByDay: {},
    skippedExcluded: 0,    // unsub/paused/complete
    skippedWrongState: 0,
    skippedNoMatchingDay: 0,
    skippedAlreadySent: 0,
    skippedNoEnteredAt: 0,
    errors: 0,
  };
  const errors = [];

  for (const key of allKeys) {
    summary.scanned++;
    try {
      const sub = await kv.get(key);
      if (!sub || !sub.email) continue;

      // Hard exclusions — regardless of state, these never fire
      if (sub.unsubscribed || sub.complete || sub.paused) {
        summary.skippedExcluded++;
        continue;
      }

      // State filter — this cron only advances subscribers in its
      // exact state. Other states are owned by other crons.
      if (sub.state !== state) {
        summary.skippedWrongState++;
        continue;
      }

      summary.inState++;

      // State-entry timestamp is the day-zero anchor.
      if (!sub.stateEnteredAt) {
        summary.skippedNoEnteredAt++;
        continue;
      }
      const daysSince = daysBetween(sub.stateEnteredAt);
      if (daysSince < 0) {
        summary.skippedNoMatchingDay++;
        continue;
      }

      // Match day to email
      const email = daysMap[daysSince];
      if (!email) {
        summary.skippedNoMatchingDay++;
        continue;
      }

      // Idempotency — never re-send a day already sent
      const flagName = sentFlag(daysSince);
      if (sub[flagName]) {
        summary.skippedAlreadySent++;
        continue;
      }

      // Render
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
      const ctx = { firstName: sub.firstName || '', unsubUrl };
      const htmlBody = email.htmlBody(ctx);
      const textBody = email.textBody(ctx);

      if (DRY_RUN) {
        console.log(`[DRY] ${label}: would send Day ${daysSince} to ${sub.email} — "${email.subject}"`);
      } else {
        await resend.emails.send({
          from,
          to: sub.email,
          replyTo,
          subject: email.subject,
          html: htmlBody,
          text: textBody,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        // Mark sent — preserve all other fields with object spread
        await kv.set(key, {
          ...sub,
          [flagName]: true,
          [`${flagName}At`]: new Date().toISOString(),
          lastSentAt: new Date().toISOString(),
        });
      }

      summary.sentByDay[daysSince] = (summary.sentByDay[daysSince] || 0) + 1;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (err) {
      summary.errors++;
      errors.push({ key, message: err.message });
      console.error(`${label} error on ${key}:`, err.message);
    }
  }

  console.log(`${label} summary:`, JSON.stringify(summary));

  // Alert Joel on elevated error rate (transient errors expected; flood = problem)
  if (!DRY_RUN && summary.errors >= ERROR_ALERT_THRESHOLD) {
    await alertJoel(
      resend,
      `[${label}] ${summary.errors} errors during today's fire`,
      `${label} ran with elevated errors.\n\nSummary:\n${JSON.stringify(summary, null, 2)}\n\nFirst few errors:\n${errors.slice(0, 5).map((e) => `  - ${e.key}: ${e.message}`).join('\n')}\n\nIf transient Resend / KV blip, expect tomorrow's fire to recover. If errors persist 3+ days, check runtime logs.`,
    );
  }

  return res.status(200).json({
    ok: true,
    dryRun: DRY_RUN,
    summary,
    errors: errors.slice(0, 20),
  });
}

export const cronConfig = { maxDuration: 300 };
