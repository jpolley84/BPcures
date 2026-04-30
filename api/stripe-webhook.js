// /api/stripe-webhook — Practice Launcher auto-onboarding handler
//
// Fires on every Stripe checkout.session.completed event. For Practice
// Launcher tier purchases (starter / launcher-founding / launcher-standard /
// revshare-setup) it:
//   1. Sends a tier-specific welcome email to the customer (Resend, FROM joel@bpquiz.com)
//   2. Sends Joel a [CLOSE] notification with the bootstrap one-liner
//   3. Sends a tagged "stripe-events" email so ops-heartbeat / dashboard can
//      surface the close (Vercel functions can't write to the repo, so we
//      use email-as-queue rather than file persistence).
//
// Non-launcher purchases (BP Reset Kit etc.) are handled by purchase-confirmation.js.
// This handler ALWAYS returns 200 after signature verification — even on
// downstream failures — to prevent Stripe from retrying and double-sending
// welcome emails. Errors are logged via console.error (Vercel captures).
//
// Required env vars (set in Vercel):
//   STRIPE_SECRET_KEY        — for the Stripe SDK constructor
//   STRIPE_LAUNCHER_WEBHOOK_SECRET    — whsec_... from the Stripe dashboard webhook UI
//   RESEND_API_KEY           — Resend API key
//
// Webhook URL Joel registers in Stripe: https://bpquiz.com/api/stripe-webhook
// Events to subscribe: checkout.session.completed

import { Resend } from 'resend';
import Stripe from 'stripe';

const FROM_CUSTOMER = 'Joel Polley, RN <joel@bpquiz.com>';
const FROM_INTERNAL = 'BraveWorks Ops <noreply@bpquiz.com>';
const REPLY_TO_CUSTOMER = 'brave.works.marketing@gmail.com';
const JOEL_NOTIFY = 'brave.works.marketing@gmail.com';
const STRIPE_EVENTS_INBOX = 'brave.works.marketing+stripe-events@gmail.com';

// Maps the Stripe product metadata.tier_slug → display name + price string
// Slugs are written into product metadata when the payment links are created.
// See services/config/launcher-payment-links.md for the source of truth.
export const LAUNCHER_TIERS = {
  starter: {
    name: 'Practice Launcher · Starter',
    short: 'Starter',
    price: '$2,997',
    subjectLine: "Welcome aboard the Practice Launcher · Starter, {{first_name}}",
    deliverable: 'a streamlined site + quiz + email engine you can run yourself',
    timeline: '3 weeks',
  },
  'launcher-founding': {
    name: 'Practice Launcher · Founding Cohort',
    short: 'Founding Cohort',
    price: '$9,997',
    subjectLine: 'Welcome to the Practice Launcher founding cohort, {{first_name}}',
    deliverable: 'your custom site, quiz, and email engine wired and running',
    timeline: '72 hours after voice intake',
  },
  'launcher-standard': {
    name: 'Practice Launcher · Standard',
    short: 'Standard',
    price: '$14,997',
    subjectLine: 'Welcome to the Practice Launcher, {{first_name}}',
    deliverable: 'the full custom build — site, quiz, email engine, plus 30 days of optimization',
    timeline: '7 days after voice intake',
  },
  'revshare-setup': {
    name: 'Practice Launcher · Revenue Share Setup',
    short: 'Rev Share',
    price: '$4,997',
    subjectLine: 'Welcome to the Practice Launcher rev-share program, {{first_name}}',
    deliverable: 'your custom build with rev-share contract — you only win when I do',
    timeline: '5 days after voice intake + signed contract',
  },
};

// Lazy-init clients so this module can be imported in test contexts
// without env vars present.
let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// ─── Helpers ──────────────────────────────────────────────────────────

export function kebabCase(name) {
  if (!name) return 'client';
  return String(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')        // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'client';
}

export function shortHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 4).padEnd(4, '0');
}

export function formatAmount(cents) {
  if (typeof cents !== 'number') return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function firstNameOf(fullName) {
  return (fullName || '').trim().split(/\s+/)[0] || '';
}

// ─── Tier resolution ──────────────────────────────────────────────────
// Stripe Checkout's checkout.session.completed event does NOT include line
// items expanded by default. Fetch them, then read the product metadata.
export async function resolveTierSlug(stripe, sessionId) {
  try {
    const items = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 5,
      expand: ['data.price.product'],
    });
    for (const item of items.data || []) {
      const product = item.price?.product;
      if (product && typeof product === 'object') {
        const slug = product.metadata?.tier_slug;
        if (slug && LAUNCHER_TIERS[slug]) return slug;
      }
    }
    return null;
  } catch (err) {
    console.error('stripe-webhook: failed to resolve tier from line items', err.message);
    return null;
  }
}

// ─── Welcome email templates ──────────────────────────────────────────
// Each is short (~150 words), Joel's voice, sets next-72h expectations.

export function renderWelcomeEmail({ tierSlug, firstName }) {
  const tier = LAUNCHER_TIERS[tierSlug];
  const greet = firstName ? `Hi ${firstName},` : 'Hi there,';

  let body;
  if (tierSlug === 'launcher-founding') {
    body = `${greet}

Thank you. You're a founding cohort member.

Here's what happens next:

1. Within the next 24 hours, I'll send you a Calendly link to book your voice intake call. That's a 60–90 minute session where I learn your story, your voice, your niche, and your offer in detail.

2. Within 72 hours of that intake call, your custom site goes live with your branding, your quiz, and your email engine wired and running.

3. Within 60 days, your first paying client arrives — guaranteed. If they don't, full refund and you keep everything installed.

Watch for the Calendly link in your inbox shortly. Reply here if anything urgent comes up.

Joel Polley, RN
BraveWorks RN | bpquiz.com`;
  } else if (tierSlug === 'starter') {
    body = `${greet}

Thank you. Your Practice Launcher Starter is in motion.

Here's what happens next:

1. Within the next 24 hours, I'll send you a Calendly link to book your voice intake call. 60 minutes — I learn your story, your voice, your niche, and your offer.

2. Within 3 weeks of that call, your starter build is live: a streamlined site, your quiz, and the email engine — all wired and ready for you to run.

3. You'll get a 30-day Loom walkthrough so you can operate it yourself. Anything you need beyond that, I'm one reply away.

Watch for the Calendly link in your inbox shortly. Reply here with anything urgent.

Joel Polley, RN
BraveWorks RN | bpquiz.com`;
  } else if (tierSlug === 'launcher-standard') {
    body = `${greet}

Thank you. Your Practice Launcher build is in motion.

Here's what happens next:

1. Within the next 24 hours, I'll send you a Calendly link to book your voice intake call. 60–90 minutes — I learn your story, your voice, your niche, and your offer in detail.

2. Within 7 days of that call, your full custom build is live: site, quiz, email engine — every piece wired and tested in your voice.

3. The first 30 days after launch, I optimize alongside you: copy refinements, deliverability tuning, and conversion adjustments based on your real traffic.

Watch for the Calendly link in your inbox shortly. Reply here with anything urgent.

Joel Polley, RN
BraveWorks RN | bpquiz.com`;
  } else if (tierSlug === 'revshare-setup') {
    body = `${greet}

Thank you. Your Practice Launcher rev-share setup is in motion.

Here's what happens next:

1. Within 24 hours, you'll get two emails from me: a Calendly link for your voice intake call, AND the rev-share agreement to review and sign.

2. After your intake call AND signed agreement, your custom build goes live within 5 days: site, quiz, email engine — all wired in your voice.

3. We're partners on the upside from day one. The structure is simple: I only earn when you earn. The signed agreement spells it out plainly.

Watch for both emails in your inbox shortly. Reply here with anything urgent.

Joel Polley, RN
BraveWorks RN | bpquiz.com`;
  } else {
    // Fallback — should not be hit since we filter to known tiers, but safe.
    body = `${greet}

Thank you for joining the Practice Launcher.

Within the next 24 hours, I'll send you a Calendly link to book your voice intake call. From there we build your ${tier?.deliverable || 'custom practice'}.

Watch for the link shortly. Reply here with anything urgent.

Joel Polley, RN
BraveWorks RN | bpquiz.com`;
  }

  // Plain-text body wrapped in minimal HTML for Resend (preserves line breaks
  // visually in HTML clients while keeping the text portion identical).
  const html = `<!doctype html><html><body style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#2C3E50;max-width:560px;margin:0;padding:24px;">${body
    .split('\n\n')
    .map((para) => `<p style="margin:0 0 14px;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('')}</body></html>`;

  return { text: body, html };
}

export function renderJoelNotification({ tierSlug, customerName, customerEmail, amountCents, sessionId, clientSlug }) {
  const tier = LAUNCHER_TIERS[tierSlug];
  const amount = formatAmount(amountCents);
  const subject = `[CLOSE] ${customerName || customerEmail} bought ${tier.short} (${amount})`;
  const text = `New Practice Launcher close.

Customer: ${customerName || '(no name on Stripe checkout)'}
Email: ${customerEmail}
Tier: ${tier.name} (${amount})
Stripe session: ${sessionId}
Client slug: ${clientSlug}

Welcome email already sent automatically.

What you do next (within 24h):
1. Send the voice-intake Calendly invite. Open Calendly → "Voice Intake (60–90 min)" → copy the personal link → email it to ${customerEmail} from your Gmail.
2. Run the bootstrap script to create the client folder:
   node tools/create-client-folder.js --slug=${clientSlug} --tier=${tierSlug} --email=${customerEmail} --name="${(customerName || '').replace(/"/g, '\\"')}"
3. Drop the rev-share contract in pipeline/clients/${clientSlug}/intake-bundle/ if applicable.

— BraveWorks Ops`;

  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:14px;line-height:1.55;color:#2C3E50;max-width:560px;margin:0;padding:20px;">
<h2 style="margin:0 0 12px;font-size:18px;">New Practice Launcher close</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Customer</td><td style="padding:4px 0;">${customerName || '<em>(no name on Stripe checkout)</em>'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td style="padding:4px 0;"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Tier</td><td style="padding:4px 0;"><strong>${tier.name}</strong> (${amount})</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Stripe session</td><td style="padding:4px 0;font-family:monospace;font-size:12px;">${sessionId}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Client slug</td><td style="padding:4px 0;font-family:monospace;">${clientSlug}</td></tr>
</table>

<p style="margin:0 0 8px;"><strong>Welcome email already sent automatically.</strong></p>

<p style="margin:16px 0 8px;font-weight:600;">What you do next (within 24h):</p>
<ol style="margin:0 0 12px 20px;padding:0;">
  <li style="margin-bottom:8px;">Send the voice-intake Calendly invite. Open Calendly → "Voice Intake (60–90 min)" → copy the personal link → email it to <a href="mailto:${customerEmail}">${customerEmail}</a> from your Gmail.</li>
  <li style="margin-bottom:8px;">Run the bootstrap script to create the client folder:<br/>
    <code style="display:block;background:#F5F1E8;padding:10px 12px;border-radius:6px;margin-top:6px;font-size:12px;word-break:break-all;">node tools/create-client-folder.js --slug=${clientSlug} --tier=${tierSlug} --email=${customerEmail} --name="${(customerName || '').replace(/"/g, '\\"')}"</code>
  </li>
  <li>Drop the rev-share contract in <code>pipeline/clients/${clientSlug}/intake-bundle/</code> if applicable.</li>
</ol>

<p style="margin:16px 0 0;font-size:12px;color:#999;">— BraveWorks Ops · auto-generated</p>
</body></html>`;

  return { subject, text, html };
}

// Tagged JSON-in-email so ops-heartbeat can parse the queue later.
// We embed a JSON blob in plain-text body that's grep-able by the dashboard
// reader — no parsing of HTML required.
export function renderActivityEvent({ tierSlug, customerName, customerEmail, amountCents, sessionId, clientSlug }) {
  const tier = LAUNCHER_TIERS[tierSlug];
  const event = {
    ts: new Date().toISOString(),
    type: 'stripe_close',
    description: `${customerName || customerEmail} bought ${tier.name} (${formatAmount(amountCents)})`,
    amount_cents: amountCents,
    customer_email: customerEmail,
    customer_name: customerName || null,
    customer_slug: clientSlug,
    tier_slug: tierSlug,
    tier_name: tier.name,
    stripe_session_id: sessionId,
  };
  const body = `BEGIN_STRIPE_EVENT
${JSON.stringify(event, null, 2)}
END_STRIPE_EVENT`;
  return {
    subject: `[stripe-event] ${tierSlug} ${formatAmount(amountCents)} ${customerEmail}`,
    text: body,
  };
}

// ─── Webhook plumbing ─────────────────────────────────────────────────
// Disable Vercel's automatic body parsing so we can read the raw body
// for signature verification.
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

// ─── Per-event workflow ───────────────────────────────────────────────
async function processCheckoutCompleted(event) {
  const stripe = getStripe();
  const session = event.data.object;
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const amountCents = session.amount_total;

  if (!customerEmail) {
    console.error('stripe-webhook: no customer_details.email on session', session.id);
    return { action: 'skipped', reason: 'no_email' };
  }

  // Resolve tier_slug from the line items → product metadata.
  const tierSlug = await resolveTierSlug(stripe, session.id);
  if (!tierSlug) {
    // Not a Practice Launcher purchase — purchase-confirmation.js handles
    // the BP Reset / Starter Kit / Premium Protocol tiers.
    console.log('stripe-webhook: non-launcher session, ignoring', session.id, 'amount', amountCents);
    return { action: 'skipped', reason: 'not_launcher' };
  }

  // Derive a kebab-case client slug. Append a 4-char hash if the name was
  // empty or generic, to keep slugs unique across closes.
  const baseSlug = kebabCase(customerName);
  const needsHash = !customerName || baseSlug === 'client';
  const clientSlug = needsHash
    ? `${baseSlug}-${shortHash(session.id + customerEmail)}`
    : `${baseSlug}-${shortHash(session.id)}`;

  const firstName = firstNameOf(customerName);
  const tier = LAUNCHER_TIERS[tierSlug];
  const subject = tier.subjectLine.replace('{{first_name}}', firstName || 'friend');

  const resend = getResend();
  const { text: welcomeText, html: welcomeHtml } = renderWelcomeEmail({
    tierSlug,
    firstName,
  });

  // 1. Welcome email to the buyer
  try {
    await resend.emails.send({
      from: FROM_CUSTOMER,
      to: customerEmail.trim(),
      replyTo: REPLY_TO_CUSTOMER,
      subject,
      text: welcomeText,
      html: welcomeHtml,
    });
    console.log(`stripe-webhook: welcome email sent → ${customerEmail} [${tierSlug}]`);
  } catch (err) {
    console.error('stripe-webhook: welcome send failed', err.message);
  }

  // 2. Joel notification email
  try {
    const notify = renderJoelNotification({
      tierSlug,
      customerName,
      customerEmail,
      amountCents,
      sessionId: session.id,
      clientSlug,
    });
    await resend.emails.send({
      from: FROM_INTERNAL,
      to: JOEL_NOTIFY,
      subject: notify.subject,
      text: notify.text,
      html: notify.html,
    });
    console.log(`stripe-webhook: Joel notified [${tierSlug}] ${customerEmail}`);
  } catch (err) {
    console.error('stripe-webhook: Joel-notify send failed', err.message);
  }

  // 3. Activity-stream queue email (parsed by ops-heartbeat poller)
  try {
    const activityMsg = renderActivityEvent({
      tierSlug,
      customerName,
      customerEmail,
      amountCents,
      sessionId: session.id,
      clientSlug,
    });
    await resend.emails.send({
      from: FROM_INTERNAL,
      to: STRIPE_EVENTS_INBOX,
      subject: activityMsg.subject,
      text: activityMsg.text,
    });
  } catch (err) {
    console.error('stripe-webhook: activity-event send failed', err.message);
  }

  return {
    action: 'welcome_sent',
    tier: tierSlug,
    client_slug: clientSlug,
    customer_email: customerEmail,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_LAUNCHER_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('stripe-webhook: STRIPE_LAUNCHER_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  const rawBody = await readRawBody(req);

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('stripe-webhook: signature verification failed:', err.message);
    return res.status(401).json({ error: `Webhook Error: ${err.message}` });
  }

  // Filter — only act on checkout.session.completed. Acknowledge all
  // other types with 200 so Stripe doesn't retry.
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ ok: true, ignored: event.type });
  }

  try {
    const result = await processCheckoutCompleted(event);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    // Already-handled errors return 200 internally; this catches truly
    // unexpected failures. Still return 200 — duplicate welcome emails are
    // worse than a missed dashboard entry.
    console.error('stripe-webhook: processing failed', err.stack || err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
