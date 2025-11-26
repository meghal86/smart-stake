/**
 * Gas Estimation Engine Tests (Deno)
 * 
 * Basic import and type checking tests for the migrated gas estimation engine
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { 
  GasEstimationEngine, 
  getGasEstimationEngine,
  SUPPORTED_CHAINS,
  type GasEstimate,
  type GasEstimationConfig
} from '../gas-estimation.ts';

Deno.test('Gas Estimation Engine - imports successfully', () => {
  assertExists(GasEstimationEngine);
  assertExists(getGasEstimationEngine);
  assertExists(SUPPORTED_CHAINS);
});

Deno.test('Gas Estimation Engine - SUPPORTED_CHAINS contains expected chains', () => {
  assertEquals(typeof SUPPORTED_CHAINS, 'object');
  
  // Check for expected chain IDs
  const expectedChainIds = [1, 8453, 42161, 10, 137];
  for (const chainId of expectedChainIds) {
    assertExists(SUPPORTED_CHAINS[chainId], `Chain ${chainId} should be supported`);
  }
});

Deno.test('Gas Estimation Engine - can instantiate engine', () => {
  const engine = new GasEstimationEngine();
  assertExists(engine);
});

Deno.test('Gas Estimation Engine - singleton returns same instance', () => {
  const engine1 = getGasEstimationEngine();
  const engine2 = getGasEstimationEngine();
  assertEquals(engine1, engine2);
});

Deno.test('Gas Estimation Engine - can instantiate with custom config', () => {
  const config: GasEstimationConfig = {
    cacheTTL: 30000,
    retryAttempts: 5,
    retryDelay: 2000,
  };
  
  const engine = new GasEstimationEngine(config);
  assertExists(engine);
});

Deno.test('Gas Estimation Engine - estimateGasLimit returns bigint', () => {
  const engine = new GasEstimationEngine();
  
  // Access private method through type assertion for testing
  const estimateGasLimit = (engine as any).estimateGasLimit.bind(engine);
  
  const gasLimit = estimateGasLimit(1, 'ETH');
  assertEquals(typeof gasLimit, 'bigint');
  assertEquals(gasLimit > 0n, true);
});

Deno.test('Gas Estimation Engine - cache operations work', () => {
  const engine = new GasEstimationEngine();
  
  // Clear cache should not throw
  engine.clearCache();
  assertExists(engine);
});

Deno.test('Gas Estimation Engine - batch estimation validates input lengths', async () => {
  const engine = new GasEstimationEngine();
  
  try {
    await engine.estimateBatchSwapGas(
      1,
      ['ETH', 'USDC'],
      [1000000000000000000n], // Only one amount for two tokens
      2000
    );
    throw new Error('Should have thrown error for mismatched lengths');
  } catch (error) {
    assertEquals(
      (error as Error).message.includes('same length'),
      true,
      'Should throw error about array lengths'
    );
  }
});

// Type checking tests
Deno.test('Gas Estimation Engine - GasEstimate type structure', () => {
  const mockEstimate: GasEstimate = {
    maxFeePerGas: 50000000000n,
    maxPriorityFeePerGas: 2000000000n,
    gasLimit: 150000n,
    estimatedCostUsd: 15.50,
    timestamp: Date.now(),
    chainId: 1,
  };
  
  assertExists(mockEstimate.maxFeePerGas);
  assertExists(mockEstimate.maxPriorityFeePerGas);
  assertExists(mockEstimate.gasLimit);
  assertExists(mockEstimate.estimatedCostUsd);
  assertExists(mockEstimate.timestamp);
  assertExists(mockEstimate.chainId);
});
