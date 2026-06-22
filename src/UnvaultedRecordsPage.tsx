import { useState, useRef } from 'react';
import { retryImageOnError } from './utils';

const ACCENT = '#C9A224';

const ARTISTS = [
  { name: 'Alexias',        letter: 'A', accent: '#7C6FCD', description: 'Hip-Hop' },
  { name: 'ciatanner',      letter: 'C', accent: '#4EA8C9', description: 'Hip-Hop' },
  { name: 'Don Juan',       letter: 'D', accent: '#C9A224', description: 'Hip-Hop' },
  { name: 'Big Poppa Perc',        letter: 'P', accent: '#E05C5C', description: 'Hip-Hop' },
  { name: 'Lux',            letter: 'L', accent: '#F0A500', description: 'Hip-Hop' },
  { name: 'unvaulted0760',  letter: 'M', accent: '#5CC9A8', description: 'Hip-Hop' },
  { name: 'Nr7th',          letter: 'N', accent: '#B57BFF', description: 'Hip-Hop' },
  { name: 'Buffet West',            letter: 'B', accent: '#E8734A', description: 'Hip-Hop' },
   { name: 'MilesYe',        letter: 'M', accent: '#7C6FCD', description: 'Hip-Hop' },
];

const ALBUMS = [
  {
    title: 'Buffet West - BULKY',
    label: 'Mixtape',
    year: '2026',
    cover: '/unvaulted-records/bulky-cover.jpg',
    streamUrl: 'https://untitled.stream/library/project/Fuhtj8VCN9V9pNfMNljQJ',
    tracks: [
      { n: 1,  title: 'FEEDER MAN',                            artist: 'Buffet West', src: 'unvaulted-records/audio/feeder-man.m4a' },
      { n: 2,  title: 'BEAUTY AND THE FEAST',                        artist: 'Buffet West', src: 'unvaulted-records/audio/beauty-and-the-feast.m4a' },
      { n: 3,  title: 'FATTER (feat. Travis Scott)',               artist: 'Buffet West', src: 'unvaulted-records/audio/fatter.m4a' },
      { n: 4,  title: 'ALL THE FOOD (feat. BTS)',           artist: 'Buffet West', src: 'unvaulted-records/audio/all-the-food.m4a' },
      { n: 5,  title: 'LAST SNACK',        artist: 'Buffet West', src: 'unvaulted-records/audio/last-snack.m4a' },
      { n: 6,  title: 'BULKY',                    artist: 'Buffet West', src: 'unvaulted-records/audio/bulky.m4a' },
      { n: 7,  title: 'HAM (feat. MilesYe)',                      artist: 'Buffet West', src: 'unvaulted-records/audio/ham.m4a' },
      { n: 8,  title: 'WHITE CASTLE',                artist: 'Buffet West', src: 'unvaulted-records/audio/white-castle.m4a' },
      { n: 9,  title: 'FRIES AND DOUGH',                          artist: 'Buffet West', src: 'unvaulted-records/audio/fries-and-dough.m4a' },
      { n: 10, title: 'I CAN EAT',                         artist: 'Buffet West', src: 'unvaulted-records/audio/i-can-eat.m4a' },
      { n: 11, title: 'GEMINI SEASONING',                       artist: 'Buffet West', src: 'gemini-season.m4a' },
    ],
  },
       
  {
    title: 'UNVAULTED Records - IN AN IMPERFECT WORLD',
    label: 'Mixtape',
    year: '2026',
    cover: '/unvaulted-records-debut-cover.jpg',
    streamUrl: 'https://untitled.stream/library/project/bSnHBgkbVlvZtjb1kPrs8',
    tracks: [
      { n: 1,  title: 'SISTERS AND BROTHERS',                               artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/sisters-and-brothers.m4a' },
      { n: 2,  title: 'KING OF SOUL (feat. FROMDABUNKER)',                 artist: 'ciatanner',           src: '/unvaulted-records/audio/king-of-soul.m4a' },
      { n: 3,  title: 'BABY I TRIED (feat. FROMDABUNKA & Sheffmade)',      artist: 'ciatanner',           src: '/unvaulted-records/audio/baby-i-tried.mp3' },
      { n: 4,  title: 'ALIVE (feat. Youngboy Never Broke Again & Playboi Carti)', artist: 'Big Poppa Perc, ciatanner',      src: '/unvaulted-records/audio/alive.mp3' },
      { n: 5,  title: 'MAGAZINES',                                          artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/magazines.m4a' },
      { n: 6,  title: 'COUSINS',                                            artist: 'Alexais',            src: '/unvaulted-records/audio/cousins.mp3' },
      { n: 7,  title: 'VIRGIL',                                             artist: 'Big Poppa Perc, Alexais',            src: '/unvaulted-records/audio/virgil.m4a' },
      { n: 8,  title: 'JESUS',                                              artist: 'Alexais',            src: '/unvaulted-records/audio/jesus.mp3' },
      { n: 9,  title: 'SUNDAY',                                             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/sunday.m4a' },
      { n: 10, title: 'MISSION CONTROL (feat. Text To Speech)',             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/mission-control.m4a' },
      { n: 11, title: "BIANCAGOLD'S INTERLUDE",                             artist: 'BIANCAGOLD, YZYGOLD', src: '/unvaulted-records/audio/biancagold-interlude.mp3' },
      { n: 12, title: 'BIANCA (feat. Ye-I)',                                             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/New_Project.mp3' },
      { n: 13, title: 'WISH',                                               artist: 'Don Juan',           src: '/unvaulted-records/audio/wish.mp3' },
      { n: 14, title: 'ALL THE LOVE (feat. MxYT & Ye-I)',                                       artist: 'Max3:16420999, YZYGOLD',  src: '/unvaulted-records/audio/all-the-love.mp3' },
      { n: 15, title: 'BABY I TRIED (Remix) (feat. FROMDABUNKA & Sheffmade)',                                             artist: 'Lux',            src: '/unvaulted-records/audio/Cosby.mp3' },
      { n: 16, title: 'BIANCA (Remix)',                                             artist: 'Don Juan',            src: '/unvaulted-records/audio/Bianca_3.0.mp3' },
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

const SINGLES = [
  {
    title: 'All The Alexais (The Chakra) All The Alexais (The Chakra) (feat. André Troutman)',
    artist: 'Alexais',
    year: '2026',
    src: '/unvaulted-records/audio/all-the-alexais.mp3',
    cover: '/unvaulted-records/all-the-alexais-cover.jpg',
  },
];

type Track = typeof ALBUMS[0]['tracks'][0];

function AlbumView({ album }: { album: typeof ALBUMS[0] }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => {}); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const handleTrackClick = (track: Track, streamUrl: string) => {
    if (!track.src) { window.open(streamUrl, '_blank', 'noopener,noreferrer'); return; }
    if (currentTrack?.n === track.n) { togglePlay(); return; }
    setProgress(0);
    setDuration(0);
    setCurrentTrack(track);
    setPlaying(true);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* Album hero */}
      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', marginBottom: 48, flexWrap: 'wrap' }}>
        <img onError={retryImageOnError}
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
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
            {album.title}
          </h2>
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Unvaulted Records · {album.year} · {album.tracks.length} tracks
          </div>
          {album.streamUrl && (
            <a href={album.streamUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 20, padding: '10px 20px',
                background: ACCENT, color: '#000',
                borderRadius: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                transition: 'opacity 0.15s', width: 'fit-content',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
              Listen Now
            </a>
          )}
        </div>
      </div>

      {/* Hidden audio element — key forces remount on track change */}
      {currentTrack?.src && (
        <audio
          key={currentTrack.n}
          ref={audioRef}
          src={currentTrack.src}
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          onTimeUpdate={e => setProgress(e.currentTarget.currentTime)}
          onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
          style={{ display: 'none' }}
        />
      )}

      {/* Mini player */}
      {currentTrack && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          padding: '16px 18px', marginBottom: 16,
          background: '#111', border: `1px solid ${ACCENT}33`,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={togglePlay} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: ACCENT, color: '#000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {playing
                ? <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
              }
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{currentTrack.artist}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(progress)} / {fmt(duration)}
            </span>
          </div>
          {/* Progress bar */}
          <div onClick={seek} style={{
            height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: duration ? `${(progress / duration) * 100}%` : '0%',
              background: ACCENT, borderRadius: 2, transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}

      {/* Tracklist header */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto',
        padding: '8px 12px', marginBottom: 4,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
      }}>
        <span>#</span><span>Title</span><span>Artist</span>
      </div>

      {album.tracks.map(track => (
        <TrackRow
          key={track.n}
          track={track}
          isPlaying={playing && currentTrack?.n === track.n}
          isActive={currentTrack?.n === track.n}
          onClick={() => handleTrackClick(track, album.streamUrl)}
        />
      ))}
    </div>
  );
}

function TrackRow({ track, isPlaying, isActive, onClick }: {
  track: Track; isPlaying: boolean; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const hasAudio = !!track.src;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '40px 1fr auto',
        padding: '12px 12px', borderRadius: 8, gap: 8, alignItems: 'center',
        background: isActive ? `${ACCENT}0d` : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
        {isActive && isPlaying ? (
          <svg viewBox="0 0 24 24" fill={ACCENT} width="14" height="14"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : isActive ? (
          <svg viewBox="0 0 24 24" fill={ACCENT} width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
        ) : hovered ? (
          <svg viewBox="0 0 24 24" fill="#fff" width="14" height="14"><path d="M8 5v14l11-7z" /></svg>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>{track.n}</span>
        )}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: isActive ? ACCENT : hovered && hasAudio ? '#fff' : 'rgba(255,255,255,0.85)',
        transition: 'color 0.15s',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {track.title}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
        {track.artist}
      </span>
    </div>
  );
}

function SinglesView() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  function togglePlay(src: string) {
    if (playing === src) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const a = new Audio(src);
      audioRef.current = a;
      a.play();
      setPlaying(src);
      a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
      a.onended = () => { setPlaying(null); setProgress(0); };
    }
  }

  return (
    <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 80px' }}>
      {SINGLES.map(single => {
        const isPlaying = playing === single.src;
        return (
          <div key={single.title} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '20px 24px', borderRadius: 16,
            background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 12,
          }}>
            {single.cover && (
              <img onError={retryImageOnError} src={single.cover} alt={single.title}
                style={{ flexShrink: 0, width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <button
              onClick={() => togglePlay(single.src)}
              style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: '50%',
                border: `1.5px solid ${ACCENT}`, background: isPlaying ? ACCENT : 'transparent',
                color: isPlaying ? '#000' : ACCENT, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'background 0.15s, color 0.15s',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', color: '#fff', marginBottom: 3 }}>
                {single.title}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {single.artist} · {single.year} · Single
              </div>
              {isPlaying && (
                <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ width: `${progress * 100}%`, height: '100%', background: ACCENT, borderRadius: 2, transition: 'width 0.25s linear' }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = ['Artists', 'Albums', 'Singles'];
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
      ) : tab === 'Albums' ? (
        ALBUMS.map(album => <AlbumView key={album.title} album={album} />)
      ) : (
        <SinglesView />
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
            boundaries of sound. Home to Alexias, ciatanner, Don Juan, Big Poppa Perc,
            Lux, Max3:16420999, YZYGOLD, Nr7th, BIANCAGOLD and Buffet West — we build music that lasts.
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
