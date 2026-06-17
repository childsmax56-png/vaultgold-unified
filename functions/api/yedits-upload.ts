export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const token = formData.get('token') as string | null;
  const creator = (formData.get('creator') as string | null)?.trim();
  const album = (formData.get('album') as string | null)?.trim();

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

  const uploaded: string[] = [];

  const cover = formData.get('cover');
  if (cover instanceof File && cover.size > 0) {
    const key = `${creatorDir}/${albumDir}/${sanitize(cover.name)}`;
    await YEDITS_BUCKET.put(key, cover.stream(), {
      httpMetadata: { contentType: cover.type || 'image/jpeg' },
    });
    uploaded.push(key);
  }

  for (const track of formData.getAll('tracks')) {
    if (!(track instanceof File) || track.size === 0) continue;
    const key = `${creatorDir}/${albumDir}/${sanitize(track.name)}`;
    await YEDITS_BUCKET.put(key, track.stream(), {
      httpMetadata: { contentType: track.type || 'audio/mpeg' },
    });
    uploaded.push(key);
  }

  if (uploaded.length === 0) {
    return json({ error: 'No files were uploaded' }, 400);
  }

  // Write metadata sidecar if any metadata fields were provided
  const sourceArtist = (formData.get('sourceArtist') as string | null) ?? '';
  const sourceEra = (formData.get('sourceEra') as string | null) ?? '';
  const description = (formData.get('description') as string | null) ?? '';
  const samplyUrl = (formData.get('samplyUrl') as string | null) ?? '';
  const untitledUrl = (formData.get('untitledUrl') as string | null) ?? '';
  const allowDownloadStr = formData.get('allowDownload') as string | null;

  const hasMetadata = sourceArtist || sourceEra || description || samplyUrl || untitledUrl || allowDownloadStr !== null;
  if (hasMetadata) {
    const meta: Record<string, unknown> = {};
    if (sourceArtist) meta.sourceArtist = sourceArtist;
    if (sourceEra) meta.sourceEra = sourceEra;
    if (description) meta.description = description;
    if (samplyUrl) meta.samplyUrl = samplyUrl;
    if (untitledUrl) meta.untitledUrl = untitledUrl;
    if (allowDownloadStr !== null) meta.allowDownload = allowDownloadStr === 'true';

    const metaKey = `${creatorDir}/${albumDir}/_metadata.json`;
    await YEDITS_BUCKET.put(metaKey, JSON.stringify(meta), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  return json({ uploaded, folderPath: `${creatorDir}/${albumDir}` });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
