import { useState, useMemo, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Pencil, Check, X, ChevronLeft, ChevronUp, ChevronDown, Download, Search, Play, Palette, Layers } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Era, Song } from '../types';
import { CUSTOM_IMAGES, getCleanSongNameWithTags, retryImageOnError } from '../utils';
import { useTierLists, TierItem, TierRow, UNRANKED, makeId } from '../TierListContext';

interface ArtistCatalog {
  artists: { slug: string; name: string }[];
  loaded: string[];
  loading: string | null;
  onLoad: (slug: string) => void;
  error?: string | null;
}

interface Props {
  eras: Era[];
  searchQuery?: string;
  onPlaySong: (song: Song, era: Era, contextTracks?: Song[]) => void;
  onToast?: (msg: string) => void;
  // When provided, the picker gains an artist selector that lazy-loads each
  // artist's catalog (used by the standalone cross-artist /tierlist page).
  artistCatalog?: ArtistCatalog;
}

const PALETTE = [
  '#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f', '#bfff7f', '#7fff9f',
  '#7fffff', '#7fbfff', '#9f7fff', '#df7fff', '#ff7fdf', '#b0b0b0',
];

function coverFor(era: Era): string {
  // Prefer an explicit cover on the era (set by the cross-artist page from that
  // artist's config); fall back to the active tracker's CUSTOM_IMAGES map.
  return era.image || CUSTOM_IMAGES[era.name] || '';
}

function itemKey(kind: string, eraName: string, songName?: string, url?: string): string {
  return `${kind}|${eraName}|${songName ?? ''}|${url ?? ''}`;
}

function cleanName(name?: string): string {
  return getCleanSongNameWithTags(name) || (name ?? '');
}

// ---- image loading (for canvas export) -----------------------------------

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const candidates = url.startsWith('/')
      ? [url]
      : [`/api/img-proxy?url=${encodeURIComponent(url)}`, url];
    let i = 0;
    const tryNext = () => {
      if (i >= candidates.length) return resolve(null);
      const src = candidates[i++];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { img.onload = img.onerror = null; tryNext(); }, 9000);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); tryNext(); };
      img.src = src;
    };
    tryNext();
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > tr) { sw = sh * tr; sx = (img.width - sw) / 2; }
  else { sh = sw / tr; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines) lines.push(line);
  // Ellipsize the last line if it still overflows.
  let last = lines[lines.length - 1] ?? '';
  if (ctx.measureText(last).width > maxWidth) {
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = last + '…';
  }
  return lines.filter(Boolean);
}

// A single draggable card. Hoisted to module scope with a STABLE identity so
// that the frequent drag-state re-renders of TierListView (drag position, drop
// target, etc.) reconcile these in place instead of unmounting/remounting them
// — a remount mid-drag would destroy the element holding the pointer capture
// and silently kill the drag.
const TierTile = memo(function TierTile({ it, dragging, onPointerDown, onPointerMove, onPointerUp, onRemove }: {
  it: TierItem;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent, it: TierItem) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      data-tile-id={it.id}
      onPointerDown={e => onPointerDown(e, it)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: 'none' }}
      className={`group relative w-[68px] h-[68px] shrink-0 rounded-md overflow-hidden bg-white/5 select-none cursor-grab active:cursor-grabbing ${dragging ? 'opacity-30' : ''}`}
      title={it.kind === 'song' ? `${cleanName(it.songName)} ${it.version || ''}`.trim() : cleanName(it.eraName)}
    >
      {it.image
        ? <img src={it.image} onError={retryImageOnError} referrerPolicy="no-referrer" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
        : <div className="absolute inset-0 bg-white/10" />}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-1 pt-3 pb-0.5 pointer-events-none">
        <div className="text-[8px] leading-tight font-semibold text-white line-clamp-2">{it.kind === 'era' ? cleanName(it.eraName) : cleanName(it.songName)}</div>
        {it.kind === 'song' && it.version && <div className="text-[7px] leading-tight text-white/60 truncate">{it.version}</div>}
      </div>
      {it.kind === 'song' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 pointer-events-none transition">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      )}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onRemove(it.id); }}
        className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white/70 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
      ><X className="w-3 h-3" /></button>
    </div>
  );
});

// --------------------------------------------------------------------------

export function TierListView({ eras, searchQuery = '', onPlaySong, onToast, artistCatalog }: Props) {
  const { tierLists, createTierList, renameTierList, deleteTierList, updateTierList } = useTierLists();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingName, setRenamingName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'songs' | 'eras'>('songs');
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerArtist, setPickerArtist] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [paletteRowId, setPaletteRowId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const list = tierLists.find(t => t.id === selectedId) ?? null;

  // ---- drag state -------------------------------------------------------
  const dragRef = useRef<{ item: TierItem; startX: number; startY: number; active: boolean } | null>(null);
  const [dragItem, setDragItem] = useState<TierItem | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ tier: string; beforeId: string | null } | null>(null);

  const catalog = useMemo(() => {
    const eraEntries: TierItem[] = [];
    const songEntries: TierItem[] = [];
    for (const era of eras) {
      const cover = coverFor(era);
      const artist = (era as any).artistSlug as string | undefined;
      const artistName = (era as any).artistName as string | undefined;
      eraEntries.push({ id: '', kind: 'era', eraName: era.name, image: cover, artist, artistName });
      const songs = Object.values(era.data || {}).flat();
      for (const s of songs) {
        const url = s.url || (s.urls && s.urls[0]) || '';
        songEntries.push({ id: '', kind: 'song', eraName: era.name, songName: s.name, version: s.extra, url, image: cover, artist, artistName });
      }
    }
    return { eraEntries, songEntries };
  }, [eras]);

  const placedKeys = useMemo(() => {
    const set = new Set<string>();
    if (list) {
      for (const arr of Object.values(list.items)) {
        for (const it of arr) set.add(itemKey(it.kind, it.eraName, it.songName, it.url));
      }
    }
    return set;
  }, [list]);

  const hitTest = useCallback((x: number, y: number): { tier: string; beforeId: string | null } | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const rowEl = el.closest('[data-tier]') as HTMLElement | null;
    if (!rowEl) return null;
    const tier = rowEl.getAttribute('data-tier')!;
    const draggedId = dragRef.current?.item.id;
    const tiles = Array.from(rowEl.querySelectorAll('[data-tile-id]')) as HTMLElement[];
    let beforeId: string | null = null;
    for (const t of tiles) {
      const id = t.getAttribute('data-tile-id');
      if (id === draggedId) continue;
      const r = t.getBoundingClientRect();
      if (x < r.left + r.width / 2) { beforeId = id; break; }
    }
    return { tier, beforeId };
  }, []);

  const performMove = useCallback((itemId: string, toTier: string, beforeId: string | null) => {
    if (!list) return;
    updateTierList(list.id, tl => {
      let moved: TierItem | undefined;
      const items: Record<string, TierItem[]> = {};
      for (const key of Object.keys(tl.items)) {
        items[key] = tl.items[key].filter(it => {
          if (it.id === itemId) { moved = it; return false; }
          return true;
        });
      }
      if (!moved) return tl;
      if (!items[toTier]) items[toTier] = [];
      const dest = items[toTier];
      const idx = beforeId ? dest.findIndex(it => it.id === beforeId) : -1;
      if (idx >= 0) dest.splice(idx, 0, moved); else dest.push(moved);
      return { ...tl, items };
    });
  }, [list, updateTierList]);

  const resolveAndPlay = useCallback((item: TierItem) => {
    if (item.kind !== 'song') return;
    const era = eras.find(e => e.name === item.eraName);
    if (era) {
      const songs = Object.values(era.data || {}).flat();
      const song = songs.find(s => s.name === item.songName && (s.url || (s.urls && s.urls[0]) || '') === (item.url || ''))
        || songs.find(s => s.name === item.songName);
      if (song) {
        const eraForPlay = { ...era, image: coverFor(era) } as Era;
        onPlaySong(song as Song, eraForPlay, [song as Song]);
        return;
      }
    }
    // Fallback: the card's own era isn't loaded (e.g. a cross-artist card after a
    // reload). Play straight from the stored url + cover.
    if (!item.url) { onToast?.('Song not available'); return; }
    const synthSong = { name: item.songName || '', extra: item.version, url: item.url, image: item.image } as Song;
    const synthEra = { name: item.eraName, image: item.image, data: {} } as Era;
    onPlaySong(synthSong, synthEra, [synthSong]);
  }, [eras, onPlaySong, onToast]);

  const onTilePointerDown = (e: React.PointerEvent, item: TierItem) => {
    if (e.button !== undefined && e.button !== 0) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    dragRef.current = { item, startX: e.clientX, startY: e.clientY, active: false };
  };

  const onTilePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 8) return;
      d.active = true;
      setDragItem(d.item);
    }
    e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });
    setDropTarget(hitTest(e.clientX, e.clientY));
  };

  const onTilePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    if (!d) return;
    if (d.active) {
      const dt = hitTest(e.clientX, e.clientY);
      if (dt) performMove(d.item.id, dt.tier, dt.beforeId);
    } else {
      resolveAndPlay(d.item);
    }
    setDragItem(null);
    setDropTarget(null);
  };

  // ---- row editing ------------------------------------------------------
  const mutateRows = (fn: (rows: TierRow[], items: Record<string, TierItem[]>) => void) => {
    if (!list) return;
    updateTierList(list.id, tl => {
      const rows = tl.rows.map(r => ({ ...r }));
      const items: Record<string, TierItem[]> = {};
      for (const k of Object.keys(tl.items)) items[k] = [...tl.items[k]];
      fn(rows, items);
      return { ...tl, rows, items };
    });
  };

  const addRow = () => mutateRows((rows, items) => {
    const id = makeId();
    rows.push({ id, label: 'New', color: PALETTE[rows.length % PALETTE.length] });
    items[id] = [];
  });

  const deleteRow = (rowId: string) => mutateRows((rows, items) => {
    const idx = rows.findIndex(r => r.id === rowId);
    if (idx < 0) return;
    rows.splice(idx, 1);
    items[UNRANKED] = [...(items[UNRANKED] || []), ...(items[rowId] || [])];
    delete items[rowId];
  });

  const moveRow = (rowId: string, dir: -1 | 1) => mutateRows((rows) => {
    const idx = rows.findIndex(r => r.id === rowId);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= rows.length) return;
    [rows[idx], rows[to]] = [rows[to], rows[idx]];
  });

  const setRowLabel = (rowId: string, label: string) => mutateRows((rows) => {
    const r = rows.find(x => x.id === rowId); if (r) r.label = label;
  });

  const setRowColor = (rowId: string, color: string) => mutateRows((rows) => {
    const r = rows.find(x => x.id === rowId); if (r) r.color = color;
  });

  const addItem = (entry: TierItem) => {
    if (!list) return;
    updateTierList(list.id, tl => ({
      ...tl,
      items: { ...tl.items, [UNRANKED]: [...(tl.items[UNRANKED] || []), { ...entry, id: makeId() }] },
    }));
  };

  const removeItem = (itemId: string) => {
    if (!list) return;
    updateTierList(list.id, tl => {
      const items: Record<string, TierItem[]> = {};
      for (const k of Object.keys(tl.items)) items[k] = tl.items[k].filter(it => it.id !== itemId);
      return { ...tl, items };
    });
  };

  // ---- image export -----------------------------------------------------
  const exportImage = async () => {
    if (!list || exporting) return;
    setExporting(true);
    onToast?.('Rendering image…');
    try {
      const DPR = 2;
      const LABEL_W = 128;
      const TILE = 104;
      const GAP = 6;
      const PAD = 22;
      const TITLE_H = 74;
      const rows = list.rows;
      const maxLen = Math.max(1, ...rows.map(r => (list.items[r.id] || []).length));
      const cols = Math.min(14, Math.max(6, maxLen));
      const contentW = cols * TILE + (cols - 1) * GAP;

      // Preload every cover used in the tiers.
      const urls = new Set<string>();
      for (const r of rows) for (const it of (list.items[r.id] || [])) if (it.image) urls.add(it.image);
      const imgMap = new Map<string, HTMLImageElement | null>();
      await Promise.all([...urls].map(async u => { imgMap.set(u, await loadImage(u)); }));

      const rowHeights = rows.map(r => {
        const n = (list.items[r.id] || []).length;
        const wraps = Math.max(1, Math.ceil(n / cols));
        return wraps * TILE + (wraps - 1) * GAP + 12;
      });
      const totalH = TITLE_H + rowHeights.reduce((a, b) => a + b, 0) + PAD;
      const totalW = PAD + LABEL_W + GAP + contentW + PAD;

      const canvas = document.createElement('canvas');
      canvas.width = totalW * DPR;
      canvas.height = totalH * DPR;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPR, DPR);

      // Background + title.
      ctx.fillStyle = '#0b0b0e';
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 30px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(list.name, PAD, TITLE_H / 2 + 4);
      ctx.font = '600 15px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('unvaulted.cc', totalW - PAD, TITLE_H / 2 + 5);
      ctx.textAlign = 'left';

      let cursor = TITLE_H;
      const tilesX = PAD + LABEL_W + GAP;
      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        const items = list.items[row.id] || [];
        const h = rowHeights[ri];

        // Label cell.
        ctx.fillStyle = row.color;
        ctx.fillRect(PAD, cursor, LABEL_W, h);
        ctx.fillStyle = '#141414';
        const label = row.label || '';
        let fontSize = label.length > 6 ? 20 : label.length > 3 ? 28 : 40;
        ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        const labelLines = wrapLines(ctx, label, LABEL_W - 12, 2);
        const lineH = fontSize + 4;
        labelLines.forEach((ln, i) => {
          ctx.fillText(ln, PAD + LABEL_W / 2, cursor + h / 2 + (i - (labelLines.length - 1) / 2) * lineH);
        });
        ctx.textAlign = 'left';

        // Tiles.
        items.forEach((it, i) => {
          const col = i % cols;
          const wr = Math.floor(i / cols);
          const tx = tilesX + col * (TILE + GAP);
          const ty = cursor + 6 + wr * (TILE + GAP);
          const img = it.image ? imgMap.get(it.image) : null;
          if (img) {
            drawCover(ctx, img, tx, ty, TILE, TILE);
          } else {
            ctx.fillStyle = '#26262b';
            ctx.fillRect(tx, ty, TILE, TILE);
          }
          // Bottom gradient for legibility.
          const grad = ctx.createLinearGradient(0, ty + TILE * 0.35, 0, ty + TILE);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.82)');
          ctx.fillStyle = grad;
          ctx.fillRect(tx, ty + TILE * 0.35, TILE, TILE * 0.65);

          // Text.
          const title = it.kind === 'era' ? cleanName(it.eraName) : cleanName(it.songName);
          const version = it.kind === 'song' ? (it.version || '') : '';
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 12px Inter, system-ui, sans-serif';
          const nameLines = wrapLines(ctx, title, TILE - 10, version ? 2 : 3);
          let liney = ty + TILE - 7;
          const drawStack: { text: string; font: string; color: string }[] = [];
          if (version) drawStack.push({ text: version, font: '600 10px Inter, system-ui, sans-serif', color: 'rgba(255,255,255,0.75)' });
          for (let li = nameLines.length - 1; li >= 0; li--) drawStack.unshift({ text: nameLines[li], font: '700 12px Inter, system-ui, sans-serif', color: '#ffffff' });
          for (let li = drawStack.length - 1; li >= 0; li--) {
            const d = drawStack[li];
            ctx.font = d.font; ctx.fillStyle = d.color;
            ctx.fillText(d.text, tx + 5, liney);
            liney -= 13;
          }
        });

        // Separator.
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, cursor + h + 0.5);
        ctx.lineTo(totalW - PAD, cursor + h + 0.5);
        ctx.stroke();

        cursor += h;
      }

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) saveAs(blob, `${list.name.replace(/[^a-z0-9\-_ ]/gi, '_')}.png`);
          resolve();
        }, 'image/png');
      });
      onToast?.('Downloaded tier list image');
    } catch (err) {
      console.error('Tier list export failed', err);
      onToast?.('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // ======================================================================
  // List selection screen
  // ======================================================================
  if (!list) {
    const filtered = tierLists.filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[var(--theme-color)]" />
            <h1 className="text-2xl font-bold text-white">Tier Lists</h1>
          </div>
          <button
            onClick={() => { setCreating(true); setNewName(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-color)] text-black font-semibold text-sm hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> New tier list
          </button>
        </div>

        <div className="mb-6 flex items-start gap-2 text-xs text-white/45 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
          <Layers className="w-4 h-4 shrink-0 mt-0.5 text-[var(--theme-color)]/70" />
          <span>Tip: inside any era on a tracker, hit <span className="text-white/70 font-semibold">Select</span>, pick songs, and use <span className="text-white/70 font-semibold">Tier List</span> to send them straight here.</span>
        </div>

        {creating && (
          <div className="flex items-center gap-2 mb-6">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { const id = createTierList(newName); setSelectedId(id); setCreating(false); }
                if (e.key === 'Escape') setCreating(false);
              }}
              placeholder="Tier list name…"
              className="flex-1 max-w-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--theme-color)]"
            />
            <button onClick={() => { const id = createTierList(newName); setSelectedId(id); setCreating(false); }} className="p-2 rounded-lg bg-[var(--theme-color)] text-black"><Check className="w-4 h-4" /></button>
            <button onClick={() => setCreating(false)} className="p-2 rounded-lg bg-white/10 text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No tier lists yet. Create one and start ranking songs and eras.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(tl => {
              const count = Object.entries(tl.items).reduce((a, [k, v]) => a + (k === UNRANKED ? 0 : v.length), 0);
              const previews = tl.rows.flatMap(r => (tl.items[r.id] || [])).slice(0, 4);
              return (
                <div key={tl.id} className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[var(--theme-color)]/50 transition cursor-pointer" onClick={() => setSelectedId(tl.id)}>
                  <div className="grid grid-cols-2 aspect-video bg-black/40">
                    {previews.length > 0 ? previews.map((it, i) => (
                      <div key={i} className="overflow-hidden bg-white/5">
                        {it.image && <img src={it.image} onError={retryImageOnError} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />}
                      </div>
                    )) : <div className="col-span-2 flex items-center justify-center text-white/20"><Layers className="w-8 h-8" /></div>}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-white text-sm truncate">{tl.name}</div>
                    <div className="text-xs text-white/40">{count} ranked · {tl.rows.length} tiers</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${tl.name}"?`)) deleteTierList(tl.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ======================================================================
  // Editor screen
  // ======================================================================
  const alreadyKey = (it: TierItem) => placedKeys.has(itemKey(it.kind, it.eraName, it.songName, it.url));
  const selectArtist = (slug: string) => {
    setPickerArtist(slug);
    if (slug && artistCatalog && !artistCatalog.loaded.includes(slug)) artistCatalog.onLoad(slug);
  };
  const artistPending = !!artistCatalog && !!pickerArtist && (artistCatalog.loading === pickerArtist || !artistCatalog.loaded.includes(pickerArtist));
  const pickerItems = (pickerTab === 'songs' ? catalog.songEntries : catalog.eraEntries).filter(it => {
    if (artistCatalog && pickerArtist && it.artist !== pickerArtist) return false;
    if (!pickerQuery) return true;
    const q = pickerQuery.toLowerCase();
    return (it.songName || '').toLowerCase().includes(q) || it.eraName.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-3 py-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => setSelectedId(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"><ChevronLeft className="w-5 h-5" /></button>
        {renamingName !== null ? (
          <input
            autoFocus
            value={renamingName}
            onChange={e => setRenamingName(e.target.value)}
            onBlur={() => { if (renamingName.trim()) renameTierList(list.id, renamingName.trim()); setRenamingName(null); }}
            onKeyDown={e => { if (e.key === 'Enter') { if (renamingName.trim()) renameTierList(list.id, renamingName.trim()); setRenamingName(null); } if (e.key === 'Escape') setRenamingName(null); }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-lg font-bold outline-none focus:border-[var(--theme-color)]"
          />
        ) : (
          <button onClick={() => setRenamingName(list.name)} className="flex items-center gap-2 text-xl font-bold text-white hover:text-[var(--theme-color)] transition">
            {list.name} <Pencil className="w-4 h-4 opacity-50" />
          </button>
        )}
        <div className="flex-1" />
        <button onClick={() => setPickerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-color)] text-black font-semibold text-sm hover:brightness-110 transition"><Plus className="w-4 h-4" /> Add songs</button>
        <button onClick={exportImage} disabled={exporting} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition disabled:opacity-50"><Download className="w-4 h-4" /> {exporting ? 'Rendering…' : 'Export image'}</button>
      </div>

      {/* Tier rows */}
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
        {list.rows.map((row, ri) => (
          <div key={row.id} className="flex items-stretch border-b border-white/10 last:border-b-0">
            {/* Label cell */}
            <div className="relative w-[92px] shrink-0 flex flex-col items-center justify-center py-2 gap-1" style={{ backgroundColor: row.color }}>
              {editingRowId === row.id ? (
                <input
                  autoFocus
                  defaultValue={row.label}
                  onBlur={e => { setRowLabel(row.id, e.target.value); setEditingRowId(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { setRowLabel(row.id, (e.target as HTMLInputElement).value); setEditingRowId(null); } if (e.key === 'Escape') setEditingRowId(null); }}
                  className="w-[80px] text-center bg-black/20 text-black font-extrabold text-lg rounded outline-none"
                />
              ) : (
                <button onClick={() => setEditingRowId(row.id)} className="text-black font-extrabold text-2xl leading-tight text-center break-words w-full px-1">{row.label || '—'}</button>
              )}
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveRow(row.id, -1)} disabled={ri === 0} className="p-0.5 rounded text-black/60 hover:text-black hover:bg-black/10 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => moveRow(row.id, 1)} disabled={ri === list.rows.length - 1} className="p-0.5 rounded text-black/60 hover:text-black hover:bg-black/10 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => setPaletteRowId(paletteRowId === row.id ? null : row.id)} className="p-0.5 rounded text-black/60 hover:text-black hover:bg-black/10"><Palette className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteRow(row.id)} className="p-0.5 rounded text-black/60 hover:text-red-700 hover:bg-black/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              {paletteRowId === row.id && (
                <div className="absolute z-20 top-full left-1 mt-1 p-2 grid grid-cols-6 gap-1 bg-[#1a1a1e] border border-white/15 rounded-lg shadow-xl">
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => { setRowColor(row.id, c); setPaletteRowId(null); }} className="w-5 h-5 rounded border border-black/20" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
            {/* Drop area */}
            <div
              data-tier={row.id}
              className={`flex-1 min-h-[80px] flex flex-wrap gap-1.5 p-2 transition-colors ${dropTarget?.tier === row.id ? 'bg-[var(--theme-color)]/10' : ''}`}
            >
              {(list.items[row.id] || []).map(it => (
                <TierTile key={it.id} it={it} dragging={dragItem?.id === it.id} onPointerDown={onTilePointerDown} onPointerMove={onTilePointerMove} onPointerUp={onTilePointerUp} onRemove={removeItem} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addRow} className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm"><Plus className="w-4 h-4" /> Add tier</button>

      {/* Unranked pool */}
      <div className="mt-6">
        <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Unranked · drag into a tier</div>
        <div
          data-tier={UNRANKED}
          className={`min-h-[86px] flex flex-wrap gap-1.5 p-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] transition-colors ${dropTarget?.tier === UNRANKED ? 'bg-[var(--theme-color)]/10' : ''}`}
        >
          {(list.items[UNRANKED] || []).length === 0
            ? <div className="text-white/30 text-sm px-2 py-6">Add songs or eras, then drag them up into tiers. Tap a song to play it.</div>
            : (list.items[UNRANKED] || []).map(it => (
                <TierTile key={it.id} it={it} dragging={dragItem?.id === it.id} onPointerDown={onTilePointerDown} onPointerMove={onTilePointerMove} onPointerUp={onTilePointerUp} onRemove={removeItem} />
              ))}
        </div>
      </div>

      {/* Floating drag clone */}
      {dragItem && (
        <div className="fixed z-[100] pointer-events-none" style={{ left: dragPos.x, top: dragPos.y, transform: 'translate(-50%,-50%) rotate(-3deg)' }}>
          <div className="w-[68px] h-[68px] rounded-md overflow-hidden shadow-2xl ring-2 ring-[var(--theme-color)]">
            {dragItem.image && <img src={dragItem.image} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />}
          </div>
        </div>
      )}

      {/* Picker modal */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#121216] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">Add to tier list</h2>
                  <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white"><X className="w-5 h-5" /></button>
                </div>
                {artistCatalog && (
                  <div className="mb-3">
                    <select
                      value={pickerArtist}
                      onChange={e => selectArtist(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[var(--theme-color)]"
                    >
                      <option value="">Choose an artist…</option>
                      {artistCatalog.artists.map(a => (
                        <option key={a.slug} value={a.slug} className="bg-[#121216]">
                          {a.name}{artistCatalog.loaded.includes(a.slug) ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setPickerTab('songs')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${pickerTab === 'songs' ? 'bg-[var(--theme-color)] text-black' : 'bg-white/5 text-white/60'}`}>Songs</button>
                  <button onClick={() => setPickerTab('eras')} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${pickerTab === 'eras' ? 'bg-[var(--theme-color)] text-black' : 'bg-white/5 text-white/60'}`}>Eras</button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} placeholder={`Search ${pickerTab}…`} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-[var(--theme-color)]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {artistCatalog && !pickerArtist ? (
                  <div className="text-center text-white/40 py-16">Pick an artist above to load their songs & eras.</div>
                ) : artistPending ? (
                  <div className="text-center text-white/50 py-16">
                    {artistCatalog?.error && artistCatalog.loading !== pickerArtist
                      ? <span className="text-red-400">{artistCatalog.error}</span>
                      : `Loading ${artistCatalog?.artists.find(a => a.slug === pickerArtist)?.name || ''}…`}
                  </div>
                ) : (
                <>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {pickerItems.slice(0, 300).map((it, i) => {
                    const added = alreadyKey(it);
                    return (
                      <button
                        key={i}
                        disabled={added}
                        onClick={() => { addItem(it); }}
                        className={`group relative aspect-square rounded-lg overflow-hidden bg-white/5 ${added ? 'opacity-40 cursor-default' : 'hover:ring-2 hover:ring-[var(--theme-color)]'}`}
                        title={it.kind === 'song' ? `${cleanName(it.songName)} ${it.version || ''}`.trim() : cleanName(it.eraName)}
                      >
                        {it.image
                          ? <img src={it.image} onError={retryImageOnError} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" alt="" />
                          : <div className="absolute inset-0 bg-white/10" />}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pt-4 pb-1">
                          <div className="text-[9px] leading-tight font-semibold text-white line-clamp-2">{it.kind === 'era' ? cleanName(it.eraName) : cleanName(it.songName)}</div>
                          {it.kind === 'song' && it.version && <div className="text-[8px] text-white/60 truncate">{it.version}</div>}
                        </div>
                        {!added && <div className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100"><Plus className="w-3.5 h-3.5 text-white" /></div>}
                        {added && <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[var(--theme-color)]"><Check className="w-3 h-3 text-black" /></div>}
                      </button>
                    );
                  })}
                </div>
                {pickerItems.length === 0 && <div className="text-center text-white/40 py-10">No matches.</div>}
                </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
