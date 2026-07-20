// Local pixeldrain proxy for the desktop app.
//
// Pixeldrain blocks any request carrying `Sec-Fetch-Site: cross-site` (hotlink
// protection) or a `cf-worker` header, so the browser can't play its audio
// directly and a Cloudflare Function can't proxy it. The live site works around
// this with an external Deno Deploy proxy (see pd-proxy/ and the intercept list
// below), but any single external proxy can go dark (bandwidth cap, deleted
// project), which silently breaks every Pixeldrain link.
//
// In the desktop app we don't need any of that: the Electron main process is a
// Node environment, and a plain Node fetch sends neither blocked header. So we
// run a tiny loopback server that fetches pixeldrain directly and stream it back,
// then transparently redirect the site's proxy/pixeldrain requests to it. Result:
// pixeldrain audio (and downloads) work in the app even when pd-proxy is down,
// with no site code changes and no external bandwidth limit.

const http = require('http');
const { Readable } = require('stream');

// Response headers worth forwarding for correct streaming/seeking/downloads.
const FORWARD_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'etag',
  'last-modified',
];

function createServer() {
  return http.createServer(async (req, res) => {
    // Path shape: /f/<id> , optional ?download to get pixeldrain's attachment.
    const u = new URL(req.url, 'http://127.0.0.1');
    const id = decodeURIComponent(u.pathname.replace(/^\/f\//, '').replace(/^\/+/, ''));
    if (!id) {
      res.statusCode = 400;
      res.end('missing id');
      return;
    }

    const target =
      'https://pixeldrain.com/api/file/' +
      encodeURIComponent(id) +
      (u.searchParams.has('download') ? '?download' : '');

    try {
      const headers = {};
      if (req.headers.range) headers.Range = req.headers.range;
      const upstream = await fetch(target, { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers });

      res.statusCode = upstream.status;
      for (const h of FORWARD_HEADERS) {
        const v = upstream.headers.get(h);
        if (v) res.setHeader(h, v);
      }
      res.setHeader('access-control-allow-origin', '*');

      if (req.method === 'HEAD' || !upstream.body) {
        res.end();
        return;
      }
      Readable.fromWeb(upstream.body).pipe(res);
    } catch (e) {
      res.statusCode = 502;
      res.end('pixeldrain proxy error: ' + String(e));
    }
  });
}

// Start the loopback server and wire the session's requests to it.
// Returns a Promise that resolves once the server is listening.
function installPixeldrainProxy(ses) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const base = `http://127.0.0.1:${port}`;

      // Intercept whatever proxy host the site is configured to use, plus the
      // raw pixeldrain API, and serve them all from the local loopback instead —
      // so the desktop app keeps working even if the external proxy is down.
      // Keep the *.deno.net entry in sync with DEFAULT_PIXELDRAIN_PROXY_URL in
      // src/utils.tsx.
      ses.webRequest.onBeforeRequest(
        {
          urls: [
            'https://*.deno.net/*', // the site's current Deno Deploy proxy host
            'https://pd-proxy.vercel.app/*', // legacy Vercel proxy host
            'https://pixeldrain.com/api/file/*', // the "play directly" fallback path
          ],
        },
        (details, cb) => {
          try {
            const src = new URL(details.url);
            // Extract the pixeldrain id from either URL shape.
            const id = src.hostname === 'pixeldrain.com'
              ? src.pathname.replace(/^\/api\/file\//, '')
              : src.pathname.replace(/^\/api\//, '').replace(/^\/+/, '');
            const download = src.searchParams.has('download') || /[?&]download\b/.test(src.search) ? '?download' : '';
            cb({ redirectURL: `${base}/f/${encodeURIComponent(id)}${download}` });
          } catch {
            cb({}); // leave the request untouched on any parse error
          }
        }
      );

      resolve(port);
    });
  });
}

module.exports = { installPixeldrainProxy };
