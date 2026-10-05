// Who is paying us for coaching without a signed agreement on file?
//
// WHY THIS EXISTS. On 2026-10-03 Rahab Sullivan filed $1,795 of chargebacks.
// The evidence package was strong on every point except one: we held no
// countersigned agreement from her. Her welcome email went out on 2026-09-01,
// one day before auto-attach shipped (fb73d50), so no agreement was ever
// generated for her and nothing anywhere said so.
//
// That one-day window is closed. The hole it exposed is not. A buyer whose
// plan has no entry in AGREEMENT_PLAN_FILL still gets a welcome email, still
// gets charged, and the only trace is a console.error nobody reads. This
// script turns that silence into a list.
//
// Read only. Touches nothing, sends nothing.
//
//   node scripts/agreement-audit.mjs           table
//   node scripts/agreement-audit.mjs --json    machine readable
//
// Exit code is 1 when any active client needs action, so it can be wired to a
// schedule later without further work.
import dotenv from 'dotenv';
for (const p of ['.env', '.env.local', '.env.production']) dotenv.config({ path: p, override: false, quiet: true });
import { AGREEMENT_PLAN_FILL } from '../api/_coaching-agreement.js';

const U = process.env.KV_REST_API_URL, T = process.env.KV_REST_API_TOKEN;
if (!U || !T) { console.error('KV_REST_API_URL / KV_REST_API_TOKEN missing'); process.exit(2); }
const kv = (...a) => fetch(U, { method: 'POST', headers: { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json' }, body: JSON.stringify(a) }).then(r => r.json()).then(j => j.result);
const parse = v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; } };
async function scan(p) { let c = '0', k = []; do { const [n, b] = await kv('SCAN', c, 'MATCH', p, 'COUNT', 5000); c = n; k.push(...b); } while (c !== '0'); return k; }

const JSON_OUT = process.argv.includes('--json');

// The two fields this audit reads. Nothing writes them yet, which is the
// point: until the welcome path stamps agreementSentAt and a human stamps
// agreementSignedAt, every row below reads NOT SENT, and that is the honest
// answer. Stamp a signature by hand with:
//
//   node -e "..." // see the footer this script prints
const SENT = 'agreementSentAt';
const SIGNED = 'agreementSignedAt';

const keys = (await scan('bwbp:allin:*')).filter(k => !k.startsWith('bwbp:allindone:'));
const rows = [];
for (const k of keys.sort()) {
  const r = parse(await kv('GET', k));
  if (!r) { rows.push({ email: k.slice('bwbp:allin:'.length), broken: true }); continue; }
  const email = (r.email || k.slice('bwbp:allin:'.length)).toLowerCase();
  const plan = r.plan || '';
  const hasFill = Boolean(AGREEMENT_PLAN_FILL[plan]);
  const withdrawn = r.status === 'withdrawn';
  let verdict;
  if (r[SIGNED]) verdict = 'SIGNED';
  else if (!hasFill) verdict = 'NO TEMPLATE';
  else if (r[SENT]) verdict = 'SENT, UNSIGNED';
  else verdict = 'NOT SENT';
  rows.push({
    email, firstName: r.firstName || '', plan, hasFill, withdrawn,
    status: r.status || '', confirmedAt: (r.confirmedAt || '').slice(0, 10),
    sentAt: r[SENT] || null, signedAt: r[SIGNED] || null, verdict,
  });
}

const live = rows.filter(r => !r.broken && !r.withdrawn);
const needsAction = live.filter(r => r.verdict !== 'SIGNED');
const noTemplate = live.filter(r => r.verdict === 'NO TEMPLATE');

if (JSON_OUT) {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: rows.length, live: live.length,
    needsAction: needsAction.length, noTemplate: noTemplate.length,
    rows,
  }, null, 2));
} else {
  const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
  console.log('\nCOACHING AGREEMENTS ON FILE');
  console.log('='.repeat(96));
  console.log(pad('EMAIL', 32) + pad('PLAN', 20) + pad('PAID', 12) + pad('VERDICT', 16) + 'NOTE');
  console.log('-'.repeat(96));
  for (const r of rows) {
    if (r.broken) { console.log(pad(r.email, 32) + 'UNREADABLE RECORD'); continue; }
    const note = r.withdrawn ? 'withdrawn, no action'
      : r.verdict === 'NO TEMPLATE' ? `no AGREEMENT_PLAN_FILL['${r.plan}']`
        : r.verdict === 'NOT SENT' ? 'template exists, never stamped as sent'
          : r.verdict === 'SENT, UNSIGNED' ? `sent ${String(r.sentAt).slice(0, 10)}, not returned`
            : `signed ${String(r.signedAt).slice(0, 10)}`;
    console.log(pad(r.email, 32) + pad(r.plan, 20) + pad(r.confirmedAt, 12) + pad(r.verdict, 16) + note);
  }
  console.log('-'.repeat(96));
  console.log(`${rows.length} coaching records, ${live.length} active, ${needsAction.length} without a signed agreement.`);
  if (noTemplate.length) {
    console.log(`\n${noTemplate.length} of those bought a plan with NO agreement template, so none was ever`);
    console.log('generated and the welcome email went out without one. Add each plan to');
    console.log('AGREEMENT_PLAN_FILL in api/_coaching-agreement.js, then send by hand:');
    for (const r of noTemplate) console.log(`  ${pad(r.plan, 20)} ${r.email}`);
  }
  console.log('\nNothing writes agreementSentAt or agreementSignedAt yet, so "NOT SENT" means');
  console.log('unrecorded, not proven absent. To stamp a returned signature:');
  console.log("  node scripts/agreement-audit.mjs --sign someone@example.com 2026-10-04");
}

if (process.argv.includes('--sign')) {
  const i = process.argv.indexOf('--sign');
  const email = (process.argv[i + 1] || '').toLowerCase();
  const date = process.argv[i + 2] || new Date().toISOString().slice(0, 10);
  if (!email.includes('@')) { console.error('\n--sign needs an email address'); process.exit(2); }
  const key = 'bwbp:allin:' + email;
  const r = parse(await kv('GET', key));
  if (!r) { console.error(`\nno coaching record for ${email}`); process.exit(2); }
  await kv('SET', key, JSON.stringify({ ...r, [SIGNED]: date }));
  console.log(`\nstamped ${SIGNED}=${date} on ${email}`);
  process.exit(0);
}

process.exit(needsAction.length ? 1 : 0);
