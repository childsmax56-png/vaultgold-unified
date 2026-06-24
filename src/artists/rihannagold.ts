import type { ArtistConfig } from './types';

export const rihannagoldConfig: ArtistConfig = {
  slug: 'rihannagold',
  SITE_NAME: 'RIHANNAGOLD',
  SITE_DESCRIPTION: 'The Best Rihanna Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/rihannagold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'rihannagold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#dc2626',
  artistLabel: 'Rihanna',
  cardLetter: 'RIH',
  logoUrl: '/logos/rihannagold.webp',
  artistPhotoUrl: '/artists/rihanna.webp',

  getArtistName() {
    return 'Rihanna';
  },

  CUSTOM_IMAGES: {
    'Music Of The Sun': '/artists/rihanna.webp',
    'A Girl Like Me': '/rihannagold/eras/a-girl-like-me.jpg',
    'Good Girl Gone Bad': '/rihannagold/eras/good-girl-gone-bad.jpg',
    'Rated R': '/rihannagold/eras/rated-r.jpg',
    'Loud': '/rihannagold/eras/loud.jpg',
    'Talk That Talk': '/rihannagold/eras/talk-that-talk.jpg',
    'Unapologetic': '/rihannagold/eras/unapologetic.jpg',
    'ANTI': '/rihannagold/eras/anti.jpg',
    'R9*': '/artists/rihanna.webp',
    'Ongoing': '/artists/rihanna.webp',
  },

  ALBUM_RELEASE_DATES: {
    'Music Of The Sun': '08/29/2005',
    'A Girl Like Me': '04/10/2006',
    'Good Girl Gone Bad': '05/31/2007',
    'Rated R': '11/23/2009',
    'Loud': '11/12/2010',
    'Talk That Talk': '11/18/2011',
    'Unapologetic': '11/19/2012',
    'ANTI': '01/28/2016',
    'R9*': '??/??/????',
    'Ongoing': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},
  ALBUM_ORDER: [
    'Music Of The Sun',
    'A Girl Like Me',
    'Good Girl Gone Bad',
    'Rated R',
    'Loud',
    'Talk That Talk',
    'Unapologetic',
    'ANTI',
    'R9*',
    'Ongoing',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: false,
  hasVideosTab: false,
};
