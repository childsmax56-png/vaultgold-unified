import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiDiscord, SiReddit, SiTiktok } from 'react-icons/si';
import { ARTIST_LIST } from './artists/registry';
import type { ArtistConfig } from './artists/types';
import { useSettings, LOADING_SCREENS } from './SettingsContext';

// Handles the Spotify PKCE OAuth callback that redirects back to unvaulted.cc/?code=...
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

    // Allow any tracker running on unvaulted.cc, plus legacy origins and local dev
    const ALLOWED = [
      'https://unvaulted.cc',
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
        redirect_uri: `${window.location.origin}/`,
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

function PhotoCard({ onClick, photoUrl, label, accent }: { onClick: () => void; photoUrl: string; label: string; accent: string }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '3/4',
        border: '2px solid transparent',
        background: '#0f0f0f',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = accent;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px ${accent}44`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'transparent';
        el.style.transform = '';
        el.style.boxShadow = '';
      }}
    >
      <img
        src={photoUrl}
        alt={label}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Bottom gradient + name */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        padding: '28px 14px 12px',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 700, color: '#fff',
          letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>{label}</span>
      </div>
    </div>
  );
}

function ArtistCard({ config, showPhoto }: { config: ArtistConfig; showPhoto: boolean }) {
  const navigate = useNavigate();
  const accent = config.accentColor;
  const dim = `${accent}22`;
  const photoUrl = showPhoto && config.artistPhotoUrl ? config.artistPhotoUrl : null;

  if (photoUrl) {
    return <PhotoCard onClick={() => navigate(`/${config.slug}`)} photoUrl={photoUrl} label={config.artistLabel} accent={accent} />;
  }

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
      <div className="card-glow" style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 0% 100%, ${dim}, transparent 70%)`, opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, borderRadius: 4, padding: '3px 8px', marginBottom: 14 }}>
          {config.artistLabel}
        </div>
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            alt={config.SITE_NAME}
            style={{ display: 'block', height: 44, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left center' }}
            onError={e => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
        ) : null}
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, display: config.logoUrl ? 'none' : 'block' }}>
          {config.SITE_NAME.replace(/([A-Z][a-z]+)$/, '').trim()}
          <span style={{ color: accent }}>{config.SITE_NAME.match(/([A-Z][a-z]+)$/)?.[0] ?? ''}</span>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{config.artistLabel}</span>
        <div className="card-arrow" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s, background 0.2s' }}>
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12, stroke: 'rgba(255,255,255,0.45)', transition: 'stroke 0.2s' }}>
            <path d="M2 10L10 2M10 2H4M10 2v6" />
          </svg>
        </div>
      </div>
      <div className="card-letter" style={{ position: 'absolute', right: -8, bottom: -16, fontSize: 120, fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.025)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', transition: 'color 0.2s' }}>
        {config.cardLetter}
      </div>
    </div>
  );
}

function ExternalCard({ href, label, logoSrc, logoAlt, cardLetter, accent, photoSrc }: {
  href: string; label: string; logoSrc: string; logoAlt: string; cardLetter: string; accent: string; photoSrc?: string;
}) {
  const dim = `${accent}22`;

  if (photoSrc) {
    return <PhotoCard onClick={() => window.open(href, '_blank', 'noopener,noreferrer')} photoUrl={photoSrc} label={label} accent={accent} />;
  }

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

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? '#FFD700' : 'rgba(255,255,255,0.1)',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 22 : 2, transition: 'left 0.2s',
      }} />
    </button>
  );
}

function LandingSettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', background: '#111', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
  };
  const label: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)' };
  const sublabel: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 };

  const handleReset = () => {
    if (confirmReset) { resetSettings(); setConfirmReset(false); }
    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, maxWidth: '90vw',
        background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 101, overflowY: 'auto', padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Settings</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 20, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Theme Color */}
        <div style={row}>
          <div>
            <div style={label}>Theme Color</div>
          </div>
          <input
            type="color"
            value={settings.themeColor}
            onChange={e => updateSettings({ themeColor: e.target.value })}
            style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>

        {/* Font Size */}
        <div style={row}>
          <div style={label}>Font Size</div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
            {(['small', 'medium', 'large'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateSettings({ globalFontSize: s })}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: settings.globalFontSize === s ? '#FFD700' : 'transparent',
                  color: settings.globalFontSize === s ? '#000' : 'rgba(255,255,255,0.5)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >{s[0].toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Loading Screen */}
        <div style={{ ...row, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={label}>Loading Screen</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%' }}>
            {LOADING_SCREENS.map(s => (
              <button
                key={s.id}
                onClick={() => updateSettings({ loadingScreen: s.id })}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid',
                  borderColor: settings.loadingScreen === s.id ? '#FFD700' : 'rgba(255,255,255,0.1)',
                  background: settings.loadingScreen === s.id ? 'rgba(255,215,0,0.12)' : 'transparent',
                  color: settings.loadingScreen === s.id ? '#FFD700' : 'rgba(255,255,255,0.5)',
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Artist Photos */}
        <div style={row}>
          <div>
            <div style={label}>Artist Photos</div>
            <div style={sublabel}>Show artist photos on cards</div>
          </div>
          <Toggle on={settings.landingArtistPhotos} onToggle={() => updateSettings({ landingArtistPhotos: !settings.landingArtistPhotos })} />
        </div>

        {/* Tags as Emojis */}
        <div style={row}>
          <div style={label}>Tags as Emojis</div>
          <Toggle on={settings.tagsAsEmojis} onToggle={() => updateSettings({ tagsAsEmojis: !settings.tagsAsEmojis })} />
        </div>

        {/* Startup Shuffle */}
        <div style={row}>
          <div>
            <div style={label}>Startup Shuffle</div>
            <div style={sublabel}>Shuffle on first load</div>
          </div>
          <Toggle on={settings.startupShuffle} onToggle={() => updateSettings({ startupShuffle: !settings.startupShuffle })} />
        </div>

        {/* Synced Lyrics Only */}
        <div style={row}>
          <div style={label}>Synced Lyrics Only</div>
          <Toggle on={settings.syncedLyricsOnly} onToggle={() => updateSettings({ syncedLyricsOnly: !settings.syncedLyricsOnly })} />
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            marginTop: 8, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            background: confirmReset ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: confirmReset ? '#ef4444' : 'rgba(255,255,255,0.4)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {confirmReset ? 'Click again to confirm reset' : 'Reset All Settings'}
        </button>
      </div>
    </>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const VG_API = 'https://unvaulted.cc';
const TOKEN_KEY = 'vg_token';
const USER_KEY = 'vg_user';

interface VGUser { id: string; username: string; email: string; }

function getVGUser(): VGUser | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function useVGAuth() {
  const [user, setUser] = useState<VGUser | null>(getVGUser);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.vaultgold) return;
      if (e.data.vaultgold === 'signed_in' && e.data.token && e.data.user) {
        localStorage.setItem(TOKEN_KEY, e.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(e.data.user));
        setUser(e.data.user);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const signInWithGoogle = () => {
    window.open(
      `${VG_API}/api/auth/google/connect?return_to=${encodeURIComponent(window.location.origin)}`,
      'vg-google',
      'width=500,height=600'
    );
  };

  const signOut = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) fetch(`${VG_API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return { user, signInWithGoogle, signOut };
}

export function LandingPage() {
  useSpotifyCallback();
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();
  const showPhotos = settings.landingArtistPhotos;
  const { user, signInWithGoogle, signOut } = useVGAuth();
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
      {showSettings && <LandingSettingsPanel onClose={() => setShowSettings(false)} />}
      <header style={{ textAlign: 'center', marginBottom: 64, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: 'absolute', top: 0, right: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <GearIcon />
        </button>
        <img
          src="/logo.png"
          alt="UNVAULTED"
          style={{ height: 'auto', width: 'clamp(200px, 35vw, 360px)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <p style={{ marginTop: 20, fontSize: 15, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
          The Best Music Trackers In The World
        </p>
      </header>

      <main style={{
        display: 'grid',
        gridTemplateColumns: showPhotos ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
        gap: showPhotos ? 12 : 16,
        width: '100%',
        maxWidth: showPhotos ? 960 : 720,
        transition: 'max-width 0.3s',
      }}>
        {ARTIST_LIST.map(config => (
          <ArtistCard key={config.slug} config={config} showPhoto={showPhotos} />
        ))}

        {/* WOLFgold is now a full tracker — card rendered via ARTIST_LIST above */}

        {/* Juicegold — external Google Sheet */}
        <ExternalCard
          href="https://docs.google.com/spreadsheets/d/1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568/edit?gid=0#gid=0"
          label="Juice WRLD"
          logoSrc="/logos/juicegold.png"
          logoAlt="Juicegold"
          cardLetter="JCE"
          accent="#e53e3e"
          photoSrc={showPhotos ? '/artists/juice.webp' : undefined}
        />
      </main>

      {/* My Tracker — full width */}
      <div style={{ width: '100%', maxWidth: showPhotos ? 960 : 720, marginTop: 16 }}>
        <MyTrackerCard />
      </div>

      {/* Social + Account */}
      <div style={{ width: '100%', maxWidth: showPhotos ? 960 : 720, marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <a href="https://discord.gg/xYhKgCDX8h" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(88,101,242,0.12)', border: '1px solid rgba(88,101,242,0.25)', color: '#5865F2', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          <SiDiscord style={{ width: 16, height: 16 }} /> Discord
        </a>
        <a href="https://www.reddit.com/r/2YZY2GOLD/" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,69,0,0.12)', border: '1px solid rgba(255,69,0,0.25)', color: '#FF4500', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          <SiReddit style={{ width: 16, height: 16 }} /> Reddit
        </a>
        <a href="https://www.tiktok.com/t/ZTBerQPF2/" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          <SiTiktok style={{ width: 16, height: 16 }} /> TikTok
        </a>
        <a href="/label" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(201,162,36,0.08)', border: '1px solid rgba(201,162,36,0.2)', color: '#C9A224', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          Unvaulted Records
        </a>
        {user ? (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{user.username}</span>
            <button
              onClick={signOut}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(201,162,36,0.12)', border: '1px solid rgba(201,162,36,0.3)', color: '#C9A224', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
          >
            <GoogleIcon /> Sign in with Google
          </button>
        )}
      </div>

      <footer style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          © 2026 UNVAULTED
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          Logos created by YZYsam &amp; north on Discord
        </span>
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
