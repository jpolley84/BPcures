// /api/cohort-saturday-cron — fires Saturday at 12:00 UTC (7 AM CT)
// on May 16, 2026 only. See cron schedule in vercel.json.
//
// Defense in depth: the cron schedule "0 12 16 5 *" already pins the
// date, but we also check `today is Sat May 16 ± 24h UTC` at the top
// to prevent accidental re-fires from manual curls.
//
// Sends "36 hours. The math, the door, and the receipt." with the
// full $14,616 value stack and $1,997 founding price to all ~3,472
// engaged drip:* subscribers via Resend.

import { runBroadcast, valueStackHtml, priceBlockHtml, ctaButtonHtml, wrap, APPLY_URL } from './_cohort-broadcast.js';
import { isAuthorizedCron } from './_cron-auth.js';

export const config = { maxDuration: 300 };

const SUBJECT = '36 hours. The math, the door, and the receipt.';

function renderText(firstName) {
  const hi = firstName ? `${firstName},\n\n` : '';
  return `${hi}Quick honest math before you decide.

The founding cohort closes tomorrow night at 11:59 PM Eastern. Five slots. One filled. After that, the same program — same coaches, same protocol, same daily emails — is $6,997.

Here's everything you get for $1,997 (or 3 × $697):

• 12 weekly 1:1 sessions with me (Mondays 8 PM ET)
• 6 biweekly hormone sessions with Annie Chitate, RN
• Full supplement + diet audit (live, 60 min) — most members save $200-400/mo
• Daily schedule audit
• WhatsApp office hours — Sun-Thu 9-5 ET — 90 days
• Skool VIP membership — 90 days
• All BraveWorks courses — lifetime
• eBook library — lifetime
• Daily email coaching tailored to your protocol
• Tracker suite (BP / symptom / food / sleep)
• Partner inclusion guide
• Barbara O'Neill LIVE event — 20% off

Total stack delivered: $14,616
Your investment: $1,997 (founding) or $697 × 3
Math: 7× value to price. After Sunday, that ratio is 2×.

Apply: ${APPLY_URL}

I'm not telling you to apply.
I'm telling you the door closes Sunday at 11:59 PM ET and the math will never look like this again on this program.

Joel Polley, RN
BraveWorks

P.S. The first person who applied yesterday started Day 1 of her sleep work last night. That's the speed this can move at when you decide it's time.
`;
}

function renderHtml(firstName, u) {
  const body = `
<p style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C2A26;line-height:1.35;margin:0 0 18px;">Quick honest math before you decide.</p>
<p style="font-size:15.5px;margin:0 0 14px;">The founding cohort closes <strong style="color:#B85A36;">tomorrow night at 11:59 PM Eastern</strong>. Five slots. One filled. After that, the same program — same coaches, same protocol, same daily emails — is <strong>$6,997</strong>.</p>
<p style="font-size:15.5px;margin:0 0 8px;">Here's everything that's yours for $1,997:</p>
${valueStackHtml()}
${priceBlockHtml()}
<p style="font-size:14px;color:#5B564C;margin:0 0 18px;line-height:1.65;">Math: <strong style="color:#3F5A3C;">7× value to price.</strong> After Sunday, that ratio is 2×. The math will never look like this on this program again.</p>
${ctaButtonHtml('Apply before Sunday →')}
<p style="font-size:14px;color:#5B564C;margin:0 0 14px;line-height:1.65;">I'm not telling you to apply. I'm telling you the door closes Sunday at 11:59 PM ET and the founding rate is over when it's over.</p>
<p style="font-size:15.5px;margin:24px 0 4px;color:#2C2A26;font-weight:600;font-family:Georgia,serif;">Joel Polley, RN</p>
<p style="font-size:13px;color:#9C9485;font-style:italic;margin:0 0 28px;">BraveWorks</p>
<hr style="border:none;border-top:1px solid #E6DECE;margin:0 0 20px;" />
<p style="font-size:13px;color:#5B564C;line-height:1.7;margin:0 0 12px;font-style:italic;"><strong style="color:#2C2A26;font-style:normal;">P.S.</strong> The first person who applied yesterday started Day 1 of her sleep work last night. That's how fast this moves when you decide it's time.</p>
`;
  return wrap({ kicker: 'BraveWorks RN  ·  Founding cohort — 36 hrs left', body, firstName, unsubUrl: u });
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Date gate — only fire on Sat May 16 2026 (within a 30-hour window).
  const now = Date.now();
  const target = Date.UTC(2026, 4, 16, 12, 0, 0); // 0-indexed month: 4 = May
  if (Math.abs(now - target) > 30 * 60 * 60 * 1000) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'outside cohort-saturday firing window' });
  }
  // KV idempotency: don't fire twice if Vercel retries
  try {
    const { kv } = await import('@vercel/kv');
    const fired = await kv.get('cohort-saturday-fired');
    if (fired) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already-fired', firedAt: fired.firedAt });
    }
    await kv.set('cohort-saturday-fired', { firedAt: new Date().toISOString() }, { ex: 7 * 86400 });
  } catch (err) {
    console.warn('cohort-saturday-cron: idempotency check failed (continuing)', err.message);
  }
  try {
    const result = await runBroadcast({ subject: SUBJECT, renderText, renderHtml });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('cohort-saturday-cron: failed', err.stack || err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
