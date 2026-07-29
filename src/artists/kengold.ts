import type { ArtistConfig } from './types';

// Ken Carson tracker.
//
// Data is served from committed CSV snapshots under public/kengold/data/*.csv,
// scraped from the community Ken Carson tracker Google Sheet
// (https://docs.google.com/spreadsheets/d/1OARID98xCqRaBr8gyQCvI3aD4jKQDGgtedyRaiP_pyo).
// The sheet has viewer-downloads disabled, so its /export CSV 403/401s; the text
// metadata is pulled via the public gviz endpoint instead. gviz drops hyperlink
// URLs (cells only carry display text like "Pixeldrain"), so the real download
// links are recovered separately via scripts/extract-kengold-links.gs (Apps
// Script, reads getRichTextValues) and merged in with scripts/build-kengold-csvs.mjs.
//
// The metadata overlays below are keyed by the exact era names the sheet uses; an
// era only appears in the music grid if its name is a key in ALBUM_RELEASE_DATES,
// which also filters out the sheet's changelog/footer rows.
export const kengoldConfig: ArtistConfig = {
  slug: 'kengold',
  SITE_NAME: 'KENGOLD',
  SITE_DESCRIPTION: 'The Best Ken Carson Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/kengold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'kengold_',

  // All tabs read committed CSVs via the /api/kengold/* endpoints.
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1OARID98xCqRaBr8gyQCvI3aD4jKQDGgtedyRaiP_pyo/edit',

  accentColor: '#d61f26',
  artistLabel: 'Ken Carson',
  cardLetter: 'K',
  logoUrl: '',
  artistPhotoUrl: '',

  getArtistName() {
    return 'Ken Carson';
  },

  CUSTOM_IMAGES: {
    'Before Boy Barbie':  '/kengold/eras/before-boy-barbie.png',
    'Boy Barbie':         '/kengold/eras/boy-barbie.png',
    'Teen X':             '/kengold/eras/teen-x.png',
    'Teen X : Relapsed':  '/kengold/eras/teen-x-relapsed.png',
    'Project X':          '/kengold/eras/project-x.png',
    'X':                  '/kengold/eras/x.png',
    'A Great Chaos':      '/kengold/eras/a-great-chaos.png',
    'More Chaos':         '/kengold/eras/more-chaos.jpg',
    'xperiment':          '/kengold/eras/xperiment.jpg',
  },

  // Keys must match the era names in public/kengold/data/unreleased.csv exactly.
  ALBUM_RELEASE_DATES: {
    'Before Boy Barbie': '??/??/????',
    'Boy Barbie': '05/12/2020',
    'Teen X': '10/29/2021',
    'Teen X : Relapsed': '??/??/????',
    'Project X': '12/03/2021',
    'X': '07/08/2022',
    'A Great Chaos': '10/13/2023',
    'More Chaos': '05/09/2025',
    'xperiment': '??/??/????',
    // Art/tracklist/released-only eras (fan-compiled "Lost Files" series & related)
    'Lost Files': '??/??/????',
    'Lost Files 2': '??/??/????',
    'lost_files_3': '??/??/????',
    'X TWO THREE': '??/??/????',
    'lost ?': '??/??/????',
    'XTENDED': '??/??/????',
    'cartunez': '??/??/????',
  },

  HIDDEN_ALBUMS: [],

  ALBUM_DESCRIPTIONS: {
    'Before Boy Barbie':
      "Ken Carson's earliest recordings, made under the name Ken Car$on after he joined 808 Mafia in 2015 and began releasing music on SoundCloud in 2017, before signing to Playboi Carti's Opium in 2019.",
    'Boy Barbie':
      "Ken Carson's debut EP, released May 12, 2020 — his first project after signing to Opium.",
    'Teen X':
      "The era around Ken Carson's breakout, leading into his growing profile on the Opium roster.",
    'Teen X : Relapsed':
      'A reissue/continuation of the Teen X era with additional tracks.',
    'Project X':
      'The run-up to and material surrounding Project X.',
    'X':
      "Ken Carson's debut studio album, released July 8, 2022.",
    'A Great Chaos':
      "Ken Carson's second studio album, released October 13, 2023 to his biggest commercial success yet.",
    'More Chaos':
      "Ken Carson's third studio album, released May 9, 2025.",
    'xperiment':
      'The most recent era — new sessions, snippets and loose tracks as Ken works toward his next project.',
    'Lost Files': 'Fan-compiled collection of loose and lost Ken Carson tracks.',
    'Lost Files 2': 'The second Lost Files compilation of loose and lost tracks.',
    'lost_files_3': 'The third Lost Files compilation of loose and lost tracks.',
    'X TWO THREE': 'The "Lost Files 3.5" compilation.',
    'lost ?': 'The "Lost Files 4" compilation.',
    'XTENDED': 'Extended-cut compilation of Ken Carson material.',
    'cartunez': 'The cartunez compilation.',
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Before Boy Barbie',
    'Boy Barbie',
    'Teen X',
    'Teen X : Relapsed',
    'Project X',
    'X',
    'A Great Chaos',
    'More Chaos',
    'xperiment',
    'Lost Files',
    'Lost Files 2',
    'lost_files_3',
    'X TWO THREE',
    'lost ?',
    'XTENDED',
    'cartunez',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  // Chronological fundraiser-history tab (data from data/groupbuys.csv).
  // Recent / Released / Stems / Art / Misc / Tracklists are data-driven and
  // appear automatically when their CSV/JSON returns rows.
  hasGroupbuysTab: true,
};
