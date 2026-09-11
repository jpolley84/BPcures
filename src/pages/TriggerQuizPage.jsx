// TriggerQuizPage — the 5 Hidden Triggers quiz (Annie-v2 funnel, 2026-07-16).
// Mounted at /triggers. Three screens in one page: quiz -> email gate ->
// result. The email request sits BETWEEN the last question and the results
// (Joel's spec). The gate enrolls the visitor in the 7-email trigger sequence
// via /api/lead-magnet and the result screen upsells the $17 Reset Kit at
// /pay?tier=corner&corner=<trigger>. Fires the same canonical funnel events
// as the Triangle quiz (quiz_started / quiz_email_submitted / ...) so the
// A/B insights keep reading, each stamped funnel_version: 'annie-v2'.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { track, identify } from '../utils/analytics.js';
import { tagQuizTaken } from '../utils/manychat.js';

// ---- The 5 triggers -------------------------------------------------------
export const TRIGGERS = {
  stress: {
    name: 'The Stress Spike',
    slug: 'stress',
    copy: 'When your body feels stress, it makes stress chemicals like cortisol. A fight, a deadline, no quiet time: it all counts. Those chemicals should rise and then settle. But when the stress never stops, your blood vessels stay squeezed too long. So your number climbs. This is not in your head. It is your body’s alarm stuck in the on position.',
    herb: 'Ashwagandha. An herb many people use to help their body handle stress.',
    food: 'Cut the caffeine. Swap it for chamomile or hibiscus tea. Add foods rich in magnesium, like pumpkin seeds and leafy greens.',
    lifestyle: 'Build one calm moment into your day. Even 3 slow breaths before you check your phone.',
  },
  sugar: {
    name: 'The Sugar Surge',
    slug: 'sugar',
    copy: 'Every time your blood sugar spikes and crashes, your body sends out stress chemicals to fix it. Those are the same chemicals that push blood pressure up. Do that many times a day, every day, and your body never gets a break. This is not about willpower or “being good.” It is about how often your blood sugar swings without you knowing it.',
    herb: 'Cinnamon. Many people add it to meals to help keep blood sugar steady.',
    food: 'Do not eat carbs alone. Pair them with protein or fiber. It softens the swing.',
    lifestyle: 'Take a short walk after you eat. Even 10 minutes softens a blood sugar spike.',
  },
  sodium: {
    name: 'The Sodium Trap',
    slug: 'sodium',
    copy: 'It is rarely the salt shaker. Most salt hides in bread, sauces, canned food, and “healthy” frozen meals. And most of us do not eat enough fresh food with potassium to balance it out. So your body holds on to extra water. More water means your heart pushes more through the same pipes. The pressure has to go somewhere.',
    herb: 'Hibiscus. An herb tea long used to support healthy water balance and blood flow.',
    food: 'Eat one food rich in potassium most days: a banana, a sweet potato, spinach, or beans.',
    lifestyle: 'For one week, read the salt number on food labels the way you would read sugar. Just notice.',
  },
  sleep: {
    name: 'The Midnight Drift',
    slug: 'sleep',
    copy: 'Your blood pressure is supposed to drop at night. That nightly dip is when your heart and blood vessels get their one real rest. Broken sleep, waking at 2 or 3 a.m., or sleep that never gets deep steals that dip. Your body runs all night like it is still daytime. Your numbers never get their break.',
    herb: 'Chamomile or passionflower. Gentle herbs many people use to wind down before bed.',
    food: 'Skip heavy or sugary meals in the 2 to 3 hours before bed. They work against the nightly dip.',
    lifestyle: 'Wake up at the same time every day, even on weekends. It does more than a strict bedtime.',
  },
  stillness: {
    name: 'The Stillness Trigger',
    slug: 'stillness',
    copy: 'Movement is the signal that keeps your blood vessels soft and springy. It is not about burning calories. Long sitting, at a desk, in the car, or on the couch, means your vessels stop getting that signal. Over time they get stiff and slow. So your number creeps up, even on calm days.',
    herb: 'Hawthorn. An herb long used to support the heart and healthy blood flow.',
    food: 'Add plant omega-3s a few times a week: walnuts, ground flaxseed, or chia seeds.',
    lifestyle: 'Get up and move every 60 to 90 minutes. Even 2 minutes of standing and stretching counts.',
  },
};

// ---- Questions ------------------------------------------------------------
// 2026-08-27 (Joel): TAP TO ADVANCE on the five `trigger` questions, ported
// from the Economic Masonry assessment. Tapping an answer selects it and moves
// to the next question after a beat. No Next button, no second decision.
//
// ⚠️ THE TRADE-OFF, stated plainly. The trigger questions were multi-select
// (Joel, 2026-07-16) and tap-to-advance makes them single-select. PostHog, last
// 45 days, 24,465 answered questions:
//     1 option picked  80.3%
//     2 options        11.8%
//     3+ options        7.9%
// So four in five people already answered as if it were single-select, but ONE
// IN FIVE ANSWERS loses a pick. Scoring still works (it tallies picks and
// breaks ties on the earliest one), but separation between triggers is thinner,
// so ties resolve to the Q1 answer more often than they used to.
// TO REVERT: set TAP_TO_ADVANCE to false. Everything returns to multi-select
// with the Next button, no other change needed.
//
// The `belief` and `spend` questions stay multi-select with a Next button --
// they are not diagnostic and genuinely take more than one answer.
//
// 2026-07-16 (Joel): ALL questions are multiple-selection now. kind:
//   'trigger' — options map to the 5 triggers and drive scoring
//   'belief'  — where they think BP comes from; drives the results debunk
//   'spend'   — last year's medical spending; drives the savings frame
// Questions live in src/data/triggerQuestions.js so the homepage can import
// them without pulling in this entire page. Re-exported for existing callers.
import { QUESTIONS } from '../data/triggerQuestions';
// Re-exported for anything still importing it from this page.
// NOTE: the plain `import` above is REQUIRED. Writing only
//   export { QUESTIONS } from '../data/triggerQuestions';
// re-exports the name without creating a local binding, so every
// QUESTIONS[current] in this file throws at runtime -- and the build still
// passes clean, so nothing warns you.
export { QUESTIONS };

// 2026-07-17: LIES and SPEND_LABELS (results-page debunk copy + spend-range
// display strings) were removed with the on-page result content they served
// (see the OFFER phase below). beliefs/spend answers are still collected in
// the quiz and still sent to lead-magnet.js as tags for segmentation.

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ---- shared styles --------------------------------------------------------
const wrap = {
  minHeight: '100vh',
  background: 'var(--cream, #FBF8F1)',
  color: 'var(--ink, #121110)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const shell = {
  maxWidth: 620,
  margin: '0 auto',
  padding: '1.25rem 1.25rem 3rem',
};

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--line, #D8CFBD)',
  borderRadius: 14,
  padding: '1.75rem 1.5rem',
  boxShadow: '0 10px 30px rgba(18, 17, 16, 0.06)',
};

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

const primaryBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '0.95rem 1.4rem',
  background: 'var(--clay, #B85A36)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  fontSize: '1.02rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 8px 20px rgba(184, 90, 54, 0.28)',
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--sage-deep, #2E3A30)',
  marginBottom: '0.6rem',
};

function MiniHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.9rem 0 0.9rem',
        marginBottom: '0.75rem',
      }}
    >
      <Link
        to="/"
        style={{
          ...serif,
          fontSize: '0.95rem',
          color: 'var(--sage-deep, #2E3A30)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay, #B85A36)' }} />
        BraveWorks RN
      </Link>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted, #7A7061)' }}>
        The 5 Hidden Triggers Quiz
      </span>
    </div>
  );
}

// Reads the ?p= pre-answer handed over by the hormoneteas.com exit-intent
// modal, which asks THIS quiz's first question inline before sending her here.
// Whitelisted against QUESTIONS[0]'s real option keys so nothing arbitrary can
// be pushed into scoring; anything else means "start normally".
// Q1 is multi-select, so the pick is PRE-SELECTED on question one rather than
// auto-advancing. She can add more or tap Next, which is what the question
// actually asks for.
// Single switch for the whole behaviour (see the header note).
const TAP_TO_ADVANCE = true;
const isTapQuestion = (q) => TAP_TO_ADVANCE && q && q.kind === 'trigger';

function readPrefill() {
  try {
    const p = new URLSearchParams(window.location.search).get('p');
    return ['stress', 'sugar', 'sodium', 'sleep', 'stillness'].includes(p) ? p : null;
  } catch {
    return null;
  }
}


// ─── Challenge banner (2026-09-11, Joel) ───────────────────────────────
// Advertises the Sept 22-24 Change My Life Challenge at the start of the quiz
// and on the results (offer) screen. The ENTIRE banner is one link to
// changemylifechallenge.com — no inner buttons, per Joel's spec. Dates come
// from the cohort record (project_challenge_sept_cohort_2026-09-10): Sept
// 22-24 2026, 12pm ET / 11am CT, $97. Roll or remove after Sept 24.
function ChallengeBanner({ placement }) {
  return (
    <a
      href="https://changemylifechallenge.com/?utm_source=bpquiz&utm_medium=banner&utm_campaign=sept-cohort&utm_content=quiz"
      onClick={() => track('challenge_banner_click', { placement, cohort: '2026-09-22' })}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(120deg, #243A2B, #2E4A38 60%, #1c2e22)',
        borderRadius: 14,
        padding: '14px 18px',
        margin: '0 0 14px',
        boxShadow: '0 10px 26px rgba(36,58,43,0.28)',
        border: '1px solid rgba(233,199,184,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E9C7B8', marginBottom: 3 }}>
            Live Sept 22&ndash;24 &middot; The Change My Life Challenge
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35 }}>
            3 live days with Annie + Joel, RNs &mdash; find out what your body has been trying to tell you.
          </div>
        </div>
        <div style={{ flex: '0 0 auto', background: '#E9C7B8', color: '#243A2B', fontWeight: 800, fontSize: '0.8rem', borderRadius: 999, padding: '9px 16px', whiteSpace: 'nowrap' }}>
          Save my seat &middot; $97 &rarr;
        </div>
      </div>
    </a>
  );
}

export default function TriggerQuizPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('quiz'); // quiz | gate | offer | declined
  // Pending tap-to-advance timer, so unmount/rapid taps cannot fire it twice.
  const advanceRef = useRef(null);
  // 2026-08-27: with tap-to-advance, a ?p= prefill is a REAL answer to Q1 (she
  // tapped it on the homepage), so it is recorded and the quiz opens on Q2.
  // Before tap-to-advance it only pre-selected, because Q1 was multi-select and
  // auto-advancing would have stolen her remaining picks.
  const prefill = useRef(readPrefill()).current;
  const prefillConsumed = TAP_TO_ADVANCE && Boolean(prefill);
  const [current, setCurrent] = useState(prefillConsumed ? 1 : 0);
  // Multi-select: answers[i] = array of selected option keys for question i.
  const [answers, setAnswers] = useState(prefillConsumed ? [[prefill]] : []);
  const [selected, setSelected] = useState(() =>
    (prefillConsumed ? [] : prefill ? [prefill] : []),
  ); // current question's picks, seeded from ?p= when present
  const [winner, setWinner] = useState(null);
  const [beliefs, setBeliefs] = useState([]); // belief-question picks
  const [spend, setSpend] = useState([]); // spend-question picks
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // true when the email capture POST failed after retry: the results page
  // must NOT promise "it is on the way to your email" that will never come.
  const [captureFailed, setCaptureFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const p = readPrefill();
    track('quiz_started_view', {
      quiz: 'triggers',
      funnel_version: 'annie-v2',
      ...(p ? { prefilled: p } : {}),
    });
    // Arriving with a consumed prefill means she already answered Q1 (on the
    // homepage hero, or the tea exit-intent). The quiz HAS started, so fire
    // quiz_started here or the funnel would show a completion with no start.
    if (prefillConsumed && !startedRef.current) {
      startedRef.current = true;
      track('quiz_started', { quiz: 'triggers', funnel_version: 'annie-v2', entry: 'prefill' });
      track('quiz_question_answered', {
        quiz: 'triggers', step: 1, answer: prefill, funnel_version: 'annie-v2', entry: 'prefill',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase, current]);

  function toggle(key) {
    if (!startedRef.current) {
      startedRef.current = true;
      track('quiz_started', { quiz: 'triggers', funnel_version: 'annie-v2' });
    }
    // Tap-to-advance: the tap IS the answer. Show the selected state for a beat
    // so the choice registers visually, then move on. 180ms is long enough to
    // see and short enough that a decisive tapper never feels held up.
    if (isTapQuestion(QUESTIONS[current])) {
      setSelected([key]);
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = setTimeout(() => advanceWith([key]), 180);
      return;
    }
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function next() {
    advanceWith(selected);
  }

  // Extracted from next() so tap-to-advance can pass its pick directly rather
  // than racing React's state update.
  function advanceWith(picks) {
    if (!picks || !picks.length) return;
    const q = QUESTIONS[current];
    const nextAnswers = [...answers, picks];
    setAnswers(nextAnswers);
    track('quiz_question_answered', {
      quiz: 'triggers',
      step: current + 1,
      answer: picks.join(','),
      funnel_version: 'annie-v2',
    });
    if (q.kind === 'belief') setBeliefs(picks);
    if (q.kind === 'spend') setSpend(picks);
    setSelected([]);
    if (current + 1 < QUESTIONS.length) {
      setCurrent(current + 1);
      return;
    }
    // Score ONLY the trigger questions. Selection order breaks ties in favor
    // of the earliest gut pick.
    const scores = { stress: 0, sugar: 0, sodium: 0, sleep: 0, stillness: 0 };
    const flat = [];
    QUESTIONS.forEach((qq, i) => {
      if (qq.kind !== 'trigger') return;
      (nextAnswers[i] || []).forEach((k) => {
        if (k in scores) {
          scores[k] += 1;
          flat.push(k);
        }
      });
    });
    let top = 'stress';
    let best = -1;
    flat.forEach((k) => {
      if (scores[k] > best) {
        best = scores[k];
        top = k;
      }
    });
    setWinner(top);
    track('quiz_completed', { quiz: 'triggers', trigger: top, funnel_version: 'annie-v2' });
    setPhase('gate');
  }

  async function submitGate(e) {
    e.preventDefault();
    const cleaned = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError('Please enter a valid email.');
      return;
    }
    setError('');
    setLoading(true);
    const t = TRIGGERS[winner] || TRIGGERS.stress;
    try {
      localStorage.setItem('bwbp_lead_email', cleaned);
    } catch { /* private mode */ }
    try {
      sessionStorage.setItem('bp_quiz', JSON.stringify({ corner: t.slug }));
    } catch { /* private mode */ }
    identify(cleaned, name.trim() ? { name: name.trim() } : undefined);
    track('quiz_email_submitted', {
      quiz: 'triggers',
      trigger: t.slug,
      funnel_version: 'annie-v2',
    });
    let tags = ['triggers-quiz'];
    tags = tags.concat(beliefs.filter((b) => b !== 'none').map((b) => `belief-${b}`));
    tags = tags.concat(spend);
    try {
      const utm = new URLSearchParams(window.location.search);
      tags = tags.concat(
        ['utm_source', 'utm_medium', 'utm_campaign']
          .map((k) => (utm.get(k) ? `${k.replace('utm_', '')}-${utm.get(k)}` : null))
          .filter(Boolean),
      );
    } catch { /* noop */ }
    const payload = JSON.stringify({
      email: cleaned,
      name: name.trim(),
      quiz: 'triggers',
      trigger: t.slug,
      triggerName: t.name,
      // Flat list of every selected key (server stores it opaquely).
      answers: answers.flat(),
      tags,
    });
    const post = () =>
      fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    // ManyChat rebuild 2026-08-14: she finished the quiz. If she arrived from
    // a DM link (?mcp=<contact id>), tag her "took-quiz" so the morning triage
    // can skip rung 4 and open at rung 5. No-ops for everyone else, never
    // throws, never blocks the offer screen below.
    tagQuizTaken();
    try {
      let res = await post().catch(() => null);
      if (!res || !res.ok) {
        res = await post().catch(() => null);
        if (!res || !res.ok) {
          console.error('lead-magnet capture failed after retry');
          setCaptureFailed(true);
          track('quiz_email_capture_failed', { funnel_version: 'annie-v2' });
        }
      }
    } finally {
      setLoading(false);
      // 2026-07-17: the full result breakdown (trigger narrative, Lies,
      // money-math) no longer renders on-page. lead-magnet.js already emails
      // the named trigger + full Blueprint the moment this POST lands, so
      // she gets her actual results by email while the page goes straight to
      // the $17 offer, before any of that content, per Joel's direction.
      setPhase('offer');
      track('quiz_offer_viewed', { quiz: 'triggers', trigger: t.slug, funnel_version: 'annie-v2' });
    }
  }

  function declineOffer() {
    const t = TRIGGERS[winner] || TRIGGERS.stress;
    track('kit_offer_declined', { quiz: 'triggers', trigger: t.slug, funnel_version: 'annie-v2' });
    setPhase('declined');
  }

  function buyKit(placement = 'bottom') {
    const t = TRIGGERS[winner] || TRIGGERS.stress;
    track('checkout_clicked', {
      product: 'bp-corner-reset',
      quiz: 'triggers',
      corner: t.slug,
      funnel_version: 'annie-v2',
      placement, // 'top' | 'bottom' | 'sticky' — 2026-07-17 friction fix, measure which CTA converts
    });
    navigate(`/pay?tier=corner&corner=${t.slug}`);
  }

  const t = winner ? TRIGGERS[winner] : null;

  return (
    <div style={wrap}>
      <div style={shell}>
        <MiniHeader />

        {/* ─── QUIZ ─────────────────────────────────────────────── */}
        {phase === 'quiz' && <ChallengeBanner placement="quiz-start" />}
        {phase === 'quiz' && (
          <div style={cardStyle}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--clay, #B85A36)',
                marginBottom: '0.8rem',
              }}
            >
              Question {current + 1} of {QUESTIONS.length}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: '0.7rem' }} aria-hidden="true">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background: i <= current ? 'var(--clay, #B85A36)' : 'var(--sage-soft, #C5CDBF)',
                    transition: 'background 0.3s ease',
                  }}
                />
              ))}
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                fontStyle: 'italic',
                color: 'var(--muted, #7A7061)',
                margin: '0 0 1.3rem',
              }}
            >
              {isTapQuestion(QUESTIONS[current])
                ? 'Be honest, not perfect. Tap the closest one.'
                : 'Be honest, not perfect. Pick ALL that fit you, then tap Next.'}
            </p>
            <h2 style={{ ...serif, fontSize: 'clamp(1.25rem, 4.5vw, 1.5rem)', lineHeight: 1.35, margin: '0 0 1.3rem' }}>
              {QUESTIONS[current].title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUESTIONS[current].options.map((opt, i) => {
                const on = selected.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role={isTapQuestion(QUESTIONS[current]) ? 'radio' : 'checkbox'}
                    aria-checked={on}
                    onClick={() => toggle(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      textAlign: 'left',
                      background: on ? 'var(--paper-warm, #EFE8DB)' : '#fff',
                      border: on
                        ? '1.5px solid var(--clay, #B85A36)'
                        : '1.5px solid var(--line, #D8CFBD)',
                      borderRadius: 12,
                      padding: '0.85rem 1rem',
                      fontSize: '0.95rem',
                      lineHeight: 1.45,
                      color: 'var(--ink, #121110)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: on
                          ? '1.5px solid var(--clay, #B85A36)'
                          : '1.5px solid var(--line, #D8CFBD)',
                        background: on ? 'var(--clay, #B85A36)' : 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: on ? '#fff' : 'var(--sage-deep, #2E3A30)',
                      }}
                    >
                      {on ? '✓' : LETTERS[i]}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
            {/* Tap-to-advance questions have no Next: the tap is the answer. */}
            {!isTapQuestion(QUESTIONS[current]) && (
              <button
                type="button"
                onClick={next}
                disabled={!selected.length}
                style={{
                  ...primaryBtn,
                  marginTop: '1.1rem',
                  opacity: selected.length ? 1 : 0.5,
                  cursor: selected.length ? 'pointer' : 'not-allowed',
                }}
              >
                {current + 1 < QUESTIONS.length ? 'Next' : 'See My Results'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}

        {/* ─── EMAIL GATE (between quiz and results) ────────────── */}
        {phase === 'gate' && (
          <div style={cardStyle}>
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--sage-soft, #C5CDBF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                marginBottom: '0.9rem',
              }}
            >
              🔍
            </div>
            <h2 style={{ ...serif, fontSize: '1.55rem', margin: '0 0 0.6rem' }}>
              Your results are ready.
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1rem' }}>
              Your answers point to one loudest cause. Put in your email and we will show it
              to you right now, plus:
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 1.2rem',
                padding: '1rem 1.1rem',
                background: 'var(--paper-warm, #EFE8DB)',
                borderRadius: 12,
              }}
            >
              {[
                'Your #1 hidden cause, named in plain words',
                '3 things to start today: an herb, a food swap, and one habit',
                'The free Blueprint guide: all 5 triggers, sent to your email',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-soft, #2B2824)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ color: 'var(--sage, #4A5D4E)', fontWeight: 700 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={submitGate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name (optional)"
                  autoComplete="given-name"
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 999,
                    border: '1.5px solid var(--line, #D8CFBD)',
                    fontFamily: 'inherit',
                    // 16px minimum: under 16px iOS Safari zooms the viewport on
                    // focus and never zooms back out.
                    fontSize: '1rem',
                    background: '#fff',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your best email"
                  autoComplete="email"
                  required
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 999,
                    border: '1.5px solid var(--line, #D8CFBD)',
                    fontFamily: 'inherit',
                    // 16px minimum (iOS Safari focus-zoom), see above.
                    fontSize: '1rem',
                    background: '#fff',
                  }}
                />
                <button type="submit" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                  {loading ? 'Unlocking…' : 'Reveal My Results'} <ArrowRight size={18} />
                </button>
              </div>
              {error && (
                <p style={{ color: 'var(--clay, #B85A36)', fontSize: '0.85rem', margin: '0.4rem 0 0' }}>{error}</p>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--muted, #7A7061)', margin: '0.6rem 0 0' }}>
                No spam. Helpful notes from Joel. You can stop them anytime with one click.
              </p>
            </form>
          </div>
        )}

        {/* ─── OFFER ────────────────────────────────────────────── */}
        {/* 2026-07-17 (Joel): the quiz used to spend the whole page walking
            her through her result before ever asking for the sale, and only
            8% of people ever scrolled far enough to see the $17 button. Now
            the offer comes FIRST, right when the quiz ends, before any of
            that result content. Her actual results (named trigger + full
            5-trigger Blueprint) go out by email via lead-magnet.js the
            moment the gate form posts, so she still gets them, just not
            on-page and not before the offer. */}
        {phase === 'offer' && t && <ChallengeBanner placement="results" />}
        {phase === 'offer' && t && (
          <div style={cardStyle}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'var(--sage-deep, #2E3A30)',
                padding: '0.3rem 0.7rem',
                borderRadius: 999,
                marginBottom: '0.9rem',
              }}
            >
              Your Result
            </div>
            {/* 2026-07-21 (A/B fix): B was showing "check your email" and then
                asking for $17 with nothing delivered on-page. Offer-viewers
                converted to checkout at 25% vs A's 56%. She now gets her named
                trigger, the why, and one concrete move she can make today
                BEFORE the ask, so the offer lands on earned value. */}
            <h2 style={{ ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', margin: '0 0 0.7rem' }}>
              Your number one trigger is {t.name}.
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1rem' }}>
              {t.copy}
            </p>

            <div
              style={{
                background: 'var(--cream, #FBF8F1)',
                borderLeft: '3px solid var(--sage-deep, #2E3A30)',
                borderRadius: 8,
                padding: '0.9rem 1rem',
                margin: '0 0 1.1rem',
              }}
            >
              <div style={{ ...labelStyle, marginBottom: '0.35rem' }}>Start here today</div>
              <p style={{ fontSize: '0.93rem', lineHeight: 1.6, color: 'var(--ink, #121110)', margin: 0 }}>
                {t.lifestyle}
              </p>
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--muted, #7A7061)', margin: '0 0 1.5rem' }}>
              Your full write-up on {t.name.replace('The ', 'the ')}, plus the complete 5-trigger Blueprint, is
              landing in your inbox right now.
            </p>

            <div
              style={{
                background: 'var(--paper-warm, #EFE8DB)',
                border: '1.5px solid var(--clay, #B85A36)',
                borderRadius: 14,
                padding: '1.3rem 1.2rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ ...labelStyle, marginBottom: '0.7rem' }}>While that lands in your inbox</div>
              {/* 2026-07-22 (Joel): the kit poster shows on the landing page and
                  then she never saw it again, so the offer arrived with nothing
                  to look at. Same vault image, back at the moment of the ask. */}
              <picture>
                <source srcSet="/images/kit-vault-hero.webp" type="image/webp" />
                <img
                  src="/images/kit-vault-hero.jpg"
                  alt="The Complete BP Reset Kit: all three corner protocols, herb guides, recipes, and doctor sheets for the three pressures behind your numbers."
                  width="1672"
                  height="941"
                  loading="lazy"
                  style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 10, marginBottom: '0.9rem' }}
                />
              </picture>
              {/* 2026-08-29 (Joel): this used to read "The BP Reset Kit for the
                  Sodium Trap", which named the product after whichever corner she
                  scored highest and made $17 sound like a slice. It is not a slice
                  any more: the $17 tier delivers the COMPLETE kit (see the
                  entitlement note in api/_kit-manifest.js). Her trigger is the
                  diagnosis; the kit is the whole thing.
                  Copy leads with the outcome, not the file list -- "sell the
                  vacation, not the flight". The deliverables moved below the
                  promise, where they belong as proof rather than as the pitch. */}
              <h3 style={{ ...serif, fontSize: '1.35rem', margin: '0 0 0.55rem', color: 'var(--ink, #121110)' }}>
                The Complete BP Reset. All of it.
              </h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: '0 0 0.9rem' }}>
                Picture the next appointment. The cuff goes on, and for the first
                time in years you are not bracing. You already know roughly what it
                is going to say, because you have been watching it come down at
                home. That is what this is for.
              </p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #2B2824)', margin: '0 0 0.9rem' }}>
                Your loudest trigger is {t.name.replace('The ', 'the ')}, so start
                there. But you get <strong>every part of the kit</strong>, because
                stress, sugar and sodium feed each other, and fixing one while the
                other two run loose is why nothing has held so far.
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 1.1rem', padding: 0 }}>
                {[
                  'All three corners: stress, sugar and sodium, each with its own 10-day plan',
                  'The Herb Formulary for all of them: dose, why it helps, the cautions',
                  'The Freedom Finale, the phase that ties the three together',
                  'Bring This To Your Doctor sheets, so you walk in prepared',
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                      color: 'var(--ink-soft, #2B2824)',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <span style={{ color: 'var(--sage, #4A5D4E)', fontWeight: 700 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button type="button" style={primaryBtn} onClick={() => buyKit('top')}>
                Get the Complete Kit, $17 <ArrowRight size={18} />
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted, #7A7061)', margin: '0.65rem 0 0' }}>
                One time $17 for the whole thing. Yours right away. No subscription,
                nothing else to buy.
              </p>
            </div>

            {/* Clever, small decline. Not a real exit door: it should make
                her pause and reconsider, not just click through. */}
            <button
              type="button"
              onClick={declineOffer}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--muted, #7A7061)',
                fontSize: '0.78rem',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                cursor: 'pointer',
                fontFamily: 'inherit',
                margin: '0.9rem 0 0',
                padding: '0.4rem',
              }}
            >
              No thanks, I don&rsquo;t want the whole plan that could turn this around
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--muted, #7A7061)', margin: '1.2rem 0 0' }}>
              *Results vary from person to person. This is education, not medical or
              financial advice. Your doctor makes every medication call.
            </p>
          </div>
        )}

        {/* ─── DECLINED ─────────────────────────────────────────── */}
        {phase === 'declined' && t && (
          <div style={cardStyle}>
            <h2 style={{ ...serif, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', margin: '0 0 0.8rem' }}>
              No problem at all.
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1.3rem' }}>
              {captureFailed
                ? 'Your results and the full Blueprint are ready right here since our email system hit a snag just now.'
                : 'Your results and the full Blueprint are on their way to your email. Check your inbox in a few minutes.'}
            </p>
            {captureFailed && (
              <a
                href="/downloads/bp-blueprint.pdf"
                download
                onClick={() => track('leadmagnet_downloaded', { magnet: 'bp-blueprint', funnel_version: 'annie-v2' })}
                style={{
                  display: 'inline-block',
                  color: 'var(--clay, #B85A36)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  marginBottom: '1.3rem',
                }}
              >
                Download your Blueprint now
              </a>
            )}
            <button
              type="button"
              onClick={() => setPhase('offer')}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--clay, #B85A36)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '0.4rem',
              }}
            >
              Actually, let me see the kit again
            </button>
          </div>
        )}

        {/* ─── Compliance footer ────────────────────────────────── */}
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted, #7A7061)',
            fontSize: '0.78rem',
            maxWidth: '58ch',
            margin: '1.6rem auto 0',
          }}
        >
          This is education and lifestyle support, not medical advice, diagnosis, or treatment.
          See our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>

      {/* Sticky buy bar for the offer phase, backing up the in-card CTA. */}
      {phase === 'offer' && t && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            borderTop: '1px solid var(--line, #D8CFBD)',
            boxShadow: '0 -8px 24px rgba(18, 17, 16, 0.08)',
            padding: '0.7rem 1.25rem calc(0.7rem + env(safe-area-inset-bottom))',
            zIndex: 20,
          }}
        >
          <button
            type="button"
            style={{ ...primaryBtn, maxWidth: 620, margin: '0 auto' }}
            onClick={() => buyKit('sticky')}
          >
            Get the Complete Kit, $17 <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
