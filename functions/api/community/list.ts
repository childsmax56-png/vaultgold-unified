import { ensureCommunityTables } from './_db';

// GET /api/community/list — public listing of approved community trackers for
// the Community section. Cached briefly at the edge.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  await ensureCommunityTables(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT slug, name, description, accent_color, logo_url, artist_photo_url, username, updated_at
       FROM community_trackers WHERE status = 'approved' ORDER BY updated_at DESC`
  ).all();

  return new Response(JSON.stringify({ trackers: results ?? [] }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
