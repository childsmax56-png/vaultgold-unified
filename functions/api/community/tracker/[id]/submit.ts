import { ensureCommunityTables, json, resolveUser, nowIso, type CommunityTrackerRow } from '../../_db';

// POST /api/community/tracker/:id/submit — creator submits a draft for moderator
// review. Only the creator can submit, and only from draft/rejected state. Once
// approved the tracker is edited freely (no re-review), so we never move an
// already-approved tracker back to pending.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request, params } = context;
  const id = params.id as string;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);

  await ensureCommunityTables(env.DB);
  const tracker = (await env.DB.prepare('SELECT * FROM community_trackers WHERE id = ?')
    .bind(id).first()) as CommunityTrackerRow | null;
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (tracker.user_id !== user.id) return json({ error: 'Only the creator can submit this tracker' }, 403);

  if (tracker.status === 'approved') return json({ error: 'Tracker is already approved' }, 400);
  if (tracker.status === 'pending') return json({ error: 'Tracker is already awaiting review' }, 400);
  if (tracker.status === 'removed') return json({ error: 'This tracker was removed by a moderator' }, 403);

  // Require at least one era with one song before it can be reviewed.
  const songCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM community_songs WHERE tracker_id = ?')
    .bind(id).first()) as { n: number } | null;
  if (!songCount || songCount.n === 0) {
    return json({ error: 'Add at least one song before submitting' }, 400);
  }

  await env.DB.prepare(
    `UPDATE community_trackers SET status = 'pending', submitted_at = ?, updated_at = ? WHERE id = ?`
  ).bind(nowIso(), nowIso(), id).run();

  return json({ ok: true, status: 'pending' });
};
