import {
  ensureCommunityTables, json, resolveUser, canEditTracker,
  type CommunityTrackerRow, type CommunityEraRow,
} from '../_db';

// GET /api/community/config/:slug — returns the config payload the frontend
// merges over communityConfigBase to build a runtime ArtistConfig. Approved
// trackers resolve publicly; draft/pending/rejected resolve only for the
// creator or a moderator (preview), authenticated by bearer token.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const slug = (params.slug as string).toLowerCase();

  await ensureCommunityTables(env.DB);
  const tracker = (await env.DB.prepare('SELECT * FROM community_trackers WHERE slug = ?')
    .bind(slug).first()) as CommunityTrackerRow | null;
  if (!tracker) return json({ error: 'Not found' }, 404);

  if (tracker.status !== 'approved') {
    // Preview path — must be the creator or a moderator.
    const user = await resolveUser(request);
    if (!user || !(await canEditTracker(env.DB, tracker, user))) {
      return json({ error: 'Not found' }, 404);
    }
  }

  const eras = ((await env.DB.prepare(
    'SELECT * FROM community_eras WHERE tracker_id = ? ORDER BY sort_order, name'
  ).bind(tracker.id).all()).results ?? []) as CommunityEraRow[];

  // Which content tabs actually have entries — drives which tabs the frontend
  // config enables (so an empty Art/Stems tab never shows).
  const tabRows = ((await env.DB.prepare(
    'SELECT DISTINCT tab FROM community_songs WHERE tracker_id = ?'
  ).bind(tracker.id).all()).results ?? []) as { tab: string }[];
  const contentTabs = tabRows.map((r) => r.tab);

  const ALBUM_RELEASE_DATES: Record<string, string> = {};
  const CUSTOM_IMAGES: Record<string, string> = {};
  const ALBUM_DESCRIPTIONS: Record<string, string> = {};
  const ALBUM_ORDER: string[] = [];
  for (const era of eras) {
    ALBUM_ORDER.push(era.name);
    ALBUM_RELEASE_DATES[era.name] = era.release_date || '??/??/????';
    if (era.image) CUSTOM_IMAGES[era.name] = era.image;
    if (era.description) ALBUM_DESCRIPTIONS[era.name] = era.description;
  }

  const payload = {
    slug: tracker.slug,
    status: tracker.status,
    community: true,
    createdBy: tracker.username,
    SITE_NAME: tracker.name,
    SITE_DESCRIPTION: tracker.description || `${tracker.name} — a community tracker on UNVAULTED`,
    STORAGE_PREFIX: `community_${tracker.slug}_`,
    accentColor: tracker.accent_color || '#3b82f6',
    logoUrl: tracker.logo_url || '',
    artistPhotoUrl: tracker.artist_photo_url || '',
    artistLabel: tracker.name,
    ALBUM_RELEASE_DATES,
    ALBUM_ORDER,
    CUSTOM_IMAGES,
    ALBUM_DESCRIPTIONS,
    contentTabs,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': tracker.status === 'approved' ? 'public, max-age=60' : 'no-store',
    },
  });
};
