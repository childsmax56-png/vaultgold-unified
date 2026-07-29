import type { ArtistConfig } from './types';

// Chris Brown tracker. Data served from committed CSV snapshots under
// public/chrisbrowngold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const chrisbrowngoldConfig: ArtistConfig = {
  slug: 'chrisbrowngold',
  SITE_NAME: 'CHRISBROWNGOLD',
  SITE_DESCRIPTION: 'The Best Chris Brown Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/chrisbrowngold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'chrisbrowngold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#2563eb',
  artistLabel: 'Chris Brown',
  cardLetter: 'C',
  logoUrl: '',
  artistPhotoUrl: '/artists/chrisbrowngold.jpg',

  getArtistName() {
    return 'Chris Brown';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Chris Brown': '??/??/????',
    'Exclusive': '??/??/????',
    'Graffiti': '??/??/????',
    'F.A.M.E.': '??/??/????',
    'Fortune': '??/??/????',
    'X': '??/??/????',
    'Fan of a Fan: The Album': '??/??/????',
    'Fan of a Fan the Album': '??/??/????',
    'Royalty': '??/??/????',
    'Heartbreak On A Full Moon': '??/??/????',
    'Indigo': '??/??/????',
    'Breezy': '??/??/????',
    '11 : 11': '??/??/????',
    'BROWN': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Chris Brown',
    'Exclusive',
    'Graffiti',
    'F.A.M.E.',
    'Fortune',
    'X',
    'Fan of a Fan: The Album',
    'Fan of a Fan the Album',
    'Royalty',
    'Heartbreak On A Full Moon',
    'Indigo',
    'Breezy',
    '11 : 11',
    'BROWN'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
