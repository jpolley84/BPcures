// /coaching — work with Joel Polley, RN.
//
// 2026-06-04 REWRITE; 2026-06-09 LADDER REALIGN. Joel's canon ladder (stated
// 2026-06-09): quiz → $17 → Skool $27/mo → $47 → $297 personalized 30-day
// GROUP → $1,997 personalized 90-day GROUP. This page now leads with those
// two group programs (direct Stripe checkout, minimal friction) and keeps the
// four 1:1 tiers below as the premium "available, not selling" track:
// Triangle Session ($1,500 one-time), Inner Circle ($1,500/mo), Brave
// Household ($5,000/mo), Pillar Year ($50,000/yr per family).
//
// Group Stripe links (both LIVE, both webhook-mapped as of 2026-06-09):
//   $297  → buy.stripe.com/dRm5kD0RBgqi0IXdbHfnO0Z (metadata funnel=
//           group-coaching-30day → TIER_CONFIG['group-30'] welcome)
//   $1,997 → buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M (199700 → 'coaching',
//           "You're in the Sprint" welcome)
//
// Posture: AVAILABLE not selling. Douglas D. Grant model — brand-as-close, no
// money-back guarantees, no application forms, no Calendly embeds, no urgency
// stacking, no "limited spots" theater. Joel's verbatim: "it's something I am
// not even sweating. it's the only way I will 1:1 though and make it worth my
// time."
//
// Close mechanism: email concierge@bpquiz.com with the subject line for the tier.
// One inbox. Joel reads every one. The price is the proof. (Grant-mimic posture
// — `concierge@` signals "this is the premium track" without a real EA.)
// REQUIRES: concierge@bpquiz.com alias forwarding to joel@bpquiz.com or
// brave.works.marketing@gmail.com. Set up in Google Workspace / Cloudflare
// Email Routing BEFORE pushing this page live, or emails bounce.
//
// NOT TOUCHED:
//   - The retired $297 Stripe products/payment links remain live in Stripe for
//     existing buyers still in their drip.
//   - /coaching-welcome (CoachingWelcomePage.jsx) — landing page for existing
//     $297 buyers, intentionally preserved.
//   - /1on1 (WaitlistApplicationPage.jsx) — separate Premium waitlist app.

import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Stethoscope, ShieldCheck } from 'lucide-react';

const EMAIL = 'concierge@bpquiz.com';

const TIERS = [
  {
    name: 'The Triangle Session',
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

function mailtoFor(subject) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export default function CoachingPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--paper-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div
            className="mb-6 text-xs font-bold uppercase"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            COACHING WITH JOEL POLLEY, RN
          </div>
          <h1 className="font-serif leading-tight mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: 'var(--ink)', fontStyle: 'italic' }}>
            Two group programs. One method. Your numbers.
          </h1>
          <p className="text-lg mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: '60ch' }}>
            Twenty years of ICU and emergency-room nursing, then naturopathic practice for the patients the pharmaceutical model wasn't reaching. I built the BP Triangle Method on the floor, one elevated reading at a time.
          </p>
          <p className="text-lg" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: '60ch' }}>
            What I do in 1:1 is read the inside of your body the way a nurse reads a room, then write the protocol the twelve-minute appointment never had time to give you.
          </p>
        </div>
      </section>

      {/* ─── WHO I TAKE 1:1 (the qualifier) ──────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div
            className="mb-3 text-xs font-bold uppercase"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            WHO I TAKE 1:1
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            I only do this work with a few kinds of people.
          </h2>
          <ul className="space-y-4 mb-6">
            {[
              'Adults, usually 45 to 70, with cardiovascular numbers that have been climbing for years on two or three medications that aren\'t finishing the job.',
              'People ready to reverse meds with their doctor, not against their doctor. AND not INSTEAD OF. That line is non-negotiable.',
              'Faith-honest families who want the eight laws of health applied inside their home, not a clinic.',
              'Skin-in-the-game posture. You bring the home log, the meds list, the labs, the questions. I bring twenty years of nursing time. We meet in the middle.',
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginTop: 10,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--sage-deep)',
                  }}
                />
                <span className="text-base" style={{ lineHeight: 1.65 }}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-base italic" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            If that's not you yet, the <Link to="/" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>$17 BP Reset Kit</Link> is the right starting place.
          </p>
        </div>
      </section>

      {/* ─── THE METHOD ─────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--sage-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div
            className="mb-3 text-xs font-bold uppercase"
            style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            THE METHOD
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            The BP Triangle Method, applied through the Eight Laws of Health.
          </h2>
          <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            Every elevated reading is being driven by at least one of three pressures: pipe, stress, or sugar. Find the loudest one and move the right input, the numbers move with it. That is the method, in one sentence. The Eight Laws (nutrition, exercise, water, sunlight, temperance, air, rest, trust) are the inputs we work with.
          </p>
          <p className="text-base mb-7" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            This isn't theory. It's the framework underneath every BraveWorks article, every kit, and every conversation in the Skool community. Over 1,100 people are inside that community. Over 250,000 follow the work across TikTok, Facebook, and Instagram. The protocol is public. The 1:1 is where we apply it to your body.
          </p>
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--muted)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.08em' }}>
            <span style={{ padding: '6px 10px', background: 'var(--paper-light)', border: '1px solid var(--border)', borderRadius: 6 }}>PIPE PRESSURE</span>
            <span style={{ padding: '6px 10px', background: 'var(--paper-light)', border: '1px solid var(--border)', borderRadius: 6 }}>STRESS PRESSURE</span>
            <span style={{ padding: '6px 10px', background: 'var(--paper-light)', border: '1px solid var(--border)', borderRadius: 6 }}>SUGAR PRESSURE</span>
          </div>
        </div>
      </section>

      {/* ─── THE GROUP PROGRAMS (canon ladder rungs, 2026-06-09) ──── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <div
            className="mb-3 text-xs font-bold uppercase text-center"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            THE GROUP PROGRAMS
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-4 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            Personalized protocol. Group momentum.
          </h2>
          <p className="text-base mb-12 text-center" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '58ch', margin: '0 auto 3rem' }}>
            Joel builds YOUR protocol from YOUR numbers, meds, and labs — then you run it with live weekly coaching and people on the same path. Most people start here.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7 mb-6">
            {[
              {
                name: '30-Day Personalized Group Coaching',
                price: '$297',
                cadence: '30 days · starts when you do',
                fit: 'For the person ready to run the full protocol with Joel\'s eyes on their numbers, without 1:1 pricing.',
                includes: [
                  'Joel personally reads your intake: home BP log, every med and supplement, your labs if you have them.',
                  'Your personalized 30-day protocol, built for your body, not a template.',
                  'Live weekly group coaching with Joel. Bring your numbers, get answers.',
                  'Daily accountability inside the group for the full 30 days.',
                ],
                href: 'https://buy.stripe.com/dRm5kD0RBgqi0IXdbHfnO0Z',
                cta: 'Join the 30-Day Group — $297',
              },
              {
                name: '90-Day Personalized Group Coaching',
                price: '$1,997',
                cadence: '90 days · the full arc',
                fit: 'For the person whose numbers took years to climb and who wants Joel adjusting the protocol the whole way down.',
                includes: [
                  'Everything in the 30-day group, run for a full 90 days.',
                  'Kickoff onboarding with Joel: your file read, your Week-1 protocol drafted before you start.',
                  'Protocol adjustments as your numbers move, month over month.',
                  'A doctor-conversation script for every medication change you earn.',
                ],
                href: 'https://buy.stripe.com/cNifZh0RBfme4ZdfjPfnO0M',
                cta: 'Join the 90-Day Group — $1,997',
              },
            ].map((g) => (
              <article
                key={g.name}
                style={{
                  background: 'var(--paper-light)',
                  border: '2px solid var(--sage-deep)',
                  borderRadius: 14,
                  padding: 'clamp(1.5rem, 3vw, 2.25rem)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <header className="mb-4">
                  <h3 className="font-serif" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                    {g.name}
                  </h3>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>
                    {g.price}
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                    {g.cadence}
                  </div>
                </header>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {g.fit}
                </p>
                <ul className="space-y-2.5 mb-6" style={{ flexGrow: 1 }}>
                  {g.includes.map((item) => (
                    <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                      <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 9, width: 5, height: 5, borderRadius: '50%', background: 'var(--sage-deep)' }} />
                      <span className="text-[0.95rem]" style={{ lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={g.href}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-bold text-base transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--clay)', color: 'var(--cream, #FBF8F1)', textDecoration: 'none' }}
                >
                  {g.cta}
                  <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
          <p className="text-sm text-center" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Not ready for a program? Start with the <Link to="/quiz" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>free 90-second quiz</Link> or the{' '}
            <a href="https://www.skool.com/braveworksrn/about" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>$27/mo Skool community (7 days free)</a>.
          </p>
        </div>
      </section>

      {/* ─── THE FOUR 1:1 TIERS ─────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-5">
          <div
            className="mb-3 text-xs font-bold uppercase text-center"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            BEYOND THE GROUPS — 1:1 WITH JOEL
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-12 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            Four ways to have me to yourself. One inbox to start.
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:gap-7">
            {TIERS.map((tier) => (
              <article
                key={tier.name}
                style={{
                  background: 'var(--paper-light)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 'clamp(1.5rem, 3vw, 2.25rem)',
                }}
              >
                <header className="mb-5" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
                  <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.15 }}>
                    {tier.name}
                  </h3>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {tier.price}
                  </div>
                </header>

                <div
                  className="mb-5 text-xs font-bold uppercase"
                  style={{ color: 'var(--clay)', letterSpacing: '0.16em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
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
                      <span
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                          marginTop: 9,
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: 'var(--sage-deep)',
                        }}
                      />
                      <span className="text-[0.95rem]" style={{ lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1.25rem',
                  }}
                >
                  <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>
                    How to inquire
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                    Email me with the subject line below. I read every one.
                  </p>
                  <a
                    href={mailtoFor(tier.subject)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--ink)', color: 'var(--paper-light)' }}
                  >
                    <Mail size={16} />
                    {EMAIL}
                    <ArrowRight size={14} />
                  </a>
                  <div
                    className="mt-3 text-xs"
                    style={{
                      color: 'var(--muted)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      letterSpacing: '0.04em',
                    }}
                  >
                    SUBJECT: {tier.subject}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW TO START ───────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div
            className="mb-3 text-xs font-bold uppercase"
            style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
            HOW TO START
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            One email. One inbox. One reply.
          </h2>
          <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
            Email <a href={`mailto:${EMAIL}`} style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 600 }}>{EMAIL}</a> with the subject line for the tier you want. Tell me what's been happening with your numbers, what you've already tried, and what tier you're inquiring about. Two or three paragraphs is enough.
          </p>
          <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
            I read every email myself. I reply within 48 hours. If it's a fit, I send a Stripe invoice the same week. The first call is on the calendar within seven days of the invoice being paid.
          </p>
          <p
            className="text-sm mt-8 mb-0"
            style={{
              color: 'var(--muted)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.04em',
              borderLeft: '3px solid var(--sage-deep)',
              paddingLeft: '1rem',
            }}
          >
            EMAIL → REPLY WITHIN 48H → INVOICE → CALL WITHIN 7 DAYS.
          </p>
        </div>
      </section>

      {/* ─── ABOUT JOEL (compressed) ────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center gap-5 mb-6" style={{ flexWrap: 'wrap' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="84"
                height="84"
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--paper-light)',
                  boxShadow: '0 6px 18px rgba(44,42,38,0.12)',
                  flexShrink: 0,
                }}
              />
            </picture>
            <div>
              <div
                className="text-xs font-bold uppercase mb-1"
                style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              >
                ABOUT JOEL
              </div>
              <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)', lineHeight: 1.15, fontStyle: 'italic' }}>
                Joel Polley, RN
              </h2>
            </div>
          </div>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
            Registered Nurse. Eighteen-plus years on the floor. ICU first, then emergency medicine. Hypertensive crashes, post-MI care, the conversations cardiology doesn't have time for. Naturopathic practitioner. Founder of BraveWorks RN. Author of the BP Reset Kit and the BP Reset library on KDP. Creator of the BP Triangle Method.
          </p>
          <p className="text-base mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--sage-deep)', paddingLeft: '1rem' }}>
            "Pills manage output. Protocol fixes input. That's the whole sentence."
          </p>
          <Link
            to="/about/joel"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Read the long version <ArrowRight size={14} />
          </Link>

          <div className="mt-9 pt-7" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Stethoscope size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>ICU + ER</div>
                  <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>18+ years critical care and emergency medicine.</div>
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
          </div>
        </div>
      </section>

      {/* ─── Disclaimer ─────────────────────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '64ch', margin: '0 auto' }}>
            All 1:1 work with Joel Polley, RN, is education-based nursing consultation rooted in 20 years of ICU and ER experience. It is not diagnosis, prescription, or replacement for your physician. Any protocol we discuss works alongside your doctor, not instead of them. Never start, stop, or change a prescribed medication without your prescribing physician's supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
