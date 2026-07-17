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
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: JOEL_NOTIFY,
      replyTo: email,
      subject: `[ACTION] Sprint assessment in: ${data.name || email}`,
      text: `A Sprint buyer finished their deep assessment. Build their 30-day plan and get the call scheduled.\n\n${lines}\n\nSubmitted: ${submittedAt}\nKV: bwbp:assessment:${email}\n\nReply to this email to reach them directly.`,
    });
  } catch (err) {
    console.error('sprint-assessment: Joel alert failed', err.message);
    return res.status(500).json({ error: 'Could not deliver, please try again' });
  }

  // Buyer confirmation, best-effort.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: email,
      replyTo: JOEL_NOTIFY,
      subject: 'Got it. Your case is on my desk.',
      text: `Hi ${data.name ? data.name.split(' ')[0] : 'there'},\n\nYour assessment just landed on my desk, and I have read enough already to tell you this was worth doing.\n\nHere is what happens next. I sit down with your full case and build your 30 days, in order, for your body and your life. It lands in your inbox within 2 business days, along with the link to pick a time for our 1:1 call.\n\nIf anything changes with your numbers before then, just reply to this email.\n\nTalk soon,\nJoel Polley, RN\n\nThis is education and lifestyle support alongside your doctor, never instead of them. Your doctor makes every medication call.`,
    });
  } catch (err) {
    console.error('sprint-assessment: buyer confirmation failed (Joel alert OK)', err.message);
  }

  return res.status(200).json({ ok: true });
}
