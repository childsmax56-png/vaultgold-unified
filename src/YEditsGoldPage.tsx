import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { YEditsView } from './components/YEditsView';
import type { Song, Era } from './types';

const ACCENT = '#FFD700';

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function MiniPlayer({
  song,
  era,
  queue,
  isPlaying,
  onToggle,
  onPrev,
  onNext,
  onClose,
  audioRef,
}: {
  song: Song;
  era: Era;
  queue: Song[];
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
    };
  }, [audioRef]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const idx = queue.findIndex(s => s.url === song.url);
  const hasPrev = idx > 0;
  const hasNext = idx < queue.length - 1;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Track info */}
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {era.name}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onPrev} disabled={!hasPrev} style={{ background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default', color: hasPrev ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0 }}>
            <SkipBack size={16} />
          </button>
          <button onClick={onToggle} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: ACCENT, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={onNext} disabled={!hasNext} style={{ background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: hasNext ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0 }}>
            <SkipForward size={16} />
          </button>
        </div>

        {/* Seek bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 400 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 32, textAlign: 'right' }}>{formatTime(currentTime)}</span>
          <input
            type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
            onChange={seek}
            style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 32 }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume + close */}
      <div style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={changeVolume}
          style={{ width: 72, accentColor: ACCENT, cursor: 'pointer' }}
        />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function YEditsGoldPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentEra, setCurrentEra] = useState<Era | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync audio src when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.url) return;
    audio.src = currentSong.url;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentSong]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.play().catch(() => setIsPlaying(false)); }
    else { audio.pause(); }
  }, [isPlaying]);

  // Auto-advance to next track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const idx = queue.findIndex(s => s.url === currentSong?.url);
      if (idx !== -1 && idx < queue.length - 1) {
        setCurrentSong(queue[idx + 1]);
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [queue, currentSong]);

  const handlePlaySong = useCallback((song: Song, era: Era, contextTracks: Song[]) => {
    setCurrentEra(era);
    setQueue(contextTracks);
    if (currentSong?.url === song.url) {
      setIsPlaying(p => !p);
    } else {
      setCurrentSong(song);
    }
  }, [currentSong]);

  const handlePrev = () => {
    const idx = queue.findIndex(s => s.url === currentSong?.url);
    if (idx > 0) setCurrentSong(queue[idx - 1]);
  };

  const handleNext = () => {
    const idx = queue.findIndex(s => s.url === currentSong?.url);
    if (idx < queue.length - 1) setCurrentSong(queue[idx + 1]);
  };

  const handleClose = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentEra(null);
    setQueue([]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: currentSong ? 100 : 0,
    }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '20px 24px 0',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.12)'; b.style.color = '#fff'; }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.06)'; b.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <ArrowLeft size={15} />
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
            yedits<span style={{ color: ACCENT }}>gold</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
            Community fan-edit projects
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, width: 200,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}55`; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
      </div>

      {/* YEditsView — full existing logic: groups, upload, delete */}
      <div style={{ position: 'relative', minHeight: 400 }}>
        <YEditsView
          searchQuery={searchQuery}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      </div>

      {/* Mini player */}
      {currentSong && currentEra && (
        <MiniPlayer
          song={currentSong}
          era={currentEra}
          queue={queue}
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(p => !p)}
          onPrev={handlePrev}
          onNext={handleNext}
          onClose={handleClose}
          audioRef={audioRef as React.RefObject<HTMLAudioElement>}
        />
      )}
    </div>
  );
}
