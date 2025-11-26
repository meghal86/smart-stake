/**
 * Gas Estimation Engine Integration Tests (Deno)
 * 
 * Tests that verify the gas estimation engine works with real-world scenarios
 * Note: These tests don't make actual RPC calls to avoid external dependencies
 */

import { assertEquals, assertExists, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { 
  GasEstimationEngine,
  type GasEstimate,
  SUPPORTED_CHAINS
} from '../gas-estimation.ts';

Deno.test('Gas Estimation Integration - chain-specific gas limits', () => {
  const engine = new GasEstimationEngine();
  
  // Access private method for testing
  const estimateGasLimit = (engine as any).estimateGasLimit.bind(engine);
  
  // Ethereum should have standard gas limit
  const ethGasLimit = estimateGasLimit(1, 'ETH');
  assertEquals(ethGasLimit, 200000n); // 150000 + 50000 buffer
  
  // Base should have lower gas limit
  const baseGasLimit = estimateGasLimit(8453, 'ETH');
  assertEquals(baseGasLimit, 150000n); // 100000 + 50000 buffer
  
  // Arbitrum should have higher gas limit
  const arbGasLimit = estimateGasLimit(42161, 'ETH');
  assertEquals(arbGasLimit, 850000n); // 800000 + 50000 buffer
});

Deno.test('Gas Estimation Integration - cache behavior', async () => {
  const engine = new GasEstimationEngine({
    cacheTTL: 100, // 100ms for testing
  });
  
  // Cache should be empty initially
  const cached1 = (engine as any).cache.get(1, 'ETH');
  assertEquals(cached1, null);
  
  // Set a value in cache
  const mockEstimate: GasEstimate = {
    maxFeePerGas: 50000000000n,
    maxPriorityFeePerGas: 2000000000n,
    gasLimit: 150000n,
    estimatedCostUsd: 15.50,
    timestamp: Date.now(),
    chainId: 1,
  };
  
  (engine as any).cache.set(1, 'ETH', mockEstimate);
  
  // Should retrieve from cache
  const cached2 = (engine as any).cache.get(1, 'ETH');
  assertExists(cached2);
  assertEquals(cached2.chainId, 1);
  
  // Wait for cache to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Cache should be expired
  const cached3 = (engine as any).cache.get(1, 'ETH');
  assertEquals(cached3, null);
});

Deno.test('Gas Estimation Integration - cache key normalization', () => {
  const engine = new GasEstimationEngine();
  
  const mockEstimate: GasEstimate = {
    maxFeePerGas: 50000000000n,
    maxPriorityFeePerGas: 2000000000n,
    gasLimit: 150000n,
    estimatedCostUsd: 15.50,
    timestamp: Date.now(),
    chainId: 1,
  };
  
  // Set with lowercase
  (engine as any).cache.set(1, 'eth', mockEstimate);
  
  // Should retrieve with uppercase
  const cached = (engine as any).cache.get(1, 'ETH');
  assertExists(cached);
  
  // Should retrieve with mixed case
  const cached2 = (engine as any).cache.get(1, 'EtH');
  assertExists(cached2);
});

Deno.test('Gas Estimation Integration - unsupported chain error', async () => {
  const engine = new GasEstimationEngine();
  
  // Try to estimate gas for unsupported chain
  await assertRejects(
    async () => {
      await engine.estimateSwapGas(
        999999, // Invalid chain ID
        'ETH',
        1000000000000000000n,
        2000
      );
    },
    Error,
    'Unsupported chain'
  );
});

Deno.test('Gas Estimation Integration - batch validation', async () => {
  const engine = new GasEstimationEngine();
  
  // Mismatched array lengths should throw
  await assertRejects(
    async () => {
      await engine.estimateBatchSwapGas(
        1,
        ['ETH', 'USDC', 'DAI'],
        [1000000000000000000n], // Only 1 amount for 3 tokens
        2000
      );
    },
    Error,
    'same length'
  );
});

Deno.test('Gas Estimation Integration - clear cache', () => {
  const engine = new GasEstimationEngine();
  
  const mockEstimate: GasEstimate = {
    maxFeePerGas: 50000000000n,
    maxPriorityFeePerGas: 2000000000n,
    gasLimit: 150000n,
    estimatedCostUsd: 15.50,
    timestamp: Date.now(),
    chainId: 1,
  };
  
  // Add multiple items to cache
  (engine as any).cache.set(1, 'ETH', mockEstimate);
  (engine as any).cache.set(1, 'USDC', mockEstimate);
  (engine as any).cache.set(8453, 'ETH', mockEstimate);
  
  // Verify items are in cache
  assertExists((engine as any).cache.get(1, 'ETH'));
  assertExists((engine as any).cache.get(1, 'USDC'));
  assertExists((engine as any).cache.get(8453, 'ETH'));
  
  // Clear cache
  engine.clearCache();
  
  // Verify cache is empty
  assertEquals((engine as any).cache.get(1, 'ETH'), null);
  assertEquals((engine as any).cache.get(1, 'USDC'), null);
  assertEquals((engine as any).cache.get(8453, 'ETH'), null);
});

Deno.test('Gas Estimation Integration - supported chains configuration', () => {
  // Verify all expected chains are configured
  const expectedChains = [
    { id: 1, name: 'Ethereum' },
    { id: 8453, name: 'Base' },
    { id: 42161, name: 'Arbitrum' },
    { id: 10, name: 'Optimism' },
    { id: 137, name: 'Polygon' },
  ];
  
  for (const chain of expectedChains) {
    assertExists(
      SUPPORTED_CHAINS[chain.id],
      `${chain.name} (${chain.id}) should be supported`
    );
  }
});

Deno.test('Gas Estimation Integration - RPC URL configuration', () => {
  const engine = new GasEstimationEngine();
  
  // Access private method
  const getDefaultRpcUrl = (engine as any).getDefaultRpcUrl.bind(engine);
  
  // Should return public RPC URLs for supported chains
  const ethRpc = getDefaultRpcUrl(1);
  assertExists(ethRpc);
  assertEquals(ethRpc.includes('http'), true);
  
  const baseRpc = getDefaultRpcUrl(8453);
  assertExists(baseRpc);
  assertEquals(baseRpc.includes('http'), true);
});

Deno.test('Gas Estimation Integration - custom RPC URLs', () => {
  const customRpcUrls = {
    1: 'https://custom-eth-rpc.example.com',
    8453: 'https://custom-base-rpc.example.com',
  };
  
  const engine = new GasEstimationEngine({
    rpcUrls: customRpcUrls,
  });
  
  assertExists(engine);
  // Engine should be initialized with custom RPCs
  // (We can't easily verify this without accessing private fields,
  // but the constructor should not throw)
});

Deno.test('Gas Estimation Integration - retry configuration', () => {
  const engine = new GasEstimationEngine({
    retryAttempts: 5,
    retryDelay: 2000,
  });
  
  assertExists(engine);
  // Verify configuration is accepted
  assertEquals((engine as any).config.retryAttempts, 5);
  assertEquals((engine as any).config.retryDelay, 2000);
});
