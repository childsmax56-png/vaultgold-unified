import type { ArtistConfig } from './types';
import { yzygoldConfig } from './yzygold';
import { vampgoldConfig } from './vampgold';
import { kdotgoldConfig } from './kdotgold';
import { drizzygoldConfig } from './drizzygold';
import { xgoldConfig } from './xgold';
import { cactigoldConfig } from './cactigold';
import { dregoldConfig } from './dregold';
import { pushagoldConfig } from './pushagold';
// import { shadygoldConfig } from './shadygold';
import { twizzygoldConfig } from './twizzygold';
import { uzigoldConfig } from './uzigold';

export const ARTIST_REGISTRY: Record<string, ArtistConfig> = {
  yzygold: yzygoldConfig,
  vampgold: vampgoldConfig,
  kdotgold: kdotgoldConfig,
  drizzygold: drizzygoldConfig,
  xgold: xgoldConfig,
  cactigold: cactigoldConfig,
  dregold: dregoldConfig,
  pushagold: pushagoldConfig,
  // shadygold: shadygoldConfig,
  twizzygold: twizzygoldConfig,
  uzigold: uzigoldConfig,
};

export const ARTIST_LIST: ArtistConfig[] = Object.values(ARTIST_REGISTRY);

export function getArtistConfig(slug: string): ArtistConfig | undefined {
  return ARTIST_REGISTRY[slug];
}
