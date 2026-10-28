// api/masterclass-waitlist.js — "next free live masterclass" waitlist.
//
// 2026-10-27 (Joel): the Oct 26 "Restore Your Glow" class is over and no new
// date is set, so /masterclass became a waitlist instead of a page with a
// stale date. Joel picked "Waitlist" over announcing Monday, Nov 2.
//
// Contract:
//   POST { name?, email, source?, utm? }
//   200  { ok: true, already: boolean }
//   400  { ok: false, error }   bad body / bad email
//   405  { ok: false, error }   non-POST
//   500  { ok: false, error }   storage not configured / write failed
//
// Storage (KV is the record):
//   waitlist:masterclass:rec:<email>   { email, name, joinedAt, source, utm? }
//   waitlist:masterclass               set of emails, for the date announcement
//
// Sends NOTHING. No confirmation, no drip. When the next date is set, the
// announcement goes to the waitlist:masterclass set through /send-campaign
// (dry run + Joel's approval), and NEVER-SEND exclusions apply there.

import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';
import { clean, cleanUtm } from './_masterclass-enroll.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!process.env.KV_REST_API_URL) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }

  const recordKey = `waitlist:masterclass:rec:${email}`;
  try {
    const existing = await kv.get(recordKey);
    if (existing && existing.email) return res.status(200).json({ ok: true, already: true });

    const utm = cleanUtm(body.utm);
    await kv.set(recordKey, {
      email,
      name: clean(body.name),
      joinedAt: new Date().toISOString(),
      source: clean(body.source, 40) || 'masterclass-waitlist',
      ...(utm ? { utm } : {}),
    });
    await kv.sadd('waitlist:masterclass', email);
    return res.status(200).json({ ok: true, already: false });
  } catch (err) {
    console.error('masterclass-waitlist: write failed', err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
