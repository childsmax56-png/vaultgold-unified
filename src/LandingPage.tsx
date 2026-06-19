import { useEffect, useState } from 'react';
import { AnnouncementPopup } from './components/AnnouncementPopup';
import { useNavigate } from 'react-router-dom';
import { SiDiscord, SiReddit, SiTiktok, SiX } from 'react-icons/si';
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
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
      />
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

        <div style={row}>
          <div><div style={label}>Theme Color</div></div>
          <input
            type="color"
            value={settings.themeColor}
            onChange={e => updateSettings({ themeColor: e.target.value })}
            style={{ width: 36, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0 }}
          />
        </div>

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

        <div style={row}>
          <div>
            <div style={label}>Artist Photos</div>
            <div style={sublabel}>Show artist photos on cards</div>
          </div>
          <Toggle on={settings.landingArtistPhotos} onToggle={() => updateSettings({ landingArtistPhotos: !settings.landingArtistPhotos })} />
        </div>

        <div style={row}>
          <div style={label}>Tags as Emojis</div>
          <Toggle on={settings.tagsAsEmojis} onToggle={() => updateSettings({ tagsAsEmojis: !settings.tagsAsEmojis })} />
        </div>

        <div style={row}>
          <div>
            <div style={label}>Startup Shuffle</div>
            <div style={sublabel}>Shuffle on first load</div>
          </div>
          <Toggle on={settings.startupShuffle} onToggle={() => updateSettings({ startupShuffle: !settings.startupShuffle })} />
        </div>

        <div style={row}>
          <div style={label}>Synced Lyrics Only</div>
          <Toggle on={settings.syncedLyricsOnly} onToggle={() => updateSettings({ syncedLyricsOnly: !settings.syncedLyricsOnly })} />
        </div>

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
    const params = new URLSearchParams(window.location.search);
    const token = params.get('vg_token');
    const userRaw = params.get('vg_user');
    if (!token || !userRaw) return;
    window.history.replaceState({}, '', window.location.pathname);
    try {
      const vgUser = JSON.parse(decodeURIComponent(userRaw));
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(vgUser));
      setUser(vgUser);
    } catch {}
  }, []);

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
    window.location.href = `${VG_API}/api/auth/google/connect?return_to=${encodeURIComponent(window.location.origin)}`;
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

// ─── Card components ──────────────────────────────────────────────────────────

type CardVariant = 'featured' | 'medium' | 'small';

const VARIANT_ASPECT: Record<CardVariant, string> = { featured: '1/1', medium: '1/1', small: '1/1' };
const VARIANT_LOGO_HEIGHT_PX: Record<CardVariant, number> = { featured: 260, medium: 160, small: 100 };
const VARIANT_RADIUS: Record<CardVariant, number> = { featured: 14, medium: 14, small: 10 };
const LOGO_HEIGHT: Record<CardVariant, number> = { featured: 38, medium: 28, small: 20 };
const NAME_SIZE: Record<CardVariant, number> = { featured: 18, medium: 14, small: 11 };
const ARTIST_SIZE: Record<CardVariant, number> = { featured: 12, medium: 11, small: 9 };
const CARD_PADDING: Record<CardVariant, string> = { featured: '24px 16px 14px', medium: '20px 12px 10px', small: '14px 10px 8px' };
const LOGO_PADDING: Record<CardVariant, string> = { featured: '18px', medium: '14px', small: '10px' };

function EditorialArtistCard({ config, showPhoto, variant }: {
  config: ArtistConfig;
  showPhoto: boolean;
  variant: CardVariant;
}) {
  const navigate = useNavigate();
  const accent = config.accentColor;
  const photoUrl = showPhoto && config.artistPhotoUrl ? config.artistPhotoUrl : null;
  const aspectRatio = VARIANT_ASPECT[variant];
  const borderRadius = VARIANT_RADIUS[variant];

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = `${accent}66`;
    e.currentTarget.style.transform = 'translateY(-2px)';
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>, base: string) => {
    e.currentTarget.style.borderColor = base;
    e.currentTarget.style.transform = '';
  };

  if (photoUrl) {
    return (
      <div
        onClick={() => navigate(`/${config.slug}`)}
        onMouseEnter={onEnter}
        onMouseLeave={e => onLeave(e, 'transparent')}
        style={{
          position: 'relative', borderRadius, overflow: 'hidden', cursor: 'pointer',
          aspectRatio, border: '1px solid transparent', background: '#111',
          transition: 'border-color 0.2s, transform 0.15s',
        }}
      >
        <img
          src={photoUrl}
          alt={config.artistLabel}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: accent }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: CARD_PADDING[variant] }}>
          {variant === 'featured' && (
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(201,162,36,0.25)', color: '#C9A224', padding: '2px 7px', borderRadius: 4, marginBottom: 6 }}>Featured</div>
          )}
          <div style={{ fontSize: NAME_SIZE[variant], fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{config.artistLabel}</div>
          <div style={{ fontSize: ARTIST_SIZE[variant], color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{config.SITE_NAME}</div>
        </div>
      </div>
    );
  }

  // Logo / text mode
  const baseBorder = variant === 'featured' ? `${accent}30` : 'rgba(255,255,255,0.07)';
  return (
    <div
      onClick={() => navigate(`/${config.slug}`)}
      onMouseEnter={onEnter}
      onMouseLeave={e => onLeave(e, baseBorder)}
      style={{
        position: 'relative', borderRadius, overflow: 'hidden', cursor: 'pointer',
        minHeight: VARIANT_LOGO_HEIGHT_PX[variant], background: variant === 'featured' ? `${accent}0a` : '#0f0f0f',
        border: `1px solid ${baseBorder}`,
        padding: LOGO_PADDING[variant],
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
    >
      <div>
        {variant === 'featured' && (
          <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: `${accent}20`, color: accent, padding: '2px 7px', borderRadius: 4, marginBottom: 10 }}>Featured</div>
        )}
        {config.logoUrl ? (
          <>
            <img
              src={config.logoUrl}
              alt={config.SITE_NAME}
              style={{ display: 'block', height: LOGO_HEIGHT[variant], width: 'auto', maxWidth: '100%', objectFit: 'contain', objectPosition: 'left center' }}
              onError={e => {
                const img = e.currentTarget;
                img.style.display = 'none';
                const fb = img.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'block';
              }}
            />
            <div style={{ display: 'none', fontSize: NAME_SIZE[variant], fontWeight: 900, color: accent, letterSpacing: '-0.02em' }}>{config.SITE_NAME}</div>
          </>
        ) : (
          <div style={{ fontSize: NAME_SIZE[variant], fontWeight: 900, color: accent, letterSpacing: '-0.02em' }}>{config.SITE_NAME}</div>
        )}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${accent}aa` }}>{config.artistLabel}</div>
    </div>
  );
}

function ExternalSmallCard({ href, label, logoSrc, logoAlt, accent, photoSrc, variant = 'small' }: {
  href: string; label: string; logoSrc: string; logoAlt: string; accent: string; photoSrc?: string; variant?: CardVariant;
}) {
  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.borderColor = `${accent}66`;
    e.currentTarget.style.transform = 'translateY(-2px)';
  };
  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.borderColor = photoSrc ? 'transparent' : 'rgba(255,255,255,0.07)';
    e.currentTarget.style.transform = '';
  };

  if (photoSrc) {
    return (
      <a
        href={href} target="_blank" rel="noopener noreferrer"
        onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{
          position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
          aspectRatio: '1/1', border: '1px solid transparent', background: '#111',
          display: 'block', textDecoration: 'none',
          transition: 'border-color 0.2s, transform 0.15s',
        }}
      >
        <img src={photoSrc} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: accent }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 10px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{label}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{logoAlt}</div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{
        position: 'relative', borderRadius: VARIANT_RADIUS[variant], overflow: 'hidden', cursor: 'pointer',
        minHeight: VARIANT_LOGO_HEIGHT_PX[variant], background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: LOGO_PADDING.small,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        textDecoration: 'none',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
    >
      <img
        src={logoSrc} alt={logoAlt}
        style={{ display: 'block', height: LOGO_HEIGHT.small, width: 'auto', maxWidth: '100%', objectFit: 'contain', objectPosition: 'left center' }}
        onError={e => {
          const img = e.currentTarget;
          img.style.display = 'none';
          const fb = img.nextElementSibling as HTMLElement;
          if (fb) fb.style.display = 'block';
        }}
      />
      <div style={{ display: 'none', fontSize: 13, fontWeight: 900, color: accent }}>{logoAlt}</div>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${accent}aa` }}>{label}</div>
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

const SHEET_URLS: Record<string, string> = {
  yzygold:    'https://docs.google.com/spreadsheets/d/12nGHPPh5dVTfLuBLVQYzC3QgPxKfvp-jgCoNccvEasM/edit?gid=199908479#gid=199908479',
  vampgold:   'https://docs.google.com/spreadsheets/d/1Irtfvymu26CShYowLMMfD-rM0o9CJqE6-BBSlYsAaF4/edit?gid=0#gid=0',
  wolfgold:   'https://docs.google.com/spreadsheets/d/19GJTNp7PxK1OtyVBmGelZSMm5i8Fy82EGtcFdIkBpsY/edit?gid=1246511510#gid=1246511510',
  drizzygold: 'https://docs.google.com/spreadsheets/d/1v55XAPLzw1iuWxH1OQKajCIYPhW2BXcLoV4mXDZ55DI/edit?gid=755606328#gid=755606328',
  xgold:      'https://docs.google.com/spreadsheets/d/1wKq7lSERmXYutRFxipNbFFc-DUdqhVXWWlFnqkzwRFA/edit?usp=sharing',
  cactigold:  'https://docs.google.com/spreadsheets/d/1gJqbQrb3dIWF-PLMsKkNUrftpQb8zxsZFDAIpSvT5Fo/edit?gid=846204501#gid=846204501',
  kdotgold:   'https://docs.google.com/spreadsheets/d/1i4OQglDHiiqMDthqfUFPutGmpZzK7n63LaoWApqhQXI/edit?gid=1169728352#gid=1169728352',
  twizzygold: 'https://docs.google.com/spreadsheets/d/1FUzAZyTCgFTVxQ--qbCAS2bUk4dsAw6ASxwjURPHbyI',
  uzigold:    'https://docs.google.com/spreadsheets/d/1zqqdIds1iwnx4lh29iF1IlraeuqfGhxH9qLNlWOnryo/edit?gid=1160569231#gid=1160569231',
  dregold:    'https://docs.google.com/spreadsheets/d/10_QK8xP-WCdrfO6RaIkhdDtYUXaM966e6D1xWD__iIo/edit?gid=1520634709#gid=1520634709',
  pushagold:  'https://docs.google.com/spreadsheets/d/19wsRrbQxQ7sz-LhkEYUlKIcVFvXdcG1hvT58zEY03sA/edit?gid=1932839414#gid=1932839414',
  juicegold:  'https://docs.google.com/spreadsheets/d/1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568/edit?gid=0#gid=0',
};

function ShareButton({ url, accent }: { url: string; accent?: string }) {
  const [copied, setCopied] = useState(false);
  const color = accent ?? 'rgba(255,255,255,0.4)';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '7px 10px', borderRadius: 8,
        background: copied ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? `${color}44` : 'rgba(255,255,255,0.08)'}`,
        color: copied ? color : 'rgba(255,255,255,0.45)',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        flex: 1,
      }}
      onMouseEnter={e => {
        if (copied) return;
        const el = e.currentTarget;
        el.style.background = `${color}18`;
        el.style.borderColor = `${color}44`;
        el.style.color = color;
      }}
      onMouseLeave={e => {
        if (copied) return;
        const el = e.currentTarget;
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.borderColor = 'rgba(255,255,255,0.08)';
        el.style.color = 'rgba(255,255,255,0.45)';
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </>
      )}
    </button>
  );
}

function SheetButton({ href, accent }: { href: string; accent?: string }) {
  const color = accent ?? 'rgba(255,255,255,0.4)';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '7px 10px', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.04em', textDecoration: 'none', flex: 1,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = `${color}18`;
        el.style.borderColor = `${color}44`;
        el.style.color = color;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.borderColor = 'rgba(255,255,255,0.08)';
        el.style.color = 'rgba(255,255,255,0.45)';
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      Spreadsheet
    </a>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ConsentModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
          padding: '28px 28px 24px', maxWidth: 400, width: '100%',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          Create your account
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
          Sign in with Google to track your vault rankings and claim your profile.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: '#C9A224', width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A224', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#C9A224', textDecoration: 'underline' }}>Privacy Policy</a>
          </span>
        </label>
        <button
          onClick={() => { if (agreed) { onClose(); onAccept(); } }}
          disabled={!agreed}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
            background: agreed ? 'rgba(201,162,36,0.15)' : 'rgba(255,255,255,0.05)',
            color: agreed ? '#C9A224' : 'rgba(255,255,255,0.25)',
            fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
            cursor: agreed ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
            border: `1px solid ${agreed ? 'rgba(201,162,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export function LandingPage() {
  useSpotifyCallback();
  const [showSettings, setShowSettings] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const { settings } = useSettings();
  const showPhotos = settings.landingArtistPhotos;
  const { user, signInWithGoogle, signOut } = useVGAuth();

  const featured = ARTIST_LIST[0];
  // Carti, Tyler in top-right row 1; Drake in top-right row 2
  const topRight = ARTIST_LIST.slice(1, 4);
  const juiceConfig = ARTIST_LIST.find(c => c.slug === 'juicegold')!;
  const smallArtists = ARTIST_LIST.slice(4).filter(c => c.slug !== 'juicegold');
  const allSmall = smallArtists.map(c => ({ type: 'artist' as const, config: c }));
  const INITIAL_SMALL = 4;
  const visibleSmall = showAll ? allSmall : allSmall.slice(0, INITIAL_SMALL);
  const hiddenCount = allSmall.length - INITIAL_SMALL;

  return (
    <>
    <AnnouncementPopup />
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
      {showConsent && <ConsentModal onAccept={signInWithGoogle} onClose={() => setShowConsent(false)} />}

      <header style={{ textAlign: 'center', marginBottom: 40, width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
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
          style={{ height: 'auto', width: 'clamp(160px, 28vw, 280px)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </header>

      <main style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Featured on the left, 2×2 grid of pinned cards on the right */}
        <div className="grid-top">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <EditorialArtistCard config={featured} showPhoto={showPhotos} variant="featured" />
            <div style={{ display: 'flex', gap: 6 }}>
              {SHEET_URLS[featured.slug] && <SheetButton href={SHEET_URLS[featured.slug]} accent={featured.accentColor} />}
              <ShareButton url={`${window.location.origin}/${featured.slug}`} accent={featured.accentColor} />
            </div>
          </div>
          <div className="grid-pinned">
            {topRight.map(config => (
              <div key={config.slug} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EditorialArtistCard config={config} showPhoto={showPhotos} variant="medium" />
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHEET_URLS[config.slug] && <SheetButton href={SHEET_URLS[config.slug]} accent={config.accentColor} />}
                  <ShareButton url={`${window.location.origin}/${config.slug}`} accent={config.accentColor} />
                </div>
              </div>
            ))}
            {juiceConfig && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EditorialArtistCard config={juiceConfig} showPhoto={showPhotos} variant="medium" />
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHEET_URLS[juiceConfig.slug] && <SheetButton href={SHEET_URLS[juiceConfig.slug]} accent={juiceConfig.accentColor} />}
                  <ShareButton url={`${window.location.origin}/${juiceConfig.slug}`} accent={juiceConfig.accentColor} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2+: remaining artists in a 4-col grid, collapsible */}
        <div className="grid-small">
          {visibleSmall.map(item =>
            item.type === 'artist' ? (
              <div key={item.config.slug} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EditorialArtistCard config={item.config} showPhoto={showPhotos} variant="small" />
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHEET_URLS[item.config.slug] && <SheetButton href={SHEET_URLS[item.config.slug]} accent={item.config.accentColor} />}
                  <ShareButton url={`${window.location.origin}/${item.config.slug}`} accent={item.config.accentColor} />
                </div>
              </div>
            ) : (
              <div key={item.logoAlt} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ExternalSmallCard
                  href={item.href}
                  label={item.label}
                  logoSrc={item.logoSrc}
                  logoAlt={item.logoAlt}
                  accent={item.accent}
                  photoSrc={showPhotos ? item.photo : undefined}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <SheetButton href={item.href} accent={item.accent} />
                  <ShareButton url={item.href} accent={item.accent} />
                </div>
              </div>
            )
          )}
        </div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              alignSelf: 'center', padding: '10px 24px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.08)'; b.style.color = '#fff'; b.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.04)'; b.style.color = 'rgba(255,255,255,0.5)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            {showAll ? 'Show less' : `Show ${hiddenCount} more trackers`}
          </button>
        )}
      </main>

      <div style={{ width: '100%', maxWidth: 900, marginTop: 8 }}>
        <MyTrackerCard />
      </div>

      <div style={{ width: '100%', maxWidth: 900, marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setSocialOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}>
          Community
        </button>
        {socialOpen && (
          <div onClick={() => setSocialOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'relative', background: 'rgba(18,18,20,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
              <button onClick={() => setSocialOpen(false)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: 0 }}>Community</p>
              <a href="https://discord.gg/xYhKgCDX8h" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.25)', color: '#5865F2', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <SiDiscord style={{ width: 18, height: 18 }} /> Discord
              </a>
              <a href="https://www.reddit.com/r/2YZY2GOLD/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,69,0,0.15)', border: '1px solid rgba(255,69,0,0.25)', color: '#FF4500', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <SiReddit style={{ width: 18, height: 18 }} /> Reddit
              </a>
              <a href="https://www.tiktok.com/@vault.gold" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <SiTiktok style={{ width: 18, height: 18 }} /> TikTok
              </a>
              <a href="https://x.com/unvaultedcc" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <SiX style={{ width: 18, height: 18 }} /> X (Twitter)
              </a>
            </div>
          </div>
        )}
        <a href="/label" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(201,162,36,0.08)', border: '1px solid rgba(201,162,36,0.2)', color: '#C9A224', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          Unvaulted Records
        </a>
        <a href="/yeditsgold" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
          yedits<span style={{ color: 'rgba(255,215,0,0.7)' }}>gold</span>
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
            onClick={() => setShowConsent(true)}
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
        .grid-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .grid-pinned {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .grid-small {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        @media (max-width: 600px) {
          .grid-top { grid-template-columns: 1fr 1fr; }
          .grid-top > *:first-child { grid-column: 1 / -1; }
          .grid-small { grid-template-columns: repeat(2, 1fr); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
    </>
  );
}
