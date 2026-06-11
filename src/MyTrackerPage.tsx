import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';
import { ARTIST_LIST } from './artists/registry';

const SHARED_SETTINGS_KEY = 'vaultgold_shared_settings';

export function MyTrackerPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [url, setUrl] = useState(settings.googleSheetsUrl || '');
  const [selectedArtist, setSelectedArtist] = useState('yzygold');
  const [error, setError] = useState('');

  const accent = '#C9A224';

  function handleLaunch() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a Google Sheets URL.');
      return;
    }
    if (!trimmed.includes('docs.google.com/spreadsheets')) {
      setError('URL must be a Google Sheets link.');
      return;
    }
    updateSettings({ googleSheetsUrl: trimmed });
    // Persist immediately before navigating
    const current = localStorage.getItem(SHARED_SETTINGS_KEY);
    let parsed: Record<string, unknown> = {};
    try { parsed = current ? JSON.parse(current) : {}; } catch { /* ignore */ }
    localStorage.setItem(SHARED_SETTINGS_KEY, JSON.stringify({ ...parsed, googleSheetsUrl: trimmed }));
    navigate(`/${selectedArtist}`);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 24px 80px',
    }}>
      {/* Back */}
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="1.5" style={{ width: 12, height: 12, stroke: 'currentColor' }}><path d="M10 6H2M2 6L6 2M2 6l4 4" /></svg>
          Back
        </button>
      </div>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 560, marginBottom: 40 }}>
        <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, borderRadius: 4, padding: '3px 8px', marginBottom: 16 }}>Custom</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, marginBottom: 12 }}>
          MY <span style={{ color: accent }}>TRACKER</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Link your own public Google Sheet to use as a custom song tracker. Your sheet should use the standard tracker format: <span style={{ color: 'rgba(255,255,255,0.7)' }}>Era, Name, Notes, Track Length, File Date, Leak Date, Available Length, Quality, Link(s)</span>.
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Sheet URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
            Google Sheets URL
          </label>
          <input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            style={{
              background: '#111',
              border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              padding: '12px 14px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            The sheet must be publicly accessible (File → Share → Anyone with the link can view).
          </span>
        </div>

        {/* Artist template */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
            Tracker Template
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ARTIST_LIST.map(a => (
              <button
                key={a.slug}
                onClick={() => setSelectedArtist(a.slug)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: selectedArtist === a.slug ? a.accentColor : 'rgba(255,255,255,0.1)',
                  background: selectedArtist === a.slug ? `${a.accentColor}1a` : 'transparent',
                  color: selectedArtist === a.slug ? a.accentColor : 'rgba(255,255,255,0.55)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {a.artistLabel}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Choosing a template sets the era structure, tags, and styling. Your sheet's data overrides the default song list.
          </span>
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          style={{
            marginTop: 8,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: accent,
            color: '#000',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Launch My Tracker →
        </button>

        {settings.googleSheetsUrl && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
              Current: {settings.googleSheetsUrl}
            </span>
            <button
              onClick={() => { updateSettings({ googleSheetsUrl: '' }); setUrl(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', fontSize: 12, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
