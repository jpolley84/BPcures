// One-shot catch-up sender for 8 buyers whose Stripe webhooks failed pre-fix.
// Uses the production sendPurchaseConfirmation from api/purchase-confirmation.js
// so they get the EXACT email the webhook would've sent on day-of-purchase.
//
// Run with: RESEND_API_KEY=re_... node scripts/send-missed-buyers-2026-05-03.js

import 'dotenv/config';
import { sendPurchaseConfirmation } from '../api/purchase-confirmation.js';
import fs from 'node:fs';

const buyers = [
  { email: 'dorajones56@icloud.com',    name: 'Dora Reeves',       tier: 'vip', amount: 97.00 },
  { email: 'jtmitche_1999@yahoo.com',   name: 'Janie T Mitchell',  tier: 2,     amount: 47.00 },
  { email: 'bkgad@yahoo.com',           name: 'Bernard Gadagbui',  tier: 2,     amount: 47.00 },
  { email: 'rebena57@yahoo.com',        name: 'Rebecca Benavides', tier: 2,     amount: 47.00 },
  { email: 'michelle9hall@gmail.com',   name: 'Michelle D Hall',   tier: 2,     amount: 47.00 },
  { email: 'phyllisrene26@gmail.com',   name: 'Phyllis Emery',     tier: 1,     amount: 26.99 },
  { email: 'luvenia.truss@aol.com',     name: 'Luvenia Truss',     tier: 1,     amount: 26.99 },
  { email: 'rasjem2@gmail.com',         name: 'Robert Spring',     tier: 1,     amount: 26.99 },
];

const log = [];
let sent = 0;
let failed = 0;

for (const b of buyers) {
  try {
    await sendPurchaseConfirmation({ email: b.email, name: b.name, tier: b.tier });
    console.log(`OK  | tier=${b.tier} | $${b.amount.toFixed(2)} | ${b.email}`);
    log.push({ ...b, status: 'sent', timestamp: new Date().toISOString() });
    sent++;
  } catch (err) {
    console.error(`FAIL | tier=${b.tier} | ${b.email} | ${err.message}`);
    log.push({ ...b, status: 'failed', error: err.message, timestamp: new Date().toISOString() });
    failed++;
  }
  // Throttle: 600ms between sends to stay well below Resend rate limit (10 req/sec)
  await new Promise(r => setTimeout(r, 600));
}

console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);

const logPath = '../tmp/apology/missed-buyers-batch-2026-05-03.json';
fs.writeFileSync(new URL(logPath, import.meta.url), JSON.stringify(log, null, 2));
console.log(`Log: ${logPath}`);
