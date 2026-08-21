// Presign a single-PUT upload for the signed-in user's profile picture.
//
//   POST /api/auth/avatar-presign
//     body { token, name, type, size }
//     → { uploadUrl, key }
//
// The browser PUTs the image bytes straight to R2 with `uploadUrl`, then calls
// POST /api/auth/avatar to commit the new avatar to the account. Storage reuses
// the yeditsgold-uploads bucket under an `avatars/` prefix (see the yedits
// presign flow it mirrors). The object key is fixed per user so re-uploads
// overwrite in place; cache-busting is handled by the `?v=` on the read URL.
import { json, options, getSession } from '../_auth';
import { AwsClient } from 'aws4fetch';

export const onRequestOptions = options;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return json({ error: 'Storage not configured' }, 500);
  }

  const session = await getSession(request, env.DB);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: { name?: string; type?: string; size?: number };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const type = (body.type || '').toLowerCase();
  const size = Number(body.size) || 0;
  if (!ALLOWED_TYPES.has(type)) return json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, 400);
  if (size <= 0 || size > MAX_BYTES) return json({ error: 'Image must be between 1 byte and 5 MB' }, 400);

  // One deterministic key per user, no extension: the stored Content-Type on the
  // object drives how it is served back, so a JPEG→PNG swap can't orphan a file.
  const key = `avatars/${session.user_id}`;

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/yeditsgold-uploads/${key.split('/').map(encodeURIComponent).join('/')}`;
  const signed = await client.sign(url, {
    method: 'PUT',
    headers: { 'Content-Type': type },
    aws: { signQuery: true },
  });

  return json({ uploadUrl: signed.url, key });
};
