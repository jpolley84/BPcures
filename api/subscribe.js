// POST /api/subscribe — footer newsletter capture.
//
// 2026-06-09: created. Footer.jsx has POSTed here since launch, but this
// endpoint never existed — the SPA rewrite served index.html with a 200,
// so every footer subscribe on /quiz, /start, /blog/*, /about/joel and the
// legal pages was silently lost while the visitor saw "You're on the list."
//
// Enrolls into the KV drip:* state machine as a 'lead' (source
// 'footer-newsletter'); the daily lead-cron sends Day 0 on its next run.
// No instant email here — the footer promises "one email a week", and the
// lead arc's Day 0 is the right first touch.
import { kv } from '@vercel/kv';
import { looksLikeValidEmail } from './_email-validation.js';

// Simple per-IP rate limit, same posture as lead-magnet.js (10/hr).
const RATE_LIMIT = 10;
const RATE_WINDOW_S = 3600;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!looksLikeValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!process.env.KV_REST_API_URL) {
    console.error('subscribe: KV_REST_API_URL missing — capture lost');
    return res.status(500).json({ error: 'Storage unavailable' });
  }

  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const rlKey = `rl:subscribe:${ip}`;
    const hits = await kv.incr(rlKey);
    if (hits === 1) await kv.expire(rlKey, RATE_WINDOW_S);
    if (hits > RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  } catch (rlErr) {
    console.warn('subscribe: rate-limit check failed (continuing)', rlErr.message);
  }

  const emailLower = String(email).trim().toLowerCase();
  const dripKey = `drip:${emailLower}`;
  const nowIso = new Date().toISOString();

  try {
    const existing = await kv.get(dripKey);
    if (existing) {
      // Already known — refresh the tag, never downgrade a buyer's state.
      // Records parked in dead 'newsletter' state re-enter the lead arc
      // (same re-opt-in rule as lead-magnet.js, 2026-06-09).
      const reEnterLead = !existing.state || existing.state === 'newsletter';
      await kv.set(dripKey, {
        ...existing,
        tags: Array.from(new Set([...(existing.tags || []), 'footer-newsletter'])),
        ...(reEnterLead ? { state: 'lead', stateEnteredAt: nowIso } : {}),
      });
    } else {
      await kv.set(dripKey, {
        email: emailLower,
        firstName: '',
        cohort: 'newsletter',
        enrolledAt: nowIso,
        firstSeen: nowIso,
        lastSentDay: 0,
        optedIn: true, // submitting the form IS the opt-in
        source: 'footer-newsletter',
        tags: ['footer-newsletter'],
        state: 'lead',
        stateEnteredAt: nowIso,
      });
    }
    // Daily lead-log set (same instrumentation as lead-magnet.js).
    try {
      const dayKey = nowIso.slice(0, 10);
      await kv.sadd(`lead-log:${dayKey}`, emailLower);
      await kv.expire(`lead-log:${dayKey}`, 90 * 86400);
    } catch (logErr) {
      console.warn('subscribe: lead-log write failed (non-fatal)', logErr.message);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('subscribe: KV enroll failed', err.message);
    return res.status(500).json({ error: 'Capture failed' });
  }
}
