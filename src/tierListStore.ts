// Direct localStorage access to the standalone (cross-artist) Tier List Maker's
// saved lists. Used by places that aren't wrapped in <TierListProvider> — e.g.
// a tracker's EraDetail wanting to push mass-selected songs into a tier list.
import { TierList, TierItem, UNRANKED, makeId, newTierList } from './TierListContext';

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
