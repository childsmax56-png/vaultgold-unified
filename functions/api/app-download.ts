// Streams the desktop app installers back through our own origin so the
// public download links never expose the upstream release host (or the
// account name in its URL). The frontend links at `/api/app-download?os=...`;
// this function resolves that to the correct installer and streams it,
// forcing a `Content-Disposition: attachment` with a clean filename.
//
// When the repository is private, set a GITHUB_TOKEN secret on the Pages
// project (a fine-grained PAT with `Contents: read` on this repo). The
// function then fetches the asset through the GitHub API with that token.
// Without a token it falls back to the public release download URL, so the
// site keeps working while the repo is still public.
//
// Bump VERSION when a new desktop release is tagged. Asset names follow
// electron-builder's `UNVAULTED-<version>-<os>-<arch>.<ext>` pattern.
interface Env {
  GITHUB_TOKEN?: string;
}

const OWNER = 'childsmax56-png';
const REPO = 'vaultgold-unified';
const VERSION = 'v1.0.3';
const v = VERSION.slice(1); // "1.0.3"

// Map the public `os` param to an installer asset. Keep this the single
// source of truth for which builds exist.
const ASSETS: Record<string, string> = {
  'mac-arm': `UNVAULTED-${v}-mac-arm64.dmg`,
  'mac-intel': `UNVAULTED-${v}-mac-x64.dmg`,
  'win': `UNVAULTED-${v}-win-x64.exe`,
  'linux': `UNVAULTED-${v}-linux-x86_64.AppImage`,
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
  if (filename.endsWith('.AppImage')) return 'application/x-executable';
  return 'application/octet-stream';
}

// Resolve the release asset id for a filename, then stream its bytes through
// the GitHub API using the token — this is the path that works for a private
// repo (the plain `releases/download/...` URL 404s once private).
async function fetchViaApi(token: string, filename: string, range: string | null): Promise<Response> {
  const ua = { 'User-Agent': 'unvaulted-downloader', Authorization: `Bearer ${token}` };

  // Pre-formed error responses carry this marker so the caller passes them
  // through instead of collapsing them into a generic 502.
  const errHeaders = { ...CORS, 'X-Proxy-Error': '1' };

  const rel = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${VERSION}`, {
    headers: { ...ua, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(30000),
  });
  if (!rel.ok) {
    return new Response(`Release lookup failed (status ${rel.status})`, { status: 502, headers: errHeaders });
  }

  const data = await rel.json() as { assets?: Array<{ id: number; name: string }> };
  const asset = data.assets?.find((a) => a.name === filename);
  if (!asset) {
    return new Response('Installer not found for this release', { status: 404, headers: errHeaders });
  }

  // The asset API redirects to a signed storage URL; the runtime strips the
  // Authorization header on that cross-origin hop, so the token isn't leaked.
  return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${asset.id}`, {
    headers: { ...ua, Accept: 'application/octet-stream', ...(range ? { Range: range } : {}) },
    redirect: 'follow',
  });
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const os = (url.searchParams.get('os') ?? '').trim().toLowerCase();

    const filename = ASSETS[os];
    if (!filename) {
      return new Response('Unknown download', { status: 404, headers: CORS });
    }

    const range = request.headers.get('Range');

    const upstream = env.GITHUB_TOKEN
      ? await fetchViaApi(env.GITHUB_TOKEN, filename, range)
      : await fetch(`https://github.com/${OWNER}/${REPO}/releases/download/${VERSION}/${filename}`, {
          headers: range ? { Range: range } : {},
          redirect: 'follow',
          signal: AbortSignal.timeout(30000),
        });

    if (!upstream.ok && upstream.status !== 206) {
      // Pass through our own pre-formed errors; wrap raw upstream failures.
      return upstream.headers.get('X-Proxy-Error')
        ? upstream
        : new Response(`Upstream error (status ${upstream.status})`, { status: 502, headers: CORS });
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
