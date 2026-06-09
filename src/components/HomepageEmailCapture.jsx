// Inline email capture for the homepage sales letter.
//
// 2026-06-09: the homepage had ZERO on-page email field — a warm visitor
// (podcast traffic typing "bpquiz.com") who didn't buy in one pageview was
// only catchable by the one-shot exit popup. This block trades nothing away
// from the $17-first decision: it sits below the offer, captures the
// non-buyers, and the instant Day-1 email (lead-magnet.js) starts the
// 21-day lead arc that sells the kit anyway.
import { useState } from 'react';

export default function HomepageEmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  async function submit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    const utm = new URLSearchParams(window.location.search);
    const tags = ['homepage-inline'];
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
      if (utm.get(k)) tags.push(`${k.replace('utm_', '')}-${utm.get(k)}`);
    }
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), category: 'blood_pressure', tags }),
      });
      if (!res.ok) throw new Error(`capture ${res.status}`);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="py-12" style={{ backgroundColor: 'var(--light-gray)', borderTop: '1px solid var(--light-gray)' }}>
      <div className="container-mobile-first">
        <div className="mx-auto text-center" style={{ maxWidth: '540px', background: 'var(--white)', borderRadius: '16px', padding: '30px 24px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="mb-2" style={{ color: 'var(--muted-gray)', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
            Not ready to buy?
          </p>
          <h3 className="mb-3" style={{ color: 'var(--navy)', fontSize: '23px', fontWeight: 700, lineHeight: 1.3 }}>
            Get Day 1 of the protocol free.
          </h3>
          <p className="mb-5 mx-auto" style={{ color: 'var(--dark-gray)', fontSize: '15px', lineHeight: 1.65, maxWidth: '420px' }}>
            I'll email you the first day of the BP Reset right now — the same Day 1 every buyer starts with. Try it tonight. No purchase needed.
          </p>
          {status === 'done' ? (
            <p style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 600 }}>
              ✓ Check your inbox — Day 1 is on its way.
            </p>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                required
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                aria-label="Email address"
                style={{ flex: '1 1 220px', padding: '13px 16px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.15)', fontSize: '15px' }}
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="font-semibold transition-all duration-200 active:scale-95"
                style={{ background: 'var(--navy)', color: 'var(--white)', borderRadius: '12px', padding: '13px 22px', fontSize: '15px', border: 'none', cursor: 'pointer' }}
              >
                {status === 'sending' ? 'Sending…' : 'Send me Day 1 free'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p style={{ color: '#B3261E', fontSize: '13px', marginTop: '10px' }}>
              That didn't go through — check your email and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
