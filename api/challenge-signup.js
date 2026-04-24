import { Resend } from 'resend';
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
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '1550e2956c';
const SKOOL_URL = 'https://www.skool.com/how-to-be-your-own-doctor-8010/about';

const VIP_STRIPE_LINK = process.env.CHALLENGE_VIP_STRIPE_LINK || '#';
const PREMIUM_STRIPE_LINK = process.env.CHALLENGE_PREMIUM_STRIPE_LINK || '#';

async function mailchimpUpsert(email) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_API_KEY.includes('-')) return { ok: false, reason: 'no_key' };
  const [, dc] = MAILCHIMP_API_KEY.split('-');
  if (!dc) return { ok: false, reason: 'bad_dc' };

  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
  const auth = 'Basic ' + Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64');

  try {
    const r = await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: { CATEGORY: '30-day-challenge' },
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('challenge-signup mailchimp upsert failed', r.status, text.slice(0, 200));
      return { ok: false, status: r.status };
    }

    // Tag subscriber
    await fetch(`${baseUrl}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: [
          { name: '30-day-challenge', status: 'active' },
          { name: 'challenge-free', status: 'active' },
        ],
      }),
    });

    return { ok: true };
  } catch (err) {
    console.error('challenge-signup mailchimp error', err.message);
    return { ok: false, reason: err.message };
  }
}

function renderWelcomeEmail() {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">

      <!-- Header -->
      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">BraveWorks RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">Joel Polley, RN &middot; Twenty years ICU &amp; emergency</div>
      </td></tr>

      <!-- Welcome -->
      <tr><td style="padding:18px 28px 0;">
        <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#2C3E50;margin:8px 0 14px;font-weight:500;">
          You're in. The 30-Day Reset starts May 1.
        </h1>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 16px;">
          For the next 30 days, you'll get a daily email from me with one actionable protocol step. Blood pressure, cortisol, blood sugar, weight — we address the root, not the symptom.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#3A3A3A;margin:0 0 20px;">
          This is free. No credit card. No catch. Just the protocol I'd give family.
        </p>
      </td></tr>

      <!-- Step 1: Join the Community -->
      <tr><td style="padding:0 28px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E8;border-radius:14px;">
          <tr><td style="padding:22px 22px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6C3483;margin-bottom:8px;">Step 1 &middot; Join the community</div>
            <div style="font-family:Georgia,serif;font-size:19px;color:#2C3E50;margin-bottom:6px;">Get inside the Skool group</div>
            <p style="font-size:14px;line-height:1.55;color:#3A3A3A;margin:0 0 14px;">
              This is where you'll connect with other people doing the reset alongside you. Ask questions, share wins, get support. No lonely journey.
            </p>
            <a href="${SKOOL_URL}" style="display:inline-block;background:#6C3483;color:#FFFFFF;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
              Join the Skool Community
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- What's coming -->
      <tr><td style="padding:12px 28px 6px;">
        <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 12px;font-weight:500;">What to expect</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:34px;vertical-align:top;padding-top:2px;">
              <div style="width:26px;height:26px;background:#6C3483;border-radius:50%;color:#fff;font-weight:700;font-size:13px;text-align:center;line-height:26px;">1</div>
            </td>
            <td style="padding-bottom:14px;">
              <div style="font-size:15px;font-weight:600;color:#2C3E50;margin-bottom:3px;">Week 1: Baseline &amp; Awareness</div>
              <div style="font-size:13px;line-height:1.55;color:#5A5A5A;">Track your patterns, identify your triggers, get a personalized assessment.</div>
            </td>
          </tr>
          <tr>
            <td style="width:34px;vertical-align:top;padding-top:2px;">
              <div style="width:26px;height:26px;background:#6C3483;border-radius:50%;color:#fff;font-weight:700;font-size:13px;text-align:center;line-height:26px;">2</div>
            </td>
            <td style="padding-bottom:14px;">
              <div style="font-size:15px;font-weight:600;color:#2C3E50;margin-bottom:3px;">Week 2: The Protocol</div>
              <div style="font-size:13px;line-height:1.55;color:#5A5A5A;">Introduce the evidence-backed herbal and lifestyle protocol — precise steps, daily.</div>
            </td>
          </tr>
          <tr>
            <td style="width:34px;vertical-align:top;padding-top:2px;">
              <div style="width:26px;height:26px;background:#6C3483;border-radius:50%;color:#fff;font-weight:700;font-size:13px;text-align:center;line-height:26px;">3</div>
            </td>
            <td style="padding-bottom:14px;">
              <div style="font-size:15px;font-weight:600;color:#2C3E50;margin-bottom:3px;">Week 3: Lifestyle Integration</div>
              <div style="font-size:13px;line-height:1.55;color:#5A5A5A;">Sleep, stress resilience, movement — the behaviors that make the protocol stick.</div>
            </td>
          </tr>
          <tr>
            <td style="width:34px;vertical-align:top;padding-top:2px;">
              <div style="width:26px;height:26px;background:#6C3483;border-radius:50%;color:#fff;font-weight:700;font-size:13px;text-align:center;line-height:26px;">4</div>
            </td>
            <td>
              <div style="font-size:15px;font-weight:600;color:#2C3E50;margin-bottom:3px;">Week 4: Doctor Conversation</div>
              <div style="font-size:13px;line-height:1.55;color:#5A5A5A;">Armed with your data and protocol, have a different conversation with your doctor.</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:10px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:0;" />
      </td></tr>

      <!-- Upgrade Options -->
      <tr><td style="padding:10px 28px 4px;">
        <h2 style="font-family:Georgia,serif;font-size:20px;color:#2C3E50;margin:0 0 6px;font-weight:500;">Want more? Upgrade anytime.</h2>
        <p style="font-size:14px;line-height:1.55;color:#5A5A5A;margin:0 0 14px;">
          The daily emails and community are yours free. If you want live coaching and extras, two options:
        </p>
      </td></tr>

      <!-- VIP $97 -->
      <tr><td style="padding:0 20px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2C3E50;border-radius:14px;">
          <tr><td style="padding:22px 24px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:8px;">VIP &middot; $97</div>
            <div style="font-family:Georgia,serif;font-size:21px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Live Coaching + The Book</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.85);margin:0 0 10px;">
              Everything free, plus:
            </p>
            <ul style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);padding-left:18px;margin:0 0 16px;">
              <li style="margin:4px 0;">Weekly live group coaching — Mondays at 10pm EST</li>
              <li style="margin:4px 0;">The complete BP Reset book (digital)</li>
              <li style="margin:4px 0;">Direct Q&amp;A with Joel during live sessions</li>
            </ul>
            <a href="${VIP_STRIPE_LINK}" style="display:inline-block;background:#B85A36;color:#FFFFFF;padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Upgrade to VIP — $97
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Premium $297 -->
      <tr><td style="padding:0 20px 10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6C3483;border-radius:14px;">
          <tr><td style="padding:22px 24px;">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:8px;">Premium &middot; $297</div>
            <div style="font-family:Georgia,serif;font-size:21px;color:#FFFFFF;margin-bottom:6px;font-weight:500;">Live Coaching + Barbara O'Neill Virtual Ticket</div>
            <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.85);margin:0 0 10px;">
              Everything VIP, plus:
            </p>
            <ul style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.85);padding-left:18px;margin:0 0 16px;">
              <li style="margin:4px 0;">Virtual ticket to Barbara O'Neill LIVE wellness session</li>
              <li style="margin:4px 0;">All VIP benefits (coaching + book)</li>
            </ul>
            <div style="display:inline-block;background:rgba(255,255,255,0.12);padding:8px 14px;border-radius:8px;margin-bottom:14px;">
              <span style="font-size:12px;color:rgba(255,255,255,0.9);">Barbara O'Neill tickets sell for $297+ alone — you get coaching and the book included.</span>
            </div>
            <br/>
            <a href="${PREMIUM_STRIPE_LINK}" style="display:inline-block;background:#FFFFFF;color:#6C3483;padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Go Premium — $297
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Closing -->
      <tr><td style="padding:14px 28px 24px;">
        <p style="font-size:14px;color:#3A3A3A;line-height:1.55;margin:0 0 10px;">
          No rush on the upgrade — you can do it anytime during the 30 days. The free challenge starts May 1 either way.
        </p>
        <p style="font-size:14px;color:#3A3A3A;line-height:1.55;margin:0 0 14px;">
          See you in the community.<br/>— Joel
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:0 28px 28px;">
        <hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:20px 0;" />
        <p style="font-size:11px;color:#9A9A9A;line-height:1.5;margin:0;">
          BraveWorks RN &middot; Joel Polley, RN &middot; Naturopathic practitioner &middot; <a href="${SITE_URL}" style="color:#9A9A9A;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
          <br/>Educational content only. Not medical advice. Always complement — never replace — care from your physician.
          <br/>You received this because you signed up for the 30-Day Reset Challenge.
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

  const { email } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1. Add to Mailchimp (fire-and-forget)
  mailchimpUpsert(trimmedEmail).catch((err) =>
    console.error('challenge-signup: mailchimp failed', err.message)
  );

  // 2. Send welcome email via Resend
  try {
    const html = renderWelcomeEmail();
    await getResend().emails.send({
      from: 'Joel Polley, RN <braveworksrn@gmail.com>',
      to: trimmedEmail,
      replyTo: 'braveworksrn@gmail.com',
      subject: "You're in — 30-Day Reset starts May 1",
      html,
    });
  } catch (err) {
    console.error('challenge-signup: resend failed', err.message);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }

  return res.status(200).json({ success: true });
}
