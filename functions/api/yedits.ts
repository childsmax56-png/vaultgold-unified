import { isArchivedKey } from './_yedits-archive';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { YEDITS_BUCKET } = context.env;

  if (!YEDITS_BUCKET) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let cursor: string | undefined;
  const keys: string[] = [];

  do {
    const listing = await YEDITS_BUCKET.list({ cursor });
    for (const obj of listing.objects) {
      // Soft-deleted albums live under the archive prefix and stay hidden here.
      if (isArchivedKey(obj.key)) continue;
      keys.push(obj.key);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  return new Response(JSON.stringify(keys), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
