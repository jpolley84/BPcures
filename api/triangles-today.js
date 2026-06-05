// api/triangles-today.js — GET. Returns today's BP Triangle quiz-completion
// count for the live homepage counter. Incremented in api/lead-magnet.js on
// every quiz submission. This is a completion counter, NOT an outcomes claim.
//
// Response: { today: <number>, community: <number>, date: 'YYYY-MM-DD' }
//
// `community` is the standing BraveWorks community size (Skool members) so the
// hero line reads "X mapped today · joining 1,237 in the community" — the
// community number carries the social proof early in the day when `today` is
// still small. Bump COMMUNITY_BASE as the real Skool count grows.

import { kv } from '@vercel/kv';

const COMMUNITY_BASE = 1237; // Skool members as of 2026-06-04 import

export default async function handler(req, res) {
  // Short edge cache so the hero stays snappy without hammering KV. 30s.
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  const dayKey = new Date().toISOString().slice(0, 10);
  let today = 0;
  try {
    today = (await kv.get(`triangles:${dayKey}`)) || 0;
  } catch (err) {
    console.warn('triangles-today: KV read failed', err.message);
  }

  return res.status(200).json({
    today: Number(today) || 0,
    community: COMMUNITY_BASE,
    date: dayKey,
  });
}
