import { Resend } from 'resend';
import Stripe from 'stripe';

const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';
const FROM_ADDRESS = 'Joel Polley, RN <braveworksrn@gmail.com>';
const REPLY_TO = 'braveworksrn@gmail.com';

const DOWNLOADS = {
  bp_day1: {
    label: 'The 10-Day BP Reset — Day 1 &amp; Full Challenge',
    file: 'bp-reset-day1-and-beyond.pdf',
  },
  cookbook: {
    label: 'Cook For Life — Plant-Based Cookbook',
    file: 'cook-for-life-cookbook.pdf',
  },
};

export const TIER_CONFIG = {
  1: {
    product: 'Blood Pressure Cures',
    subject: 'Your Blood Pressure Cures guide — downloads inside',
    downloads: [DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    upgradeUrl: 'https://buy.stripe.com/cNieVdeIrca2fDR1sZfnO0k',
    upgradeLabel: 'The BP Reset Kit ($47)',
    upgradeDesc: 'The complete system: full 10-day challenge, herb formulary with dosing, and a printable tracker.',
  },
  2: {
    product: 'The BP Reset Kit',
    subject: 'Your BP Reset Kit is ready — all downloads inside',
    downloads: [DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: false,
    upgradeUrl: 'https://buy.stripe.com/aFa3cvcAj6PI1N1gnTfnO0h',
    upgradeLabel: 'Premium BP Protocol + 30-Day Challenge ($297)',
    upgradeDesc: 'Barbara O\'Neill LIVE event ticket + weekly group coaching for 30 days + daily emails + Skool community access.',
  },
  3: {
    product: 'Premium Protocol + 30-Day Challenge',
    subject: 'Your 30-Day Challenge is confirmed — Barbara O\'Neill LIVE + group coaching + downloads inside',
    downloads: [DOWNLOADS.bp_day1, DOWNLOADS.cookbook],
    includesCoaching: true,
    upgradeUrl: null,
    upgradeLabel: null,
    upgradeDesc: null,
  },
};

// Map Stripe amount_total (cents) → tier
const AMOUNT_TO_TIER = {
  1299: 1,
  4700: 2,
  29700: 3,
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

  const coachingBlock = config.includesCoaching ? `
    <tr><td style="padding:6px 28px 18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
        <tr><td style="padding:28px 24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:20px;">Your 2 Premium Bonuses</div>

          <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 1 — Live Event</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">🎤 Barbara O'Neill LIVE — June 24–25, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0 0 10px;">
              Your virtual ticket is on me. I'll personally purchase your ticket at <a href="https://www.everydaynurse.com/event-virtual" style="color:#FFFFFF;text-decoration:underline;">everydaynurse.com/event-virtual</a> and email your registration confirmation (with the join link and full schedule) within 48 hours of your purchase here.
            </p>
            <p style="font-size:13px;line-height:1.55;color:rgba(255,255,255,0.75);margin:0;">
              Block <strong style="color:#FFFFFF;">June 24 &amp; 25, 2026</strong> on your calendar now — two days, virtual, both included.
            </p>
          </div>

          <div>
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;">Bonus 2 — 30-Day Challenge + Group Coaching</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#FFFFFF;margin-bottom:8px;font-weight:500;">👥 30-Day Challenge kicks off May 1, 2026</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.9);margin:0;">
              Daily protocol emails and weekly live group coaching calls start May 1. I'll send the full 30-day schedule — call dates, times, and join links — in a follow-up email before kickoff. Watch your inbox.
            </p>
          </div>

        </td></tr>
      </table>
    </td></tr>
  ` : '';

  const upgradeBlock = config.upgradeUrl ? `
    <tr><td style="padding:6px 28px 18px;">
      <div style="background:#FBF8F1;border-radius:12px;padding:16px 18px;border:1px dashed rgba(0,0,0,0.12);">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6C3483;margin-bottom:6px;">Want more?</div>
        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:4px;">${config.upgradeLabel}</div>
        <div style="font-size:13px;line-height:1.5;color:#5A5A5A;margin-bottom:10px;">${config.upgradeDesc}</div>
        <a href="${config.upgradeUrl}" style="color:#6C3483;font-weight:600;font-size:14px;text-decoration:underline;">Upgrade now →</a>
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
          ${greeting} you're in.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 6px;">
          You purchased: <strong>${config.product}</strong>
        </p>
        <p style="font-size:14px;line-height:1.6;color:#5A5A5A;margin:0;">
          ${tier === 3
            ? 'You\'re in the 30-Day Challenge — here\'s everything you have. Your Barbara O\'Neill LIVE ticket confirmation arrives within 48 hours. Your downloads are ready whenever you are.'
            : 'Your downloads are ready. Start with Day 1 — it\'s the easiest one, and most people feel it within 72 hours.'
          }
        </p>
      </td></tr>

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
