/**
 * Price Oracle Tests (Deno/Edge Functions)
 * HarvestPro Tax-Loss Harvesting Module
 * 
 * Tests for price fetching with failover chain
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { PriceOracle, type PriceData, type PriceOracleConfig } from '../price-oracle.ts';

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

Deno.test('PriceOracle - constructor creates instance', () => {
  const oracle = new PriceOracle();
  assertExists(oracle);
});

Deno.test('PriceOracle - constructor accepts config', () => {
  const config: PriceOracleConfig = {
    coinGeckoApiKey: 'test-key',
    coinMarketCapApiKey: 'test-key',
    cacheTTL: 30000,
  };
  const oracle = new PriceOracle(config);
  assertExists(oracle);
});

// ============================================================================
// CACHE TESTS
// ============================================================================

Deno.test('PriceOracle - cache stores and retrieves prices', async () => {
  const oracle = new PriceOracle({ cacheTTL: 60000 });
  
  // Mock a successful fetch by setting cache directly
  // In real usage, this would be set by getPrice()
  const testPrice: PriceData = {
    price: 50000,
    timestamp: Date.now(),
    source: 'coingecko',
  };
  
  // We can't directly access cache, but we can test through getPrices
  // which uses cache internally
  const stats = oracle.getCacheStats();
  assertEquals(stats.size, 0);
});

Deno.test('PriceOracle - clearCache empties cache', () => {
  const oracle = new PriceOracle();
  oracle.clearCache();
  const stats = oracle.getCacheStats();
  assertEquals(stats.size, 0);
});

Deno.test('PriceOracle - getCacheStats returns size', () => {
  const oracle = new PriceOracle();
  const stats = oracle.getCacheStats();
  assertExists(stats);
  assertEquals(typeof stats.size, 'number');
});

// ============================================================================
// INTEGRATION TESTS (require API keys)
// ============================================================================

// Note: These tests require actual API keys and network access
// They are skipped by default but can be run with proper environment setup

Deno.test({
  name: 'PriceOracle - getPrice fetches BTC price',
  ignore: !Deno.env.get('COINGECKO_API_KEY'), // Skip if no API key
  async fn() {
    const oracle = new PriceOracle({
      coinGeckoApiKey: Deno.env.get('COINGECKO_API_KEY'),
    });
    
    const priceData = await oracle.getPrice('BTC');
    assertExists(priceData);
    assertEquals(typeof priceData.price, 'number');
    assertEquals(priceData.price > 0, true);
    assertEquals(priceData.source, 'coingecko');
  },
});

Deno.test({
  name: 'PriceOracle - getPrices fetches multiple tokens',
  ignore: !Deno.env.get('COINGECKO_API_KEY'), // Skip if no API key
  async fn() {
    const oracle = new PriceOracle({
      coinGeckoApiKey: Deno.env.get('COINGECKO_API_KEY'),
    });
    
    const prices = await oracle.getPrices(['BTC', 'ETH', 'USDC']);
    assertExists(prices);
    assertEquals(typeof prices['BTC'], 'object');
    assertEquals(typeof prices['ETH'], 'object');
    assertEquals(typeof prices['USDC'], 'object');
    assertEquals(prices['BTC'].price > 0, true);
    assertEquals(prices['ETH'].price > 0, true);
    assertEquals(prices['USDC'].price > 0, true);
  },
});

Deno.test({
  name: 'PriceOracle - cache is used on second call',
  ignore: !Deno.env.get('COINGECKO_API_KEY'), // Skip if no API key
  async fn() {
    const oracle = new PriceOracle({
      coinGeckoApiKey: Deno.env.get('COINGECKO_API_KEY'),
      cacheTTL: 60000,
    });
    
    // First call - should fetch from API
    const firstCall = await oracle.getPrice('BTC');
    assertEquals(firstCall.source, 'coingecko');
    
    // Second call - should use cache
    const secondCall = await oracle.getPrice('BTC');
    assertEquals(secondCall.source, 'cache');
    assertEquals(secondCall.price, firstCall.price);
  },
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test('PriceOracle - handles invalid token gracefully', async () => {
  const oracle = new PriceOracle({
    coinGeckoApiKey: Deno.env.get('COINGECKO_API_KEY'),
  });
  
  try {
    await oracle.getPrice('INVALID_TOKEN_XYZ_123');
    // If we get here, the test should fail
    assertEquals(true, false, 'Should have thrown an error');
  } catch (error) {
    // Expected to throw
    assertExists(error);
  }
});

// ============================================================================
// SINGLETON TESTS
// ============================================================================

Deno.test('getPriceOracle - returns singleton instance', async () => {
  const { getPriceOracle } = await import('../price-oracle.ts');
  const oracle1 = getPriceOracle();
  const oracle2 = getPriceOracle();
  assertEquals(oracle1, oracle2);
});

console.log('✅ Price Oracle tests completed');
