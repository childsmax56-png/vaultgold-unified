import { json, options } from './_auth';
import { checkOwnerOrClaim } from './_yedits-auth';

export const onRequestOptions: PagesFunction<Env> = async () => options();

// Re-credits a project to a different artist by moving its folder from
// `oldCreator/album` to `newCreator/newName` in R2. The caller must be allowed
// to edit the *source* project (owner, yeditsgold admin, approved claim, or
// collaborator). A newName is optional — omit it to keep the existing album
// name while only changing the credited artist.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { token?: string; oldFolderPath?: string; newCreator?: string; newName?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, oldFolderPath, newCreator, newName } = body;
  if (!token || !oldFolderPath || !newCreator?.trim()) return json({ error: 'Missing fields' }, 400);

  const sanitize = (s: string) => s.replace(/[/\\<>:"|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();

  const parts = oldFolderPath.split('/');
  const oldCreator = parts[0];
  const oldAlbum = parts.slice(1).join('/');
  if (!oldCreator || !oldAlbum) return json({ error: 'Invalid project path' }, 400);

  const sanitizedCreator = sanitize(newCreator);
  const sanitizedName = sanitize(newName?.trim() || oldAlbum);
  if (!sanitizedCreator || !sanitizedName) return json({ error: 'Invalid name' }, 400);

  // Must be allowed to edit the source project.
  const allowed = await checkOwnerOrClaim(token, oldCreator, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  const newFolderPath = `${sanitizedCreator}/${sanitizedName}`;
  if (newFolderPath === oldFolderPath) return json({ ok: true, folderPath: oldFolderPath });

  // Refuse to clobber an existing project at the destination.
  const collision = await context.env.YEDITS_BUCKET.list({ prefix: `${newFolderPath}/`, limit: 1 });
  if (collision.objects.length > 0) {
    return json({ error: 'A project with that artist and name already exists' }, 409);
  }

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
