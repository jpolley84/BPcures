// api/cmlc-vip-welcome.js: welcome email for the Oct 19 five-day challenge VIP
// seats sold on changemylifechallenge.com/vip (tier cmlc-vip-97-tonight).
//
// Joel, 2026-10-12: "create a new welcome email please. it starts oct 19".
// Fired by the /vip page when Stripe returns the buyer (?paid=1&session_id=).
// The server re-reads the session from Stripe, so only a PAID session with the
// cmlc-vip-oct funnel marker ever gets mail, once per session (KV nx guard).
//
// SENDING IS OFF until Joel reads the exact text and says go (hard line: any
// email to a human). Flip SEND_ENABLED to true, deploy, then backfill anyone
// who paid before it was on with scripts (dry run first).
import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';

const GA_SEND_ENABLED = true; // Joel approved the GA text 2026-10-13 ("send GA")
const SEND_ENABLED = true; // Joel approved the text 2026-10-13 ("send those commands yes").
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FROM = process.env.RESEND_FROM || 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'joel@bpquiz.com';
const ZOOM = process.env.CHALLENGE_ZOOM_URL || 'https://us06web.zoom.us/j/82851715003?pwd=lIUouxtODo0AbyAf9MV7fFYtr1XKwL.1';
const rosterFor = (seat) => `challenge:2026-10-19:${seat}`;

export const SUBJECT = "Congratulations, you took the first step (starts Monday, Oct 19)";

export function welcomeText(firstName, seat = 'vip') {
  const hi = firstName ? `Hi ${firstName},` : 'Hi,';
  const vip = seat === 'vip';
  return `${hi}

Congratulations. You just did the thing most people only think about: you took the first step.

You've spent years showing up for everyone else. Tonight you showed up for yourself. That decision matters more than you know, and Annie and I are proud of you for making it.

Your ${vip ? 'VIP seat' : 'seat'} for the 5-Day Blood Pressure Challenge is paid and saved.

WHEN
Monday, October 19 through Friday, October 23
7:00 PM Eastern (6:00 PM Central) each night, live on Zoom

WHERE
One Zoom link for all five nights. Save it now:
${ZOOM}
Meeting ID: 828 5171 5003 · Passcode: 027302

${vip ? `WHAT YOU GET AS VIP
- All five live nights with Annie and me
- The extended VIP coaching and Q&A room
- Priority on your questions
- A bonus session on your numbers and next steps
- The VIP workbook

We'll send the VIP room times and the workbook before Monday.` : `WHAT YOU GET
- All five live nights with Annie and me
- The challenge community
- Daily action guides
- Live group Q&A each night
- 48-hour replay access if you miss a night`}

ONE THING TO DO BEFORE MONDAY
Hit reply and tell me the one thing you most want to change about your health. Annie and I read every answer, and it shapes what we teach.

If you take blood pressure medication, keep taking it as prescribed. This challenge is education and coaching. Any change to your medication is a conversation with your prescribing clinician.

The hardest step was the first one, and you already took it. See you Monday night.

Joel Polley, RN
with Annie Chitate, RN
Change My Life Challenge`;
}

function welcomeHtml(firstName, seat = 'vip') {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const paras = welcomeText(firstName, seat).split('\n\n').map((block) => {
    const lines = block.split('\n').map(esc).map((l) => l.replace(esc(ZOOM), `<a href="${ZOOM}" style="color:#112d4d;font-weight:700">${esc(ZOOM)}</a>`));
    if (/^(WHEN|WHERE|WHAT YOU GET AS VIP|WHAT YOU GET|ONE THING TO DO BEFORE MONDAY)$/.test(lines[0])) {
      return `<p style="margin:22px 0 6px;font-size:12px;letter-spacing:.14em;font-weight:800;color:#a95364">${lines[0]}</p><p style="margin:0 0 14px;line-height:1.6">${lines.slice(1).join('<br>')}</p>`;
    }
    return `<p style="margin:0 0 14px;line-height:1.6">${lines.join('<br>')}</p>`;
  }).join('');
  return `<!doctype html><html><body style="margin:0;background:#f4f8fb"><div style="max-width:600px;margin:0 auto;padding:28px 22px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#202b36;background:#fff">${paras}</div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const sessionId = String(req.body?.session_id || '');
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'badSession' });

  let session;
  try { session = await stripe.checkout.sessions.retrieve(sessionId); }
  catch { return res.status(404).json({ error: 'notFound' }); }
  if (session.metadata?.funnel !== 'cmlc-vip-oct' || session.payment_status !== 'paid') {
    return res.status(200).json({ ok: false, reason: 'not-a-paid-vip-session' });
  }
  const seat = session.metadata?.plan === 'challenge-ga' ? 'ga' : 'vip';
  const email = (session.customer_details?.email || '').toLowerCase();
  const firstName = (session.customer_details?.name || '').trim().split(/\s+/)[0] || '';

  try {
    await kv.sadd(rosterFor(seat), email);
    await kv.set(`challenge:2026-10-19:${seat}:${email}`, { email, firstName, seat, sessionId, amount: session.amount_total, paidAt: new Date(session.created * 1000).toISOString() });
  } catch (err) { console.error('cmlc-vip-welcome: roster write failed', err.message); }

  if (!SEND_ENABLED || (seat === 'ga' && !GA_SEND_ENABLED)) return res.status(200).json({ ok: true, seated: true, emailed: false, reason: 'sending-off' });

  let claimed = false;
  try { claimed = Boolean(await kv.set(`cmlc-vip-welcome:sent:${sessionId}`, new Date().toISOString(), { nx: true })); } catch { claimed = false; }
  if (!claimed) return res.status(200).json({ ok: true, seated: true, emailed: false, reason: 'already-sent' });
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM, to: email, reply_to: REPLY_TO, subject: SUBJECT,
      text: welcomeText(firstName, seat), html: welcomeHtml(firstName, seat),
      tags: [{ name: 'campaign', value: 'cmlc-vip-welcome-oct19' }],
    });
    return res.status(200).json({ ok: true, seated: true, emailed: true });
  } catch (err) {
    console.error('cmlc-vip-welcome: send failed', err.message);
    try { await kv.del(`cmlc-vip-welcome:sent:${sessionId}`); } catch { /* noop */ }
    return res.status(200).json({ ok: true, seated: true, emailed: false, reason: 'send-failed' });
  }
}
