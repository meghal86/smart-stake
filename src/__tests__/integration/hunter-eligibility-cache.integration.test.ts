/**
 * Eligibility Cache Integration Tests
 * 
 * Verifies that eligibility results are cached for 24 hours
 * 
 * Requirements: 5.11 (24-hour cache TTL)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { evaluateEligibility, clearEligibilityCache } from '@/lib/hunter/eligibility-engine';
import { createServiceClient } from '@/integrations/supabase/service';
import type { WalletSignals } from '@/lib/hunter/wallet-signals';
import type { Opportunity } from '@/lib/hunter/types';

// Test wallet address
const TEST_WALLET = '0x1234567890123456789012345678901234567890';

// Test opportunity (using valid UUID)
const TEST_OPPORTUNITY: Opportunity = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'test-eligibility-cache',
  title: 'Test Opportunity',
  description: 'Test opportunity for cache testing',
  protocol: {
    name: 'Test Protocol',
    logo_url: null,
  },
  type: 'yield',
  chains: ['ethereum'],
  reward_min: null,
  reward_max: null,
  reward_currency: 'USD',
  apr: 10,
  tvl_usd: 1000000,
  trust_score: 80,
  tags: ['defi'],
  url: 'https://test.com',
  requirements: {
    chains: ['ethereum'],
    min_wallet_age_days: 30,
    min_tx_count: 10,
  },
  status: 'published',
  featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  source: 'test',
  source_ref: 'test-cache',
  last_synced_at: new Date().toISOString(),
};

// Test wallet signals
const TEST_WALLET_SIGNALS: WalletSignals = {
  address: TEST_WALLET,
  wallet_age_days: 90,
  tx_count_90d: 50,
  chains_active: ['ethereum', 'base'],
  top_assets: [
    { symbol: 'ETH', amount: 1.5 },
    { symbol: 'USDC', amount: 1000 },
  ],
  stablecoin_usd_est: 1000,
};

describe('Eligibility Cache Integration Tests', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clearEligibilityCache(TEST_WALLET);
  });

  afterEach(async () => {
    // Clean up after each test
    await clearEligibilityCache(TEST_WALLET);
  });

  test('should cache eligibility result for 24 hours', async () => {
    const supabase = createServiceClient();

    // First call - should compute and cache
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();
    expect(result1.status).toBe('likely');
    expect(result1.score).toBeGreaterThan(0.8);

    // Verify cache entry was created
    const { data: cached1, error: error1 } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(error1).toBeNull();
    expect(cached1).toBeDefined();
    expect(cached1?.eligibility_status).toBe('likely');
    expect(parseFloat(cached1?.eligibility_score)).toBeGreaterThan(0.8);

    // Second call immediately - should use cache
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result2).toEqual(result1);

    // Verify cache entry is still the same (same created_at)
    const { data: cached2, error: error2 } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(error2).toBeNull();
    expect(cached2?.created_at).toBe(cached1?.created_at);
  });

  test('should refetch after 24 hours', async () => {
    const supabase = createServiceClient();

    // Mock Date.now to control time
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call at T=0
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();

    // Verify cache entry
    const { data: cached1 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    const originalCreatedAt = cached1?.created_at;

    // Second call at T=12 hours (within cache window)
    currentTime += 12 * 60 * 60 * 1000;
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result2).toEqual(result1);

    // Verify cache entry is still the same
    const { data: cached2 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached2?.created_at).toBe(originalCreatedAt);

    // Third call at T=23 hours (still within cache window)
    currentTime += 11 * 60 * 60 * 1000;
    const result3 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result3).toEqual(result1);

    // Fourth call at T=25 hours (cache expired)
    currentTime += 2 * 60 * 60 * 1000;
    const result4 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result4).toBeDefined();

    // Verify cache entry was updated (new created_at)
    const { data: cached4 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached4?.created_at).not.toBe(originalCreatedAt);

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache exactly 24 hours (86400000ms)', async () => {
    const supabase = createServiceClient();

    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();

    // Get original cache entry
    const { data: cached1 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    const originalCreatedAt = cached1?.created_at;

    // Call at T=86399999ms (1ms before expiry) - should use cache
    currentTime += 86399999;
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result2).toEqual(result1);

    // Verify cache entry is still the same
    const { data: cached2 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached2?.created_at).toBe(originalCreatedAt);

    // Call at T=86400000ms (exactly at expiry) - should refetch
    currentTime += 1;
    const result3 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result3).toBeDefined();

    // Verify cache entry was updated
    const { data: cached3 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached3?.created_at).not.toBe(originalCreatedAt);

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache per wallet-opportunity pair', async () => {
    const supabase = createServiceClient();

    const WALLET_2 = '0x9876543210987654321098765432109876543210';
    const WALLET_SIGNALS_2: WalletSignals = {
      ...TEST_WALLET_SIGNALS,
      address: WALLET_2,
    };

    // Evaluate for wallet 1
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();

    // Evaluate for wallet 2
    const result2 = await evaluateEligibility(WALLET_SIGNALS_2, TEST_OPPORTUNITY);
    expect(result2).toBeDefined();

    // Verify both cache entries exist
    const { data: cacheEntries, error } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('opportunity_id', TEST_OPPORTUNITY.id);

    expect(error).toBeNull();
    expect(cacheEntries).toHaveLength(2);
    expect(cacheEntries?.map(c => c.wallet_address).sort()).toEqual([
      TEST_WALLET.toLowerCase(),
      WALLET_2.toLowerCase(),
    ].sort());

    // Clean up wallet 2
    await clearEligibilityCache(WALLET_2);
  });

  test('should return cached data structure correctly', async () => {
    // First call
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toHaveProperty('status');
    expect(result1).toHaveProperty('score');
    expect(result1).toHaveProperty('reasons');
    expect(Array.isArray(result1.reasons)).toBe(true);
    expect(result1.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result1.reasons.length).toBeLessThanOrEqual(5);

    // Second call (cached)
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);

    // Verify structure is preserved
    expect(result2).toHaveProperty('status');
    expect(result2).toHaveProperty('score');
    expect(result2).toHaveProperty('reasons');
    expect(Array.isArray(result2.reasons)).toBe(true);

    // Verify data is identical
    expect(result2.status).toBe(result1.status);
    expect(result2.score).toBe(result1.score);
    expect(result2.reasons).toEqual(result1.reasons);
  });

  test('should cache null signals with shorter TTL (1 hour)', async () => {
    const supabase = createServiceClient();

    // Wallet signals with null values
    const NULL_SIGNALS: WalletSignals = {
      address: TEST_WALLET,
      wallet_age_days: null,
      tx_count_90d: null,
      chains_active: [],
      top_assets: [],
      stablecoin_usd_est: null,
    };

    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call with null signals
    const result1 = await evaluateEligibility(NULL_SIGNALS, TEST_OPPORTUNITY);
    expect(result1.status).toBe('maybe');
    expect(result1.reasons).toContain('Wallet data unavailable');

    // Get cache entry
    const { data: cached1 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    const originalCreatedAt = cached1?.created_at;

    // Call at T=30 minutes (within 1 hour TTL)
    currentTime += 30 * 60 * 1000;
    const result2 = await evaluateEligibility(NULL_SIGNALS, TEST_OPPORTUNITY);
    expect(result2).toEqual(result1);

    // Verify cache entry is still the same
    const { data: cached2 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached2?.created_at).toBe(originalCreatedAt);

    // Call at T=61 minutes (cache expired for null signals)
    currentTime += 31 * 60 * 1000;
    const result3 = await evaluateEligibility(NULL_SIGNALS, TEST_OPPORTUNITY);
    expect(result3).toBeDefined();

    // Verify cache entry was updated
    const { data: cached3 } = await supabase
      .from('eligibility_cache')
      .select('created_at')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    expect(cached3?.created_at).not.toBe(originalCreatedAt);

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should handle cache miss gracefully', async () => {
    const supabase = createServiceClient();

    // Ensure no cache entry exists
    await clearEligibilityCache(TEST_WALLET);

    // Verify no cache entry
    const { data: before } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id);

    expect(before).toHaveLength(0);

    // Call should compute and cache
    const result = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result).toBeDefined();
    expect(result.status).toBe('likely');

    // Verify cache entry was created
    const { data: after } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id);

    expect(after).toHaveLength(1);
  });

  test('should update cache on subsequent calls after expiry', async () => {
    const supabase = createServiceClient();

    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();

    // Get cache entry
    const { data: cached1 } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    const originalCreatedAt = cached1?.created_at;

    // Wait 25 hours (cache expired)
    currentTime += 25 * 60 * 60 * 1000;

    // Second call - should recompute and update cache
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result2).toBeDefined();

    // Get updated cache entry
    const { data: cached2 } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', TEST_OPPORTUNITY.id)
      .single();

    // Verify cache was updated
    expect(cached2?.created_at).not.toBe(originalCreatedAt);

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache different opportunities independently', async () => {
    const supabase = createServiceClient();

    const OPPORTUNITY_2: Opportunity = {
      ...TEST_OPPORTUNITY,
      id: '00000000-0000-0000-0000-000000000002',
      slug: 'test-eligibility-cache-2',
      title: 'Test Opportunity 2',
    };

    // Evaluate for opportunity 1
    const result1 = await evaluateEligibility(TEST_WALLET_SIGNALS, TEST_OPPORTUNITY);
    expect(result1).toBeDefined();

    // Evaluate for opportunity 2
    const result2 = await evaluateEligibility(TEST_WALLET_SIGNALS, OPPORTUNITY_2);
    expect(result2).toBeDefined();

    // Verify both cache entries exist
    const { data: cacheEntries, error } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('wallet_address', TEST_WALLET.toLowerCase());

    expect(error).toBeNull();
    expect(cacheEntries).toHaveLength(2);
    expect(cacheEntries?.map(c => c.opportunity_id).sort()).toEqual([
      TEST_OPPORTUNITY.id,
      OPPORTUNITY_2.id,
    ].sort());

    // Clean up opportunity 2 cache
    await supabase
      .from('eligibility_cache')
      .delete()
      .eq('wallet_address', TEST_WALLET.toLowerCase())
      .eq('opportunity_id', OPPORTUNITY_2.id);
  });
});
