import type { ArtistConfig } from './types';

// Trippie Redd tracker. Data served from committed CSV snapshots under
// public/trippiegold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const trippiegoldConfig: ArtistConfig = {
  slug: 'trippiegold',
  SITE_NAME: 'TRIPPIEGOLD',
  SITE_DESCRIPTION: 'The Best Trippie Redd Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/trippiegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'trippiegold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#e11d48',
  artistLabel: 'Trippie Redd',
  cardLetter: 'T',
  logoUrl: '',
  artistPhotoUrl: '/artists/trippiegold.jpg',

  getArtistName() {
    return 'Trippie Redd';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Awakening My InnerBeast': '??/??/????',
    'Beast Mode ++++': '??/??/????',
    'Rock The World Trippie (xxxxx)': '??/??/????',
    'White Room Project': '??/??/????',
    'A Love Letter To You': '??/??/????',
    'A Love Letter To You 2': '??/??/????',
    'LIFE\'S A TRIP': '??/??/????',
    'TrippieBoat': '??/??/????',
    'A Love Letter To You 3': '??/??/????',
    'WE DONT DIAL 911': '??/??/????',
    '!': '??/??/????',
    'A Love Letter To You 4': '??/??/????',
    'A Love Letter To You 4 (Deluxe)': '??/??/????',
    'Pegasus': '??/??/????',
    'Trip At Knight [V1]': '??/??/????',
    'Trip At Knight [V2]': '??/??/????',
    'A Love Letter To You 5 [V1]': '??/??/????',
    'MANSION MUSIK [V1]': '??/??/????',
    'MANSION MUSIK [V2]': '??/??/????',
    'A Love Letter To You 5 [V2]': '??/??/????',
    'Saint Michael': '??/??/????',
    'LIFE\'S A TRIP 2': '??/??/????',
    'LIVE LOVE LAUGH DIE': '??/??/????',
    'NDA': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Awakening My InnerBeast',
    'Beast Mode ++++',
    'Rock The World Trippie (xxxxx)',
    'White Room Project',
    'A Love Letter To You',
    'A Love Letter To You 2',
    'LIFE\'S A TRIP',
    'TrippieBoat',
    'A Love Letter To You 3',
    'WE DONT DIAL 911',
    '!',
    'A Love Letter To You 4',
    'A Love Letter To You 4 (Deluxe)',
    'Pegasus',
    'Trip At Knight [V1]',
    'Trip At Knight [V2]',
    'A Love Letter To You 5 [V1]',
    'MANSION MUSIK [V1]',
    'MANSION MUSIK [V2]',
    'A Love Letter To You 5 [V2]',
    'Saint Michael',
    'LIFE\'S A TRIP 2',
    'LIVE LOVE LAUGH DIE',
    'NDA'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
  hasGroupbuysTab: true,
};
