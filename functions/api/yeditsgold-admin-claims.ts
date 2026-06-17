import { json, options } from './_auth';

const ADMIN_EMAIL = 'childsmax56@gmail.com';

async function ensureTable(db: D1Database) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS yeditsgold_claims (id TEXT PRIMARY KEY, profile_name TEXT NOT NULL, user_id TEXT NOT NULL, username TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', claimed_at TEXT NOT NULL, reviewed_at TEXT, UNIQUE(profile_name))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS yeditsgold_admins (user_id TEXT PRIMARY KEY, username TEXT NOT NULL, email TEXT NOT NULL, granted_at TEXT NOT NULL)`).run();
}

async function getAdminUser(token: string, db: D1Database) {
  const res = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const { user } = await res.json() as { user?: { id: string; username: string; email: string } };
  if (!user) return null;
  if (user.email === ADMIN_EMAIL) return user;
  const row = await db.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(user.id).first();
  return row ? user : null;
}

export const onRequestOptions: PagesFunction = () => options();

// GET — list all pending claims (admin only)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token || !await getAdminUser(token, DB)) return json({ error: 'Forbidden' }, 403);

  await ensureTable(DB);

  const rows = await DB.prepare(
    `SELECT id, profile_name, user_id, username, email, status, claimed_at, reviewed_at
     FROM yeditsgold_claims ORDER BY claimed_at DESC`
  ).all();

  return json({ claims: rows.results });
};

// POST — approve or reject a claim (admin only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token || !await getAdminUser(token, DB)) return json({ error: 'Forbidden' }, 403);

  let body: { id?: string; action?: 'approve' | 'reject' };
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { id, action } = body;
  if (!id || !action || !['approve', 'reject'].includes(action)) {
    return json({ error: 'Missing id or action' }, 400);
  }

  await ensureTable(DB);

  const status = action === 'approve' ? 'approved' : 'rejected';
  const result = await DB.prepare(
    `UPDATE yeditsgold_claims SET status = ?, reviewed_at = ? WHERE id = ?`
  ).bind(status, new Date().toISOString(), id).run();

  if (result.meta.changes === 0) return json({ error: 'Claim not found' }, 404);

  return json({ ok: true, status });
};
