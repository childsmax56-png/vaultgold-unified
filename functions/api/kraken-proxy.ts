// Resolves a krakenfiles.com/view/<id>/file.html page to its direct CDN
// download URL and streams the file back, mirroring the pattern used by
// audio-proxy.ts for other hosts that require server-side resolution.
//
// krakenfiles serves an inline <video>/<audio> preview with a direct CDN
// src on the view page itself for media files, and only requires the
// token/hash POST dance for the "Download" button on non-previewable
// files. We try the direct-source path first since it's simpler and more
// reliable for the audio/video files this proxy is used for, then fall
// back to the token/hash flow.
export const onRequestGet: PagesFunction = async (context) => {
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
  });
  if (!pageRes.ok) {
    return new Response('Failed to fetch source page', { status: 502 });
  }
  const html = await pageRes.text();

  if (debug) {
    return new Response(html, { headers: { 'Content-Type': 'text/plain' } });
  }

  let fileUrl: string | null =
    html.match(/<source[^>]+src=["']([^"']+)["']/i)?.[1] ??
    html.match(/<(?:video|audio)[^>]+src=["']([^"']+)["']/i)?.[1] ??
    null;

  if (fileUrl && fileUrl.startsWith('//')) fileUrl = `https:${fileUrl}`;

  if (!fileUrl) {
    const token = html.match(/data-token=["']([^"']+)["']/i)?.[1] ?? html.match(/token\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const hash = html.match(/hash\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const actionRaw = html.match(/<form[^>]+action=["']([^"']+)["']/i)?.[1] ?? html.match(/action\s*[:=]\s*["']([^"']+)["']/i)?.[1];

    if (!token || !hash) {
      return new Response('Could not parse download token', { status: 502 });
    }

    let postUrl: URL;
    try {
      postUrl = new URL(actionRaw || '/download/file-data', 'https://krakenfiles.com');
    } catch {
      return new Response('Invalid post url', { status: 502 });
    }
    if (postUrl.hostname !== 'krakenfiles.com') {
      return new Response('Host not allowed', { status: 403 });
    }

    const dlRes = await fetch(postUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0',
        'Referer': viewUrl.toString(),
      },
      body: new URLSearchParams({ hash, token }).toString(),
    });
    if (!dlRes.ok) {
      return new Response('Failed to resolve download link', { status: 502 });
    }
    const data = await dlRes.json().catch(() => null) as { url?: string } | null;
    fileUrl = data?.url ?? null;
  }

  if (!fileUrl) {
    return new Response('No download url found', { status: 502 });
  }

  const upstream = await fetch(fileUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': viewUrl.toString(),
      ...(context.request.headers.get('Range') ? { Range: context.request.headers.get('Range')! } : {}),
    },
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
};
