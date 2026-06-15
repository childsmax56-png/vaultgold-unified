interface Env {
  PIXELDRAIN_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  if (!id) return new Response('Missing file ID', { status: 400 });

  const apiKey = context.env.PIXELDRAIN_API_KEY ?? '';
  const upstreamHeaders: Record<string, string> = {};
  if (apiKey) {
    upstreamHeaders['Authorization'] = 'Basic ' + btoa(':' + apiKey);
  }

  // Forward Range header so the browser can seek and the response is 206
  const range = context.request.headers.get('Range');
  if (range) upstreamHeaders['Range'] = range;

  const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, {
    headers: upstreamHeaders,
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error', { status: upstream.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');

  for (const h of ['Content-Length', 'Content-Range', 'Content-Disposition']) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export const onRequestHead: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  const apiKey = context.env.PIXELDRAIN_API_KEY ?? '';
  const upstreamHeaders: Record<string, string> = {};
  if (apiKey) upstreamHeaders['Authorization'] = 'Basic ' + btoa(':' + apiKey);

  const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, {
    method: 'HEAD',
    headers: upstreamHeaders,
  });

  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');
  const cl = upstream.headers.get('Content-Length');
  if (cl) responseHeaders.set('Content-Length', cl);

  return new Response(null, { status: upstream.status, headers: responseHeaders });
};
