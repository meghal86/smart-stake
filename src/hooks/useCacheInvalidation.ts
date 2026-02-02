/**
 * Cache Invalidation Hook
 * 
 * React hook for integrating cache invalidation with wallet switching,
 * transaction detection, and policy changes.
 * 
 * Requirements: 10.6
 */

import { useEffect, useCallback, useRef } from 'react';
import { cacheInvalidationEngine } from '@/lib/cache/CacheInvalidationEngine';
import { useWalletSwitching } from './useWalletSwitching';

export interface UseCacheInvalidationOptions {
  /**
   * User ID for cache invalidation
   */
  userId: string;

  /**
   * Enable automatic invalidation on wallet switch
   */
  enableWalletSwitchInvalidation?: boolean;

  /**
   * Enable scheduled refresh
   */
  enableScheduledRefresh?: boolean;

  /**
   * Scheduled refresh interval in milliseconds
   */
  scheduledRefreshIntervalMs?: number;

  /**
   * Callback when cache is invalidated
   */
  onInvalidation?: (keysInvalidated: number, reason: string) => void;
}

/**
 * Hook for managing cache invalidation in portfolio components
 * 
 * Automatically handles:
 * - Wallet switching invalidation
 * - Scheduled refresh setup
 * - Manual invalidation triggers
 */
export function useCacheInvalidation(options: UseCacheInvalidationOptions) {
  const {
    userId,
    enableWalletSwitchInvalidation = true,
    enableScheduledRefresh = false,
    scheduledRefreshIntervalMs = 5 * 60 * 1000, // 5 minutes default
    onInvalidation
  } = options;

  const { activeWallet, previousWallet } = useWalletSwitching();
  const previousWalletRef = useRef<string | null>(null);

  /**
   * Invalidate cache on new transaction
   */
  const invalidateOnTransaction = useCallback((walletAddress: string) => {
    const result = cacheInvalidationEngine.invalidateOnNewTransaction(walletAddress, userId);
    
    if (result.success && onInvalidation) {
      onInvalidation(result.keysInvalidated, result.trigger.reason);
    }

    return result;
  }, [userId, onInvalidation]);

  /**
   * Invalidate cache on policy change
   */
  const invalidateOnPolicyChange = useCallback((changedPolicies: string[]) => {
    const result = cacheInvalidationEngine.invalidateOnPolicyChange(userId, changedPolicies);
    
    if (result.success && onInvalidation) {
      onInvalidation(result.keysInvalidated, result.trigger.reason);
    }

    return result;
  }, [userId, onInvalidation]);

  /**
   * Manual cache invalidation
   */
  const invalidateManually = useCallback((reason: string) => {
    // This is a manual trigger, so we'll use the wallet switch method
    // with the current wallet to force a refresh
    if (activeWallet) {
      const result = cacheInvalidationEngine.invalidateOnWalletSwitch(
        userId,
        null,
        activeWallet
      );
      
      if (result.success && onInvalidation) {
        onInvalidation(result.keysInvalidated, reason);
      }

      return result;
    }

    return {
      success: false,
      keysInvalidated: 0,
      trigger: {
        type: 'wallet_switch' as const,
        userId,
        reason,
        timestamp: Date.now()
      },
      error: 'No active wallet'
    };
  }, [userId, activeWallet, onInvalidation]);

  /**
   * Handle wallet switching
   */
  useEffect(() => {
    if (!enableWalletSwitchInvalidation) {
      return;
    }

    // Check if wallet actually changed
    if (activeWallet && activeWallet !== previousWalletRef.current) {
      const result = cacheInvalidationEngine.invalidateOnWalletSwitch(
        userId,
        previousWalletRef.current,
        activeWallet
      );

      if (result.success && onInvalidation) {
        onInvalidation(result.keysInvalidated, result.trigger.reason);
      }

      // Update ref
      previousWalletRef.current = activeWallet;
    }
  }, [activeWallet, userId, enableWalletSwitchInvalidation, onInvalidation]);

  /**
   * Set up scheduled refresh
   */
  useEffect(() => {
    if (enableScheduledRefresh) {
      const config = cacheInvalidationEngine.getDefaultScheduledRefreshConfig();
      config.intervalMs = scheduledRefreshIntervalMs;

      cacheInvalidationEngine.setupScheduledRefresh(config);

      return () => {
        cacheInvalidationEngine.stopAllScheduledRefresh();
      };
    }
  }, [enableScheduledRefresh, scheduledRefreshIntervalMs]);

  return {
    invalidateOnTransaction,
    invalidateOnPolicyChange,
    invalidateManually,
    getInvalidationHistory: () => cacheInvalidationEngine.getInvalidationHistory(),
    getInvalidationStats: () => cacheInvalidationEngine.getInvalidationStats()
  };
}
