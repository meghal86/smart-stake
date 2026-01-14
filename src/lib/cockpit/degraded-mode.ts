/**
 * Degraded Mode Detection Service
 * 
 * Monitors provider status and implements graceful degradation logic.
 * When providers are degraded/offline, disables Fix/Execute actions and
 * surfaces staleness indicators with retry CTAs.
 * 
 * Requirements: 15.1, 15.2, 15.4
 */

import { ProviderStatus } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Provider health check result
 */
export interface ProviderHealthCheck {
  /** Provider identifier */
  provider: string;
  /** Current status */
  status: 'online' | 'degraded' | 'offline';
  /** Response time in milliseconds */
  responseTime?: number;
  /** Last successful check timestamp */
  lastSuccess?: string;
  /** Error message if offline/degraded */
  error?: string;
}

/**
 * Chain staleness thresholds (Appendix A2)
 */
export const CHAIN_STALENESS_THRESHOLDS = {
  // Base / Arbitrum: 15 minutes
  'base': 15 * 60 * 1000,
  'arbitrum': 15 * 60 * 1000,
  // Ethereum: 30 minutes
  'ethereum': 30 * 60 * 1000,
  'mainnet': 30 * 60 * 1000,
  // Default for other chains
  'default': 20 * 60 * 1000,
} as const;

/**
 * Provider performance thresholds
 */
export const PROVIDER_THRESHOLDS = {
  /** P95 latency threshold for degraded status (ms) */
  DEGRADED_LATENCY_MS: 1200,
  /** Time window for latency measurement (ms) */
  LATENCY_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  /** Maximum response time before considering offline (ms) */
  OFFLINE_TIMEOUT_MS: 10000, // 10 seconds
} as const;

/**
 * Degraded mode detection criteria (Appendix A5)
 */
export interface DegradedModeContext {
  /** Wallet scope for checking relevant chains */
  walletScope: 'active' | 'all';
  /** Active wallet address (if wallet_scope=active) */
  activeWallet?: string;
  /** All user wallets (if wallet_scope=all) */
  allWallets?: string[];
  /** Current timestamp for staleness checks */
  currentTime: Date;
}

// ============================================================================
// Provider Health Monitoring
// ============================================================================

/**
 * Mock provider health checks
 * In production, these would be actual health checks to external services
 */
export class ProviderHealthMonitor {
  private static healthCache = new Map<string, ProviderHealthCheck>();
  private static lastCheck = new Map<string, number>();

  /**
   * Check RPC provider health for a specific chain
   */
  static async checkRPCProvider(chain: string): Promise<ProviderHealthCheck> {
    const cacheKey = `rpc_${chain}`;
    const now = Date.now();
    const lastCheckTime = this.lastCheck.get(cacheKey) || 0;

    // Cache health checks for 30 seconds
    if (now - lastCheckTime < 30000 && this.healthCache.has(cacheKey)) {
      return this.healthCache.get(cacheKey)!;
    }

    try {
      const startTime = Date.now();
      
      // Simulate RPC health check
      // In production, this would be an actual RPC call like eth_blockNumber
      await this.simulateRPCCall(chain);
      
      const responseTime = Date.now() - startTime;
      
      let status: 'online' | 'degraded' | 'offline' = 'online';
      if (responseTime > PROVIDER_THRESHOLDS.OFFLINE_TIMEOUT_MS) {
        status = 'offline';
      } else if (responseTime > PROVIDER_THRESHOLDS.DEGRADED_LATENCY_MS) {
        status = 'degraded';
      }

      const result: ProviderHealthCheck = {
        provider: `rpc_${chain}`,
        status,
        responseTime,
        lastSuccess: status !== 'offline' ? new Date().toISOString() : undefined,
      };

      this.healthCache.set(cacheKey, result);
      this.lastCheck.set(cacheKey, now);
      
      return result;
    } catch (error) {
      const result: ProviderHealthCheck = {
        provider: `rpc_${chain}`,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.healthCache.set(cacheKey, result);
      this.lastCheck.set(cacheKey, now);
      
      return result;
    }
  }

  /**
   * Check Guardian/Hunter indexer health
   */
  static async checkIndexerHealth(service: 'guardian' | 'hunter'): Promise<ProviderHealthCheck> {
    const cacheKey = `indexer_${service}`;
    const now = Date.now();
    const lastCheckTime = this.lastCheck.get(cacheKey) || 0;

    // Cache health checks for 60 seconds
    if (now - lastCheckTime < 60000 && this.healthCache.has(cacheKey)) {
      return this.healthCache.get(cacheKey)!;
    }

    try {
      const startTime = Date.now();
      
      // Simulate indexer health check
      // In production, this would check the indexer's last block timestamp
      await this.simulateIndexerCall(service);
      
      const responseTime = Date.now() - startTime;
      
      let status: 'online' | 'degraded' | 'offline' = 'online';
      if (responseTime > PROVIDER_THRESHOLDS.OFFLINE_TIMEOUT_MS) {
        status = 'offline';
      } else if (responseTime > PROVIDER_THRESHOLDS.DEGRADED_LATENCY_MS) {
        status = 'degraded';
      }

      const result: ProviderHealthCheck = {
        provider: `indexer_${service}`,
        status,
        responseTime,
        lastSuccess: status !== 'offline' ? new Date().toISOString() : undefined,
      };

      this.healthCache.set(cacheKey, result);
      this.lastCheck.set(cacheKey, now);
      
      return result;
    } catch (error) {
      const result: ProviderHealthCheck = {
        provider: `indexer_${service}`,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.healthCache.set(cacheKey, result);
      this.lastCheck.set(cacheKey, now);
      
      return result;
    }
  }

  /**
   * Simulate RPC call for testing
   */
  private static async simulateRPCCall(chain: string): Promise<void> {
    // Simulate network delay
    const delay = Math.random() * 2000; // 0-2 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`RPC call failed for ${chain}`);
    }
  }

  /**
   * Simulate indexer call for testing
   */
  private static async simulateIndexerCall(service: string): Promise<void> {
    // Simulate network delay
    const delay = Math.random() * 1500; // 0-1.5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional failures
    if (Math.random() < 0.03) { // 3% failure rate
      throw new Error(`Indexer call failed for ${service}`);
    }
  }

  /**
   * Clear health cache (for testing)
   */
  static clearCache(): void {
    this.healthCache.clear();
    this.lastCheck.clear();
  }
}

// ============================================================================
// Degraded Mode Detection
// ============================================================================

/**
 * Determines if the system is in degraded mode based on provider health
 * 
 * Degraded mode criteria (Appendix A5):
 * - Primary RPC/provider for any chain in wallet_scope is offline
 * - OR provider is degraded AND p95 latency > 1200ms for last 5 minutes
 * - OR Guardian/Hunter backing indexer is stale by > 2x the chain staleness threshold
 */
export async function detectDegradedMode(context: DegradedModeContext): Promise<{
  degraded_mode: boolean;
  provider_status: ProviderStatus;
  reasons: string[];
}> {
  const reasons: string[] = [];
  let worstStatus: 'online' | 'degraded' | 'offline' = 'online';

  try {
    // Get relevant chains based on wallet scope
    const relevantChains = getRelevantChains(context);
    
    // Check RPC providers for relevant chains
    for (const chain of relevantChains) {
      const rpcHealth = await ProviderHealthMonitor.checkRPCProvider(chain);
      
      if (rpcHealth.status === 'offline') {
        reasons.push(`RPC provider for ${chain} is offline`);
        worstStatus = 'offline';
      } else if (rpcHealth.status === 'degraded') {
        reasons.push(`RPC provider for ${chain} is degraded (${rpcHealth.responseTime}ms)`);
        if (worstStatus !== 'offline') {
          worstStatus = 'degraded';
        }
      }
    }

    // Check Guardian indexer health
    const guardianHealth = await ProviderHealthMonitor.checkIndexerHealth('guardian');
    if (guardianHealth.status === 'offline') {
      reasons.push('Guardian indexer is offline');
      worstStatus = 'offline';
    } else if (guardianHealth.status === 'degraded') {
      reasons.push(`Guardian indexer is degraded (${guardianHealth.responseTime}ms)`);
      if (worstStatus !== 'offline') {
        worstStatus = 'degraded';
      }
    }

    // Check Hunter indexer health
    const hunterHealth = await ProviderHealthMonitor.checkIndexerHealth('hunter');
    if (hunterHealth.status === 'offline') {
      reasons.push('Hunter indexer is offline');
      worstStatus = 'offline';
    } else if (hunterHealth.status === 'degraded') {
      reasons.push(`Hunter indexer is degraded (${hunterHealth.responseTime}ms)`);
      if (worstStatus !== 'offline') {
        worstStatus = 'degraded';
      }
    }

    // Check for indexer staleness (> 2x chain staleness threshold)
    const stalenessIssues = await checkIndexerStaleness(relevantChains, context.currentTime);
    if (stalenessIssues.length > 0) {
      reasons.push(...stalenessIssues);
      if (worstStatus !== 'offline') {
        worstStatus = 'degraded';
      }
    }

    const degraded_mode = worstStatus !== 'online';
    
    const provider_status: ProviderStatus = {
      state: worstStatus,
      detail: reasons.length > 0 ? reasons.join('; ') : null,
    };

    return {
      degraded_mode,
      provider_status,
      reasons,
    };
  } catch (error) {
    console.error('Error detecting degraded mode:', error);
    
    return {
      degraded_mode: true,
      provider_status: {
        state: 'offline',
        detail: 'Health check failed',
      },
      reasons: ['Health check system error'],
    };
  }
}

/**
 * Get relevant chains based on wallet scope
 */
function getRelevantChains(context: DegradedModeContext): string[] {
  // For now, return common chains
  // In production, this would query the user's actual wallet chains
  if (context.walletScope === 'active' && context.activeWallet) {
    // Return chains for the active wallet
    return ['ethereum', 'base', 'arbitrum'];
  } else if (context.walletScope === 'all' && context.allWallets) {
    // Return chains for all wallets
    return ['ethereum', 'base', 'arbitrum'];
  }
  
  // Default chains
  return ['ethereum'];
}

/**
 * Check if indexers are stale beyond acceptable thresholds
 */
async function checkIndexerStaleness(chains: string[], currentTime: Date): Promise<string[]> {
  const issues: string[] = [];
  
  for (const chain of chains) {
    const threshold = CHAIN_STALENESS_THRESHOLDS[chain as keyof typeof CHAIN_STALENESS_THRESHOLDS] 
      || CHAIN_STALENESS_THRESHOLDS.default;
    
    // Simulate checking indexer last block time
    // In production, this would query the actual indexer
    const lastBlockTime = await simulateGetLastBlockTime(chain);
    const staleness = currentTime.getTime() - new Date(lastBlockTime).getTime();
    
    // Check if stale by > 2x the threshold
    if (staleness > threshold * 2) {
      const stalenessMinutes = Math.round(staleness / (60 * 1000));
      issues.push(`${chain} indexer is ${stalenessMinutes}m stale (threshold: ${threshold / (60 * 1000)}m)`);
    }
  }
  
  return issues;
}

/**
 * Simulate getting last block time from indexer
 */
async function simulateGetLastBlockTime(chain: string): Promise<string> {
  // Simulate some staleness
  const randomStaleness = Math.random() * 10 * 60 * 1000; // 0-10 minutes
  const lastBlockTime = new Date(Date.now() - randomStaleness);
  return lastBlockTime.toISOString();
}

// ============================================================================
// Degraded Mode Behavior
// ============================================================================

/**
 * Apply degraded mode restrictions to actions
 * 
 * When degraded_mode = true:
 * - Disable Fix/Execute (force Review only)
 * - Keep Review enabled
 * - Apply -25 penalty to action scores
 */
export function applyDegradedModeRestrictions<T extends { 
  cta: { kind: string }; 
  is_executable: boolean;
}>(actions: T[], degraded_mode: boolean): T[] {
  if (!degraded_mode) {
    return actions;
  }

  return actions.map(action => {
    // If action would be Fix/Execute, downgrade to Review
    if (action.cta.kind === 'Fix' || action.cta.kind === 'Execute') {
      return {
        ...action,
        cta: {
          ...action.cta,
          kind: 'Review',
        },
        is_executable: false,
      };
    }

    return action;
  });
}

/**
 * Get staleness indicator message for UI
 */
export function getStalenessIndicator(provider_status: ProviderStatus): {
  message: string;
  severity: 'warning' | 'error';
  showRetry: boolean;
} | null {
  if (provider_status.state === 'online') {
    return null;
  }

  const severity = provider_status.state === 'offline' ? 'error' : 'warning';
  
  let message = 'System status: ';
  if (provider_status.state === 'offline') {
    message += 'Some services are offline';
  } else {
    message += 'Some services are experiencing delays';
  }

  if (provider_status.detail) {
    message += ` (${provider_status.detail})`;
  }

  return {
    message,
    severity,
    showRetry: true,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  detectDegradedMode,
  applyDegradedModeRestrictions,
  getStalenessIndicator,
  ProviderHealthMonitor,
  CHAIN_STALENESS_THRESHOLDS,
  PROVIDER_THRESHOLDS,
};