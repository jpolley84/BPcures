import { Resend } from 'resend';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const COOKBOOK_URL = `${SITE_URL}/downloads/cook-for-life-cookbook.pdf`;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '1550e2956c';

// Category → lead-magnet PDF + copy constants
const CATEGORIES = {
  blood_pressure: {
    label: 'blood pressure',
    short: 'BP',
    pdf_file: 'bp-reset-day1-and-beyond.pdf',
    pdf_name: 'The 10-Day BP Reset — Day 1 and the full challenge',
    subject_a: 'Your BP protocol is inside — Day 1 attached',
    subject_b: "I've watched this move numbers — here's Day 1",
    preview: 'Day 1 of the 10-Day BP Reset, plus the 3 next steps Joel would tell you to pick between.',
    quick_win:
      "Day 1 is the easiest one. It's the move I tell family to try first — and the one most people feel within 72 hours.",
    category_key: 'blood_pressure',
  },
  cortisol: {
    label: 'cortisol',
    short: 'cortisol',
    pdf_file: 'cortisol-day1-diagnosis.pdf',
    pdf_name: 'Cortisol Cure — Day 1: Wired-and-Tired Diagnosis',
    subject_a: 'Your cortisol protocol — Day 1 inside',
    subject_b: 'Wired-tired? Day 1 of the fix is here',
    preview: 'Day 1 of the Cortisol Cure — diagnose your pattern first, then the three paths forward.',
    quick_win:
      "Day 1 is the diagnosis step. Before you try a single supplement, you want to know which cortisol pattern is actually yours. Most people are wrong about this.",
    category_key: 'cortisol',
  },
  blood_sugar: {
    label: 'blood sugar',
    short: 'glucose',
    pdf_file: 'blood-sugar-day1.pdf',
    pdf_name: 'Blood Sugar Reset — Day 1',
    subject_a: 'Your glucose protocol — Day 1 inside',
    subject_b: "Your A1C is creeping up — here's Day 1",
    preview: 'Day 1 of the 10-Day Blood Sugar Reset, plus the three next-step options matched to you.',
    quick_win:
      "Day 1 is about what actually drives a flat glucose curve — which is almost never the thing people focus on first.",
    category_key: 'blood_sugar',
  },
};

const TIPS = {
  blood_pressure: [
    {
      title: 'Reduce sodium to under 2,000mg/day',
      body: 'Most people consume 3,400mg without realizing it. Even a two-week reduction moves systolic numbers in most people — and it\'s the fastest single lever you have.',
    },
    {
      title: 'Walk 20 minutes daily',
      body: 'Not for weight loss — for vasodilation. Evening walks move systolic numbers fastest. Consistency matters more than pace. This is the one I tell family to start the same day.',
    },
    {
      title: 'Prioritize 7+ hours of sleep',
      body: 'Poor sleep raises cortisol, which raises blood pressure. This one compounds everything else you do — fix the sleep and the other levers work better.',
    },
  ],
  cortisol: [
    {
      title: 'Stop screens 60 minutes before bed',
      body: 'Blue light suppresses melatonin and keeps cortisol elevated past midnight. A single 60-minute wind-down window changes your morning cortisol curve faster than any supplement.',
    },
    {
      title: 'Practice slow, deep breathing for 5 minutes daily',
      body: 'Diaphragmatic breathing activates the vagus nerve, which directly lowers cortisol. Five minutes once a day — morning or evening — shifts your baseline within two weeks.',
    },
    {
      title: 'Eat a balanced meal every 4 hours',
      body: 'Skipping meals spikes cortisol. Your adrenals respond to low blood sugar like a stress event. Protein, fat, and fiber every 4 hours keeps the cortisol curve flat.',
    },
  ],
  blood_sugar: [
    {
      title: 'Eat fiber before carbohydrates',
      body: 'Starting a meal with vegetables or another fiber-rich food slows glucose absorption and flattens the post-meal spike by 20–30% in most people. Order matters.',
    },
    {
      title: 'Walk 10 minutes after every meal',
      body: 'A short walk after eating drives glucose into muscle cells without insulin. This is the most consistent single intervention I\'ve seen move post-meal numbers — even a slow stroll counts.',
    },
    {
      title: 'Stay hydrated with water throughout the day',
      body: 'Dehydration raises blood glucose by concentrating the sugar already in your blood. Consistent water intake keeps your baseline lower and your kidneys filtering.',
    },
  ],
};

const TIPS_HEADING = {
  blood_pressure: 'here are my top 3 tips for lowering blood pressure.',
  cortisol: 'here are my top 3 tips for managing cortisol.',
  blood_sugar: 'here are my top 3 tips for stabilizing blood sugar.',
};

// Load products.json once per cold-start
let PRODUCTS = null;
function loadProducts() {
  if (PRODUCTS) return PRODUCTS;
  try {
    const fp = path.join(process.cwd(), 'public', 'products.json');
    PRODUCTS = JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (err) {
    console.error('lead-magnet: failed to load products.json', err.message);
    PRODUCTS = [];
  }
  return PRODUCTS;
}

function tiersForCategory(category) {
  const all = loadProducts();
  return all
    .filter((p) => p.category === category)
    .sort((a, b) => a.tier - b.tier);
}

function recommendedTier(riskScore) {
  const s = Number(riskScore) || 0;
  if (s <= 3) return 1;
  if (s <= 6) return 2;
  return 3;
}

function normalizeCategory(c) {
  if (!c) return 'blood_pressure';
  const cc = String(c).toLowerCase();
  if (cc === 'all') return 'blood_pressure';
  if (['blood_pressure', 'cortisol', 'blood_sugar'].includes(cc)) return cc;
  return 'blood_pressure';
}

// Subscribe or update subscriber in Mailchimp audience — non-blocking, never throws.
async function mailchimpUpsert({ email, name, category, riskScore, tier, answers, extraTags }) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_KEY.includes('-')) return { ok: false, reason: 'no_key' };
  const [, dc] = MAILCHIMP_API_KEY.split('-');
  if (!dc) return { ok: false, reason: 'bad_dc' };

  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
  const auth = 'Basic ' + Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64');

  const a = answers || {};
  const body = {
    email_address: email,
    status_if_new: 'subscribed',
    merge_fields: {
      FNAME: name || '',
      CATEGORY: category,
      SCORE: String(riskScore || ''),
      TIER: `tier-${tier}`,
      DURATION: a.duration || '',
      MEDS: a.medication || '',
      BARRIER: a.barrier || '',
      AGE: a.age || '',
    },
  };

  try {
    const r = await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('mailchimp upsert failed', r.status, text.slice(0, 200));
      return { ok: false, status: r.status };
    }
    // Apply tags (bpquiz-taker + category + tier)
    const tags = [
      { name: 'bpquiz-taker', status: 'active' },
      { name: `category-${category}`, status: 'active' },
      { name: `tier-${tier}`, status: 'active' },
    ];
    // Tag by medication status — highest-value segmentation field
    if (a.medication) tags.push({ name: `meds-${a.medication}`, status: 'active' });
    // Tag by age range
    if (a.age) tags.push({ name: `age-${a.age}`, status: 'active' });
    // Extra tags from the request (e.g. footer challenge signup)
    if (Array.isArray(extraTags)) {
      for (const t of extraTags) {
        if (typeof t === 'string' && t.trim()) tags.push({ name: t.trim(), status: 'active' });
      }
    }
    await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    return { ok: true };
  } catch (err) {
    console.error('mailchimp upsert error', err.message);
    return { ok: false, reason: err.message };
  }
}

function renderEmail({ name, category, tier, tiers }) {
  const cat = CATEGORIES[category];
  const firstName = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `${firstName},` : 'Friend,';
  const pdfUrl = `${SITE_URL}/downloads/${cat.pdf_file}`;

  const tierCard = (t) => {
    const isRecommended = t.tier === tier;
    const accentBg = isRecommended ? '#6C3483' : '#F5F1E8';
    const accentFg = isRecommended ? '#FFFFFF' : '#2C3E50';
    const badge = isRecommended
      ? `<div style="display:inline-block;background:#B85A36;color:#fff;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:10px;">Matched to your score</div>`
      : '';
    const what = (t.what_inside || []).slice(0, 4)
      .map((w) => `<li style="margin:4px 0;color:${accentFg};opacity:0.9;">${w}</li>`)
      .join('');
    const outcome = (t.outcomes || [])[0] || '';
    const coachingLine = t.tier === 3
      ? `<div style="margin:12px 0 14px;padding:10px 12px;background:${isRecommended ? 'rgba(255,255,255,0.12)' : 'rgba(108,52,131,0.08)'};border-radius:8px;">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${accentFg};opacity:0.8;margin-bottom:4px;">Premium bonuses included</div>
          <div style="font-size:13px;color:${accentFg};opacity:0.95;line-height:1.5;">🎤 Barbara O'Neill LIVE virtual ticket — June 24–25, 2026 ($297 value)<br/>👥 30-Day Challenge + weekly group coaching — kicks off May 1</div>
        </div>`
      : '';
    const priceLine = t.original_price
      ? `<span style="font-family:Georgia,serif;font-size:28px;font-weight:500;">${t.price}</span> <span style="text-decoration:line-through;opacity:0.5;font-size:15px;margin-left:6px;">${t.original_price}</span>`
      : `<span style="font-family:Georgia,serif;font-size:28px;font-weight:500;">${t.price}</span>`;

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;background:${accentBg};border-radius:14px;border:1px solid rgba(0,0,0,0.08);">
        <tr><td style="padding:20px 22px;">
          ${badge}
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.7;color:${accentFg};margin-bottom:6px;">Level 0${t.tier} · ${t.tier_label}</div>
          <div style="font-family:Georgia,serif;font-size:20px;line-height:1.25;color:${accentFg};margin-bottom:6px;">${t.name}</div>
          <div style="font-size:14px;line-height:1.5;color:${accentFg};opacity:0.9;margin-bottom:12px;">${t.headline}</div>
          <ul style="font-size:13px;line-height:1.45;padding-left:18px;margin:8px 0 14px;">${what}</ul>
          ${outcome ? `<div style="font-size:13px;color:${accentFg};opacity:0.85;margin-bottom:10px;"><em>Outcome:</em> ${outcome}</div>` : ''}
          ${coachingLine}
          <div style="margin:10px 0 14px;">${priceLine}</div>
          <a href="${t.stripe_payment_link}" style="display:inline-block;background:${isRecommended ? '#FFFFFF' : '#2C3E50'};color:${isRecommended ? '#6C3483' : '#FFFFFF'};padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
            ${t.tier === 3 ? 'Get the kit + coaching' : t.tier === 2 ? 'Get the complete kit' : 'Start with the guide'}
          </a>
        </td></tr>
      </table>
    `;
  };

  const tierHtml = tiers.map(tierCard).join('');

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">
      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN · Twenty years ICU &amp; emergency</div>
      </td></tr>

      <tr><td style="padding:18px 28px 0;">
        <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#2C3E50;margin:8px 0 14px;font-weight:500;">
          ${greeting} ${TIPS_HEADING[category]}
        </h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
          ${TIPS[category].map((tip, i) => `
          <tr>
            <td style="width:34px;vertical-align:top;padding-top:2px;">
              <div style="width:26px;height:26px;background:#6C3483;border-radius:50%;color:#fff;font-weight:700;font-size:13px;text-align:center;line-height:26px;">${i + 1}</div>
            </td>
            <td style="${i < TIPS[category].length - 1 ? 'padding-bottom:14px;' : ''}">
              <div style="font-size:15px;font-weight:600;color:#2C3E50;margin-bottom:3px;">${tip.title}</div>
              <div style="font-size:13px;line-height:1.55;color:#5A5A5A;">${tip.body}</div>
            </td>
          </tr>`).join('')}
        </table>
      </td></tr>

      <tr><td style="padding:6px 28px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E8;border-radius:14px;">
          <tr><td style="padding:22px 22px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6C3483;margin-bottom:8px;">Start here — free</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#2C3E50;margin-bottom:6px;">${cat.pdf_name}</div>
            <p style="font-size:14px;line-height:1.55;color:#3A3A3A;margin:0 0 14px;">${cat.quick_win}</p>
            <a href="${pdfUrl}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
              Download Day 1 (PDF)
            </a>
          </td></tr>
        </table>
      </td></tr>

      ${(() => {
        const featured = tiers.find(t => t.tier === 2) || tiers.find(t => t.tier === 1) || tiers[0];
        if (!featured) return '';
        return `<tr><td style="padding:18px 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2C3E50;border-radius:14px;">
          <tr><td style="padding:22px 24px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:8px;">Most popular</div>
            <div style="font-family:Georgia,serif;font-size:21px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">${featured.name} — ${featured.price}</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.85);margin:0 0 16px;">
              ${featured.headline}
            </p>
            <a href="${featured.stripe_payment_link}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Get the kit →
            </a>
          </td></tr>
        </table>
      </td></tr>`;
      })()}

      <tr><td style="padding:22px 28px 4px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:20px;">
          <h2 style="font-family:Georgia,serif;font-size:20px;line-height:1.3;color:#2C3E50;margin:0 0 6px;font-weight:500;">
            Want the full protocol? Pick the level that fits.
          </h2>
          <p style="font-size:14px;line-height:1.55;color:#5A5A5A;margin:0 0 6px;">
            Three paths. Same nurse. Read all three and trust your gut.
          </p>
        </div>
      </td></tr>

      <tr><td style="padding:0 20px 6px;">${tierHtml}</td></tr>

      <tr><td style="padding:14px 28px 24px;">
        <div style="background:#FBF8F1;border-radius:12px;padding:18px 20px;border:1px dashed rgba(0,0,0,0.12);">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6C3483;margin-bottom:8px;">Bonus · free</div>
          <div style="font-family:Georgia,serif;font-size:17px;color:#2C3E50;margin-bottom:6px;">Cook For Life — plant-based cookbook</div>
          <p style="font-size:13px;line-height:1.5;color:#3A3A3A;margin:0 0 10px;">
            Forty-five plant-based recipes, a 14-day meal plan, and the shopping lists I give family. Built around the foods that move the numbers — not the ones that fight the protocol.
          </p>
          <a href="${COOKBOOK_URL}" style="color:#6C3483;font-weight:600;font-size:14px;text-decoration:underline;">Download the cookbook →</a>
        </div>
      </td></tr>

      <tr><td style="padding:10px 28px 24px;">
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0 0 10px;">
          Reply to this email if you have a question about your score, your meds, or which level to start with. I read what you send.
        </p>
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0 0 14px;">
          — Joel
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="${SITE_URL}" style="color:#9A9A9A;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
          <br/>Educational content only. Not medical advice. Always complement — never replace — care from your physician.
          <br/>You received this because you completed the BPQuiz assessment.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, category: rawCategory, riskScore, answers, tags: extraTags } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const category = normalizeCategory(rawCategory);
  const tier = recommendedTier(riskScore);
  const tiers = tiersForCategory(category);

  if (!tiers.length) {
    console.error('lead-magnet: no tiers for category', category);
    return res.status(500).json({ error: 'Product lookup failed' });
  }

  const cat = CATEGORIES[category];
  const html = renderEmail({ name, category, tier, tiers });

  try {
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: email.trim(),
      replyTo: 'braveworksrn@gmail.com',
      subject: cat.subject_a,
      html,
    });
  } catch (err) {
    console.error('lead-magnet: resend failed', err.message);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  // Await Mailchimp upsert so it completes before the serverless function freezes.
  const mc = await mailchimpUpsert({ email: email.trim(), name, category, riskScore, tier, answers: answers || {}, extraTags });
  if (!mc.ok) console.warn('mailchimp upsert incomplete', mc.reason || mc.status || 'unknown');

  return res.status(200).json({ success: true, category, tier });
}
