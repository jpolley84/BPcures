// api/_eee-prompts.js: the brain of the Expertise Extraction Engine interview.
//
// Joel, 2026-10-07: "i want the whole thing to be ai driven interview... the
// front end of the assessment to be more surface..then go deeper... ask more
// explanation in areas that need fleshed out... produce its in depth analysis
// that is then emailed to them as well as summarized on the results page."
//
// Three sources are folded in here, so the model sees one voice:
//   1. EEE_Adaptive_Interview_Claude_Handoff.md (routing, probes, stopping rule,
//      free/paid boundary, evidence model)
//   2. Expertise_Extraction_Engine_Question_Bank_v1.pdf (24 core questions on
//      six signals: Proof, Ease, Echo, Energy, Story, Demand; the 0-3 scoring
//      rule; the one-line result formula)
//   3. The prototype quiz already on bpquiz.com/engine (its question wording,
//      kickers, and the four stage branches)
//
// The human-readable version of this file is
// ~/Downloads/EEE-AI-Interview-Guide-2026-10-07.md. Keep the two in step.

export const INTERVIEW_VERSION = 'eee-2026-10-07';
// 2026-10-07: llama-3.3-70b-versatile is gone from this Groq account
// ("model_not_found"). The free tier allows 8,000 tokens/minute PER MODEL, so
// the many small interview turns run on gpt-oss-20b and the one big analysis
// runs on gpt-oss-120b: two separate pools, the better model where it counts.
export const TURN_MODEL = process.env.EEE_TURN_MODEL || 'openai/gpt-oss-20b';
export const ANALYSIS_MODEL = process.env.EEE_ANALYSIS_MODEL || 'openai/gpt-oss-120b';
export const GROQ_MODEL = ANALYSIS_MODEL; // kept for older imports

// ─── Phase 1: the surface. Scripted, multiple choice, no model call. ─────────
// Easy to answer in seconds, and they give the model its routing (stage), the
// buyer's history (tried / unclear) and where people already pull on her
// (social). "Surface first, then go deeper" is Joel's brief.
export const SURFACE = [
  {
    id: 'U1', phase: 'Your Story', type: 'single',
    kicker: 'First, let’s understand where you are.',
    q: 'Which sounds most like where you are today?',
    options: [
      ['A', 'I know I want to help people, but I don’t know what kind of business I should build.'],
      ['B', 'People already come to me for help, but I’ve never really turned it into a business.'],
      ['C', 'I already coach, teach, consult, or help people, but what I offer feels too broad or unclear.'],
      ['D', 'I’ve sold something before, but I still struggle to explain it or sell it consistently.'],
    ],
  },
  {
    id: 'U2', phase: 'Your Story', type: 'multi',
    kicker: 'You may have already put real effort into this.',
    q: 'What have you already tried to help you figure this out?',
    help: 'Choose as many as fit. This is not about judging what worked or did not work.',
    options: [
      ['videos', 'Watched videos or listened to podcasts'], ['books', 'Read books'],
      ['masterclasses', 'Taken challenges or masterclasses'], ['courses', 'Bought online courses'],
      ['coaching', 'Joined a coaching program or mastermind'], ['consultant', 'Hired a coach or consultant'],
      ['built', 'Built a course, program, or service'], ['audience', 'Tried posting or building an audience'],
      ['ads', 'Paid for ads or marketing'], ['new', 'I’m just getting started'],
    ],
  },
  {
    id: 'U2b', phase: 'Your Story', type: 'multi', skipIf: (t) => onlyNew(t),
    kicker: 'Let’s name the part that still feels fuzzy.',
    q: 'After all of that, what still feels unclear?',
    options: [
      ['best', 'What I’m actually best at'], ['who', 'Who I should help'],
      ['problem', 'What I should help them with'], ['sell', 'What I should sell'],
      ['explain', 'How to explain what I do'], ['pay', 'What people would actually pay for'],
      ['price', 'How much to charge'], ['customers', 'How to get customers'],
      ['all', 'Honestly, most of it still feels fuzzy'],
    ],
  },
  {
    id: 'U5', phase: 'Your Evidence', type: 'multi',
    kicker: 'Now look at what people pull from you naturally.',
    q: 'When somebody says, “I knew YOU would know what to do…” what are they usually asking you about?',
    options: [
      ['health', 'Health or wellness'], ['relationships', 'Relationships or family'], ['money', 'Money'],
      ['business', 'Business'], ['career', 'Career or work'], ['faith', 'Faith or spiritual life'],
      ['confidence', 'Confidence or mindset'], ['parenting', 'Parenting'], ['organization', 'Organization'],
      ['technology', 'Technology'], ['creative', 'Creative work'], ['food', 'Food or cooking'],
      ['fitness', 'Fitness'], ['leadership', 'Leadership'], ['making', 'Making or fixing things'],
      ['other', 'Something else'], ['none', 'People don’t really come to me like that'],
    ],
  },
];

function onlyNew(transcript) {
  const t = transcript.find((x) => x.id === 'U2');
  const vals = Array.isArray(t?.values) ? t.values : [];
  return vals.length > 0 && vals.every((v) => v === 'new');
}

// ─── Phase 2: the bank the model draws from. ─────────────────────────────────
// Each line carries the signal it feeds, so the model can pick the question
// that fills the weakest bucket instead of marching down a list. Wording is
// from the question bank PDF (core questions) and the handoff spine.
export const BANK = [
  // Proof (paid and unpaid track record)
  { id: 'U3', signal: 'Proof', q: 'What have you already been paid to know, do, make, fix, teach, manage, or help with?', help: 'Think bigger than owning a business. Jobs count. Side work counts. Freelance work counts. Selling something you make counts.' },
  { id: 'U4', signal: 'Proof', q: 'Think about 1–3 roles you’ve had. What did people actually depend on you for, no matter what your title was?', help: 'Example: “I was the receptionist, but people depended on me to calm upset customers and fix scheduling problems.”' },
  { id: 'P1.3', signal: 'Proof', q: 'What tasks did bosses or coworkers keep handing to you because “you’re the one who’s good at that”?' },
  { id: 'P1.7', signal: 'Proof', q: 'What results can you prove with a number, a before-and-after, or a witness?' },
  { id: 'P1.4', signal: 'Proof', q: 'What unpaid roles have you held: parent, caregiver, volunteer, organizer, church or community leader? What did each one make you good at?' },
  // Echo (what others see)
  { id: 'U5b', signal: 'Echo', q: 'Tell me about one time someone came to you because they believed you could help. What were they stuck on, and what did they actually ask you?' },
  { id: 'U6', signal: 'Echo', q: 'What do people actually tell you you’re good at?', help: 'Not your résumé. Think: “You explain things so well,” “You should teach this,” “You always know what to do…”' },
  { id: 'E3.6', signal: 'Echo', q: 'How do people introduce you? “This is ___, the one who ___.”' },
  { id: 'E3.10', signal: 'Echo', q: 'What do people say you should teach, write a book about, or charge for?' },
  // Ease (natural talent)
  { id: 'U7', signal: 'Ease', q: 'What is so easy for you that you stopped counting it as a skill?', help: 'Think about something other people struggle with that makes you quietly think, “Doesn’t everybody know how to do this?”' },
  { id: 'S2.2', signal: 'Ease', q: 'What are you good at that no one ever taught you?' },
  { id: 'S2.6', signal: 'Ease', q: 'What do you notice that others miss: patterns, moods, mistakes, small details, chances?' },
  { id: 'S8.3', signal: 'Ease', q: 'Which two or three of your skills or life experiences almost never show up in the same person?' },
  { id: 'S8.1', signal: 'Ease', q: 'What do you know that most people in your field don’t know, or won’t say out loud?' },
  // Pattern (the before → help → after story, feeds Proof)
  { id: 'U8', signal: 'Proof', q: 'If I followed you around for the last 10 years, where would I have seen people benefiting from what you know?', help: 'Work, church, family, friends, customers, a hobby, volunteering, online, anywhere.' },
  { id: 'U9a', signal: 'Pattern', q: 'Think of one real person you helped. What was happening before they came to you?' },
  { id: 'U9b', signal: 'Pattern', q: 'What did you actually do that helped?' },
  { id: 'U9c', signal: 'Pattern', q: 'What was different afterward?' },
  { id: 'U10', signal: 'Pattern', type: 'single', q: 'Has something like that happened more than once?', options: [['many', 'Yes, many times'], ['few', 'Yes, a few times'], ['once', 'Once'], ['unsure', 'I’m not sure']] },
  { id: 'U10b', signal: 'Pattern', q: 'What tends to be similar each time? The people, the problem, or the result?' },
  { id: 'M11.1', signal: 'Pattern', q: 'When you help someone get a result, what steps do you take, in order?' },
  // Story (lived transformation, conviction)
  { id: 'U11', signal: 'Story', q: 'What have you figured out in your own life that used to feel hard?', help: 'Health, money, parenting, faith, confidence, career, relationships, starting over, building something. Anything you had to learn the hard way.' },
  { id: 'U11b', signal: 'Story', q: 'What did you have to learn that somebody a few steps behind you would probably love to know?' },
  { id: 'T6.2', signal: 'Story', q: 'What problem have you solved in your own life that other people are still stuck in?' },
  { id: 'T6.8', signal: 'Story', q: 'What do you know now that would have saved you five years?' },
  { id: 'C9.1', signal: 'Story', q: 'What problem makes you angry enough to do something about it?' },
  { id: 'O5.1', signal: 'Story', q: 'Before work, bills, and other people’s expectations got involved, what did you imagine yourself doing?' },
  { id: 'O5.5', signal: 'Story', q: 'What did you grow up around that taught you things most people never learn? A trade, a family business, another culture, faith, sickness, hard times.' },
  // Energy
  { id: 'U12a', signal: 'Energy', q: 'What can you do, talk about, make, learn about, or work on and suddenly realize hours have passed?' },
  { id: 'U12b', signal: 'Energy', q: 'What kind of problem could you help people solve over and over without getting bored?' },
  { id: 'N4.4', signal: 'Energy', q: 'What work leaves you with more energy than you started with?' },
  { id: 'N4.5', signal: 'Energy', q: 'What are you good at that wears you out? Those are traps, and I want to know them so I do not point you there.' },
  // Demand (kept light in the FREE interview; the full market read is paid)
  { id: 'D10.13', signal: 'Demand', q: 'In the last 90 days, what have people asked you to help with or tried to pay you for?' },
  { id: 'U14', signal: 'Demand', q: 'What have you wanted to do for a long time but keep putting off?' },
  { id: 'U14b', signal: 'Blockers', type: 'multi', q: 'What usually stops you?', options: [['teach', 'I don’t know what I would teach'], ['who', 'I don’t know who I would help'], ['many', 'I have too many ideas'], ['qualified', 'I don’t feel qualified enough'], ['wrong', 'I’m afraid of choosing the wrong thing'], ['pay', 'I don’t know if anyone would pay'], ['start', 'I don’t know where to start'], ['failed', 'I’ve tried things that did not work'], ['judgment', 'I’m worried what people will think'], ['time', 'Time'], ['money', 'Money'], ['other', 'Something else']] },
  { id: 'F7.4', signal: 'Blockers', q: 'Finish this sentence: “Who am I to ___?”' },
  // Closing
  { id: 'U15', signal: 'Close', type: 'single', q: 'If this engine could give you clarity on ONE thing today, which would matter most?', options: [['good', 'What I’m actually good at'], ['who', 'Who I should help'], ['what', 'What I should help them with'], ['business', 'What business I should start'], ['offer', 'What my offer should be'], ['ideas', 'How to finally put all my ideas together'], ['selling', 'Why what I have now isn’t selling']] },
];

export const BRANCHES = {
  A: [
    { id: 'A1', signal: 'Ease', q: 'What have you done for years simply because you enjoy it?', help: 'Cooking, quilting, gardening, planning events, studying health, writing, fixing things, teaching at church. Anything.' },
    { id: 'A2', signal: 'Echo', q: 'Has anyone ever asked you to teach them, show them how, make it for them, help them choose, fix theirs, or do it for them?' },
    { id: 'A3', signal: 'Ease', q: 'If you had to teach a small group something tomorrow using only what you already know, what could you teach without much research?' },
  ],
  B: [
    { id: 'B1', signal: 'Echo', q: 'What do you keep helping people with for free?' },
    { id: 'B2', signal: 'Echo', type: 'multi', q: 'Which of these have you heard?', options: [['charge', 'You should charge for this.'], ['teach', 'You should teach this.'], ['brain', 'Can I pick your brain?'], ['how', 'How did you do that?'], ['show', 'Can you show me?'], ['wish', 'I wish I knew what you know.']] },
    { id: 'B3', signal: 'Demand', q: 'Who seems to come to you most often?' },
  ],
  C: [
    { id: 'C1', signal: 'Proof', q: 'What do people currently pay you for?' },
    { id: 'C2', signal: 'Demand', q: 'Finish this sentence: People hire me because they want ______.' },
    { id: 'C3', signal: 'Pattern', q: 'Once somebody says yes, what do you actually help them do?' },
    { id: 'C4', signal: 'Blockers', type: 'multi', q: 'Which sounds most familiar?', options: [['content', 'People like my content but don’t buy'], ['free', 'People ask questions but don’t hire me'], ['tooMuch', 'My offer includes too many things'], ['tooMany', 'I help too many types of people'], ['result', 'I struggle to explain the result'], ['change', 'I keep changing the offer'], ['inconsistent', 'People buy sometimes but not consistently'], ['unsure', 'I’m not sure']] },
  ],
  D: [
    { id: 'D1', signal: 'Proof', q: 'What have people actually bought from you?' },
    { id: 'D2', signal: 'Proof', q: 'Which offer, service, or product has sold best?' },
    { id: 'D3', signal: 'Demand', q: 'What result were those buyers really hoping to get?' },
    { id: 'D4', signal: 'Echo', q: 'What do customers praise after they work with you?' },
  ],
};

export const SIGNALS = ['Proof', 'Ease', 'Echo', 'Energy', 'Story', 'Demand'];
export const STAGES = ['Your Story', 'Your Evidence', 'Your Pattern', 'Your Direction', 'Your Snapshot'];

// ─── The interviewer. One call per turn after the surface. ───────────────────
export const INTERVIEWER_SYSTEM = `You are the interviewer inside the Expertise Extraction Engine (Joel Polley & Annie Chitate). You interview one person to find what she has been overlooking: her Hidden Expertise, her Strongest Pattern, her Unfair Advantage. You are a perceptive person, not a quiz: you notice, follow evidence, ask ONE question at a time, and stop only when the pattern is clear enough to put your name on.

VOICE: warm, plain, direct, second person, short sentences, 8th-grade level. Never judge, flatter, or hype. Kicker = one short line on why you ask. Reflect her own words back.

HOW IT MOVES
- The easy multiple-choice part is done. Now go deeper: real people, real moments, real numbers, before-and-after.
- Ask what happened, not what might happen. Rank proof: what people paid for, then what others say, then her own opinion.
- Vague, short, or a label ("mindset coach", "I help people", "health") -> PROBE under it: one real person, one moment, one number. A label is not evidence.
- Rich answer -> move on. Never ask the same kind of question twice once a signal is strong.
- Follow threads she opens (her sister's labs, the quilts at the market, training new hires) instead of the next item on a list.
- After ~8 deep answers you may test a hypothesis in one sentence and ask something that could disprove it.
- Raise contradictions gently ("Earlier you said you are not a teacher, but your examples keep showing you teaching. What makes you hesitate to call that a skill?").
- Three "I don't know"s in a row -> fill-in-the-blank rescue ("People usually come to me when they need help with ______.") or the Outside Eyes exercise: text 3 people "If you could come to me for ONE thing because you believed I was really good at it, what would it be?" and paste the replies. Optional; never block on it.
- Respect her stage: A Explorer, B Informal Expert, C Existing Coach, D Existing Seller. No beginner hobby questions for a seller; no "what do clients pay" for an explorer.
- Stay on WHAT SHE HAS. The paid Blueprint handles who to help, what to sell, what to charge. One or two light Demand questions at most. No business advice, niches, offers, prices. No medical, mental health, legal, or financial diagnosis.

SIX SIGNALS you are filling, 0-3 each: Proof (paid or got a result), Ease (easy for her, hard for others), Echo (others name it unasked), Energy (gives energy), Story (lived it, fights for it), Demand (someone reachable pays; light touch). Also need ONE complete before -> what she did -> after story, and whether it repeated.

STOP (FINISH) only when: Hidden Expertise has 2+ independent evidence points from different parts of her life; Strongest Pattern has one concrete before/help/after story plus one more signal (repeated, or someone else named it); Unfair Advantage has 3+ converging ingredients; and you could cite her words for each. One bucket thin -> ONE targeted question for it. Several directions plausible -> say so in the listening line and keep going.

OUTPUT strict JSON only:
{"action":"ASK"|"FINISH","question_id":"<bank id, or probe|followup|hypothesis|contradiction|outside_eyes|rescue|gap>","kicker":"<short>","question_text":"<one idea>","helper_text":"<optional>","answer_type":"textarea"|"text"|"single"|"multi","options":[["value","Label"],...] or [],"progress_stage":"Your Evidence"|"Your Pattern"|"Your Direction"|"Your Snapshot","listening_line":"<=25 words reflecting something specific she just said, or empty>","confidence":{"hidden_expertise":0-1,"strongest_pattern":0-1,"unfair_advantage":0-1},"reason_internal":"<one line>"}
Never reuse a bank id already in the transcript (probe into it instead). Prefer textarea for stories. Never invent anything she did not say.`;

// ─── The analyst. One call at the end. ───────────────────────────────────────
export const ANALYST_SYSTEM = `You are the analyst inside the Expertise Extraction Engine (Joel Polley and Annie Chitate, Everyday Nurse and BraveWorks RN). You read one person's full interview transcript and write her Expertise Snapshot: a free, in-depth, evidence-backed analysis of WHAT SHE HAS.

She will read this twice: a short version on a results page, and the full version in her email. Write it so she thinks: "This finally helped me see what all that information was supposed to help me decide."

VOICE
- Second person, to her by first name. Warm, plain, specific. 8th-grade reading level. Short sentences.
- Every conclusion carries an evidence receipt in her own words: quote or closely paraphrase what she said and name where it came from (her job, her sister, the market stall, the church class).
- No generic labels. Never "natural teacher" or "people person" without the evidence under it. Say what she does in concrete verbs: "turns a confusing lab report into one next step."
- Say how strong the evidence is. A clue, a strong signal, or a proven pattern. Never overstate.
- Never invent evidence. If a bucket is thin, say so and say what would fill it.
- No hype, no exclamation marks.

THE FREE / PAID LINE
The free Snapshot answers "What do I have?" It does NOT answer "What should I do with it?" Do not name her best-fit client, her niche, the problem to sell, an offer, a price, or a business direction. You may say that the raw material for those decisions is now on the table. The paid Client-Ready Blueprint ($47) turns the Snapshot into: Best-Fit Client, Problem + Desire, 3 Strongest Business Directions, Best Place To Start, First Offer Direction, Clear Message, 7-Day Validation Plan. So: no dollar amounts, no 'charge for', no service names, no 'consultant/coach' titles anywhere in your output, including the testing and this-week suggestions. A test may ask her to NOTICE or ASK about a problem; it may not ask her to sell or price anything.

METHOD (do this before writing)
1. Pull the themes: every skill, topic, or problem that shows up in three or more answers.
2. Score each theme 0 to 3 on six signals: Proof (paid / result), Ease (easy for her, hard for others), Echo (others name it), Energy (gives energy), Story (lived it, fights for it), Demand (someone reachable already pays). Strong on 5 or 6 signals = the unfair advantage. Strong on 3 or 4 = a candidate, name the weakest signal. Strong on 1 or 2 = a hobby or job skill, say so kindly.
3. Separate labels from evidence. Mark the labels you did NOT accept and what you used instead.
4. Find the one complete before -> what she did -> after story. That is the spine of Strongest Pattern.

OUTPUT: strict JSON, nothing else.
{
  "first_name": "<her name>",
  "headline": "<one sentence, 'We found a pattern around ...', in plain words>",
  "hidden_expertise": {
    "headline": "<5 to 9 words, a concrete verb phrase, e.g. 'Turning confusion into one clear next step'>",
    "summary": "<2 to 4 sentences. What the skill is, why she stopped seeing it, how strong the evidence is.>",
    "evidence": [ {"quote": "<her words, short>", "from": "<where in her life this came from>"}, ... 2 to 4 items ]
  },
  "strongest_pattern": {
    "headline": "<5 to 9 words, the change she keeps helping people make>",
    "summary": "<2 to 4 sentences built on the before -> help -> after story, plus whether it repeated.>",
    "evidence": [ ... 2 to 4 items ]
  },
  "unfair_advantage": {
    "headline": "<5 to 9 words, the combination>",
    "summary": "<2 to 4 sentences naming the 3+ ingredients and why the mix is hard to copy.>",
    "evidence": [ ... 3 to 5 items ]
  },
  "deep": {
    "themes": [ {"theme": "<name>", "shows_up_in": ["<answer/area>", ...], "signals": {"Proof":0-3,"Ease":0-3,"Echo":0-3,"Energy":0-3,"Story":0-3,"Demand":0-3}, "verdict": "unfair advantage | candidate | hobby or job skill", "weakest_signal": "<signal or empty>"}, ... 2 to 4 themes ],
    "labels_not_accepted": [ {"label": "<what she called herself>", "used_instead": "<the concrete evidence>"}, ... 0 to 3 ],
    "what_you_may_be_underestimating": "<3 to 5 sentences. The thing she keeps dismissing and why it matters.>",
    "traps": "<1 to 3 sentences. Anything she is good at that drains her, or a fear she named, so she does not build there by accident. Empty string if nothing.>",
    "what_still_needs_testing": "<2 to 4 sentences. Which signal is thin and the one real-world check that would firm it up this week.>",
    "one_thing_to_notice_this_week": "<one concrete observation task, e.g. 'Keep a note of every time someone asks you to explain something this week. Write down what they asked.'>",
    "confidence_note": "<one sentence on how confident this Snapshot is and why>"
  },
  "commercial_gap": "<3 to 5 sentences, second person. Name what the Snapshot has NOT answered yet (who, what they want, what to sell first, how to say it) using her own stated priority and what she said still feels unclear. Do not answer those questions. End with: 'This is what you have. The next question is what to do with it.'>",
  "confidence": {"hidden_expertise": 0.0-1.0, "strongest_pattern": 0.0-1.0, "unfair_advantage": 0.0-1.0}
}`;

// Compact transcript for the model. Token budget is the constraint (8k/min on
// the free tier), so the last `keepFull` answers go in whole and older ones are
// trimmed; the model already reacted to those when they were fresh.
export function transcriptForModel(transcript, { keepFull = 8, full = false } = {}) {
  const cut = Math.max(0, transcript.length - keepFull);
  return transcript.map((t, i) => {
    const a = t.skipped ? '(skipped)' : (t.a || '');
    const trim = !full && i < cut && a.length > 180 ? a.slice(0, 180) + '…' : a;
    return `${i + 1}. [${t.id}] Q: ${t.q.slice(0, full ? 400 : 110)}\n   A: ${trim}`;
  }).join('\n');
}

// Only the questions she has NOT been asked, one short line each.
export function bankForModel(stage, askedIds = new Set()) {
  const pool = [...BANK, ...(BRANCHES[stage] || [])].filter((b) => !askedIds.has(b.id));
  return pool.map((b) => `${b.id} [${b.signal}] ${b.q.length > 120 ? b.q.slice(0, 120) + '…' : b.q}`).join('\n');
}
