import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import proofData from '../data/launcher-proof.json';

const QUIZ_LINK = '/launcher/quiz';
const PROOF = {
  daysToFirst500: proofData.daysToFirst500.value,
  paidCustomers: proofData.paidCustomers.value,
  totalRevenue: proofData.totalRevenue.value,
  emailSubscribers: proofData.emailSubscribers.value,
  campaignsRunning: proofData.campaignsRunning.value,
  dataAsOfDate: proofData.dataAsOfDate.value,
};

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};
const stagger = (i) => ({ ...fade, transition: { ...fade.transition, delay: i * 0.1 } });

export default function LauncherPage() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <HeroSection />
      <EpiphanyBridge />
      <VacationSection />
      <FoundingMemberZeroSection />
      <ProofSection />
      <ConvictionSection />
      <ShortFAQ />
      <FinalCTA />
      <PageFooter />
    </div>
  );
}

/* ================================================================
   HERO — Vacation framing in subhead
   ================================================================ */
function HeroSection() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3.5rem, 9vw, 7rem) 0 clamp(3rem, 7vw, 5rem)' }}>
      <div className="shell" style={{ maxWidth: 860 }}>
        <motion.div {...fade}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft)' }}>
              Founding Cohort closes May 15 — 5 spots
            </span>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-5)', fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.03em', margin: '0 0 1.5rem', fontVariationSettings: '"SOFT" 50, "opsz" 120' }}>
            $500 in {PROOF.daysToFirst500}.
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)', fontVariationSettings: '"SOFT" 100, "opsz" 120' }}>By talking to my business.</em>
          </h1>

          <p style={{ fontSize: 'var(--step-1)', lineHeight: 1.55, color: 'rgba(251,248,241,0.82)', margin: '0 0 1.75rem', maxWidth: '56ch' }}>
            ICU nurse who left the bedside. Built BraveWorks RN by talking to my own system instead of building it. I'll install the same engine in your practice &mdash; 72 hours, in your voice, with your products.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <PrimaryQuizCTA />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', color: 'rgba(251,248,241,0.55)', fontSize: '0.88rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(251,248,241,0.08)', border: '1px solid rgba(251,248,241,0.15)', display: 'grid', placeItems: 'center', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--cream)' }}>JP</div>
            <span>Joel Polley, RN · Built this system for BraveWorks RN · Now installing it in yours</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   EPIPHANY BRIDGE — Joel's origin story
   ================================================================ */
function EpiphanyBridge() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', borderBottom: '1px solid var(--line)' }}>
      <div className="shell" style={{ maxWidth: 720 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Why I built this</span>
          <h2 className="display-s" style={{ margin: '0 0 1.5rem' }}>
            20 years in the ICU taught me one thing.
          </h2>

          <div style={{ fontSize: 'var(--step-0)', lineHeight: 1.75, color: 'var(--ink-soft)', display: 'grid', gap: '1.25rem' }}>
            <p style={{ margin: 0 }}>
              I spent two decades watching the same story repeat: patient comes in, blood pressure through the roof, doctor adjusts the meds, patient goes home, nothing changes. I knew — because I'd seen it thousands of times — that the answer wasn't another prescription. It was what they ate, how they moved, what they believed about their own body.
            </p>
            <p style={{ margin: 0 }}>
              So I left. Built BraveWorks RN. Started making TikToks about herbs and blood pressure from my kitchen. Within months, the emails flooded in — nurses, naturopaths, health coaches — all saying the same thing: <em style={{ color: 'var(--clay)' }}>"I know what you know. I just can't get anyone to listen."</em>
            </p>
            <p style={{ margin: 0 }}>
              They didn't have a knowledge problem. They had a delivery problem. So I built them a delivery system &mdash; the same one running BraveWorks right now. The quiz funnel, the email engine, the AI content team, the Stripe checkout, all of it. The same engine I used to ship <strong style={{ color: 'var(--ink)' }}>8 paid digital products on Gumroad and a Wellness Guide on Amazon</strong> &mdash; books, reset programs, protocols &mdash; all written by talking to my system. And I realized: if I can install this once, I can install it again.
            </p>
            <p style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', color: 'var(--ink)', fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              That's what this page is. Not a course. Not a template. A <strong style={{ color: 'var(--clay)' }}>functioning business</strong> — installed, wired, and generating content before you hang up the setup call.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   VACATION — Future-self in vivid detail
   ================================================================ */
function VacationSection() {
  return (
    <section style={{ background: 'var(--paper-warm)', padding: 'clamp(3.5rem, 7vw, 6rem) 0' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Picture her</span>
          <h2 className="display-m" style={{ margin: '0 0 1.75rem' }}>
            The version of you with a <em className="ital-display" style={{ color: 'var(--clay)' }}>real practice.</em>
          </h2>

          <div style={{ fontSize: 'var(--step-0)', lineHeight: 1.8, color: 'var(--ink-soft)', display: 'grid', gap: '1.5rem' }}>
            <p style={{ margin: 0 }}>
              It's a Tuesday morning. She's up before the sun, but not because she has to be — because she wants to. Coffee on the porch, journal open, no laptop in sight. The first email of the day is a Stripe receipt. By breakfast there are three more. She doesn't write them, doesn't send them, doesn't even open them. The system does. She just notices, smiles, and moves on.
            </p>
            <p style={{ margin: 0 }}>
              By 9 AM she's recorded a 60-second TikTok in her own voice, from a script the AI drafted in her cadence. By 10 AM that script has gone live, and the email tied to it has already gone out to 1,700 subscribers. She didn't fight Mailchimp. She didn't drag boxes in Canva. She didn't beg a developer to fix a button. She spoke. It happened. The version of her that has a waitlist doesn't know Mailchimp — she has a team. It just happens to fit inside one conversation.
            </p>
            <p style={{ margin: 0 }}>
              Her afternoon is the part she actually trained for: a one-on-one with a client, fully present, no glance at the calendar, no half-thought about the launch she should be planning. The launch is already running. The income is already arriving. And the impact — the people she's actually helping — is the only thing she has to focus on. <strong style={{ color: 'var(--ink)' }}>That's the version of you this page is here to install.</strong>
            </p>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <PrimaryQuizCTA />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   FOUNDING MEMBER #0 — One free Tier 2 install in exchange for
   being the public case study. Closes May 7, 2026.
   ================================================================ */
function FoundingMemberZeroSection() {
  return (
    <section style={{ background: 'var(--paper-warm)', padding: 'clamp(3.5rem, 7vw, 6rem) 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="shell" style={{ maxWidth: 720 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>One spot. Apply by May 7.</span>
          <h2 className="display-m" style={{ margin: '0 0 0.6rem' }}>
            <em className="ital-display" style={{ color: 'var(--clay)' }}>Founding Member #0.</em>
          </h2>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.45, color: 'var(--ink)', margin: '0 0 2rem', fontVariationSettings: '"SOFT" 70, "opsz" 72', maxWidth: '52ch' }}>
            One coach. The full install, free. In exchange for being the case study.
          </p>

          <div style={{ fontSize: 'var(--step-0)', lineHeight: 1.8, color: 'var(--ink-soft)', display: 'grid', gap: '1.5rem' }}>
            <p style={{ margin: 0 }}>
              The Practice Launcher isn't proven yet — not in someone else's business. The only numbers it's earned are mine. So I'm picking one coach to install it for at no cost.
            </p>
            <p style={{ margin: 0 }}>
              They get the full <strong style={{ color: 'var(--ink)' }}>$9,997 stack</strong> — custom site, email engine, AI command center, book, content runway, all of it. In exchange: weekly progress published publicly. Full transparency on their Stripe numbers. A Day-60 interview I can use forever. Permission to put their name and face on the proof block of this page when they win.
            </p>
            <p style={{ margin: 0 }}>
              Apply by <strong style={{ color: 'var(--ink)' }}>May 7, 2026.</strong> I pick one. The diagnostic has a checkbox. If you have an audience (any size), if you're willing to be the proof, if your work and mine line up — apply.
            </p>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <Link
              to={`${QUIZ_LINK}?fm0=1`}
              className="btn btn-clay btn-lg"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Apply for Founding Member #0 <ArrowRight size={16} className="arrow" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   PROOF — Live numbers from BraveWorks
   ================================================================ */
function ProofSection() {
  const stats = [
    { num: PROOF.daysToFirst500, label: '$0 → $500 in collected revenue. That\'s the guarantee on this page — pre-tested on the founder.' },
    { num: PROOF.paidCustomers, label: 'paying customers — every one from organic content, zero ad spend.' },
    { num: PROOF.emailSubscribers, label: 'email subscribers built from a quiz funnel — the same one I install for you.' },
    { num: PROOF.campaignsRunning, label: 'automated email campaigns running right now — written and optimized by AI.' },
  ];

  return (
    <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0' }}>
      <div className="shell" style={{ maxWidth: 780 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>This isn't theory — it's running right now</span>
          <h2 className="display-s" style={{ margin: '0 0 0.5rem' }}>
            BraveWorks RN. <em className="ital-display" style={{ color: 'var(--clay)' }}>Same system. Live numbers.</em>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '0 0 2rem', lineHeight: 1.6 }}>
            These are real numbers from my own business &mdash; BPQuiz.com. The $500 first-client guarantee on this page? It took my system <strong>{PROOF.daysToFirst500}</strong> to do that for me. I'm offering you the same engine. Live data, pulled from Stripe on {PROOF.dataAsOfDate}.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          {stats.map((s, i) => (
            <motion.div key={i} {...stagger(i)} style={{ background: 'var(--cream)', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-2)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--clay)', lineHeight: 1.1, marginBottom: '0.4rem' }}>{s.num}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div {...fade} style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="https://bpquiz.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: 'var(--sage)', textDecoration: 'underline', textUnderlineOffset: '0.2em' }}>
            See the live site at BPQuiz.com →
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   CONVICTION — Brief "I believe" + scarcity strip
   ================================================================ */
function ConvictionSection() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 720 }}>
        <motion.div {...fade}>
          <div style={{ background: 'var(--sage-deep)', borderRadius: 16, padding: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--cream)' }}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-1)', lineHeight: 1.5, margin: 0, fontVariationSettings: '"SOFT" 70, "opsz" 72' }}>
              I believe every health coach who has the knowledge to help people deserves a system that matches their calling. I built this because I watched too many nurses and practitioners give up — not because they couldn't help people, but because they couldn't figure out Mailchimp. <strong style={{ color: 'var(--clay-soft)' }}>That ends here.</strong>
            </p>
          </div>

          <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: 'var(--paper-warm)', borderRadius: 14, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Founding cohort closes May 15, 2026
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                5 spots. After this, the price rises and the first-client guarantee changes. The diagnostic shows you which tier fits.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   SHORT FAQ — only the "is this for me" questions
   ================================================================ */
function ShortFAQ() {
  const [open, setOpen] = useState(null);

  const faqs = [
    {
      q: "I'm not technical. Can I really do this?",
      a: "You don't touch code. Ever. I build everything during setup. After that, you talk to your system in plain English — 'change this headline,' 'write me an email,' 'what should I post today.' If you can send a text message, you can run this system."
    },
    {
      q: "What if the AI doesn't sound like me?",
      a: "The intake agent spends the first session building your complete brand profile — your voice, your phrases, your philosophy, your tone. Every piece of content it generates pulls from that profile. After 30 days of feedback, it sounds more like you than a hired copywriter ever could."
    },
    {
      q: "Do I need my own content already?",
      a: "No. The Practice Launcher pre-generates a 90-day content runway — TikTok scripts, email teachings, YouTube outlines, your full challenge sequence — all in your voice, before Day 1. You launch with three months of content already in the chamber."
    },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700 }}>
        <motion.div {...fade}>
          <h2 className="display-s" style={{ margin: '0 0 2rem' }}>Is this for you?</h2>
        </motion.div>

        <div style={{ display: 'grid', gap: 0 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i} {...stagger(i)} style={{ borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit', color: 'var(--ink)' }}>
                <span style={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.4 }}>{faq.q}</span>
                <ChevronRight size={18} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform 0.3s', transform: open === i ? 'rotate(90deg)' : 'rotate(0deg)' }} />
              </button>
              {open === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ paddingBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0 }}>{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)' }} />
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   FINAL CTA — single primary action
   ================================================================ */
function FinalCTA() {
  return (
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(3.5rem, 7vw, 6rem) 0' }}>
      <div className="shell" style={{ maxWidth: 700, textAlign: 'center' }}>
        <motion.div {...fade}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 1.25rem', fontVariationSettings: '"SOFT" 50, "opsz" 96' }}>
            The version of you who has a <em style={{ fontStyle: 'italic', color: 'var(--clay-soft)', fontVariationSettings: '"SOFT" 100' }}>waitlist</em> doesn't know Mailchimp.
          </h2>

          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.65, color: 'rgba(247,243,236,0.7)', margin: '0 auto 2rem', maxWidth: '48ch' }}>
            She has a team. It just happens to fit inside one conversation. The diagnostic tells me which version of that I'd install for you specifically.
          </p>

          {/* What happens next preview */}
          <div style={{ background: 'rgba(247,243,236,0.04)', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid rgba(247,243,236,0.08)', marginBottom: '1.75rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'rgba(247,243,236,0.75)', margin: 0 }}>
              <strong style={{ color: 'rgba(247,243,236,0.95)' }}>What happens next:</strong> 10 questions. 3 minutes. You'll get a diagnostic of where your business is now, what I noticed when I looked at your work, and the exact stack that fits your situation.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <Link to={QUIZ_LINK} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1.05rem 2rem', borderRadius: 12, background: 'var(--clay)', color: 'var(--cream)', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>
              Take the 3-minute Practice Diagnostic <ArrowRight size={16} />
            </Link>
          </div>

          {/* P.S. */}
          <div style={{ textAlign: 'left', background: 'rgba(247,243,236,0.04)', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid rgba(247,243,236,0.08)', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(247,243,236,0.6)', margin: 0 }}>
              <strong style={{ color: 'rgba(247,243,236,0.8)' }}>P.S.</strong> — Applications close May 15, 2026. After that, the price goes to $14,997 and the "First Client" guarantee changes. 5 spots in the founding cohort. If you're reading this, one is still open. And there's one Founding Member #0 spot — full install, free, in exchange for being the case study. Closes May 7. <Link to={QUIZ_LINK} style={{ color: 'var(--clay-soft)', textDecoration: 'underline' }}>Take the diagnostic now.</Link>
            </p>
          </div>

          <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.92rem', color: 'rgba(247,243,236,0.4)', lineHeight: 1.6, margin: 0, fontVariationSettings: '"SOFT" 100' }}>
            Genetics writes the recipe. Lifestyle bakes the cake. Be your own doctor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   PRIMARY QUIZ CTA — reusable button
   ================================================================ */
function PrimaryQuizCTA() {
  return (
    <Link
      to={QUIZ_LINK}
      className="btn btn-lg"
      style={{
        background: 'var(--clay)',
        color: 'var(--cream)',
        padding: '1rem 1.75rem',
        borderRadius: 12,
        fontWeight: 600,
        fontSize: '1rem',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      Take the 3-minute Practice Diagnostic <ArrowRight size={16} />
    </Link>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */
function PageFooter() {
  return (
    <footer style={{ background: 'var(--ink)', borderTop: '1px solid rgba(247,243,236,0.08)', padding: '2rem 0' }}>
      <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'rgba(247,243,236,0.4)', fontSize: '0.78rem' }}>
        <span>© {new Date().getFullYear()} BraveWorks RN · Joel Polley, RN · Practice Launcher</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="https://tiktok.com/@braveworksrn" style={{ color: 'inherit', textDecoration: 'none' }}>TikTok</a>
          <a href="https://bpquiz.com" style={{ color: 'inherit', textDecoration: 'none' }}>BPQuiz.com</a>
        </div>
      </div>
    </footer>
  );
}
