import { json, options, hashPassword, generateToken, generateId, SESSION_TTL_MS } from '../_auth';

export const onRequestOptions = options;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { username?: string; email?: string; password?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password } = body;
  // Users pick their own custom username; keep the exact casing they choose as
  // the display name, and match uniqueness/login case-insensitively.
  const username = body.username?.trim() ?? '';
  if (!username || !email || !password) return json({ error: 'Missing fields' }, 400);
  if (username.length < 3 || username.length > 32) return json({ error: 'Username must be 3–32 characters' }, 400);
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return json({ error: 'Username may only contain letters, numbers, _, ., -' }, 400);
  if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE LOWER(username) = ? OR email = ?'
  ).bind(username.toLowerCase(), email.toLowerCase()).first();
  if (existing) return json({ error: 'Username or email already taken' }, 409);

  const id = generateId();
  const now = Date.now();
  const hash = await hashPassword(password);

  await env.DB.prepare(
    'INSERT INTO users (id, username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, username, email.toLowerCase(), hash, now, now).run();

  const token = generateToken();
  await env.DB.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(token, id, now + SESSION_TTL_MS, now).run();

  return json({ token, user: { id, username, email: email.toLowerCase() } }, 201);
};
