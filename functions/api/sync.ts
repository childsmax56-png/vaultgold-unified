import { json, options, getSession } from './_auth';

export const onRequestOptions = options;

// GET /api/sync — returns all tracker data for the user in one shot
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const [favs, plRows, allSongs] = await Promise.all([
    env.DB.prepare(
      'SELECT tracker_id, song_name, era_name, url FROM favorites WHERE user_id = ? ORDER BY tracker_id, created_at ASC'
    ).bind(session.user_id).all<{ tracker_id: string; song_name: string; era_name: string; url: string }>(),

    env.DB.prepare(
      'SELECT id, tracker_id, name, cover FROM playlists WHERE user_id = ? ORDER BY tracker_id, created_at ASC'
    ).bind(session.user_id).all<{ id: string; tracker_id: string; name: string; cover: string | null }>(),

    env.DB.prepare(
      `SELECT ps.playlist_id, ps.song_name, ps.era_name, ps.url
       FROM playlist_songs ps
       JOIN playlists p ON p.id = ps.playlist_id
       WHERE p.user_id = ?
       ORDER BY ps.playlist_id, ps.position ASC`
    ).bind(session.user_id).all<{ playlist_id: string; song_name: string; era_name: string; url: string }>(),
  ]);

  const songsByPlaylist = new Map<string, { songName: string; eraName: string; url: string }[]>();
  for (const s of allSongs.results) {
    const list = songsByPlaylist.get(s.playlist_id) ?? [];
    list.push({ songName: s.song_name, eraName: s.era_name, url: s.url });
    songsByPlaylist.set(s.playlist_id, list);
  }

  // Group by tracker_id
  const byTracker: Record<string, {
    favorites: { songName: string; eraName: string; url: string }[];
    playlists: { id: string; name: string; cover?: string; songs: { songName: string; eraName: string; url: string }[] }[];
  }> = {};

  for (const f of favs.results) {
    if (!byTracker[f.tracker_id]) byTracker[f.tracker_id] = { favorites: [], playlists: [] };
    byTracker[f.tracker_id].favorites.push({ songName: f.song_name, eraName: f.era_name, url: f.url });
  }

  for (const pl of plRows.results) {
    if (!byTracker[pl.tracker_id]) byTracker[pl.tracker_id] = { favorites: [], playlists: [] };
    byTracker[pl.tracker_id].playlists.push({
      id: pl.id,
      name: pl.name,
      cover: pl.cover ?? undefined,
      songs: songsByPlaylist.get(pl.id) ?? [],
    });
  }

  return json(byTracker);
};
