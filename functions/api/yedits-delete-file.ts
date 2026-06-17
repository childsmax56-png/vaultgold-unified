export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  let body: { token?: string; key?: string };
  try {
    body = await context.request.json() as { token?: string; key?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, key } = body;
  if (!token || !key) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) {
    return json({ error: 'Unauthorized — sign in to UNVAULTED first' }, 401);
  }

  const { user: me } = await authRes.json() as { user?: { username?: string } };
  const username = me?.username?.trim();
  if (!username) {
    return json({ error: 'Could not determine your username' }, 401);
  }

  // key is "CreatorName/AlbumName/filename" — first segment must match authenticated user
  const keyCreator = key.split('/')[0].trim();
  if (keyCreator.toLowerCase() !== username.toLowerCase()) {
    return json({ error: 'You can only delete your own files' }, 403);
  }

  const obj = await YEDITS_BUCKET.get(key);
  if (!obj) {
    return json({ error: 'File not found' }, 404);
  }

  await YEDITS_BUCKET.delete(key);

  return json({ deleted: key });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
