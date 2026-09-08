import { ARTIST_REGISTRY } from './artists/registry';

// Era cover art is bundled per-tracker in each config's `CUSTOM_IMAGES`
// (eraName → image URL), so a song's era artwork can be resolved for ANY tracker
// without loading it. Used by the global playlists/favorites so songs show their
// real era cover instead of the tracker logo. Community (DB-backed) trackers
// aren't in the registry → returns undefined, and callers fall back.
export function eraArtwork(tracker?: string, eraName?: string): string | undefined {
  if (!tracker || !eraName) return undefined;
  const cfg = ARTIST_REGISTRY[tracker];
  return cfg?.CUSTOM_IMAGES?.[eraName];
}
