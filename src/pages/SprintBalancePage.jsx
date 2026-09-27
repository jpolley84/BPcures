// SprintBalancePage (route: /sprint-balance) — where the $200 Sprint deposit
// lands. Two ways to settle the $1,797 balance (Joel, 2026-09-27):
//   1. Pay in full, $1,797, and a one-on-one coaching session is added.
//   2. 3 monthly payments of $649 ($1,947; capped after the 3rd charge by the
//      webhook, same mechanism as every Accelerator plan).
// Both buttons open hosted Stripe Checkout through api/create-hosted-checkout.
// The deposit itself is non-refundable and the page says so.
import { useEffect, useState } from 'react';
import { track, getDistinctId } from '../utils/analytics';

const DEPOSIT = '$200';
const BALANCE = '$1,797';

const OPTIONS = [
  {
    tier: 'sprint-balance-full',
    title: 'Pay the balance in full',
    price: BALANCE,
    sub: 'One payment. Done.',
    bonus: 'Bonus: a one-on-one coaching session with Annie or Joel.',
    cta: `Pay ${BALANCE} in full`,
    featured: true,
  },
  {
    tier: 'sprint-balance-3pay',
    title: '3 monthly payments',
    price: '3 x $649',
    sub: '$1,947 in total. Stops on its own after the third payment.',
    bonus: null,
    cta: 'Start 3 x $649',
    featured: false,
  },
];

export default function SprintBalancePage() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    track('sprint_balance_view', { page: 'sprint-balance' });
    const prev = document.title;
    document.title = 'Your Sprint balance | Life Change Sprint';
    return () => { document.title = prev; };
  }, []);

  async function go(tier) {
    if (busy) return;
    setBusy(tier); setError('');
    track('sprint_balance_click', { tier });
    try {
      const res = await fetch('/api/create-hosted-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, distinctId: getDistinctId() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || data.error || 'Could not start checkout');
      window.location.assign(data.url);
    } catch (err) {
      setBusy('');
      setError(err.message || 'Could not start checkout. Please try again.');
    }
  }

  return (
    <div className="sbp">
      <style>{`
.sbp{min-height:100vh;background:#F7F4EC;color:#182a27;font-family:Arial,Helvetica,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;padding:48px 20px 80px}
.sbp *{box-sizing:border-box}
.sbp .wrap{max-width:860px;margin:0 auto;text-align:center}
.sbp .eyebrow{font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:.76rem;color:#23675f;margin-bottom:12px}
.sbp h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1.1;color:#082825;margin:0 0 12px;letter-spacing:-.02em}
.sbp .lead{font-size:1.08rem;color:#354b47;max-width:620px;margin:0 auto}
.sbp .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:32px;text-align:left}
.sbp .card{background:#fff;border:1px solid #DDD6C8;border-radius:18px;padding:24px;display:flex;flex-direction:column;box-shadow:0 12px 34px rgba(24,42,39,.08)}
.sbp .card.featured{border:2px solid #23675f}
.sbp .card h2{font-family:Georgia,serif;font-size:1.3rem;margin:0 0 6px;color:#082825}
.sbp .price{font-family:Georgia,serif;font-size:2.2rem;color:#082825;margin:10px 0 4px;line-height:1}
.sbp .sub{color:#536560;font-size:.92rem}
.sbp .bonus{margin-top:12px;background:#e7f0e9;color:#23675f;border-radius:10px;padding:10px 12px;font-weight:800;font-size:.92rem}
.sbp .btn{margin-top:auto;padding-top:18px}
.sbp button{width:100%;min-height:52px;border:0;border-radius:8px;background:#c9513e;color:#fff;font-weight:900;font-size:1rem;cursor:pointer}
.sbp button:hover{background:#a43b2e}
.sbp button[disabled]{opacity:.7;cursor:default}
.sbp .err{margin:18px auto 0;max-width:620px;background:#FFF4F2;border:1px solid #E9C4BC;border-radius:12px;padding:14px;color:#8A3524;font-size:.94rem}
.sbp .err a{text-decoration:underline;font-weight:800;color:inherit}
.sbp .fine{margin-top:22px;font-size:.84rem;color:#536560;max-width:620px;margin-left:auto;margin-right:auto}
@media(max-width:700px){.sbp .grid{grid-template-columns:1fr}.sbp{padding:32px 18px 70px}}
      `}</style>
      <div className="wrap">
        <div className="eyebrow">Your Sprint deposit is in</div>
        <h1>Now choose how to settle your balance.</h1>
        <p className="lead">
          {`Your ${DEPOSIT} deposit locked your spot in the Life Change Sprint. The remaining ${BALANCE} can be paid in full today, or across three monthly payments.`}
        </p>

        <div className="grid">
          {OPTIONS.map((o) => (
            <article className={`card${o.featured ? ' featured' : ''}`} key={o.tier}>
              <h2>{o.title}</h2>
              <div className="price">{o.price}</div>
              <div className="sub">{o.sub}</div>
              {o.bonus && <div className="bonus">{o.bonus}</div>}
              <div className="btn">
                <button type="button" disabled={busy === o.tier} onClick={() => go(o.tier)}>
                  {busy === o.tier ? 'Opening secure checkout...' : o.cta}
                </button>
              </div>
            </article>
          ))}
        </div>

        {error && (
          <div className="err">
            {error}{' '}
            <a href="mailto:braveworksrn@gmail.com">Email us</a> and we will send you a working payment link by hand.
          </div>
        )}

        <p className="fine">
          {`The ${DEPOSIT} deposit is non-refundable. If you move up to the full Life Change Accelerator at any point, everything you have paid toward the Sprint is credited toward the $7,500.`}
        </p>
      </div>
    </div>
  );
}
