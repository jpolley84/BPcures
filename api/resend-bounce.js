// Resend webhook handler — auto-suppress on bounce + alert on complaint.
//
// Setup (one-time, manual): in the Resend dashboard → Webhooks → Add endpoint:
//   URL:    https://bpquiz.com/api/resend-bounce
//   Events: email.bounced, email.complained, email.delivered (delivered for telemetry only)
//   Save the signing secret to Vercel env as RESEND_WEBHOOK_SECRET (optional but recommended).
//
// Behavior:
//   - email.bounced       → mark contact unsubscribed in the Practice Launcher Prospects audience
//   - email.complained    → mark unsubscribed AND email Joel an alert (complaints damage sender reputation fast)
//   - email.delivered     → telemetry only (logged, no action)
//
// Failure mode is graceful: any individual API failure logs and returns 200 so Resend stops retrying.
// Worst case: a bounced contact stays in the audience and gets one more cold send before the next bounce.
//
// TODO: when RESEND_WEBHOOK_SECRET is set, verify the Svix signature on incoming requests
// (current state: accepts unsigned webhooks. Risk is low because the only action is "unsubscribe a contact",
// not data exposure — but a malicious actor could spam-suppress contacts. Worth tightening once Joel sets the secret.)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const AUDIENCE_ID = process.env.RESEND_LAUNCHER_AUDIENCE_ID || 'ad46af78-a3b5-467f-8006-f56eeee26841';
const ALERT_EMAIL = process.env.LAUNCHER_NOTIFY_EMAIL || 'brave.works.marketing@gmail.com';

const SUPPRESS_EVENTS = new Set(['email.bounced', 'email.complained']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;
  if (!event || !event.type) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  const { type, data } = event;

  // Resend webhook payload shape varies by event; check common fields
  const email =
    data?.to?.[0] ||
    data?.email ||
    data?.recipient ||
    data?.bounce?.email ||
    data?.complaint?.email;

  if (!email) {
    console.log(`[resend-bounce] ${type} (no email field)`);
    return res.status(200).json({ ok: true, note: 'no email in event' });
  }

  console.log(`[resend-bounce] ${type} ${email}`);

  if (!SUPPRESS_EVENTS.has(type)) {
    // Telemetry only — no action
    return res.status(200).json({ ok: true });
  }

  // Suppress in the audience
  let suppressed = false;
  if (RESEND_API_KEY && AUDIENCE_ID) {
    try {
      const r = await fetch(
        `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unsubscribed: true }),
        }
      );
      suppressed = r.ok;
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        console.error(`[resend-bounce] suppress ${r.status}: ${email} | ${body.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`[resend-bounce] suppress error: ${email} | ${err.message}`);
    }
  }

  // Alert Joel on complaints — these are sender-reputation killers, not just bounces
  if (type === 'email.complained' && RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Resend Webhook <noreply@bpquiz.com>',
          to: [ALERT_EMAIL],
          subject: '[ALERT] Spam complaint on Practice Launcher outreach',
          text: [
            `Recipient: ${email}`,
            `Event type: ${type}`,
            `Received: ${new Date().toISOString()}`,
            ``,
            `Auto-suppressed in audience: ${suppressed ? 'yes' : 'NO (manual cleanup needed)'}`,
            ``,
            `Why this matters: complaint rate >0.1% damages sender reputation across the entire`,
            `outreach.bpquiz.com domain. One complaint is noise; three in a week needs investigation.`,
            ``,
            `Action: investigate the most recent send to ${email} — what subject line, what body?`,
            `Pattern across complaints will reveal which lead segment / message is triggering them.`,
          ].join('\n'),
        }),
      });
    } catch (err) {
      console.error(`[resend-bounce] alert email error: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, suppressed, type });
}
