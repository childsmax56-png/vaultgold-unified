import { json, options } from './_auth';
import { checkOwnerOrClaim } from './_yedits-auth';

export const onRequestOptions: PagesFunction<Env> = async () => options();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { token?: string; oldKey?: string; newFilename?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, oldKey, newFilename } = body;
  if (!token || !oldKey || !newFilename) return json({ error: 'Missing fields' }, 400);

  const creatorName = oldKey.split('/')[0];
  const allowed = await checkOwnerOrClaim(token, creatorName, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  const lastSlash = oldKey.lastIndexOf('/');
  const folder = oldKey.substring(0, lastSlash);
  const sanitizedFilename = newFilename.replace(/[/\\<>:"|?*\x00-\x1f]/g, '').trim();
  if (!sanitizedFilename) return json({ error: 'Invalid filename' }, 400);

  const newKey = `${folder}/${sanitizedFilename}`;

  const obj = await context.env.YEDITS_BUCKET.get(oldKey);
  if (!obj) return json({ error: 'Source file not found' }, 404);

  const arrayBuffer = await obj.arrayBuffer();
  await context.env.YEDITS_BUCKET.put(newKey, arrayBuffer, {
    httpMetadata: obj.httpMetadata,
  });
  await context.env.YEDITS_BUCKET.delete(oldKey);

  return json({ ok: true, newKey });
};
