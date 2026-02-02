/**
 * Cache Invalidation Engine
 * 
 * Extends RiskAwareCacheService with portfolio-specific invalidation triggers:
 * - Transaction-based invalidation
 * - Wallet switching cache clearing
 * - Policy change invalidation
 * - Scheduled refresh for time-sensitive data
 * 
 * Requirements: 10.6
 */

import { riskAwareCache } from './RiskAwareCacheService';

export interface InvalidationTrigger {
  type: 'transaction' | 'wallet_switch' | 'policy_change' | 'scheduled';
  walletAddress?: string;
  userId?: string;
  reason: string;
  timestamp: number;
}

export interface InvalidationResult {
  success: boolean;
  keysInvalidated: number;
  trigger: InvalidationTrigger;
  error?: string;
}

export interface ScheduledRefreshConfig {
  enabled: boolean;
  intervalMs: number;
  patterns: string[];
}

/**
 * Cache Invalidation Engine
 * 
 * Manages cache invalidation across the portfolio system with support for:
 * - New transaction detection
 * - Wallet switching
 * - Policy configuration changes
 * - Scheduled refresh for time-sensitive data
 */
export class CacheInvalidationEngine {
  private invalidationHistory: InvalidationTrigger[] = [];
  private maxHistorySize = 100;
  private scheduledRefreshTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Invalidate caches when a new transaction is detected
   * 
   * Requirements: 10.6 - Cache invalidation on new transactions
   * 
   * Invalidates:
   * - Portfolio snapshots for the wallet
   * - Approval risks for the wallet
   * - Recommended actions for the wallet
   * - Guardian scan results
   */
  invalidateOnNewTransaction(walletAddress: string, userId: string): InvalidationResult {
    const trigger: InvalidationTrigger = {
      type: 'transaction',
      walletAddress,
      userId,
      reason: 'New transaction detected',
      timestamp: Date.now()
    };

    try {
      // Invalidate critical caches for this wallet
      const keysInvalidated = riskAwareCache.invalidateCritical(walletAddress);

      // Also invalidate user-level aggregations if they exist
      const userPattern = `portfolio_snapshot_${userId}_all_wallets`;
      const userKeys = riskAwareCache.invalidate(userPattern);

      const totalKeys = keysInvalidated + userKeys;

      this.recordInvalidation(trigger);

      return {
        success: true,
        keysInvalidated: totalKeys,
        trigger
      };
    } catch (error) {
      return {
        success: false,
        keysInvalidated: 0,
        trigger,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear user-specific caches on wallet switching
   * 
   * Requirements: 10.6 - Clear user-specific caches on wallet switching
   * 
   * Clears:
   * - Previous wallet's cached data
   * - User-level aggregations (to force refresh with new wallet)
   * - Copilot context (to prevent cross-wallet data leakage)
   */
  invalidateOnWalletSwitch(
    userId: string,
    previousWallet: string | null,
    newWallet: string
  ): InvalidationResult {
    const trigger: InvalidationTrigger = {
      type: 'wallet_switch',
      walletAddress: newWallet,
      userId,
      reason: `Wallet switched from ${previousWallet || 'none'} to ${newWallet}`,
      timestamp: Date.now()
    };

    try {
      let keysInvalidated = 0;

      // Invalidate previous wallet's caches if it exists
      if (previousWallet) {
        keysInvalidated += riskAwareCache.invalidate(`.*${previousWallet}.*`);
      }

      // Invalidate new wallet's caches to force fresh data
      keysInvalidated += riskAwareCache.invalidate(`.*${newWallet}.*`);

      // Invalidate user-level aggregations
      keysInvalidated += riskAwareCache.invalidate(`portfolio_snapshot_${userId}_all_wallets`);

      // Invalidate Copilot context to prevent cross-wallet data leakage
      keysInvalidated += riskAwareCache.invalidate(`copilot_context_${userId}.*`);

      // Invalidate SSE stream state
      keysInvalidated += riskAwareCache.invalidate(`copilot_stream_${userId}.*`);

      this.recordInvalidation(trigger);

      return {
        success: true,
        keysInvalidated,
        trigger
      };
    } catch (error) {
      return {
        success: false,
        keysInvalidated: 0,
        trigger,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Invalidate simulation results on policy changes
   * 
   * Requirements: 10.6 - Invalidate simulation results on policy changes
   * 
   * When policy configuration changes (e.g., max_gas_usd, confidence_threshold),
   * all cached simulation results and intent plans must be invalidated because
   * they were computed under different policy constraints.
   */
  invalidateOnPolicyChange(userId: string, changedPolicies: string[]): InvalidationResult {
    const trigger: InvalidationTrigger = {
      type: 'policy_change',
      userId,
      reason: `Policy configuration changed: ${changedPolicies.join(', ')}`,
      timestamp: Date.now()
    };

    try {
      let keysInvalidated = 0;

      // Invalidate all simulation receipts for this user
      keysInvalidated += riskAwareCache.invalidate(`simulation_receipt_${userId}.*`);

      // Invalidate all intent plans for this user
      keysInvalidated += riskAwareCache.invalidate(`intent_plan_${userId}.*`);

      // Invalidate recommended actions (they may change based on new policies)
      keysInvalidated += riskAwareCache.invalidate(`recommended_actions_${userId}.*`);

      // Invalidate policy check results
      keysInvalidated += riskAwareCache.invalidate(`policy_check_${userId}.*`);

      this.recordInvalidation(trigger);

      return {
        success: true,
        keysInvalidated,
        trigger
      };
    } catch (error) {
      return {
        success: false,
        keysInvalidated: 0,
        trigger,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set up scheduled refresh for time-sensitive data
   * 
   * Requirements: 10.6 - Scheduled refresh for time-sensitive data
   * 
   * Automatically refreshes caches for data that becomes stale over time:
   * - Guardian security scores (hourly)
   * - Hunter opportunities (every 15 minutes)
   * - Harvest recommendations (every 30 minutes)
   * - Portfolio metrics (every 5 minutes)
   */
  setupScheduledRefresh(config: ScheduledRefreshConfig): void {
    if (!config.enabled) {
      this.stopAllScheduledRefresh();
      return;
    }

    // Clear existing timers
    this.stopAllScheduledRefresh();

    // Set up new timer
    const timerId = setInterval(() => {
      const trigger: InvalidationTrigger = {
        type: 'scheduled',
        reason: 'Scheduled refresh triggered',
        timestamp: Date.now()
      };

      try {
        let totalKeysInvalidated = 0;

        // Invalidate each pattern
        for (const pattern of config.patterns) {
          const keysInvalidated = riskAwareCache.invalidate(pattern);
          totalKeysInvalidated += keysInvalidated;
        }

        this.recordInvalidation(trigger);

        console.log(`[CacheInvalidationEngine] Scheduled refresh: ${totalKeysInvalidated} keys invalidated`);
      } catch (error) {
        console.error('[CacheInvalidationEngine] Scheduled refresh error:', error);
      }
    }, config.intervalMs);

    this.scheduledRefreshTimers.set('default', timerId);
  }

  /**
   * Stop all scheduled refresh timers
   */
  stopAllScheduledRefresh(): void {
    for (const [key, timer] of this.scheduledRefreshTimers.entries()) {
      clearInterval(timer);
      this.scheduledRefreshTimers.delete(key);
    }
  }

  /**
   * Get default scheduled refresh configuration
   */
  getDefaultScheduledRefreshConfig(): ScheduledRefreshConfig {
    return {
      enabled: true,
      intervalMs: 5 * 60 * 1000, // 5 minutes
      patterns: [
        'guardian_.*', // Guardian security scores
        'hunter_.*', // Hunter opportunities
        'harvest_.*', // Harvest recommendations
        'portfolio_metrics_.*' // Portfolio metrics
      ]
    };
  }

  /**
   * Record invalidation in history
   */
  private recordInvalidation(trigger: InvalidationTrigger): void {
    this.invalidationHistory.push(trigger);

    // Keep history size bounded
    if (this.invalidationHistory.length > this.maxHistorySize) {
      this.invalidationHistory.shift();
    }
  }

  /**
   * Get invalidation history
   */
  getInvalidationHistory(limit?: number): InvalidationTrigger[] {
    if (limit) {
      return this.invalidationHistory.slice(-limit);
    }
    return [...this.invalidationHistory];
  }

  /**
   * Get invalidation statistics
   */
  getInvalidationStats(): {
    totalInvalidations: number;
    byType: Record<InvalidationTrigger['type'], number>;
    recentInvalidations: InvalidationTrigger[];
  } {
    const byType: Record<InvalidationTrigger['type'], number> = {
      transaction: 0,
      wallet_switch: 0,
      policy_change: 0,
      scheduled: 0
    };

    for (const trigger of this.invalidationHistory) {
      byType[trigger.type]++;
    }

    return {
      totalInvalidations: this.invalidationHistory.length,
      byType,
      recentInvalidations: this.invalidationHistory.slice(-10)
    };
  }

  /**
   * Clear invalidation history
   */
  clearHistory(): void {
    this.invalidationHistory = [];
  }
}

// Export singleton instance
export const cacheInvalidationEngine = new CacheInvalidationEngine();
