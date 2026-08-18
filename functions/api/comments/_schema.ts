// Schema bootstrap for the per-entry comment threads.
//
// A "comment" is attached to a single catalog entry — any song/stem/art/video/
// fake/misc row — identified by (tracker_id, entry_key). The entry_key is a
// stable string the client builds from the entry's tab + era + name, so the
// same thread shows up wherever that entry is rendered. Tables are created
// lazily with CREATE TABLE IF NOT EXISTS, matching the pattern used by the
// listening + community features.
let ensured = false;

export async function ensureCommentTables(db: D1Database): Promise<void> {
  if (ensured) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS entry_comments (
        id TEXT PRIMARY KEY,
        tracker_id TEXT NOT NULL,
        entry_key TEXT NOT NULL,
        entry_label TEXT,
        entry_type TEXT,
        parent_id TEXT,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0
      )`
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_entry_comments_lookup
        ON entry_comments(tracker_id, entry_key, created_at)`
    ),
  ]);
  ensured = true;
}

// Normalize a client-supplied tracker slug to the same shape used elsewhere.
export function normTracker(raw: string): string {
  return (raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
}
