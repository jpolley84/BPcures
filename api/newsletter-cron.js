// api/newsletter-cron.js — weekly newsletter cron.
// Audience: legacy drip:* state==='newsletter' + triangle bwbp:drip:* leads
// past Day 9 (the triangle lead arc hands off to the weekly letter).
//
// Schedule: Tuesday 16:00 UTC (vercel.json). DEFAULT OFF: sends nothing
// until NEWSLETTER_ENABLED=true is set in env, so deploying this file does
// NOT start sending to the ~3,590 parked records.
//
// What it does (2026-07-03 design):
//   1. Hard gate: NEWSLETTER_ENABLED !== 'true' → 200 {skipped:'disabled'}
//   2. CRON_SECRET / Vercel-cron auth via isAuthorizedCron
//   3. Refuses to run without BUSINESS_POSTAL_ADDRESS (CAN-SPAM; no
//      hardcoded fallback address, per house rule)
//   4. Audience: drip:* records where state === 'newsletter' ONLY
//      (skips unsub/paused/complete)
//   5. One GLOBAL issue at a time (KV `newsletter:cron-state`), sent in
//      batches of NEWSLETTER_BATCH_LIMIT (default 500) per run. A cursor
//      (last processed key, over the sorted key list) is stored in KV so
//      successive weekly runs continue where the last one left off WITHIN
//      the same issue. When the whole audience has the issue, the issue
//      advances and the cursor resets. Cycle wraps at the end of the
//      refreshed issue list.
//   6. Every email gets the compliance footer: visible unsubscribe link
//      (legacy /api/unsubscribe — tombstones BOTH email machines) +
//      BUSINESS_POSTAL_ADDRESS, plus List-Unsubscribe headers.
//
// Content source: api/_newsletter-emails.js NEWSLETTER_ISSUES (refreshed
// Triangle arc; cycle length derived from the map, currently 4 issues).
//
// Dry run: set NEWSLETTER_CRON_DRY_RUN=1 (logs would-sends, writes nothing).

import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import {
  NEWSLETTER_ISSUES,
  complianceHtmlFooter,
  complianceTextFooter,
} from './_newsletter-emails.js';
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
const STATE_KEY = 'newsletter:cron-state';
const DEFAULT_BATCH_LIMIT = 500;

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
  // HARD GATE — default OFF. Deploying this cron must not start sending.
  // Flip on deliberately with NEWSLETTER_ENABLED=true (exact string).
  if (process.env.NEWSLETTER_ENABLED !== 'true') {
    return res.status(200).json({ skipped: 'disabled' });
  }
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized — not a Vercel cron request' });
  }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY missing' });
  if (!process.env.KV_REST_API_URL) return res.status(500).json({ error: 'KV_REST_API_URL missing' });
  // CAN-SPAM: refuse to send without a postal address. Env-driven only —
  // house rule forbids any hardcoded fallback address.
  if (!process.env.BUSINESS_POSTAL_ADDRESS) {
    return res.status(500).json({ error: 'BUSINESS_POSTAL_ADDRESS missing — refusing to send without a postal address (CAN-SPAM)' });
  }
  const postalAddress = process.env.BUSINESS_POSTAL_ADDRESS;

  const batchLimit = Math.max(1, parseInt(process.env.NEWSLETTER_BATCH_LIMIT, 10) || DEFAULT_BATCH_LIMIT);
  const totalIssues = Object.keys(NEWSLETTER_ISSUES).length;
  if (totalIssues === 0) {
    return res.status(500).json({ error: 'NEWSLETTER_ISSUES is empty — nothing to send' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Global issue + cursor state. cursorKey = last processed drip:* key
  // (sorted order); null means start of the audience for this issue.
  const savedState = (await kv.get(STATE_KEY)) || {};
  let issueNumber = Number(savedState.issue) || 1;
  if (!NEWSLETTER_ISSUES[issueNumber]) issueNumber = 1; // arc shrank; wrap safely
  let cursorKey = typeof savedState.cursorKey === 'string' ? savedState.cursorKey : null;
  const cycle = Number(savedState.cycle) || 1; // increments each time the arc wraps
  const issue = NEWSLETTER_ISSUES[issueNumber];

  // SCAN-cursor drain (Upstash disabled KEYS at our scale), then sort for a
  // deterministic order the batch cursor can resume against next week.
  const allKeys = [];
  let scanCursor = 0;
  do {
    const [next, batch] = await kv.scan(scanCursor, { match: 'drip:*', count: 500 });
    allKeys.push(...batch);
    scanCursor = next;
  } while (String(scanCursor) !== '0');
  // Triangle leads past Day 9 join the letter (their Day-9 email promises it).
  scanCursor = 0;
  do {
    const [next, batch] = await kv.scan(scanCursor, { match: 'bwbp:drip:*', count: 500 });
    allKeys.push(...batch);
    scanCursor = next;
  } while (String(scanCursor) !== '0');
  allKeys.sort();
  // Dual-written contacts can exist under BOTH key namespaces; never send
  // one issue twice to the same inbox in a run. (Cross-run overlap is
  // near-zero today: legacy 'newsletter' records predate the dual-write.)
  const sentThisRun = new Set();
  console.log(`newsletter-cron: issue ${issueNumber}, ${allKeys.length} drip records, cursor=${cursorKey || '(start)'}, batchLimit=${batchLimit}`);

  const summary = {
    issue: issueNumber,
    batchLimit,
    scanned: 0,
    skippedBeforeCursor: 0,
    inNewsletterState: 0,
    sent: 0,
    skippedExcluded: 0,     // unsub/paused/complete
    skippedWrongState: 0,
    skippedAlreadySent: 0,  // already got this issue (crash-recovery dedup)
    errors: 0,
    batchLimitHit: false,
    issueCompleted: false,
  };
  const errors = [];

  for (const key of allKeys) {
    // Resume within the issue: everything at or before the cursor was
    // handled by an earlier run this issue.
    if (cursorKey && key <= cursorKey) {
      summary.skippedBeforeCursor++;
      continue;
    }
    summary.scanned++;
    try {
      const sub = await kv.get(key);
      if (!sub || !sub.email) {
        cursorKey = key;
        continue;
      }
      if (sub.unsubscribed || sub.complete || sub.paused) {
        summary.skippedExcluded++;
        cursorKey = key;
        continue;
      }
      const isTriangleLead = key.startsWith('bwbp:drip:');
      if (isTriangleLead) {
        const days = (Date.now() - new Date(sub.stateEnteredAt || 0).getTime()) / 86400000;
        if (sub.state !== 'lead' || !(days > 9)) {
          summary.skippedWrongState++;
          cursorKey = key;
          continue;
        }
      } else if (sub.state !== 'newsletter') {
        summary.skippedWrongState++;
        cursorKey = key;
        continue;
      }
      if (sentThisRun.has(sub.email)) {
        summary.skippedAlreadySent++;
        cursorKey = key;
        continue;
      }
      summary.inNewsletterState++;

      // Crash-recovery dedup: if a previous run sent this issue (in THIS
      // cycle of the arc) but died before persisting the cursor, don't
      // double-send. Cycle check matters because the short arc wraps.
      if (Number(sub.newsletterIssueLastSent) === issueNumber
          && Number(sub.newsletterCycleLastSent) === cycle) {
        summary.skippedAlreadySent++;
        cursorKey = key;
        continue;
      }

      // Render (compliance footer on EVERY send — visible unsubscribe via
      // the legacy endpoint, which tombstones both machines, + postal
      // address from env).
      const unsubToken = signUnsubToken({ email: sub.email });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
      const ctx = { firstName: sub.firstName || '', unsubUrl, postalAddress };

      if (DRY_RUN) {
        console.log(`[DRY] newsletter-cron: would send issue ${issueNumber} to ${sub.email} — "${issue.subject}"`);
      } else {
        await resend.emails.send({
          from: FROM,
          to: sub.email,
          replyTo: REPLY_TO,
          subject: issue.subject,
          html: issue.htmlBody(ctx) + complianceHtmlFooter(ctx),
          text: issue.textBody(ctx) + complianceTextFooter(ctx),
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        await kv.set(key, {
          ...sub,
          newsletterIssueLastSent: issueNumber,
          newsletterCycleLastSent: cycle,
          newsletterLastSentAt: new Date().toISOString(),
          lastSentAt: new Date().toISOString(),
        });
      }

      sentThisRun.add(sub.email);
      summary.sent++;
      cursorKey = key;

      if (summary.sent >= batchLimit) {
        summary.batchLimitHit = true;
        break;
      }
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (err) {
      summary.errors++;
      errors.push({ key, message: err.message });
      console.error(`newsletter-cron error on ${key}:`, err.message);
      cursorKey = key; // don't wedge the cursor on a bad record
    }
  }

  // Persist progress. Batch limit hit → same issue, resume at cursor next
  // week. Otherwise the whole audience has this issue → advance and reset,
  // wrapping at the end of the refreshed arc.
  let nextState;
  if (summary.batchLimitHit) {
    nextState = { issue: issueNumber, cursorKey, cycle };
  } else {
    summary.issueCompleted = true;
    const wrapped = issueNumber >= totalIssues;
    nextState = { issue: (issueNumber % totalIssues) + 1, cursorKey: null, cycle: wrapped ? cycle + 1 : cycle };
  }
  if (!DRY_RUN) {
    await kv.set(STATE_KEY, { ...nextState, updatedAt: new Date().toISOString() });
  }

  console.log('newsletter-cron summary:', JSON.stringify({ ...summary, nextState }));

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
    nextState,
    errors: errors.slice(0, 20),
  });
}
