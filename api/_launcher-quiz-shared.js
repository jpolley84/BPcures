/* ================================================================
   Server-side mirror of utils/launcherQuiz.js
   Vercel serverless functions can't import Vite-aliased frontend
   modules, so we duplicate the small amount of logic the API
   endpoints need. Keep this in sync with src/utils/launcherQuiz.js.
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
      { value: 'r0', label: '$0', dims: { revenue: 0 } },
      { value: 'r0_500', label: '$0–500', dims: { revenue: 1 } },
      { value: 'r500_2k', label: '$500–2K', dims: { revenue: 2 } },
      { value: 'r2k_5k', label: '$2K–5K', dims: { revenue: 4 } },
      { value: 'r5k_15k', label: '$5K–15K', dims: { revenue: 6 } },
      { value: 'r15k_plus', label: '$15K+', dims: { revenue: 8 } },
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
    id: 'cadence',
    type: 'choice',
    question: 'Content cadence',
    options: [
      { value: 'c_daily', label: 'Daily', dims: { audience: 2, infra: 1 } },
      { value: 'c_few_week', label: 'Few times a week', dims: { audience: 1, infra: 1 } },
      { value: 'c_weekly', label: 'Weekly', dims: { audience: 1, infra: 0 } },
      { value: 'c_sporadic', label: 'Sporadic', dims: { audience: 0, infra: 0 } },
      { value: 'c_none', label: 'Don\'t post yet', dims: { audience: 0, infra: 0 } },
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
    id: 'stack',
    type: 'choice',
    question: 'Current tech stack',
    options: [
      { value: 's_custom', label: 'Custom site', dims: { infra: 1 } },
      { value: 's_clickfunnels', label: 'ClickFunnels / Kajabi', dims: { infra: 2 } },
      { value: 's_squarespace', label: 'Squarespace / Wix', dims: { infra: 2 } },
      { value: 's_social', label: 'Just social', dims: { infra: 3 } },
      { value: 's_nothing', label: 'Nothing yet', dims: { infra: 3 } },
    ],
  },
];

export function scoreAnswers(answers) {
  const dims = { revenue: 0, audience: 0, infra: 0 };
  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (!value) continue;
    const opt = q.options.find((o) => o.value === value);
    if (!opt || !opt.dims) continue;
    for (const k of Object.keys(opt.dims)) {
      dims[k] = (dims[k] || 0) + opt.dims[k];
    }
  }
  const cap = (v) => Math.max(0, Math.min(10, v));
  const revenue = cap(dims.revenue);
  const audience = cap(dims.audience);
  const infra = cap(dims.infra);
  const composite = Math.round(revenue * 4 + audience * 3 + infra * 3);
  return { revenue, audience, infra, composite };
}

export function tierForScore(score, answers) {
  const { revenue, audience, composite } = score;
  const noCert = answers.cert === 'none' || answers.cert === 'in_progress';
  const noAudience = audience <= 1;
  const noRevenue = revenue <= 1;
  const noUrgency = !answers.why_now || answers.why_now.trim().length < 10;
  if (noCert && noAudience && noRevenue && noUrgency) return 'none';
  if (revenue <= 4 && audience >= 5) return 'revshare';
  if (revenue >= 5 && audience >= 3 && composite < 60) return 'starter';
  if (revenue >= 4 && answers.blocker === 'b_tech') return 'starter';
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
    v: 1,
  };
  return Buffer.from(JSON.stringify(safe), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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
      score: obj.s || { revenue: 0, audience: 0, infra: 0, composite: 0 },
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
