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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const token = formData.get('token') as string | null;
  const key = formData.get('key') as string | null;
  const file = formData.get('file');

  if (!token || !key || !(file instanceof File) || file.size === 0) {
    return json({ error: 'Missing fields' }, 400);
  }

  const creatorName = key.split('/')[0];
  const allowed = await checkOwnerOrClaim(token, creatorName, context.env);
  if (!allowed) return json({ error: 'Unauthorized' }, 401);

  await context.env.YEDITS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'audio/mpeg' },
  });

  return json({ ok: true, key });
};
