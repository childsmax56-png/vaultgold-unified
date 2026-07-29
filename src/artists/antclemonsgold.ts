import type { ArtistConfig } from './types';

// Ant Clemons tracker. Data served from committed CSV snapshots under
// public/antclemonsgold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const antclemonsgoldConfig: ArtistConfig = {
  slug: 'antclemonsgold',
  SITE_NAME: 'ANTCLEMONSGOLD',
  SITE_DESCRIPTION: 'The Best Ant Clemons Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/antclemonsgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'antclemonsgold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#0ea5e9',
  artistLabel: 'Ant Clemons',
  cardLetter: 'A',
  logoUrl: '',
  artistPhotoUrl: '', // no Wikipedia photo available — falls back to letter card

  getArtistName() {
    return 'Ant Clemons';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Before HAPPY 2 BE HERE': '??/??/????',
    'HAPPY 2 BE HERE': '??/??/????',
    'LOVE.$WEAT.TEAR$': '??/??/????',
    '4Play': '??/??/????',
    'HAPPY 2 BE HERE WITH YOU': '??/??/????',
    '4Play II': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before HAPPY 2 BE HERE',
    'HAPPY 2 BE HERE',
    'LOVE.$WEAT.TEAR$',
    '4Play',
    'HAPPY 2 BE HERE WITH YOU',
    '4Play II',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasAlbumCopiesTab: true,
};
