// /api/drip-cron — daily Vercel cron handler for the 7-Day BPQuiz Onboarding Funnel.
//
// Schedule: Every day at 12:00 UTC = 7:00 AM CDT (see vercel.json).
//
// What it does:
//   1. Iterates Vercel KV looking up `drip:*` subscriber records.
//   2. Computes which day each is due for (based on enrolledAt + cohortOffsetDays).
//   3. Sends the matching email via Resend.
//   4. Day 7 special: includes an HMAC-signed opt-in URL. Subscribers who don't
//      click within 24h are marked `optedIn:false` and dropped from Days 8+.
//   5. After Day 7, only `optedIn:true` subscribers continue (cost + engagement filter).
//   6. After Day 30, subscriber's `complete:true` flag is set and they stop receiving.
//
// Env vars:
//   RESEND_API_KEY            — already set
//   KV_REST_API_URL / TOKEN   — auto-set when Vercel KV is provisioned
//   DRIP_OPT_IN_SECRET        — 32-byte random for HMAC signing
//   VITE_SITE_URL             — already set, used to build opt-in URLs
//   DRIP_DRY_RUN              — set to '1' to log instead of send (dev/test)
//
// Auth: Vercel cron now sends `Authorization: Bearer ${CRON_SECRET}`.
// Legacy `x-vercel-cron: 1` header is kept as a fallback. Manual triggers
// use a separate `CRON_AUTH_TOKEN` bearer. All three paths handled by the
// shared helper in `./_cron-auth.js`. (2026-05-12 — three crons were
// silently 401'ing because Vercel's auth mechanism changed.)

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import crypto from 'node:crypto';
import { renderEmail, DAYS } from './_drip-emails.js';
import { isAuthorizedCron } from './_cron-auth.js';

// 3,392 records × ~50ms KV.get + ~485 eligible × ~150ms (Resend + rate-limit
// + KV.set) = budget about 4 minutes worst case. Pro plan max is 300s.
export const config = { maxDuration: 300 };

const SECRET = process.env.DRIP_OPT_IN_SECRET || process.env.UNSUB_SECRET || 'CHANGE-ME-IN-VERCEL-ENV';
const DRY_RUN = process.env.DRIP_DRY_RUN === '1';
const RATE_LIMIT_DELAY_MS = 100; // Resend free tier = 10 req/s; 100ms between sends is safe
const FINAL_ONBOARDING_DAY = 7;  // Days 1-7 universal; 8+ gated by opt-in

// HMAC token used in the Day 7 opt-in button URL.
// Format: base64url(`${email}.${ts}.${sig}`)
function signOptInToken(email) {
  const ts = Date.now();
  const payload = `${email.toLowerCase()}.${ts}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

// Compute current day-in-arc for a subscriber.
// enrolledAt = ISO timestamp when they were added.
// Returns 1, 2, ..., 7, or null if not yet due / past sequence end.
function computeDay(enrolledAt) {
  const start = new Date(enrolledAt).getTime();
  const now = Date.now();
  const days = Math.floor((now - start) / 86_400_000) + 1; // +1 because Day 1 fires on enrollment date
  if (days < 1) return null;
  return days;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not set' });
  }
  if (!process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'Vercel KV not provisioned (KV_REST_API_URL missing)' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Pull the full key set at once. We tried kv.scan() but Upstash's cursor
  // returns 0 prematurely (terminates iteration after the first 200 records
  // when total is 3,392). kv.keys('drip:*') is fine at this scale and avoids
  // the cursor bug — it's a single network call returning the full list.
  const summary = { scanned: 0, sent: 0, skipped: 0, complete: 0, errors: 0, byDay: {} };
  const errors = [];
  const allKeys = await kv.keys('drip:*');
  console.log(`drip-cron: scanning ${allKeys.length} subscriber keys`);

  // 2026-05-18: 18-hour no-double-send guard. The cron now fires 4x/day
  // (every 6 hours) to clear the Vercel 300s function timeout that was
  // capping each run at ~1,500 records. The guard ensures a subscriber
  // who already got today's email isn't advanced again later in the day.
  const TWENTY_HOURS_MS = 18 * 3600 * 1000;
  const now = Date.now();

  for (const key of allKeys) {
    summary.scanned++;
    try {
      const sub = await kv.get(key);
      if (!sub) continue;
      if (sub.unsubscribed || sub.paused || sub.complete) {
        summary.skipped++;
        continue;
      }

      // No-double-send guard — if this subscriber got an email within the
      // last 18 hours, skip. Subsequent fires today only pick up records
      // that didn't get processed by earlier fires (Vercel timeout misses).
      if (sub.lastSentAt) {
        const sinceLastSent = now - new Date(sub.lastSentAt).getTime();
        if (sinceLastSent < TWENTY_HOURS_MS) {
          summary.skipped++;
          continue;
        }
      }

      // ─── Self-healing day computation (2026-05-11) ───────────────────
      // Old logic: send Day-N where N = days-since-enrollment. If a cron
      // fire was missed (e.g., Vercel re-registering the schedule during
      // a deploy at the same minute as the fire time), the missed day was
      // SKIPPED FOREVER — tomorrow's fire would jump straight to the next
      // calendar day.
      //
      // New logic: send `lastSentDay + 1` instead. Always one step forward,
      // never skip. Calendar day cap: don't send a day that's beyond the
      // subscriber's enrollment timeline (no "future" emails). Safety cap:
      // if a subscriber is more than 7 days behind their computed day
      // (e.g., a long unpause, or 7+ missed cron fires), pause them with
      // a reason flag — manual review beats 7 emails in one day.
      const computedDay = computeDay(sub.enrolledAt);
      if (computedDay == null || computedDay < 1) {
        summary.skipped++;
        continue;
      }

      const lastSent = sub.lastSentDay || 0;
      const day = lastSent + 1;

      // 2026-05-15: foundation arc (Days 1-7) is now UNIVERSAL — no calendar
      // cap, no gap pause. Every engaged subscriber gets the 7-day foundation
      // regardless of when they enrolled or how silent they've been. This
      // fixed the 2,712 beehiiv-migrated zombies that the old gap-cap was
      // silently auto-pausing forever.
      //
      // The two safety checks below ONLY apply to Days 8+ (post-opt-in):
      //   - Day 8+ requires optedIn === true OR a purchaser tag
      //     (bpquiz-purchaser / tier-1-buyer / tier-2-buyer / tier-3-buyer).
      //     Non-buyers who didn't click the Day 7 button stop at Day 7.
      //   - Day 8+ still respects the calendar cap (no sending Day 9 to
      //     someone whose enrolledAt is only 5 days old) to prevent races
      //     during catch-up.
      if (day > FINAL_ONBOARDING_DAY) {
        const tags = Array.isArray(sub.tags) ? sub.tags : [];
        const isBuyer = tags.some((t) =>
          t === 'bpquiz-purchaser' ||
          t === 'tier-1-buyer' ||
          t === 'tier-2-buyer' ||
          t === 'tier-3-buyer'
        );
        if (!sub.optedIn && !isBuyer) {
          summary.skipped++;
          continue;
        }
        // Calendar cap only for Days 8+ — prevents sending tomorrow's
        // extended-arc email today.
        if (day > computedDay) {
          summary.skipped++;
          continue;
        }
      }

      // Past Day 30 → mark complete.
      if (day > 30) {
        await kv.set(key, { ...sub, complete: true });
        summary.complete++;
        continue;
      }

      // Days 8+ — only fire if a content entry exists in the DAYS map.
      // (Day 8 added 2026-05-09 with the 1:1 application CTA. Days 9-30
      // are still placeholder; will be filled in as the back-half drip is
      // authored.)
      if (!DAYS[day]) {
        summary.skipped++;
        continue;
      }

      // Render the email.
      const ctx = {
        email: sub.email,
        firstName: sub.firstName,
        optInToken: day === 7 ? signOptInToken(sub.email) : undefined,
      };
      const payload = renderEmail(day, ctx);

      if (DRY_RUN) {
        console.log(`[DRY] would send Day ${day} to ${sub.email} — subject: ${payload.subject}`);
      } else {
        await resend.emails.send({ ...payload, to: sub.email });
      }

      await kv.set(key, {
        ...sub,
        lastSentDay: day,
        lastSentAt: new Date().toISOString(),
      });

      summary.sent++;
      summary.byDay[day] = (summary.byDay[day] || 0) + 1;

      // Rate-limit: Resend free tier is 10 req/s.
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    } catch (err) {
      summary.errors++;
      errors.push({ key, message: err.message });
      console.error(`drip-cron error for ${key}:`, err.message);
    }
  }

  console.log('drip-cron summary:', JSON.stringify(summary));
  return res.status(200).json({
    ok: true,
    dryRun: DRY_RUN,
    summary,
    errors: errors.slice(0, 20), // first 20 only, full list in logs
  });
}
