// api/_state-cron.js — shared engine for the per-state email crons.
//
// Cloned + trimmed from bpquiz-site. v1 has two states / two crons:
//   _lead-emails.js   (state 'lead')  — the lead nurture (Triangle teaching → $27)
//   _buyer-emails.js  (state 'buyer') — buyer delivery / onboarding
//
// The engine:
//   1. Cron auth check.
//   2. Env sanity (RESEND_API_KEY, KV_REST_API_URL).
//   3. SCAN bwbp:drip:* records, batched mget.
//   4. State filter — only records in this exact state advance.
//   5. Day computed from stateEnteredAt (entry-into-state = Day 0), with a
//      small catch-up window so a cron outage doesn't permanently skip a day.
//   6. Per-day idempotency via a per-record sent flag — re-runs never double-send.
//   7. Skip unsubscribed / complete / paused.
//   8. Optional per-day tier/score gate: if a day's email defines
//      shouldSend(ctx) and it returns false (e.g. a corner-2 deep-dive for a
//      single-corner buyer whose tier does not include it), the day is skipped
//      for that record. Days with no shouldSend always send (backward-compatible).
//   9. Resend send with one-click List-Unsubscribe headers + rate limit.
//
// The engine NEVER changes state — only sets sent flags. State transitions
// happen on purchase (stripe-webhook.js) or capture (capture-lead.js). That
// separation is what keeps these crons idempotent. DO NOT add timer-based
// transitions here.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { isAuthorizedCron } from './_triangle-cron-auth.js';

const RATE_LIMIT_MS = 100; // ~10/sec — Resend free-tier ceiling
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

function daysBetween(isoA, now = Date.now()) {
  const a = new Date(isoA).getTime();
  if (Number.isNaN(a)) return -1;
  return Math.floor((now - a) / 86400000);
}

/**
 * Run the per-state cron for ONE state.
 * @param {object} cfg
 * @param {object} cfg.req, cfg.res
 * @param {string} cfg.state               — KV state to filter ('lead' | 'buyer')
 * @param {object} cfg.daysMap             — { [dayNumber]: emailObject }
 * @param {(day:number)=>string} cfg.sentFlag — KV field name for a day's sent flag
 * @param {string} cfg.from, cfg.replyTo
 * @param {string} [cfg.dryRunEnv]         — env var name to force a dry run
 * @param {string} cfg.label               — log label
 */
export async function runStateCron({
  req, res, state, daysMap, sentFlag, from, replyTo, dryRunEnv, label,
}) {
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

  // Drain the SCAN cursor (Upstash disables KEYS() at scale).
  const allKeys = [];
  let scanCursor = 0;
  do {
    const [next, batch] = await kv.scan(scanCursor, { match: 'bwbp:drip:*', count: 500 });
    allKeys.push(...batch);
    scanCursor = next;
  } while (String(scanCursor) !== '0');

  const MGET_BATCH = 100;
  const summary = {
    label, state, scanned: 0, inState: 0, sentByDay: {},
    skippedExcluded: 0, skippedWrongState: 0, skippedNoMatchingDay: 0,
    skippedAlreadySent: 0, skippedNoEnteredAt: 0, errors: 0,
  };
  const errors = [];

  for (let batchStart = 0; batchStart < allKeys.length; batchStart += MGET_BATCH) {
    const keysBatch = allKeys.slice(batchStart, batchStart + MGET_BATCH);
    const subs = keysBatch.length ? await kv.mget(...keysBatch) : [];
    for (let i = 0; i < keysBatch.length; i++) {
      const key = keysBatch[i];
      const sub = subs[i];
      summary.scanned++;
      try {
        if (!sub || !sub.email) continue;

        if (sub.unsubscribed || sub.complete || sub.paused) {
          summary.skippedExcluded++;
          continue;
        }
        if (sub.state !== state) {
          summary.skippedWrongState++;
          continue;
        }
        summary.inState++;

        if (!sub.stateEnteredAt) {
          summary.skippedNoEnteredAt++;
          continue;
        }
        const daysSince = daysBetween(sub.stateEnteredAt);
        if (daysSince < 0) {
          summary.skippedNoMatchingDay++;
          continue;
        }

        // Match day → email, with a 3-day catch-up look-back so an outage
        // that spanned a send day sends late rather than never.
        const CATCHUP_WINDOW = 3;
        let sendDay = daysSince;
        let email = daysMap[sendDay];
        if (!email) {
          email = null;
          for (let back = 1; back <= CATCHUP_WINDOW; back++) {
            const d = daysSince - back;
            if (d < 0) break;
            if (daysMap[d]) {
              if (!sub[sentFlag(d)]) {
                sendDay = d;
                email = daysMap[d];
              }
              break;
            }
          }
        }
        if (!email) {
          summary.skippedNoMatchingDay++;
          continue;
        }

        const flagName = sentFlag(sendDay);
        if (sub[flagName]) {
          summary.skippedAlreadySent++;
          continue;
        }

        const unsubToken = signUnsubToken({ email: sub.email });
        const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
        // ctx carries the record's safe personalization fields so a day's body
        // can speak to the lead's quiz corner / paid tier. Additive + optional:
        // any day that ignores these still works (Phase 2 agent #4).
        const ctx = {
          firstName: sub.firstName || '',
          corner: sub.corner || null,
          readiness: sub.readiness || null,
          scores: sub.scores || null,
          paidTier: sub.paidTier || null,
          caseReview: sub.caseReview === true,
          email: sub.email,
          unsubUrl,
        };

        // Optional per-day gate. A day may declare shouldSend(ctx) to opt a
        // record out (e.g. a corner-2 / corner-3 deep-dive that the buyer's tier
        // does not include). No shouldSend => always send (backward-compatible).
        if (typeof email.shouldSend === 'function' && !email.shouldSend(ctx)) {
          summary.skippedNoMatchingDay++;
          continue;
        }

        const htmlBody = email.htmlBody(ctx);
        const textBody = email.textBody(ctx);
        // subject may be a static string OR a function of ctx (so a day can vary
        // its subject per buyer, e.g. a corner-specific science deep-dive).
        const subject = typeof email.subject === 'function' ? email.subject(ctx) : email.subject;

        if (DRY_RUN) {
          console.log(`[DRY] ${label}: would send Day ${sendDay} to ${sub.email} — "${subject}"`);
        } else {
          await resend.emails.send({
            from, to: sub.email, replyTo,
            subject,
            html: htmlBody, text: textBody,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
          await kv.set(key, {
            ...sub,
            [flagName]: true,
            [`${flagName}At`]: new Date().toISOString(),
            lastSentAt: new Date().toISOString(),
          });
        }

        summary.sentByDay[sendDay] = (summary.sentByDay[sendDay] || 0) + 1;
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      } catch (err) {
        summary.errors++;
        errors.push({ key, message: err.message });
        console.error(`${label} error on ${key}:`, err.message);
      }
    }
  }

  console.log(`${label} summary:`, JSON.stringify(summary));
  return res.status(200).json({ ok: true, dryRun: DRY_RUN, summary, errors: errors.slice(0, 20) });
}

export const cronConfig = { maxDuration: 300 };
