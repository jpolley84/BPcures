// api/tea-review.js — Steady tea review capture.
//
// Email clients strip <form> and JS, so a true in-email form is impossible.
// Instead the email's five stars are five links, each carrying the rating and
// a signed token identifying the buyer. Landing on /tea-review/ records the
// star immediately (POST action:'rate'), so a buyer who never types anything
// still leaves a rating. Typing + submitting adds the text (action:'text').
//
// Contract:
//   POST { token, rating?, text?, name?, action }
//   200  { ok: true }
//   400  { ok: false, error }
//
// Token reuses the unsubscribe HMAC (same secret, same shape) so a reviewer
// cannot be spoofed into someone else's slot and no raw email rides in a URL.
//
// KV shapes:
//   tea:review:<email>   → { email, name, rating, text, ratedAt, textAt }
//   tea:reviews          → set of emails that have reviewed (for reporting)

import { kv } from '@vercel/kv';
import { verifyUnsubToken } from './triangle-unsubscribe.js';

const clean = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = verifyUnsubToken(body.token);
  if (!email) return res.status(400).json({ ok: false, error: 'bad_token' });

  const key = `tea:review:${email}`;
  const existing = (await kv.get(key)) || { email };

  const rating = Number(body.rating);
  if (rating >= 1 && rating <= 5) {
    existing.rating = Math.round(rating);
    existing.ratedAt = existing.ratedAt || new Date().toISOString();
  }

  if (body.action === 'text') {
    const text = clean(body.text, 4000);
    if (!text) return res.status(400).json({ ok: false, error: 'empty_text' });
    existing.text = text;
    existing.name = clean(body.name, 80) || existing.name || '';
    existing.textAt = new Date().toISOString();
  }

  await kv.set(key, existing);
  await kv.sadd('tea:reviews', email);

  return res.status(200).json({ ok: true });
}
