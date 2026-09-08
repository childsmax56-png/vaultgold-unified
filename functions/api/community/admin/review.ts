import { ensureCommunityTables, json, resolveUser, canModerate, nowIso, type CommunityTrackerRow } from '../_db';

// POST /api/community/admin/review — moderator approves/rejects a pending tracker
// or removes (takes down) any tracker. Body: { id, action, note? }.
// action ∈ 'approve' | 'reject' | 'remove'.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);
  await ensureCommunityTables(env.DB);
  if (!(await canModerate(env.DB, user))) return json({ error: 'Forbidden' }, 403);

  let body: { id?: string; action?: string; note?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const { id, action } = body;
  if (!id || !action) return json({ error: 'id and action are required' }, 400);
  if (!['approve', 'reject', 'remove'].includes(action)) return json({ error: 'Invalid action' }, 400);

  const tracker = (await env.DB.prepare('SELECT * FROM community_trackers WHERE id = ?')
    .bind(id).first()) as CommunityTrackerRow | null;
  if (!tracker) return json({ error: 'Not found' }, 404);

  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'removed';
  const now = nowIso();
  await env.DB.prepare(
    `UPDATE community_trackers
        SET status = ?, reviewed_at = ?, reviewed_by = ?, review_note = ?, updated_at = ?
      WHERE id = ?`
  ).bind(status, now, user.username, (body.note || '').trim() || null, now, id).run();

  return json({ ok: true, status });
};
