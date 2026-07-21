// api/_ops-metrics.js — tiny daily counters for the /ops "Today's Funnel" tile.
//
// Why counters and not a live scan: the drip store is 8,500+ records and the
// dashboard polls every 10s, so counting today's enrollments by scanning would
// time out. Instead we INCR a per-day key at the moment the event happens and
// read it O(1). Counters are going-forward: they start at 0 each ET day and
// only reflect events after this shipped, which is correct for a "today" tile.
//
// Keys: metric:<name>:<YYYY-MM-DD ET>  (e.g. metric:quiz:2026-07-21)
// Names in use: 'quiz' (quiz email gate submitted), 'drip-new' (a NEW drip
// record created, not a re-submit).
import { kv } from '@vercel/kv';

const TZ = 'America/New_York';

// Today's date in ET as YYYY-MM-DD. Day boundary matches the rest of /ops
// (midnight ET), so the funnel tile and the revenue tile roll over together.
export function etDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// Increment today's counter. Never throws into a caller: a metrics miss must
// never fail a lead capture or a purchase. Sets a 45-day expiry so old daily
// keys clean themselves up.
export async function bumpMetric(name) {
  try {
    const key = `metric:${name}:${etDate()}`;
    await kv.incr(key);
    await kv.expire(key, 60 * 60 * 24 * 45);
  } catch {
    /* analytics only — swallow */
  }
}

// Read today's value for a metric (0 if unset).
export async function readMetricToday(name) {
  try {
    const v = await kv.get(`metric:${name}:${etDate()}`);
    return Number(v) || 0;
  } catch {
    return 0;
  }
}
