import { useState, useCallback, useRef, type CSSProperties } from 'react';
import { ChevronLeft, Layers } from 'lucide-react';
import { TierListProvider } from './TierListContext';
import { TierListView } from './components/TierListView';
import { ARTIST_LIST, getArtistConfig } from './artists/registry';
import type { Era, Song } from './types';
import * as audioStore from './player/audioStore';

const GLOBAL_STORAGE_KEY = 'unvaulted_global_tierlists';

// Sources the lightweight audio element can stream directly. YouTube/Spotify/
// SoundCloud need the full per-tracker player, so we don't attempt them here.
function isDirectlyPlayableAudio(url: string): boolean {
  return (
    url.includes('pillows.su/f/') ||
    url.includes('pillowcase.su/f/') ||
    url.includes('imgur.gg/f/') ||
    url.includes('i.imgur.com') ||
    url.includes('krakenfiles.com/view/') ||
    url.includes('pixeldrain.com/u/') ||
    url.includes('drive.google.com') ||
    url.startsWith('/') ||
    /\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(url)
  );
}

// Artists sorted by display label for the picker dropdown.
const ARTISTS = ARTIST_LIST
  .map(c => ({ slug: c.slug, name: c.artistLabel }))
  .sort((a, b) => a.name.localeCompare(b.name));

function TierListPageInner() {
  const [eras, setEras] = useState<Era[]>([]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const loadArtist = useCallback(async (slug: string) => {
    if (loaded.includes(slug) || loading === slug) return;
    setLoading(slug);
    setError(null);
    try {
      const config = getArtistConfig(slug);
      const res = await fetch(`/api/${slug}/a`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const artistName = config?.artistLabel || slug;
      const artistEras = (Object.values(data?.eras || {}) as Era[]).map(era => ({
        ...era,
        image: (config?.CUSTOM_IMAGES?.[era.name]) || era.image,
        // Tags read by TierListView's catalog builder.
        artistSlug: slug,
        artistName,
      }));
      setEras(prev => [...prev, ...artistEras]);
      setLoaded(prev => prev.includes(slug) ? prev : [...prev, slug]);
    } catch (e) {
      console.error('Tier list artist load failed', e);
      setError(`Couldn't load that artist. Try again.`);
      showToast(`Couldn't load ${getArtistConfig(slug)?.artistLabel || slug}`);
    } finally {
      setLoading(null);
    }
  }, [loaded, loading, showToast]);

  const handlePlaySong = useCallback(async (song: Song, era: Era, ctx?: Song[]) => {
    const raw = song.url || (song.urls && song.urls[0]) || '';
    if (!raw) { showToast('Nothing to play for this one'); return; }
    if (!isDirectlyPlayableAudio(raw)) { showToast('Preview not available here — open it in the tracker'); return; }
    try {
      const streamUrl = await audioStore.resolveStreamUrl(raw);
      if (!streamUrl) { showToast('Nothing to play for this one'); return; }
      const artwork = era.image || song.image || '';
      audioStore.playAudioStream({ song, era, streamUrl, playlist: ctx || [song], index: 0, autoPlay: true });
      audioStore.setState({ currentArtwork: artwork, currentArtistLabel: (era as any).artistName || '' });
    } catch {
      showToast('Playback failed');
    }
  }, [showToast]);

  return (
    <div className="min-h-dvh bg-yzy-black text-white" style={{ '--theme-color': '#C9A224' } as CSSProperties}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <a href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold">
          <ChevronLeft className="w-4 h-4" /> Home
        </a>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--theme-color)]" />
          <span className="font-bold tracking-tight">Tier List Maker</span>
        </div>
        <span className="hidden sm:inline text-xs text-white/40 ml-1">Rank songs & eras from any artist</span>
      </div>

      <TierListView
        eras={eras}
        onPlaySong={handlePlaySong}
        onToast={showToast}
        artistCatalog={{ artists: ARTISTS, loaded, loading, onLoad: loadArtist, error }}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/15 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export function TierListPage() {
  return (
    <TierListProvider storageKey={GLOBAL_STORAGE_KEY}>
      <TierListPageInner />
    </TierListProvider>
  );
}
