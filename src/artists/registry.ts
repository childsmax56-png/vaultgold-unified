import type { ArtistConfig } from './types';
import { yzygoldConfig } from './yzygold';
import { vampgoldConfig } from './vampgold';
import { kdotgoldConfig } from './kdotgold';
import { drizzygoldConfig } from './drizzygold';
import { xgoldConfig } from './xgold';
import { cactigoldConfig } from './cactigold';
import { dregoldConfig } from './dregold';
import { pushagoldConfig } from './pushagold';
import { shadygoldConfig } from './shadygold';
import { twizzygoldConfig } from './twizzygold';
import { uzigoldConfig } from './uzigold';
import { wolfgoldConfig } from './wolfgold';
import { juicegoldConfig } from './juicegold';

export const ARTIST_REGISTRY: Record<string, ArtistConfig> = {
  yzygold: yzygoldConfig,
  vampgold: vampgoldConfig,
  wolfgold: wolfgoldConfig,
  drizzygold: drizzygoldConfig,
  xgold: xgoldConfig,
  cactigold: cactigoldConfig,
  kdotgold: kdotgoldConfig,
  uzigold: uzigoldConfig,
  pushagold: pushagoldConfig,
  shadygold: shadygoldConfig,
  twizzygold: twizzygoldConfig,
  dregold: dregoldConfig,
  juicegold: juicegoldConfig,
};

export const ARTIST_LIST: ArtistConfig[] = Object.values(ARTIST_REGISTRY);

export function getArtistConfig(slug: string): ArtistConfig | undefined {
  return ARTIST_REGISTRY[slug];
}
