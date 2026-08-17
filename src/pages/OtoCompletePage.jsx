// OtoCompletePage (route: /oto) — the post-purchase offer between the $17
// corner checkout and /welcome. Stripe's embedded checkout returns corner
// buyers here (create-embedded-checkout.js corner return_url).
//
// 2026-08-17 SWAP (Joel): the $47-struck / $27 one-click Complete Kit upsell
// that lived on this page is CUT for $17 buyers. In its place: an invite to
// the live Triangle Masterclass with Joel + Annie ($97 shown struck, FREE,
// framed as "free for now" — no fictitious former-price claim). CTA goes to
// /masterclass (static page, plain <a>, not a SPA route).
// The one-click charge machinery (api/kit-oto-charge.js) and the $27
// Payment Link are NOT deleted — other flows may reference them; only what
// the $17 buyer SEES here changed. See git history for the prior kit offer.
//
// Copy rules: 3rd grade language, ZERO em dashes, education only.
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { track } from '../utils/analytics.js';
import TeaOneClickOffer from '../components/TeaOneClickOffer.jsx';

const TRIGGER_NAMES = {
  stress: 'The Stress Spike',
  sugar: 'The Sugar Surge',
  sodium: 'The Sodium Trap',
  sleep: 'The Midnight Drift',
  stillness: 'The Stillness Trigger',
};

// What the live masterclass covers. Same three corners the kit teaches, but
// taught live so the buyer can ask their own questions.
const MASTERCLASS_COVERS = [
  'Stress, and how it quietly raises your number',
  'Sugar, and what your meals do to your pressure',
  'Sodium, and the salt traps hiding in normal food',
  'Live answers to your own questions, from two RNs',
];

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

function readParams() {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      sessionId: p.get('session_id') || '',
      corner: p.get('corner') || '',
    };
  } catch {
    return { sessionId: '', corner: '' };
  }
}

export default function OtoCompletePage() {
  const navigate = useNavigate();
  const { sessionId, corner } = useMemo(readParams, []);

  const welcomeUrl = (tier) =>
    `/welcome?tier=${tier}${corner ? `&corner=${encodeURIComponent(corner)}` : ''}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ''}`;

  useEffect(() => {
    // No session means this page was reached out of flow. Send them to
    // delivery instead of showing an out-of-flow offer.
    if (!sessionId) {
      navigate(welcomeUrl('corner'), { replace: true });
      return;
    }
    // Event NAME unchanged (PostHog continuity); the offer prop marks the swap.
    track('oto_viewed', { funnel_version: 'annie-v2', offer: 'masterclass', ...(corner ? { corner } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function acceptMasterclass() {
    // Same event name as the old kit accept, with the offer prop, so the
    // funnel chart stays one series. Plain navigation: /masterclass is a
    // static page outside the SPA router.
    track('oto_accept_clicked', { funnel_version: 'annie-v2', offer: 'masterclass', ...(corner ? { corner } : {}) });
    window.location.href = '/masterclass';
  }

  function decline() {
    track('oto_declined', { funnel_version: 'annie-v2', offer: 'masterclass', ...(corner ? { corner } : {}) });
    navigate(welcomeUrl('corner'));
  }

  const triggerName = TRIGGER_NAMES[corner] || 'your trigger';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream, #FBF8F1)', color: 'var(--ink, #121110)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--line, #E5DFD2)', background: '#fff' }}>
        <span style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          BraveWorks<span style={{ fontStyle: 'italic', marginLeft: '0.12em', color: 'var(--clay, #B85A36)' }}>RN</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--dark-gray, #555)' }}>
          <Lock size={13} aria-hidden /> Order received · One last thing
        </span>
      </header>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(1.25rem, 4vw, 2.25rem) 1.25rem 3rem' }}>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.6rem' }}>
          Step 2 of 2 · Do not close this page
        </p>
        <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)', lineHeight: 1.16, textAlign: 'center', margin: '0 0 0.8rem' }}>
          Your {triggerName.replace('The ', '')} kit is on its way. Now get the{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>full Triangle help</em>, live.
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1.4rem' }}>
          You have the kit. The next step is the live Triangle Masterclass with
          Joel and Annie, both registered nurses. They walk the whole BP Triangle
          with you, Stress, Sugar, and Sodium, and you can ask your own questions
          in the room. It is free for now, so save your seat while it is.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--line, #E5DFD2)', borderRadius: 14, padding: '1.15rem 1.2rem', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.7rem' }}>
            What the live class covers
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {MASTERCLASS_COVERS.map((item) => (
              <li key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)' }}>
                <Check size={17} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: 'var(--sage-deep, #2E3A30)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--line, #E5DFD2)', marginTop: '0.7rem', paddingTop: '0.7rem', fontWeight: 700 }}>
            <span>The live Triangle Masterclass</span>
            <span style={{ textDecoration: 'line-through', textDecorationColor: 'var(--clay, #B85A36)' }}>$97</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontWeight: 800, color: 'var(--clay, #B85A36)', fontSize: '1.05rem', marginTop: '0.25rem' }}>
            <span>Free for now</span>
            <span>FREE</span>
          </div>
        </div>

        <button
          type="button"
          onClick={acceptMasterclass}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '1.05rem 1.4rem',
            background: 'var(--clay, #B85A36)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: '1.08rem',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Yes, Save My Free Masterclass Seat <ArrowRight size={18} />
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray, #555)', margin: '0.55rem 0 1.2rem' }}>
          No charge. Live class taught by Joel and Annie, RNs. Education only,
          alongside your doctor.
        </p>

        <p style={{ textAlign: 'center', margin: 0 }}>
          <button
            type="button"
            onClick={decline}
            style={{ background: 'none', border: 'none', padding: '0.4rem', color: 'var(--dark-gray, #666)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontSize: '0.9rem' }}
          >
            No thanks, take me to my {TRIGGER_NAMES[corner] ? triggerName.replace('The ', '') : ''} kit downloads
          </button>
        </p>

        {/* Second offer: Steady tea, 1-month supply. Same saved card, one
            click plus a shipping address (physical product). Component
            handles the no-saved-card and decline fallbacks itself. */}
        <div style={{ borderTop: '1px solid var(--line, #E5DFD2)', marginTop: '2rem', paddingTop: '0.4rem' }}>
          <TeaOneClickOffer sessionId={sessionId} />
        </div>
      </section>
    </div>
  );
}
