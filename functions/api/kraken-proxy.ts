// Resolves a krakenfiles.com/view/<id>/file.html page to its direct CDN
// media URL and streams the file back, mirroring the pattern used by
// audio-proxy.ts for other hosts that require server-side resolution.
//
// The "Download now" button is gated behind a Cloudflare Turnstile
// captcha, so that flow can't be driven server-side. The inline jPlayer
// preview embedded on the page isn't gated though, and exposes the
// direct CDN URL via a `jPlayer("setMedia", { <ext>: '<url>' })` call,
// e.g. `m4a: 'https://pchs10.krakencloud.net/uploads/.../music.m4a'`.
// That's what we extract and stream from here.
//
// Everything below is wrapped in try/catch: an uncaught exception (e.g.
// the upstream fetch being blocked or timing out) otherwise surfaces as
// Cloudflare's own generic edge error page instead of a useful response.
export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const target = url.searchParams.get('url');
    const debug = url.searchParams.get('debug') === '1';

    if (!target) {
      return new Response('Missing url parameter', { status: 400 });
    }

    let viewUrl: URL;
    try {
      viewUrl = new URL(target);
    } catch {
      return new Response('Invalid url parameter', { status: 400 });
    }

    if (viewUrl.hostname !== 'krakenfiles.com') {
      return new Response('Host not allowed', { status: 403 });
    }

    const pageRes = await fetch(viewUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!pageRes.ok) {
      return new Response(`Failed to fetch source page (status ${pageRes.status})`, { status: 502 });
    }
    const html = await pageRes.text();

    if (debug) {
      return new Response(html, { headers: { 'Content-Type': 'text/plain' } });
    }

    let fileUrl: string | null =
      html.match(/["']setMedia["']\s*,\s*\{\s*[a-z0-9]+\s*:\s*['"]([^'"]+)['"]/i)?.[1] ??
      html.match(/<source[^>]+src=["']([^"']+)["']/i)?.[1] ??
      html.match(/<(?:video|audio)[^>]+src=["']([^"']+)["']/i)?.[1] ??
      null;

    if (fileUrl && fileUrl.startsWith('//')) fileUrl = `https:${fileUrl}`;

    if (!fileUrl) {
      return new Response('No download url found', { status: 502 });
    }

    const upstream = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': viewUrl.toString(),
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
    return new Response(`kraken-proxy error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
};
