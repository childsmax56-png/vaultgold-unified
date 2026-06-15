interface Env {
  PIXELDRAIN_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  if (!id) return new Response('Missing file ID', { status: 400 });

  const apiKey = context.env.PIXELDRAIN_API_KEY ?? '';
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = 'Basic ' + btoa(':' + apiKey);
  }

  const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, { headers });

  if (!upstream.ok) {
    return new Response('Upstream error', { status: upstream.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');
  const cl = upstream.headers.get('Content-Length');
  if (cl) responseHeaders.set('Content-Length', cl);
  const cr = upstream.headers.get('Content-Range');
  if (cr) responseHeaders.set('Content-Range', cr);
  const ac = upstream.headers.get('Accept-Ranges');
  if (ac) responseHeaders.set('Accept-Ranges', ac);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export const onRequestHead: PagesFunction<Env> = async (context) => {
  const id = (context.params as Record<string, string>).id ?? '';
  const apiKey = context.env.PIXELDRAIN_API_KEY ?? '';
  const headers: Record<string, string> = {};
  if (apiKey) headers['Authorization'] = 'Basic ' + btoa(':' + apiKey);

  const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`, { method: 'HEAD', headers });

  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'audio/mpeg');
  const cl = upstream.headers.get('Content-Length');
  if (cl) responseHeaders.set('Content-Length', cl);

  return new Response(null, { status: upstream.status, headers: responseHeaders });
};
