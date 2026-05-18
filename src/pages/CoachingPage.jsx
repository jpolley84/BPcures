// /coaching — BP Triangle Diagnostic Session ($297 direct checkout)
//
// 2026-05-18 rewrite. The previous version was a $1,997 90-Day Sprint
// application-only page. The May 17 founding cohort launch generated
// 0 real applications across 8K emails — the data said the price-jump
// from $17 Kit → $1,997 Sprint was too steep without a trust bridge.
//
// New design: this page sells ONLY the $297 BP Triangle Diagnostic
// Session as a direct-checkout offer. The $1,997 Sprint is NOT mentioned
// here — it only surfaces inside the post-purchase email sequence to
// $297 buyers (per Joel: "we are only presenting 297 offer not 1997").
//
// The $297 acts as the first payment of the Sprint if buyers upgrade.
// Credit ladders all the way: $17 Kit credit applies to $297 ($280),
// then $297 Diagnostic credit applies to $1,997 ($1,700).
//
// Bottom of the page: Cohort #2 waitlist email opt-in (low-friction).

import { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, FileText, ClipboardCheck, MessageCircle, HelpCircle, Mail } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// Stripe Payment Link for the $297 Diagnostic — Joel creates in Stripe
// Dashboard, pastes URL into Vercel env as VITE_STRIPE_DIAGNOSTIC_LINK.
// After-completion redirect should point to: https://bpquiz.com/coaching-welcome?session_id={CHECKOUT_SESSION_ID}
const DIAGNOSTIC_LINK = import.meta.env.VITE_STRIPE_DIAGNOSTIC_LINK || 'https://buy.stripe.com/MISSING_VITE_STRIPE_DIAGNOSTIC_LINK';

// TikTok embed (preserved from previous page — works as social proof)
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
  }, []);

  return (
    <blockquote
      className="tiktok-embed"
      cite={`https://www.tiktok.com/@${username}/video/${videoId}`}
      data-video-id={videoId}
      style={{ maxWidth: '605px', minWidth: '325px', margin: '0 auto' }}
    >
      <section>
        <a target="_blank" rel="noopener noreferrer" title={`@${username}`} href={`https://www.tiktok.com/@${username}?refer=embed`}>
          @{username}
        </a>
      </section>
    </blockquote>
  );
}

export default function CoachingPage() {
  // 2026-05-18: removed waitlist email-capture form. The Cohort 2 CTA
  // now links to /cohort2 (application page) per Joel's pivot from
  // price-reveal to application-only funnel.

  const fadeIn = useScrollAnimation();

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: '#FCEED9', color: '#B85A36', letterSpacing: '0.14em' }}>
            BraveWorks RN · Only 5 calls total before Cohort 2 opens
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--ink)' }}>
            The BP Triangle Diagnostic Session
          </h1>
          <p className="text-lg sm:text-xl mb-7 max-w-2xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Sixty minutes with Joel Polley, RN. Your numbers, your meds, your stress, your supplements looked at together for the first time. You walk out with a written 30-day personalized protocol.
          </p>

          <div className="inline-block mb-6 px-7 py-5 rounded-xl" style={{ background: 'var(--paper)', border: '2px solid var(--sage-deep)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sage-deep)', letterSpacing: '0.12em' }}>One-time investment</div>
            <div className="font-serif text-4xl sm:text-5xl" style={{ color: 'var(--ink)', fontWeight: 500 }}>$297</div>
            <div className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>60 minutes of actual nursing time. Your prescreen for Cohort 2.</div>
          </div>

          <div className="mb-3">
            <a
              href={DIAGNOSTIC_LINK}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02]"
              style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}
            >
              Book the diagnostic · $297 <ArrowRight size={18} />
            </a>
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Secure checkout via Stripe · 48-hour refund window before the call
          </div>
        </div>
      </section>

      {/* ─── WHY THIS, WHY NOW ────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>Why this session</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-5" style={{ color: 'var(--ink)' }}>
            The protocol is generic. Your body isn't.
          </h2>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            You've read the articles. You've watched the videos. You've maybe even bought the BP Reset Kit. The information is solid. But after a few weeks, most people plateau.
          </p>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            It's not the protocol's fault. The protocol is built for the general case. Your case is specific.
          </p>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            One corner of the BP Triangle is loudest in your body right now. Vascular, cortisol, or blood sugar. Until you know which one is driving you, you're guessing. And guessing in a chronic condition adds weeks every time you have to backtrack.
          </p>
          <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>
            Sixty minutes of nursing time saves you weeks of guessing.
          </p>
        </div>
      </section>

      {/* ─── WHAT THE CALL IS ─────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em', textAlign: 'center' }}>What happens on the call</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center" style={{ color: 'var(--ink)' }}>
            Sixty minutes. One Zoom. Three outcomes.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: ClipboardCheck, title: '1. Your Triangle, mapped', body: "I look at your home BP log, your morning vs afternoon pattern, your stress, your sleep, your A1c if you have it. I name which corner of the Triangle is loudest for you, and which is second." },
              { icon: FileText, title: '2. Your 30-day protocol, written', body: "You leave with a one-page written protocol customized to your corner. The herbs to take, the foods to drop, the timing of meals, the sleep architecture for YOUR body, not the generic one." },
              { icon: MessageCircle, title: '3. The doctor conversation', body: "A clean one-page script you can hand your doctor. Lab requests, supplements to disclose, language for the medication-tapering conversation. Most physicians read it and engage." },
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

          {/* Bonus */}
          <div className="mt-8 p-5 rounded-xl" style={{ background: 'var(--sage-soft)', border: '1px solid var(--sage-deep)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>Included bonus</div>
            <div className="font-serif text-lg mb-2" style={{ color: 'var(--ink)' }}>30-day follow-up email coaching</div>
            <p className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              After our call, you get 30 days of follow-up email access. Reply to me with your home log every Sunday. I read every one. If we need to adjust, we adjust. This isn't available outside the diagnostic.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF — TikTok ────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-xl mx-auto px-5">
          <p className="text-center text-sm font-medium mb-5 uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
            Where the work shows up
          </p>
          <TikTokEmbed videoId="7639447507050827039" username="braveworksrn" />
          <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)' }}>
            116K+ on TikTok. The protocol works. The diagnostic is where we customize it for you.
          </p>
        </div>
      </section>

      {/* ─── WHAT TO BRING ────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>What to have ready</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
            Don't worry about being prepared. Bring what you have.
          </h2>
          <ul className="space-y-3">
            {[
              "Your home BP log if you have one, even three readings this week is enough",
              "A list (or photo) of every prescription medication you're on",
              "A list of every supplement, vitamin, and herb you take",
              "Any recent labs (A1c, lipid panel, kidney, thyroid). Photos of the report are fine",
              "Two or three things you've already tried that didn't work, so we don't waste time there",
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="text-base" style={{ lineHeight: 1.55 }}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm mt-6 italic" style={{ color: 'var(--muted)' }}>
            No labs yet? No problem. We'll talk about what to order and how to get them done.
          </p>
        </div>
      </section>

      {/* ─── WHO JOEL IS ──────────────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img src="/headshot.jpg" alt="Joel Polley, RN" width="120" height="120"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper-light)', boxShadow: '0 8px 24px rgba(44,42,38,0.15)', margin: '0 auto 1.25rem' }} />
          </picture>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>Who you're talking to</div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3" style={{ color: 'var(--ink)' }}>
            Joel Polley, RN · The Blood Pressure Guy
          </h2>
          <p className="text-base mb-3" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            Twenty years in ICU and emergency medicine. Hypertensive crashes, post-MI care, the conversations cardiology doesn't have time for. Now teaching the root-cause protocols the system never had bandwidth to offer.
          </p>
          <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            <em>"Pills manage output. Protocol fixes input."</em> That's the sentence the whole framework runs on.
          </p>
          <div className="mt-5">
            <a href="/about/joel" className="text-sm font-medium" style={{ color: 'var(--sage-deep)', textDecoration: 'underline' }}>
              Read Joel's full bio →
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
              "Doreen, age 62, on three BP meds for fifteen years, still running 140s/90s most mornings. We talked for 60 minutes. Found her loudest corner was cortisol. She'd been waking at 3 AM every night for two years. We dropped two things, added three, fixed her sleep architecture. Twelve days later: BP 128/80. She brought the log to her cardiologist. He took her off the atenolol."
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
              { q: 'Is this medical advice?', a: 'No. This is education-based nursing consultation, not diagnosis or prescription. Your protocol always works alongside your physician, not instead of them. I write you a one-page script to bring to your doctor for the medical decisions.' },
              { q: 'What if I already bought the BP Reset Kit?', a: 'Your $17 Kit purchase applies as credit toward your diagnostic. Reply to your kit-purchase email or email braveworksrn@gmail.com and I will send you a credit-applied checkout link so you pay $280 instead of $297.' },
              { q: "I'm on five blood pressure medications. Is this still worth it?", a: 'Especially. The more meds, the higher the value of mapping which corner of the Triangle is actually driving the system. Most patients on 3+ meds are being treated for the wrong corner. We work alongside your prescribing physician on any medication changes; never stop a med without your doctor.' },
              { q: "What if I can't make my scheduled call?", a: 'Reschedule once, no fee. Two reschedules in a row = we issue a refund. The 48-hour pre-call refund window covers cold-feet scenarios.' },
              { q: 'Is there a follow-up program?', a: "For some people, yes. After the diagnostic, if you want to keep working together, I have a deeper program for buyers who want it. Most graduates of the diagnostic don't need it. The 30-day protocol does the job. We talk about it on the call if it makes sense for you." },
              { q: "What's the refund policy?", a: 'Full refund within 48 hours of purchase, before the call. After the call: non-refundable, since the value (your written protocol + 30-day email follow-up) has been delivered.' },
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
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: 'rgba(184,90,54,0.18)', color: '#F5C68F', letterSpacing: '0.14em' }}>
            Only 5 calls total — closing Friday May 23
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl mb-5" style={{ color: 'var(--paper-light)' }}>
            One call. One protocol. One clear next step.
          </h2>
          <p className="text-base sm:text-lg mb-7 max-w-xl mx-auto" style={{ color: 'rgba(251,248,241,0.85)', lineHeight: 1.55 }}>
            Sixty minutes that gives you what most BP patients never get: a real nurse looking at your real situation. Not a chatbot. Not a 5-minute office visit. A full hour, your case, written takeaway.
          </p>
          <a
            href={DIAGNOSTIC_LINK}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02]"
            style={{ background: 'var(--clay)', color: 'var(--paper-light)' }}
          >
            Book the diagnostic · $297 <ArrowRight size={18} />
          </a>
          <div className="text-xs mt-4" style={{ color: 'rgba(251,248,241,0.5)' }}>
            Secure checkout via Stripe · 48-hour refund window · No upsell on the call
          </div>
        </div>
      </section>

      {/* ─── COHORT #2 WAITLIST ───────────────────────────────────── */}
      <section ref={fadeIn} className="py-14" style={{ background: 'var(--paper-light)' }}>
        <div className="max-w-xl mx-auto px-5 text-center">
          <Mail size={28} color="var(--sage-deep)" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 1rem' }} />
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            Cohort 2 — 90-day group program · Opens Sunday May 24
          </div>
          <h3 className="font-serif text-xl sm:text-2xl mb-3" style={{ color: 'var(--ink)' }}>
            Skip the diagnostic? Apply directly for Cohort 2.
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            The $297 diagnostic above is the 1:1 prescreen path into Cohort 2 — that's how most people get in. If you'd rather skip the prescreen and apply directly for the 90-day group cohort opening <strong>Sunday May 24</strong>, the application takes about 5 minutes. Joel reads every one personally.
          </p>

          <a
            href="/cohort2"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base"
            style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}
          >
            Apply for Cohort 2 →
          </a>
        </div>
      </section>

      {/* ─── Disclaimer footer ────────────────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck size={22} color="var(--muted)" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
          <p className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '60ch', margin: '0 auto' }}>
            The BP Triangle Diagnostic Session is a nursing consultation rooted in 20 years of ICU and ER experience. It is education-based, not diagnostic. Your protocol always works alongside your physician, never as a replacement. Never start, stop, or change a prescribed medication without your doctor's supervision.
          </p>
        </div>
      </section>
    </main>
  );
}
