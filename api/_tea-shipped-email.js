// api/_tea-shipped-email.js
//
// The "your tea is on its way" email. Until 2026-07-19 this did not exist:
// marking an order fulfilled only flipped fulfilled:true in KV so the row moved
// to the Fulfilled list in Joel's nightly digest. The notification loop ended at
// Joel and never reached the buyer, so every tea order that ever shipped went out
// silently. Buyers wrote in asking where their tea was (correctly, from their
// point of view) while the tea was already in the mail.
//
// Two variants, same template:
//   catchUp: false  the normal case, sent the moment an order is marked fulfilled
//   catchUp: true   the one-time apology to buyers whose tea shipped BEFORE this
//                   email existed. Leads with the apology, not the shipment.
//
// Blend-aware: Steady (bpquiz.com/tea) and Satin (hormoneteas.com) get their own
// product name and cup instructions. ZERO em-dashes in visible copy, per the
// email system rule. No clinical claims: tea is a food, never a treatment.

import { Resend } from 'resend';
import { signUnsubToken } from './triangle-unsubscribe.js';

export const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
export const REPLY_TO = 'braveworksrn@gmail.com';
export const SITE_URL = process.env.VITE_SITE_URL || 'https://bpquiz.com';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = '#2E2A24';
const SOFT = '#5B5348';
const LINE = '#E5DFD4';
const ACCENT = '#7A6A4F';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const p = (html) => `<p style="font-size:16px;line-height:1.65;color:${SOFT};margin:0 0 16px;">${html}</p>`;

// "Marian Creach" -> "Marian". Some order records carry an address in the name
// field (a checkout autofill quirk), which would produce "Hi 127 Sugarberry
// Drive". Anything starting with a digit is treated as unusable.
export function firstNameOf(name) {
  const raw = String(name || '').trim();
  if (!raw || /^\d/.test(raw)) return '';
  const first = raw.split(/\s+/)[0];
  return /^[A-Za-z'’-]{2,}$/.test(first) ? first : '';
}

const BLENDS = {
  steady: {
    product: 'SVUTU Steady',
    cup: 'One rounded teaspoon in hot water, steeped 8 to 10 minutes, once or twice a day. Hibiscus is the reason it turns deep red.',
  },
  satin: {
    product: 'SVUTU Satin',
    cup: 'One rounded teaspoon in hot water, steeped 8 to 10 minutes, once or twice a day. Sage, fennel and spearmint, nothing else.',
  },
};

export function buildTeaShippedEmail({ firstName, blend = 'steady', items, orderRef, unsubUrl, catchUp = false }) {
  const b = BLENDS[blend === 'satin' ? 'satin' : 'steady'];
  const hi = firstName ? `Hi ${firstName},` : 'Hi there,';
  const list = (items && items.length ? items : [{ name: b.product, qty: 1 }])
    .map((i) => `${i.qty} x ${i.name}`)
    .join('<br>');

  const opening = catchUp
    ? [
        p(`I owe you an apology.`),
        p(`Your <b>${b.product}</b> shipped last week, but our confirmation email never went out. So from where you were sitting, you paid me and then heard nothing. That is a bad way to be treated and it was our mistake, not anything you did.`),
        p(`The tea is on its way to you. If it has not already arrived, it should be with you in the next day or two.`),
      ].join('')
    : [
        p(hi),
        p(`Good news. Your <b>${b.product}</b> is on its way.`),
        p(`Every pouch is hand crafted by our family, so it leaves here a little slower than a warehouse would send it, and a lot more carefully.`),
      ].join('');

  const body = [
    catchUp ? p(hi) : '',
    opening,
    `<div style="border:1px solid ${LINE};border-radius:10px;padding:16px 18px;margin:0 0 18px;">
       <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};margin-bottom:8px;">Your order${orderRef ? ` · ${orderRef}` : ''}</div>
       <div style="font-size:15.5px;line-height:1.6;color:${INK};">${list}</div>
     </div>`,
    p(`<b>How to drink it.</b> ${b.cup}`),
    p(`One honest note: this is a food, not a medicine. If you take prescriptions, keep taking them exactly as your doctor directed. The tea joins your care, it never replaces it.`),
    p(`When it lands, I would genuinely like to hear about it. Reply to this email and tell me it arrived, and then tell me how it goes once you have been drinking it a week or two. I read every reply myself.`),
    p(`Thank you for your patience with us, and for trusting us with this.`),
    p(`Joel Polley, RN<br><span style="color:${ACCENT};">BraveWorks</span>`),
  ].join('');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#FAF8F4;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:${FONT};">
    ${body}
    <hr style="border:none;border-top:1px solid ${LINE};margin:28px 0 14px;">
    <p style="font-size:12px;line-height:1.6;color:#9A9184;margin:0;">
      You are receiving this because you ordered ${b.product} from BraveWorks.
      ${unsubUrl ? `<a href="${unsubUrl}" style="color:#9A9184;">Unsubscribe</a>` : ''}
    </p>
  </div></body></html>`;

  const textOpening = catchUp
    ? `I owe you an apology.\n\nYour ${b.product} shipped last week, but our confirmation email never went out. So from where you were sitting, you paid me and then heard nothing. That is a bad way to be treated and it was our mistake, not anything you did.\n\nThe tea is on its way to you. If it has not already arrived, it should be with you in the next day or two.`
    : `Good news. Your ${b.product} is on its way.\n\nEvery pouch is hand crafted by our family, so it leaves here a little slower than a warehouse would send it, and a lot more carefully.`;

  const text = `${hi}

${textOpening}

YOUR ORDER${orderRef ? ` (${orderRef})` : ''}
${(items && items.length ? items : [{ name: b.product, qty: 1 }]).map((i) => `${i.qty} x ${i.name}`).join('\n')}

HOW TO DRINK IT
${b.cup}

One honest note: this is a food, not a medicine. If you take prescriptions, keep taking them exactly as your doctor directed. The tea joins your care, it never replaces it.

When it lands, I would genuinely like to hear about it. Reply to this email and tell me it arrived, and then tell me how it goes once you have been drinking it a week or two. I read every reply myself.

Thank you for your patience with us, and for trusting us with this.

Joel Polley, RN
BraveWorks
${unsubUrl ? `\nUnsubscribe: ${unsubUrl}` : ''}`;

  return { html, text };
}

// Send the shipped notice. NEVER throws into a caller that is mid-fulfilment:
// a failed email must not block an order being marked shipped. Returns true on
// send, false on skip/failure.
export async function sendTeaShipped({ email, firstName, blend = 'steady', items, orderRef, catchUp = false }) {
  if (!process.env.RESEND_API_KEY || !email) return false;
  const to = String(email).trim();
  const b = BLENDS[blend === 'satin' ? 'satin' : 'steady'];
  try {
    const unsubUrl = `${SITE_URL}/api/triangle-unsubscribe?token=${signUnsubToken({ email: to })}`;
    const { html, text } = buildTeaShippedEmail({ firstName, blend, items, orderRef, unsubUrl, catchUp });
    const result = await getResend().emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject: catchUp
        ? `Your ${b.product} shipped last week (and I owe you an apology)`
        : `Your ${b.product} is on its way`,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    // Resend returns { error } instead of throwing on a rejected send.
    if (result?.error) {
      console.error('sendTeaShipped: resend rejected', to, result.error.message || result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendTeaShipped failed (non-fatal)', to, err.message);
    return false;
  }
}
