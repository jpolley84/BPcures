import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { TIER_DETAILS, decodeSlugPayload, scoreColor } from '../utils/launcherQuiz';

const CALENDLY = 'https://calendly.com/braveworksrn/60min';

const cream = 'var(--cream)';
const ink = 'var(--ink)';
const inkSoft = 'var(--ink-soft)';
const muted = 'var(--muted)';
const line = 'var(--line)';
const sage = 'var(--sage)';
const sageDeep = 'var(--sage-deep)';
const clay = 'var(--clay)';
const claySoft = 'var(--clay-soft)';
const paperWarm = 'var(--paper-warm)';

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function LauncherResultsPage() {
  const { slug } = useParams();

  const decoded = useMemo(() => {
    if (!slug) return null;
    const dotIdx = slug.indexOf('.');
    if (dotIdx === -1) return null;
    const blob = slug.slice(dotIdx + 1);
    return decodeSlugPayload(blob);
  }, [slug]);

  const [research, setResearch] = useState(null);
  const [researchStatus, setResearchStatus] = useState('idle'); // idle | loading | ok | error | unavailable

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setResearchStatus('loading');
    fetch(`/api/launcher-quiz-research?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 503) {
          setResearchStatus('unavailable');
          return;
        }
        if (!res.ok) throw new Error('research_failed');
        const data = await res.json();
        if (cancelled) return;
        setResearch(data);
        setResearchStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setResearchStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!decoded) {
    return <NotFound />;
  }

  const { name, handle, answers, tierKey, score } = decoded;
  const recommended = TIER_DETAILS[tierKey] || TIER_DETAILS.launcher;
  const otherTierKeys = ['starter', 'launcher', 'revshare'].filter((k) => k !== tierKey);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <TopBar />

      {/* ZONE 1 — Diagnostic */}
      <section style={{ padding: 'clamp(2.5rem, 6vw, 4rem) 0 clamp(1.5rem, 3vw, 2.5rem)' }}>
        <div className="shell" style={{ maxWidth: 760 }}>
          <motion.div {...fade}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
              }}
            >
              Your Practice Diagnostic
            </span>
            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'var(--step-4)',
                fontWeight: 400,
                lineHeight: 1.06,
                letterSpacing: '-0.025em',
                fontVariationSettings: '"SOFT" 50, "opsz" 96',
                color: ink,
                margin: '0.5rem 0 1.25rem',
              }}
            >
              Here's what I see, <em style={{ color: clay, fontStyle: 'italic', fontVariationSettings: '"SOFT" 100, "opsz" 96' }}>{name || 'friend'}</em>.
            </h1>
          </motion.div>

          {/* Score visualization */}
          <motion.div
            {...fade}
            style={{
              background: cream,
              border: `1px solid ${line}`,
              borderRadius: 18,
              padding: 'clamp(1.5rem, 3vw, 2.25rem)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(1.25rem, 3vw, 2rem)',
              flexWrap: 'wrap',
              marginBottom: '1.75rem',
            }}
          >
            <ScoreCircle composite={score.composite} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: muted,
                  marginBottom: '0.4rem',
                }}
              >
                Composite Readiness Score
              </div>
              <p
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'var(--step-1)',
                  lineHeight: 1.35,
                  color: ink,
                  margin: 0,
                  fontVariationSettings: '"SOFT" 60',
                }}
              >
                {scoreInterpretation(score, tierKey)}
              </p>
            </div>
          </motion.div>

          {/* Diagnostic paragraphs */}
          <motion.div {...fade} style={{ display: 'grid', gap: '1.25rem', fontSize: 'var(--step-0)', lineHeight: 1.75, color: inkSoft }}>
            {diagnosticParagraphs(answers, score, tierKey, name).map((p, i) => (
              <p key={i} style={{ margin: 0 }}>
                {p}
              </p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ZONE 2 — Live research */}
      <section style={{ background: paperWarm, padding: 'clamp(2.5rem, 6vw, 4rem) 0' }}>
        <div className="shell" style={{ maxWidth: 760 }}>
          <motion.div {...fade}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
              }}
            >
              I personally reviewed your work
            </span>
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'var(--step-3)',
                fontWeight: 400,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"SOFT" 60, "opsz" 72',
                color: ink,
                margin: '0.5rem 0 1.5rem',
              }}
            >
              And here's what I noticed when I looked at <em style={{ color: clay, fontStyle: 'italic' }}>your work.</em>
            </h2>
          </motion.div>

          <ResearchBlock status={researchStatus} research={research} handle={handle} />
        </div>
      </section>

      {/* ZONE 3 — The offer, personalized */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="shell" style={{ maxWidth: 920 }}>
          <motion.div {...fade}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
              }}
            >
              The right next step
            </span>
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'var(--step-3)',
                fontWeight: 400,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"SOFT" 60, "opsz" 72',
                color: ink,
                margin: '0.5rem 0 1.5rem',
              }}
            >
              Based on what I see, <em style={{ color: clay, fontStyle: 'italic' }}>{recommended.name}</em> is the fit for you.
            </h2>
          </motion.div>

          <RecommendedTierCard tier={recommended} tierKey={tierKey} primary />

          {/* Other tiers — collapsed */}
          {tierKey !== 'none' && (
            <OtherTiers tierKeys={otherTierKeys} />
          )}
        </div>
      </section>

      {/* GUARANTEE + SCARCITY */}
      <section style={{ background: sageDeep, color: cream, padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="shell" style={{ maxWidth: 760, textAlign: 'center' }}>
          <motion.div {...fade}>
            <Shield size={36} style={{ color: claySoft, marginBottom: '1rem' }} />
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'var(--step-3)',
                fontWeight: 400,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"SOFT" 60, "opsz" 72',
                margin: '0 0 1.25rem',
              }}
            >
              The "First Client" <em style={{ fontStyle: 'italic', color: claySoft }}>Guarantee.</em>
            </h2>
            <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: 'rgba(251,248,241,0.8)', margin: '0 auto 1rem', maxWidth: '54ch' }}>
              Your first paying client — at least $500 in collected revenue — within 60 days of launch. If 90 days pass and you haven't landed that first client, full setup-fee refund and you keep everything installed.
            </p>
            <p style={{ fontSize: '0.92rem', color: claySoft, margin: '1.25rem 0 0', letterSpacing: '0.04em' }}>
              Founding cohort closes May 15, 2026 · 10 spots · One is still open
            </p>
          </motion.div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}

/* ----------------------------------------------------------------
   Score circle — single circular indicator
   ---------------------------------------------------------------- */

function ScoreCircle({ composite }) {
  const color = scoreColor(composite);
  const radius = 52;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const dash = (composite / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" style={{ display: 'block' }}>
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={line}
          strokeWidth={stroke}
        />
        <motion.circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 66 66)"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Fraunces, serif',
          fontVariationSettings: '"SOFT" 50',
          color: ink,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div>
          <div style={{ fontSize: '2.1rem', fontWeight: 500, letterSpacing: '-0.02em' }}>{composite}</div>
          <div style={{ fontSize: '0.62rem', color: muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
            / 100
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Research block — Zone 2, with loading + fallback
   ---------------------------------------------------------------- */

function ResearchBlock({ status, research, handle }) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div
        style={{
          background: cream,
          border: `1px solid ${line}`,
          borderRadius: 18,
          padding: 'clamp(1.5rem, 3vw, 2.25rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Spinner />
        <span style={{ color: muted, fontSize: '0.92rem' }}>Reading your work...</span>
      </div>
    );
  }

  if (status === 'unavailable' || status === 'error') {
    return (
      <div
        style={{
          background: cream,
          border: `1px solid ${line}`,
          borderRadius: 18,
          padding: 'clamp(1.5rem, 3vw, 2.25rem)',
        }}
      >
        <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: inkSoft, margin: 0 }}>
          I personally review every diagnostic. I'll send your custom analysis directly to your email within 24 hours, before your strategy call. The shape of what I'll be looking at: how your niche reads from the outside, where your strongest line of work is, and the funnel gap I notice between the audience you have and the offer you're running.
        </p>
      </div>
    );
  }

  // status === 'ok'
  const items = [
    { label: 'Your niche, as I read it', body: research.niche, color: sage },
    { label: 'Where you\'re strongest', body: research.strength, color: sage },
    { label: 'The funnel gap I noticed', body: research.gap, color: clay },
    { label: 'What your version of this would look like', body: research.custom_example, color: clay },
  ].filter((item) => item.body);

  if (items.length === 0) {
    return (
      <div
        style={{
          background: cream,
          border: `1px solid ${line}`,
          borderRadius: 18,
          padding: 'clamp(1.5rem, 3vw, 2.25rem)',
        }}
      >
        <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.7, color: inkSoft, margin: 0 }}>
          I'll send your custom analysis to your email within 24 hours. I want to look at <strong>{handle || 'your work'}</strong> with the time it deserves before recommending anything specific.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {items.map((item, i) => (
        <motion.div
          key={i}
          {...fade}
          transition={{ ...fade.transition, delay: i * 0.1 }}
          style={{
            background: cream,
            border: `1px solid ${line}`,
            borderRadius: 16,
            padding: 'clamp(1.25rem, 3vw, 1.75rem)',
            borderLeftWidth: 4,
            borderLeftStyle: 'solid',
            borderLeftColor: item.color,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: muted,
              marginBottom: '0.6rem',
            }}
          >
            {item.label}
          </div>
          <p style={{ fontSize: 'var(--step-0)', lineHeight: 1.65, color: ink, margin: 0 }}>
            {item.body}
          </p>
        </motion.div>
      ))}
      {research.tier_fit_reasoning && (
        <motion.div
          {...fade}
          style={{
            marginTop: '0.5rem',
            background: paperWarm,
            border: `1px solid ${line}`,
            borderRadius: 16,
            padding: 'clamp(1.25rem, 3vw, 1.75rem)',
          }}
        >
          <p
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'var(--step-1)',
              lineHeight: 1.45,
              color: ink,
              margin: 0,
              fontVariationSettings: '"SOFT" 60',
            }}
          >
            {research.tier_fit_reasoning}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `2px solid ${line}`,
        borderTopColor: clay,
        animation: 'launcher-spin 0.9s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes launcher-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ----------------------------------------------------------------
   Recommended tier card
   ---------------------------------------------------------------- */

function RecommendedTierCard({ tier, tierKey, primary }) {
  if (tier.key === 'none') {
    return <FoundationCard />;
  }
  const isLauncher = tierKey === 'launcher';
  const calendlyUrl = `${CALENDLY}?utm_source=launcher&utm_medium=quiz&utm_campaign=${tierKey}`;

  return (
    <motion.div
      {...fade}
      style={{
        background: isLauncher ? sageDeep : cream,
        color: isLauncher ? cream : ink,
        border: `2px solid ${isLauncher ? clay : ink}`,
        borderRadius: 20,
        padding: 'clamp(1.75rem, 4vw, 2.75rem)',
        position: 'relative',
      }}
    >
      {primary && (
        <div
          style={{
            position: 'absolute',
            top: '-0.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: clay,
            color: cream,
            padding: '0.3rem 1rem',
            borderRadius: 999,
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Recommended for you
        </div>
      )}

      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isLauncher ? claySoft : muted,
          marginBottom: '0.5rem',
          marginTop: primary ? '0.5rem' : 0,
        }}
      >
        {tier.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'var(--step-3)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {tier.price}
        </span>
        {tier.priceWas && (
          <span
            style={{
              fontSize: '0.85rem',
              color: isLauncher ? 'rgba(251,248,241,0.45)' : muted,
              textDecoration: 'line-through',
            }}
          >
            {tier.priceWas}
          </span>
        )}
        {tier.priceSuffix && (
          <span style={{ fontSize: '0.85rem', color: isLauncher ? claySoft : muted }}>
            {tier.priceSuffix}
          </span>
        )}
      </div>

      {tier.cadence && (
        <p style={{ fontSize: '0.78rem', color: isLauncher ? claySoft : muted, marginBottom: '1.25rem' }}>
          {tier.cadence}
        </p>
      )}

      <p
        style={{
          fontSize: '0.95rem',
          lineHeight: 1.55,
          color: isLauncher ? 'rgba(251,248,241,0.78)' : inkSoft,
          marginBottom: '1.25rem',
        }}
      >
        {tier.summary}
      </p>

      <div
        style={{
          background: isLauncher ? 'rgba(251,248,241,0.06)' : paperWarm,
          borderRadius: 12,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          color: isLauncher ? 'rgba(251,248,241,0.85)' : inkSoft,
          fontStyle: 'italic',
        }}
      >
        {tier.fit}
      </div>

      <div style={{ display: 'grid', gap: '0.55rem', marginBottom: '1.75rem' }}>
        {tier.deliverables.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'start', fontSize: '0.9rem', lineHeight: 1.5 }}>
            <Check
              size={16}
              style={{
                color: isLauncher ? claySoft : sage,
                marginTop: '0.15rem',
                flexShrink: 0,
              }}
            />
            <span style={{ color: isLauncher ? 'rgba(251,248,241,0.85)' : inkSoft }}>{d}</span>
          </div>
        ))}
      </div>

      {tier.timeline && (
        <p style={{ fontSize: '0.82rem', color: isLauncher ? 'rgba(251,248,241,0.55)' : muted, marginBottom: '1rem' }}>
          <strong style={{ color: isLauncher ? cream : ink }}>Timeline:</strong> {tier.timeline}
        </p>
      )}

      {tier.guarantee && (
        <p style={{ fontSize: '0.82rem', color: isLauncher ? 'rgba(251,248,241,0.55)' : muted, marginBottom: '1.75rem' }}>
          <strong style={{ color: isLauncher ? cream : ink }}>Guarantee:</strong> {tier.guarantee}
        </p>
      )}

      <a
        href={calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1.05rem 1.75rem',
          borderRadius: 12,
          background: isLauncher ? clay : ink,
          color: cream,
          fontWeight: 600,
          fontSize: '1rem',
          textDecoration: 'none',
        }}
      >
        Apply for {tier.name} <ArrowRight size={16} />
      </a>
    </motion.div>
  );
}

function FoundationCard() {
  return (
    <motion.div
      {...fade}
      style={{
        background: cream,
        border: `1px solid ${line}`,
        borderRadius: 20,
        padding: 'clamp(1.75rem, 4vw, 2.75rem)',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: muted,
          marginBottom: '0.5rem',
        }}
      >
        Foundation First
      </div>
      <h3
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'var(--step-2)',
          fontWeight: 500,
          letterSpacing: '-0.018em',
          color: ink,
          margin: '0 0 1rem',
          lineHeight: 1.18,
          fontVariationSettings: '"SOFT" 60',
        }}
      >
        I won't take your money for a system you're not ready to fill.
      </h3>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: inkSoft, margin: '0 0 1rem' }}>
        Right now you don't have the certification, audience, or revenue motion to use the install. That's not a closed door — it's a different door. Finish the certification first. Get the first 500 followers. Take 5 unpaid clients and build proof. Then come back and the system will be ready for you.
      </p>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: inkSoft, margin: '0 0 1.75rem' }}>
        In the meantime, the free 30-Day Pressure Triangle Challenge teaches the protocol I use with patients — it's the same content engine that produced 1,751 subscribers from a quiz funnel. It's a better look at how the system works than any of these tier pages.
      </p>
      <a
        href="https://bpquiz.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1.05rem 1.75rem',
          borderRadius: 12,
          background: ink,
          color: cream,
          fontWeight: 600,
          fontSize: '1rem',
          textDecoration: 'none',
        }}
      >
        See the system at BPQuiz.com <ArrowRight size={16} />
      </a>
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   Other tiers — collapsed
   ---------------------------------------------------------------- */

function OtherTiers({ tierKeys }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div {...fade} style={{ marginTop: '2rem' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          borderRadius: 12,
          background: 'transparent',
          border: `1px solid ${line}`,
          color: ink,
          fontSize: '0.88rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Considering another tier? {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}
        >
          {tierKeys.map((k) => {
            const t = TIER_DETAILS[k];
            if (!t || k === 'none') return null;
            const calendlyUrl = `${CALENDLY}?utm_source=launcher&utm_medium=quiz&utm_campaign=${k}`;
            return (
              <div
                key={k}
                style={{
                  background: cream,
                  border: `1px solid ${line}`,
                  borderRadius: 16,
                  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: '1.15rem',
                      fontWeight: 500,
                      color: ink,
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.78rem',
                      color: muted,
                    }}
                  >
                    {t.price} {t.priceSuffix || ''}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: inkSoft, lineHeight: 1.55, margin: '0 0 1rem' }}>
                  {t.summary}
                </p>
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    color: clay,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${claySoft}`,
                    paddingBottom: '0.15rem',
                  }}
                >
                  Apply for {t.name} <ArrowRight size={12} />
                </a>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   Diagnostic interpretation
   ---------------------------------------------------------------- */

function scoreInterpretation(score, tierKey) {
  const { composite } = score;
  if (tierKey === 'none') {
    return 'You\'re earlier in the journey — and that\'s genuinely fine. The diagnostic shows a foundation gap, not a fit gap. Let\'s talk about what to build first.';
  }
  if (composite >= 75) {
    return 'You\'re built to scale. The certification, audience, and revenue motion are all here — what\'s missing is the infrastructure underneath them.';
  }
  if (composite >= 55) {
    return 'You\'re at the inflection point. The foundation is real, the audience is real, the next move is the system that captures what you\'re already building.';
  }
  if (composite >= 30) {
    return 'You have the calling and the credentials. The leverage gap is the install — the funnel, the email engine, the content runway underneath.';
  }
  return 'You\'re at the start. There\'s real signal here, and the right move is a careful one — the install matters more for you than for anyone in this cohort.';
}

function diagnosticParagraphs(answers, score, tierKey, name) {
  const lines = [];
  const { revenue, audience, infra } = score;

  if (tierKey === 'none') {
    lines.push(
      `Your answers tell me you're at the very start of the path${name ? ', ' + name : ''}. That's not a flaw — it's a fact. Most of the people I talk to about Practice Launcher already have certification, an audience that knows them, and a few clients on the books. The system installs on top of those. Without them, the install has nothing to fill.`
    );
    lines.push(
      'The honest path: finish your certification (or get further into it), pick a niche specific enough to build content around, post 30 times in 30 days, take 3-5 unpaid clients to build case studies. Six months from now, the diagnostic looks completely different and we have something real to talk about.'
    );
    return lines;
  }

  // Revenue line
  if (revenue >= 6) {
    lines.push(
      `Your revenue tells me you've already built the demand — the practice is already earning, and the question now isn't whether people will pay you, it's how much of the work that drives that revenue you can stop doing yourself.`
    );
  } else if (revenue >= 3) {
    lines.push(
      `You're earning real money but it's still tied to your time — every dollar comes through a one-on-one conversation. The leverage gap is what happens after the conversation: the funnel that nurtures the people who didn't book, the digital product that captures the curious, the email engine that keeps your name in their inbox while they decide.`
    );
  } else {
    lines.push(
      `Revenue is the dimension where the score is lowest, and that's a signal not a sentence. Most of the people I install Practice Launcher for had similar numbers two months before launch. The gap between "knows what to do" and "earns from it" is almost always the funnel, not the knowledge.`
    );
  }

  // Audience line
  if (audience >= 5) {
    lines.push(
      `The audience side of the score is strong — you have actual reach. Reach is the most expensive thing in this business; you've already built it. What you don't have yet is the conversion path underneath, which is exactly the wiring this offer installs.`
    );
  } else if (audience >= 2) {
    lines.push(
      `You have a small but real audience. That's the most workable starting point — it's big enough that the funnel has fuel, small enough that you can still hand-touch the early customers and learn from every conversation.`
    );
  } else {
    lines.push(
      `The audience is the thinnest input right now. That doesn't change the install — but it does change which content levers I'd pull first. The 90-day runway becomes more important than the funnel polish, because the runway is what fills the funnel.`
    );
  }

  // Infrastructure line
  if (infra >= 6) {
    lines.push(
      `And the infrastructure gap is wide. That actually makes you a fit — when there's nothing to migrate from, the install is faster and the system is purer. We're not patching ClickFunnels and Mailchimp; we're building the right thing the first time.`
    );
  } else if (infra >= 3) {
    lines.push(
      `Your current stack has bones. Some pieces stay (Stripe, your domain, your existing email list), some get retired (drag-and-drop builders that fight you), and the new layer goes on top — a plain-English command system that talks to all of it.`
    );
  }

  return lines;
}

/* ----------------------------------------------------------------
   Top bar + footer
   ---------------------------------------------------------------- */

function TopBar() {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247, 243, 236, 0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${line}`,
      }}
    >
      <div className="shell" style={{ padding: '0.95rem clamp(1.25rem, 4vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <Link to="/launcher" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: ink, textDecoration: 'none' }}>
          <span
            style={{
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${ink}`,
              borderRadius: '50%',
              fontFamily: 'Fraunces, serif',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              fontVariationSettings: '"SOFT" 100',
            }}
          >
            JP
          </span>
          <span
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 500,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
            }}
          >
            Practice Diagnostic
          </span>
        </Link>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            color: muted,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Your Results
        </span>
      </div>
    </div>
  );
}

function PageFooter() {
  return (
    <footer style={{ background: ink, borderTop: '1px solid rgba(247,243,236,0.08)', padding: '2rem 0' }}>
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

function NotFound() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 540, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'var(--step-3)', margin: '0 0 1rem', color: ink }}>
          That diagnostic link expired or wasn't valid.
        </h1>
        <p style={{ color: inkSoft, lineHeight: 1.65, marginBottom: '2rem' }}>
          No problem — take the 3-minute diagnostic again and I'll personally review the results.
        </p>
        <Link
          to="/launcher/quiz"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 1.75rem',
            borderRadius: 12,
            background: clay,
            color: cream,
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          Take the Practice Diagnostic <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
