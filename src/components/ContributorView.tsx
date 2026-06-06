import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Era, Song, SearchFilters } from '../types';
import { parseContributors, formatTextWithTags, isSongNotAvailable, CUSTOM_IMAGES, getArtistName } from '../utils';
import { activeConfig } from '../artists/activeConfig';

interface ContributorSong {
  song: Song;
  era: Era;
}

interface ContributorViewProps {
  contributorName: string;
  eras: Era[];
  onBack: () => void;
  onPlaySong: (song: Song, era: Era, contextTracks?: Song[]) => void;
  currentSong?: Song | null;
  isPlaying?: boolean;
}

function songsForContributor(name: string, eras: Era[]): ContributorSong[] {
  const lower = name.toLowerCase();
  const results: ContributorSong[] = [];
  const mainArtist = activeConfig.getArtistName(undefined).toLowerCase();

  for (const era of eras) {
    for (const songs of Object.values(era.data || {})) {
      for (const song of songs as Song[]) {
        // Contributors live in song.extra (second+ lines of the CSV name cell)
        const contributors = parseContributors(song.extra || '');
        const isContributor = contributors.some(c => c.toLowerCase() === lower);

        // Also check if name is the primary artist in "Name - Title" format
        const dashIdx = song.name.indexOf(' - ');
        const primaryArtist = dashIdx !== -1 ? song.name.slice(0, dashIdx).toLowerCase() : null;
        const isPrimary = primaryArtist === lower || (primaryArtist && primaryArtist.includes(lower));

        // If this is the main tracker artist, include all songs from their eras
        const isMainArtist = lower === mainArtist;

        if (isContributor || (isPrimary && lower !== mainArtist)) {
          results.push({ song, era });
        }
      }
    }
  }

  return results;
}

export function ContributorView({ contributorName, eras, onBack, onPlaySong, currentSong, isPlaying }: ContributorViewProps) {
  const matches = useMemo(() => songsForContributor(contributorName, eras), [contributorName, eras]);

  const playableSongs = useMemo(
    () => matches.map(m => m.song).filter(s => {
      const url = s.url || (s.urls?.[0] ?? '');
      return url && !isSongNotAvailable(s, url);
    }),
    [matches]
  );

  // Group by era for display
  const byEra = useMemo(() => {
    const map = new Map<string, ContributorSong[]>();
    for (const item of matches) {
      const key = item.era.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()];
  }, [matches]);

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute inset-0 z-10 bg-[#0a0a0a] overflow-y-auto pb-64"
    >
      <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{contributorName}</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {matches.length} song{matches.length !== 1 ? 's' : ''} on this tracker
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="p-8 text-white/30 text-sm">No songs found for this contributor.</div>
      ) : (
        <div className="p-4 md:p-6 space-y-8">
          {byEra.map(([eraName, items]) => {
            const era = items[0].era;
            const coverImage = CUSTOM_IMAGES[eraName] || era.image;
            return (
              <div key={eraName}>
                <div className="flex items-center gap-3 mb-3">
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt={eraName}
                      className="w-10 h-10 rounded object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">{eraName}</h2>
                </div>
                <div className="space-y-0.5">
                  {items.map(({ song }, idx) => {
                    const rawUrl = song.url || (song.urls?.[0] ?? '');
                    const isNotAvailable = isSongNotAvailable(song, rawUrl);
                    const isPlayable = !!rawUrl && !isNotAvailable && (
                      rawUrl.includes('pillows.su/f/') || rawUrl.includes('temp.imgur.gg/f/')
                    );
                    const isCurrentlyPlaying =
                      currentSong?.name === song.name && currentSong?.description === song.description;
                    const accentColor = 'var(--theme-color)';

                    return (
                      <div
                        key={idx}
                        onClick={() => isPlayable && onPlaySong(song, era, playableSongs.filter(s => items.map(i => i.song).includes(s)))}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isPlayable ? 'cursor-pointer hover:bg-white/5' : 'cursor-default opacity-50'
                        } ${isCurrentlyPlaying ? 'bg-white/5' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium break-words whitespace-normal leading-snug ${
                              isCurrentlyPlaying ? 'text-[var(--theme-color)]' : 'text-white'
                            }`}
                          >
                            {formatTextWithTags(song.name)}
                          </div>
                          {song.extra && (
                            <div className="text-xs text-white/40 mt-0.5">{formatTextWithTags(song.extra)}</div>
                          )}
                        </div>
                        {song.track_length && (
                          <span className="text-xs text-white/30 shrink-0">{song.track_length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
