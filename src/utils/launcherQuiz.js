/* ================================================================
   Practice Launcher — Quiz config + scoring
   Shared by the client (LauncherQuizPage) and the server endpoint.
   Pure JS, no DOM or Node-only imports.
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
   Question set — 10 questions, scored on 3 dimensions
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
      { value: 'r0', label: '$0 — pre-revenue', desc: 'Haven\'t taken a paying client yet.', dims: { revenue: 0 } },
      { value: 'r0_500', label: '$0 – $500/mo', desc: 'Occasional sales, not consistent.', dims: { revenue: 1 } },
      { value: 'r500_2k', label: '$500 – $2,000/mo', desc: 'A handful of clients, building momentum.', dims: { revenue: 2 } },
      { value: 'r2k_5k', label: '$2,000 – $5,000/mo', desc: 'Consistent clients. Real practice.', dims: { revenue: 4 } },
      { value: 'r5k_15k', label: '$5,000 – $15,000/mo', desc: 'Established. Scaling phase.', dims: { revenue: 6 } },
      { value: 'r15k_plus', label: '$15,000+/mo', desc: 'Six figures. Need infrastructure to scale.', dims: { revenue: 8 } },
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
    id: 'cadence',
    type: 'choice',
    question: 'How often do you post content?',
    subtitle: 'The system can pre-load your runway — but I want to see if you\'ve already got the muscle.',
    options: [
      { value: 'c_daily', label: 'Daily', desc: 'Consistent presence.', dims: { audience: 2, infra: 1 } },
      { value: 'c_few_week', label: 'A few times a week', desc: 'Regular but not daily.', dims: { audience: 1, infra: 1 } },
      { value: 'c_weekly', label: 'Weekly', desc: 'One push per week.', dims: { audience: 1, infra: 0 } },
      { value: 'c_sporadic', label: 'Sporadic', desc: 'When inspiration strikes.', dims: { audience: 0, infra: 0 } },
      { value: 'c_none', label: 'I don\'t post yet', desc: 'Haven\'t started showing up.', dims: { audience: 0, infra: 0 } },
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
    id: 'stack',
    type: 'choice',
    question: 'What does your current tech stack look like?',
    subtitle: 'I want to know what we\'re building on — or replacing.',
    options: [
      { value: 's_custom', label: 'Custom site (developer-built)', desc: 'You hired someone to build it.', dims: { infra: 1 } },
      { value: 's_clickfunnels', label: 'ClickFunnels or Kajabi', desc: 'Page builder + checkout.', dims: { infra: 2 } },
      { value: 's_squarespace', label: 'Squarespace or Wix', desc: 'Website builder.', dims: { infra: 2 } },
      { value: 's_social', label: 'Just social, no website', desc: 'IG, TikTok, but no real funnel.', dims: { infra: 3 } },
      { value: 's_nothing', label: 'Nothing yet', desc: 'Pre-launch. Building from scratch.', dims: { infra: 3 } },
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
   Score → tier mapping
   - revenue (0-10): $ ready
   - audience (0-10): leverage
   - infra (0-10): gap to install
   composite (0-100): weighted blend
   ---------------------------------------------------------------- */

export function scoreAnswers(answers) {
  const dims = { revenue: 0, audience: 0, infra: 0 };

  for (const q of QUESTIONS) {
    if (q.type !== 'choice') continue;
    const value = answers[q.id];
    if (!value) continue;
    const opt = q.options.find((o) => o.value === value);
    if (!opt || !opt.dims) continue;
    for (const k of Object.keys(opt.dims)) {
      dims[k] = (dims[k] || 0) + opt.dims[k];
    }
  }

  // Cap each dimension at 10 for normalization
  const cap = (v) => Math.max(0, Math.min(10, v));
  const revenue = cap(dims.revenue);
  const audience = cap(dims.audience);
  const infra = cap(dims.infra);

  // Composite (0-100): revenue 40%, audience 30%, infra 30%
  const composite = Math.round((revenue * 4) + (audience * 3) + (infra * 3));

  return {
    revenue,
    audience,
    infra,
    composite,
  };
}

export function tierForScore(score, answers) {
  const { revenue, audience, composite } = score;

  // Disqualify path: no cert + no audience + no revenue + no urgency
  const noCert = answers.cert === 'none' || answers.cert === 'in_progress';
  const noAudience = audience <= 1;
  const noRevenue = revenue <= 1;
  const noUrgency = !answers.why_now || answers.why_now.trim().length < 10;

  if (noCert && noAudience && noRevenue && noUrgency) {
    return 'none';
  }

  // Revenue Share: lower revenue but high audience leverage + ambition
  if (revenue <= 4 && audience >= 5) {
    return 'revshare';
  }

  // Starter: already has content/audience/revenue motion, just needs tech wired
  if (revenue >= 5 && audience >= 3 && composite < 60) {
    return 'starter';
  }
  if (revenue >= 4 && answers.blocker === 'b_tech') {
    return 'starter';
  }

  // Practice Launcher: default for most
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
    v: 1,
  };
  return utf8ToBase64Url(JSON.stringify(safe));
}

export function decodeSlugPayload(blob) {
  try {
    const json = base64UrlToUtf8(blob);
    const obj = JSON.parse(json);
    return {
      name: obj.n || '',
      handle: obj.h || '',
      answers: obj.a || {},
      tierKey: obj.t || 'launcher',
      score: obj.s || { revenue: 0, audience: 0, infra: 0, composite: 0 },
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
