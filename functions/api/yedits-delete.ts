import { checkOwnerOrClaim } from './_yedits-auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  let body: { token?: string; folderPath?: string };
  try {
    body = await context.request.json() as { token?: string; folderPath?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token, folderPath } = body;
  if (!token || !folderPath) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const folderCreator = folderPath.split('/')[0].trim();
  const allowed = await checkOwnerOrClaim(token, folderCreator, context.env);
  if (!allowed) {
    return json({ error: 'You can only delete your own projects' }, 403);
  }

  // List all objects under this folder prefix
  const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  let cursor: string | undefined;
  const keysToDelete: string[] = [];

  do {
    const listing = await YEDITS_BUCKET.list({ prefix, cursor });
    for (const obj of listing.objects) {
      keysToDelete.push(obj.key);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  if (keysToDelete.length === 0) {
    return json({ error: 'No files found for that project' }, 404);
  }

  await Promise.all(keysToDelete.map(key => YEDITS_BUCKET.delete(key)));

  return json({ deleted: keysToDelete });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
