// /seminar/welcome — Post-signup reveal page for the Couples Intimacy +
// Sexual Health Seminar. Displays the Zoom link inline + "we also
// emailed you the link" reassurance.
//
// Reached via redirect from /seminar after successful POST to
// /api/seminar-signup. Query: ?email=<email>

import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle2, Calendar, Mail, ArrowRight } from 'lucide-react';

const ZOOM_URL = 'https://tinyurl.com/2p3b449n';

export default function SeminarWelcomePage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    document.title = "You're in — your Zoom link is ready";
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink)' }}>

      {/* Confirmation hero */}
      <section style={{ padding: 'clamp(3.5rem, 8vw, 6rem) 0 clamp(2rem, 5vw, 3rem)', background: 'var(--sage-soft, #E8EEDD)', borderBottom: '1px solid var(--sage-deep)' }}>
        <div className="shell" style={{ maxWidth: 640, textAlign: 'center' }}>
          <CheckCircle2 size={56} color="var(--sage-deep)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sage-deep)', marginBottom: '0.75rem' }}>
            You're in
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.85rem, 5vw, 2.5rem)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 1rem' }}>
            See you in the room.
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.55, color: 'var(--ink-soft)', margin: 0 }}>
            {email ? (
              <>
                We just sent the Zoom link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Use the link below to join today's session right now &mdash; or come back at 1 PM ET any day this week.
              </>
            ) : (
              "We just emailed you the Zoom link. Use the button below to join today's session right now — or come back at 1 PM ET any day this week."
            )}
          </p>
        </div>
      </section>

      {/* Zoom link */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', background: 'var(--paper)' }}>
        <div className="shell" style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--sage-deep)', borderRadius: 18, padding: 'clamp(1.75rem, 4vw, 2.25rem)', textAlign: 'center', color: 'var(--cream)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clay-soft, #E8B89F)', marginBottom: '0.75rem' }}>
              Your Zoom link
            </div>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', lineHeight: 1.4, margin: '0 0 1.25rem', color: 'var(--cream)' }}>
              Same link works for all 6 sessions.<br />Bookmark this page if you want.
            </p>
            <a
              href={ZOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--clay)',
                color: 'var(--cream)',
                padding: '1rem 2rem',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '0.02em',
              }}
            >
              Join the live session <ArrowRight size={18} />
            </a>
            <div style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'rgba(251,248,241,0.6)' }}>
              {ZOOM_URL}
            </div>
          </div>
        </div>
      </section>

      {/* When-it-runs reminder */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', background: 'var(--paper-warm)' }}>
        <div className="shell" style={{ maxWidth: 640 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Calendar size={28} color="var(--clay)" style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
              When the sessions run
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', margin: 0 }}>
              Mon May 18 through Sat May 23 &middot; 1 PM ET daily &middot; same link every day
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.65rem', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ padding: '1rem 1.25rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                Mon, Tue, Wed, Fri, Sat
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                Annie Chitate, RN &mdash; hormones and intimacy
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem', background: 'var(--clay-soft, #F5E5DA)', border: '1.5px solid var(--clay)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.35rem' }}>
                Thursday May 21
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                Joel Polley, RN &mdash; BP meds, circulation, and libido
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email confirmation note */}
      <section style={{ padding: 'clamp(2rem, 4vw, 3rem) 0', background: 'var(--paper)' }}>
        <div className="shell" style={{ maxWidth: 560, textAlign: 'center' }}>
          <Mail size={32} color="var(--clay)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 500, margin: '0 0 0.75rem' }}>
            Check your inbox.
          </h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: '0 0 0.75rem' }}>
            The Zoom link is also in an email from <strong style={{ color: 'var(--ink)' }}>joel@bpquiz.com</strong>. If you don't see it in 2 minutes, check Promotions or Spam.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted, #7a7061)', margin: 0 }}>
            Move the email to your primary inbox so you don't miss the daily reminders.
          </p>
        </div>
      </section>

      {/* Page footer */}
      <footer style={{ padding: '2rem 0', background: 'var(--paper-warm)', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
        <div className="shell" style={{ maxWidth: 600 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted, #7a7061)', lineHeight: 1.55, margin: 0 }}>
            BraveWorks RN &middot; Joel Polley, RN &middot; Annie Chitate, RN<br />
            Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.
          </p>
        </div>
      </footer>

    </main>
  );
}
