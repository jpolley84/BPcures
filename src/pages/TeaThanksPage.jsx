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

// 2026-08-16 (Joel) — the one-bag buyer now walks a TWO RUNG ladder:
//
//   rung 1  upgrade to the 90-day supply, $72 (the $120 tier minus the $48
//           already paid), and it ships free
//   rung 2  shown only if she declines rung 1: one more bag for someone she
//           loves, $48, also shipping free
//
// Both rungs ship free on purpose. She just paid $5.97 to ship a single bag,
// so "no shipping on this one" is a real number she can check, not a slogan.
// A buyer who already took the 90-day supply skips the ladder and gets the
// original double-your-order offer, since there is nothing left to upgrade.
const LADDER = {
  upgrade: {
    tier: 'tea-upgrade-90',
    price: 72,
    eyebrow: 'One-time upgrade, one click',
    heading: 'Make it the full 90 days.',
    body: 'Steady works on the pattern, not the day, and three months is where women stop watching for change and start expecting it. Add the two remaining pouches for $72, and this time shipping is on us. Charged to the card you just used, shipped to the address you just entered.',
    cta: 'Yes, upgrade me to 90 days for $72',
    done: 'Done. You are on the full 90-day supply. Two more pouches ship with your order, no extra shipping, and a second confirmation email is on its way.',
  },
  friend: {
    tier: 'tea-friend-48',
    price: 48,
    eyebrow: 'Last offer, one click',
    heading: 'Send one to someone you love.',
    body: 'You know someone whose numbers you worry about. Add a second pouch for $48 and we will ship it free to your door, so you can put it in her hands yourself. Same card, same address, nothing to re-type.',
    cta: 'Yes, add a bag for a friend, $48',
    done: 'Done. A second pouch ships free to the same address, so you can hand it to her yourself. A second confirmation email is on its way.',
  },
  double: {
    tier: 'tea-120',
    price: 120,
    eyebrow: 'One-time offer, one click',
    heading: 'Send one to someone you love.',
    body: 'You know someone whose numbers you worry about. Double your order and we will send a second 90-Day Supply to your door, shipping free, so you can hand it to your mother, your sister, your friend. Charged to the card you just used, shipped to the address you just entered.',
    cta: 'Yes, double my order for $120',
    done: 'Done. Your order is doubled and the second supply ships free to the same address. A second confirmation email is on its way.',
  },
};

export default function TeaThanksPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const tier = params.get('tier') || '';

  const [canOneClick, setCanOneClick] = useState(false);
  const [charging, setCharging] = useState(false);
  const [added, setAdded] = useState(false);
  const [upsellGone, setUpsellGone] = useState(false);
  // Which rung is on screen. A one-bag buyer starts on 'upgrade' and falls to
  // 'friend' when she declines; a 90-day buyer has nothing to upgrade, so she
  // gets the double-your-order offer and there is no second rung.
  const boughtSingle = tier !== 'tea-120';
  const [rung, setRung] = useState(boughtSingle ? 'upgrade' : 'double');
  const offer = LADDER[rung];

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

  async function acceptOffer() {
    if (charging) return;
    setCharging(true);
    track('tea_upsell_clicked', { from_tier: tier, rung, upsell_tier: offer.tier });
    try {
      const res = await fetch('/api/tea-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, tier: offer.tier, reuse_session_shipping: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAdded(true);
        track('tea_upsell_success', { from_tier: tier, rung, upsell_tier: offer.tier });
      } else {
        // A failed charge retires the whole ladder. Dropping her to the next
        // rung after a decline is persuasion; doing it after a card failure is
        // just asking a broken card to pay twice.
        setUpsellGone(true);
        track('tea_upsell_failed', { from_tier: tier, rung, reason: data.error || 'unknown' });
      }
    } catch {
      setUpsellGone(true);
    } finally {
      setCharging(false);
    }
  }

  // Decline: step down to the friend bag, or end the ladder if that WAS it.
  function declineOffer() {
    track('tea_upsell_declined', { from_tier: tier, rung });
    if (rung === 'upgrade') setRung('friend');
    else setUpsellGone(true);
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
                  {offer.done}
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Leaf size={16} color="var(--clay, #B85A36)" />
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', fontWeight: 700 }}>
                    {offer.eyebrow}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink, #121110)' }}>
                  {offer.heading}
                </p>
                <p style={{ margin: '0 0 1rem', color: 'var(--ink-soft, #2B2824)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {offer.body}
                </p>
                <button
                  type="button"
                  onClick={acceptOffer}
                  disabled={charging}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    background: 'var(--clay, #B85A36)', color: '#FFFFFF', border: 'none',
                    padding: '0.85rem 1.4rem', borderRadius: 10, fontWeight: 700,
                    fontSize: '0.98rem', cursor: charging ? 'default' : 'pointer', opacity: charging ? 0.7 : 1,
                  }}
                >
                  {charging ? (<><Loader2 size={16} /> Adding...</>) : (<>{offer.cta} <ArrowRight size={15} /></>)}
                </button>
                <button
                  type="button"
                  onClick={declineOffer}
                  disabled={charging}
                  style={{ display: 'block', margin: '0.7rem 0 0', padding: 0, background: 'none', border: 'none', color: 'var(--muted, #7A7061)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                >
                  {rung === 'upgrade' ? 'No thanks, one month is right for me.' : 'No thanks, just my order is fine.'}
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
