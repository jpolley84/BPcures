// SatinThanksPage (route: /satin-thanks) — SVUTU Satin post-purchase page.
//
// 2026-07-21: the embedded Satin checkout (create-embedded-checkout tea-satin-*)
// returns here. This is where the saved card pays off: a true one-click
// "double your order for a friend or family" that charges the SAME Satin tier
// the buyer just bought (tea-satin-48 -> +$48, tea-satin-120 -> +$120), same
// card, shipped to the same address so they can hand it to someone they love.
// via api/tea-one-click.js (blend:satin fulfillment). ZERO em dashes. noindex.

import { useEffect, useRef, useState } from 'react';

const TIER_LABEL = { 'tea-satin-48': '1-Month Supply', 'tea-satin-120': '90-Day Supply' };
const DOUBLE_PRICE = { 'tea-satin-48': 48, 'tea-satin-120': 120 };

const C = {
  cream: '#FBF7EF', ruby: '#A0506A', rubyDeep: '#7C3B52', rubySoft: '#F4E6EC',
  ink: '#3B3228', muted: '#7D6F5E', line: '#E7DDCB', sage: '#5F6E45',
};
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Montserrat', system-ui, -apple-system, sans-serif";

export default function SatinThanksPage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const sessionId = params.get('session_id') || '';
  const tier = params.get('tier') || '';
  const doubleTier = tier === 'tea-satin-120' ? 'tea-satin-120' : 'tea-satin-48';
  const doublePrice = DOUBLE_PRICE[doubleTier];

  const [canOneClick, setCanOneClick] = useState(false);
  const [charging, setCharging] = useState(false);
  const [added, setAdded] = useState(false);
  const [gone, setGone] = useState(false);
  const fontRef = useRef(null);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Montserrat:wght@400;600;700&display=swap';
    document.head.appendChild(l);
    fontRef.current = l;
    // noindex
    let tag = document.querySelector('meta[name="robots"]');
    const prior = tag ? tag.getAttribute('content') : null;
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'robots'); document.head.appendChild(tag); }
    tag.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (l.parentNode) l.parentNode.removeChild(l);
      if (prior !== null && tag) tag.setAttribute('content', prior);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCanOneClick(Boolean(d.has_saved_card)); })
      .catch(() => { /* upsell simply hidden */ });
    return () => { cancelled = true; };
  }, [sessionId]);

  async function doubleOrder() {
    if (charging) return;
    setCharging(true);
    try {
      const res = await fetch('/api/tea-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, tier: doubleTier, reuse_session_shipping: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setAdded(true); else setGone(true);
    } catch { setGone(true); } finally { setCharging(false); }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.cream, color: C.ink, fontFamily: SANS, padding: 'clamp(2rem, 6vw, 3.5rem) 1.15rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: '0.68rem', fontWeight: 700, color: C.ruby }}>Order confirmed</span>
        <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', margin: '0.6rem 0 0.8rem', color: C.ink }}>
          Your Satin is on its way.
        </h1>
        <p style={{ color: C.ink, lineHeight: 1.65, maxWidth: '44ch', margin: '0 auto', fontSize: '1rem' }}>
          {TIER_LABEL[tier] ? `Your ${TIER_LABEL[tier]} is confirmed. ` : ''}
          Annie blends every batch by hand, so your pouch ships in 5 to 7 business days. A confirmation email is on its way.
        </p>

        {canOneClick && !gone && (
          <div style={{ background: C.rubySoft, border: `1.5px solid ${C.ruby}`, borderRadius: 14, padding: '1.5rem', margin: '2rem auto 0', maxWidth: 500, textAlign: 'left' }}>
            {added ? (
              <p style={{ margin: 0, color: C.ink, lineHeight: 1.6, fontSize: '0.95rem' }}>
                Done. Your order is doubled. A second {TIER_LABEL[doubleTier] || 'supply'} ships to the same address so you can put it right in their hands. Same card, no re-typing. A second confirmation email is on its way.
              </p>
            ) : (
              <>
                <span style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ruby, fontWeight: 700, marginBottom: '0.5rem' }}>
                  One-time offer, one click
                </span>
                <p style={{ margin: '0 0 0.4rem', fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.3rem', color: C.rubyDeep }}>Send one to someone you love.</p>
                <p style={{ margin: '0 0 1rem', color: C.ink, lineHeight: 1.6, fontSize: '0.95rem' }}>
                  You know someone whose numbers you worry about. Double your order and we will send a second {TIER_LABEL[doubleTier] || 'supply'} to your door, so you can hand it to your mother, your sister, your friend. Charged to the card you just used, shipped to the address you just entered. Nothing to re-type.
                </p>
                <button
                  type="button"
                  onClick={doubleOrder}
                  disabled={charging}
                  style={{
                    display: 'inline-block', background: C.ruby, color: '#fff', border: 'none',
                    padding: '0.85rem 1.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.98rem',
                    fontFamily: SANS, cursor: charging ? 'default' : 'pointer', opacity: charging ? 0.7 : 1,
                  }}
                >
                  {charging ? 'Adding...' : `Yes, double my order for $${doublePrice}`}
                </button>
                <button
                  type="button"
                  onClick={() => setGone(true)}
                  disabled={charging}
                  style={{ display: 'block', margin: '0.7rem 0 0', padding: 0, background: 'none', border: 'none', color: C.muted, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                >
                  No thanks, just my order is fine.
                </button>
              </>
            )}
          </div>
        )}

        <p style={{ color: C.muted, fontSize: '0.75rem', lineHeight: 1.6, maxWidth: '52ch', margin: '2rem auto 0' }}>
          Herbal wellness support, not medical advice. Questions? Reply to your confirmation email.
        </p>
      </div>
    </main>
  );
}
