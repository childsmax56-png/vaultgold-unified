// Direct localStorage access to the standalone (cross-artist) Tier List Maker's
// saved lists. Used by places that aren't wrapped in <TierListProvider> — e.g.
// a tracker's EraDetail wanting to push mass-selected songs into a tier list.
import { TierList, TierItem, TierRow, UNRANKED, makeId, newTierList } from './TierListContext';
import { getArtistConfig } from './artists/registry';

export const GLOBAL_TIERLIST_KEY = 'unvaulted_global_tierlists';

export function readGlobalTierLists(): TierList[] {
  try {
    const s = localStorage.getItem(GLOBAL_TIERLIST_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function writeGlobalTierLists(lists: TierList[]) {
  try {
    localStorage.setItem(GLOBAL_TIERLIST_KEY, JSON.stringify(lists));
  } catch { /* ignore quota / privacy-mode errors */ }
  // Let a mounted TierListProvider re-read if it's listening.
  window.dispatchEvent(new Event('vg-tierlists-changed'));
}

function keyOf(it: Pick<TierItem, 'kind' | 'eraName' | 'songName' | 'url'>): string {
  return `${it.kind}|${it.eraName}|${it.songName ?? ''}|${it.url ?? ''}`;
}

// Add cards to an existing list (targetId) or a new one (name). New cards land
// in the Unranked pool. Duplicates already on the list are skipped.
export function addItemsToGlobalTierList(
  targetId: string | null,
  name: string | null,
  items: Omit<TierItem, 'id'>[],
): { listId: string; added: number } {
  const lists = readGlobalTierLists();
  let list = targetId ? lists.find(l => l.id === targetId) : null;
  if (!list) {
    list = newTierList(name?.trim() || 'My Tier List');
    lists.push(list);
  }

  const existing = new Set<string>();
  for (const arr of Object.values(list.items)) for (const it of arr) existing.add(keyOf(it));

  let added = 0;
  for (const it of items) {
    const k = keyOf(it);
    if (existing.has(k)) continue;
    existing.add(k);
    list.items[UNRANKED] = [...(list.items[UNRANKED] || []), { ...it, id: makeId() }];
    added++;
  }

  writeGlobalTierLists(lists);
  return { listId: list.id, added };
}

// --- Share codes ----------------------------------------------------------
// A tier list is encoded to a self-contained base64url string that can be
// copied/pasted or dropped in a URL (`/tierlist#import=<code>`). Cover images
// are NOT embedded (they'd bloat the code); they're re-resolved on import from
// each card's artist config, so a shared list works for someone who never
// loaded that artist. Sharing "as a template" moves every card to Unranked so
// the recipient ranks it themselves.

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)));
}

// Compact per-card tuple: [kind, eraName, songName, version, url, artist, artistName]
type CardTuple = [string, string, string, string, string, string, string];
function cardToTuple(it: TierItem): CardTuple {
  return [it.kind, it.eraName, it.songName ?? '', it.version ?? '', it.url ?? '', it.artist ?? '', it.artistName ?? ''];
}

export function encodeTierListShare(list: TierList, asTemplate: boolean): string {
  const rows = list.rows.map(r => ({ i: r.id, l: r.label, c: r.color }));
  const items: Record<string, CardTuple[]> = {};
  if (asTemplate) {
    const all: CardTuple[] = [];
    for (const arr of Object.values(list.items)) for (const it of arr) all.push(cardToTuple(it));
    items[UNRANKED] = all;
  } else {
    for (const key of Object.keys(list.items)) items[key] = list.items[key].map(cardToTuple);
  }
  return b64urlEncode(JSON.stringify({ v: 1, n: list.name, r: rows, it: items }));
}

// Decode a share code into a ready-to-insert TierList (fresh ids, resolved
// covers). Returns null on any malformed input.
export function decodeTierListShare(code: string): TierList | null {
  try {
    const p = JSON.parse(b64urlDecode(code.trim()));
    if (!p || p.v !== 1 || !Array.isArray(p.r)) return null;
    const rows: TierRow[] = p.r.map((r: any) => ({ id: String(r.i), label: String(r.l ?? ''), color: String(r.c ?? '#b0b0b0') }));
    const rowIds = new Set(rows.map(r => r.id));
    const items: Record<string, TierItem[]> = { [UNRANKED]: [] };
    rows.forEach(r => { items[r.id] = []; });
    const src = p.it && typeof p.it === 'object' ? p.it : {};
    for (const key of Object.keys(src)) {
      const target = key === UNRANKED || rowIds.has(key) ? key : UNRANKED;
      if (!Array.isArray(src[key])) continue;
      for (const t of src[key] as CardTuple[]) {
        if (!Array.isArray(t)) continue;
        const [kind, eraName, songName, version, url, artist, artistName] = t;
        const image = artist ? (getArtistConfig(artist)?.CUSTOM_IMAGES?.[eraName] || '') : '';
        items[target].push({
          id: makeId(),
          kind: kind === 'era' ? 'era' : 'song',
          eraName: String(eraName ?? ''),
          songName: songName || undefined,
          version: version || undefined,
          url: url || undefined,
          image,
          artist: artist || undefined,
          artistName: artistName || undefined,
        });
      }
    }
    if (rows.length === 0) return null;
    return { id: makeId(), name: String(p.n || 'Imported Tier List'), rows, items };
  } catch {
    return null;
  }
}
