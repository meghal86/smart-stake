/**
 * Feature Flag Rollout Logic
 * 
 * Implements deterministic percentage-based rollout using consistent hashing.
 */

import { FeatureFlagContext } from './types';

/**
 * Simple hash function for consistent rollout decisions
 * Uses djb2 algorithm for deterministic hashing
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Determine if a user should be included in a feature rollout
 * 
 * @param identifier - Unique identifier for the user (userId, sessionId, or ipAddress)
 * @param rolloutPercentage - Percentage of users to include (0-100)
 * @returns true if user should see the feature
 */
export function isInRollout(identifier: string, rolloutPercentage: number): boolean {
  if (rolloutPercentage <= 0) {
    return false;
  }
  
  if (rolloutPercentage >= 100) {
    return true;
  }
  
  // Use consistent hashing to determine rollout
  const hash = hashString(identifier);
  const bucket = hash % 100;
  
  return bucket < rolloutPercentage;
}

/**
 * Get a stable identifier from the context
 * Priority: userId > sessionId > ipAddress
 */
export function getIdentifier(context: FeatureFlagContext): string {
  return context.userId || context.sessionId || context.ipAddress || 'anonymous';
}

/**
 * Check if a feature should be enabled for a given context
 */
export function shouldEnableFeature(
  enabled: boolean,
  rolloutPercentage: number,
  context: FeatureFlagContext
): boolean {
  if (!enabled) {
    return false;
  }
  
  const identifier = getIdentifier(context);
  return isInRollout(identifier, rolloutPercentage);
}
