// POST /api/ask-submit — the /ask bridge (DM Engine Revamp, 2026-08-10).
//
// Replaces the braveworksRN@gmail.com clinical email deflect, which converted
// ~0 across 23 triage digests (0/6 baseline made the email jump; 5/7 clinical
// emails sat unread). Clinical DM lanes now hand out ONE button ->
// bpquiz.com/ask (prefilled 2-min form) -> this endpoint:
//   1. stores the question in KV (ask:<id>) + pushes dmrouter:ask-queue
//   2. sends an instant Resend auto-ack (48h answer SLA, Joel-approved copy)
//   3. alerts Joel's inbox so nothing waits for the next triage run
// The answer pipeline is human: Claude drafts an educational, prescriber-
// deferring reply from the queue; Joel approves (Tier 2); Resend sends.
// Nothing here answers a medical question automatically — ever.
//
// Public endpoint (it backs a public form): validates email, honeypot field
// ("company") silently accepts + drops bots, hard caps field lengths.
import { kv } from '@vercel/kv';
import { Resend } from './_resend.js';
import { looksLikeValidEmail } from './_email-validation.js';
import { normalizePhone } from './_phone.js';

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, question, doctor_said, cid, company } = req.body || {};
  // 2026-08-10 (Joel): phone is required on every form now. Normalized via
  // api/_phone.js so the rule is identical on every endpoint. Stored empty
  // rather than rejected if malformed: the EMAIL is what we cannot lose.
  const phone = normalizePhone(req.body?.phone);

  // Honeypot: bots fill every field. Pretend success, store nothing.
  if (company) return res.status(200).json({ success: true });

  const q = typeof question === 'string' ? question.trim().slice(0, 4000) : '';
  const fname = typeof name === 'string' ? name.trim().slice(0, 80) : '';
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required so Joel can answer you.' });
  }
  if (q.length < 5) {
    return res.status(400).json({ error: 'Please write your question.' });
  }

  const emailLower = String(email).trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const id = `${nowIso.slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    at: nowIso,
    name: fname,
    email: emailLower,
    phone,
    question: q,
    doctorSaid: typeof doctor_said === 'string' ? doctor_said.trim().slice(0, 2000) : '',
    manychatContactId: typeof cid === 'string' ? cid.slice(0, 32) : '',
    status: 'open', // open -> drafted -> answered
  };

  if (!process.env.KV_REST_API_URL) {
    return res.status(500).json({ error: 'Storage unavailable — please try again shortly.' });
  }
  try {
    await kv.set(`ask:${id}`, record);
    await kv.lpush('dmrouter:ask-queue', JSON.stringify({ id, at: nowIso, email: emailLower, name: fname }));
    await kv.ltrim('dmrouter:ask-queue', 0, 999);
  } catch (err) {
    return res.status(500).json({ error: 'Storage unavailable — please try again shortly.' });
  }

  // Auto-ack to the asker (Joel-approved copy, 2026-08-10) — best-effort.
  let acked = false;
  try {
    await getResend().emails.send({
      from: 'Joel Polley, RN <joel@bpquiz.com>',
      to: emailLower,
      replyTo: 'braveworksrn@gmail.com',
      subject: 'Got your question — Joel, RN',
      text: `Hey${fname ? ' ' + fname : ''},\n\nYour question is in my queue and I'll answer within 48 hours.\n\nWhile you wait, one thing I tell everyone: nothing I teach replaces your own doctor — my job is to help you ask them better questions and build the daily habits around their plan. If your situation changes and feels urgent before I reply, don't wait on me — get seen.\n\nTalk soon.\n— Joel, RN`,
      html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2c2a26;line-height:1.6;">
        <p>Hey${fname ? ' ' + fname : ''},</p>
        <p>Your question is in my queue and I'll answer within <strong>48 hours</strong>.</p>
        <p>While you wait, one thing I tell everyone: nothing I teach replaces your own doctor — my job is to help you ask them better questions and build the daily habits around their plan. If your situation changes and feels urgent before I reply, don't wait on me — get seen.</p>
        <p>Talk soon.<br>— Joel, RN</p>
      </div>`,
    });
    acked = true;
  } catch { /* queue holds it; triage answers regardless */ }

  // Surface to Joel immediately (same alert channel manychat-capture uses).
  try {
    await getResend().emails.send({
      from: 'BraveWorks Ops <noreply@bpquiz.com>',
      to: ['braveworksrn@gmail.com'],
      subject: `[/ask] New question from ${fname || emailLower}`,
      text: `id: ${id}\nfrom: ${fname} <${emailLower}>\nmanychat cid: ${record.manychatContactId || '-'}\n\nQUESTION:\n${q}\n\nWHAT THEIR DOCTOR SAID:\n${record.doctorSaid || '-'}\n\nAnswer SLA: 48h. The triage run drafts from dmrouter:ask-queue.`,
    });
  } catch { /* best effort */ }

  return res.status(200).json({ success: true, acked });
}
