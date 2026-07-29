import type { ArtistConfig } from './types';

// Westside Gunn tracker. Data served from committed CSV snapshots under
// public/westsidegold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const westsidegoldConfig: ArtistConfig = {
  slug: 'westsidegold',
  SITE_NAME: 'WESTSIDEGOLD',
  SITE_DESCRIPTION: 'The Best Westside Gunn Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/westsidegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'westsidegold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#525252',
  artistLabel: 'Westside Gunn',
  cardLetter: 'W',
  logoUrl: '',
  artistPhotoUrl: '/artists/westsidegold.jpg',

  getArtistName() {
    return 'Westside Gunn';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'There’s God and There’s FLYGOD, Praise Both': '??/??/????',
    'WestSide DOOM': '??/??/????',
    'Hitler Wears Hermes 5': '??/??/????',
    'Pray For Paris': '??/??/????',
    'WHO MADE THE SUNSHINE': '??/??/????',
    'Hitler Wears Hermes 8: Sincerely Adolf': '??/??/????',
    'Peace "Fly" God': '??/??/????',
    '10': '??/??/????',
    'FLYGOD is an Awesome God III': '??/??/????',
    'And Then You Pray For Me': '??/??/????',
    '11': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'There’s God and There’s FLYGOD, Praise Both',
    'WestSide DOOM',
    'Hitler Wears Hermes 5',
    'Pray For Paris',
    'WHO MADE THE SUNSHINE',
    'Hitler Wears Hermes 8: Sincerely Adolf',
    'Peace "Fly" God',
    '10',
    'FLYGOD is an Awesome God III',
    'And Then You Pray For Me',
    '11'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
