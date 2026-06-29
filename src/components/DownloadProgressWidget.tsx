import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Download, X, Check, AlertCircle } from 'lucide-react';
import { useDownloadManager } from '../DownloadManagerContext';

export function DownloadProgressWidget() {
  const { jobs, dismissJob } = useDownloadManager();
  const [collapsed, setCollapsed] = useState(false);

  if (!jobs.length) return null;

  const runningCount = jobs.filter(j => j.status === 'running').length;
  const overallTotal = jobs.reduce((sum, j) => sum + j.total, 0) || 1;
  const overallCompleted = jobs.reduce((sum, j) => sum + j.completed, 0);
  const overallPercent = Math.min(100, Math.round((overallCompleted / overallTotal) * 100));

  return createPortal(
    <div className="fixed bottom-24 right-4 md:right-6 z-[9000] w-[300px] max-w-[calc(100vw-2rem)] flex flex-col items-end gap-2">
      <motion.div
        layout
        className="w-full bg-[#111]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          <Download size={16} className="text-white/70 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white/90 truncate">
              {runningCount > 0 ? `Downloading ${jobs.length} item${jobs.length > 1 ? 's' : ''}...` : 'Downloads complete'}
            </div>
            <div className="h-1.5 mt-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--theme-color,#fff)] rounded-full transition-all duration-300"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-white/50 shrink-0">{overallPercent}%</span>
          {collapsed ? <ChevronUp size={14} className="text-white/50 shrink-0" /> : <ChevronDown size={14} className="text-white/50 shrink-0" />}
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 flex flex-col gap-2.5 max-h-[280px] overflow-y-auto custom-scrollbar border-t border-white/5">
                {jobs.map(job => {
                  const percent = job.total > 0 ? Math.min(100, Math.round((job.completed / job.total) * 100)) : 0;
                  return (
                    <div key={job.id} className="flex flex-col gap-1 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-white/80 truncate">{job.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {job.status === 'done' && <Check size={13} className="text-green-400" />}
                          {job.status === 'error' && <AlertCircle size={13} className="text-red-400" />}
                          <span className="text-[11px] text-white/40">{job.completed}/{job.total}</span>
                          <button onClick={() => dismissJob(job.id)} className="text-white/30 hover:text-white/70 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${job.status === 'error' ? 'bg-red-400' : 'bg-[var(--theme-color,#fff)]'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {job.status === 'running' && job.activeItems.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {job.activeItems.slice(0, 4).map((name, i) => (
                            <div key={`${name}-${i}`} className="flex items-center gap-1.5 text-[10.5px] text-white/40 truncate">
                              <span className="w-1 h-1 rounded-full bg-[var(--theme-color,#fff)] shrink-0 animate-pulse" />
                              <span className="truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {job.status === 'running' && job.recentItems.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          {job.recentItems.slice(0, 2).map((name, i) => (
                            <div key={`${name}-${i}`} className="flex items-center gap-1.5 text-[10.5px] text-white/25 truncate">
                              <Check size={9} className="shrink-0" />
                              <span className="truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
}
