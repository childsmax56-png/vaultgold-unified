import { json, options, getSession, generateId } from '../_auth';
import { ensureListeningTables } from './_schema';

export const onRequestOptions = options;

interface ImportRow {
  track?: string;
  artist?: string;
  album?: string;
  eraName?: string;
  artistSlug?: string;
  songUrl?: string;
  durationSec?: number;
  playedAt?: number; // unix seconds (Last.fm scrobble time)
}

const MAX_ROWS = 1000; // per request; the client chunks larger imports

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: { listens?: ImportRow[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const rows = Array.isArray(body.listens) ? body.listens.slice(0, MAX_ROWS) : [];
  if (rows.length === 0) return json({ ok: true, imported: 0 });

  await ensureListeningTables(env.DB);

  // INSERT OR IGNORE against the (user_id, played_at, track) unique index makes
  // re-imports and overlaps with live plays idempotent. meta.changes tells us
  // how many rows were actually new.
  const stmt = env.DB.prepare(
    `INSERT OR IGNORE INTO listening_history
      (id, user_id, artist_slug, era_name, track, artist, album, song_url, duration_sec, played_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lastfm')`
  );

  let imported = 0;
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows
      .slice(i, i + CHUNK)
      .filter((r) => r.track && typeof r.playedAt === 'number' && r.playedAt > 0)
      .map((r) =>
        stmt.bind(
          generateId(),
          session.user_id,
          r.artistSlug ?? null,
          r.eraName ?? null,
          r.track!,
          r.artist ?? null,
          r.album ?? null,
          r.songUrl ?? null,
          typeof r.durationSec === 'number' ? Math.floor(r.durationSec) : null,
          Math.floor(r.playedAt!) * 1000
        )
      );
    if (slice.length === 0) continue;
    const results = await env.DB.batch(slice);
    for (const res of results) imported += res.meta?.changes ?? 0;
  }

  return json({ ok: true, imported });
};
