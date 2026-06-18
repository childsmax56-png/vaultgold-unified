// temp.imgur.gg's /api/file/<id> endpoint and its resulting CDN URL don't
// send CORS headers, so the browser blocks both the metadata lookup (axios/
// fetch surfaces this as a generic "Network Error") and, since <audio> is
// rendered with crossOrigin="anonymous" for the visualizer, the actual
// playback too. Resolve the id server-side and stream the file back through
// our own origin, mirroring the pattern used by kraken-proxy.ts.
export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('Missing id parameter', { status: 400 });
    }

    const metaRes = await fetch(`https://temp.imgur.gg/api/file/${id}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!metaRes.ok) {
      return new Response(`Failed to resolve imgur.gg file (status ${metaRes.status})`, { status: 502 });
    }
    const meta = await metaRes.json().catch(() => null) as { cdnUrl?: string; type?: string; name?: string } | null;
    if (!meta?.cdnUrl) {
      return new Response('No cdnUrl found', { status: 502 });
    }

    if (url.searchParams.get('meta') === '1') {
      return new Response(JSON.stringify(meta), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const upstream = await fetch(meta.cdnUrl, {
      headers: {
        ...(context.request.headers.get('Range') ? { Range: context.request.headers.get('Range')! } : {}),
      },
      signal: AbortSignal.timeout(20000),
    });

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Accept-Ranges', 'bytes');
    const ct = upstream.headers.get('content-type');
    if (ct) headers.set('Content-Type', ct);
    const cd = upstream.headers.get('content-disposition');
    if (cd) headers.set('Content-Disposition', cd);
    const cl = upstream.headers.get('content-length');
    if (cl) headers.set('Content-Length', cl);
    const cr = upstream.headers.get('content-range');
    if (cr) headers.set('Content-Range', cr);

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(`imgur-proxy error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
};
