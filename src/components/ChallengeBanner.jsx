// ChallengeBanner — top strip on the homepage while the Change My Life
// Challenge is running. It replaces MasterclassBanner for the duration and
// then retires itself.
//
// 2026-08-04 (Joel): "homepage should only sell challenge. please change
// that." Context: three people that day reported "the quiz will not open".
// They had tapped a DM button labelled "Take the free quiz", landed on the
// homepage sales letter, and the first thing above the fold was a countdown
// for a DIFFERENT free event (Beyond the Cuff, the following Monday) while the
// challenge was mid-flight. Three offers competing, none of them the thing the
// button promised.
//
// NOTE ON THE FILENAME: this file previously held a May-era "FREE 30-DAY
// CHALLENGE, STARTS MAY 1 / The Pressure Triangle" email-capture banner that
// was pulled from App.jsx on 2026-05-10 and imported nowhere since. That dead
// component is gone; nothing referenced it. Do not resurrect it from git
// history: its offer, dates and copy are all retired.
//
// SELF-RETIRING BY DESIGN. This returns null once registration has closed, and
// HomeSplit falls back to MasterclassBanner automatically. Nobody has to
// remember to take it down, and the homepage cannot be left selling a seat that
// can no longer be bought. To run it again for cohort 2, update NIGHTS and
// REGISTRATION_CLOSE and nothing else.
//
// The nights and the 7:00pm ET start mirror the CHALLENGE config block in
// src/pages/ChallengePage.jsx (DATE_RANGE_LABEL "August 4 to 6", TIME_LABEL_ET
// "7:00pm ET", CLOSE_ISO_ET 2026-08-06T00:00:00). If that config moves, this
// moves with it. There is no shared module because ChallengePage keeps its
// constants inline by deliberate convention.
//
// ZERO em dashes in visible copy.

import { useEffect, useState } from 'react';
import { track } from '../utils/analytics';
import { etOffsetMs } from './MasterclassBanner.jsx';

const REGISTER_URL = 'https://changemylifechallenge.com';

// Wall-clock ET (year, month 1-12, day, hour) resolved to a real instant.
// The offset is measured AT that moment, so this stays correct across DST.
function etWallToInstant(y, mo, d, h) {
  const guess = Date.UTC(y, mo - 1, d, h, 0, 0);
  return new Date(guess - etOffsetMs(new Date(guess)));
}

// The three founding-cohort nights, 7:00pm to 8:00pm ET.
const NIGHTS = [
  { label: 'Tuesday', start: () => etWallToInstant(2026, 8, 4, 19) },
  { label: 'Wednesday', start: () => etWallToInstant(2026, 8, 5, 19) },
  { label: 'Thursday', start: () => etWallToInstant(2026, 8, 6, 19) },
];

const HOUR_MS = 3600 * 1000;

// Registration close, mirroring CHALLENGE.CLOSE_ISO_ET in ChallengePage.jsx.
// 2026-08-05 (Joel): doors shut at MIDNIGHT ending Wednesday, a night before
// the challenge itself ends. This banner exists to drive REGISTRATIONS, and its
// only CTA is "Save my free seat", so it has to retire at the close instant
// rather than after Night 3. Without this it would spend all of Thursday
// counting down to a night nobody can still buy into and linking to a page
// that answers with a waitlist form.
//
// Hour 0 of August 6 IS midnight ending August 5. etWallToInstant takes a
// 1-12 month, so this reads (2026, August, 6th, 00:00) ET.
const REGISTRATION_CLOSE = () => etWallToInstant(2026, 8, 6, 0);

// Which night are we in, or heading for? Returns null once registration closes,
// which is what retires the banner.
export function currentChallengeNight(now = Date.now()) {
  if (now >= REGISTRATION_CLOSE().getTime()) return null;
  for (const n of NIGHTS) {
    const start = n.start().getTime();
    if (now < start) return { label: n.label, start, live: false };
    if (now < start + HOUR_MS) return { label: n.label, start, live: true };
  }
  return null;
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

export default function ChallengeBanner() {
  const [night, setNight] = useState(() => currentChallengeNight());
  const [left, setLeft] = useState(() => (night ? night.start - Date.now() : 0));

  useEffect(() => {
    const id = setInterval(() => {
      const n = currentChallengeNight();
      setNight(n);
      setLeft(n ? n.start - Date.now() : 0);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!night) return null;

  const { d, h, m, s } = parts(left);

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
          {night.live ? 'Live now' : 'Free'}
        </span>
        <strong style={{ fontWeight: 700 }}>The Change My Life Challenge</strong>
        <span style={{ opacity: 0.92 }}>
          {night.live ? 'on now, come on in' : `${night.label} night, 7pm ET`}
        </span>
      </span>

      {!night.live && (
        <span style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'center' }} aria-label="Time until the next challenge night">
          {cell(d, 'days')}{cell(h, 'hrs')}{cell(m, 'min')}{cell(s, 'sec')}
        </span>
      )}

      <a
        href={REGISTER_URL}
        onClick={() => track('challenge_banner_click', { night: night.label, live: night.live })}
        style={{
          background: '#FFFFFF', color: CLAY, fontWeight: 800, fontSize: '0.82rem',
          textDecoration: 'none', padding: '0.42rem 0.95rem', borderRadius: 999, whiteSpace: 'nowrap',
        }}
      >
        {night.live ? 'Join the room →' : 'Save my free seat →'}
      </a>
    </div>
  );
}
