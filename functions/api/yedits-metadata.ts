import { json, options } from './_auth';

interface AlbumMeta {
  sourceArtist?: string;
  sourceEra?: string;
  description?: string;
  samplyUrl?: string;
  untitledUrl?: string;
  allowDownload?: boolean;
  songs?: Record<string, { displayName?: string; notes?: string }>;
}

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
