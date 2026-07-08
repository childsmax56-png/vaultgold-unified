# pd-proxy

Tiny pixeldrain proxy for the app's audio playback. Pixeldrain blocks direct
browser access (cross-site hotlink detection via `Sec-Fetch-Site`, plus the
Cloudflare `cf-worker` header), so audio must be fetched by a **non-Cloudflare**
server that sends neither header. This proxy does exactly that, forwards HTTP
Range requests (for seeking), and adds permissive CORS.

## Deploy to Deno Deploy (free, no VM, no pasting)

1. Go to https://dash.deno.com and sign in with GitHub.
2. **New Project → Deploy from GitHub**, pick this repo.
3. Set the **entrypoint** to `pd-proxy/main.ts`. Production branch: `main`.
4. Deploy. You get a URL like `https://pd-proxy-xxxx.deno.dev`.

## Wire it into the app

In Cloudflare **Pages** → project → Settings → Environment Variables:

```
VITE_PIXELDRAIN_PROXY_URL = https://pd-proxy-xxxx.deno.dev
```

(no trailing slash, no `/api`). Redeploy the Pages project. The app builds
pixeldrain URLs as `${VITE_PIXELDRAIN_PROXY_URL}/api/<id>`.

## Verify

```
curl -sI "https://<your>.deno.dev/api/VXcXLEzn" | grep -i "http/\|content-type"
# -> 200, content-type: audio/mpeg
```
