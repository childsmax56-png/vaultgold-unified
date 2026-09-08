import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

// The account/auth service. Community data endpoints are same-origin (/api/community/*),
// but auth is verified against the live UNVAULTED site (see functions/api/_yedits-auth.ts).
const VG_API = 'https://unvaulted.cc';
const TOKEN_KEY = 'vg_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);

interface VGUser { id: string; username: string; email: string; }

interface TrackerMeta {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent_color: string | null;
  logo_url: string | null;
  artist_photo_url: string | null;
  status: string;
  review_note: string | null;
}
interface EraRow {
  id: string; name: string; image: string | null;
  release_date: string | null; description: string | null; sort_order: number;
}
interface SongRow {
  id: string; era_id: string; category: string; name: string; extra: string | null;
  notes: string | null; credited: string | null; quality: string | null;
  available_length: string | null; track_length: string | null;
  leak_date: string | null; file_date: string | null; url: string | null;
  tab: string; sort_order: number;
}

// Content sections a song can live under (mirrors SONG_TABS in _db.ts).
const SONG_TABS = [
  { key: 'unreleased', label: 'Unreleased (Music)' },
  { key: 'released', label: 'Released (streaming)' },
  { key: 'stems', label: 'Stems' },
  { key: 'art', label: 'Art (image)' },
];

// Dropdown option sets — mirror the regular trackers' filters (FilterMenu.tsx).
const QUALITY_OPTIONS = ['Lossless', 'CD Quality', 'High Quality', 'Low Quality', 'Recording', 'Not Available'];
const AVAILABILITY_OPTIONS = ['Snippet', 'Partial', 'Beat Only', 'Tagged', 'Stem Bounce', 'Full', 'OG File', 'Confirmed', 'Rumored', 'Conflicting Sources'];

// Client mirrors of the server host rules (functions/api/community/_db.ts).
const AUDIO_HOST_RE = [
  /(^|\.)pillowcase\.su$/i, /(^|\.)pillows\.su$/i, /(^|\.)pixeldrain\.com$/i,
  /(^|\.)pixeldrain\.net$/i, /(^|\.)imgur\.com$/i, /(^|\.)krakenfiles\.com$/i, /(^|\.)music\.froste\.lol$/i,
];
const STREAMING_HOST_RE = [
  /(^|\.)spotify\.com$/i, /(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)music\.apple\.com$/i,
  /(^|\.)apple\.co$/i, /(^|\.)soundcloud\.com$/i, /(^|\.)tidal\.com$/i, /(^|\.)deezer\.com$/i,
  /(^|\.)audiomack\.com$/i, /(^|\.)bandcamp\.com$/i,
];
const IMAGE_HOST_RE = [/(^|\.)imgur\.com$/i, /(^|\.)i\.ibb\.co$/i, /(^|\.)ibb\.co$/i, /(^|\.)pixeldrain\.com$/i];

const hostMatches = (raw: string, res: RegExp[]) => {
  const url = raw.trim();
  if (!url) return true;
  try { return res.some((re) => re.test(new URL(url).hostname)); } catch { return false; }
};
const isOwnHostedImage = (url: string) => url.trim().startsWith('/api/community/image');
const isAllowedImage = (raw: string) => (raw.trim() ? isOwnHostedImage(raw) || hostMatches(raw, IMAGE_HOST_RE) : true);
const isAllowedAudio = (raw: string) => hostMatches(raw, AUDIO_HOST_RE);
const isAllowedStreaming = (raw: string) => hostMatches(raw, STREAMING_HOST_RE);
function isAllowedSongLink(raw: string, tab: string): boolean {
  if (tab === 'art') return isAllowedImage(raw);
  if (tab === 'released') return isAllowedStreaming(raw);
  return isAllowedAudio(raw);
}

async function api(path: string, method: string, body?: unknown): Promise<Response> {
  return fetch(`/api/community${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Upload a device image to R2 via the Worker, returning a hosted /api/community/image URL.
async function uploadImage(file: File): Promise<string> {
  const res = await fetch('/api/community/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', Authorization: `Bearer ${getToken()}` },
    body: file,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || 'Upload failed');
  return d.url as string;
}

// ── Styles ──────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 20, marginBottom: 18 };
const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 };
const input: React.CSSProperties = { width: '100%', background: '#0b1220', border: '1px solid #263041', borderRadius: 8, padding: '9px 11px', color: '#e5e7eb', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 };
const btnGhost: React.CSSProperties = { ...btn, background: 'transparent', border: '1px solid #334155', color: '#cbd5e1' };
const btnDanger: React.CSSProperties = { ...btnGhost, borderColor: '#7f1d1d', color: '#fca5a5' };

// Image picker: always supports device upload; when `allowLink` is set (the Art
// tab) it also accepts a pasted image URL. `value` is whatever will be stored
// (an uploaded /api/community/image URL or a pasted link).
function ImageInput({ value, onChange, allowLink, placeholder }: {
  value: string; onChange: (url: string) => void; allowLink?: boolean; placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setErr(''); setUploading(true);
    try { onChange(await uploadImage(file)); }
    catch (ex) { setErr((ex as Error).message); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 8, background: '#0b1220', border: '1px solid #263041', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#334155', fontSize: 20 }}>🖼</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
          <button style={{ ...btnGhost, padding: '7px 13px', fontSize: 13 }} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload from device'}
          </button>
          {value && <button style={{ ...btnDanger, padding: '7px 11px', fontSize: 13 }} onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
      {allowLink && (
        <input
          style={{ ...input, marginTop: 8 }}
          value={isOwnHostedImage(value) ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '…or paste an image link (imgur, ibb)'}
        />
      )}
      {err && <p style={{ color: '#f87171', fontSize: 13, marginTop: 6 }}>{err}</p>}
    </div>
  );
}

export function CreateTrackerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<VGUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    fetch(`${VG_API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) return <Shell><p style={{ color: '#94a3b8' }}>Loading…</p></Shell>;
  if (!user) {
    return (
      <Shell>
        <div style={card}>
          <h2 style={{ margin: '0 0 8px' }}>Sign in to build a tracker</h2>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>
            Community trackers are tied to your UNVAULTED account. Sign in from the home page, then come back here.
          </p>
          <Link to="/" style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}>Go to home page</Link>
        </div>
      </Shell>
    );
  }

  return id
    ? <TrackerEditor trackerId={id} onDeleted={() => navigate('/create-tracker')} />
    : <NewTrackerForm onCreated={(newId) => navigate(`/create-tracker/${newId}`)} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 18px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <Link to="/community" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 14 }}>← Community</Link>
          <h1 style={{ fontSize: 20, margin: 0 }}>Build a Tracker</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Step 1: create the tracker shell ────────────────────────────────
function NewTrackerForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [logoUrl, setLogoUrl] = useState('');
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason: string | null } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Live slug availability check (debounced).
  useEffect(() => {
    if (!slug) { setSlugStatus(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/community/check-slug?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((d) => setSlugStatus({ available: d.available, reason: d.reason }))
        .catch(() => setSlugStatus(null));
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Tracker name is required'); return; }
    if (logoUrl && !isAllowedImage(logoUrl)) { setError('Cover image is invalid'); return; }
    setBusy(true);
    const res = await api('/create', 'POST', { name, slug, description, accentColor, logoUrl });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'Could not create tracker'); return; }
    onCreated(data.tracker.id);
  };

  return (
    <Shell>
      <div style={card}>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Tracker name *</label>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Favorite Artist" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>URL slug *</label>
          <input
            style={input}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-artist"
          />
          <div style={{ fontSize: 12, marginTop: 5, color: slugStatus ? (slugStatus.available ? '#4ade80' : '#f87171') : '#64748b' }}>
            {slug ? `unvaulted.cc/${slug}` : 'Lowercase letters, numbers and hyphens'}
            {slugStatus && !slugStatus.available && ` — ${slugStatus.reason}`}
            {slugStatus && slugStatus.available && ' — available ✓'}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Description</label>
          <input style={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short blurb about the tracker" />
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 120 }}>
            <label style={label}>Accent color</label>
            <input type="color" style={{ ...input, height: 40, padding: 4 }} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <label style={label}>Cover / logo</label>
            <ImageInput value={logoUrl} onChange={setLogoUrl} />
          </div>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
          {busy ? 'Creating…' : 'Create draft →'}
        </button>
      </div>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        You'll add eras and songs on the next screen, then submit for moderator approval.
      </p>
    </Shell>
  );
}

// ── Step 2: full editor ─────────────────────────────────────────────
function TrackerEditor({ trackerId, onDeleted }: { trackerId: string; onDeleted: () => void }) {
  const [meta, setMeta] = useState<TrackerMeta | null>(null);
  const [eras, setEras] = useState<EraRow[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const res = await api(`/tracker/${trackerId}`, 'GET');
    if (!res.ok) { setError('Could not load tracker'); setLoading(false); return; }
    const data = await res.json();
    setMeta(data.tracker);
    setEras(data.eras);
    setSongs(data.songs);
    setLoading(false);
  }, [trackerId]);

  useEffect(() => { reload(); }, [reload]);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 2000); };

  if (loading) return <Shell><p style={{ color: '#94a3b8' }}>Loading…</p></Shell>;
  if (!meta) return <Shell><p style={{ color: '#f87171' }}>{error || 'Not found'}</p></Shell>;

  const submitForReview = async () => {
    setError('');
    const res = await api(`/tracker/${trackerId}/submit`, 'POST');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'Could not submit'); return; }
    flash('Submitted for review!');
    reload();
  };

  const deleteTracker = async () => {
    if (!confirm('Delete this tracker and all its content? This cannot be undone.')) return;
    const res = await api(`/tracker/${trackerId}`, 'DELETE');
    if (res.ok) onDeleted();
  };

  return (
    <Shell>
      {notice && <div style={{ ...card, background: '#052e16', borderColor: '#166534', color: '#bbf7d0', padding: '10px 16px' }}>{notice}</div>}
      <StatusBanner meta={meta} onSubmit={submitForReview} />
      {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

      <MetaEditor meta={meta} trackerId={trackerId} onSaved={(m) => { setMeta(m); flash('Saved'); }} />

      <h3 style={{ fontSize: 15, margin: '24px 0 10px' }}>Eras</h3>
      {eras.map((era) => (
        <EraBlock
          key={era.id}
          era={era}
          songs={songs.filter((s) => s.era_id === era.id)}
          trackerId={trackerId}
          onChange={reload}
          flash={flash}
        />
      ))}
      <AddEra trackerId={trackerId} onAdded={reload} />

      <div style={{ marginTop: 34, display: 'flex', justifyContent: 'space-between' }}>
        <a href={`/${meta.slug}/`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: 'none' }}>
          Preview tracker ↗
        </a>
        <button style={btnDanger} onClick={deleteTracker}>Delete tracker</button>
      </div>
    </Shell>
  );
}

function StatusBanner({ meta, onSubmit }: { meta: TrackerMeta; onSubmit: () => void }) {
  const map: Record<string, { bg: string; bd: string; fg: string; text: string }> = {
    draft: { bg: '#1e293b', bd: '#334155', fg: '#cbd5e1', text: 'Draft — not yet submitted' },
    pending: { bg: '#422006', bd: '#854d0e', fg: '#fde68a', text: 'Pending moderator review' },
    approved: { bg: '#052e16', bd: '#166534', fg: '#bbf7d0', text: 'Approved & live' },
    rejected: { bg: '#450a0a', bd: '#7f1d1d', fg: '#fca5a5', text: 'Rejected' },
    removed: { bg: '#450a0a', bd: '#7f1d1d', fg: '#fca5a5', text: 'Removed by a moderator' },
  };
  const s = map[meta.status] ?? map.draft;
  const canSubmit = meta.status === 'draft' || meta.status === 'rejected';
  return (
    <div style={{ ...card, background: s.bg, borderColor: s.bd, color: s.fg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <strong>{s.text}</strong>
        {meta.review_note && <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>Note: {meta.review_note}</div>}
      </div>
      {canSubmit && <button style={btn} onClick={onSubmit}>Submit for approval</button>}
    </div>
  );
}

function MetaEditor({ meta, trackerId, onSaved }: { meta: TrackerMeta; trackerId: string; onSaved: (m: TrackerMeta) => void }) {
  const [name, setName] = useState(meta.name);
  const [description, setDescription] = useState(meta.description ?? '');
  const [accentColor, setAccentColor] = useState(meta.accent_color ?? '#3b82f6');
  const [logoUrl, setLogoUrl] = useState(meta.logo_url ?? '');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    if (logoUrl && !isAllowedImage(logoUrl)) { setErr('Cover image is invalid'); return; }
    const res = await api(`/tracker/${trackerId}`, 'PUT', { name, description, accentColor, logoUrl });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || 'Save failed'); return; }
    onSaved({ ...meta, name, description, accent_color: accentColor, logo_url: logoUrl });
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <label style={label}>Name</label>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ width: 90 }}>
          <label style={label}>Accent</label>
          <input type="color" style={{ ...input, height: 40, padding: 4 }} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Description</label>
        <input style={input} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Cover / logo</label>
        <ImageInput value={logoUrl} onChange={setLogoUrl} />
      </div>
      {err && <p style={{ color: '#f87171', fontSize: 13 }}>{err}</p>}
      <button style={btnGhost} onClick={save}>Save details</button>
    </div>
  );
}

function EraBlock({ era, songs, trackerId, onChange, flash }: {
  era: EraRow; songs: SongRow[]; trackerId: string; onChange: () => void; flash: (m: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  const removeEra = async () => {
    if (!confirm(`Delete era "${era.name}" and its ${songs.length} song(s)?`)) return;
    const res = await api(`/tracker/${trackerId}/era`, 'DELETE', { eraId: era.id });
    if (res.ok) { flash('Era deleted'); onChange(); }
  };

  return (
    <div style={{ ...card, padding: 16 }}>
      {editing ? (
        <EraForm
          trackerId={trackerId}
          eraId={era.id}
          initial={eraToForm(era)}
          submitLabel="Save era"
          onDone={() => { setEditing(false); flash('Era saved'); onChange(); }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button onClick={() => setOpen((o) => !o)} style={{ background: 'none', border: 'none', color: '#e5e7eb', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
            <span style={{ color: '#64748b' }}>{open ? '▾' : '▸'}</span>
            {era.image && <img src={era.image} alt="" style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'cover' }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{era.name}</span>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>({songs.length})</span>
          </button>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button style={{ ...btnGhost, padding: '5px 12px', fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
            <button style={{ ...btnDanger, padding: '5px 10px', fontSize: 12 }} onClick={removeEra}>Delete era</button>
          </div>
        </div>
      )}

      {open && !editing && (
        <div style={{ marginTop: 14 }}>
          {songs.map((s) => (
            <SongRow key={s.id} song={s} trackerId={trackerId} eraId={era.id} onChange={onChange} />
          ))}
          <AddSong trackerId={trackerId} eraId={era.id} onAdded={onChange} />
        </div>
      )}
    </div>
  );
}

interface EraFormValues { name: string; releaseDate: string; image: string; description: string; }
const emptyEra: EraFormValues = { name: '', releaseDate: '', image: '', description: '' };
function eraToForm(e: EraRow): EraFormValues {
  return { name: e.name ?? '', releaseDate: e.release_date ?? '', image: e.image ?? '', description: e.description ?? '' };
}

// Shared add/edit form for an era. `eraId` present → PUT (edit); absent → POST (add).
function EraForm({ trackerId, eraId, initial, submitLabel, onDone, onCancel }: {
  trackerId: string; eraId?: string; initial?: EraFormValues;
  submitLabel: string; onDone: () => void; onCancel: () => void;
}) {
  const [f, setF] = useState<EraFormValues>(initial ?? emptyEra);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof EraFormValues, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr('');
    if (!f.name.trim()) { setErr('Era name required'); return; }
    if (f.image && !isAllowedImage(f.image)) { setErr('Cover image is invalid'); return; }
    setBusy(true);
    const res = eraId
      ? await api(`/tracker/${trackerId}/era`, 'PUT', { eraId, ...f })
      : await api(`/tracker/${trackerId}/era`, 'POST', f);
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.error || 'Failed'); return; }
    onDone();
  };

  return (
    <div style={{ ...card, borderStyle: 'dashed', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={label}>Era name *</label>
          <input style={input} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Debut Album" />
        </div>
        <div style={{ width: 130 }}>
          <label style={label}>Release date</label>
          <input style={input} value={f.releaseDate} onChange={(e) => set('releaseDate', e.target.value)} placeholder="MM/DD/YYYY" />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Cover image</label>
        <ImageInput value={f.image} onChange={(v) => set('image', v)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Description</label>
        <input style={input} value={f.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      {err && <p style={{ color: '#f87171', fontSize: 13 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>{busy ? 'Saving…' : submitLabel}</button>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function AddEra({ trackerId, onAdded }: { trackerId: string; onAdded: () => void }) {
  const [show, setShow] = useState(false);
  if (!show) return <button style={btnGhost} onClick={() => setShow(true)}>+ Add era</button>;
  return (
    <EraForm
      trackerId={trackerId}
      submitLabel="Add era"
      onDone={() => { setShow(false); onAdded(); }}
      onCancel={() => setShow(false)}
    />
  );
}

interface SongFormValues {
  name: string; extra: string; notes: string; credited: string; quality: string;
  availableLength: string; trackLength: string; leakDate: string; fileDate: string;
  url: string; tab: string; category: string;
}
const emptySong: SongFormValues = {
  name: '', extra: '', notes: '', credited: '', quality: '', availableLength: '',
  trackLength: '', leakDate: '', fileDate: '', url: '', tab: 'unreleased', category: 'Unreleased Tracks',
};
function songToForm(s: SongRow): SongFormValues {
  return {
    name: s.name ?? '', extra: s.extra ?? '', notes: s.notes ?? '', credited: s.credited ?? '',
    quality: s.quality ?? '', availableLength: s.available_length ?? '', trackLength: s.track_length ?? '',
    leakDate: s.leak_date ?? '', fileDate: s.file_date ?? '', url: s.url ?? '',
    tab: s.tab ?? 'unreleased', category: s.category ?? 'Unreleased Tracks',
  };
}

// Shared add/edit form. `songId` present → PUT (edit); absent → POST (add).
function SongForm({ trackerId, eraId, songId, initial, submitLabel, onDone, onCancel }: {
  trackerId: string; eraId: string; songId?: string; initial?: SongFormValues;
  submitLabel: string; onDone: () => void; onCancel: () => void;
}) {
  const [f, setF] = useState<SongFormValues>(initial ?? emptySong);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SongFormValues, v: string) => setF((p) => ({ ...p, [k]: v }));

  const isArt = f.tab === 'art';
  const isReleased = f.tab === 'released';

  const submit = async () => {
    setErr('');
    if (!f.name.trim()) { setErr(isArt ? 'Title required' : 'Song name required'); return; }
    if (f.url && !isAllowedSongLink(f.url, f.tab)) {
      setErr(isArt ? 'Art must be an image link or uploaded image'
        : isReleased ? 'Released needs a streaming link (Spotify, YouTube, Apple Music…)'
        : 'Audio link must be pillowcase, pixeldrain, imgur or krakenfiles');
      return;
    }
    setBusy(true);
    const res = songId
      ? await api(`/tracker/${trackerId}/song`, 'PUT', { songId, eraId, ...f })
      : await api(`/tracker/${trackerId}/song`, 'POST', { ...f, eraId });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.error || 'Failed'); return; }
    onDone();
  };

  const field = (key: keyof SongFormValues, lbl: string, placeholder = '') => (
    <div style={{ flex: '1 1 150px' }}>
      <label style={label}>{lbl}</label>
      <input style={input} value={f[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
    </div>
  );
  const selectField = (key: keyof SongFormValues, lbl: string, options: string[]) => (
    <div style={{ flex: '1 1 150px' }}>
      <label style={label}>{lbl}</label>
      <select style={input} value={f[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ ...card, borderStyle: 'dashed', marginTop: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ flex: '1 1 150px' }}>
          <label style={label}>Section</label>
          <select style={input} value={f.tab} onChange={(e) => set('tab', e.target.value)}>
            {SONG_TABS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        {field('name', isArt ? 'Title *' : 'Song name *')}
        {!isArt && field('credited', 'Credited people', 'prod. …, feat. …')}
      </div>

      {!isArt && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {field('extra', 'Subtitle / alt name')}
          {!isReleased && selectField('quality', 'Quality', QUALITY_OPTIONS)}
          {!isReleased && selectField('availableLength', 'Availability', AVAILABILITY_OPTIONS)}
        </div>
      )}

      {f.tab === 'unreleased' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {field('trackLength', 'Track length', '3:24')}
          {field('leakDate', 'Leak date')}
          {field('fileDate', 'File date')}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label style={label}>Notes</label>
        <input style={input} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {isArt ? (
        <div style={{ marginBottom: 10 }}>
          <label style={label}>Image (upload from device or paste a link)</label>
          <ImageInput value={f.url} onChange={(v) => set('url', v)} allowLink />
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <label style={label}>
            {isReleased ? 'Streaming link (Spotify / YouTube / Apple Music…)' : 'Audio link (pillowcase / pixeldrain / imgur)'}
          </label>
          <input
            style={input}
            value={f.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder={isReleased ? 'https://open.spotify.com/track/…' : 'https://pillowcase.su/f/…'}
          />
        </div>
      )}

      {err && <p style={{ color: '#f87171', fontSize: 13 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>{busy ? 'Saving…' : submitLabel}</button>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function AddSong({ trackerId, eraId, onAdded }: { trackerId: string; eraId: string; onAdded: () => void }) {
  const [show, setShow] = useState(false);
  if (!show) return <button style={{ ...btnGhost, marginTop: 4 }} onClick={() => setShow(true)}>+ Add song</button>;
  return (
    <SongForm
      trackerId={trackerId}
      eraId={eraId}
      submitLabel="Add song"
      onDone={() => { setShow(false); onAdded(); }}
      onCancel={() => setShow(false)}
    />
  );
}

// A saved song: read-only summary row with an Edit toggle that swaps in SongForm.
function SongRow({ song, trackerId, eraId, onChange }: {
  song: SongRow; trackerId: string; eraId: string; onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const removeSong = async () => {
    if (!confirm(`Delete song "${song.name}"?`)) return;
    const res = await api(`/tracker/${trackerId}/song`, 'DELETE', { songId: song.id });
    if (res.ok) onChange();
  };

  if (editing) {
    return (
      <SongForm
        trackerId={trackerId}
        eraId={eraId}
        songId={song.id}
        initial={songToForm(song)}
        submitLabel="Save changes"
        onDone={() => { setEditing(false); onChange(); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#0b1220', borderRadius: 8, marginBottom: 6, gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{song.name}</div>
        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[song.quality, song.available_length, song.tab !== 'unreleased' ? song.tab : '', song.url ? 'link ✓' : 'no link'].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button style={{ ...btnGhost, padding: '4px 11px', fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
        <button style={{ ...btnDanger, padding: '4px 9px', fontSize: 12 }} onClick={removeSong}>✕</button>
      </div>
    </div>
  );
}
