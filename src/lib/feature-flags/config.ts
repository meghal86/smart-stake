/**
 * Feature Flags Configuration
 * 
 * Default configuration for all feature flags.
 * Can be overridden by Vercel Edge Config or environment variables.
 */

import { FeatureFlagsConfig } from './types';

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  rankingModelV2: {
    enabled: true, // Enabled for gradual rollout
    rolloutPercentage: 10, // 10% of users
    description: 'Enhanced ranking model with improved personalization weights',
    lastUpdated: new Date().toISOString(),
  },
  eligibilityPreviewV2: {
    enabled: true, // Enabled for gradual rollout
    rolloutPercentage: 50, // 50% of users
    description: 'Improved eligibility scoring with additional signals',
    lastUpdated: new Date().toISOString(),
  },
  sponsoredPlacementV2: {
    enabled: true,
    rolloutPercentage: 100, // All users
    description: 'Enhanced sponsored placement with better distribution',
    lastUpdated: new Date().toISOString(),
  },
  guardianChipStyleV2: {
    enabled: false, // Disabled completely
    rolloutPercentage: 0, // 0% rollout
    description: 'New Guardian trust chip design with improved accessibility',
    lastUpdated: new Date().toISOString(),
  },
};

/**
 * Get feature flag configuration from environment variables
 * Format: FEATURE_FLAG_<FLAG_NAME>=enabled:rolloutPercentage
 * Example: FEATURE_FLAG_RANKING_MODEL_V2=true:25
 */
export function getFeatureFlagFromEnv(flagName: string): Partial<FeatureFlagsConfig[keyof FeatureFlagsConfig]> | null {
  const envKey = `FEATURE_FLAG_${flagName.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  const envValue = process.env[envKey];
  
  if (!envValue) {
    return null;
  }
  
  const [enabledStr, rolloutStr] = envValue.split(':');
  
  return {
    enabled: enabledStr === 'true',
    rolloutPercentage: rolloutStr ? parseInt(rolloutStr, 10) : 100,
  };
}
