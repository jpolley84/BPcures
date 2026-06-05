// src/pages/DisclaimerPage.jsx
//
// Legal disclaimer page. Linked from the footer and from /privacy + /terms.
// Last updated: 2026-06-04 (podcast-prep audit).

const proseStyle = {
  fontSize: '1rem',
  lineHeight: 1.7,
  color: 'var(--ink-soft)',
};

const h2Style = {
  fontFamily: 'Fraunces, serif',
  fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
  fontWeight: 500,
  color: 'var(--ink)',
  margin: '2rem 0 0.75rem',
  lineHeight: 1.25,
};

const h1Style = {
  fontFamily: 'Fraunces, serif',
  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
  fontWeight: 500,
  color: 'var(--ink)',
  margin: '0 0 0.75rem',
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
};

export default function DisclaimerPage() {
  return (
    <div style={{
      background: 'var(--paper)',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2rem)',
      minHeight: '70vh',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={h1Style}>Medical Disclaimer</h1>
        <p style={{ ...proseStyle, fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 2rem' }}>
          Last updated: 2026-06-04
        </p>

        <h2 style={h2Style}>1. Educational content only</h2>
        <p style={proseStyle}>
          Everything on bpquiz.com is education and lifestyle support. It is not
          medical advice, not a diagnosis, not a treatment, and not a prescription.
          The content here is intended to help you understand your body and have
          better conversations with your physician.
        </p>

        <h2 style={h2Style}>2. Joel's credentials</h2>
        <p style={proseStyle}>
          Joel Polley is a Registered Nurse and a naturopathic-trained educator.
          He is NOT a prescribing physician. He does not diagnose, treat, or
          prescribe for individual patients on this site. The protocols and
          guidance you read here are general educational frameworks, not personal
          medical care.
        </p>

        <h2 style={h2Style}>3. Never stop your medication</h2>
        <p style={proseStyle}>
          Never start, stop, or adjust medication based on anything you read or
          watch from BraveWorks RN. Always work in coordination with the physician
          who prescribed it. Sudden medication changes can be dangerous.
          Coordination with your prescriber is the only safe path.
        </p>

        <h2 style={h2Style}>4. FDA disclaimer</h2>
        <p style={proseStyle}>
          Statements on this site have not been evaluated by the Food and Drug
          Administration. Products and protocols mentioned here are not intended
          to diagnose, treat, cure, or prevent any disease.
        </p>

        <h2 style={h2Style}>5. Individual results vary</h2>
        <p style={proseStyle}>
          Testimonials on this site reflect individual experience. Most readers
          see modest results or none. Outcomes depend on biology, baseline health,
          adherence, and physician coordination. Past results do not predict
          future results.
        </p>

        <h2 style={h2Style}>6. Affiliate and TikTok Shop disclosure</h2>
        <p style={proseStyle}>
          Some links on this site and on Joel's social media may earn BraveWorks
          a referral commission. Specifically: products on TikTok Shop
          @braveworksrn (MaxCalm and others) compensate Joel as an affiliate. We
          only recommend products we use personally.
        </p>

        <h2 style={h2Style}>7. Emergency notice</h2>
        <p style={proseStyle}>
          If you are experiencing a hypertensive emergency, chest pain, stroke
          symptoms, or any acute medical event, call 911 immediately. This site
          cannot help you in an emergency.
        </p>

        <p style={{ ...proseStyle, fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2.5rem' }}>
          Questions: hello@bpquiz.com
        </p>
      </div>
    </div>
  );
}
