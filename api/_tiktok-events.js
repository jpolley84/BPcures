// api/_tiktok-events.js — server-side TikTok Events API (Events API 2.0).
//
// WHY THIS EXISTS
// The browser pixel in index.html fires CompletePayment from SuccessPage, but
// that beacon is lost for a large share of buyers: ad blockers, iOS tracking
// prevention, and buyers who close the tab on the Stripe redirect before the
// page paints. Those are exactly the conversions TikTok needs to see in order
// to optimize delivery, so we ALSO send the purchase from the Stripe webhook,
// where nothing can block it.
//
// DEDUPLICATION
// Browser and server both report the same sale, so both stamp the SAME
// event_id (the Stripe checkout session id). TikTok collapses matching
// (event_id, event name) pairs and counts one conversion. If the browser event
// never arrives, the server copy stands alone and the sale is still counted.
// Do NOT change the event_id on one side without changing the other, or every
// purchase double-counts.
//
// PII
// TikTok matches conversions to accounts on SHA-256 of a normalized email.
// The raw address never leaves this server; only the digest is transmitted.
// Normalization (trim + lowercase) must happen BEFORE hashing or the digest
// will not match TikTok's, and the conversion silently fails to attribute.
//
// FAILURE SEMANTICS
// Non-fatal by contract, matching capturePurchase(): an analytics call must
// never break a paid customer's fulfillment. Every path returns false rather
// than throwing, and the webhook's 500-for-fulfillment-failures rule is
// unaffected. No token or pixel id set -> silent no-op, so previews and local
// runs never post to the live ad account.
//
// Env (server-only, deliberately NOT VITE_ prefixed — a VITE_ token would be
// inlined into the client bundle and readable by anyone viewing source):
//   TIKTOK_ACCESS_TOKEN, TIKTOK_PIXEL_ID

import crypto from 'crypto';

const TIKTOK_EVENTS_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
const TIMEOUT_MS = 4000;

// SHA-256 of the normalized value, hex. TikTok requires lowercase+trimmed
// input for emails; an unnormalized digest is accepted by the API but matches
// nothing, which is worse than sending nothing because it looks like success.
function hash(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return undefined;
  return crypto.createHash('sha256').update(v).digest('hex');
}

/**
 * Report a completed purchase to TikTok server-side.
 *
 * @param {object}  args
 * @param {string}  args.email        buyer email (hashed here, never sent raw)
 * @param {number}  args.amountCents  sale amount in cents
 * @param {string}  args.sessionId    Stripe checkout session id — the dedupe key
 * @param {string} [args.tier]        content name for reporting
 * @param {string} [args.eventName]   defaults to CompletePayment
 * @returns {Promise<boolean>} true when TikTok accepted the event
 */
export async function sendTikTokPurchase({ email, amountCents, sessionId, tier, eventName = 'CompletePayment' }) {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  if (!token || !pixelId) return false;          // not configured -> no-op
  if (!sessionId) return false;                  // no dedupe key -> refuse to send

  const emailHash = hash(email);
  // With no hashed identifier TikTok cannot attribute the conversion to a
  // user, so the event would only inflate the event count without improving
  // optimization. Skip rather than send noise.
  if (!emailHash) return false;

  const body = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [
      {
        event: eventName,
        // Seconds, not milliseconds. TikTok silently drops events whose
        // timestamp is implausible, and ms-precision reads as year 57000.
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(sessionId),
        user: { email: emailHash },
        properties: {
          currency: 'USD',
          value: amountCents != null ? amountCents / 100 : undefined,
          contents: tier
            ? [{ content_id: String(tier), content_type: 'product', content_name: String(tier) }]
            : undefined,
        },
        page: { url: 'https://bpquiz.com/success' },
      },
    ],
  };

  // AbortController rather than a bare fetch: this runs inside the Stripe
  // webhook's request, and a hung analytics call would stall fulfillment and
  // risk Stripe timing the webhook out and retrying a completed sale.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(TIKTOK_EVENTS_URL, {
      method: 'POST',
      headers: { 'Access-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    // TikTok answers HTTP 200 even for rejected payloads; the real status is
    // json.code, where 0 means accepted. Checking res.ok alone would report
    // success on every validation error.
    if (!json || json.code !== 0) {
      console.warn('tiktok events: rejected (non-fatal)', res.status, json && json.code, json && json.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('tiktok events: send failed (non-fatal)', err.name === 'AbortError' ? 'timeout' : err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
