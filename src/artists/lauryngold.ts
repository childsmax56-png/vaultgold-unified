import type { ArtistConfig } from './types';

// Ms. Lauryn Hill tracker. Data served from committed CSV snapshots under
// public/lauryngold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const lauryngoldConfig: ArtistConfig = {
  slug: 'lauryngold',
  SITE_NAME: 'LAURYNGOLD',
  SITE_DESCRIPTION: 'The Best Ms. Lauryn Hill Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/lauryngold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'lauryngold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#ca8a04',
  artistLabel: 'Lauryn Hill',
  cardLetter: 'L',
  logoUrl: '',
  artistPhotoUrl: '/artists/lauryngold.jpg',

  getArtistName() {
    return 'Ms. Lauryn Hill';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Before Blunted On Reality': '??/??/????',
    'Blunted On Reality': '??/??/????',
    'The Score': '??/??/????',
    'The Miseducation of Lauryn Hill': '??/??/????',
    'The Intangibles': '??/??/????',
    'The Contract': '??/??/????',
    'Letters From Exile': '??/??/????',
    'Past, Present, Future': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before Blunted On Reality',
    'Blunted On Reality',
    'The Score',
    'The Miseducation of Lauryn Hill',
    'The Intangibles',
    'The Contract',
    'Letters From Exile',
    'Past, Present, Future',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
