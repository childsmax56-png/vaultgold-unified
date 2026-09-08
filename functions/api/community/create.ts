import {
  ensureCommunityTables, isSlugAvailable, isAllowedLink, genId, nowIso, json,
  resolveUser, type CommunityTrackerRow,
} from './_db';

// POST /api/community/create — start a new draft tracker owned by the caller.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in to create a tracker' }, 401);

  let body: {
    slug?: string; name?: string; description?: string;
    accentColor?: string; logoUrl?: string; artistPhotoUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const slug = (body.slug || '').trim().toLowerCase();
  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Tracker name is required' }, 400);

  await ensureCommunityTables(env.DB);

  const avail = await isSlugAvailable(env.DB, slug);
  if (!avail.ok) return json({ error: avail.reason }, 409);

  if (!isAllowedLink(body.logoUrl) || !isAllowedLink(body.artistPhotoUrl)) {
    return json({ error: 'Image links must be from an allowed host (imgur, ibb, pillowcase, pixeldrain)' }, 400);
  }

  const now = nowIso();
  const row: CommunityTrackerRow = {
    id: genId(),
    slug,
    user_id: user.id,
    username: user.username,
    name,
    description: (body.description || '').trim() || null,
    accent_color: (body.accentColor || '').trim() || null,
    logo_url: (body.logoUrl || '').trim() || null,
    artist_photo_url: (body.artistPhotoUrl || '').trim() || null,
    status: 'draft',
    submitted_at: null,
    reviewed_at: null,
    reviewed_by: null,
    review_note: null,
    created_at: now,
    updated_at: now,
  };

  await env.DB.prepare(
    `INSERT INTO community_trackers
      (id, slug, user_id, username, name, description, accent_color, logo_url, artist_photo_url, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  ).bind(
    row.id, row.slug, row.user_id, row.username, row.name, row.description,
    row.accent_color, row.logo_url, row.artist_photo_url, row.created_at, row.updated_at,
  ).run();

  return json({ ok: true, tracker: row });
};
