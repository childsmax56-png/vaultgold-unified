import { json, resolveUser, genId } from './_db';

// POST /api/community/upload-image — store a user-picked image in R2 and return
// a URL to serve it back. Auth required. The raw image is sent as the request
// body with its Content-Type header (images are small, so we stream straight
// through the Worker rather than presigning like the audio uploads do).
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif',
};
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const bucket = env.YEDITS_BUCKET;
  if (!bucket) return json({ error: 'Storage not configured' }, 500);

  const user = await resolveUser(request);
  if (!user) return json({ error: 'Sign in required' }, 401);

  const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) return json({ error: 'Only PNG, JPEG, GIF, WEBP or AVIF images are allowed' }, 400);

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return json({ error: 'Empty file' }, 400);
  if (body.byteLength > MAX_BYTES) return json({ error: 'Image too large (max 8 MB)' }, 400);

  const key = `community-images/${user.id}/${genId()}.${ext}`;
  await bucket.put(key, body, { httpMetadata: { contentType } });

  return json({ url: `/api/community/image?key=${encodeURIComponent(key)}` });
};
