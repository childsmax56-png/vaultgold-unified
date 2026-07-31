import type { ArtistConfig } from './types';

// Coldplay tracker. Data served from committed CSV snapshots under
// public/coldplaygold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const coldplaygoldConfig: ArtistConfig = {
  slug: 'coldplaygold',
  SITE_NAME: 'COLDPLAYGOLD',
  SITE_DESCRIPTION: 'The Best Coldplay Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/coldplaygold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'coldplaygold_',

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1i4xfiqtONMps_FL9n_2O5UmpKKio6HUCh5y6zQniyPk/edit',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#eab308',
  artistLabel: 'Coldplay',
  cardLetter: 'C',
  logoUrl: '',
  artistPhotoUrl: '/artists/coldplaygold.jpg',

  getArtistName() {
    return 'Coldplay';
  },

  CUSTOM_IMAGES: {
    'Early Days / Pre-Parachutes':               '/coldplaygold/eras/early-days-pre-parachutes.jpg',
    'Parachutes':                                '/coldplaygold/eras/parachutes.jpg',
    'A Rush of Blood to the Head':               '/coldplaygold/eras/a-rush-of-blood-to-the-head.jpg',
    'X&Y':                                       '/coldplaygold/eras/xy.png',
    'Viva la Vida or Death and All His Friends': '/coldplaygold/eras/viva-la-vida-or-death-and-all-his-friends.jpg',
    'Mylo Xyloto':                               '/coldplaygold/eras/mylo-xyloto.jpg',
    'Ghost Stories':                             '/coldplaygold/eras/ghost-stories.png',
    'A Head Full of Dreams':                     '/coldplaygold/eras/a-head-full-of-dreams.png',
    'Everyday Life':                             '/coldplaygold/eras/everyday-life.png',
    'Music of the Spheres':                      '/coldplaygold/eras/music-of-the-spheres.png',
    'Music of the Spheres, Vol. 2:':             '/coldplaygold/eras/music-of-the-spheres-vol-2.png',
  },

  ALBUM_RELEASE_DATES: {
    'ADD': '??/??/????',
    'Early Days / Pre-Parachutes': '??/??/????',
    'Early Days': '??/??/????',
    'Parachutes': '??/??/????',
    'A Rush of Blood to the Head': '??/??/????',
    'X&Y': '??/??/????',
    'Viva la Vida or Death and All His Friends': '??/??/????',
    'Viva la Vida': '??/??/????',
    'The Wedding Album': '??/??/????',
    'Mylo Xyloto': '??/??/????',
    'Ghost Stories': '??/??/????',
    'A Head Full of Dreams': '??/??/????',
    'Everyday Life': '??/??/????',
    'Music of the Spheres': '??/??/????',
    'Music of the Spheres, Vol. 2:': '??/??/????',
    'Moon Music': '??/??/????',
    '!': '??/??/????',
    'Music Of The Spheres, Vol. 3': '??/??/????',
    'Musical': '??/??/????',
    'Coldplay (LP12)': '??/??/????',
    'Coldplay': '??/??/????',
    'Unknown Era': '??/??/????',
    'Parachutes anniversary': '??/??/????',
    'AROBTTH Anniversary': '??/??/????',
    'X&Y Anniversary': '??/??/????',
    'Viva Anniversary': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'ADD',
    'Early Days / Pre-Parachutes',
    'Early Days',
    'Parachutes',
    'A Rush of Blood to the Head',
    'X&Y',
    'Viva la Vida or Death and All His Friends',
    'Viva la Vida',
    'The Wedding Album',
    'Mylo Xyloto',
    'Ghost Stories',
    'A Head Full of Dreams',
    'Everyday Life',
    'Music of the Spheres',
    'Music of the Spheres, Vol. 2:',
    'Moon Music',
    '!',
    'Music Of The Spheres, Vol. 3',
    'Musical',
    'Coldplay (LP12)',
    'Coldplay',
    'Unknown Era',
    'Parachutes anniversary',
    'AROBTTH Anniversary',
    'X&Y Anniversary',
    'Viva Anniversary'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
