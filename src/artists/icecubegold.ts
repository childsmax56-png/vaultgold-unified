import type { ArtistConfig } from './types';

// Ice Cube tracker. Data served from committed CSV snapshots under
// public/icecubegold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const icecubegoldConfig: ArtistConfig = {
  slug: 'icecubegold',
  SITE_NAME: 'ICECUBEGOLD',
  SITE_DESCRIPTION: 'The Best Ice Cube Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/icecubegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'icecubegold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#0891b2',
  artistLabel: 'Ice Cube',
  cardLetter: 'I',
  logoUrl: '',
  artistPhotoUrl: '/artists/icecubegold.jpg',

  getArtistName() {
    return 'Ice Cube';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'Cru\' In Action!': '??/??/????',
    'N.W.A and the Posse': '??/??/????',
    'Straight Outta Compton': '??/??/????',
    'AmeriKKKa\'s Most Wanted': '??/??/????',
    'Kill At Will': '??/??/????',
    'Death Certificate': '??/??/????',
    'The Predator': '??/??/????',
    'Lethal Injection': '??/??/????',
    'Bow Down': '??/??/????',
    'War & Peace, Vol. 1 (The War Disc)': '??/??/????',
    'War & Peace, Vol. 1': '??/??/????',
    'War & Peace, Vol. 2 (The Peace Disc)': '??/??/????',
    'War & Peace, Vol. 2': '??/??/????',
    'Terrorist Threats': '??/??/????',
    'Laugh Now, Cry Later': '??/??/????',
    'Raw Footage': '??/??/????',
    'I Am The West': '??/??/????',
    'Everythangs Corrupt': '??/??/????',
    'SNOOP CUBE 40 $HORT': '??/??/????',
    'Man Down': '??/??/????',
    'Man Up': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Cru\' In Action!',
    'N.W.A and the Posse',
    'Straight Outta Compton',
    'AmeriKKKa\'s Most Wanted',
    'Kill At Will',
    'Death Certificate',
    'The Predator',
    'Lethal Injection',
    'Bow Down',
    'War & Peace, Vol. 1 (The War Disc)',
    'War & Peace, Vol. 1',
    'War & Peace, Vol. 2 (The Peace Disc)',
    'War & Peace, Vol. 2',
    'Terrorist Threats',
    'Laugh Now, Cry Later',
    'Raw Footage',
    'I Am The West',
    'Everythangs Corrupt',
    'SNOOP CUBE 40 $HORT',
    'Man Down',
    'Man Up'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasAlbumCopiesTab: true,
};
