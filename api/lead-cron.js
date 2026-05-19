// api/lead-cron.js — Stage 0 (LEAD) daily cron
//
// Fires the _tier-lead-emails.js sequence to every drip:* record where
// state === 'lead'. 10 emails over 21 days. Welcome arc + first $17
// pitch + graceful exit to newsletter at Day 21.
//
// Schedule: TBD in vercel.json (Phase 7). Recommended: daily at 12:00
// UTC (8 AM ET) so welcome emails land in morning inbox.
//
// Dry-run: set LEAD_CRON_DRY_RUN=1 in Vercel env.

import { runStateCron, cronConfig } from './_state-cron.js';
import {
  TIER_LEAD_DAYS,
  tierLeadSentFlag,
  FROM,
  REPLY_TO,
} from './_tier-lead-emails.js';

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req,
    res,
    state: 'lead',
    daysMap: TIER_LEAD_DAYS,
    sentFlag: tierLeadSentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'LEAD_CRON_DRY_RUN',
    label: 'lead-cron',
  });
}
