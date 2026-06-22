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
import { luckigoldConfig } from './luckigold';
import { dongoldConfig } from './dongold';
import { colegoldConfig } from './colegold';
import { aapgoldConfig } from './aapgold';
import { mfgoldConfig } from './mfgold';
import { mjgoldConfig } from './mjgold';
import { slimegoldConfig } from './slimegold';
import { sosagoldConfig } from './sosagold';

export const ARTIST_REGISTRY: Record<string, ArtistConfig> = {
  dongold: dongoldConfig,
  colegold: colegoldConfig,
  aapgold: aapgoldConfig,
  mfgold: mfgoldConfig,
  mjgold: mjgoldConfig,
  slimegold: slimegoldConfig,
  sosagold: sosagoldConfig,
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
  luckigold: luckigoldConfig,
};

export const ARTIST_LIST: ArtistConfig[] = Object.values(ARTIST_REGISTRY);

export function getArtistConfig(slug: string): ArtistConfig | undefined {
  return ARTIST_REGISTRY[slug];
}
