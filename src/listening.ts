// Personal listening history — records plays for signed-in UNVAULTED users so
// they can see their own stats ("Wrapped"-style) at /listening.
//
// Auth'd endpoints must reach the same backend that issued the token, so these
// calls target the live site (mirrors MyTrackerPage's VG_API convention).

const VG_API = 'https://unvaulted.cc';
const TOKEN_KEY = 'vg_token';
// Local mirror of the server-side opt-in preference. Default ON.
const ENABLED_KEY = 'vg_listening_enabled';

export function getListeningToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isListeningLoggedIn(): boolean {
  return !!getListeningToken();
}

// Opt-in but defaults to enabled: only an explicit 'off' disables capture.
export function isListeningEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) !== 'off';
}

export function setListeningEnabledLocal(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off');
}

export interface ListenPayload {
  track: string;
  artist?: string;
  album?: string;
  eraName?: string;
  artistSlug?: string;
  songUrl?: string;
  durationSec?: number;
  playedAt?: number; // unix seconds
}

export async function logListen(payload: ListenPayload): Promise<void> {
  const token = getListeningToken();
  if (!token) return;
  if (!isListeningEnabled()) return;
  if (!payload.track) return;
  try {
    await fetch(`${VG_API}/api/listens/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Best-effort: never let stats capture interfere with playback.
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = getListeningToken();
  return fetch(`${VG_API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function fetchListeningStats(range: string): Promise<any> {
  const res = await authFetch(`/api/listens/stats?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json();
}

export async function fetchListeningPref(): Promise<boolean> {
  const res = await authFetch('/api/listens/prefs');
  if (!res.ok) throw new Error(`prefs ${res.status}`);
  const data = (await res.json()) as { enabled: boolean };
  setListeningEnabledLocal(data.enabled);
  return data.enabled;
}

export async function setListeningPref(enabled: boolean): Promise<void> {
  setListeningEnabledLocal(enabled);
  await authFetch('/api/listens/prefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}
