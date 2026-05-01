import { Resend } from 'resend';
import Stripe from 'stripe';

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
// Resend requires a verified sender domain. gmail.com is NOT verified —
// bpquiz.com IS. Replies still route to braveworksrn@gmail.com via REPLY_TO.
const FROM_ADDRESS = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

const DOWNLOADS = {
  bp_kit_zip: {
    label: 'The BP Reset Kit — 8 PDFs (zip)',
    file: 'bp-reset-kit.zip',
  },
  bp_day1: {
    label: 'The 10-Day BP Reset — Day 1 &amp; Full Challenge',
    file: 'bp-reset-day1-and-beyond.pdf',
  },
  cortisol_challenge: {
    label: 'The 10-Day Cortisol Cure — Full Protocol',
    file: 'cortisol-cure-10-day.pdf',
  },
  blood_sugar_challenge: {
    label: 'The 10-Day Blood Sugar Reset — Full Protocol',
    file: 'blood-sugar-reset-10-day.pdf',
  },
  cookbook: {
    label: 'Cook For Life — Plant-Based Cookbook',
    file: 'cook-for-life-cookbook.pdf',
  },
  vip_book: {
    label: 'The BP Reset Book (digital — complete deep-dive guide)',
    file: 'bp-reset-book.pdf',
  },
};

const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

export const TIER_CONFIG = {
  1: {
    product: 'Blood Pressure Cures — Starter Protocol Kit',
    subject: 'You\'re in — your BP Reset Kit + 30-day challenge bonuses inside',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    upgradeUrl: 'https://buy.stripe.com/9B63cv8k3b5Y63h8VrfnO0z',
    upgradeLabel: 'BraveWorks Complete Book Bundle — All 3 Books ($27)',
    upgradeDesc: 'Add "Be There in 30" — the 30-day companion guide that walks beside the challenge emails, day by day. Plus Blood Pressure Cures (full edition) and The Overmedicated Boomer. Normally $47 for Be There in 30 alone — this is a one-time offer for all three.',
    upgradeCta: 'Add all 3 books for $27 →',
  },
  '1-cortisol': {
    product: 'The Cortisol Healing Blueprint — Starter Kit',
    subject: 'You\'re in — your 10-Day Cortisol Cure + 30-day challenge bonuses inside',
    downloads: [DOWNLOADS.cortisol_challenge, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    upgradeUrl: 'https://buy.stripe.com/9B63cv8k3b5Y63h8VrfnO0z',
    upgradeLabel: 'BraveWorks Complete Book Bundle — All 3 Books ($27)',
    upgradeDesc: 'Add "Be There in 30" — the 30-day companion guide that walks beside the challenge emails, day by day. Plus Blood Pressure Cures and The Overmedicated Boomer.',
    upgradeCta: 'Add all 3 books for $27 →',
  },
  '1-blood-sugar': {
    product: 'Blood Sugar Cures — Starter Kit',
    subject: 'You\'re in — your 10-Day Blood Sugar Reset + 30-day challenge bonuses inside',
    downloads: [DOWNLOADS.blood_sugar_challenge, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    upgradeUrl: 'https://buy.stripe.com/9B63cv8k3b5Y63h8VrfnO0z',
    upgradeLabel: 'BraveWorks Complete Book Bundle — All 3 Books ($27)',
    upgradeDesc: 'Add "Be There in 30" — the 30-day companion guide that walks beside the challenge emails, day by day. Plus Blood Pressure Cures and The Overmedicated Boomer.',
    upgradeCta: 'Add all 3 books for $27 →',
  },
  2: {
    product: 'The BP Reset Kit',
    subject: 'Your BP Reset Kit is ready — all downloads inside',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    includesChallenge: true,
    upgradeUrl: 'https://buy.stripe.com/14A28r0RBgqi77l0oVfnO0w',
    upgradeLabel: 'Upgrade to VIP — add weekly group coaching + BP Reset Book ($97)',
    upgradeDesc: 'Add the digital BP Reset Book deep-dive plus weekly LIVE group coaching with Joel — Mondays at 10pm EST. Direct Q&A and replays of every session.',
    upgradeCta: 'Upgrade to VIP for $97 →',
  },
  vip: {
    product: '30-Day Reset Challenge — VIP',
    subject: 'You\'re in, VIP — your kit + Mondays 10pm EST coaching schedule inside',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.vip_book, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: true,
    includesChallenge: true,
    coachingFlavor: 'vip', // distinguishes from Premium tier 3
    upgradeUrl: 'https://buy.stripe.com/aFa14n2ZJ7TM63h8VrfnO0G',
    upgradeLabel: 'Upgrade to Premium — add the RestoreHER virtual ticket + personal Loom review ($300 more)',
    upgradeDesc: 'Premium adds your RestoreHER virtual event ticket plus a personal Loom video review where Joel walks through YOUR numbers and YOUR protocol on camera. 50 seats only.',
    upgradeCta: 'Upgrade to Premium for $397 →',
  },
  3: {
    product: 'Premium Protocol + 30-Day Challenge',
    subject: 'Your 30-Day Challenge is confirmed — Barbara O\'Neill LIVE + group coaching + downloads inside',
    downloads: [DOWNLOADS.bp_kit_zip, DOWNLOADS.vip_book, DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: true,
    includesChallenge: true,
    coachingFlavor: 'premium',
    upgradeUrl: null,
    upgradeLabel: null,
    upgradeDesc: null,
  },
};

// Map Stripe amount_total (cents) → tier key
// Note: tier=1 is the default starter-tier email (BP-flavored). The
// stripe-webhook.js handler refines tier=1 to '1-cortisol' or
// '1-blood-sugar' by inspecting the line item product name before
// calling sendPurchaseConfirmation.
export const AMOUNT_TO_TIER = {
  1200: 1,   // BE YOUR OWN DOCTOR / Blood Pressure Cure book
  1299: 1,   // Blood Pressure Cures — 10-Day Nurse's Reset (alt price)
  1700: 1,   // Standard $17 starter (BP / Cortisol / Blood Sugar)
  2200: 1,   // Blood Sugar Balance Starter Kit
  2700: 1,   // Complete BraveWorks Bundle — All 3 Books
  3700: 1,   // Arsenal flash / single-product upsell tier
  4700: 2,   // The BP Reset Kit
  9700: 'vip',
  29700: 3,  // Premium (legacy $297 — kept for any in-flight buyers)
  39700: 3,  // Premium (current $397 price — live link plink_1TS8YtHseZnO3rRZQq1Pnkd4)
};

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function renderDownloadRow(d) {
  const url = `${SITE_URL}/downloads/${d.file}`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;background:#F5F1E8;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:8px;">${d.label}</div>
        <a href="${url}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Download PDF →
        </a>
      </td></tr>
    </table>
  `;
}

export function renderPurchaseEmail({ name, tier }) {
  const config = TIER_CONFIG[tier];
  const firstName = (name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const downloadRows = config.downloads.map(renderDownloadRow).join('');

  const challengeBlock = config.includesChallenge ? `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#4A6741;border-radius:14px;">
        <tr><td style="padding:24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-bottom:16px;">Included with your kit</div>

          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">You're automatically enrolled in the 30-Day Protocol Challenge</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Starting tomorrow, you'll receive one email a day for 30 days. Each one walks you through the next step of your protocol — herbs, meals, timing, and the reasoning behind each move. Nothing extra to sign up for. It's already started.
            </p>
          </div>

          <div>
            <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Your Skool community is live</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 10px;">
              Join "How to Be Your Own Doctor" — ask Joel anything, post your progress, and connect with people on the same path.
            </p>
            <a href="${SKOOL_URL}" style="display:inline-block;background:#FFFFFF;color:#4A6741;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Join the Skool community &rarr;
            </a>
          </div>

          <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.15);">
            <div style="font-family:Georgia,serif;font-size:18px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Joel's guarantee</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Complete the 30-day challenge. If you haven't eliminated at least one prescription with your doctor's blessing, Joel refunds every penny. No hoops. No fine print.
            </p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  ` : '';

  // Coaching block content varies by tier flavor:
  //   'vip'      → weekly group coaching only (Mondays 10pm EST)
  //   'premium'  → Barbara O'Neill LIVE + group coaching
  let coachingBlock = '';
  if (config.includesCoaching && config.coachingFlavor === 'vip') {
    coachingBlock = `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:20px;">Your VIP Coaching</div>

          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Live Group Coaching</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Mondays at 10pm EST — every week of the challenge</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Bring your numbers, your medications list, your questions. Joel walks you through the protocol live and answers anything in real time. The Zoom link arrives in a separate email before each call.
            </p>
          </div>

          <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Direct Q&amp;A</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Submit questions in advance or ask live during the calls. Every question gets answered.
            </p>
          </div>

          <div>
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Replays — Yours to Keep</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Can't make a session live? The replay link arrives in your inbox within 24 hours.
            </p>
          </div>

        </td></tr>
      </table>
    </td></tr>
    `;
  } else if (config.includesCoaching) {
    // Default = Premium tier 3
    coachingBlock = `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:20px;">Your 2 Premium Bonuses</div>

          <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 1 — Live Event</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">Barbara O'Neill LIVE — June 24–25, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 10px;">
              Your virtual ticket is on me. I'll personally purchase your ticket at <a href="https://www.everydaynurse.com/event-virtual" style="color:#FFFFFF;text-decoration:underline;">everydaynurse.com/event-virtual</a> and email your registration confirmation within 48 hours.
            </p>
            <p style="font-size:13px;line-height:1.55;color:rgba(255,255,255,0.75);margin:0;">
              Block <strong style="color:#FFFFFF;">June 24 &amp; 25, 2026</strong> on your calendar now.
            </p>
          </div>

          <div>
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 2 — 30-Day Challenge + Group Coaching</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">30-Day Challenge kicks off May 1, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Daily protocol emails and weekly live group coaching calls start May 1. Full schedule coming before kickoff.
            </p>
          </div>

        </td></tr>
      </table>
    </td></tr>
    `;
  }

  const upgradeBlock = config.upgradeUrl ? `
    <tr><td style="padding:6px 28px 18px;">
      <div style="background:#FBF8F1;border-radius:12px;padding:16px 18px;border:1px dashed rgba(0,0,0,0.12);">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#B85A36;margin-bottom:6px;">One-time offer — only available right now</div>
        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:4px;">${config.upgradeLabel}</div>
        <div style="font-size:13px;line-height:1.5;color:#5A5A5A;margin-bottom:10px;">${config.upgradeDesc}</div>
        <a href="${config.upgradeUrl}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          ${config.upgradeCta || 'Upgrade now →'}
        </a>
      </div>
    </td></tr>
  ` : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN · Twenty years ICU &amp; emergency</div>
      </td></tr>

      <tr><td style="padding:18px 28px 16px;">
        <div style="display:inline-block;background:#F0FFF4;border:1px solid #68D391;border-radius:8px;padding:6px 14px;font-size:13px;color:#276749;font-weight:600;margin-bottom:16px;">
          ✓ Purchase confirmed
        </div>
        <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#2C3E50;margin:0 0 12px;font-weight:500;">
          ${greeting} you just did something most people never do.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">
          You took your health into your own hands. That decision matters more than any single herb or protocol. Here's everything you now have access to:
        </p>
        <p style="font-size:14px;line-height:1.6;color:#5A5A5A;margin:0 0 12px;">
          ${tier === 3
            ? 'You\'re in the 30-Day Challenge — here\'s everything you have. Your Barbara O\'Neill LIVE ticket confirmation arrives within 48 hours. Your downloads are ready whenever you are.'
            : tier === 'vip'
            ? 'You\'re VIP. Your kit is ready below. You\'re automatically enrolled in the 30-Day Protocol Challenge AND the weekly Monday group coaching calls. The Zoom link arrives in a separate email before each session.'
            : tier === 1
            ? 'Your protocol kit is ready below. You\'re also automatically enrolled in the 30-Day Protocol Challenge — daily emails start tomorrow. And your Skool community access is live right now.'
            : 'Your downloads are ready. Start with Day 1 — it\'s the easiest one, and most people feel it within 72 hours.'
          }
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E6;border:1px solid #F6E05E;border-radius:10px;margin-bottom:4px;">
          <tr><td style="padding:12px 16px;">
            <p style="font-size:13px;line-height:1.5;color:#744210;margin:0;">
              <strong>Important:</strong> Add <strong>braveworksrn@gmail.com</strong> to your contacts so your challenge emails and protocol updates don't end up in spam or promotions. Do this now — it takes 5 seconds.
            </p>
          </td></tr>
        </table>
      </td></tr>

      ${challengeBlock}
      ${coachingBlock}

      <tr><td style="padding:6px 28px 18px;">
        <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
          <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 14px;font-weight:500;">Your downloads</h2>
          ${downloadRows}
        </div>
      </td></tr>

      ${upgradeBlock}

      <tr><td style="padding:4px 28px 24px;">
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0 0 10px;">
          Reply to this email with questions about your protocol, your medications, or what to try first. I read what you send.
        </p>
        <p style="font-size:13px;color:#3A3A3A;line-height:1.55;margin:0;">
          — Joel
        </p>
      </td></tr>

      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN · Joel Polley, RN · Naturopathic practitioner · <a href="${SITE_URL}" style="color:#9A9A9A;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
          <br/>Educational content only. Not medical advice. Always complement — never replace — care from your physician.
          <br/>You received this because you purchased a BraveWorks health protocol.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function sendPurchaseConfirmation({ email, name, tier }) {
  const config = TIER_CONFIG[tier];
  if (!config) throw new Error(`Unknown tier: ${tier}`);
  const html = renderPurchaseEmail({ name, tier });
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email.trim(),
    replyTo: REPLY_TO,
    subject: config.subject,
    html,
  });
}

// Disable Vercel's automatic body parsing so we can read the raw body for webhook signature verification.
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured — add it to Vercel env vars');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  const rawBody = await readRawBody(req);

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name;
    const tier = AMOUNT_TO_TIER[session.amount_total];

    if (!email) {
      console.error('No customer email in session', session.id);
      return res.status(200).json({ received: true });
    }

    if (!tier) {
      // Amount doesn't match a known tier — not a BraveWorks product or different amount
      console.log('purchase-confirmation: no tier match for amount_total', session.amount_total, 'session', session.id);
      return res.status(200).json({ received: true });
    }

    try {
      await sendPurchaseConfirmation({ email, name, tier });
      console.log(`purchase-confirmation: sent tier ${tier} to ${email}`);
    } catch (err) {
      // Log but return 200 — Stripe retries on non-2xx and we don't want duplicate sends
      console.error('purchase-confirmation: email failed', err.message);
    }
  }

  return res.status(200).json({ received: true });
}
