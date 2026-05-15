// /coaching — 90-Day BP Triangle Freedom Sprint application page.
//
// 2026-05-14 panel-audit rewrite. Eight fixes shipped:
//  1. Application form reduced from 17 → 7 questions (biggest friction kill)
//  2. Testimonial block added (3 real DMs, anonymized to first name)
//  3. Price card moved ABOVE the TikTok video (pre-anchor on first scroll)
//  4. "Picture August" future-self section added (Hardy / Myron L4)
//  5. "4 of 5 founding slots remaining" earned scarcity
//  6. "This IS / IS NOT for you" Brunson disqualifier section
//  7. Value stack rewritten in Harry Dry voice (specific + emotional)
//  8. CTA copy strengthened, FAQ added below form
//
// All previous experts still represented:
//   • Chris Do — diagnose-before-prescribe, never chase
//   • Daniel Priestley — pitch waterfall, score on doors (now on fit call)
//   • Myron Golden — cost-of-inaction + L4 imagination ("Picture August")
//   • Hormozi — disqualification + investment-range filter
//   • Brunson — application-only, IS/IS NOT, decision-maker filter
//   • Harry Dry — value stack rewrites earn every word
//
// Application-only (no buy button). Submits to /api/coaching-apply.

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Phone, TrendingDown, ArrowRight, HelpCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// TikTok embed (loads tiktok.com/embed.js once per page)
function TikTokEmbed({ videoId, username }) {
  useEffect(() => {
    const SRC = 'https://www.tiktok.com/embed.js';
    if (typeof document === 'undefined') return;
    const existing = document.querySelector(`script[src="${SRC}"]`);
    if (existing) {
      if (window.tiktokEmbed?.lib?.render) {
        try { window.tiktokEmbed.lib.render(); } catch { /* swallow */ }
      }
      return;
    }
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    document.body.appendChild(s);
  }, [videoId]);

  const url = `https://www.tiktok.com/@${username}/video/${videoId}`;
  return (
    <blockquote className="tiktok-embed" cite={url} data-video-id={videoId}
      style={{ maxWidth: 605, minWidth: 325, margin: '0 auto', background: 'transparent' }}>
      <section style={{ padding: '1.5rem', textAlign: 'center' }}>
        <a target="_blank" rel="noopener noreferrer" href={url} style={{ color: 'var(--purple)', fontWeight: 600 }}>
          Watch on TikTok →
        </a>
      </section>
    </blockquote>
  );
}

function AnimatedSection({ children, className = '', delay = 0, style = {} }) {
  const [ref, isVisible] = useScrollAnimation(0.1);
  return (
    <div ref={ref} className={className}
      style={{ ...style, opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Harry Dry value stack — every line earned its slot.
// Specific (numbers, names, mechanisms) → emotional (what it means)
// → functional (what it is). In that order.
// ─────────────────────────────────────────────────────────
const STACK = [
  { name: '12 hours of one-on-one with a 20-year RN who reads your chart twice (Mondays 8 PM ET)', value: '$5,964' },
  { name: '6 hormone sessions with Annie Chitate, RN — postmenopausal hormone specialty', value: '$1,782' },
  { name: 'Live audit of every bottle in your drawer — most members save $200-400/mo by week 2', value: '$697' },
  { name: 'Clean-sheet rebuild of your day — when you eat, sleep, take what, move', value: '$497' },
  { name: 'WhatsApp access Sun-Thu 9-5 ET — text the photo, ask the dumb question, get a real RN answer', value: '$1,997' },
  { name: 'Skool VIP community of adults on the same Triangle protocol', value: '$297' },
  { name: 'Every course in the BraveWorks library — yours forever', value: '$1,997' },
  { name: 'Every BraveWorks eBook + every new title released for life', value: '$497' },
  { name: 'Daily email engineered to YOUR protocol — not the public newsletter', value: '$497' },
  { name: 'Printable + digital trackers — the receipts you\'ll show your future PCP', value: '$97' },
  { name: '12-page guide for your spouse — how to support without nagging', value: '$97' },
  { name: '20% off Barbara O\'Neill\'s June LIVE event (live or replay)', value: '$197' },
];
const STACK_VALUE = '$14,616';
const PRICE_REGULAR = '$6,997';
const PRICE_FOUNDING = '$1,997';
const PRICE_3PAY = '$697 × 3';
const PRICE_3PAY_TOTAL = '$2,091';

const DEADLINE_ISO = '2026-05-18T03:59:00Z';
const DEADLINE_LABEL = 'Sunday, May 17 · 11:59 PM ET';

// 1 of 5 sold (Wakita). Update as slots fill.
const SLOTS_REMAINING = 4;
const SLOTS_TOTAL = 5;

const GUARANTEES = [
  { day: 'Day 30', text: 'Top three symptoms not improving → full refund, keep every protocol.' },
  { day: 'Day 60', text: 'Labs not moving in the right direction → full refund.' },
  { day: 'Day 90', text: 'Don\'t feel safer in your body than today → full refund.' },
];

// Anonymized testimonials. Gary, Candace = DMs (first names only). Drago = public TT comment.
const TESTIMONIALS = [
  {
    quote: 'I approached my cardiologist and she stopped me on Plavix and tapered me off Metoprolol. I owe the majority of this to you.',
    name: 'Gary',
    source: 'TikTok viewer',
  },
  {
    quote: 'From my 20s to now being 67, on 3 BP meds, you have been the only person that has ever made any impact in my BP journey.',
    name: 'Drago',
    source: 'public comment, @braveworksrn',
  },
  {
    quote: 'I am successfully managing my POTS with hawthorn berry and dandelion. I got off 37.5 mg of metoprolol. I feel so much better.',
    name: 'Candace',
    source: 'TikTok viewer',
  },
];

const IS_FOR_YOU = [
  'You\'re 45-70, dealing with BP, metabolic, or hormone stuff that hasn\'t moved',
  'You\'ve tried supplements, programs, doctors — and you\'re tired of starting over',
  'You can commit one Monday evening per week for 90 days',
  'You have $1,997 (or 3 × $697) set aside or ready to allocate',
];
const NOT_FOR_YOU = [
  'You\'re looking for a magic pill or a quick fix',
  'You won\'t follow a protocol when it\'s inconvenient',
  'You need 4 people\'s permission before making a health decision',
  'You expect us to work AROUND your doctor instead of WITH them',
];

const FAQ = [
  {
    q: 'What if I can\'t make Mondays at 8 PM ET?',
    a: 'Every session is recorded. You also get WhatsApp access Sun–Thu 9–5 ET to ask anything in real time. Missing a live call doesn\'t cost you anything except the live energy.',
  },
  {
    q: 'What\'s the difference between this and the $97 Challenge?',
    a: 'The Challenge is group only, no 1:1, no Annie. The Sprint is weekly 1:1 with me, biweekly hormone work with Annie, a doctor-handoff document, the full stack of bonuses, and the protocol personalized to your labs at week 6.',
  },
  {
    q: 'Will my doctor be involved?',
    a: 'Yes — we build the protocol so you can hand it to them, not around them. The Sprint ends with a one-page doctor-cleared protocol you bring to your PCP at the graduation handoff.',
  },
  {
    q: 'Is this medical care?',
    a: 'No. This is RN-led naturopathic coaching alongside your existing doctor. We don\'t prescribe, diagnose, or replace medical care. We rebuild the inputs — vascular, cortisol, blood sugar — that your medications are managing the outputs of.',
  },
];

// ============================================================
// MAIN PAGE
// ============================================================
export default function CoachingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — coach photos */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center items-center gap-3">
          <div className="headshot-ring">
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img src="/headshot.jpg" alt="Joel Polley, RN" width="100" height="100"
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
            </picture>
          </div>
          <div style={{ fontSize: '32px', color: 'var(--muted-gray)', fontWeight: 200 }}>+</div>
          <div className="headshot-ring">
            <picture>
              <source srcSet="/annie.webp" type="image/webp" />
              <img src="/annie.jpg" alt="Annie Chitate, RN" width="100" height="100"
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
            </picture>
          </div>
        </div>
      </div>

      {/* Credential bar */}
      <div className="credential-bar py-3.5">
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.4, margin: 0 }}>
            <strong>Joel Polley, RN</strong> — 20 yrs ICU/ER, Naturopathic Practitioner&nbsp;·&nbsp;
            <strong>Annie Chitate, RN</strong> — Hormone Specialist, Naturopathic Practitioner
          </p>
        </div>
      </div>

      {/* Hero copy + deadline strip + EARNED SCARCITY */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, marginBottom: 12 }}>
            90-Day BP Triangle Freedom Sprint · Application Only
          </div>
          <h1 className="font-extrabold mb-4 text-balance" style={{ color: 'var(--navy)', fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Doctor-cleared independence in 90 days.
          </h1>
          <p style={{ color: 'var(--dark-gray)', fontSize: '17px', lineHeight: 1.55, marginBottom: 8 }}>
            Two RNs. Weekly 1:1s. Daily access. One protocol — vascular, cortisol, blood sugar — built for adults whose health gave up before they did.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '14px', margin: 0 }}>
            <strong style={{ color: '#B85A36' }}>{SLOTS_REMAINING} of {SLOTS_TOTAL} founding slots remaining.</strong>&nbsp; Application reviewed personally. No buy button.
          </p>
          <div style={{ marginTop: '1.25rem', background: '#FBF8F1', border: '2px solid #B85A36', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B85A36', fontWeight: 700 }}>
              Applications close
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
              {DEADLINE_LABEL}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* PRICE CARD — moved UP to anchor before TikTok / value stack */}
      <div className="section-spacing" style={{ paddingTop: 0 }}>
        <div className="container-mobile-first">
          <div style={{ background: 'var(--navy)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C7A95E', fontWeight: 700, marginBottom: 6 }}>
              Founding cohort · introductory rate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px', marginBottom: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px', textDecoration: 'line-through' }}>{PRICE_REGULAR}</span>
              <span style={{ color: 'var(--white)', fontSize: '36px', fontWeight: 800, lineHeight: 1.1 }}>{PRICE_FOUNDING}</span>
            </div>
            <div style={{ color: '#C7A95E', fontSize: '14px', marginTop: 4 }}>
              or {PRICE_3PAY} ({PRICE_3PAY_TOTAL} total)
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: 12, fontStyle: 'italic' }}>
              {STACK_VALUE} value stack · {SLOTS_REMAINING} slots left · After {DEADLINE_LABEL.split(' ·')[0]}, it's {PRICE_REGULAR}
            </div>
          </div>
        </div>
      </div>

      <hr className="gradient-divider" />

      {/* TikTok video — proof from short-form to landing */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="text-center mb-3">
              <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, marginBottom: 6 }}>
                The video that opened this cohort
              </div>
              <h2 className="font-bold" style={{ color: 'var(--navy)', fontSize: '22px', lineHeight: 1.3 }}>
                Watch the 60 seconds first.
              </h2>
              <p style={{ color: 'var(--muted-gray)', fontSize: '13px', maxWidth: 400, margin: '8px auto 1.5rem' }}>
                If you saw it on TikTok — this is the program. If you didn't, the next minute tells you whether this is for you.
              </p>
            </div>
            <TikTokEmbed videoId="7639447507050827039" username="braveworksrn" />
          </AnimatedSection>
        </div>
      </div>

      {/* Value stack — Harry Dry rewrites */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-1 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              What's yours when you say yes.
            </h2>
            <p className="text-center mb-6" style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
              12 components. 90 days. Two RNs.
            </p>
          </AnimatedSection>
          <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 14, padding: '1.25rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {STACK.map((item, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '10px 0', borderBottom: i < STACK.length - 1 ? '1px solid #F0EDE5' : 'none' }}>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 3 }} />
                    <span style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.5 }}>{item.name}</span>
                  </div>
                  <span style={{ color: 'var(--gold, #A88A4A)', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>{item.value}</span>
                </li>
              ))}
              <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', marginTop: '6px', borderTop: '2px solid var(--navy)' }}>
                <span style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total stack value</span>
                <span style={{ color: 'var(--navy)', fontSize: '20px', fontWeight: 800 }}>{STACK_VALUE}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Picture August — Hardy/Myron L4 future-self */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-3 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              Picture August.
            </h2>
            <div style={{ maxWidth: 540, margin: '0 auto' }}>
              <p style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.7, marginBottom: 12 }}>
                You wake up before the alarm because your body is rested for the first time in years. The bottle drawer has three bottles in it, not eighteen.
              </p>
              <p style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.7, marginBottom: 12 }}>
                The afternoon pain you used to brace for hasn't shown up in sixty days. You finally have a primary care doctor — a real one — who looked at your labs and said <em>whatever you're doing, keep doing it</em>.
              </p>
              <p style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.7, marginBottom: 18 }}>
                Your spouse watches you laugh on a Tuesday at 2 PM because you have energy left.
              </p>
              <p style={{ color: 'var(--navy)', fontSize: '17px', lineHeight: 1.5, fontWeight: 700, textAlign: 'center', marginBottom: 0 }}>
                That's the destination. The Sprint is the 90 days that get you there.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* TESTIMONIALS — anonymized DMs + 1 public comment */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              What people tell me.
            </h2>
            <p className="text-center mb-7" style={{ color: 'var(--muted-gray)', fontSize: '13px', maxWidth: 480, margin: '0 auto 2rem' }}>
              These are video viewers, not Sprint clients. The Sprint is the deeper version — same protocol, with weekly 1:1, Annie's hormone module, and daily access.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderLeft: '4px solid var(--purple)', borderRadius: 12, padding: '1.25rem 1.25rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '14.5px', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 14px', flex: 1 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ borderTop: '1px solid #F0EDE5', paddingTop: 10 }}>
                    <div style={{ color: 'var(--navy)', fontSize: '13px', fontWeight: 700 }}>{t.name}</div>
                    <div style={{ color: 'var(--muted-gray)', fontSize: '12px' }}>{t.source}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Cost of inaction (Myron) */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="text-center mb-2">
              <TrendingDown size={28} style={{ color: '#B85A36', margin: '0 auto' }} />
            </div>
            <h2 className="font-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              The price of saying no.
            </h2>
            <p className="text-center mb-6" style={{ color: 'var(--muted-gray)', fontSize: '14px', maxWidth: 480, margin: '0 auto 1.5rem' }}>
              Most adults with this picture get worse, not better. Here's what the next 5 years cost on the current path.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ background: '#FBF8F1', border: '1px solid #E6DECE', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B85A36', fontWeight: 700, marginBottom: 10 }}>
                Stay on the same path
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
                {[
                  '2–3 more prescriptions added in the next 5 years',
                  '$300–500/month on supplements that don\'t move the needle',
                  '$4,800–$9,000/yr in co-pays + specialist referrals',
                  'One avoidable ER visit (the average is one every 5 yrs in this picture)',
                  'Five more years of compromised energy, sleep, mood, and intimacy',
                ].map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--dark-gray)', lineHeight: 1.55 }}>
                    <span style={{ color: '#B85A36', fontWeight: 700, flexShrink: 0 }}>×</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '13px', color: '#B85A36', fontWeight: 700, marginTop: '12px', marginBottom: 0 }}>
                Compounded 5-year cost: $30,000–$75,000+ and a smaller life.
              </p>
            </div>
            <div style={{ background: '#E6EBE0', border: '1px solid #3F5A3C', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3F5A3C', fontWeight: 700, marginBottom: 10 }}>
                Say yes once
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
                {[
                  '90 days. One investment. Done.',
                  'Supplement spend cut $200–400/month starting week 2',
                  'A real PCP with a real plan they\'ll sign off on',
                  'Doctor-cleared independence from at least one medication',
                  'Your body trusted again. Energy back. Sleep back. You back.',
                ].map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--dark-gray)', lineHeight: 1.55 }}>
                    <CheckCircle2 size={14} style={{ color: '#3F5A3C', flexShrink: 0, marginTop: 3 }} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '13px', color: '#3F5A3C', fontWeight: 700, marginTop: '12px', marginBottom: 0 }}>
                One-time cost: {PRICE_FOUNDING} (founding cohort). Pays for itself by Day 60.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BRUNSON IS / IS NOT for you */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-6 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              Is this for you?
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ background: 'var(--white)', border: '2px solid #3F5A3C', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3F5A3C', fontWeight: 700, marginBottom: 12 }}>
                This is for you if
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                {IS_FOR_YOU.map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--dark-gray)', lineHeight: 1.55 }}>
                    <CheckCircle2 size={16} style={{ color: '#3F5A3C', flexShrink: 0, marginTop: 2 }} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--white)', border: '2px solid #B85A36', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B85A36', fontWeight: 700, marginBottom: 12 }}>
                This is NOT for you if
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                {NOT_FOR_YOU.map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--dark-gray)', lineHeight: 1.55 }}>
                    <XCircle size={16} style={{ color: '#B85A36', flexShrink: 0, marginTop: 2 }} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="text-center mb-5">
              <ShieldCheck size={28} style={{ color: 'var(--purple)', margin: '0 auto 6px' }} />
              <h2 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '22px' }}>
                Triple Triangle Guarantee.
              </h2>
              <p style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>Miss any one threshold — full refund. You keep every protocol document.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GUARANTEES.map((g, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div style={{ background: 'var(--white)', border: '2px solid var(--purple)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, marginBottom: 6 }}>{g.day}</div>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{g.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-center mt-5" style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '14px', margin: '1.5rem 0 0' }}>
            I carry the risk. You carry the action.
          </p>
        </div>
      </div>

      {/* FAQ — last objections */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="text-center mb-6">
              <HelpCircle size={28} style={{ color: 'var(--purple)', margin: '0 auto 6px' }} />
              <h2 className="font-bold" style={{ color: 'var(--navy)', fontSize: '22px' }}>
                Common questions.
              </h2>
            </div>
          </AnimatedSection>
          <div style={{ display: 'grid', gap: '12px' }}>
            {FAQ.map((f, i) => (
              <AnimatedSection key={i} delay={i * 60}>
                <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem 1.25rem' }}>
                  <div style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '15px', marginBottom: 6 }}>{f.q}</div>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{f.a}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* Application — 7 questions only */}
      <AnimatedSection className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          {Date.now() < new Date(DEADLINE_ISO).getTime() ? (
            <>
              <h2 className="font-bold mb-1 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
                Apply.
              </h2>
              <p className="text-center mb-2" style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
                7 quick questions. Joel reads every one personally. No payment collected.
              </p>
              <p className="text-center mb-4" style={{ color: '#B85A36', fontSize: '13px', fontWeight: 700 }}>
                Closes {DEADLINE_LABEL} · {SLOTS_REMAINING} of {SLOTS_TOTAL} slots remaining
              </p>
              <div style={{ background: 'var(--navy)', borderRadius: 12, padding: '14px 18px', margin: '0 auto 1.5rem', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C7A95E', fontWeight: 700 }}>
                    What you're applying for
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'line-through' }}>{PRICE_REGULAR}</span>
                    <span style={{ color: 'var(--white)', fontSize: '22px', fontWeight: 800 }}>{PRICE_FOUNDING}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>or {PRICE_3PAY}</span>
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', lineHeight: 1.4, flexShrink: 0 }}>
                  Stack value<br />
                  <span style={{ color: '#C7A95E', fontSize: '15px', fontWeight: 700 }}>{STACK_VALUE}</span>
                </div>
              </div>
              <ApplicationForm />
            </>
          ) : (
            <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <h2 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '24px' }}>
                Founding cohort closed.
              </h2>
              <p style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.6, margin: '0 auto 1.25rem', maxWidth: 480 }}>
                Applications for this cohort closed {DEADLINE_LABEL}. The next opening is ~90 days out at the regular price of {PRICE_REGULAR}.
              </p>
              <p style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                To get on the waitlist, email <a href="mailto:braveworksrn@gmail.com" style={{ color: 'var(--purple)', fontWeight: 600 }}>braveworksrn@gmail.com</a> with the subject line "Next cohort."
              </p>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Close */}
      <div className="section-spacing gradient-navy">
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--white)', fontSize: '17px', lineHeight: 1.5, margin: '0 0 8px', fontWeight: 600 }}>
            Pills manage output. Protocol fixes input.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: 0 }}>
            Doctor-cleared independence — in 90 days, with two RNs in your corner.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APPLICATION FORM — 7 questions only (down from 17)
// ============================================================
function ApplicationForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    ageRange: '',
    investmentRange: '',
    whyNow: '',
    whenStart: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const required = ['name', 'email', 'ageRange', 'investmentRange', 'whyNow', 'whenStart'];
    const missing = required.filter((f) => !String(form[f] || '').trim());
    if (missing.length) {
      setError('Please complete every required field marked with ·');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/coaching-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ background: 'var(--white)', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center', border: '1px solid #E5E7EB' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: '#E6EBE0', display: 'grid', placeItems: 'center' }}>
          <CheckCircle2 size={28} style={{ color: '#3F5A3C' }} />
        </div>
        <h3 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '20px' }}>Got it — Joel reads every one.</h3>
        <p style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 10px' }}>
          If you're a fit for the founding cohort, expect a reply within 24-48 hours with the link to schedule a 20-minute fit call.
        </p>
        <p style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: 1.5 }}>
          If you don't hear back within a week, the cohort is full. Next opening in ~90 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem', display: 'grid', gap: '1.25rem' }}>
      <TextField label="Full name" required value={form.name} onChange={(v) => update('name', v)} />
      <TextField label="Email" type="email" required value={form.email} onChange={(v) => update('email', v)} />
      <TextField label="Phone" placeholder="for the fit call" value={form.phone} onChange={(v) => update('phone', v)} />
      <Radio label="Age range" required value={form.ageRange} onChange={(v) => update('ageRange', v)}
        options={['30–44', '45–54', '55–64', '65+']} />
      <Radio label="Investment range you've allocated for your health this year" required
        value={form.investmentRange} onChange={(v) => update('investmentRange', v)}
        options={[
          'Under $2,000',
          '$2,000–$5,000',
          '$5,000–$10,000',
          '$10,000+',
          'I haven\'t allocated for this yet',
        ]} />
      <Textarea label="Why now? What changed?" required
        placeholder="One or two sentences. Why this week, not next year?"
        value={form.whyNow} onChange={(v) => update('whyNow', v)} />
      <Radio label="When could you realistically start?" required
        value={form.whenStart} onChange={(v) => update('whenStart', v)}
        options={['This week', 'Within 30 days', 'Within 90 days', 'Not sure yet']} />

      {error && (
        <p style={{ color: '#B85A36', fontSize: '14px', margin: 0, padding: '10px 12px', background: '#F5E4DA', borderRadius: 8 }}>{error}</p>
      )}

      <button type="submit" disabled={submitting}
        className="btn-standard btn-cta gradient-purple-btn"
        style={{ color: 'var(--white)', fontSize: '16px', fontWeight: 700 }}>
        {submitting ? (
          <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Sending to Joel…</span>
        ) : (
          <span className="flex items-center gap-2 justify-center"><Phone size={18} /> Submit — Joel reads every one <ArrowRight size={16} /></span>
        )}
      </button>

      <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
        No payment collected at this step. Submission doesn't sign you up — Joel screens every applicant personally and replies within 24-48 hours if there's a fit.
      </p>
    </form>
  );
}

// ── Form primitives ───────────────────────────────────────
function TextField({ label, type = 'text', value, onChange, placeholder = '', required = false }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--purple)', marginLeft: 4 }}>·</span>}
      </div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: '15px', fontFamily: 'inherit', color: 'var(--dark-gray)', background: 'var(--white)', boxSizing: 'border-box' }} />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder = '', required = false }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--purple)', marginLeft: 4 }}>·</span>}
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: '15px', fontFamily: 'inherit', color: 'var(--dark-gray)', background: 'var(--white)', boxSizing: 'border-box', resize: 'vertical', minHeight: 70, lineHeight: 1.5 }} />
    </label>
  );
}

function Radio({ label, options, value, onChange, required = false }) {
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--purple)', marginLeft: 4 }}>·</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              style={{ textAlign: 'left', padding: '9px 12px',
                background: selected ? '#E6EBE0' : 'var(--white)',
                border: `1.5px solid ${selected ? '#3F5A3C' : '#E5E7EB'}`,
                borderRadius: 8, fontSize: '14px',
                fontWeight: selected ? 600 : 400,
                color: 'var(--dark-gray)', cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.12s ease, border-color 0.12s ease',
                display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selected ? '#3F5A3C' : '#CBC9BD'}`, background: selected ? '#3F5A3C' : 'transparent', flexShrink: 0 }} />
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
