// api/_manychat-tag.js — tag a ManyChat contact "Purchased" by email.
//
// DM Engine Revamp (2026-08-10): the 3-day auto-prune was provably deleting
// buyers mid-purchase (Dianna Mcwhorter, $96, pruned while saying she'd buy
// more). Fix: on every Stripe purchase, find the ManyChat contact by email
// and add the "Purchased" tag; the prune flow (Phase 2 builder session) skips
// tagged contacts, and +20h nudges condition on it.
//
// DORMANT-SAFE: no MANYCHAT_API_KEY env var -> silent no-op. Best-effort by
// design — a tag failure must never affect purchase delivery. ManyChat public
// API (page-scoped token, format "<pageID>:<secret>"):
//   GET  /fb/subscriber/findBySystemField?email=...
//   POST /fb/subscriber/addTagByName  { subscriber_id, tag_name }
const MC_BASE = 'https://api.manychat.com';

export async function tagPurchasedByEmail(email) {
  const key = process.env.MANYCHAT_API_KEY;
  if (!key || !email) return { skipped: true };
  try {
    const find = await fetch(
      `${MC_BASE}/fb/subscriber/findBySystemField?email=${encodeURIComponent(String(email).trim().toLowerCase())}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const fj = await find.json();
    const sub = fj?.data?.id ? fj.data : (Array.isArray(fj?.data) ? fj.data[0] : null);
    if (!sub?.id) return { skipped: true, reason: 'not_found' };
    const tag = await fetch(`${MC_BASE}/fb/subscriber/addTagByName`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriber_id: sub.id, tag_name: 'Purchased' }),
    });
    const tj = await tag.json();
    return { tagged: tj?.status === 'success', subscriberId: sub.id };
  } catch (err) {
    console.warn('manychat-tag: best-effort failure', err.message);
    return { skipped: true, reason: 'error' };
  }
}
