// scripts/resend-tracking-check.mjs — is Resend open/click tracking healthy?
//
//   node scripts/resend-tracking-check.mjs                 report only
//   node scripts/resend-tracking-check.mjs --enable-click  flip click_tracking ON for bpquiz.com
//                                                         (only do this once the custom tracking
//                                                          host answers 30x/200, see below)
//
// 2026-08-23 finding: bpquiz.com has a CUSTOM tracking domain in Resend
// (info.bpquiz.com → links1.resend-dns.com). Its CNAME was never created in
// Vercel DNS (a wildcard ALIAS pointed it at Vercel instead), so Resend
// silently injected NO pixel and NO link rewrite — hence 4,000 sends with zero
// opens. DNS fixed the same day (CNAME + CAA 0 issue "amazon.com"); Resend
// shows the domain verified, but the host returned HTTP 400 from CloudFront
// for the first ~15 minutes after verification. Click tracking was switched
// OFF on bpquiz.com as a guard: a rewritten CTA that 400s is a broken
// campaign. Open tracking stays ON (a dead pixel is invisible to readers).
//
// Once this script prints `host: OK`, run it again with --enable-click.

import dotenv from 'dotenv';
for (const p of ['.env', '.env.local', '.env.production']) dotenv.config({ path: p, override: false, quiet: true });

const KEY = process.env.RESEND_API_KEY;
if (!KEY) { console.error('RESEND_API_KEY not set'); process.exit(1); }
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const ENABLE = process.argv.includes('--enable-click');
const BPQUIZ_ID = '767f1f8b-2a31-4148-82b1-8b35d3421870';

const domains = (await (await fetch('https://api.resend.com/domains', { headers: H })).json()).data || [];
console.log('Resend domains:');
for (const d of domains) {
  const full = await (await fetch(`https://api.resend.com/domains/${d.id}`, { headers: H })).json();
  const tracking = (full.records || []).filter((r) => /tracking/i.test(r.record)).map((r) => `${r.record}=${r.status}`).join(' ');
  console.log(`  ${d.name.padEnd(30)} status=${full.status.padEnd(18)} open=${String(full.open_tracking).padEnd(5)} click=${String(full.click_tracking).padEnd(5)} ${tracking}`);
}

// Probe the custom tracking host. A healthy host answers a bogus click path
// with 404 or a redirect, never 400 (400 = CloudFront has no config for it).
const probe = await fetch('https://info.bpquiz.com/CL0/https:%2F%2Fbpquiz.com%2F/1/x/y', { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } }).catch((e) => ({ status: `ERR ${e.message}` }));
const healthy = typeof probe.status === 'number' && probe.status !== 400 && probe.status < 500;
console.log(`\ninfo.bpquiz.com probe: HTTP ${probe.status}  host: ${healthy ? 'OK' : 'NOT READY (leave click tracking off)'}`);

const hooks = (await (await fetch('https://api.resend.com/webhooks', { headers: H })).json()).data || [];
console.log('\nWebhooks:');
for (const w of hooks) console.log(`  ${w.endpoint}  ${w.status}  [${(w.events || []).join(', ')}]`);

if (ENABLE) {
  if (!healthy) { console.log('\nRefusing --enable-click: host not healthy yet.'); process.exit(2); }
  const r = await fetch(`https://api.resend.com/domains/${BPQUIZ_ID}`, { method: 'PATCH', headers: H, body: JSON.stringify({ click_tracking: true }) });
  console.log(`\nPATCH bpquiz.com click_tracking=true → ${r.status}`);
}
