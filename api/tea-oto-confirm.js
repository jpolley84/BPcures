// api/tea-oto-confirm.js — delivery for a paid $67 Challenge OTO.
//
// The kit webhook deliberately skips funnel 'challenge-oto' (FOREIGN_FUNNELS in
// stripe-webhook.js), because 6700 is not a Triangle kit amount and mapping it
// there would have delivered the wrong product. This endpoint is therefore the
// ONLY thing standing between a $67 charge and a buyer who hears nothing.
//
// That failure mode has bitten this codebase before: Consandra's $1,997 on
// 2026-05-13 was charged, unmapped, and silently dropped with no confirmation.
// So every path here that cannot deliver emails Joel instead of returning
// quietly, and the seat is written to KV BEFORE the email is attempted: a
// registered buyer with a failed email is recoverable, a sent email with no
// seat is not.
//
// Idempotent on the Stripe session id. Reloading /tea-oto-confirmed, a double
// POST, or a retry cannot double-register or double-send.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { otoStatus, OTO_PRICE, OTO_AMOUNT_CENTS } from './_challenge-oto.js';
import { signUnsubToken } from './triangle-unsubscribe.js';

const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const FROM_INTERNAL = 'BraveWorks Ops <noreply@bpquiz.com>';
const JOEL_EMAIL = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

// Same env keys api/challenge-signup.js reads. No fallback to the free weekly
// masterclass room on purpose: that is a different class and a different list.
const ZOOM = () => ({
  url: (process.env.CHALLENGE_ZOOM_URL || '').trim(),
  meetingId: (process.env.CHALLENGE_ZOOM_MEETING_ID || '').trim(),
  passcode: (process.env.CHALLENGE_ZOOM_PASSCODE || '').trim(),
});

async function alertJoel(subject, text) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM_INTERNAL, to: JOEL_EMAIL, subject, text,
    });
  } catch (err) {
    console.error('tea-oto: could not alert Joel', err.message);
  }
}

function buildEmail({ firstName, startLabel, timeLabel, zoom, unsubUrl }) {
  const hi = firstName ? `Hi ${firstName},` : 'Hi,';
  // Zoom block degrades honestly. Promising a link we do not have is worse than
  // saying it is coming, because the buyer plans their evening around it.
  const zoomBlock = zoom.url
    ? `<div style="background:#fff;border-left:3px solid #c6a05e;border-radius:10px;padding:1.1rem 1.2rem;margin:1.2rem 0;">
  <p style="margin:0 0 0.6rem;font-weight:700;">Your room</p>
  <p style="margin:0 0 0.4rem;"><a href="${zoom.url}" style="color:#5a1725;">${zoom.url}</a></p>
  ${zoom.meetingId ? `<p style="margin:0 0 0.2rem;color:#5f574f;font-size:0.9rem;">Meeting ID: ${zoom.meetingId}</p>` : ''}
  ${zoom.passcode ? `<p style="margin:0;color:#5f574f;font-size:0.9rem;">Passcode: ${zoom.passcode}</p>` : ''}
</div>`
    : `<p style="margin:0 0 1rem;"><strong>Your room link is coming in a separate email before we start.</strong> It will come from this same address, so keep an eye out.</p>`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#191614;line-height:1.6;background:#fbf7f1;">
<p style="font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;color:#8a642b;font-weight:700;margin:0 0 1rem;">The Change My Life Challenge</p>
<h2 style="font-family:Georgia,serif;font-weight:400;color:#5a1725;margin:0 0 1rem;">Your seat is saved.</h2>
<p style="margin:0 0 1rem;">${hi} you are in. We start <strong>${startLabel}</strong> at <strong>${timeLabel}</strong>.</p>
${zoomBlock}
<p style="margin:0 0 1rem;">Put it on your calendar now, while you are thinking about it. Show up with something to write on. That is the whole ask.</p>
<p style="margin:0 0 1rem;">If you cannot make a night live, come anyway when you can. Nobody gets removed for missing one.</p>
<p style="margin:1.4rem 0 0;font-family:Georgia,serif;font-style:italic;color:#5a1725;">See you there.</p>
<p style="margin:0.3rem 0 0;"><strong>Joel Polley, RN</strong><br><span style="color:#9A9A9A;font-size:0.88rem;">Questions? Just reply. I read these myself.</span></p>
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #e4dace;">
<p style="color:#9A9A9A;font-size:0.75rem;margin:0;">You are getting this because you reserved a seat in the Change My Life Challenge. <a href="${unsubUrl}" style="color:#9A9A9A;">Unsubscribe</a>.</p>
</body></html>`;

  const text = `${hi} you are in. We start ${startLabel} at ${timeLabel}.

${zoom.url ? `YOUR ROOM\n${zoom.url}${zoom.meetingId ? `\nMeeting ID: ${zoom.meetingId}` : ''}${zoom.passcode ? `\nPasscode: ${zoom.passcode}` : ''}` : 'Your room link is coming in a separate email before we start.'}

Put it on your calendar now. Show up with something to write on. That is the whole ask.

If you cannot make a night live, come anyway when you can.

See you there.
Joel Polley, RN

Unsubscribe: ${unsubUrl}`;

  return { html, text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sessionId = String(req.body?.sessionId || req.body?.session_id || '').trim();
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ error: 'bad_session' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('tea-oto-confirm: STRIPE_SECRET_KEY missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  let session;
  try {
    session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('tea-oto-confirm: session lookup failed', err.message);
    return res.status(404).json({ error: 'session_not_found' });
  }

  // Trust Stripe, not the caller. An unpaid session id in the URL must not
  // register a seat.
  if (session.payment_status !== 'paid') return res.status(402).json({ error: 'not_paid' });
  if (session.metadata?.flow !== 'tea-oto') return res.status(400).json({ error: 'wrong_flow' });

  const email = String(
    session.customer_details?.email || session.metadata?.oto_email || ''
  ).trim().toLowerCase();

  if (!email) {
    await alertJoel(
      'ACTION: $67 Challenge OTO paid with no email',
      `A Change My Life Challenge OTO seat was paid for but Stripe returned no usable email, so no confirmation could be sent.\n\nSession: ${sessionId}\n\nLook it up in Stripe, find the address, and register them by hand.`
    );
    return res.status(200).json({ registered: false, reason: 'no_email' });
  }

  const firstName = String(session.customer_details?.name || '').trim().split(/\s+/)[0] || '';

  // Idempotency FIRST, keyed on the session. Whoever wins the NX write owns the
  // send; every later caller reports success without re-sending.
  let claimed = true;
  try {
    claimed = Boolean(await kv.set(`oto:challenge:${sessionId}`, new Date().toISOString(),
      { nx: true, ex: 60 * 60 * 24 * 120 }));
  } catch (err) {
    // KV down must not block delivery of something already paid for. Worst case
    // is a duplicate confirmation, which is far better than none.
    console.warn('tea-oto-confirm: KV claim failed, proceeding', err.message);
  }
  if (!claimed) return res.status(200).json({ registered: true, alreadyDone: true });

  const status = otoStatus();
  // The cohort the buyer PAID for, not whatever env says now. If Joel rolls the
  // cohort between purchase and page load, the confirmation must still describe
  // the class they bought.
  const paidCohortMs = Number(session.metadata?.cohort_start);
  const startMs = Number.isFinite(paidCohortMs) ? paidCohortMs : status.startMs;

  // Seat is written BEFORE the email is attempted (see header).
  try {
    await kv.sadd('challenge:oto:members', email);
    await kv.set(`challenge:oto:seat:${email}`, JSON.stringify({
      email, firstName, sessionId,
      amount: session.amount_total ?? OTO_AMOUNT_CENTS,
      cohortStartMs: startMs,
      registeredAt: new Date().toISOString(),
      source: 'tea-oto',
    }), { ex: 60 * 60 * 24 * 180 });
  } catch (err) {
    console.error('tea-oto-confirm: KV seat write failed', err.message);
    await alertJoel(
      'ACTION: $67 Challenge OTO paid but seat not saved',
      `Paid but the KV seat write failed, so this buyer is not on the roster.\n\nEmail: ${email}\nSession: ${sessionId}\nError: ${err.message}\n\nAdd them by hand.`
    );
  }

  const d = new Date(startMs);
  const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startLabel = status.startLabel || `${DAYS[et.getDay()]}, ${MONTHS[et.getMonth()]} ${et.getDate()}`;
  const timeLabel = status.timeLabel || '7:00pm ET';

  try {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email })}`;
    const { html, text } = buildEmail({ firstName, startLabel, timeLabel, zoom: ZOOM(), unsubUrl });
    const out = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM, to: email, reply_to: REPLY_TO,
      subject: `You are in. The Change My Life Challenge starts ${startLabel}.`,
      html, text,
    });
    if (out?.error) throw new Error(out.error.message || 'resend rejected');
  } catch (err) {
    console.error('tea-oto-confirm: confirmation email failed', err.message);
    await alertJoel(
      'ACTION: $67 Challenge OTO seat registered but email failed',
      `The seat IS registered but the confirmation email did not send, so they have no Zoom details.\n\nEmail: ${email}\nSession: ${sessionId}\nStarts: ${startLabel} ${timeLabel}\nError: ${err.message}\n\nSend them by hand.`
    );
    // Tell the page the truth: registered, but the email did not land.
    return res.status(200).json({ registered: true, emailed: false, startLabel, timeLabel, price: OTO_PRICE });
  }

  return res.status(200).json({ registered: true, emailed: true, startLabel, timeLabel, price: OTO_PRICE });
}
