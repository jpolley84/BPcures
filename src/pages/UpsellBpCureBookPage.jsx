// Post-purchase upsell #1 — Blood Pressure Cures: The 10-Day Nurse's
// Reset ebook for $12.99. Inserted between $17 Kit and $47 Reset Kit
// upsell to mirror bpcures' converting flow.
//
// 2026-05-20: upgraded from click-through (Payment Link redirect) to
// TRUE ONE-CLICK via saved card. Flow:
//
//   1. On mount, hit /api/get-checkout-session?session_id=X
//   2. If has_saved_card === true: show one-click "Yes" button that
//      calls /api/charge-saved-card → done, redirect to next step.
//   3. If no saved card (e.g. customer came via Stripe Payment Link
//      without saveCard:true): fall back to Payment Link redirect
//      (legacy click-through path — buyer re-enters card).
//
// This means /upsell-bp-cure-book WORKS for everyone:
//   - Homepage CheckoutPage buyers (saveCard:true) → one-click
//   - Drip-email / TikTok-bio buyers (Payment Link) → fallback
// No buyer hits a dead end. Migration is incremental.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, BookOpen, ShieldCheck, Loader } from 'lucide-react';

const BOOK_PAYMENT_LINK = 'https://buy.stripe.com/bJe4gzeIrfme9ft3B7fnO02';

export default function UpsellBpCureBookPage() {
  const [processing, setProcessing] = useState(false);
  const [chargeError, setChargeError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null); // { has_saved_card, first_name }
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // On mount: probe the session for a saved payment method. If found,
  // we'll do one-click. Otherwise fall back to Payment Link redirect.
  useEffect(() => {
    if (!sessionId) {
      setCheckingSession(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/get-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!cancelled) {
          setSessionInfo(data.ok ? data : { has_saved_card: false });
          setCheckingSession(false);
        }
      } catch {
        if (!cancelled) {
          setSessionInfo({ has_saved_card: false });
          setCheckingSession(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  async function buyBookOneClick() {
    setProcessing(true);
    setChargeError('');
    try {
      const res = await fetch('/api/charge-saved-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, tier: 'bp-cure-book' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // One-click charge succeeded → continue chain to Reset Kit upsell.
        const next = data.next_url
          ? `${data.next_url}${data.next_url.includes('?') ? '&' : '?'}session_id=${encodeURIComponent(sessionId)}&from=book-one-click`
          : '/upsell-bp-reset-kit';
        navigate(next);
      } else if (res.status === 402 || res.status === 409) {
        // 3DS required / card declined / no saved card → fall back to
        // Payment Link (buyer re-enters card).
        window.location.href = BOOK_PAYMENT_LINK;
      } else {
        setChargeError(data.error || 'Charge failed. Try again or skip.');
        setProcessing(false);
      }
    } catch {
      setChargeError('Connection issue. Trying the regular checkout instead.');
      // Last-resort fallback: send to Payment Link.
      window.location.href = BOOK_PAYMENT_LINK;
    }
  }

  // Fallback path: customer arrived via a Payment Link (no saved card on
  // session) — send them through the existing $12.99 Payment Link.
  function buyBookFallback() {
    setProcessing(true);
    window.location.href = BOOK_PAYMENT_LINK;
  }

  function skipBook() {
    const next = sessionId
      ? `/upsell-bp-reset-kit?session_id=${encodeURIComponent(sessionId)}&from=book-declined`
      : '/upsell-bp-reset-kit?from=book-declined';
    navigate(next);
  }

  const hasSavedCard = sessionInfo?.has_saved_card === true;
  const greeting = sessionInfo?.first_name ? `Hi ${sessionInfo.first_name},` : '';

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
          Your Reset Kit is confirmed. One quick question before we wrap up.
        </span>
      </div>

      {/* Hero */}
      <section style={{ padding: '3rem 1.5rem', background: 'var(--paper, #FBF8F1)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--clay-soft, #F5E5DA)',
            color: 'var(--clay, #B85A36)',
            padding: '0.4rem 1rem',
            borderRadius: 999,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}>
            <BookOpen size={14} />
            One-time customer offer
          </div>

          {greeting && (
            <p style={{ fontSize: '1.1rem', color: 'var(--ink-soft, #3A3A3A)', margin: '0 0 0.5rem', fontFamily: 'Fraunces, Georgia, serif' }}>
              {greeting}
            </p>
          )}

          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 'clamp(1.85rem, 5vw, 2.65rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            margin: '0 0 1rem',
            color: 'var(--ink, #2C3E50)',
          }}>
            Want the book that lays out <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>every protocol</em> behind your Reset Kit?
          </h1>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--ink-soft, #3A3A3A)',
            margin: '0 0 2rem',
            maxWidth: '54ch',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <strong style={{ color: 'var(--ink, #2C3E50)' }}>Blood Pressure Cures: The 10-Day Nurse's Reset</strong> — the full master document I wrote for my own patients. 10-day challenge with checklists, top-10 herbs deep-dive (each matched to the drug it mimics), the Cook For Life cookbook, the White Coat Syndrome guide, and the FAQ. Everything in one PDF you can save, print, and re-read.
          </p>

          {/* Product card */}
          <div style={{
            background: 'var(--paper-light, #FFFFFF)',
            border: '1px solid var(--line, #E8E2D4)',
            borderRadius: 18,
            padding: '1.75rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            textAlign: 'left',
          }}>
            <img
              src="/downloads/bp-cures-cover.png"
              alt="Blood Pressure Cures book cover"
              style={{
                width: 100,
                height: 'auto',
                flexShrink: 0,
                borderRadius: 6,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay, #B85A36)', marginBottom: '0.35rem' }}>
                Add-on offer
              </div>
              <h2 style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: '1.15rem',
                fontWeight: 500,
                lineHeight: 1.25,
                margin: '0 0 0.65rem',
                color: 'var(--ink, #2C3E50)',
              }}>
                Blood Pressure Cures — The 10-Day Nurse's Reset
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clay, #B85A36)' }}>$12.99</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted, #7A7061)', textDecoration: 'line-through' }}>$19.99</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--sage-deep, #4A6741)', fontWeight: 700, letterSpacing: '0.04em', marginLeft: '0.4rem' }}>checkout only</span>
              </div>
            </div>
          </div>

          {/* Bullets */}
          <div style={{
            background: 'var(--paper-warm, #F5F1E8)',
            borderRadius: 14,
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            textAlign: 'left',
            maxWidth: 500,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <BulletLine text="The master BP protocol document Joel teaches in the clinic" />
            <BulletLine text="Top 10 herbs deep-dive — each matched to the drug it mimics, with dosages" />
            <BulletLine text="Full 10-day challenge — day-by-day with checklists" />
            <BulletLine text="Cook For Life cookbook — plant-based meals built to lower BP" />
            <BulletLine text="White Coat Syndrome guide for cardiology appointments" />
            <BulletLine text="FAQ — every question Joel gets asked weekly" />
          </div>

          {/* Error message */}
          {chargeError && (
            <div style={{
              background: '#FCE7E7',
              border: '1px solid #E8A8A8',
              borderRadius: 8,
              padding: '0.85rem 1rem',
              fontSize: '0.92rem',
              color: '#8A2A2A',
              marginBottom: '1rem',
              maxWidth: 460,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {chargeError}
            </div>
          )}

          {/* CTA — one-click if saved card, else fallback Payment Link */}
          {checkingSession ? (
            <div style={{ padding: '1.1rem 0', color: 'var(--muted, #7A7061)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Preparing your offer...
            </div>
          ) : hasSavedCard ? (
            <button
              onClick={buyBookOneClick}
              disabled={processing}
              style={ctaButtonStyle(processing)}
            >
              {processing ? 'Adding to your order...' : (
                <>
                  <span>Yes — add the book for $12.99</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginLeft: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.2rem 0.55rem', borderRadius: 6 }}>1-click</span>
                  <ArrowRight size={18} style={{ marginLeft: 4 }} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={buyBookFallback}
              disabled={processing}
              style={ctaButtonStyle(processing)}
            >
              {processing ? 'Loading checkout...' : (
                <>
                  Yes — add the book for $12.99 <ArrowRight size={18} />
                </>
              )}
            </button>
          )}

          <div>
            <button
              onClick={skipBook}
              disabled={processing}
              style={{
                background: 'transparent',
                color: 'var(--muted, #7A7061)',
                border: 'none',
                padding: '0.65rem 1rem',
                fontSize: '0.92rem',
                cursor: processing ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
              }}
            >
              No thanks, skip this offer
            </button>
          </div>

          {/* Trust strip */}
          <div style={{
            marginTop: '2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--muted, #7A7061)',
          }}>
            <ShieldCheck size={14} />
            {hasSavedCard
              ? 'Charged to the card you just used. Instant PDF delivery.'
              : 'Secure checkout via Stripe. Instant PDF delivery to your inbox.'}
          </div>
        </div>
      </section>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

function ctaButtonStyle(processing) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: 'var(--clay, #B85A36)',
    color: 'var(--cream, #FBF8F1)',
    border: 'none',
    padding: '1.1rem 2rem',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: '1.05rem',
    letterSpacing: '0.02em',
    cursor: processing ? 'not-allowed' : 'pointer',
    opacity: processing ? 0.7 : 1,
    width: '100%',
    maxWidth: 460,
    marginBottom: '0.85rem',
  };
}

function BulletLine({ text }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.65rem',
      alignItems: 'flex-start',
      marginBottom: '0.55rem',
      fontSize: '0.95rem',
      lineHeight: 1.5,
      color: 'var(--ink, #2C3E50)',
    }}>
      <Check size={16} style={{ color: 'var(--sage-deep, #4A6741)', flexShrink: 0, marginTop: 3 }} />
      <span>{text}</span>
    </div>
  );
}
