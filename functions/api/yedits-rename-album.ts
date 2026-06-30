import { json, options } from './_auth';
import { checkOwnerOrClaim } from './_yedits-auth';

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
