import type { ArtistConfig } from './types';

// Steve Lacy tracker. Data served from committed CSV snapshots under
// public/stevelacygold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const stevelacygoldConfig: ArtistConfig = {
  slug: 'stevelacygold',
  SITE_NAME: 'STEVELACYGOLD',
  SITE_DESCRIPTION: 'The Best Steve Lacy Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/stevelacygold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'stevelacygold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#059669',
  artistLabel: 'Steve Lacy',
  cardLetter: 'S',
  logoUrl: '',
  artistPhotoUrl: '/artists/stevelacygold.jpg',

  getArtistName() {
    return 'Steve Lacy';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Ego Death': '??/??/????',
    'Steve Lacy\'s Demo': '??/??/????',
    'Apollo XXI': '??/??/????',
    'The Lo-Fis': '??/??/????',
    'Gemini Rights': '??/??/????',
    'Oh yeah?': '??/??/????',
    'Unknown': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Ego Death',
    'Steve Lacy\'s Demo',
    'Apollo XXI',
    'The Lo-Fis',
    'Gemini Rights',
    'Oh yeah?',
    'Unknown'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
