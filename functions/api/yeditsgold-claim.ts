import { json, options } from './_auth';

const ADMIN_EMAIL = 'childsmax56@gmail.com';

async function ensureTable(db: D1Database) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS yeditsgold_claims (id TEXT PRIMARY KEY, profile_name TEXT NOT NULL, user_id TEXT NOT NULL, username TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', claimed_at TEXT NOT NULL, reviewed_at TEXT, UNIQUE(profile_name))`
  ).run();
}

export const onRequestOptions: PagesFunction = () => options();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) return json({ error: 'DB not configured' }, 500);

    let body: { token?: string; profileName?: string };
    try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const { token, profileName } = body;
    if (!token || !profileName?.trim()) return json({ error: 'Missing token or profileName' }, 400);

    const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!authRes.ok) return json({ error: 'Unauthorized — sign in first' }, 401);

    const user = await authRes.json() as { id: string; username: string; email: string };

    await ensureTable(DB);

    const existing = await DB.prepare(
      'SELECT status, username FROM yeditsgold_claims WHERE profile_name = ?'
    ).bind(profileName.trim()).first<{ status: string; username: string }>();

    if (existing) {
      if (existing.status === 'approved') {
        return json({ error: `This profile has already been claimed by ${existing.username}` }, 409);
      }
      if (existing.status === 'pending') {
        return json({ error: 'A claim for this profile is already pending review' }, 409);
      }
    }

    const id = crypto.randomUUID();
    await DB.prepare(
      `INSERT OR REPLACE INTO yeditsgold_claims (id, profile_name, user_id, username, email, status, claimed_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    ).bind(id, profileName.trim(), user.id, user.username, user.email, new Date().toISOString()).run();

    return json({ ok: true, message: 'Claim submitted — pending admin approval' });
  } catch (err) {
    return json({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }
};
