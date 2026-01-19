import { createPublicClient, http, fallback, PublicClient } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';

// AlphaWhale RPC Configuration
const RPC_ENDPOINTS = {
  ethereum: [
    process.env.NEXT_PUBLIC_ALCHEMY_ETH_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    process.env.NEXT_PUBLIC_QUICKNODE_ETH_URL || 'https://ethereum-mainnet.core.chainstack.com/demo',
    'https://ethereum.publicnode.com',
  ],
  polygon: [
    process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    'https://polygon.publicnode.com',
  ],
  arbitrum: [
    process.env.NEXT_PUBLIC_ALCHEMY_ARB_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo',
    'https://arbitrum.publicnode.com',
  ],
  optimism: [
    process.env.NEXT_PUBLIC_ALCHEMY_OP_URL || 'https://opt-mainnet.g.alchemy.com/v2/demo',
    'https://optimism.publicnode.com',
  ],
  base: [
    process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
    'https://base.publicnode.com',
  ],
};

// Create public clients with fallback providers
export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: fallback(
    RPC_ENDPOINTS.ethereum.map(url => http(url, {
      timeout: 5000,
      retryCount: 2,
    }))
  ),
});

export const polygonClient = createPublicClient({
  chain: polygon,
  transport: fallback(
    RPC_ENDPOINTS.polygon.map(url => http(url, {
      timeout: 5000,
      retryCount: 2,
    }))
  ),
});

export const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: fallback(
    RPC_ENDPOINTS.arbitrum.map(url => http(url, {
      timeout: 5000,
      retryCount: 2,
    }))
  ),
});

export const optimismClient = createPublicClient({
  chain: optimism,
  transport: fallback(
    RPC_ENDPOINTS.optimism.map(url => http(url, {
      timeout: 5000,
      retryCount: 2,
    }))
  ),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: fallback(
    RPC_ENDPOINTS.base.map(url => http(url, {
      timeout: 5000,
      retryCount: 2,
    }))
  ),
});

// Chain ID to client mapping
export const chainClients: Record<number, PublicClient> = {
  1: ethereumClient,     // Ethereum Mainnet
  137: polygonClient,    // Polygon
  42161: arbitrumClient, // Arbitrum One
  10: optimismClient,    // Optimism
  8453: baseClient,      // Base
};

// Get client for chain ID
export function getClientForChain(chainId: number): PublicClient | null {
  return chainClients[chainId] || null;
}

// Health check for RPC endpoints
export async function checkRPCHealth() {
  const results = [];
  
  for (const [chainName, client] of Object.entries({
    ethereum: ethereumClient,
    polygon: polygonClient,
    arbitrum: arbitrumClient,
    optimism: optimismClient,
    base: baseClient,
  })) {
    try {
      const blockNumber = await client.getBlockNumber();
      results.push({
        chain: chainName,
        status: 'healthy',
        blockNumber: Number(blockNumber),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        chain: chainName,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return results;
}