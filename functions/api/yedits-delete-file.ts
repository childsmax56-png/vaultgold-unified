import { checkOwnerOrClaim } from './_yedits-auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  let body: { token?: string; key?: string };
  try {
    body = await context.request.json() as { token?: string; key?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, key } = body;
  if (!token || !key) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const keyCreator = key.split('/')[0].trim();
  const allowed = await checkOwnerOrClaim(token, keyCreator, context.env);
  if (!allowed) {
    return json({ error: 'You can only delete your own files' }, 403);
  }

  const obj = await YEDITS_BUCKET.get(key);
  if (!obj) {
    return json({ error: 'File not found' }, 404);
  }

  await YEDITS_BUCKET.delete(key);

  return json({ deleted: key });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
