// AllInEnrollForm — the embedded enrollment form on /allin.
//
// 2026-10-29 (Joel): "put the pay in full checkbox for both and copy the embed
// form from the activated site." Same flow as public/life-change-activated:
//   1. api/create-deposit-payment-intent makes a PaymentIntent (card + Klarna)
//      for the deposit, or the full tuition when the checkbox is ticked. The
//      server owns the amount.
//   2. Stripe's Payment Element mounts on this page.
//   3. On submit, api/attach-deposit-customer saves her details, then
//      stripe.confirmPayment, then api/deposit-confirmed sends Joel's notice
//      and her welcome email.
// Klarna redirects return to /life-change-activated/confirmation/?program=...
// ZERO em dashes in visible copy.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { track } from '../utils/analytics';

export const ENROLL_PROGRAMS = {
  'life-change-activated': {
    name: 'Life Change Activated',
    deposit: '$200',
    full: '$2,000',
    remaining: '$1,800',
    depositHint: "Your $200 deposit is non-refundable and counts toward tuition. After payment, you'll get a link to choose from three options for the remaining $1,800.",
    fullPerk: 'Unlocks the pay-in-full bonuses, including a free second seat for a plus one.',
    balanceLink: '/life-change-activated/balance/',
  },
  'life-change-accelerator': {
    name: 'The Life Change Accelerator',
    deposit: '$500',
    full: '$7,500',
    remaining: '$7,000',
    depositHint: 'Your $500 deposit is non-refundable and counts toward tuition. We will reach out within one business day to set up the $7,000 balance on a schedule that works for you, up to 12 months.',
    fullPerk: '',
    balanceLink: '',
  },
};

export default function AllInEnrollForm({ program, onProgramChange, programs }) {
  const P = ENROLL_PROGRAMS[program];
  const [full, setFull] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // 'deposit' | 'full'
  const [ready, setReady] = useState(false);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const intentRef = useRef(null);
  const mountRef = useRef(null);

  // A new PaymentIntent whenever the program or the pay-in-full choice changes.
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    setReady(false); setError('');
    stripeRef.current = null; elementsRef.current = null; intentRef.current = null;
    (async () => {
      try {
        const r = await fetch('/api/create-deposit-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program, option: full ? 'full' : 'deposit' }),
        });
        if (!r.ok) throw new Error('config');
        const cfg = await r.json();
        if (!cfg.publishableKey || !cfg.clientSecret || !cfg.paymentIntentId) throw new Error('config');
        const stripe = await loadStripe(cfg.publishableKey);
        if (cancelled || !stripe) return;
        const elements = stripe.elements({
          clientSecret: cfg.clientSecret,
          appearance: { theme: 'stripe', variables: { colorPrimary: '#0d2947', colorText: '#162b43', colorDanger: '#ae292e', borderRadius: '7px' } },
        });
        const pe = elements.create('payment', { layout: 'tabs', paymentMethodOrder: full ? ['klarna', 'card'] : ['card', 'klarna'] });
        if (!mountRef.current) return;
        pe.mount(mountRef.current);
        cleanup = () => { try { pe.destroy(); } catch { /* already gone */ } };
        pe.on('ready', () => { if (!cancelled) setReady(true); });
        pe.on('loaderror', () => setError('Secure payment details could not load. Please refresh the page.'));
        stripeRef.current = stripe; elementsRef.current = elements; intentRef.current = cfg.paymentIntentId;
      } catch {
        if (!cancelled) setError('Secure payment details could not load. Please refresh the page.');
      }
    })();
    return () => { cancelled = true; cleanup(); };
  }, [program, full]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const f = e.currentTarget;
    if (!f.reportValidity()) return;
    if (!stripeRef.current || !elementsRef.current || !intentRef.current) {
      setError('Secure payment is still loading. Please wait a moment and try again.');
      return;
    }
    const contact = {
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
    };
    setBusy(true);
    track('allin_enroll_submit', { program, option: full ? 'full' : 'deposit' });
    try {
      const save = await fetch('/api/attach-deposit-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: intentRef.current, ...contact }),
      });
      if (!save.ok) throw new Error('We could not save your details. Please try again.');
      const { error: err, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: new URL(`/life-change-activated/confirmation/?program=${program}`, window.location.origin).href,
          payment_method_data: { billing_details: { name: `${contact.first_name} ${contact.last_name}`, email: contact.email, phone: contact.phone } },
        },
        redirect: 'if_required',
      });
      if (err) throw new Error(err.message || 'Your payment could not be completed.');
      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        fetch('/api/deposit-confirmed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId: paymentIntent.id }) }).catch(() => {});
        setDone(full ? 'full' : 'deposit');
      } else {
        throw new Error('Your payment was not completed. Please try again.');
      }
    } catch (x) {
      setError(x.message || 'Unable to process the payment. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="enroll-card" id="enroll-form" role="status">
        <h3>{done === 'full' ? 'You are all set.' : 'Payment submitted.'}</h3>
        <p>
          {done === 'full'
            ? `Your ${P.full} ${P.name} tuition is paid in full. Stripe is emailing your receipt, and we will be in touch with your next steps.`
            : `Your ${P.deposit} deposit is in. Watch your email for your receipt and next steps.`}
        </p>
        {done === 'deposit' && P.balanceLink ? (
          <p><a href={P.balanceLink} style={{ fontWeight: 800 }}>{`Choose your payment plan for the ${P.remaining} balance →`}</a></p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="enroll-card" id="enroll-form">
      <div className="enroll-head">
        <h3>Complete your order</h3>
        {programs.length > 1 ? (
          <div className="enroll-switch" role="radiogroup" aria-label="Choose your program">
            {programs.map((k) => (
              <button type="button" key={k} role="radio" aria-checked={k === program}
                className={k === program ? 'on' : ''} onClick={() => { setFull(false); onProgramChange(k); }}>
                {ENROLL_PROGRAMS[k].name} · {ENROLL_PROGRAMS[k].full}
              </button>
            ))}
          </div>
        ) : <p>{P.name}</p>}
      </div>
      <div className="enroll-price">
        <span className="enroll-amt">{full ? P.full : P.deposit}</span>
        <span className="enroll-note">{full ? 'tuition paid in full' : 'reserves your spot'}</span>
      </div>
      {!full ? (
        <div className="enroll-meta">
          <span><span>Total program investment</span><strong>{P.full}</strong></span>
          <span><span>Deposit credited toward total</span><strong>{`− ${P.deposit}`}</strong></span>
          <span><span>Remaining after deposit</span><strong>{P.remaining}</strong></span>
        </div>
      ) : null}
      <label className="enroll-payfull">
        <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} />
        <span>
          <strong>{`Pay in full today: ${P.full}`}</strong>
          <small>Card or Klarna (pay over time with Klarna). No balance to pay later.{P.fullPerk ? ` ${P.fullPerk}` : ''}</small>
        </span>
      </label>
      <form onSubmit={onSubmit} noValidate={false}>
        <div className="enroll-row">
          <label>First name *<input name="first_name" autoComplete="given-name" maxLength={100} required /></label>
          <label>Last name *<input name="last_name" autoComplete="family-name" maxLength={100} required /></label>
        </div>
        <label>Email address *<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Phone number *<input name="phone" type="tel" autoComplete="tel" maxLength={30} required /></label>
        <div className="enroll-pay-head">Payment details <span>🔒 Secure payment</span></div>
        {!ready ? <p className="enroll-loading">Loading secure payment form…</p> : null}
        <div ref={mountRef} className="enroll-element" />
        <p className="enroll-hint">
          {full
            ? `You are paying the full ${P.full} tuition today. Choose Klarna to split it into smaller payments through Klarna, or pay by card.`
            : P.depositHint}
        </p>
        <button type="submit" className="btn gold full" disabled={busy}>
          {busy ? 'Processing…' : full ? `Pay ${P.full} in full →` : `Reserve my spot · ${P.deposit} →`}
        </button>
        {error ? <div className="checkout-error" role="alert">{error}</div> : null}
      </form>
      <div className="secure">🔒 Card and Klarna payments are processed securely by Stripe</div>
    </div>
  );
}
