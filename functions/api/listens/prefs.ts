import { json, options, getSession } from '../_auth';
import { ensureListeningTables, isRecordingEnabled } from './_schema';

export const onRequestOptions = options;

// Read the current recording preference (defaults to enabled).
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  await ensureListeningTables(env.DB);
  const enabled = await isRecordingEnabled(env.DB, session.user_id);
  return json({ enabled });
};

// Toggle recording on/off.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: { enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (typeof body.enabled !== 'boolean') {
    return json({ error: 'enabled (boolean) is required' }, 400);
  }

  await ensureListeningTables(env.DB);
  await env.DB.prepare(
    `INSERT INTO listening_prefs (user_id, enabled, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`
  )
    .bind(session.user_id, body.enabled ? 1 : 0, Date.now())
    .run();

  return json({ ok: true, enabled: body.enabled });
};
