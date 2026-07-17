// api/sprint-flash-cron.js — daily cron for the buyer-only $97 Sprint flash
// arc (see _sprint-flash-emails.js). Runs alongside (not inside) the buyer
// state cron so PAST buyers can be enrolled at any time via sprintAnchorAt.
//
// Eligibility per bwbp:drip record:
//   state === 'buyer', not unsubscribed, no caseReview (they already own the
//   Sprint), sprintAnchorAt present. Day = floor((now - sprintAnchorAt)/day).
//   Emails at days 10 / 14 / 17 with a 3-day catch-up window, flags
//   sprintFlash10Sent etc. Fresh re-GET before every flag write (no clobber).
//
// Enrollment:
//   NEW buyers: triangle-webhook.js sets sprintAnchorAt = purchase time.
//   PAST buyers: scripts/backfill-sprint-anchor-2026-07-17.mjs sets
//   sprintAnchorAt = now - 9 days, so Email 1 lands the next morning.
//
// Schedule: vercel.json "45 15 * * *" (10:45 AM CT), after the buyer cron.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { FROM, REPLY_TO, SITE_URL } from './_triangle-email.js';
import { SPRINT_FLASH_DAYS, SPRINT_FLASH_EMAILS, flashSentFlag } from './_sprint-flash-emails.js';

export const config = { maxDuration: 300 };

const RATE_LIMIT_MS = 550; // Resend 2/s ceiling
const LOOKBACK = 3;
const DRY_RUN = process.env.SPRINT_FLASH_DRY_RUN === '1';

const dayMs = 86400000;
function daysSince(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return -1;
  return Math.floor((now - t) / dayMs);
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const summary = { scanned: 0, eligible: 0, sentByDay: {}, skipped: 0, errors: 0 };

  let cursor = '0';
  const keys = [];
  do {
    const [next, batch] = await kv.scan(cursor, { match: 'bwbp:drip:*', count: 500 });
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');

  for (const key of keys) {
    try {
      summary.scanned++;
      const sub = await kv.get(key);
      if (!sub || !sub.email) continue;
      if (sub.state !== 'buyer') continue;
      if (sub.unsubscribed || sub.paused || sub.complete) continue;
      if (sub.caseReview) continue; // already owns the Sprint
      if (!sub.sprintAnchorAt) continue;
      summary.eligible++;

      const d = daysSince(sub.sprintAnchorAt);
      if (d < 0) continue;

      // Exact-day first, then catch-up window (mirrors the state engine).
      let sendDay = null;
      if (SPRINT_FLASH_DAYS.includes(d) && !sub[flashSentFlag(d)]) {
        sendDay = d;
      } else {
        for (let back = 1; back <= LOOKBACK; back++) {
          const cand = d - back;
          if (SPRINT_FLASH_DAYS.includes(cand)) {
            if (!sub[flashSentFlag(cand)]) sendDay = cand;
            break;
          }
        }
      }
      if (sendDay === null) continue;

      const emailFn = SPRINT_FLASH_EMAILS[sendDay];
      const ctx = { firstName: sub.firstName || '', corner: sub.corner || null, flashVariant: sub.flashVariant || null };
      const { subject, render } = emailFn(ctx);
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
      const { html, text } = render(unsubUrl);

      if (DRY_RUN) {
        console.log(`[DRY] sprint-flash: would send Day ${sendDay} to ${sub.email} "${subject}"`);
      } else {
        await resend.emails.send({
          from: FROM,
          to: sub.email,
          replyTo: REPLY_TO,
          subject,
          html,
          text,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        // Re-GET before write: a webhook flip or unsubscribe mid-run must not
        // be clobbered by our stale copy.
        const fresh = (await kv.get(key)) || sub;
        await kv.set(key, {
          ...fresh,
          [flashSentFlag(sendDay)]: true,
          [`${flashSentFlag(sendDay)}At`]: new Date().toISOString(),
        });
      }
      summary.sentByDay[sendDay] = (summary.sentByDay[sendDay] || 0) + 1;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (err) {
      summary.errors++;
      console.error('sprint-flash-cron error on', key, err.message);
    }
  }

  console.log('sprint-flash-cron summary:', JSON.stringify(summary));
  return res.status(200).json(summary);
}
