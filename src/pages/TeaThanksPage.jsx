// /tea-thanks — post-purchase confirmation for SVUTU Steady (embedded
// checkout return_url, api/create-embedded-checkout.js tea branch).
//
// 2026-07-10 conversion plan: this page is where the saved card pays off.
// The buyer just completed the inline tea checkout (shipping address
// collected there, card saved off_session), so we can offer ONE tasteful
// post-purchase upsell: "+1 pouch, $48, same card, same address, one click"
// via api/tea-one-click.js with reuse_session_shipping:true. No re-entering
// anything. Decline path is just... nothing; the page is complete without it.
//
// Fulfillment expectation mirrors the tea confirmation email: hand-blended,
// ships in 5 to 7 business days. Compliance: education/lifestyle framing,
// ZERO em-dashes in visible copy. noindex (post-purchase page).

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import { track } from '../utils/analytics';

const TIER_LABEL = {
  'tea-48': '1-Month Supply',
  'tea-120': '90-Day Supply',
};

// "Double your order for a friend or family" one-click: charge the SAME tier
// the buyer just bought (so it truly doubles their order), to the same card,
// shipped to the same address so they can hand it to someone they love.
const DOUBLE_PRICE = { 'tea-48': 48, 'tea-120': 120 };

export default function TeaThanksPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const tier = params.get('tier') || '';

  const [canOneClick, setCanOneClick] = useState(false);
  const [charging, setCharging] = useState(false);
  const [added, setAdded] = useState(false);
  const [upsellGone, setUpsellGone] = useState(false);

  // noindex for the post-purchase page (same pattern as WelcomePage).
  useEffect(() => {
    const prior = document.querySelector('meta[name="robots"]');
    const priorContent = prior ? prior.getAttribute('content') : null;
    let tag = prior;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (priorContent !== null) tag.setAttribute('content', priorContent);
      else if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
    };
  }, []);

  useEffect(() => {
    track('tea_purchase_landing', { tier });
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCanOneClick(Boolean(d.has_saved_card)); })
      .catch(() => { /* upsell simply doesn't render */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Double their order: charge the SAME tier they just bought.
  const doubleTier = tier === 'tea-120' ? 'tea-120' : 'tea-48';
  const doublePrice = DOUBLE_PRICE[doubleTier];

  async function addPouch() {
    if (charging) return;
    setCharging(true);
    track('tea_gift_double_clicked', { from_tier: tier, double_tier: doubleTier });
    try {
      const res = await fetch('/api/tea-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, tier: doubleTier, reuse_session_shipping: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAdded(true);
        track('tea_gift_double_success', { from_tier: tier, double_tier: doubleTier });
      } else {
        setUpsellGone(true);
      }
    } catch {
      setUpsellGone(true);
    } finally {
      setCharging(false);
    }
  }

  return (
    <main style={{ minHeight: '70vh', background: 'var(--paper, #FBF8F1)', padding: '3rem 1.25rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <CheckCircle2 size={52} color="var(--sage-deep, #2E3A30)" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', fontWeight: 700, color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.6rem' }}>
          Order confirmed
        </div>
        <h1 style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontStyle: 'italic', fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', color: 'var(--ink, #121110)', margin: '0 0 0.9rem' }}>
          Your Steady is on its way.
        </h1>
        <p style={{ color: 'var(--ink-soft, #2B2824)', lineHeight: 1.65, maxWidth: '46ch', margin: '0 auto 0.75rem' }}>
          {TIER_LABEL[tier] ? `Your ${TIER_LABEL[tier]} is confirmed. ` : ''}
          Annie blends every batch by hand, so your pouch ships in 5 to 7 business days. A confirmation email with everything you need is on its way to your inbox.
        </p>

        {/* One-click +1 pouch: renders only when the session really has a saved card. */}
        {canOneClick && !upsellGone && (
          <div style={{ background: 'var(--paper-warm, #F3EEE4)', border: '1px solid var(--clay, #B85A36)', borderRadius: 14, padding: '1.5rem', margin: '2rem auto 0', maxWidth: 520, textAlign: 'left' }}>
            {added ? (
              <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} color="var(--sage-deep, #2E3A30)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Done. Your order is doubled. A second pouch ships to the same address so you can put it right in their hands. Same card, no re-typing. A second confirmation email is on its way.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Leaf size={16} color="var(--clay, #B85A36)" />
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', fontWeight: 700 }}>
                    One-time offer, one click
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #121110)' }}>
                  Send one to someone you love.
                </p>
                <p style={{ margin: '0 0 1rem', color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  You know someone whose numbers you worry about. Double your order and we will send a second {TIER_LABEL[doubleTier] || 'supply'} to your door, so you can hand it to your mother, your sister, your friend. Charged to the card you just used, shipped to the address you just entered. Nothing to re-type.
                </p>
                <button
                  type="button"
                  onClick={addPouch}
                  disabled={charging}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    background: 'var(--clay, #B85A36)', color: '#FFFFFF', border: 'none',
                    padding: '0.85rem 1.4rem', borderRadius: 10, fontWeight: 700,
                    fontSize: '0.98rem', cursor: charging ? 'default' : 'pointer', opacity: charging ? 0.7 : 1,
                  }}
                >
                  {charging ? (<><Loader2 size={16} /> Adding...</>) : (<>Yes, double my order for ${doublePrice} <ArrowRight size={15} /></>)}
                </button>
                <button
                  type="button"
                  onClick={() => { setUpsellGone(true); track('tea_gift_double_declined', { from_tier: tier }); }}
                  disabled={charging}
                  style={{ display: 'block', margin: '0.7rem 0 0', padding: 0, background: 'none', border: 'none', color: 'var(--muted, #7A7061)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                >
                  No thanks, just my order is fine.
                </button>
              </>
            )}
          </div>
        )}

        <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '52ch', margin: '2rem auto 0' }}>
          While you wait: the free 60-second BP Triangle quiz shows you where a daily cup fits in the bigger picture.{' '}
          <Link to="/quiz" style={{ color: 'var(--sage-deep, #2E3A30)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Take the quiz</Link>
        </p>
        <p style={{ color: 'var(--muted, #7A7061)', fontSize: '0.78rem', lineHeight: 1.6, maxWidth: '56ch', margin: '1.25rem auto 0' }}>
          Education and lifestyle support, alongside your doctor, never instead of. Questions? Reply to your confirmation email.
        </p>
      </div>
    </main>
  );
}
