// Cloud sync for the global (cross-tracker) playlists.
//
// Mirrors src/dataSync.ts but targets the single global endpoint
// `GET/PUT /api/playlists` (functions/api/playlists.ts) instead of the
// per-tracker `/api/sync/{slug}`. Local state stays the source of truth for the
// UI; this pushes it up (debounced) on change and pulls it down on load so a
// signed-in user sees the same playlists on any device.
import type { UserPlaylist } from './types';

const VG_API = '';
const TOKEN_KEY = 'vg_token';
export const GLOBAL_PLAYLISTS_KEY = 'vg_global_playlists';
const PUSH_DEBOUNCE_MS = 1200;

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isSyncLoggedIn(): boolean {
  return !!getToken();
}

function readLocal(): UserPlaylist[] {
  try {
    const raw = localStorage.getItem(GLOBAL_PLAYLISTS_KEY);
    return raw ? (JSON.parse(raw) as UserPlaylist[]) : [];
  } catch {
    return [];
  }
}

// `pulled` gates pushing so a fresh device's empty localStorage can't wipe cloud
// data before the first pull. Keyed by token so switching accounts (sign out →
// sign in) is treated as un-pulled until the new account's data is fetched.
const pulled = new Set<string>();
let lastSnapshot = '';
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function stateKey(): string {
  return getToken() ?? '';
}

async function pushNow(): Promise<void> {
  const token = getToken();
  if (!token) return;
  if (!pulled.has(stateKey())) return;
  // Never send derived/read-only playlists (Favorites) — the server drops them
  // anyway, but this keeps the payload lean and the snapshot honest.
  const payload = { playlists: readLocal().filter(p => !p.readonly) };
  const snapshot = JSON.stringify(payload);
  if (snapshot === lastSnapshot) return;
  try {
    const res = await fetch(`${VG_API}/api/playlists`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: snapshot,
    });
    if (res.ok) lastSnapshot = snapshot;
  } catch {
    // Best-effort: a failed push retries on the next local change.
  }
}

export function scheduleGlobalPlaylistPush(): void {
  if (!isSyncLoggedIn()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; void pushNow(); }, PUSH_DEBOUNCE_MS);
}

// Pull cloud playlists into localStorage and notify the app.
export async function pullGlobalPlaylists(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${VG_API}/api/playlists`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json() as { playlists?: UserPlaylist[] };
    const cloud = data.playlists ?? [];
    // Merge: cloud is authoritative for playlists that exist there, but keep any
    // local-only playlists made offline (matched by name) so a first sync from a
    // device that already has local playlists doesn't lose them.
    const local = readLocal().filter(p => !p.readonly);
    const cloudNames = new Set(cloud.map(p => p.name.toLowerCase()));
    const merged = [...cloud, ...local.filter(p => !cloudNames.has(p.name.toLowerCase()))];
    localStorage.setItem(GLOBAL_PLAYLISTS_KEY, JSON.stringify(merged));
    pulled.add(stateKey());
    lastSnapshot = JSON.stringify({ playlists: cloud });
    window.dispatchEvent(new CustomEvent('vg-global-playlists-synced'));
    // If the merge introduced local-only playlists, push them up.
    if (merged.length !== cloud.length) scheduleGlobalPlaylistPush();
  } catch {
    // Best-effort: leave local state untouched on failure.
  }
}

// Run on app load: pull once per session so playlists show up on a new device.
let initialized = false;
export async function initGlobalPlaylistSync(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!isSyncLoggedIn()) return;
  await pullGlobalPlaylists();
}
