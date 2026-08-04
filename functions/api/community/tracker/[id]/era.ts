import {
  ensureCommunityTables, json, resolveUser, canEditTracker, isAllowedLink, genId, nowIso,
  type CommunityTrackerRow,
} from '../../_db';

// Returns the editable tracker, or a Response to return early (auth/404/403).
async function guard(context: { env: Env; request: Request; params: Record<string, unknown> }): Promise<CommunityTrackerRow | Response> {
  const { env, request, params } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);
  await ensureCommunityTables(env.DB);
  const tracker = (await env.DB
    .prepare('SELECT * FROM community_trackers WHERE id = ?')
    .bind(params.id as string)
    .first()) as CommunityTrackerRow | null;
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (!(await canEditTracker(env.DB, tracker, user))) return json({ error: 'Forbidden' }, 403);
  return tracker;
}

function touch(env: Env, trackerId: string) {
  return env.DB.prepare('UPDATE community_trackers SET updated_at = ? WHERE id = ?').bind(nowIso(), trackerId).run();
}

// POST /api/community/tracker/:id/era — add an era.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: { name?: string; image?: string; releaseDate?: string; description?: string; sortOrder?: number };
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Era name is required' }, 400);
  if (!isAllowedLink(body.image)) return json({ error: 'Cover link must be from an allowed host' }, 400);

  const id = genId();
  try {
    await env.DB.prepare(
      `INSERT INTO community_eras (id, tracker_id, name, image, release_date, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, trackerId, name, (body.image || '').trim() || null,
      (body.releaseDate || '').trim() || null, (body.description || '').trim() || null,
      body.sortOrder ?? 0,
    ).run();
  } catch (e) {
    return json({ error: 'An era with that name already exists' }, 409);
  }
  await touch(env, trackerId);
  return json({ ok: true, id });
};

// PUT /api/community/tracker/:id/era — update an era (body.eraId required).
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: { eraId?: string; name?: string; image?: string; releaseDate?: string; description?: string; sortOrder?: number };
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  if (!body.eraId) return json({ error: 'eraId required' }, 400);
  if (body.name !== undefined && !body.name.trim()) return json({ error: 'Era name cannot be empty' }, 400);
  if (!isAllowedLink(body.image)) return json({ error: 'Cover link must be from an allowed host' }, 400);

  await env.DB.prepare(
    `UPDATE community_eras
        SET name = COALESCE(?, name), image = ?, release_date = ?, description = ?, sort_order = COALESCE(?, sort_order)
      WHERE id = ? AND tracker_id = ?`
  ).bind(
    body.name?.trim() ?? null, (body.image || '').trim() || null,
    (body.releaseDate || '').trim() || null, (body.description || '').trim() || null,
    body.sortOrder ?? null, body.eraId, trackerId,
  ).run();
  await touch(env, trackerId);
  return json({ ok: true });
};

// DELETE /api/community/tracker/:id/era — delete an era + its songs (body.eraId required).
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: { eraId?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  if (!body.eraId) return json({ error: 'eraId required' }, 400);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM community_songs WHERE era_id = ? AND tracker_id = ?').bind(body.eraId, trackerId),
    env.DB.prepare('DELETE FROM community_eras WHERE id = ? AND tracker_id = ?').bind(body.eraId, trackerId),
  ]);
  await touch(env, trackerId);
  return json({ ok: true });
};
