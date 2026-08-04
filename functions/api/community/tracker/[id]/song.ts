import {
  ensureCommunityTables, json, resolveUser, canEditTracker, isAllowedLink, genId, nowIso,
  SONG_TABS, type CommunityTrackerRow,
} from '../../_db';

// Returns the editable tracker, or a Response to return early (auth/404/403).
async function guard(context: { env: Env; request: Request; params: Record<string, unknown> }): Promise<CommunityTrackerRow | Response> {
  const { env, request, params } = context;
  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);
  await ensureCommunityTables(env.DB);
  const tracker = (await env.DB
    .prepare('SELECT * FROM community_trackers WHERE id = ?')
    .bind(params.id as string)
    .first()) as CommunityTrackerRow | null;
  if (!tracker) return json({ error: 'Not found' }, 404);
  if (!(await canEditTracker(env.DB, tracker, user))) return json({ error: 'Forbidden' }, 403);
  return tracker;
}

interface SongBody {
  songId?: string;
  eraId?: string;
  category?: string;
  name?: string;
  extra?: string;
  notes?: string;
  credited?: string;
  quality?: string;
  availableLength?: string;
  trackLength?: string;
  leakDate?: string;
  fileDate?: string;
  url?: string;
  tab?: string;
  sortOrder?: number;
}

function touch(env: Env, trackerId: string) {
  return env.DB.prepare('UPDATE community_trackers SET updated_at = ? WHERE id = ?').bind(nowIso(), trackerId).run();
}

// POST /api/community/tracker/:id/song — add a song to an era.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: SongBody;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }

  const name = (body.name || '').trim();
  if (!name) return json({ error: 'Song name is required' }, 400);
  if (!body.eraId) return json({ error: 'eraId required' }, 400);
  if (!isAllowedLink(body.url)) {
    return json({ error: 'Audio links must be a pillowcase, pixeldrain, imgur or krakenfiles URL' }, 400);
  }
  const tab = SONG_TABS.includes((body.tab || 'unreleased') as typeof SONG_TABS[number]) ? body.tab! : 'unreleased';

  // Confirm the era belongs to this tracker.
  const era = await env.DB.prepare('SELECT id FROM community_eras WHERE id = ? AND tracker_id = ?')
    .bind(body.eraId, trackerId).first();
  if (!era) return json({ error: 'Era not found' }, 404);

  const id = genId();
  await env.DB.prepare(
    `INSERT INTO community_songs
       (id, era_id, tracker_id, category, name, extra, notes, credited, quality,
        available_length, track_length, leak_date, file_date, url, tab, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.eraId, trackerId, (body.category || 'Unreleased Tracks').trim() || 'Unreleased Tracks',
    name, (body.extra || '').trim() || null, (body.notes || '').trim() || null,
    (body.credited || '').trim() || null, (body.quality || '').trim() || null,
    (body.availableLength || '').trim() || null, (body.trackLength || '').trim() || null,
    (body.leakDate || '').trim() || null, (body.fileDate || '').trim() || null,
    (body.url || '').trim() || null, tab, body.sortOrder ?? 0,
  ).run();
  await touch(env, trackerId);
  return json({ ok: true, id });
};

// PUT /api/community/tracker/:id/song — update a song (body.songId required).
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: SongBody;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  if (!body.songId) return json({ error: 'songId required' }, 400);
  if (body.name !== undefined && !body.name.trim()) return json({ error: 'Song name cannot be empty' }, 400);
  if (!isAllowedLink(body.url)) {
    return json({ error: 'Audio links must be a pillowcase, pixeldrain, imgur or krakenfiles URL' }, 400);
  }
  const tab = body.tab && SONG_TABS.includes(body.tab as typeof SONG_TABS[number]) ? body.tab : null;

  await env.DB.prepare(
    `UPDATE community_songs
        SET era_id = COALESCE(?, era_id),
            category = COALESCE(?, category),
            name = COALESCE(?, name),
            extra = ?, notes = ?, credited = ?, quality = ?,
            available_length = ?, track_length = ?, leak_date = ?, file_date = ?,
            url = ?, tab = COALESCE(?, tab), sort_order = COALESCE(?, sort_order)
      WHERE id = ? AND tracker_id = ?`
  ).bind(
    body.eraId ?? null, (body.category || '').trim() || null, body.name?.trim() ?? null,
    (body.extra || '').trim() || null, (body.notes || '').trim() || null,
    (body.credited || '').trim() || null, (body.quality || '').trim() || null,
    (body.availableLength || '').trim() || null, (body.trackLength || '').trim() || null,
    (body.leakDate || '').trim() || null, (body.fileDate || '').trim() || null,
    (body.url || '').trim() || null, tab, body.sortOrder ?? null,
    body.songId, trackerId,
  ).run();
  await touch(env, trackerId);
  return json({ ok: true });
};

// DELETE /api/community/tracker/:id/song — delete a song (body.songId required).
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const g = await guard(context);
  if (g instanceof Response) return g;
  const { env, request } = context;
  const trackerId = g.id;

  let body: SongBody;
  try { body = await request.json(); } catch { return json({ error: 'Invalid body' }, 400); }
  if (!body.songId) return json({ error: 'songId required' }, 400);

  await env.DB.prepare('DELETE FROM community_songs WHERE id = ? AND tracker_id = ?')
    .bind(body.songId, trackerId).run();
  await touch(env, trackerId);
  return json({ ok: true });
};
