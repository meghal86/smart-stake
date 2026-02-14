import { createPublicClient, http, fallback, PublicClient } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';

// Determine if we should use API proxy or direct RPC
const useProxy = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Get RPC URL based on environment
const getRpcUrl = (chain: string, directUrls: string[]) => {
  if (useProxy) {
    // Production: use API proxy to avoid CORS and protect API keys
    return [`/api/rpc/${chain}`];
  }
  // Local development: use public RPC endpoints (no API key needed)
  return directUrls;
};

// AlphaWhale RPC Configuration
const RPC_ENDPOINTS = {
  ethereum: getRpcUrl('ethereum', [
    'https://ethereum.publicnode.com',
    'https://rpc.ankr.com/eth',
    'https://eth.llamarpc.com',
  ]),
  polygon: getRpcUrl('polygon', [
    'https://polygon.publicnode.com',
    'https://polygon-rpc.com',
  ]),
  arbitrum: getRpcUrl('arbitrum', [
    'https://arbitrum.publicnode.com',
    'https://arb1.arbitrum.io/rpc',
  ]),
  optimism: getRpcUrl('optimism', [
    'https://optimism.publicnode.com',
    'https://mainnet.optimism.io',
  ]),
  base: getRpcUrl('base', [
    'https://base.publicnode.com',
    'https://mainnet.base.org',
  ]),
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