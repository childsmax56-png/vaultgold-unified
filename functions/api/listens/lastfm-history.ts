import { json, options, getSession } from '../_auth';

export const onRequestOptions = options;

// Proxy to Last.fm user.getRecentTracks. The API key is server-side, so the
// client pages through a user's scrobble history via this endpoint.
//
// Username resolution: prefer the Last.fm account linked to the UNVAULTED
// account; fall back to a `username` query param (the site's local Last.fm
// session) so users who scrobble without linking can still import.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);

  let username: string | null = null;
  const linked = await env.DB.prepare(
    "SELECT service_username FROM linked_services WHERE user_id = ? AND service = 'lastfm'"
  ).bind(session.user_id).first<{ service_username: string | null }>();
  username = linked?.service_username ?? url.searchParams.get('username');

  if (!username) return json({ error: 'No Last.fm account linked' }, 400);

  const apiKey = env.LASTFM_API_KEY;
  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: username,
    api_key: apiKey,
    format: 'json',
    limit: '200',
    page: String(page),
  });

  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!res.ok) return json({ error: 'Last.fm request failed' }, 502);
  const data = await res.json<any>();

  const rt = data?.recenttracks;
  if (!rt) return json({ error: data?.message || 'Unexpected Last.fm response' }, 502);

  const attr = rt['@attr'] || {};
  const totalPages = parseInt(attr.totalPages || '1', 10) || 1;
  const total = parseInt(attr.total || '0', 10) || 0;

  const raw = Array.isArray(rt.track) ? rt.track : rt.track ? [rt.track] : [];
  const tracks = raw
    // Drop the "now playing" entry (no date) so timestamps are always present.
    .filter((t: any) => t?.date?.uts)
    .map((t: any) => ({
      artist: t.artist?.['#text'] ?? t.artist?.name ?? '',
      track: t.name ?? '',
      album: t.album?.['#text'] ?? '',
      uts: parseInt(t.date.uts, 10),
    }));

  return json({ page, totalPages, total, username, tracks });
};
