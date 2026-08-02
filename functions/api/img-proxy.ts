// Small CORS image proxy used by the Tier List image export. Canvas.toBlob()
// taints (and throws) on cross-origin cover art unless the image is served with
// CORS headers. Cover hosts (ibb.co, imgur, etc.) don't send them, so we fetch
// the image server-side and re-serve it with `Access-Control-Allow-Origin: *`.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0' || h === '[::1]') return true;
  // Block obvious private / link-local / loopback IPv4 ranges.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || (a === 192 && b === 168) || (a === 169 && b === 254)) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function parseTarget(request: Request): URL | Response {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');
  if (!target) return new Response('Missing url parameter', { status: 400, headers: CORS });
  let t: URL;
  try {
    t = new URL(target);
  } catch {
    return new Response('Invalid url parameter', { status: 400, headers: CORS });
  }
  if (t.protocol !== 'http:' && t.protocol !== 'https:') {
    return new Response('Unsupported protocol', { status: 400, headers: CORS });
  }
  if (isPrivateHost(t.hostname)) {
    return new Response('Host not allowed', { status: 403, headers: CORS });
  }
  return t;
}

async function proxy(target: URL, method: 'GET' | 'HEAD'): Promise<Response> {
  const upstream = await fetch(target.toString(), {
    method,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' },
    redirect: 'follow',
  });
  const contentType = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !contentType.startsWith('image/')) {
    return new Response('Not an image', { status: 415, headers: CORS });
  }
  const headers = new Headers(CORS);
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=86400');
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  return new Response(method === 'HEAD' ? null : upstream.body, { status: 200, headers });
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction = async (context) => {
  const target = parseTarget(context.request);
  if (target instanceof Response) return target;
  return proxy(target, 'GET');
};

export const onRequestHead: PagesFunction = async (context) => {
  const target = parseTarget(context.request);
  if (target instanceof Response) return target;
  return proxy(target, 'HEAD');
};
