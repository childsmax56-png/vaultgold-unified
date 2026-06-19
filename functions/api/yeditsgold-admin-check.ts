import { json } from './_auth';

const OWNER_EMAIL = 'childsmax56@gmail.com';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  let body: { token?: string };
  try { body = await context.request.json(); } catch { return json({ admin: false }); }
  if (!body.token) return json({ admin: false });

  const res = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  if (!res.ok) return json({ admin: false });
  const { user } = await res.json() as { user?: { id: string; email: string } };
  if (!user) return json({ admin: false });

  if (user.email === OWNER_EMAIL) return json({ admin: true, owner: true });

  if (!DB) return json({ admin: false });

  try {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS yeditsgold_admins (user_id TEXT PRIMARY KEY, username TEXT NOT NULL, email TEXT NOT NULL, granted_at TEXT NOT NULL)`).run();
    const row = await DB.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(user.id).first();
    return json({ admin: !!row, owner: false });
  } catch {
    return json({ admin: false });
  }
};
