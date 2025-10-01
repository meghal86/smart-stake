import gatingConfig from '../config/gating.json';

export type Tier = 'free' | 'pro' | 'enterprise';

export function useGate() {
  const hasFeature = (feature: string, tier: Tier = 'free'): boolean => {
    return gatingConfig.tiers[tier]?.includes(feature) ?? false;
  };

  const hasFlag = (flag: string): boolean => {
    return gatingConfig.flags[flag] ?? false;
  };

  return { hasFeature, hasFlag };
}