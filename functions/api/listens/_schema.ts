// Shared schema bootstrap for the personal listening-history feature.
// Tables are created lazily on first use, matching the inline-DDL pattern used
// elsewhere in this codebase (e.g. yeditsgold_claims).

let ensured = false;

export async function ensureListeningTables(db: D1Database): Promise<void> {
  if (ensured) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS listening_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        artist_slug TEXT,
        era_name TEXT,
        track TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        song_url TEXT,
        duration_sec INTEGER,
        played_at INTEGER NOT NULL
      )`
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_listening_user_time
        ON listening_history(user_id, played_at)`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS listening_prefs (
        user_id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at INTEGER NOT NULL
      )`
    ),
  ]);
  ensured = true;
}

// Recording is opt-in but defaults ON: a user with no row is treated as enabled.
export async function isRecordingEnabled(db: D1Database, userId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT enabled FROM listening_prefs WHERE user_id = ?')
    .bind(userId)
    .first<{ enabled: number }>();
  return row ? row.enabled === 1 : true;
}
