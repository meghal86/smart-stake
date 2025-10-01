import { useMemo } from 'react';
import { useFeatureFlags } from './useFeatureFlags';
import { useTier } from './useTier';
import type { FeatureKey } from '@/app/_internal/feature-registry';
import gatingConfig from '../../config/gating.json';

export type UserTier = 'free' | 'pro' | 'enterprise';

export function useGate(featureKey: FeatureKey) {
  const { isEnabled } = useFeatureFlags();
  const { tier } = useTier();
  
  const hasAccess = useMemo(() => {
    // Check existing feature flags first
    const flagKey = featureKey.toLowerCase();
    if (isEnabled(flagKey)) return true;
    
    // Check tier-based gating
    const userTier = tier || 'free';
    const allowedFeatures = gatingConfig[userTier as keyof typeof gatingConfig] || [];
    
    return allowedFeatures.includes(featureKey);
  }, [featureKey, isEnabled, tier]);
  
  const requiredTier = useMemo(() => {
    for (const [tierName, features] of Object.entries(gatingConfig)) {
      if (features.includes(featureKey)) {
        return tierName as UserTier;
      }
    }
    return 'free';
  }, [featureKey]);
  
  return {
    hasAccess,
    requiredTier,
    currentTier: tier || 'free',
    needsUpgrade: !hasAccess && requiredTier !== 'free'
  };
}