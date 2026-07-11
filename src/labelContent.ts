// Shared data for the UNVAULTED Records label. Consumed by both the standalone
// /label page (UnvaultedRecordsPage) and the yeditsgold view, where the albums
// are surfaced as read-only "groups" alongside community fan-edits.
import type { YEditsGroup } from './components/YEditsView';

export const LABEL_NAME = 'UNVAULTED Records';

export const ARTISTS = [
  { name: 'Alexias',        letter: 'A', accent: '#7C6FCD', description: 'Hip-Hop' },
  { name: 'ciatanner',      letter: 'C', accent: '#4EA8C9', description: 'Hip-Hop' },
  { name: 'Don Juan',       letter: 'D', accent: '#C9A224', description: 'Hip-Hop' },
  { name: 'Big Poppa Perc',        letter: 'P', accent: '#E05C5C', description: 'Hip-Hop' },
  { name: 'Lux',            letter: 'L', accent: '#F0A500', description: 'Hip-Hop' },
  { name: 'unvaulted',  letter: 'M', accent: '#5CC9A8', description: 'Hip-Hop' },
  { name: 'Nr7th',          letter: 'N', accent: '#B57BFF', description: 'Hip-Hop' },
  { name: 'Buffet West',            letter: 'B', accent: '#E8734A', description: 'Hip-Hop' },
  { name: 'MilesYe',        letter: 'M', accent: '#7C6FCD', description: 'Hip-Hop' },
  { name: 'biancagold',        letter: 'B', accent: '#7C6FCD', description: 'Hip-Hop' },
  { name: 'YZYgold',        letter: 'Y', accent: '#7C6FCD', description: 'Hip-Hop' },
];

export const ALBUMS = [
  {
    title: 'Don Juan - THE EARGRAPE COLLECTION',
    label: 'EP',
    year: '2026',
    cover: undefined,
    streamUrl: 'https://untitled.stream/library/project/NbUcMMvMIm7G4GzEpVj4j',
    tracks: [
      { n: 1,  title: 'EARGRAPE',                            artist: 'Don Juan', src: '/unvaulted-records/audio/eargrape.mp3' },
      { n: 2,  title: 'EARGRAPE (Pt. 2)',                    artist: 'Don Juan', src: '/unvaulted-records/audio/eargrape-pt2.mp3' },
      { n: 3,  title: 'EARGRAPE (Pt. 3)',                    artist: 'Don Juan', src: '/unvaulted-records/audio/eargrape-pt3.mp3' },
      { n: 4,  title: 'EARGRAPE (Pt. 4)',                    artist: 'Don Juan', src: '/unvaulted-records/audio/eargrape-pt4.mp3' },
  ],
  },

  {
    title: 'Buffet West - BULKY',
    label: 'Mixtape',
    year: '2026',
    cover: undefined,
    streamUrl: 'https://untitled.stream/library/project/Fuhtj8VCN9V9pNfMNljQJ',
    tracks: [
      { n: 1,  title: 'FEEDER MAN',                            artist: 'Buffet West', src: '/unvaulted-records/audio/feeder-man.m4a' },
      { n: 2,  title: 'BEAUTY AND THE FEAST',                  artist: 'Buffet West', src: '/unvaulted-records/audio/beauty-and-the-feast.m4a' },
      { n: 3,  title: 'FATTER (feat. Travis Scott)',           artist: 'Buffet West', src: '/unvaulted-records/audio/fatter.m4a' },
      { n: 4,  title: 'ALL THE FOOD (feat. BTS)',              artist: 'Buffet West', src: '/unvaulted-records/audio/all-the-food.m4a' },
      { n: 5,  title: 'LAST SNACK',                            artist: 'Buffet West', src: '/unvaulted-records/audio/last-snack.m4a' },
      { n: 6,  title: 'BULKY',                                 artist: 'Buffet West', src: '/unvaulted-records/audio/bulky.m4a' },
      { n: 7,  title: 'HAM (feat. MilesYe)',                   artist: 'Buffet West', src: '/unvaulted-records/audio/ham.m4a' },
      { n: 8,  title: 'WHITE CASTLE',                          artist: 'Buffet West', src: '/unvaulted-records/audio/white-castle.m4a' },
      { n: 9,  title: 'FRIES AND DOUGH',                       artist: 'Buffet West', src: '/unvaulted-records/audio/fries-and-dough.m4a' },
      { n: 10, title: 'I CAN EAT',                             artist: 'Buffet West', src: '/unvaulted-records/audio/i-can-eat.m4a' },
      { n: 11, title: 'GEMINI SEASONING',                      artist: 'Buffet West', src: '/unvaulted-records/audio/gemini-seasoning.m4a' },
    ],
  },

  {
    title: 'UNVAULTED Records - IN AN IMPERFECT WORLD',
    label: 'Mixtape',
    year: '2026',
    cover: '/unvaulted-records-debut-cover.jpg',
    streamUrl: 'https://untitled.stream/library/project/bSnHBgkbVlvZtjb1kPrs8',
    tracks: [
      { n: 1,  title: 'SISTERS AND BROTHERS',                               artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/sisters-and-brothers.m4a' },
      { n: 2,  title: 'KING OF SOUL (feat. FROMDABUNKA)',                   artist: 'ciatanner',                 src: '/unvaulted-records/audio/king-of-soul.m4a' },
      { n: 3,  title: 'COSBY (feat. FROMDABUNKA & Sheffmade)',              artist: 'ciatanner',                 src: '/unvaulted-records/audio/cosby.mp3' },
      { n: 4,  title: 'ALIVE (feat. Youngboy Never Broke Again, Playboi Carti & DJ Swamp Izzo)', artist: 'Big Poppa Perc, ciatanner',      src: '/unvaulted-records/audio/alive.mp3' },
      { n: 5,  title: 'MAGAZINES',                                          artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/magazines.m4a' },
      { n: 6,  title: 'COUSINS',                                            artist: 'Alexais',            src: '/unvaulted-records/audio/cousins.mp3' },
      { n: 7,  title: 'VIRGIL',                                             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/virgil.m4a' },
      { n: 8,  title: 'JESUS',                                              artist: 'Alexais',            src: '/unvaulted-records/audio/jesus.mp3' },
      { n: 9,  title: 'SUNDAY',                                             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/sunday.m4a' },
      { n: 10, title: 'MISSION CONTROL',             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/mission-control.m4a' },
      { n: 11, title: 'INTERLUDE',                             artist: 'biancagoldd', src: '/unvaulted-records/audio/interlude.mp3' },
      { n: 12, title: 'BIANCA',                                             artist: 'Big Poppa Perc',            src: '/unvaulted-records/audio/bianca.mp3' },
      { n: 13, title: 'WISH',                                               artist: 'Don Juan',           src: '/unvaulted-records/audio/wish.mp3' },
      { n: 14, title: 'ALL THE LOVE',                                       artist: 'unvaulted, YZYgold',  src: '/unvaulted-records/audio/all-the-love.mp3' },
    ],
  },
];

export const SINGLES = [
  {
    title: 'SEE ME AGAIN (feat. Buffet West, Dave Blunts, Brandon & Bon Iver)',
    artist: 'MilesYe',
    year: '2026',
    src: '/unvaulted-records/audio/see-me-again.m4a',
    cover: undefined,
  },
];

// Ensure a public-asset path is absolute so it resolves the same regardless of
// which route the yeditsgold view is mounted under.
const abs = (p: string): string =>
  /^https?:\/\//.test(p) || p.startsWith('/') ? p : `/${p}`;

// The label's curated albums + singles, shaped as read-only yeditsgold groups.
export const LABEL_GROUPS: YEditsGroup[] = [
  ...ALBUMS.map(album => ({
    folderPath: `__label__/${LABEL_NAME}/${album.title}`,
    displayName: album.title,
    parentName: LABEL_NAME,
    imageUrl: album.cover ? abs(album.cover) : undefined,
    readOnly: true,
    untitledUrl: album.streamUrl,
    songs: album.tracks.map(t => ({
      name: t.title,
      url: t.src ? abs(t.src) : undefined,
      extra: t.artist,
    })),
  })),
  {
    folderPath: `__label__/${LABEL_NAME}/Singles`,
    displayName: 'Singles',
    parentName: LABEL_NAME,
    imageUrl: SINGLES[0]?.cover ? abs(SINGLES[0].cover) : undefined,
    readOnly: true,
    songs: SINGLES.map(s => ({
      name: s.title,
      url: abs(s.src),
      extra: s.artist,
      image: s.cover ? abs(s.cover) : undefined,
    })),
  },
];
