import type { ArtistConfig } from './types';

// Shape of the payload returned by /api/community/config/:slug.
export interface CommunityConfigPayload {
  slug: string;
  status: string;
  community?: boolean;
  createdBy?: string;
  SITE_NAME: string;
  SITE_DESCRIPTION?: string;
  STORAGE_PREFIX?: string;
  accentColor?: string;
  logoUrl?: string;
  artistPhotoUrl?: string;
  artistLabel?: string;
  ALBUM_RELEASE_DATES?: Record<string, string>;
  ALBUM_ORDER?: string[];
  CUSTOM_IMAGES?: Record<string, string>;
  ALBUM_DESCRIPTIONS?: Record<string, string>;
}

// Build a complete runtime ArtistConfig from a community-tracker payload. Fills
// every required ArtistConfig field with an inert default so the shared <App>
// tracker view renders exactly as it does for official trackers, but without any
// official-only data sources (Google Sheets, extra tabs).
export function buildCommunityConfig(p: CommunityConfigPayload): ArtistConfig {
  const name = p.SITE_NAME || p.slug;
  return {
    slug: p.slug,
    SITE_NAME: name,
    SITE_DESCRIPTION: p.SITE_DESCRIPTION || `${name} — a community tracker on UNVAULTED`,
    SITE_URL: `https://unvaulted.cc/${p.slug}/`,
    OG_IMAGE_URL: p.logoUrl || '',
    STORAGE_PREFIX: p.STORAGE_PREFIX || `community_${p.slug}_`,

    HARDCODED_SHEET_ID: '',
    HARDCODED_SHEET_GID: '',
    SHEET_URL_UNRELEASED: '',
    SHEET_URL_RECENT: '',

    getArtistName: () => p.artistLabel || name,

    CUSTOM_IMAGES: p.CUSTOM_IMAGES || {},
    ALBUM_RELEASE_DATES: p.ALBUM_RELEASE_DATES || {},
    HIDDEN_ALBUMS: [],
    ALBUM_DESCRIPTIONS: p.ALBUM_DESCRIPTIONS || {},
    ALBUM_SONG_COUNTS: {},
    CUSTOM_ALBUM_INFO: {},
    ERA_MAPPINGS: {},
    ALBUM_ORDER: p.ALBUM_ORDER || Object.keys(p.ALBUM_RELEASE_DATES || {}),

    TAG_MAP: {},
    TAG_TOOLTIP_MAP: {},
    ERA_THEMES: {},

    // No official-only tabs — a community tracker is Music-only for now.
    hasProductionTab: false,
    hasYeditsTab: false,
    hasRecentTab: false,
    hasCompsTab: false,
    hasConcertsTab: false,
    hasSubAlbumsTab: false,
    hasArtTab: false,
    hasVideosTab: false,
    hasMiscTab: false,
    hasStemsTab: false,
    hasTracklistsTab: false,
    hasAlbumCopiesTab: false,
    hasGroupbuysTab: false,

    accentColor: p.accentColor || '#3b82f6',
    artistLabel: p.artistLabel || name,
    cardLetter: (name[0] || 'C').toUpperCase(),
    logoUrl: p.logoUrl || '',
    artistPhotoUrl: p.artistPhotoUrl || undefined,

    community: true,
    createdBy: p.createdBy,
  };
}
