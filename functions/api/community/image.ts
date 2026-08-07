// GET /api/community/image?key=community-images/... — serve a community-uploaded
// image from R2. Only keys under the community-images/ prefix are served.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const bucket = env.YEDITS_BUCKET;
  if (!bucket) return new Response('Storage not configured', { status: 500 });

  const key = new URL(request.url).searchParams.get('key') || '';
  if (!key.startsWith('community-images/')) {
    return new Response('Invalid key', { status: 400 });
  }

  const obj = await bucket.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'image/jpeg');
  headers.set('Content-Length', obj.size.toString());
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
};
