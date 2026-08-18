import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useCommentCount } from '../comments';
import { CommentsModal } from './CommentsModal';

// A reusable "comment on this entry" affordance. Drop it into any row/card in
// any view — song, stem, art, video, fake, misc, released. It shows a speech
// bubble with a live comment count and opens the shared thread modal.
interface Props {
  tracker: string;
  entryKey: string;
  entryLabel: string;
  entryType?: string;
  isCurrentlyPlaying?: boolean;
  className?: string;
}

export function CommentButton({ tracker, entryKey, entryLabel, entryType, isCurrentlyPlaying, className }: Props) {
  const [open, setOpen] = useState(false);
  const count = useCommentCount(tracker, entryKey);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Comments"
        className={`relative p-1 rounded transition-all hover:bg-white/10 cursor-pointer flex items-center gap-1 ${
          count ? 'text-white/70 hover:text-white' : isCurrentlyPlaying ? 'text-[var(--theme-color)]/60 hover:text-[var(--theme-color)]' : 'text-white/20 hover:text-white/70'
        } ${className || ''}`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {!!count && count > 0 && (
          <span className="text-[10px] font-semibold leading-none">{count > 99 ? '99+' : count}</span>
        )}
      </button>
      <CommentsModal
        isOpen={open}
        onClose={() => setOpen(false)}
        tracker={tracker}
        entryKey={entryKey}
        entryLabel={entryLabel}
        entryType={entryType}
      />
    </>
  );
}
