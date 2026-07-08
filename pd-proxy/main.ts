// pd-proxy — pixeldrain proxy for Deno Deploy (a non-Cloudflare host).
// A server-side fetch sends no Sec-Fetch-Site and no cf-worker header, so
// pixeldrain returns 200 instead of its hotlink 403. Forwards Range requests
// for audio seeking and adds permissive CORS so the browser can read it.
//
// Deploy: https://dash.deno.com -> New Project -> deploy from GitHub, pick this
// repo, set the entrypoint to `pd-proxy/main.ts`. You get an https://*.deno.dev
// URL; put that in the app's VITE_PIXELDRAIN_PROXY_URL env var.
//
// The app calls `${PROXY}/api/<id>`, so this serves /api/<id>. It also accepts
// /api/file/<id> and /<id> as aliases, and / as a health check.

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Access-Control-Expose-Headers":
    "Content-Length, Content-Range, Accept-Ranges, Content-Disposition",
  "Access-Control-Max-Age": "86400",
};

// Optional: a pixeldrain Pro API key raises rate limits. Set it as an env var
// in the Deno Deploy project settings (Settings -> Environment Variables).
const API_KEY = Deno.env.get("PIXELDRAIN_API_KEY") ?? "";

function extractId(pathname: string): string {
  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  if (parts[0] === "api" && parts[1] === "file") return parts[2] ?? "";
  if (parts[0] === "api") return parts[1] ?? "";
  return parts[0] ?? "";
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (url.pathname === "/" || url.pathname === "") {
    return new Response("ok", { headers: { "Content-Type": "text/plain", ...CORS } });
  }

  const id = extractId(url.pathname);
  if (!id) {
    return new Response("Missing file ID", { status: 400, headers: CORS });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  const range = req.headers.get("range");
  const upstreamHeaders: Record<string, string> = {};
  if (API_KEY) upstreamHeaders["Authorization"] = "Basic " + btoa(":" + API_KEY);
  if (range) upstreamHeaders["Range"] = range;

  const target = `https://pixeldrain.com/api/file/${id}`;
  let upstream = await fetch(target, { method: req.method, headers: upstreamHeaders });

  // If the API key caused a 403, retry without it (public files don't need it).
  if (upstream.status === 403 && API_KEY) {
    const fallback: Record<string, string> = {};
    if (range) fallback["Range"] = range;
    upstream = await fetch(target, { method: req.method, headers: fallback });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Upstream error", { status: upstream.status, headers: CORS });
  }

  // Force audio/mpeg when pixeldrain returns a generic binary type — browsers
  // won't play application/octet-stream as audio even though the bytes are valid.
  const upstreamType = upstream.headers.get("content-type") ?? "";
  const contentType =
    upstreamType && upstreamType !== "application/octet-stream" ? upstreamType : "audio/mpeg";

  const headers = new Headers(CORS);
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");
  for (const h of ["content-length", "content-range", "content-disposition"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  const body = req.method === "HEAD" ? null : upstream.body;
  return new Response(body, { status: upstream.status, headers });
});
