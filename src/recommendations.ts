// "For You" recommendation engine.
//
// A YouTube-style feed built entirely from the signed-in user's own listening
// history (see functions/api/listens + src/listening.ts). The idea: if you were
// deep in a particular era, surface OTHER songs from that same era — plus more
// from the artists you keep coming back to — as an endless, swipeable feed.
//
// Everything runs client-side, mirroring the catalog-fetch + normalization the
// Last.fm importer already uses: we read the user's stats, figure out which
// eras / trackers they actually listen to, then pull those eras' catalogs
// (/api/{slug}/a) and score the songs. No new backend endpoint needed.

import { ARTIST_REGISTRY } from './artists/registry';
import { eraArtwork } from './eraArtwork';
import { fetchListeningStats } from './listening';
import type { Song, Era } from './types';

// A recommended, ready-to-play Song carrying the extra fields the global audio
// engine needs to play + render it cross-tracker (realEra/image/artist), plus a
// human "why you're seeing this" reason for the feed UI.
export interface RecSong extends Song {
  realEra: Era;
  image: string;
  artist: string;
  tracker: string;
  eraName: string;
  reason: string;
}

// Version/format-agnostic title key — same reduction the scrobble matcher uses,
// so "song (v2)" and "song" collapse and familiar tracks are recognised.
function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\b(feat|ft|featuring|prod|with)\b.*$/i, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

function baseTitle(name: string): string {
  return name.includes(' - ') ? name.split(' - ').slice(1).join(' - ') : name;
}

function artistNameFor(slug: string, eraName: string): string {
  try {
    return (ARTIST_REGISTRY[slug] as any)?.getArtistName?.(eraName) || slug;
  } catch {
    return slug;
  }
}

async function fetchCatalog(slug: string): Promise<{ eras?: Record<string, any> } | null> {
  try {
    const res = await fetch(`/api/${slug}/a`);
    if (!res.ok) return null;
    return (await res.json()) as { eras?: Record<string, any> };
  } catch {
    return null;
  }
}

// A URL that the global audio engine can actually resolve + stream. Mirrors
// audioStore.isDirectlyPlayableAudio so we never recommend an unplayable card.
function isPlayableUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('pillows.su/f/') ||
    url.includes('pillowcase.su/f/') ||
    url.includes('imgur.gg/f/') ||
    url.includes('i.imgur.com') ||
    url.includes('drive.google.com') ||
    url.includes('krakenfiles.com/view/') ||
    url.includes('pixeldrain.com/u/') ||
    url.startsWith('/') ||
    /\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(url)
  );
}

interface Candidate {
  song: RecSong;
  score: number;
  eraKey: string;
  eraWeight: number;
}

const PER_ERA_CAP = 8;   // don't let one era flood the feed
const MAX_RESULTS = 60;

export interface RecommendationResult {
  songs: RecSong[];
  // Why the feed is empty, so the UI can show the right nudge.
  reason: 'ok' | 'not_signed_in' | 'no_history';
}

// Build the recommendation feed. Returns an ordered, era-diversified list.
export async function buildRecommendations(): Promise<RecommendationResult> {
  let stats: any;
  try {
    stats = await fetchListeningStats('all');
  } catch {
    // 401 (not signed in) or network — the feed needs a history to draw from.
    return { songs: [], reason: 'not_signed_in' };
  }

  const topEras: any[] = stats?.topEras ?? [];
  const topTrackers: any[] = stats?.topTrackers ?? [];
  const topSongs: any[] = stats?.topSongs ?? [];
  const recent: any[] = stats?.recent ?? [];

  if (topEras.length === 0 && topTrackers.length === 0) {
    return { songs: [], reason: 'no_history' };
  }

  // Songs the user already plays a lot — kept but heavily down-weighted so the
  // feed leans toward discovery rather than replaying their rotation.
  const playedKeys = new Set<string>();
  for (const s of topSongs) playedKeys.add(norm(String(s.track ?? '')));
  for (const s of recent) playedKeys.add(norm(String(s.track ?? '')));

  // Eras the user actually listened to, weighted by play count.
  const eraWeight = new Map<string, number>(); // `${slug}|${eraName}` -> plays
  for (const e of topEras) {
    if (e.artistSlug && e.eraName) {
      eraWeight.set(`${e.artistSlug}|${e.eraName}`, Number(e.plays) || 1);
    }
  }
  const trackerWeight = new Map<string, number>();
  for (const t of topTrackers) {
    if (t.artistSlug) trackerWeight.set(t.artistSlug, Number(t.plays) || 1);
  }

  // Trackers whose catalogs we need to fetch: everything the user has touched.
  const slugs = new Set<string>();
  for (const e of topEras) if (e.artistSlug) slugs.add(e.artistSlug);
  for (const t of topTrackers) if (t.artistSlug) slugs.add(t.artistSlug);

  const byEra = new Map<string, Candidate[]>();

  await Promise.all(
    [...slugs].map(async (slug) => {
      const data = await fetchCatalog(slug);
      const eras = data?.eras;
      if (!eras) return;

      for (const era of Object.values<any>(eras)) {
        const eraName: string = era?.name ?? '';
        if (!eraName) continue;
        const eraKey = `${slug}|${eraName}`;

        const listenedWeight = eraWeight.get(eraKey);
        // Two sources of candidates:
        //  1. Eras the user actually played → "more from {era}" (full weight).
        //  2. Other eras by an artist they love → "more from {artist}" discovery
        //     at a fraction of the tracker's overall weight.
        let eraW: number;
        let reason: string;
        const artist = artistNameFor(slug, eraName);
        if (listenedWeight !== undefined) {
          eraW = listenedWeight;
          reason = `Because you played ${eraName}`;
        } else if (trackerWeight.has(slug)) {
          eraW = (trackerWeight.get(slug) as number) * 0.15;
          reason = `More from ${artist}`;
        } else {
          continue;
        }
        if (eraW <= 0) continue;

        const cover = eraArtwork(slug, eraName) || era?.image || '';
        const buckets = era?.data ? Object.values<any>(era.data) : [];
        const seenInEra = new Set<string>();

        for (const bucket of buckets) {
          const songs = Array.isArray(bucket) ? bucket : [];
          for (const raw of songs) {
            const rawName = String(raw?.name ?? '').trim();
            const url = raw?.url || (Array.isArray(raw?.urls) ? raw.urls[0] : '') || '';
            if (!rawName || !isPlayableUrl(url)) continue;

            const title = baseTitle(rawName).trim();
            const key = norm(title);
            if (!key || seenInEra.has(key)) continue;
            seenInEra.add(key);

            const familiar = playedKeys.has(key);
            // Weighted-random score: era affinity, a big penalty for songs they
            // already spin, and jitter so the feed feels fresh each visit.
            const score = eraW * (familiar ? 0.18 : 1) * (0.5 + Math.random());

            const realEra: Era = { name: eraName, image: cover, data: {} };
            const song: RecSong = {
              ...(raw as Song),
              name: title,
              url,
              image: cover,
              extra: (raw as Song).extra || eraName,
              realEra,
              artist,
              tracker: slug,
              eraName,
              reason,
            };

            const list = byEra.get(eraKey) ?? [];
            list.push({ song, score, eraKey, eraWeight: eraW });
            byEra.set(eraKey, list);
          }
        }
      }
    })
  );

  // Rank each era's candidates, cap per era, then round-robin across eras
  // (highest-weight first) so the feed stays diverse instead of dumping one era.
  const groups = [...byEra.values()]
    .map((cands) => ({
      weight: cands[0]?.eraWeight ?? 0,
      items: cands.sort((a, b) => b.score - a.score).slice(0, PER_ERA_CAP),
    }))
    .sort((a, b) => b.weight - a.weight);

  const out: RecSong[] = [];
  const globalSeen = new Set<string>(); // dedup same song across trackers/eras
  let round = 0;
  let added = true;
  while (out.length < MAX_RESULTS && added) {
    added = false;
    for (const g of groups) {
      const cand = g.items[round];
      if (!cand) continue;
      added = true;
      const dedup = `${cand.song.tracker}|${norm(cand.song.name)}`;
      if (globalSeen.has(dedup)) continue;
      globalSeen.add(dedup);
      out.push(cand.song);
      if (out.length >= MAX_RESULTS) break;
    }
    round++;
  }

  return { songs: out, reason: 'ok' };
}
