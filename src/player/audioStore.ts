// Global, route-independent audio playback engine.
//
// The per-artist <App> mounts with `key={artist}`, so navigating between
// artists (or to the landing page) unmounts and remounts it. When the audio
// element and playback state lived inside App, that remount destroyed the
// element and stopped the music. This module hoists the single <audio> element
// and all of its playback state into a module-level singleton that lives for
// the whole session, so a song keeps playing across navigation until the user
// picks a new one.
//
// App consumes this via `usePlayerField` (a drop-in useState replacement) and
// `audioRef`, so the existing playback code keeps working unchanged. A global
// mini-player (GlobalMiniPlayer) reads it directly so playback stays visible
// and controllable on routes where App is not mounted (e.g. the landing page).

import axios from 'axios';
import { useCallback, useSyncExternalStore } from 'react';
import type { Song, Era } from '../types';

export type ActivePlayer = 'audio' | 'spotify' | 'youtube' | 'soundcloud';

export interface AudioState {
  currentSong: Song | null;
  currentEra: Era | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  currentSongIndex: number;
  isShuffle: boolean;
  shuffledQueue: number[];
  loopMode: number;
  hasLoopedOnce: boolean;
  isRandomMode: boolean;
  activePlayer: ActivePlayer;
  // Artwork/artist resolved at play time under the song's own artist config.
  // Kept so the player shows the right values even after navigating into a
  // different artist's tracker (where the active config would resolve wrongly).
  currentArtwork: string;
  currentArtistLabel: string;
}

const initialState: AudioState = {
  currentSong: null,
  currentEra: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playlist: [],
  currentSongIndex: -1,
  isShuffle: false,
  shuffledQueue: [],
  loopMode: 0,
  hasLoopedOnce: false,
  isRandomMode: false,
  activePlayer: 'audio',
  currentArtwork: '',
  currentArtistLabel: '',
};

let state: AudioState = { ...initialState };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getState(): AudioState {
  return state;
}

export function setState(patch: Partial<AudioState>) {
  state = { ...state, ...patch };
  emit();
}

// --- Persistent <audio> element -------------------------------------------

let el: HTMLAudioElement | null = null;
let timeToRestore: number | null = null;

// True once audio has actually started playing at least once this session.
// Used so a newly mounted artist page won't auto-restore its own last track
// over something the user is actively listening to across navigation.
let everPlayed = false;
export function hasEverPlayed(): boolean {
  return everPlayed;
}

function playSafe(a: HTMLAudioElement) {
  const p = a.play();
  if (p !== undefined) {
    p.catch((e) => {
      if (e && e.name !== 'AbortError') console.error('Audio play failed', e);
    });
  }
}

export function getAudioEl(): HTMLAudioElement | null {
  if (el) return el;
  if (typeof Audio === 'undefined') return null;

  el = new Audio();
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  el.setAttribute('playsinline', '');

  el.addEventListener('timeupdate', () => {
    if (el) setState({ currentTime: el.currentTime });
  });
  el.addEventListener('loadedmetadata', () => {
    if (!el) return;
    setState({ duration: el.duration });
    el.volume = state.volume;
    if (timeToRestore !== null) {
      el.currentTime = timeToRestore;
      setState({ currentTime: timeToRestore });
      timeToRestore = null;
    }
  });
  el.addEventListener('play', () => {
    everPlayed = true;
    setState({ isPlaying: true });
  });
  el.addEventListener('pause', () => setState({ isPlaying: false }));
  el.addEventListener('ended', handleEnded);

  // Keep the element in the DOM for the most reliable background playback and
  // media-session behaviour across browsers.
  if (typeof document !== 'undefined' && document.body) {
    el.style.display = 'none';
    document.body.appendChild(el);
  }

  return el;
}

// A stable, ref-like handle so existing `audioRef.current.*` code keeps working.
export const audioRef: { readonly current: HTMLAudioElement | null } = {
  get current() {
    return getAudioEl();
  },
};

// --- One-time defaults ------------------------------------------------------

let volumeInitialized = false;
export function initVolume(value: number) {
  if (volumeInitialized) return;
  volumeInitialized = true;
  const a = getAudioEl();
  if (a) a.volume = value;
  setState({ volume: value });
}

let defaultsInitialized = false;
export function initPlaybackDefaults(isShuffle: boolean, loopMode: number) {
  if (defaultsInitialized) return;
  defaultsInitialized = true;
  setState({ isShuffle, loopMode });
}

export function setTimeToRestore(time: number) {
  timeToRestore = time;
}

// --- Host hooks -------------------------------------------------------------
// When App is mounted it registers its full-featured play handlers so that
// queue advancement reuses the exact same logic (URL resolution, scrobbling,
// preloading, non-audio sources, etc.). When App is not mounted (e.g. on the
// landing page) the store falls back to a lightweight audio-only advance.

type PlaySongFn = (
  song: Song,
  era: Era,
  contextTracks?: Song[],
  resetShuffleHistory?: boolean,
  autoPlay?: boolean,
  isRandomSelection?: boolean,
) => void;

let hostNext: (() => void) | null = null;
let hostPrev: (() => void) | null = null;
let hostPlaySong: PlaySongFn | null = null;

export function registerHost(handlers: {
  next: () => void;
  prev: () => void;
  playSong: PlaySongFn;
}) {
  hostNext = handlers.next;
  hostPrev = handlers.prev;
  hostPlaySong = handlers.playSong;
  return () => {
    if (hostNext === handlers.next) hostNext = null;
    if (hostPrev === handlers.prev) hostPrev = null;
    if (hostPlaySong === handlers.playSong) hostPlaySong = null;
  };
}

// --- Stream resolution (mirrors App's resolveStreamUrl) --------------------

export async function resolveStreamUrl(rawUrl: string): Promise<string> {
  if (rawUrl.includes('imgur.gg/f/')) {
    const id = rawUrl.split('/f/')[1];
    const host = new URL(rawUrl).host;
    const res = await axios.get(`https://${host}/api/file/${id}`);
    return res.data?.cdnUrl ?? rawUrl;
  } else if (rawUrl.includes('pillows.su/f/')) {
    const id = rawUrl.split('/f/')[1];
    // Pillowcase blocks direct cross-site hotlinks; proxy server-side.
    return `/api/audio-proxy?url=${encodeURIComponent(`https://api.pillows.su/api/get/${id}`)}`;
  } else if (rawUrl.includes('pixeldrain.com/u/')) {
    const id = rawUrl.split('/u/')[1]?.split('?')[0];
    const proxyBase = (import.meta.env.VITE_PIXELDRAIN_PROXY_URL ?? '').replace(/\/$/, '');
    return proxyBase ? `${proxyBase}/api/${id}` : `https://pixeldrain.com/api/file/${id}`;
  } else if (rawUrl.includes('drive.google.com')) {
    const m = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return `/api/audio-proxy?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${m[1]}`)}`;
  } else if (rawUrl.includes('krakenfiles.com/view/')) {
    return `/api/kraken-proxy?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}

function isDirectlyPlayableAudio(rawUrl: string): boolean {
  return (
    rawUrl.includes('pillows.su/f/') ||
    rawUrl.includes('imgur.gg/f/') ||
    rawUrl.includes('drive.google.com') ||
    rawUrl.includes('i.imgur.com') ||
    rawUrl.includes('krakenfiles.com/view/') ||
    rawUrl.includes('pixeldrain.com/u/') ||
    rawUrl.startsWith('/') ||
    /\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(rawUrl)
  );
}

// --- Transport controls -----------------------------------------------------

export function togglePlay() {
  const a = getAudioEl();
  if (!a) return;
  if (a.paused) {
    a.volume = state.volume;
    playSafe(a);
  } else {
    a.pause();
  }
}

export function play() {
  const a = getAudioEl();
  if (!a) return;
  a.volume = state.volume;
  playSafe(a);
}

export function pause() {
  getAudioEl()?.pause();
}

export function seek(time: number) {
  const a = getAudioEl();
  if (!a) return;
  a.currentTime = time;
  setState({ currentTime: time });
}

function generateShuffledQueue(length: number, firstIndex: number): number[] {
  if (length <= 0) return [];
  const queue = Array.from({ length }, (_, i) => i);
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  if (firstIndex >= 0 && firstIndex < length) {
    const startIdxPos = queue.indexOf(firstIndex);
    if (startIdxPos > -1) {
      queue.splice(startIdxPos, 1);
      queue.unshift(firstIndex);
    }
  }
  return queue;
}

export function toggleShuffle() {
  const enabling = !state.isShuffle;
  if (enabling && state.playlist.length > 0) {
    setState({ isShuffle: true, shuffledQueue: generateShuffledQueue(state.playlist.length, state.currentSongIndex) });
  } else {
    setState({ isShuffle: enabling });
  }
}

export function cycleLoop() {
  setState({ loopMode: (state.loopMode + 1) % 3 });
}

export function setVolume(v: number) {
  const a = getAudioEl();
  if (a) a.volume = v;
  setState({ volume: v });
}

// Load and play an already-resolved audio stream. App's handlePlaySong calls
// this; the store's own advance path also uses it on routes without App.
export function playAudioStream(opts: {
  song: Song;
  era: Era;
  streamUrl: string;
  playlist: Song[];
  index: number;
  autoPlay?: boolean;
}) {
  const autoPlay = opts.autoPlay ?? true;
  setState({
    activePlayer: 'audio',
    currentSong: opts.song,
    currentEra: opts.era,
    playlist: opts.playlist,
    currentSongIndex: opts.index,
    hasLoopedOnce: false,
    isPlaying: autoPlay,
  });
  const a = getAudioEl();
  if (a) {
    a.src = opts.streamUrl;
    a.load();
    a.volume = state.volume;
    if (autoPlay) playSafe(a);
  }
}

function computeAdjacentIndex(direction: 1 | -1): number | null {
  const { playlist, currentSongIndex, isShuffle, shuffledQueue } = state;
  if (playlist.length === 0) return null;

  if (isShuffle && shuffledQueue.length > 0) {
    const idx = shuffledQueue.indexOf(currentSongIndex);
    if (direction === 1) {
      return idx !== -1 && idx < shuffledQueue.length - 1 ? shuffledQueue[idx + 1] : shuffledQueue[0];
    }
    return idx > 0 ? shuffledQueue[idx - 1] : shuffledQueue[shuffledQueue.length - 1];
  }

  let next = currentSongIndex + direction;
  if (next >= playlist.length) next = 0;
  if (next < 0) next = playlist.length - 1;
  return next;
}

// Lightweight audio-only advance used when App is not mounted (landing page,
// etc.). App's own next/prev handle everything else when it is mounted.
function advanceAudioOnly(direction: 1 | -1) {
  const { playlist, currentEra } = state;
  const idx = computeAdjacentIndex(direction);
  if (idx === null || !currentEra) return;
  const song = playlist[idx];
  if (!song) return;
  const era = (song as any).realEra || currentEra;
  const rawUrl = song.url || (song.urls && song.urls[0]) || '';
  if (!rawUrl || !isDirectlyPlayableAudio(rawUrl)) return;
  resolveStreamUrl(rawUrl)
    .then((streamUrl) => {
      if (!streamUrl) return;
      playAudioStream({ song, era, streamUrl, playlist, index: idx, autoPlay: true });
    })
    .catch(() => {});
}

export function playNext() {
  if (hostNext) {
    hostNext();
    return;
  }
  advanceAudioOnly(1);
}

export function playPrev() {
  if (hostPrev) {
    hostPrev();
    return;
  }
  advanceAudioOnly(-1);
}

function handleEnded() {
  const { loopMode, hasLoopedOnce } = state;
  const a = getAudioEl();

  if (loopMode === 2) {
    if (a) {
      a.currentTime = 0;
      playSafe(a);
    }
    return;
  }

  if (loopMode === 1) {
    if (!hasLoopedOnce) {
      setState({ hasLoopedOnce: true });
      if (a) {
        a.currentTime = 0;
        playSafe(a);
      }
      return;
    }
    setState({ hasLoopedOnce: false });
  }

  playNext();
}

// --- React bindings ---------------------------------------------------------

type Setter<T> = (value: T | ((prev: T) => T)) => void;

// Drop-in replacement for useState, backed by the shared store. Lets App's
// existing `const [x, setX] = useState(...)` sites keep working while making
// the value persist across route/remount boundaries.
export function usePlayerField<K extends keyof AudioState>(key: K): [AudioState[K], Setter<AudioState[K]>] {
  const value = useSyncExternalStore(
    subscribe,
    () => state[key],
    () => state[key],
  );
  const setter = useCallback<Setter<AudioState[K]>>((v) => {
    const next = typeof v === 'function' ? (v as (prev: AudioState[K]) => AudioState[K])(state[key]) : v;
    setState({ [key]: next } as unknown as Partial<AudioState>);
  }, [key]);
  return [value, setter];
}

// Read the whole state reactively (used by the global mini-player).
export function useAudioState(): AudioState {
  return useSyncExternalStore(subscribe, getState, getState);
}
