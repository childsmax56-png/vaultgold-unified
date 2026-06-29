import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface DownloadJob {
  id: string;
  label: string;
  total: number;
  completed: number;
  status: 'running' | 'done' | 'error';
  activeItems: string[];
  recentItems: string[];
}

interface DownloadManagerValue {
  jobs: DownloadJob[];
  startJob: (label: string, total: number) => string;
  updateJob: (id: string, completed: number, total?: number) => void;
  startItem: (id: string, itemLabel: string) => void;
  finishItem: (id: string, itemLabel: string) => void;
  finishJob: (id: string, status?: 'done' | 'error') => void;
  dismissJob: (id: string) => void;
}

const DownloadManagerContext = createContext<DownloadManagerValue | null>(null);

const MAX_RECENT_ITEMS = 5;

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissJob = useCallback((id: string) => {
    const t = timeoutsRef.current.get(id);
    if (t) { clearTimeout(t); timeoutsRef.current.delete(id); }
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const startJob = useCallback((label: string, total: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setJobs(prev => [...prev, { id, label, total, completed: 0, status: 'running', activeItems: [], recentItems: [] }]);
    return id;
  }, []);

  const updateJob = useCallback((id: string, completed: number, total?: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, completed, ...(total !== undefined ? { total } : {}) } : j));
  }, []);

  const startItem = useCallback((id: string, itemLabel: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, activeItems: [...j.activeItems, itemLabel] } : j));
  }, []);

  const finishItem = useCallback((id: string, itemLabel: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const idx = j.activeItems.indexOf(itemLabel);
      const activeItems = idx === -1 ? j.activeItems : [...j.activeItems.slice(0, idx), ...j.activeItems.slice(idx + 1)];
      const recentItems = [itemLabel, ...j.recentItems].slice(0, MAX_RECENT_ITEMS);
      return { ...j, activeItems, recentItems };
    }));
  }, []);

  const finishJob = useCallback((id: string, status: 'done' | 'error' = 'done') => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status, completed: status === 'done' ? j.total : j.completed, activeItems: [] } : j));
    const t = setTimeout(() => dismissJob(id), 4000);
    timeoutsRef.current.set(id, t);
  }, [dismissJob]);

  return (
    <DownloadManagerContext.Provider value={{ jobs, startJob, updateJob, startItem, finishItem, finishJob, dismissJob }}>
      {children}
    </DownloadManagerContext.Provider>
  );
}

export function useDownloadManager(): DownloadManagerValue {
  const ctx = useContext(DownloadManagerContext);
  if (!ctx) throw new Error('useDownloadManager must be used within a DownloadManagerProvider');
  return ctx;
}
