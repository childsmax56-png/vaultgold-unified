import type { ArtistConfig } from './types';

// James Blake tracker. Data served from committed CSV snapshots under
// public/jamesblakegold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const jamesblakegoldConfig: ArtistConfig = {
  slug: 'jamesblakegold',
  SITE_NAME: 'JAMESBLAKEGOLD',
  SITE_DESCRIPTION: 'The Best James Blake Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/jamesblakegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'jamesblakegold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#475569',
  artistLabel: 'James Blake',
  cardLetter: 'J',
  logoUrl: '',
  artistPhotoUrl: '/artists/jamesblakegold.jpg',

  getArtistName() {
    return 'James Blake';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Before James Blake': '??/??/????',
    'James Blake': '??/??/????',
    'Overgrown': '??/??/????',
    'The Colour In Anything': '??/??/????',
    'Assume Form': '??/??/????',
    'Friends That Break Your Heart': '??/??/????',
    'Playing Robots Into Heaven [V1]': '??/??/????',
    'WAR': '??/??/????',
    'Playing Robots Into Heaven [V2]': '??/??/????',
    'Bad Cameo': '??/??/????',
    'Trying Times': '??/??/????',
    'Unknown': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before James Blake',
    'James Blake',
    'Overgrown',
    'The Colour In Anything',
    'Assume Form',
    'Friends That Break Your Heart',
    'Playing Robots Into Heaven [V1]',
    'WAR',
    'Playing Robots Into Heaven [V2]',
    'Bad Cameo',
    'Trying Times',
    'Unknown'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
};
