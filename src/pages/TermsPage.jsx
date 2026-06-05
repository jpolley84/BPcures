// src/pages/TermsPage.jsx
//
// Terms of service. Linked from the footer.
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

export default function TermsPage() {
  return (
    <div style={{
      background: 'var(--paper)',
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2rem)',
      minHeight: '70vh',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={h1Style}>Terms of Service</h1>
        <p style={{ ...proseStyle, fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 2rem' }}>
          Last updated: 2026-06-04
        </p>

        <h2 style={h2Style}>1. Agreement</h2>
        <p style={proseStyle}>
          Using bpquiz.com means you agree to these terms. If you do not agree,
          please stop using the site.
        </p>

        <h2 style={h2Style}>2. What we offer</h2>
        <p style={proseStyle}>
          Educational content, paid digital downloads (the $17 BP Reset Kit, the
          $12 BP Cures book, and other guides), and optional paid community
          access via Skool ($27 per month).
        </p>

        <h2 style={h2Style}>3. Refunds</h2>
        <p style={proseStyle}>
          30-day Feel-It-or-Free. Reply REFUND from the email you purchased with.
          Refunds are processed within 5 to 10 business days to the original
          payment method. You keep the books and any downloaded materials.
        </p>

        <h2 style={h2Style}>4. Recurring subscriptions</h2>
        <p style={proseStyle}>
          The Skool community is $27 per month, billed by Skool directly. You can
          cancel any time from your Skool account.
        </p>

        <h2 style={h2Style}>5. Intellectual property</h2>
        <p style={proseStyle}>
          All content on bpquiz.com, including the BP Triangle Method, is owned
          by BraveWorks Health, LLC. Do not redistribute paid materials.
        </p>

        <h2 style={h2Style}>6. No medical advice</h2>
        <p style={proseStyle}>
          See <a style={linkStyle} href="/disclaimer">/disclaimer</a>. By using
          the site you agree this content is educational, not clinical.
        </p>

        <h2 style={h2Style}>7. Limitation of liability</h2>
        <p style={proseStyle}>
          BraveWorks Health, LLC is not liable for any decision a user makes
          based on the educational content on this site. Always coordinate health
          decisions with your physician.
        </p>

        <h2 style={h2Style}>8. Governing law</h2>
        <p style={proseStyle}>
          Kentucky law governs these terms. Disputes are resolved in Kentucky
          courts.
        </p>

        <h2 style={h2Style}>9. Contact</h2>
        <p style={proseStyle}>
          hello@bpquiz.com
        </p>
      </div>
    </div>
  );
}
