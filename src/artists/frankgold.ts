import type { ArtistConfig } from './types';

// Frank Ocean tracker.
//
// Data is read live from the community Frank Ocean Tracker Google Sheet
// (franktracker.net) rather than a committed CSV snapshot — the per-tab gids
// live in functions/api/[artist]/_sheets.ts, and the endpoints fall back to the
// sheet's CSV export at request time. The metadata overlays below (release
// dates, descriptions) are keyed by era name; any name that doesn't match a row
// in the sheet is simply ignored, so they never break the tracker.
export const frankgoldConfig: ArtistConfig = {
  slug: 'frankgold',
  SITE_NAME: 'FRANKGOLD',
  SITE_DESCRIPTION: 'The Best Frank Ocean Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/frankgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'frankgold_',

  // Main music view + the Recent tab pull straight from the live sheet.
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT:
    'https://docs.google.com/spreadsheets/d/1wlztKH_bwoTDtMZFm8-lYqzZWLCGf-XqE-gea-nGR0Y/export?format=csv&gid=1122958563',

  accentColor: '#e8622c',
  artistLabel: 'Frank Ocean',
  cardLetter: 'F',
  logoUrl: '',

  getArtistName() {
    return 'Frank Ocean';
  },

  CUSTOM_IMAGES: {},

  ALBUM_RELEASE_DATES: {
    'nostalgia, ULTRA.': '02/16/2011',
    'nostalgia, ULTRA': '02/16/2011',
    'channel ORANGE': '07/10/2012',
    'Endless': '08/19/2016',
    'Blonde': '08/20/2016',
    'Blond': '08/20/2016',
  },

  HIDDEN_ALBUMS: [],

  ALBUM_DESCRIPTIONS: {
    'The Lonny Breaux Collection':
      "Demos and songwriter-era recordings from Frank Ocean's early career under his birth name, Christopher \"Lonny\" Breaux, before his solo debut.",
    'nostalgia, ULTRA.':
      "Frank Ocean's debut mixtape, self-released February 16, 2011, that broke him out as a solo artist.",
    'nostalgia, ULTRA':
      "Frank Ocean's debut mixtape, self-released February 16, 2011, that broke him out as a solo artist.",
    'channel ORANGE':
      "Frank Ocean's debut studio album, released July 10, 2012, to widespread acclaim and a Grammy for Best Urban Contemporary Album.",
    'Endless':
      'Visual album released August 19, 2016, that fulfilled the final release of his Def Jam contract, a day before Blonde.',
    'Blonde':
      "Frank Ocean's second studio album, released independently August 20, 2016, widely regarded as one of the defining albums of the decade.",
    'Blond':
      "Frank Ocean's second studio album, released independently August 20, 2016, widely regarded as one of the defining albums of the decade.",
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  // Opt-in tab backed by the sheet's Album Copies page. Stems / Art / Videos /
  // Fakes / Tracklists are data-driven and appear automatically when the sheet
  // returns rows for them.
  hasAlbumCopiesTab: true,
};
