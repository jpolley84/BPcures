// api/foods101-optin.js — the 101 Foods squeeze page's capture endpoint.
//
// Funnel: foods101-v1 (Brunson lead funnel). Step 1 of the value ladder. The
// squeeze at / (variant B) and /101foods posts here; the thank-you page then
// presents the $17 tripwire. This endpoint owns ONLY the capture.
//
// Contract:
//   POST { email, name, magnet?, source?, autoMasterclass?, tags?[], utm?{} }
//   200  { success: true, magnet: 'foods101', deduped, suppressed, enrolled,
//          emailSent, masterclass: { registered, already }, redirect }
//   400  { success: false, error, field? }   bad body / bad email / no name
//   405  { success: false, error }           non-POST
//   429  { success: false, error }           per-IP rate limit
//   500  { success: false, error, redirect } both rails died
//   502  { success: false, error, redirect } enrolled, but the guide send failed
//
// The client navigates to `redirect` when present. On any non-200 it should
// fall through to /101foods-thanks?capture=failed, which shows the honest
// "your guide did not go out" branch with a direct download and a resend box,
// rather than a confirmation that never arrives.
//
// Hardening notes (2026-07-25 audit flagged three public endpoints with no
// limiter, so this one ships with one on day zero):
//   - Per-IP rate limit, fail-open, copied from lead-magnet.js's pattern.
//   - Shared looksLikeValidEmail (also blocks CRLF header injection).
//   - Per-email NX idempotency guard inside _foods101-capture.js.
//   - No secret is read here; everything comes from process.env at use site.

import { looksLikeValidEmail } from './_email-validation.js';
import { captureFoods101 } from './_foods101-capture.js';
import { kv } from '@vercel/kv';

const THANKS_PATH = '/101foods-thanks';
const THANKS_FAILED = `${THANKS_PATH}?capture=failed`;

// Per-IP rate limit. This endpoint mails whatever address the request supplies,
// so without throttling one attacker can spam thousands of inboxes (Resend
// abuse plus sender-reputation burn). 10 per IP per hour is generous for
// household / shared-network use. Fail-open on KV trouble: a storage blip must
// never block a real lead. Pattern lifted from lead-magnet.js:514-535.
async function checkRateLimit(ip) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `f101-rl:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= 10) {
      return { ok: false, count };
    }
    if (count === 0) {
      await kv.set(key, 1, { ex: 3600 });
    } else {
      await kv.incr(key);
    }
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('foods101-optin: rate-limit check failed (allowing):', err.message);
    return { ok: true };
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

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

// The squeeze asks for a first name and uses it in the subject line and the
// greeting, so it is required here too. Control characters are stripped rather
// than rejected (a paste artifact should not cost us the lead); a name that is
// empty after cleaning is a 400.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
function cleanFirstName(value) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export default async function handler(req, res) {
  try {
    return await handleOptin(req, res);
  } catch (err) {
    console.error('foods101-optin unhandled error:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Something broke on our end. Try again in a minute.',
        redirect: THANKS_FAILED,
      });
    }
  }
}

async function handleOptin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate-limit FIRST so an attacker cannot exhaust Resend or burn sender rep.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    console.warn(`foods101-optin: rate-limited ip=${ip} count=${rl.count}`);
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }

  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body, expected JSON' });
  }

  if (!looksLikeValidEmail(body.email)) {
    return res.status(400).json({
      success: false,
      field: 'email',
      error: 'That email does not look right. Check it and try again.',
    });
  }

  const firstName = cleanFirstName(body.name ?? body.firstName);
  if (!firstName) {
    return res.status(400).json({
      success: false,
      field: 'firstName',
      error: 'Please add your first name so I know who I am writing to.',
    });
  }

  const result = await captureFoods101({
    email: body.email,
    name: firstName,
    tags: body.tags,
    utm: body.utm,
    source: body.source,
    autoMasterclass: body.autoMasterclass !== false, // default ON (Joel's rule)
  });

  // Both rails died: nothing stored, nothing sent. That is a real failure and
  // it gets a real status code.
  if (!result.enrolled && !result.emailSent && !result.deduped && !result.suppressed) {
    return res.status(500).json({
      success: false,
      error: 'We could not save your request. Please try again.',
      redirect: THANKS_FAILED,
    });
  }

  // Stored but the guide did not go out. Never call that a 200: the visitor is
  // owed the file, and the thank-you page's failed branch is the honest place
  // to put them (direct download plus a resend box).
  if (result.sendError) {
    return res.status(502).json({
      success: false,
      error: 'Your guide did not send. Download it on the next page and we will try again.',
      enrolled: result.enrolled,
      emailSent: false,
      redirect: THANKS_FAILED,
    });
  }

  // Tombstoned address (previously unsubscribed). Legally we cannot mail them,
  // so we do not pretend we did: send them to the failed branch, where the
  // guide is one click away as a direct download.
  // &reason=suppressed so the thank-you page can say what actually happened.
  // Without it an unsubscribed reader is told "Something broke on our end,
  // not yours", which is false and reads as a bug to the one person who has
  // already told us to stop emailing them.
  const redirect = result.suppressed
    ? `${THANKS_FAILED}&reason=suppressed`
    : THANKS_PATH;

  return res.status(200).json({
    success: true,
    magnet: 'foods101',
    deduped: result.deduped,
    suppressed: result.suppressed,
    enrolled: result.enrolled,
    emailSent: result.emailSent,
    masterclass: result.masterclass,
    redirect,
  });
}
