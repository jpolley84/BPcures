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

// 2026-07-16: Resend's default API rate limit is 2 req/s (the old 100ms /
// "10/sec" claim was wrong and produced 429 storms at volume). 550ms ≈ 1.8/s.
// Throughput: ~500 sends per 300s invocation; the lead cron now runs HOURLY
// (vercel.json) so the 6,313-lead freegift cohort clears each arc day
// (~13 invocations) instead of silently missing its 2-3 run day-window.
const RATE_LIMIT_MS = 550;
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Records created by a bulk backfill of already-on-the-list contacts, rather
// than by a real opt-in. Their stateEnteredAt is the migration timestamp, not
// a genuine signup, so the day-N arc would re-onboard people who have been
// with us for months. Matched on the `source` stamp the migration wrote.
// Verified against the live source distribution 2026-07-22 (8,344 records):
//   legacy-broadcast-freegift-2026-07-16 .. 6308  <- the real cohort
//   legacy-flash-migration-2026-07-17 ......  196  (also flashOnly)
//   legacy-gap-lead-2026-07-17 .............    3
// Everything else is a genuine opt-in (quiz-lead-magnet, quiz-result,
// manychat-*, stripe-direct, coaching-optin, masterclass-page) and must
// keep its full arc, so we anchor on the `legacy-` migration prefix only.
const LEGACY_MIGRATED_SOURCE = /^legacy-/i;
const RERUN_LEGACY_ARC = process.env.RERUN_LEGACY_ARC === '1';

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
    label, state, scanned: 0, inState: 0, sentByDay: {}, resentByDay: {},
    skippedExcluded: 0, skippedWrongState: 0, skippedNoMatchingDay: 0,
    skippedAlreadySent: 0, skippedNoEnteredAt: 0, skippedLegacyRerun: 0, errors: 0,
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
        // 2026-07-17: flashOnly records are legacy past-buyers migrated ONLY
        // for the $97 Sprint flash arc (sprint-flash-cron). They must never
        // enter the lead OR buyer sequence here (they already own their kit
        // and bought long ago), so the shared engine skips them entirely.
        if (sub.flashOnly) {
          summary.skippedExcluded++;
          continue;
        }
        // 2026-07-22 (Joel: "skip reruns"): the legacy-gap migration on
        // 2026-07-17 enrolled ~7.7k EXISTING contacts into the lead arc and
        // stamped stateEnteredAt = migration time, so this engine reads them
        // as brand-new leads and walks them through onboarding again. The
        // migration pre-suppressed Day 0 (leadDay0Sent set with no SentAt, so
        // nobody got a second Blueprint) but Days 2 through 15 were flowing.
        // These people have been on the list for months, so we stop the
        // re-run. They stay eligible for evergreen at day 22 and land on the
        // NEWSTART series instead, which is genuinely new to them.
        // Genuine new captures carry a different source and are unaffected.
        // Reversible: set RERUN_LEGACY_ARC=1 to let this cohort finish.
        if (!RERUN_LEGACY_ARC && LEGACY_MIGRATED_SOURCE.test(sub.source || '')) {
          summary.skippedLegacyRerun++;
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

        // 2026-07-20 Martell A4 resend pass: a day may declare `.resend`
        // ({ subject, htmlBody, textBody, afterHours?, windowHours? }). When
        // the normal pass has nothing to send for this record, look for a
        // resendable day whose first send happened afterHours..windowHours
        // ago and re-send the swapped-subject variant ONCE. The record's
        // state filter above means anyone who purchased (state flip) or
        // unsubscribed never receives a resend.
        let isResend = false;
        let flagName = email && !sub[sentFlag(sendDay)] ? sentFlag(sendDay) : null;
        if (!flagName) {
          if (email) summary.skippedAlreadySent++;
          email = null;
          for (const dStr of Object.keys(daysMap)) {
            const d = Number(dStr);
            const dayEmail = daysMap[d];
            if (!dayEmail.resend) continue;
            const firstFlag = sentFlag(d);
            if (!sub[firstFlag] || sub[`${firstFlag}Resent`]) continue;
            const sentAtIso = sub[`${firstFlag}At`];
            if (!sentAtIso) continue;
            const hrsSince = (Date.now() - new Date(sentAtIso).getTime()) / 3600000;
            const after = dayEmail.resend.afterHours ?? 8;
            const windowH = dayEmail.resend.windowHours ?? 30;
            if (hrsSince < after || hrsSince > windowH) continue;
            email = dayEmail.resend;
            flagName = `${firstFlag}Resent`;
            sendDay = d;
            isResend = true;
            break;
          }
        }
        if (!email) {
          summary.skippedNoMatchingDay++;
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
          // 2026-07-16 Annie-v2: the 5 Hidden Triggers quiz stores the lead's
          // trigger slug + display name (lead-magnet.js). Older records carry
          // neither; sequence bodies must fall back gracefully.
          trigger: sub.trigger || null,
          triggerName: sub.triggerName || null,
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
          console.log(`[DRY] ${label}: would ${isResend ? 'RESEND' : 'send'} Day ${sendDay} to ${sub.email} — "${subject}"`);
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
          // 2026-07-16: re-GET before write. `sub` came from a batched mget
          // that can be minutes stale by now; writing {...sub} back would
          // clobber a webhook state flip (buyer!) or an unsubscribe that
          // landed mid-batch. Merge the sent flags onto the FRESH record.
          const fresh = (await kv.get(key)) || sub;
          await kv.set(key, {
            ...fresh,
            [flagName]: true,
            [`${flagName}At`]: new Date().toISOString(),
            lastSentAt: new Date().toISOString(),
          });
        }

        if (isResend) {
          summary.resentByDay[sendDay] = (summary.resentByDay[sendDay] || 0) + 1;
        } else {
          summary.sentByDay[sendDay] = (summary.sentByDay[sendDay] || 0) + 1;
        }
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
