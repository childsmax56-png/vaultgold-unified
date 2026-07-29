import type { ArtistConfig } from './types';

// Wu-Tang Clan tracker. Data served from committed CSV snapshots under
// public/wutanggold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const wutanggoldConfig: ArtistConfig = {
  slug: 'wutanggold',
  SITE_NAME: 'WUTANGGOLD',
  SITE_DESCRIPTION: 'The Best Wu-Tang Clan Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/wutanggold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'wutanggold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#facc15',
  artistLabel: 'Wu-Tang Clan',
  cardLetter: 'W',
  logoUrl: '',
  artistPhotoUrl: '/artists/wutanggold.jpg',

  getArtistName() {
    return 'Wu-Tang Clan';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Demo Tape': '??/??/????',
    'Enter the Wu-Tang (36 Chambers)': '??/??/????',
    'Wu-Tang Forever': '??/??/????',
    '(RZA, GZA, Ol\' Dirty Bastard, Method Man, U-God, Ghostface Killah, Inspectah Deck, Raekwon, Masta Killa, Cappadonna)': '??/??/????',
    'The W': '??/??/????',
    'Iron Flag': '??/??/????',
    '8 Diagrams': '??/??/????',
    'A Better Tomorrow': '??/??/????',
    'Album leaks in Full: 6': '??/??/????',
    'Once Upon A Time In Shaolin': '??/??/????',
    'Method Man & Mathematics': '??/??/????',
    'The Saga Continues [V1]': '??/??/????',
    'Black Samson, The Bastard Swordsman': '??/??/????',
    'Twice Upon A Time In Shaolin': '??/??/????',
    '"The Eighth Diagrams" (8 Diagrams [V1])': '??/??/????',
    '??? (???. Ghostface Killah)': '??/??/????',
    'The Saga Continues [V2]': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Demo Tape',
    'Enter the Wu-Tang (36 Chambers)',
    'Wu-Tang Forever',
    '(RZA, GZA, Ol\' Dirty Bastard, Method Man, U-God, Ghostface Killah, Inspectah Deck, Raekwon, Masta Killa, Cappadonna)',
    'The W',
    'Iron Flag',
    '8 Diagrams',
    'A Better Tomorrow',
    'Album leaks in Full: 6',
    'Once Upon A Time In Shaolin',
    'Method Man & Mathematics',
    'The Saga Continues [V1]',
    'Black Samson, The Bastard Swordsman',
    'Twice Upon A Time In Shaolin',
    '"The Eighth Diagrams" (8 Diagrams [V1])',
    '??? (???. Ghostface Killah)',
    'The Saga Continues [V2]'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
