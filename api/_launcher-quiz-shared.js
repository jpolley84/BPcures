/* ================================================================
   Server-side mirror of utils/launcherQuiz.js (v2 — 5-dim scoring)
   Vercel serverless functions can't import Vite-aliased frontend
   modules, so we duplicate the small amount of logic the API
   endpoints need.

   IF YOU CHANGE SCORING HERE, UPDATE src/utils/launcherQuiz.js TO
   MATCH. Future refactor: extract to a single shared spec.
   ================================================================ */

export const TIER_DETAILS = {
  starter: { key: 'starter', name: 'Starter Kit', price: '$2,997' },
  launcher: { key: 'launcher', name: 'The Practice Launcher', price: '$9,997' },
  revshare: { key: 'revshare', name: 'Revenue Share', price: '$4,997 + 10% gross 12mo' },
  none: { key: 'none', name: 'Foundation First', price: 'Free resources' },
};

export const QUESTIONS = [
  {
    id: 'cert',
    type: 'choice',
    question: 'Certification status',
    options: [
      { value: 'iin', label: 'IIN', dims: { revenue: 1, infra: 1 } },
      { value: 'nta', label: 'NTA', dims: { revenue: 1, infra: 1 } },
      { value: 'fdnp', label: 'FDN-P', dims: { revenue: 2, infra: 1 } },
      { value: 'naturopathic', label: 'Naturopathic / ND', dims: { revenue: 2, infra: 1 } },
      { value: 'rn', label: 'RN / Nurse', dims: { revenue: 2, infra: 1 } },
      { value: 'other', label: 'Other', dims: { revenue: 1, infra: 1 } },
      { value: 'in_progress', label: 'In progress', dims: { revenue: 0, infra: 0 } },
      { value: 'none', label: 'None yet', dims: { revenue: 0, infra: 0 } },
    ],
  },
  {
    id: 'revenue',
    type: 'choice',
    question: 'Current monthly revenue',
    options: [
      { value: 'r0', label: '$0', dims: { revenue: 0, investment: 0 } },
      { value: 'r0_500', label: '$0–500', dims: { revenue: 1, investment: 1 } },
      { value: 'r500_2k', label: '$500–2K', dims: { revenue: 2, investment: 2 } },
      { value: 'r2k_5k', label: '$2K–5K', dims: { revenue: 4, investment: 3 } },
      { value: 'r5k_15k', label: '$5K–15K', dims: { revenue: 6, investment: 4 } },
      { value: 'r15k_plus', label: '$15K+', dims: { revenue: 8, investment: 5 } },
    ],
  },
  {
    id: 'audience',
    type: 'choice',
    question: 'Audience size on largest channel',
    options: [
      { value: 'a_under_500', label: 'Under 500', dims: { audience: 0 } },
      { value: 'a_500_5k', label: '500–5K', dims: { audience: 2 } },
      { value: 'a_5k_25k', label: '5K–25K', dims: { audience: 4 } },
      { value: 'a_25k_100k', label: '25K–100K', dims: { audience: 6 } },
      { value: 'a_100k_plus', label: '100K+', dims: { audience: 8 } },
    ],
  },
  {
    id: 'niche',
    type: 'choice',
    question: 'Niche specificity',
    options: [
      { value: 'n_hyper', label: 'Hyper-specific', dims: { audience: 2, infra: 1 } },
      { value: 'n_specific', label: 'Specific (demo + condition)', dims: { audience: 1, infra: 1 } },
      { value: 'n_broad', label: 'Broad', dims: { audience: 0, infra: 0 } },
      { value: 'n_unsure', label: 'Still figuring it out', dims: { audience: 0, infra: 0 } },
    ],
  },
  {
    id: 'blocker',
    type: 'choice',
    question: 'Biggest blocker',
    options: [
      { value: 'b_tech', label: 'Tech setup', dims: { infra: 3 } },
      { value: 'b_content', label: 'Content creation', dims: { infra: 2 } },
      { value: 'b_pricing', label: 'Pricing & positioning', dims: { infra: 2 } },
      { value: 'b_audience', label: 'Audience growth', dims: { audience: 1, infra: 1 } },
      { value: 'b_sales', label: 'Sales conversations', dims: { revenue: 1, infra: 1 } },
      { value: 'b_all', label: 'All of the above', dims: { infra: 3 } },
    ],
  },
  {
    id: 'investment_history',
    type: 'choice',
    question: 'Past 24-mo investment in coaching/mastermind/consulting',
    options: [
      { value: 'i_under_500', label: '$0–500', dims: { investment: 0 } },
      { value: 'i_500_2k', label: '$500–2K', dims: { investment: 2 } },
      { value: 'i_2k_5k', label: '$2K–5K', dims: { investment: 4 } },
      { value: 'i_5k_15k', label: '$5K–15K', dims: { investment: 7 } },
      { value: 'i_15k_plus', label: '$15K+', dims: { investment: 10 } },
    ],
  },
  {
    id: 'liquidity',
    type: 'choice',
    question: 'Decision-speed / liquidity',
    options: [
      { value: 'l_week', label: 'Within a week', dims: { investment: 8 } },
      { value: 'l_month', label: 'Within a month', dims: { investment: 6 } },
      { value: 'l_3_months', label: 'Within 3 months', dims: { investment: 3 } },
      { value: 'l_payment_plan', label: 'Need a payment plan', dims: { investment: 2 } },
      { value: 'l_not_now', label: 'Couldn\'t right now', dims: { investment: 0 } },
    ],
  },
  {
    id: 'approach',
    type: 'multi',
    question: 'Approach to healing (multi-select up to 2)',
    maxSelect: 2,
    options: [
      { value: 'ap_functional', label: 'Functional', dims: { alignment: 2 } },
      { value: 'ap_naturopathic', label: 'Naturopathic', dims: { alignment: 4 } },
      { value: 'ap_integrative', label: 'Integrative', dims: { alignment: 3 } },
      { value: 'ap_holistic', label: 'Holistic', dims: { alignment: 3 } },
      { value: 'ap_faith', label: 'Faith-based', dims: { alignment: 5 } },
      { value: 'ap_clinical', label: 'Clinical', dims: { alignment: 1 } },
      { value: 'ap_spiritual', label: 'Spiritual', dims: { alignment: 2 } },
      { value: 'ap_conventional', label: 'Conventional', dims: { alignment: 0 } },
      { value: 'ap_other', label: 'Other / mix', dims: { alignment: 1 } },
    ],
  },
  {
    id: 'ai_comfort',
    type: 'choice',
    question: 'Comfort with AI in workflow',
    options: [
      { value: 'ai_daily', label: 'Use AI daily, want more', dims: { alignment: 5, infra: 1 } },
      { value: 'ai_tried', label: 'Tried but not in flow', dims: { alignment: 4, infra: 1 } },
      { value: 'ai_curious', label: 'Curious, haven\'t started', dims: { alignment: 3 } },
      { value: 'ai_hesitant', label: 'Hesitant about AI', dims: { alignment: 1 } },
      { value: 'ai_wrong', label: 'Feels wrong for my work', dims: { alignment: 0 } },
    ],
  },
];

const DIM_KEYS = ['revenue', 'audience', 'infra', 'investment', 'alignment'];
const WEIGHTS = { revenue: 2.2, audience: 1.8, infra: 2.2, investment: 2.2, alignment: 1.6 };

export function scoreAnswers(answers) {
  const dims = { revenue: 0, audience: 0, infra: 0, investment: 0, alignment: 0 };

  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (!value) continue;

    if (q.type === 'choice') {
      const opt = q.options.find((o) => o.value === value);
      if (!opt || !opt.dims) continue;
      for (const k of Object.keys(opt.dims)) {
        dims[k] = (dims[k] || 0) + opt.dims[k];
      }
    } else if (q.type === 'multi') {
      const vals = Array.isArray(value)
        ? value
        : String(value).split(',').map((s) => s.trim()).filter(Boolean);
      for (const v of vals) {
        const opt = q.options.find((o) => o.value === v);
        if (!opt || !opt.dims) continue;
        for (const k of Object.keys(opt.dims)) {
          dims[k] = (dims[k] || 0) + opt.dims[k];
        }
      }
    }
  }

  const cap = (v) => Math.max(0, Math.min(10, v));
  const out = {};
  for (const k of DIM_KEYS) out[k] = cap(dims[k]);

  const composite = Math.round(
    out.revenue * WEIGHTS.revenue +
      out.audience * WEIGHTS.audience +
      out.infra * WEIGHTS.infra +
      out.investment * WEIGHTS.investment +
      out.alignment * WEIGHTS.alignment
  );

  return { ...out, composite };
}

export function tierForScore(score, answers) {
  const { revenue, audience, composite, investment, alignment } = score;

  if (alignment <= 3) return 'none';
  if (composite < 40) return 'none';

  const noCert = answers.cert === 'none' || answers.cert === 'in_progress';
  const noAudience = audience <= 1;
  const noRevenue = revenue <= 1;
  const noUrgency = !answers.why_now || String(answers.why_now).trim().length < 10;
  if (noCert && noAudience && noRevenue && noUrgency) return 'none';

  if (revenue <= 4 && audience >= 5 && investment <= 4) return 'revshare';
  if (composite >= 60 && investment <= 4) return 'starter';
  if (revenue >= 5 && audience >= 3 && composite < 60 && investment <= 6) return 'starter';
  if (revenue >= 4 && answers.blocker === 'b_tech' && investment <= 6) return 'starter';

  return 'launcher';
}

/* ----------------------------------------------------------------
   Slug encoding — sha256(email+timestamp).slice(0,12) + '.' + base64(payload)
   ---------------------------------------------------------------- */

import crypto from 'node:crypto';

export function makeShortHash(email, timestamp) {
  return crypto
    .createHash('sha256')
    .update(`${email}|${timestamp}`)
    .digest('hex')
    .slice(0, 12);
}

export function encodeSlugPayload(payload) {
  const safe = {
    n: (payload.name || '').slice(0, 80),
    h: (payload.handle || '').slice(0, 200),
    a: payload.answers || {},
    t: payload.tierKey,
    s: payload.score,
    v: 2,
  };
  return Buffer.from(JSON.stringify(safe), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const ZERO_SCORE = { revenue: 0, audience: 0, infra: 0, investment: 0, alignment: 0, composite: 0 };

export function decodeSlugPayload(blob) {
  try {
    let pad = blob + '='.repeat((4 - (blob.length % 4)) % 4);
    pad = pad.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(pad, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return {
      name: obj.n || '',
      handle: obj.h || '',
      answers: obj.a || {},
      tierKey: obj.t || 'launcher',
      // Backward-compat: v1 slugs only had revenue/audience/infra.
      score: { ...ZERO_SCORE, ...(obj.s || {}) },
    };
  } catch (err) {
    return null;
  }
}

export function buildSlug({ email, name, handle, answers, tierKey, score }) {
  const ts = Date.now();
  const shortHash = makeShortHash(email, ts);
  const blob = encodeSlugPayload({ name, handle, answers, tierKey, score });
  return `${shortHash}.${blob}`;
}

export function parseSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const dot = slug.indexOf('.');
  if (dot === -1) return null;
  const blob = slug.slice(dot + 1);
  return decodeSlugPayload(blob);
}
