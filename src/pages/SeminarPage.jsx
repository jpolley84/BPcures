// /seminar — Free week landing page for the Couples Intimacy + Sexual
// Health Seminar (May 18-23, 1 PM ET daily). Annie Chitate, RN co-hosts;
// Joel presents Thursday on BP meds, circulation & libido.
//
// Built 2026-05-18 for FB + TikTok bio link traffic. The page captures
// email BEFORE revealing the Zoom link (whole point — convert cold
// social traffic into the drip list).
//
// Form posts to /api/seminar-signup → on success redirects to
// /seminar/welcome which shows the Zoom link inline.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Heart, Users, Shield } from 'lucide-react';

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function SeminarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [partnerJoining, setPartnerJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // UTM capture — FB/TT bio link can be /seminar?utm_source=tiktok&utm_medium=bio
  const utmSource = searchParams.get('utm_source') || null;
  const utmMedium = searchParams.get('utm_medium') || null;
  const utmCampaign = searchParams.get('utm_campaign') || null;

  useEffect(() => {
    document.title = "Couples Intimacy + Sexual Health — Free Week with Annie & Joel";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seminar-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          partnerJoining,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      // Pass the email through to the welcome page so the confirmation
      // line can say "we sent it to {email}"
      navigate(`/seminar/welcome?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <Hero />
      <Schedule />
      <SignupSection
        email={email}
        setEmail={setEmail}
        firstName={firstName}
        setFirstName={setFirstName}
        partnerJoining={partnerJoining}
        setPartnerJoining={setPartnerJoining}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
      <WhatYoullLearn />
      <Hosts />
      <FAQ />
      <FinalCTA
        email={email}
        setEmail={setEmail}
        firstName={firstName}
        setFirstName={setFirstName}
        partnerJoining={partnerJoining}
        setPartnerJoining={setPartnerJoining}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
      <PageFooter />
    </div>
  );
}

/* ============ HERO ============ */
function Hero() {
  return (
    <section style={{ background: 'var(--sage-deep)', color: 'var(--cream)', padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 6vw, 4rem)' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--clay)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clay-soft, #E8B89F)' }}>
              Live This Week &middot; 3 Sessions Left
            </span>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-5)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 1.25rem' }}>
            Couples <em style={{ fontStyle: 'italic', color: 'var(--clay-soft, #E8B89F)' }}>Intimacy</em> &amp; Sexual Health.
          </h1>

          <p style={{ fontSize: 'var(--step-1)', lineHeight: 1.55, color: 'rgba(251,248,241,0.85)', margin: '0 0 1.5rem', maxWidth: '54ch' }}>
            Three sessions left this week with Annie Chitate, RN and Joel Polley, RN. <strong>Thursday is me</strong> on BP meds, circulation, and libido. Friday + Saturday are the partner-conversation closers.
          </p>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.55, color: 'rgba(251,248,241,0.7)', margin: '0 0 2rem', fontStyle: 'italic' }}>
            One Zoom link. Six sessions. Free with email.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#signup" style={{ background: 'var(--clay)', color: 'var(--cream)', padding: '0.95rem 1.5rem', borderRadius: 12, fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Send my Zoom link <ArrowRight size={16} />
            </a>
            <a href="#schedule" style={{ padding: '0.95rem 1.5rem', borderRadius: 12, border: '1px solid rgba(251,248,241,0.25)', color: 'var(--cream)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              See the schedule <ArrowRight size={14} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', color: 'rgba(251,248,241,0.6)', fontSize: '0.88rem' }}>
            <span>Singles 30+ welcome too &mdash; the science applies the same.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ WHEN ============ */
function Schedule() {
  return (
    <section id="schedule" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--paper)' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>When</span>
          <h2 className="display-m" style={{ margin: '0 0 0.75rem', maxWidth: '20ch' }}>
            Six sessions. <em className="ital-display" style={{ color: 'var(--clay)' }}>1 PM ET.</em>
          </h2>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 2rem', fontSize: '1.05rem', lineHeight: 1.55 }}>
            Monday May 18 through Saturday May 23. Same Zoom link, every day at 1 PM ET. Drop in for one session or all six.
          </p>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--paper-warm)', border: '1px solid var(--line)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                Monday – Wednesday &middot; Friday – Saturday
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                Annie Chitate, RN leads the hormone and intimacy sessions.
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--clay-soft, #F5E5DA)', border: '1.5px solid var(--clay)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.4rem' }}>
                Thursday May 21
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                Joel Polley, RN presents on BP meds, circulation, and libido.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ SIGNUP SECTION ============ */
function SignupSection(props) {
  return (
    <section id="signup" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--paper-warm)' }}>
      <div className="shell" style={{ maxWidth: 560 }}>
        <motion.div {...fade}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="kicker kicker-dot" style={{ marginBottom: '1rem', display: 'inline-block' }}>Get the Zoom link</span>
            <h2 className="display-m" style={{ margin: '0 0 0.75rem' }}>
              Where should we send <em className="ital-display" style={{ color: 'var(--clay)' }}>the link?</em>
            </h2>
            <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '1rem', lineHeight: 1.55 }}>
              We'll email you the Zoom link + the full schedule. One reminder before each session. That's it.
            </p>
          </div>

          <SignupForm {...props} variant="primary" />

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--muted, #7a7061)', lineHeight: 1.55 }}>
            <Shield size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            We never share your email. Unsubscribe in one click.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function SignupForm({ email, setEmail, firstName, setFirstName, partnerJoining, setPartnerJoining, submitting, error, onSubmit, variant = 'primary' }) {
  const buttonBg = variant === 'primary' ? 'var(--clay)' : 'var(--sage-deep)';

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
      <input
        type="text"
        placeholder="First name (optional)"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={inputStyle}
      />
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', color: 'var(--ink-soft)', cursor: 'pointer', padding: '0.25rem 0' }}>
        <input
          type="checkbox"
          checked={partnerJoining}
          onChange={(e) => setPartnerJoining(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: 'var(--clay)' }}
        />
        My partner is joining me
      </label>

      {error && (
        <div style={{ background: '#FCE7E7', border: '1px solid #E8A8A8', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#8A2A2A' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          background: buttonBg,
          color: 'var(--cream)',
          border: 'none',
          padding: '1rem 1.5rem',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '0.02em',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '0.25rem',
        }}
      >
        {submitting ? 'Sending the link...' : (
          <>
            Send my Zoom link <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

const inputStyle = {
  padding: '0.95rem 1rem',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--paper-light, #FFFFFF)',
  fontSize: '1rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

/* ============ WHAT YOU'LL LEARN ============ */
function WhatYoullLearn() {
  const items = [
    { icon: Heart, title: 'Why libido falls off a cliff in your 40s + 50s', body: 'And which three hormone shifts are running the show.' },
    { icon: Heart, title: 'What your BP medication is doing to circulation', body: 'Joel walks Thursday\'s session through the exact mechanism. Most cardiologists never mention this.' },
    { icon: Heart, title: 'The cortisol corner of intimacy', body: 'Stress hormone blocks arousal at the chemistry level. We cover the 90-day pattern that resets it.' },
    { icon: Heart, title: 'The partner conversation script', body: 'Annie\'s Friday session — how to have the talk without making it about blame.' },
    { icon: Heart, title: 'Rebuilding desire on purpose', body: 'Saturday close: a 30-day stack of small inputs that bring back the spark women keep telling us they miss.' },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--paper)' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>What's inside</span>
          <h2 className="display-m" style={{ margin: '0 0 2rem' }}>
            Five questions <em className="ital-display" style={{ color: 'var(--clay)' }}>most doctors</em> never answer.
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.25rem 1.5rem', background: 'var(--paper-warm)', borderRadius: 14, border: '1px solid var(--line)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--clay)', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    <Icon size={18} color="var(--cream)" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', margin: '0 0 0.35rem', color: 'var(--ink)', lineHeight: 1.3 }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ HOSTS ============ */
function Hosts() {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--paper-warm)' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Your hosts</span>
          <h2 className="display-m" style={{ margin: '0 0 2rem' }}>
            Two nurses. Two <em className="ital-display" style={{ color: 'var(--clay)' }}>corners.</em>
          </h2>

          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: '1fr', maxWidth: 680 }}>
            <div style={{ padding: '1.5rem 1.75rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.5rem' }}>
                Annie Chitate, RN
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', margin: '0 0 0.75rem', color: 'var(--ink)' }}>
                The hormone corner
              </h3>
              <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '0.97rem', lineHeight: 1.6 }}>
                RN, women's hormone specialist, founder of RestoreHer. Annie has walked thousands of women through the hormone shifts of perimenopause, menopause, and the intimacy cliff most marriages hit between 40 and 60. She runs Monday, Tuesday, Wednesday, and Friday.
              </p>
            </div>
            <div style={{ padding: '1.5rem 1.75rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: '0.5rem' }}>
                Joel Polley, RN &middot; The Blood Pressure Guy
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.35rem', margin: '0 0 0.75rem', color: 'var(--ink)' }}>
                The cardiovascular corner
              </h3>
              <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '0.97rem', lineHeight: 1.6 }}>
                Twenty years in ICU and emergency medicine. Joel went naturopathic after seeing the same medication-and-intimacy story play out across every shift. Thursday he walks through the specific mechanism of how BP meds, calcium channel blockers, and beta blockers affect circulation and libido &mdash; and what to actually do about it without quitting cold.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ FAQ ============ */
function FAQ() {
  const items = [
    { q: 'Is it really free?', a: 'Yes. Six live sessions, no card, no upsell wall. We do offer a hormone bundle and the BP Triangle Method for people who want a structured follow-on, but everything during the week is free.' },
    { q: 'Will there be replays?', a: 'Live only this week. If we can record a session we\'ll send it out to attendees, but show up live if you can — that\'s where the questions get answered.' },
    { q: 'Do I have to attend every day?', a: 'No. Each session stands alone. Pick the ones that apply to you. Thursday (Joel) and Friday (the partner conversation) are the two most people come for.' },
    { q: "I'm single. Is this for me?", a: 'Yes. The science of hormones, cortisol, and circulation applies the same. Drop in on whichever sessions speak to you. The Tuesday hormone session and Thursday med-effect session are especially relevant.' },
    { q: 'My partner won\'t come. Can I still benefit?', a: 'Absolutely. Most women attend solo on the first day or two and bring their partner for Friday\'s conversation session once they see what we\'re doing. Send them this page if it helps.' },
  ];

  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--paper)' }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <motion.div {...fade}>
          <span className="kicker kicker-dot" style={{ marginBottom: '1rem' }}>Common questions</span>
          <h2 className="display-m" style={{ margin: '0 0 2rem' }}>
            Quick answers.
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {items.map((item, i) => (
              <details key={i} style={{ padding: '1.1rem 1.4rem', background: 'var(--paper-warm)', border: '1px solid var(--line)', borderRadius: 12 }}>
                <summary style={{ fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer', color: 'var(--ink)', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <span>{item.q}</span>
                  <span style={{ color: 'var(--clay)', fontSize: '1.25rem', fontWeight: 300 }}>+</span>
                </summary>
                <p style={{ margin: '0.85rem 0 0', color: 'var(--ink-soft)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ FINAL CTA ============ */
function FinalCTA(props) {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--sage-deep)', color: 'var(--cream)' }}>
      <div className="shell" style={{ maxWidth: 560, textAlign: 'center' }}>
        <motion.div {...fade}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(251,248,241,0.12)', padding: '0.4rem 1rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--clay-soft, #E8B89F)' }}>
            <Calendar size={14} />
            Starts today &middot; 1 PM ET
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-4)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 1rem' }}>
            Six days. <em style={{ fontStyle: 'italic', color: 'var(--clay-soft, #E8B89F)' }}>One choice.</em>
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.55, color: 'rgba(251,248,241,0.85)', margin: '0 0 2rem' }}>
            Drop your email. We send the Zoom link. You decide which sessions to show up for.
          </p>

          <div style={{ background: 'var(--paper)', color: 'var(--ink)', padding: '2rem 1.5rem', borderRadius: 16, textAlign: 'left' }}>
            <SignupForm {...props} variant="primary" />
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--muted, #7a7061)', lineHeight: 1.55 }}>
              <Users size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Singles 30+ welcome. Bring your partner if they're open to it.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============ PAGE FOOTER ============ */
function PageFooter() {
  return (
    <footer style={{ padding: '2rem 0', background: 'var(--paper-warm)', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
      <div className="shell" style={{ maxWidth: 600 }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted, #7a7061)', lineHeight: 1.55, margin: 0 }}>
          BraveWorks RN &middot; Joel Polley, RN &middot; Annie Chitate, RN<br />
          Educational content only. Not medical advice. Always complement &mdash; never replace &mdash; care from your physician.
        </p>
      </div>
    </footer>
  );
}
