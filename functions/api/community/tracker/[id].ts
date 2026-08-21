import {
  ensureCommunityTables, json, resolveUser, canEditTracker, isAllowedLink, nowIso,
  type CommunityTrackerRow,
} from '../_db';

async function loadTracker(db: D1Database, id: string): Promise<CommunityTrackerRow | null> {
  return (await db.prepare('SELECT * FROM community_trackers WHERE id = ?').bind(id).first()) as CommunityTrackerRow | null;
}

// GET /api/community/tracker/:id — full tracker (metadata + eras + songs) for editing.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const id = params.id as string;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);

  await ensureCommunityTables(env.DB);
  const tracker = await loadTracker(env.DB, id);
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (!(await canEditTracker(env.DB, tracker, user))) return json({ error: 'Forbidden' }, 403);

  const eras = (await env.DB.prepare(
    'SELECT * FROM community_eras WHERE tracker_id = ? ORDER BY sort_order, name'
  ).bind(id).all()).results ?? [];
  const songs = (await env.DB.prepare(
    'SELECT * FROM community_songs WHERE tracker_id = ? ORDER BY sort_order, name'
  ).bind(id).all()).results ?? [];

  return json({ tracker, eras, songs });
};

// PUT /api/community/tracker/:id — update tracker metadata.
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const id = params.id as string;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);

  await ensureCommunityTables(env.DB);
  const tracker = await loadTracker(env.DB, id);
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (!(await canEditTracker(env.DB, tracker, user))) return json({ error: 'Forbidden' }, 403);

  let body: { name?: string; description?: string; accentColor?: string; logoUrl?: string; artistPhotoUrl?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  if (body.name !== undefined && !body.name.trim()) return json({ error: 'Name cannot be empty' }, 400);
  if (!isAllowedLink(body.logoUrl) || !isAllowedLink(body.artistPhotoUrl)) {
    return json({ error: 'Image links must be from an allowed host' }, 400);
  }

  await env.DB.prepare(
    `UPDATE community_trackers
        SET name = COALESCE(?, name),
            description = ?,
            accent_color = ?,
            logo_url = ?,
            artist_photo_url = ?,
            updated_at = ?
      WHERE id = ?`
  ).bind(
    body.name?.trim() ?? null,
    (body.description ?? tracker.description ?? '') || null,
    (body.accentColor ?? tracker.accent_color ?? '') || null,
    (body.logoUrl ?? tracker.logo_url ?? '') || null,
    (body.artistPhotoUrl ?? tracker.artist_photo_url ?? '') || null,
    nowIso(),
    id,
  ).run();

  return json({ ok: true });
};

// DELETE /api/community/tracker/:id — delete the tracker and all its content.
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const id = params.id as string;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);

  await ensureCommunityTables(env.DB);
  const tracker = await loadTracker(env.DB, id);
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (!(await canEditTracker(env.DB, tracker, user))) return json({ error: 'Forbidden' }, 403);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM community_songs WHERE tracker_id = ?').bind(id),
    env.DB.prepare('DELETE FROM community_eras WHERE tracker_id = ?').bind(id),
    env.DB.prepare('DELETE FROM community_trackers WHERE id = ?').bind(id),
  ]);

  return json({ ok: true });
};
