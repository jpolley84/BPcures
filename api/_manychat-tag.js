// api/_manychat-tag.js — the ONE ManyChat tagging client. Nothing else in this
// repo should open a socket to api.manychat.com.
//
// DM Engine Revamp (2026-08-10): the 3-day auto-prune was provably deleting
// buyers mid-purchase (Dianna Mcwhorter, $96, pruned while saying she'd buy
// more). Fix: on every Stripe purchase, find the ManyChat contact by email
// and add the "Purchased" tag; the prune flow (Phase 2 builder session) skips
// tagged contacts, and +20h nudges condition on it.
//
// ManyChat rebuild (2026-08-14): the site now also writes back two arrival
// facts the DM template conditions on (BraveWorks-DM-Template-2026-08-14.md §7)
//   bw-landed  — she actually reached bpquiz.com from a DM link. This is what
//                suppresses the 20h nudge, and the design chose it over
//                ManyChat's own click state because it is more reliable.
//   took-quiz  — she finished the quiz. Enrichment only, never a branch.
// Those two are driven by api/mc-tag.js, which calls addTagBySubscriberId()
// below. The tag-name allowlist lives THERE, not here.
//
// DORMANT-SAFE: no MANYCHAT_API_KEY env var -> silent no-op. Best-effort by
// design — a tag failure must never affect purchase delivery or a page render.
// ManyChat public API (page-scoped token, format "<pageID>:<secret>"):
//   GET  /fb/subscriber/findBySystemField?email=...
//   POST /fb/subscriber/addTagByName  { subscriber_id, tag_name }
// The /fb/ prefix is legacy naming, not a channel selector: Instagram contacts
// under the same page token are addressed through the same routes.
const MC_BASE = 'https://api.manychat.com';

// Add one tag to one already-known subscriber id. Never throws. Returns
// { tagged } on a real answer, { skipped, reason } on anything else.
export async function addTagBySubscriberId(subscriberId, tagName) {
  const key = process.env.MANYCHAT_API_KEY;
  if (!key) return { skipped: true, reason: 'no_key' };
  if (!subscriberId || !tagName) return { skipped: true, reason: 'bad_args' };
  try {
    const tag = await fetch(`${MC_BASE}/fb/subscriber/addTagByName`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriber_id: String(subscriberId), tag_name: tagName }),
    });
    const tj = await tag.json().catch(() => null);
    return { tagged: tj?.status === 'success', subscriberId: String(subscriberId) };
  } catch (err) {
    console.warn('manychat-tag: addTagBySubscriberId best-effort failure', err.message);
    return { skipped: true, reason: 'error' };
  }
}

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
    return await addTagBySubscriberId(sub.id, 'Purchased');
  } catch (err) {
    console.warn('manychat-tag: best-effort failure', err.message);
    return { skipped: true, reason: 'error' };
  }
}
