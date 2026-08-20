// Client for the per-entry comment threads (functions/api/comments*).
//
// Any catalog row — unreleased song, stem, art, video, fake, misc, released —
// is addressed by (trackerSlug, entryKey). `makeEntryKey` builds that stable
// key from the row's type + era + name so the same thread appears wherever the
// entry is shown. Counts are fetched in batches (one request per animation
// frame) so a list of rows doesn't fan out into an N+1.
import { useEffect, useState } from 'react';
import type { Song } from './types';

const TOKEN_KEY = 'vg_token';
const USER_KEY = 'vg_user';

export interface VGUser { id: string; username: string; email: string; }

export interface CommentNode {
  id: string;
  username: string;
  userId: string;
  body: string;
  createdAt: number;
  replies: CommentNode[];
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): VGUser | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Stable, delimiter-safe identity for a single entry. `|` is reserved by the
// batch-counts query, so it is scrubbed here.
export function makeEntryKey(entryType: string, eraName: string | undefined, name: string): string {
  const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/\|/g, '/');
  return [norm(entryType), norm(eraName || ''), norm(name)].join('::');
}

// Canonical base name for an era, so the SAME era read from any tab maps to one
// comment thread. Stems/Misc/Fakes suffix the era name (e.g. "Graduation [Stems
// Album]"); those tab suffixes are stripped, but version tags like "[V1]" that
// genuinely distinguish eras are kept.
export function baseEraName(eraName: string): string {
  return (eraName || '')
    .replace(/\s*\[(stems album|misc album|fake leaks?|stems|misc|fake)\]\s*$/i, '')
    .trim();
}

// Tab-independent comment key for a whole era (shared across every tab).
export function makeEraKey(eraName: string): string {
  return makeEntryKey('era', '', baseEraName(eraName));
}

// Return a copy of `song` carrying the comment-thread context for the entry it
// was played from, so the mini player can open the exact same thread the row
// would. Stamped on the whole playable list so queue auto-advance keeps it.
export function stampSongComment(song: Song, opts: { tracker: string; type: string; era: string }): Song {
  return {
    ...song,
    commentTracker: opts.tracker,
    commentKey: makeEntryKey(opts.type, opts.era, song.name),
    commentLabel: song.name,
  };
}

// ---- Thread CRUD -----------------------------------------------------------

export async function fetchComments(tracker: string, entry: string): Promise<CommentNode[]> {
  const res = await fetch(`/api/comments?tracker=${encodeURIComponent(tracker)}&entry=${encodeURIComponent(entry)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.comments ?? [];
}

export async function postComment(args: {
  tracker: string; entry: string; entryLabel?: string; entryType?: string;
  parentId?: string; body: string;
}): Promise<{ ok: boolean; comment?: CommentNode; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sign in to comment' };
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || 'Failed to post' };
  invalidateCount(args.tracker, args.entry);
  return { ok: true, comment: data.comment };
}

export async function deleteComment(id: string, tracker: string, entry: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) invalidateCount(tracker, entry);
  return res.ok;
}

// ---- Batched counts --------------------------------------------------------

const countCache = new Map<string, number>();          // `${tracker}::${entry}` → count
const subscribers = new Map<string, Set<() => void>>(); // cacheKey → listeners
const pending = new Map<string, Set<string>>();         // tracker → entry keys awaiting fetch
let flushScheduled = false;

function cacheKey(tracker: string, entry: string) { return `${tracker}::${entry}`; }

function notify(key: string) {
  subscribers.get(key)?.forEach((fn) => fn());
}

function invalidateCount(tracker: string, entry: string) {
  const key = cacheKey(tracker, entry);
  countCache.delete(key);
  requestCount(tracker, entry);
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  const run = () => {
    flushScheduled = false;
    const batches = new Map(pending);
    pending.clear();
    for (const [tracker, entries] of batches) {
      const list = Array.from(entries);
      if (list.length === 0) continue;
      const qs = `tracker=${encodeURIComponent(tracker)}&entries=${list.map(encodeURIComponent).join('|')}`;
      fetch(`/api/comments/counts?${qs}`)
        .then((r) => (r.ok ? r.json() : { counts: {} }))
        .then((data: { counts: Record<string, number> }) => {
          for (const entry of list) {
            const key = cacheKey(tracker, entry);
            countCache.set(key, data.counts[entry] ?? 0);
            notify(key);
          }
        })
        .catch(() => { /* leave uncached; a later demand retries */ });
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else setTimeout(run, 16);
}

function requestCount(tracker: string, entry: string) {
  const set = pending.get(tracker) ?? new Set<string>();
  set.add(entry);
  pending.set(tracker, set);
  scheduleFlush();
}

// React hook: comment count for one entry, kept live across posts/deletes.
export function useCommentCount(tracker: string, entry: string): number | undefined {
  const key = cacheKey(tracker, entry);
  const [count, setCount] = useState<number | undefined>(() => countCache.get(key));

  useEffect(() => {
    let alive = true;
    const listener = () => { if (alive) setCount(countCache.get(key)); };
    const set = subscribers.get(key) ?? new Set();
    set.add(listener);
    subscribers.set(key, set);

    if (countCache.has(key)) setCount(countCache.get(key));
    else requestCount(tracker, entry);

    return () => {
      alive = false;
      set.delete(listener);
      if (set.size === 0) subscribers.delete(key);
    };
  }, [key, tracker, entry]);

  return count;
}
