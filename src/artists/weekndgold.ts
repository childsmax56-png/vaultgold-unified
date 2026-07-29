import type { ArtistConfig } from './types';

// The Weeknd tracker. Data served from committed CSV snapshots under
// public/weekndgold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const weekndgoldConfig: ArtistConfig = {
  slug: 'weekndgold',
  SITE_NAME: 'WEEKNDGOLD',
  SITE_DESCRIPTION: 'The Best The Weeknd Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/weekndgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'weekndgold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#b91c1c',
  artistLabel: 'The Weeknd',
  cardLetter: 'W',
  logoUrl: '',
  artistPhotoUrl: '/artists/weekndgold.jpg',

  getArtistName() {
    return 'The Weeknd';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Bulleez N\' Nerdz': '??/??/????',
    'The Noise': '??/??/????',
    'House Of Balloons': '??/??/????',
    'Thursday': '??/??/????',
    'Echoes Of Silence': '??/??/????',
    'Kiss Land': '??/??/????',
    'Untitled': '??/??/????',
    'Pre-BBTM': '??/??/????',
    'Beauty Behind The Madness': '??/??/????',
    'BBTM': '??/??/????',
    'Pre-Starboy': '??/??/????',
    'Starboy': '??/??/????',
    'Post-Starboy': '??/??/????',
    'My Dear Melancholy,': '??/??/????',
    'After Hours [V1]': '??/??/????',
    'After Hours [V2]': '??/??/????',
    'Dawn FM': '??/??/????',
    'The Idol': '??/??/????',
    'Hurry Up Tomorrow': '??/??/????',
    'Hurry Up Tomorrow (Score)': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Bulleez N\' Nerdz',
    'The Noise',
    'House Of Balloons',
    'Thursday',
    'Echoes Of Silence',
    'Kiss Land',
    'Untitled',
    'Pre-BBTM',
    'Beauty Behind The Madness',
    'BBTM',
    'Pre-Starboy',
    'Starboy',
    'Post-Starboy',
    'My Dear Melancholy,',
    'After Hours [V1]',
    'After Hours [V2]',
    'Dawn FM',
    'The Idol',
    'Hurry Up Tomorrow',
    'Hurry Up Tomorrow (Score)',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
