import type { ArtistConfig } from './types';

// Childish Gambino tracker. Data served from committed CSV snapshots under
// public/gambinogold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const gambinogoldConfig: ArtistConfig = {
  slug: 'gambinogold',
  SITE_NAME: 'GAMBINOGOLD',
  SITE_DESCRIPTION: 'The Best Childish Gambino Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/gambinogold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'gambinogold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#dc2626',
  artistLabel: 'Childish Gambino',
  cardLetter: 'C',
  logoUrl: '',
  artistPhotoUrl: '/artists/gambinogold.jpg',

  getArtistName() {
    return 'Childish Gambino';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'The Younger I Get': '??/??/????',
    'Poindexter': '??/??/????',
    'I AM JUST A RAPPER': '??/??/????',
    'Culdesac': '??/??/????',
    'EP': '??/??/????',
    'ROYALTY': '??/??/????',
    'Because The Internet': '??/??/????',
    'STN MTN / Kauai': '??/??/????',
    '"Awaken, My Love!"': '??/??/????',
    'Untitled*': '??/??/????',
    'Atavista [V1]': '??/??/????',
    '3.15.20': '??/??/????',
    'Atavista [V2]': '??/??/????',
    'Bando Stone and The New World': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'The Younger I Get',
    'Poindexter',
    'I AM JUST A RAPPER',
    'Culdesac',
    'EP',
    'ROYALTY',
    'Because The Internet',
    'STN MTN / Kauai',
    '"Awaken, My Love!"',
    'Untitled*',
    'Atavista [V1]',
    '3.15.20',
    'Atavista [V2]',
    'Bando Stone and The New World'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasAlbumCopiesTab: true,
  hasGroupbuysTab: true,
};
