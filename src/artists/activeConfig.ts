import type { ArtistConfig } from './types';
import { yzygoldConfig } from './yzygold';

// Mutable singleton — mutated by setActiveConfig() before each artist route mounts.
// Components read from Proxy exports in utils.tsx, which always delegate here.
// The key={slug} on ArtistRoute forces a full remount on artist change,
// guaranteeing all reads happen after the config is set.
export const activeConfig: ArtistConfig = { ...yzygoldConfig };

export function setActiveConfig(config: ArtistConfig): void {
  // Remove keys not present in the new config so optional fields (e.g. navLogoUrl) don't bleed over
  for (const key of Object.keys(activeConfig) as (keyof ArtistConfig)[]) {
    if (!(key in config)) delete (activeConfig as Record<string, unknown>)[key];
  }
  Object.assign(activeConfig, config);
}
