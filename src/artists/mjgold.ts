import type { ArtistConfig } from './types';

export const mjgoldConfig: ArtistConfig = {
  slug: 'mjgold',
  SITE_NAME: 'MJGOLD',
  SITE_DESCRIPTION: 'The Best Michael Jackson Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/mjgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'mjgold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#facc15',
  artistLabel: 'Michael Jackson',
  cardLetter: 'MJ',
  logoUrl: '/logos/mjgold.jpg',
  artistPhotoUrl: '/artists/michaeljackson.jpg',

  getArtistName() {
    return 'Michael Jackson';
  },

  CUSTOM_IMAGES: {
    'Got To Be There': '/mjgold/eras/got-to-be-there.jpg',
    'Off The Wall': '/mjgold/eras/off-the-wall.jpg',
    'Thriller': '/mjgold/eras/thriller.jpg',
    'Bad': '/mjgold/eras/bad.jpg',
    'Dangerous': '/mjgold/eras/dangerous.jpg',
    'HIStory: Past, Present, And Future: Book I': '/mjgold/eras/history.jpg',
    'Blood On The Dance Floor: HIStory In The Mix': '/mjgold/eras/blood-on-the-dance-floor.jpg',
    'Invincible': '/mjgold/eras/invincible.jpg',
    'Post-Invincible': '/mjgold/eras/post-invincible.jpg',
    'Final sessions': '/mjgold/eras/final-sessions.jpg',
    'Michael': '/mjgold/eras/michael.jpg',
    'XSCAPE': '/mjgold/eras/xscape.jpg',
    'Ongoing': '/mjgold/eras/ongoing.jpg',
    'Unclassified': '/mjgold/eras/unclassified.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Got To Be There': '01/24/1972',
    'Off The Wall': '08/10/1979',
    'Thriller': '11/29/1982',
    'Bad': '08/31/1987',
    'Dangerous': '11/21/1991',
    'HIStory: Past, Present, And Future: Book I': '06/20/1995',
    'Blood On The Dance Floor: HIStory In The Mix': '05/20/1997',
    'Invincible': '10/30/2001',
    'Post-Invincible': '??/??/????',
    'Final sessions': '??/??/????',
    'Michael': '12/10/2010',
    'XSCAPE': '05/09/2014',
    'Ongoing': '??/??/????',
    'Unclassified': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {},
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},
  ALBUM_ORDER: [
    'Got To Be There', 'Off The Wall', 'Thriller', 'Bad', 'Dangerous',
    'HIStory: Past, Present, And Future: Book I', 'Blood On The Dance Floor: HIStory In The Mix',
    'Invincible', 'Post-Invincible', 'Final sessions', 'Michael', 'XSCAPE', 'Ongoing', 'Unclassified',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: false,
  hasVideosTab: false,
};
