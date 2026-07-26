// api/masterclass-register.js — "Beyond the Cuff" weekly masterclass registration.
//
// 2026-07-26 (foods101-v1): this file is now a THIN HTTP WRAPPER. All of the
// registration behavior moved VERBATIM into api/_masterclass-enroll.js so the
// 101 Foods squeeze can auto-register a lead without duplicating the KV shapes
// or the confirmation email. The public POST contract below did NOT change —
// public/masterclass/index.html still posts here and redirects to
// /masterclass/registered/ on data.ok.
//
// Contract (UNCHANGED):
//   POST { name?, email, phone?, source?, utm? }
//   200  { ok: true, already: boolean }
//   400  { ok: false, error }   bad body / bad email
//   405  { ok: false, error }   non-POST
//   500  { ok: false, error }   storage not configured / write failed
//
// Behavior (see _masterclass-enroll.js for the implementation):
//   - Validate email (shared validator — also blocks CRLF header injection).
//   - Idempotent: re-submitting an email returns ok+already and does NOT
//     re-send the confirmation.
//   - Stores record at masterclass:reg:<email>, adds email to the
//     masterclass:members set (for /send-campaign segmentation: reminders,
//     replays, the cohort pitch follow-up), INCRs masterclass:count.
//   - Mirrors into a Resend audience if RESEND_MASTERCLASS_AUDIENCE_ID is
//     set (non-fatal; KV is the source of truth).
//   - Sends ONE transactional confirmation via Resend. Send failure is
//     non-fatal — the registration is already stored.
//   - Does NOT enroll into drip:* nurture machines. Class reminders and the
//     post-class arc go out via /send-campaign (dry-run + Joel approval)
//     against masterclass:members.

import { looksLikeValidEmail } from './_email-validation.js';
import { registerMasterclass } from './_masterclass-enroll.js';

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    return await handleRegister(req, res);
  } catch (err) {
    console.error('masterclass-register unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      if (err?.code === 'KV_NOT_CONFIGURED') {
        return res.status(500).json({ ok: false, error: 'Storage not configured' });
      }
      return res.status(500).json({ ok: false, error: 'Server error. Try again in a minute.' });
    }
  }
}

async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body, expected JSON' });
  }
  if (!looksLikeValidEmail(body.email)) {
    return res.status(400).json({ ok: false, error: 'That email doesn’t look right. Check it and try again.' });
  }

  const { already } = await registerMasterclass({
    email: body.email,
    name: body.name,
    phone: body.phone,
    source: body.source,
    utm: body.utm,
    sendConfirmation: true,
  });

  return res.status(200).json({ ok: true, already });
}
