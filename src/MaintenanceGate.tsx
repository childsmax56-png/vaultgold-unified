import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Wrench, Clock } from 'lucide-react';

const ACCENT = '#FFD700';

// Shared "under maintenance" screen with a password gate. Public visitors see
// the maintenance notice; entering the access password reveals the real page.
// The unlock is remembered in localStorage under a per-page storageKey (so
// unlocking one gated page does not unlock the others) and authorized people
// don't have to re-enter it on that page.
//
// NOTE: this is a client-side gate — the password lives in the shipped bundle,
// so it keeps casual visitors out but is not a real security boundary. It's the
// right tool for a "temporarily under maintenance" notice, not for protecting
// secrets.
export const MAINTENANCE_PASSWORD = 'Sophiachiconruiz';
export const MAINTENANCE_STORAGE_KEY = 'vg_maintenance_unlocked';

// Each gated page passes its own storageKey so unlocking one page does NOT
// unlock the others (they're independent maintenance screens).
export function isMaintenanceUnlocked(storageKey: string = MAINTENANCE_STORAGE_KEY): boolean {
  try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
}

export function MaintenanceGate({
  title,
  message = "We're doing some work behind the scenes. This will be back and open to the public soon — thanks for your patience.",
  storageKey = MAINTENANCE_STORAGE_KEY,
  onUnlock,
}: {
  title: React.ReactNode;
  message?: string;
  storageKey?: string;
  onUnlock: () => void;
}) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (password === MAINTENANCE_PASSWORD) {
      try { localStorage.setItem(storageKey, '1'); } catch {}
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1a1508 0%, #0a0a0a 55%)', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>

        {/* Icon badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: `${ACCENT}12`, border: `1px solid ${ACCENT}33`, marginBottom: 24 }}>
          <Wrench size={30} style={{ color: ACCENT }} />
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 12 }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 28 }}>
          {message}
        </p>

        {/* Status tracker card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 22px', marginBottom: 28, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={15} style={{ color: ACCENT }} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Status Tracker</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Current status</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${ACCENT}18`, color: ACCENT }}>Under Maintenance</span>
          </div>

          {/* Animated progress bar */}
          <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ position: 'absolute', inset: 0, width: '45%', borderRadius: 999, background: `linear-gradient(90deg, ${ACCENT}55, ${ACCENT})`, animation: 'vgMaintPulse 1.8s ease-in-out infinite' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Next step</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Reopening to the public soon</span>
          </div>
        </div>

        {/* Access password */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="password"
              value={password}
              autoFocus
              placeholder="Enter access password"
              onChange={e => { setPassword(e.target.value); if (error) setError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = `${ACCENT}55`; }}
              onBlur={e => { e.currentTarget.style.borderColor = error ? '#f87171' : 'rgba(255,255,255,0.1)'; }}
            />
          </div>
          <button
            onClick={submit}
            style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: ACCENT, color: '#000', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Enter
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'left', marginBottom: 4 }}>Incorrect password. Please try again.</p>}

        <button
          onClick={() => navigate('/')}
          style={{ marginTop: 18, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>

      <style>{`@keyframes vgMaintPulse { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }`}</style>
    </div>
  );
}
