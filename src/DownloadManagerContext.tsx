import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface DownloadJob {
  id: string;
  label: string;
  total: number;
  completed: number;
  status: 'running' | 'done' | 'error';
}

interface DownloadManagerValue {
  jobs: DownloadJob[];
  startJob: (label: string, total: number) => string;
  updateJob: (id: string, completed: number, total?: number) => void;
  finishJob: (id: string, status?: 'done' | 'error') => void;
  dismissJob: (id: string) => void;
}

const DownloadManagerContext = createContext<DownloadManagerValue | null>(null);

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
    setJobs(prev => [...prev, { id, label, total, completed: 0, status: 'running' }]);
    return id;
  }, []);

  const updateJob = useCallback((id: string, completed: number, total?: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, completed, ...(total !== undefined ? { total } : {}) } : j));
  }, []);

  const finishJob = useCallback((id: string, status: 'done' | 'error' = 'done') => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status, completed: status === 'done' ? j.total : j.completed } : j));
    const t = setTimeout(() => dismissJob(id), 4000);
    timeoutsRef.current.set(id, t);
  }, [dismissJob]);

  return (
    <DownloadManagerContext.Provider value={{ jobs, startJob, updateJob, finishJob, dismissJob }}>
      {children}
    </DownloadManagerContext.Provider>
  );
}

export function useDownloadManager(): DownloadManagerValue {
  const ctx = useContext(DownloadManagerContext);
  if (!ctx) throw new Error('useDownloadManager must be used within a DownloadManagerProvider');
  return ctx;
}
