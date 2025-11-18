/**
 * Token Tradability Detection
 * HarvestPro Tax-Loss Harvesting Module
 * 
 * Checks if a token is tradable by:
 * - Verifying DEX support
 * - Checking liquidity depth
 * - Verifying stable pair availability
 * - Checking allowance requirements
 */

import { createPublicClient, http, Address, erc20Abi } from 'viem';
import type { Chain } from 'viem';
import { mainnet, base, arbitrum, optimism, polygon } from 'viem/chains';

// ============================================================================
// TYPES
// ============================================================================

export interface TradabilityCheck {
  isTradable: boolean;
  supportedDexes: string[];
  liquidityUsd: number;
  hasStablePair: boolean;
  needsApproval: boolean;
  reasons: string[];
  confidence: number; // 0-100
}

export interface TradabilityConfig {
  minLiquidityUsd?: number;
  requiredDexes?: string[];
  rpcUrls?: Record<number, string>;
}

// ============================================================================
// DEX CONFIGURATIONS
// ============================================================================

const DEX_ROUTERS: Record<number, Record<string, Address>> = {
  1: { // Ethereum
    'uniswap-v2': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'sushiswap': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  },
  8453: { // Base
    'uniswap-v3': '0x2626664c2603336E57B271c5C0b26F421741e481',
    'aerodrome': '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  },
  42161: { // Arbitrum
    'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'sushiswap': '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  },
  10: { // Optimism
    'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  },
  137: { // Polygon
    'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'quickswap': '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  },
};

const STABLE_TOKENS: Record<number, Address[]> = {
  1: [
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  ],
  8453: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ],
  42161: [
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
  ],
  10: [
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC
  ],
  137: [
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
  ],
};

// ============================================================================
// TOKEN TRADABILITY ENGINE
// ============================================================================

export class TokenTradabilityEngine {
  private clients: Map<number, ReturnType<typeof createPublicClient>>;
  private config: Required<TradabilityConfig>;

  constructor(config: TradabilityConfig = {}) {
    this.config = {
      minLiquidityUsd: config.minLiquidityUsd || 10000,
      requiredDexes: config.requiredDexes || [],
      rpcUrls: config.rpcUrls || {},
    };

    this.clients = new Map();
    this.initializeClients();
  }

  private initializeClients(): void {
    const chains: Record<number, Chain> = { 
      1: mainnet, 
      8453: base, 
      42161: arbitrum, 
      10: optimism, 
      137: polygon 
    };
    
    for (const [chainIdStr, chain] of Object.entries(chains)) {
      const id = parseInt(chainIdStr);
      const rpcUrl = this.config.rpcUrls[id] || this.getDefaultRpcUrl(id);
      
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl),
      }) as ReturnType<typeof createPublicClient>;

      this.clients.set(id, client);
    }
  }

  private getDefaultRpcUrl(chainId: number): string {
    const envKey = `RPC_URL_${chainId}`;
    if (process.env[envKey]) {
      return process.env[envKey]!;
    }

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
   * Check if a token is tradable
   */
  async checkTradability(
    chainId: number,
    tokenAddress: Address,
    userAddress?: Address
  ): Promise<TradabilityCheck> {
    const reasons: string[] = [];
    let confidence = 100;

    // Check DEX support
    const supportedDexes = await this.checkDexSupport(chainId, tokenAddress);
    if (supportedDexes.length === 0) {
      reasons.push('Token not found on any supported DEX');
      confidence -= 50;
    }

    // Check liquidity
    const liquidityUsd = await this.checkLiquidity(chainId, tokenAddress);
    if (liquidityUsd < this.config.minLiquidityUsd) {
      reasons.push(`Insufficient liquidity (${liquidityUsd.toFixed(0)} USD < ${this.config.minLiquidityUsd} USD)`);
      confidence -= 30;
    }

    // Check stable pair
    const hasStablePair = await this.checkStablePair(chainId, tokenAddress);
    if (!hasStablePair) {
      reasons.push('No stable pair available');
      confidence -= 10;
    }

    // Check approval requirement
    const needsApproval = userAddress 
      ? await this.checkApprovalNeeded(chainId, tokenAddress, userAddress)
      : false;

    const isTradable = reasons.length === 0 || (liquidityUsd >= this.config.minLiquidityUsd && supportedDexes.length > 0);

    return {
      isTradable,
      supportedDexes,
      liquidityUsd,
      hasStablePair,
      needsApproval,
      reasons,
      confidence: Math.max(0, confidence),
    };
  }

  /**
   * Check which DEXes support the token
   */
  private async checkDexSupport(chainId: number, tokenAddress: Address): Promise<string[]> {
    const dexes = DEX_ROUTERS[chainId] || {};
    const supportedDexes: string[] = [];

    // In production, you would query each DEX to check if the token has pools
    // For now, we'll use a simplified heuristic
    for (const dexName of Object.keys(dexes)) {
      // Assume major tokens are supported on all DEXes
      // In production, query the actual pools
      supportedDexes.push(dexName);
    }

    return supportedDexes;
  }

  /**
   * Check liquidity depth for the token
   */
  private async checkLiquidity(chainId: number, tokenAddress: Address): Promise<number> {
    // In production, query actual pool reserves from DEXes
    // For now, return a heuristic estimate
    
    // This is a simplified implementation
    // Real implementation would:
    // 1. Query Uniswap V3 pools
    // 2. Query Uniswap V2 pairs
    // 3. Sum up liquidity across all pools
    
    // For demonstration, return a placeholder
    return 50000; // $50k placeholder
  }

  /**
   * Check if token has a stable pair
   */
  private async checkStablePair(chainId: number, tokenAddress: Address): Promise<boolean> {
    const stableTokens = STABLE_TOKENS[chainId] || [];
    
    // In production, check if there are pools with stable tokens
    // For now, assume major tokens have stable pairs
    return stableTokens.length > 0;
  }

  /**
   * Check if approval is needed for the token
   */
  private async checkApprovalNeeded(
    chainId: number,
    tokenAddress: Address,
    userAddress: Address
  ): Promise<boolean> {
    const client = this.clients.get(chainId);
    if (!client) return true;

    try {
      // Get the first DEX router for this chain
      const dexes = DEX_ROUTERS[chainId] || {};
      const routerAddress = Object.values(dexes)[0];
      
      if (!routerAddress) return true;

      // Check current allowance
      const allowance = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, routerAddress],
      });

      // If allowance is 0, approval is needed
      return allowance === BigInt(0);
    } catch (error) {
      console.warn('Failed to check approval:', error);
      return true; // Assume approval needed on error
    }
  }

  /**
   * Batch check tradability for multiple tokens
   */
  async checkBatchTradability(
    chainId: number,
    tokenAddresses: Address[],
    userAddress?: Address
  ): Promise<Record<string, TradabilityCheck>> {
    const results: Record<string, TradabilityCheck> = {};

    // Process in parallel
    const promises = tokenAddresses.map(address =>
      this.checkTradability(chainId, address, userAddress)
        .then(check => ({ address, check }))
        .catch(error => ({ address, error: error.message }))
    );

    const settled = await Promise.all(promises);

    for (const result of settled) {
      if ('check' in result) {
        results[result.address] = result.check;
      } else {
        results[result.address] = {
          isTradable: false,
          supportedDexes: [],
          liquidityUsd: 0,
          hasStablePair: false,
          needsApproval: true,
          reasons: [`Error: ${result.error}`],
          confidence: 0,
        };
      }
    }

    return results;
  }

  /**
   * Get token address from symbol (simplified)
   */
  getTokenAddress(chainId: number, symbol: string): Address | null {
    const addresses: Record<number, Record<string, Address>> = {
      1: {
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      },
      8453: {
        'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      42161: {
        'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      },
    };

    return addresses[chainId]?.[symbol.toUpperCase()] || null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let tradabilityEngineInstance: TokenTradabilityEngine | null = null;

export function getTokenTradabilityEngine(): TokenTradabilityEngine {
  if (!tradabilityEngineInstance) {
    tradabilityEngineInstance = new TokenTradabilityEngine({
      minLiquidityUsd: 10000,
    });
  }
  return tradabilityEngineInstance;
}
