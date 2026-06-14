import { useState } from 'react';

const ACCENT = '#C9A224';

const ARTISTS = [
  { name: 'Alexias',        letter: 'A', accent: '#7C6FCD', description: 'Hip-Hop' },
  { name: 'CIATANNER',      letter: 'C', accent: '#4EA8C9', description: 'Hip-Hop' },
  { name: 'Don Juan',       letter: 'D', accent: '#C9A224', description: 'Hip-Hop' },
  { name: 'YZY Sam',        letter: 'Y', accent: '#E05C5C', description: 'Hip-Hop' },
  { name: 'LUX',            letter: 'L', accent: '#F0A500', description: 'Hip-Hop' },
  { name: 'MAX 3:16',  letter: 'M', accent: '#5CC9A8', description: 'Hip-Hop' },
  { name: 'YZYGOLD',        letter: 'G', accent: '#FFD700', description: 'Hip-Hop' },
  { name: 'Nr7th',          letter: 'N', accent: '#B57BFF', description: 'Hip-Hop' },
  { name: 'PAW',            letter: 'P', accent: '#E8734A', description: 'Hip-Hop' },
];

const ALBUMS = [
  {
    title: 'In A Imperfect World',
    label: 'Debut Album',
    year: '2026',
    cover: '/unvaulted-records-debut-cover.jpg',
    streamUrl: 'https://untitled.stream/library/project/bSnHBgkbVlvZtjb1kPrs8',
    tracks: [
      { n: 1,  title: 'SISTERS AND BROTHERS',                               artist: 'YZY Sam' },
      { n: 2,  title: 'KING OF SOUL (feat. FROMDABUNKER)',                  artist: 'ciatanner' },
      { n: 3,  title: 'BABY I TRIED (feat. FROMDABUNKER & Sheffmade)',      artist: 'ciatanner' },
      { n: 4,  title: 'ALIVE (feat. Youngboy Never Broke Again & Playboi Carti)', artist: 'YZY Sam' },
      { n: 5,  title: 'MAGAZINES',                                          artist: 'YZY Sam' },
      { n: 6,  title: 'COUSINS',                                            artist: 'Alexais' },
      { n: 7,  title: 'VIRGIL',                                             artist: 'YZY Sam' },
      { n: 8,  title: 'JESUS',                                              artist: 'Alexais' },
      { n: 9,  title: 'SUNDAY',                                             artist: 'YZY Sam' },
      { n: 10, title: 'MISSION CONTROL (feat. Text To Speech)',             artist: 'YZY Sam' },
      { n: 11, title: "BIANCAGOLD'S INTERLUDE",                             artist: 'BIANCAGOLD, YZYGOLD' },
      { n: 12, title: 'BIANCA',                                             artist: 'YZY Sam' },
      { n: 13, title: 'WISH',                                               artist: 'Don Juan' },
      { n: 14, title: 'ALL THE LOVE',                                       artist: 'MAX 3:16, YZYGOLD' },
    ],
  },
];

function ArtistCard({ artist }: { artist: typeof ARTISTS[0] }) {
  const [hovered, setHovered] = useState(false);
  const { name, letter, accent, description } = artist;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '36px 32px 28px',
        background: '#0f0f0f',
        border: `1px solid ${hovered ? `${accent}55` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.25s, transform 0.2s, box-shadow 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22`
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 0% 100%, ${accent}18, transparent 65%)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: -10, bottom: -20,
        fontSize: 140, fontWeight: 900, letterSpacing: '-0.05em',
        color: hovered ? `${accent}14` : 'rgba(255,255,255,0.02)',
        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
        transition: 'color 0.25s', fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {letter}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: accent, background: `${accent}18`, border: `1px solid ${accent}33`,
          borderRadius: 5, padding: '3px 9px', marginBottom: 20,
        }}>
          {description}
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#fff' }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
          <span style={{
            width: 40, height: 2, background: hovered ? accent : 'rgba(255,255,255,0.15)',
            borderRadius: 2, display: 'block', transition: 'background 0.25s',
          }} />
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `1px solid ${hovered ? accent : 'rgba(255,255,255,0.12)'}`,
            background: hovered ? `${accent}18` : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.25s, background 0.25s',
          }}>
            <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
              <circle cx="7" cy="7" r="2.5" fill={hovered ? accent : 'rgba(255,255,255,0.4)'} style={{ transition: 'fill 0.25s' }} />
              <circle cx="7" cy="7" r="5.5" stroke={hovered ? accent : 'rgba(255,255,255,0.25)'} strokeWidth="1" style={{ transition: 'stroke 0.25s' }} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlbumView({ album }: { album: typeof ALBUMS[0] }) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* Album hero */}
      <div style={{
        display: 'flex', gap: 36, alignItems: 'flex-start',
        marginBottom: 48, flexWrap: 'wrap',
      }}>
        <img
          src={album.cover}
          alt={album.title}
          style={{
            width: 220, height: 220, objectFit: 'cover',
            borderRadius: 12, flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 4 }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: ACCENT, background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`,
            borderRadius: 5, padding: '3px 9px', marginBottom: 16, width: 'fit-content',
          }}>
            {album.label}
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0,
          }}>
            {album.title}
          </h2>
          <div style={{
            marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Unvaulted Records · {album.year} · {album.tracks.length} tracks
          </div>
          {album.streamUrl && (
            <a
              href={album.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 20, padding: '10px 20px',
                background: ACCENT, color: '#000',
                borderRadius: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M8 5v14l11-7z" />
              </svg>
              Listen Now
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />

      {/* Tracklist header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto',
        padding: '8px 12px', marginBottom: 4,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
      }}>
        <span>#</span>
        <span>Title</span>
        <span>Artist</span>
      </div>

      {/* Tracks */}
      {album.tracks.map(track => (
        <TrackRow key={track.n} track={track} />
      ))}
    </div>
  );
}

function TrackRow({ track }: { track: { n: number; title: string; artist: string } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto',
        padding: '12px 12px',
        borderRadius: 8,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.15s',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{
        fontSize: 13, fontWeight: 500,
        color: hovered ? ACCENT : 'rgba(255,255,255,0.25)',
        transition: 'color 0.15s', fontVariantNumeric: 'tabular-nums',
      }}>
        {track.n}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: hovered ? '#fff' : 'rgba(255,255,255,0.85)',
        transition: 'color 0.15s',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {track.title}
      </span>
      <span style={{
        fontSize: 12, color: 'rgba(255,255,255,0.35)',
        whiteSpace: 'nowrap', letterSpacing: '0.02em',
      }}>
        {track.artist}
      </span>
    </div>
  );
}

function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = ['Artists', 'Albums'];
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 4,
      width: 'fit-content', margin: '0 auto 48px',
    }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '8px 24px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
            transition: 'background 0.15s, color 0.15s',
            background: active === t ? ACCENT : 'transparent',
            color: active === t ? '#000' : 'rgba(255,255,255,0.45)',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function UnvaultedRecordsPage() {
  const [tab, setTab] = useState('Artists');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      overflowX: 'hidden',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60,
        background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <a href="/" style={{
          fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10" stroke="currentColor" strokeWidth="2">
            <path d="M10 6H2M2 6l4-4M2 6l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Unvaulted
        </a>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT }}>
          Unvaulted Records
        </div>
        <div style={{ width: 80 }} />
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '80px 24px 60px', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 400,
          background: `radial-gradient(ellipse, ${ACCENT}12, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(120px, 25vw, 260px)',
          fontWeight: 900, letterSpacing: '-0.05em',
          color: 'rgba(255,255,255,0.018)',
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
        }}>
          UV
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: ACCENT,
            background: `${ACCENT}14`, border: `1px solid ${ACCENT}33`,
            borderRadius: 6, padding: '5px 14px', marginBottom: 28,
          }}>
            Independent Record Label
          </div>
          <h1 style={{
            fontSize: 'clamp(42px, 8vw, 90px)',
            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: 0,
          }}>
            UNVAULTED<br /><span style={{ color: ACCENT }}>RECORDS</span>
          </h1>
        </div>
      </section>

      {/* Tab bar */}
      <TabBar active={tab} onChange={setTab} />

      {/* Content */}
      {tab === 'Artists' ? (
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {ARTISTS.map(a => <ArtistCard key={a.name} artist={a} />)}
          </div>
        </section>
      ) : (
        ALBUMS.map(album => <AlbumView key={album.title} album={album} />)
      )}

      {/* About strip */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 24px', textAlign: 'center', background: '#080808',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: ACCENT, marginBottom: 16,
          }}>
            About
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)' }}>
            Unvaulted Records is an independent label dedicated to pushing the
            boundaries of sound. Home to Alexias, CIATANNER, Don Juan, YZY Sam,
            LUX, MAX 3:16, YZYGOLD, Nr7th, and PAW — we build music that lasts.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          © 2026 Unvaulted Records
        </span>
        <a href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', letterSpacing: '0.05em', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          unvaulted.cc
        </a>
      </footer>

      <style>{`
        @media (max-width: 520px) {
          .artist-grid { grid-template-columns: 1fr !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
