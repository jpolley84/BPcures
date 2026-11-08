// MasterclassNextButton — "Join the next masterclass" with one click.
//
// Joel, 2026-11-08: "every thank you page should have a join the masterclass
// next one button, one click signup." On every thank-you page and as the last
// step after the quiz.
//
// One click when we already know her email: the `email` prop, else the
// address the quiz or an opt-in saved in localStorage (bwbp_lead_email, and
// bwbp_squeeze for the name). With no known email it shows one email box and
// the same button.
//
// It posts to api/masterclass-register with source
// 'next-masterclass-oneclick'. The server decides what that means: a seat in
// the next dated class (with the Zoom email), or the waitlist once that class
// is over. `page` says which thank-you page she was on, for PostHog.
import { useState } from 'react';
import { track } from '../utils/analytics';
import { NEXT_MASTERCLASS, nextClassIsSet } from '../lib/nextMasterclass';

function known() {
  let email = '';
  let name = '';
  try { email = localStorage.getItem('bwbp_lead_email') || ''; } catch { /* private mode */ }
  try {
    const sq = JSON.parse(localStorage.getItem('bwbp_squeeze') || 'null') || {};
    if (!email && sq.email) email = sq.email;
    if (sq.name) name = sq.name;
  } catch { /* nothing saved */ }
  return { email: email.trim(), name: name.trim() };
}

export default function MasterclassNextButton({ page, email: emailProp, name: nameProp, style }) {
  const saved = known();
  const startEmail = (emailProp || saved.email || '').trim();
  const [email, setEmail] = useState(startEmail);
  const [state, setState] = useState('idle'); // idle | busy | seat | waitlist | error
  const [error, setError] = useState('');
  const set = nextClassIsSet();
  const oneClick = Boolean(startEmail);

  async function join(e) {
    e?.preventDefault?.();
    const addr = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      setError('Please enter your email.');
      return;
    }
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/masterclass-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr, name: nameProp || saved.name || '', source: 'next-masterclass-oneclick', site: page || 'thank-you' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      try { localStorage.setItem('bwbp_lead_email', addr); } catch { /* private mode */ }
      track('masterclass_oneclick_join', { page: page || 'thank-you', one_click: oneClick, waitlisted: !!data.waitlisted, already: !!data.already });
      setState(data.waitlisted ? 'waitlist' : 'seat');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  const box = {
    background: '#102b47', color: '#fff', borderRadius: 14, padding: '18px 18px 16px',
    margin: '18px auto', maxWidth: 640, textAlign: 'left', boxShadow: '0 10px 26px rgba(16,43,71,.22)', ...style,
  };
  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 48,
    background: '#d7b579', color: '#102b47', border: 0, borderRadius: 10, fontWeight: 800, fontSize: '1rem',
    letterSpacing: '.03em', cursor: 'pointer', fontFamily: 'inherit', padding: '12px 16px',
  };

  if (state === 'seat' || state === 'waitlist') {
    return (
      <div style={box} role="status">
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>
          {state === 'seat' ? 'You are in.' : 'You are on the list.'}
        </div>
        <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#e8eef4' }}>
          {state === 'seat'
            ? `Check your email for your Zoom link. See you ${NEXT_MASTERCLASS.when}.`
            : 'We will email you the date of the next free masterclass.'}
        </div>
      </div>
    );
  }

  return (
    <form style={box} onSubmit={join}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.12em', color: '#d7b579', textTransform: 'uppercase', marginBottom: 4 }}>
        Free live masterclass with Joel &amp; Annie, RNs
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.35, marginBottom: 4 }}>
        {set ? NEXT_MASTERCLASS.title : 'Join the next masterclass'}
      </div>
      <div style={{ fontSize: '0.92rem', lineHeight: 1.5, color: '#e8eef4', marginBottom: 12 }}>
        {set ? `${NEXT_MASTERCLASS.when}. Live on Zoom. No replay.` : 'Save your spot and we will email you the date.'}
      </div>
      {!oneClick && (
        <input
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="Your best email"
          autoComplete="email"
          aria-label="Your email"
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 46, borderRadius: 10, border: 0, padding: '10px 12px', fontSize: '1rem', marginBottom: 10, fontFamily: 'inherit' }}
        />
      )}
      <button type="submit" style={btn} disabled={state === 'busy'}>
        {state === 'busy' ? 'Saving...' : set ? 'Join the masterclass, one click' : 'Join the next masterclass'} &rarr;
      </button>
      {oneClick && (
        <div style={{ fontSize: '0.78rem', color: '#b9c7d4', marginTop: 8 }}>
          Your seat goes to {startEmail}.
        </div>
      )}
      {error && <div role="alert" style={{ fontSize: '0.85rem', color: '#ffd1c4', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
