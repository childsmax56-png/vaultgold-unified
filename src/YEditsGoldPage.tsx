import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, X, Check, ShieldCheck } from 'lucide-react';
import { YEditsView, type ClaimInfo } from './components/YEditsView';
import type { Song, Era } from './types';

const ACCENT = '#FFD700';
const ADMIN_EMAIL = 'childsmax56@gmail.com';

interface VGUser { id: string; username: string; email: string; }

function getVGUser(): VGUser | null {
  try { return JSON.parse(localStorage.getItem('vg_user') || 'null'); } catch { return null; }
}
function getVGToken(): string | null { return localStorage.getItem('vg_token'); }

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Mini Player ─────────────────────────────────────────────────────────────

function MiniPlayer({
  song, era, queue, isPlaying, onToggle, onPrev, onNext, onClose, audioRef,
}: {
  song: Song; era: Era; queue: Song[]; isPlaying: boolean;
  onToggle: () => void; onPrev: () => void; onNext: () => void; onClose: () => void;
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

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{era.name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onPrev} disabled={idx <= 0} style={{ background: 'none', border: 'none', cursor: idx > 0 ? 'pointer' : 'default', color: idx > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0 }}>
            <SkipBack size={16} />
          </button>
          <button onClick={onToggle} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: ACCENT, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={onNext} disabled={idx >= queue.length - 1} style={{ background: 'none', border: 'none', cursor: idx < queue.length - 1 ? 'pointer' : 'default', color: idx < queue.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0 }}>
            <SkipForward size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 400 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 32, textAlign: 'right' }}>{formatTime(currentTime)}</span>
          <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={seek} style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 32 }}>{formatTime(duration)}</span>
        </div>
      </div>
      <div style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={changeVolume} style={{ width: 72, accentColor: ACCENT, cursor: 'pointer' }} />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Claim Modal ──────────────────────────────────────────────────────────────

function ClaimModal({ profileName, onClose }: { profileName: string; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async () => {
    const token = getVGToken();
    if (!token) { setMsg('You need to sign in first.'); setStatus('error'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/yeditsgold-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, profileName }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) { setMsg(data.error ?? 'Something went wrong.'); setStatus('error'); }
      else { setMsg(data.message ?? 'Claim submitted!'); setStatus('success'); }
    } catch {
      setMsg('Network error.'); setStatus('error');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Claim Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
          Claim <strong style={{ color: '#fff' }}>{profileName}</strong> to get ownership of all projects under this name. Your request will be reviewed before it's approved.
        </p>
        {msg && (
          <p style={{ fontSize: 13, marginBottom: 16, color: status === 'error' ? '#f87171' : '#4ade80' }}>{msg}</p>
        )}
        {status !== 'success' && (
          <button
            onClick={submit}
            disabled={status === 'loading'}
            style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: ACCENT, color: '#000', fontSize: 14, fontWeight: 700,
              opacity: status === 'loading' ? 0.6 : 1,
            }}
          >
            {status === 'loading' ? 'Submitting…' : 'Submit Claim'}
          </button>
        )}
        {status === 'success' && (
          <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

interface ClaimRow {
  id: string; profile_name: string; user_id: string; username: string;
  email: string; status: string; claimed_at: string; reviewed_at?: string;
}

function AdminPanel({ onClose, onRefreshClaims }: { onClose: () => void; onRefreshClaims: () => void }) {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    const token = getVGToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/yeditsgold-admin-claims', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { claims?: ClaimRow[] };
      setClaims(data.claims ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    const token = getVGToken();
    if (!token) return;
    setActionLoading(id + action);
    try {
      await fetch('/api/yeditsgold-admin-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      });
      await fetchClaims();
      onRefreshClaims();
    } finally {
      setActionLoading(null);
    }
  };

  const pending = claims.filter(c => c.status === 'pending');
  const reviewed = claims.filter(c => c.status !== 'pending');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: ACCENT }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Profile Claims</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={18} /></button>
        </div>

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading…</p>}

        {!loading && pending.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 16 }}>No pending claims.</p>
        )}

        {pending.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Pending</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {pending.map(c => (
                <div key={c.id} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.profile_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      @{c.username} · {c.email} · {new Date(c.claimed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => act(c.id, 'approve')}
                      disabled={!!actionLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: 12, fontWeight: 600 }}
                    >
                      <Check size={13} /> {actionLoading === c.id + 'approve' ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => act(c.id, 'reject')}
                      disabled={!!actionLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.12)', color: '#f87171', fontSize: 12, fontWeight: 600 }}
                    >
                      <X size={13} /> {actionLoading === c.id + 'reject' ? '…' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {reviewed.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Reviewed</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviewed.map(c => (
                <div key={c.id} style={{ background: '#111', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.profile_name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>@{c.username}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: c.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: c.status === 'approved' ? '#4ade80' : '#f87171' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function YEditsGoldPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentEra, setCurrentEra] = useState<Era | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [claims, setClaims] = useState<Record<string, ClaimInfo>>({});
  const [claimTarget, setClaimTarget] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [vgUser, setVgUser] = useState<VGUser | null>(getVGUser);

  useEffect(() => {
    const sync = () => setVgUser(getVGUser());
    window.addEventListener('storage', sync);
    window.addEventListener('vg-synced', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('vg-synced', sync); };
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/yeditsgold-claims');
      if (res.ok) setClaims(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  // Audio sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.url) return;
    audio.src = currentSong.url;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.play().catch(() => setIsPlaying(false)); }
    else { audio.pause(); }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const idx = queue.findIndex(s => s.url === currentSong?.url);
      if (idx !== -1 && idx < queue.length - 1) { setCurrentSong(queue[idx + 1]); }
      else { setIsPlaying(false); }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [queue, currentSong]);

  const handlePlaySong = useCallback((song: Song, era: Era, contextTracks: Song[]) => {
    setCurrentEra(era);
    setQueue(contextTracks);
    if (currentSong?.url === song.url) { setIsPlaying(p => !p); }
    else { setCurrentSong(song); }
  }, [currentSong]);

  const handleClose = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentEra(null);
    setQueue([]);
  };

  const isAdmin = vgUser?.email === ADMIN_EMAIL;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', paddingBottom: currentSong ? 100 : 0 }}>
      <audio ref={audioRef} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.12)'; b.style.color = '#fff'; }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.06)'; b.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <ArrowLeft size={15} />
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
            yedits<span style={{ color: ACCENT }}>gold</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Community fan-edit projects</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${ACCENT}33`, background: `${ACCENT}10`, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <ShieldCheck size={13} /> Claims
          </button>
        )}

        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, width: 200, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}55`; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
      </div>

      <div style={{ position: 'relative', minHeight: 400 }}>
        <YEditsView
          searchQuery={searchQuery}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
          claims={claims}
          onClaim={setClaimTarget}
        />
      </div>

      {currentSong && currentEra && (
        <MiniPlayer
          song={currentSong} era={currentEra} queue={queue}
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(p => !p)}
          onPrev={() => { const idx = queue.findIndex(s => s.url === currentSong.url); if (idx > 0) setCurrentSong(queue[idx - 1]); }}
          onNext={() => { const idx = queue.findIndex(s => s.url === currentSong.url); if (idx < queue.length - 1) setCurrentSong(queue[idx + 1]); }}
          onClose={handleClose}
          audioRef={audioRef as React.RefObject<HTMLAudioElement>}
        />
      )}

      {claimTarget && (
        <ClaimModal profileName={claimTarget} onClose={() => setClaimTarget(null)} />
      )}

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} onRefreshClaims={fetchClaims} />
      )}
    </div>
  );
}
