// api/diagnostic-drip-cron.js — daily cron, fires the 7-email diagnostic→
// Sprint sequence to $297 BP Triangle Diagnostic buyers.
//
// Schedule: daily at 14:00 UTC = 9 AM CT (vercel.json). Spaced an hour
// AFTER buyer-upsell-cron (13:00 UTC) to avoid Resend rate-limit overlap.
//
// Audience: KV drip:* records where:
//   - inDiagnosticSequence === true (stamped by stripe-webhook on $297 purchase)
//   - diagnosticEnrolledAt is set
//   - NOT unsubscribed / complete
//   - paused === true is OK (we use that flag to keep them out of main drip)
//
// For each, compute daysSinceDiagnosticEnrolled. If days matches a
// DIAGNOSTIC_DRIP_DAYS key (1/3/5/7/9/11/14) AND !diagnosticDrip{N}Sent
// flag, fire that email + set flag + timestamp.
//
// Sprint reveal happens at Day 7. Sprint-credit Stripe Payment Link
// ($1,700 = $1,997 - $297 credit) is in VITE_STRIPE_SPRINT_WITH_DIAGNOSTIC_CREDIT_LINK env.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { DIAGNOSTIC_DRIP_DAYS, diagnosticSentFlag } from './_diagnostic-drip-emails.js';
import { signUnsubToken } from './unsubscribe.js';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 300 };

const RATE_LIMIT_DELAY_MS = 100; // ~10 sends/sec, Resend free-tier ceiling
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const DRY_RUN = process.env.DIAGNOSTIC_DRIP_DRY_RUN === '1';
const JOEL_NOTIFY = process.env.JOEL_NOTIFY || 'braveworksrn@gmail.com';

function daysBetween(isoA, now = Date.now()) {
  const a = new Date(isoA).getTime();
  if (Number.isNaN(a)) return -1;
  return Math.floor((now - a) / 86400000);
}

async function alertJoel(resend, subject, text) {
  try {
    await resend.emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: JOEL_NOTIFY, subject, text,
    });
  } catch (err) {
    console.error('alertJoel send failed:', err.message);
  }
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY missing' });
  if (!process.env.KV_REST_API_URL) return res.status(500).json({ error: 'KV_REST_API_URL missing' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const allKeys = await kv.keys('drip:*');
  console.log(`diagnostic-drip-cron: scanning ${allKeys.length} drip records`);

  const summary = {
    scanned: 0,
    eligibleDiagnostic: 0,
    sentByDay: { 1: 0, 3: 0, 5: 0, 7: 0, 9: 0, 11: 0, 14: 0 },
    skippedNotDiagnostic: 0,
    skippedExcluded: 0,
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

      if (sub.unsubscribed || sub.complete) {
        summary.skippedExcluded++;
        continue;
      }

      // Must be a diagnostic-prospect ($297 buyer)
      const isDiagnostic = sub.inDiagnosticSequence === true || sub.cohort === 'diagnostic-prospect';
      if (!isDiagnostic || !sub.diagnosticEnrolledAt) {
        summary.skippedNotDiagnostic++;
        continue;
      }

      summary.eligibleDiagnostic++;
      const daysSince = daysBetween(sub.diagnosticEnrolledAt);

      const email = DIAGNOSTIC_DRIP_DAYS[daysSince];
      if (!email) {
        summary.skippedNoMatchingDay++;
        continue;
      }

      const flagName = diagnosticSentFlag(daysSince);
      if (sub[flagName]) {
        summary.skippedAlreadySent++;
        continue;
      }

      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
      const html = email.html({ firstName: sub.firstName || '', unsubUrl });

      if (DRY_RUN) {
        console.log(`[DRY] diagnostic-drip-cron: would send Day ${daysSince} to ${sub.email} — "${email.subject}"`);
      } else {
        await resend.emails.send({
          from: 'Joel Polley, RN <joel@bpquiz.com>',
          to: sub.email,
          replyTo: 'braveworksrn@gmail.com',
          subject: email.subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
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
      console.error('diagnostic-drip-cron error', key, err.message);
    }
  }

  console.log('diagnostic-drip-cron summary:', JSON.stringify(summary));

  if (!DRY_RUN && summary.errors >= 3) {
    await alertJoel(resend,
      `[diagnostic-drip-cron] ${summary.errors} errors during today's fire`,
      `diagnostic-drip-cron ran with elevated errors.\n\nSummary: ${JSON.stringify(summary, null, 2)}\n\nFirst few errors:\n${errors.slice(0, 5).map(e => `  - ${e.key}: ${e.message}`).join('\n')}`,
    );
  }

  return res.status(200).json({
    ok: true,
    dryRun: DRY_RUN,
    summary,
    errors: errors.slice(0, 20),
  });
}
