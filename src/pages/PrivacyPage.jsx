// src/pages/PrivacyPage.jsx
//
// Privacy policy. Linked from the footer. CCPA + GDPR baseline.
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

const linkStyle = { color: 'var(--clay)', textDecoration: 'underline' };

export default function PrivacyPage() {
  return (
    <div style={{
      background: 'var(--paper)',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2rem)',
      minHeight: '70vh',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={h1Style}>Privacy Policy</h1>
        <p style={{ ...proseStyle, fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 2rem' }}>
          Last updated: 2026-06-04
        </p>

        <h2 style={h2Style}>1. Who we are</h2>
        <p style={proseStyle}>
          BraveWorks Health, LLC, operating bpquiz.com. Contact: hello@bpquiz.com.
        </p>

        <h2 style={h2Style}>2. What we collect</h2>
        <p style={proseStyle}>
          We collect: your email address (quiz submission, newsletter), your name
          (optional), your quiz answers (Pressure type and urgency), purchase data
          via Stripe (last 4 of card and ZIP; Stripe holds the card itself), and
          your IP address plus device info via Vercel Analytics for security and
          aggregate stats.
        </p>

        <h2 style={h2Style}>3. How we use it</h2>
        <p style={proseStyle}>
          We use your data to send the educational content you requested, the BP
          Triangle Method email sequence, course access, and order confirmations.
          We do not sell your information.
        </p>

        <h2 style={h2Style}>4. Third parties we share with</h2>
        <ul style={{ ...proseStyle, paddingLeft: '1.25rem', margin: '0.5rem 0 1rem' }}>
          <li><strong>Stripe</strong>, payment processing (<a style={linkStyle} href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">privacy</a>)</li>
          <li><strong>Resend</strong>, transactional email (<a style={linkStyle} href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">privacy</a>)</li>
          <li><strong>Vercel</strong>, site hosting and analytics (<a style={linkStyle} href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">privacy</a>)</li>
          <li><strong>Vercel KV / Upstash</strong>, email and customer state storage (<a style={linkStyle} href="https://upstash.com/static/trust/privacy.pdf" target="_blank" rel="noopener noreferrer">privacy</a>)</li>
          <li><strong>Meta (Facebook)</strong>, Meta Pixel for retargeting if you visit from a Meta ad (<a style={linkStyle} href="https://www.facebook.com/policy.php" target="_blank" rel="noopener noreferrer">privacy</a>)</li>
        </ul>

        <h2 style={h2Style}>5. Cookies and tracking</h2>
        <p style={proseStyle}>
          We use first-party cookies for cart state, the Vercel analytics cookie,
          and the Meta Pixel cookie when you visit from a Meta ad. You can disable
          cookies in your browser settings.
        </p>

        <h2 style={h2Style}>6. Your rights (CCPA / GDPR)</h2>
        <p style={proseStyle}>
          You may request a copy of your data, request deletion, or opt out of
          email at any time. Email hello@bpquiz.com from the address you used to
          register, and we will respond within 30 days.
        </p>

        <h2 style={h2Style}>7. Do Not Sell or Share My Personal Information (CCPA)</h2>
        <p style={proseStyle}>
          We do not sell personal information. To opt out of Meta retargeting,
          email hello@bpquiz.com and we will exclude your email from any custom
          audience uploads.
        </p>

        <h2 style={h2Style}>8. Children</h2>
        <p style={proseStyle}>
          bpquiz.com is not directed at anyone under 18. We do not knowingly
          collect data from minors.
        </p>

        <h2 style={h2Style}>9. Updates</h2>
        <p style={proseStyle}>
          We may update this policy. Material changes will be announced via the
          newsletter to existing subscribers.
        </p>

        <p style={{ ...proseStyle, fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2.5rem' }}>
          Questions: hello@bpquiz.com
        </p>
      </div>
    </div>
  );
}
