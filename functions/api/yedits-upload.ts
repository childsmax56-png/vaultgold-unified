export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  if (!YEDITS_BUCKET) {
    return json({ error: 'Storage not configured' }, 500);
  }

  let body: {
    token?: string;
    creator?: string;
    album?: string;
    sourceArtist?: string;
    sourceEra?: string;
    description?: string;
    samplyUrl?: string;
    untitledUrl?: string;
    allowDownload?: boolean;
  };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { token } = body;
  const creator = body.creator?.trim();
  const album = body.album?.trim();

  if (!token || !creator || !album) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) {
    return json({ error: 'Unauthorized — sign in to UNVAULTED first' }, 401);
  }

  const sanitize = (s: string) =>
    s.replace(/[/\\<>:"|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim() || 'untitled';

  const creatorDir = sanitize(creator);
  const albumDir = sanitize(album);

  const { sourceArtist, sourceEra, description, samplyUrl, untitledUrl, allowDownload } = body;
  const hasMetadata = sourceArtist || sourceEra || description || samplyUrl || untitledUrl || allowDownload !== undefined;
  if (hasMetadata) {
    const meta: Record<string, unknown> = {};
    if (sourceArtist) meta.sourceArtist = sourceArtist;
    if (sourceEra) meta.sourceEra = sourceEra;
    if (description) meta.description = description;
    if (samplyUrl) meta.samplyUrl = samplyUrl;
    if (untitledUrl) meta.untitledUrl = untitledUrl;
    if (allowDownload !== undefined) meta.allowDownload = allowDownload;

    const metaKey = `${creatorDir}/${albumDir}/_metadata.json`;
    await YEDITS_BUCKET.put(metaKey, JSON.stringify(meta), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  return json({ folderPath: `${creatorDir}/${albumDir}` });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
