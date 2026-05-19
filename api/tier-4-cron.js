// api/tier-4-cron.js — Tier-4 (Cohort 2 Sprint / 1:1 Coaching buyer) daily cron
//
// Fires the _tier-4-emails.js sequence to every drip:* record where
// state === 'tier-4'. 10 emails over 30 days. ONBOARDING ONLY — never
// sells. Monday 10 PM ET kickoff + Week 1 agenda + Skool VIP welcome +
// Barbara O'Neill ticket details + plateau-buster + numbers check-in +
// herb formulary + doctor conversation prep + first-month review.
//
// Wakita Taylor was the manual proof case for this sequence (her drip
// record was hand-stamped state=sprint in find-and-stamp-wakita-sprint.mjs).
// Future $1,997 Cohort 2 buyers + $6,997 1:1 buyers enter this state
// automatically via stripe-webhook AMOUNT_TO_TIER mapping.
//
// Schedule: TBD in vercel.json (Phase 7). Recommended: daily 14:00 UTC
// (~30 min after tier-3-cron).
//
// Dry-run: set TIER_4_CRON_DRY_RUN=1 in Vercel env.

import { runStateCron, cronConfig } from './_state-cron.js';
import {
  TIER_4_DAYS,
  tier4SentFlag,
  FROM,
  REPLY_TO,
} from './_tier-4-emails.js';

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req,
    res,
    state: 'tier-4',
    daysMap: TIER_4_DAYS,
    sentFlag: tier4SentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'TIER_4_CRON_DRY_RUN',
    label: 'tier-4-cron',
  });
}
