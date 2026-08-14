// POST /api/dm-router — lane classifier for typed ManyChat DMs.
//
// 2026-08-10 (DM Engine Revamp, Joel-ratified): the Default Reply used to fire
// a one-size clinical email deflect at EVERY typed inbound — including buyers
// ("Tea please!") — and the braveworksRN@gmail.com deflect converted ~0
// (0/6 baseline ever made the email jump). This endpoint replaces guessing:
// ManyChat's Default Reply flow POSTs the subscriber's last text here, gets a
// single lane word back into custom field bw_lane, and routes on it.
//
// Order of decision (cheapest first, any doubt biases clinical — the
// "Claudia Tereese rule"; a mis-sold cardiac patient costs more than a
// mis-deflected buyer):
//   1. red-flag regex  -> redflag  (never anything else)
//   2. keyword cascade -> buyer_* / ops / skool / optout  (skipped if the
//      text also carries clinical markers)
//   3. LLM classify    -> allowlisted lane (Claude Haiku, temp 0; Groq
//      fallback if ANTHROPIC_API_KEY is absent)
//   4. anything unparseable -> other  (ManyChat shows the self-route menu)
//
// Every call is logged to KV (dmrouter:log) and lanes that need a human are
// self-reported into queues the daily triage reads FIRST — no more inbox
// scraping to find the work:
//   clinical/redflag -> dmrouter:clinical-queue
//   hotlead          -> dmrouter:hotlead-queue
//   ops              -> dmrouter:ops-queue
//   proof            -> dmrouter:proof-queue
//
// Auth: same dual-carrier shared secret as manychat-capture (header
// x-manychat-secret OR body "s" — ManyChat has wiped the header twice;
// picker-built bodies never revert). Uses MANYCHAT_CAPTURE_SECRET.
import { kv } from '@vercel/kv';

export const LANES = [
  'clinical', 'redflag', 'buyer_tea', 'buyer_quiz', 'buyer_mag', 'hotlead',
  'navigation', 'proof', 'compliment', 'intl', 'ops', 'skool', 'optout',
  'spam', 'other',
];

// ── layer 1: red flags — always win, never sell in the same breath ────────
export const RED_FLAG = /chest pain|can'?t breathe|trouble breathing|short(ness)? of breath|stroke|numb(ness)?( on)?( one)? side|face droop|slurred|passing out|fainted|suicid|kill myself|18\d\s*\/\s*1\d\d|2\d\d\s*\/\s*1\d\d|er right now|emergency room|ambulance/i;

// clinical markers that veto a keyword-buyer shortcut ("tea for my heart
// failure?" must go clinical, not buyer_tea)
//
// 2026-08-14 FIX: every condition term used to sit behind the possessive
// "my (...)" group, so a named diagnosis without "my" slipped straight past.
// "I want the tea, I have stage 4 kidney disease and heart failure" matched
// the tea keyword, failed this test, and was sold tea — deterministically,
// with no LLM call. Verified by execution against real 08-14 inbound
// (Lotarsha Carter, verbatim: "I have high blood pressure all the time now it
// damage my kidneys im stages 4 kidneys disease Chf also well"). Named
// conditions are now matched bare, outside the possessive group.
export const CLINICAL_MARKER = /\bmy (bp|blood pressure|doctor|meds?|medication|prescri|kidney|heart|a1c|sugar was|numbers)\b|kidney disease|kidneys? (disease|failure)|renal|\bckd\b|\bchf\b|heart failure|congestive|dialysis|transplant|stage ?\d|high blood pressure|hypertension|lisinopril|amlodipine|metoprolol|losartan|plavix|statin|insulin|diagnos|symptom|swelling|dizzy|palpitation|side effect|dose|mg\b/i;

const KEYWORDS = [
  [/\bunsubscribe\b|\bstop messaging\b|don'?t (message|text|contact) me|remove me/i, 'optout'],
  [/refund|charged|charge me|double.?charg|didn'?t (get|receive)|never (got|arrived|received)|where('| i)?s my (order|tea|kit|book)|track(ing)?( my)? (order|package)|shipp/i, 'ops'],
  [/\b(tea|steady)\b/i, 'buyer_tea'],
  [/magnesium|max.?calm/i, 'buyer_mag'],
  [/\b(quiz|link please|send( me)? the link|the link|get started|sign me up)\b/i, 'buyer_quiz'],
  [/\bskool\b|\b(join|the) group\b|community|weekly reset/i, 'skool'],
];

export function keywordLane(text) {
  for (const [re, lane] of KEYWORDS) {
    if (re.test(text)) {
      // buyer shortcuts yield to clinical context; ops/optout never do
      if (lane.startsWith('buyer') || lane === 'skool') {
        if (CLINICAL_MARKER.test(text)) return null;
      }
      return lane;
    }
  }
  return null;
}

// ── layer 2: LLM ──────────────────────────────────────────────────────────
const CLASSIFY_PROMPT = `Classify one Facebook/Instagram DM sent to Joel Polley, RN (blood-pressure educator, sells: caffeine-free "Steady" tea, free BP quiz, magnesium affiliate, $27/mo community, $297 coaching). Output ONLY one word from this list, nothing else:

clinical  - asks about their own health, symptoms, meds, readings, or any medical advice
redflag   - emergency signs: chest pain, stroke signs, BP over 180/120, self-harm
buyer_tea - wants the tea / asks price or how to buy it
buyer_quiz- wants the quiz or "the link" to get started
buyer_mag - asks about magnesium or MaxCalm
hotlead   - wants to work with Joel, coaching, a plan, "how do I start", ready to pay
navigation- site/page/video won't open, can't find something, how-to-access question
proof     - reports a result they credit to Joel (numbers down, meds reduced, sleeping better)
compliment- thanks/praise for the content with no question
intl      - asks about shipping outside the US
ops       - order status, payment problem, refund, delivery
skool     - asks about the group/community
optout    - asks to stop being messaged
spam      - phishing, link-drops, promotions aimed AT Joel
other     - none of the above / unclear

When torn between a buyer lane and clinical, choose clinical.`;

async function llmLane(text) {
  const msg = String(text).slice(0, 800);
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 8,
        temperature: 0,
        system: CLASSIFY_PROMPT,
        messages: [{ role: 'user', content: msg }],
      }),
    });
    const j = await r.json();
    return (j.content?.[0]?.text || '').trim().toLowerCase();
  }
  if (process.env.GROQ_API_KEY) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 8,
        temperature: 0,
        messages: [
          { role: 'system', content: CLASSIFY_PROMPT },
          { role: 'user', content: msg },
        ],
      }),
    });
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || '').trim().toLowerCase();
  }
  return 'other';
}

const HUMAN_QUEUES = {
  clinical: 'dmrouter:clinical-queue',
  redflag: 'dmrouter:clinical-queue',
  hotlead: 'dmrouter:hotlead-queue',
  ops: 'dmrouter:ops-queue',
  proof: 'dmrouter:proof-queue',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.MANYCHAT_CAPTURE_SECRET;
  const bodySecret = req.body && typeof req.body.s === 'string' ? req.body.s : '';
  if (!secret || (req.headers['x-manychat-secret'] !== secret && bodySecret !== secret)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { text, contact_id, first_name, channel } = req.body || {};
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return res.status(200).json({ lane: 'other', via: 'empty' });

  let lane = null;
  let via = 'keyword';
  if (RED_FLAG.test(t)) {
    lane = 'redflag';
    via = 'redflag-regex';
  } else {
    lane = keywordLane(t);
  }
  if (!lane) {
    via = 'llm';
    try {
      const out = await llmLane(t);
      lane = LANES.includes(out) ? out : 'other';
    } catch {
      // 2026-08-14 FIX: this used to fail OPEN into 'other', whose ManyChat
      // branch carries product buttons — so an API timeout while someone was
      // describing a clot answered them with a tea button. The file's own
      // doctrine is "any doubt biases clinical"; an outage is doubt.
      lane = 'clinical';
      via = 'llm-error';
    }
  }

  // ── log + self-report (best-effort; classification still returns) ──────
  try {
    const entry = JSON.stringify({
      at: new Date().toISOString(),
      lane, via, channel: channel || 'fb',
      cid: String(contact_id || ''),
      fn: String(first_name || '').slice(0, 40),
      text: t.slice(0, 400),
    });
    await kv.lpush('dmrouter:log', entry);
    await kv.ltrim('dmrouter:log', 0, 1999);
    const q = HUMAN_QUEUES[lane];
    if (q) {
      await kv.lpush(q, entry);
      await kv.ltrim(q, 0, 499);
    }
  } catch { /* never fail the route on logging */ }

  return res.status(200).json({ lane, via });
}
