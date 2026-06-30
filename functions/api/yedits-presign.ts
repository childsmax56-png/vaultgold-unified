import { AwsClient } from 'aws4fetch';
import { getAuthUser, isYeditsAdmin } from './_yedits-auth';

interface FileSpec {
  name: string;
  type: string;
  size: number;
}

async function ensureClaimsTable(db: D1Database) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS yeditsgold_claims (id TEXT PRIMARY KEY, profile_name TEXT NOT NULL, user_id TEXT NOT NULL, username TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', claimed_at TEXT NOT NULL, reviewed_at TEXT, UNIQUE(profile_name))`
  ).run();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, DB } = context.env;

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

  const user = await getAuthUser(token);
  if (!user) {
    return json({ error: 'Unauthorized — sign in to UNVAULTED first' }, 401);
  }

  const sanitize = (s: string) =>
    s.replace(/[/\\<>:"|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim() || 'untitled';

  const creatorDir = sanitize(creator);
  const albumDir = sanitize(album);

  // If the typed creator name differs from the uploader's account username,
  // grant them an approved claim on it so they can edit what they just
  // uploaded without needing a separate admin-approved claim.
  if (DB && creatorDir.toLowerCase() !== user.username.toLowerCase() && !(await isYeditsAdmin(DB, user.id, user.email ?? ''))) {
    await ensureClaimsTable(DB);
    const existing = await DB.prepare(
      'SELECT user_id FROM yeditsgold_claims WHERE profile_name = ?'
    ).bind(creatorDir).first<{ user_id: string }>();
    if (!existing) {
      await DB.prepare(
        `INSERT INTO yeditsgold_claims (id, profile_name, user_id, username, email, status, claimed_at)
         VALUES (?, ?, ?, ?, ?, 'approved', ?)`
      ).bind(crypto.randomUUID(), creatorDir, user.id, user.username, user.email ?? '', new Date().toISOString()).run();
    }
  }

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

  const uploads: { field: 'cover' | 'track'; name: string; key: string; url: string; contentType: string }[] = [];

  if (cover && cover.size > 0) {
    const key = `${creatorDir}/${albumDir}/${sanitize(cover.name)}`;
    const contentType = cover.type || 'image/jpeg';
    const url = await presign(key, contentType);
    uploads.push({ field: 'cover', name: cover.name, key, url, contentType });
  }

  for (const track of tracks ?? []) {
    if (!track || track.size === 0) continue;
    const key = `${creatorDir}/${albumDir}/${sanitize(track.name)}`;
    const contentType = track.type || 'audio/mpeg';
    const url = await presign(key, contentType);
    uploads.push({ field: 'track', name: track.name, key, url, contentType });
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
