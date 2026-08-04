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

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1P2inSuDEuS_kp45qDAXJpb_hmj__Lj409bytyp4xiw8/edit',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#a16207',
  artistLabel: 'Doechii',
  sheetCreator: 'RunAw, dankuul, Brimcoole',
  cardLetter: 'D',
  logoUrl: '',
  artistPhotoUrl: '/artists/doechiigold.jpg',

  getArtistName() {
    return 'Doechii';
  },

  CUSTOM_IMAGES: {
    'Coven Music Sessions Vol.1': '/doechiigold/eras/coven-music-sessions-vol1.png',
    'Coven Music Sessions Vol.2': '/doechiigold/eras/coven-music-sessions-vol2.png',
    "Oh The Places You'll Go":    '/doechiigold/eras/oh-the-places-youll-go.png',
    'Bra-Less':                   '/doechiigold/eras/bra-less.png',
    'Unfinished Love Songs':      '/doechiigold/eras/unfinished-love-songs.png',
    'she / her / black bitch':    '/doechiigold/eras/she-her-black-bitch.png',
    'Debut Album [V1]':           '/doechiigold/eras/debut-album-v1.png',
    'Alligator Bites Never Heal': '/doechiigold/eras/alligator-bites-never-heal.png',
    'Debut Album [V2]':           '/doechiigold/eras/debut-album-v2.png',
  },

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
