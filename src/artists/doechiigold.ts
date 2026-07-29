import type { ArtistConfig } from './types';

// Doechii tracker. Data served from committed CSV snapshots under
// public/doechiigold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const doechiigoldConfig: ArtistConfig = {
  slug: 'doechiigold',
  SITE_NAME: 'DOECHIIGOLD',
  SITE_DESCRIPTION: 'The Best Doechii Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/doechiigold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'doechiigold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#a16207',
  artistLabel: 'Doechii',
  cardLetter: 'D',
  logoUrl: '',
  artistPhotoUrl: '/artists/doechiigold.jpg',

  getArtistName() {
    return 'Doechii';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Coven Music Sessions Vol.1': '??/??/????',
    'Coven Music Sessions Vol.2': '??/??/????',
    'Oh The Places You’ll Go': '??/??/????',
    'Bra-Less': '??/??/????',
    'Unfinished Love Songs': '??/??/????',
    'she / her / black bitch': '??/??/????',
    'Debut Album [V1]': '??/??/????',
    'Alligator Bites Never Heal': '??/??/????',
    'Debut Album [V2]': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Coven Music Sessions Vol.1',
    'Coven Music Sessions Vol.2',
    'Oh The Places You’ll Go',
    'Bra-Less',
    'Unfinished Love Songs',
    'she / her / black bitch',
    'Debut Album [V1]',
    'Alligator Bites Never Heal',
    'Debut Album [V2]'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
  hasGroupbuysTab: true,
};
