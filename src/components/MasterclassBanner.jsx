// MasterclassBanner — slim top strip promoting the free "Beyond the Cuff"
// masterclass, with a live countdown to the next Monday 7pm ET session.
//
// 2026-07-22 (Joel): "on bpquiz.com i want both sites to have a banner and
// link to the free masterclass sign up. also i want the masterclass to be a
// timer for next monday." Rendered once in HomeSplit so BOTH A/B homepage
// variants get it identically.
//
// 2026-08-03 (Joel): class moved from 7:00pm CT to 7:00pm ET (one hour
// earlier in Central, 6:00pm CT). This file is the ONE place the anchor is
// computed; public/masterclass/index.html and registered/index.html each
// carry their own inline copy of this same math (static pages, no shared JS
// module) and must be changed in the same pass or the site and the countdown
// drift apart. See api/_masterclass-enroll.js for the confirmation email.
//
// The class runs every Monday 7:00pm ET. The countdown targets the NEXT
// Monday 7pm ET; once that moment passes it rolls to the following week.
// Timezone is resolved from America/New_York at runtime (not a hardcoded
// offset) so it stays correct across the DST change.
//
// /masterclass is a STATIC page (public/masterclass/), excluded from the SPA
// rewrite in vercel.json, so this is a plain <a>, not a react-router Link.
// ZERO em dashes in visible copy.

import { useEffect, useState } from 'react';
import { track } from '../utils/analytics';

// Offset (ms) of America/New_York from UTC at a given instant.
function etOffsetMs(d) {
  try {
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return et.getTime() - utc.getTime();
  } catch {
    return -4 * 3600 * 1000; // EDT fallback
  }
}

// The next Monday 7:00pm ET as a real instant.
export function nextMondayET(now = new Date()) {
  const off = etOffsetMs(now);
  const etNow = new Date(now.getTime() + off); // wall clock, read via getUTC*
  const day = etNow.getUTCDay(); // 0 Sun, 1 Mon
  const addDays = (1 - day + 7) % 7;
  let target = Date.UTC(
    etNow.getUTCFullYear(), etNow.getUTCMonth(), etNow.getUTCDate() + addDays, 19, 0, 0,
  );
  if (target <= etNow.getTime()) target += 7 * 24 * 3600 * 1000;
  return new Date(target - off);
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

export default function MasterclassBanner() {
  const [target, setTarget] = useState(() => nextMondayET());
  const [left, setLeft] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const rem = target.getTime() - Date.now();
      if (rem <= 0) {
        const next = nextMondayET();
        setTarget(next);
        setLeft(next.getTime() - Date.now());
      } else {
        setLeft(rem);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const { d, h, m, s } = parts(left);
  const dateLabel = (() => {
    try {
      return target.toLocaleDateString('en-US', {
        timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric',
      });
    } catch { return 'Monday'; }
  })();

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
        <strong style={{ fontWeight: 700 }}>Beyond the Cuff</strong>
        <span style={{ opacity: 0.92 }}>live {dateLabel}, 7pm ET</span>
      </span>

      <span style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'center' }} aria-label="Time until the masterclass">
        {cell(d, 'days')}{cell(h, 'hrs')}{cell(m, 'min')}{cell(s, 'sec')}
      </span>

      <a
        href="/masterclass"
        onClick={() => track('masterclass_banner_click', { days_out: d })}
        style={{
          background: '#FFFFFF', color: CLAY, fontWeight: 800, fontSize: '0.82rem',
          textDecoration: 'none', padding: '0.42rem 0.95rem', borderRadius: 999, whiteSpace: 'nowrap',
        }}
      >
        Save my free seat &rarr;
      </a>
    </div>
  );
}
