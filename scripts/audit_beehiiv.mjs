// audit_beehiiv.mjs — Validate beehiiv API access + count active subs
const KEY = process.env.BEEHIIV_API_KEY;
const PUB = process.env.BEEHIIV_PUB_ID;
if (!KEY || !PUB) { console.error('Missing BEEHIIV_API_KEY or BEEHIIV_PUB_ID'); process.exit(1); }

const url = new URL(`https://api.beehiiv.com/v2/publications/${PUB}/subscriptions`);
url.searchParams.set('status', 'active');
url.searchParams.set('limit', '1');

const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
const text = await r.text();
let j;
try { j = JSON.parse(text); } catch { j = null; }

if (!r.ok) {
  console.log(JSON.stringify({ ok: false, status: r.status, error: text.slice(0, 500) }, null, 2));
  process.exit(0);
}

// Pagination shape inspection
const pag = j?.page ?? j?.pagination ?? {};
const totalActive = j?.total_results ?? pag?.total_results ?? pag?.total ?? j?.total ?? null;

// Try publication endpoint for stats
const url2 = new URL(`https://api.beehiiv.com/v2/publications/${PUB}`);
url2.searchParams.set('expand[]', 'stats');
const r2 = await fetch(url2, { headers: { Authorization: `Bearer ${KEY}` } });
const j2 = r2.ok ? await r2.json() : null;
const stats = j2?.data?.stats || null;

console.log(JSON.stringify({
  ok: true,
  total_active_subscribers: totalActive,
  publication_stats: stats,
  paging_keys: Object.keys(j || {}),
  pagination_block: pag,
  api_status: r.status,
  publication_id: PUB,
  sample_first_subscription_email: j?.data?.[0]?.email || null,
}, null, 2));
