import type { ArtistConfig } from './types';

// Freddie Gibbs tracker. Data served from committed CSV snapshots under
// public/gibbsgold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const gibbsgoldConfig: ArtistConfig = {
  slug: 'gibbsgold',
  SITE_NAME: 'GIBBSGOLD',
  SITE_DESCRIPTION: 'The Best Freddie Gibbs Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/gibbsgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'gibbsgold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#7c2d12',
  artistLabel: 'Freddie Gibbs',
  cardLetter: 'F',
  logoUrl: '',
  artistPhotoUrl: '/artists/gibbsgold.jpg',

  getArtistName() {
    return 'Freddie Gibbs';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Pre-BFK': '??/??/????',
    'Baby Face Killa': '??/??/????',
    'ESGN': '??/??/????',
    'Piñata': '??/??/????',
    'Shadow of a Doubt': '??/??/????',
    'You Only Live 2wice': '??/??/????',
    'Freddie': '??/??/????',
    'Bandana': '??/??/????',
    'Montana': '??/??/????',
    'Alfredo': '??/??/????',
    '$oul $old $eparately': '??/??/????',
    '[Unknown title]': '??/??/????',
    'Ye x Gibbs': '??/??/????',
    'You Only Die 1nce': '??/??/????',
    'Alfredo 2': '??/??/????',
    'TBA': '??/??/????',
    'Hypnotized Rabbit': '??/??/????',
    'Unknown Era': '??/??/????',
    'Unknown': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Pre-BFK',
    'Baby Face Killa',
    'ESGN',
    'Piñata',
    'Shadow of a Doubt',
    'You Only Live 2wice',
    'Freddie',
    'Bandana',
    'Montana',
    'Alfredo',
    '$oul $old $eparately',
    '[Unknown title]',
    'Ye x Gibbs',
    'You Only Die 1nce',
    'Alfredo 2',
    'TBA',
    'Hypnotized Rabbit',
    'Unknown Era',
    'Unknown'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
