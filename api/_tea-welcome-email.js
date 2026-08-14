// api/_tea-welcome-email.js — the "how to make your first cup" onboarding email.
//
// WHY THIS EXISTS (2026-08-13): tea now sells through Shopify, and Shopify
// sends its own order confirmation. We deliberately do NOT send a second
// receipt (see the header of shopify-tea-webhook.js). What Shopify's receipt
// cannot carry is the part that decides whether she ever brews the bag: the
// steeping method, the honest 30-day promise, and the reminder that this is a
// food that joins her doctor's plan rather than replacing it.
//
// So this is NOT a receipt. No order total, no line items, no payment details.
// It is onboarding, and it says so in the first line. That distinction is what
// keeps it from being a confusing duplicate invoice.
//
// Sent once per paid Shopify order, guarded by its own KV key so a Shopify
// retry cannot double-send. Failure is always non-fatal: a missed welcome email
// must never cost us the ledger row that fulfillment depends on.

import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';
import { otoStatus, otoUrl, OTO_PRICE, OTO_ANCHOR, OTO_WINDOW_HOURS } from './_challenge-oto.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function firstNameOf(name) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

// Postal address is env-driven so a home address never lands in a sent asset.
function postalBlock() {
  const addr = process.env.BUSINESS_POSTAL_ADDRESS;
  return addr
    ? `<p style="color:#9A9A9A;font-size:0.75rem;margin:0.4rem 0 0;">The Forsaken Truth &middot; ${addr}</p>`
    : '';
}

// ─── The $67 Challenge OTO block (2026-08-13, Joel) ───────────────────────
// Placed LAST on purpose. The brewing method is what this email owes the
// reader, and it gets delivered in full before anything is asked for. One ask,
// at the bottom, clearly marked. See api/_challenge-oto.js for why the whole
// thing is env-gated and silently absent until a cohort exists.
function otoBlock({ email, issuedMs }) {
  const s = otoStatus();
  if (!s.live || !email) return { html: '', text: '' };
  const url = otoUrl({ email, issuedMs });

  const html = `
<hr style="margin:1.8rem 0 1.4rem;border:none;border-top:1px solid #e4dace;">
<div style="background:#5a1725;border-radius:12px;padding:1.3rem 1.3rem;color:#fff;">
  <p style="margin:0 0 0.5rem;font-size:0.72rem;letter-spacing:0.13em;text-transform:uppercase;opacity:0.8;">One thing, only because you ordered</p>
  <p style="margin:0 0 0.7rem;font-family:Georgia,serif;font-size:1.35rem;">The tea is one cup a day. Here is the plan it belongs to.</p>
  <p style="margin:0 0 0.9rem;font-size:0.97rem;opacity:0.94;">The Change My Life Challenge starts ${s.startLabel} at ${s.timeLabel}. We put your numbers, your energy and your sleep on one page, find which of the three pressures is driving yours, and build one plan you can hand your doctor.</p>
  <p style="margin:0 0 0.9rem;font-size:0.97rem;opacity:0.94;">A seat is $${OTO_ANCHOR}. For the next ${OTO_WINDOW_HOURS} hours, because you just ordered STEADY, it is <strong>$${OTO_PRICE}</strong>.</p>
  <p style="margin:0 0 0.6rem;"><a href="${url}" style="display:inline-block;background:#c6a05e;color:#2b1408;text-decoration:none;padding:0.85rem 1.5rem;border-radius:999px;font-weight:800;">Save my seat for $${OTO_PRICE}</a></p>
  <p style="margin:0;font-size:0.8rem;opacity:0.75;">No pressure. Your tea is on its way either way, and the free class is always open.</p>
</div>`;

  const text = `

ONE THING, ONLY BECAUSE YOU ORDERED
The Change My Life Challenge starts ${s.startLabel} at ${s.timeLabel}. We put your numbers, your energy and your sleep on one page, find which of the three pressures is driving yours, and build one plan you can hand your doctor.

A seat is $${OTO_ANCHOR}. For the next ${OTO_WINDOW_HOURS} hours, because you just ordered STEADY, it is $${OTO_PRICE}.

${url}

No pressure. Your tea is on its way either way.`;

  return { html, text };
}

export function buildTeaWelcomeEmail({ firstName, unsubUrl, email, issuedMs }) {
  const hi = firstName ? `Hi ${firstName},` : 'Hi,';
  const oto = otoBlock({ email, issuedMs });
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:1.5rem;color:#191614;line-height:1.6;background:#fbf7f1;">

<p style="font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;color:#8a642b;font-weight:700;margin:0 0 1rem;">The Forsaken Truth &middot; STEADY</p>

<h2 style="font-family:Georgia,serif;font-weight:400;color:#5a1725;margin:0 0 1rem;">How to make your first cup.</h2>

<p style="margin:0 0 1rem;">${hi} your order is in and we are packing it by hand. Your receipt came separately from the shop. This one is the part that actually matters: how to brew it so you look forward to it.</p>

<div style="background:#fff;border-left:3px solid #c6a05e;border-radius:10px;padding:1.1rem 1.2rem;margin:1.2rem 0;">
  <p style="margin:0 0 0.7rem;font-weight:700;">The method</p>
  <p style="margin:0 0 0.5rem;"><strong>1.</strong> Add 2 teaspoons of loose-leaf STEADY to an infuser, teapot or cup.</p>
  <p style="margin:0 0 0.5rem;"><strong>2.</strong> Pour in hot water and steep 8 to 10 minutes. Longer than you think.</p>
  <p style="margin:0 0 0.5rem;"><strong>3.</strong> Add honey if you like it sweet. Hot or poured over ice.</p>
  <p style="margin:0;"><strong>4.</strong> One cup a day. Simple enough for a Tuesday.</p>
</div>

<p style="margin:0 0 1rem;">Your pouch is 150 g, about 60 cups. It is deep ruby from the hibiscus, floral, gently tart. If you have had herbal teas that tasted like a chore, this is not that.</p>

<p style="margin:0 0 1rem;"><strong>The promise.</strong> If STEADY is not right for you, reply to this email within 30 days of delivery and we will make it right with a refund or an exchange. An opened pouch still qualifies. We would rather you tell us it missed.</p>

<p style="margin:0 0 1rem;color:#5f574f;font-size:0.92rem;">One thing we will always be straight about: STEADY is an herbal tea, not a medicine. It joins the plan your doctor gave you, it does not replace it. If you are pregnant, nursing, managing a condition, or taking medication, especially blood pressure or hormone medication, check with your healthcare professional first.</p>

<p style="margin:1.4rem 0 0;font-family:Georgia,serif;font-style:italic;color:#5a1725;">Come back to the root.</p>
<p style="margin:0.3rem 0 0;"><strong>Joel Polley, RN &middot; Annie Chitate, RN</strong><br><span style="color:#9A9A9A;font-size:0.88rem;">Questions? Just reply. We read these ourselves.</span></p>
${oto.html}
<hr style="margin:1.6rem 0 0.8rem;border:none;border-top:1px solid #e4dace;">
<p style="color:#9A9A9A;font-size:0.75rem;margin:0;">You are getting this because you ordered STEADY. This is brewing guidance, not a receipt. <a href="${unsubUrl}" style="color:#9A9A9A;">Unsubscribe</a> from tea emails.</p>
${postalBlock()}
</body></html>`;

  const text = `${hi} your order is in and we are packing it by hand. Your receipt came separately from the shop. This one is how to brew it.

THE METHOD
1. Add 2 teaspoons of loose-leaf STEADY to an infuser, teapot or cup.
2. Pour in hot water and steep 8 to 10 minutes. Longer than you think.
3. Add honey if you like it sweet. Hot or poured over ice.
4. One cup a day. Simple enough for a Tuesday.

Your pouch is 150 g, about 60 cups.

THE PROMISE: if STEADY is not right for you, reply within 30 days of delivery and we will make it right with a refund or an exchange. An opened pouch still qualifies.

STEADY is an herbal tea, not a medicine. It joins the plan your doctor gave you, it does not replace it. If you are pregnant, nursing, managing a condition, or taking medication, check with your healthcare professional first.

Come back to the root.
Joel Polley, RN and Annie Chitate, RN
${oto.text}

Unsubscribe from tea emails: ${unsubUrl}`;

  return { html, text };
}

/**
 * Send the welcome/brewing email for a paid tea order.
 * Never throws: the caller's ledger write matters more than this email.
 * @returns {Promise<{sent: boolean, reason?: string, id?: string}>}
 */
export async function sendTeaWelcome({ email, firstName }) {
  const to = String(email || '').trim().toLowerCase();
  if (!to || !to.includes('@')) return { sent: false, reason: 'no_email' };
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: 'no_resend_key' };

  try {
    const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email: to })}`;
    // The OTO's 24 hour clock starts when the email is MINTED, not when it is
    // opened, and the instant is signed into the link so it cannot be extended.
    const issuedMs = Date.now();
    const { html, text } = buildTeaWelcomeEmail({ firstName, unsubUrl, email: to, issuedMs });
    const result = await getResend().emails.send({
      from: FROM,
      to,
      reply_to: REPLY_TO,
      subject: 'How to make your first cup of STEADY',
      html,
      text,
    });
    // Resend returns { error } rather than throwing on a rejected send.
    if (result?.error) {
      console.warn('tea-welcome: resend rejected', result.error.message || result.error);
      return { sent: false, reason: 'resend_error' };
    }
    return { sent: true, id: result?.data?.id };
  } catch (err) {
    console.warn('tea-welcome: send failed (non-fatal)', err.message);
    return { sent: false, reason: 'exception' };
  }
}
