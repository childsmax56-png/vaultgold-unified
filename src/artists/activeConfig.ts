import type { ArtistConfig } from './types';
import { yzygoldConfig } from './yzygold';

// Mutable singleton — mutated by setActiveConfig() before each artist route mounts.
// Components read from Proxy exports in utils.tsx, which always delegate here.
// The key={slug} on ArtistRoute forces a full remount on artist change,
// guaranteeing all reads happen after the config is set.
export const activeConfig: ArtistConfig = { ...yzygoldConfig };

export function setActiveConfig(config: ArtistConfig): void {
  Object.assign(activeConfig, config);
}
