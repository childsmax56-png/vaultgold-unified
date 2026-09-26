import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Bump this id whenever the notice text changes so previously-dismissed
// users see the new one instead of it staying hidden forever.
const NOTICE_ID = 'pillowcase-outage-2026-09';

export function SiteNotice() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('vg-dismissed-notice') === NOTICE_ID;
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('vg-dismissed-notice', NOTICE_ID);
    } catch {}
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-start gap-3 bg-amber-950/95 backdrop-blur-sm border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-sm shadow-lg"
      style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top))' }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
      <p className="flex-1 leading-snug">
        <span className="font-semibold">Service notice:</span> pillowcase.su, the file-hosting service most trackers rely on, is currently experiencing an outage. As a result, many songs may return an "audio unreachable" error. We appreciate your patience while the Pillowcase developers work to resolve the issue.
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 rounded-full hover:bg-amber-500/20 transition-colors text-amber-300 hover:text-amber-100"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
