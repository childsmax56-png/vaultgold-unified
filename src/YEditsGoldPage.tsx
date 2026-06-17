import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, X, Check, ShieldCheck, Copy, KeyRound } from 'lucide-react';
import { YEditsView, type ClaimInfo } from './components/YEditsView';
import type { Song, Era } from './types';

const ACCENT = '#FFD700';

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
      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: "'Inter', system-ui, sans-serif", height: 56,
    }}>
      {/* Song info */}
      <div style={{ flex: '0 0 160px', minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{era.name}</div>
      </div>

      {/* Prev */}
      <button onClick={onPrev} disabled={idx <= 0} style={{ background: 'none', border: 'none', cursor: idx > 0 ? 'pointer' : 'default', color: idx > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0, flexShrink: 0 }}>
        <SkipBack size={15} />
      </button>

      {/* Play/Pause */}
      <button onClick={onToggle} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: ACCENT, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
      </button>

      {/* Next */}
      <button onClick={onNext} disabled={idx >= queue.length - 1} style={{ background: 'none', border: 'none', cursor: idx < queue.length - 1 ? 'pointer' : 'default', color: idx < queue.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', padding: 0, flexShrink: 0 }}>
        <SkipForward size={15} />
      </button>

      {/* Scrubber */}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{formatTime(currentTime)}</span>
      <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={seek} style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{formatTime(duration)}</span>

      {/* Volume */}
      <Volume2 size={13} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
      <input type="range" min={0} max={1} step={0.01} value={volume} onChange={changeVolume} style={{ width: 60, accentColor: ACCENT, cursor: 'pointer', flexShrink: 0 }} />

      {/* Close */}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', flexShrink: 0 }}>
        <X size={14} />
      </button>
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

// ─── Redeem Key Modal ─────────────────────────────────────────────────────────

function RedeemKeyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = async () => {
    const token = getVGToken();
    if (!token || !key.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/yeditsgold-admin-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) { onSuccess(); }
      else { setError(data.error ?? 'Failed to redeem key'); }
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 380, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={16} style={{ color: ACCENT }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Redeem Admin Key</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Enter the one-time key you received from the site owner.</p>
        <input
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#161616', border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`, color: '#fff', fontSize: 14, fontFamily: 'monospace', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}55`; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? '#f87171' : 'rgba(255,255,255,0.1)'; }}
          onKeyDown={e => { if (e.key === 'Enter') redeem(); }}
        />
        {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}</p>}
        <button
          onClick={redeem}
          disabled={loading || !key.trim()}
          style={{ marginTop: 16, width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: loading || !key.trim() ? 'default' : 'pointer', background: ACCENT, color: '#000', fontSize: 14, fontWeight: 700, opacity: loading || !key.trim() ? 0.5 : 1 }}
        >
          {loading ? 'Redeeming…' : 'Redeem Key'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

interface ClaimRow {
  id: string; profile_name: string; user_id: string; username: string;
  email: string; status: string; claimed_at: string; reviewed_at?: string;
}
interface KeyRow {
  key: string; label?: string; created_at: string;
  used_by_username?: string; used_at?: string;
}
interface AdminRow { user_id: string; username: string; email: string; granted_at: string; }

function AdminPanel({ onClose, onRefreshClaims, isOwner }: { onClose: () => void; onRefreshClaims: () => void; isOwner: boolean }) {
  const [tab, setTab] = useState<'claims' | 'keys'>('claims');
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAll = useCallback(async () => {
    const token = getVGToken();
    if (!token) return;
    setLoading(true);
    try {
      const [claimsRes, keysRes] = await Promise.all([
        fetch('/api/yeditsgold-admin-claims', { headers: { Authorization: `Bearer ${token}` } }),
        isOwner ? fetch('/api/yeditsgold-admin-keys', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
      ]);
      const claimsData = await claimsRes.json() as { claims?: ClaimRow[] };
      setClaims(claimsData.claims ?? []);
      if (keysRes) {
        const keysData = await keysRes.json() as { keys?: KeyRow[]; admins?: AdminRow[] };
        setKeys(keysData.keys ?? []);
        setAdmins(keysData.admins ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const actClaim = async (id: string, action: 'approve' | 'reject') => {
    const token = getVGToken();
    if (!token) return;
    setActionLoading(id + action);
    try {
      await fetch('/api/yeditsgold-admin-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      });
      await fetchAll();
      onRefreshClaims();
    } finally { setActionLoading(null); }
  };

  const generateKey = async () => {
    const token = getVGToken();
    if (!token) return;
    setActionLoading('gen');
    try {
      const res = await fetch('/api/yeditsgold-admin-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'generate', label: newKeyLabel }),
      });
      const data = await res.json() as { key?: string };
      if (data.key) { setGeneratedKey(data.key); setNewKeyLabel(''); await fetchAll(); }
    } finally { setActionLoading(null); }
  };

  const revokeAdmin = async (userId: string) => {
    const token = getVGToken();
    if (!token) return;
    setActionLoading('revoke' + userId);
    try {
      await fetch('/api/yeditsgold-admin-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'revoke', userId }),
      });
      await fetchAll();
    } finally { setActionLoading(null); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const pending = claims.filter(c => c.status === 'pending');
  const reviewed = claims.filter(c => c.status !== 'pending');

  const tabStyle = (t: typeof tab) => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
  });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '82vh', overflow: 'auto', padding: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: ACCENT }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Admin Panel</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Tabs — keys tab only visible to owner */}
        {isOwner && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            <button style={tabStyle('claims')} onClick={() => setTab('claims')}>Claims</button>
            <button style={tabStyle('keys')} onClick={() => setTab('keys')}>Admin Keys</button>
          </div>
        )}

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading…</p>}

        {/* ── Claims tab ── */}
        {!loading && tab === 'claims' && (
          <>
            {pending.length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 16 }}>No pending claims.</p>}
            {pending.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Pending</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {pending.map(c => (
                    <div key={c.id} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.profile_name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>@{c.username} · {c.email} · {new Date(c.claimed_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => actClaim(c.id, 'approve')} disabled={!!actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
                          <Check size={13} /> {actionLoading === c.id + 'approve' ? '…' : 'Approve'}
                        </button>
                        <button onClick={() => actClaim(c.id, 'reject')} disabled={!!actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.12)', color: '#f87171', fontSize: 12, fontWeight: 600 }}>
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
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: c.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: c.status === 'approved' ? '#4ade80' : '#f87171' }}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Keys tab (owner only) ── */}
        {!loading && tab === 'keys' && (
          <>
            {/* Generate new key */}
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Generate Key</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: generatedKey ? 12 : 24 }}>
              <input
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                placeholder="Label (e.g. dev name)"
                style={{ flex: 1, padding: '9px 14px', borderRadius: 8, background: '#161616', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}55`; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <button
                onClick={generateKey}
                disabled={actionLoading === 'gen'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: ACCENT, color: '#000', fontSize: 13, fontWeight: 700, opacity: actionLoading === 'gen' ? 0.6 : 1 }}
              >
                <KeyRound size={13} /> {actionLoading === 'gen' ? '…' : 'Generate'}
              </button>
            </div>

            {generatedKey && (
              <div style={{ background: '#0a1a0a', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 8 }}>New key — share this once, it burns after use:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', fontFamily: 'monospace' }}>{generatedKey}</code>
                  <button
                    onClick={() => copyKey(generatedKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(74,222,128,0.3)', background: 'transparent', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Key history */}
            {keys.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Key History</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {keys.map(k => (
                    <div key={k.key} style={{ background: '#111', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <code style={{ fontSize: 12, color: k.used_at ? 'rgba(255,255,255,0.25)' : '#fff', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{k.key}</code>
                        {k.label && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{k.label}</span>}
                        {k.used_at && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>Used by @{k.used_by_username}</span>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: k.used_at ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.1)', color: k.used_at ? 'rgba(255,255,255,0.25)' : '#4ade80' }}>
                        {k.used_at ? 'used' : 'unused'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Current admins */}
            {admins.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Admins</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {admins.map(a => (
                    <div key={a.user_id} style={{ background: '#111', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>@{a.username}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>{a.email}</span>
                      </div>
                      <button
                        onClick={() => revokeAdmin(a.user_id)}
                        disabled={!!actionLoading}
                        style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                      >
                        {actionLoading === 'revoke' + a.user_id ? '…' : 'Revoke'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
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
  const [showRedeem, setShowRedeem] = useState(false);
  const [vgUser, setVgUser] = useState<VGUser | null>(getVGUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const sync = () => setVgUser(getVGUser());
    window.addEventListener('storage', sync);
    window.addEventListener('vg-synced', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('vg-synced', sync); };
  }, []);

  useEffect(() => {
    const token = getVGToken();
    if (!token) { setIsAdmin(false); setIsOwner(false); return; }
    fetch('/api/yeditsgold-admin-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.ok ? r.json() : { admin: false, owner: false })
      .then((d: { admin?: boolean; owner?: boolean }) => {
        setIsAdmin(!!d.admin);
        setIsOwner(!!d.owner);
      })
      .catch(() => { setIsAdmin(false); setIsOwner(false); });
  }, [vgUser]);

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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', paddingBottom: currentSong ? 56 : 0 }}>
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
            <ShieldCheck size={13} /> Admin
          </button>
        )}
        {vgUser && !isAdmin && (
          <button
            onClick={() => setShowRedeem(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <KeyRound size={13} /> Key
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
        <AdminPanel onClose={() => setShowAdmin(false)} onRefreshClaims={fetchClaims} isOwner={isOwner} />
      )}

      {showRedeem && (
        <RedeemKeyModal onClose={() => setShowRedeem(false)} onSuccess={() => { setShowRedeem(false); window.location.reload(); }} />
      )}
    </div>
  );
}
