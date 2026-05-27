// One-shot: handle thankx2@yahoo.com complaint.
// 1) Send apology + refund-notice email
// 2) Refund Stripe charge ch_3TVbX6HseZnO3rRZ1sZOE3xa ($11.90)
// 3) Unsubscribe from KV drip (optedIn:false + complaint tag)
// Approved in chat 2026-05-26.

import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import Stripe from 'stripe';

const TO = 'thankx2@yahoo.com';
const FROM = 'Joel Polley, RN <joel@bpquiz.com>';
const REPLY_TO = 'braveworksrn@gmail.com';
const SUBJECT = 'Re: 3 lies your doctor told you about your BP';
const CHARGE_ID = 'ch_3TVbX6HseZnO3rRZ1sZOE3xa';

const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:18px;border:1px solid rgba(0,0,0,0.06);">
      <tr><td style="padding:32px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#B85A36;">Joel Polley, RN</div>
        <div style="font-size:12px;color:#7A7A7A;margin-top:4px;">BraveWorks RN</div>
      </td></tr>
      <tr><td style="padding:24px 28px 28px;">
        <p style="font-family:Georgia,serif;font-size:20px;line-height:1.45;color:#2C3E50;margin:0 0 18px;">Hi,</p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m sorry. That&#8217;s not the experience I want anyone leaving with.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          I&#8217;m refunding your $11.90 today, no questions. It&#8217;ll land back on your card in 5&ndash;10 business days depending on your bank. You&#8217;re also unsubscribed from all my emails effective right now &mdash; you won&#8217;t hear from me again.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          You&#8217;re welcome to keep the kit PDFs. They&#8217;re yours either way.
        </p>
        <p style="font-size:15.5px;line-height:1.7;color:#3A3A3A;margin:0 0 14px;">
          If you ever want to come back, the door is open. If not, I wish you well &mdash; and I hope you find what works for your numbers.
        </p>
        <p style="font-size:15.5px;line-height:1.65;color:#3A3A3A;margin:14px 0 4px;">&mdash; Joel</p>
        <p style="font-size:13px;color:#7A7A7A;margin:0;">Joel Polley, RN &middot; BraveWorks RN</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const text = `Hi,

I'm sorry. That's not the experience I want anyone leaving with.

I'm refunding your $11.90 today, no questions. It'll land back on your card in 5-10 business days depending on your bank. You're also unsubscribed from all my emails effective right now — you won't hear from me again.

You're welcome to keep the kit PDFs. They're yours either way.

If you ever want to come back, the door is open. If not, I wish you well — and I hope you find what works for your numbers.

— Joel
Joel Polley, RN · BraveWorks RN`;

// ─── 1. Send apology email ─────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const emailRes = await resend.emails.send({
  from: FROM, to: [TO], replyTo: REPLY_TO, subject: SUBJECT, html, text,
});
if (emailRes.error) { console.error('✗ Email failed:', emailRes.error); process.exit(1); }
console.log(`✓ Email sent → Resend ID: ${emailRes.data.id}`);

// ─── 2. Refund Stripe charge ───────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
try {
  const refund = await stripe.refunds.create({
    charge: CHARGE_ID,
    reason: 'requested_by_customer',
  });
  console.log(`✓ Refund created → ${refund.id} · $${(refund.amount/100).toFixed(2)} · status: ${refund.status}`);
} catch (err) {
  console.error('✗ Refund failed:', err.message);
}

// ─── 3. Unsubscribe in KV ──────────────────────────────────────────
try {
  const dripKey = `drip:${TO}`;
  const existing = await kv.get(dripKey);
  if (existing) {
    await kv.set(dripKey, {
      ...existing,
      optedIn: false,
      unsubscribedAt: new Date().toISOString(),
      unsubscribeReason: 'customer-complaint-refund',
      tags: Array.from(new Set([...(existing.tags || []), 'unsubscribed', 'complaint-refunded'])),
    });
    console.log(`✓ KV unsubscribed: ${dripKey} (optedIn → false)`);
  } else {
    // Set a tombstone so future enrollments don't re-add
    await kv.set(dripKey, {
      email: TO,
      optedIn: false,
      unsubscribedAt: new Date().toISOString(),
      unsubscribeReason: 'customer-complaint-refund',
      tags: ['unsubscribed', 'complaint-refunded'],
    });
    console.log(`✓ KV tombstone set: ${dripKey}`);
  }
} catch (err) {
  console.error('✗ KV unsub failed:', err.message);
}

console.log('\nAll three steps complete.');
