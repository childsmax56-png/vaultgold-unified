import type { ArtistConfig } from './types';

// d4vd tracker — an EASTER EGG.
//
// This config is marked `hidden: true`, so d4vd never appears on the landing
// page grid — and, unlike a normal tracker, does NOT match his own name/slug in
// search. It only surfaces when the search query contains the secret passphrase
// "celeste" (see `searchAliases` below + matchesQuery in LandingPage.tsx).
//
// Data is served from committed CSV snapshots under public/d4vdgold/data/*.csv,
// transformed from the community d4vd tracker's Google-Sheet exports by
// scripts/build-d4vdgold-csvs.py. Those exports already carry real download
// URLs, so no separate link-recovery step is needed.
//
// An era only appears in the Music grid if its name is a key in
// ALBUM_RELEASE_DATES, which also filters out the sheet's changelog/footer rows.
export const d4vdgoldConfig: ArtistConfig = {
  slug: 'd4vdgold',
  SITE_NAME: 'D4VDGOLD',
  SITE_DESCRIPTION: 'The Best d4vd Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/d4vdgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'd4vdgold_',

  // Hidden from the landing grid — revealed only by searching the passphrase.
  hidden: true,
  searchAliases: ['celeste'],

  // All tabs read committed CSVs via the /api/d4vdgold/* endpoints.
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '#b3122b',
  artistLabel: 'd4vd',
  cardLetter: 'D',
  logoUrl: '',
  artistPhotoUrl: '/artists/d4vd.png',
  photoObjectPosition: 'center', // center his face in the square card crop

  getArtistName() {
    return 'd4vd';
  },

  CUSTOM_IMAGES: {},

  // Keys must match the era names in public/d4vdgold/data/unreleased.csv exactly.
  ALBUM_RELEASE_DATES: {
    'Pre-d4vd': '??/??/????',
    'The Hoodstar Diary': '??/??/????',
    'Love Is Blind': '??/??/????',
    'Untitled Rock EP': '??/??/????',
    'The Root Of It All [V1]': '??/??/????',
    'Petals To Thorns [V2]': '??/??/????',
    'Garden Of Eden': '??/??/????',
    'WITHERED': '??/??/????',
    'WITHERED Deluxe: Marcescence': '??/??/????',
    'Post-Incident': '??/??/????',
    'Unknown': '??/??/????',
  },

  HIDDEN_ALBUMS: [],

  ALBUM_DESCRIPTIONS: {
    'Pre-d4vd':
      "David \"d4vd\" Anthony Burke's earliest recordings and reference tracks, made before he began releasing music under the name d4vd.",
    'The Hoodstar Diary':
      'Early mixtape-era material from before d4vd\'s mainstream breakout.',
    'Love Is Blind':
      'The era around d4vd\'s breakout singles, including his earliest widely-known work.',
    'Untitled Rock EP':
      'Rock-leaning sessions and loose tracks from an unreleased EP project.',
    'The Root Of It All [V1]':
      'Material from The Root Of It All era.',
    'Petals To Thorns [V2]':
      'Sessions, demos and unreleased tracks surrounding the Petals To Thorns era.',
    'Garden Of Eden':
      'Unreleased material from the Garden Of Eden era.',
    'WITHERED':
      "Tracks and demos tied to d4vd's WITHERED era.",
    'WITHERED Deluxe: Marcescence':
      'The deluxe/continuation of the WITHERED era.',
    'Post-Incident':
      'The most recent era — newer sessions, snippets and loose tracks.',
    'Unknown':
      'Uncategorised and loose tracks whose era has not been confirmed.',
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  ALBUM_ORDER: [
    'Pre-d4vd',
    'The Hoodstar Diary',
    'Love Is Blind',
    'Untitled Rock EP',
    'The Root Of It All [V1]',
    'Petals To Thorns [V2]',
    'Garden Of Eden',
    'WITHERED',
    'WITHERED Deluxe: Marcescence',
    'Post-Incident',
    'Unknown',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  // Chronological fundraiser-history tab (data from data/groupbuys.csv).
  // Recent / Released / Stems / Art / Misc / Tracklists are data-driven and
  // appear automatically when their CSV/JSON returns rows. Art was later added
  // with local cover images under public/d4vdgold/art/ (see data/art.csv).
  hasGroupbuysTab: true,
};
