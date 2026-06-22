const OWNER_EMAIL = 'childsmax56@gmail.com';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET, DB } = context.env;

  let body: { token?: string; folderPath?: string };
  try {
    body = await context.request.json() as { token?: string; folderPath?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, folderPath } = body;
  if (!token || !folderPath) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) {
    return json({ error: 'Unauthorized — sign in to UNVAULTED first' }, 401);
  }

  const { user: me } = await authRes.json() as { user?: { id?: string; username?: string; email?: string } };
  const username = me?.username?.trim();
  const userId = me?.id;
  if (!username || !userId) {
    return json({ error: 'Could not determine your username' }, 401);
  }

  const folderCreator = folderPath.split('/')[0].trim();
  const nameMatch = folderCreator.toLowerCase() === username.toLowerCase();

  // Also allow if the user has an approved claim on this profile
  let claimMatch = false;
  if (!nameMatch && DB) {
    const claim = await DB.prepare(
      `SELECT user_id FROM yeditsgold_claims WHERE profile_name = ? AND status = 'approved' AND user_id = ?`
    ).bind(folderCreator, userId).first();
    claimMatch = !!claim;
  }

  // Also allow yeditsgold admins/owner to delete any project
  let isAdmin = false;
  if (!nameMatch && !claimMatch) {
    isAdmin = me?.email === OWNER_EMAIL;
    if (!isAdmin && DB) {
      const admin = await DB.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(userId).first();
      isAdmin = !!admin;
    }
  }

  if (!nameMatch && !claimMatch && !isAdmin) {
    return json({ error: 'You can only delete your own projects' }, 403);
  }

  // List all objects under this folder prefix
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  let cursor: string | undefined;
  const keysToDelete: string[] = [];

  do {
    const listing = await YEDITS_BUCKET.list({ prefix, cursor });
    for (const obj of listing.objects) {
      keysToDelete.push(obj.key);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  if (keysToDelete.length === 0) {
    return json({ error: 'No files found for that project' }, 404);
  }

  await Promise.all(keysToDelete.map(key => YEDITS_BUCKET.delete(key)));

  return json({ deleted: keysToDelete });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
