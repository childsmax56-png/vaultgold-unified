import type { ArtistConfig } from './types';

export const keemgoldConfig: ArtistConfig = {
  slug: 'keemgold',
  SITE_NAME: 'KEEMGOLD',
  SITE_DESCRIPTION: 'The Best Baby Keem Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/keemgold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'keemgold_',
  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',
  accentColor: '#84cc16',
  artistLabel: 'Baby Keem',
  cardLetter: 'BK',
  logoUrl: '/logos/keemgold.webp',
  artistPhotoUrl: '/artists/babykeem.webp',

  getArtistName() {
    return 'Baby Keem';
  },

  CUSTOM_IMAGES: {
    'DIE FOR MY BITCH': '/keemgold/eras/die-for-my-bitch.jpg',
    'Ca$ino': '/keemgold/eras/casino.jpg',
    'The Melodic Blue': '/keemgold/eras/the-melodic-blue.jpg',
    'Child With Wolves': '/keemgold/eras/child-with-wolves.jpg',
  },

  ALBUM_RELEASE_DATES: {
    'Youth': '??/??/????',
    'Regin': '??/??/????',
    'Before Baby Keem': '??/??/????',
    'Oct': '??/??/????',
    'Black Nights': '??/??/????',
    'PTNTL': '??/??/????',
    'Midnight': '??/??/????',
    'No Name': '??/??/????',
    'Hearts & Darts': '??/??/????',
    'The Sound of Bad Habit': '10/29/2018',
    'DIE FOR MY BITCH': '07/19/2019',
    'The Melodic Blue': '09/10/2021',
    'Child With Wolves': '??/??/????',
    'Ca$ino': '02/20/2026',
    'Classical Rage': '??/??/????',
  },

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {
    'Youth': "Baby Keem's first EP, released in 2016 under his birth name, Hykeem Carter. Largely lost to the internet today.",
    'Regin': 'Second early EP released under Hykeem Carter, alongside Youth. Much of it has been lost.',
    'Before Baby Keem': "Catch-all era for scattered loosies and freestyles from before Keem's stage name.",
    'Oct': 'EP released in 2017 under his birth name, one of several early projects preceding the Baby Keem name.',
    'Black Nights': 'EP released under Hykeem Carter. Like much of his early work, most of it has been lost.',
    'PTNTL': "EP released June 28, 2017, under Hykeem Carter. Largely lost aside from its name and cover art.",
    'Midnight': 'EP released in 2018 marking the point where Keem began using the Baby Keem name.',
    'No Name': 'EP released in the summer of 2018, the final project released under the Hykeem Carter name.',
    'Hearts & Darts': "Keem's first EP released as Baby Keem, in the summer of 2018.",
    'The Sound of Bad Habit': "Baby Keem's debut mixtape, released October 29, 2018, largely produced by Cardo.",
    'DIE FOR MY BITCH': 'Breakout mixtape released July 19, 2019, that built Baby Keem\'s early fanbase.',
    'The Melodic Blue': "Baby Keem's debut studio album, released September 10, 2021 via pgLang and Columbia Records, featuring Kendrick Lamar, Travis Scott, and Don Toliver.",
    'Child With Wolves': 'Long-teased project title first referenced in 2024. Keem later said the concept evolved into a separate, sadder body of work rather than becoming Ca$ino.',
    'Ca$ino': "Baby Keem's second studio album, released February 20, 2026 via pgLang and Columbia Records, featuring Kendrick Lamar and Too $hort.",
    'Classical Rage': 'Rumored title for a future Baby Keem project, teased through a private Instagram account with the bio "not album, a genre."',
  },
  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {
    // stems.csv spells the era in all-caps; normalize to match the canonical name
    // used everywhere else (released/unreleased/art/misc/recent).
    'CA$INO': 'Ca$ino',
  },
  ALBUM_ORDER: [
    'Youth',
    'Regin',
    'Before Baby Keem',
    'Oct',
    'Black Nights',
    'PTNTL',
    'Midnight',
    'No Name',
    'Hearts & Darts',
    'The Sound of Bad Habit',
    'DIE FOR MY BITCH',
    'The Melodic Blue',
    'Child With Wolves',
    'Ca$ino',
    'Classical Rage',
  ],

  TAG_MAP: {},
  TAG_TOOLTIP_MAP: {},
  ERA_THEMES: {},

  hasArtTab: true,
  hasVideosTab: false,
};
