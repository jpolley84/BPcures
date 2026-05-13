// /coaching — The BP Triangle Freedom Sprint application page.
//
// 2026-05-12: built for the new $4,997 90-day flagship offer. Two-coach
// model (Joel + Annie), application-only flow (no buy button — Brunson
// high-ticket rule). Form submits to /api/coaching-apply which stores
// in KV + emails Joel a notification.
//
// Architecture matches the bpcures-style CheckoutPage.jsx so the buyer
// feels brand continuity from $17 → $4,997. Same color tokens, same
// section spacing, same Animation pattern.

import { useState } from 'react';
import { Loader2, CheckCircle2, Heart, Users, Play, Award, Sparkles, ShieldCheck, Calendar, Phone } from 'lucide-react';
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

const phases = [
  {
    weeks: 'Wks 1-2',
    name: 'Diagnostic Intensive',
    bullets: [
      'Joel reviews your labs, meds list, BP log, and lifestyle',
      'Annie reviews your hormone panel + cortisol pattern',
      'Joint custom 30-page protocol document delivered',
    ],
  },
  {
    weeks: 'Wks 3-6',
    name: 'Implementation',
    bullets: [
      'Weekly 60-min 1:1 video calls with Joel',
      'Daily Voxer/text access to BOTH Joel & Annie',
      'Bi-weekly hormone check-ins with Annie',
    ],
  },
  {
    weeks: 'Wks 7-10',
    name: 'Stabilization',
    bullets: [
      'Numbers locked in; doctor-conversation prep',
      'One-page doctor handoff document',
      'Joel role-plays your next appointment until you can run it cold',
    ],
  },
  {
    weeks: 'Wks 11-12',
    name: 'Independence',
    bullets: [
      'Doctor-supervised medication step-down WITH you',
      'Graduate transition into Skool VIP tier',
      'Quarterly reunion calls — for life',
    ],
  },
];

const whatsIncluded = [
  '12 weekly 60-min 1:1 video sessions',
  'Daily Voxer access to both RNs (weeks 1-6)',
  'Custom 30-page protocol document',
  "Annie's Hormone Foundation Audit",
  'Lab interpretation + doctor-conversation script',
  'Doctor-conversation video coaching (Joel role-plays)',
  'All lower-tier products included ($17 kit, $30 Reset Kit, Boomers book, cookbook)',
  'Lifetime Skool VIP tier access',
  'Quarterly graduate reunion calls (for life)',
];

const bonuses = [
  { name: "Joel's Doctor Conversation Video Coach", value: '$497' },
  { name: "Annie's Hormone Foundation Audit", value: '$497', highlight: 'CORE DELIVERABLE' },
  { name: 'Quarterly Graduate Reunion Calls (4/yr × $197)', value: '$788' },
  { name: 'Lifetime BraveWorks library updates', value: '$497' },
  { name: 'VIP early access to all future BraveWorks programs', value: 'priceless' },
];

const guaranteePillars = [
  { day: 'Day 30', threshold: 'At least 8 mmHg systolic drop sustained' },
  { day: 'Day 60', threshold: 'Your doctor agrees to discuss dose reduction' },
  { day: 'Day 90', threshold: 'You feel deep, calm control of your numbers' },
];

export default function CoachingPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bpNumbers: '',
    currentMeds: '',
    whyNow: '',
    whyAFit: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.whyNow.trim()) {
      setError('Name, email, and "why now" are required.');
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
      <main className="min-h-screen" style={{ background: 'var(--light-gray)', display: 'grid', placeItems: 'center', padding: '4rem 1.5rem' }}>
        <div className="container-mobile-first text-center" style={{ background: 'var(--white)', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 1.5rem', borderRadius: '50%', background: '#E8F8F5', display: 'grid', placeItems: 'center' }}>
            <CheckCircle2 size={36} style={{ color: '#4A6741' }} />
          </div>
          <h1 className="font-bold mb-3" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: 1.3 }}>
            Application received.
          </h1>
          <p style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.6, margin: '0 0 16px' }}>
            Joel reads every application personally. If you're a fit for this cohort, you'll hear from him within 3-5 business days with next steps for a 20-minute fit call.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: 1.6 }}>
            If you don't hear back within a week, the cohort is likely full — you're on the waitlist for the next opening (~90 days out).
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="pt-8 pb-5 sm:pt-10 sm:pb-6" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        <div className="flex justify-center items-center gap-3">
          <div className="headshot-ring">
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img
                src="/headshot.jpg"
                alt="Joel Polley, RN"
                width="100"
                height="100"
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }}
              />
            </picture>
          </div>
          <div style={{ fontSize: '32px', color: 'var(--muted-gray)', fontWeight: 200 }}>+</div>
          {/* Annie placeholder — when her photo file is provided, swap in
              like the Joel one. Until then we render her initial in a ring
              matching the brand. */}
          <div className="headshot-ring" style={{ width: '98px', height: '98px', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#FBF8F1', border: '3px solid white', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: '36px', color: 'var(--purple)', fontWeight: 600 }}>
              A
            </div>
          </div>
        </div>
      </div>

      {/* Credential bar */}
      <div className="credential-bar py-3.5" style={{ animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.4, letterSpacing: '0.02em', margin: 0 }}>
            <strong>Joel Polley, RN</strong> — 20 yrs ICU/ER, Naturopathic Practitioner &nbsp;·&nbsp;
            <strong>Annie Chitate, RN</strong> — Hormone Specialist, Naturopathic Practitioner
          </p>
        </div>
      </div>

      {/* Social proof rail */}
      <div className="py-5" style={{ background: 'var(--light-gray)', animation: 'fadeIn 0.6s ease-out 0.4s both' }}>
        <div className="container-mobile-first">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {[
              { icon: Play, text: '90,000+ followers on TikTok' },
              { icon: Users, text: '1,100+ community members' },
              { icon: Award, text: 'Two RNs. One protocol.' },
            ].map((item, i) => (
              <div key={i} className="proof-badge">
                <item.icon size={15} style={{ color: 'var(--purple)' }} />
                <span style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero copy */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <div className="mb-3" style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700 }}>
            The BP Triangle Freedom Sprint · 90 Days · Application Only
          </div>
          <h1 className="font-extrabold mb-5 text-balance" style={{ color: 'var(--navy)', fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            Doctor-cleared off your primary BP medication in 90 days — or your money back.
          </h1>
          <p className="mb-3" style={{ color: 'var(--dark-gray)', fontSize: '18px', lineHeight: 1.7 }}>
            Twelve weeks. Two RNs. Daily access. Custom protocol. The complete BP Triangle Method™ applied to <em>your</em> case — vascular, cortisol, and (for women 35-65) the hormone layer that quietly drives half of all BP cases.
          </p>
          <p style={{ color: 'var(--muted-gray)', fontSize: '16px', lineHeight: 1.5 }}>
            5 slots per cohort. Application gated. Price revealed on the fit call.
          </p>
        </div>
      </AnimatedSection>

      <hr className="gradient-divider" />

      {/* Why two coaches */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-6 text-balance text-center" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: 1.3 }}>
              Why two coaches.
            </h2>
            <p className="text-center mb-8" style={{ color: 'var(--dark-gray)', fontSize: '16px', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 2rem' }}>
              Most BP coaching covers BP. The Triangle says BP is <em>downstream</em> of three corners — vascular, cortisol, blood sugar — and for women 35-65, the hormone layer compounds all three. Joel runs the BP work. Annie covers the hormone-cortisol axis. Same protocol. Two specialists.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'Joel Polley, RN',
                creds: '20 yrs ICU & emergency medicine. Naturopathic practitioner. Author of the BP Triangle Method™.',
                domain: 'BP, vascular, blood sugar corners, doctor conversation, medication step-down.',
              },
              {
                title: 'Annie Chitate, RN',
                creds: 'Hormone specialist, naturopathic practitioner. Founder of RestoreHER Hormones.',
                domain: 'Cortisol corner deep work, perimenopause/menopause hormone protocols, the hormone-BP undercurrent.',
              },
            ].map((c, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem' }}>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '18px' }}>{c.title}</h3>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 12px' }}>{c.creds}</p>
                  <p style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                    <strong style={{ color: 'var(--dark-gray)' }}>Owns:</strong> {c.domain}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* 12-week journey */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '24px', lineHeight: 1.3 }}>
              The 12-week journey.
            </h2>
            <p className="text-center mb-8" style={{ color: 'var(--muted-gray)', fontSize: '15px' }}>
              Four phases. Each one earns the next.
            </p>
          </AnimatedSection>
          <div className="space-y-4">
            {phases.map((phase, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderLeft: '4px solid var(--purple)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700 }}>{phase.weeks}</span>
                    <h3 className="font-bold" style={{ color: 'var(--navy)', fontSize: '18px' }}>{phase.name}</h3>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                    {phase.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2" style={{ fontSize: '14px', color: 'var(--dark-gray)', lineHeight: 1.55 }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 3 }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-6 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              What's included.
            </h2>
          </AnimatedSection>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
            {whatsIncluded.map((item, i) => (
              <AnimatedSection key={i} delay={i * 40}>
                <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--white)', border: '1px solid #E5E7EB' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.55 }}>{item}</span>
                </li>
              </AnimatedSection>
            ))}
          </ul>
        </div>
      </div>

      {/* Bonus stack */}
      <div className="section-spacing">
        <div className="container-mobile-first">
          <AnimatedSection>
            <h2 className="font-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
              The complete stack.
            </h2>
            <p className="text-center mb-6" style={{ color: 'var(--muted-gray)', fontSize: '14px' }}>
              Built so the bonuses alone exceed the cost of most "single-coach" programs.
            </p>
          </AnimatedSection>
          <div style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem', marginBottom: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
              {bonuses.map((b, i) => (
                <li key={i} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.5, fontWeight: 500 }}>
                      <Sparkles size={14} style={{ color: 'var(--purple)', display: 'inline', marginRight: 6 }} />
                      {b.name}
                    </div>
                    {b.highlight && (
                      <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, marginTop: 2 }}>
                        ★ {b.highlight}
                      </div>
                    )}
                  </div>
                  <span className="value-strike" style={{ color: 'var(--muted-gray)', fontSize: '15px', fontWeight: 500, flexShrink: 0 }}>{b.value}</span>
                </li>
              ))}
              <li className="flex items-start justify-between gap-4 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                <div style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '15px' }}>Bonus stack value</div>
                <div style={{ color: 'var(--purple)', fontWeight: 700, fontSize: '17px' }}>$2,279+</div>
              </li>
            </ul>
          </div>
          <p className="text-center italic" style={{ color: 'var(--muted-gray)', fontSize: '14px', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
            "If you only counted the bonuses, this is a $2,300 program. The transformation makes it a $50,000 program." — the operating principle.
          </p>
        </div>
      </div>

      {/* Triple Triangle Guarantee */}
      <div className="section-spacing" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first">
          <AnimatedSection>
            <div className="text-center mb-6">
              <ShieldCheck size={32} style={{ color: 'var(--purple)', margin: '0 auto 8px' }} />
              <h2 className="font-bold mb-2" style={{ color: 'var(--navy)', fontSize: '24px' }}>
                The Triple Triangle Promise.
              </h2>
              <p style={{ color: 'var(--muted-gray)', fontSize: '14px' }}>Three thresholds. Miss any one — full refund AND you keep everything.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guaranteePillars.map((g, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div style={{ background: 'var(--white)', border: '2px solid var(--purple)', borderRadius: 12, padding: '1.25rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 700, marginBottom: 8 }}>{g.day}</div>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{g.threshold}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-center mt-6 italic" style={{ color: 'var(--muted-gray)', fontSize: '13px', lineHeight: 1.6, maxWidth: 480, margin: '1.5rem auto 0' }}>
            <em>Pills manage output. Protocol fixes input. AND not INSTEAD OF — your meds stay while we move the inputs underneath them.</em>
          </p>
        </div>
      </div>

      {/* Scarcity bar */}
      <div style={{ background: 'var(--navy)', padding: '2rem 1rem' }}>
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--white)', fontSize: '15px', lineHeight: 1.5, margin: '0 0 8px' }}>
            <strong style={{ color: 'var(--gold)' }}>5 slots per cohort.</strong> Next applications close end-of-week.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
            Joel reads every application personally. Fit calls happen by phone (20 min). Price revealed on the call.
          </p>
        </div>
      </div>

      {/* Application form */}
      <AnimatedSection className="section-spacing">
        <div className="container-mobile-first">
          <h2 className="font-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '24px' }}>
            Apply for the next cohort.
          </h2>
          <p className="text-center mb-8" style={{ color: 'var(--muted-gray)', fontSize: '14px' }}>
            ~3 minutes. Five fields. Read by Joel personally.
          </p>

          <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.5rem', display: 'grid', gap: '1rem' }}>
            <Field label="Your name *" value={form.name} onChange={(v) => update('name', v)} placeholder="First and last" />
            <Field label="Email *" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="best email — Joel reads every reply" />
            <Field label="Phone (optional)" value={form.phone} onChange={(v) => update('phone', v)} placeholder="for the fit call" />
            <Field label="Your current BP numbers" value={form.bpNumbers} onChange={(v) => update('bpNumbers', v)} placeholder="e.g. morning 152/96, evening 144/88" />
            <Field label="Current medications" value={form.currentMeds} onChange={(v) => update('currentMeds', v)} placeholder="BP meds, statins, thyroid, anything else" multiline />
            <Field label="Why now? *" value={form.whyNow} onChange={(v) => update('whyNow', v)} placeholder="What changed? Why apply this week, not next year?" multiline required />
            <Field label="Why do you think you'd be a fit?" value={form.whyAFit} onChange={(v) => update('whyAFit', v)} placeholder="What about you tells you this is the right kind of work?" multiline />

            {error && (
              <p style={{ color: '#B85A36', fontSize: '14px', margin: 0 }}>{error}</p>
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
                <span className="flex items-center gap-2"><Phone size={18} /> Submit application →</span>
              )}
            </button>

            <p className="text-center" style={{ color: 'var(--muted-gray)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
              Submitting doesn't sign you up for anything. Joel reads, screens, and replies within 3-5 business days if there's a fit. No payment is collected until after the fit call.
            </p>
          </form>
        </div>
      </AnimatedSection>

      {/* Final close */}
      <div className="section-spacing gradient-navy">
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--white)', fontSize: '17px', lineHeight: 1.7, margin: '0 0 12px' }}>
            Pills manage output. Protocol fixes input.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            Doctor-cleared independence — in 90 days, with two RNs in your corner.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8" style={{ background: 'var(--light-gray)' }}>
        <div className="container-mobile-first text-center">
          <p style={{ color: 'var(--muted-gray)', fontSize: '12px' }}>&copy; 2026 BraveWorks RN. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, multiline = false, required = false }) {
  const base = {
    width: '100%',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    color: 'var(--dark-gray)',
    background: 'var(--white)',
  };
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark-gray)', marginBottom: 4 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={3}
          style={{ ...base, resize: 'vertical', minHeight: 70 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={base}
        />
      )}
    </label>
  );
}
