// ClosingSoonBanner — sticky "closing tonight" bar with a live countdown.
//
// ── THE ONE RULE ─────────────────────────────────────────────────────────
// This banner must never claim a deadline that is not real. It counts down to
// ONE fixed instant (CLOSE_AT below) and then STOPS EXISTING. It does not roll
// to the next midnight, and there is no code path that makes it do so.
//
// That is a deliberate constraint, not an oversight. A countdown that resets
// every night is the single fastest way to teach a returning audience that
// nothing on the page is true, and this audience returns constantly: they come
// from Facebook and TikTok, several times a week, for months. The /allin copy
// also says in Joel's own words "this is the final opportunity to enter this
// coaching experience at $1,997" and names $4,997 as the next price. A nightly
// resetting timer would make that sentence a lie in writing.
//
// So: to run this again, set a NEW real date in CLOSE_ISO_ET and mean it.
//
// ── HOW TO CHANGE IT ─────────────────────────────────────────────────────
//   CLOSE_ISO_ET   the deadline, as Eastern wall time. Always Eastern:
//                  BraveWorks runs on Eastern and a Central slip has already
//                  cost one apology broadcast to 496 people (2026-08-03).
//   After it passes the component renders null on every page that mounts it.
//
// Accessibility: the ticking digits are aria-hidden and there is a single
// static sentence for screen readers, because a live region that updates every
// second is unusable. Honors prefers-reduced-motion by dropping the pulse.

import { useEffect, useState } from 'react';
import { zonedInstant } from '../utils/tz.js';

// ⚠️ REAL DEADLINE. Eastern wall time. Midnight ending Monday 2026-08-10,
// i.e. the instant Tuesday begins. Set by Joel 2026-08-10.
export const CLOSE_ISO_ET = '2026-08-11T00:00:00';
const CLOSE_AT = zonedInstant(CLOSE_ISO_ET, 'America/New_York');

const two = (n) => String(Math.floor(n)).padStart(2, '0');

function parts(msLeft) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function ClosingSoonBanner({ href = '#apply', label = 'Apply before midnight' }) {
  const [left, setLeft] = useState(() => CLOSE_AT.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setLeft(CLOSE_AT.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Deadline passed: render NOTHING. No "0:00:00" sitting there forever, and
  // no rollover to tomorrow. See the header.
  if (left <= 0) return null;

  const { days, hours, minutes, seconds } = parts(left);
  const spoken =
    `Enrollment closes at midnight Eastern. About ` +
    (days > 0 ? `${days} day${days === 1 ? '' : 's'} and ${hours} hours` : `${hours} hours and ${minutes} minutes`) +
    ` remain.`;

  const cell = (value, unit) => (
    <span className="bw-close-cell" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 46 }}>
      <span className="bw-close-num" style={{
        fontFamily: '"Fraunces", Georgia, serif', fontSize: 26, fontWeight: 700,
        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <span className="bw-close-unit" style={{ fontSize: 9.5, letterSpacing: '0.14em', opacity: 0.7, marginTop: 3 }}>{unit}</span>
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes bwPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
        .bw-close-dot { animation: bwPulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .bw-close-dot { animation: none } }

        /* Mobile: this bar is STICKY, so every pixel of it is a pixel of the
           page she never gets back. At the first build it was 176px tall on a
           375px screen, which is 22% of the viewport permanently occupied.
           This audience is mostly 45+ and arrives on a phone from Facebook.
           Tighten to roughly 100px: smaller digits, tighter gaps, and the
           price line drops to one small line rather than wrapping to three. */
        .bw-close-compact { display: none; }
        @media (max-width: 560px) {
          .bw-close-bar { padding: 9px 12px !important; }
          .bw-close-row { gap: 8px !important; row-gap: 8px !important; }
          .bw-close-eyebrow { font-size: 11.5px !important; letter-spacing: 0.06em !important; }
          /* Swap the stacked HRS/MIN/SEC cells for one colon string so the
             label and the timer fit on a SINGLE line. The three cells are
             ~150px wide and force a wrap on a 375px screen; "07:09:49" is
             ~70px and does not. */
          .bw-close-cells { display: none !important; }
          .bw-close-compact {
            display: inline-block !important;
            font-family: "Fraunces", Georgia, serif; font-size: 20px; font-weight: 700;
            font-variant-numeric: tabular-nums; line-height: 1;
          }
          /* Full width: a 40px x 180px button is a poor target for a 65-year-old
             on a phone, and this is the only action in the bar. */
          .bw-close-cta { display: block !important; width: 100% !important; text-align: center; padding: 12px 14px !important; font-size: 13px !important; }
          .bw-close-note { font-size: 10px !important; margin-top: 6px !important; line-height: 1.4 !important; }
        }
      `}</style>
      <div
        role="region"
        aria-label="Enrollment closing soon"
        className="bw-close-bar"
        style={{
          position: 'sticky', top: 0, zIndex: 60,
          background: '#000000', color: '#FFFFFF',
          borderBottom: '1px solid rgba(255,255,255,0.18)',
          padding: '12px 16px',
        }}
      >
        <div className="bw-close-row" style={{
          maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 18, flexWrap: 'wrap', textAlign: 'center',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <span
              className="bw-close-dot"
              aria-hidden="true"
              style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }}
            />
            <span className="bw-close-eyebrow" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Closing tonight
            </span>
          </span>

          {/* Digits are decorative for assistive tech; `spoken` carries it.
              Two renderings of the same number, CSS picks one: labelled cells
              on desktop, a single colon string on mobile. */}
          <span aria-hidden="true" className="bw-close-cells" style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6 }}>
            {days > 0 && cell(days, 'DAYS')}
            {cell(two(hours), 'HRS')}
            {cell(two(minutes), 'MIN')}
            {cell(two(seconds), 'SEC')}
          </span>
          <span aria-hidden="true" className="bw-close-compact">
            {days > 0 ? `${days}d ` : ''}{two(hours)}:{two(minutes)}:{two(seconds)}
          </span>

          <a
            href={href}
            className="bw-close-cta"
            style={{
              background: '#FFFFFF', color: '#000000', textDecoration: 'none',
              padding: '11px 20px', borderRadius: 4, fontSize: 13.5, fontWeight: 700,
              letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}
          >
            {label}
          </a>
        </div>
        <p className="bw-close-note" style={{
          maxWidth: 900, margin: '8px auto 0', textAlign: 'center',
          fontSize: 11.5, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.66)',
        }}>
          Enrollment at $1,997 closes at midnight Eastern. The next opening is planned at $4,997.
        </p>
        <span style={{
          position: 'absolute', width: 1, height: 1, overflow: 'hidden',
          clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
        }}>{spoken}</span>
      </div>
    </>
  );
}
