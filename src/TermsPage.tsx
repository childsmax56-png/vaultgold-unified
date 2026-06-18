import React from 'react';

export function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#050505', color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased',
      padding: '48px 24px', maxWidth: 680, margin: '0 auto',
    }}>
      <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
        ← Back
      </a>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 36 }}>Last updated: June 17, 2026</p>

      <Section title="1. Acceptance">
        By creating an account or using Unvaulted / VaultGold ("the Service"), you agree to these Terms. If you do not agree, do not use the Service.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 13 years old to use the Service. By signing in, you confirm you meet this requirement.
      </Section>

      <Section title="3. Accounts">
        You are responsible for all activity under your account. We use Google OAuth for authentication — we never store your Google password. You may not share, sell, or transfer your account.
      </Section>

      <Section title="4. User Content">
        Content you submit (rankings, votes, comments) remains yours. By submitting it, you grant us a non-exclusive, royalty-free license to display it on the Service. You agree not to submit content that is unlawful, harassing, or infringing.
      </Section>

      <Section title="5. Intellectual Property">
        Artist names, logos, and music are property of their respective owners. Unvaulted is a fan-run community platform and is not affiliated with any artist or label.
      </Section>

      <Section title="6. Prohibited Conduct">
        You may not: attempt to reverse engineer or scrape the Service, abuse or spam community features, impersonate other users, or use the Service for any unlawful purpose.
      </Section>

      <Section title="7. Termination">
        We may suspend or terminate your account at any time for violation of these Terms or at our discretion. You may delete your account by contacting us.
      </Section>

      <Section title="8. Disclaimer & Limitation of Liability">
        The Service is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.
      </Section>

      <Section title="9. Changes">
        We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance.
      </Section>

      <Section title="10. Contact">
        Questions? Reach us on the Unvaulted Discord server.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'rgba(255,255,255,0.85)' }}>{title}</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}
