import { useState } from 'react';

const ACCENT = '#C9A224';
const ACCENT_DIM = '#C9A22422';

const ARTISTS = [
  {
    name: 'Alexias',
    letter: 'A',
    accent: '#7C6FCD',
    description: 'R&B / Soul',
  },
  {
    name: 'CIATANNER',
    letter: 'C',
    accent: '#4EA8C9',
    description: 'Alternative / Indie',
  },
  {
    name: 'Don Juan',
    letter: 'D',
    accent: '#C9A224',
    description: 'Hip-Hop / Rap',
  },
  {
    name: 'YZY Sam',
    letter: 'Y',
    accent: '#E05C5C',
    description: 'Hip-Hop / Electronic',
  },
  {
    name: 'LUX',
    letter: 'L',
    accent: '#F0A500',
    description: 'Electronic / Ambient',
  },
  {
    name: 'MAX3:16420999',
    letter: 'M',
    accent: '#5CC9A8',
    description: 'Hip-Hop / Experimental',
  },
  {
    name: 'YZYGOLD',
    letter: 'G',
    accent: '#FFD700',
    description: 'Hip-Hop / Rap',
  },
  {
    name: 'Nr7th',
    letter: 'N',
    accent: '#B57BFF',
    description: 'R&B / Neo-Soul',
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
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 0% 100%, ${accent}18, transparent 65%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }} />

      {/* Big background letter */}
      <div style={{
        position: 'absolute', right: -10, bottom: -20,
        fontSize: 140, fontWeight: 900, letterSpacing: '-0.05em',
        color: hovered ? `${accent}14` : 'rgba(255,255,255,0.02)',
        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
        transition: 'color 0.25s',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {letter}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Genre tag */}
        <div style={{
          display: 'inline-block',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: accent,
          background: `${accent}18`,
          border: `1px solid ${accent}33`,
          borderRadius: 5,
          padding: '3px 9px',
          marginBottom: 20,
        }}>
          {description}
        </div>

        {/* Artist name */}
        <div style={{
          fontSize: 34, fontWeight: 900,
          letterSpacing: '-0.03em', lineHeight: 1.05,
          color: '#fff',
        }}>
          {name}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 28,
        }}>
          <span style={{
            width: 40, height: 2,
            background: hovered ? accent : 'rgba(255,255,255,0.15)',
            borderRadius: 2, display: 'block',
            transition: 'background 0.25s',
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function UnvaultedRecordsPage() {
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
        padding: '0 32px',
        height: 60,
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

        <div style={{
          fontSize: 12, fontWeight: 800,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: ACCENT,
        }}>
          Unvaulted Records
        </div>

        <div style={{ width: 80 }} />
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 400,
          background: `radial-gradient(ellipse, ${ACCENT}12, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(120px, 25vw, 260px)',
          fontWeight: 900, letterSpacing: '-0.05em',
          color: 'rgba(255,255,255,0.018)',
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
          lineHeight: 1,
        }}>
          UV
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Label badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: ACCENT,
            background: `${ACCENT}14`,
            border: `1px solid ${ACCENT}33`,
            borderRadius: 6, padding: '5px 14px',
            marginBottom: 32,
          }}>
            <PlayIcon />
            Independent Record Label
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 8vw, 90px)',
            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
            margin: 0,
          }}>
            UNVAULTED
            <br />
            <span style={{ color: ACCENT }}>RECORDS</span>
          </h1>

          <p style={{
            marginTop: 24, fontSize: 16,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Artist Roster
          </p>
        </div>
      </section>

      {/* Divider */}
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto 48px', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
      </div>

      {/* Artist grid */}
      <section style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}>
          {ARTISTS.map(a => (
            <ArtistCard key={a.name} artist={a} />
          ))}
        </div>
      </section>

      {/* About strip */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 24px',
        textAlign: 'center',
        background: '#080808',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: ACCENT, marginBottom: 16,
          }}>
            About
          </div>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)',
          }}>
            Unvaulted Records is an independent label dedicated to pushing the
            boundaries of sound. Home to Alexias, CIATANNER, Don Juan, YZY Sam,
            LUX, MAX3:16420999, YZYGOLD, and Nr7th — we build music that lasts.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '36px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontSize: 12, color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          © 2026 Unvaulted Records
        </span>
        <a href="/" style={{
          fontSize: 12, color: 'rgba(255,255,255,0.2)',
          textDecoration: 'none', letterSpacing: '0.05em',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          unvaulted.cc
        </a>
      </footer>

      <style>{`
        @media (max-width: 520px) {
          section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
