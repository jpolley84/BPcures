// Post-purchase upsell #1 — Blood Pressure Cures: The 10-Day Nurse's
// Reset ebook for $12.99. Inserted BETWEEN $17 Kit and $47 Reset Kit
// upsell to mirror the bpcures funnel mechanic (which converts at ~26%
// vs 14.6% on the order bump alone).
//
// Flow:
//   $17 Kit Payment Link → /upsell-bp-cure-book (this page)
//     → Yes → $12.99 Stripe Payment Link → /upsell-bp-reset-kit
//     → No  → /upsell-bp-reset-kit (skip ahead, still see Reset Kit)
//   /upsell-bp-reset-kit → /success
//
// Built 2026-05-20 as port of bpcures' $17 + $12 mechanic.
// Existing Stripe Payment Link reused: plink_1TNGMvHseZnO3rRZlOi4zbxG.
// PDF lives at /public/downloads/bp-cures-10-day-reset.pdf (12MB).

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

const BOOK_PAYMENT_LINK = 'https://buy.stripe.com/bJe4gzeIrfme9ft3B7fnO02';

export default function UpsellBpCureBookPage() {
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  function buyBook() {
    setProcessing(true);
    // Existing Payment Link's after_completion already redirects to
    // /upsell-bp-reset-kit?session_id=...&from=book — so we just hand off.
    window.location.href = BOOK_PAYMENT_LINK;
  }

  function skipBook() {
    // Skip ahead to the next upsell in the chain. Preserve session_id so
    // /upsell-bp-reset-kit can also identify the customer.
    const next = sessionId
      ? `/upsell-bp-reset-kit?session_id=${encodeURIComponent(sessionId)}&from=book-declined`
      : '/upsell-bp-reset-kit?from=book-declined';
    navigate(next);
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

          {/* CTA stack */}
          <button
            onClick={buyBook}
            disabled={processing}
            style={{
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
            }}
          >
            {processing ? 'Loading checkout...' : (
              <>
                Yes — add the book for $12.99 <ArrowRight size={18} />
              </>
            )}
          </button>

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
            Secure checkout via Stripe. Instant PDF delivery to your inbox.
          </div>
        </div>
      </section>
    </main>
  );
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
