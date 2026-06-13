import { json, options, getSession, generateId } from '../_auth';

export const onRequestOptions = options;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const trackerId = (params.tracker_id as string).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trackerId) return json({ error: 'Invalid tracker' }, 400);

  const favs = await env.DB.prepare(
    'SELECT song_name, era_name, url FROM favorites WHERE user_id = ? AND tracker_id = ? ORDER BY created_at ASC'
  ).bind(session.user_id, trackerId).all<{ song_name: string; era_name: string; url: string }>();

  const plRows = await env.DB.prepare(
    'SELECT id, name, cover FROM playlists WHERE user_id = ? AND tracker_id = ? ORDER BY created_at ASC'
  ).bind(session.user_id, trackerId).all<{ id: string; name: string; cover: string | null }>();

  const playlists = await Promise.all(plRows.results.map(async pl => {
    const songs = await env.DB.prepare(
      'SELECT song_name, era_name, url FROM playlist_songs WHERE playlist_id = ? ORDER BY position ASC'
    ).bind(pl.id).all<{ song_name: string; era_name: string; url: string }>();
    return {
      id: pl.id,
      name: pl.name,
      cover: pl.cover ?? undefined,
      songs: songs.results.map(s => ({ songName: s.song_name, eraName: s.era_name, url: s.url })),
    };
  }));

  return json({
    favorites: favs.results.map(f => ({ songName: f.song_name, eraName: f.era_name, url: f.url })),
    playlists,
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

  // Full replace: delete existing then insert new
  await env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND tracker_id = ?')
    .bind(session.user_id, trackerId).run();

  if (favorites.length > 0) {
    const stmts = favorites.map(f =>
      env.DB.prepare('INSERT INTO favorites (id, user_id, tracker_id, song_name, era_name, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(generateId(), session.user_id, trackerId, f.songName, f.eraName, f.url ?? '', now)
    );
    await env.DB.batch(stmts);
  }

  // Cascade delete handles playlist_songs
  await env.DB.prepare('DELETE FROM playlists WHERE user_id = ? AND tracker_id = ?')
    .bind(session.user_id, trackerId).run();

  for (const pl of playlists) {
    const plId = generateId();
    await env.DB.prepare('INSERT INTO playlists (id, user_id, tracker_id, name, cover, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(plId, session.user_id, trackerId, pl.name, pl.cover ?? null, now, now).run();

    const songs = (pl.songs ?? []).slice(0, 1000);
    if (songs.length > 0) {
      const songStmts = songs.map((s, i) =>
        env.DB.prepare('INSERT INTO playlist_songs (id, playlist_id, song_name, era_name, url, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(generateId(), plId, s.songName, s.eraName, s.url ?? '', i, now)
      );
      await env.DB.batch(songStmts);
    }
  }

  return json({ ok: true, favorites: favorites.length, playlists: playlists.length });
};
