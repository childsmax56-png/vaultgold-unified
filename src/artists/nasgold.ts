import type { ArtistConfig } from './types';

// Nas tracker. Data served from committed CSV snapshots under
// public/nasgold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const nasgoldConfig: ArtistConfig = {
  slug: 'nasgold',
  SITE_NAME: 'NASGOLD',
  SITE_DESCRIPTION: 'The Best Nas Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/nasgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'nasgold_',

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1TnALmkQdRX_spdUMLLamizAZYD3rERO_iGGzCqD-A6M/edit',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#991b1b',
  artistLabel: 'Nas',
  cardLetter: 'N',
  logoUrl: '',
  artistPhotoUrl: '/artists/nasgold.jpg',

  getArtistName() {
    return 'Nas';
  },

  CUSTOM_IMAGES: {
    'Pre-Matic':                                              '/nasgold/eras/pre-matic.png',
    'illmatic':                                               '/nasgold/eras/illmatic.jpg',
    'It Was Written':                                         '/nasgold/eras/it-was-written.jpg',
    'The Album':                                              '/nasgold/eras/the-album.jpg',
    'I Am...':                                                '/nasgold/eras/i-am.jpg',
    'Nastradamus':                                            '/nasgold/eras/nastradamus.jpg',
    'Nas & Ill Will Records Presents Queensbridge The Album': '/nasgold/eras/nas-ill-will-records-presents-queensbridge-the-album.jpg',
    'Stillmatic':                                             '/nasgold/eras/stillmatic.jpg',
    "God's Son":                                              '/nasgold/eras/gods-son.jpg',
    "Street's Disciple":                                      '/nasgold/eras/streets-disciple.jpg',
    'Hip Hop Is Dead':                                        '/nasgold/eras/hip-hop-is-dead.jpg',
    'Untitled':                                               '/nasgold/eras/untitled.jpg',
    'Distant Relatives':                                      '/nasgold/eras/distant-relatives.jpg',
    'Life Is Good':                                           '/nasgold/eras/life-is-good.jpg',
    'NASIR':                                                  '/nasgold/eras/nasir.jpg',
    "King's Disease":                                         '/nasgold/eras/kings-disease.jpg',
    "King's Disease II":                                      '/nasgold/eras/kings-disease-ii.png',
    'Magic':                                                  '/nasgold/eras/magic.jpg',
    "King's Disease III":                                     '/nasgold/eras/kings-disease-iii.png',
    'Magic 2':                                                '/nasgold/eras/magic-2.png',
    'Magic 3':                                                '/nasgold/eras/magic-3.jpg',
    'Light-Years':                                            '/nasgold/eras/light-years.png',
    'Others':                                                 '/nasgold/eras/others.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Pre-Matic': '??/??/????',
    'illmatic': '??/??/????',
    'It Was Written': '??/??/????',
    'The Album': '??/??/????',
    'I Am...': '??/??/????',
    'Nastradamus': '??/??/????',
    'Nas & Ill Will Records Presents Queensbridge The Album': '??/??/????',
    'QBF': '??/??/????',
    'Stillmatic': '??/??/????',
    'God\'s Son': '??/??/????',
    'Street\'s Disciple': '??/??/????',
    'Hip Hop Is Dead': '??/??/????',
    'Untitled': '??/??/????',
    '11 Unavailable': '??/??/????',
    'Distant Relatives': '??/??/????',
    'Life Is Good': '??/??/????',
    'Hiatus Era': '??/??/????',
    'NASIR': '??/??/????',
    'King\'s Disease': '??/??/????',
    '1 Full': '??/??/????',
    'King\'s Diesease II': '??/??/????',
    'Light-Years': '??/??/????',
    'Others': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Pre-Matic',
    'illmatic',
    'It Was Written',
    'The Album',
    'I Am...',
    'Nastradamus',
    'Nas & Ill Will Records Presents Queensbridge The Album',
    'QBF',
    'Stillmatic',
    'God\'s Son',
    'Street\'s Disciple',
    'Hip Hop Is Dead',
    'Untitled',
    '11 Unavailable',
    'Distant Relatives',
    'Life Is Good',
    'Hiatus Era',
    'NASIR',
    'King\'s Disease',
    '1 Full',
    'King\'s Diesease II',
    'Light-Years',
    'Others'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
  hasGroupbuysTab: true,
};
