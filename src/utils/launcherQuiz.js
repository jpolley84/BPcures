/* ================================================================
   Practice Launcher — Quiz config + scoring (v2)
   Shared by the client (LauncherQuizPage) and the server endpoint.
   Pure JS, no DOM or Node-only imports.

   v2 — 5-dimension scoring model:
     1. Revenue Readiness (weight 22)
     2. Audience Leverage (weight 18)
     3. Infrastructure Gap (weight 22)
     4. Investment Readiness (weight 22)
     5. Values Alignment (weight 16)
     -------------------------------- = 100

   If you change scoring here, also update api/_launcher-quiz-shared.js
   to match. Future refactor: extract to a single shared spec.
   ================================================================ */

export const TIER_DETAILS = {
  starter: {
    key: 'starter',
    name: 'Starter Kit',
    price: '$2,997',
    cadence: 'one-time',
    summary: 'The tech wired. You bring the content.',
    fit: 'You already have audience and content motion — you need the funnel and tech installed under it.',
    deliverables: [
      'Custom quiz funnel website on Vercel',
      'Email automation (Resend) wired',
      'Stripe checkout — tiered pricing configured',
      '$17 digital product upsell in your funnel',
      'Brand profile intake session',
      'GitHub + Vercel deploy pipeline',
      'Dedicated Gmail + integrations',
    ],
    timeline: '72 hours from setup call to live site',
    guarantee: 'Same first-client guarantee: $500 in collected revenue within 60 days, or I keep working until you get it.',
  },
  launcher: {
    key: 'launcher',
    name: 'The Practice Launcher',
    price: '$9,997',
    priceWas: '$14,997',
    cadence: 'founding cohort price',
    summary: 'Everything installed. Book published. Content loaded. First client guaranteed.',
    fit: 'You\'re at the inflection point — certified, posting, but the funnel below the surface isn\'t capturing what you\'re earning above it.',
    deliverables: [
      'Everything in the Starter Kit',
      'Your book published on Amazon KDP',
      '90-day content runway (30 TikTok scripts, 30 emails, 15 YouTube outlines)',
      'Full 30-day challenge email sequence',
      'Client intake assessment quiz',
      'AI A/B testing & auto-optimization on all emails',
      'Social media intelligence & trend scanning',
      '$17 digital product live in your funnel from day one',
    ],
    timeline: '72 hours to live · book published in 60 days · 90 days of content loaded before launch',
    guarantee: '"First Client" guarantee: $500 collected within 60 days. If 90 days pass with no first client, full setup-fee refund and you keep everything installed.',
  },
  revshare: {
    key: 'revshare',
    name: 'Revenue Share',
    price: '$4,997',
    priceSuffix: '+ 10% gross for 12 months',
    cadence: 'aligned incentive',
    summary: 'Same full install. Lower upfront. I have skin in the game — I only profit if your practice does.',
    fit: 'You have audience and identity but lower revenue today. Lower upfront, aligned incentives.',
    deliverables: [
      'Everything in the Practice Launcher',
      'Lower upfront investment',
      'Joel has skin in the game — 10% rev share for 12 months',
      'Monthly revenue check-ins for 12 months',
      'Same "First Client" guarantee',
      'Revenue share capped at a fair ceiling — details on call',
    ],
    timeline: 'Same 72-hour install + 12 months of monthly revenue check-ins',
    guarantee: 'Same "First Client" guarantee: $500 in 60 days. Plus monthly check-ins for 12 months — I only profit if you do.',
  },
  none: {
    key: 'none',
    name: 'Foundation First',
    price: 'Free resources',
    cadence: '',
    summary: 'You\'re earlier in the journey — let\'s get the foundation in place first.',
    fit: 'You don\'t have your certification, audience, or revenue motion yet. I won\'t take your money for a system you\'re not ready to fill.',
    deliverables: [],
    timeline: '',
    guarantee: '',
  },
};

/* ----------------------------------------------------------------
   Question set — 10 questions, scored on 5 dimensions
   Dimensions per option:
     revenue    — current $ momentum
     audience   — reach
     infra      — gap to install
     investment — willingness/ability to invest
     alignment  — values fit (faith / naturopathic / AI-comfort)
   ---------------------------------------------------------------- */

export const QUESTIONS = [
  {
    id: 'cert',
    type: 'choice',
    question: 'What\'s your certification status?',
    subtitle: 'Helps me see where you are on the credentialing path.',
    options: [
      { value: 'iin', label: 'IIN (Institute for Integrative Nutrition)', desc: 'Health coaching certification.', dims: { revenue: 1, infra: 1 } },
      { value: 'nta', label: 'NTA (Nutritional Therapy Association)', desc: 'NTP / NTC.', dims: { revenue: 1, infra: 1 } },
      { value: 'fdnp', label: 'FDN-P (Functional Diagnostic Nutrition)', desc: 'Functional diagnostic.', dims: { revenue: 2, infra: 1 } },
      { value: 'naturopathic', label: 'Naturopathic practitioner / ND', desc: 'Naturopathic medicine.', dims: { revenue: 2, infra: 1 } },
      { value: 'rn', label: 'RN / Nurse', desc: 'Registered nurse or nursing license.', dims: { revenue: 2, infra: 1 } },
      { value: 'other', label: 'Other certification', desc: 'CHHC, holistic nutrition, herbalist, etc.', dims: { revenue: 1, infra: 1 } },
      { value: 'in_progress', label: 'In progress', desc: 'Studying now — not yet credentialed.', dims: { revenue: 0, infra: 0 } },
      { value: 'none', label: 'No certification yet', desc: 'Haven\'t started a program.', dims: { revenue: 0, infra: 0 } },
    ],
  },
  {
    id: 'revenue',
    type: 'choice',
    question: 'What\'s your current monthly revenue from your practice?',
    subtitle: 'Honest answers help me match the right tier — there\'s no judgment here.',
    options: [
      { value: 'r0', label: '$0 — pre-revenue', desc: 'Haven\'t taken a paying client yet.', dims: { revenue: 0, investment: 0 } },
      { value: 'r0_500', label: '$0 – $500/mo', desc: 'Occasional sales, not consistent.', dims: { revenue: 1, investment: 1 } },
      { value: 'r500_2k', label: '$500 – $2,000/mo', desc: 'A handful of clients, building momentum.', dims: { revenue: 2, investment: 2 } },
      { value: 'r2k_5k', label: '$2,000 – $5,000/mo', desc: 'Consistent clients. Real practice.', dims: { revenue: 4, investment: 3 } },
      { value: 'r5k_15k', label: '$5,000 – $15,000/mo', desc: 'Established. Scaling phase.', dims: { revenue: 6, investment: 4 } },
      { value: 'r15k_plus', label: '$15,000+/mo', desc: 'Six figures. Need infrastructure to scale.', dims: { revenue: 8, investment: 5 } },
    ],
  },
  {
    id: 'audience',
    type: 'choice',
    question: 'How big is your audience on your largest channel?',
    subtitle: 'TikTok, Instagram, YouTube, email list — whichever is biggest.',
    options: [
      { value: 'a_under_500', label: 'Under 500', desc: 'Just starting out.', dims: { audience: 0 } },
      { value: 'a_500_5k', label: '500 – 5,000', desc: 'Small but real audience.', dims: { audience: 2 } },
      { value: 'a_5k_25k', label: '5,000 – 25,000', desc: 'Real reach.', dims: { audience: 4 } },
      { value: 'a_25k_100k', label: '25,000 – 100,000', desc: 'Substantial audience.', dims: { audience: 6 } },
      { value: 'a_100k_plus', label: '100,000+', desc: 'Large audience under-monetized.', dims: { audience: 8 } },
    ],
  },
  {
    id: 'niche',
    type: 'choice',
    question: 'How specific is your niche?',
    subtitle: 'Specificity is the lever that makes a quiz funnel work.',
    options: [
      { value: 'n_hyper', label: 'Hyper-specific (one condition)', desc: 'Like Joel: blood pressure for women 45+.', dims: { audience: 2, infra: 1 } },
      { value: 'n_specific', label: 'Specific (demographic + condition)', desc: 'Postpartum mamas, autoimmune women, etc.', dims: { audience: 1, infra: 1 } },
      { value: 'n_broad', label: 'Broad (general wellness)', desc: 'Holistic health, integrative healing.', dims: { audience: 0, infra: 0 } },
      { value: 'n_unsure', label: 'Still figuring it out', desc: 'Wide net, narrowing down.', dims: { audience: 0, infra: 0 } },
    ],
  },
  {
    id: 'blocker',
    type: 'choice',
    question: 'What\'s the single biggest blocker right now?',
    subtitle: 'The one thing that, if it disappeared tomorrow, would unblock everything.',
    options: [
      { value: 'b_tech', label: 'Tech setup', desc: 'Funnels, websites, integrations — the wiring.', dims: { infra: 3 } },
      { value: 'b_content', label: 'Content creation', desc: 'Scripts, emails, posts — the volume.', dims: { infra: 2 } },
      { value: 'b_pricing', label: 'Pricing & positioning', desc: 'What to charge, how to package.', dims: { infra: 2 } },
      { value: 'b_audience', label: 'Audience growth', desc: 'Getting in front of more people.', dims: { audience: 1, infra: 1 } },
      { value: 'b_sales', label: 'Sales conversations', desc: 'Closing on calls, converting leads.', dims: { revenue: 1, infra: 1 } },
      { value: 'b_all', label: 'All of the above', desc: 'Pick one and the others wait.', dims: { infra: 3 } },
    ],
  },
  {
    id: 'investment_history',
    type: 'choice',
    question: 'In the past 24 months, the most you\'ve invested in a coaching program, mastermind, or business consultant.',
    subtitle: 'This predicts readiness better than monthly revenue. There\'s no wrong answer — only honesty.',
    options: [
      { value: 'i_under_500', label: '$0 – $500', desc: 'Free resources, courses under $500, or nothing yet.', dims: { investment: 0 } },
      { value: 'i_500_2k', label: '$500 – $2,000', desc: 'A digital course or short program.', dims: { investment: 2 } },
      { value: 'i_2k_5k', label: '$2,000 – $5,000', desc: 'A mid-tier program or short-term coaching.', dims: { investment: 4 } },
      { value: 'i_5k_15k', label: '$5,000 – $15,000', desc: 'A serious mastermind or business consultant.', dims: { investment: 7 } },
      { value: 'i_15k_plus', label: '$15,000+', desc: 'Premium mastermind, year-long coaching, or higher.', dims: { investment: 10 } },
    ],
  },
  {
    id: 'liquidity',
    type: 'choice',
    question: 'If a business decision today could 10x your practice in 90 days, how soon could you say yes financially?',
    subtitle: 'I want to know what kind of structure makes sense — not whether you\'re "qualified."',
    options: [
      { value: 'l_week', label: 'Within a week', desc: 'I have liquidity ready for the right decision.', dims: { investment: 8 } },
      { value: 'l_month', label: 'Within a month', desc: 'Need a beat to organize cash, but yes.', dims: { investment: 6 } },
      { value: 'l_3_months', label: 'Within 3 months', desc: 'I\'d need to plan and stage it.', dims: { investment: 3 } },
      { value: 'l_payment_plan', label: 'Need a payment plan', desc: 'Yes if it\'s split over time.', dims: { investment: 2 } },
      { value: 'l_not_now', label: 'Couldn\'t right now', desc: 'Cash is tight — be honest.', dims: { investment: 0 } },
    ],
  },
  {
    id: 'approach',
    type: 'multi',
    question: 'How do you describe your work? (Pick up to 2.)',
    subtitle: 'Choose the language that feels closest to how you actually practice.',
    maxSelect: 2,
    options: [
      { value: 'ap_functional', label: 'Functional', desc: 'Functional medicine / functional health.', dims: { alignment: 2 } },
      { value: 'ap_naturopathic', label: 'Naturopathic', desc: 'Naturopathic / nature-aligned healing.', dims: { alignment: 4 } },
      { value: 'ap_integrative', label: 'Integrative', desc: 'Both/and — bridging conventional and natural.', dims: { alignment: 3 } },
      { value: 'ap_holistic', label: 'Holistic', desc: 'Whole-person, mind-body-spirit.', dims: { alignment: 3 } },
      { value: 'ap_faith', label: 'Faith-based', desc: 'God-centered, biblical-rooted health.', dims: { alignment: 5 } },
      { value: 'ap_clinical', label: 'Clinical', desc: 'Clinically-trained, evidence-led.', dims: { alignment: 1 } },
      { value: 'ap_spiritual', label: 'Spiritual', desc: 'Spirit-led, energy work, intuitive.', dims: { alignment: 2 } },
      { value: 'ap_conventional', label: 'Conventional', desc: 'Mainstream / allopathic.', dims: { alignment: 0 } },
      { value: 'ap_other', label: 'Other / mix', desc: 'Doesn\'t map to these labels.', dims: { alignment: 1 } },
    ],
  },
  {
    id: 'ai_comfort',
    type: 'choice',
    question: 'How comfortable are you with AI in your workflow?',
    subtitle: 'Practice Launcher uses AI to scale content, replies, and email A/B testing. I want to know if that\'s a fit for you.',
    options: [
      { value: 'ai_daily', label: 'I use AI daily and want more', desc: 'AI is already part of how I work.', dims: { alignment: 5, infra: 1 } },
      { value: 'ai_tried', label: 'I\'ve tried it but it\'s not in my flow', desc: 'Curious, but haven\'t built habits yet.', dims: { alignment: 4, infra: 1 } },
      { value: 'ai_curious', label: 'I\'m curious but haven\'t started', desc: 'Open to it, never sat down with it.', dims: { alignment: 3 } },
      { value: 'ai_hesitant', label: 'I\'m hesitant about AI', desc: 'Not sure how I feel — leaning skeptical.', dims: { alignment: 1 } },
      { value: 'ai_wrong', label: 'It feels wrong for my work', desc: 'My work is too personal for AI to touch.', dims: { alignment: 0 } },
    ],
  },
  {
    id: 'why_now',
    type: 'text',
    question: 'Why now?',
    subtitle: 'Tell me what\'s shifted recently. What made today the day you took this diagnostic? (Optional but encouraged — 1-3 sentences.)',
    optional: true,
    placeholder: 'My calendar is full of one-on-ones and the income is flat. I keep telling myself I\'ll figure out Mailchimp next month, and another month goes by...',
  },
  {
    id: 'identity',
    type: 'identity',
    question: 'Where should I send your diagnostic?',
    subtitle: 'I\'ll personally review your answers and put together your fit analysis. Your name and email — both required.',
  },
  {
    id: 'handle',
    type: 'handle',
    question: 'Your primary website OR your largest social handle.',
    subtitle: 'TikTok / Instagram / YouTube / website URL — whichever shows your work best. I\'ll personally look at it before recommending a tier, so this is the most important answer in the whole diagnostic.',
  },
];

/* ----------------------------------------------------------------
   Score answers → 5-dim score + composite (0-100)

   Dimension caps (0-10 each):
     revenue, audience, infra, investment, alignment

   Composite weights (sum = 100):
     revenue 22 · audience 18 · infra 22 · investment 22 · alignment 16
   ---------------------------------------------------------------- */

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
      // value can be a comma-separated string or array
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

  // Composite (0-100): weighted sum
  // 10 * 2.2 + 10 * 1.8 + 10 * 2.2 + 10 * 2.2 + 10 * 1.6 = 100
  const composite = Math.round(
    out.revenue * WEIGHTS.revenue +
      out.audience * WEIGHTS.audience +
      out.infra * WEIGHTS.infra +
      out.investment * WEIGHTS.investment +
      out.alignment * WEIGHTS.alignment
  );

  return { ...out, composite };
}

/* ----------------------------------------------------------------
   Tier mapping — 5-dim aware

   Loose rules:
     - alignment <= 3 (very low) → Foundation First (no Calendly push)
     - composite < 40 → Foundation First
     - revenue <= 4 AND audience >= 5 AND investment <= 4 → revshare
       (high audience, low revenue, can't drop $10K — Joel takes skin in)
     - composite >= 60 AND investment <= 4 → starter
       (good operational fit, can't afford full launcher)
     - revenue >= 5 AND audience >= 3 AND composite < 60 → starter
       (already has motion, just needs wiring)
     - revenue >= 4 AND blocker is tech → starter
     - otherwise → launcher (default)
   ---------------------------------------------------------------- */

export function tierForScore(score, answers) {
  const { revenue, audience, composite, investment, alignment } = score;

  // Hard alignment floor — Joel doesn't waste calls on poor values match
  if (alignment <= 3) return 'none';

  // Composite floor — too thin operationally
  if (composite < 40) return 'none';

  // Legacy disqualifier still applies — no cert, no audience, no revenue, no urgency
  const noCert = answers.cert === 'none' || answers.cert === 'in_progress';
  const noAudience = audience <= 1;
  const noRevenue = revenue <= 1;
  const noUrgency = !answers.why_now || String(answers.why_now).trim().length < 10;
  if (noCert && noAudience && noRevenue && noUrgency) return 'none';

  // Revenue Share: high audience leverage, lower revenue, can't drop $10K
  if (revenue <= 4 && audience >= 5 && investment <= 4) return 'revshare';

  // Starter: operationally ready BUT can't afford full launcher
  if (composite >= 60 && investment <= 4) return 'starter';

  // Starter: already has motion, just needs wiring (and isn't a high investor)
  if (revenue >= 5 && audience >= 3 && composite < 60 && investment <= 6) return 'starter';
  if (revenue >= 4 && answers.blocker === 'b_tech' && investment <= 6) return 'starter';

  // Practice Launcher: default for the operationally-fit + investment-ready
  return 'launcher';
}

/* ----------------------------------------------------------------
   Recommend full tier object given answers (used both client + server)
   ---------------------------------------------------------------- */

export function recommendTier(answers) {
  const score = scoreAnswers(answers);
  const tierKey = tierForScore(score, answers);
  return {
    score,
    tierKey,
    tier: TIER_DETAILS[tierKey],
  };
}

/* ----------------------------------------------------------------
   URL slug encoding — opaque hash + base64 blob of safe payload
   The blob excludes email (PII never in URL).

   v1 → v2 NOTE: schema gained 2 new dims (investment, alignment).
   Old v1 slugs still decode (missing dims default to 0). New v2
   slugs include all 5. We bumped v: 1 → 2 in the payload.
   ---------------------------------------------------------------- */

function utf8ToBase64Url(str) {
  if (typeof btoa === 'function') {
    // Browser path
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Node path
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUtf8(b64) {
  let pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  pad = pad.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') {
    const bin = atob(pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  return Buffer.from(pad, 'base64').toString('utf8');
}

export function encodeSlugPayload(payload) {
  // payload: { name, handle, answers, tierKey, score }
  // No email here.
  const safe = {
    n: (payload.name || '').slice(0, 80),
    h: (payload.handle || '').slice(0, 200),
    a: payload.answers || {},
    t: payload.tierKey,
    s: payload.score,
    v: 2,
  };
  return utf8ToBase64Url(JSON.stringify(safe));
}

const ZERO_SCORE = { revenue: 0, audience: 0, infra: 0, investment: 0, alignment: 0, composite: 0 };

export function decodeSlugPayload(blob) {
  try {
    const json = base64UrlToUtf8(blob);
    const obj = JSON.parse(json);
    return {
      name: obj.n || '',
      handle: obj.h || '',
      answers: obj.a || {},
      tierKey: obj.t || 'launcher',
      // Backward-compat: v1 slugs only had revenue/audience/infra. Default
      // missing dims to 0 so old links still decode without crashing.
      score: { ...ZERO_SCORE, ...(obj.s || {}) },
    };
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------
   Score-color helper for visualization
   ---------------------------------------------------------------- */

export function scoreColor(composite) {
  if (composite >= 70) return 'var(--clay)';
  if (composite >= 45) return 'var(--gold)';
  if (composite >= 20) return 'var(--sage)';
  return 'var(--muted)';
}
