/**
 * Multi-Chain Engine Foundation
 * HarvestPro Tax-Loss Harvesting Module
 * 
 * Provides unified interface for:
 * - RPC provider routing (Alchemy/Infura/Quicknode)
 * - Chain-specific gas estimation
 * - Chain-specific swap routing
 * - Chain-specific wallet connectors
 */

import { createPublicClient, createWalletClient, http, Chain, PublicClient, WalletClient, Transport } from 'viem';
import { mainnet, base, arbitrum, optimism, polygon, sepolia } from 'viem/chains';
import type { Address } from 'viem';

// ============================================================================
// TYPES
// ============================================================================

export interface ChainConfig {
  chainId: number;
  name: string;
  chain: Chain;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  dexRouters: Record<string, Address>;
  stableTokens: Address[];
}

export interface MultiChainConfig {
  alchemyApiKey?: string;
  infuraApiKey?: string;
  quicknodeApiKey?: string;
  preferredProvider?: 'alchemy' | 'infura' | 'quicknode' | 'public';
}

export interface SwapRoute {
  dex: string;
  routerAddress: Address;
  path: Address[];
  estimatedGas: bigint;
  estimatedOutput: bigint;
}

// ============================================================================
// CHAIN CONFIGURATIONS
// ============================================================================

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    chain: mainnet,
    rpcUrls: [
      'https://eth-mainnet.g.alchemy.com/v2/',
      'https://mainnet.infura.io/v3/',
      'https://eth.llamarpc.com',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://etherscan.io',
    dexRouters: {
      'uniswap-v2': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'sushiswap': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    },
    stableTokens: [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ],
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    chain: base,
    rpcUrls: [
      'https://base-mainnet.g.alchemy.com/v2/',
      'https://mainnet.base.org',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://basescan.org',
    dexRouters: {
      'uniswap-v3': '0x2626664c2603336E57B271c5C0b26F421741e481',
      'aerodrome': '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    },
    stableTokens: [
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    ],
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    chain: arbitrum,
    rpcUrls: [
      'https://arb-mainnet.g.alchemy.com/v2/',
      'https://arbitrum-mainnet.infura.io/v3/',
      'https://arb1.arbitrum.io/rpc',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://arbiscan.io',
    dexRouters: {
      'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'sushiswap': '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    },
    stableTokens: [
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
      '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
    ],
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    chain: optimism,
    rpcUrls: [
      'https://opt-mainnet.g.alchemy.com/v2/',
      'https://optimism-mainnet.infura.io/v3/',
      'https://mainnet.optimism.io',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://optimistic.etherscan.io',
    dexRouters: {
      'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    },
    stableTokens: [
      '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC
    ],
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    chain: polygon,
    rpcUrls: [
      'https://polygon-mainnet.g.alchemy.com/v2/',
      'https://polygon-mainnet.infura.io/v3/',
      'https://polygon-rpc.com',
    ],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorer: 'https://polygonscan.com',
    dexRouters: {
      'uniswap-v3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'quickswap': '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    },
    stableTokens: [
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
    ],
  },
};

// ============================================================================
// MULTI-CHAIN ENGINE
// ============================================================================

export class MultiChainEngine {
  private config: MultiChainConfig;
  private publicClients: Map<number, PublicClient>;
  private walletClients: Map<number, WalletClient>;

  constructor(config: MultiChainConfig = {}) {
    this.config = {
      alchemyApiKey: config.alchemyApiKey || process.env.ALCHEMY_API_KEY,
      infuraApiKey: config.infuraApiKey || process.env.INFURA_API_KEY,
      quicknodeApiKey: config.quicknodeApiKey || process.env.QUICKNODE_API_KEY,
      preferredProvider: config.preferredProvider || 'alchemy',
    };

    this.publicClients = new Map();
    this.walletClients = new Map();
  }

  /**
   * Get public client for a chain with provider failover
   */
  getPublicClient(chainId: number): PublicClient {
    if (this.publicClients.has(chainId)) {
      return this.publicClients.get(chainId)!;
    }

    const chainConfig = CHAIN_CONFIGS[chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const rpcUrl = this.getRpcUrl(chainId);
    const client = createPublicClient({
      chain: chainConfig.chain,
      transport: http(rpcUrl),
    });

    this.publicClients.set(chainId, client);
    return client;
  }

  /**
   * Get RPC URL with provider routing
   */
  private getRpcUrl(chainId: number): string {
    const chainConfig = CHAIN_CONFIGS[chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // Try preferred provider first
    if (this.config.preferredProvider === 'alchemy' && this.config.alchemyApiKey) {
      const alchemyUrl = chainConfig.rpcUrls.find(url => url.includes('alchemy'));
      if (alchemyUrl) {
        return `${alchemyUrl}${this.config.alchemyApiKey}`;
      }
    }

    if (this.config.preferredProvider === 'infura' && this.config.infuraApiKey) {
      const infuraUrl = chainConfig.rpcUrls.find(url => url.includes('infura'));
      if (infuraUrl) {
        return `${infuraUrl}${this.config.infuraApiKey}`;
      }
    }

    // Fallback to public RPC
    return chainConfig.rpcUrls[chainConfig.rpcUrls.length - 1];
  }

  /**
   * Get chain configuration
   */
  getChainConfig(chainId: number): ChainConfig {
    const config = CHAIN_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    return config;
  }

  /**
   * Get all supported chain IDs
   */
  getSupportedChains(): number[] {
    return Object.keys(CHAIN_CONFIGS).map(Number);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return chainId in CHAIN_CONFIGS;
  }

  /**
   * Get chain-specific gas estimation
   */
  async estimateGas(
    chainId: number,
    from: Address,
    to: Address,
    data: `0x${string}`
  ): Promise<bigint> {
    const client = this.getPublicClient(chainId);
    
    try {
      const gas = await client.estimateGas({
        account: from,
        to,
        data,
      });

      // Add buffer based on chain
      const buffer = this.getGasBuffer(chainId);
      return (gas * BigInt(100 + buffer)) / BigInt(100);
    } catch (error) {
      console.error(`Gas estimation failed for chain ${chainId}:`, error);
      // Return default gas limit based on chain
      return this.getDefaultGasLimit(chainId);
    }
  }

  /**
   * Get gas buffer percentage for chain
   */
  private getGasBuffer(chainId: number): number {
    // Different chains need different buffers
    const buffers: Record<number, number> = {
      1: 20,      // Ethereum: 20% buffer
      8453: 15,   // Base: 15% buffer
      42161: 25,  // Arbitrum: 25% buffer (L2 mechanics)
      10: 15,     // Optimism: 15% buffer
      137: 20,    // Polygon: 20% buffer
    };

    return buffers[chainId] || 20;
  }

  /**
   * Get default gas limit for chain
   */
  private getDefaultGasLimit(chainId: number): bigint {
    const defaults: Record<number, bigint> = {
      1: BigInt(150000),
      8453: BigInt(100000),
      42161: BigInt(800000),
      10: BigInt(100000),
      137: BigInt(150000),
    };

    return defaults[chainId] || BigInt(150000);
  }

  /**
   * Get swap route for a token pair
   */
  async getSwapRoute(
    chainId: number,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<SwapRoute> {
    const chainConfig = this.getChainConfig(chainId);
    
    // Get the first available DEX router
    const dexName = Object.keys(chainConfig.dexRouters)[0];
    const routerAddress = chainConfig.dexRouters[dexName];

    if (!routerAddress) {
      throw new Error(`No DEX router available for chain ${chainId}`);
    }

    // Simple direct path (in production, use a router to find optimal path)
    const path = [tokenIn, tokenOut];

    // Estimate gas for swap
    const estimatedGas = await this.estimateSwapGas(chainId);

    // Estimate output (simplified - in production, query the actual router)
    const estimatedOutput = amountIn * BigInt(99) / BigInt(100); // Assume 1% slippage

    return {
      dex: dexName,
      routerAddress,
      path,
      estimatedGas,
      estimatedOutput,
    };
  }

  /**
   * Estimate gas for a swap transaction
   */
  private async estimateSwapGas(chainId: number): Promise<bigint> {
    const baseGas: Record<number, bigint> = {
      1: BigInt(150000),
      8453: BigInt(100000),
      42161: BigInt(800000),
      10: BigInt(100000),
      137: BigInt(150000),
    };

    return baseGas[chainId] || BigInt(150000);
  }

  /**
   * Get stable token addresses for a chain
   */
  getStableTokens(chainId: number): Address[] {
    const chainConfig = CHAIN_CONFIGS[chainId];
    return chainConfig?.stableTokens || [];
  }

  /**
   * Get DEX routers for a chain
   */
  getDexRouters(chainId: number): Record<string, Address> {
    const chainConfig = CHAIN_CONFIGS[chainId];
    return chainConfig?.dexRouters || {};
  }

  /**
   * Get block explorer URL for a transaction
   */
  getBlockExplorerUrl(chainId: number, txHash: string): string {
    const chainConfig = CHAIN_CONFIGS[chainId];
    if (!chainConfig) {
      return '';
    }
    return `${chainConfig.blockExplorer}/tx/${txHash}`;
  }

  /**
   * Get native currency symbol for a chain
   */
  getNativeCurrencySymbol(chainId: number): string {
    const chainConfig = CHAIN_CONFIGS[chainId];
    return chainConfig?.nativeCurrency.symbol || 'ETH';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let multiChainEngineInstance: MultiChainEngine | null = null;

export function getMultiChainEngine(): MultiChainEngine {
  if (!multiChainEngineInstance) {
    multiChainEngineInstance = new MultiChainEngine({
      preferredProvider: 'alchemy',
    });
  }
  return multiChainEngineInstance;
}
