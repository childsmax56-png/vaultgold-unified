import type { ArtistConfig } from './types';

// Childish Gambino tracker. Data served from committed CSV snapshots under
// public/gambinogold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const gambinogoldConfig: ArtistConfig = {
  slug: 'gambinogold',
  SITE_NAME: 'GAMBINOGOLD',
  SITE_DESCRIPTION: 'The Best Childish Gambino Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/gambinogold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'gambinogold_',

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1eyBjj7qPxIT_P93RaSPZf5hTJemGi5jMqSJF777OsdE/edit?gid=1792554832#1792554832',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#dc2626',
  artistLabel: 'Childish Gambino',
  sheetCreator: 'shri, mouse man, Dr. Wolf, Buddy, p4, comptonrapper, Commandtechno, Plague Doctress, slothsavedearth',
  cardLetter: 'C',
  logoUrl: '',
  artistPhotoUrl: '/artists/gambinogold.jpg',

  getArtistName() {
    return 'Childish Gambino';
  },

  CUSTOM_IMAGES: {
    'The Younger I Get':             '/gambinogold/eras/the-younger-i-get.jpg',
    'Poindexter':                    '/gambinogold/eras/poindexter.png',
    'I AM JUST A RAPPER':            '/gambinogold/eras/i-am-just-a-rapper.jpg',
    'Culdesac':                      '/gambinogold/eras/culdesac.jpg',
    'EP':                            '/gambinogold/eras/ep.jpg',
    'ROYALTY':                       '/gambinogold/eras/royalty.jpg',
    'Because The Internet':          '/gambinogold/eras/because-the-internet.jpg',
    'STN MTN / Kauai':               '/gambinogold/eras/stn-mtn-kauai.png',
    '"Awaken, My Love!"':            '/gambinogold/eras/awaken-my-love.jpg',
    'Untitled*':                     '/gambinogold/eras/untitled.jpg',
    'Atavista [V1]':                 '/gambinogold/eras/atavista-v1.jpg',
    '3.15.20':                       '/gambinogold/eras/31520.jpg',
    'Atavista [V2]':                 '/gambinogold/eras/atavista-v2.png',
    'Bando Stone and The New World': '/gambinogold/eras/bando-stone-and-the-new-world.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'The Younger I Get': '??/??/????',
    'Poindexter': '??/??/????',
    'I AM JUST A RAPPER': '??/??/????',
    'Culdesac': '??/??/????',
    'EP': '??/??/????',
    'ROYALTY': '??/??/????',
    'Because The Internet': '??/??/????',
    'STN MTN / Kauai': '??/??/????',
    '"Awaken, My Love!"': '??/??/????',
    'Untitled*': '??/??/????',
    'Atavista [V1]': '??/??/????',
    '3.15.20': '??/??/????',
    'Atavista [V2]': '??/??/????',
    'Bando Stone and The New World': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'The Younger I Get',
    'Poindexter',
    'I AM JUST A RAPPER',
    'Culdesac',
    'EP',
    'ROYALTY',
    'Because The Internet',
    'STN MTN / Kauai',
    '"Awaken, My Love!"',
    'Untitled*',
    'Atavista [V1]',
    '3.15.20',
    'Atavista [V2]',
    'Bando Stone and The New World'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
  hasAlbumCopiesTab: true,
  hasGroupbuysTab: true,
};
