// api/capture-lead.js — email capture → state store (creates the lead).
//
// Phase 2 (agent #4 — Email + delivery). Called by the result-page EmailGate
// (agent #2) when a visitor unlocks their full result.
//
// Contract:
//   POST { firstName, email, corner, readiness, scores }
//   200  { ok: true, created: boolean }
//
//   scores is OPTIONAL: the ownable { stress, sugar, sodium } 0-100 driver
//   reading from the quiz. When present and well-formed we store it on the drip
//   record so the Day-0 lead email can open with the three numbers. A
//   driver/intensity reading, never a clinical or BP measurement.
//
// Behavior:
//   - Validate the email.
//   - Upsert bwbp:drip:<email> in state 'lead' with stateEnteredAt = now. This is
//     Day 0 of the LEAD nurture sequence (_lead-emails.js). The shared engine
//     (_state-cron.js) reads state + stateEnteredAt to decide what to send, and
//     personalizes on firstName + corner + readiness.
//   - Idempotent: re-submitting the same email does NOT reset an existing
//     record's state / stateEnteredAt (we never restart someone's sequence) and
//     never demotes a buyer back to 'lead'. We only enrich missing fields.
//   - The daily cron picks up Day 0 on its next run (we do not fire a send from
//     here, to keep this endpoint fast and side-effect-light).
//
// Secrets are server-side only (KV via process.env). The state shape written
// here is the canonical drip record the webhook + crons expect:
//   {
//     email, firstName, corner, readiness,
//     state: 'lead', stateEnteredAt, enrolledAt, source: 'quiz-result'
//   }

import { kv } from '@vercel/kv';

const VALID_CORNERS = new Set(['stress', 'sugar', 'sodium']);

function looksLikeEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function clean(s, max = 120) {
  return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

// Sanitize the optional driver score. Accepts only an object carrying all three
// corners as finite numbers; clamps each to an integer 0-100. Anything else
// (missing, partial, malformed) returns null so we simply do not store it.
function cleanScores(s) {
  if (!s || typeof s !== 'object') return null;
  const out = {};
  for (const key of ['stress', 'sugar', 'sodium']) {
    const v = s[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    out[key] = Math.max(0, Math.min(100, Math.round(v)));
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body, expected JSON' });
  }

  const { firstName, email, corner, readiness, scores, tags, source } = req.body;
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const normEmail = String(email).trim().toLowerCase();
  const normFirst = clean(firstName, 80);
  const normCorner = VALID_CORNERS.has(corner) ? corner : null;
  const normReadiness = clean(readiness, 60) || null;
  const normScores = cleanScores(scores);
  // Optional caller markers (e.g. the /case-review sold-out waitlist sends
  // tags:['casereview-waitlist']). Sanitized: short strings only, max 5.
  const normTags = Array.isArray(tags)
    ? tags.map((t) => clean(t, 40)).filter(Boolean).slice(0, 5)
    : [];
  const normSource = clean(source, 40) || null;

  try {
    const dripKey = `bwbp:drip:${normEmail}`;
    const existing = await kv.get(dripKey);

    if (existing) {
      // Enrich only. Never clobber an in-flight sequence's state/timer, and
      // never demote a buyer back to a lead.
      await kv.set(dripKey, {
        ...existing,
        firstName: existing.firstName || normFirst,
        corner: existing.corner || normCorner,
        readiness: existing.readiness || normReadiness,
        scores: existing.scores || normScores,
        ...(normTags.length
          ? { tags: Array.from(new Set([...(existing.tags || []), ...normTags])) }
          : {}),
        lastCaptureAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, created: false });
    }

    const now = new Date().toISOString();
    await kv.set(dripKey, {
      email: normEmail,
      firstName: normFirst,
      corner: normCorner,
      readiness: normReadiness,
      scores: normScores,
      state: 'lead',
      stateEnteredAt: now,
      enrolledAt: now,
      source: normSource || 'quiz-result',
      ...(normTags.length ? { tags: normTags } : {}),
    });
    return res.status(200).json({ ok: true, created: true });
  } catch (err) {
    console.error('capture-lead: KV write failed', err.message);
    return res.status(500).json({ error: 'Failed to capture lead' });
  }
}
