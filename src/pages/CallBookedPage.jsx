// CallBookedPage (route: /call-booked) — post-purchase landing for the $97
// 1:1 call with Joel (the upsell from the $47 complete kit). The Stripe payment
// link's after_completion redirects here; the webhook also emails the same
// booking link, so a buyer who closes this tab is never stranded.
//
// Calendly URL comes from VITE_CALENDLY_DIAGNOSTIC_URL (the same calendar seam
// the $297 flow uses). When it is unset, the page tells the buyer the booking
// link is in their email instead of rendering a dead embed.
//
// Compliance: education and lifestyle support, alongside the doctor, never
// instead of. No doses, no diagnosis, no outcome promise. ZERO em-dashes.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { track } from '../utils/analytics';

const RAW_CALENDLY = import.meta.env.VITE_CALENDLY_DIAGNOSTIC_URL || '';
const HAS_CALENDLY = /calendly\.com/i.test(RAW_CALENDLY);
const CALENDLY_URL = RAW_CALENDLY;

export default function CallBookedPage() {
  // Post-purchase page: keep it out of search indexes.
  useEffect(() => {
    track('call97_welcome_viewed');
    const tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(tag);
    return () => {
      if (tag.parentNode) tag.parentNode.removeChild(tag);
    };
  }, []);

  return (
    <div style={{ background: 'var(--paper, #FBF8F1)', minHeight: '80vh' }}>
      {/* Warm confirm header */}
      <section className="py-10" style={{ background: 'var(--paper-light, #FFFFFF)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ border: '1px solid var(--sage, #4A5D4E)', color: 'var(--sage-deep, #2E3A30)', fontSize: '13px', fontWeight: 700 }}
          >
            <CheckCircle2 size={15} aria-hidden /> Call confirmed
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl mb-3" style={{ color: 'var(--ink, #121110)' }}>
            You and Joel, one on one.
          </h1>
          <p className="text-base" style={{ color: 'var(--ink-soft, #2B2824)', lineHeight: 1.65 }}>
            Thank you. Your 1:1 call is paid.{' '}
            {HAS_CALENDLY
              ? 'Pick your time below and it goes straight onto Joel’s calendar.'
              : 'Your booking link is in the confirmation email Joel just sent you. Check your inbox, and your spam folder just in case.'}
          </p>
        </div>
      </section>

      {/* Booking calendar */}
      <section className="py-10">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--clay, #B85A36)', letterSpacing: '0.14em' }}>
            Pick your time
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-7 text-center" style={{ color: 'var(--ink, #121110)' }}>
            Book your call with Joel.
          </h2>
          {HAS_CALENDLY ? (
            <>
              <div style={{ background: 'var(--paper-light, #FFFFFF)', border: '1px solid var(--border, #E5DFD3)', borderRadius: 12, padding: 4, minHeight: 700 }}>
                <iframe
                  src={CALENDLY_URL + '?hide_event_type_details=0&hide_gdpr_banner=1'}
                  width="100%"
                  height="700"
                  frameBorder="0"
                  title="Book your 1:1 call with Joel"
                  style={{ borderRadius: 10, display: 'block' }}
                />
              </div>
              <div className="text-center mt-4">
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--sage-deep, #2E3A30)', textDecoration: 'underline' }}>
                  Or open the calendar in a new tab
                </a>
              </div>
            </>
          ) : (
            <div className="text-center" style={{ background: 'var(--paper-light, #FFFFFF)', border: '1px solid var(--border, #E5DFD3)', borderRadius: 12, padding: '2rem 1.5rem' }}>
              <p className="text-base" style={{ color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6 }}>
                Your booking link is in the confirmation email Joel just sent (within a few minutes).
                If it does not arrive, reply to any BraveWorks email and he will send your times directly.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Have these ready */}
      <section className="py-12" style={{ background: 'var(--paper-light, #FFFFFF)', borderTop: '1px solid var(--border, #E5DFD3)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <h2 className="font-serif text-2xl mb-5" style={{ color: 'var(--ink, #121110)' }}>
            Have these ready.
          </h2>
          <ul style={{ color: 'var(--ink-soft, #2B2824)', lineHeight: 1.8, paddingLeft: '1.2rem', margin: 0 }}>
            <li>Your last few blood pressure readings, morning and evening if you have them.</li>
            <li>Your current medication list, names and doses, straight off the bottles.</li>
            <li>Your quiz result if you took it, and your kit downloads.</li>
            <li>The one question you most want answered. We start there.</li>
          </ul>
          <p className="mt-6 text-sm" style={{ color: 'var(--muted, #7A7061)', lineHeight: 1.6 }}>
            This call is education and lifestyle support to stand alongside your own doctor, never
            instead of them. Your doctor makes any calls about your medication. See our{' '}
            <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms</Link> and{' '}
            <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
