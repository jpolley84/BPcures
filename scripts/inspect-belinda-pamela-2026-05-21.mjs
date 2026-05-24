// scripts/inspect-belinda-pamela-2026-05-21.mjs
//
// Diagnostic one-shot for two inbox complaints:
//   - btovarez@gmail.com (Belinda Tovarez) — clicked Day 7 continue link, failed,
//     wants to be manually advanced to Days 8-30
//   - mimi.cooper7@gmail.com (Pamela Cooper) — only got 1 email since 5/18,
//     wants daily drip to actually fire
//
// Reads each drip:<email> record, prints state/lastSentDay/cohort/paused/etc.
// Read-only. Does not modify.

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1'));
  const repoRoot = path.resolve(here, '..');
  for (const file of ['.env.local', '.env']) {
    const p = path.join(repoRoot, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=\"?([^\"]+)\"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

const { kv } = await import('@vercel/kv');

const emails = [
  ['btovarez@gmail.com', 'Belinda Tovarez — Day 7 continue link failed'],
  ['mimi.cooper7@gmail.com', 'Pamela Cooper — missing daily emails since 5/18'],
];

for (const [email, label] of emails) {
  const key = `drip:${email}`;
  const rec = await kv.get(key);
  console.log('\n' + '═'.repeat(60));
  console.log(label);
  console.log(`Key: ${key}`);
  console.log('═'.repeat(60));
  if (!rec) {
    console.log('  ❌ NO RECORD FOUND — never enrolled or got deleted');
  } else {
    console.log(JSON.stringify(rec, null, 2));
  }
}
