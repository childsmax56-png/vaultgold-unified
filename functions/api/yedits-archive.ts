import { checkOwnerOrClaim } from './_yedits-auth';
import {
  ARCHIVE_PREFIX,
  ArchiveManifest,
  MANIFEST_NAME,
} from './_yedits-archive';

// Lists archived (soft-deleted) albums the caller is allowed to restore, newest
// first. One entry per deletion snapshot, read from its manifest.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  const url = new URL(context.request.url);
  const token = url.searchParams.get('token')
    ?? context.request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    ?? '';
  if (!token) return json({ error: 'Missing token' }, 401);

  // Gather every snapshot manifest under the archive prefix.
  const manifestKeys: string[] = [];
  let cursor: string | undefined;
  do {
    const listing = await YEDITS_BUCKET.list({ prefix: `${ARCHIVE_PREFIX}/`, cursor });
    for (const obj of listing.objects) {
      if (obj.key.endsWith(`/${MANIFEST_NAME}`)) manifestKeys.push(obj.key);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  // Cache authorization per creator so we don't re-hit the auth service for
  // every snapshot of the same profile.
  const allowedByCreator = new Map<string, boolean>();
  const canRestore = async (creator: string): Promise<boolean> => {
    const cached = allowedByCreator.get(creator);
    if (cached !== undefined) return cached;
    const ok = await checkOwnerOrClaim(token, creator, context.env);
    allowedByCreator.set(creator, ok);
    return ok;
  };

  const entries: Array<{
    archiveId: string;
    folderPath: string;
    displayName: string;
    creator: string;
    deletedAt: string;
    deletedBy?: string;
    fileCount: number;
  }> = [];

  for (const mKey of manifestKeys) {
    // __archive__/<archiveId>/_archive.json
    const archiveId = mKey.slice(ARCHIVE_PREFIX.length + 1, mKey.length - MANIFEST_NAME.length - 1);
    const obj = await YEDITS_BUCKET.get(mKey);
    if (!obj) continue;
    let manifest: ArchiveManifest;
    try {
      manifest = JSON.parse(await obj.text()) as ArchiveManifest;
    } catch {
      continue;
    }

    const creator = manifest.folderPath.split('/')[0];
    if (!(await canRestore(creator))) continue;

    entries.push({
      archiveId,
      folderPath: manifest.folderPath,
      displayName: manifest.folderPath.split('/').slice(1).join('/') || manifest.folderPath,
      creator,
      deletedAt: manifest.deletedAt,
      deletedBy: manifest.deletedBy,
      fileCount: manifest.keys.length,
    });
  }

  entries.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

  return json(entries);
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
