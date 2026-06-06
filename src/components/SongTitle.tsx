import React from 'react';
import { formatTextWithTags, splitSongNameWithContributors } from '../utils';
import { useContributor } from '../ContributorContext';

interface SongTitleProps {
  name: string;
  className?: string;
}

export function SongTitle({ name, className }: SongTitleProps) {
  const { navigateToContributor } = useContributor();
  const segments = splitSongNameWithContributors(name);

  if (segments.length === 1 && !segments[0].contributor) {
    return <span className={className}>{formatTextWithTags(name)}</span>;
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
            className="underline decoration-white/30 hover:decoration-white/70 hover:text-white transition-colors cursor-pointer"
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
