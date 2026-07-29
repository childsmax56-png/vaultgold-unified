import type { ArtistConfig } from './types';

// Daft Punk tracker. Data served from committed CSV snapshots under
// public/daftpunkgold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const daftpunkgoldConfig: ArtistConfig = {
  slug: 'daftpunkgold',
  SITE_NAME: 'DAFTPUNKGOLD',
  SITE_DESCRIPTION: 'The Best Daft Punk Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/daftpunkgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'daftpunkgold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#f97316',
  artistLabel: 'Daft Punk',
  cardLetter: 'D',
  logoUrl: '',
  artistPhotoUrl: '/artists/daftpunkgold.jpg',

  getArtistName() {
    return 'Daft Punk';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'SOMA': '??/??/????',
    'Homework': '??/??/????',
    'Discovery': '??/??/????',
    'HAA': '??/??/????',
    'TRON': '??/??/????',
    'RAM': '??/??/????',
    'Epilogue': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'SOMA',
    'Homework',
    'Discovery',
    'HAA',
    'TRON',
    'RAM',
    'Epilogue'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
