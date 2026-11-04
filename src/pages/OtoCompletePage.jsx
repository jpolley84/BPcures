// OtoCompletePage (route: /oto) — the one-time offer page between the $17 kit
// checkout and /welcome. Stripe's embedded checkout returns corner buyers here
// (create-embedded-checkout.js corner return_url) with ?session_id= and
// ?corner=.
//
// 2026-10-21 (Joel): "switch the upsell from 17 to the tea instead of the 47
// kit. kill the kit. throw in the tea and downsell the free masterclass if
// they say no to tea."
//   PRIMARY      SVUTU Steady tea, $48, a TRUE one-click on the saved card
//                (TeaOneClickOffer -> api/tea-one-click.js). No detour to /tea.
//   DOWNSELL     a free seat at the Monday night live class, one tap, using the
//                email from the order (api/masterclass-register, source
//                'kit-oto'). Shown when they say no to the tea. If the order
//                email is not known (lookup failed, or they declined before it
//                returned) the block asks for an email instead.
//   POST-ACCEPT  a tea buyer still sees the free seat, in a smaller block.
//   Every state ends at "Continue to my downloads" -> /welcome, with
//   ?tea=taken|declined so /welcome never re-offers a pouch they just bought.
//
// GONE from this page: the $27 complete-kit one-click (retired 2026-08-29, the
// $17 kit already delivers the complete kit, see api/_kit-manifest.js
// normalizeTier) and every mention of the $47 kit. api/kit-oto-charge.js is no
// longer called from anywhere in the UI.
//
// Analytics: event NAMES are unchanged (oto_viewed, oto_accept_clicked,
// oto_accepted, oto_declined, oto_charge_failed). Segmentation rides on props:
//   offer:     'tea' | 'masterclass'
//   placement: 'primary' | 'downsell' | 'post-accept'
//   step:      on tea accept clicks only: 'open_form' | 'submit' |
//              'payment_link' | 'shopify_150g'. Count step='submit' as THE tea
//              accept; 'open_form' fires first on the same buyer.
// A dashboard filtered on offer='tea' sees the primary slot from this date;
// offer='masterclass' returns after going flat on 2026-08-26.
//
// Copy rules: 3rd grade language, ZERO em dashes, no clinical claims, no
// former-price claims. The class is named by day and time only, never by a
// title: /masterclass sometimes carries a one-time event in the same Monday
// slot, and the confirmation email (api/_masterclass-enroll.js) is the source
// of truth for the name and the Zoom link.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Loader2 } from 'lucide-react';
import { track, getFirstTouchUtm } from '../utils/analytics.js';
import TeaOneClickOffer from '../components/TeaOneClickOffer.jsx';

const TRIGGER_NAMES = {
  stress: 'The Stress Spike',
  sugar: 'The Sugar Surge',
  sodium: 'The Sodium Trap',
  sleep: 'The Midnight Drift',
  stillness: 'The Stillness Trigger',
};

// The free class. Day and time only (see the header note). Keep in sync with
// api/_masterclass-enroll.js, which writes the confirmation email.
function classCovers(hasOrderEmail) {
  return [
    'Live on Zoom with Joel and Annie, both RNs',
    'Bring your numbers and your questions, and ask them live',
    hasOrderEmail ? 'The Zoom link comes to the email from your order' : 'The Zoom link comes to your email',
    'Nothing to buy. Your seat is free.',
  ];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };
const EM = { fontStyle: 'italic', color: 'var(--clay, #B85A36)' };

const CTA_BTN = {
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
};

const GHOST_LINK = {
  background: 'none',
  border: 'none',
  padding: '0.4rem',
  color: 'var(--dark-gray, #666)',
  textDecoration: 'underline',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.9rem',
};

const CARD = {
  background: '#fff',
  border: '1px solid var(--line, #E5DFD2)',
  borderRadius: 14,
  padding: '1.15rem 1.2rem',
  marginBottom: '1.2rem',
};

const KICKER = { textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.6rem' };
const H1 = { ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)', lineHeight: 1.16, textAlign: 'center', margin: '0 0 0.8rem' };
const INTRO = { fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1.4rem' };
const FINEPRINT = { textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray, #555)', margin: '0.55rem 0 1.2rem' };
const CARD_KICKER = { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.7rem' };
const LI = { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)' };
const INPUT = { width: '100%', padding: '0.7rem 0.8rem', borderRadius: 8, border: '1px solid var(--line, #D8CFBD)', fontSize: '1rem', background: '#fff', color: 'var(--ink, #121110)', fontFamily: 'inherit', boxSizing: 'border-box' };
const LABEL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft, #2B2824)', margin: '0 0 0.3rem' };
const STATUS = { textAlign: 'center', fontSize: '0.95rem', lineHeight: 1.55, color: 'var(--sage-deep, #2E3A30)', fontWeight: 600, margin: '0 0 0.9rem' };
const ALERT = { color: 'var(--clay, #B85A36)', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center', margin: '0 0 0.9rem' };

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
  // 'tea' (primary) -> 'masterclass' (downsell) | 'tea-accepted' (post-accept)
  const [view, setView] = useState('tea');
  // Filled by TeaOneClickOffer's one session lookup, so the free-seat tap can
  // reuse the order email without a second round trip. null = not known.
  const [session, setSession] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [seat, setSeat] = useState('idle'); // idle | saving | saved | already | failed
  const [seatError, setSeatError] = useState('');

  const baseProps = { funnel_version: 'annie-v2', ...(corner ? { corner } : {}) };

  // teaOutcome tells /welcome whether to show its second-chance tea block.
  // 'taken' hides it (the buyer owns the pouch; re-offering it is how a
  // revisit after the 24 h idempotency key could charge twice).
  const welcomeUrl = (teaOutcome) =>
    `/welcome?tier=corner${corner ? `&corner=${encodeURIComponent(corner)}` : ''}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ''}${teaOutcome ? `&tea=${teaOutcome}` : ''}`;
  const outcomeFor = (placement) => (placement === 'post-accept' ? 'taken' : 'declined');

  useEffect(() => {
    // No session means this page was reached out of flow. Send them to
    // delivery instead of showing a chargeable button with nothing behind it.
    if (!sessionId) {
      navigate(welcomeUrl(''), { replace: true });
      return;
    }
    track('oto_viewed', { ...baseProps, offer: 'tea', placement: 'primary' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tea (primary) ──────────────────────────────────────────────────────
  function onTeaAcceptClick(step) {
    track('oto_accept_clicked', { ...baseProps, offer: 'tea', placement: 'primary', step });
  }

  function onTeaAccepted() {
    track('oto_accepted', { ...baseProps, offer: 'tea', placement: 'primary', one_click: true });
    setView('tea-accepted');
    window.scrollTo(0, 0);
  }

  function onTeaFail(reason) {
    track('oto_charge_failed', { ...baseProps, offer: 'tea', placement: 'primary', reason });
  }

  function declineTea() {
    track('oto_declined', { ...baseProps, offer: 'tea', placement: 'primary' });
    setView('masterclass');
    window.scrollTo(0, 0);
  }

  // ── Free class seat (downsell / post-accept) ───────────────────────────
  const orderEmail = (session && session.email) || '';
  const seatEmail = (orderEmail || emailInput).trim();

  async function saveSeat(placement) {
    if (seat === 'saving' || seat === 'saved' || seat === 'already') return;
    if (!EMAIL_RE.test(seatEmail)) {
      setSeatError('Type the email you want the Zoom link sent to.');
      return;
    }
    track('oto_accept_clicked', { ...baseProps, offer: 'masterclass', placement });
    setSeat('saving');
    setSeatError('');
    try {
      const res = await fetch('/api/masterclass-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: seatEmail,
          name: (session && session.first_name) || undefined,
          source: 'kit-oto',
          utm: getFirstTouchUtm(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `http_${res.status}`);
      track('oto_accepted', { ...baseProps, offer: 'masterclass', placement, already: Boolean(data.already) });
      setSeat(data.already ? 'already' : 'saved');
    } catch (err) {
      track('oto_register_failed', { ...baseProps, offer: 'masterclass', placement, reason: String(err && err.message) });
      setSeat('failed');
      setSeatError('That did not save. Check the email and tap again, or continue to your downloads.');
    }
  }

  function declineMasterclass(placement) {
    track('oto_declined', { ...baseProps, offer: 'masterclass', placement });
    navigate(welcomeUrl(outcomeFor(placement)));
  }

  function goDownloads(placement) {
    navigate(welcomeUrl(outcomeFor(placement)));
  }

  const triggerName = TRIGGER_NAMES[corner] || '';
  const kitLabel = triggerName ? `${triggerName.replace('The ', '')} kit` : 'kit';

  // The free-seat block, shared by the downsell and post-accept states. The
  // post-accept version is the smaller block.
  function classBlock(placement) {
    const small = placement === 'post-accept';
    const settled = seat === 'saved' || seat === 'already';
    const saving = seat === 'saving';
    return (
      <>
        <div style={CARD}>
          <div style={CARD_KICKER}>{small ? 'One more thing, and it is free' : 'What you get'}</div>
          {small ? (
            <p style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
              Joel and Annie, both RNs, teach live on Zoom every Monday at 7 PM
              Eastern, 6 PM Central. Bring your numbers and your questions. One
              tap saves your seat and the Zoom link comes to your inbox. Nothing
              to buy.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {classCovers(Boolean(orderEmail)).map((item) => (
                <li key={item} style={LI}>
                  <Check size={17} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: 'var(--sage-deep, #2E3A30)' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {!orderEmail && !settled && (
            <div style={{ marginTop: '0.9rem' }}>
              <label style={LABEL} htmlFor="oto-seat-email">Email for the Zoom link</label>
              <input
                id="oto-seat-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                style={INPUT}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveSeat(placement); } }}
              />
            </div>
          )}
        </div>

        {settled ? (
          <>
            <p role="status" style={STATUS}>
              {seat === 'already'
                ? 'You already have a seat. The Zoom link is in your inbox from before.'
                : `Your seat is saved. The Zoom link is on its way to ${seatEmail}.`}
            </p>
            <button type="button" onClick={() => goDownloads(placement)} style={CTA_BTN}>
              Continue to my downloads <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            {seatError && (
              <p role="alert" style={ALERT}>{seatError}</p>
            )}
            <button
              type="button"
              onClick={() => saveSeat(placement)}
              disabled={saving}
              style={{ ...CTA_BTN, background: saving ? 'var(--sage-deep, #2E3A30)' : 'var(--clay, #B85A36)', cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving
                ? <><Loader2 size={18} aria-hidden /> Saving your seat. One moment.</>
                : <>Save My Free Seat <ArrowRight size={18} /></>}
            </button>
            <p style={FINEPRINT}>
              One tap. No card. Education only, alongside your doctor.
            </p>
            <p style={{ textAlign: 'center', margin: 0 }}>
              <button type="button" onClick={() => declineMasterclass(placement)} disabled={saving} style={GHOST_LINK}>
                No thanks, continue to my downloads
              </button>
            </p>
          </>
        )}
      </>
    );
  }

  // Out of flow: the effect above is already redirecting. Render nothing
  // instead of flashing a chargeable offer for one frame.
  if (!sessionId) return null;

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
        {view === 'tea' && (
          <>
            <p style={KICKER}>Step 2 of 2 · Do not close this page</p>
            <h1 style={H1}>
              Your {kitLabel} is on its way. Now the part that{' '}
              <em style={EM}>happens every night</em>.
            </h1>
            <p style={INTRO}>
              The kit tells you what to do. This is what Joel and Annie reach for
              when the day is over and the pressure of it is still sitting in
              their chest. Caffeine free, no animal products, and the one thing
              readers write back about most.
            </p>

            {/* The whole offer lives in the component: saved-card one-click
                with an inline shipping form, the Payment Link fallback when
                there is no saved card, and the 150 g Shopify bag when the
                100 g pouches are sold out. */}
            <TeaOneClickOffer
              sessionId={sessionId}
              onSession={setSession}
              onAcceptClick={onTeaAcceptClick}
              onAccepted={onTeaAccepted}
              onFail={onTeaFail}
              onDecline={declineTea}
              declineLabel="No thanks, I do not want the tea"
            />
            <p style={{ ...FINEPRINT, margin: '0.9rem 0 0' }}>
              Blended by Joel and Annie, RNs. Education only, alongside your doctor.
            </p>
          </>
        )}

        {view === 'masterclass' && (
          <>
            <p style={KICKER}>No problem · One free thing before your downloads</p>
            <h1 style={H1}>
              Keep your downloads. Add a <em style={EM}>free seat</em> at the Monday night live class.
            </h1>
            <p style={INTRO}>
              Joel and Annie, both RNs, teach live on Zoom every Monday at 7 PM
              Eastern, 6 PM Central. Bring your numbers and your questions.{' '}
              {orderEmail
                ? 'One tap saves your seat with the email from your order, and the Zoom link lands in your inbox.'
                : 'Type your email, tap once, and the Zoom link lands in your inbox.'}
            </p>
            {classBlock('downsell')}
          </>
        )}

        {view === 'tea-accepted' && (
          <>
            <p style={KICKER}>Steady is on its way</p>
            <h1 style={H1}>
              Done. Your <em style={EM}>Steady</em> ships in 5 to 7 business days.
            </h1>
            <p style={INTRO}>
              It went on the card from your order, and a confirmation email is on
              its way. Your downloads are one tap away. First, one free thing.
            </p>
            {classBlock('post-accept')}
          </>
        )}
      </section>
    </div>
  );
}
