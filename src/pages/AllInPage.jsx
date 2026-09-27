// AllInPage (route: /allin) — "The Life Change Accelerator" CHECKOUT.
//
// ── 2026-09-27: Joel's v7 design, wired ──────────────────────────────────
// He supplied life-change-accelerator-allin-v7-clean-proof.html and said to
// use it instead of the old page. His design is ported here rather than
// rebuilt as a static file, because this route is a React page and the JSX is
// the source of truth for what ships.
//
// What changed from his file, and why:
//   1. Every selector is scoped under `.lca`. His file styled bare body, h1,
//      input and footer; unscoped in this SPA those rules would follow the
//      visitor onto every other page.
//   2. His checkout card had demo name/email inputs plus an "insert your
//      checkout embed here" box. Those are replaced by the REAL Stripe
//      embedded checkout ($500 deposit, tier allin-deposit). Stripe collects
//      email and card itself, so hand-rolled copies are redundant and a
//      liability.
//   3. His two photo placeholders now carry the Annie + Joel photo.
//   4. His single video slot carries Brenda's blood pressure story. Joel
//      confirmed her consent on 2026-09-27; the record is in
//      testimonials/records + CONSENT-LOG.md.
//   5. "Add the exact balance and payment terms here" is filled in with the
//      real terms: $500 deposit credited, $7,000 balance, plans up to 12
//      months, chosen on /payment.
//   6. His guarantee section shipped with participation terms full of blanks
//      and a note saying not to invent them. Joel chose (09-27) to publish
//      the guarantee exactly as he said it on the 09-24 call instead.
//
// ── RULES THIS FILE KEEPS ────────────────────────────────────────────────
// Not wrapped in SiteLayout (focused page, no nav to leak clicks).
// ZERO em dashes in visible copy.
// SPOTS is a live scarcity claim shown to customers. It must stay true.
// Education alongside the doctor, never a replacement.

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../lib/loadEnv';
import { track, getDistinctId, getAbHomeVariant } from '../utils/analytics';
import heroImg from '../assets/annie-joel-scrubs.jpg';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// ─── the numbers. One place each. ────────────────────────────────────────
const PRICE = '$7,500';
const DEPOSIT = '$500';
const BALANCE = '$7,000';

// ⚠️ Live scarcity claim, rendered to customers three times. Keep it true.
const SPOTS = 4; // Joel, 2026-09-27

// 2026-09-24 call, verbatim, confirmed for publication 09-27.
const GUARANTEE = 'This is a 90-day program. We guarantee your results in those 90 days, or your money back.';

const PHASES = [
  {
    n: 1,
    title: 'Start With What Matters',
    body: 'First, we look at your numbers, symptoms, habits, and where to start.',
    items: [
      'Your Health Review',
      'Life Change Blueprint + your numbers',
      'Deeply Nourished family-friendly meal plan',
      'Herbs + supplements guidance',
      'Your clear starting priorities',
    ],
  },
  {
    n: 2,
    title: 'Work Your Plan',
    body: 'Next, you use proven lifestyle changes and see what helps your numbers move.',
    items: [
      'Steady Numbers Blueprint',
      'Understand your symptoms',
      'Fun + Freedom movement',
      'Easy-Fit System',
      'Doctor conversation support',
    ],
  },
  {
    n: 3,
    title: 'Keep Your Progress',
    body: 'Then, we help you keep the changes going so your progress can last.',
    items: [
      'Bring Sexy Back',
      'Food That Loves You Back',
      'Whole-person expert support',
      'Healing from the past',
      'Build habits you can actually keep',
    ],
  },
];

const INCLUDES = [
  ['Evidence-Based Lifestyle Plan', 'Food, movement, sleep, stress, hydration, and other proven lifestyle methods chosen around your needs.'],
  ['Your Health Review', 'We start with you, your health, and what you need.'],
  ['Your 90-Day Plan', 'A clear plan built around what matters most for you.'],
  ['Step-by-Step Help', 'You will know what to do next. No trying everything at once.'],
  ['Weekly Coaching + Live Q&A', 'Bring your questions, wins, problems, and numbers each week.'],
  ['Guest Expert Help', 'Get extra help from guest experts when you need it.'],
  ['Progress Check-Ins', 'We check what is changing and where you need more help.'],
  ['Support + Community', 'You will be with women who are doing the work too.'],
  ['Help Staying on Track', 'We help you keep going, even when life gets busy.'],
];

const QUOTES = [
  ['From my 20s to now being 67, being on 3 blood pressure meds, you have been the only person that has ever made any impact in my BP journey.', 'Drago, 67'],
  ['I have done everything you said and all my meds are decreasing.', 'Dorothy M.'],
  ['My blood pressure is back to normal: 124/80.', 'Community member'],
];

const STACK = [
  'Phase 1: Start With What Matters',
  'Phase 2: Work Your Plan',
  'Phase 3: Keep Your Progress',
  'Weekly Coaching + Q&A',
  'Guest Expert Help',
  'Support + Accountability',
  'One Year of Access',
  'Extra Help',
];

const BONUSES = [
  ['One Year Access', 'Life gets busy. You can come back and review what you need.'],
  ['The Healing Circle', 'Get support, help, and a place to stay on track.'],
  ['Know Your Labs', 'Learn what your labs mean and what to ask your doctor.'],
  ['Fast-Action: Skin + Hair', 'Extra help for skin and hair.'],
];

const FAQ = [
  ['What am I paying today?', `${DEPOSIT} today. It is credited toward the full ${PRICE} Life Change Accelerator investment.`],
  ['What happens with the remaining balance?', `After your ${DEPOSIT} deposit, the remaining ${BALANCE} goes on the payment schedule you choose. Terms are available up to 12 months, and you pick yours on the next page.`],
  ['Is the deposit refundable if I change my mind?', 'Yes. If you put the deposit down and then decide this is not for you, tell us and we refund it.'],
  ['When does the program start?', 'You are added to the group and the community after you enroll, and the weekly coaching and Q&A begin from there.'],
  ['Do I have to pay the whole thing today?', `No. ${DEPOSIT} secures your spot and comes off the total. Paying in full is the cheapest route, and third-party financing counts as paying in full.`],
];

// His stylesheet, scoped. Every rule that was bare (body, h1, section,
// footer, input, details) now hangs off `.lca` so it cannot escape this page.
const CSS = `
.lca{
  --ink:#1F2321; --ink-soft:#4A504C; --cream:#F7F3EA; --white:#FFFFFF;
  --gold:#C9A24A; --gold-dark:#9D7A2F; --sage:#DCE6DD; --sage-deep:#31473A;
  --line:#DDD6C8; --soft:#EEE9DF; --success:#38634A;
  --shadow:0 18px 60px rgba(31,35,33,.08); --radius:24px; --max:1160px;
  font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color:var(--ink); background:var(--cream); line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
.lca *,.lca *::before,.lca *::after{box-sizing:border-box}
.lca img{max-width:100%;display:block}
.lca a{text-decoration:none;color:inherit}
.lca button,.lca input{font:inherit}
.lca .wrap{width:min(92%, var(--max));margin:0 auto}
.lca .narrow{width:min(92%, 820px);margin:0 auto}
.lca h1,.lca h2,.lca h3{margin:0;line-height:1.05;letter-spacing:-.03em}
.lca h1{font-size:clamp(2.6rem,6vw,5.4rem);font-weight:900;max-width:950px}
.lca h2{font-size:clamp(2rem,4.2vw,3.6rem);font-weight:850}
.lca h3{font-size:clamp(1.3rem,2.2vw,1.8rem);font-weight:800}
.lca p{margin:0;font-size:1.05rem;color:var(--ink-soft)}
.lca .lead{font-size:clamp(1.12rem,1.8vw,1.42rem);max-width:760px}
.lca .eyebrow{font-weight:850;letter-spacing:.09em;text-transform:uppercase;font-size:.8rem;color:var(--gold-dark)}

.lca .topbar{background:var(--sage-deep);color:#fff;font-weight:800;text-transform:uppercase;
  letter-spacing:.09em;font-size:.8rem;text-align:center;padding:12px 18px;position:sticky;top:0;z-index:100}

.lca .hero{padding:72px 0 64px;background:radial-gradient(circle at top right, rgba(201,162,74,.14), transparent 30%), var(--cream)}
.lca .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:56px;align-items:center}
.lca .hero-copy p{margin-top:22px}
.lca .trust-line{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:26px;color:var(--ink-soft);font-size:.95rem;font-weight:700}
.lca .trust-line span::before{content:"✓";color:var(--success);margin-right:8px;font-weight:900}
.lca .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--sage-deep);
  color:#fff;padding:16px 24px;border-radius:999px;font-weight:850;margin-top:28px;transition:.2s ease;
  border:1px solid var(--sage-deep);cursor:pointer;text-align:center}
.lca .btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(49,71,58,.15)}
.lca .btn.gold{background:var(--gold);border-color:var(--gold);color:#171717}
.lca .btn.full{width:100%;font-size:1.05rem;padding:18px 24px}
.lca .photo-card{border-radius:32px;overflow:hidden;box-shadow:var(--shadow);border:1px solid rgba(49,71,58,.08);
  position:relative;display:flex;align-items:flex-end;padding:22px;min-height:460px;
  background:linear-gradient(160deg, rgba(49,71,58,.06), rgba(201,162,74,.08)), #EDE7DC}
.lca .photo-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 22%}
.lca .photo-badge{position:relative;z-index:2;background:rgba(255,255,255,.93);border-radius:18px;padding:14px 16px;
  width:100%;font-weight:750;color:var(--ink);font-size:.95rem}

.lca section{padding:80px 0}
.lca .white{background:var(--white)}
.lca .deep{background:var(--sage-deep);color:#fff}
.lca .deep p{color:rgba(255,255,255,.78)}
.lca .deep h2,.lca .deep h3{color:#fff}
.lca .center{text-align:center}
.lca .center .lead{margin:20px auto 0}

.lca .strip{padding:24px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--white)}
.lca .strip-inner{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 28px;text-align:center;font-weight:800;color:var(--sage-deep)}

.lca .statement{padding:72px 0;background:var(--ink);color:#fff;text-align:center}
.lca .statement h2{max-width:850px;margin:0 auto;font-size:clamp(2.2rem,4.4vw,4rem);color:#fff}
.lca .statement p{color:rgba(255,255,255,.72);margin:22px auto 0;max-width:720px;font-size:1.15rem}

.lca .phases{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:44px}
.lca .phase{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:28px;box-shadow:0 10px 34px rgba(31,35,33,.04)}
.lca .phase .num{display:inline-flex;width:42px;height:42px;align-items:center;justify-content:center;border-radius:50%;
  background:var(--sage);color:var(--sage-deep);font-weight:900;margin-bottom:18px}
.lca .phase p{margin-top:12px}
.lca .phase ul{padding:0;margin:20px 0 0;list-style:none}
.lca .phase li{padding:10px 0;border-top:1px solid var(--soft);font-weight:650;color:#313633}

.lca .includes{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:40px}
.lca .include-item{display:flex;gap:14px;align-items:flex-start;background:#FCFBF8;border:1px solid var(--line);border-radius:18px;padding:20px}
.lca .check{width:26px;height:26px;flex:0 0 26px;border-radius:50%;background:var(--sage);color:var(--sage-deep);display:grid;place-items:center;font-weight:900}
.lca .include-item strong{display:block;margin-bottom:3px}
.lca .include-item span{color:var(--ink-soft);font-size:.95rem}

.lca .team{display:grid;grid-template-columns:.9fr 1.1fr;gap:52px;align-items:center}
.lca .team-photo{border-radius:28px;overflow:hidden;border:1px solid var(--line);background:#E9E2D5;min-height:420px}
.lca .team-photo img{width:100%;height:100%;object-fit:cover;min-height:420px;object-position:center 20%}
.lca .mini-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:26px}
.lca .mini{background:#F8F6F1;border:1px solid var(--line);border-radius:16px;padding:18px;font-weight:700}

.lca .proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:38px}
.lca .quote{background:#fff;border-radius:20px;padding:26px;border:1px solid var(--line);box-shadow:0 8px 26px rgba(31,35,33,.04)}
.lca .quote p{color:var(--ink);font-size:1rem;font-weight:650}
.lca .quote small{display:block;margin-top:16px;color:var(--ink-soft)}
.lca .disclaimer{font-size:.8rem;color:#777;margin-top:22px;text-align:center}

/* Brenda's story is a PORTRAIT phone video, so the card is 9:16 and capped,
   not the 16:9 box his mockup drew for a placeholder. */
.lca .video-proof{display:grid;grid-template-columns:1fr;max-width:400px;margin:36px auto 0}
.lca .video-card{background:#111;border-radius:22px;overflow:hidden;box-shadow:var(--shadow);border:1px solid rgba(31,35,33,.08)}
.lca .video-card video{width:100%;aspect-ratio:9/16;object-fit:cover;background:#111;display:block}
.lca .video-caption{background:#fff;padding:16px 18px}
.lca .video-caption strong{display:block}
.lca .video-caption span{display:block;color:var(--ink-soft);font-size:.9rem;margin-top:4px}

.lca .stack{margin-top:36px;border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#fff}
.lca .stack-row{display:flex;justify-content:space-between;gap:30px;padding:18px 24px;border-bottom:1px solid var(--soft)}
.lca .stack-row:last-child{border-bottom:none}
.lca .stack-row strong{font-weight:800}
.lca .stack-row span{color:var(--ink-soft)}
.lca .investment{margin-top:34px;text-align:center}
.lca .price{font-size:clamp(3.4rem,8vw,6.4rem);line-height:.9;font-weight:950;letter-spacing:-.06em;margin:16px 0 10px}
.lca .today{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:999px;background:var(--sage);color:var(--sage-deep);font-weight:850}

.lca .checkout-wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:42px;align-items:start}
.lca .steps{display:grid;gap:16px;margin-top:26px}
.lca .step{display:flex;gap:14px;align-items:flex-start}
.lca .step-num{width:32px;height:32px;flex:0 0 32px;border-radius:50%;background:var(--sage);color:var(--sage-deep);display:grid;place-items:center;font-weight:900}
.lca .checkout-card{background:#fff;border-radius:26px;padding:26px;border:1px solid var(--line);box-shadow:var(--shadow)}
.lca .checkout-mount{margin-top:18px;min-height:320px}
.lca .checkout-error{margin-top:14px;background:#FFF4F2;border:1px solid #E9C4BC;border-radius:12px;padding:14px;color:#8A3524;font-size:.94rem}
.lca .checkout-error a{text-decoration:underline;font-weight:800}
.lca .secure{margin-top:14px;font-size:.86rem;color:#6A706C;text-align:center}

.lca .guarantee-box{border:1px solid var(--gold);border-radius:30px;padding:48px;background:#FFFCF4;text-align:center;box-shadow:var(--shadow)}
.lca .guarantee-box .seal{width:72px;height:72px;border-radius:50%;background:var(--sage-deep);color:#fff;display:grid;place-items:center;margin:0 auto 20px;font-size:1.8rem;font-weight:900}
.lca .guarantee-box p{max-width:760px;margin:16px auto 0}
.lca .guarantee-quote{font-size:clamp(1.2rem,2.2vw,1.6rem);font-weight:800;color:var(--ink);max-width:720px;margin:14px auto 0}
.lca .guarantee-fine{font-size:.85rem;color:#777;margin-top:22px}

.lca .faq{margin-top:38px;border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#fff}
.lca .faq details{border-bottom:1px solid var(--soft)}
.lca .faq details:last-child{border-bottom:0}
.lca .faq summary{cursor:pointer;list-style:none;padding:18px 24px;font-weight:800;color:var(--ink);display:flex;justify-content:space-between;gap:16px;align-items:center;min-height:56px}
.lca .faq summary::-webkit-details-marker{display:none}
.lca .faq summary::after{content:"+";color:var(--gold-dark);font-weight:900}
.lca .faq details[open] summary::after{content:"–"}
.lca .faq .answer{padding:0 24px 20px;color:var(--ink-soft);font-size:.98rem}

.lca .bonus-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:40px}
.lca .bonus{border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:26px;background:rgba(255,255,255,.05)}
.lca .bonus h3{margin-bottom:8px}
.lca .bonus p{font-size:.98rem}

.lca .final{text-align:center;padding:80px 0 90px;background:var(--ink);color:#fff}
.lca .final h2{color:#fff}
.lca .final p{color:rgba(255,255,255,.7);margin:18px auto 0;max-width:720px;font-size:1.1rem}
.lca footer{background:#161917;color:#AAAFA9;text-align:center;padding:24px;font-size:.82rem}
.lca .footer-links{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
.lca .footer-links a{text-decoration:underline}

.lca .mobile-cta{display:none}

@media (max-width:900px){
  .lca .hero-grid,.lca .team,.lca .checkout-wrap{grid-template-columns:1fr}
  .lca .phases,.lca .proof-grid{grid-template-columns:1fr}
  .lca .includes,.lca .bonus-grid{grid-template-columns:1fr}
  .lca .photo-card{min-height:360px}
  .lca .team-photo,.lca .team-photo img{min-height:340px}
  .lca section{padding:64px 0}
  .lca .hero{padding:52px 0}
}
@media (max-width:580px){
  .lca .wrap,.lca .narrow{width:min(90%, var(--max))}
  .lca h1{font-size:clamp(2.2rem,11vw,3.2rem)}
  .lca .hero{padding:40px 0 48px}
  .lca .statement{padding:56px 0}
  .lca .guarantee-box{padding:30px 20px}
  .lca .stack-row{padding:16px 18px}
  .lca .checkout-card{padding:20px}
  .lca .topbar{font-size:.72rem}
  .lca .mobile-cta{display:block;position:fixed;left:0;right:0;bottom:0;z-index:120;background:rgba(31,35,33,.96);padding:10px 14px}
  .lca .mobile-cta a{display:block;text-align:center;background:var(--gold);color:#171717;font-weight:900;padding:14px;border-radius:999px}
  .lca .final{padding-bottom:110px}
}
@media (prefers-reduced-motion:reduce){ .lca *{transition:none !important} }
`;

export default function AllInPage() {
  const mountRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    track('allin_view', { page: 'allin', mode: 'checkout', design: 'v7' });
    const prev = document.title;
    document.title = 'The Life Change Accelerator | Secure Your Spot';
    const root = document.documentElement;
    const prevScroll = root.style.scrollBehavior;
    root.style.scrollBehavior = 'smooth';
    return () => {
      document.title = prev;
      root.style.scrollBehavior = prevScroll;
    };
  }, []);

  // ─── the real checkout. $500 deposit, tier allin-deposit. ─────────────
  // No balancePlan is sent on purpose: this page does not ask her to pick a
  // schedule, so /payment opens on "settle in full" and she chooses there.
  useEffect(() => {
    let checkout;
    let cancelled = false;
    setError('');

    async function mount() {
      if (!stripePromise) {
        setError('Checkout is not configured yet.');
        return;
      }
      try {
        const res = await fetch('/api/create-embedded-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'allin-deposit',
            distinctId: getDistinctId(),
            abHomeVariant: getAbHomeVariant(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Could not start checkout');
        if (cancelled) return;
        const stripe = await stripePromise;
        if (cancelled) return;
        checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        if (cancelled) { checkout.destroy(); return; }
        if (mountRef.current) {
          mountRef.current.innerHTML = '';
          checkout.mount(mountRef.current);
          track('allin_checkout_mounted', { tier: 'allin-deposit' });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start checkout. Please try again.');
      }
    }
    mount();
    return () => {
      cancelled = true;
      try { checkout?.destroy(); } catch { /* already gone */ }
    };
  }, []);

  return (
    <div className="lca">
      <style>{CSS}</style>

      <div className="topbar">{`${SPOTS} spots are open`}</div>

      <header className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>The Life Change Accelerator™</h1>
            <p className="lead">
              <strong>Lower your numbers. Feel better. Get your life back.</strong>
              <br /><br />
              Over the next 90 days, we help you use proven, evidence-based lifestyle changes to
              support healthier blood pressure, blood sugar, A1C, weight, hormones, cholesterol, and
              other numbers that may be keeping you stuck.
            </p>

            <div className="trust-line">
              <span>A plan made for you</span>
              <span>Evidence-based lifestyle methods</span>
              <span>Weekly help + live Q&amp;A</span>
            </div>

            <a href="#journey" className="btn">See How We Help You Change Your Numbers ↓</a>
          </div>

          <div className="photo-card">
            <img src={heroImg} alt="Annie Chitate, RN and Joel Polley, RN" />
            <div className="photo-badge">Annie + Joel · Registered Nurses · Your 90-Day Support Team</div>
          </div>
        </div>
      </header>

      <section className="strip">
        <div className="wrap strip-inner">
          <span>Blood Pressure</span>
          <span>Blood Sugar / A1C</span>
          <span>Weight</span>
          <span>Hormones</span>
          <span>Cholesterol</span>
          <span>Energy</span>
        </div>
      </section>

      <section className="statement">
        <div className="narrow">
          <h2>Do less.<br />In the right order.</h2>
          <p>
            You do not need more things to try. You need to know what to do first, what to do next,
            and who to ask when you need help.
          </p>
        </div>
      </section>

      <section id="journey">
        <div className="wrap">
          <div className="center">
            <h2>Your next 90 days can be simple.</h2>
            <p className="lead">
              We help you focus on the changes most likely to move your numbers in the right
              direction. Then we help you stay with them long enough to see what works for your body.
            </p>
          </div>

          <div className="phases">
            {PHASES.map((p) => (
              <article className="phase" key={p.n}>
                <div className="num">{p.n}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="white">
        <div className="wrap">
          <div className="center">
            <h2>You will know what to do next, and why it matters.</h2>
          </div>
          <div className="includes">
            {INCLUDES.map(([title, body]) => (
              <div className="include-item" key={title}>
                <div className="check">✓</div>
                <div><strong>{title}</strong><span>{body}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap team">
          <div className="team-photo">
            <img src={heroImg} alt="Annie Chitate, RN and Joel Polley, RN" />
          </div>
          <div>
            <h2>You will have real people to help you.</h2>
            <p className="lead" style={{ marginTop: 20 }}>
              You will not get a pile of lessons and get left alone. Annie and Joel will help you
              understand your numbers, choose your next steps, and stay with the plan. We also bring
              in other experts when they can help.
            </p>
            <div className="mini-grid">
              <div className="mini">Annie + Joel, RNs</div>
              <div className="mini">Naturopathic support</div>
              <div className="mini">Trauma expertise</div>
              <div className="mini">Experienced nursing guidance</div>
            </div>
          </div>
        </div>
      </section>

      <section className="white" id="proof">
        <div className="wrap">
          <div className="center">
            <h2>Real women. Real changes.</h2>
          </div>

          <div className="video-proof">
            <article className="video-card">
              <video
                controls
                playsInline
                preload="none"
                poster="/video/brenda-bp-win-poster.jpg"
                onPlay={() => track('allin_proof_video_play', { video: 'brenda-bp-win' })}
              >
                <source src="/video/brenda-bp-win.mp4" type="video/mp4" />
              </video>
              <div className="video-caption">
                <strong>Brenda</strong>
                <span>Her blood pressure story, in her own words.</span>
              </div>
            </article>
          </div>

          <div className="proof-grid">
            {QUOTES.map(([q, who]) => (
              <article className="quote" key={who}>
                <p>{`“${q}”`}</p>
                <small>{`— ${who}`}</small>
              </article>
            ))}
          </div>

          <div className="disclaimer">
            Health outcomes differ by person. Medication decisions should be made with the
            prescribing clinician.
          </div>
        </div>
      </section>

      <section className="white" style={{ paddingTop: 0 }}>
        <div className="narrow">
          <div className="center">
            <h2>Everything you need to work on your numbers is here.</h2>
            <p className="lead">
              You get the plan. You get the coaching. You get support. And when your numbers,
              symptoms, or progress raise a question, you have a place to ask.
            </p>
          </div>

          <div className="stack">
            {STACK.map((row) => (
              <div className="stack-row" key={row}><strong>{row}</strong><span>Included</span></div>
            ))}
          </div>

          <div className="investment">
            <div className="eyebrow" style={{ marginTop: 40 }}>Your investment</div>
            <div className="price">{PRICE}</div>
            <p>{`The full 90-day program is ${PRICE}.`}</p>
            <div className="today">{`Start today for ${DEPOSIT}`}</div>
            <p style={{ marginTop: 16, fontSize: '.92rem' }}>
              {`Your ${DEPOSIT} saves your spot and comes off the total. The remaining ${BALANCE} goes on the payment schedule you choose, with terms available up to 12 months. Paying in full is the cheapest route.`}
            </p>
          </div>
        </div>
      </section>

      <section id="checkout">
        <div className="wrap checkout-wrap">
          <div>
            <h2>If you are ready, this part is easy.</h2>
            <p className="lead" style={{ marginTop: 20 }}>
              {`Put down ${DEPOSIT} today to save your spot. We will show you what happens next.`}
            </p>

            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div><strong>Save your spot.</strong><p>{`Pay ${DEPOSIT} today.`}</p></div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div><strong>Choose your terms.</strong><p>{`Pick how you want to handle the ${BALANCE} balance.`}</p></div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div><strong>Start your 90 days.</strong><p>We will help you start your plan.</p></div>
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <h3>Secure My Spot</h3>
            <p style={{ marginTop: 8 }}>{`${DEPOSIT} enrollment payment`}</p>

            <div className="checkout-mount" ref={mountRef} />
            {error && (
              <div className="checkout-error">
                {error}{' '}
                <a href="mailto:braveworksrn@gmail.com">Email us</a> and we will send you a working
                payment link by hand.
              </div>
            )}

            <div className="secure">{`🔒 Secure checkout · ${SPOTS} spots currently available`}</div>
          </div>
        </div>
      </section>

      <section className="deep">
        <div className="wrap">
          <div className="center"><h2>We made room for real life.</h2></div>
          <div className="bonus-grid">
            {BONUSES.map(([title, body]) => (
              <div className="bonus" key={title}><h3>{title}</h3><p>{body}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="narrow">
          <div className="guarantee-box">
            <div className="seal">✓</div>
            <h2>Give Us 90 Days.</h2>
            <p className="guarantee-quote">{GUARANTEE}</p>
            <p>
              Come in. Follow your plan. Show up for the coaching. Ask for help when you need it.
              Give the process an honest 90 days.
            </p>
            <p><strong>You do the work. We will do ours.</strong></p>
            <div className="guarantee-fine">
              This guarantee does not promise a specific medical result and does not replace
              individualized medical care. Individual outcomes vary. Never stop or change prescribed
              medication without your prescribing clinician.
            </div>
          </div>

          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <div className="answer">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final">
        <div className="narrow">
          <h2>You still have a lot of life to live.</h2>
          <p>This starts with your numbers, but it is really about what better health lets you do next.</p>
          <p style={{ marginTop: 24, color: '#F4F2EC', fontWeight: 700 }}>
            Be there. Enjoy your family. Take the trip. Do the work you love. Live your life.
          </p>
          <a href="#checkout" className="btn gold">{`Save My Spot · ${DEPOSIT}`}</a>
        </div>
      </section>

      <div className="mobile-cta">
        <a href="#checkout">{`Secure My Spot · ${DEPOSIT} Today`}</a>
      </div>

      <footer>
        <div className="footer-links">
          <a href="/terms">Program Terms</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="mailto:braveworksrn@gmail.com">Contact Support</a>
        </div>
        <div>
          The Life Change Accelerator is an educational and coaching program and is not a substitute
          for diagnosis, treatment, or medical care from your licensed healthcare professional.
          Individual results vary. If you have an urgent or emergency medical concern, seek
          appropriate medical care immediately.
        </div>
      </footer>
    </div>
  );
}
