// Minimal, safe preload. Runs with contextIsolation on, so the page cannot reach
// Node. We only expose a small read-only flag the web app can use to detect that
// it's running inside the desktop shell (e.g. to tweak UI or update messaging).
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('unvaultedDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: process.env.npm_package_version || null,
});
