// api/buyer-upsell-cron.js — daily cron, fires Day 10/14/17 $297 upsell
// emails to $17/$47 Kit buyers.
//
// Schedule: daily at 13:00 UTC = 8 AM CT (vercel.json). One hour AFTER
// the main drip-cron (12:00 UTC) so they don't both hit Resend hard.
//
// Filter:
//   - isPaidCustomer === true
//   - tags include 'tier-1-buyer' OR 'tier-2-buyer'
//   - NOT in diagnostic-prospect cohort (those buyers already paid $297)
//   - NOT inDiagnosticSequence (same check, belt + suspenders)
//   - NOT unsubscribed / paused / complete
//   - Has purchasedAt (set by stripe-webhook on Kit purchase)
//
// For each eligible buyer, compute daysSincePurchasedAt. If days===10
// and !buyerUpsell10Sent, fire Day 10 + mark flag. Same for 14 and 17.
//
// Per Joel's 2026-05-18 approval:
//   - Voice approved (Day 10 reviewed in chat; Day 14, 17 follow same pattern)
//   - No engagement gating — all 3 fire regardless of click
//   - Real calendar scarcity (6 slots left this month, next opening June 1)
//   - Hard exclusion via "reply not now" handled by existing unsub footer

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { BUYER_UPSELL_DAYS, upsellSentFlag } from './_buyer-upsell-emails.js';
import { signUnsubToken } from './unsubscribe.js';
import { isAuthorizedCron } from './_cron-auth.js';

const JOEL_NOTIFY = process.env.JOEL_NOTIFY || 'braveworksrn@gmail.com';

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

export const config = { maxDuration: 300 };

const RATE_LIMIT_DELAY_MS = 100; // ~10 sends/sec (Resend's free tier ceiling)
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const DRY_RUN = process.env.BUYER_UPSELL_DRY_RUN === '1';

function daysBetween(isoA, now = Date.now()) {
  const a = new Date(isoA).getTime();
  if (Number.isNaN(a)) return -1;
  return Math.floor((now - a) / 86400000);
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY missing' });
  if (!process.env.KV_REST_API_URL) return res.status(500).json({ error: 'KV_REST_API_URL missing' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const allKeys = await kv.keys('drip:*');
  console.log(`buyer-upsell-cron: scanning ${allKeys.length} drip records`);

  const summary = {
    scanned: 0,
    eligibleBuyers: 0,
    sentByDay: { 10: 0, 14: 0, 17: 0 },
    skippedNotBuyer: 0,
    skippedDiagnostic: 0,
    skippedExcluded: 0, // unsub / paused / complete
    skippedNoMatchingDay: 0,
    skippedAlreadySent: 0,
    errors: 0,
  };
  const errors = [];

  for (const key of allKeys) {
    summary.scanned++;
    try {
      const sub = await kv.get(key);
      if (!sub || !sub.email) continue;

      // Skip unsubscribed / paused / complete records.
      // Note: diagnostic-prospect buyers are paused=true by stripe-webhook,
      // so they'll be filtered here as well — belt and suspenders.
      if (sub.unsubscribed || sub.paused || sub.complete) {
        summary.skippedExcluded++;
        continue;
      }
      if (sub.inDiagnosticSequence || sub.cohort === 'diagnostic-prospect') {
        summary.skippedDiagnostic++;
        continue;
      }

      // Must be a paid buyer with at least a Kit-tier tag.
      const tags = Array.isArray(sub.tags) ? sub.tags : [];
      const isKitBuyer = tags.includes('tier-1-buyer') || tags.includes('tier-2-buyer');
      if (!sub.isPaidCustomer || !isKitBuyer || !sub.purchasedAt) {
        summary.skippedNotBuyer++;
        continue;
      }

      summary.eligibleBuyers++;
      const daysSince = daysBetween(sub.purchasedAt);

      // Find a matching upsell day. We fire on the exact day, not a range,
      // because the cron runs daily — every buyer hits each day exactly once.
      const upsell = BUYER_UPSELL_DAYS[daysSince];
      if (!upsell) {
        summary.skippedNoMatchingDay++;
        continue;
      }

      const flagName = upsellSentFlag(daysSince);
      if (sub[flagName]) {
        summary.skippedAlreadySent++;
        continue;
      }

      // Render email
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
      const html = upsell.html({ firstName: sub.firstName || '', unsubUrl });

      if (DRY_RUN) {
        console.log(`[DRY] buyer-upsell-cron: would send Day ${daysSince} to ${sub.email} — "${upsell.subject}"`);
      } else {
        await resend.emails.send({
          from: 'Joel Polley, RN <joel@bpquiz.com>',
          to: sub.email,
          replyTo: 'braveworksrn@gmail.com',
          subject: upsell.subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        // Mark the flag so we never double-send. Keep all other fields.
        await kv.set(key, {
          ...sub,
          [flagName]: true,
          [`${flagName}At`]: new Date().toISOString(),
        });
      }

      summary.sentByDay[daysSince] = (summary.sentByDay[daysSince] || 0) + 1;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
    } catch (err) {
      summary.errors++;
      errors.push({ key, message: err.message });
      console.error('buyer-upsell-cron error', key, err.message);
    }
  }

  console.log('buyer-upsell-cron summary:', JSON.stringify(summary));

  // alertJoel if errors exceed a small threshold — a few transient errors
  // are OK; a flood means Resend is failing or the cron is broken.
  if (!DRY_RUN && summary.errors >= 3) {
    const totalAttempted = (summary.sentByDay[10] || 0) + (summary.sentByDay[14] || 0) + (summary.sentByDay[17] || 0) + summary.errors;
    await alertJoel(resend,
      `[buyer-upsell-cron] ${summary.errors} errors during today's fire`,
      `buyer-upsell-cron ran with elevated errors.

Summary: ${JSON.stringify(summary, null, 2)}

First few errors:
${errors.slice(0, 5).map(e => `  - ${e.key}: ${e.message}`).join('\n')}

If Resend rate-limiting or a transient KV blip, expect the next fire to recover.
If errors persist >3 days running, check the runtime logs and Resend dashboard.`,
    );
  }

  return res.status(200).json({
    ok: true,
    dryRun: DRY_RUN,
    summary,
    errors: errors.slice(0, 20),
  });
}
