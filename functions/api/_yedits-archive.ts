// Shared helpers for the yeditsgold "soft delete" archive.
//
// When an album is deleted we no longer purge its objects outright. Instead
// every object under the album's folder is copied to a per-deletion snapshot
// under the reserved `__archive__/<archiveId>/` prefix and the original is
// removed. A small `_archive.json` manifest records what was archived so the
// album can be listed and restored later. Nothing under `__archive__/` is ever
// surfaced by the normal listing endpoints.

export const ARCHIVE_PREFIX = '__archive__';
export const MANIFEST_NAME = '_archive.json';

export interface ArchiveManifest {
  folderPath: string;
  deletedAt: string;
  deletedBy?: string;
  keys: string[];
}

// True for any bucket key that belongs to the archive and must stay hidden
// from the public/listing views.
export function isArchivedKey(key: string): boolean {
  return key === ARCHIVE_PREFIX || key.startsWith(`${ARCHIVE_PREFIX}/`);
}

// The snapshot root for a given deletion, e.g. `__archive__/1720000000000`.
export function archiveRoot(archiveId: string): string {
  return `${ARCHIVE_PREFIX}/${archiveId}`;
}

// Where an original key lives inside a snapshot.
export function archivedKeyFor(archiveId: string, originalKey: string): string {
  return `${archiveRoot(archiveId)}/${originalKey}`;
}

export function manifestKeyFor(archiveId: string): string {
  return `${archiveRoot(archiveId)}/${MANIFEST_NAME}`;
}

// Copy a single object within the bucket by streaming get → put, preserving
// content type and any custom metadata. R2's Workers binding has no native
// server-side copy, so this is the supported approach.
export async function copyObject(
  bucket: R2Bucket,
  fromKey: string,
  toKey: string,
): Promise<boolean> {
  const obj = await bucket.get(fromKey);
  if (!obj) return false;
  await bucket.put(toKey, obj.body, {
    httpMetadata: obj.httpMetadata,
    customMetadata: obj.customMetadata,
  });
  return true;
}
