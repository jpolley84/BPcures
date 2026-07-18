// api/evergreen-cron.js — the never-silent weekly loop.
//
// 2026-07-17 (Joel): once a contact finishes their onboarding arc (lead day 15
// or buyer day 30), they used to go permanently silent. This cron picks them up
// and sends ONE evergreen email per week, forever, rotating through
// _evergreen-emails.js and looping. Nobody on the list is ever silent again.
//
// Runs DAILY; each record sends on ITS OWN 7-day timer (staggered by when the
// person finished their arc), so daily volume stays spread out instead of one
// giant weekly batch.
//
// Eligibility per bwbp:drip record:
//   - not unsubscribed / paused / flashOnly
//   - has stateEnteredAt
//   - PAST its arc + a one-week gap: lead >= day 22, buyer >= day 37
//     (arc ends 15/30, plus 7 clear days before the first evergreen touch)
//   - AND (no lastEvergreenAt) OR (>= 7 days since lastEvergreenAt)
// On send: set lastEvergreenAt=now, evergreenIndex=(prev+1). Re-GET before
// write so a concurrent purchase/unsub is never clobbered.
//
// Schedule: vercel.json "0 16 * * *" (11 AM CT), offset from the other crons.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { isAuthorizedCron } from './_triangle-cron-auth.js';
import { FROM, REPLY_TO, SITE_URL } from './_triangle-email.js';
import { renderEvergreen } from './_evergreen-emails.js';

export const config = { maxDuration: 300 };

const RATE_LIMIT_MS = 550;
const DRY_RUN = process.env.EVERGREEN_DRY_RUN === '1';
const dayMs = 86400000;
function daysSince(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return -1;
  return Math.floor((now - t) / dayMs);
}

function firstEvergreenDay(sub) {
  // Buyers finish at day 30, leads at day 15; both get a 7-day clear gap.
  const isBuyer = sub.state === 'buyer' || sub.isPaidCustomer;
  return isBuyer ? 37 : 22;
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'Unauthorized' });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const summary = { scanned: 0, eligible: 0, sent: 0, skippedNotDue: 0, skippedRecent: 0, errors: 0 };

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
      if (sub.unsubscribed || sub.paused || sub.flashOnly) continue;
      if (!sub.stateEnteredAt) continue;

      const d = daysSince(sub.stateEnteredAt);
      if (d < firstEvergreenDay(sub)) { summary.skippedNotDue++; continue; }
      summary.eligible++;

      if (sub.lastEvergreenAt && daysSince(sub.lastEvergreenAt) < 7) { summary.skippedRecent++; continue; }

      const idx = Number.isInteger(sub.evergreenIndex) ? sub.evergreenIndex : 0;
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${unsubToken}`;
      const { subject, html, text } = renderEvergreen(idx, sub, unsubUrl);

      if (DRY_RUN) {
        console.log(`[DRY] evergreen: would send #${idx} to ${sub.email} "${subject}"`);
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
        const fresh = (await kv.get(key)) || sub;
        // Re-check: a purchase/unsub landing mid-run must win over our stale copy.
        if (fresh.unsubscribed) continue;
        await kv.set(key, {
          ...fresh,
          lastEvergreenAt: new Date().toISOString(),
          evergreenIndex: idx + 1,
        });
      }
      summary.sent++;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (err) {
      summary.errors++;
      console.error('evergreen-cron error on', key, err.message);
    }
  }

  console.log('evergreen-cron summary:', JSON.stringify(summary));
  return res.status(200).json(summary);
}
