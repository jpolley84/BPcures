// /coaching — The 90-Day BP Triangle Freedom Sprint application page.
//
// 2026-05-13 overhaul: streamlined funnel, higher anchor price ($6,997),
// new $14,616 value stack matched to Wakita's signed offer, cost-of-
// inaction section, and a 17-question pre-qualification application that
// filters tire kickers using:
//   • Chris Do — diagnose-before-prescribe, sophistication tests
//   • Daniel Priestley — Score on the Doors, commitment scaling
//   • Myron Golden — cost-of-inaction frame, premium-tier framing
//   • Hormozi — disqualification, scaled investment range
//   • Brunson — application-only, decision-maker filter
//
// Application-only (no buy button). Submits to /api/coaching-apply.

import { useState } from 'react';
import { Loader2, CheckCircle2, Users, Play, ShieldCheck, Phone, TrendingDown, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

function AnimatedSection({ children, className = '', delay = 0, style = {} }) {
  const [ref, isVisible] = useScrollAnimation(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Value stack (mirrors Wakita's signed offer document) ──
const STACK = [
  { name: 'Weekly 1:1 with Joel — 12 sessions (Mondays 8 PM ET)', value: '$5,964' },
  { name: 'Biweekly hormone coaching with Annie — 6 sessions', value: '$1,782' },
  { name: 'Full supplement + diet audit (live, 60 min)', value: '$697' },
  { name: 'Daily schedule audit', value: '$497' },
  { name: 'WhatsApp office hours (Sun–Thu 9–5 ET) × 90 days', value: '$1,997' },
  { name: 'Skool VIP membership (90-day access)', value: '$297' },
  { name: 'All BraveWorks courses — lifetime', value: '$1,997' },
  { name: 'eBook library — lifetime', value: '$497' },
  { name: 'Daily tailored email coaching', value: '$497' },
  { name: 'Tracker suite (BP / symptom / food / sleep)', value: '$97' },
  { name: 'Partner inclusion guide', value: '$97' },
  { name: 'Barbara O\'Neill LIVE Event — 20% off', value: '$197' },
];
const STACK_VALUE = '$14,616';
const PRICE_REGULAR = '$6,997';      // anchor — what future cohorts pay
const PRICE_FOUNDING = '$1,997';     // founding-cohort introductory rate
const PRICE_3PAY = '$697 × 3';       // matches the live Stripe 3-pay link
const PRICE_3PAY_TOTAL = '$2,091';

// Founding cohort closes 2026-05-17 at 23:59 ET (end of day Sunday).
// After this instant, the form swaps to a "closed — next cohort" state.
// Update both DEADLINE_ISO and DEADLINE_LABEL when rolling cohort 2.
const DEADLINE_ISO = '2026-05-18T03:59:00Z'; // midnight ET on May 18 = end of May 17
const DEADLINE_LABEL = 'Sunday, May 17 · 11:59 PM ET';

const GUARANTEES = [
  { day: 'Day 30', text: 'Top three symptoms not improving → full refund, keep every protocol.' },
  { day: 'Day 60', text: 'Labs not moving in the right direction → full refund.' },
  { day: 'Day 90', text: 'Don\'t feel safer in your body than today → full refund.' },
];

export default function CoachingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — coaches */}
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

      {/* Hero copy — terse */}
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
            5 slots per cohort. Application reviewed personally. No buy button.
          </p>
          {/* Deadline strip — hard close on May 17. Sits right under the
              opening pitch so the urgency lands before the value stack. */}
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

      <hr className="gradient-divider" />

      {/* Value stack */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-1 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              What you get.
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
          <div style={{ marginTop: '1rem', background: 'var(--navy)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C7A95E', fontWeight: 700, marginBottom: 6 }}>
              Founding cohort · introductory rate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px', marginBottom: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px', textDecoration: 'line-through' }}>{PRICE_REGULAR}</span>
              <span style={{ color: 'var(--white)', fontSize: '32px', fontWeight: 800, lineHeight: 1.1 }}>{PRICE_FOUNDING}</span>
            </div>
            <div style={{ color: '#C7A95E', fontSize: '13px', marginTop: 4 }}>
              or {PRICE_3PAY} ({PRICE_3PAY_TOTAL} total)
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: 10, fontStyle: 'italic' }}>
              Founding-cohort rate. 5 slots. Applications close {DEADLINE_LABEL}. After that, it's {PRICE_REGULAR}.
            </div>
          </div>
        </div>
      </div>

      {/* Cost of inaction (Myron Golden) */}
      <div className="section-spacing">
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

      {/* Application form (or closed-cohort message when past deadline) */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          {Date.now() < new Date(DEADLINE_ISO).getTime() ? (
            <>
              <h2 className="font-bold mb-1 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
                Apply.
              </h2>
              <p className="text-center mb-2" style={{ color: 'var(--muted-gray)', fontSize: '13px' }}>
                ~6 minutes. Mostly clicks. Read by Joel personally. No payment collected.
              </p>
              <p className="text-center mb-6" style={{ color: '#B85A36', fontSize: '13px', fontWeight: 700 }}>
                Closes {DEADLINE_LABEL}
              </p>
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
// Application form — 17 questions, pre-qualification heavy.
// Click-driven to keep friction low despite the higher question count.
// ============================================================
function ApplicationForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    ageRange: '',
    bpRange: '',
    bpMeds: '',
    healthScore: '',
    sleepScore: '',
    stressScore: '',
    costOfInaction: '',
    commitment: '',
    pastAttempts: '',
    successLook: '',
    investmentRange: '',
    decisionMaker: '',
    whenStart: '',
    whyNow: '',
    foundMe: '',
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
    const required = ['name', 'email', 'ageRange', 'bpRange', 'commitment', 'investmentRange', 'decisionMaker', 'whenStart', 'whyNow'];
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
        <h3 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '20px' }}>Application received.</h3>
        <p style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 10px' }}>
          Joel reads every application personally. If you're a fit, expect a reply within 3–5 business days with next steps for a 20-minute fit call.
        </p>
        <p style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: 1.5 }}>
          If you don't hear back within a week, the cohort is full. Next opening in ~90 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem', display: 'grid', gap: '1.25rem' }}>
      <Section title="The basics">
        <TextField label="Full name" required value={form.name} onChange={(v) => update('name', v)} />
        <TextField label="Email" type="email" required value={form.email} onChange={(v) => update('email', v)} />
        <TextField label="Phone" placeholder="for the fit call" value={form.phone} onChange={(v) => update('phone', v)} />
        <Radio label="Age range" required value={form.ageRange} onChange={(v) => update('ageRange', v)}
          options={['30–44', '45–54', '55–64', '65+']} />
      </Section>

      <Section title="Your numbers (snapshot)">
        <Radio label="Your BP usually runs" required value={form.bpRange} onChange={(v) => update('bpRange', v)}
          options={['Under 130/80', '130s–140s / 80s–90s', '140s–150s / 90s+', '150s+ / 95s+', "Don't track / don't know"]} />
        <Radio label="Currently on BP medication?" value={form.bpMeds} onChange={(v) => update('bpMeds', v)}
          options={['None', '1', '2', '3+', 'Recently stopped', 'I want OFF']} />
        <Radio label="Rate your CURRENT health (1 = worst, 10 = best)" value={form.healthScore} onChange={(v) => update('healthScore', v)}
          options={['1–3 (struggling)', '4–5 (getting by)', '6–7 (okay)', '8–10 (good)']} />
        <Radio label="Average sleep last 30 days" value={form.sleepScore} onChange={(v) => update('sleepScore', v)}
          options={['Less than 5 hrs', '5–6 hrs', '6–7 hrs', '7+ hrs']} />
        <Radio label="Stress level last 90 days (1–10)" value={form.stressScore} onChange={(v) => update('stressScore', v)}
          options={['1–3 (calm)', '4–6 (medium)', '7–8 (high)', '9–10 (constantly overwhelmed)']} />
      </Section>

      <Section title="Where you are mentally">
        <Textarea label="If you DON'T fix this in the next 90 days, what does it cost you?"
          placeholder="Be specific. Medical, financial, relational, time off the planet. (This is the most important question on the page.)"
          value={form.costOfInaction} onChange={(v) => update('costOfInaction', v)} />
        <Radio label="On a 1–10 scale, how committed are you to following the plan EVEN ON HARD DAYS?" required
          value={form.commitment} onChange={(v) => update('commitment', v)}
          options={['10 — I will do whatever it takes', '8–9 — Very committed', '6–7 — Pretty committed', '5 or less — Honestly not sure']} />
        <Textarea label="What have you tried before that didn't stick? Why didn't it?"
          placeholder="Specific programs, coaches, supplements, diets. The more honest, the better the fit assessment."
          value={form.pastAttempts} onChange={(v) => update('pastAttempts', v)} />
        <Textarea label="What does success look like 90 days from now?"
          placeholder="Be specific. 'Better health' isn't an answer. 'Off Lisinopril, sleeping 7 hours, walking 2 miles without pain' is."
          value={form.successLook} onChange={(v) => update('successLook', v)} />
      </Section>

      <Section title="The fit math">
        <Radio label="Investment range you're comfortable with for your health THIS YEAR" required
          value={form.investmentRange} onChange={(v) => update('investmentRange', v)}
          options={[
            'Under $2,000',
            '$2,000–$5,000',
            '$5,000–$10,000',
            '$10,000+',
            'I haven\'t allocated for this yet',
          ]} />
        <Radio label="Are you the sole financial decision maker?" required
          value={form.decisionMaker} onChange={(v) => update('decisionMaker', v)}
          options={['Yes — I decide', 'No — I need spouse/partner approval', 'No — other (please note in Why Now)']} />
        <Radio label="When could you realistically start?" required
          value={form.whenStart} onChange={(v) => update('whenStart', v)}
          options={['This week', 'Within 30 days', 'Within 90 days', 'Not sure yet']} />
        <Textarea label="Why now? What changed?" required
          placeholder="Why this week, not next year? Be honest — vague answers don't make the fit call."
          value={form.whyNow} onChange={(v) => update('whyNow', v)} />
      </Section>

      <Section title="Last one">
        <Radio label="How did you find me?" value={form.foundMe} onChange={(v) => update('foundMe', v)}
          options={['TikTok', 'Instagram', 'Facebook', 'Skool community', 'Email from Joel', 'Friend / word of mouth', 'Other']} />
      </Section>

      {error && (
        <p style={{ color: '#B85A36', fontSize: '14px', margin: 0, padding: '10px 12px', background: '#F5E4DA', borderRadius: 8 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-standard btn-cta gradient-purple-btn"
        style={{ color: 'var(--white)', fontSize: '16px', fontWeight: 700 }}
      >
        {submitting ? (
          <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Submitting...</span>
        ) : (
          <span className="flex items-center gap-2 justify-center"><Phone size={18} /> Submit application <ArrowRight size={16} /></span>
        )}
      </button>

      <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
        Submitting doesn't sign you up. Joel reads, screens, and replies within 3–5 business days if there's a fit. No payment collected until after the fit call.
      </p>
    </form>
  );
}

// ── Form primitives ───────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, paddingBottom: 4, borderBottom: '1px solid #E5E7EB' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function TextField({ label, type = 'text', value, onChange, placeholder = '', required = false }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--purple)', marginLeft: 4 }}>·</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: '15px', fontFamily: 'inherit', color: 'var(--dark-gray)', background: 'var(--white)', boxSizing: 'border-box' }}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder = '', required = false }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--purple)', marginLeft: 4 }}>·</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', fontSize: '15px', fontFamily: 'inherit', color: 'var(--dark-gray)', background: 'var(--white)', boxSizing: 'border-box', resize: 'vertical', minHeight: 70, lineHeight: 1.5 }}
      />
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
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                textAlign: 'left', padding: '9px 12px',
                background: selected ? '#E6EBE0' : 'var(--white)',
                border: `1.5px solid ${selected ? '#3F5A3C' : '#E5E7EB'}`,
                borderRadius: 8, fontSize: '14px',
                fontWeight: selected ? 600 : 400,
                color: 'var(--dark-gray)', cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.12s ease, border-color 0.12s ease',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selected ? '#3F5A3C' : '#CBC9BD'}`, background: selected ? '#3F5A3C' : 'transparent', flexShrink: 0 }} />
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
