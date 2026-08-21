// Global (cross-tracker) playlists sync.
//
// Playlists used to be per-tracker (functions/api/sync/[tracker_id].ts). They
// are now global: one set of playlists per user, mixing songs from any tracker.
// To avoid a new set of tables we reuse the existing `playlists` / `playlist_songs`
// tables under a reserved tracker_id, so per-tracker rows (and the per-tracker
// favorites sync) are untouched.
//
// Each song row also stores its source tracker slug + display image so a
// globally-mixed playlist can be played/rendered without loading that tracker.
import { json, options, getSession, generateId } from './_auth';

export const onRequestOptions = options;

// Reserved tracker_id namespace for global playlists (per-tracker ids are real
// slugs, lowercased + stripped to [a-z0-9], so this underscore key can't collide).
const GLOBAL = '__global__';

let ensured = false;
async function ensureSchema(db: D1Database): Promise<void> {
  if (ensured) return;
  // Tables already exist in prod (created out-of-band); IF NOT EXISTS makes this
  // a no-op there and bootstraps fresh/preview databases.
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tracker_id TEXT NOT NULL,
        name TEXT NOT NULL,
        cover TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS playlist_songs (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        song_name TEXT NOT NULL,
        era_name TEXT,
        url TEXT,
        position INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
      )`
    ),
  ]);
  // Idempotent migrations: global-playlist songs carry their source tracker +
  // artwork. Guarded so re-runs (and pre-existing columns in prod) are no-ops.
  try { await db.prepare(`ALTER TABLE playlist_songs ADD COLUMN tracker TEXT`).run(); } catch { /* exists */ }
  try { await db.prepare(`ALTER TABLE playlist_songs ADD COLUMN image TEXT`).run(); } catch { /* exists */ }
  try { await db.prepare(`ALTER TABLE playlist_songs ADD COLUMN artist TEXT`).run(); } catch { /* exists */ }
  ensured = true;
}

async function batchChunked(db: D1Database, stmts: D1PreparedStatement[], size = 100) {
  for (let i = 0; i < stmts.length; i += size) {
    await db.batch(stmts.slice(i, i + size));
  }
}

interface SyncSong { songName: string; eraName: string; url: string; tracker?: string; image?: string; artist?: string }
interface SyncPlaylist { id?: string; name: string; cover?: string; songs: SyncSong[]; readonly?: boolean }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  await ensureSchema(env.DB);

  const [plRows, allSongs] = await Promise.all([
    env.DB.prepare(
      'SELECT id, name, cover FROM playlists WHERE user_id = ? AND tracker_id = ? ORDER BY created_at ASC'
    ).bind(session.user_id, GLOBAL).all<{ id: string; name: string; cover: string | null }>(),

    env.DB.prepare(
      `SELECT ps.playlist_id, ps.song_name, ps.era_name, ps.url, ps.tracker, ps.image, ps.artist
       FROM playlist_songs ps
       JOIN playlists p ON p.id = ps.playlist_id
       WHERE p.user_id = ? AND p.tracker_id = ?
       ORDER BY ps.playlist_id, ps.position ASC`
    ).bind(session.user_id, GLOBAL).all<{ playlist_id: string; song_name: string; era_name: string; url: string; tracker: string | null; image: string | null; artist: string | null }>(),
  ]);

  const songsByPlaylist = new Map<string, SyncSong[]>();
  for (const s of allSongs.results) {
    const list = songsByPlaylist.get(s.playlist_id) ?? [];
    list.push({
      songName: s.song_name,
      eraName: s.era_name,
      url: s.url,
      tracker: s.tracker ?? undefined,
      image: s.image ?? undefined,
      artist: s.artist ?? undefined,
    });
    songsByPlaylist.set(s.playlist_id, list);
  }

  return json({
    playlists: plRows.results.map(pl => ({
      id: pl.id,
      name: pl.name,
      cover: pl.cover ?? undefined,
      songs: songsByPlaylist.get(pl.id) ?? [],
    })),
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  await ensureSchema(env.DB);

  let body: { playlists?: SyncPlaylist[] };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const now = Date.now();
  // Drop derived/read-only playlists (e.g. Favorites) — they are rebuilt client-side.
  const playlists = (body.playlists ?? []).filter(p => !p.readonly).slice(0, 200);

  // Replace the user's global playlists wholesale (cascade clears songs).
  await env.DB.prepare('DELETE FROM playlists WHERE user_id = ? AND tracker_id = ?')
    .bind(session.user_id, GLOBAL).run();

  const playlistsWithIds = playlists.map(pl => ({ ...pl, _id: generateId() }));

  if (playlistsWithIds.length > 0) {
    await batchChunked(env.DB, playlistsWithIds.map(pl =>
      env.DB.prepare('INSERT INTO playlists (id, user_id, tracker_id, name, cover, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(pl._id, session.user_id, GLOBAL, pl.name, pl.cover ?? null, now, now)
    ));

    const songStmts = playlistsWithIds.flatMap(pl =>
      (pl.songs ?? []).slice(0, 1000).map((s, i) =>
        env.DB.prepare('INSERT INTO playlist_songs (id, playlist_id, song_name, era_name, url, position, created_at, tracker, image, artist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(generateId(), pl._id, s.songName, s.eraName ?? '', s.url ?? '', i, now, s.tracker ?? null, s.image ?? null, s.artist ?? null)
      )
    );
    if (songStmts.length > 0) await batchChunked(env.DB, songStmts);
  }

  return json({ ok: true, playlists: playlists.length });
};
