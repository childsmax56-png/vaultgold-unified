// Streams the desktop app installers back through our own origin so the
// public download links never expose the upstream release host (or the
// account name in its URL). The frontend links at `/api/app-download?os=...`;
// this function resolves that to the correct installer and streams it,
// forcing a `Content-Disposition: attachment` with a clean filename.
//
// Bump VERSION when a new desktop release is tagged. Asset names follow
// electron-builder's `UNVAULTED-<version>-<os>-<arch>.<ext>` pattern.
const REPO = 'https://github.com/childsmax56-png/vaultgold-unified';
const VERSION = 'v1.0.2';
const v = VERSION.slice(1); // "1.0.2"

// Map the public `os` param to an installer asset. Keep this the single
// source of truth for which builds exist.
const ASSETS: Record<string, string> = {
  'mac-arm': `UNVAULTED-${v}-mac-arm64.dmg`,
  'mac-intel': `UNVAULTED-${v}-mac-x64.dmg`,
  'win': `UNVAULTED-${v}-win-x64.exe`,
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition',
};

function contentType(filename: string): string {
  if (filename.endsWith('.dmg')) return 'application/x-apple-diskimage';
  if (filename.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  return 'application/octet-stream';
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS });
};

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const os = (url.searchParams.get('os') ?? '').trim().toLowerCase();

    const filename = ASSETS[os];
    if (!filename) {
      return new Response('Unknown download', { status: 404, headers: CORS });
    }

    const range = context.request.headers.get('Range');
    const upstream = await fetch(`${REPO}/releases/download/${VERSION}/${filename}`, {
      headers: range ? { Range: range } : {},
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error (status ${upstream.status})`, { status: 502, headers: CORS });
    }

    const headers = new Headers(CORS);
    headers.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    headers.set('Content-Type', contentType(filename));
    headers.set('Accept-Ranges', 'bytes');

    for (const h of ['Content-Length', 'Content-Range']) {
      const value = upstream.headers.get(h);
      if (value) headers.set(h, value);
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(`download error: ${err instanceof Error ? err.message : String(err)}`, { status: 500, headers: CORS });
  }
};
