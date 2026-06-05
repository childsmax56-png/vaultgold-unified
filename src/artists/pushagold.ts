import type { ArtistConfig } from './types';

export const pushagoldConfig: ArtistConfig = {
  slug: 'pushagold',
  SITE_NAME: 'PUSHAGOLD',
  SITE_DESCRIPTION: 'The Best Clipse / Pusha T Tracker In The World!',
  SITE_URL: 'https://vaultgold.net/pushagold/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: 'pushagold_',
  HARDCODED_SHEET_ID: '19wsRrbQxQ7sz-LhkEYUlKIcVFvXdcG1hvT58zEY03sA',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: 'https://docs.google.com/spreadsheets/d/19wsRrbQxQ7sz-LhkEYUlKIcVFvXdcG1hvT58zEY03sA/gviz/tq?tqx=out:csv&sheet=Unreleased',
  SHEET_URL_RECENT: 'https://docs.google.com/spreadsheets/d/19wsRrbQxQ7sz-LhkEYUlKIcVFvXdcG1hvT58zEY03sA/gviz/tq?tqx=out:csv&sheet=Recent',
  accentColor: '#C9A224',
  artistLabel: 'Pusha T / Clipse',
  cardLetter: 'PSH',
  logoUrl: '',

  getArtistName(eraName) {
    if (!eraName) return 'Pusha T';
    const clipseEras = ["Exclusive Audio Footage", "Lord Willin'", "Hell Hath No Fury", "Til The Casket Drops", "As God As My Witness", "Let God Sort 'Em Out"];
    return clipseEras.includes(eraName) ? 'Clipse' : 'Pusha T';
  },

  CUSTOM_IMAGES: {
    "Exclusive Audio Footage": "https://i.ibb.co/C3BcRTdG/Clipseunreleasedalbum1.jpg",
    "Lord Willin'": "https://i.ibb.co/FLqCKDtg/IMG-4313.jpg",
    "Hell Hath No Fury": "https://i.ibb.co/KStjJ5d/IMG-4322.jpg",
    "Til The Casket Drops": "https://i.ibb.co/pBnxSb7c/IMG-4329.jpg",
    "Fear of God": "https://i.ibb.co/3YWv1WZb/IMG-4335.jpg",
    "Fear of God II": "https://i.ibb.co/RT8zDxyf/IMG-4349.jpg",
    "Wrath Of Caine": "https://i.ibb.co/twmTZ0yB/IMG-4354.jpg",
    "My Name Is My Name": "https://i.ibb.co/Cp1G00s5/IMG-4363.jpg",
    "As God As My Witness": "https://i.ibb.co/k2Lp9qW6/download-2.jpg",
    "Darkest Before Dawn": "https://i.ibb.co/yc2TckmZ/IMG-4369.jpg",
    "Blowbama": "https://i.ibb.co/823mVfH/be2cwujayb011.jpg",
    "DAYTONA": "https://i.ibb.co/Kpm7HjbS/IMG-4386.jpg",
    "It's Almost Dry": "https://i.ibb.co/qLB1TLyP/IMG-4387.jpg",
    "Let God Sort 'Em Out": "https://i.ibb.co/PK9txm8/Let-God-Sort-Em-Out.jpg",
    "Ongoing": "https://i.ibb.co/27NKNNk8/Pusha-T-Spanberger-Richmond-photo-by-Breon-Corbett-RVA-Magazine-2026-2-scaled.jpg",
  },

  ALBUM_RELEASE_DATES: {
    "Exclusive Audio Footage": "??/??/1999",
    "Lord Willin'": "08/20/2002",
    "Hell Hath No Fury": "11/27/2006",
    "Til The Casket Drops": "12/08/2009",
    "Fear of God": "03/11/2011",
    "Fear of God II": "11/08/2011",
    "Wrath Of Caine": "01/28/2013",
    "My Name Is My Name": "10/08/2013",
    "As God As My Witness": "??/??/????",
    "Darkest Before Dawn": "12/18/2015",
    "Blowbama": "??/??/????",
    "DAYTONA": "05/25/2018",
    "It's Almost Dry": "04/22/2022",
    "Let God Sort 'Em Out": "07/11/2025",
    "Ongoing": "??/??/????",
  },

  HIDDEN_ALBUMS: [],

  ALBUM_DESCRIPTIONS: {
    "Exclusive Audio Footage": "In 1994 the brothers started recording together. They signed with Elektra Records in 1996. The Clipse recorded their debut album, Exclusive Audio Footage, entirely produced by The Neptunes. The single \"The Funeral\" failed to chart and the album was shelved.",
    "Lord Willin'": "Lord Willin' is the debut studio album by Clipse, released August 20, 2002. Entirely produced by The Neptunes, it received critical acclaim for its minimalist production and vivid drug-dealing lyricism.",
    "Hell Hath No Fury": "Hell Hath No Fury is the second studio album by Clipse, released November 27, 2006. After years of label disputes, it received widespread critical acclaim and is widely regarded as one of the greatest hip-hop albums of the 2000s.",
    "Til The Casket Drops": "Til the Casket Drops is the third and final studio album by Clipse, released December 8, 2009.",
    "Fear of God": "Fear of God is Pusha T's debut mixtape, released March 11, 2011.",
    "Fear of God II": "Fear of God II: Let Us Pray is Pusha T's second mixtape, released November 8, 2011.",
    "Wrath Of Caine": "Wrath of Caine is Pusha T's third and final mixtape, released January 28, 2013.",
    "My Name Is My Name": "My Name Is My Name is Pusha T's debut studio album, released October 8, 2013.",
    "Darkest Before Dawn": "Darkest Before Dawn: The Prelude is Pusha T's second studio album, released December 18, 2015.",
    "DAYTONA": "DAYTONA is Pusha T's third studio album, executive produced by Kanye West. Released May 25, 2018.",
    "It's Almost Dry": "It's Almost Dry is Pusha T's fourth studio album, released April 22, 2022.",
    "Let God Sort 'Em Out": "Let God Sort 'Em Out is Pusha T's fifth studio album.",
  },

  ALBUM_SONG_COUNTS: {},
  CUSTOM_ALBUM_INFO: {},
  ERA_MAPPINGS: {},

  TAG_MAP: {
    '⭐': 'Best Of', '🏆': 'Grails', '🥇': 'Wanted', '🏅': 'Wanted',
    '✨': 'Special', '💛': 'By PUSHAgold', '🗑️': 'Worst Of', '🗑': 'Worst Of',
    '🚮': 'Unwanted', '🤖': 'AI', '⁉️': 'Lost Media', '⁉': 'Lost Media', '❓': 'Unknown',
  },
  ERA_THEMES: {},
  TAG_TOOLTIP_MAP: {
    'Best Of': 'some of the best leaks hosted on the tracker.',
    'Grails': 'the most wanted songs that have not yet leaked in full.',
    'Wanted': 'Songs that are wanted, but not as wanted as "Grails".',
    'Special': 'special songs worth highlighting.',
    'Worst Of': 'some of the worst leaks hosted on the tracker.',
    'Unwanted': "Songs that we don't want to leak in full.",
    'AI': 'Track contains AI vocals.',
    'Lost Media': "Is currently lost, or we don't have a link to the media.",
    'By PUSHAgold': 'Leaks & Songs added by the owner of the site.',
  },
};
