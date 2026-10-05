// SprintPage (route: /sprint) — the Life Change Sprint checkout.
//
// 2026-10-05 (Joel): "a checkout page for our $1,997 sprint offer. $200 down.
// 6 weeks of group coaching. 1:1 fast track call if they put the down payment
// by the end of the Q&A session."
//
// The offer, as it already exists in Stripe and the webhook (see
// api/create-hosted-checkout.js): $200 NON-REFUNDABLE deposit, then $1,797
// settled on /sprint-balance, in full (adds a one-on-one coaching session) or
// 3 x $649 every two weeks inside the 6 weeks. Every dollar is credited if she
// moves up to the $7,500 Accelerator.
//
// NEW HERE: the Fast-Track Call. Anyone whose deposit lands before
// FASTTRACK_UNTIL gets a 1:1 fast-track call. The SERVER decides whether a
// deposit qualified (it stamps metadata.fasttrack), so a slow page clock can
// never promise a call that was not earned. This page only shows the timer.
//
// Not wrapped in SiteLayout (focused checkout, no nav to leak clicks).
// ZERO em dashes in visible copy.
import { useEffect, useState } from 'react';
import { track, getDistinctId } from '../utils/analytics';
import { zonedInstant } from '../utils/tz.js';
import scrubsImg from '../assets/annie-joel-scrubs-real.jpg';

const PRICE = '$1,997';
const DEPOSIT = '$200';
const BALANCE = '$1,797';
const SPOTS = 4; // Joel, 2026-09-27. A live claim shown to customers; keep it true.

// ⚠️ Mirror of FASTTRACK_UNTIL in api/create-hosted-checkout.js. The server
// value is the one that counts. Joel: "by the end of the Q&A session" of the
// Monday 7:00 pm ET masterclass; set to 9:00 pm ET on class night.
const FASTTRACK_UNTIL = zonedInstant('2026-10-05T21:00:00', 'America/New_York');

const INCLUDED = [
  ['6 weeks of weekly group coaching + live Q&A', 'Annie and Joel, live, every week for six weeks. Bring your numbers, your questions and your wins.'],
  ['Your health review', 'We start with you: your numbers, your symptoms, your history, and what you can actually do.'],
  ['Your plan and your starting priorities', 'Not 76 things to change. The few right things, in the right order, for your body.'],
  ['Step-by-step help through the 6 weeks', 'You always know what to do next.'],
  ['Community access during the sprint', 'Women doing the same work at the same time.'],
  ['Every dollar credited toward the Accelerator', 'If you move up to the full $7,500 program at any point, everything you paid for the Sprint comes off the price.'],
];

const NOT_INCLUDED = [
  'The Accelerator bonuses (Healing Circle, Know Your Labs, Two For One, Skin + Hair)',
  'One year of access',
  'The 90-day money-back guarantee',
];

const FAQ = [
  ['What am I paying today?', `${DEPOSIT}. It holds your spot and comes off the ${PRICE} price.`],
  ['Is the deposit refundable?', `No. The ${DEPOSIT} deposit is non-refundable. It holds one of a small number of spots.`],
  ['How is the rest paid?', `The ${BALANCE} balance is settled right after your deposit: pay it in full and a one-on-one coaching session is added, or spread it across 3 payments of $649, one every two weeks, all inside the 6 weeks.`],
  ['What is the Fast-Track Call?', 'A one-on-one call with Annie or Joel to get you moving before the group starts. You earn it by putting your deposit down before the Q&A ends on class night. The timer on this page shows the cutoff.'],
  ['What if I decide I want the full Accelerator?', 'Everything you paid toward the Sprint is credited toward the $7,500. Nothing is lost.'],
  ['Is this medical care?', 'No. It is coaching and education alongside your medical team, never a replacement for it. Never stop or change prescribed medication on your own.'],
];

const two = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

export default function SprintPage() {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const msLeft = FASTTRACK_UNTIL.getTime() - now;
  const fastOpen = msLeft > 0;
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const cd = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    track('sprint_view', { page: 'sprint', fastOpen });
    const prev = document.title;
    document.title = 'The Life Change Sprint | 6 Weeks With Annie + Joel';
    return () => { clearInterval(id); document.title = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCheckout() {
    if (busy) return;
    setBusy(true); setError('');
    track('sprint_checkout_click', { fastOpen });
    try {
      const res = await fetch('/api/create-hosted-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'sprint-deposit', distinctId: getDistinctId(), source: 'sprint-page' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || data.error || 'Could not start checkout');
      window.location.assign(data.url);
    } catch (err) {
      setBusy(false);
      setError(err.message || 'Could not start checkout. Please try again.');
    }
  }

  return (
    <div className="sp">
      <style>{CSS}</style>

      <div className="topbar">{fastOpen ? `Fast-Track Call bonus ends when tonight's Q&A ends · ${SPOTS} spots open` : `${SPOTS} spots open`}</div>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">6 weeks · Annie + Joel, RNs</div>
            <h1>The Life Change Sprint</h1>
            <p className="lead"><strong>Six weeks to stop guessing and start moving your numbers.</strong></p>
            <p className="sub">
              Weekly group coaching and live Q&amp;A with two nurses, your own health review, and a plan
              built around your body. Start today for {DEPOSIT}.
            </p>
            <div className="trust">
              <span>Live every week for 6 weeks</span>
              <span>Nurse-led, evidence-based</span>
              <span>Credited toward the Accelerator</span>
            </div>
            <a href="#checkout" className="btn">{`Start the Sprint · ${DEPOSIT} today`}</a>
          </div>
          <figure className="photo">
            <img src={scrubsImg} alt="Annie Chitate, RN and Joel Polley, RN" width="644" height="1063" />
          </figure>
        </div>
      </header>

      {fastOpen && (
        <section className="fast">
          <div className="wrap fast-grid">
            <div>
              <div className="eyebrow light">Fast-Track bonus</div>
              <h2>Put your deposit down before the Q&amp;A ends and get a 1:1 Fast-Track Call.</h2>
              <p>A private call with Annie or Joel before the group starts, so you walk into week one already moving.</p>
            </div>
            <div className="countdown" aria-label="Time left to earn the Fast-Track Call">
              <div><b>{two(cd.h + cd.d * 24)}</b><span>Hours</span></div>
              <div><b>{two(cd.m)}</b><span>Min</span></div>
              <div><b>{two(cd.s)}</b><span>Sec</span></div>
            </div>
          </div>
        </section>
      )}

      <section className="white">
        <div className="wrap">
          <div className="center">
            <h2>What the Sprint includes.</h2>
          </div>
          <div className="includes">
            {INCLUDED.map(([t, b]) => (
              <div className="inc" key={t}><span className="chk">✓</span><div><strong>{t}</strong><span>{b}</span></div></div>
            ))}
          </div>
          <div className="notinc">
            <strong>Not included in the Sprint</strong>
            <ul>{NOT_INCLUDED.map((n) => <li key={n}><span>✕</span>{n}</li>)}</ul>
            <p>Those live in the full Life Change Accelerator. If you move up later, every Sprint dollar is credited.</p>
          </div>
        </div>
      </section>

      <section id="checkout">
        <div className="wrap co-grid">
          <div>
            <h2>Your investment.</h2>
            <div className="price">{PRICE}</div>
            <p className="price-sub">6 weeks of group coaching with Annie and Joel.</p>
            <div className="steps">
              <div className="step"><b>1</b><div><strong>{`${DEPOSIT} today.`}</strong><p>Holds your spot. Non-refundable.</p></div></div>
              <div className="step"><b>2</b><div><strong>{`Settle the ${BALANCE} balance.`}</strong><p>In full (a one-on-one coaching session is added) or 3 x $649 every two weeks.</p></div></div>
              <div className="step"><b>3</b><div><strong>Start your 6 weeks.</strong><p>{fastOpen ? 'Deposit before the Q&A ends and your Fast-Track Call comes first.' : 'We send your next steps the same day.'}</p></div></div>
            </div>
          </div>

          <div className="card">
            <div className="tag">{`${SPOTS} spots open`}</div>
            <h3>Start the Sprint</h3>
            <div className="today">{DEPOSIT}<small> today</small></div>
            <ul className="mini">
              <li>6 weeks of weekly coaching + Q&amp;A</li>
              <li>Your health review and plan</li>
              <li>{`${BALANCE} balance settled next, your way`}</li>
              {fastOpen && <li className="gold">1:1 Fast-Track Call, if you deposit before the Q&amp;A ends</li>}
            </ul>
            <button type="button" className="btn full" disabled={busy} onClick={startCheckout}>
              {busy ? 'Opening secure checkout...' : `Pay ${DEPOSIT} and Save My Spot`}
            </button>
            {error && (
              <div className="err">{error} <a href="mailto:braveworksrn@gmail.com">Email us</a> and we will send a working payment link by hand.</div>
            )}
            <div className="secure">🔒 Secure checkout by Stripe. The {DEPOSIT} deposit is non-refundable.</div>
          </div>
        </div>
      </section>

      <section className="white">
        <div className="narrow">
          <div className="center"><h2>Questions, answered.</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><div className="ans">{a}</div></details>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-cta"><a href="#checkout">{`Start the Sprint · ${DEPOSIT}`}</a></div>

      <footer>
        <div className="links"><a href="/terms">Program Terms</a><a href="/privacy">Privacy Policy</a><a href="mailto:braveworksrn@gmail.com">Contact Support</a></div>
        <div>The Life Change Sprint is an educational and coaching program and is not a substitute for diagnosis, treatment, or medical care from your licensed healthcare professional. Individual results vary.</div>
      </footer>
    </div>
  );
}

const CSS = `
.sp{--ink:#182a27;--ink-soft:#354b47;--muted:#536560;--cream:#F7F4EC;--soft:#EFEBE2;--line:#DDD6C8;--navy-2:#082825;--teal:#23675f;--teal-soft:#e7f0e9;--gold:#C9A24A;--gold-dark:#9D7A2F;--coral:#c9513e;--shadow:0 12px 34px rgba(24,42,39,.08);--radius:18px;
  font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;-webkit-font-smoothing:antialiased}
.sp *,.sp *::before,.sp *::after{box-sizing:border-box}
.sp img{max-width:100%;display:block}
.sp a{color:inherit;text-decoration:none}
.sp .wrap{width:min(calc(100% - 44px),1100px);margin:0 auto}
.sp .narrow{width:min(calc(100% - 44px),800px);margin:0 auto}
.sp h1,.sp h2,.sp h3{margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--navy-2);line-height:1.08;letter-spacing:-.02em;font-weight:700;text-wrap:balance}
.sp h1{font-size:clamp(2.1rem,3.6vw,3.1rem)}
.sp h2{font-size:clamp(1.7rem,2.8vw,2.3rem);margin-bottom:14px}
.sp h3{font-size:1.3rem}
.sp p{margin:0;color:var(--ink-soft);text-wrap:pretty}
.sp .lead{font-size:clamp(1.1rem,1.5vw,1.3rem);color:var(--ink);margin-top:14px}
.sp .sub{margin-top:12px;max-width:600px;font-size:1.05rem}
.sp .eyebrow{font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:.76rem;color:var(--teal);margin-bottom:12px}
.sp .eyebrow.light{color:#E7D28C}
.sp .center{text-align:center}
.sp .center h2{margin-left:auto;margin-right:auto}
.sp section{padding:64px 0}
.sp .white{background:#fff}
.sp .topbar{background:var(--navy-2);color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.76rem;text-align:center;padding:10px 16px;position:sticky;top:0;z-index:100}
.sp .btn{display:inline-flex;align-items:center;justify-content:center;padding:15px 24px;border-radius:8px;font-weight:800;font-size:1rem;border:2px solid var(--coral);background:var(--coral);color:#fff;cursor:pointer;min-height:52px;margin-top:24px;text-align:center;line-height:1.2}
.sp .btn:hover{background:#a43b2e;border-color:#a43b2e}
.sp .btn.full{width:100%;margin-top:18px}
.sp .btn[disabled]{opacity:.7;cursor:default}
.sp .hero{padding:52px 0 56px;border-bottom:1px solid var(--line)}
.sp .hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:44px;align-items:center}
.sp .hero-grid > *{min-width:0}
.sp .trust{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:20px;font-size:.92rem;font-weight:700;color:var(--ink-soft)}
.sp .trust span::before{content:"✓";color:var(--teal);margin-right:7px;font-weight:900}
.sp .photo{margin:0;justify-self:end;width:min(100%,380px)}
.sp .photo img{border-radius:var(--radius);box-shadow:var(--shadow);aspect-ratio:644/1063;object-fit:cover;max-height:480px;object-position:top;width:100%;height:auto}
.sp .fast{background:var(--navy-2);color:#fff;padding:44px 0}
.sp .fast h2{color:#fff;font-size:clamp(1.4rem,2.4vw,1.9rem)}
.sp .fast p{color:rgba(255,255,255,.8);margin-top:10px}
.sp .fast-grid{display:grid;grid-template-columns:minmax(0,1.3fr) auto;gap:32px;align-items:center}
.sp .countdown{display:flex;gap:10px}
.sp .countdown div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px 6px;min-width:76px;text-align:center}
.sp .countdown b{display:block;font-family:Georgia,serif;font-size:2rem;line-height:1;color:#E7D28C}
.sp .countdown span{display:block;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-top:6px}
.sp .includes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:30px}
.sp .inc{display:flex;gap:12px;align-items:flex-start;background:#FCFBF8;border:1px solid var(--line);border-radius:14px;padding:16px}
.sp .chk{width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-weight:900;font-size:.85rem}
.sp .inc strong{display:block;color:var(--ink);margin-bottom:2px}
.sp .inc span:last-child{color:var(--ink-soft);font-size:.92rem;line-height:1.5}
.sp .notinc{margin:26px auto 0;max-width:760px;border:1px dashed var(--line);border-radius:14px;padding:18px 20px;background:#fff}
.sp .notinc strong{color:var(--ink)}
.sp .notinc ul{list-style:none;padding:0;margin:10px 0}
.sp .notinc li{display:flex;gap:10px;color:var(--muted);padding:5px 0;text-decoration:line-through;text-decoration-color:rgba(83,101,96,.5)}
.sp .notinc li span{color:var(--coral);font-weight:900;text-decoration:none}
.sp .notinc p{font-size:.92rem}
.sp .co-grid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:40px;align-items:start}
.sp .co-grid > *{min-width:0}
.sp .price{font-family:Georgia,serif;font-size:clamp(3rem,6vw,4.6rem);line-height:.95;color:var(--navy-2);letter-spacing:-.03em;margin:10px 0 6px}
.sp .price-sub{font-size:1rem}
.sp .steps{display:grid;gap:14px;margin-top:22px}
.sp .step{display:flex;gap:12px;align-items:flex-start}
.sp .step b{width:30px;height:30px;flex:0 0 30px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-size:.9rem}
.sp .step strong{color:var(--ink)}
.sp .step p{font-size:.95rem}
.sp .card{background:#fff;border:2px solid var(--teal);border-radius:var(--radius);padding:26px;box-shadow:var(--shadow)}
.sp .tag{display:inline-block;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;background:var(--teal);color:#fff;border-radius:999px;padding:5px 10px;margin-bottom:12px}
.sp .today{font-family:Georgia,serif;font-size:2.8rem;line-height:1;color:var(--navy-2);margin:10px 0 14px}
.sp .today small{font-family:Arial,sans-serif;font-size:1rem;color:var(--muted)}
.sp .mini{list-style:none;padding:0;margin:0}
.sp .mini li{padding:8px 0;border-top:1px solid var(--soft);font-size:.95rem;color:var(--ink);font-weight:700}
.sp .mini li::before{content:"✓ ";color:var(--teal)}
.sp .mini li.gold{color:var(--gold-dark)}
.sp .mini li.gold::before{content:"★ ";color:var(--gold)}
.sp .err{margin-top:12px;background:#FFF4F2;border:1px solid #E9C4BC;border-radius:10px;padding:12px;color:#8A3524;font-size:.92rem}
.sp .err a{text-decoration:underline;font-weight:800}
.sp .secure{margin-top:12px;font-size:.84rem;color:var(--muted);text-align:center}
.sp .faq{margin-top:28px;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff}
.sp .faq details{border-bottom:1px solid var(--soft)}
.sp .faq details:last-child{border-bottom:0}
.sp .faq summary{cursor:pointer;list-style:none;padding:16px 22px;font-weight:800;color:var(--ink);display:flex;justify-content:space-between;gap:16px;align-items:center;min-height:54px}
.sp .faq summary::-webkit-details-marker{display:none}
.sp .faq summary::after{content:"+";color:var(--teal);font-weight:900}
.sp .faq details[open] summary::after{content:"–"}
.sp .ans{padding:0 22px 18px;color:var(--ink-soft);font-size:.96rem}
.sp footer{background:#061d1b;color:#AAB4B0;text-align:center;padding:22px;font-size:.8rem;line-height:1.55}
.sp .links{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
.sp .links a{text-decoration:underline}
.sp .mobile-cta{display:none}
@media (max-width:900px){
  .sp .hero-grid,.sp .co-grid,.sp .fast-grid{grid-template-columns:1fr}
  .sp .photo{justify-self:center;width:min(100%,320px)}
  .sp .includes{grid-template-columns:1fr}
  .sp section{padding:52px 0}
}
@media (max-width:640px){
  .sp .wrap,.sp .narrow{width:calc(100% - 40px)}
  .sp h1{font-size:2rem}
  .sp .hero{padding:32px 0 36px}
  .sp .btn{width:100%}
  .sp .topbar{font-size:.68rem}
  .sp .countdown div{min-width:0;flex:1}
  .sp .mobile-cta{display:block;position:fixed;left:0;right:0;bottom:0;z-index:120;background:rgba(8,40,37,.97);padding:10px 14px}
  .sp .mobile-cta a{display:block;text-align:center;background:var(--coral);color:#fff;font-weight:900;padding:14px;border-radius:8px;min-height:52px}
  .sp footer{padding-bottom:100px}
}
`;
