#!/usr/bin/env node
// Regression tests for api/dm-router.js layer-1 (deterministic) classification.
//
// Layer 1 is the only layer that runs without an API key, and it is the layer
// that decides whether a clinical message can be handed a product link. These
// cases are drawn from REAL inbound messages in memory/inbox-triage/ — the two
// 2026-08-14 emergencies both arrived under the keyword "Tea".
//
//   PYTHONIOENCODING is irrelevant here; run with:  node tests/verify-dm-router.mjs
//
// Exit code 0 = all pass. Non-zero = a regression; do NOT deploy.

import { RED_FLAG, CLINICAL_MARKER, keywordLane } from '../api/dm-router.js';

// Mirrors the handler's layer-1 decision, minus KV and the LLM call.
function layer1(text) {
  const t = String(text).trim();
  if (!t) return 'other';
  if (RED_FLAG.test(t)) return 'redflag';
  const kw = keywordLane(t);
  if (kw) return kw;
  return null; // would fall through to the LLM
}

const CASES = [
  // ── the two real 2026-08-14 emergencies, verbatim ──────────────────────
  { text: 'Help me with my BP, yesterday it was 188/103', expect: 'redflag',
    note: 'Shirley Jopi — commented "Tea", then this' },
  { text: 'I have high blood pressure all the time now it damage my kidneys im stages 4 kidneys disease Chf also well',
    expectNot: ['buyer_tea', 'buyer_quiz', 'buyer_mag', 'skool'],
    note: 'Lotarsha Carter — commented "Tea", then this' },

  // ── the exact bug the 08-14 research found by execution ────────────────
  { text: 'I want the tea, I have stage 4 kidney disease and heart failure',
    expectNot: ['buyer_tea'], note: 'THE BUG: sold tea to stage-4 CKD before the fix' },
  { text: 'does the tea work if im on dialysis', expectNot: ['buyer_tea'] },
  { text: 'can I drink steady with chf', expectNot: ['buyer_tea'] },
  { text: 'tea for my heart failure?', expectNot: ['buyer_tea'] },
  { text: 'is the tea ok with renal disease', expectNot: ['buyer_tea'] },
  { text: 'I have hypertension, does the tea help', expectNot: ['buyer_tea'] },
  { text: 'tea please, im on lisinopril', expectNot: ['buyer_tea'] },
  { text: 'will the magnesium interact with my meds', expectNot: ['buyer_mag'] },
  { text: 'quiz link please, I had a transplant', expectNot: ['buyer_quiz'] },

  // ── clean buyers MUST still shortcut (no over-blocking) ────────────────
  { text: 'Tea', expect: 'buyer_tea' },
  { text: 'Tea please! and thanks for your wisdom', expect: 'buyer_tea',
    note: 'Sandra Harris — the Default Reply ate this one' },
  { text: 'how do I order the steady tea', expect: 'buyer_tea' },
  { text: 'send me the link', expect: 'buyer_quiz' },
  { text: 'I want the quiz', expect: 'buyer_quiz' },
  { text: 'tell me about magnesium', expect: 'buyer_mag' },
  { text: 'how do I join the group', expect: 'skool' },

  // ── ops/optout never yield to clinical (by design) ─────────────────────
  { text: 'I was charged twice for my order', expect: 'ops' },
  { text: 'where is my tea, I ordered it for my blood pressure', expect: 'ops',
    note: 'ops outranks the tea keyword AND does not yield to clinical' },
  { text: 'unsubscribe', expect: 'optout' },
  { text: "don't message me", expect: 'optout' },

  // ── red flags always win ───────────────────────────────────────────────
  { text: 'chest pain and my arm is numb', expect: 'redflag' },
  { text: 'my bp is 210/115 should I take the tea', expect: 'redflag' },
  { text: 'I want to kill myself', expect: 'redflag' },
  { text: 'having trouble breathing since this morning', expect: 'redflag' },

  // ── falls through to the LLM (null) — not a failure ────────────────────
  { text: 'thank you so much for what you do', expect: null },
  { text: 'hello', expect: null },
];

let failed = 0;
let passed = 0;

for (const c of CASES) {
  const got = layer1(c.text);
  let ok = true;
  let why = '';

  if (Object.prototype.hasOwnProperty.call(c, 'expect')) {
    ok = got === c.expect;
    why = `expected ${JSON.stringify(c.expect)}, got ${JSON.stringify(got)}`;
  } else if (c.expectNot) {
    ok = !c.expectNot.includes(got);
    why = `must NOT be one of ${JSON.stringify(c.expectNot)}, got ${JSON.stringify(got)}`;
    if (ok && got === null) why = 'falls through to LLM (safe: no product shortcut)';
  }

  if (ok) {
    passed++;
    console.log(`  PASS  ${JSON.stringify(c.text).slice(0, 72)}  ->  ${got}`);
  } else {
    failed++;
    console.log(`  FAIL  ${JSON.stringify(c.text).slice(0, 72)}`);
    console.log(`        ${why}${c.note ? `  [${c.note}]` : ''}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${CASES.length} total`);

// Independent assertion: no message carrying a named diagnosis may ever reach a
// product lane, regardless of how the keyword list changes in future.
const DIAGNOSIS_PROBES = [
  'tea with kidney disease', 'tea and ckd', 'steady with chf',
  'tea for congestive heart failure', 'magnesium with stage 3 kidney disease',
  'quiz and I am on dialysis', 'tea, I have hypertension',
];
const leaks = DIAGNOSIS_PROBES.filter((p) => String(layer1(p) || '').startsWith('buyer'));
if (leaks.length) {
  console.log(`\nPRODUCT-LINK LEAK on ${leaks.length} diagnosis probe(s):`);
  leaks.forEach((l) => console.log(`  - ${l} -> ${layer1(l)}`));
  failed += leaks.length;
} else {
  console.log(`\nProduct-link leak check: 0 of ${DIAGNOSIS_PROBES.length} diagnosis probes reached a buyer lane.`);
}

process.exit(failed ? 1 : 0);
