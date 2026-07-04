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
    'Before Baby Keem': "The earliest period of keem's creative work before going under the name Baby Keem. He first released music independently under aliases like Hykeem Carter and HiiFii. Between 2016 and 2018, he primarily used SoundCloud to experiment with rapping and production. His first confirmed song, “Come Thru” (2016), was made at age 15 and is considered his earliest real track. In 2016, he also released “Band Remix,” a self-produced and more chaotic version of a song from the Oct EP that briefly appeared on SoundCloud.",
    'Oct': 'EP released in 2017 under his birth name, one of several early projects preceding the Baby Keem name.',
    'Black Nights': 'EP released under Hykeem Carter. Like much of his early work, most of it has been lost.',
    'PTNTL': "EP released June 28, 2017, under Hykeem Carter. Largely lost aside from its name and cover art.",
    'Midnight': 'EP released in 2018 marking the point where Keem began using the Baby Keem name.',
    'No Name': 'EP released in the summer of 2018, the final project released under the Hykeem Carter name.',
    'Hearts & Darts': "Keem's first EP released as Baby Keem, in the summer of 2018.",
    'The Sound of Bad Habit': "Following a name change from Hykeem Carter, to HiiFii, to Baby Keem, and the release of his eighth EP “Hearts and Darts”, Keem would shift his focus to the release of his first commercial mixtape, dubbed “The Sound of Bad Habit.” Along with Cardo, Kendrick Lamar would be brought in to help with the recording process; his work mostly consisted of being another ear in the room and doing reference tracks for his cousin. Despite the mixtape’s release on October 29, 2018, Kendrick Lamar remains uncredited as a writer on all streaming platforms.",
    'DIE FOR MY BITCH': "DIE FOR MY BITCH, Baby Keem’s second mixtape, arrived about eight months after his 2018 debut and included the singles “INVENTED IT,” “FRANCE FREESTYLE,” and the breakout hit “ORANGE SODA.” Around the same time, early forms of “BULLIES” were taking shape, beginning with a rough Kendrick Lamar freestyle over a different instrumental that circulated informally during London sessions. A subsequent February 2019 version kept most of the mumble‑style ideas but had an incomplete hook, abrupt ending, and scattered piano and unusual sounds.",
    'The Melodic Blue': "The Melodic Blue, Baby Keem’s debut album, was developed from late 2019 and first teased in mid‑2020, followed by early promos like hooligan / sons & critics and merch featuring track titles. Throughout 2021 he continued the rollout with “no sense,” the lead single “durag activity” with Travis Scott, and “family ties” with Kendrick Lamar. After signaling the album was nearly finished, Keem announced it was turned in at the end of August and confirmed its September release, later unveiling the artwork, release date, and tracklist in early September.",
    'Child With Wolves': "Child With Wolves was Keem’s upcoming sophomore album, after The Melodic Blue and was built from various teasers, snippets, as well as The Melodic Blue short film, after months of speculation about the title Keem confirmed the name in early 2024. Showcasing concept artwork that had an eerie aesthetic, including the interactive site eerietimes.com, though the tracklist is largely speculative. Child With Wolves eventually became Janice, then Ca$ino. However, Child With Wolves is considered separate from Ca$ino, as it’s “more of a sadder body of work”, according to Keem.",
    'Ca$ino': "Ca$ino is Baby Keem’s long-awaited sophomore studio album. The album is Keem’s first album release in five (technically four) years, following his 2021 debut, The Melodic Blue. and its deluxe version in 2022. As Keem described the title at the album’s listening party.",
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
