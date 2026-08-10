// AllInThankYouPage (route: /allin/thank-you) — where the Quick Fit
// Application lands after a successful submit.
//
// 2026-08-10 (Joel): "the fit application buttons needs to go to a thankyou
// page after they fill it out that says we recieved your application and then
// the option to yes i want it but i have a few questions and have my email
// there braveworksrn@gmail.com . or skip the wait and checkout button"
//
// So: confirmation first, then TWO doors, because a woman who just wrote out
// her health story is in one of exactly two states. Either she has a question
// holding her back (give her a human, by name, with a real address), or she
// has already decided and does not want to wait for a reply (give her the
// checkout). Anything else here is noise.
//
// ⚠️ THIS PAGE MUST NOT CONTRADICT THE APPLICATION. /allin promises in four
// places that submitting charges nothing and reserves nothing, and that she
// gets next steps before any payment decision. So this page repeats that in
// the first paragraph, and the checkout button is framed as HER choosing to
// skip the wait, never as a required next step or as "your place is not
// confirmed until you pay". Do not add urgency copy to that button.
//
// Reached by navigate() from AllInPage's ApplyForm. Landing here directly (a
// refresh, a bookmark, a shared link) is harmless: it says nothing that is
// untrue for someone who has not applied, and both doors still work.

import { useEffect } from 'react';
import { track } from '../utils/analytics';

const C = {
  cream: '#FFFFFF',
  paper: '#FAFAFA',
  ink: '#000000',
  inkSoft: '#1A1A1A',
  line: '#E2E2E2',
  muted: '#666666',
};
const SERIF = '"Fraunces", Georgia, serif';
const SUPPORT_EMAIL = 'braveworksrn@gmail.com';

export default function AllInThankYouPage() {
  useEffect(() => {
    track('allin_thankyou_view', { page: 'allin-thank-you' });
    const prev = document.title;
    document.title = 'Application received | The Life Change Accelerator';
    const robots = document.querySelector('meta[name="robots"]');
    const prevRobots = robots ? robots.getAttribute('content') : null;
    if (robots) robots.setAttribute('content', 'noindex, nofollow');
    return () => {
      document.title = prev;
      if (robots && prevRobots !== null) robots.setAttribute('content', prevRobots);
    };
  }, []);

  const card = {
    border: `1px solid ${C.line}`, borderRadius: 8, padding: '22px 20px',
    background: C.cream, marginBottom: 16,
  };

  return (
    <main style={{
      background: C.paper, color: C.ink, minHeight: '100vh',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '56px 20px 72px' }}>

        <p style={{ fontSize: 12.5, letterSpacing: '0.2em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
          THE LIFE CHANGE ACCELERATOR
        </p>

        <h1 style={{
          fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(30px, 5.4vw, 44px)',
          lineHeight: 1.08, margin: '0 0 20px', letterSpacing: '-0.02em',
        }}>
          We received your application.
        </h1>

        <p style={{ fontSize: 17.5, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 14px' }}>
          Thank you for writing it out honestly. We read these ourselves, so give us a little time and
          watch your inbox for your next steps.
        </p>
        <p style={{ fontSize: 17.5, lineHeight: 1.7, color: C.inkSoft, margin: '0 0 36px' }}>
          Nothing has been charged and no place has been reserved. That is exactly how it should be at
          this stage.
        </p>

        <p style={{ fontSize: 13, letterSpacing: '0.14em', color: C.muted, margin: '0 0 14px', fontWeight: 700 }}>
          WHILE YOU WAIT
        </p>

        {/* Door 1: she wants in but something is unanswered. */}
        <div style={card}>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.25 }}>
            Yes, I want it, but I have a few questions
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: C.inkSoft, margin: '0 0 16px' }}>
            Ask them. Write to us directly and put your question in plain words. A real person answers,
            and no question is too small to ask before you commit to something like this.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Question about the Life Change Accelerator')}`}
            onClick={() => track('allin_thankyou_click', { action: 'email' })}
            style={{
              display: 'block', textAlign: 'center', background: C.cream, color: C.ink,
              border: `2px solid ${C.ink}`, borderRadius: 4, padding: '14px 18px',
              fontSize: 14.5, fontWeight: 700, letterSpacing: '0.04em', textDecoration: 'none',
            }}
          >
            Email us at {SUPPORT_EMAIL}
          </a>
        </div>

        {/* Door 2: she already decided. No urgency copy here, on purpose. */}
        <div style={card}>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.25 }}>
            Skip the wait and check out
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: C.inkSoft, margin: '0 0 16px' }}>
            If you already know this is for you, you do not have to wait for our reply. Choose how you
            want to pay and your place is held. Pay in full, spread it over 3, 6 or 9 payments, or hold
            your place with a deposit.
          </p>
          <a
            href="/allin/pay"
            onClick={() => track('allin_thankyou_click', { action: 'checkout' })}
            style={{
              display: 'block', textAlign: 'center', background: C.ink, color: C.cream,
              border: 'none', borderRadius: 4, padding: '16px 18px',
              fontSize: 14.5, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none',
            }}
          >
            SEE THE PAYMENT OPTIONS
          </a>
        </div>

        <p style={{ fontSize: 12.5, lineHeight: 1.7, color: C.muted, margin: '32px 0 0', textAlign: 'center' }}>
          Everything here is education-based nursing consultation, not medical advice, and it works
          alongside your doctor rather than instead of them. Your prescriber stays in charge of your
          medications.
        </p>
      </div>
    </main>
  );
}
