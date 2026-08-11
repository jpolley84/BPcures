// api/sprint-assessment.js — the evergreen deep assessment behind the $297
// Sprint (and the $97 buyer flash). Every case-review buyer gets the link in
// their confirmation email; when the FILLED assessment lands here, Joel gets
// an [ACTION] email with every answer so he can build the 30-day plan and
// the buyer gets a "received" confirmation.
//
// POST { email, name, age?, readings, meds, tried, health, struggle, goal, notes? }
//   -> 200 { ok: true }
// Stores KV bwbp:assessment:<email> (latest wins, prior kept under history).
// No auth: the URL only travels inside purchase-confirmation emails, and the
// worst-case abuse is a fake assessment email to Joel. Basic length caps +
// a same-email 10/day rate limit keep it boring.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const JOEL_NOTIFY = process.env.JOEL_NOTIFY_EMAIL || 'braveworksrn@gmail.com';
const CALENDLY_URL = process.env.CALENDLY_BOOKING_URL || 'https://calendly.com/braveworksrn/60min';

// 2026-08-11: the booking link now goes ONLY to a verified buyer.
//
// The header above used to say "No auth: the URL only travels inside
// purchase-confirmation emails." That stopped being true. /sprint-assessment is
// a public route and the same Calendly URL was hardcoded on the page, so anyone
// who found the form and submitted it was emailed a link to Joel's calendar.
// One non-buyer booked an hour with Joel and Annie that way before we caught it.
//
// Joel's rule: a Sprint buyer gets the link. An applicant does not. So we ask
// Stripe whether this email has ever actually paid, and omit the link if not.
// Fails OPEN on a Stripe error, because silently withholding the call from a
// real buyer is worse than the occasional stray link.
const BUYER_MIN_NET_DOLLARS = 97; // $97 flash and $297 Sprint both qualify

async function hasQualifyingPurchase(email) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { buyer: true, checked: false, reason: 'no stripe key' };
  const auth = { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64') };
  try {
    const q = encodeURIComponent(`email:'${email.replace(/'/g, "")}'`);
    const cRes = await fetch(`https://api.stripe.com/v1/customers/search?query=${q}&limit=10`, { headers: auth });
    const cJson = await cRes.json();
    const ids = (cJson.data || []).map((c) => c.id);

    // Guest checkouts never attach to a customer, so also sweep recent charges
    // by billing email. 100 is plenty for a buyer who just filled the form.
    const chRes = await fetch('https://api.stripe.com/v1/charges?limit=100', { headers: auth });
    const chJson = await chRes.json();
    const matches = (chJson.data || []).filter((c) => {
      if (!c.paid || c.status !== 'succeeded') return false;
      const e = (c.billing_details?.email || c.receipt_email || '').toLowerCase();
      return e === email || (c.customer && ids.includes(c.customer));
    });
    const net = matches.reduce((sum, c) => sum + (c.amount - (c.amount_refunded || 0)) / 100, 0);
    return { buyer: net >= BUYER_MIN_NET_DOLLARS, checked: true, net };
  } catch (err) {
    console.error('sprint-assessment: buyer check failed, failing open', err.message);
    return { buyer: true, checked: false, reason: err.message };
  }
}

// Uploaded lab documents ride in as base64 in the JSON body, so cap the body
// under Vercel's limit and validate hard: photos/PDFs only, <=6 files, <=4MB.
export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const MAX_ATTACHMENTS = 6;
const MAX_ATTACH_BYTES = 4_000_000;
const ALLOWED_ATTACH = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/i;

// Optional structured labs shown to Joel in the [ACTION] email.
const LAB_LABELS = {
  bp: 'Latest BP', bpDate: 'Reading date', pulse: 'Resting HR', weight: 'Weight',
  a1c: 'A1C / glucose', cholesterol: 'Cholesterol (total/LDL)', potassium: 'Potassium',
  magnesium: 'Magnesium', kidney: 'Kidney (eGFR/creatinine)', thyroid: 'Thyroid (TSH)',
};

const FIELDS = [
  ['name', 'Name', 120],
  ['email', 'Email', 200],
  ['age', 'Age range', 40],
  ['readings', 'Recent readings + when taken', 1500],
  ['meds', 'Current medications and supplements', 1500],
  ['tried', 'What they have tried so far', 2000],
  ['health', 'Other health picture (sleep, stress, diagnoses)', 2000],
  ['struggle', 'Biggest struggle right now', 1500],
  ['goal', 'What winning looks like in 30 days', 1500],
  ['notes', 'Anything else Joel should know', 2000],
];

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const data = {};
  for (const [key, , max] of FIELDS) data[key] = clean(req.body[key], max);
  const email = data.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Optional structured labs (each capped, unknown keys ignored).
  const labs = {};
  const rawLabs = req.body.labs && typeof req.body.labs === 'object' ? req.body.labs : {};
  for (const key of Object.keys(LAB_LABELS)) {
    const v = clean(rawLabs[key], 80);
    if (v) labs[key] = v;
  }

  // Uploaded documents -> Resend attachments. Validate hard; skip bad ones
  // rather than failing the whole submission (the text answers still matter).
  const attachments = [];
  const rawAtt = Array.isArray(req.body.attachments) ? req.body.attachments.slice(0, MAX_ATTACHMENTS) : [];
  let attachTotal = 0;
  for (const a of rawAtt) {
    if (!a || typeof a.contentBase64 !== 'string') continue;
    const type = String(a.type || '').toLowerCase();
    if (!ALLOWED_ATTACH.test(type)) continue;
    const bytes = Math.ceil((a.contentBase64.length * 3) / 4);
    if (bytes <= 0 || attachTotal + bytes > MAX_ATTACH_BYTES) continue;
    attachTotal += bytes;
    const filename = clean(a.filename, 120) || `document-${attachments.length + 1}`;
    attachments.push({ filename, content: a.contentBase64 });
  }
  if (!data.readings && !data.struggle && !data.goal) {
    return res.status(400).json({ error: 'Please fill in the assessment before sending' });
  }

  // Cheap rate limit: 10 submissions per address per day.
  try {
    const rlKey = `bwbp:assessment-rl:${email}:${new Date().toISOString().slice(0, 10)}`;
    const n = await kv.incr(rlKey);
    if (n === 1) await kv.expire(rlKey, 86400);
    if (n > 10) return res.status(429).json({ error: 'Too many submissions today' });
  } catch { /* KV hiccup never blocks a paying customer */ }

  const submittedAt = new Date().toISOString();
  try {
    const key = `bwbp:assessment:${email}`;
    const prior = await kv.get(key);
    await kv.set(key, {
      ...data,
      email,
      labs,
      attachmentNames: attachments.map((a) => a.filename),
      submittedAt,
      ...(prior ? { history: [...(prior.history || []), { ...prior, history: undefined }].slice(-5) } : {}),
    });
    // Mark the drip record so sequences know the assessment is in.
    try {
      const dripKey = `bwbp:drip:${email}`;
      const drip = await kv.get(dripKey);
      if (drip) await kv.set(dripKey, { ...drip, assessmentSubmittedAt: submittedAt });
    } catch { /* non-fatal */ }
  } catch (err) {
    console.error('sprint-assessment: KV write failed', err.message);
    // Still notify Joel: the email IS the fulfillment trigger.
  }

  // The whole point: Joel gets every answer, reply-to goes to the buyer.
  const lines = FIELDS.map(([key, label]) => `${label.toUpperCase()}\n${data[key] || '(blank)'}`).join('\n\n');
  const labLines = Object.keys(labs).length
    ? '\n\nRECENT LAB VALUES\n' + Object.entries(labs).map(([k, v]) => `  ${LAB_LABELS[k]}: ${v}`).join('\n')
    : '\n\nRECENT LAB VALUES\n  (none entered)';
  const attachLine = attachments.length
    ? `\n\nUPLOADED DOCUMENTS (${attachments.length}) attached to this email:\n` + attachments.map((a) => `  ${a.filename}`).join('\n')
    : '\n\nUPLOADED DOCUMENTS\n  (none)';
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: JOEL_NOTIFY,
      replyTo: email,
      subject: `[ACTION] Sprint assessment in: ${data.name || email}`,
      text: `A Sprint buyer finished their deep assessment. Build their 30-day plan and get the call scheduled.\n\n${lines}${labLines}${attachLine}\n\nSubmitted: ${submittedAt}\nKV: bwbp:assessment:${email}\n\nReply to this email to reach them directly.`,
      ...(attachments.length ? { attachments } : {}),
    });
  } catch (err) {
    console.error('sprint-assessment: Joel alert failed', err.message);
    return res.status(500).json({ error: 'Could not deliver, please try again' });
  }

  // Buyer confirmation, best-effort. The booking link is included ONLY for a
  // verified buyer; a non-buyer gets a warm confirmation with no calendar link
  // and Joel is told, so he can decide whether to invite them himself.
  const purchase = await hasQualifyingPurchase(email);
  const first = data.name ? data.name.split(' ')[0] : 'there';

  const buyerText = `Hi ${first},

Your assessment just landed on my desk, and I have read enough already to tell you this was worth doing.

One thing left, and it is the important one: book our 1:1 onboarding call. That call is where I walk you through your case and we set your 30 days in motion. Pick a time here:

${CALENDLY_URL}

Before we talk, I sit down with everything you sent, your answers, your numbers, and any documents you uploaded, and I come to the call with your plan already taking shape.

If anything changes with your numbers before then, just reply to this email.

Talk soon,
Joel Polley, RN

This is education and lifestyle support alongside your doctor, never instead of them. Your doctor makes every medication call.`;

  const nonBuyerText = `Hi ${first},

Thank you for taking the time on that. It is a long form and you filled it in honestly, which is more than most people do.

I have your answers in front of me. One thing before we go further: the 1:1 onboarding call is part of the 30-Day Sprint, and I am not finding a purchase under this email address. That may simply be my system looking under the wrong address, so tell me if you bought under a different one and I will sort it out immediately.

If you have not joined yet and you would like to, reply and I will send you the details.

Either way, you are welcome at our next free challenge, live with me and Annie:

https://changemylifechallenge.com

Talk soon,
Joel Polley, RN

This is education and lifestyle support alongside your doctor, never instead of them. Your doctor makes every medication call.`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: email,
      replyTo: JOEL_NOTIFY,
      subject: purchase.buyer ? 'Got it. Now book our call.' : 'Got your assessment',
      text: purchase.buyer ? buyerText : nonBuyerText,
    });
  } catch (err) {
    console.error('sprint-assessment: buyer confirmation failed (Joel alert OK)', err.message);
  }

  // Tell Joel when a non-buyer submits, so a real prospect is not lost in the
  // gap between "no link sent" and "nobody followed up".
  if (!purchase.buyer) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'BraveWorks Ops <joel@bpquiz.com>',
        to: JOEL_NOTIFY,
        replyTo: email,
        subject: `[CHECK] Assessment from a non-buyer: ${data.name || email}`,
        text: `${data.name || email} submitted the Sprint assessment but Stripe shows no qualifying purchase under ${email} (net $${(purchase.net ?? 0).toFixed(2)}).\n\nNo booking link was sent. They got a warm note asking whether they bought under a different address, plus the free challenge.\n\nIf they are a real buyer under another email, send them the link yourself. If they are a warm prospect, this is a good one to call.\n\nReply to this email to reach them.`,
      });
    } catch (err) {
      console.error('sprint-assessment: non-buyer alert failed', err.message);
    }
  }

  return res.status(200).json({ ok: true });
}
