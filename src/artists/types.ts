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
  ALBUM_ORDER?: string[]; // explicit era order, overrides Object.keys(ALBUM_RELEASE_DATES) which hoists integer-named keys

  // Tags
  TAG_MAP: Record<string, string>;
  TAG_TOOLTIP_MAP: Record<string, string>;

  // Themes
  ERA_THEMES: Record<string, { topBanner?: string; bottomBanner?: string; miniPlayer?: string; fullPicturePlayer?: string }>;

  // Optional tabs
  hasProductionTab?: boolean;
  hasYeditsTab?: boolean;
  hasRecentTab?: boolean;
  hasCompsTab?: boolean;
  hasConcertsTab?: boolean;
  hasSubAlbumsTab?: boolean;
  SHEET_URL_RECENT_PRODUCTION?: string; // CSV export URL for a second recent tab (production projects)
  productionFirst?: boolean; // show Production Projects before Music in navbar
  productionSecond?: boolean; // show Production Projects second (right after Music) in navbar

  // Albums to exclude from all views (neither Music nor Related)
  EXCLUDED_ALBUMS?: string[];

  // Landing page card
  accentColor: string;
  artistLabel: string;
  cardLetter: string;
  logoUrl: string; // path to logo image, e.g. /logos/yzygold.png
  navLogoUrl?: string; // optional override logo for the navbar
  artistPhotoUrl?: string; // optional artist photo for landing page cards

  // Artist-specific loading screens (overrides the default set)
  loadingScreens?: { id: string; label: string; type: 'none' | 'gif' | 'video'; url?: string }[];
}
