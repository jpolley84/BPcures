// POST /api/mc-tag — the site-side half of the ManyChat tagging contract.
//
// ManyChat rebuild, 2026-08-14 (BraveWorks-DM-Template-2026-08-14.md §7 + §9
// pre-flight item 7). Every DM link now carries `mcp={{cuid}}`. When that link
// is actually opened, the browser tells us so and we write the fact back into
// ManyChat as a tag. Two facts, two tags, nothing else:
//
//   event 'landed' -> tag "bw-landed"  she reached bpquiz.com from a DM link.
//                     This is the ONLY thing that suppresses the 20h nudge.
//                     The design deliberately prefers it over ManyChat's own
//                     button-click state, which is not reliable.
//   event 'quiz'   -> tag "took-quiz"  she finished the quiz. Enrichment for
//                     the morning triage sheet (skips rung 4, unlocks rung 5).
//                     Never a routing condition: it can only ever fire on the
//                     ~9.5% of DM landers who finish.
//
// Contract:
//   POST { cid, event }                  cid = ManyChat contact id ({{cuid}})
//   200  { ok: true, ... }               always, on every non-abusive call
//   400  { ok: false, error }            missing/!allowlisted event, bad cid
//   405                                  non-POST
//   429  { ok: false, error }            per-IP rate limit
// The caller (src/utils/manychat.js) ignores the body entirely. This endpoint
// exists to be fire-and-forget: it must never block a page, never throw into
// a visitor's path, and never matter when ManyChat is down.
//
// AUTH — deliberately the same shape as the site's other browser-called
// endpoints (capture-lead / foods101-optin / ask-submit): no shared secret,
// because a secret shipped in a Vite bundle is not a secret. Instead the abuse
// surface is closed by construction:
//   1. The tag name is NEVER taken from the request. The request carries an
//      event word; the server maps it through EVENT_TAGS. An arbitrary tag
//      cannot be written by any caller.
//   2. The contact id is shape-validated, so nothing can be smuggled into the
//      ManyChat request body.
//   3. Per-contact-per-event idempotency in KV: the second and later calls
//      never reach ManyChat at all.
//   4. Per-IP rate limit, fail-open, same pattern as foods101-optin.js.
// Residual risk, stated honestly: someone who already knows a specific
// contact id can mark that contact "landed" (costing that person their one
// nudge) or "took-quiz" (an enrichment flag the design forbids branching on).
// No message can be sent, no data can be read, nothing is exposed. That is the
// price of a link that has to work with one tap and no login, and it is the
// same bargain every other public endpoint here makes.
//
// DORMANT-SAFE: no MANYCHAT_API_KEY -> the helper no-ops and we still 200.
import { kv } from '@vercel/kv';
import { addTagBySubscriberId } from './_manychat-tag.js';

// The whole allowlist. Adding a row here is the only way to add a tag.
const EVENT_TAGS = {
  landed: 'bw-landed',
  quiz: 'took-quiz',
};

// ManyChat contact ids are numeric strings, but this stays deliberately a
// little wider than that: if {{cuid}} ever renders something else, a too-tight
// regex would silently switch the whole nudge-suppression off with no error
// anywhere. Wide enough to survive a format surprise, narrow enough that
// nothing injectable reaches the ManyChat request body.
const CID_RE = /^[A-Za-z0-9_-]{5,64}$/;

// 30 days: comfortably longer than the 20h nudge window and the 7-day
// human-agent window, short enough that KV does not accumulate forever.
const DEDUPE_TTL_SECONDS = 30 * 24 * 3600;

// Per-IP, fail-open. Pattern lifted from api/foods101-optin.js. 60/hr because
// one household on shared wifi tapping through DM links plus finishing the
// quiz is a handful of calls, and locking a real lander out costs us the
// nudge suppression this endpoint exists to provide.
async function checkRateLimit(ip) {
  if (!process.env.KV_REST_API_URL || !ip) return { ok: true };
  try {
    const key = `mctag-rl:${ip}`;
    const count = (await kv.get(key)) || 0;
    if (count >= 60) return { ok: false, count };
    if (count === 0) await kv.set(key, 1, { ex: 3600 });
    else await kv.incr(key);
    return { ok: true, count: count + 1 };
  } catch (err) {
    console.warn('mc-tag: rate-limit check failed (allowing):', err.message);
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const rl = await checkRateLimit(getClientIp(req));
  if (!rl.ok) return res.status(429).json({ ok: false, error: 'Too many requests' });

  const body = (await readJsonBody(req)) || {};
  const cid = typeof body.cid === 'string' ? body.cid.trim() : '';
  const event = typeof body.event === 'string' ? body.event.trim().toLowerCase() : '';
  // hasOwnProperty, not a bare index: a bare `EVENT_TAGS[event]` walks the
  // prototype chain, so event:"constructor" and event:"__proto__" both return
  // something truthy and slip past the guard below. Nothing attacker-chosen
  // ever reached ManyChat (a function does not survive JSON.stringify), but
  // those calls still burned a KV dedupe key and an outbound HTTP request.
  // This makes the "an arbitrary tag cannot be written by any caller" claim in
  // the header true by construction rather than true by accident.
  const tagName = Object.prototype.hasOwnProperty.call(EVENT_TAGS, event) ? EVENT_TAGS[event] : null;

  if (!tagName) return res.status(400).json({ ok: false, error: 'Unknown event' });
  if (!CID_RE.test(cid)) return res.status(400).json({ ok: false, error: 'Invalid contact id' });

  // Idempotency BEFORE the network call. A refresh, a back-button, a double
  // mount in StrictMode, or a bot replaying the same body all stop here.
  // Fail-open on KV trouble: ManyChat's addTagByName is itself idempotent, so
  // the worst case of a missed dedupe is one redundant API call.
  const dedupeKey = `mctag:${event}:${cid}`;
  let claimedDedupeKey = false;
  if (process.env.KV_REST_API_URL) {
    try {
      const seen = await kv.set(dedupeKey, Date.now(), {
        nx: true,
        ex: DEDUPE_TTL_SECONDS,
      });
      if (!seen) return res.status(200).json({ ok: true, deduped: true });
      claimedDedupeKey = true;
    } catch (err) {
      console.warn('mc-tag: dedupe check failed (continuing):', err.message);
    }
  }

  // Best-effort by contract. addTagBySubscriberId never throws and no-ops
  // without MANYCHAT_API_KEY, so this always answers 200 to the browser.
  const result = await addTagBySubscriberId(cid, tagName);

  // RELEASE THE CLAIM ON A REAL FAILURE. The dedupe key is written before the
  // network call, so without this a single bad minute at ManyChat leaves the
  // contact permanently untagged for 30 days with nothing retrying: the
  // browser marks the beacon sent on `r.ok` (src/utils/manychat.js) and this
  // endpoint answers 200 either way. For event 'landed' that failure is not
  // cosmetic — bw-landed is the ONLY thing that suppresses the 20h nudge, so a
  // woman who did open the link gets chased with "I do not think that link
  // ever opened for you", which is the exact outcome this endpoint exists to
  // prevent. Deleting the key lets her next page load try again.
  //
  // 'no_key' is excluded deliberately: with MANYCHAT_API_KEY absent the call
  // is a permanent no-op, so releasing would mean a pointless second KV write
  // on every single request against a 500k/month Upstash cap.
  //
  // tagged:false (ManyChat answered, but not "success") is treated as
  // retryable too. It can be permanent (contact deleted by auto-prune) or
  // transient (a 5xx), and the helper discards the body that would tell them
  // apart. Retrying costs one API call per fresh browser session, capped by
  // the per-IP rate limit above; not retrying costs a false nudge. Cheap side
  // of that trade wins.
  if (claimedDedupeKey && !result.tagged && result.reason !== 'no_key') {
    console.warn(
      `mc-tag: ${tagName} not written for ${cid} (${result.reason || 'manychat_declined'}); releasing dedupe key for retry`
    );
    try { await kv.del(dedupeKey); } catch { /* next TTL expiry clears it */ }
  }

  return res.status(200).json({ ok: true, tag: tagName, ...result });
}
