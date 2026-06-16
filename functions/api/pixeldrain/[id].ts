interface Env {
  PIXELDRAIN_API_KEY?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight — the browser sends this before range requests
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS });
};

async function proxyPixeldrain(id: string, request: Request, apiKey: string): Promise<Response> {
  const upstreamHeaders: Record<string, string> = {};
  if (apiKey) upstreamHeaders['Authorization'] = 'Basic ' + btoa(':' + apiKey);

  const range = request.headers.get('Range');
  if (range) upstreamHeaders['Range'] = range;

  let upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, { headers: upstreamHeaders });

  // If auth caused a 403, retry without it (public files don't need the key)
  if (upstream.status === 403 && apiKey) {
    const fallbackHeaders: Record<string, string> = {};
    if (range) fallbackHeaders['Range'] = range;
    upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, { headers: fallbackHeaders });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error', { status: upstream.status, headers: CORS });
  }

  const responseHeaders = new Headers(CORS);
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');

  for (const h of ['Content-Length', 'Content-Range', 'Content-Disposition']) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  if (!id) return new Response('Missing file ID', { status: 400 });
  return proxyPixeldrain(id, context.request, context.env.PIXELDRAIN_API_KEY ?? '');
};

export const onRequestHead: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  if (!id) return new Response('Missing file ID', { status: 400 });

  const apiKey = context.env.PIXELDRAIN_API_KEY ?? '';
  const upstreamHeaders: Record<string, string> = {};
  if (apiKey) upstreamHeaders['Authorization'] = 'Basic ' + btoa(':' + apiKey);

  const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, {
    method: 'HEAD',
    headers: upstreamHeaders,
  });

  const responseHeaders = new Headers(CORS);
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');
  const cl = upstream.headers.get('Content-Length');
  if (cl) responseHeaders.set('Content-Length', cl);

  return new Response(null, { status: upstream.ok ? upstream.status : 200, headers: responseHeaders });
};
