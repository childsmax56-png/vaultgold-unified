// Shared snippet-playback engine for both snippet games. Owns a PRIVATE detached
// <audio> element (NOT the global audioStore singleton) so clips don't hijack the
// site player or scrobble to listening stats; it pauses the global player before
// each clip so the two never overlap.
//
// Play window: each round loads one stream and picks a start offset (random, or a
// deterministic fraction for the daily puzzle). `playLen(n)` plays from that start
// for n seconds — the caller grows n to reveal more, Heardle-style.

import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveStreamUrl, pause as pauseGlobal } from './player/audioStore';

// Longest snippet any mode reveals — the start offset leaves this much room.
const RESERVE_SECONDS = 16;

interface LoadOpts {
  startFraction?: number; // 0..1 deterministic start; omit for a random start
  autoPlayLen?: number;   // seconds to auto-play once metadata is ready
}

export function useSnippetAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef(0);                 // resolved snippet start (s)
  const fracRef = useRef<number | null>(null); // pending deterministic fraction
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingLen = useRef<number | null>(null);
  const metaReady = useRef(false);
  const [clipPlaying, setClipPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const doPlay = useCallback((len: number) => {
    const a = audioRef.current; if (!a) return;
    pauseGlobal(); // don't fight the site-wide player if music was going
    if (stopTimer.current) clearTimeout(stopTimer.current);
    try { a.currentTime = startRef.current; } catch { /* ignore */ }
    const p = a.play();
    if (p) p.catch(() => setBuffering(false));
    stopTimer.current = setTimeout(() => { a.pause(); }, len * 1000);
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.crossOrigin = 'anonymous';
    a.setAttribute('playsinline', '');
    audioRef.current = a;

    const onMeta = () => {
      metaReady.current = true;
      const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : 30;
      const maxStart = Math.max(0, dur - RESERVE_SECONDS - 1);
      const frac = fracRef.current;
      // Bias a random start past the 3s intro so tags/silence don't give it away.
      startRef.current = frac != null ? frac * maxStart : (maxStart > 3 ? 3 + Math.random() * (maxStart - 3) : maxStart * Math.random());
      if (pendingLen.current !== null) { const len = pendingLen.current; pendingLen.current = null; doPlay(len); }
    };
    const onPlay = () => { setBuffering(false); setClipPlaying(true); };
    const onPause = () => setClipPlaying(false);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('playing', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('playing', onPlay);
      a.removeEventListener('pause', onPause);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      a.pause(); a.src = '';
    };
  }, [doPlay]);

  const stopClip = useCallback(() => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    audioRef.current?.pause();
    setClipPlaying(false);
  }, []);

  const playLen = useCallback((len: number) => {
    if (metaReady.current) doPlay(len);
    else { pendingLen.current = len; setBuffering(true); }
  }, [doPlay]);

  const loadClip = useCallback(async (rawUrl: string, opts: LoadOpts = {}) => {
    const a = audioRef.current; if (!a) return;
    stopClip();
    metaReady.current = false;
    fracRef.current = opts.startFraction ?? null;
    setBuffering(true);
    try {
      const stream = await resolveStreamUrl(rawUrl);
      a.src = stream;
      a.load();
      if (opts.autoPlayLen != null) pendingLen.current = opts.autoPlayLen;
    } catch {
      setBuffering(false);
    }
  }, [stopClip]);

  return { clipPlaying, buffering, loadClip, playLen, stopClip };
}
