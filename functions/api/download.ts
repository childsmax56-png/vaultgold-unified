// Streams a Pillowcase (pillows.su) file back through our own origin with a
// forced `Content-Disposition: attachment` and a human filename, so album-copy
// zips download directly on the site instead of opening the host's page.
//
// Locked to Pillowcase file ids only (no arbitrary `url` param) to avoid turning
// this into an open proxy / SSRF. Pixeldrain is handled client-side via its own
// `?download` link, and krakenfiles' download is Turnstile-gated so it can't be
// proxied — see kraken-proxy.ts.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition',
};

// Strip characters that are unsafe in a Content-Disposition filename / on disk.
function sanitizeFilename(name: string): string {
  const cleaned = (name || 'album-copy')
    .replace(/[\r\n"\\/:*?<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  const base = cleaned || 'album-copy';
  return /\.zip$/i.test(base) ? base : `${base}.zip`;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS });
};

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    const name = url.searchParams.get('name') ?? '';

    if (!/^[A-Za-z0-9]+$/.test(id)) {
      return new Response('Invalid file id', { status: 400, headers: CORS });
    }

    const range = context.request.headers.get('Range');
    const upstream = await fetch(`https://api.pillows.su/api/get/${id}`, {
      headers: range ? { Range: range } : {},
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error (status ${upstream.status})`, { status: 502, headers: CORS });
    }

    const filename = sanitizeFilename(name);
    const headers = new Headers(CORS);
    headers.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    headers.set('Accept-Ranges', 'bytes');

    const upstreamType = upstream.headers.get('Content-Type') ?? '';
    headers.set('Content-Type', upstreamType && upstreamType !== 'application/octet-stream' ? upstreamType : 'application/zip');

    for (const h of ['Content-Length', 'Content-Range']) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(`download error: ${err instanceof Error ? err.message : String(err)}`, { status: 500, headers: CORS });
  }
};
