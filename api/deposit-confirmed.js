// api/deposit-confirmed.js — tells Joel a Life Change Activated deposit landed.
//
// Called by the page after a card payment succeeds, and by the confirmation
// page after a Klarna redirect. It re-reads the PaymentIntent from Stripe, so
// nothing goes out except for a real, succeeded payment, and only once
// (metadata.joel_notified).
//
// Sends TWO emails: the internal notice to Joel, and the buyer's welcome.
// 2026-10-22: the buyer's was missing. Aurelia Smith paid $200 and received a
// Stripe card receipt and silence, with her $1,800 balance link living only in
// a browser tab she would close. The welcome carries the balance link, the
// assessment, and the Wednesday call.

import Stripe from 'stripe';
import { kv } from '@vercel/kv';
import { PROGRAMS } from './create-deposit-payment-intent.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const NOTIFY_TO = 'braveworksrn@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const id = String((req.body && req.body.paymentIntentId) || '').trim();
  if (!/^pi_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Bad request' });
  try {
    const pi = await stripe.paymentIntents.retrieve(id, { expand: ['latest_charge'] });
    const md = pi.metadata || {};
    if (!PROGRAMS[md.program] || !['deposit', 'full'].includes(md.kind)) return res.status(403).json({ error: 'Not allowed' });
    if (pi.status !== 'succeeded') return res.status(200).json({ ok: true, status: pi.status, kind: md.kind });
    if (md.joel_notified === '1') return res.status(200).json({ ok: true, status: pi.status, kind: md.kind, already: true });
    await stripe.paymentIntents.update(id, { metadata: { ...md, joel_notified: '1' } });
    const method = pi.latest_charge?.payment_method_details?.type || 'card';
    const key = process.env.RESEND_API_KEY;
    if (key) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BPQuiz Alerts <alerts@bpquiz.com>',
          to: [NOTIFY_TO],
          reply_to: md.email || undefined,
          subject: `New Life Change Activated ${md.kind === 'full' ? 'PAID IN FULL' : 'deposit'}: ${md.first_name || ''} ${md.last_name || ''} ($${pi.amount / 100})`.replace(/\s+/g, ' '),
          text: [
            `Program:  Life Change Activated ($2,000 tuition)`,
            `Deposit:  $${(pi.amount / 100).toFixed(2)} via ${method}`,
            `Name:     ${md.first_name || ''} ${md.last_name || ''}`,
            `Email:    ${md.email || ''}`,
            `Phone:    ${md.phone || ''}`,
            md.kind === 'full' ? `Balance:  $0 (paid in full)` : `Balance:  $1,800 · plan page: https://bpquiz.com/life-change-activated/balance/`,
            `Stripe:   https://dashboard.stripe.com/payments/${pi.id}`,
          ].join('\n'),
        }),
      }).catch((e) => console.error('deposit-confirmed notify failed', e.message));
    }
    // Cohort record. The assessment endpoint stamps bwbp:allin:<email> only
    // when the row already exists, so without this an Activated buyer's
    // assessment stamps nothing. Read-merge-write: never clobber a row that
    // already exists for someone who bought a different program.
    if (md.email) {
      try {
        const key2 = `bwbp:allin:${String(md.email).trim().toLowerCase()}`;
        let existing = await kv.get(key2);
        if (typeof existing === 'string') { try { existing = JSON.parse(existing); } catch { existing = null; } }
        const row = (existing && typeof existing === 'object') ? existing : {};
        await kv.set(key2, {
          ...row,
          email: String(md.email).trim().toLowerCase(),
          firstName: row.firstName || md.first_name || '',
          lastName: row.lastName || md.last_name || '',
          phone: row.phone || md.phone || '',
          program: 'life-change-activated',
          plan: md.kind === 'full' ? 'full' : (row.plan || 'deposit-paid'),
          depositPaymentIntent: pi.id,
          status: row.status || 'awaiting_assessment',
          confirmedAt: row.confirmedAt || new Date().toISOString(),
        });
      } catch (err) {
        // Non-fatal: the money is taken and both emails still go out.
        console.error('deposit-confirmed cohort stamp failed', md.email, err.message);
      }
    }

    // Buyer welcome. Wrapped on its own so a failure here cannot swallow
    // Joel's notice above, and vice versa.
    if (key && md.email) {
      const first = (md.first_name || '').trim() || 'Friend';
      const paidFull = md.kind === 'full';
      const lines = [
        `${first},`,
        '',
        'Your spot in Life Change Activated is reserved. Welcome.',
        '',
        paidFull
          ? 'You paid the $2,000 tuition in full, so there is no balance to think about. That is it, you are done with the money part.'
          : 'Your $200 deposit is in and it counts toward the $2,000 tuition. That leaves $1,800, and you choose how to handle it.',
        '',
      ];
      if (!paidFull) {
        lines.push(
          'PICK YOUR PLAN HERE:',
          'https://bpquiz.com/life-change-activated/balance/',
          '',
          'Three options, and every one finishes inside your eight weeks:',
          '',
          'Pay $1,800 once, the lowest total.',
          '$950 twice, today and four weeks later, $1,900 total.',
          '$495 four times, every two weeks, $1,980 total.',
          '',
        );
      }
      lines.push(
        'WE START RIGHT AWAY. TWO THINGS TO DO.',
        '',
        '1. Fill out your assessment. This is how I learn your numbers, your history and what you are actually working with, so your plan is yours and not a template.',
        '',
        'https://bpquiz.com/accelerator-assessment',
        '',
        'Do it before Wednesday if you can.',
        '',
        '2. Your first coaching call is Wednesday, 11:00 AM Central, 12:00 PM Eastern.',
        '',
        'https://us06web.zoom.us/j/89350950543?pwd=toPU7vNDWN5Hgib57aZ4EyxrIH1cB2.1',
        'Meeting ID: 893 5095 0543',
        '',
        'You will get a reminder with that link 30 minutes before every call, so you do not have to keep this email. Bring your questions and your numbers.',
        '',
        'One thing I want you to hear, because you just put real money on yourself. The people who get the most out of this are not the ones with the best starting numbers. They are the ones who show up and tell the truth about where they are. You already did the hard part.',
        '',
        'Reply straight to this email with anything at all. It comes to me.',
        '',
        'Joel Polley, RN',
      );
      if (!paidFull) {
        lines.push('', 'P.S. Your $200 deposit is non-refundable and is credited toward your $2,000 tuition.');
      }
      const text = lines.join('\n');
      const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let body = text.split('\n\n').map((p) => {
        let h = esc(p).replace(/\n/g, '<br>');
        for (const u of ['https://bpquiz.com/life-change-activated/balance/',
                         'https://bpquiz.com/accelerator-assessment',
                         'https://us06web.zoom.us/j/89350950543?pwd=toPU7vNDWN5Hgib57aZ4EyxrIH1cB2.1']) {
          h = h.split(esc(u)).join(`<a href="${u}" style="color:#112d4d;font-weight:700">${esc(u)}</a>`);
        }
        return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:#1b2430">${h}</p>`;
      }).join('');
      body = '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
        + '<div style="max-width:580px;margin:0 auto;padding:30px 22px;'
        + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + body + '</div></body></html>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Joel Polley, RN <joel@bpquiz.com>',
          to: [md.email],
          reply_to: 'braveworksrn@gmail.com',
          subject: "You're in. Here's what happens next.",
          text,
          html: body,
        }),
      }).catch((e) => console.error('deposit-confirmed buyer welcome failed', e.message));
    }
    return res.status(200).json({ ok: true, status: pi.status, kind: md.kind });
  } catch (err) {
    console.error('deposit-confirmed failed', err.message);
    return res.status(500).json({ error: 'Check failed' });
  }
}
