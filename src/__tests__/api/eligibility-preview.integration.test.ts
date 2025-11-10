/**
 * Integration tests for GET /api/eligibility/preview endpoint
 * 
 * Tests:
 * - End-to-end eligibility preview flow
 * - Database caching behavior
 * - Real service integration
 * - Cache expiry and TTL
 * 
 * Requirements: 6.1-6.8
 * Task: 14
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/eligibility/preview/route';
import { supabase } from '@/integrations/supabase/client';

describe('GET /api/eligibility/preview - Integration', () => {
  const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const testOpportunityId = '123e4567-e89b-12d3-a456-426614174000';
  const testChain = 'ethereum';

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from('eligibility_cache')
      .delete()
      .eq('wallet_address', testWallet.toLowerCase());
  });

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('eligibility_cache')
      .delete()
      .eq('wallet_address', testWallet.toLowerCase());
  });

  describe('End-to-End Flow', () => {
    it('should calculate and cache eligibility on first request', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBeDefined();
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(1);
      expect(data.reasons).toBeInstanceOf(Array);
      expect(data.reasons.length).toBeGreaterThan(0);
      expect(data.cachedUntil).toBeDefined();
      expect(data.ts).toBeDefined();

      // Verify cache entry was created
      const { data: cached, error } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', testOpportunityId)
        .eq('wallet_address', testWallet.toLowerCase())
        .single();

      expect(error).toBeNull();
      expect(cached).toBeDefined();
      expect(cached?.status).toBe(data.status);
      expect(Number(cached?.score)).toBe(data.score);
    });

    it('should return cached result on subsequent requests', async () => {
      // First request - cache miss
      const req1 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response1 = await GET(req1);
      const data1 = await response1.json();

      // Second request - cache hit
      const req2 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response2 = await GET(req2);
      const data2 = await response2.json();

      // Results should be identical
      expect(data2.status).toBe(data1.status);
      expect(data2.score).toBe(data1.score);
      expect(data2.reasons).toEqual(data1.reasons);
      expect(data2.cachedUntil).toBe(data1.cachedUntil);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache results for 60 minutes', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      // Check cache expiry time
      const cachedUntil = new Date(data.cachedUntil);
      const now = new Date();
      const diffMinutes = (cachedUntil.getTime() - now.getTime()) / (1000 * 60);

      // Should be approximately 60 minutes (allow 1 minute tolerance)
      expect(diffMinutes).toBeGreaterThan(59);
      expect(diffMinutes).toBeLessThan(61);
    });

    it('should use unique cache key per wallet and opportunity', async () => {
      const wallet1 = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const wallet2 = '0x853d45Dd7745D0543936a4c855Bc9e8706f1cDec';

      // Request for wallet 1
      const req1 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${wallet1}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );
      await GET(req1);

      // Request for wallet 2
      const req2 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${wallet2}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );
      await GET(req2);

      // Check both cache entries exist
      const { data: cacheEntries } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', testOpportunityId)
        .in('wallet_address', [wallet1.toLowerCase(), wallet2.toLowerCase()]);

      expect(cacheEntries).toHaveLength(2);

      // Clean up wallet 2
      await supabase
        .from('eligibility_cache')
        .delete()
        .eq('wallet_address', wallet2.toLowerCase());
    });

    it('should normalize wallet addresses to lowercase', async () => {
      const upperWallet = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB';
      const lowerWallet = '0x742d35cc6634c0532925a3b844bc9e7595f0beb';

      // Request with uppercase wallet
      const req1 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${upperWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );
      const response1 = await GET(req1);
      const data1 = await response1.json();

      // Request with lowercase wallet
      const req2 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${lowerWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );
      const response2 = await GET(req2);
      const data2 = await response2.json();

      // Should return same cached result
      expect(data2.status).toBe(data1.status);
      expect(data2.score).toBe(data1.score);
      expect(data2.cachedUntil).toBe(data1.cachedUntil);

      // Should only have one cache entry
      const { data: cacheEntries } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', testOpportunityId)
        .eq('wallet_address', lowerWallet);

      expect(cacheEntries).toHaveLength(1);
    });
  });

  describe('Status Labels', () => {
    it('should return valid status labels', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      const validStatuses = ['likely', 'maybe', 'unlikely', 'unknown'];
      expect(validStatuses).toContain(data.status);
    });

    it('should include at least one reason', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data.reasons).toBeInstanceOf(Array);
      expect(data.reasons.length).toBeGreaterThan(0);
      expect(data.reasons[0]).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid opportunity ID gracefully', async () => {
      const invalidOpportunityId = 'non-existent-uuid-123e4567-e89b-12d3-a456-426614174000';

      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${invalidOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      // Should still return a valid response (unknown status)
      expect(response.status).toBe(200);
      expect(data.status).toBeDefined();
      expect(data.reasons).toBeInstanceOf(Array);
    });

    it('should handle missing wallet gracefully', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unknown');
      expect(data.score).toBe(0);
      expect(data.reasons).toContain('Wallet address is required to check eligibility');
    });
  });

  describe('Response Headers', () => {
    it('should include proper cache headers', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const response = await GET(req);

      expect(response.headers.get('Cache-Control')).toBe(
        'private, max-age=300, stale-while-revalidate=600'
      );
      expect(response.headers.get('X-API-Version')).toBeDefined();
      expect(response.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time (cache miss)', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const startTime = Date.now();
      const response = await GET(req);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      
      const responseTime = endTime - startTime;
      // Should respond within 1 second for cache miss
      expect(responseTime).toBeLessThan(1000);
    });

    it('should respond faster on cache hit', async () => {
      // First request - cache miss
      const req1 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );
      await GET(req1);

      // Second request - cache hit
      const req2 = new NextRequest(
        `http://localhost:3000/api/eligibility/preview?wallet=${testWallet}&opportunityId=${testOpportunityId}&chain=${testChain}`
      );

      const startTime = Date.now();
      const response = await GET(req2);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      
      const responseTime = endTime - startTime;
      // Cache hit should be very fast (< 200ms)
      expect(responseTime).toBeLessThan(200);
    });
  });
});
