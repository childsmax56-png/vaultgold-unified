// Personal listening history — records plays for signed-in UNVAULTED users so
// they can see their own stats ("Wrapped"-style) at /listening.
//
// Listens endpoints are called same-origin so whatever deployment is serving
// the app (production unvaulted.cc, a Cloudflare Pages preview branch, or any
// tracker origin) handles them with its own functions. Every deployment binds
// the SAME D1 database (see wrangler.toml database_id), so a session token
// issued by prod login validates on a preview deployment too — which is what
// makes the feature testable on a branch before it ships to prod.
import { ARTIST_REGISTRY } from './artists/registry';

const VG_API = '';
const TOKEN_KEY = 'vg_token';
// Local mirror of the server-side opt-in preference. Default ON.
const ENABLED_KEY = 'vg_listening_enabled';

export function getListeningToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isListeningLoggedIn(): boolean {
  return !!getListeningToken();
}

// Opt-in but defaults to enabled: only an explicit 'off' disables capture.
export function isListeningEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) !== 'off';
}

export function setListeningEnabledLocal(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off');
}

export interface ListenPayload {
  track: string;
  artist?: string;
  album?: string;
  eraName?: string;
  artistSlug?: string;
  songUrl?: string;
  durationSec?: number;
  playedAt?: number; // unix seconds
}

export async function logListen(payload: ListenPayload): Promise<void> {
  const token = getListeningToken();
  if (!token) return;
  if (!isListeningEnabled()) return;
  if (!payload.track) return;
  try {
    await fetch(`${VG_API}/api/listens/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Best-effort: never let stats capture interfere with playback.
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = getListeningToken();
  return fetch(`${VG_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function fetchListeningStats(range: string): Promise<any> {
  const res = await authFetch(`/api/listens/stats?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json();
}

export async function fetchListeningPref(): Promise<boolean> {
  const res = await authFetch('/api/listens/prefs');
  if (!res.ok) throw new Error(`prefs ${res.status}`);
  const data = (await res.json()) as { enabled: boolean };
  setListeningEnabledLocal(data.enabled);
  return data.enabled;
}

export async function setListeningPref(enabled: boolean): Promise<void> {
  setListeningEnabledLocal(enabled);
  await authFetch('/api/listens/prefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

// --- Last.fm backfill -------------------------------------------------------
// Import the user's Last.fm scrobbles that match songs in the tracker catalogs,
// so their /listening stats reflect past listening. Matching runs client-side
// because it reuses the same catalog + artist-name logic the scrobbler uses,
// which lives in the frontend (registry configs, cleanTrackName).

interface Scrobble { artist: string; track: string; album: string; uts: number; }

interface CatalogEntry { eraName: string; songName: string; songUrl: string; durationSec: number | null; }

export interface ImportProgress {
  page: number;
  totalPages: number;
  scanned: number;
  matched: number;
  imported: number;
}

export interface ImportResult {
  scanned: number;
  matched: number;
  imported: number;
  username: string | null;
}

// Version/format-agnostic normalization: drop bracketed/parenthetical bits and
// feat credits, then keep only lowercase alphanumerics. Both catalog titles and
// scrobble titles reduce to the same key, so site-origin scrobbles round-trip
// and different "versions" of a title collapse to one song.
function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\b(feat|ft|featuring|prod|with)\b.*$/i, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

// Catalog song titles sometimes carry an "Artist - Title" prefix; the scrobbler
// strips it, so we do too before keying.
function baseTitle(name: string): string {
  return name.includes(' - ') ? name.split(' - ').slice(1).join(' - ') : name;
}

function parseDurationSec(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d+):(\d{1,2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// normArtist -> slug, built from each tracker config's canonical artist name.
function buildArtistSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [slug, config] of Object.entries(ARTIST_REGISTRY)) {
    let name = '';
    try { name = (config as any).getArtistName?.(undefined) || ''; } catch { /* ignore */ }
    const key = norm(name);
    if (key && !map.has(key)) map.set(key, slug);
  }
  return map;
}

// Fetch one tracker's catalog and index it by normalized base title.
async function buildTrackIndex(slug: string): Promise<Map<string, CatalogEntry>> {
  const index = new Map<string, CatalogEntry>();
  try {
    const res = await fetch(`${VG_API}/api/${slug}/a`);
    if (!res.ok) return index;
    const data = (await res.json()) as { eras?: Record<string, any> };
    const eras = data.eras ?? {};
    for (const era of Object.values(eras)) {
      const eraName: string = era?.name ?? '';
      const buckets = era && era.data ? Object.values(era.data) : [];
      for (const bucket of buckets as any[]) {
        const songs = Array.isArray(bucket) ? bucket : [];
        for (const song of songs) {
          const rawName = (song?.name ?? '').trim();
          if (!rawName) continue;
          const key = norm(baseTitle(rawName));
          if (!key || index.has(key)) continue;
          index.set(key, {
            eraName,
            songName: baseTitle(rawName).trim(),
            songUrl: song?.url ?? '',
            durationSec: parseDurationSec(song?.trackLength ?? song?.track_length),
          });
        }
      }
    }
  } catch { /* skip this tracker on error */ }
  return index;
}

async function fetchScrobblePage(page: number, username: string | null): Promise<{ totalPages: number; tracks: Scrobble[]; username: string | null }> {
  const qs = new URLSearchParams({ page: String(page) });
  if (username) qs.set('username', username);
  const res = await authFetch(`/api/listens/lastfm-history?${qs}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `history ${res.status}`);
  }
  const data = (await res.json()) as { totalPages: number; tracks: Scrobble[]; username: string | null };
  return data;
}

export async function importFromLastfm(
  localUsername: string | null,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const artistSlugMap = buildArtistSlugMap();
  const indexCache = new Map<string, Map<string, CatalogEntry>>();

  let scanned = 0;
  let imported = 0;
  const matchedRows: ListenPayload[] = [];
  const seen = new Set<string>(); // dedup by uts|track within this run

  const first = await fetchScrobblePage(1, localUsername);
  const username = first.username ?? localUsername;
  const totalPages = first.totalPages;

  for (let page = 1; page <= totalPages; page++) {
    const pageData = page === 1 ? first : await fetchScrobblePage(page, username);
    for (const sc of pageData.tracks) {
      scanned++;
      const slug = artistSlugMap.get(norm(sc.artist));
      if (!slug) continue;
      if (!indexCache.has(slug)) indexCache.set(slug, await buildTrackIndex(slug));
      const entry = indexCache.get(slug)!.get(norm(sc.track));
      if (!entry) continue;

      const dedupKey = `${sc.uts}|${norm(sc.track)}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      matchedRows.push({
        track: entry.songName,
        artist: sc.artist,
        album: entry.eraName,
        eraName: entry.eraName,
        artistSlug: slug,
        songUrl: entry.songUrl,
        durationSec: entry.durationSec ?? undefined,
        playedAt: sc.uts,
      });
    }

    onProgress?.({ page, totalPages, scanned, matched: matchedRows.length, imported });

    // Flush in batches so a huge history doesn't hold everything in memory /
    // one giant request, and progress reflects real inserts.
    if (matchedRows.length >= 200) {
      imported += await flushImport(matchedRows.splice(0, matchedRows.length));
      onProgress?.({ page, totalPages, scanned, matched: matchedRows.length, imported });
    }
  }

  if (matchedRows.length > 0) {
    imported += await flushImport(matchedRows.splice(0, matchedRows.length));
  }

  return { scanned, matched: seen.size, imported, username };
}

async function flushImport(rows: ListenPayload[]): Promise<number> {
  let imported = 0;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const res = await authFetch('/api/listens/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listens: rows.slice(i, i + CHUNK) }),
    });
    if (res.ok) {
      const data = (await res.json()) as { imported?: number };
      imported += data.imported ?? 0;
    }
  }
  return imported;
}
