// Commit or clear the signed-in user's uploaded profile picture.
//
//   POST   /api/auth/avatar   → after the browser PUTs to the presigned URL,
//                               points users.avatar_url at the new object
//                               (cache-busted) and returns { avatarUrl }.
//   DELETE /api/auth/avatar   → clears users.avatar_url (removes the R2 object
//                               best-effort) and returns { ok: true }.
//
// The stored URL routes through /api/yedits-file, which streams any bucket key
// with its saved Content-Type — so the image is served with correct headers
// without a public bucket domain.
import { json, options, getSession } from '../_auth';
import { ensureProfileColumns } from './_profile-schema';

export const onRequestOptions = options;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  await ensureProfileColumns(env.DB);

  const key = `avatars/${session.user_id}`;
  // `?v=` busts the yedits-file Cache-Control on each new upload of the same key.
  const avatarUrl = `/api/yedits-file?key=${encodeURIComponent(key)}&v=${Date.now()}`;

  await env.DB.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
    .bind(avatarUrl, Date.now(), session.user_id)
    .run();

  return json({ avatarUrl });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  await ensureProfileColumns(env.DB);

  await env.DB.prepare('UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?')
    .bind(Date.now(), session.user_id)
    .run();

  // Best-effort object cleanup; the account is already updated regardless.
  try { await env.YEDITS_BUCKET?.delete(`avatars/${session.user_id}`); } catch { /* ignore */ }

  return json({ ok: true });
};
