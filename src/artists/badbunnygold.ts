import type { ArtistConfig } from './types';

// Bad Bunny tracker. Data served from committed CSV snapshots under
// public/badbunnygold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const badbunnygoldConfig: ArtistConfig = {
  slug: 'badbunnygold',
  SITE_NAME: 'BADBUNNYGOLD',
  SITE_DESCRIPTION: 'The Best Bad Bunny Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/badbunnygold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'badbunnygold_',

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1O5RFNuOF4-K7xWCYMRQXy3Y_WkYOWu6o9zClsw8lPi4/edit?gid=1545615123#1545615123',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#16a34a',
  artistLabel: 'Bad Bunny',
  sheetCreator: 'valent, scarfvass',
  cardLetter: 'B',
  logoUrl: '',
  artistPhotoUrl: '/artists/badbunnygold.jpg',

  getArtistName() {
    return 'Bad Bunny';
  },

  CUSTOM_IMAGES: {
    'Before Hear This Music':              '/badbunnygold/eras/before-hear-this-music.jpg',
    'Hear This Music Era':                 '/badbunnygold/eras/hear-this-music-era.jpg',
    'X 100PRE':                            '/badbunnygold/eras/x-100pre.jpg',
    'OASIS':                               '/badbunnygold/eras/oasis.jpg',
    'YHLQMDLG':                            '/badbunnygold/eras/yhlqmdlg.jpg',
    'EL ÚLTIMO TOUR DEL MUNDO':            '/badbunnygold/eras/el-último-tour-del-mundo.jpg',
    'Un Verano Sin Ti':                    '/badbunnygold/eras/un-verano-sin-ti.jpg',
    'nadie sabe lo que va a pasar mañana': '/badbunnygold/eras/nadie-sabe-lo-que-va-a-pasar-mañana.jpg',
    'DeBÍ TiRAR MáS FOToS':                '/badbunnygold/eras/debí-tirar-más-fotos.jpg',
    'Ongoing':                             '/badbunnygold/eras/ongoing.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Before Hear This Music': '??/??/????',
    'Hear This Music Era': '??/??/????',
    'X 100PRE': '??/??/????',
    'OASIS': '??/??/????',
    'YHLQMDLG': '??/??/????',
    'EL ÚLTIMO TOUR DEL MUNDO': '??/??/????',
    'Un Verano Sin Ti': '??/??/????',
    'nadie sabe lo que va a pasar mañana': '??/??/????',
    'DeBÍ TiRAR MáS FOToS': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before Hear This Music',
    'Hear This Music Era',
    'X 100PRE',
    'OASIS',
    'YHLQMDLG',
    'EL ÚLTIMO TOUR DEL MUNDO',
    'Un Verano Sin Ti',
    'nadie sabe lo que va a pasar mañana',
    'DeBÍ TiRAR MáS FOToS',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
