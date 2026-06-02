// scripts/smoke-test-luvenia-intake.mjs
// Local end-to-end smoke test of /api/luvenia-intake. Constructs a mock
// req/res, invokes the handler directly, and reports outcome. Hits live
// KV + Resend, so this DOES send Joel an email — but body is clearly
// marked [SMOKE TEST] so it's obvious.

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

const handler = (await import('../api/luvenia-intake.js')).default;

const sampleAnswers = {
  full_name: '[SMOKE TEST] Luvenia N Truss',
  age: '58',
  weight: '172 lb',
  location: 'Smoke Test, TN',
  bp_typical: '148/92',
  bp_highest: '178/104',
  bp_lowest: '128/82',
  bp_meds: ['Lisinopril / Enalapril (ACE inhibitor)', 'Amlodipine / Norvasc (calcium channel)'],
  meds_history: '5–10 years',
  meds_working: 'Numbers dropped at first, plateaued, now creeping back',
  sleep_falling: 'sometimes',
  sleep_staying: 'wake at 3 AM, hard to fall back',
  morning_energy: 'wired but tired',
  daily_stress_sources: ['family/caregiving', 'work', 'finances'],
  belly_weight_pattern: 'last 3-5 years, accelerating',
  recent_labs: 'A1c 5.9, LDL 132, kidney normal',
  family_diabetes: 'Mother type 2, sister pre-diabetic',
  breakfast_typical: 'Coffee with creamer + toast OR oatmeal with brown sugar',
  caffeine_amount: '3-4 cups/day',
  alcohol_pattern: '1-2 glasses wine on weekends',
  movement_current: 'Walking 2-3x/week, 20 min',
  water_glasses: '4-5',
  outdoor_time: '30-60 minutes most days',
  sleep_hours: '6-7',
  faith_practice: 'Baptist, attend Sunday',
  three_am_mind: 'My daughter, her health, what happens if I am not here',
  top_3_goals: '1) Get off at least one med 2) Sleep through the night 3) Lose belly weight',
};

const req = {
  method: 'POST',
  body: { answers: sampleAnswers, submittedAt: new Date().toISOString() },
  query: {},
  headers: {},
};

let status = null;
let body = null;
const res = {
  status(code) { status = code; return res; },
  json(payload) { body = payload; return res; },
  setHeader() { return res; },
  send() { return res; },
};

console.log('Invoking /api/luvenia-intake handler with mock request...\n');
await handler(req, res);

console.log('Response status:', status);
console.log('Response body:', JSON.stringify(body, null, 2));

if (status === 200 && body?.ok) {
  console.log('\n✅ SMOKE TEST PASSED');
  console.log('   - Handler returned 200');
  console.log('   - intakeId:', body.intakeId);
  console.log('   - Check braveworksrn@gmail.com for the test email + PDF attachment');
} else {
  console.log('\n❌ SMOKE TEST FAILED');
  console.log('   - Status:', status);
  console.log('   - Body:', body);
  process.exit(1);
}
