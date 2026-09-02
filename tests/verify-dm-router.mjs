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

import { RED_FLAG, CLINICAL_MARKER, keywordLane, markerOverridesLane } from '../api/dm-router.js';

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

  // ── 2026-09-01: coaching / accelerator / pitched-offer asks -> hotlead ──
  { text: 'how do I join the change my life accelerator', expect: 'hotlead' },
  { text: 'Accelerator', expect: 'hotlead' },
  { text: 'im interested in coaching', expect: 'hotlead' },
  { text: 'I want the all in offer you pitched', expect: 'hotlead' },
  { text: 'can I work with you', expect: 'hotlead' },
  { text: 'tell me about your program', expect: 'hotlead' },
  { text: 'I want coaching, I am on lisinopril for my heart', expectNot: ['hotlead'],
    note: 'hotlead yields to clinical context like buyer lanes' },
  { text: 'help', expect: null, note: 'bare help stays with the LLM, never a deterministic sell' },
  { text: 'help me with my bp meds', expect: null, note: 'help+clinical must not become hotlead' },

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

// ── 2026-08-30: the LLM-path marker override (Susan Seaferd) ─────────────
// When layer 1 saw clinical context but produced no lane, the LLM's verdict
// may not sell to her or shrug; reporting lanes still stand.
const SUSAN = 'Checked out your tea. My bp creeps up but just as fast drops down 30 points';
const OVERRIDE_CASES = [
  { lane: 'other', text: SUSAN, expect: true, note: 'Susan verbatim — LLM said other, must flip clinical' },
  { lane: 'buyer_tea', text: SUSAN, expect: true },
  { lane: 'hotlead', text: 'I want a plan, my kidneys are failing', expect: true },
  { lane: 'proof', text: 'my numbers dropped 20 points thank you!', expect: false, note: 'testimonial stays proof' },
  { lane: 'compliment', text: 'love your videos, helped my blood pressure', expect: false },
  { lane: 'ops', text: 'where is my tea for my hypertension', expect: false, note: 'ops never yields' },
  { lane: 'other', text: 'hello there', expect: false, note: 'no marker, no override' },
  { lane: 'buyer_tea', text: 'Tea please', expect: false, note: 'clean buyer untouched' },
];
let oFailed = 0;
for (const c of OVERRIDE_CASES) {
  const got = markerOverridesLane(c.lane, c.text);
  if (got === c.expect) {
    console.log(`  PASS  override(${c.lane}, ${JSON.stringify(c.text).slice(0, 48)})  ->  ${got}`);
  } else {
    oFailed++;
    console.log(`  FAIL  override(${c.lane}, ${JSON.stringify(c.text).slice(0, 48)})  expected ${c.expect}, got ${got}${c.note ? `  [${c.note}]` : ''}`);
  }
}
console.log(`
Marker-override: ${OVERRIDE_CASES.length - oFailed} of ${OVERRIDE_CASES.length} passed.`);
failed += oFailed;

process.exit(failed ? 1 : 0);
