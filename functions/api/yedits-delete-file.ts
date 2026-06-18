export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET, DB } = context.env;

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

  const { user: me } = await authRes.json() as { user?: { id?: string; username?: string } };
  const username = me?.username?.trim();
  const userId = me?.id;
  if (!username || !userId) {
    return json({ error: 'Could not determine your username' }, 401);
  }

  const keyCreator = key.split('/')[0].trim();
  const nameMatch = keyCreator.toLowerCase() === username.toLowerCase();

  let claimMatch = false;
  if (!nameMatch && DB) {
    const claim = await DB.prepare(
      `SELECT user_id FROM yeditsgold_claims WHERE profile_name = ? AND status = 'approved' AND user_id = ?`
    ).bind(keyCreator, userId).first();
    claimMatch = !!claim;
  }

  if (!nameMatch && !claimMatch) {
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
