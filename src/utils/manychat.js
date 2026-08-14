// ManyChat arrival beacons — the browser half of the tagging contract.
//
// ManyChat rebuild, 2026-08-14. Every DM link the automation sends now carries
// `mcp={{cuid}}` (BraveWorks-DM-Template-2026-08-14.md §3 + §9 pre-flight 7).
// This module reads that param, remembers it for the rest of the session, and
// posts two arrival facts back to /api/mc-tag:
//
//   landed  the DM link actually opened. ManyChat tags her "bw-landed", which
//           is the ONLY condition that suppresses the one 20h nudge. The
//           design picked a site-written tag over ManyChat's own click state
//           on purpose: the click state is not reliable enough to gate a send.
//   quiz    she finished the quiz. ManyChat tags her "took-quiz", which the
//           morning triage reads as enrichment (skip rung 4, unlock rung 5).
//
// Everything here is fire-and-forget and every call is try/caught. A visitor
// must never see a slower page, a console explosion, or a broken quiz because
// ManyChat, KV, or the network had a bad minute. Same rule analytics.js runs
// under: this never blocks or breaks UX.
//
// No PostHog, no cookies, no personal data. The contact id is an opaque
// ManyChat id that arrived in the URL she was sent; we hand it back to the
// system that issued it and store it in sessionStorage so a completion two
// routes later still knows who she is.

const PARAM = 'mcp';
const STORE_KEY = 'bwbp_mcp';
// Same shape the server validates (api/mc-tag.js CID_RE). Kept in sync by
// hand: an id that fails here is simply ignored rather than posted.
const CID_RE = /^[A-Za-z0-9_-]{5,64}$/;

function sanitizeCid(raw) {
  if (typeof raw !== 'string') return '';
  const v = raw.trim();
  return CID_RE.test(v) ? v : '';
}

function readParam() {
  try {
    return sanitizeCid(new URLSearchParams(window.location.search).get(PARAM) || '');
  } catch {
    return '';
  }
}

function readStored() {
  try {
    return sanitizeCid(sessionStorage.getItem(STORE_KEY) || '');
  } catch {
    return '';
  }
}

function store(cid) {
  try { sessionStorage.setItem(STORE_KEY, cid); } catch { /* private mode */ }
}

// The contact id for this visit: the URL wins, the session remembers. Returns
// '' for the ~everyone who did not arrive from a DM link.
export function getManychatContactId() {
  return readParam() || readStored();
}

// Two guards, on purpose.
//   inFlight  kills a duplicate call inside THIS page load (double mount,
//             double submit) without touching storage.
//   sessionStorage marker is written only AFTER the server confirms, so a
//             beacon lost to a dead network is retried on her next page load
//             instead of being marked done and forgotten. The server dedupes
//             for 30 days (KV NX), so a retry costs nothing.
const inFlight = new Set();

function markSent(event, cid) {
  try { sessionStorage.setItem(`${STORE_KEY}_${event}`, cid); } catch { /* private mode */ }
}

function alreadyConfirmed(event, cid) {
  try {
    return sessionStorage.getItem(`${STORE_KEY}_${event}`) === cid;
  } catch {
    return false; // storage blocked: let the server's dedupe do the work
  }
}

function post(event, cid) {
  if (!cid) return;
  const guard = `${event}:${cid}`;
  if (inFlight.has(guard) || alreadyConfirmed(event, cid)) return;
  inFlight.add(guard);
  try {
    // keepalive so the beacon survives the navigation that often follows the
    // event that triggered it (quiz gate -> offer screen, link -> next page).
    fetch('/api/mc-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid, event }),
      keepalive: true,
    })
      .then((r) => { if (r && r.ok) markSent(event, cid); })
      .catch(() => { /* ManyChat being down must never surface here */ });
  } catch { /* noop */ }
}

// Called once at boot (src/main.jsx), before React mounts. Not a React effect
// on purpose: StrictMode double-invokes effects, and this needs to run on
// static-ish entry points too.
export function initManychatLanding() {
  if (typeof window === 'undefined') return;
  const cid = readParam();
  if (!cid) return;
  store(cid);
  post('landed', cid);
}

// Called from each quiz's email gate the moment the capture POST is away.
// No-ops for every visitor who did not arrive from a DM link.
export function tagQuizTaken() {
  post('quiz', getManychatContactId());
}
