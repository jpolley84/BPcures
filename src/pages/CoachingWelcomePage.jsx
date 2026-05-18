// /coaching-welcome — Post-$297-purchase landing page.
//
// 2026-05-18 created alongside the $297 Diagnostic Session launch.
// Stripe Payment Link's after_completion.redirect.url points here with
// {CHECKOUT_SESSION_ID} appended. The Stripe webhook (api/stripe-webhook.js)
// fires the actual purchase-confirmation email; this page just sets
// expectation + gives them a clear next step (book the call).
//
// Calendly URL is configurable via VITE_CALENDLY_DIAGNOSTIC_URL env var.

import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, ClipboardList, Clock, Phone } from 'lucide-react';

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_DIAGNOSTIC_URL
  || 'https://calendly.com/braveworksrn/60min';

export default function CoachingWelcomePage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* Confirmation header */}
      <section className="py-14 sm:py-16" style={{ background: 'var(--sage-soft)', borderBottom: '1px solid var(--sage-deep)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <CheckCircle2 size={48} color="var(--sage-deep)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--sage-deep)', letterSpacing: '0.14em' }}>
            Payment confirmed
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4" style={{ color: 'var(--ink)', lineHeight: 1.15 }}>
            You're in. Now let's get a time on the calendar.
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            Your $297 BP Triangle Diagnostic Session is paid. The next step is booking your 60-minute Zoom with me using the calendar below.
          </p>
        </div>
      </section>

      {/* Calendly embed */}
      <section className="py-10" style={{ background: 'var(--paper)' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            Step 1 of 1
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-7 text-center" style={{ color: 'var(--ink)' }}>
            Pick a time that works for you.
          </h2>
          <div style={{ background: 'var(--paper-light)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, minHeight: 700 }}>
            <iframe
              src={CALENDLY_URL + '?hide_event_type_details=0&hide_gdpr_banner=1'}
              width="100%"
              height="700"
              frameBorder="0"
              title="Book your BP Triangle Diagnostic Session"
              style={{ borderRadius: 10, display: 'block' }}
            />
          </div>
          <div className="text-center mt-4">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--sage-deep)', textDecoration: 'underline' }}>
              Or open the calendar in a new tab →
            </a>
          </div>
        </div>
      </section>

      {/* What to have ready */}
      <section className="py-14" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            Before our call
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)' }}>
            Five things to have ready.
          </h2>
          <p className="text-sm mb-6 italic" style={{ color: 'var(--ink-soft)' }}>
            Don't stress about this list. Bring what you have. The session works either way.
          </p>
          <ul className="space-y-3">
            {[
              "Your home BP log if you have one. Even three readings from this week is enough.",
              "A photo or list of every prescription medication you're on.",
              "A photo or list of every supplement, vitamin, and herb you take daily.",
              "Any recent lab work you have. A1c, lipid panel, kidney function, thyroid, hormones. Photos of the report PDF are fine.",
              "Two or three things you've already tried that didn't work. So we don't waste time there.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sage-soft)', color: 'var(--sage-deep)' }}>
                  {i + 1}
                </div>
                <span className="text-base" style={{ lineHeight: 1.55, paddingTop: 3 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What happens on the call */}
      <section className="py-14" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--clay)', letterSpacing: '0.14em' }}>
            How the 60 minutes flow
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-7 text-center" style={{ color: 'var(--ink)' }}>
            A rough map of our time.
          </h2>

          <div className="space-y-4">
            {[
              { time: 'Min 0-15', title: 'Your situation, in your words', body: "I shut up and listen. You walk me through what's going on, what's been tried, what hasn't worked, what your day looks like." },
              { time: 'Min 15-35', title: 'Mapping your Triangle', body: 'We look at your numbers, your meds, your supplements, your sleep, your stress. I name your loudest corner and explain why.' },
              { time: 'Min 35-50', title: 'Your 30-day protocol', body: 'I write it live on screen. Herbs, foods, timing, sleep, breath work. Specific to your corner, not generic. You watch me build it and ask questions.' },
              { time: 'Min 50-60', title: 'The doctor script', body: 'I draft a one-page conversation you take to your physician. Lab requests, supplements to disclose, medication-tapering language. Doctors respect this.' },
            ].map((row) => (
              <div key={row.time} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--paper-light)', border: '1px solid var(--border)' }}>
                <div className="flex-shrink-0 w-20" style={{ color: 'var(--sage-deep)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}>
                  {row.time}
                </div>
                <div>
                  <div className="font-medium text-base mb-1" style={{ color: 'var(--ink)' }}>{row.title}</div>
                  <div className="text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>{row.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Receipt + support */}
      <section className="py-10" style={{ background: 'var(--paper-light)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
            A receipt is on its way to your email from Stripe. A welcome email from me will follow within the next few minutes with the Zoom link and prep details.
          </p>
          {sessionId && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Order reference: <code style={{ background: 'var(--paper)', padding: '2px 6px', borderRadius: 4, fontFamily: 'ui-monospace, monospace' }}>{sessionId}</code>
            </p>
          )}
          <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
            Questions? Reply to the welcome email or write me at <a href="mailto:braveworksrn@gmail.com" style={{ color: 'var(--sage-deep)', textDecoration: 'underline' }}>braveworksrn@gmail.com</a>
          </p>
        </div>
      </section>
    </main>
  );
}
