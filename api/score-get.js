// api/score-get.js — tokenized read of a reader's saved quiz result.
//
// GET /api/score-get?e=<email>&t=<token>
//   200 { firstName, corner, readiness, scores?, riskScore? }
//   401 { error: 'badToken' }  token missing or does not match the email
//   404 { error: 'notFound' }  valid token but no bwbp:drip record
//
// Lets an email link re-open the reader's OWN result (e.g. "see your Triangle
// Score again") without a login. The token is the EXACT HMAC the unsubscribe
// link already uses (see triangle-unsubscribe.js): sha256 hex over the
// lowercased trimmed email, secret UNSUB_SECRET (falls back to CRON_SECRET),
// sliced to 24 chars:
//   t = createHmac('sha256', SECRET).update(email).digest('hex').slice(0, 24)
// Any sender that can mint an unsubscribe link can mint this with no new
// secret. The full base64url unsubscribe token (signUnsubToken output) is ALSO
// accepted when it decodes to the same email.
//
// Privacy: returns ONLY quiz fields + first name. No email echo, no state, no
// purchase data, nothing else off the record. Responses are never cached.

import crypto from 'node:crypto';
import { kv } from '@vercel/kv';
import { verifyUnsubToken } from './triangle-unsubscribe.js';

const SECRET = process.env.UNSUB_SECRET || process.env.CRON_SECRET || 'dev-unsub-secret';

function tokenMatches(email, token) {
  if (!token) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(email).digest('hex').slice(0, 24);
  if (token === expected) return true;
  // Fallback: the full unsubscribe token, valid only for this same email.
  return verifyUnsubToken(token) === email;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.query?.e || '').trim().toLowerCase();
  const token = String(req.query?.t || '').trim();

  if (!email || !email.includes('@') || !tokenMatches(email, token)) {
    return res.status(401).json({ error: 'badToken' });
  }

  let record = null;
  try {
    record = await kv.get(`bwbp:drip:${email}`);
  } catch (err) {
    console.error('score-get: KV read failed', err.message);
    return res.status(500).json({ error: 'lookupFailed' });
  }
  if (!record) return res.status(404).json({ error: 'notFound' });

  res.setHeader('Cache-Control', 'private, no-store');
  const out = {
    firstName: record.firstName || '',
    corner: record.corner || null,
    readiness: record.readiness || null,
  };
  // capture-lead.js stores `scores` ({ stress, sugar, sodium }); include
  // `riskScore` too if a writer ever sets it. Omit whichever is absent.
  if (record.scores !== undefined && record.scores !== null) out.scores = record.scores;
  if (record.riskScore !== undefined && record.riskScore !== null) out.riskScore = record.riskScore;
  return res.status(200).json(out);
}
