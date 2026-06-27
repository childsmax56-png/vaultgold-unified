import type { ArtistConfig } from './types';

const SHEET_ID = '1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568';

// gviz endpoint works for public sheets without auth cookies; /export?format=csv does not
const gviz = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;

export const juicegoldConfig: ArtistConfig = {
  slug: 'juicegold',
  SITE_NAME: 'JUICEgold',
  SITE_DESCRIPTION: 'The Best Juice WRLD Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/juicegold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'juicegold_',
  HARDCODED_SHEET_ID: SHEET_ID,
  HARDCODED_SHEET_GID: '0',
  SHEET_URL_UNRELEASED: gviz('0'),
  SHEET_URL_RECENT: gviz('1558109614'),

  accentColor: '#e53e3e',
  artistLabel: 'Juice WRLD',
  cardLetter: 'JCE',
  logoUrl: '/logos/juicegold.png',
  artistPhotoUrl: '/artists/juice.webp',

  getArtistName(_eraName) { return 'Juice WRLD'; },

  CUSTOM_IMAGES: {
    'JUICED UP THE EP': 'https://i.ibb.co/DDmZhFmk/IMG-4544.jpg',
    'affliction': 'https://i.ibb.co/TJK2v2Y/IMG-4545.jpg',
    'Heartbroken In Hollywood 9 9 9': 'https://i.ibb.co/0pbCnwcz/IMG-4546.jpg',
    'JuiceWRLD 9 9 9': 'https://i.ibb.co/M5fWbfZk/IMG-4548.jpg',
    'Untitled Project': 'https://i.ibb.co/vvL9wpRj/IMG-4550.jpg',
    'NOTHINGS DIFFERENT ﹤/3': 'https://i.ibb.co/yBGGv8Bw/IMG-4549.jpg',
    'Goodbye & Good Riddance': 'https://i.ibb.co/C3QtkVWw/IMG-4551.jpg',
    'Evil Twins': 'https://i.ibb.co/WNHqYHwR/IMG-4552.jpg',
    'WRLD ON DRUGS': 'https://i.ibb.co/LzrsBYVb/IMG-4553.jpg',
    'Death Race for Love': 'https://i.ibb.co/KpbKFpvC/IMG-4554.png',
    'The Outsiders': 'https://i.ibb.co/G3tCLtkk/IMG-4555.webp',
    'Posthumous': 'https://i.ibb.co/VWT0zDCW/Juice-WRLD-Les-Ardentes-2019-cropped-2.jpg',
    'Unknown': 'https://i.ibb.co/20BSPvcY/IMG-4556.webp',
    'Ongoing': 'https://i.ibb.co/20BSPvcY/IMG-4556.webp',
  },

  ALBUM_RELEASE_DATES: {
    'JUICED UP THE EP': '01/30/2016',
    'affliction': '??/??/2016',
    'Heartbroken In Hollywood 9 9 9': '??/??/2017',
    'JuiceWRLD 9 9 9': '??/??/2017',
    'Untitled Project': '??/??/2017',
    'NOTHINGS DIFFERENT ﹤/3': '??/??/2017',
    'Goodbye & Good Riddance': '05/23/2018',
    'Evil Twins': '??/??/2018',
    'WRLD ON DRUGS': '10/19/2018',
    'Death Race for Love': '03/08/2019',
    'The Outsiders': '??/??/2019',
    'Posthumous': '??/??/2019',
    'Unknown': '??/??/????',
    'Ongoing': '??/??/????',
  },

  HIDDEN_ALBUMS: ['Unknown'],

  ALBUM_DESCRIPTIONS: {
    'JUICED UP THE EP': 'Juice WRLD\'s earliest project, released January 30, 2016 on SoundCloud as JuiceTheKidd. A collection of drug-induced freestyles from his pre-signing days.',
    'affliction': 'Early SoundCloud era material from 2016.',
    'Heartbroken In Hollywood 9 9 9': 'Pre-signing sessions from 2017.',
    'JuiceWRLD 9 9 9': 'Early 2017 sessions under the Juice WRLD name.',
    'Untitled Project': 'Unreleased 2017 project sessions.',
    'NOTHINGS DIFFERENT ﹤/3': 'Pre-debut sessions from 2017.',
    'Goodbye & Good Riddance': 'Juice WRLD\'s debut studio album, released May 23, 2018 on Grade A Productions / Interscope.',
    'Evil Twins': 'Collab era sessions from 2018.',
    'WRLD ON DRUGS': 'Collaborative album with Future, released October 19, 2018.',
    'Death Race for Love': 'Juice WRLD\'s second studio album, released March 8, 2019. Debuted at #1 on the Billboard 200.',
    'The Outsiders': 'Unreleased project from 2019.',
    'Posthumous': 'Posthumous material recorded before December 8, 2019.',
    'Unknown': 'Songs without a confirmed era.',
    'Ongoing': 'Ongoing posthumous projects.',
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},

  ERA_MAPPINGS: {
    'JUICED UP THE EP': 'JUICED UP THE EP',
    'affliction': 'affliction',
    'Heartbroken In Hollywood 9 9 9': 'Heartbroken In Hollywood 9 9 9',
    'JuiceWRLD 9 9 9': 'JuiceWRLD 9 9 9',
    'Juice WRLD 9 9 9': 'JuiceWRLD 9 9 9',
    'Untitled Project': 'Untitled Project',
    'Untitled 2017 Project': 'Untitled Project',
    'NOTHINGS DIFFERENT ﹤/3': 'NOTHINGS DIFFERENT ﹤/3',
    "NOTHING'S DIFFERENT </3": 'NOTHINGS DIFFERENT ﹤/3',
    'Goodbye & Good Riddance': 'Goodbye & Good Riddance',
    'Evil Twins': 'Evil Twins',
    'WRLD ON DRUGS': 'WRLD ON DRUGS',
    'WRLD On Drugs': 'WRLD ON DRUGS',
    'Death Race for Love': 'Death Race for Love',
    'Death Race For Love': 'Death Race for Love',
    'The Outsiders': 'The Outsiders',
    'Posthumous': 'Posthumous',
  },

  hasRecentTab: true,
  hasCompsTab: false,
  hasConcertsTab: false,

  TAG_MAP: {
    '⭐': 'Best Of',
    '🏆': 'Grails',
    '🥇': 'Wanted',
    '🏅': 'Wanted',
    '✨': 'Notable',
    '💚': 'By JUICEgold',
    '🗑️': 'Worst Of',
    '🗑': 'Worst Of',
    '🚮': 'Unwanted',
    '🤖': 'AI',
    '⁉️': 'Lost Media',
    '⁉': 'Lost Media',
    '❓': 'Unknown',
    '⭐️': 'Best Of',
  },

  ERA_THEMES: {
    'Goodbye & Good Riddance': {},
    'WRLD ON DRUGS': {},
    'Death Race for Love': {},
    'Posthumous': {},
  },

  TAG_TOOLTIP_MAP: {
    'Best Of': 'Some of the best leaks on the tracker.',
    'Grails': 'The most wanted songs that have not yet leaked in full.',
    'Wanted': 'Songs that are wanted, but not as much as Grails.',
    'Notable': 'Notable songs worth highlighting.',
    'Worst Of': 'Some of the worst leaks on the tracker.',
    'Unwanted': 'Songs we don\'t want to see leak in full.',
    'AI': 'Track contains AI vocals.',
    'Lost Media': 'Currently lost, or no link to the media is known.',
    'By JUICEgold': 'Leaks & songs added by the owner of the site.',
    'Unknown': 'Availability or status is unknown.',
  },
};
