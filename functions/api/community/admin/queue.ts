import { ensureCommunityTables, json, resolveUser, canModerate } from '../_db';

// GET /api/community/admin/queue — trackers awaiting review, plus recently
// reviewed and approved ones so moderators can also remove live trackers.
// Moderator-only (site owner or yeditsgold admin).
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);
  await ensureCommunityTables(env.DB);
  if (!(await canModerate(env.DB, user))) return json({ error: 'Forbidden' }, 403);

  const pending = (await env.DB.prepare(
    `SELECT id, slug, name, description, username, logo_url, submitted_at, updated_at
       FROM community_trackers WHERE status = 'pending' ORDER BY submitted_at ASC`
  ).all()).results ?? [];

  const approved = (await env.DB.prepare(
    `SELECT id, slug, name, username, logo_url, reviewed_at, updated_at
       FROM community_trackers WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 100`
  ).all()).results ?? [];

  return json({ pending, approved });
};
