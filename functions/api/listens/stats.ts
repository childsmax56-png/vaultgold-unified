import { json, options, getSession } from '../_auth';
import { ensureListeningTables } from './_schema';

export const onRequestOptions = options;

const RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
  all: 0,
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  await ensureListeningTables(env.DB);

  const url = new URL(request.url);
  const rangeKey = url.searchParams.get('range') ?? '30d';
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const sinceMs = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

  const uid = session.user_id;
  const db = env.DB;
  // Every query is scoped to the user and the selected window.
  const where = 'user_id = ? AND played_at >= ?';
  const args = [uid, sinceMs];

  const summary = await db
    .prepare(
      `SELECT
         COUNT(*) AS plays,
         COALESCE(SUM(duration_sec), 0) AS totalSec,
         COUNT(DISTINCT track || '||' || COALESCE(artist, '')) AS uniqueTracks,
         COUNT(DISTINCT NULLIF(artist, '')) AS uniqueArtists,
         COUNT(DISTINCT NULLIF(era_name, '')) AS uniqueEras,
         COUNT(DISTINCT date(played_at / 1000, 'unixepoch')) AS activeDays,
         MIN(played_at) AS firstPlay,
         MAX(played_at) AS lastPlay
       FROM listening_history WHERE ${where}`
    )
    .bind(...args)
    .first<Record<string, number>>();

  const topSongs = await db
    .prepare(
      `SELECT track, COALESCE(artist,'') AS artist, COALESCE(album,'') AS album,
              COALESCE(era_name,'') AS eraName, COALESCE(artist_slug,'') AS artistSlug,
              COUNT(*) AS plays, COALESCE(SUM(duration_sec),0) AS totalSec
       FROM listening_history WHERE ${where}
       GROUP BY track, artist
       ORDER BY plays DESC, totalSec DESC LIMIT 30`
    )
    .bind(...args)
    .all();

  const topArtists = await db
    .prepare(
      `SELECT COALESCE(artist,'') AS artist, COUNT(*) AS plays,
              COALESCE(SUM(duration_sec),0) AS totalSec
       FROM listening_history WHERE ${where} AND artist IS NOT NULL AND artist != ''
       GROUP BY artist ORDER BY plays DESC LIMIT 30`
    )
    .bind(...args)
    .all();

  const topEras = await db
    .prepare(
      `SELECT COALESCE(era_name,'') AS eraName, COALESCE(artist_slug,'') AS artistSlug,
              COUNT(*) AS plays
       FROM listening_history WHERE ${where} AND era_name IS NOT NULL AND era_name != ''
       GROUP BY era_name, artist_slug ORDER BY plays DESC LIMIT 30`
    )
    .bind(...args)
    .all();

  const topTrackers = await db
    .prepare(
      `SELECT COALESCE(artist_slug,'') AS artistSlug, COUNT(*) AS plays,
              COALESCE(SUM(duration_sec),0) AS totalSec
       FROM listening_history WHERE ${where} AND artist_slug IS NOT NULL AND artist_slug != ''
       GROUP BY artist_slug ORDER BY plays DESC LIMIT 30`
    )
    .bind(...args)
    .all();

  const perDay = await db
    .prepare(
      `SELECT date(played_at / 1000, 'unixepoch') AS day, COUNT(*) AS plays
       FROM listening_history WHERE ${where}
       GROUP BY day ORDER BY day ASC`
    )
    .bind(...args)
    .all();

  const byHour = await db
    .prepare(
      `SELECT CAST(strftime('%H', played_at / 1000, 'unixepoch') AS INTEGER) AS hour,
              COUNT(*) AS plays
       FROM listening_history WHERE ${where}
       GROUP BY hour ORDER BY hour ASC`
    )
    .bind(...args)
    .all();

  const recent = await db
    .prepare(
      `SELECT track, COALESCE(artist,'') AS artist, COALESCE(era_name,'') AS eraName,
              COALESCE(artist_slug,'') AS artistSlug, played_at AS playedAt
       FROM listening_history WHERE user_id = ?
       ORDER BY played_at DESC LIMIT 50`
    )
    .bind(uid)
    .all();

  return json({
    range: rangeKey,
    summary: {
      plays: summary?.plays ?? 0,
      minutes: Math.round((summary?.totalSec ?? 0) / 60),
      uniqueTracks: summary?.uniqueTracks ?? 0,
      uniqueArtists: summary?.uniqueArtists ?? 0,
      uniqueEras: summary?.uniqueEras ?? 0,
      activeDays: summary?.activeDays ?? 0,
      firstPlay: summary?.firstPlay ?? null,
      lastPlay: summary?.lastPlay ?? null,
    },
    topSongs: topSongs.results,
    topArtists: topArtists.results,
    topEras: topEras.results,
    topTrackers: topTrackers.results,
    perDay: perDay.results,
    byHour: byHour.results,
    recent: recent.results,
  });
};
