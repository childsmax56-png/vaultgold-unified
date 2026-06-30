import { AwsClient } from 'aws4fetch';
import { json, options } from './_auth';
import { checkOwnerOrClaim } from './_yedits-auth';

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
  const resolvedContentType = contentType || 'audio/mpeg';
  const signed = await client.sign(url, {
    method: 'PUT',
    headers: { 'Content-Type': resolvedContentType },
    aws: { signQuery: true },
  });

  return json({ url: signed.url, key, contentType: resolvedContentType });
};
