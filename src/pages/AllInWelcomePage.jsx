// AllInWelcomePage (route: /allin-welcome) — post-purchase landing for the
// $1,997 All In 90-Day Program. Stripe embedded checkout redirects the top
// frame here on completion: /allin-welcome?plan=<full|deposit|plan>&session_id=...
//
// 2026-07-20. Wrapped in SiteLayout by App.jsx. The buyer confirmation email +
// Joel-notify fire from the webhook (processAllIn); this page just reassures the
// buyer and tells them what happens next (their intake). ZERO em dashes.

import { useEffect } from 'react';
import { CheckCircle2, Mail, Stethoscope } from 'lucide-react';
import { track } from '../utils/analytics';

function planLine(plan) {
  if (plan === 'deposit') return 'Your $197 deposit is in and your spot is locked. Joel will reach out about the balance and your start date.';
  if (plan === 'plan') return 'Your first payment is in and your spot is locked. The rest runs automatically every two weeks across the 12 weeks.';
  return 'You are all in, paid in full. Your spot is locked.';
}

export default function AllInWelcomePage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const plan = params.get('plan') || 'full';

  useEffect(() => {
    track('allin_purchase_confirmed', { plan });
  }, [plan]);

  const C = {
    clay: 'var(--clay, #B85A36)', sage: 'var(--sage, #4A5D4E)',
    ink: 'var(--ink, #1E2B2A)', inkSoft: 'var(--ink-soft, #2B2824)',
    line: 'var(--line, #D8CFBD)', cream: 'var(--cream, #FBF8F1)', muted: 'var(--muted, #7A7061)',
  };

  return (
    <section style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(1.8rem, 5vw, 3.2rem) 1.25rem', textAlign: 'center' }}>
      <CheckCircle2 size={48} strokeWidth={1.8} style={{ color: C.sage }} aria-hidden />
      <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', margin: '0.8rem auto 0.5rem', maxWidth: '18ch', lineHeight: 1.15, color: C.ink }}>
        Welcome in. You decided.
      </h1>
      <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: C.inkSoft, maxWidth: '46ch', margin: '0 auto' }}>
        {planLine(plan)}
      </p>

      <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 14, padding: '1.3rem 1.4rem', margin: '1.6rem 0 0', textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <Mail size={20} strokeWidth={2} style={{ color: C.clay, flexShrink: 0, marginTop: 2 }} aria-hidden />
          <div>
            <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: C.ink }}>Your first step is coming by email.</p>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: C.inkSoft }}>
              Joel builds your plan around your numbers, your medications, and your history. Watch your inbox over the next day or two for your intake, and fill it out as completely as you can. The more he sees, the sharper your plan.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '1.6rem 0 0', textAlign: 'left' }}>
        <Stethoscope size={18} strokeWidth={1.9} style={{ color: C.sage, flexShrink: 0, marginTop: 2 }} aria-hidden />
        <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: C.muted }}>
          This program is education and lifestyle support alongside your doctor, never a replacement. Your doctor makes every call about your medication. Joel Polley is a Registered Nurse, not a prescribing doctor.
        </p>
      </div>
    </section>
  );
}
