// OtoCompletePage (route: /oto) — the true one-time offer between the $17
// corner checkout and /welcome. Stripe's embedded checkout returns corner
// buyers here (create-embedded-checkout.js corner return_url); one tap
// charges the SAVED card $27 for the complete kit (api/kit-oto-charge.js),
// no card re-entry.
//
// 2026-08-17 REVISION (Joel): the $27 Complete Kit one-click stays the
// PRIMARY offer. The live Triangle Masterclass ($97 shown struck, FREE,
// "free for now" — never a fictitious former-price claim) is layered in
// two places:
//   - DOWNSELL: declining the $27 no longer jumps straight to /welcome; it
//     shows the masterclass invite first, with a "continue to my downloads"
//     link to /welcome.
//   - POST-ACCEPT: a successful $27 charge shows a confirmation state with
//     a smaller masterclass block ("your seat is free — save it now")
//     alongside the continue-to-downloads link.
// PostHog event NAMES are unchanged; segmentation rides on props
// (offer: 'kit-27' | 'masterclass', placement: 'downsell' | 'post-accept').
//
// Fallbacks: sessions without a saved card (pre 2026-07-16), declines, and
// 3DS challenges route to the $27 upgrade Payment Link (re-enter card),
// which redirects back to /welcome and is fulfilled by the webhook.
//
// Copy rules: 3rd grade language, ZERO em dashes, one-time frame is TRUE
// (the $27 one-click is only offered on this page; /welcome shows the same
// $27 payment link, so "only see this page once" is the honest scarcity,
// not "this price disappears forever").
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { track } from '../utils/analytics.js';
import { UPGRADE_CORNER_TO_COMPLETE } from '../data/upgradeOffers.js';
import TeaOneClickOffer from '../components/TeaOneClickOffer.jsx';

const TRIGGER_NAMES = {
  stress: 'The Stress Spike',
  sugar: 'The Sugar Surge',
  sodium: 'The Sodium Trap',
  sleep: 'The Midnight Drift',
  stillness: 'The Stillness Trigger',
};

// What the $27 ADDS on top of the corner kit the buyer just bought. Built
// per-buyer: a Triangle-corner buyer already owns their own corner's set, so
// listing it as "added" would claim content they were already delivered.
function buildAdds(corner) {
  const triangle = [
    ['stress', 'The Stress Spike full plan, herb guide, and doctor sheet'],
    ['sugar', 'The Sugar Surge full plan, herb guide, and doctor sheet'],
    ['sodium', 'The Sodium Trap full plan, herb guide, and doctor sheet'],
  ];
  return [
    ...triangle.filter(([slug]) => slug !== corner).map(([, label]) => label),
    'The Freedom Finale, the final phase that ties all of it together',
    'Doctor visit templates, so you walk in prepared',
  ];
}

// 2026-08-26 (Joel): this downsell used to be the free live Triangle
// Masterclass. The masterclass was pulled from ALL advertising on 2026-08-26 —
// the class still runs for people already registered, it is simply never sold
// or linked anywhere. The downsell is now the tea, which is the standing offer
// for this audience and, unlike a free class, actually converts to revenue.
const DOWNSELL_COVERS = [
  'Caffeine free, so it will not spike the number you are trying to lower',
  'No animal products, nothing artificial, nothing hiding',
  'The one thing readers write back about most',
  'Blended by two RNs for the end of a stressful day',
];

const serif = { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 550 };

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

// Reusable price footer: label row with the struck compare figure, then the
// clay "today" row. Used by both the $27 kit card and the masterclass card.
function PriceRows({ struckLabel, struck, todayLabel, today }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--line, #E5DFD2)', marginTop: '0.7rem', paddingTop: '0.7rem', fontWeight: 700 }}>
        <span>{struckLabel}</span>
        <span style={{ textDecoration: 'line-through', textDecorationColor: 'var(--clay, #B85A36)' }}>{struck}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontWeight: 800, color: 'var(--clay, #B85A36)', fontSize: '1.05rem', marginTop: '0.25rem' }}>
        <span>{todayLabel}</span>
        <span>{today}</span>
      </div>
    </>
  );
}

export default function OtoCompletePage() {
  const navigate = useNavigate();
  const { sessionId, corner } = useMemo(readParams, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // 2026-08-29 (Joel): THE $27 COMPLETE UPGRADE IS RETIRED. The $17 kit now
  // delivers the complete kit, so this page was about to charge $27 for files
  // the buyer already owns the moment they paid. That is not an upsell, it is
  // billing someone twice for the same thing.
  //
  // The page opens straight on the tea instead. Joel approved the tea for this
  // exact slot on 2026-08-26 as the decline path; with the upgrade gone it
  // becomes the offer. accept() is now unreachable from the UI, and the
  // 'offer'/'accepted' branches are kept ONLY so a buyer mid-flow on cached JS
  // does not hit a blank screen.
  //
  // WHAT THIS COSTS, measured before switching (60 days): the $27 upgrade took
  // 38 of 225 corner buyers (16.9%) for $1,046, about +27% on front-end
  // revenue. The tea's average order is $59.91, so the slot can earn more --
  // but that is unproven in THIS position and needs watching.
  //
  // TO RESTORE the $27 upgrade you would first have to un-do the entitlement
  // change in api/_kit-manifest.js, or it has nothing to sell.
  const COMPLETE_UPGRADE_LIVE = false;
  const [view, setView] = useState(COMPLETE_UPGRADE_LIVE ? 'offer' : 'downsell');

  const welcomeUrl = (tier) =>
    `/welcome?tier=${tier}${corner ? `&corner=${encodeURIComponent(corner)}` : ''}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ''}`;

  useEffect(() => {
    // No session means this page was reached out of flow. Send them to
    // delivery instead of showing a chargeable button with nothing behind it.
    if (!sessionId) {
      navigate(welcomeUrl('corner'), { replace: true });
      return;
    }
    track('oto_viewed', {
      funnel_version: 'annie-v2',
      offer: COMPLETE_UPGRADE_LIVE ? 'kit-27' : 'tea',
      ...(corner ? { corner } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept() {
    // Hard guard, not just a hidden button: the $17 tier already delivers
    // everything this charged for.
    if (!COMPLETE_UPGRADE_LIVE) return;
    if (busy) return;
    setBusy(true);
    setError('');
    track('oto_accept_clicked', { funnel_version: 'annie-v2', offer: 'kit-27', ...(corner ? { corner } : {}) });
    try {
      const res = await fetch('/api/kit-oto-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        track('oto_accepted', { funnel_version: 'annie-v2', offer: 'kit-27', one_click: true, ...(corner ? { corner } : {}) });
        // 2026-08-17: stay on the page so the confirmation state can offer
        // the free masterclass seat before the buyer heads to downloads.
        setBusy(false);
        setView('accepted');
        window.scrollTo(0, 0);
        return;
      }
      // No saved card / 3DS / decline: finish on the $27 Payment Link so the
      // sale is not lost. Its after_completion returns to /welcome and the
      // webhook delivers the upgrade.
      if (res.status === 409 || res.status === 402) {
        track('oto_fallback_payment_link', { funnel_version: 'annie-v2', reason: data.error || String(res.status) });
        window.location.href = UPGRADE_CORNER_TO_COMPLETE.paymentLink;
        return;
      }
      throw new Error(data.error || 'charge_failed');
    } catch (err) {
      track('oto_charge_failed', { funnel_version: 'annie-v2', reason: err.message });
      setError('That did not go through. Your card was NOT charged again for your kit. You can tap the button to retry, or skip below. The same upgrade will also be waiting on your next page.');
      setBusy(false);
    }
  }

  function decline() {
    // 2026-08-17: declining the $27 no longer exits to /welcome. It shows
    // the free masterclass invite (the downsell) first.
    track('oto_declined', { funnel_version: 'annie-v2', offer: 'kit-27', ...(corner ? { corner } : {}) });
    setView('downsell');
    window.scrollTo(0, 0);
  }

  // 2026-08-26: was acceptMasterclass -> /masterclass. Now the tea. The tracked
  // `offer` value changed from 'masterclass' to 'tea', so any dashboard filtered
  // on offer='masterclass' will show this downsell going flat from this date —
  // that is the rename, not a collapse in take rate.
  function acceptDownsell(placement) {
    // Same event name as the kit accept; offer + placement props separate
    // downsell take rate from post-accept take rate. /tea is a static page
    // outside the SPA router, so plain navigation.
    track('oto_accept_clicked', { funnel_version: 'annie-v2', offer: 'tea', placement, ...(corner ? { corner } : {}) });
    window.location.href = '/tea';
  }

  function declineDownsell(placement, tier) {
    track('oto_declined', { funnel_version: 'annie-v2', offer: 'tea', placement, ...(corner ? { corner } : {}) });
    navigate(welcomeUrl(tier));
  }

  const triggerName = TRIGGER_NAMES[corner] || 'your trigger';
  const adds = buildAdds(corner);
  const kitLabel = TRIGGER_NAMES[corner] ? triggerName.replace('The ', '') : '';

  // Tea card, shared by the downsell and post-accept states. The post-accept
  // version is the smaller block. (Was the masterclass card until 2026-08-26.)
  function downsellCard(placement) {
    const small = placement === 'post-accept';
    return (
      <div style={CARD}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.7rem' }}>
          {small ? 'One more thing worth your time' : 'What is in the tea'}
        </div>
        {!small && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {DOWNSELL_COVERS.map((item) => (
              <li key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)' }}>
                <Check size={17} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: 'var(--sage-deep, #2E3A30)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {small && (
          <p style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)', margin: 0 }}>
            One more thing. The tea Joel and Annie actually drink at the end of a
            stressful day. Caffeine free, no animal products, and the one thing
            readers write back about most.
          </p>
        )}
      </div>
    );
  }

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
        {view === 'offer' && (
          <>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.6rem' }}>
              Step 2 of 2 · Do not close this page
            </p>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)', lineHeight: 1.16, textAlign: 'center', margin: '0 0 0.8rem' }}>
              Wait. Your {kitLabel || 'corner'} kit is on its way. Want the{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>whole Triangle</em> while your card is still out?
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1.4rem' }}>
              Blood pressure almost never has just one cause. You fixed your loudest trigger.
              The Complete Kit covers all three corners of the BP Triangle, so the next
              trigger never takes you by surprise. It is $47 on its own. Because you just
              bought your kit, you add it for $27, in one tap, with the card you just used.
            </p>

            <div style={CARD}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', marginBottom: '0.7rem' }}>
                One tap adds all of this
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {adds.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.4rem 0', fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--ink-soft, #2B2824)' }}>
                    <Check size={17} aria-hidden style={{ flexShrink: 0, marginTop: 3, color: 'var(--sage-deep, #2E3A30)' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <PriceRows
                struckLabel="Complete Kit on its own"
                struck="$47"
                todayLabel="You add it today for"
                today="$27"
              />
            </div>

            {error && (
              <p role="alert" style={{ color: 'var(--clay, #B85A36)', fontSize: '0.9rem', lineHeight: 1.55, textAlign: 'center', margin: '0 0 0.9rem' }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={accept}
              disabled={busy}
              style={{ ...CTA_BTN, background: busy ? 'var(--sage-deep, #2E3A30)' : 'var(--clay, #B85A36)', cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? 'Adding your upgrade. One moment.' : <>Yes, Complete My Triangle For $27 <ArrowRight size={18} /></>}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray, #555)', margin: '0.55rem 0 1.2rem' }}>
              One tap. Uses the card from your order. Same 30-day Feel-It-or-Free promise.
            </p>

            <p style={{ textAlign: 'center', margin: 0 }}>
              <button type="button" onClick={decline} disabled={busy} style={GHOST_LINK}>
                No thanks, take me to my {kitLabel} kit downloads
              </button>
            </p>
          </>
        )}

        {view === 'downsell' && (
          <>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.6rem' }}>
              No problem · One free thing before your downloads
            </p>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)', lineHeight: 1.16, textAlign: 'center', margin: '0 0 0.8rem' }}>
              You have the kit. Now the part that{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>happens every night</em>.
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1.4rem' }}>
              The kit tells you what to do. This is what Joel and Annie reach for
              when the day is over and the pressure of it is still sitting in
              their chest. Caffeine free, no animal products, and the one thing
              readers write back about most.
            </p>

            {downsellCard('downsell')}

            <button type="button" onClick={() => acceptDownsell('downsell')} style={CTA_BTN}>
              Show Me The Tea <ArrowRight size={18} />
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray, #555)', margin: '0.55rem 0 1.2rem' }}>
              Blended by Joel and Annie, RNs. Education only, alongside your doctor.
            </p>

            <p style={{ textAlign: 'center', margin: 0 }}>
              <button type="button" onClick={() => declineDownsell('downsell', 'corner')} style={GHOST_LINK}>
                Continue to my downloads
              </button>
            </p>
          </>
        )}

        {view === 'accepted' && (
          <>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage-deep, #2E3A30)', margin: '0 0 0.6rem' }}>
              Upgrade confirmed
            </p>
            <h1 style={{ ...serif, fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)', lineHeight: 1.16, textAlign: 'center', margin: '0 0 0.8rem' }}>
              Done. Your <em style={{ fontStyle: 'italic', color: 'var(--clay, #B85A36)' }}>whole Triangle</em> is unlocked.
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--ink-soft, #2B2824)', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 1.4rem' }}>
              The $27 upgrade went through on the card from your order. All three
              corners and the Freedom Finale are waiting on your downloads page.
            </p>

            {downsellCard('post-accept')}

            <button type="button" onClick={() => acceptDownsell('post-accept')} style={CTA_BTN}>
              Show Me The Tea <ArrowRight size={18} />
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--dark-gray, #555)', margin: '0.55rem 0 1.2rem' }}>
              Education only, alongside your doctor.
            </p>

            <p style={{ textAlign: 'center', margin: 0 }}>
              <button type="button" onClick={() => declineDownsell('post-accept', 'complete')} style={GHOST_LINK}>
                Continue to my downloads
              </button>
            </p>
          </>
        )}

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
