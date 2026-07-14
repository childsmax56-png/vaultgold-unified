import { checkOwnerOrClaim } from './_yedits-auth';
import {
  ArchiveManifest,
  archivedKeyFor,
  archiveRoot,
  copyObject,
  manifestKeyFor,
} from './_yedits-archive';

// Restores a soft-deleted album from its archive snapshot back to its original
// folder, then clears the snapshot.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  let body: { token?: string; archiveId?: string };
  try {
    body = await context.request.json() as { token?: string; archiveId?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, archiveId } = body;
  if (!token || !archiveId) return json({ error: 'Missing required fields' }, 400);
  if (!/^\d+$/.test(archiveId)) return json({ error: 'Invalid archive id' }, 400);

  const manifestObj = await YEDITS_BUCKET.get(manifestKeyFor(archiveId));
  if (!manifestObj) return json({ error: 'Archived project not found' }, 404);

  let manifest: ArchiveManifest;
  try {
    manifest = JSON.parse(await manifestObj.text()) as ArchiveManifest;
  } catch {
    return json({ error: 'Corrupt archive manifest' }, 500);
  }

  const creator = manifest.folderPath.split('/')[0].trim();
  const allowed = await checkOwnerOrClaim(token, creator, context.env);
  if (!allowed) return json({ error: 'You can only restore your own projects' }, 403);

  // Refuse to clobber a live album that now occupies the same folder (e.g. it
  // was re-created after deletion).
  const prefix = manifest.folderPath.endsWith('/') ? manifest.folderPath : `${manifest.folderPath}/`;
  const existing = await YEDITS_BUCKET.list({ prefix, limit: 1 });
  if (existing.objects.length > 0) {
    return json({ error: 'An album already exists at that location' }, 409);
  }

  // Copy each archived object back to its original key.
  const restored: string[] = [];
  const failed: string[] = [];
  for (const key of manifest.keys) {
    const from = archivedKeyFor(archiveId, key);
    const ok = await copyObject(YEDITS_BUCKET, from, key);
    if (ok) restored.push(key);
    else failed.push(key);
  }

  // Only tear down the snapshot once everything is safely back. If anything
  // failed to copy, keep the archive intact so the restore can be retried.
  if (failed.length > 0) {
    return json({
      error: `Restored ${restored.length} of ${manifest.keys.length} file(s); the rest could not be recovered. The archive was kept so you can retry.`,
      restored,
      failed,
    }, 500);
  }

  // Clear the entire snapshot (archived copies + manifest).
  const toClear: string[] = [];
  let cursor: string | undefined;
  do {
    const listing = await YEDITS_BUCKET.list({ prefix: `${archiveRoot(archiveId)}/`, cursor });
    for (const obj of listing.objects) toClear.push(obj.key);
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
  await Promise.all(toClear.map(k => YEDITS_BUCKET.delete(k).catch(() => {})));

  return json({ restored, folderPath: manifest.folderPath });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
