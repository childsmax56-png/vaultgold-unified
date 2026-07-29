import type { ArtistConfig } from './types';

// SZA tracker. Data served from committed CSV snapshots under
// public/szagold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const szagoldConfig: ArtistConfig = {
  slug: 'szagold',
  SITE_NAME: 'SZAGOLD',
  SITE_DESCRIPTION: 'The Best SZA Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/szagold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'szagold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#7c3aed',
  artistLabel: 'SZA',
  cardLetter: 'S',
  logoUrl: '',
  artistPhotoUrl: '/artists/szagold.jpg',

  getArtistName() {
    return 'SZA';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'See.SZA.Run': '??/??/????',
    'S': '??/??/????',
    'Z': '??/??/????',
    'A [V1]': '??/??/????',
    'Ctrl [V2]': '??/??/????',
    'SOS': '??/??/????',
    'LANA [V1]': '??/??/????',
    'LANA [V2]': '??/??/????',
    'LP3 / LP4': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'See.SZA.Run',
    'S',
    'Z',
    'A [V1]',
    'Ctrl [V2]',
    'SOS',
    'LANA [V1]',
    'LANA [V2]',
    'LP3 / LP4'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
