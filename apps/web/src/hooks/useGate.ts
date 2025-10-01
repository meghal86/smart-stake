import gatingConfig from '../config/gating.json';

export type Tier = 'free' | 'pro' | 'enterprise';

type GatingConfig = {
  tiers: Record<string, string[]>;
  flags: Record<string, boolean>;
};

export function useGate() {
  const config = gatingConfig as GatingConfig;
  
  const hasFeature = (feature: string, tier: Tier = 'free'): boolean => {
    return config.tiers[tier]?.includes(feature) ?? false;
  };

  const hasFlag = (flag: string): boolean => {
    return config.flags[flag] ?? false;
  };

  return { hasFeature, hasFlag };
}