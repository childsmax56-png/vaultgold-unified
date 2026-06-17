import { json, options } from './_auth';

const OWNER_EMAIL = 'childsmax56@gmail.com';

async function ensureTables(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS yeditsgold_admin_keys (
      key TEXT PRIMARY KEY,
      label TEXT,
      created_at TEXT NOT NULL,
      used_by_user_id TEXT,
      used_by_username TEXT,
      used_at TEXT
    );
    CREATE TABLE IF NOT EXISTS yeditsgold_admins (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      granted_at TEXT NOT NULL
    );
  `);
}

async function getUser(token: string) {
  const res = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; username: string; email: string }>;
}

async function isAdmin(db: D1Database, user: { id: string; email: string }) {
  if (user.email === OWNER_EMAIL) return true;
  const row = await db.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(user.id).first();
  return !!row;
}

export const onRequestOptions: PagesFunction = () => options();

// GET — list all keys + admins (owner only)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);
  const user = await getUser(token);
  if (!user || user.email !== OWNER_EMAIL) return json({ error: 'Forbidden' }, 403);

  await ensureTables(DB);

  const [keysRes, adminsRes] = await Promise.all([
    DB.prepare('SELECT * FROM yeditsgold_admin_keys ORDER BY created_at DESC').all(),
    DB.prepare('SELECT * FROM yeditsgold_admins ORDER BY granted_at DESC').all(),
  ]);

  return json({ keys: keysRes.results, admins: adminsRes.results });
};

// POST action=generate — create a new one-time key (owner only)
// POST action=revoke  — remove an admin by user_id (owner only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);
  const user = await getUser(token);
  if (!user || user.email !== OWNER_EMAIL) return json({ error: 'Forbidden' }, 403);

  let body: { action?: string; label?: string; userId?: string };
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  await ensureTables(DB);

  if (body.action === 'generate') {
    const key = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 24);
    const formatted = `${key.slice(0,6)}-${key.slice(6,12)}-${key.slice(12,18)}-${key.slice(18,24)}`;
    await DB.prepare(
      'INSERT INTO yeditsgold_admin_keys (key, label, created_at) VALUES (?, ?, ?)'
    ).bind(formatted, body.label?.trim() || null, new Date().toISOString()).run();
    return json({ key: formatted });
  }

  if (body.action === 'revoke' && body.userId) {
    await DB.prepare('DELETE FROM yeditsgold_admins WHERE user_id = ?').bind(body.userId).run();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
};

// PUT — redeem a key (any logged-in user)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  if (!DB) return json({ error: 'DB not configured' }, 500);

  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);
  const user = await getUser(token);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body: { key?: string };
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.key?.trim()) return json({ error: 'Missing key' }, 400);

  await ensureTables(DB);

  // Already an admin?
  if (await isAdmin(DB, user)) return json({ error: 'You already have admin access' }, 409);

  const keyRow = await DB.prepare(
    'SELECT key, used_at FROM yeditsgold_admin_keys WHERE key = ?'
  ).bind(body.key.trim().toUpperCase()).first<{ key: string; used_at: string | null }>();

  if (!keyRow) return json({ error: 'Invalid key' }, 404);
  if (keyRow.used_at) return json({ error: 'This key has already been used' }, 409);

  const now = new Date().toISOString();

  await Promise.all([
    DB.prepare(
      'UPDATE yeditsgold_admin_keys SET used_by_user_id = ?, used_by_username = ?, used_at = ? WHERE key = ?'
    ).bind(user.id, user.username, now, keyRow.key).run(),
    DB.prepare(
      'INSERT OR REPLACE INTO yeditsgold_admins (user_id, username, email, granted_at) VALUES (?, ?, ?, ?)'
    ).bind(user.id, user.username, user.email, now).run(),
  ]);

  return json({ ok: true, message: `Admin access granted to @${user.username}` });
};
