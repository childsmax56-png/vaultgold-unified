import type { ArtistConfig } from './types';

export const keemgoldConfig: ArtistConfig = {
  slug: 'keemgold',
  SITE_NAME: 'KEEMGOLD',
  SITE_DESCRIPTION: 'The Best Baby Keem Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/keemgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'keemgold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#84cc16',
  artistLabel: 'Baby Keem',
  cardLetter: 'BK',
  logoUrl: '/logos/keemgold.webp',
  artistPhotoUrl: '/artists/babykeem.webp',

  getArtistName() {
    return 'Baby Keem';
  },

  CUSTOM_IMAGES: {
    'DIE FOR MY BITCH': '/keemgold/eras/die-for-my-bitch.jpg',
    'Ca$ino': '/keemgold/eras/casino.jpg',
    'The Melodic Blue': '/keemgold/eras/the-melodic-blue.jpg',
    'Child With Wolves': '/keemgold/eras/child-with-wolves.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Youth': '??/??/????',
    'Regin': '??/??/????',
    'Before Baby Keem': '??/??/????',
    'Oct': '??/??/????',
    'Black Nights': '??/??/????',
    'PTNTL': '??/??/????',
    'Midnight': '??/??/????',
    'No Name': '??/??/????',
    'Hearts & Darts': '??/??/????',
    'The Sound of Bad Habit': '10/29/2018',
    'DIE FOR MY BITCH': '07/19/2019',
    'The Melodic Blue': '09/10/2021',
    'Child With Wolves': '??/??/????',
    'Ca$ino': '02/20/2026',
    'Classical Rage': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {
    // stems.csv spells the era in all-caps; normalize to match the canonical name
    // used everywhere else (released/unreleased/art/misc/recent).
    'CA$INO': 'Ca$ino',
  },
  ALBUM_ORDER: [
    'Youth',
    'Regin',
    'Before Baby Keem',
    'Oct',
    'Black Nights',
    'PTNTL',
    'Midnight',
    'No Name',
    'Hearts & Darts',
    'The Sound of Bad Habit',
    'DIE FOR MY BITCH',
    'The Melodic Blue',
    'Child With Wolves',
    'Ca$ino',
    'Classical Rage',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: true,
  hasVideosTab: false,
};
