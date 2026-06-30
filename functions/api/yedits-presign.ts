import { AwsClient } from 'aws4fetch';

interface FileSpec {
  name: string;
  type: string;
  size: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = context.env;

  if (!YEDITS_BUCKET || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return json({ error: 'Storage not configured' }, 500);
  }

  let body: {
    token?: string;
    creator?: string;
    album?: string;
    cover?: FileSpec;
    tracks?: FileSpec[];
  };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { token, cover, tracks } = body;
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

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const bucketHost = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const bucketName = 'yeditsgold-uploads';

  const presign = async (key: string, contentType: string) => {
    const url = `https://${bucketHost}/${bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const signed = await client.sign(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      aws: { signQuery: true },
    });
    return signed.url;
  };

  const uploads: { field: 'cover' | 'track'; name: string; key: string; url: string }[] = [];

  if (cover && cover.size > 0) {
    const key = `${creatorDir}/${albumDir}/${sanitize(cover.name)}`;
    const url = await presign(key, cover.type || 'image/jpeg');
    uploads.push({ field: 'cover', name: cover.name, key, url });
  }

  for (const track of tracks ?? []) {
    if (!track || track.size === 0) continue;
    const key = `${creatorDir}/${albumDir}/${sanitize(track.name)}`;
    const url = await presign(key, track.type || 'audio/mpeg');
    uploads.push({ field: 'track', name: track.name, key, url });
  }

  if (uploads.length === 0) {
    return json({ error: 'No files to upload' }, 400);
  }

  return json({ uploads, folderPath: `${creatorDir}/${albumDir}` });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
