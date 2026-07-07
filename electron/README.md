# UNVAULTED Desktop (Electron)

A thin native desktop shell for **Windows + macOS** that loads the live site at
`https://unvaulted.cc` in a real app window.

## Why a shell (not a bundled frontend)

The web app calls its backend with **relative `/api/*` paths**, uses **cookie
auth**, and does **OAuth redirects keyed to `window.location.origin`**. Loading
the real origin means all of that works unchanged, and the app auto-updates
whenever the site ships — no desktop rebuild required for site changes.

## Run in development

```bash
npm run app:dev
```

Point it at a local dev server instead of production:

```bash
UNVAULTED_URL=http://localhost:5173 npm run app:dev
```

## Build installers

Output goes to `release/` (gitignored).

```bash
npm run app:build:mac   # .dmg + .zip (arm64 + x64) — run on macOS
npm run app:build:win   # .exe NSIS installer (x64) — run on Windows
npm run app:build       # current platform
```

> **Cross-building note:** a Windows `.exe` is best produced **on Windows or in
> CI** (e.g. GitHub Actions `windows-latest`). electron-builder can sometimes
> cross-build Windows from macOS via Wine, but it's unreliable and unsigned.
> The macOS build must run on macOS. Code-signing/notarization is not configured
> yet — installers will be unsigned until certs are added.

## Widevine / Spotify

Spotify's Web Playback SDK needs Widevine DRM (EME), which stock Electron doesn't
ship. This app uses the **castlabs Electron fork** (`electron` pinned to a
`+wvcus` release) which bundles Widevine; `main.cjs` calls `components.whenReady()`
before opening a window so the CDM is loaded.

- **Dev (`npm run app:dev`)**: Spotify playback works immediately — no signing.
- **Packaged builds (.dmg/.exe)**: Widevine requires the app to be **VMP-signed**
  (castlabs "Verified Media Path" — free, and separate from Apple/Windows code
  signing). Without it, protected playback fails on end-user machines.

One-time EVS setup (for whoever builds releases):

```bash
pip install castlabs-evs
python3 -m castlabs_evs.account signup   # free; needs an email to confirm
```

After that, `npm run app:build:*` VMP-signs automatically via the `afterPack`
hook (`electron/vmp-sign.cjs`). For CI, add the account as repo secrets
**`EVS_ACCOUNT_NAME`** and **`EVS_PASSWORD`** (the build workflow already installs
`castlabs-evs` and passes them through). If EVS isn't set up the build still
succeeds — it just skips VMP signing and prints a warning.

## Files

- `main.cjs` — main process: window, menu, single-instance lock, window-state
  persistence, a clean Chrome user-agent, and navigation rules (site + OAuth
  hosts navigate in place; external links open in a new in-app window so you
  never lose your place).
- `pixeldrain-proxy.cjs` — a loopback server that streams pixeldrain audio and
  downloads directly from Node (which isn't subject to pixeldrain's hotlink
  block). Requests to the site's `pd-proxy.vercel.app` (and direct
  `pixeldrain.com/api/file/*`) are transparently redirected to it, so pixeldrain
  works in the app even when the external Vercel proxy is disabled/down.
- `preload.cjs` — exposes a read-only `window.unvaultedDesktop` flag so the web
  app can detect the desktop shell.
- `vmp-sign.cjs` — electron-builder `afterPack` hook that VMP-signs packaged
  builds for Widevine (best-effort; see "Widevine / Spotify" above).
- `../build/icon.png` — 1024×1024 app icon (electron-builder derives `.ico` /
  `.icns` at build time).
