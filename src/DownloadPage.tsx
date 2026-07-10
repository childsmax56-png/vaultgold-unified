import React from 'react';
import { SiApple } from 'react-icons/si';

// Installers are streamed through our own origin (see
// functions/api/app-download.ts) so the download links stay on unvaulted.cc.
const DOWNLOADS = {
  macArm: '/api/app-download?os=mac-arm',
  macIntel: '/api/app-download?os=mac-intel',
  win: '/api/app-download?os=win',
};

const GOLD = '#C9A224';

function detectOS() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'win';
  return 'other';
}

export function DownloadPage() {
  const os = detectOS();

  return (
    <div style={{
      minHeight: '100vh', background: '#050505', color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased',
      padding: '48px 24px', paddingTop: 'max(48px, env(safe-area-inset-top))', maxWidth: 720, margin: '0 auto',
    }}>
      <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
        ← Back
      </a>

      <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        Download <span style={{ color: GOLD }}>UNVAULTED</span>
      </h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 40px', maxWidth: 560 }}>
        Get the full experience as a native app. The desktop app adds Spotify playback,
        reliable pixeldrain audio, and a proper app window — it stays in sync with the site
        automatically. On phones, install it straight from your browser.
      </p>

      {/* DESKTOP */}
      <SectionTitle>Desktop</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <DownloadButton
          href={DOWNLOADS.macArm}
          icon={<SiApple style={{ width: 20, height: 20 }} />}
          title="Mac — Apple Silicon"
          sub="M1 / M2 / M3 / M4 · .dmg"
          recommended={os === 'mac'}
        />
        <DownloadButton
          href={DOWNLOADS.macIntel}
          icon={<SiApple style={{ width: 20, height: 20 }} />}
          title="Mac — Intel"
          sub="Older Intel Macs · .dmg"
        />
        <DownloadButton
          href={DOWNLOADS.win}
          icon={<WindowsIcon />}
          title="Windows"
          sub="Windows 10/11 · .exe installer"
          recommended={os === 'win'}
        />
      </div>

      {/* Install guide (desktop) */}
      <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
          First launch — quick heads up
        </p>
        <Step><b>macOS:</b> the app isn't yet notarized by Apple, so the first open is blocked.
          Go to <b>System Settings → Privacy &amp; Security</b>, scroll down and click <b>Open Anyway</b>,
          then launch it again. You only do this once.</Step>
        <Step><b>Windows:</b> SmartScreen may warn about an unknown publisher. Click <b>More info → Run anyway</b> to install.</Step>
        <Step style={{ marginBottom: 0 }}>Not sure which Mac you have? Apple menu → <b>About This Mac</b>. "Apple M‑series" = Apple Silicon; "Intel" = Intel.</Step>
      </div>

      {/* MOBILE */}
      <div style={{ marginTop: 44 }}>
        <SectionTitle>Phone &amp; Tablet</SectionTitle>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 560 }}>
          There's no download needed — install UNVAULTED straight from your browser and it
          works like a real app, with its own icon and no browser bars.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <GuideCard title="iPhone / iPad" highlight={os === 'ios'}>
            <Step>Open <b>unvaulted.cc</b> in <b>Safari</b>.</Step>
            <Step>Tap the <b>Share</b> button (the square with an arrow).</Step>
            <Step style={{ marginBottom: 0 }}>Choose <b>Add to Home Screen</b>.</Step>
          </GuideCard>
          <GuideCard title="Android" highlight={os === 'android'}>
            <Step>Open <b>unvaulted.cc</b> in <b>Chrome</b>.</Step>
            <Step>Tap the <b>⋮</b> menu (top right).</Step>
            <Step style={{ marginBottom: 0 }}>Choose <b>Install app</b> (or "Add to Home screen").</Step>
          </GuideCard>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
      {children}
    </h2>
  );
}

function Step({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: '0 0 10px', ...style }}>
      {children}
    </p>
  );
}

function DownloadButton({ href, icon, title, sub, recommended }: {
  href: string; icon: React.ReactNode; title: string; sub: string; recommended?: boolean;
}) {
  return (
    <a href={href} style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 18px', borderRadius: 14, textDecoration: 'none',
      background: recommended ? 'rgba(201,162,36,0.12)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${recommended ? 'rgba(201,162,36,0.4)' : 'rgba(255,255,255,0.12)'}`,
      transition: 'all 0.15s',
    }}>
      <span style={{ color: recommended ? GOLD : '#fff', display: 'flex' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</span>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</span>
      </span>
      {recommended && (
        <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: GOLD }}>
          Your device
        </span>
      )}
    </a>
  );
}

function GuideCard({ title, highlight, children }: { title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: highlight ? 'rgba(201,162,36,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? 'rgba(201,162,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, padding: '18px 20px',
    }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>{title}</p>
      {children}
    </div>
  );
}

function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M0 3.449 9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.351" />
    </svg>
  );
}
