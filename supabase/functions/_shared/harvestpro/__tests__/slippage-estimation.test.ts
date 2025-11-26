/**
 * Slippage Estimation Engine Tests
 * Tests for Deno-migrated slippage estimation logic
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  SlippageEstimationEngine,
  getSlippageEstimationEngine,
  type SlippageEstimate,
} from '../slippage-estimation.ts';

Deno.test('SlippageEstimationEngine - constructor initializes correctly', () => {
  const engine = new SlippageEstimationEngine();
  assertExists(engine);
});

Deno.test('SlippageEstimationEngine - heuristic estimation for small trade', async () => {
  const engine = new SlippageEstimationEngine();
  
  const estimate = await engine.estimateSlippage(
    1, // Ethereum
    'ETH',
    'USDC',
    500, // $500 trade
    2000 // $2000 per ETH
  );

  assertExists(estimate);
  assertEquals(estimate.source, 'estimated');
  assertEquals(estimate.slippagePercent < 1, true); // Should be low for small trade
  assertEquals(estimate.confidence > 0, true);
  assertEquals(estimate.confidence <= 100, true);
});

Deno.test('SlippageEstimationEngine - heuristic estimation for medium trade', async () => {
  const engine = new SlippageEstimationEngine();
  
  const estimate = await engine.estimateSlippage(
    1, // Ethereum
    'ETH',
    'USDC',
    5000, // $5000 trade
    2000 // $2000 per ETH
  );

  assertExists(estimate);
  assertEquals(estimate.source, 'estimated');
  assertEquals(estimate.slippagePercent >= 0.1, true);
  assertEquals(estimate.slippagePercent < 1, true);
});

Deno.test('SlippageEstimationEngine - heuristic estimation for large trade', async () => {
  const engine = new SlippageEstimationEngine();
  
  const estimate = await engine.estimateSlippage(
    1, // Ethereum
    'ETH',
    'USDC',
    25000, // $25000 trade
    2000 // $2000 per ETH
  );

  assertExists(estimate);
  assertEquals(estimate.source, 'estimated');
  assertEquals(estimate.slippagePercent >= 0.5, true);
});

Deno.test('SlippageEstimationEngine - heuristic estimation for very large trade', async () => {
  const engine = new SlippageEstimationEngine();
  
  const estimate = await engine.estimateSlippage(
    1, // Ethereum
    'ETH',
    'USDC',
    100000, // $100000 trade
    2000 // $2000 per ETH
  );

  assertExists(estimate);
  assertEquals(estimate.source, 'estimated');
  assertEquals(estimate.slippagePercent >= 1, true);
});

Deno.test('SlippageEstimationEngine - L2 adjustment increases slippage', async () => {
  const engine = new SlippageEstimationEngine();
  
  const ethEstimate = await engine.estimateSlippage(
    1, // Ethereum
    'ETH',
    'USDC',
    5000,
    2000
  );

  const baseEstimate = await engine.estimateSlippage(
    8453, // Base (L2)
    'ETH',
    'USDC',
    5000,
    2000
  );

  // L2 should have higher slippage due to less liquidity
  assertEquals(baseEstimate.slippagePercent > ethEstimate.slippagePercent, true);
});

Deno.test('SlippageEstimationEngine - caching works correctly', async () => {
  const engine = new SlippageEstimationEngine({ cacheTTL: 60000 });
  
  const estimate1 = await engine.estimateSlippage(1, 'ETH', 'USDC', 1000, 2000);
  const estimate2 = await engine.estimateSlippage(1, 'ETH', 'USDC', 1000, 2000);

  // Should return same cached estimate
  assertEquals(estimate1.timestamp, estimate2.timestamp);
});

Deno.test('SlippageEstimationEngine - isSlippageAcceptable works correctly', async () => {
  const engine = new SlippageEstimationEngine();
  
  const lowSlippage = await engine.estimateSlippage(1, 'ETH', 'USDC', 500, 2000);
  const highSlippage = await engine.estimateSlippage(1, 'ETH', 'USDC', 100000, 2000);

  assertEquals(engine.isSlippageAcceptable(lowSlippage, 5), true);
  assertEquals(engine.isSlippageAcceptable(highSlippage, 0.5), false);
});

Deno.test('SlippageEstimationEngine - getSlippageWarningLevel works correctly', async () => {
  const engine = new SlippageEstimationEngine();
  
  const lowSlippage = await engine.estimateSlippage(1, 'ETH', 'USDC', 500, 2000);
  const mediumSlippage = await engine.estimateSlippage(1, 'ETH', 'USDC', 25000, 2000);
  const highSlippage = await engine.estimateSlippage(1, 'ETH', 'USDC', 100000, 2000);

  assertEquals(engine.getSlippageWarningLevel(lowSlippage), 'low');
  assertEquals(engine.getSlippageWarningLevel(mediumSlippage), 'medium');
  assertEquals(engine.getSlippageWarningLevel(highSlippage), 'high');
});

Deno.test('SlippageEstimationEngine - estimateBatchSlippage works correctly', async () => {
  const engine = new SlippageEstimationEngine();
  
  const tokens = [
    { tokenIn: 'ETH', tokenOut: 'USDC', amountIn: 500, currentPrice: 2000 },
    { tokenIn: 'BTC', tokenOut: 'USDC', amountIn: 1000, currentPrice: 40000 },
  ];

  const results = await engine.estimateBatchSlippage(1, tokens);

  assertExists(results['ETH']);
  assertExists(results['BTC']);
  assertEquals('error' in results['ETH'], false);
  assertEquals('error' in results['BTC'], false);
});

Deno.test('SlippageEstimationEngine - clearCache works correctly', async () => {
  const engine = new SlippageEstimationEngine({ cacheTTL: 60000 });
  
  const estimate1 = await engine.estimateSlippage(1, 'ETH', 'USDC', 1000, 2000);
  engine.clearCache();
  
  // Wait 1ms to ensure different timestamp
  await new Promise(resolve => setTimeout(resolve, 1));
  
  const estimate2 = await engine.estimateSlippage(1, 'ETH', 'USDC', 1000, 2000);

  // Should have different timestamps after cache clear
  assertEquals(estimate1.timestamp !== estimate2.timestamp, true);
});

Deno.test('SlippageEstimationEngine - singleton instance works', () => {
  const engine1 = getSlippageEstimationEngine();
  const engine2 = getSlippageEstimationEngine();

  // Should return same instance
  assertEquals(engine1, engine2);
});

Deno.test('SlippageEstimationEngine - slippage cost calculation is correct', async () => {
  const engine = new SlippageEstimationEngine();
  
  const amountUsd = 10000;
  const currentPrice = 2000;
  
  const estimate = await engine.estimateSlippage(1, 'ETH', 'USDC', amountUsd, currentPrice);

  // Slippage cost should be amount * slippage percentage
  const expectedCost = amountUsd * (estimate.slippagePercent / 100);
  assertEquals(Math.abs(estimate.slippageCostUsd - expectedCost) < 0.01, true);
});

Deno.test('SlippageEstimationEngine - expected price calculation is correct', async () => {
  const engine = new SlippageEstimationEngine();
  
  const currentPrice = 2000;
  
  const estimate = await engine.estimateSlippage(1, 'ETH', 'USDC', 5000, currentPrice);

  // Expected price should be current price minus slippage
  const expectedPrice = currentPrice * (1 - estimate.slippagePercent / 100);
  assertEquals(Math.abs(estimate.expectedPrice - expectedPrice) < 0.01, true);
});

Deno.test('SlippageEstimationEngine - worst case price is lower than expected', async () => {
  const engine = new SlippageEstimationEngine();
  
  const estimate = await engine.estimateSlippage(1, 'ETH', 'USDC', 5000, 2000);

  // Worst case should always be lower than expected
  assertEquals(estimate.worstCasePrice < estimate.expectedPrice, true);
});

Deno.test('SlippageEstimationEngine - confidence decreases with trade size', async () => {
  const engine = new SlippageEstimationEngine();
  
  const smallTrade = await engine.estimateSlippage(1, 'ETH', 'USDC', 500, 2000);
  const largeTrade = await engine.estimateSlippage(1, 'ETH', 'USDC', 100000, 2000);

  // Confidence should be lower for larger trades
  assertEquals(largeTrade.confidence < smallTrade.confidence, true);
});
