// /sprint-welcome — Post-$1,997/$1,700 Sprint purchase landing page.
//
// 2026-05-18 created during end-to-end smoke test. The Sprint Stripe
// Payment Link (created via API earlier) redirects here after completion
// with {CHECKOUT_SESSION_ID} appended. Without this page, Sprint buyers
// would land on the SPA's no-match-route fallback — bad UX for someone
// who just dropped $1,700.
//
// Mirrors /coaching-welcome structure but tuned for Sprint buyers:
// - Bigger purchase confirmation
// - Immediate next-step checklist (text Joel, book Calendly, join Skool VIP)
// - "What I'm preparing for you" reassurance

import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Phone, Calendar, Users, ClipboardList } from 'lucide-react';

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_DIAGNOSTIC_URL
  || 'https://calendly.com/braveworksrn/60min';

export default function SprintWelcomePage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* Confirmation hero */}
      <section className="py-14 sm:py-16" style={{ background: 'var(--sage-soft)', borderBottom: '1px solid var(--sage-deep)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <CheckCircle2 size={56} color="var(--sage-deep)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>
            You're in the Sprint
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4" style={{ color: 'var(--ink)', lineHeight: 1.15 }}>
            Welcome to the next 90 days.
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            You just bought yourself a 90-day relationship with a 20-year ICU/ER nurse and his hormone-corner co-coach. Below is everything you need to do in the next 48 hours to kick this off right.
          </p>
        </div>
      </section>

      {/* The four immediate actions */}
      <section className="py-12" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            The 4 things to do in the next 48 hours
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center" style={{ color: 'var(--ink)' }}>
            Lock these in. Then I take it from here.
          </h2>

          <div className="space-y-4">
            {/* Step 1 — Text Joel */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>1</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={18} color="var(--sage-deep)" />
                    <h3 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>Text me — open the WhatsApp office hours</h3>
                  </div>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.65, marginBottom: 8 }}>
                    Send a text to <strong style={{ color: 'var(--ink)' }}>717-585-9505</strong> from your phone with just the word "Sprint". That gives me your number so I can add you to the BraveWorks Sprint WhatsApp group, where your daily 9 AM-5 PM ET office hours happen.
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    I usually reply within an hour during business hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 — Book kickoff */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>2</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} color="var(--sage-deep)" />
                    <h3 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>Book your kickoff 1:1 (this week)</h3>
                  </div>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.65, marginBottom: 12 }}>
                    Sixty minutes on Zoom. Bring your home BP log (even three readings this week is enough), your prescription list, your supplement list, and any recent labs. We map your loudest Pressure live and design Week 1 together.
                  </p>
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm"
                    style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>
                    Pick my kickoff time →
                  </a>
                </div>
              </div>
            </div>

            {/* Step 3 — Join Skool */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>3</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} color="var(--sage-deep)" />
                    <h3 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>Join the Skool community — I'll grant VIP access</h3>
                  </div>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.65, marginBottom: 12 }}>
                    "How to Be Your Own Doctor" is free to join. Once you're inside, DM me there and I'll grant Sprint VIP access — that's where the weekly group calls happen + the protocol library lives.
                  </p>
                  <a href="https://www.skool.com/how-to-be-your-own-doctor-8010/about" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm"
                    style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>
                    Join the Skool community →
                  </a>
                </div>
              </div>
            </div>

            {/* Step 4 — Prep checklist */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sage-deep)', color: 'var(--paper-light)' }}>4</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList size={18} color="var(--sage-deep)" />
                    <h3 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>Pull these together before the kickoff call</h3>
                  </div>
                  <ul className="space-y-1.5 mt-2" style={{ color: 'var(--ink-soft)', fontSize: '14.5px', lineHeight: 1.6 }}>
                    <li>• Home BP log (or screenshots of your meter — last 7 days minimum)</li>
                    <li>• Photo or list of every prescription you're on</li>
                    <li>• Photo or list of every supplement, vitamin, herb you take daily</li>
                    <li>• Any labs from the last year (A1c, lipids, kidney, thyroid, hormones)</li>
                    <li>• Anything you've already tried that didn't work — so we don't waste time there</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Joel's preparing */}
      <section className="py-12" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            What I'm doing on my end
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6 text-center" style={{ color: 'var(--ink)' }}>
            By the time we meet, I will have…
          </h2>
          <ul className="space-y-3" style={{ color: 'var(--ink-soft)', fontSize: '15.5px', lineHeight: 1.65 }}>
            <li className="flex gap-3">
              <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Read your full intake — every word.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Drafted your Week 1 protocol — gratitudes practice, hydration with mineral salt, the one supplement to consider, the one to drop.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Built a doctor-conversation script template ready to customize for your prescriber.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Flagged the 2-3 articles that explain the why behind the protocol we're going to run.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 size={20} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Looped in Annie — your hormone-corner co-coach — if your case calls for a Week 2 hormone-baseline call.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Receipt + close */}
      <section className="py-10" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
            A receipt is on its way from Stripe. A welcome email from me with everything above plus the WhatsApp invite and Annie's intro lands in your inbox within the next 30 minutes.
          </p>
          {sessionId && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Order reference: <code style={{ background: 'var(--paper-light)', padding: '2px 6px', borderRadius: 4, fontFamily: 'ui-monospace, monospace' }}>{sessionId}</code>
            </p>
          )}
          <p className="text-base mt-6 font-medium" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            See you on Zoom.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            — Joel
          </p>
        </div>
      </section>
    </main>
  );
}
