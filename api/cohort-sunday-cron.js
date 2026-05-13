// /api/cohort-sunday-cron — fires Sunday at 13:00 UTC (8 AM CT)
// on May 17, 2026 only. See cron schedule in vercel.json.
//
// Final-call email: "Door closes tonight at 11:59 PM ET." Same value
// stack + price block as Saturday but with maximum-urgency framing.

import { runBroadcast, valueStackHtml, priceBlockHtml, ctaButtonHtml, wrap, APPLY_URL } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 300 };

const SUBJECT = 'Door closes tonight at 11:59 PM ET.';

function renderText(firstName) {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Tonight. 11:59 PM Eastern. The door to the founding cohort closes.

I'm not going to retell the pitch. You've read it.

I want to leave you with three things.

ONE — what's in the room when you say yes:

• 12 weekly 1:1 sessions with me, starting Monday at 8 PM ET
• 6 biweekly hormone sessions with Annie Chitate, RN
• Full supplement + diet audit (most members save $200-400/mo)
• Daily schedule audit
• WhatsApp office hours — Sun-Thu 9-5 ET — 90 days
• Skool VIP — 90 days
• All my courses + every eBook — lifetime
• Daily email coaching tailored to YOUR protocol
• Tracker suite + Partner Inclusion Guide
• Barbara O'Neill LIVE event — 20% off

Total stack: $14,616.
Tonight: $1,997 (or three monthly payments of $697).
Tomorrow morning: $6,997.

TWO — what's in the room when you say no:

The same Tuesday afternoon at 2 PM you've already lived a thousand times. The bottle drawer that doesn't close. The doctor who doesn't look up from the chart. Another year of "maybe next time."

THREE — the link:

${APPLY_URL}

I'll read every application tonight and reach out personally on Monday to the people who are the right fit.

This isn't about the program.
It's about the version of you on the other side of 90 days.

Joel Polley, RN
BraveWorks

P.S. 11:59 PM Eastern. Tonight. The math will never look like this again.
`;
}

function renderHtml(firstName, u) {
  const body = `
<p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#B85A36;line-height:1.3;margin:0 0 8px;">Tonight. 11:59 PM Eastern.</p>
<p style="font-family:Georgia,serif;font-size:17px;color:#2C2A26;margin:0 0 24px;">The door to the founding cohort closes.</p>
<p style="font-size:15.5px;margin:0 0 18px;">I'm not going to retell the pitch. You've read it. I want to leave you with three things.</p>
<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:0 0 8px;">One — what's in the room when you say yes:</div>
${valueStackHtml()}
${priceBlockHtml()}
<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;font-weight:700;margin:24px 0 8px;">Two — what's in the room when you say no:</div>
<p style="font-size:14.5px;color:#5B564C;line-height:1.7;margin:0 0 18px;font-style:italic;">The same Tuesday afternoon at 2 PM you've already lived a thousand times. The bottle drawer that doesn't close. The doctor who doesn't look up from the chart. Another year of "maybe next time."</p>
<div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5A3C;font-weight:700;margin:24px 0 6px;">Three — the link:</div>
${ctaButtonHtml('Apply before 11:59 PM tonight →')}
<p style="font-size:14px;color:#5B564C;margin:0 0 18px;line-height:1.65;">I'll read every application tonight and reach out personally on Monday to the people who are the right fit.</p>
<p style="font-size:15.5px;color:#2C2A26;margin:24px 0 18px;line-height:1.65;font-style:italic;">This isn't about the program. It's about the version of you on the other side of 90 days.</p>
<p style="font-size:15.5px;margin:0 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>
<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />
<p style="font-size:13px;color:#B85A36;line-height:1.7;margin:0 0 12px;font-weight:600;">P.S. 11:59 PM Eastern. Tonight. The math will never look like this again.</p>
`;
  return wrap({ kicker: 'BraveWorks RN  ·  Door closes tonight', body, firstName, unsubUrl: u });
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Date gate — only fire on Sun May 17 2026 (within a 30-hour window).
  const now = Date.now();
  const target = Date.UTC(2026, 4, 17, 13, 0, 0);
  if (Math.abs(now - target) > 30 * 60 * 60 * 1000) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'outside cohort-sunday firing window' });
  }
  try {
    const { kv } = await import('@vercel/kv');
    const fired = await kv.get('cohort-sunday-fired');
    if (fired) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already-fired', firedAt: fired.firedAt });
    }
    await kv.set('cohort-sunday-fired', { firedAt: new Date().toISOString() }, { ex: 7 * 86400 });
  } catch (err) {
    console.warn('cohort-sunday-cron: idempotency check failed (continuing)', err.message);
  }
  try {
    const result = await runBroadcast({ subject: SUBJECT, renderText, renderHtml });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('cohort-sunday-cron: failed', err.stack || err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
