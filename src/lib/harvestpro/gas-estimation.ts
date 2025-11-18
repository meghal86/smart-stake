/**
 * Gas Estimation Engine
 * HarvestPro Tax-Loss Harvesting Module
 * 
 * Implements EIP-1559 gas estimation with:
 * - Multi-chain support (Ethereum, Base, Arbitrum, etc.)
 * - Retry logic on failure
 * - 20-30 second caching
 * - Graceful error handling
 */

import { createPublicClient, http, Chain, formatGwei } from 'viem';
import { mainnet, base, arbitrum, optimism, polygon } from 'viem/chains';

// ============================================================================
// TYPES
// ============================================================================

export interface GasEstimate {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  estimatedCostUsd: number;
  timestamp: number;
  chainId: number;
}

export interface GasEstimationConfig {
  rpcUrls?: Record<number, string>;
  cacheTTL?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

interface CachedGasEstimate {
  estimate: GasEstimate;
  timestamp: number;
}

// ============================================================================
// SUPPORTED CHAINS
// ============================================================================

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

// ============================================================================
// GAS CACHE
// ============================================================================

class GasCache {
  private cache: Map<string, CachedGasEstimate> = new Map();
  private ttl: number;

  constructor(ttl: number = 25000) { // Default 25 seconds
    this.ttl = ttl;
  }

  set(chainId: number, token: string, estimate: GasEstimate): void {
    const key = `${chainId}:${token.toUpperCase()}`;
    this.cache.set(key, {
      estimate,
      timestamp: Date.now(),
    });
  }

  get(chainId: number, token: string): GasEstimate | null {
    const key = `${chainId}:${token.toUpperCase()}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.estimate;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// GAS ESTIMATION ENGINE
// ============================================================================

export class GasEstimationEngine {
  private clients: Map<number, ReturnType<typeof createPublicClient>>;
  private cache: GasCache;
  private config: Required<GasEstimationConfig>;

  constructor(config: GasEstimationConfig = {}) {
    this.config = {
      rpcUrls: config.rpcUrls || {},
      cacheTTL: config.cacheTTL || 25000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.cache = new GasCache(this.config.cacheTTL);
    this.clients = new Map();

    // Initialize clients for supported chains
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [chainId, chain] of Object.entries(SUPPORTED_CHAINS)) {
      const id = parseInt(chainId);
      const rpcUrl = this.config.rpcUrls[id] || this.getDefaultRpcUrl(id);
      
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl),
      });

      this.clients.set(id, client);
    }
  }

  private getDefaultRpcUrl(chainId: number): string {
    // Use environment variables for RPC URLs
    const envKey = `RPC_URL_${chainId}`;
    if (process.env[envKey]) {
      return process.env[envKey]!;
    }

    // Fallback to public RPCs (not recommended for production)
    const publicRpcs: Record<number, string> = {
      1: 'https://eth.llamarpc.com',
      8453: 'https://mainnet.base.org',
      42161: 'https://arb1.arbitrum.io/rpc',
      10: 'https://mainnet.optimism.io',
      137: 'https://polygon-rpc.com',
    };

    return publicRpcs[chainId] || '';
  }

  /**
   * Estimate gas for a token swap with retry logic
   */
  async estimateSwapGas(
    chainId: number,
    token: string,
    amount: bigint,
    ethPriceUsd: number
  ): Promise<GasEstimate> {
    // Check cache first
    const cached = this.cache.get(chainId, token);
    if (cached) {
      return cached;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const estimate = await this.fetchGasEstimate(chainId, token, amount, ethPriceUsd);
        this.cache.set(chainId, token, estimate);
        return estimate;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Gas estimation attempt ${attempt + 1} failed:`, error);

        if (attempt < this.config.retryAttempts - 1) {
          await this.sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    throw new Error(`Gas estimation failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  private async fetchGasEstimate(
    chainId: number,
    token: string,
    amount: bigint,
    ethPriceUsd: number
  ): Promise<GasEstimate> {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // Get current gas prices using EIP-1559
    const feeData = await client.estimateFeesPerGas();

    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      throw new Error('Failed to fetch EIP-1559 gas prices');
    }

    // Estimate gas limit for a typical swap
    // This is a simplified estimation - in production, you'd simulate the actual transaction
    const gasLimit = this.estimateGasLimit(chainId, token);

    // Calculate total cost in ETH
    const totalCostWei = feeData.maxFeePerGas * gasLimit;
    const totalCostEth = Number(totalCostWei) / 1e18;
    const estimatedCostUsd = totalCostEth * ethPriceUsd;

    return {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      gasLimit,
      estimatedCostUsd,
      timestamp: Date.now(),
      chainId,
    };
  }

  private estimateGasLimit(chainId: number, token: string): bigint {
    // Chain-specific gas limits for typical swaps
    const baseGasLimits: Record<number, bigint> = {
      1: 150000n,      // Ethereum mainnet
      8453: 100000n,   // Base (cheaper)
      42161: 800000n,  // Arbitrum (higher due to L2 mechanics)
      10: 100000n,     // Optimism
      137: 150000n,    // Polygon
    };

    const baseLimit = baseGasLimits[chainId] || 150000n;

    // Add buffer for complex tokens (e.g., tokens with transfer fees)
    // In production, you'd check token characteristics
    return baseLimit + 50000n;
  }

  /**
   * Get gas estimates for multiple tokens
   */
  async estimateBatchSwapGas(
    chainId: number,
    tokens: string[],
    amounts: bigint[],
    ethPriceUsd: number
  ): Promise<Record<string, GasEstimate>> {
    if (tokens.length !== amounts.length) {
      throw new Error('Tokens and amounts arrays must have the same length');
    }

    const results: Record<string, GasEstimate> = {};

    // Process in parallel
    const promises = tokens.map((token, index) =>
      this.estimateSwapGas(chainId, token, amounts[index], ethPriceUsd)
        .then(estimate => ({ token, estimate }))
        .catch(error => ({ token, error }))
    );

    const settled = await Promise.all(promises);

    for (const result of settled) {
      if ('estimate' in result) {
        results[result.token.toUpperCase()] = result.estimate;
      } else {
        console.error(`Failed to estimate gas for ${result.token}:`, result.error);
      }
    }

    return results;
  }

  /**
   * Clear the gas cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let gasEngineInstance: GasEstimationEngine | null = null;

export function getGasEstimationEngine(): GasEstimationEngine {
  if (!gasEngineInstance) {
    gasEngineInstance = new GasEstimationEngine({
      cacheTTL: 25000, // 25 seconds
      retryAttempts: 3,
      retryDelay: 1000,
    });
  }
  return gasEngineInstance;
}
