// /coaching — work with Joel Polley, RN.
//
// 2026-07-07 REBUILD to align with the current funnel + reuse the patterns
// proven on bpquiz.com/tea (honest interactive checklist, "what to expect"
// timeline instead of overnight-miracle claims, a fair comparison table, a
// satisfaction-based guarantee, a "where this fits" ladder tying back into
// the $17 -> $47 kit funnel, sticky CTA, zero fabricated testimonials).
//
// THE THREE OFFERS (Joel's call, 2026-07-07):
//   $297   The 30-Day Personalized Sprint — direct buy, EXISTING Stripe link
//          (buy.stripe.com/00weVddEnca2ajx0oVfnO0O). Unchanged deliverable:
//          personalized 30-day protocol + 60-min kickoff call + 4 live group
//          coaching sessions in Skool. Recognized + fulfilled by the shared
//          stripe-webhook.js 'diagnostic' tier (do not touch that file).
//   $1,997 The 90-Day Program — direct buy, EXISTING Stripe link (reused, not
//          recreated: buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M -> /sprint-welcome).
//          FLAGGED BEST VALUE per Joel. Deliverables pulled from the REAL,
//          already-live /sprint-welcome page: 60-min kickoff + full lab review,
//          WhatsApp 1:1 access to Joel Sun-Thu 9-5 ET, weekly live group call +
//          protocol library in Skool VIP, Annie looped in if a hormone-baseline
//          call is warranted, 90 days. Anchored against the $6,997 regular
//          price already mapped in stripe-webhook.js (AMOUNT_TO_TIER 699700).
//          NOTE: "weekly 1:1" is represented honestly as the WhatsApp direct
//          access + the kickoff call, since that is what is ACTUALLY delivered
//          today. If Joel wants a literal separate recurring 1:1 video call
//          added, that is a new operational commitment to confirm separately.
//   Retainer  UNCHANGED per Joel ("3 same") — the same four 1:1 tiers that
//          were already on this page (Triangle Session $1,500 one-time /
//          Inner Circle $1,500/mo / Brave Household $5,000/mo / Pillar Year
//          $50,000/yr), same /apply?tier=<slug> + concierge@bpquiz.com
//          inquiry mechanism. Presented as "The High-End Retainer" section.
//
// Guarantee line reused VERBATIM from products.json (bp-premium-coaching /
// cortisol-premium-coaching / blood-sugar-premium-coaching): "The pre-read
// promise: if your case needs a different kind of help, Joel tells you before
// writing a word and refunds every dollar." Satisfaction/fit-based, never a
// health-outcome guarantee.
//
// Corner naming corrected to the CURRENT canon: Stress, Sugar, Sodium (the
// stale "Pipe Pressure / Stress Pressure / Sugar Pressure" labels are gone).
// Reach updated to 500K+ across TikTok, Facebook, and Instagram (matches the
// current homepage figure).
//
// FLAGGED, NOT ACTED ON: stripe-webhook.js currently alerts Joel only on
// ERROR paths (no email, unmapped amount, send failure) for the diagnostic/
// coaching tiers, never on a successful $297/$1,997 sale. Joel's stated rule
// this session is "notify me if it's 297." That is a real gap in the shared
// webhook, out of scope for a page redesign — flagged for a separate,
// deliberate change to that file rather than touched here.
//
// NOT TOUCHED:
//   - stripe-webhook.js, the $297/$1,997 Stripe objects, /sprint-welcome,
//     /coaching-welcome, /apply, /1on1 — all reused as-is.
//
// Posture for the retainer section: AVAILABLE not selling. Douglas D. Grant
// model — brand-as-close, no application-form theater beyond the existing
// short form, no urgency stacking. Joel's verbatim: "it's something I am not
// even sweating. it's the only way I will 1:1 though and make it worth my
// time."

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Mail, Stethoscope, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const EMAIL = 'concierge@bpquiz.com';
const EASE = [0.22, 1, 0.36, 1];

const SPRINT_297_LINK = 'https://buy.stripe.com/00weVddEnca2ajx0oVfnO0O';
const NINETY_1997_LINK = 'https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M';

const RETAINER_TIERS = [
  {
    name: 'The Triangle Session',
    slug: 'triangle',
    shortName: 'the Triangle Session',
    price: '$1,500',
    cadence: 'One-time · 90 minutes',
    fit: 'For the person who needs a nurse\'s eyes on their numbers once, with a written protocol they can act on the next morning.',
    includes: [
      'One 90-minute Zoom with me. Your home BP log, meds, supps, and most recent labs on the screen.',
      'I name which corner of the BP Triangle is loudest in your body and why.',
      'A written 1-page protocol after the call. What to start, what to ask your doctor for, what to drop.',
      '7 days of follow-up by email after the call if questions come up.',
    ],
    subject: 'TRIANGLE SESSION INQUIRY',
  },
  {
    name: 'The Inner Circle',
    slug: 'inner-circle',
    shortName: 'the Inner Circle',
    price: '$1,500 / month',
    cadence: 'Monthly · weekly access',
    fit: 'For the person who needs ongoing nursing time, not a one-shot, and wants a direct line to me between calls.',
    includes: [
      'A weekly 60-minute 1:1 with me. Four calls a month.',
      'Voxer-style voice and text access between calls, Monday through Friday.',
      'Quarterly lab review. You bring labs, I read them with you.',
      'Custom protocol that moves as your numbers move. Adjustments month over month.',
    ],
    subject: 'INNER CIRCLE INQUIRY',
  },
  {
    name: 'The Brave Household',
    slug: 'household',
    shortName: 'the Brave Household',
    price: '$5,000 / month',
    cadence: 'Monthly · whole-family',
    fit: 'For the head of a household who runs their family\'s health like a CEO and wants the protocol installed across everyone living under the roof.',
    includes: [
      'Everything in Inner Circle, applied to every named family member up to four.',
      'One in-person day with me in Louisville each year, or a weekly group call with the household, your choice.',
      'A family protocol document rebuilt every quarter as life shifts.',
      'Priority Voxer access for the primary contact, seven days a week.',
    ],
    subject: 'BRAVE HOUSEHOLD INQUIRY',
  },
  {
    name: 'The Pillar Year',
    slug: 'pillar',
    shortName: 'the Pillar Year',
    price: '$50,000 / year',
    cadence: 'Annual · per family · concierge',
    fit: 'For the family that wants me on call and is finished outsourcing their health to twelve-minute appointments.',
    includes: [
      'Twelve months of concierge nursing for the whole household. I\'m on call.',
      'Quarterly deep-dive days, in person or by video. Labs, body comp, sleep architecture, the full read.',
      'Custom protocols written specifically for each named member of the family.',
      'Direct line to me, including evenings and weekends when something can\'t wait.',
    ],
    subject: 'PILLAR YEAR INQUIRY',
  },
];

const GUARANTEE_LINE =
  'The pre-read promise: if your case needs a different kind of help, I tell you before writing a word and refund every dollar.';

// "Is this you" honest checklist (tea-style). No email required, self-scoring
// only, never leaves the page.
const CHECKLIST_ITEMS = [
  'You finished the $17 or $47 kit, did the work, and still want it read against YOUR numbers, not a template',
  'Your labs, meds, and supplements have never all been looked at together by one person, and neither has the stress corner underneath them',
  'You want a written plan before your next doctor visit, not after, because fifteen minutes never leaves room for the real question',
  'You\'ve already worked the obvious levers and the number still hasn\'t moved, so you want someone checking your work weekly instead of guessing again',
  'You want the whole 90 days walked with you this time, not just the first ten',
];

function mailtoFor(subject) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/* Gold gradient hairline used between sections (replaces plain 1px borders). */
function GoldHairline() {
  return <div aria-hidden="true" className="coach-hairline" />;
}

function ChecklistSection({ reveal }) {
  const [checked, setChecked] = useState(() => new Array(CHECKLIST_ITEMS.length).fill(false));
  const count = checked.filter(Boolean).length;
  const echoes = [
    'Check what fits. There is no wrong number here.',
    'One is enough to be worth a conversation.',
    'Two is a pattern worth a real look, not a guess.',
    'Three or more, and the $297 Sprint is the honest starting point below.',
    'Four or five, and the 90-Day Program is built for exactly this.',
  ];
  const echo = echoes[Math.min(count, echoes.length - 1)];

  return (
    <section className="py-16" style={{ background: 'var(--sage-soft)' }}>
      <div className="max-w-2xl mx-auto px-5">
        <motion.div {...reveal(0)}>
          <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            IS THIS YOU
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            Check what is true for you. No email required.
          </h2>
        </motion.div>
        <motion.div {...reveal(0.1)} className="space-y-3 mb-6" role="group" aria-label="Self-check, results not sent anywhere">
          {CHECKLIST_ITEMS.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className="w-full text-left flex gap-3 items-start"
              style={{
                background: 'var(--cream)',
                border: `1.5px solid ${checked[i] ? 'var(--clay)' : 'var(--line)'}`,
                borderRadius: 10,
                padding: '0.9rem 1rem',
                cursor: 'pointer',
              }}
              aria-pressed={checked[i]}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: `2px solid ${checked[i] ? 'var(--clay)' : '#cdbda4'}`,
                  background: checked[i] ? 'var(--clay)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {checked[i] ? '✓' : ''}
              </span>
              <span className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>{item}</span>
            </button>
          ))}
        </motion.div>
        <motion.p {...reveal(0.15)} className="text-base italic text-center" style={{ color: 'var(--muted)', lineHeight: 1.6 }} aria-live="polite">
          {echo}
        </motion.p>
      </div>
    </section>
  );
}

export default function CoachingPage() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      <style>{`
        @keyframes coachWash {
          0%   { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1); }
          50%  { transform: translate3d(3%, 2%, 0) rotate(6deg) scale(1.07); }
          100% { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1); }
        }
        .coach-hero-wash {
          position: absolute;
          inset: -25%;
          pointer-events: none;
          background:
            radial-gradient(42% 52% at 20% 28%, rgba(200, 162, 82, 0.13), transparent 70%),
            radial-gradient(38% 48% at 80% 72%, rgba(184, 90, 54, 0.08), transparent 70%),
            conic-gradient(from 130deg at 60% 40%, rgba(200, 162, 82, 0.05), transparent 30%, rgba(184, 90, 54, 0.04) 60%, transparent 82%);
          animation: coachWash 15s ease-in-out infinite;
          will-change: transform;
        }
        .coach-hairline {
          height: 1px;
          width: 100%;
          border: 0;
          background: linear-gradient(90deg, transparent, rgba(200, 162, 82, 0.55) 22%, rgba(200, 162, 82, 0.55) 78%, transparent);
        }
        .coach-card {
          transition: transform 0.3s var(--ease-out),
                      box-shadow 0.3s var(--ease-out),
                      border-color 0.3s var(--ease-out);
        }
        .coach-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 48px -20px rgba(18, 17, 16, 0.22);
          border-color: var(--gold) !important;
        }
        .coach-cta {
          transition: transform 0.3s var(--ease-out),
                      box-shadow 0.3s var(--ease-out),
                      background 0.3s var(--ease-out),
                      border-color 0.3s var(--ease-out),
                      color 0.3s var(--ease-out);
        }
        .coach-cta .coach-cta-arrow { transition: transform 0.3s var(--ease-out); }
        .coach-cta:hover .coach-cta-arrow { transform: translateX(4px); }
        .coach-cta-clay:hover {
          background: var(--clay-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -12px rgba(164, 75, 40, 0.55);
        }
        .coach-cta-ink { border: 1px solid transparent; }
        .coach-cta-ink:hover {
          border-color: var(--gold);
          color: var(--gold) !important;
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -14px rgba(18, 17, 16, 0.5);
        }
        .coach-compare th, .coach-compare td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid var(--line); text-align: center; }
        .coach-compare th { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--ink); background: var(--paper-warm); }
        .coach-compare th:first-child, .coach-compare td:first-child { text-align: left; font-weight: 500; width: 54%; }
        .coach-compare tr:last-child td { border-bottom: none; }
        .coach-sticky {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
          background: var(--cream); border-top: 1px solid var(--line);
          box-shadow: 0 -8px 26px rgba(18,17,16,0.12);
          transform: translateY(110%); transition: transform 0.3s ease;
          padding: 10px 0;
        }
        .coach-sticky.show { transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .coach-hero-wash { animation: none; }
          .coach-card:hover, .coach-cta-clay:hover, .coach-cta-ink:hover { transform: none; }
          .coach-sticky { transition: none; }
        }
      `}</style>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--paper-warm)', position: 'relative', overflow: 'hidden' }}>
        <div className="coach-hero-wash" aria-hidden="true" />
        <div className="max-w-3xl mx-auto px-5" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            {...rise(0)}
            className="mb-6 text-xs font-bold uppercase"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            COACHING WITH JOEL POLLEY, RN
          </motion.div>
          <motion.h1
            {...rise(0.12)}
            className="font-serif leading-tight mb-5"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--ink)', fontStyle: 'italic' }}
          >
            You cut the salt. You walked. The number still didn't move.
          </motion.h1>
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduce ? 0 : 1.1, delay: 0.5, ease: EASE }}
            style={{
              transformOrigin: 'left',
              height: 1,
              width: 'min(280px, 60%)',
              background: 'linear-gradient(90deg, var(--gold), rgba(200, 162, 82, 0))',
              marginBottom: '1.75rem',
            }}
          />
          <motion.p {...rise(0.28)} className="text-lg mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: '60ch' }}>
            Twenty years of ICU and ER nursing taught me this: by the time someone gets to me, they've almost always already done the obvious work. Cut the salt. Started walking. Cleaned up meals. Rested when the day actually let them. And the reading holds steady anyway. In my experience, when that happens, the loudest corner usually isn't sodium at all. It's stress, and it doesn't behave like a bad day. It stacks, quietly, on the body, long before anyone calls it stress out loud. For a lot of the people I coach, it's the calls that never stop, the crisis that's always someone else's first, while their own follow-up keeps slipping to next month.
          </motion.p>
          <motion.p {...rise(0.38)} className="text-lg" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: '60ch' }}>
            The kit teaches you the method. Coaching is me sitting with your numbers, your meds, your labs, and the stress load that never makes it onto a chart, and helping you find the corner that's most often driving a reading like yours.
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── THE TWO PROGRAMS (direct buy, current funnel; moved above the
           fold per Joel 2026-07-07 so pricing shows immediately) ───────── */}
      <section id="programs" className="py-16 sm:py-20" style={{ background: 'var(--paper)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              THE PROGRAMS
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-4 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              Personalized protocol. Real nursing time.
            </h2>
            <p className="text-base mb-12 text-center" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '58ch', margin: '0 auto 3rem' }}>
              I build YOUR protocol from YOUR numbers, meds, and labs. Then you run it with real access to me, not a template you're left alone with.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7 mb-6">
            {/* $297 — The 30-Day Sprint */}
            <motion.article
              {...reveal(0)}
              className="coach-card"
              style={{ background: 'var(--cream)', border: '2px solid var(--line)', borderRadius: 14, padding: 'clamp(1.5rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column' }}
            >
              <header className="mb-4">
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.2, marginBottom: '0.6rem' }}>
                  The 30-Day Personalized Sprint
                </h3>
                <div style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontStyle: 'italic', fontSize: 'clamp(1.7rem, 3vw, 2.05rem)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>
                  $297
                </div>
                <div aria-hidden="true" style={{ width: '2.5rem', height: 2, marginTop: '0.5rem', background: 'linear-gradient(90deg, var(--gold), rgba(200, 162, 82, 0))' }} />
                <div className="mt-2 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  30 DAYS · ONE TIME
                </div>
              </header>
              <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, fontStyle: 'italic' }}>
                The honest starting point. For the person ready to run a real protocol with my eyes on their numbers, without the 90-day commitment.
              </p>
              <ul className="space-y-2.5 mb-6" style={{ flexGrow: 1 }}>
                {[
                  'A 60-minute kickoff Zoom. I read your home BP log, meds, supplements, and labs live and name your loudest corner.',
                  'Your personalized 30-day protocol, written for your body, not a template.',
                  '4 live group coaching sessions with me over the 30 days. Bring your numbers, get answers.',
                  'A doctor-conversation script to bring to your next visit.',
                ].map((item) => (
                  <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                    <CheckCircle2 size={16} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span className="text-[0.95rem]" style={{ lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={SPRINT_297_LINK}
                className="coach-cta coach-cta-clay inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-bold text-base"
                style={{ background: 'var(--clay-hover)', color: '#FFFFFF', textDecoration: 'none' }}
              >
                Start the 30-Day Sprint, $297
                <ArrowRight size={16} className="coach-cta-arrow" />
              </a>
            </motion.article>

            {/* $1,997 — The 90-Day Program (BEST VALUE) */}
            <motion.article
              {...reveal(0.08)}
              className="coach-card"
              style={{ background: 'var(--cream)', border: '2px solid var(--sage-deep)', borderRadius: 14, padding: 'clamp(1.5rem, 3vw, 2.25rem)', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: -12, right: 20, background: 'var(--sage-deep)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999 }}>
                Best value
              </span>
              <header className="mb-4">
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.2, marginBottom: '0.6rem' }}>
                  The 90-Day Program
                </h3>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: '1rem', color: 'var(--muted)', textDecoration: 'line-through' }}>$6,997</span>
                  <span style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontStyle: 'italic', fontSize: 'clamp(1.7rem, 3vw, 2.05rem)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>
                    $1,997
                  </span>
                </div>
                <div aria-hidden="true" style={{ width: '2.5rem', height: 2, marginTop: '0.5rem', background: 'linear-gradient(90deg, var(--gold), rgba(200, 162, 82, 0))' }} />
                <div className="mt-2 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  90 DAYS · 1:1 ACCESS + GROUP
                </div>
              </header>
              <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, fontStyle: 'italic' }}>
                For the person whose numbers took years to climb and wants me walking the whole 90 days with them, not just the kickoff.
              </p>
              <ul className="space-y-2.5 mb-6" style={{ flexGrow: 1 }}>
                {[
                  'A 60-minute kickoff Zoom with a full lab review. Home BP log, meds, supplements, A1c, lipids, kidney, thyroid, all read together.',
                  'Direct 1:1 access to me by WhatsApp, Sunday through Thursday, 9 to 5 ET, for the full 90 days.',
                  'A weekly live group call plus the full protocol library in the Skool VIP community.',
                  'If your case calls for it, Annie is looped in for a hormone-baseline call.',
                  'A doctor-conversation script, and your Week 1 protocol drafted before you even meet.',
                ].map((item) => (
                  <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                    <CheckCircle2 size={16} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span className="text-[0.95rem]" style={{ lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={NINETY_1997_LINK}
                className="coach-cta coach-cta-clay inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-bold text-base"
                style={{ background: 'var(--clay-hover)', color: '#FFFFFF', textDecoration: 'none' }}
              >
                Start the 90-Day Program, $1,997
                <ArrowRight size={16} className="coach-cta-arrow" />
              </a>
            </motion.article>
          </div>

          <motion.div {...reveal(0.2)} className="text-center" style={{ maxWidth: 560, margin: '0 auto' }}>
            <p className="text-sm italic" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              {GUARANTEE_LINE}
            </p>
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── WHO I TAKE 1:1 (the qualifier) ──────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              WHO THIS IS FOR
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              I only take a few kinds of people into coaching.
            </h2>
          </motion.div>
          <motion.ul {...reveal(0.1)} className="space-y-4 mb-6">
            {[
              'Usually 45 to 70, with cardiovascular numbers that have kept climbing for years even after doing the things every article tells you to do, on two or three medications that still aren\'t finishing the job.',
              'Ready to work toward less medication alongside your doctor, never around your doctor, and never instead of your doctor. That line is non-negotiable.',
              'For a lot of the people I coach, the stress corner is the loudest one, and it isn\'t just a mood problem. It\'s a body problem that medicine doesn\'t always recognize as a real driver of blood pressure. We name it honestly instead of routing around it.',
              'Faith-honest households where you\'ve been the one holding everyone else\'s health together, and it\'s time somebody held yours. This lives inside your home, not a clinic. Skin-in-the-game posture: you bring the home log, the meds list, the labs, the questions. I bring twenty years of nursing time. We meet in the middle.',
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 10, width: 6, height: 6, borderRadius: '50%', background: 'var(--sage-deep)' }} />
                <span className="text-base" style={{ lineHeight: 1.65 }}>{item}</span>
              </li>
            ))}
          </motion.ul>
          <motion.p {...reveal(0.15)} className="text-base italic" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            If you're not there yet, the <Link to="/" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>$17 Corner Reset kit</Link> is the right starting place.
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── THE METHOD ─────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--sage-soft)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              THE METHOD
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              The BP Triangle Method: why the obvious fix wasn't enough.
            </h2>
          </motion.div>
          <motion.div {...reveal(0.1)}>
            <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              If you've already cut the sodium and the number held steady anyway, that's not failure. That's information: the plan only had one side of the triangle in it. Every elevated reading is being driven by at least one of three corners: Stress, Sugar, or Sodium. For a lot of the people I coach, once the obvious lever's already been pulled, stress turns out to be the corner still working against the number, though coaching is where we confirm which corner it actually is for you. Find the loudest one, move the right input, and the numbers move with it. That is the method, in one sentence. The Eight Laws (nutrition, exercise, water, sunlight, temperance, air, rest, trust) are the inputs we work with.
            </p>
            <p className="text-base mb-7" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              This isn't theory. It's the framework underneath every BraveWorks article, every kit, and every conversation in coaching, including the ones where the obvious levers were already pulled and the stress corner never got named until now. Over 500K people follow the work across TikTok, Facebook, and Instagram, and the story in the comments is almost always the same one: they did what every article told them to do, and the number still didn't move. The protocol is public. Coaching is where we apply it to your body.
            </p>
          </motion.div>
          <motion.div {...reveal(0.18)} className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--muted)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.08em' }}>
            <span style={{ padding: '6px 10px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 6 }}>STRESS</span>
            <span style={{ padding: '6px 10px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 6 }}>SUGAR</span>
            <span style={{ padding: '6px 10px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 6 }}>SODIUM</span>
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── IS THIS YOU (honest interactive checklist, tea-style) ── */}
      <ChecklistSection reveal={reveal} />

      <GoldHairline />

      {/* ─── WHAT TO EXPECT (honest timeline, tea-style) ───────────── */}
      <section className="py-16" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              WHAT TO EXPECT
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              Honest expectations, not overnight promises.
            </h2>
          </motion.div>
          <motion.div {...reveal(0.1)} className="space-y-4">
            {[
              { when: 'Before the call', title: 'Gather your real numbers', body: 'Home BP log, your prescriptions, your supplements, and any labs from the last year. Bring what you have. The call works either way.' },
              { when: 'The kickoff (60 min)', title: 'We map your Triangle live', body: 'I listen first, then we look at your numbers together, name your loudest corner, and I write your protocol on screen while you watch and ask questions.' },
              { when: 'The weeks after', title: 'You run it with me beside you', body: 'Group calls, direct access between them, and a plan that adjusts as your numbers move. Real change is measured in weeks, not days, the same honest window the research runs on.' },
            ].map((row) => (
              <div key={row.when} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--cream)', border: '1px solid var(--line)' }}>
                <div className="flex-shrink-0" style={{ width: 120, color: 'var(--sage-deep)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {row.when}
                </div>
                <div>
                  <div className="font-medium text-base mb-1" style={{ color: 'var(--ink)' }}>{row.title}</div>
                  <div className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>{row.body}</div>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.p {...reveal(0.2)} className="text-base italic text-center mt-8" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            "Anyone promising day-three miracles is selling you a story. I'd rather sell you a plan."
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── COMPARISON: coaching next to a rushed office visit ────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              THE PLAIN DIFFERENCE
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-4 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              What coaching adds, next to a typical visit.
            </h2>
            <p className="text-sm text-center mb-8" style={{ color: 'var(--ink-soft)', maxWidth: '56ch', margin: '0 auto 2rem' }}>
              This isn't a replacement for your doctor. It's the conversation a 12-minute appointment rarely has time for.
            </p>
          </motion.div>
          <motion.div {...reveal(0.1)} style={{ overflowX: 'auto' }}>
            <table className="coach-compare" style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr><th></th><th>Coaching with Joel</th><th>A typical office visit</th></tr>
              </thead>
              <tbody>
                {[
                  ['A full 60 minutes, no rush', true, false],
                  ['Your labs and your kit result read together', true, false],
                  ['A written one-page plan you keep after', true, false],
                  ['Herbs and supplements cross-checked against your prescriptions', true, false],
                  ['Booked directly, no referral, no weeks-long wait', true, false],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1] ? <CheckCircle2 size={18} color="var(--sage-deep)" style={{ display: 'inline' }} /> : <XCircle size={18} color="#995449" style={{ display: 'inline' }} />}</td>
                    <td>{row[2] ? <CheckCircle2 size={18} color="var(--sage-deep)" style={{ display: 'inline' }} /> : <span style={{ color: '#995449', fontSize: 13 }}>rarely</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── WHERE THIS FITS (funnel ladder tie-in) ─────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--sage-soft)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              WHERE THIS FITS
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-10 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              Coaching is the top of one path, not a separate one.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 'Free', title: 'Take the quiz', body: 'Find your loudest corner in 60 seconds.', to: '/quiz', cta: 'Take the quiz' },
              { step: '$17', title: 'Your Corner Reset', body: 'The 10-day plan for your loudest corner.', to: '/', cta: 'See the kit' },
              { step: '$47', title: 'Complete the Triangle', body: 'All three corners, plus the Freedom Finale.', to: '/', cta: 'See the kit' },
              { step: 'You are here', title: 'Coaching with Joel', body: 'Your protocol, read and adjusted by me, live.', to: '#programs', cta: 'See the programs' },
            ].map((c, i) => (
              <motion.div key={c.title} {...reveal(i * 0.06)} className="coach-card" style={{ background: 'var(--cream)', border: c.step === 'You are here' ? '2px solid var(--sage-deep)' : '1px solid var(--line)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--clay)', letterSpacing: '0.1em' }}>{c.step}</div>
                <h3 className="font-serif text-lg mb-2" style={{ color: 'var(--ink)' }}>{c.title}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>{c.body}</p>
                <Link to={c.to} className="text-sm font-semibold" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  {c.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── THE HIGH-END RETAINER (unchanged, Joel: "same") ───────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              BEYOND THE PROGRAMS: THE HIGH-END RETAINER
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-12 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              Four ways to have me to yourself. One inbox to start.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:gap-7">
            {RETAINER_TIERS.map((tier, i) => (
              <motion.article
                key={tier.name}
                {...reveal(i * 0.08)}
                className="coach-card"
                style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 14, padding: 'clamp(1.5rem, 3vw, 2.25rem)' }}
              >
                <header className="mb-5" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
                  <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.15 }}>
                    {tier.name}
                  </h3>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontStyle: 'italic', fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>
                      {tier.price}
                    </div>
                    <div aria-hidden="true" style={{ width: '2.5rem', height: 2, marginTop: '0.4rem', marginLeft: 'auto', background: 'linear-gradient(270deg, var(--gold), rgba(200, 162, 82, 0))' }} />
                  </div>
                </header>

                <div className="mb-5 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {tier.cadence}
                </div>

                <p className="text-sm mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, fontStyle: 'italic' }}>
                  {tier.fit}
                </p>

                <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>
                  What's in it
                </div>
                <ul className="space-y-2.5 mb-7">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                      <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 9, width: 5, height: 5, borderRadius: '50%', background: 'var(--sage-deep)' }} />
                      <span className="text-[0.95rem]" style={{ lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ borderTop: '1px solid rgba(200, 162, 82, 0.4)', paddingTop: '1.25rem' }}>
                  <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>
                    How to inquire
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                    A short application. I read every one.
                  </p>
                  <Link
                    to={`/apply?tier=${tier.slug}`}
                    className="coach-cta coach-cta-ink inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                    style={{ background: 'var(--ink)', color: 'var(--cream)', textDecoration: 'none' }}
                  >
                    Apply for {tier.shortName}
                    <ArrowRight size={14} className="coach-cta-arrow" />
                  </Link>
                  <div className="mt-3 text-xs" style={{ color: 'var(--muted)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.04em' }}>
                    Prefer email?{' '}
                    <a href={mailtoFor(tier.subject)} style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {EMAIL}
                    </a>{' '}
                    with subject {tier.subject}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── ABOUT JOEL (compressed) ────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)} className="flex items-center gap-5 mb-6" style={{ flexWrap: 'wrap' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="84"
                height="84"
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cream)', boxShadow: '0 6px 18px rgba(44,42,38,0.12)', flexShrink: 0 }}
              />
            </picture>
            <div>
              <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                ABOUT JOEL
              </div>
              <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)', lineHeight: 1.15, fontStyle: 'italic' }}>
                Joel Polley, RN
              </h2>
            </div>
          </motion.div>
          <motion.div {...reveal(0.1)}>
            <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
              Registered Nurse. Twenty-plus years on the floor. ICU first, then emergency medicine. Hypertensive crashes, post-MI care, the conversations cardiology doesn't have time for. Naturopathic practitioner. Founder of BraveWorks RN. Creator of the BP Triangle Method.
            </p>
            <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--gold)', paddingLeft: '1rem' }}>
              "Pills manage output. Protocol fixes input. That's the whole sentence."
            </p>
            <Link to="/about/joel" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Read the long version <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div {...reveal(0.18)} className="mt-9 pt-7" style={{ borderTop: '1px solid rgba(200, 162, 82, 0.4)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Stethoscope size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>ICU + ER</div>
                  <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>20+ years critical care and emergency medicine.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>RN License</div>
                  <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>Active. Cardiovascular and naturopathic specialty.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>One inbox</div>
                  <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{EMAIL} · I read every email myself.</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── Disclaimer ─────────────────────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper-warm)', paddingBottom: '5rem' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '64ch', margin: '0 auto' }}>
            All coaching with Joel Polley, RN, is education-based nursing consultation rooted in 20 years of ICU and ER experience. It is not diagnosis, prescription, or replacement for your physician. Any protocol we discuss works alongside your doctor, not instead of them. Never start, stop, or change a prescribed medication without your prescribing physician's supervision.
          </p>
        </div>
      </section>

      {/* ─── STICKY MOBILE CTA ──────────────────────────────────── */}
      <StickyBar />
    </main>
  );
}

// Simple scroll-triggered sticky bar pointing at the two direct-buy programs.
// No single price shown (two different offers), so it scrolls to #programs
// rather than linking one Stripe URL.
function StickyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`coach-sticky md:hidden ${show ? 'show' : ''}`} style={{ minHeight: 64 }}>
      <div className="max-w-lg mx-auto px-5 flex items-center justify-between gap-3">
        <span className="font-serif text-sm" style={{ color: 'var(--ink)' }}>Coaching with Joel</span>
        <a
          href="#programs"
          className="px-5 py-2.5 rounded-lg font-bold text-sm"
          style={{ background: 'var(--clay-hover)', color: '#fff', textDecoration: 'none' }}
        >
          See the programs
        </a>
      </div>
    </div>
  );
}
