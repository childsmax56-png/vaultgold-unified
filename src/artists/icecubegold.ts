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

  sheetUrl: 'https://docs.google.com/spreadsheets/d/1bsNrVejh4H27uafX6jpnllbAuiVqRnDUMegKdTYAFQA/edit?gid=1360798347#1360798347',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#0891b2',
  artistLabel: 'Ice Cube',
  sheetCreator: 'iaon',
  cardLetter: 'I',
  logoUrl: '',
  artistPhotoUrl: '/artists/icecubegold.jpg',

  getArtistName() {
    return 'Ice Cube';
  },

  CUSTOM_IMAGES: {
    "Cru' In Action!":                      '/icecubegold/eras/cru-in-action.jpg',
    'N.W.A and the Posse':                  '/icecubegold/eras/nwa-and-the-posse.jpg',
    'Straight Outta Compton':               '/icecubegold/eras/straight-outta-compton.jpg',
    "AmeriKKKa's Most Wanted":              '/icecubegold/eras/amerikkkas-most-wanted.jpg',
    'Kill At Will':                         '/icecubegold/eras/kill-at-will.jpg',
    'Death Certificate':                    '/icecubegold/eras/death-certificate.jpg',
    'The Predator':                         '/icecubegold/eras/the-predator.jpg',
    'Lethal Injection':                     '/icecubegold/eras/lethal-injection.jpg',
    'Bow Down':                             '/icecubegold/eras/bow-down.jpg',
    'War & Peace, Vol. 1 (The War Disc)':   '/icecubegold/eras/war-peace-vol-1-the-war-disc.jpg',
    'War & Peace, Vol. 2 (The Peace Disc)': '/icecubegold/eras/war-peace-vol-2-the-peace-disc.jpg',
    'Terrorist Threats':                    '/icecubegold/eras/terrorist-threats.jpg',
    'Laugh Now, Cry Later':                 '/icecubegold/eras/laugh-now-cry-later.jpg',
    'Raw Footage':                          '/icecubegold/eras/raw-footage.jpg',
    'I Am The West':                        '/icecubegold/eras/i-am-the-west.jpg',
    'Everythangs Corrupt':                  '/icecubegold/eras/everythangs-corrupt.jpg',
    'SNOOP CUBE 40 $HORT':                  '/icecubegold/eras/snoop-cube-40-hort.jpg',
    'Man Down':                             '/icecubegold/eras/man-down.jpg',
    'Man Up':                               '/icecubegold/eras/man-up.png',
    'Pre-VMAs':                             '/icecubegold/eras/pre-vmas.jpg',
  },

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
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
  hasAlbumCopiesTab: true,
};
