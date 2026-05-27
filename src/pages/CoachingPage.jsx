// /coaching — Free 30-Minute Discovery Call with Joel Polley, RN
//
// 2026-05-26 shortened. Joel: "Don't need to convince for a free call."
// Removed: Why This Why Now, What The Call Is cards, Social Proof,
// Real Case (Doreen), FAQ (6 questions), Final CTA (redundant).
// Kept: Hero, Calendly embed, What to Bring (condensed), Joel bio (short),
// Disclaimer footer.
//
// Calendly: https://calendly.com/braveworksrn/60min (event slug is "60min" even though the call is 30 min)
// All "Work with Joel 1:1" CTAs site-wide now route here.

import { useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/braveworksrn/60min';

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
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5" style={{ color: 'var(--ink)' }}>
            Free 30-minute call with Joel&nbsp;Polley,&nbsp;RN
          </h1>
          <p className="text-lg sm:text-xl mb-7 max-w-2xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Bring your numbers, your meds, and the question that's been keeping you up. You leave with a clear next step.
          </p>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Zoom &middot; No card required &middot; Confirmation lands in your inbox
          </div>
        </div>
      </section>

      {/* ─── CALENDLY EMBED ───────────────────────────────────────── */}
      <section className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="font-serif text-2xl sm:text-3xl mb-3 text-center" style={{ color: 'var(--ink)' }}>
            Pick a time that works for you.
          </h2>
          <p className="text-base mb-7 text-center max-w-xl mx-auto" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            All times shown in your timezone.
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

      {/* ─── WHAT TO BRING ────────────────────────────────────────── */}
      <section className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
            What to have ready
          </h2>
          <ul className="space-y-3">
            {[
              "Your home BP log &mdash; even three recent readings is enough",
              "A list or photo of your current medications and supplements",
              "Any recent labs you have (A1c, lipid panel, thyroid)",
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="text-base" style={{ lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          <p className="text-sm mt-5 italic" style={{ color: 'var(--muted)' }}>
            Don't have labs yet? No problem &mdash; we'll talk about what to order.
          </p>
        </div>
      </section>

      {/* ─── WHO JOEL IS (short) ──────────────────────────────────── */}
      <section className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <picture>
            <source srcSet="/headshot.webp" type="image/webp" />
            <img src="/headshot.jpg" alt="Joel Polley, RN" width="100" height="100"
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper-light)', boxShadow: '0 8px 24px rgba(44,42,38,0.15)', margin: '0 auto 1rem' }} />
          </picture>
          <h2 className="font-serif text-xl sm:text-2xl mb-2" style={{ color: 'var(--ink)' }}>
            Joel Polley, RN
          </h2>
          <p className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.65 }}>
            20 years in ICU &amp; emergency medicine. Now teaching the root-cause blood pressure protocols the system never had bandwidth to offer.
          </p>
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
