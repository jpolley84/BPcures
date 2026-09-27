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
import scrubsImg from '../assets/annie-joel-scrubs-real.jpg';
import teachingImg from '../assets/annie-joel-teaching-crop.jpg';

const pk = STRIPE_PUBLISHABLE_KEY();
const stripePromise = pk ? loadStripe(pk) : null;

// ─── the numbers. One place each. ────────────────────────────────────────
const PRICE = '$7,500';
const DEPOSIT = '$500';
const BALANCE = '$7,000';
const CORE_VALUE = '$23,197';   // sum of STACK
const TOTAL_VALUE = '$35,197';  // CORE_VALUE + the bonuses

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

// ⚠️ NUMBER-BASED PROOF. Every quote is verbatim from a named source, checked
// against the file before publishing. Joel approved each one 2026-09-27.
//   Brenda  : 2026-09-23 Life Change Accelerator call, Whisper transcript.
//             She is STILL ON her medication and reads before her morning dose.
//             That caveat travels with the quote. Never imply she is off it.
//   Eunice  : 2026-08-26 one-on-one, Zoom transcript 13:37:04.
//   Stella  : 2026-08-26 one-on-one, Zoom transcript 09:12:56 and 09:12:58 (kg).
//   Alicia  : 2026-07-22 one-on-one, Zoom transcript 15:00:58.
//   Drago + "124/80": already published by Joel on the challenge page.
//   The 67-year-old woman: the slide Joel read aloud on the 2026-09-24 call.
//             She is unnamed in the source, so she stays unnamed here.
const QUOTES = [
  {
    text: 'My blood pressure the past five days have been between 97 and 117 over 74 and 65.',
    who: 'Brenda',
    stat: '97-117 / 65-74',
    note: 'Readings taken each morning before her blood pressure medication. She remains on it.',
  },
  {
    text: "It's 5 something now. It's not 6. I'm not borderline.",
    who: 'Eunice',
    stat: 'A1C 6.x to 5.8',
  },
  {
    text: '14 pills a day to seven pills a day.',
    who: 'Community member, 67',
    stat: '14 pills to 7',
  },
  {
    text: 'Averaging 113 over 68 from 140 with 14 pills a day.',
    who: 'Community member, 67',
    stat: '140 to 113/68',
  },
  {
    text: 'A1C went from 8 to 5.8 now without medication.',
    who: 'Community member, 67',
    stat: 'A1C 8.0 to 5.8',
    note: 'Medication decisions were made with her own prescribing clinician.',
  },
  {
    text: 'Before, I used to wear 103. But now I weigh 100.',
    who: 'Stella',
    stat: '103 kg to 98 kg',
    note: 'She reported 98 kg later in the same call.',
  },
  {
    text: 'Yeah, getting off, because I was on two, and now they put me on one.',
    who: 'Alicia',
    stat: '2 BP meds to 1',
  },
  {
    text: 'From my 20s to now being 67yo, being on 3 blood pressure meds, you have been the only person that has ever made any impact in my BP journey.',
    who: 'Drago, 67',
    stat: '40 years, 3 BP meds',
  },
  {
    text: 'My blood pressure is back to normal: 124/80. Reduced salt, started little exercises.',
    who: 'BraveWorks community member',
    stat: '124/80',
  },
];

// Russell-style stack. The line values come from the 2026-09-24 call, where
// Annie announced the program at $23,197 and $35,197 with the bonuses.
// Phase 1 ($5,700) and Phase 2 ($11,500) are exactly as spoken. Phase 3 was
// spoken as "$25,000", which cannot be right: it alone exceeds the $23,197
// subtotal she announced two minutes later. Joel chose (09-27) to keep the
// totals buyers actually heard, so the remaining $5,997 of the subtotal is
// split across phase 3, the expert access and Easy-Fit, and the bonuses carry
// the $12,000 that separates $23,197 from $35,197.
// ⚠️ Every column must keep adding up. CORE_VALUE = sum of STACK values.
// TOTAL_VALUE = CORE_VALUE + sum of BONUSES values.
const STACK = [
  ['Phase 1: Reset and rebuild your body', '$5,700', 'Your health review, the Life Change Blueprint, the family-friendly meal plan, herbs and supplements guidance.'],
  ['Phase 2: Renew your body', '$11,500', 'The Steady Numbers Blueprint, symptom decoding, movement that fits your body, and how to talk to your doctor.'],
  ['Phase 3: Reclaim your future', '$3,500', 'Bring Sexy Back, healing from the past, and the Food That Loves You Back playbook.'],
  ['Exclusive access to the expert team', '$1,497', 'Naturopaths, a trauma expert, 36 years of nursing between Annie and Joel, plus paid guest experts.'],
  ['The Easy-Fit System', '$1,000', 'About 15 minutes a day, built from walking, and doable from a chair.'],
];

const BONUSES = [
  ['One Year of Access', '$4,000', 'The coaching is 90 days. Your access runs a year, because life happens and you should not have to start over alone.'],
  ['The Healing Circle', '$3,000', 'Community, daily support, accountability and guidance.'],
  ['Know Your Labs', '$2,000', 'Understand your numbers and know the stronger questions to ask your doctor.'],
  ['Two For One', '$2,000', 'Bring your spouse or a family member at no extra cost.'],
  ['Fast action: Skin + Hair Regimen', '$500', 'Make your own natural skin and hair products with Annie, and learn how to sell what you make.'],
  ['Fast action: One-on-one session', '$500', 'Everyone gets one. Personal eyes on your situation.'],
];

const FAQ = [
  ['What am I paying today?', `${DEPOSIT} today. It is credited toward the full ${PRICE} Life Change Accelerator investment.`],
  ['What happens with the remaining balance?', `After your ${DEPOSIT} deposit, the remaining ${BALANCE} goes on the payment schedule you choose. Terms are available up to 12 months, and you pick yours on the next page. Paying in full is the cheapest route, and third-party financing counts as paying in full.`],
  ['Is the deposit refundable if I change my mind?', `Yes, within 24 hours. Spots are limited, so if you change your mind we refund the ${DEPOSIT} and your spot opens back up for someone else.`],
  ['Do I have to fill out the application first?', 'No. You can go straight to checkout and secure your spot. The application is really more for you than for us: it puts you in the mindset of deciding whether you want this and why.'],
  ['Is this a video course?', 'No. There is no video library to work through. Between Joel and Annie there are about a thousand videos online already, and the point of this program is that you do not have to watch them. You get coaching that works at your pace and gives you what you need, when you need it.'],
  ['Does it include all four phases?', 'Yes. All four phases, the 90 days of coaching, and a full year of access to the community and the weekly Q&A.'],
  ['Will this work for me? My situation is different.', 'That is the first thing we look at. Your health review comes first, and the plan is built around your body, your history and what you can actually do. If your situation needs care beyond coaching, we say so and help you find it.'],
  ['What if I am dealing with a serious diagnosis?', 'This is coaching and education alongside your medical team, never a replacement for it. We help you work on the food, movement, sleep and stress side, and we reassess with you as you go. Keep your doctor in the loop, and never stop or change prescribed medication on your own.'],
  ['When does the program start?', 'You are added to the group and the community after you enroll, and the weekly coaching and Q&A begin from there.'],
];

// His stylesheet, scoped. Every rule that was bare (body, h1, section,
// footer, input, details) now hangs off `.lca` so it cannot escape this page.
const CSS = `
.lca{
  --ink:#182a27; --ink-soft:#354b47; --muted:#536560;
  --cream:#F7F4EC; --white:#fff; --soft:#EFEBE2; --line:#DDD6C8;
  --navy:#103a36; --navy-2:#082825; --teal:#23675f; --teal-soft:#e7f0e9;
  --gold:#C9A24A; --gold-dark:#9D7A2F; --coral:#c9513e;
  --shadow:0 12px 34px rgba(24,42,39,.08); --radius:18px; --max:1120px;
  font-family:Arial,Helvetica,sans-serif; color:var(--ink); background:var(--cream);
  line-height:1.6; -webkit-font-smoothing:antialiased;
}
.lca *,.lca *::before,.lca *::after{box-sizing:border-box}
.lca img{max-width:100%;display:block}
.lca a{text-decoration:none;color:inherit}
.lca button,.lca input{font:inherit}
.lca .wrap{width:min(calc(100% - 44px),var(--max));margin:0 auto}
.lca .narrow{width:min(calc(100% - 44px),820px);margin:0 auto}

/* one type scale, used everywhere */
.lca h1,.lca h2,.lca h3{margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--navy-2);
  line-height:1.08;letter-spacing:-.02em;font-weight:700;overflow-wrap:break-word;text-wrap:balance}
.lca h1{font-size:clamp(2.1rem,3.6vw,3.1rem)}
.lca h2{font-size:clamp(1.75rem,2.8vw,2.4rem);margin-bottom:14px}
.lca h3{font-size:clamp(1.15rem,1.6vw,1.35rem)}
.lca p{margin:0;font-size:1.05rem;color:var(--ink-soft);text-wrap:pretty}
.lca .lead{font-size:clamp(1.1rem,1.5vw,1.3rem);max-width:720px;color:var(--ink)}
.lca .eyebrow{font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:.76rem;color:var(--teal);margin-bottom:12px}
.lca .center{text-align:center}
.lca .center .lead{margin:0 auto}
.lca .center h2{margin-left:auto;margin-right:auto;max-width:820px}

.lca section{padding:72px 0}
.lca .white{background:var(--white)}
.lca .deep{background:var(--navy-2);color:#fff}
.lca .deep h2,.lca .deep h3{color:#fff}
.lca .deep p{color:rgba(255,255,255,.8)}

.lca .topbar{background:var(--navy-2);color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.08em;
  font-size:.78rem;text-align:center;padding:10px 16px;position:sticky;top:0;z-index:100}

/* buttons: one style, two colours */
.lca .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 24px;border-radius:8px;
  font-weight:800;font-size:1rem;border:2px solid var(--coral);background:var(--coral);color:#fff;cursor:pointer;
  text-align:center;line-height:1.2;transition:.15s ease;min-height:52px}
.lca .btn:hover{background:#a43b2e;border-color:#a43b2e}
.lca .btn.gold{background:var(--coral);border-color:var(--coral);color:#fff}
.lca .btn.ghost{background:transparent;color:var(--navy-2);border-color:var(--line)}
.lca .btn.ghost:hover{background:#fff;border-color:var(--navy-2)}
.lca .btn.full{width:100%}

/* hero */
.lca .hero{padding:56px 0 60px;background:var(--cream);border-bottom:1px solid var(--line)}
.lca .hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:48px;align-items:center}
.lca .hero-copy .lead{margin-top:14px}
.lca .hero-sub{margin-top:14px;max-width:640px;font-size:1.05rem}
.lca .trust-line{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:22px;color:var(--ink-soft);font-size:.92rem;font-weight:700}
.lca .trust-line span::before{content:"✓";color:var(--teal);margin-right:7px;font-weight:900}
.lca .hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.lca .hero-photo{margin:0;justify-self:end;width:min(100%,420px)}
.lca .hero-photo img{width:100%;height:auto;border-radius:var(--radius);box-shadow:var(--shadow);aspect-ratio:644/1063;object-fit:cover;max-height:520px;object-position:top}
.lca .hero-photo figcaption{margin-top:10px;font-size:.84rem;color:var(--muted);text-align:center}

.lca .strip{padding:18px 0;background:var(--white);border-bottom:1px solid var(--line)}
.lca .strip-inner{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;text-align:center;font-weight:800;font-size:.9rem;color:var(--navy)}

.lca .statement{padding:60px 0;background:var(--navy-2);color:#fff;text-align:center}
.lca .statement h2{max-width:760px;margin:0 auto;color:#fff}
.lca .statement p{color:rgba(255,255,255,.78);margin:16px auto 0;max-width:680px;font-size:1.1rem}

/* three phases */
.lca .phases{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:36px}
.lca .phase{background:#fff;border:1px solid var(--line);border-top:4px solid var(--coral);border-radius:var(--radius);padding:24px}
.lca .phase .num{display:inline-flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:50%;
  background:var(--teal-soft);color:var(--teal);font-weight:900;margin-bottom:14px;font-family:Arial,sans-serif}
.lca .phase p{margin-top:10px;font-size:.98rem}
.lca .phase ul{padding:0;margin:16px 0 0;list-style:none}
.lca .phase li{padding:9px 0;border-top:1px solid var(--soft);font-weight:700;color:var(--ink);font-size:.95rem}

.lca .includes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:34px}
.lca .include-item{display:flex;gap:12px;align-items:flex-start;background:#FCFBF8;border:1px solid var(--line);border-radius:14px;padding:16px}
.lca .check{width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-weight:900;font-size:.85rem}
.lca .include-item strong{display:block;margin-bottom:2px;color:var(--ink)}
.lca .include-item span{color:var(--ink-soft);font-size:.92rem;line-height:1.5}

/* the team */
.lca .team{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:44px;align-items:center}
.lca .team > *,.lca .checkout-wrap > *{min-width:0}
.lca .team-photo{border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow)}
.lca .team-photo img{width:100%;height:auto;aspect-ratio:897/505;object-fit:cover}
.lca .team .lead{margin-top:14px}
.lca .mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}
.lca .mini{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-weight:700;font-size:.95rem}

/* proof: the challenge page's cards, to the letter */
.lca .video-proof{display:grid;grid-template-columns:1fr;max-width:360px;margin:32px auto 0}
.lca .video-card{background:#111;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--line)}
.lca .video-card video{width:100%;aspect-ratio:9/16;object-fit:cover;background:#111;display:block}
.lca .video-caption{background:#fff;padding:14px 16px}
.lca .video-caption strong{display:block;color:var(--ink)}
.lca .video-caption span{display:block;color:var(--ink-soft);font-size:.88rem;margin-top:3px}
.lca .testimonials{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:34px}
.lca .testimonial{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px 22px 20px;position:relative;display:flex;flex-direction:column}
.lca .testimonial::before{content:"★★★★★";display:block;color:var(--gold);letter-spacing:.18em;font-size:.9rem;font-weight:900;margin-bottom:12px}
.lca .testimonial blockquote{font-family:Georgia,"Times New Roman",serif;font-size:1.12rem;line-height:1.42;margin:0 0 12px;color:var(--ink);flex:1}
.lca .testimonial cite{font-style:normal;font-weight:800;color:var(--muted);font-size:.86rem;display:block}
.lca .t-note{display:block;margin-top:8px;font-size:.8rem;color:var(--muted);line-height:1.45}
.lca .disclaimer{font-size:.8rem;color:var(--muted);margin-top:20px;text-align:center}

/* the stack */
.lca .stack{margin-top:32px;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff}
.lca .stack-row{display:flex;justify-content:space-between;gap:24px;padding:16px 22px;border-bottom:1px solid var(--soft)}
.lca .stack-row:last-child{border-bottom:0}
.lca .stack-row > div{display:flex;flex-direction:column;gap:3px}
.lca .stack-row strong{color:var(--ink)}
.lca .stack-detail{color:var(--ink-soft);font-size:.9rem;line-height:1.45}
.lca .stack-value{font-weight:900;color:var(--teal);white-space:nowrap;font-variant-numeric:tabular-nums;font-family:Georgia,serif;font-size:1.05rem}
.lca .bonus-row{background:#FFFCF4}
.lca .bonus-row .stack-value{color:var(--gold-dark)}
.lca .stack-total{background:var(--navy-2);color:#fff}
.lca .stack-total strong{color:#fff}
.lca .stack-total .stack-value{color:#fff;font-size:1.25rem}
.lca .investment{margin-top:32px;text-align:center}
.lca .value-line{font-weight:800;color:var(--ink)}
.lca .price{font-family:Georgia,"Times New Roman",serif;font-size:clamp(3.4rem,7vw,5.6rem);line-height:.95;font-weight:700;color:var(--coral);letter-spacing:-.03em;margin:12px 0 8px}
.lca .today{display:inline-block;margin-top:16px;padding:10px 16px;border-radius:999px;background:var(--teal-soft);color:var(--teal);font-weight:800}

/* checkout */
.lca .checkout-wrap{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:40px;align-items:start}
.lca .steps{display:grid;gap:14px;margin-top:22px}
.lca .step{display:flex;gap:12px;align-items:flex-start}
.lca .step-num{width:30px;height:30px;flex:0 0 30px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-weight:900;font-size:.9rem}
.lca .step strong{color:var(--ink)}
.lca .checkout-card{background:#fff;border-radius:var(--radius);padding:24px;border:1px solid var(--line);box-shadow:var(--shadow)}
.lca .checkout-mount{margin-top:16px;min-height:320px}
.lca .checkout-error{margin-top:14px;background:#FFF4F2;border:1px solid #E9C4BC;border-radius:12px;padding:14px;color:#8A3524;font-size:.94rem}
.lca .checkout-error a{text-decoration:underline;font-weight:800}
.lca .secure{margin-top:12px;font-size:.84rem;color:var(--muted);text-align:center}

/* bonuses band */
.lca .bonus-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:34px}
.lca .bonus{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:22px;background:rgba(255,255,255,.05)}
.lca .bonus h3{margin-bottom:6px;font-size:1.15rem}
.lca .bonus-value{color:#E7D28C;font-weight:900;font-size:.88rem;margin-bottom:8px;font-family:Arial,sans-serif}
.lca .bonus p{font-size:.95rem}

/* guarantee + faq */
.lca .guarantee-box{border:1px solid var(--gold);border-radius:var(--radius);padding:40px;background:#FFFCF4;text-align:center;box-shadow:var(--shadow)}
.lca .guarantee-box .seal{width:60px;height:60px;border-radius:50%;background:var(--teal);color:#fff;display:grid;place-items:center;margin:0 auto 16px;font-size:1.5rem;font-weight:900}
.lca .guarantee-box p{max-width:680px;margin:14px auto 0}
.lca .guarantee-quote{font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.15rem,2vw,1.5rem);font-weight:700;color:var(--navy-2)}
.lca .guarantee-fine{font-size:.82rem;color:var(--muted);margin-top:18px}
.lca .faq{margin-top:32px;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff}
.lca .faq details{border-bottom:1px solid var(--soft)}
.lca .faq details:last-child{border-bottom:0}
.lca .faq summary{cursor:pointer;list-style:none;padding:16px 22px;font-weight:800;color:var(--ink);display:flex;justify-content:space-between;gap:16px;align-items:center;min-height:54px}
.lca .faq summary::-webkit-details-marker{display:none}
.lca .faq summary::after{content:"+";color:var(--teal);font-weight:900;font-size:1.1rem}
.lca .faq details[open] summary::after{content:"–"}
.lca .faq .answer{padding:0 22px 18px;color:var(--ink-soft);font-size:.96rem;line-height:1.6}

.lca .final{text-align:center;padding:72px 0 84px;background:var(--navy-2);color:#fff}
.lca .final h2{color:#fff}
.lca .final p{color:rgba(255,255,255,.78);margin:16px auto 0;max-width:680px;font-size:1.08rem}
.lca .final .btn{margin-top:26px}
.lca footer{background:#061d1b;color:#AAB4B0;text-align:center;padding:22px;font-size:.8rem;line-height:1.55}
.lca .footer-links{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
.lca .footer-links a{text-decoration:underline}
.lca .mobile-cta{display:none}

@media (max-width:1024px){
  .lca .includes,.lca .bonus-grid,.lca .testimonials{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:900px){
  .lca .hero-grid,.lca .team,.lca .checkout-wrap{grid-template-columns:1fr}
  .lca .hero-photo{justify-self:center;width:min(100%,360px)}
  .lca .hero-photo img{max-height:440px}
  .lca .phases{grid-template-columns:1fr}
  .lca section{padding:56px 0}
  .lca .hero{padding:40px 0 44px}
}
@media (max-width:640px){
  .lca .wrap,.lca .narrow{width:calc(100% - 40px)}
  .lca .includes,.lca .bonus-grid,.lca .testimonials{grid-template-columns:1fr}
  .lca h1{font-size:2rem}
  .lca .hero{padding:30px 0 36px}
  .lca .hero-actions .btn{width:100%}
  .lca .statement{padding:44px 0}
  .lca .guarantee-box{padding:26px 18px}
  .lca .stack-row{flex-direction:column;gap:6px;padding:14px 16px}
  .lca .stack-value{align-self:flex-start}
  .lca .checkout-card{padding:18px}
  .lca .topbar{font-size:.7rem}
  .lca .mobile-cta{display:block;position:fixed;left:0;right:0;bottom:0;z-index:120;background:rgba(8,40,37,.97);padding:10px 14px}
  .lca .mobile-cta a{display:block;text-align:center;background:var(--coral);color:#fff;font-weight:900;padding:14px;border-radius:8px;min-height:52px}
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
            <div className="eyebrow">90-day nurse-led coaching</div>
            <h1>The Life Change Accelerator™</h1>
            <p className="lead">
              <strong>Lower your numbers. Feel better. Get your life back.</strong>
            </p>
            <p className="hero-sub">
              Over the next 90 days, we help you use proven, evidence-based lifestyle changes to
              support healthier blood pressure, blood sugar, A1C, weight, hormones, cholesterol, and
              other numbers that may be keeping you stuck.
            </p>

            <div className="trust-line">
              <span>A plan made for you</span>
              <span>Evidence-based lifestyle methods</span>
              <span>Weekly help + live Q&amp;A</span>
            </div>

            <div className="hero-actions">
              <a href="#checkout" className="btn gold">{`Save My Spot · ${DEPOSIT}`}</a>
              <a href="#journey" className="btn ghost">See how it works ↓</a>
            </div>
          </div>

          <figure className="hero-photo">
            <img src={scrubsImg} alt="Annie Chitate, RN and Joel Polley, RN in scrubs" width="644" height="1063" />
            <figcaption>Annie + Joel · Registered Nurses · Your 90-day support team</figcaption>
          </figure>
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
            <img src={teachingImg} alt="Annie and Joel teaching a live class" width="897" height="505" />
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

          <div className="testimonials">
            {QUOTES.map((q) => (
              <article className="testimonial" key={q.who + q.text.slice(0, 14)}>
                <blockquote>{`“${q.text}”`}</blockquote>
                <cite>{q.who}</cite>
                {q.note && <span className="t-note">{q.note}</span>}
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
            {STACK.map(([name, value, detail]) => (
              <div className="stack-row" key={name}>
                <div><strong>{name}</strong><span className="stack-detail">{detail}</span></div>
                <span className="stack-value">{value}</span>
              </div>
            ))}
            {BONUSES.map(([name, value, detail]) => (
              <div className="stack-row bonus-row" key={name}>
                <div><strong>{`Bonus: ${name}`}</strong><span className="stack-detail">{detail}</span></div>
                <span className="stack-value">{value}</span>
              </div>
            ))}
            <div className="stack-row stack-total">
              <div><strong>Total value</strong></div>
              <span className="stack-value">{TOTAL_VALUE}</span>
            </div>
          </div>

          <div className="investment">
            <div className="eyebrow" style={{ marginTop: 40 }}>Your investment</div>
            <p className="value-line">{`The program alone is valued at ${CORE_VALUE}. With the bonuses, ${TOTAL_VALUE}.`}</p>
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
            {BONUSES.map(([title, value, body]) => (
              <div className="bonus" key={title}>
                <h3>{title}</h3>
                <div className="bonus-value">{`${value} value`}</div>
                <p>{body}</p>
              </div>
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
