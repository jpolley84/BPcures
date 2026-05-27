// api/newsletter-cron.js — weekly newsletter cron for state===newsletter records.
//
// Schedule: Monday 13:00 UTC = Monday 9 AM ET = Monday 8 AM CT (vercel.json).
// Fires same-day as Joel's 10 PM ET live call — newsletter doubles as the
// Monday-call reminder + 3-tier Skool ladder pitch.
//
// What it does:
//   1. Scans drip:* records where state === 'newsletter' (~3,590 records)
//   2. For each, reads `newsletterIssueLastSent` (default 0)
//   3. Sends next-in-sequence issue: ((lastIssue) % 30) + 1
//      → issue 30 cycles back to issue 1 (continuous loop)
//   4. Increments counter + sets lastSentAt
//   5. Skips unsub / paused / complete records
//
// Content source: api/_newsletter-emails.js exports NEWSLETTER_ISSUES = { 1..30, ... }
//   Each issue is a sanitized version of _drip-emails.js Days 1-30 — sequential
//   references stripped, Day-X labels removed, standalone framing applied.
//
// 2026-05-24 design (Joel directive): 30 weeks of evergreen weekly content
// recycled from the universal foundation arc that drip-cron used to fire daily.

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { NEWSLETTER_ISSUES } from './_newsletter-emails.js';
import { signUnsubToken } from './unsubscribe.js';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 300 };

const RATE_LIMIT_MS = 100;
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const JOEL_NOTIFY = process.env.JOEL_NOTIFY || 'braveworksrn@gmail.com';
const ERROR_ALERT_THRESHOLD = 5;
const DRY_RUN = process.env.NEWSLETTER_CRON_DRY_RUN === '1';
const TOTAL_ISSUES = 30;

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
  console.log(`newsletter-cron: scanning ${allKeys.length} drip records`);

  const summary = {
    scanned: 0,
    inNewsletterState: 0,
    sent: 0,
    skippedExcluded: 0,    // unsub/paused/complete
    skippedWrongState: 0,
    skippedNoIssue: 0,
    errors: 0,
    byIssue: {},
  };
  const errors = [];

  for (const key of allKeys) {
    summary.scanned++;
    try {
      const sub = await kv.get(key);
      if (!sub || !sub.email) continue;

      if (sub.unsubscribed || sub.complete || sub.paused) {
        summary.skippedExcluded++;
        continue;
      }
      if (sub.state !== 'newsletter') {
        summary.skippedWrongState++;
        continue;
      }

      summary.inNewsletterState++;

      // Pick next issue. Cycles: 30 → 1 → 2 → ...
      const lastIssue = Number(sub.newsletterIssueLastSent) || 0;
      const nextIssue = (lastIssue % TOTAL_ISSUES) + 1;
      const issue = NEWSLETTER_ISSUES[nextIssue];

      if (!issue) {
        summary.skippedNoIssue++;
        continue;
      }

      // Render
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
      const ctx = { firstName: sub.firstName || '', unsubUrl };

      if (DRY_RUN) {
        console.log(`[DRY] newsletter-cron: would send issue ${nextIssue} to ${sub.email} — "${issue.subject}"`);
      } else {
        await resend.emails.send({
          from: FROM,
          to: sub.email,
          replyTo: REPLY_TO,
          subject: issue.subject,
          html: issue.htmlBody(ctx),
          text: issue.textBody(ctx),
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        await kv.set(key, {
          ...sub,
          newsletterIssueLastSent: nextIssue,
          newsletterLastSentAt: new Date().toISOString(),
          lastSentAt: new Date().toISOString(),
        });
      }

      summary.sent++;
      summary.byIssue[nextIssue] = (summary.byIssue[nextIssue] || 0) + 1;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (err) {
      summary.errors++;
      errors.push({ key, message: err.message });
      console.error(`newsletter-cron error on ${key}:`, err.message);
    }
  }

  console.log('newsletter-cron summary:', JSON.stringify(summary));

  if (!DRY_RUN && summary.errors >= ERROR_ALERT_THRESHOLD) {
    await alertJoel(
      resend,
      `[newsletter-cron] ${summary.errors} errors during today's fire`,
      `newsletter-cron ran with elevated errors.\n\nSummary:\n${JSON.stringify(summary, null, 2)}\n\nFirst few errors:\n${errors.slice(0, 5).map((e) => `  - ${e.key}: ${e.message}`).join('\n')}`,
    );
  }

  return res.status(200).json({
    ok: true,
    dryRun: DRY_RUN,
    summary,
    errors: errors.slice(0, 20),
  });
}
