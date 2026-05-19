// api/tier-2-cron.js — Tier-2 ($97 BP Triangle Challenge buyer) daily cron
//
// Fires the _tier-2-emails.js sequence to every drip:* record where
// state === 'tier-2'. 10 emails over 30 days. Fulfills the 30-day
// promise: chapter walkthroughs (Stress/Sugar/Pipe Pressure), bonus
// kit deliveries (Cortisol Day 9, Blood Sugar Day 12, Cookbook Day 30
// graduation gift), Monday 10 PM ET Zoom reminders, Skool VIP onboarding,
// Cohort 2 upsell Days 18-30.
//
// CRITICAL: this is the sequence that fixes the Shenette/Phyllis/Dora
// gap — $97 buyers currently sitting in the universal drip getting
// wrong-product pitches. Their drip:* records need state='tier-2'
// stamped manually (see find-and-stamp-* scripts) before this cron
// will pick them up.
//
// Schedule: TBD in vercel.json (Phase 7). Recommended: daily 13:00 UTC
// (~30 min after tier-1-cron).
//
// Dry-run: set TIER_2_CRON_DRY_RUN=1 in Vercel env.

import { runStateCron, cronConfig } from './_state-cron.js';
import {
  TIER_2_DAYS,
  tier2SentFlag,
  FROM,
  REPLY_TO,
} from './_tier-2-emails.js';

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req,
    res,
    state: 'tier-2',
    daysMap: TIER_2_DAYS,
    sentFlag: tier2SentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'TIER_2_CRON_DRY_RUN',
    label: 'tier-2-cron',
  });
}
