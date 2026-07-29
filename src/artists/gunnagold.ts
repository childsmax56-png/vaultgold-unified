import type { ArtistConfig } from './types';

// Gunna tracker. Data served from committed CSV snapshots under
// public/gunnagold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const gunnagoldConfig: ArtistConfig = {
  slug: 'gunnagold',
  SITE_NAME: 'GUNNAGOLD',
  SITE_DESCRIPTION: 'The Best Gunna Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/gunnagold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'gunnagold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#c026d3',
  artistLabel: 'Gunna',
  cardLetter: 'G',
  logoUrl: '',
  artistPhotoUrl: '/artists/gunnagold.jpg',

  getArtistName() {
    return 'Gunna';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'SPC Entourage': '??/??/????',
    'Family 1st': '??/??/????',
    'Hard Body': '??/??/????',
    'Money Can\'t Buy Dreams [V1]': '??/??/????',
    'The Nextdoor Neighbors': '??/??/????',
    'Money Can\'t Buy Dreams [V2]': '??/??/????',
    'Drip Season': '??/??/????',
    'Drip Season 2': '??/??/????',
    'Designer Drip': '??/??/????',
    'Drip or Drown': '??/??/????',
    'Collaboration with UnoTheActivist': '??/??/????',
    'Drip Season 3': '??/??/????',
    'Drip Harder': '??/??/????',
    'Drip or Drown 2': '??/??/????',
    'Collaboration with Young Thug': '??/??/????',
    'WUNNA': '??/??/????',
    'WUNNA (Deluxe)': '??/??/????',
    'SUPER SLIMEY: SURFER EDITION': '??/??/????',
    'Super Slimey: Surfer Edition': '??/??/????',
    'Drip Harder 2': '??/??/????',
    'Slime Language 2': '??/??/????',
    'DS4EVER': '??/??/????',
    'Untitled (2022)': '??/??/????',
    'a Gift & a Curse': '??/??/????',
    'One of Wun': '??/??/????',
    'Collaboration with Offset': '??/??/????',
    'The Last Wun': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'SPC Entourage',
    'Family 1st',
    'Hard Body',
    'Money Can\'t Buy Dreams [V1]',
    'The Nextdoor Neighbors',
    'Money Can\'t Buy Dreams [V2]',
    'Drip Season',
    'Drip Season 2',
    'Designer Drip',
    'Drip or Drown',
    'Collaboration with UnoTheActivist',
    'Drip Season 3',
    'Drip Harder',
    'Drip or Drown 2',
    'Collaboration with Young Thug',
    'WUNNA',
    'WUNNA (Deluxe)',
    'SUPER SLIMEY: SURFER EDITION',
    'Super Slimey: Surfer Edition',
    'Drip Harder 2',
    'Slime Language 2',
    'DS4EVER',
    'Untitled (2022)',
    'a Gift & a Curse',
    'One of Wun',
    'Collaboration with Offset',
    'The Last Wun',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasAlbumCopiesTab: true,
};
