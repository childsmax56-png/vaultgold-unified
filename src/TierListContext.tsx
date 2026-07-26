import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { activeConfig } from './artists/activeConfig';

// A single card placed on a tier list. Cards can be an individual song or a
// whole era. Either way the artwork shown is the era cover (song cards overlay
// the song name + version text on top of that cover).
export interface TierItem {
  id: string;            // unique per placement
  kind: 'song' | 'era';
  eraName: string;       // era used for the cover + lookup at play time
  songName?: string;     // set for song cards
  version?: string;      // song.extra (e.g. "(V2)")
  url?: string;          // primary playable url, when known
  image?: string;        // resolved era cover, cached for export
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
}

export interface TierList {
  id: string;
  name: string;
  rows: TierRow[];
  // Cards keyed by row id, plus the reserved 'unranked' pool.
  items: Record<string, TierItem[]>;
}

export const UNRANKED = 'unranked';

const DEFAULT_ROWS: TierRow[] = [
  { id: 'S', label: 'S', color: '#ff7f7f' },
  { id: 'A', label: 'A', color: '#ffbf7f' },
  { id: 'B', label: 'B', color: '#ffdf7f' },
  { id: 'C', label: 'C', color: '#ffff7f' },
  { id: 'D', label: 'D', color: '#bfff7f' },
  { id: 'F', label: 'F', color: '#7fbfff' },
];

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newTierList(name: string): TierList {
  const rows = DEFAULT_ROWS.map(r => ({ ...r }));
  const items: Record<string, TierItem[]> = { [UNRANKED]: [] };
  rows.forEach(r => { items[r.id] = []; });
  return { id: makeId(), name, rows, items };
}

interface TierListContextValue {
  tierLists: TierList[];
  createTierList: (name: string) => string;
  renameTierList: (id: string, name: string) => void;
  deleteTierList: (id: string) => void;
  updateTierList: (id: string, updater: (tl: TierList) => TierList) => void;
}

const TierListContext = createContext<TierListContextValue | null>(null);

export function TierListProvider({ children }: { children: ReactNode }) {
  // Per-artist key: provider remounts on artist change (key={slug}).
  const storageKey = `${activeConfig.STORAGE_PREFIX}tierlists`;

  const [tierLists, setTierLists] = useState<TierList[]>(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tierLists));
    } catch {}
  }, [tierLists, storageKey]);

  const createTierList = (name: string): string => {
    const tl = newTierList(name.trim() || 'My Tier List');
    setTierLists(prev => [...prev, tl]);
    return tl.id;
  };

  const renameTierList = (id: string, name: string) => {
    setTierLists(prev => prev.map(tl => tl.id === id ? { ...tl, name } : tl));
  };

  const deleteTierList = (id: string) => {
    setTierLists(prev => prev.filter(tl => tl.id !== id));
  };

  const updateTierList = (id: string, updater: (tl: TierList) => TierList) => {
    setTierLists(prev => prev.map(tl => tl.id === id ? updater(tl) : tl));
  };

  return (
    <TierListContext.Provider value={{ tierLists, createTierList, renameTierList, deleteTierList, updateTierList }}>
      {children}
    </TierListContext.Provider>
  );
}

export function useTierLists() {
  const ctx = useContext(TierListContext);
  if (!ctx) throw new Error('useTierLists must be used within TierListProvider');
  return ctx;
}
