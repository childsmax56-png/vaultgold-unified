import type { ArtistConfig } from './types';

export const smokegoldConfig: ArtistConfig = {
  slug: 'smokegold',
  SITE_NAME: 'SMOKEGOLD',
  SITE_DESCRIPTION: 'The Best Pop Smoke Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/smokegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'smokegold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#1a1a2e',
  artistLabel: 'Pop Smoke',
  cardLetter: 'P',
  logoUrl: '/logos/smokegold.webp',
  artistPhotoUrl: '/artists/popsmoke.jpg',

  getArtistName() {
    return 'Pop Smoke';
  },

  CUSTOM_IMAGES: {
    'Meet The Woo 1': '/smokegold/eras/meet-the-woo-1.jpg',
    'Meet The Woo 2': '/smokegold/eras/meet-the-woo-2.jpg',
    'Boogie': '/smokegold/eras/boogie.jpg',
    'Faith': '/smokegold/eras/faith.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'GQ': '??/??/????',
    'Meet The Woo 1': '07/26/2019',
    'Meet The Woo 2': '02/07/2020',
    'PS3': '??/??/????',
    'Collaboration with French Montana': '??/??/????',
    'Huncho Woo': '??/??/????',
    'SFTSAFTM': '07/03/2020',
    'SFTSAFTM (Deluxe)': '07/20/2020',
    'Boogie': '03/05/2021',
    'Faith': '07/16/2021',
    'Ongoing': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},
  ALBUM_ORDER: [
    'GQ',
    'Meet The Woo 1',
    'Meet The Woo 2',
    'PS3',
    'Collaboration with French Montana',
    'Huncho Woo',
    'SFTSAFTM',
    'SFTSAFTM (Deluxe)',
    'Boogie',
    'Faith',
    'Ongoing',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: true,
  hasVideosTab: false,
};
