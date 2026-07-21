import { json, options, getSession, generateId } from '../_auth';
import { ensureListeningTables, isRecordingEnabled } from './_schema';

export const onRequestOptions = options;

interface RecordBody {
  track?: string;
  artist?: string;
  album?: string;
  eraName?: string;
  artistSlug?: string;
  songUrl?: string;
  durationSec?: number;
  playedAt?: number; // unix seconds; optional, defaults to now
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: RecordBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const track = (body.track ?? '').trim();
  if (!track) return json({ error: 'track is required' }, 400);

  await ensureListeningTables(env.DB);

  if (!(await isRecordingEnabled(env.DB, session.user_id))) {
    // Respect the user's opt-out; report success so the client stays quiet.
    return json({ ok: true, recorded: false });
  }

  const playedAt =
    typeof body.playedAt === 'number' && body.playedAt > 0
      ? Math.floor(body.playedAt) * 1000
      : Date.now();

  await env.DB.prepare(
    `INSERT INTO listening_history
      (id, user_id, artist_slug, era_name, track, artist, album, song_url, duration_sec, played_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      generateId(),
      session.user_id,
      body.artistSlug ?? null,
      body.eraName ?? null,
      track,
      body.artist ?? null,
      body.album ?? null,
      body.songUrl ?? null,
      typeof body.durationSec === 'number' ? Math.floor(body.durationSec) : null,
      playedAt
    )
    .run();

  return json({ ok: true, recorded: true });
};
