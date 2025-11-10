/**
 * Feature Flags Types
 * 
 * Defines all available feature flags and their configuration.
 */

export interface FeatureFlags {
  // Ranking model version 2 with improved personalization
  rankingModelV2: boolean;
  
  // Eligibility preview algorithm version 2 with enhanced scoring
  eligibilityPreviewV2: boolean;
  
  // Sponsored placement rules version 2 with improved capping
  sponsoredPlacementV2: boolean;
  
  // Guardian trust chip style version 2 with new design
  guardianChipStyleV2: boolean;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  description: string;
  lastUpdated: string;
}

export type FeatureFlagKey = keyof FeatureFlags;

export interface FeatureFlagsConfig {
  [K in FeatureFlagKey]: FeatureFlagConfig;
}

export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
}
