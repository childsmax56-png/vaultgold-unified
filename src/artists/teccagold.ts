import type { ArtistConfig } from './types';

export const teccagoldConfig: ArtistConfig = {
  slug: 'teccagold',
  SITE_NAME: 'TECCAGOLD',
  SITE_DESCRIPTION: 'The Best Lil Tecca Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/teccagold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'teccagold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#22d3ee',
  artistLabel: 'Lil Tecca',
  cardLetter: 'LT',
  logoUrl: '/logos/teccagold.webp',
  artistPhotoUrl: '/artists/liltecca.webp',

  getArtistName() {
    return 'Lil Tecca';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Tecca & Friends': '??/??/2018',
    'We Love You Tecca': '08/30/2019',
    'Virgo World': '09/18/2020',
    'Two Lil Black Boys': '??/??/????',
    'We Love You Tecca 2': '08/27/2021',
    'TEC': '09/22/2023',
    'PLAN A': '09/20/2024',
    'DOPAMINE': '06/13/2025',
    'Ongoing': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},
  ALBUM_ORDER: [
    'Tecca & Friends',
    'We Love You Tecca',
    'Virgo World',
    'Two Lil Black Boys',
    'We Love You Tecca 2',
    'TEC',
    'PLAN A',
    'DOPAMINE',
    'Ongoing',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: false,
  hasVideosTab: false,
};
