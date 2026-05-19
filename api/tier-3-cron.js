// api/tier-3-cron.js — Tier-3 ($297 BP Triangle Diagnostic buyer) daily cron
//
// Fires the _tier-3-emails.js sequence to every drip:* record where
// state === 'tier-3'. 10 emails over 14 days. Confirmation + prep
// checklist + Patricia case + 3-paths after + Wakita's Monday case +
// Cohort 2 reveal + objection killers + 5-seat scarcity + final close.
//
// REPLACES the legacy diagnostic-drip-cron.js (7 emails) once vercel.json
// is cut over in Phase 7. The legacy module _diagnostic-drip-emails.js
// remains in place during cutover so production never has a gap.
//
// Schedule: TBD in vercel.json (Phase 7). Recommended: daily 13:30 UTC
// (~30 min after tier-2-cron).
//
// Dry-run: set TIER_3_CRON_DRY_RUN=1 in Vercel env.

import { runStateCron, cronConfig } from './_state-cron.js';
import {
  TIER_3_DAYS,
  tier3SentFlag,
  FROM,
  REPLY_TO,
} from './_tier-3-emails.js';

export const config = cronConfig;

export default async function handler(req, res) {
  return runStateCron({
    req,
    res,
    state: 'tier-3',
    daysMap: TIER_3_DAYS,
    sentFlag: tier3SentFlag,
    from: FROM,
    replyTo: REPLY_TO,
    dryRunEnv: 'TIER_3_CRON_DRY_RUN',
    label: 'tier-3-cron',
  });
}
