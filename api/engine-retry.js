// api/engine-retry.js: finish Expertise Snapshots the model could not write.
//
// Groq's free tier caps each model at 200,000 tokens a DAY and 8,000 a minute.
// When both pools are empty, engine-interview.js stores the answers, hands the
// page a "still reviewing" result, and drops the sid in eee:pending. This cron
// (every 20 minutes) retries the analysis and sends the email the moment a
// pool has room. Nothing here re-asks the person anything.
import { kv } from '@vercel/kv';
import { isAuthorizedCron } from './_cron-auth.js';
import { analyze, deliverSnapshot, EEE_KEYS as K, RESULT_TTL } from './engine-interview.js';
import { captureEvent } from './_posthog.js';

export const config = { maxDuration: 60 };
const BUDGET_MS = 50_000;

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) return res.status(401).json({ error: 'unauthorized' });
  const t0 = Date.now();
  let sids = [];
  try { sids = await kv.smembers(K.pending); } catch (err) { return res.status(503).json({ error: 'kv', message: err.message }); }
  const out = { pending: sids.length, finished: 0, emailed: 0, stillPending: 0, dropped: 0 };

  for (const sid of sids) {
    if (Date.now() - t0 > BUDGET_MS) { out.stillPending++; continue; }
    let rec = null;
    try { rec = await kv.get(K.result(sid)); } catch { /* noop */ }
    if (!rec?.transcript?.length) { try { await kv.srem(K.pending, sid); } catch { /* noop */ } out.dropped++; continue; }
    if (rec.result && !rec.result.degraded) { try { await kv.srem(K.pending, sid); } catch { /* noop */ } out.dropped++; continue; }
    try {
      const result = await analyze({ name: rec.firstName, stage: rec.stage, transcript: rec.transcript });
      const ttlLeft = Math.max(3600, RESULT_TTL - Math.floor((Date.now() - Date.parse(rec.createdAt || 0)) / 1000));
      await kv.set(K.result(sid), { ...rec, result, retriedAt: new Date().toISOString() }, { ex: ttlLeft });
      await kv.srem(K.pending, sid);
      out.finished++;
      if (rec.email && await deliverSnapshot({ sid, email: rec.email, result })) out.emailed++;
      captureEvent({ distinctId: rec.email || sid, event: 'eee_snapshot_retried', properties: { sid, emailed: Boolean(rec.email) } }).catch(() => {});
    } catch (err) {
      // Still no quota (429) or another outage: leave it for the next run.
      out.stillPending++;
      if (err.status !== 429) console.error('engine-retry:', sid, err.message);
      if (err.status === 429) break; // no point hammering the same empty pool this run
    }
  }
  return res.status(200).json({ ok: true, ...out, ms: Date.now() - t0 });
}
