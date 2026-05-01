// Post-purchase one-click upsell — BP Reset Kit at $30 (vs $47 retail)
//
// Customers land here after the $17 BP starter purchase via the
// Stripe Payment Link's after_completion.redirect.url:
//   https://bpquiz.com/upsell-bp-reset-kit?session_id={CHECKOUT_SESSION_ID}
//
// They get a one-time discount of $17 off the BP Reset Kit ($30 instead
// of $47) — framed as the natural next step. "No thanks" sends them to
// the existing /success page where they get their starter kit email.
//
// The Stripe customer info from their original $17 purchase is
// preserved (same email pre-fill on the new Checkout Session) so it
// feels like one click — re-enter card, click pay, done.
//
// Hardcoded price ID intentionally — this is a single-product upsell
// and we don't want to risk a missing env var on deploy.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const UPSELL_PRICE_ID = 'price_1TSCuLHseZnO3rRZPAcRKs7t'; // $30 BP Reset Kit upsell
const FALLBACK_SUCCESS = '/success?slug=blood-pressure-cures';

export default function UpsellBpResetKitPage() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  async function addKit() {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: UPSELL_PRICE_ID,
          successUrl: `${window.location.origin}${FALLBACK_SUCCESS}&upsell=accepted`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function declineUpsell() {
    navigate(FALLBACK_SUCCESS);
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper, #FBF8F1)' }}>
      {/* Order confirmed strip */}
      <div style={{
        background: 'var(--sage-soft, #E8F1E5)',
        borderBottom: '1px solid var(--sage, #B8CFB0)',
        padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '0.65rem',
      }}>
        <Check size={18} style={{ color: 'var(--sage-deep, #4A6741)' }} />
        <span style={{ fontSize: '0.92rem', color: 'var(--sage-deep, #4A6741)', fontWeight: 500 }}>
          Your starter kit is confirmed.
        </span>
      </div>

      <section className="section surface-paper" style={{ padding: '3rem 1.5rem' }}>
        <div className="shell-tight" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="kicker kicker-dot" style={{ justifyContent: 'center' }}>
              One-time offer · Before you go
            </span>
            <h1 className="display-l" style={{
              margin: '1.5rem auto 1rem',
              maxWidth: '20ch',
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              color: 'var(--ink, #2C3E50)',
            }}>
              You have your starter. Want{' '}
              <em className="ital-display" style={{ color: 'var(--clay, #B85A36)' }}>the full Reset Kit?</em>
            </h1>
            <p className="lede" style={{ color: 'var(--ink-soft, #5A5A5A)', margin: '0 auto 2rem', maxWidth: '54ch', lineHeight: 1.6 }}>
              The BP Reset Kit is the 8-PDF clinical bundle that picks up where your starter left off. Most readers move into it in week 2.
              Add it to your order right now for <strong style={{ color: 'var(--ink, #2C3E50)' }}>$30 today only</strong> (normally $47 — you save $17 because you just bought the starter).
            </p>

            <div style={{
              padding: 'clamp(1.5rem, 3vw, 2.25rem)',
              background: 'var(--cream, #F5F1E8)',
              border: '1px solid var(--line, rgba(0,0,0,0.08))',
              borderRadius: 20,
              marginBottom: '2rem',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', marginBottom: '0.85rem' }}>
                What&rsquo;s inside the kit
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.7rem' }}>
                {[
                  'The Hypertension Guide — every cause, every lever',
                  'The Supplement Protocol — what to take, what dose, what order',
                  'The Meal Plan — the BP-specific eating framework',
                  'The BP Tracker — daily numbers in a binder for your doctor',
                  'Doctor Conversation Templates — how to ask for deprescribing',
                  'The Quick Start — 1-page protocol overview',
                  'The Cheat Sheet — what to do at the week-2 stall',
                  'The Overmedicated Boomer — full book included',
                ].map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    <Check size={16} style={{ color: 'var(--sage-deep, #4A6741)', marginTop: '0.2rem', flexShrink: 0 }} />
                    <span style={{ color: 'var(--ink-soft, #3A3A3A)', lineHeight: 1.55, fontSize: '0.95rem' }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: '#FFF9E6',
              border: '1px solid #F6E05E',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#744210',
              lineHeight: 1.5,
            }}>
              <strong>Same triple guarantee.</strong> Complete the 30 days. If your numbers haven&rsquo;t moved, refund + keep the books + free RestoreHER ticket.
            </div>

            {error && (
              <p style={{ color: 'var(--clay, #B85A36)', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={addKit}
                disabled={processing}
                className="btn btn-ink btn-lg"
                style={{
                  background: 'var(--clay, #B85A36)',
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: processing ? 'wait' : 'pointer',
                  opacity: processing ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {processing ? 'Processing…' : 'Yes — add the Reset Kit for $30'}
                <ArrowRight size={16} />
              </button>
              <button
                onClick={declineUpsell}
                disabled={processing}
                className="btn btn-ghost btn-lg"
                style={{
                  background: 'transparent',
                  color: 'var(--ink-soft, #5A5A5A)',
                  padding: '14px 24px',
                  borderRadius: 10,
                  border: '1px solid var(--line, rgba(0,0,0,0.15))',
                  fontSize: '1rem',
                  cursor: processing ? 'wait' : 'pointer',
                }}
              >
                No thanks, take me to my downloads
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--muted, #9A9A9A)', maxWidth: '42ch', margin: '0 auto' }}>
              This $30 price is only available right now. After you click through, it&rsquo;s $47.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
