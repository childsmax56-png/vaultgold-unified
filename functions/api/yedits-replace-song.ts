import { AwsClient } from 'aws4fetch';
import { json, options } from './_auth';

const OWNER_EMAIL = 'childsmax56@gmail.com';

async function checkOwnerOrClaim(token: string, creatorName: string, env: Env): Promise<boolean> {
  const authRes = await fetch('https://unvaulted.cc/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!authRes.ok) return false;
  const authData = await authRes.json() as { user?: { id: string; username: string; email: string } };
  const user = authData.user;
  if (!user) return false;

  if (user.email === OWNER_EMAIL) return true;

  if (user.username.toLowerCase() === creatorName.toLowerCase()) return true;

  const adminRow = await env.DB.prepare('SELECT user_id FROM yeditsgold_admins WHERE user_id = ?').bind(user.id).first();
  if (adminRow) return true;

  const claim = await env.DB.prepare(
    `SELECT user_id FROM yeditsgold_claims WHERE profile_name = ? AND status = 'approved' AND user_id = ?`
  ).bind(creatorName, user.id).first();
  return !!claim;
}

export const onRequestOptions: PagesFunction<Env> = async () => options();

// Returns a presigned PUT URL so the browser can replace the track's bytes
// directly in R2, instead of routing the file through this Worker.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = context.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return json({ error: 'Storage not configured' }, 500);
  }

  let body: { token?: string; key?: string; contentType?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { token, key, contentType } = body;
  if (!token || !key) {
    return json({ error: 'Missing fields' }, 400);
  }

  const creatorName = key.split('/')[0];
  const allowed = await checkOwnerOrClaim(token, creatorName, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const bucketHost = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const bucketName = 'yeditsgold-uploads';
  const url = `https://${bucketHost}/${bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const signed = await client.sign(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType || 'audio/mpeg' },
    aws: { signQuery: true },
  });

  return json({ url: signed.url, key });
};
