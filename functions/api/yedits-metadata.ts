import { json, options } from './_auth';
import { checkOwnerOrClaim } from './_yedits-auth';

interface AlbumMeta {
  sourceArtist?: string;
  sourceEra?: string;
  description?: string;
  samplyUrl?: string;
  untitledUrl?: string;
  allowDownload?: boolean;
  songs?: Record<string, { displayName?: string; notes?: string }>;
}

export const onRequestOptions: PagesFunction<Env> = async () => options();

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  if (!key) return json({ error: 'Missing key' }, 400);

  const metaKey = `${key}/_metadata.json`;
  const obj = await context.env.YEDITS_BUCKET.get(metaKey);
  if (!obj) return json({});

  try {
    const text = await obj.text();
    return json(JSON.parse(text));
  } catch {
    return json({});
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { token?: string; folderPath?: string; meta?: AlbumMeta };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, folderPath, meta } = body;
  if (!token || !folderPath || !meta) return json({ error: 'Missing fields' }, 400);

  const creatorName = folderPath.split('/')[0];
  const allowed = await checkOwnerOrClaim(token, creatorName, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  const metaKey = `${folderPath}/_metadata.json`;
  await context.env.YEDITS_BUCKET.put(metaKey, JSON.stringify(meta), {
    httpMetadata: { contentType: 'application/json' },
  });

  return json({ ok: true });
};
