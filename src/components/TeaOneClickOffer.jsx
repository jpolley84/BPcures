// TeaOneClickOffer — post-$17-kit-purchase upsell for SVUTU Steady tea.
//
// Rendered on /welcome (src/pages/WelcomePage.jsx) with the session_id from
// the kit's checkout return_url. On mount, asks api/get-checkout-session
// whether that session has a saved card (true for any session created after
// api/create-embedded-checkout.js started passing customer_creation +
// setup_future_usage off_session on 2026-07-08; false for older sessions).
//
// If a saved card exists: the buyer never re-enters payment info. Tea is a
// physical product and the kit checkout never collects a shipping address
// (nothing to ship for a PDF), so the ONE remaining field is a shipping
// address, collected inline. Submitting charges the saved card via
// api/tea-one-click.js and shows an inline confirmation, no redirect.
//
// If no saved card, or the charge fails for any reason (declined, needs 3DS,
// server error): falls back to the plain Stripe Payment Link, same as any
// normal checkout, so the offer never dead-ends.
//
// Compliance: no clinical claims, ZERO em-dashes in visible copy.

import { useState, useEffect } from 'react';
import { Leaf, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const TEA_48_LINK = 'https://buy.stripe.com/eVq5kD8k30rk63h6NjfnO1z'; // fallback checkout
const TEA_PAGE = 'https://bpquiz.com/tea';

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
const INPUT = {
  width: '100%', padding: '0.6rem 0.7rem', borderRadius: 8,
  border: '1px solid var(--line, #D8CFBD)', fontSize: '0.92rem',
  background: '#fff', color: 'var(--ink, #2C3E50)',
};
const LABEL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft, #3A3A3A)', margin: '0 0 0.25rem' };
const FIELD = { marginBottom: '0.7rem' };

function Field({ label, value, onChange, span }) {
  return (
    <div style={{ ...FIELD, gridColumn: span ? 'span 2' : undefined }}>
      <label style={LABEL}>{label}</label>
      <input style={INPUT} value={value} onChange={onChange} />
    </div>
  );
}

export default function TeaOneClickOffer({ sessionId, firstName }) {
  const [hasSavedCard, setHasSavedCard] = useState(null); // null = checking
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
      return;
    }
    fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setHasSavedCard(Boolean(data.has_saved_card));
        if (data.first_name && !fields.name) {
          setFields((f) => ({ ...f, name: data.first_name }));
        }
      })
      .catch(() => { if (!cancelled) setHasSavedCard(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const canSubmit = fields.name && fields.line1 && fields.city && fields.state && fields.postal_code && !submitting;

  const handleOneClick = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tea-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          tier: 'tea-48',
          shipping: { ...fields, country: 'US' },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
      } else if (res.status === 409 || res.status === 402) {
        setHasSavedCard(false);
      } else {
        setError('Something went wrong. Use the link below instead.');
        setHasSavedCard(false);
      }
    } catch {
      setError('Something went wrong. Use the link below instead.');
      setHasSavedCard(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section style={WRAP}>
        <div style={{ ...HEADROW, marginBottom: '0.4rem' }}>
          <div style={BADGE}><CheckCircle2 size={16} style={{ color: 'var(--sage-deep, #2E3A30)' }} /></div>
          <span style={KICKER}>You're getting Steady</span>
        </div>
        <p style={{ ...BODY, margin: 0 }}>
          Charged to the card you already used, no re-entry needed. A confirmation email is on its way, and it ships in 5 to 7 business days.
        </p>
      </section>
    );
  }

  return (
    <section style={WRAP}>
      <div style={HEADROW}>
        <div style={BADGE}><Leaf size={16} style={{ color: 'var(--clay, #B85A36)' }} /></div>
        <span style={KICKER}>One step, done for you</span>
      </div>
      <h3 style={TITLE}>Drink the protocol. Don&rsquo;t chase it.</h3>
      <p style={BODY}>
        Your reset calls for hibiscus every day. <strong>Steady</strong> is the exact single-ingredient hibiscus, measured and shipped to your door. 60-day keep-the-pouch guarantee, so there is no risk in trying it.
      </p>

      {hasSavedCard && !showForm && (
        <button type="button" style={BTN} onClick={() => setShowForm(true)}>
          Add Steady, $48 &mdash; 1 click <ArrowRight size={15} />
        </button>
      )}

      {hasSavedCard && showForm && (
        <form onSubmit={handleOneClick}>
          <p style={{ ...BODY, margin: '0 0 0.8rem', fontSize: '0.85rem' }}>
            One click bills the card from your kit purchase. Just need where to ship it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.8rem' }}>
            <Field label="Full name" value={fields.name} onChange={set('name')} span />
            <Field label="Address" value={fields.line1} onChange={set('line1')} span />
            <Field label="Apt / suite (optional)" value={fields.line2} onChange={set('line2')} span />
            <Field label="City" value={fields.city} onChange={set('city')} />
            <Field label="State" value={fields.state} onChange={set('state')} />
            <Field label="ZIP code" value={fields.postal_code} onChange={set('postal_code')} span />
          </div>
          <button type="submit" style={{ ...BTN, opacity: canSubmit ? 1 : 0.55, marginTop: '0.3rem' }} disabled={!canSubmit}>
            {submitting ? <><Loader2 size={15} className="spin" /> Charging&hellip;</> : <>Confirm, $48 to card on file <ArrowRight size={15} /></>}
          </button>
        </form>
      )}

      {!hasSavedCard && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', alignItems: 'center' }}>
          <a href={TEA_48_LINK} target="_blank" rel="noopener noreferrer" style={{ ...BTN, textDecoration: 'none' }}>
            Shop Steady, $48 <ArrowRight size={15} />
          </a>
        </div>
      )}

      {error && <p style={{ color: '#B04A3A', fontSize: '0.85rem', marginTop: '0.6rem' }}>{error}</p>}

      <div style={{ marginTop: '0.9rem' }}>
        <a href={TEA_PAGE} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: 'var(--muted, #7A7A7A)', textDecoration: 'underline' }}>
          See everything about Steady, including the 90-Day option &rarr;
        </a>
      </div>
    </section>
  );
}
