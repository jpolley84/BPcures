// TeaOneClickOffer — post-$17-kit-purchase upsell for SVUTU Steady tea.
//
// Rendered in two places with the session_id from the kit checkout return_url:
//   - /oto (src/pages/OtoCompletePage.jsx), since 2026-10-21 the PRIMARY
//     one-time offer. The page passes onSession / onAcceptClick / onAccepted /
//     onFail / onDecline so it can track the funnel and run the free-class
//     downsell.
//   - /welcome (src/pages/WelcomePage.jsx), the second-chance block. No
//     callbacks, so it behaves exactly as before (hidden when /oto passes
//     ?tea=taken, so a buyer is never offered the pouch they just bought).
//
// On mount, asks api/get-checkout-session whether the session has a saved card
// (true for kit sessions since 2026-07-16: create-embedded-checkout.js sets
// setup_future_usage off_session on the corner tier) and how many 100 g
// pouches are left (legacy_tea_left, KV tea:legacy100:left).
//
// Saved card + stock left: the buyer never re-enters payment info. Tea is a
// physical product and the kit checkout never collects a shipping address
// (nothing to ship for a PDF), so the ONE remaining field is a shipping
// address, collected inline. Submitting charges the saved card via
// api/tea-one-click.js and shows an inline confirmation, no redirect.
//
// Failure handling (2026-10-21 review): the server charge is idempotent per
// session + tier (KV idemKey, 24 h), so when we do NOT know whether the charge
// landed (network drop, unexpected 5xx) we KEEP the one-click form and tell
// the buyer to check email before retrying. We only switch to the plain $48
// Payment Link when the server told us one-click cannot work for this session
// (409 no saved card / not eligible, 402 bank wants authentication, 404
// session not found). Switching on an unknown outcome is how a buyer pays
// twice: the Payment Link is outside the idempotency key.
//
// 100 g pouches sold out (legacy_tea_left <= 0, or the charge endpoint answers
// 410 sold_out): the one-click hides itself and the button sends them to the
// 150 g Steady on hormoneteas.com, the same place middleware.js sends /tea
// once the counter hits 0. A 503 stock_unavailable (KV unreachable) takes the
// same 150 g path: fail closed, like middleware.js, never the unguarded $48
// Payment Link for pouches nobody can confirm are on the shelf.
//
// Compliance: no clinical claims, ZERO em-dashes in visible copy. Ingredient
// and guarantee copy match public/tea/index.html (twelve botanicals, daily
// cup, 60-day money-back guarantee), checked 2026-10-21.

import { useState, useEffect, useId } from 'react';
import { Leaf, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const TEA_48_LINK = 'https://buy.stripe.com/eVq5kD8k30rk63h6NjfnO1z'; // fallback checkout, $48 100 g pouch
// Trailing slash + own UTMs: the bare /tea 307-redirect stamps
// manychat/comment-dm UTMs on ALL traffic, which would mis-attribute every
// post-purchase click. The slash form bypasses that redirect.
const TEA_PAGE = 'https://bpquiz.com/tea/?utm_source=post-purchase&utm_medium=upsell&utm_campaign=tea';
// Where the 150 g bag lives once the 100 g pouches are gone.
const SHOPIFY_150 = 'https://hormoneteas.com/products/steady?utm_source=post-purchase&utm_medium=upsell&utm_campaign=tea';

const WRAP = {
  background: 'var(--paper-warm, #F3EEE4)',
  border: '1px solid var(--clay, #B85A36)',
  borderRadius: 16,
  padding: '1.6rem',
  textAlign: 'left',
  margin: '1.25rem auto 0',
  maxWidth: 720,
};
const HEADROW = { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.6rem' };
const BADGE = {
  width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 9,
  background: 'var(--sage-soft, #EEF3EC)', border: '1px solid var(--clay, #B85A36)',
};
const KICKER = { fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', fontWeight: 700 };
const TITLE = { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500, lineHeight: 1.25, color: 'var(--ink, #2C3E50)', margin: '0 0 0.5rem' };
const BODY = { fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-soft, #3A3A3A)', margin: '0 0 1.1rem' };
const BTN = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  background: 'var(--clay, #B85A36)', color: 'var(--cream, #FBF8F1)',
  padding: '0.8rem 1.4rem', borderRadius: 10, textDecoration: 'none',
  fontWeight: 700, fontSize: '0.98rem', border: 'none', cursor: 'pointer',
};
const GHOST = {
  background: 'none', border: 'none', padding: '0.4rem',
  color: 'var(--dark-gray, #666)', textDecoration: 'underline',
  cursor: 'pointer', font: 'inherit', fontSize: '0.9rem',
};
const INPUT = {
  width: '100%', padding: '0.6rem 0.7rem', borderRadius: 8,
  border: '1px solid var(--line, #D8CFBD)', fontSize: '0.92rem',
  background: '#fff', color: 'var(--ink, #2C3E50)', boxSizing: 'border-box',
};
const LABEL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft, #3A3A3A)', margin: '0 0 0.25rem' };
const FIELD = { marginBottom: '0.7rem' };
const ERROR = { color: '#B04A3A', fontSize: '0.88rem', lineHeight: 1.5, marginTop: '0.6rem' };

function Field({ label, value, onChange, span, autoComplete }) {
  const id = useId();
  return (
    <div style={{ ...FIELD, gridColumn: span ? 'span 2' : undefined }}>
      <label style={LABEL} htmlFor={id}>{label}</label>
      <input id={id} style={INPUT} value={value} onChange={onChange} autoComplete={autoComplete} />
    </div>
  );
}

const nonEmpty = (v) => Boolean(String(v || '').trim());

export default function TeaOneClickOffer({
  sessionId,
  firstName,
  onSession,      // (data | null) once the session lookup settles (fires even if this unmounted first)
  onAcceptClick,  // (step) 'open_form' | 'submit' | 'payment_link' | 'shopify_150g'. Count step==='submit' as the accept.
  onAccepted,     // (data) after a successful one-click charge
  onFail,         // (reason) 'sold_out' | 'no_saved_card' | 'card_auth' | 'session_not_found' | 'bad_fields' | 'stock_unavailable' | 'unknown_outcome'
  onDecline,      // () renders a "no thanks" link that calls this
  declineLabel,
}) {
  const [hasSavedCard, setHasSavedCard] = useState(null); // null = checking
  const [soldOut, setSoldOut] = useState(false);
  const [stockNote, setStockNote] = useState('The 100 g pouch is sold out. The 150 g bag ships from our tea shop.');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    name: firstName || '', line1: '', line2: '', city: '', state: '', postal_code: '',
  });

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setHasSavedCard(false);
      if (onSession) onSession(null);
      return;
    }
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        // The parent outlives this component (a fast "no thanks" unmounts us
        // before the lookup returns), so it hears the result either way.
        if (onSession) onSession(data && data.ok ? data : null);
        if (cancelled) return;
        setHasSavedCard(Boolean(data.has_saved_card));
        // 0 = the 100 g pouches are gone; null/undefined = the read failed,
        // treated as in stock (api/tea-one-click.js is the real guard, 410).
        if (typeof data.legacy_tea_left === 'number' && data.legacy_tea_left <= 0) setSoldOut(true);
        if (data.first_name && !fields.name) {
          setFields((f) => ({ ...f, name: data.first_name }));
        }
      })
      .catch(() => {
        if (onSession) onSession(null);
        if (cancelled) return;
        setHasSavedCard(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const canSubmit = nonEmpty(fields.name) && nonEmpty(fields.line1) && nonEmpty(fields.city) && nonEmpty(fields.state) && nonEmpty(fields.postal_code) && !submitting;
  const step = (name) => { if (onAcceptClick) onAcceptClick(name); };
  const fail = (reason) => { if (onFail) onFail(reason); };

  const handleOneClick = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    step('submit');
    setSubmitting(true);
    setError('');
    let res;
    let data = {};
    try {
      res = await fetch('/api/tea-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          tier: 'tea-48',
          shipping: {
            name: fields.name.trim(), line1: fields.line1.trim(), line2: fields.line2.trim(),
            city: fields.city.trim(), state: fields.state.trim(), postal_code: fields.postal_code.trim(),
            country: 'US',
          },
        }),
      });
      data = await res.json().catch(() => ({}));
    } catch {
      // Network drop. The charge may or may not have landed. Never send them
      // to the Payment Link from here (that is the double-charge path).
      fail('unknown_outcome');
      setError('We could not confirm your order. Before you tap again, check your email for a Steady confirmation. Tapping again never charges twice.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if (res.ok && data.ok) {
      setDone(true);
      if (onAccepted) onAccepted(data);
      return;
    }
    switch (res.status) {
      case 410:
        // sold_out: the last 100 g pouch went while they typed. Nothing was
        // charged. Show the 150 g bag instead.
        fail('sold_out');
        setSoldOut(true);
        setShowForm(false);
        return;
      case 402:
        // Bank wants authentication, or declined. Nothing was charged.
        fail('card_auth');
        setHasSavedCard(false);
        setError('Your bank asked for extra approval on a one-click charge. Nothing was charged. Use the link below to finish with your card.');
        return;
      case 409:
        // no_saved_card / not_eligible. Nothing was charged.
        fail('no_saved_card');
        setHasSavedCard(false);
        setError('One-click is not available for this order. Nothing was charged. Use the link below to finish.');
        return;
      case 404:
        fail('session_not_found');
        setHasSavedCard(false);
        setError('We could not find your order. Nothing was charged. Use the link below instead.');
        return;
      case 400:
        fail('bad_fields');
        setError('Check the address fields and try again. Nothing was charged.');
        return;
      case 503:
        // stock_unavailable: KV unreachable, nothing was charged. Fail closed
        // to the 150 g bag (the same call middleware.js makes for /tea).
        fail('stock_unavailable');
        setStockNote('We cannot confirm 100 g pouch stock right now. Nothing was charged. The 150 g bag ships from our tea shop.');
        setSoldOut(true);
        setShowForm(false);
        return;
      default:
        // 5xx or anything else: the charge may have landed before the error.
        fail('unknown_outcome');
        setError('We could not confirm your order. Before you tap again, check your email for a Steady confirmation. Tapping again never charges twice.');
    }
  };

  if (done) {
    return (
      <section style={WRAP}>
        <div style={{ ...HEADROW, marginBottom: '0.4rem' }}>
          <div style={BADGE}><CheckCircle2 size={16} style={{ color: 'var(--sage-deep, #2E3A30)' }} /></div>
          <span style={KICKER}>You&rsquo;re getting Steady</span>
        </div>
        <p style={{ ...BODY, margin: 0 }}>
          Charged to the card you already used, no re-entry needed. A confirmation email is on its way, and it ships in 5 to 7 business days.
        </p>
      </section>
    );
  }

  const oneClickReady = hasSavedCard && !soldOut;

  return (
    <section style={WRAP}>
      <div style={HEADROW}>
        <div style={BADGE}><Leaf size={16} style={{ color: 'var(--clay, #B85A36)' }} /></div>
        <span style={KICKER}>One step, done for you</span>
      </div>
      <h3 style={TITLE}>Drink the protocol. Don&rsquo;t chase it.</h3>
      <p style={BODY}>
        Your reset calls for a daily cup. <strong>Steady</strong> is the caffeine free ruby tea Joel and Annie blend from twelve whole botanicals, hibiscus first, measured and shipped to your door. 60-day money-back guarantee, so there is no risk in trying it.
      </p>

      {soldOut && (
        <>
          <p style={{ ...BODY, margin: '0 0 0.8rem', fontSize: '0.88rem' }}>
            {stockNote}
          </p>
          <a href={SHOPIFY_150} target="_blank" rel="noopener noreferrer" style={{ ...BTN, textDecoration: 'none' }} onClick={() => step('shopify_150g')}>
            Shop Steady 150 g <ArrowRight size={15} />
          </a>
        </>
      )}

      {oneClickReady && !showForm && (
        <button type="button" style={BTN} onClick={() => { step('open_form'); setShowForm(true); }}>
          Add Steady, $48 in 1 click <ArrowRight size={15} />
        </button>
      )}

      {oneClickReady && showForm && (
        <form onSubmit={handleOneClick}>
          <p style={{ ...BODY, margin: '0 0 0.8rem', fontSize: '0.85rem' }}>
            One click bills the card from your kit purchase. Just need where to ship it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.8rem' }}>
            <Field label="Full name" value={fields.name} onChange={set('name')} span autoComplete="name" />
            <Field label="Address" value={fields.line1} onChange={set('line1')} span autoComplete="address-line1" />
            <Field label="Apt / suite (optional)" value={fields.line2} onChange={set('line2')} span autoComplete="address-line2" />
            <Field label="City" value={fields.city} onChange={set('city')} autoComplete="address-level2" />
            <Field label="State" value={fields.state} onChange={set('state')} autoComplete="address-level1" />
            <Field label="ZIP code" value={fields.postal_code} onChange={set('postal_code')} span autoComplete="postal-code" />
          </div>
          <button type="submit" style={{ ...BTN, opacity: canSubmit ? 1 : 0.55, marginTop: '0.3rem' }} disabled={!canSubmit}>
            {submitting ? <><Loader2 size={15} aria-hidden /> Charging&hellip;</> : <>Confirm, $48 to card on file <ArrowRight size={15} /></>}
          </button>
        </form>
      )}

      {hasSavedCard === false && !soldOut && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', alignItems: 'center' }}>
          <a href={TEA_48_LINK} target="_blank" rel="noopener noreferrer" style={{ ...BTN, textDecoration: 'none' }} onClick={() => step('payment_link')}>
            Shop Steady, $48 <ArrowRight size={15} />
          </a>
        </div>
      )}

      {error && <p role="alert" style={ERROR}>{error}</p>}

      <div style={{ marginTop: '0.9rem' }}>
        <a href={TEA_PAGE} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: 'var(--muted, #7A7A7A)', textDecoration: 'underline' }}>
          See everything about Steady, including the 90-Day option &rarr;
        </a>
      </div>

      {onDecline && (
        <p style={{ textAlign: 'center', margin: '1.1rem 0 0' }}>
          <button type="button" onClick={onDecline} disabled={submitting} style={GHOST}>
            {declineLabel || 'No thanks'}
          </button>
        </p>
      )}
    </section>
  );
}
