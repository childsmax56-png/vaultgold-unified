import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Play, Trash2, Pencil, Check, X, ChevronUp, ChevronDown, ChevronLeft, ListMusic, Shuffle, ImagePlus, Download, Home, Heart } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useGlobalPlaylists, FAVORITES_ID } from './GlobalPlaylistContext';
import { UserPlaylist, PlaylistSong, Song, Era } from './types';
import { ArtImage } from './components/ArtGallery';
import * as audioStore from './player/audioStore';

const ACCENT = '#C9A224';

// Downscale an uploaded image to ~512px JPEG dataURL — small enough to store in
// localStorage and sync in the D1 `cover` TEXT column.
function fileToCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 512;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Build a playable Song (with a synthetic Era) from a stored playlist entry so a
// globally-mixed playlist plays cross-tracker without loading that tracker.
function entryToSong(entry: PlaylistSong): Song {
  const era: Era = { name: entry.eraName || '', image: entry.image, data: {} };
  const s: any = { ...(entry.song || {}) };
  s.name = entry.songName;
  s.url = entry.url || entry.song?.url || '';
  s.image = entry.image || entry.song?.image;
  s.extra = s.extra || entry.eraName;
  s.realEra = era;
  s.artist = entry.artist;
  return s as Song;
}

function playEntries(entries: PlaylistSong[], startIndex: number, shuffle = false) {
  let list = entries.filter(e => e.url);
  let start = startIndex;
  if (shuffle) {
    const startEntry = list[startIndex];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    start = startEntry ? list.indexOf(startEntry) : 0;
    if (start < 0) start = 0;
  }
  const songs = list.map(entryToSong);
  if (!songs.length) return;
  void audioStore.playSongList(songs, start, songs[start].realEra as Era);
}

function isDirectlyDownloadable(url: string): boolean {
  return url.includes('pillows.su/f/') || url.includes('pillowcase.su/f/') || url.includes('imgur.gg/f/') || url.includes('i.imgur.com') || url.includes('krakenfiles.com/view/') || url.includes('pixeldrain.com/u/');
}

async function resolveDownloadUrl(url: string): Promise<string | null> {
  if (url.includes('pillows.su/f/') || url.includes('pillowcase.su/f/')) {
    const host = url.includes('pillows.su') ? 'api.pillows.su' : 'api.pillowcase.su';
    const hash = url.split('/f/')[1]?.split('/')[0]?.split('?')[0];
    if (hash) return `https://${host}/api/get/${hash}`;
  }
  if (url.includes('imgur.gg/f/')) {
    const id = url.split('/f/')[1];
    const host = new URL(url).host;
    if (id) {
      const res = await fetch(`https://${host}/api/file/${id}`).catch(() => null);
      if (res?.ok) {
        const data = await res.json().catch(() => null);
        if (data?.cdnUrl) return data.cdnUrl;
      }
    }
  }
  return null;
}

export function PlaylistsPage() {
  const navigate = useNavigate();
  const {
    playlists, createPlaylist, renamePlaylist, deletePlaylist,
    removeFromPlaylist, moveSong, setCover, refreshFavorites,
  } = useGlobalPlaylists();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const selected = playlists.find(p => p.id === selectedId) ?? null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    setSelectedId(id);
    setNewName('');
    setCreatingNew(false);
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) renamePlaylist(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (id: string) => {
    deletePlaylist(id);
    if (selectedId === id) setSelectedId(null);
  };

  const onUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selected) return;
    try {
      const cover = await fileToCover(file);
      setCover(selected.id, cover);
      showToast('Cover updated');
    } catch {
      showToast('Couldn’t load that image');
    }
  };

  const downloadZip = async (playlist: UserPlaylist) => {
    if (downloading) return;
    setDownloading(true);
    showToast('Building zip…');
    const zip = new JSZip();
    const usedNames = new Set<string>();
    let tracklist = `${playlist.name}\n${'─'.repeat(playlist.name.length)}\n\n`;
    let downloaded = 0, skipped = 0;
    for (let i = 0; i < playlist.songs.length; i++) {
      const entry = playlist.songs[i];
      const rawUrl = entry.url ?? '';
      const displayNum = String(i + 1).padStart(2, '0');
      const baseName = `${displayNum}. ${entry.songName}`;
      tracklist += `${baseName}`;
      if (rawUrl) tracklist += `\n  ${rawUrl}`;
      tracklist += '\n\n';
      if (!rawUrl || !isDirectlyDownloadable(rawUrl)) { skipped++; continue; }
      try {
        const fetchUrl = await resolveDownloadUrl(rawUrl);
        if (!fetchUrl) { skipped++; continue; }
        const res = await fetch(fetchUrl).catch(() => null);
        if (!res?.ok) { skipped++; continue; }
        const ct = res.headers.get('content-type') ?? '';
        if (ct.startsWith('text/html') || ct.startsWith('application/json')) { skipped++; continue; }
        const blob = await res.blob();
        const ext = ct.includes('flac') ? '.flac' : ct.includes('wav') ? '.wav' : '.mp3';
        let fileName = `${baseName}${ext}`;
        if (usedNames.has(fileName)) fileName = `${baseName} (${i + 1})${ext}`;
        usedNames.add(fileName);
        zip.file(fileName, blob);
        downloaded++;
      } catch { skipped++; }
    }
    zip.file('tracklist.txt', tracklist);
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      saveAs(zipBlob, `${playlist.name.replace(/[^a-z0-9 ]/gi, '_')}.zip`);
      showToast(downloaded > 0
        ? `Downloaded ${downloaded} file${downloaded !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}`
        : 'No direct downloads found — tracklist saved');
    } catch {
      showToast('Failed to create zip');
    }
    setDownloading(false);
  };

  const isFav = (p: UserPlaylist) => p.id === FAVORITES_ID;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 md:px-8 py-4 border-b border-white/10 shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm cursor-pointer transition-colors" title="Home">
          <Home className="w-4 h-4" /> <span className="hidden sm:inline">Home</span>
        </button>
        <h1 className="text-lg md:text-xl font-black tracking-tight ml-1">Playlists</h1>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar list */}
        <div className={`shrink-0 border-r border-white/5 flex flex-col ${selectedId || creatingNew ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">Your Playlists</span>
            <button onClick={() => { setCreatingNew(true); setSelectedId(null); }} className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="New playlist">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {playlists.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setCreatingNew(false); if (isFav(p)) refreshFavorites(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${selectedId === p.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                  {isFav(p)
                    ? <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    : p.cover
                      ? <ArtImage url={p.cover} alt={p.name} />
                      : <ListMusic className="w-4 h-4 text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-white/30">{p.songs.length} song{p.songs.length !== 1 ? 's' : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className={`overflow-y-auto ${selectedId || creatingNew ? 'flex-1' : 'hidden md:block md:flex-1'}`}>
          <AnimatePresence mode="wait">
            {creatingNew ? (
              <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md">
                <button onClick={() => { setCreatingNew(false); setNewName(''); }} className="md:hidden flex items-center gap-1.5 px-4 py-3 text-white/50 hover:text-white text-sm border-b border-white/5 w-full">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="p-8">
                  <h2 className="text-lg font-bold mb-6">New Playlist</h2>
                  <input
                    autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreatingNew(false); setNewName(''); } }}
                    placeholder="Playlist name..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  />
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleCreate} className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: `${ACCENT}22`, color: ACCENT }}>Create</button>
                    <button onClick={() => { setCreatingNew(false); setNewName(''); }} className="px-6 py-2 rounded-lg bg-white/5 text-white/50 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
                  </div>
                </div>
              </motion.div>
            ) : selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
                <button onClick={() => setSelectedId(null)} className="md:hidden flex items-center gap-1.5 px-4 py-3 text-white/50 hover:text-white text-sm border-b border-white/5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {/* Header */}
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                  {isFav(selected) ? (
                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500/30 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
                      <Heart className="w-10 h-10 text-rose-400 fill-rose-400" />
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()} className="group relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/40 transition-all cursor-pointer" title="Upload cover">
                      {selected.cover ? <ArtImage url={selected.cover} alt={selected.name} /> : <div className="w-full h-full flex items-center justify-center"><ListMusic className="w-8 h-8 text-white/20" /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <ImagePlus className="w-5 h-5 text-white" />
                        <span className="text-[9px] text-white/80 uppercase tracking-wider">Upload</span>
                      </div>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onUploadCover} className="hidden" />

                  <div className="flex-1 min-w-0">
                    {renamingId === selected.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenamingId(null); }}
                          className="bg-white/10 border border-white/20 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-white/40" />
                        <button onClick={handleRenameConfirm} className="p-1 cursor-pointer" style={{ color: ACCENT }}><Check className="w-4 h-4" /></button>
                        <button onClick={() => setRenamingId(null)} className="p-1 text-white/40 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold truncate">{selected.name}</h1>
                        {!isFav(selected) && (
                          <button onClick={() => { setRenamingId(selected.id); setRenameValue(selected.name); }} className="p-1 text-white/30 hover:text-white transition-colors cursor-pointer" title="Rename">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-white/40 mt-0.5">{selected.songs.length} song{selected.songs.length !== 1 ? 's' : ''}{isFav(selected) ? ' • from all trackers' : ''}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.songs.length > 0 && (
                      <>
                        <button onClick={() => playEntries(selected.songs, 0, false)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ background: `${ACCENT}22`, color: ACCENT }}>
                          <Play className="w-3.5 h-3.5" /> Play
                        </button>
                        <button onClick={() => playEntries(selected.songs, 0, true)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 text-white/60 text-xs font-semibold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                          <Shuffle className="w-3.5 h-3.5" /> Shuffle
                        </button>
                        <button onClick={() => downloadZip(selected)} disabled={downloading} className="p-2 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40" title="Download as zip">
                          <Download className={`w-4 h-4 ${downloading ? 'animate-pulse' : ''}`} />
                        </button>
                      </>
                    )}
                    {!isFav(selected) && (
                      <button onClick={() => handleDelete(selected.id)} className="p-2 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer" title="Delete playlist">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Songs */}
                {selected.songs.length === 0 ? (
                  <div className="py-16 text-center text-white/30 text-sm px-6">
                    {isFav(selected)
                      ? <>No favorites yet. Tap the <Heart className="w-4 h-4 inline mx-1" /> on any song in a tracker.</>
                      : <>No songs yet. Add songs from any tracker using the <ListMusic className="w-4 h-4 inline mx-1" /> button.</>}
                  </div>
                ) : (
                  <div className="py-2">
                    {selected.songs.map((entry, i) => (
                      <div key={`${entry.tracker}-${entry.url}-${i}`} className="group flex items-center px-4 md:px-6 py-2.5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => playEntries(selected.songs, i, false)}>
                        <span className="w-8 text-xs font-mono text-white/30 group-hover:text-white/60 shrink-0">{i + 1}</span>
                        <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-white/5 mr-3">
                          {entry.image && <ArtImage url={entry.image} alt={entry.songName} />}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-sm font-medium truncate">{entry.songName}</div>
                          <div className="text-[10px] text-white/40 mt-0.5 truncate">{entry.artist ? `${entry.artist} • ` : ''}{entry.eraName}</div>
                        </div>
                        {!isFav(selected) && (
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); if (i > 0) moveSong(selected.id, i, i - 1); }} disabled={i === 0} className="p-1 text-white/40 hover:text-white disabled:opacity-20 transition-colors cursor-pointer" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); if (i < selected.songs.length - 1) moveSong(selected.id, i, i + 1); }} disabled={i === selected.songs.length - 1} className="p-1 text-white/40 hover:text-white disabled:opacity-20 transition-colors cursor-pointer" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); removeFromPlaylist(selected.id, entry.url, entry.songName); }} className="p-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer" title="Remove"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full py-32 text-white/30">
                <ListMusic className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Select a playlist or create a new one</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] bg-white/10 backdrop-blur-xl border border-white/15 rounded-full px-5 py-2 text-sm text-white shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
