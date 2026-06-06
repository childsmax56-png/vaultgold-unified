import React from 'react';
import { formatTextWithTags, splitTextWithContributors } from '../utils';
import { useContributor } from '../ContributorContext';

interface SongTitleProps {
  name: string;
  className?: string;
}

function ContributorSegments({ text, className }: { text: string; className?: string }) {
  const { navigateToContributor } = useContributor();
  const segments = splitTextWithContributors(text);

  if (segments.length === 1 && !segments[0].contributor) {
    return <span className={className}>{formatTextWithTags(text)}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.contributor ? (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              navigateToContributor(seg.contributor!);
            }}
            className="underline decoration-white/30 hover:decoration-white/70 hover:text-white/80 transition-colors cursor-pointer"
          >
            {seg.text}
          </button>
        ) : (
          <React.Fragment key={i}>{formatTextWithTags(seg.text)}</React.Fragment>
        )
      )}
    </span>
  );
}

// Used for the song name (first line — usually just the title, no contributors)
export function SongTitle({ name, className }: SongTitleProps) {
  return <ContributorSegments text={name} className={className} />;
}

// Used for song.extra (second line — contains feat./prod./perf. info)
export function SongExtra({ extra, className }: { extra: string; className?: string }) {
  return <ContributorSegments text={extra} className={className} />;
}
