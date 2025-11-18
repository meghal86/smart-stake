/**
 * Price Oracle Integration Tests
 * Tests the price oracle with failover chain
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriceOracle } from '../price-oracle';

describe('PriceOracle', () => {
  let oracle: PriceOracle;

  beforeEach(() => {
    oracle = new PriceOracle({
      cacheTTL: 60000,
    });
  });

  it('should fetch price for a single token', async () => {
    const priceData = await oracle.getPrice('BTC');
    
    expect(priceData).toBeDefined();
    expect(priceData.price).toBeGreaterThan(0);
    expect(priceData.source).toMatch(/coingecko|coinmarketcap|cache/);
    expect(priceData.timestamp).toBeGreaterThan(0);
  });

  it('should use cache on second request', async () => {
    const first = await oracle.getPrice('ETH');
    const second = await oracle.getPrice('ETH');
    
    expect(second.source).toBe('cache');
    expect(second.price).toBe(first.price);
  });

  it('should fetch prices for multiple tokens', async () => {
    const prices = await oracle.getPrices(['BTC', 'ETH', 'USDC']);
    
    expect(Object.keys(prices).length).toBeGreaterThan(0);
    expect(prices['BTC']).toBeDefined();
    expect(prices['BTC'].price).toBeGreaterThan(0);
  });

  it('should clear cache', () => {
    oracle.clearCache();
    const stats = oracle.getCacheStats();
    expect(stats.size).toBe(0);
  });
});
