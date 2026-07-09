// Post-purchase upsell for SVUTU "Steady" — the done-for-you hibiscus tea.
// The BraveWorks protocol calls for hibiscus daily; Steady ships the exact
// single-ingredient tea. Rendered on SuccessPage + DownloadsPage (pages
// without a reliable saved-card session context, so this stays a plain
// Payment Link, unlike the true one-click offer on /welcome, see
// TeaOneClickOffer.jsx). 2026-07-08: swapped the retired $42/mo subscription
// + $24 Sampler links (no longer sold) for the two tiers actually live on
// bpquiz.com/tea today. Stripe links are the live tea SKUs (metadata
// funnel:svutu-tea → triangle-webhook skips the kit misdelivery guard).
import { Leaf, ArrowRight } from 'lucide-react';

const MONTH = 'https://buy.stripe.com/eVq5kD8k30rk63h6NjfnO1z';    // $48 1-Month Supply
const NINETY_DAY = 'https://buy.stripe.com/14A00j0RBa1U63hb3zfnO1x'; // $120 90-Day Supply
const PAGE = 'https://bpquiz.com/tea';

export default function TeaOffer() {
  return (
    <section style={{
      background: 'var(--paper-warm, #F3EEE4)',
      border: '1px solid var(--clay, #B85A36)',
      borderRadius: 16,
      padding: '1.6rem',
      textAlign: 'left',
      margin: '0 auto 2rem',
      maxWidth: 640,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.6rem' }}>
        <div style={{
          width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9,
          background: 'var(--sage-soft, #EEF3EC)', border: '1px solid var(--clay, #B85A36)',
        }}>
          <Leaf size={16} style={{ color: 'var(--clay, #B85A36)' }} />
        </div>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', fontWeight: 700 }}>
          One step, done for you
        </span>
      </div>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, lineHeight: 1.25, color: 'var(--ink, #2C3E50)', margin: '0 0 0.5rem' }}>
        Drink the protocol. Don&rsquo;t chase it.
      </h3>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #3A3A3A)', margin: '0 0 1.2rem' }}>
        Your reset calls for hibiscus every day. <strong>Steady</strong> is the exact single-ingredient hibiscus, measured and shipped to your door, so the step most people skip just happens on its own. 60-day keep-the-pouch guarantee, so there is no risk in trying it.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', alignItems: 'center' }}>
        <a href={MONTH} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'var(--clay, #B85A36)', color: 'var(--cream, #FBF8F1)',
          padding: '0.8rem 1.4rem', borderRadius: 10, textDecoration: 'none',
          fontWeight: 700, fontSize: '0.98rem',
        }}>
          Shop Steady, $48 <ArrowRight size={15} />
        </a>
        <a href={NINETY_DAY} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--clay, #B85A36)', fontWeight: 600, textDecoration: 'none' }}>
          or the 90-Day Supply for $120
        </a>
      </div>
      <div style={{ marginTop: '0.9rem' }}>
        <a href={PAGE} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: 'var(--muted, #7A7A7A)', textDecoration: 'underline' }}>
          See everything about Steady &rarr;
        </a>
      </div>
    </section>
  );
}
