// Shared data layer for the snippet games (endless "Leakle" + the daily
// "Vault Heardle"). Pulls a tracker's playable songs from the same /api/{slug}/a
// catalog the rest of the site uses, and provides the deterministic per-day
// puzzle picker (so every user gets the same song for an artist on a given day
// with no backend — same trick the original Wordle used).

import { getArtistConfig } from './artists/registry';

export interface GameSong {
  title: string;
  era: string;
  url: string;
  image?: string;
  version?: string;   // trailing [tag] on the title, e.g. "V7", "CDQ", "OG File"
  fileDate?: string;  // recording / origin date (may be absent)
  leakDate?: string;
  credits?: string;   // "(prod. …)" / "(feat. …)" line — who worked on it
  notes?: string;     // freeform description, fallback for the credits hint
}

// Normalized title key: strips (…)/[…] tags and punctuation so versions/quality
// tags collapse together for de-duping and answer-matching.
export const norm = (s: string) =>
  s.toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '').trim();

// Mirror of audioStore.isDirectlyPlayableAudio (module-private there). A song is
// game-eligible only if we can actually stream it in the browser.
export function isPlayable(rawUrl: string): boolean {
  // Reject archives up front — a pack/stems .zip behind a link the audio element
  // can't decode. (Opaque pillowcase links to zips can't be caught here; those
  // are handled at play time by skipping on the audio error event.)
  if (/\.(zip|rar|7z|tar|gz)(\?|$)/i.test(rawUrl)) return false;
  return (
    rawUrl.includes('pillows.su/f/') ||
    rawUrl.includes('pillowcase.su/f/') ||
    rawUrl.includes('imgur.gg/f/') ||
    rawUrl.includes('drive.google.com') ||
    rawUrl.includes('i.imgur.com') ||
    rawUrl.includes('krakenfiles.com/view/') ||
    rawUrl.includes('pixeldrain.com/u/') ||
    rawUrl.startsWith('/') ||
    /\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(rawUrl)
  );
}

// Fisher–Yates
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Trailing bracket tag on a title, used as the "version" hint. "Ok [V7]" → "V7".
function parseVersionTag(title: string): string | undefined {
  const m = title.match(/\[([^\]]+)\]\s*$/);
  return m ? m[1].trim() : undefined;
}

// The "extra" line mixes real credits with the song's alternate titles, e.g.
// "(prod. Wax Motif) (BACK 2 ME, Cheesecake)". Keep only the credit groups
// (prod./feat./with/…) and drop the alt-name groups — those give the answer away.
const CREDIT_RE = /\b(prod|produced|production|feat|ft|featuring|with|co-?prod|remix|remixed|mix|mixed|master|mastered|engineer|vocals?|sample[ds]?)\b/i;
function extractCredits(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\(([^)]*)\)/g, (m, inner) => (CREDIT_RE.test(inner) ? m : '')) // drop non-credit parens
    .replace(/\s+/g, ' ')
    .trim();
  // Require an actual credit keyword so bare alt-name text isn't shown.
  return cleaned && CREDIT_RE.test(cleaned) ? cleaned : undefined;
}

interface Catalog {
  eras?: Record<string, { image?: string; data?: Record<string, any[]> }>;
}

export async function buildPool(slug: string): Promise<GameSong[]> {
  const res = await fetch(`/api/${slug}/a`);
  if (!res.ok) throw new Error('catalog');
  const data = (await res.json()) as Catalog;
  const cfg = getArtistConfig(slug);
  const pool: GameSong[] = [];
  const seen = new Set<string>();
  for (const [eraName, era] of Object.entries(data.eras ?? {})) {
    const cover = cfg?.CUSTOM_IMAGES?.[eraName] || era.image;
    for (const songs of Object.values(era.data ?? {})) {
      for (const song of songs as any[]) {
        const title: string = (song.name ?? '').trim();
        if (!title) continue;
        const raw: string = song.url || (song.urls && song.urls[0]) || '';
        if (!raw || !isPlayable(raw)) continue;
        const key = norm(title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        pool.push({
          title,
          era: eraName,
          url: raw,
          image: song.image || cover,
          version: parseVersionTag(title),
          fileDate: (song.file_date ?? '').trim() || undefined,
          leakDate: (song.leak_date ?? '').trim() || undefined,
          credits: extractCredits(song.extra),
          notes: (song.description ?? '').trim() || undefined,
        });
      }
    }
  }
  return pool;
}

// ---- deterministic daily puzzle -------------------------------------------

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Local calendar date key, e.g. "2026-08-17" (per-timezone, like Wordle).
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return todayStr(dt);
}

// Deterministic play order for everyone, for a given artist on a given day.
// The daily target is the first entry; if it won't load (a zip, a dead/blocked
// file), the game walks down this list — since a broken source fails for every
// user, everyone converges on the same first playable song.
export function dailySequence(pool: GameSong[], slug: string, dateStr: string): GameSong[] {
  const seq = [...pool].sort((a, b) => (norm(a.title) < norm(b.title) ? -1 : norm(a.title) > norm(b.title) ? 1 : 0));
  const rng = mulberry32(hashStr(`${dateStr}|${slug}`));
  for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
  return seq;
}

// Deterministic snippet start (0..1) for a given song on a given day.
export function startFractionFor(slug: string, dateStr: string, title: string): number {
  return mulberry32(hashStr(`${dateStr}|${slug}|${title}|start`))();
}
