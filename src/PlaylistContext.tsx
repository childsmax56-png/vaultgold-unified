// Compatibility shim.
//
// Playlists used to be per-tracker and lived here. They are now global and live
// in GlobalPlaylistContext (mounted once at the app root in main.tsx). This shim
// keeps the old `usePlaylists()` / `<PlaylistProvider>` API working for existing
// call sites (PlayerBar, EraDetail, ImportPlaylistModal, YEditsGoldPage) while
// pointing them at the single global store.
//
// New code should import from './GlobalPlaylistContext' directly.
import { ReactNode } from 'react';
import { useGlobalPlaylists } from './GlobalPlaylistContext';

// The global provider is already mounted at the root, so this is a passthrough.
export function PlaylistProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Legacy consumers expect only user-created playlists in their "add to playlist"
// menus (there was no Favorites playlist before). Hide the derived read-only
// Favorites list from them; everything else is the global store unchanged.
export function usePlaylists() {
  const ctx = useGlobalPlaylists();
  return { ...ctx, playlists: ctx.playlists.filter(p => !p.readonly) };
}
