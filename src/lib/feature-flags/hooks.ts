/**
 * React Hooks for Feature Flags
 * 
 * Client-side hooks for checking feature flags in React components.
 */

import { useState, useEffect } from 'react';
import { FeatureFlags, FeatureFlagKey, FeatureFlagContext } from './types';
import { getFeatureFlags, getFeatureFlagsSync } from './client';

/**
 * Hook to check if a specific feature is enabled
 * 
 * @param flagKey - The feature flag to check
 * @param context - Context for rollout decision (userId, sessionId, etc.)
 * @returns Object with enabled status and loading state
 */
export function useFeatureFlag(
  flagKey: FeatureFlagKey,
  context: FeatureFlagContext = {}
): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    let mounted = true;
    
    async function checkFlag() {
      try {
        const flags = await getFeatureFlags(context);
        if (mounted) {
          setEnabled(flags[flagKey]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch feature flag:', error);
        if (mounted) {
          setEnabled(false);
          setLoading(false);
        }
      }
    }
    
    checkFlag();
    
    return () => {
      mounted = false;
    };
  }, [flagKey, context.userId, context.sessionId, context.ipAddress]);
  
  return { enabled, loading };
}

/**
 * Hook to get all feature flags
 * 
 * @param context - Context for rollout decision (userId, sessionId, etc.)
 * @returns Object with all flags and loading state
 */
export function useFeatureFlags(
  context: FeatureFlagContext = {}
): { flags: FeatureFlags; loading: boolean } {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlagsSync(context));
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetchFlags() {
      try {
        const fetchedFlags = await getFeatureFlags(context);
        if (mounted) {
          setFlags(fetchedFlags);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    fetchFlags();
    
    return () => {
      mounted = false;
    };
  }, [context.userId, context.sessionId, context.ipAddress]);
  
  return { flags, loading };
}
