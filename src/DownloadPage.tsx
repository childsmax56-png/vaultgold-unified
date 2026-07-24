import React from 'react';
import { SiApple } from 'react-icons/si';

// Installers are streamed through our own origin (see
// functions/api/app-download.ts) so the download links stay on unvaulted.cc.
const DOWNLOADS = {
  macArm: '/api/app-download?os=mac-arm',
  macIntel: '/api/app-download?os=mac-intel',
  win: '/api/app-download?os=win',
  linux: '/api/app-download?os=linux',
};

const GOLD = '#C9A224';

function detectOS() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'win';
  if (/Linux/.test(ua)) return 'linux';
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
        Get the full experience as a native app for Mac, Windows and Linux. The desktop app gives
        you a proper app window — it stays in sync with the site automatically. On phones, install
        it straight from your browser.
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
        <DownloadButton
          href={DOWNLOADS.linux}
          icon={<LinuxIcon />}
          title="Linux"
          sub="x86_64 · .AppImage"
          recommended={os === 'linux'}
        />
      </div>

      {/* Install guide (desktop) */}
      <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
          First launch — quick heads up
        </p>
        <Step><b>macOS:</b> the app isn't yet notarized by Apple, so the first open is blocked.
          Go to <b>System Settings → Privacy &amp; Security</b>, scroll down and click <b>Open Anyway</b>,
          then launch it again. You only do this once. Not sure which Mac you have? Apple menu →
          <b> About This Mac</b>. "Apple M‑series" = Apple Silicon; "Intel" = Intel.</Step>
        <Step><b>Windows:</b> SmartScreen may warn about an unknown publisher. Click <b>More info → Run anyway</b> to install.</Step>
        <Step style={{ marginBottom: 0 }}><b>Linux:</b> after downloading, make the file executable, then run it — no install needed. In a terminal:
          <br /><code style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 5, display: 'inline-block', marginTop: 6 }}>chmod +x UNVAULTED-*.AppImage &amp;&amp; ./UNVAULTED-*.AppImage</code>
          <br />Or right-click the file → <b>Properties → Permissions → Allow executing</b>, then double-click it.</Step>
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

function LinuxIcon() {
  // Tux — the Linux mascot
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.201.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02a1.772 1.772 0 0 1 .15-.768c.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.196zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.263.288.331.465.084.199.116.402.126.6v.02c0 .128-.011.194-.02.259l-.028.02c-.084.03-.15.061-.219.135a5.24 5.24 0 0 0-.087-.29c-.02-.135-.056-.202-.088-.334-.03-.135-.083-.2-.15-.267-.056-.06-.121-.06-.185-.06-.09 0-.164.06-.222.126a.984.984 0 0 0-.152.335 1.02 1.02 0 0 0-.045.4v.02c.007.202.055.334.108.535.005.02.01.041.017.06-.166-.06-.29-.06-.437-.135l-.03-.014a.98.98 0 0 0-.048-.267.98.98 0 0 0 .012-.216 1.564 1.564 0 0 1 .126-.588 1.198 1.198 0 0 1 .331-.465.66.66 0 0 1 .445-.135zm1.481 4.036c.66 0 1.618.212 2.253.66.135.09.194.157.194.291 0 .134-.06.202-.194.291-.635.448-1.593.66-2.253.66-.658 0-1.616-.212-2.251-.66-.135-.09-.194-.157-.194-.291 0-.134.059-.201.194-.291.635-.448 1.593-.66 2.251-.66z" />
    </svg>
  );
}
