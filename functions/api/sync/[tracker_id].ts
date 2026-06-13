import { json, options, getSession, generateId } from '../_auth';

export const onRequestOptions = options;

async function batchChunked(db: D1Database, stmts: D1PreparedStatement[], size = 100) {
  for (let i = 0; i < stmts.length; i += size) {
    await db.batch(stmts.slice(i, i + size));
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const trackerId = (params.tracker_id as string).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trackerId) return json({ error: 'Invalid tracker' }, 400);

  // Fetch all data in 3 parallel queries instead of 1+N
  const [favs, plRows, allSongs] = await Promise.all([
    env.DB.prepare(
      'SELECT song_name, era_name, url FROM favorites WHERE user_id = ? AND tracker_id = ? ORDER BY created_at ASC'
    ).bind(session.user_id, trackerId).all<{ song_name: string; era_name: string; url: string }>(),

    env.DB.prepare(
      'SELECT id, name, cover FROM playlists WHERE user_id = ? AND tracker_id = ? ORDER BY created_at ASC'
    ).bind(session.user_id, trackerId).all<{ id: string; name: string; cover: string | null }>(),

    env.DB.prepare(
      `SELECT ps.playlist_id, ps.song_name, ps.era_name, ps.url
       FROM playlist_songs ps
       JOIN playlists p ON p.id = ps.playlist_id
       WHERE p.user_id = ? AND p.tracker_id = ?
       ORDER BY ps.playlist_id, ps.position ASC`
    ).bind(session.user_id, trackerId).all<{ playlist_id: string; song_name: string; era_name: string; url: string }>(),
  ]);

  const songsByPlaylist = new Map<string, { songName: string; eraName: string; url: string }[]>();
  for (const s of allSongs.results) {
    const list = songsByPlaylist.get(s.playlist_id) ?? [];
    list.push({ songName: s.song_name, eraName: s.era_name, url: s.url });
    songsByPlaylist.set(s.playlist_id, list);
  }

  return json({
    favorites: favs.results.map(f => ({ songName: f.song_name, eraName: f.era_name, url: f.url })),
    playlists: plRows.results.map(pl => ({
      id: pl.id,
      name: pl.name,
      cover: pl.cover ?? undefined,
      songs: songsByPlaylist.get(pl.id) ?? [],
    })),
  });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const trackerId = (params.tracker_id as string).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trackerId) return json({ error: 'Invalid tracker' }, 400);

  let body: {
    favorites?: { songName: string; eraName: string; url: string }[];
    playlists?: { id?: string; name: string; cover?: string; songs: { songName: string; eraName: string; url: string }[] }[];
  };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const now = Date.now();
  const favorites = (body.favorites ?? []).slice(0, 2000);
  const playlists = (body.playlists ?? []).slice(0, 200);

  // Delete both in parallel (cascade handles playlist_songs)
  await Promise.all([
    env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND tracker_id = ?')
      .bind(session.user_id, trackerId).run(),
    env.DB.prepare('DELETE FROM playlists WHERE user_id = ? AND tracker_id = ?')
      .bind(session.user_id, trackerId).run(),
  ]);

  // Batch insert favorites (chunked to stay within D1 limits)
  if (favorites.length > 0) {
    await batchChunked(env.DB, favorites.map(f =>
      env.DB.prepare('INSERT INTO favorites (id, user_id, tracker_id, song_name, era_name, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(generateId(), session.user_id, trackerId, f.songName, f.eraName, f.url ?? '', now)
    ));
  }

  // Pre-assign playlist IDs so we can reference them when inserting songs
  const playlistsWithIds = playlists.map(pl => ({ ...pl, _id: generateId() }));

  if (playlistsWithIds.length > 0) {
    // One batch for all playlist rows
    await batchChunked(env.DB, playlistsWithIds.map(pl =>
      env.DB.prepare('INSERT INTO playlists (id, user_id, tracker_id, name, cover, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(pl._id, session.user_id, trackerId, pl.name, pl.cover ?? null, now, now)
    ));

    // One batch for all songs across all playlists
    const songStmts = playlistsWithIds.flatMap(pl =>
      (pl.songs ?? []).slice(0, 1000).map((s, i) =>
        env.DB.prepare('INSERT INTO playlist_songs (id, playlist_id, song_name, era_name, url, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(generateId(), pl._id, s.songName, s.eraName, s.url ?? '', i, now)
      )
    );
    if (songStmts.length > 0) await batchChunked(env.DB, songStmts);
  }

  return json({ ok: true, favorites: favorites.length, playlists: playlists.length });
};
