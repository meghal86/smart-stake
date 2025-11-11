/**
 * Feature Flags Client
 * 
 * Main client for checking feature flags with support for:
 * - Vercel Edge Config
 * - Environment variables
 * - In-memory cache
 * - Gradual rollout
 */

import { FeatureFlags, FeatureFlagKey, FeatureFlagContext, FeatureFlagsConfig } from './types';
import { DEFAULT_FEATURE_FLAGS, getFeatureFlagFromEnv } from './config';
import { shouldEnableFeature } from './rollout';

// In-memory cache for feature flags (60 second TTL)
let cachedFlags: FeatureFlagsConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Fetch feature flags from Vercel Edge Config (optional)
 * Falls back to environment variables and defaults
 */
async function fetchFromEdgeConfig(): Promise<Partial<FeatureFlagsConfig> | null> {
  if (!process.env.EDGE_CONFIG) {
    return null;
  }
  
  try {
    // Use eval to prevent Vite from trying to resolve at build time
    // This makes @vercel/edge-config truly optional
    const importEdgeConfig = new Function('return import("@vercel/edge-config")');
    const edgeConfig = await importEdgeConfig().catch(() => null);
    
    if (edgeConfig && edgeConfig.get) {
      return await edgeConfig.get<Partial<FeatureFlagsConfig>>('featureFlags');
    }
  } catch (error) {
    console.warn('Failed to fetch from Edge Config:', error);
  }
  
  return null;
}

/**
 * Fetch feature flags from all sources
 * Priority: Edge Config > Environment Variables > Defaults
 */
async function fetchFeatureFlags(): Promise<FeatureFlagsConfig> {
  // Check cache first
  const now = Date.now();
  if (cachedFlags && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedFlags;
  }
  
  let flags = { ...DEFAULT_FEATURE_FLAGS };
  
  // Try to fetch from Vercel Edge Config if available
  const edgeFlags = await fetchFromEdgeConfig();
  if (edgeFlags) {
    flags = {
      ...flags,
      ...edgeFlags,
    };
  }
  
  // Override with environment variables if present
  for (const flagName of Object.keys(flags) as FeatureFlagKey[]) {
    const envOverride = getFeatureFlagFromEnv(flagName);
    if (envOverride) {
      flags[flagName] = {
        ...flags[flagName],
        ...envOverride,
      };
    }
  }
  
  // Update cache
  cachedFlags = flags;
  cacheTimestamp = now;
  
  return flags;
}

/**
 * Check if a specific feature flag is enabled for the given context
 */
export async function isFeatureEnabled(
  flagKey: FeatureFlagKey,
  context: FeatureFlagContext = {}
): Promise<boolean> {
  const flags = await fetchFeatureFlags();
  const flag = flags[flagKey];
  
  if (!flag) {
    return false;
  }
  
  return shouldEnableFeature(flag.enabled, flag.rolloutPercentage, context);
}

/**
 * Get all feature flags for the given context
 * Returns a boolean map of enabled/disabled features
 */
export async function getFeatureFlags(context: FeatureFlagContext = {}): Promise<FeatureFlags> {
  const config = await fetchFeatureFlags();
  const flags: Partial<FeatureFlags> = {};
  
  for (const [key, value] of Object.entries(config)) {
    flags[key as FeatureFlagKey] = shouldEnableFeature(
      value.enabled,
      value.rolloutPercentage,
      context
    );
  }
  
  return flags as FeatureFlags;
}

/**
 * Get the raw configuration for all feature flags (admin use)
 */
export async function getFeatureFlagsConfig(): Promise<FeatureFlagsConfig> {
  return fetchFeatureFlags();
}

/**
 * Clear the feature flags cache (useful for testing)
 */
export function clearFeatureFlagsCache(): void {
  cachedFlags = null;
  cacheTimestamp = 0;
}

/**
 * Synchronous version for client-side use (uses cached values only)
 * Returns default values if cache is empty
 */
export function getFeatureFlagsSync(context: FeatureFlagContext = {}): FeatureFlags {
  const config = cachedFlags || DEFAULT_FEATURE_FLAGS;
  const flags: Partial<FeatureFlags> = {};
  
  for (const [key, value] of Object.entries(config)) {
    flags[key as FeatureFlagKey] = shouldEnableFeature(
      value.enabled,
      value.rolloutPercentage,
      context
    );
  }
  
  return flags as FeatureFlags;
}
