import type { ArtistConfig } from './types';

// Chance the Rapper tracker. Data served from committed CSV snapshots under
// public/chancegold/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const chancegoldConfig: ArtistConfig = {
  slug: 'chancegold',
  SITE_NAME: 'CHANCEGOLD',
  SITE_DESCRIPTION: 'The Best Chance the Rapper Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/chancegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'chancegold_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#f59e0b',
  artistLabel: 'Chance the Rapper',
  cardLetter: 'C',
  logoUrl: '',
  artistPhotoUrl: '/artists/chancegold.jpg',

  getArtistName() {
    return 'Chance the Rapper';
  },

  CUSTOM_IMAGES: {
    'Before 10 Day':                       '/chancegold/eras/before-10-day.jpg',
    '10 Day':                              '/chancegold/eras/10-day.jpg',
    'Acid Rap':                            '/chancegold/eras/acid-rap.jpg',
    'Acid Rap 2':                          '/chancegold/eras/acid-rap-2.jpg',
    'GOTENKS [V1]':                        '/chancegold/eras/gotenks-v1.jpg',
    'Surf':                                '/chancegold/eras/surf.jpg',
    'Coloring Book':                       '/chancegold/eras/coloring-book.jpg',
    'Owbum':                               '/chancegold/eras/owbum.jpg',
    'Collaboration with Childish Gambino': '/chancegold/eras/collaboration-with-childish-gambino.png',
    'Good Ass Job':                        '/chancegold/eras/good-ass-job.png',
    'The Big Day':                         '/chancegold/eras/the-big-day.png',
    'STAR LINE':                           '/chancegold/eras/star-line.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Before 10 Day': '??/??/????',
    '10 Day': '??/??/????',
    'Acid Rap': '??/??/????',
    'Acid Rap 2': '??/??/????',
    'GOTENKS [V1]': '??/??/????',
    'A Cole Chance': '??/??/????',
    'Surf': '??/??/????',
    'Coloring Book': '??/??/????',
    'Owbum': '??/??/????',
    'Collaboration with Childish Gambino': '??/??/????',
    'Childish Gambino Collaboration': '??/??/????',
    'Good Ass Job': '??/??/????',
    'The Big Day': '??/??/????',
    'STAR LINE': '??/??/????',
    'Ongoing': '??/??/????'
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before 10 Day',
    '10 Day',
    'Acid Rap',
    'Acid Rap 2',
    'GOTENKS [V1]',
    'A Cole Chance',
    'Surf',
    'Coloring Book',
    'Owbum',
    'Collaboration with Childish Gambino',
    'Childish Gambino Collaboration',
    'Good Ass Job',
    'The Big Day',
    'STAR LINE',
    'Ongoing'
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker
};
