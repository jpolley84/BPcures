#!/usr/bin/env node
/**
 * daily-review.mjs — automated data-gathering for the daily Gap & Gain review.
 *
 * Pulls live data from Stripe + git + Vercel runtime + workspace state, then
 * writes a starter markdown report to:
 *   memory/reports/daily-review-YYYY-MM-DD-{morning|evening}.md
 *
 * The Head Agent reads that scaffold and adds the synthesis (gains, gaps,
 * code changes, strategic shifts) — this script only does the data part so
 * the synthesis is fast and the numbers are never wrong.
 *
 * Usage:
 *   node scripts/daily-review.mjs               # auto-detects morning/evening
 *   node scripts/daily-review.mjs --label=foo   # custom suffix
 *   node scripts/daily-review.mjs --hours=24    # window for Stripe + git
 *
 * Cron suggestion: 8 AM CDT + 8 PM CDT in vercel.json (13/01 UTC daily).
 */

import 'dotenv/config';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('NO STRIPE_SECRET_KEY in env. Aborting.');
  process.exit(1);
}

// ---------- args
const args = Object.fromEntries(
  process.argv.slice(2).flatMap(a => {
    const m = a.match(/^--(\w+)=(.*)$/);
    return m ? [[m[1], m[2]]] : [];
  })
);
const HOURS = Number(args.hours || 24);
const SLOT = args.label || (new Date().getUTCHours() < 12 ? 'morning' : 'evening');
const DATE = new Date().toISOString().slice(0, 10);

// Workspace = parent of bpquiz-site
const WORKSPACE = resolve(process.cwd(), '..');
const REPORTS_DIR = join(WORKSPACE, 'memory', 'reports');
const OUT_PATH = join(REPORTS_DIR, `daily-review-${DATE}-${SLOT}.md`);

if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

// ---------- Stripe
const since = Math.floor(Date.now() / 1000) - HOURS * 3600;
const STRIPE_HEADERS = {
  Authorization: `Bearer ${STRIPE_KEY}`,
  'Stripe-Version': '2024-04-10',
};

async function fetchStripeSessions() {
  const sessions = [];
  let startingAfter = null;
  for (let i = 0; i < 5; i++) {
    const qs = new URLSearchParams({ 'created[gte]': String(since), limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${qs}`, { headers: STRIPE_HEADERS });
    if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
    const j = await res.json();
    sessions.push(...j.data);
    if (!j.has_more) break;
    startingAfter = j.data[j.data.length - 1]?.id;
  }
  return sessions;
}

// ---------- git
function gitLog(repo, hours) {
  try {
    return execSync(
      `git -C "${repo}" log --since="${hours} hours ago" --pretty=format:"%h | %ad | %s" --date=short`,
      { encoding: 'utf8' }
    ).trim();
  } catch {
    return '(git log failed)';
  }
}

function gitStatus(repo) {
  try {
    const out = execSync(`git -C "${repo}" status --short`, { encoding: 'utf8' }).trim();
    return out || '(clean)';
  } catch {
    return '(git status failed)';
  }
}

// ---------- main
(async () => {
  const sessions = await fetchStripeSessions();
  const paid = sessions.filter(s => s.payment_status === 'paid');
  const open = sessions.filter(s => s.status === 'open');
  const expired = sessions.filter(s => s.status === 'expired');
  const grossCents = paid.reduce((sum, s) => sum + (s.amount_total || 0), 0);

  const sortedPaid = paid.sort((a, b) => b.created - a.created);

  const bpquizRepo = process.cwd();
  const recentBpquizCommits = gitLog(bpquizRepo, HOURS);
  const bpquizStatus = gitStatus(bpquizRepo);
  const workspaceStatus = gitStatus(WORKSPACE);

  // SORRY promo redemptions (heuristic: amount_total < amount_subtotal)
  const sorryRedemptions = paid.filter(
    s => s.amount_subtotal != null && s.amount_total < s.amount_subtotal
  ).length;

  // Build the markdown scaffold
  const md = `# Daily Review — ${DATE} (${SLOT})

> Auto-generated data scaffold. Head Agent adds synthesis below.
> Window: last ${HOURS} hours.

---

## DATA SNAPSHOT

### Stripe — last ${HOURS}h
- **Total sessions:** ${sessions.length}
- **✅ Paid:** ${paid.length}
- **📂 Open:** ${open.length}
- **⌛ Expired:** ${expired.length}
- **Gross:** $${(grossCents / 100).toFixed(2)}
- **SORRY redemptions:** ${sorryRedemptions} of ${paid.length} paid (${paid.length ? Math.round((sorryRedemptions / paid.length) * 100) : 0}%)

### Paid sessions (most recent first)
\`\`\`
${sortedPaid.length === 0
  ? '(no paid sessions in this window)'
  : sortedPaid.slice(0, 20).map(s => {
      const when = new Date(s.created * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const amt = (s.amount_total / 100).toFixed(2);
      const sub = s.amount_subtotal != null ? (s.amount_subtotal / 100).toFixed(2) : '—';
      const email = s.customer_details?.email || '(no email)';
      return `${when}  $${amt.padStart(7)} (sub $${sub})  ${email}`;
    }).join('\n')}
\`\`\`

### Recent commits (last ${HOURS}h)

**bpquiz-site:**
\`\`\`
${recentBpquizCommits || '(no commits)'}
\`\`\`

### Working-tree state

**bpquiz-site:**
\`\`\`
${bpquizStatus}
\`\`\`

**workspace:**
\`\`\`
${workspaceStatus}
\`\`\`

---

## SYNTHESIS (Head Agent fills in)

### 1 · Gains since last review
- (todo)

### 2 · Gaps surfaced
- (todo)

### 3 · Code changes proposed
- (todo)

### 4 · Strategic shift (Hardy 10x lens)
- What is the 20% that's selling today?
- What 80% is dead weight that can be cut?
- What does the $30K/month future self require?

### 5 · Cron & agent health
- (check Vercel runtime logs separately)
- (check ~/.claude/scheduled-tasks/ heartbeats)

### 6 · Top 3 actions before next review
1. (todo)
2. (todo)
3. (todo)

---

*Scaffold generated by \`scripts/daily-review.mjs\`. Last data pull: ${new Date().toISOString()}.*
`;

  writeFileSync(OUT_PATH, md, 'utf8');
  console.log(`\n✅ Daily review scaffold written to:\n   ${OUT_PATH}\n`);
  console.log(`Sessions in window: ${sessions.length} (${paid.length} paid, $${(grossCents / 100).toFixed(2)} gross)`);
  console.log(`Commits in window:  ${recentBpquizCommits ? recentBpquizCommits.split('\n').length : 0}`);
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
