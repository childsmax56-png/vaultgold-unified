# pd-proxy

Tiny pixeldrain proxy for the app's audio playback. Pixeldrain blocks direct
browser access (cross-site hotlink detection via `Sec-Fetch-Site`, plus the
Cloudflare `cf-worker` header), so audio must be fetched by a **non-Cloudflare**
server that sends neither header. This proxy does exactly that, forwards HTTP
Range requests (for seeking), and adds permissive CORS.

The app has a built-in default proxy host (`DEFAULT_PIXELDRAIN_PROXY_URL` in
`src/utils.tsx`), so Pixeldrain keeps working even if the Cloudflare env var
below is missing. Set the env var too, but the default means a lost/renamed
proxy no longer silently breaks every Pixeldrain link. When you deploy a new
proxy, update **both** the env var and that default constant.

## Deploy to Deno Deploy

### Recommended: deployctl CLI (single file, no repo detection)

The dashboard's "Deploy from GitHub" flow auto-detects this repo as a Vite app
and rewrites the entrypoint into `src/`, which fails (`Entrypoint at
'.../src/pd-proxy/main.ts' not found`). Deploy the single file directly instead:

```bash
# 1. Install Deno + the deploy CLI (once)
curl -fsSL https://deno.land/install.sh | sh
export PATH="$HOME/.deno/bin:$PATH"
deno install -gArf jsr:@deno/deployctl

# 2. Deploy just this file (run from the repo root)
cd pd-proxy
deployctl deploy --project=pd-proxy --prod --entrypoint=main.ts
```

First run opens a browser to log in. If that handshake errors, use a token
instead: create one at https://dash.deno.com/account/access-tokens (starts with
`ddp_`), then `export DENO_DEPLOY_TOKEN="ddp_..."` and re-run the deploy.

You get a URL like `https://pd-proxy-xxxx.deno.dev` (or a
`https://<project>-<hash>.<account>.deno.net` URL from the newer dashboard).

Optional: set `PIXELDRAIN_API_KEY` in the project's env vars for higher rate
limits (public files work without it).

## Wire it into the app

1. In `src/utils.tsx`, set `DEFAULT_PIXELDRAIN_PROXY_URL` to the new URL.
2. In Cloudflare **Pages** → project → Settings → Environment Variables:

   ```
   VITE_PIXELDRAIN_PROXY_URL = https://<your-proxy-url>
   ```

   (no trailing slash, no `/api`). This is a **build-time** Vite variable, so
   redeploy the Pages project with a fresh build for it to take effect.

The app builds pixeldrain URLs as `${proxy}/api/<id>`.

## Verify

Use an ID that still exists on pixeldrain (deleted files 404):

```
curl -sI "https://<your-proxy-url>/api/<id>" | grep -i "http/\|content-type"
# -> 200, content-type: audio/mpeg
```
