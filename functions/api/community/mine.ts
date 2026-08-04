import { ensureCommunityTables, json, resolveUser } from './_db';

// GET /api/community/mine — every tracker the caller created, any status.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in to view your trackers' }, 401);

  await ensureCommunityTables(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT id, slug, name, description, accent_color, logo_url, status, updated_at, review_note
       FROM community_trackers WHERE user_id = ? ORDER BY updated_at DESC`
  ).bind(user.id).all();

  return json({ trackers: results ?? [] });
};
