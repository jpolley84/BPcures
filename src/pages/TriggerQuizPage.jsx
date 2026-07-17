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
import { ArrowRight, Download } from 'lucide-react';
import { track, identify } from '../utils/analytics.js';

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

// ---- 5 questions, options mapped to the 5 triggers ------------------------
const QUESTIONS = [
  {
    title: 'When your day gets stressful, what does your body actually do?',
    options: [
      { key: 'stress', text: 'My chest tightens and my heart pounds for a while after.' },
      { key: 'sugar', text: 'I crave something sweet almost immediately.' },
      { key: 'sodium', text: 'I reach for something salty and crunchy without thinking.' },
      { key: 'sleep', text: 'I get wired, and it messes with me falling asleep that night.' },
      { key: 'stillness', text: 'I just sit and scroll. I do not move at all.' },
    ],
  },
  {
    title: 'How do you feel an hour or two after a big meal of pasta, bread, or dessert?',
    options: [
      { key: 'stress', text: 'My body feels fine, but my mind races more than usual.' },
      { key: 'sugar', text: 'Slow and foggy. Sometimes shaky or dizzy.' },
      { key: 'sodium', text: 'Puffy. My rings or shoes feel tighter than that morning.' },
      { key: 'sleep', text: 'I crash hard and want a nap right away.' },
      { key: 'stillness', text: 'I do not really notice. I am usually sitting anyway.' },
    ],
  },
  {
    title: 'How often does your food come from a box, can, restaurant, or drive-thru?',
    options: [
      { key: 'stress', text: 'More when I am stressed. It is just the fastest option.' },
      { key: 'sugar', text: 'Often, and it usually comes with something sweet too.' },
      { key: 'sodium', text: 'Most days. Easy wins over cooking.' },
      { key: 'sleep', text: 'Late at night, when I should be winding down instead.' },
      { key: 'stillness', text: 'Often, and I eat it sitting at a desk or on the couch.' },
    ],
  },
  {
    title: 'What does a normal night of sleep really look like for you?',
    options: [
      { key: 'stress', text: 'My mind will not shut off. I replay the whole day.' },
      { key: 'sugar', text: 'I wake up around 2 or 3 a.m., sometimes hungry.' },
      { key: 'sodium', text: 'I get up to use the bathroom more than once a night.' },
      { key: 'sleep', text: 'I am tired all day, no matter how many hours I got.' },
      { key: 'stillness', text: 'I sleep fine, but I wake up stiff and heavy anyway.' },
    ],
  },
  {
    title: 'Add up desk, car, and couch. How much of your day do you spend sitting?',
    options: [
      { key: 'stress', text: 'A lot, and I feel tension build the longer I sit.' },
      { key: 'sugar', text: 'A lot, and I snack more the longer I sit at my desk.' },
      { key: 'sodium', text: 'A lot. My legs or ankles feel swollen by evening.' },
      { key: 'sleep', text: 'A lot, but I still do not feel rested at the end of it.' },
      { key: 'stillness', text: 'Most of it. Some days 8 hours or more, easily.' },
    ],
  },
];

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

export default function TriggerQuizPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('quiz'); // quiz | gate | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // true when the email capture POST failed after retry: the results page
  // must NOT promise "it is on the way to your email" that will never come.
  const [captureFailed, setCaptureFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    track('quiz_started_view', { quiz: 'triggers', funnel_version: 'annie-v2' });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase, current]);

  function choose(key) {
    if (!startedRef.current) {
      startedRef.current = true;
      track('quiz_started', { quiz: 'triggers', funnel_version: 'annie-v2' });
    }
    const nextAnswers = [...answers, key];
    setAnswers(nextAnswers);
    track('quiz_question_answered', { quiz: 'triggers', step: current + 1, answer: key });
    if (current + 1 < QUESTIONS.length) {
      setCurrent(current + 1);
    } else {
      const scores = { stress: 0, sugar: 0, sodium: 0, sleep: 0, stillness: 0 };
      nextAnswers.forEach((k) => {
        if (k in scores) scores[k] += 1;
      });
      let top = 'stress';
      let best = -1;
      // First-answer priority breaks ties in favor of the gut answer.
      nextAnswers.forEach((k) => {
        if (scores[k] > best) {
          best = scores[k];
          top = k;
        }
      });
      setWinner(top);
      track('quiz_completed', { quiz: 'triggers', trigger: top, funnel_version: 'annie-v2' });
      setPhase('gate');
    }
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
      answers,
      tags,
    });
    const post = () =>
      fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
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
      setPhase('result');
      track('quiz_results_viewed', { quiz: 'triggers', trigger: t.slug, funnel_version: 'annie-v2' });
    }
  }

  function buyKit() {
    const t = TRIGGERS[winner] || TRIGGERS.stress;
    track('checkout_clicked', {
      product: 'bp-corner-reset',
      quiz: 'triggers',
      corner: t.slug,
      funnel_version: 'annie-v2',
    });
    navigate(`/pay?tier=corner&corner=${t.slug}`);
  }

  const t = winner ? TRIGGERS[winner] : null;

  return (
    <div style={wrap}>
      <div style={shell}>
        <MiniHeader />

        {/* ─── QUIZ ─────────────────────────────────────────────── */}
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
              Be honest, not perfect. There are no wrong answers here.
            </p>
            <h2 style={{ ...serif, fontSize: 'clamp(1.25rem, 4.5vw, 1.5rem)', lineHeight: 1.35, margin: '0 0 1.3rem' }}>
              {QUESTIONS[current].title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUESTIONS[current].options.map((opt, i) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => choose(opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    textAlign: 'left',
                    background: '#fff',
                    border: '1.5px solid var(--line, #D8CFBD)',
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
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '1.5px solid var(--line, #D8CFBD)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--sage-deep, #2E3A30)',
                    }}
                  >
                    {LETTERS[i]}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
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

        {/* ─── RESULT ───────────────────────────────────────────── */}
        {phase === 'result' && t && (
          <div style={cardStyle}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--clay, #B85A36)',
                marginBottom: '0.5rem',
              }}
            >
              Your Loudest Driver
            </div>
            <h2 style={{ ...serif, fontSize: 'clamp(1.8rem, 6vw, 2.4rem)', margin: '0 0 0.9rem' }}>{t.name}</h2>
            <p style={{ fontSize: '0.97rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', margin: '0 0 1.1rem' }}>
              {t.copy}
            </p>
            <div
              style={{
                background: 'var(--paper-warm, #EFE8DB)',
                borderRadius: 10,
                padding: '1rem 1.1rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--ink-soft, #2B2824)',
                marginBottom: '1.4rem',
              }}
            >
              <strong style={{ color: 'var(--sage-deep, #2E3A30)' }}>{t.name} is your loudest cause</strong>. But it
              rarely works alone. Most people have one or two more riding along, like{' '}
              {Object.values(TRIGGERS)
                .filter((x) => x.slug !== t.slug)
                .map((x) => x.name)
                .join(', ')}
              . Your free Blueprint covers all 5, so you can see the whole picture.
            </div>

            <div style={labelStyle}>3 Things To Start Today</div>
            {[
              { icon: '🌿', label: 'Herb', text: t.herb },
              { icon: '🍽️', label: 'Food Swap', text: t.food },
              { icon: '🚶', label: 'Lifestyle Shift', text: t.lifestyle },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  background: '#fff',
                  border: '1.5px solid var(--line, #D8CFBD)',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  marginBottom: 10,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--sage-soft, #C5CDBF)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                  }}
                >
                  {row.icon}
                </span>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--clay, #B85A36)',
                      marginBottom: 2,
                    }}
                  >
                    {row.label}
                  </span>
                  <span style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink, #121110)' }}>{row.text}</span>
                </div>
              </div>
            ))}

            {/* Blueprint delivery note */}
            <div
              style={{
                background: 'var(--sage-deep, #2E3A30)',
                borderRadius: 14,
                padding: '1.3rem 1.3rem',
                margin: '1.4rem 0 1.1rem',
              }}
            >
              <h3 style={{ ...serif, color: 'var(--cream, #FBF8F1)', fontSize: '1.15rem', margin: '0 0 0.4rem' }}>
                {captureFailed ? 'Your full Blueprint is ready' : 'Your full Blueprint is on its way'}
              </h3>
              <p style={{ color: 'var(--sage-soft, #C5CDBF)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 0.8rem' }}>
                {captureFailed
                  ? 'All 5 hidden triggers in plain words. Our email system hit a snag just now, so grab your copy right here instead.'
                  : 'All 5 hidden triggers in plain words. It is on the way to your email right now. Check your inbox in a few minutes.'}
              </p>
              <a
                href="/downloads/bp-blueprint.pdf"
                download
                onClick={() => track('leadmagnet_downloaded', { magnet: 'bp-blueprint', funnel_version: 'annie-v2' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--cream, #FBF8F1)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Can&rsquo;t wait? Download it now <Download size={15} />
              </a>
            </div>

            {/* $17 kit upsell */}
            <button type="button" style={primaryBtn} onClick={buyKit}>
              Get the BP Reset Kit for {t.name.replace('The ', 'the ')}, $17 <ArrowRight size={18} />
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted, #7A7061)', margin: '0.7rem 0 0' }}>
              A simple 10-day plan for your exact trigger, built by Joel. One time $17. Yours
              right away. No subscription.
            </p>
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
    </div>
  );
}
