// /coaching-vip — the coaching funnel OPT-IN page (page 1 of 3).
//
// 2026-07-09: modeled on the opt-in-page structure Joel referenced
// (everydaynurseannie.com/optin-page): an email-FIRST landing page that
// captures the lead before the offer, then a long-form pitch (the guide, what
// you get, who it is for, social proof) with the email CTA repeated. Email
// submit captures the lead into the bwbp:drip nurture (api/capture-lead) and
// routes to /coaching (the offers / step 2). /apply is step 3 for the $1,997.
//
// Honest-scarcity only (no fabricated "100 spots"), no fabricated testimonials,
// no clinical/outcome claims, NEWSTART-clean, ZERO em-dashes in visible copy.
// Visual language mirrors CoachingPage.jsx (paper/ink/clay/gold, Fraunces
// italic display, gold hairlines, framer-motion reveals, reduced-motion safe).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Stethoscope, ShieldCheck, Mail } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SERIF = "'Fraunces', 'Times New Roman', serif";

function GoldHairline() {
  return <div aria-hidden="true" className="optin-hairline" />;
}

// Email-capture form. Best-effort lead capture, then routes to /coaching (the
// offers). A capture failure never blocks the visitor from reaching the offer.
function EmailCapture({ reduce, big }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) { if (!valid) setErr('Enter a valid email so Joel can reach you.'); return; }
    setBusy(true);
    setErr('');
    try {
      await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim(), source: 'coaching-optin', tags: ['coaching-interested'] }),
      });
    } catch { /* never block the visitor on a capture failure */ }
    navigate('/coaching-offers');
  }

  return (
    <form onSubmit={submit} noValidate style={{ maxWidth: big ? 520 : 480, margin: big ? '0 auto' : '0' }}>
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <input
          className="optin-input"
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          aria-label="First name"
        />
        <input
          className="optin-input"
          type="email"
          placeholder="Your best email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (err) setErr(''); }}
          aria-label="Email address"
        />
        <button
          type="submit"
          className="optin-cta"
          disabled={busy}
          style={{ background: 'var(--clay-hover)', color: '#FFFFFF', border: 'none', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'One moment...' : 'Show me the coaching'}
          {!busy && <ArrowRight size={17} className="optin-cta-arrow" />}
        </button>
      </div>
      {err && <p style={{ color: 'var(--clay-hover)', fontSize: '0.85rem', margin: '0.5rem 0 0', fontWeight: 600 }}>{err}</p>}
      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
        No spam. Just the coaching details and Joel's Triangle teaching. Unsubscribe anytime.
      </p>
    </form>
  );
}

export default function CoachingOptinPage() {
  const reduce = useReducedMotion();

  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <style>{`
        .optin-hairline { height:1px; width:100%; border:0;
          background: linear-gradient(90deg, transparent, rgba(200,162,82,0.55) 22%, rgba(200,162,82,0.55) 78%, transparent); }
        .optin-input { width:100%; padding:14px 16px; font-size:1rem; line-height:1.5;
          border:1px solid var(--line); border-radius:10px; background:#FFFFFF; color:var(--ink);
          font-family:inherit; box-sizing:border-box; outline:none;
          transition:border-color .3s var(--ease-out), box-shadow .3s var(--ease-out); }
        .optin-input::placeholder { color:var(--muted); opacity:1; }
        .optin-input:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(200,162,82,0.2); }
        .optin-cta { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;
          padding:15px 22px; border-radius:10px; font-weight:700; font-size:1.05rem; letter-spacing:0.01em;
          transition:transform .3s var(--ease-out), box-shadow .3s var(--ease-out); }
        .optin-cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 30px -12px rgba(164,75,40,0.55); }
        .optin-cta .optin-cta-arrow { transition:transform .3s var(--ease-out); }
        .optin-cta:hover:not(:disabled) .optin-cta-arrow { transform:translateX(4px); }
        .optin-card { transition:transform .3s var(--ease-out), box-shadow .3s var(--ease-out), border-color .3s var(--ease-out); }
        .optin-card:hover { transform:translateY(-3px); box-shadow:0 18px 40px -22px rgba(18,17,16,0.22); border-color:var(--gold); }
        @media (prefers-reduced-motion: reduce) {
          .optin-cta:hover, .optin-card:hover { transform:none; }
        }
      `}</style>

      {/* ─── HERO (email first) ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <motion.div {...rise(0)} className="mb-5 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}>
            PRIVATE COACHING WITH JOEL POLLEY, RN
          </motion.div>
          <motion.h1 {...rise(0.1)} className="leading-tight mb-5" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.3rem)', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            You already did the work. Let a nurse read your numbers with you.
          </motion.h1>
          <motion.p {...rise(0.2)} className="text-lg mb-8" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '60ch', margin: '0 auto 2rem' }}>
            You cut the salt. You walked. The number still holds. Coaching is where I sit with your body, your meds, your labs, and the stress that never makes it onto a chart, and we find the corner actually driving your reading. Put your email in and I will show you exactly how it works.
          </motion.p>
          <motion.div {...rise(0.3)}>
            <EmailCapture reduce={reduce} big />
          </motion.div>
          <motion.p {...rise(0.42)} className="text-sm" style={{ color: 'var(--muted)', margin: '1.5rem auto 0', maxWidth: '48ch', lineHeight: 1.6 }}>
            Joel takes a small number of private clients at a time, so he can actually read every case himself. This is the door in.
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── TAKE YOUR HEALTH TO THE NEXT LEVEL ─────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <motion.div {...reveal(0)} className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}>
            WHY A COACH
          </motion.div>
          <motion.h2 {...reveal(0.06)} className="font-serif text-2xl sm:text-3xl mb-5" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            Every serious athlete has a coach. So does every serious business owner.
          </motion.h2>
          <motion.p {...reveal(0.12)} className="text-base" style={{ color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: '58ch', margin: '0 auto' }}>
            Not because they do not know how to run, or lift, or build. Because someone standing outside the effort can see what they cannot: the plateau they stopped noticing, the one adjustment that turns good into great. Your numbers deserve that same standard. This is what it looks like to take your health to the next level with a trained set of eyes on it, every week.
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── MEET JOEL (the guide) ──────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--sage-soft)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)} className="flex items-center gap-5 mb-6" style={{ flexWrap: 'wrap' }}>
            <picture>
              <source srcSet="/headshot.webp" type="image/webp" />
              <img src="/headshot.jpg" alt="Joel Polley, RN" width="84" height="84"
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cream)', boxShadow: '0 6px 18px rgba(44,42,38,0.12)', flexShrink: 0 }} />
            </picture>
            <div>
              <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: MONO }}>YOUR COACH</div>
              <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)', lineHeight: 1.15, fontStyle: 'italic' }}>Joel Polley, RN</h2>
            </div>
          </motion.div>
          <motion.p {...reveal(0.08)} className="text-base mb-4" style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
            Twenty years on the floor. ICU first, then emergency medicine. Hypertensive crashes, post-MI care, the conversations cardiology never had time for. Then naturopathic practice, for the patients the pharmaceutical model kept managing but never actually reaching. I built the BP Triangle Method one elevated reading at a time. Over 500K people follow the work now across TikTok, Facebook, and Instagram.
          </motion.p>
          <motion.p {...reveal(0.14)} className="text-base" style={{ color: 'var(--ink)', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--gold)', paddingLeft: '1rem' }}>
            "Pills manage output. Protocol fixes input. That is the whole sentence."
          </motion.p>
        </div>
      </section>

      <GoldHairline />

      {/* ─── HERE'S WHAT YOU GET ────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase text-center" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}>
              WHAT COACHING GIVES YOU
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-8 text-center" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              A real person, reading your case. Not a template you are left alone with.
            </h2>
          </motion.div>
          <motion.ul {...reveal(0.1)} className="space-y-4">
            {[
              'A live session where I read your home log, your meds, your supplements, and your labs together, and name the corner driving your number.',
              'A protocol written for your body, not a printout: the herbs, the foods, the timing, the rest, matched to your loudest corner.',
              'A one-page script to bring to your doctor, so your prescriber works with your plan instead of adding another pill.',
              'Real access to me while you run it, so when life throws a curveball we adjust the plan and keep going instead of starting over.',
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <Check size={18} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 4 }} />
                <span className="text-base" style={{ lineHeight: 1.65 }}>{item}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <GoldHairline />

      {/* ─── WHO THIS IS FOR ────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--paper-warm)' }}>
        <div className="max-w-2xl mx-auto px-5">
          <motion.div {...reveal(0)}>
            <div className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--clay)', letterSpacing: '0.18em', fontFamily: MONO }}>
              IS THIS YOU
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
              This is for the person who is already doing the work.
            </h2>
          </motion.div>
          <motion.ul {...reveal(0.08)} className="space-y-4">
            {[
              'You already track your own numbers, and you want someone qualified to read them with you and tell you what they actually mean.',
              'You have done the obvious things, and the reading still has not moved, so you want a plan built from your real numbers instead of another article written for everyone.',
              'You are ready to work toward less medication alongside your doctor, never around your doctor, and never instead of your doctor.',
              'You are not looking for more motivation. You want someone qualified to confirm you are doing the right work, and tell you plainly if you are not.',
            ].map((item) => (
              <li key={item} className="flex gap-3" style={{ color: 'var(--ink-soft)' }}>
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 10, width: 6, height: 6, borderRadius: '50%', background: 'var(--sage-deep)' }} />
                <span className="text-base" style={{ lineHeight: 1.65 }}>{item}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <GoldHairline />

      {/* ─── FINAL CTA (email repeat) ───────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--sage-soft)' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <motion.div {...reveal(0)} className="mb-3 text-xs font-bold uppercase" style={{ color: 'var(--sage-deep)', letterSpacing: '0.18em', fontFamily: MONO }}>
            THE DOOR IN
          </motion.div>
          <motion.h2 {...reveal(0.06)} className="font-serif text-2xl sm:text-3xl mb-4" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
            Put your email in. I will show you exactly how coaching works.
          </motion.h2>
          <motion.p {...reveal(0.1)} className="text-base mb-7" style={{ color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: '48ch', margin: '0 auto 1.75rem' }}>
            You will see the options, the honest expectations, and the next step, all on the other side of this.
          </motion.p>
          <motion.div {...reveal(0.16)}>
            <EmailCapture reduce={reduce} big />
          </motion.div>
        </div>
      </section>

      <GoldHairline />

      {/* ─── Credentials strip + disclaimer ─────────────────────────── */}
      <section className="py-10 px-5" style={{ background: 'var(--paper)', paddingBottom: '4rem' }}>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <Stethoscope size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>ICU + ER</div>
                <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>20+ years critical care and emergency medicine.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>RN License</div>
                <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>Active. Cardiovascular and naturopathic specialty.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={20} color="var(--sage-deep)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>One inbox</div>
                <div className="text-xs" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>Joel reads every case himself.</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: '64ch', margin: '0 auto' }}>
            All coaching with Joel Polley, RN, is education-based nursing consultation rooted in 20 years of ICU and ER experience. It is not diagnosis, prescription, or replacement for your physician. Any protocol we discuss works alongside your doctor, not instead of them. Never start, stop, or change a prescribed medication without your prescribing physician's supervision.
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--muted)', marginTop: '1rem' }}>
            Already know you are in? <Link to="/coaching-offers" style={{ color: 'var(--sage-deep)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>See the coaching options</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
