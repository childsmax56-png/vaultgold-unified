export interface ArtistConfig {
  // Identity
  slug: string;
  SITE_NAME: string;
  SITE_DESCRIPTION: string;
  SITE_URL: string;
  OG_IMAGE_URL: string;
  STORAGE_PREFIX: string;

  // Google Sheets sync
  HARDCODED_SHEET_ID: string;
  HARDCODED_SHEET_GID: string;
  SHEET_URL_UNRELEASED: string;
  SHEET_URL_RECENT: string;

  // Artist name resolver
  getArtistName: (eraName: string | undefined) => string;

  // Era data
  CUSTOM_IMAGES: Record<string, string>;
  ALBUM_RELEASE_DATES: Record<string, string>;
  HIDDEN_ALBUMS: string[];
  ALBUM_DESCRIPTIONS: Record<string, string>;
  ALBUM_SONG_COUNTS: Record<string, number>;
  CUSTOM_ALBUM_INFO: Record<string, string[]>;
  ERA_MAPPINGS: Record<string, string>;

  // Tags
  TAG_MAP: Record<string, string>;
  TAG_TOOLTIP_MAP: Record<string, string>;

  // Themes
  ERA_THEMES: Record<string, { topBanner?: string; bottomBanner?: string; miniPlayer?: string; fullPicturePlayer?: string }>;

  // Landing page card
  accentColor: string;
  artistLabel: string;
  cardLetter: string;
  logoUrl: string; // path to logo image, e.g. /logos/yzygold.png
}
