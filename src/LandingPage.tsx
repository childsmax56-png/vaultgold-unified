import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARTIST_LIST } from './artists/registry';
import type { ArtistConfig } from './artists/types';

// Handles the Spotify PKCE OAuth callback that redirects back to vaultgold.net/?code=...
// Exchanges the code for tokens and forwards them back to whichever tracker initiated the flow.
function useSpotifyCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateParam = params.get('state');
    if (!code || !stateParam) return;

    window.history.replaceState({}, '', window.location.pathname);

    let parsed: { v?: string; r?: string };
    try { parsed = JSON.parse(atob(stateParam)); } catch { return; }

    const codeVerifier = parsed.v;
    const returnTo = parsed.r;
    if (!codeVerifier || !returnTo) return;

    // Allow any tracker running on vaultgold.net, plus legacy origins and local dev
    const ALLOWED = [
      'https://vaultgold.net',
      'https://yzyarchives.org',
      'https://yzy-gold.childsmax56.workers.dev',
      'https://vamp-gold.childsmax56.workers.dev',
      'https://kdot-gold.childsmax56.workers.dev',
      'https://drizzy-gold.childsmax56.workers.dev',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://localhost:5183',
    ];
    if (!ALLOWED.some(o => returnTo.startsWith(o))) return;

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://vaultgold.net/',
        client_id: 'c9bdd79bf657487d8973f4c1510523ea',
        code_verifier: codeVerifier,
      }),
    })
      .then(r => r.json())
      .then((data: { access_token?: string; refresh_token?: string; expires_in?: number }) => {
        if (!data.access_token) return;
        const hash = new URLSearchParams({
          spotify_access_token: data.access_token,
          spotify_refresh_token: data.refresh_token || '',
          spotify_expires_in: String(data.expires_in || 3600),
        });
        window.location.href = returnTo + '/#' + hash.toString();
      })
      .catch(() => {});
  }, []);
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
      <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" />
    </svg>
  );
}

function ArtistCard({ config }: { config: ArtistConfig }) {
  const navigate = useNavigate();
  const accent = config.accentColor;
  const dim = `${accent}22`;

  return (
    <div
      onClick={() => navigate(`/${config.slug}`)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 28px 24px',
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        cursor: 'pointer',
        overflow: 'hidden',
        minHeight: 180,
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `${accent}66`;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`;
        const glow = el.querySelector('.card-glow') as HTMLDivElement;
        if (glow) glow.style.opacity = '1';
        const letter = el.querySelector('.card-letter') as HTMLDivElement;
        if (letter) letter.style.color = `${accent}18`;
        const arrow = el.querySelector('.card-arrow') as HTMLDivElement;
        if (arrow) {
          arrow.style.borderColor = accent;
          arrow.style.background = `${accent}22`;
          const svg = arrow.querySelector('svg');
          if (svg) svg.style.stroke = accent;
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.transform = '';
        el.style.boxShadow = '';
        const glow = el.querySelector('.card-glow') as HTMLDivElement;
        if (glow) glow.style.opacity = '0';
        const letter = el.querySelector('.card-letter') as HTMLDivElement;
        if (letter) letter.style.color = 'rgba(255,255,255,0.025)';
        const arrow = el.querySelector('.card-arrow') as HTMLDivElement;
        if (arrow) {
          arrow.style.borderColor = 'rgba(255,255,255,0.1)';
          arrow.style.background = 'transparent';
          const svg = arrow.querySelector('svg');
          if (svg) svg.style.stroke = 'rgba(255,255,255,0.45)';
        }
      }}
    >
      {/* Glow overlay */}
      <div
        className="card-glow"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 0% 100%, ${dim}, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Top: tag + logo/name */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: accent,
          background: `${accent}1a`,
          border: `1px solid ${accent}33`,
          borderRadius: 4,
          padding: '3px 8px',
          marginBottom: 14,
        }}>
          {config.artistLabel}
        </div>
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            alt={config.SITE_NAME}
            style={{ display: 'block', height: 44, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left center' }}
            onError={e => {
              // Fallback to text if logo fails to load
              const img = e.currentTarget;
              img.style.display = 'none';
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
        ) : null}
        <div style={{
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          display: config.logoUrl ? 'none' : 'block',
        }}>
          {config.SITE_NAME.replace(/([A-Z][a-z]+)$/, '').trim()}
          <span style={{ color: accent }}>
            {config.SITE_NAME.match(/([A-Z][a-z]+)$/)?.[0] ?? ''}
          </span>
        </div>
      </div>

      {/* Bottom: artist name + arrow */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {config.artistLabel}
        </span>
        <div
          className="card-arrow"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12, stroke: 'rgba(255,255,255,0.45)', transition: 'stroke 0.2s' }}>
            <path d="M2 10L10 2M10 2H4M10 2v6" />
          </svg>
        </div>
      </div>

      {/* Background letter */}
      <div
        className="card-letter"
        style={{
          position: 'absolute', right: -8, bottom: -16,
          fontSize: 120, fontWeight: 900, letterSpacing: '-0.05em',
          color: 'rgba(255,255,255,0.025)', lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
          transition: 'color 0.2s',
        }}
      >
        {config.cardLetter}
      </div>
    </div>
  );
}

function ExternalCard({ href, label, logoSrc, logoAlt, cardLetter, accent }: {
  href: string; label: string; logoSrc: string; logoAlt: string; cardLetter: string; accent: string;
}) {
  const dim = `${accent}22`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 28px 24px',
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        textDecoration: 'none',
        color: '#fff',
        overflow: 'hidden',
        minHeight: 180,
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = `${accent}66`;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`;
        const glow = el.querySelector('.card-glow') as HTMLDivElement;
        if (glow) glow.style.opacity = '1';
        const letter = el.querySelector('.card-letter') as HTMLDivElement;
        if (letter) letter.style.color = `${accent}18`;
        const arrow = el.querySelector('.card-arrow') as HTMLDivElement;
        if (arrow) {
          arrow.style.borderColor = accent;
          arrow.style.background = `${accent}22`;
          const svg = arrow.querySelector('svg');
          if (svg) svg.style.stroke = accent;
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.transform = '';
        el.style.boxShadow = '';
        const glow = el.querySelector('.card-glow') as HTMLDivElement;
        if (glow) glow.style.opacity = '0';
        const letter = el.querySelector('.card-letter') as HTMLDivElement;
        if (letter) letter.style.color = 'rgba(255,255,255,0.025)';
        const arrow = el.querySelector('.card-arrow') as HTMLDivElement;
        if (arrow) {
          arrow.style.borderColor = 'rgba(255,255,255,0.1)';
          arrow.style.background = 'transparent';
          const svg = arrow.querySelector('svg');
          if (svg) svg.style.stroke = 'rgba(255,255,255,0.45)';
        }
      }}
    >
      <div className="card-glow" style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 0% 100%, ${dim}, transparent 70%)`, opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, borderRadius: 4, padding: '3px 8px', marginBottom: 14 }}>{label}</div>
        <img src={logoSrc} alt={logoAlt} style={{ display: 'block', height: 44, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left center' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <div className="card-arrow" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s, background 0.2s' }}>
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12, stroke: 'rgba(255,255,255,0.45)', transition: 'stroke 0.2s' }}><path d="M2 10L10 2M10 2H4M10 2v6" /></svg>
        </div>
      </div>
      <div className="card-letter" style={{ position: 'absolute', right: -8, bottom: -16, fontSize: 120, fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.025)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', transition: 'color 0.2s' }}>{cardLetter}</div>
    </a>
  );
}

function MyTrackerCard() {
  const accent = '#C9A224';
  return (
    <a
      href="/my-tracker"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 28px 24px',
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        textDecoration: 'none',
        color: '#fff',
        overflow: 'hidden',
        minHeight: 140,
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = `${accent}66`;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        el.style.transform = '';
        el.style.boxShadow = '';
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, borderRadius: 4, padding: '3px 8px', marginBottom: 14 }}>Custom</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>MY <span style={{ color: accent }}>TRACKER</span></div>
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Link your own Google Sheet</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12, stroke: 'rgba(255,255,255,0.45)' }}><path d="M2 10L10 2M10 2H4M10 2v6" /></svg>
        </div>
      </div>
      <div style={{ position: 'absolute', right: -8, bottom: -16, fontSize: 120, fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.025)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>MTR</div>
    </a>
  );
}

export function LandingPage() {
  useSpotifyCallback();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      padding: '16px 24px 48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <header style={{ textAlign: 'center', marginBottom: 64, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="VAULTgold"
          style={{ height: 'clamp(140px, 22vw, 240px)', width: 'auto', transform: 'translateX(-50px)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <p style={{ marginTop: 20, fontSize: 15, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
          The Best Music Trackers In The World
        </p>
      </header>

      <main style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        width: '100%',
        maxWidth: 720,
      }}>
        {ARTIST_LIST.map(config => (
          <ArtistCard key={config.slug} config={config} />
        ))}

        {/* WOLFgold — external Google Sheet */}
        <ExternalCard
          href="https://docs.google.com/spreadsheets/d/1CMwzf-YO7yoNr5d-dsAOGFfHnYfGwXSFh1glniNlrck/edit?gid=1246511510#gid=1246511510"
          label="Tyler, the Creator"
          logoSrc="/logos/wolfgold.png"
          logoAlt="WOLFgold"
          cardLetter="WLF"
          accent="#e53e3e"
        />

        {/* Juicegold — external Google Sheet */}
        <ExternalCard
          href="https://docs.google.com/spreadsheets/d/1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568/edit?gid=0#gid=0"
          label="Juice WRLD"
          logoSrc="/logos/juicegold.png"
          logoAlt="Juicegold"
          cardLetter="JCE"
          accent="#e53e3e"
        />
      </main>

      {/* My Tracker — full width */}
      <div style={{ width: '100%', maxWidth: 720, marginTop: 16 }}>
        <MyTrackerCard />
      </div>

      <footer style={{ marginTop: 56, fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        © 2026 VAULTgold
      </footer>

      <style>{`
        @media (max-width: 500px) {
          main { grid-template-columns: 1fr !important; max-width: 360px !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
