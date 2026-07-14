import { checkOwnerOrClaim, getAuthUser } from './_yedits-auth';
import {
  ArchiveManifest,
  archivedKeyFor,
  copyObject,
  isArchivedKey,
  manifestKeyFor,
} from './_yedits-archive';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

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

  // Never let callers touch the archive itself through the normal delete path.
  if (isArchivedKey(folderPath)) {
    return json({ error: 'Invalid project' }, 400);
  }

  const folderCreator = folderPath.split('/')[0].trim();
  const allowed = await checkOwnerOrClaim(token, folderCreator, context.env);
  if (!allowed) {
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

  // Soft delete: copy every object into a per-deletion archive snapshot, record
  // a manifest, then remove the originals. If any copy fails we roll back the
  // partial snapshot and leave the album untouched rather than lose data.
  const archiveId = String(Date.now());
  const archivedKeys: string[] = [];
  try {
    for (const key of keysToDelete) {
      const dest = archivedKeyFor(archiveId, key);
      const ok = await copyObject(YEDITS_BUCKET, key, dest);
      if (!ok) throw new Error(`Could not archive ${key}`);
      archivedKeys.push(dest);
    }

    const user = await getAuthUser(token);
    const manifest: ArchiveManifest = {
      folderPath,
      deletedAt: new Date().toISOString(),
      deletedBy: user?.username,
      keys: keysToDelete,
    };
    await YEDITS_BUCKET.put(manifestKeyFor(archiveId), JSON.stringify(manifest), {
      httpMetadata: { contentType: 'application/json' },
    });
  } catch (err) {
    // Roll back anything we managed to copy so we don't leave an orphan snapshot.
    await Promise.all(archivedKeys.map(k => YEDITS_BUCKET.delete(k).catch(() => {})));
    return json({ error: err instanceof Error ? err.message : 'Failed to archive project' }, 500);
  }

  await Promise.all(keysToDelete.map(key => YEDITS_BUCKET.delete(key)));

  return json({ deleted: keysToDelete, archived: true, archiveId });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
