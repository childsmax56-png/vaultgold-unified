import React from 'react';

export function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#050505', color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased',
      padding: '48px 24px', maxWidth: 680, margin: '0 auto',
    }}>
      <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
        ← Back
      </a>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 36 }}>Last updated: June 17, 2026</p>

      <Section title="1. Information We Collect">
        When you sign in with Google, we receive your Google account ID, email address, and display name. We store this to create and identify your account. We also store data you actively submit to the Service (rankings, votes, profile customizations).
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to operate the Service, display your public profile and rankings, and identify your account across sessions. We do not sell your personal information to third parties.
      </Section>

      <Section title="3. Cookies & Local Storage">
        We use browser localStorage to store your session token so you stay signed in between visits. No third-party advertising cookies are used.
      </Section>

      <Section title="4. Data Sharing">
        We do not share your personal information with third parties except as necessary to operate the Service (e.g., our hosting infrastructure). We may disclose information if required by law.
      </Section>

      <Section title="5. Data Retention">
        We retain your account data for as long as your account is active. You may request deletion of your account and associated data by contacting us on Discord.
      </Section>

      <Section title="6. Security">
        We use industry-standard practices to protect your data. However, no method of transmission over the internet is 100% secure.
      </Section>

      <Section title="7. Children's Privacy">
        The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
      </Section>

      <Section title="8. Changes">
        We may update this Privacy Policy. We'll note the updated date at the top of this page. Continued use constitutes acceptance.
      </Section>

      <Section title="9. Contact">
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
