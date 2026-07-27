import type { ArtistConfig } from './types';

// Frank Ocean tracker.
//
// Data is served from committed CSV snapshots under public/frankgold/data/*.csv,
// scraped from the community Frank Ocean Tracker (franktracker.net). The original
// Google Sheet is private (its CSV export 403s), so the live-sheet fallback in
// functions/api/[artist]/_sheets.ts never resolves for frankgold — the committed
// CSVs are the source of truth. Refresh them by re-scraping franktracker.net's
// per-tab /preview/sheet/<gid> pages.
//
// The metadata overlays below (release dates, descriptions) are keyed by the exact
// era names the sheet uses; an era only appears in the music grid if its name is a
// key in ALBUM_RELEASE_DATES, which also filters out the sheet's changelog/guideline
// footer rows.
export const frankgoldConfig: ArtistConfig = {
  slug: 'frankgold',
  SITE_NAME: 'FRANKGOLD',
  SITE_DESCRIPTION: 'The Best Frank Ocean Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/frankgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'frankgold_',

  // All tabs read committed CSVs via the /api/frankgold/* endpoints.
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#e8622c',
  artistLabel: 'Frank Ocean',
  cardLetter: 'F',
  logoUrl: '',

  getArtistName() {
    return 'Frank Ocean';
  },

  CUSTOM_IMAGES: {},

  // Keys must match the era names in public/frankgold/data/unreleased.csv exactly.
  ALBUM_RELEASE_DATES: {
    'Broken Glass': '??/??/????',
    'Lonny Breaux': '??/??/????',
    'nostalgia, ULTRA.': '02/16/2011',
    'channel ORANGE': '07/10/2012',
    'Endless': '08/19/2016',
    'blonde': '08/20/2016',
    'blonded radio': '??/??/????',
    "Look At Us, We're In Love": '??/??/????',
    'Upcoming': '??/??/????',
  },

  HIDDEN_ALBUMS: [],

  ALBUM_DESCRIPTIONS: {
    'Broken Glass':
      "Frank Ocean's scrapped debut EP, worked on around 2005-2008 before he moved to Los Angeles and reinvented himself as a songwriter. Almost entirely unreleased.",
    'Lonny Breaux':
      "Demos and songwriter-era recordings made under his birth name, Christopher \"Lonny\" Breaux, after signing to Def Jam and before his solo debut — the source of the widely-circulated \"Lonny Breaux Collection.\"",
    'nostalgia, ULTRA.':
      "Frank Ocean's debut mixtape, self-released February 16, 2011, which broke him out as a solo artist beyond Odd Future.",
    'channel ORANGE':
      "Frank Ocean's debut studio album, released July 10, 2012 to widespread acclaim and a Grammy for Best Urban Contemporary Album.",
    'Endless':
      'Visual album released August 19, 2016 that fulfilled the final release of his Def Jam contract, a day before Blonde.',
    'blonde':
      "Frank Ocean's second studio album, self-released August 20, 2016 (styled \"blond\" on the cover), widely regarded as one of the defining albums of the decade.",
    'blonded radio':
      "Material tied to Frank's blonded RADIO Apple Music show and the singles and one-off tracks released around and after the Blonde era.",
    "Look At Us, We're In Love":
      "The most recent era — new sessions, loosies and collaborations tracked as Frank works toward his next project.",
    'Upcoming':
      'Confirmed-but-unreleased and anticipated material expected on a future Frank Ocean project.',
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Broken Glass',
    'Lonny Breaux',
    'nostalgia, ULTRA.',
    'channel ORANGE',
    'Endless',
    'blonde',
    'blonded radio',
    "Look At Us, We're In Love",
    'Upcoming',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  // Opt-in tab backed by the sheet's Album Copies page. Stems / Art / Videos /
  // Fakes are data-driven and appear automatically when their CSV returns rows.
  hasAlbumCopiesTab: true,
};
