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
import { generateCoachingAgreementPDF } from './_coaching-agreement.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const NOTIFY_TO = 'braveworksrn@gmail.com';

// 2026-10-23: per-program copy. LCA = health clients; MIYM = the coaches' accelerator.
const LCA_PLAN_LINES = [
  'Three options, and every one finishes inside your eight weeks:',
  '',
  'Pay $1,800 once, the lowest total.',
  '$950 twice, today and four weeks later, $1,900 total.',
  '$495 four times, every two weeks, $1,980 total.',
  '',
];
const COPY = {
  'life-change-activated': {
    name: 'Life Change Activated',
    tuition: '$2,000', deposit: '$200', remaining: '$1,800', planLines: LCA_PLAN_LINES,
    balance: 'https://bpquiz.com/life-change-activated/balance/',
    kvPrefix: 'bwbp:allin:',
    nextSteps: [
      'WE START RIGHT AWAY. TWO THINGS TO DO.', '',
      '1. Fill out your assessment. This is how I learn your numbers, your history and what you are actually working with, so your plan is yours and not a template.', '',
      'https://bpquiz.com/accelerator-assessment', '',
      'Do it before Wednesday if you can.', '',
      '2. Your first coaching call is Wednesday, 11:00 AM Central, 12:00 PM Eastern.', '',
      'https://us06web.zoom.us/j/89350950543?pwd=toPU7vNDWN5Hgib57aZ4EyxrIH1cB2.1',
      'Meeting ID: 893 5095 0543', '',
      'You will get a reminder with that link 30 minutes before every call, so you do not have to keep this email. Bring your questions and your numbers.', '',
      'One thing I want you to hear, because you just put real money on yourself. The people who get the most out of this are not the ones with the best starting numbers. They are the ones who show up and tell the truth about where they are. You already did the hard part.',
    ],
    links: ['https://bpquiz.com/accelerator-assessment', 'https://us06web.zoom.us/j/89350950543?pwd=toPU7vNDWN5Hgib57aZ4EyxrIH1cB2.1'],
    // 2026-11-04: paying in full on the HEALTH programs unlocks the plus one,
    // the one-on-one, the three bonuses and the coaching agreement. The /allin
    // page is the source of truth. MIYM (the coaches' offer) carries none of
    // these, so it does not set plusOne.
    plusOne: true,
    agreementTier: 'activated',
  },
  'money-in-your-message': {
    name: 'Money in Your Message Accelerator',
    tuition: '$2,000', deposit: '$200', remaining: '$1,800', planLines: LCA_PLAN_LINES,
    balance: 'https://bpquiz.com/money-in-your-message/balance/',
    kvPrefix: 'miym:client:',
    nextSteps: [
      'WE START RIGHT AWAY. TWO THINGS TO DO.', '',
      '1. Book your kickoff call. This is where we lock your avatar and your offer and map your eight weeks.', '',
      'https://calendly.com/braveworksrn/discovery-call', '',
      '2. Reply to this email with two lines: who you help, in their words, and the transformation you deliver. Rough is fine. We fix it together on the call.', '',
      'You will get the weekly call link and the WhatsApp group invite after the kickoff. Bring your offer, your numbers, and your questions.', '',
      'One thing I want you to hear, because you just put real money on yourself. We made our first $16,000 running a play we were still learning. You already have the gift. Now we build the play around it.',
    ],
    links: ['https://calendly.com/braveworksrn/discovery-call'],
  },
};
// 2026-10-29: the $7,500 Accelerator, sold through the same embedded form on
// /allin. Same cohort, assessment, and Wednesday call as LCA. No self-serve
// 2026-10-29: the $7,000 balance is picked on bpquiz.com/payment (4 plans).
COPY['life-change-accelerator'] = {
  ...COPY['life-change-activated'],
  name: 'The Life Change Accelerator',
  tuition: '$7,500', deposit: '$500', remaining: '$7,000',
  balance: 'https://bpquiz.com/payment',
  agreementTier: 'accelerator',
  planLines: [
    'Four options:',
    '',
    'Pay $7,000 once, the lowest total. Card or Klarna.',
    '6 monthly payments of $1,295, $7,770 total.',
    '9 monthly payments of $935, $8,415 total.',
    '12 monthly payments of $750, $9,000 total.',
    '',
  ],
};

// 2026-11-04: links for the paid-in-full plus-one welcome. Added to the
// link-wrapping list so they render as real anchors. Each URL sits on its own
// line in the copy, never next to a period (a trailing period once ate the
// route and sent people to the homepage).
const PLUS_ONE_LINKS = [
  'https://calendly.com/braveworksrn/60min',
  'https://bpquiz.com/downloads/joel-lab-hacks.pdf',
  'https://www.skool.com/life-change-accelerator-6423/about',
];

// The buyer-welcome copy, text and HTML. Pure (no network), so it can be
// render-tested. `agreementAttached` is true only when the PDF built.
export function buildBuyerWelcome({ C, md, agreementAttached = false }) {
  const first = (md.first_name || '').trim() || 'Friend';
  const paidFull = md.kind === 'full';
  const withPlusOne = paidFull && !!C.plusOne;
  const lines = [
    `${first},`,
    '',
    `Your spot in ${C.name} is reserved. Welcome.`,
    '',
    paidFull
      ? (withPlusOne
        ? `You paid the ${C.tuition} tuition in full, so there is no balance to think about. That is the money part finished.`
        : `You paid the ${C.tuition} tuition in full, so there is no balance to think about. That is it, you are done with the money part.`)
      : `Your ${C.deposit} deposit is in and it counts toward the ${C.tuition} tuition. That leaves ${C.remaining}, and you choose how to handle it.`,
    '',
  ];
  if (!paidFull) {
    if (C.balance) lines.push('PICK YOUR PLAN HERE:', C.balance, '');
    lines.push(...C.planLines);
  }
  if (withPlusOne) {
    lines.push(
      'Paying in full also unlocked three more things, and I want them in one place where you can find them.',
      '',
      'YOUR PLUS ONE',
      '',
      'You get to bring somebody with you at no extra cost. A full seat, not a guest pass. The same program, the same Wednesday calls, the same community, the same materials you have.',
      '',
      'Three things is all I need:',
      '',
      '1. Their full name',
      '2. Their email address',
      '3. The best mobile number for them',
      '',
      agreementAttached
        ? 'Reply to this email with those three lines. There is also a space for them on the last page of your agreement, so you can write them there instead.'
        : 'Reply to this email with those three lines.',
      '',
      'Think about who comes to mind first. Usually it is the person you have been quietly worried about.',
      '',
      'YOUR ONE-ON-ONE SESSION',
      '',
      'Sixty minutes on Zoom, yours as part of the program. Everybody gets one, and you pick the time:',
      '',
      'https://calendly.com/braveworksrn/60min',
      '',
      'YOUR THREE PAY-IN-FULL BONUSES',
      '',
      'These are separate from the Skool classroom and they come from me directly.',
      '',
      'You can have the first one right now. Lab Hacks is my plain-language guide to fourteen lab tests, so you know which questions to ask at your next appointment:',
      '',
      'https://bpquiz.com/downloads/joel-lab-hacks.pdf',
      '',
      'Restore Your Glow and the Skin and Hair regimen you make yourself with Annie are the other two. I will write to you about each one.',
      '',
    );
    if (agreementAttached) {
      lines.push(
        'YOUR AGREEMENT IS ATTACHED',
        '',
        `Six pages, already filled in with your name, your ${C.tuition} paid in full, and a zero balance. Read it through, especially the Important Health Notice. Then sign the last page, take a photo of it with your phone, and reply to this email with the photo. That is the whole process.`,
        '',
      );
    }
    // nextSteps ends with the "One thing I want you to hear" closer. The Skool
    // paragraph goes between the Wednesday-call block and that closer.
    const closer = C.nextSteps[C.nextSteps.length - 1];
    lines.push(
      ...C.nextSteps.slice(0, -1),
      'One more place to go. The materials and replays live in the Skool classroom, where you also get BP Reset, Stress Reset and Sugar Reset. Click JOIN GROUP here and we will approve you:',
      '',
      'https://www.skool.com/life-change-accelerator-6423/about',
      '',
      closer,
    );
  } else {
    lines.push(...C.nextSteps);
  }
  lines.push(
    '',
    'Reply straight to this email with anything at all. It comes to me.',
    '',
    'Joel Polley, RN',
  );
  if (!paidFull) {
    lines.push('', `P.S. Your ${C.deposit} deposit is non-refundable and is credited toward your ${C.tuition} tuition.`);
  }
  const text = lines.join('\n');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linkList = [C.balance, ...C.links, ...(withPlusOne ? PLUS_ONE_LINKS : [])].filter(Boolean);
  let html = text.split('\n\n').map((p) => {
    let h = esc(p).replace(/\n/g, '<br>');
    for (const u of linkList) {
      h = h.split(esc(u)).join(`<a href="${u}" style="color:#112d4d;font-weight:700">${esc(u)}</a>`);
    }
    return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:#1b2430">${h}</p>`;
  }).join('');
  html = '<!doctype html><html><body style="margin:0;background:#f6f7f4">'
    + '<div style="max-width:580px;margin:0 auto;padding:30px 22px;'
    + 'font-family:-apple-system,Segoe UI,Arial,sans-serif">' + html + '</div></body></html>';
  const subject = withPlusOne
    ? "You're in, and here is everything your tuition unlocked."
    : "You're in. Here's what happens next.";
  return { text, html, subject };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const id = String((req.body && req.body.paymentIntentId) || '').trim();
  if (!/^pi_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Bad request' });
  try {
    const pi = await stripe.paymentIntents.retrieve(id, { expand: ['latest_charge'] });
    const md = pi.metadata || {};
    if (!PROGRAMS[md.program] || !['deposit', 'full'].includes(md.kind)) return res.status(403).json({ error: 'Not allowed' });
    const C = COPY[md.program] || COPY['life-change-activated'];
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
          subject: `New ${C.name} ${md.kind === 'full' ? 'PAID IN FULL' : 'deposit'}: ${md.first_name || ''} ${md.last_name || ''} ($${pi.amount / 100})`.replace(/\s+/g, ' '),
          text: [
            `Program:  ${C.name} (${C.tuition} tuition)`,
            `Deposit:  $${(pi.amount / 100).toFixed(2)} via ${method}`,
            `Name:     ${md.first_name || ''} ${md.last_name || ''}`,
            `Email:    ${md.email || ''}`,
            `Phone:    ${md.phone || ''}`,
            md.kind === 'full' ? `Balance:  $0 (paid in full)` : `Balance:  ${C.remaining} · ${C.balance ? `plan page: ${C.balance}` : 'set up the plan with the buyer by hand'}`,
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
        const key2 = `${C.kvPrefix}${String(md.email).trim().toLowerCase()}`;
        let existing = await kv.get(key2);
        if (typeof existing === 'string') { try { existing = JSON.parse(existing); } catch { existing = null; } }
        const row = (existing && typeof existing === 'object') ? existing : {};
        await kv.set(key2, {
          ...row,
          email: String(md.email).trim().toLowerCase(),
          firstName: row.firstName || md.first_name || '',
          lastName: row.lastName || md.last_name || '',
          phone: row.phone || md.phone || '',
          program: md.program,
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
      const paidFull = md.kind === 'full';
      const withPlusOne = paidFull && !!C.plusOne;

      // The coaching agreement rides along only for the health programs that
      // are paid in full. Its own try/catch: a PDF failure must not swallow the
      // email or 500 the handler, because the money is already taken. When it
      // fails, the copy below does not claim the agreement is attached.
      let agreementPdf = null;
      if (withPlusOne) {
        try {
          agreementPdf = await generateCoachingAgreementPDF({
            name: [md.first_name, md.last_name].filter(Boolean).join(' ').trim(),
            email: md.email,
            paid: C.tuition,
            balance: '$0',
            tier: C.agreementTier,
          });
        } catch (err) {
          agreementPdf = null;
          console.error(`deposit-confirmed: coaching agreement PDF failed for ${md.email} (${md.first_name || ''} ${md.last_name || ''}, ${pi.id}); welcome sent WITHOUT it, send the agreement by hand`, err.message);
        }
      }

      const { text, html: body, subject } = buildBuyerWelcome({ C, md, agreementAttached: !!agreementPdf });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Joel Polley, RN <joel@bpquiz.com>',
          to: [md.email],
          reply_to: 'braveworksrn@gmail.com',
          subject,
          text,
          html: body,
          ...(agreementPdf ? { attachments: [{ filename: 'BraveWorks-Coaching-Agreement.pdf', content: agreementPdf.toString('base64') }] } : {}),
        }),
      }).catch((e) => console.error('deposit-confirmed buyer welcome failed', e.message));
    }
    return res.status(200).json({ ok: true, status: pi.status, kind: md.kind, program: md.program });
  } catch (err) {
    console.error('deposit-confirmed failed', err.message);
    return res.status(500).json({ error: 'Check failed' });
  }
}
