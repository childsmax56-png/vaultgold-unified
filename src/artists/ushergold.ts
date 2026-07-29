import type { ArtistConfig } from './types';

// Usher tracker. Data served from committed CSV snapshots under
// public/ushergold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const ushergoldConfig: ArtistConfig = {
  slug: 'ushergold',
  SITE_NAME: 'USHERGOLD',
  SITE_DESCRIPTION: 'The Best Usher Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/ushergold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'ushergold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#1d4ed8',
  artistLabel: 'Usher',
  cardLetter: 'U',
  logoUrl: '',
  artistPhotoUrl: '/artists/ushergold.jpg',

  getArtistName() {
    return 'Usher';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'usher': '??/??/????',
    'Usher': '??/??/????',
    'My Way': '??/??/????',
    '8701 [V1] (ALL ABOUT U)': '??/??/????',
    '8701 [V1]': '??/??/????',
    '8701': '??/??/????',
    'CONFESSIONS': '??/??/????',
    'Confessions': '??/??/????',
    'HERE I STAND': '??/??/????',
    'Here I Stand': '??/??/????',
    'RAYMOND V RAYMOND': '??/??/????',
    'Raymond v Raymond': '??/??/????',
    'Looking 4 Myself': '??/??/????',
    'UR': '??/??/????',
    'HARD II LOVE': '??/??/????',
    'Hard II Love': '??/??/????',
    '"A"': '??/??/????',
    'CONFESSIONS 2': '??/??/????',
    'Confessions 2': '??/??/????',
    'COMING HOME': '??/??/????',
    'Ongoing': '??/??/????',
    'Unknown': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'usher',
    'Usher',
    'My Way',
    '8701 [V1] (ALL ABOUT U)',
    '8701 [V1]',
    '8701',
    'CONFESSIONS',
    'Confessions',
    'HERE I STAND',
    'Here I Stand',
    'RAYMOND V RAYMOND',
    'Raymond v Raymond',
    'Looking 4 Myself',
    'UR',
    'HARD II LOVE',
    'Hard II Love',
    '"A"',
    'CONFESSIONS 2',
    'Confessions 2',
    'COMING HOME',
    'Ongoing',
    'Unknown'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
