// /coaching — Free 30-Minute Discovery Call with Joel Polley, RN
//
// 2026-05-25 rewrite. Previous version sold a paid $297 BP Triangle Diagnostic
// Session as direct checkout. That offer is retired here. The new page is a
// free 30-minute discovery-call landing with an embedded Calendly widget.
//
// Rationale: lowering the friction from paid $297 to a free 30-min call
// removes the price-jump objection that was killing application volume in
// the May founding-cohort launch (0 sales from ~8K emails). The free call
// is the new top of the high-ticket ladder; conversion into paid programs
// happens on the call, not on the page.
//
// Calendly: https://calendly.com/braveworksrn/30min
// All "Work with Joel 1:1" CTAs site-wide now route here.

import { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, ClipboardCheck, MessageCircle, HelpCircle, Calendar, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CALENDLY_URL = 'https://calendly.com/braveworksrn/30min';

// Calendly inline embed. Loads the widget script once on mount and renders
// the iframe at full width. Falls back gracefully on slow connections —
// the "Pick your time" button below the widget links directly to Calendly.
function CalendlyInline() {
  useEffect(() => {
    const SRC = 'https://assets.calendly.com/assets/external/widget.js';
    if (typeof document === 'undefined') return;
    if (document.querySelector(`script[src="${SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={`${CALENDLY_URL}?hide_event_type_details=1&hide_gdpr_banner=1`}
      style={{ minWidth: '320px', height: '700px', background: 'var(--paper-light)', borderRadius: 12, border: '1px solid var(--border)' }}
    />
  );
}

export default function CoachingPage() {
  const fadeIn = useScrollAnimation();

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#E8F2E5', color: '#3F5A3C', letterSpacing: '0.14em' }}>
            <Sparkles size={12} style={{ display: 'inline-block', marginRight: 6, verticalAlign: -1 }} />
            Free 30-minute call &middot; No card required
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--ink)' }}>
            Thirty minutes with a real nurse. Free.
          </h1>
          <p className="text-lg sm:text-xl mb-7 max-w-2xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Bring your numbers, your meds, and the question that's been keeping you up. I'll listen, ask the right questions, and tell you honestly if I can help &mdash; or who can.
          </p>

          <div className="mb-3">
            <a
              href={CALENDLY_URL}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02]"
              style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}
            >
              Pick your time <ArrowRight size={18} />
            </a>
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Zoom &middot; 30 minutes &middot; You leave the call with a next step, not a pitch
          </div>
        </div>
      </section>

      {/* ─── WHY THIS, WHY NOW ────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>Why a discovery call</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-5" style={{ color: 'var(--ink)' }}>
            The protocol is generic. Your body isn't.
          </h2>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            One corner of the BP Triangle is loudest in your body right now &mdash; vascular, cortisol, or blood sugar. Until you know which, you're guessing. This call exists so we can stop guessing together.
          </p>
          <p className="text-lg font-medium" style={{ color: 'var(--ink)' }}>
            Thirty minutes of nursing time costs you nothing and might save you six weeks of trial and error.
          </p>
        </div>
      </section>

      {/* ─── WHAT THE CALL IS ─────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em', textAlign: 'center' }}>What happens on the call</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center" style={{ color: 'var(--ink)' }}>
            Thirty minutes. One Zoom. Three things you walk away with.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: ClipboardCheck, title: '1. A clear picture', body: "We look at your home BP log, your meds, your sleep, your stress, your A1c if you have it. I tell you which corner of the BP Triangle is most likely driving your numbers." },
              { icon: MessageCircle, title: '2. An honest answer', body: "If this is something I can help with, I'll tell you exactly how. If it's not, I'll tell you who to talk to instead. No pitch, no pressure. Just nursing." },
              { icon: ArrowRight, title: '3. A next step', body: "You leave with one concrete action to take this week &mdash; whether that's working with me, getting a specific lab, or having a real conversation with your doctor." },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="p-5 rounded-xl" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>
                  <Icon size={26} strokeWidth={1.5} color="var(--sage-deep)" />
                  <h3 className="font-serif text-lg mt-3 mb-2" style={{ color: 'var(--ink)' }}>{card.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CALENDLY EMBED ───────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>Book your call</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3 text-center" style={{ color: 'var(--ink)' }}>
            Pick a time that works for you.
          </h2>
          <p className="text-base mb-7 text-center max-w-xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            All times shown in your timezone. Confirmation lands in your inbox the second you book.
          </p>

          <CalendlyInline />

          <div className="mt-5 text-center">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold"
              style={{ color: 'var(--clay)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Widget not loading? Open Calendly directly &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF — static link ──────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-xl mx-auto px-5 text-center">
          <p className="text-sm font-medium mb-3 uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
            Where the work shows up
          </p>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>155K on TikTok &middot; 151K on Facebook &middot; 1,100+ in the Skool community.</strong> The protocol works. The call is where we figure out how it fits your body.
          </p>
          <a
            href="https://tiktok.com/@braveworksrn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold"
            style={{ color: 'var(--clay)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            See Joel on TikTok &rarr; @braveworksrn
          </a>
        </div>
      </section>

      {/* ─── WHAT TO BRING ────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>What to have ready</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
            Don't worry about being prepared. Bring what you have.
          </h2>
          <ul className="space-y-3">
            {[
              "Your home BP log if you have one &mdash; even three readings this week is enough",
              "A list (or photo) of every prescription medication you're on",
              "A list of every supplement, vitamin, and herb you take",
              "Any recent labs (A1c, lipid panel, kidney, thyroid). Photos of the report are fine",
              "Two or three things you've already tried that didn't work, so we don't waste time there",
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="text-base" style={{ lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-sm mt-6 italic" style={{ color: 'var(--muted)' }}>
            No labs yet? No problem. We'll talk about what to order and how to get them done.
          </p>
        </div>
      </section>

      {/* ─── WHO JOEL IS ──────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img src="/headshot.jpg" alt="Joel Polley, RN" width="120" height="120"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper-light)', boxShadow: '0 8px 24px rgba(44,42,38,0.15)', margin: '0 auto 1.25rem' }} />
          </picture>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>Who you're talking to</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3" style={{ color: 'var(--ink)' }}>
            Joel Polley, RN &middot; The Blood Pressure Guy
          </h2>
          <p className="text-base mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            Twenty years in ICU and emergency medicine. Hypertensive crashes, post-MI care, the conversations cardiology doesn't have time for. Now teaching the root-cause protocols the system never had bandwidth to offer.
          </p>
          <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            <em>"Pills manage output. Protocol fixes input."</em> That's the sentence the whole framework runs on.
          </p>
          <div className="mt-5">
            <a href="/about/joel" className="text-sm font-medium" style={{ color: 'var(--sage-deep)', textDecoration: 'underline' }}>
              Read Joel's full bio &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ─── REAL CASE — anonymized ───────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--sage-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>What happens after the call</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
            One real case from this month.
          </h2>
          <div className="p-6 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
            <p className="text-base italic mb-4" style={{ color: 'var(--ink)', lineHeight: 1.65 }}>
              "Doreen, age 62, on three BP meds for fifteen years, still running 140s/90s most mornings. We talked for thirty minutes. Found her loudest corner was cortisol. She'd been waking at 3 AM every night for two years. We dropped two things, added three, fixed her sleep architecture. Twelve days later: BP 128/80. She brought the log to her cardiologist. He took her off the atenolol."
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Anonymized first name. Real case. Real numbers. This is one of about 30 conversations a month.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em', textAlign: 'center' }}>Common questions</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-7 text-center" style={{ color: 'var(--ink)' }}>
            Before you book.
          </h2>

          <div className="space-y-5">
            {[
              { q: 'Is this really free? What\'s the catch?', a: 'Genuinely free. No card required. The reason I do this: BP coaching only works when there\'s real fit between the patient and the practitioner. Thirty minutes of conversation tells both of us whether that fit exists. If we click, we\'ll talk about working together. If we don\'t, I send you to someone who can help.' },
              { q: 'Is this medical advice?', a: 'No. This is education-based nursing consultation, not diagnosis or prescription. Anything we discuss works alongside your physician, not instead of them. For medication decisions you\'ll always go through your prescribing doctor.' },
              { q: "I'm on five blood pressure medications. Is this still worth my time?", a: 'Especially. The more meds, the higher the value of mapping which corner of the Triangle is actually driving the system. Most patients on 3+ meds are being treated for the wrong corner. We never change meds without your physician; that\'s a hard line.' },
              { q: "What if I can't make my scheduled call?", a: 'Reschedule any time from the Calendly confirmation email. No fees, no hard feelings. Life happens.' },
              { q: 'How long until I can book?', a: 'Most weeks I open 6-8 slots between Monday and Friday afternoons. If nothing fits your schedule, email braveworksrn@gmail.com and I\'ll find time.' },
              { q: "Will you try to sell me something on the call?", a: 'Only if you ask. The call exists to give you clarity, not to push an offer. If at the end you want to talk about working together more formally, I\'ll lay out the options. If you don\'t, you walk away with a free 30-minute consult and we both move on.' },
            ].map((item) => (
              <div key={item.q} className="p-5 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
                <div className="flex gap-3">
                  <HelpCircle size={20} color="var(--clay)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="font-medium text-base mb-2" style={{ color: 'var(--ink)' }}>{item.q}</div>
                    <div className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>{item.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-16" style={{ background: 'var(--ink)', color: 'var(--paper-light)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <Calendar size={28} color="#F5C68F" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 1rem' }} />
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: 'rgba(184,90,54,0.18)', color: '#F5C68F', letterSpacing: '0.14em' }}>
            Free &middot; 30 minutes &middot; No card required
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-5" style={{ color: 'var(--paper-light)' }}>
            One call. One honest conversation. One clear next step.
          </h2>
          <p className="text-base sm:text-lg mb-7 max-w-xl mx-auto" style={{ color: 'rgba(251,248,241,0.85)', lineHeight: 1.55 }}>
            Most BP patients never get this: a real nurse, looking at their real situation, with no clock ticking on the visit. Thirty minutes is yours.
          </p>
          <a
            href={CALENDLY_URL}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02]"
            style={{ background: 'var(--clay)', color: 'var(--paper-light)' }}
          >
            Pick your time <ArrowRight size={18} />
          </a>
          <div className="text-xs mt-4" style={{ color: 'rgba(251,248,241,0.5)' }}>
            Powered by Calendly &middot; You'll get a Zoom link by email
          </div>
        </div>
      </section>

      {/* ─── Disclaimer footer ────────────────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck size={22} color="var(--muted)" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '60ch', margin: '0 auto' }}>
            The discovery call is a free nursing consultation rooted in 20 years of ICU and ER experience. It is education-based, not diagnostic. Any protocol we discuss always works alongside your physician, never as a replacement. Never start, stop, or change a prescribed medication without your doctor's supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
