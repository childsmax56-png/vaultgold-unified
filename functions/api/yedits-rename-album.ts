import { json, options } from './_auth';

const OWNER_EMAIL = 'childsmax56@gmail.com';

async function checkOwnerOrClaim(token: string, creatorName: string, env: Env): Promise<boolean> {
  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) return false;
  const authData = await authRes.json() as { user?: { id: string; username: string; email: string } };
  const user = authData.user;
  if (!user) return false;

  if (user.email === OWNER_EMAIL) return true;
  if (user.username.toLowerCase() === creatorName.toLowerCase()) return true;

  const adminRow = await env.DB.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(user.id).first();
  if (adminRow) return true;

  const claim = await env.DB.prepare(
    `SELECT user_id FROM yeditsgold_claims WHERE profile_name = ? AND status = 'approved' AND user_id = ?`
  ).bind(creatorName, user.id).first();
  return !!claim;
}

export const onRequestOptions: PagesFunction<Env> = async () => options();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { token?: string; oldFolderPath?: string; newName?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, oldFolderPath, newName } = body;
  if (!token || !oldFolderPath || !newName?.trim()) return json({ error: 'Missing fields' }, 400);

  const sanitizedName = newName.trim().replace(/[/\\<>:"|?*\x00-\x1f]/g, '').trim();
  if (!sanitizedName) return json({ error: 'Invalid project name' }, 400);

  const creatorName = oldFolderPath.split('/')[0];
  const allowed = await checkOwnerOrClaim(token, creatorName, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  const newFolderPath = `${creatorName}/${sanitizedName}`;
  if (newFolderPath === oldFolderPath) return json({ ok: true, folderPath: oldFolderPath });

  const prefix = `${oldFolderPath}/`;
  let cursor: string | undefined;
  const keysToMove: string[] = [];

  do {
    const listing = await context.env.YEDITS_BUCKET.list({ prefix, cursor });
    for (const obj of listing.objects) keysToMove.push(obj.key);
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  if (keysToMove.length === 0) return json({ error: 'No files found' }, 404);

  await Promise.all(keysToMove.map(async oldKey => {
    const filename = oldKey.substring(prefix.length);
    const newKey = `${newFolderPath}/${filename}`;
    const obj = await context.env.YEDITS_BUCKET.get(oldKey);
    if (!obj) return;
    const buf = await obj.arrayBuffer();
    await context.env.YEDITS_BUCKET.put(newKey, buf, { httpMetadata: obj.httpMetadata });
    await context.env.YEDITS_BUCKET.delete(oldKey);
  }));

  return json({ ok: true, folderPath: newFolderPath });
};
