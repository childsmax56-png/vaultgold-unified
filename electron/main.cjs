// UNVAULTED desktop shell (Electron).
// This is a thin native window that loads the live site at https://unvaulted.cc.
// The site's API (/api/*), cookie auth, and OAuth redirects all key off that
// origin, so loading the real origin keeps everything working with zero refactor
// and means the app auto-updates whenever the site ships.

const { app, BrowserWindow, Menu, session, components } = require('electron');
const path = require('path');
const fs = require('fs');
const { installPixeldrainProxy } = require('./pixeldrain-proxy.cjs');

const APP_URL = process.env.UNVAULTED_URL || 'https://unvaulted.cc';
const APP_ORIGIN = new URL(APP_URL).origin;

// Hosts we keep navigation for inside the app window. The site's own origin plus
// the OAuth providers it hands off to (Google / Spotify / Last.fm), which must be
// able to redirect back to unvaulted.cc within the same window to complete login.
const IN_APP_HOSTS = [
  /(^|\.)unvaulted\.cc$/i,
  /(^|\.)google\.com$/i,
  /(^|\.)accounts\.google\.com$/i,
  /(^|\.)spotify\.com$/i,
  /(^|\.)accounts\.spotify\.com$/i,
  /(^|\.)last\.fm$/i,
  /(^|\.)pixeldrain\.com$/i,
];

function isInAppHost(urlStr) {
  try {
    const host = new URL(urlStr).hostname;
    return IN_APP_HOSTS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

// --- Minimal window-state persistence (no extra deps) ---
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return { width: 1280, height: 860 };
  }
}

function saveState(win) {
  try {
    if (!win || win.isDestroyed()) return;
    const b = win.getBounds();
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ ...b, maximized: win.isMaximized() })
    );
  } catch {
    /* ignore */
  }
}

let mainWindow = null;

const WEB_PREFERENCES = {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  backgroundThrottling: false, // keep audio/animation smooth when not focused
  spellcheck: true,
};

// Open a URL in a separate in-app window (used for external links and popups),
// so the user never loses their place in the tracker they were viewing.
function openChildWindow(url) {
  const child = new BrowserWindow({
    width: 1100,
    height: 800,
    backgroundColor: '#1a1a1a',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: WEB_PREFERENCES,
  });
  attachNavigationHandlers(child, false);
  child.loadURL(url);
  return child;
}

// Navigation policy shared by every window.
// - New-window/popup intents always open a fresh window.
// - Top-level navigations to the site + OAuth providers stay in the same window
//   (SPA routing + the login round-trip need this); anything external opens in a
//   new window instead of replacing the current view.
function attachNavigationHandlers(win, isMain) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) openChildWindow(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isInAppHost(url)) return; // let the site / OAuth navigate in place
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      openChildWindow(url);
    }
  });
}

function createWindow() {
  const state = loadState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width || 1280,
    height: state.height || 860,
    minWidth: 480,
    minHeight: 600,
    backgroundColor: '#1a1a1a',
    title: 'UNVAULTED',
    autoHideMenuBar: process.platform !== 'darwin',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: WEB_PREFERENCES,
  });

  if (state.maximized) mainWindow.maximize();

  mainWindow.loadURL(APP_URL);
  attachNavigationHandlers(mainWindow, true);

  mainWindow.on('close', () => saveState(mainWindow));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow && mainWindow.loadURL(APP_URL),
        },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => mainWindow && mainWindow.webContents.navigationHistory.canGoBack() && mainWindow.webContents.navigationHistory.goBack(),
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => mainWindow && mainWindow.webContents.navigationHistory.canGoForward() && mainWindow.webContents.navigationHistory.goForward(),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Single-instance: focus the existing window instead of opening a second one.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Load the Widevine CDM (castlabs Electron fork) before opening any window,
    // so Spotify's Web Playback SDK — which needs EME/DRM — can register a device.
    try {
      await components.whenReady();
      console.log('Widevine ready:', components.status && components.status());
    } catch (e) {
      console.error('Widevine component failed to load:', e);
    }

    // Present as plain Chrome (drop the "Electron/x.y.z" token) so third-party
    // services that sniff the user-agent behave the same as in a browser.
    app.userAgentFallback = app.userAgentFallback.replace(/ Electron\/[\d.]+/, '');

    // Allow media playback (audio) without prompting; deny the rest by default.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      cb(['media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'notifications'].includes(permission));
    });

    // Serve pixeldrain audio/downloads locally so they work even when the site's
    // external Vercel proxy is down. Must be installed before the window loads.
    try {
      await installPixeldrainProxy(session.defaultSession);
    } catch (e) {
      console.error('pixeldrain proxy failed to start:', e);
    }

    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
