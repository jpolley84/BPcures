// api/tier-1-cron.js — Tier-1 ($17/$47 Kit buyer) daily cron
//
// Fires the _tier-1-emails.js sequence to every drip:* record where
// state === 'tier-1'. 10 emails over 21 days. Receipt + use-the-kit
// nudges + $297 Diagnostic upsell + graceful exit at Day 21.
//
// REPLACES the legacy buyer-upsell-cron.js (Days 10/14/17 to kit
// buyers selling $297). The new sequence is wider + arc-structured.
//
// Schedule: TBD in vercel.json (Phase 7). Recommended: daily 12:30 UTC
// (~30 min after lead-cron so Resend rate-limits don't stack).
//
// Dry-run: set TIER_1_CRON_DRY_RUN=1 in Vercel env.

import { runStateCron, cronConfig } from './_state-cron.js';
import {
  TIER_1_DAYS,
  tier1SentFlag,
  FROM,
  REPLY_TO,
} from './_tier-1-emails.js';

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req,
    res,
    state: 'tier-1',
    daysMap: TIER_1_DAYS,
    sentFlag: tier1SentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'TIER_1_CRON_DRY_RUN',
    label: 'tier-1-cron',
  });
}
