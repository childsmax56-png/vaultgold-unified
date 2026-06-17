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
