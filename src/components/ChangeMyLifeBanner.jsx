// ChangeMyLifeBanner — slim top strip announcing the free Change My Life
// Challenge (changemylifechallenge.com) with a live countdown to day one.
//
// 2026-09-10 (Joel): "I need a changemylifechallenge.com banner announcing the
// challenge on bpquiz.com." It takes the top slot that MasterclassBanner held,
// so there is ONE offer above the fold instead of two competing CTAs.
// MasterclassBanner is still in the repo and still used by /101foods' own
// route logic through this file's prop-compatible shape.
//
// The challenge runs Sept 22-24 at 11:00am CT. Three phases:
//   before  -> countdown to day one
//   during  -> "Happening now" through the end of Sept 24 CT
//   after   -> renders nothing, so a stale date never sits live
//
// Timezone is resolved from America/Chicago at runtime (not a hardcoded
// offset) so it stays correct across the DST change.
// changemylifechallenge.com is a separate property, so this is a plain <a>.
// ZERO em dashes in visible copy.

import { useEffect, useState } from 'react';
import { track } from '../utils/analytics';

// EDIT HERE when the challenge dates move. CT wall-clock, [year, month(1-12), day, hour, minute].
const START_CT = [2026, 9, 22, 11, 0];   // day one, 11:00am CT
const END_CT   = [2026, 9, 25, 0, 0];    // banner disappears after Sept 24 CT
const DATE_LABEL = 'Sept 22-24';
const CHALLENGE_URL = 'https://changemylifechallenge.com/?utm_source=bpquiz&utm_medium=banner&utm_campaign=change-my-life-challenge';

// Offset (ms) of America/Chicago from UTC at a given instant.
function ctOffsetMs(d) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const ct = new Date(d.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    return ct.getTime() - utc.getTime();
  } catch {
    return -5 * 3600 * 1000; // CDT fallback
  }
}

// A CT wall-clock tuple resolved to a real instant.
function ctInstant([y, mo, d, h, mi]) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  // Two passes: the first offset is read at the guessed instant, the second
  // re-reads it at the corrected one so a DST boundary cannot shift the result.
  let t = guess - ctOffsetMs(new Date(guess));
  t = guess - ctOffsetMs(new Date(t));
  return new Date(t);
}

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const CLAY = 'var(--clay, #B85A36)';

export default function ChangeMyLifeBanner() {
  const [now, setNow] = useState(() => Date.now());

  const start = ctInstant(START_CT).getTime();
  const end = ctInstant(END_CT).getTime();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Past the last day: no stale banner, no dead countdown.
  if (now >= end) return null;

  const live = now >= start;
  const { d, h, m, s } = parts(start - now);

  const cell = (n, lbl) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 30 }}>
      <strong style={{ fontSize: '0.98rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(n).padStart(2, '0')}
      </strong>
      <span style={{ fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>{lbl}</span>
    </span>
  );

  return (
    <div
      style={{
        background: CLAY, color: '#FFFFFF', width: '100%',
        padding: '0.5rem 1rem', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '0.9rem', flexWrap: 'wrap',
        fontFamily: 'inherit', fontSize: '0.86rem', lineHeight: 1.3,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.22)', padding: '0.15rem 0.45rem', borderRadius: 3 }}>
          Free
        </span>
        <strong style={{ fontWeight: 700 }}>The Change My Life Challenge</strong>
        <span style={{ opacity: 0.92 }}>
          {live ? `happening now, ${DATE_LABEL}, 11am CT daily` : `live ${DATE_LABEL}, 11am CT daily`}
        </span>
      </span>

      {!live && (
        <span style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'center' }} aria-label="Time until the challenge starts">
          {cell(d, 'days')}{cell(h, 'hrs')}{cell(m, 'min')}{cell(s, 'sec')}
        </span>
      )}

      <a
        href={CHALLENGE_URL}
        onClick={() => track('challenge_banner_click', { days_out: d, live })}
        style={{
          background: '#FFFFFF', color: CLAY, fontWeight: 800, fontSize: '0.82rem',
          textDecoration: 'none', padding: '0.42rem 0.95rem', borderRadius: 999, whiteSpace: 'nowrap',
        }}
      >
        {live ? 'Join today&rsquo;s session &rarr;' : 'Save my free spot &rarr;'}
      </a>
    </div>
  );
}
