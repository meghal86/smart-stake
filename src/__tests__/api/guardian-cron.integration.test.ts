/**
 * Integration tests for Guardian Staleness Cron Job
 * 
 * These tests verify the cron job works with real database and Redis
 * 
 * Requirements: 2.9, 8.13
 * Task: 28
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { listStaleOpportunities, queueRescan, invalidateGuardianCache } from '@/lib/guardian/hunter-integration';
import { cacheGet, cacheDel } from '@/lib/redis/cache';

describe('Guardian Cron Integration Tests', () => {
  let testOpportunityId: string;
  let testOpportunitySlug: string;

  beforeAll(async () => {
    // Create a test opportunity
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert({
        slug: `test-guardian-cron-${Date.now()}`,
        title: 'Test Opportunity for Guardian Cron',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        status: 'published',
        dedupe_key: `test-guardian-cron-${Date.now()}`,
        source: 'internal',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test opportunity:', error);
      throw error;
    }

    testOpportunityId = opportunity.id;
    testOpportunitySlug = opportunity.slug;

    // Create a stale Guardian scan (>24h old)
    const staleDate = new Date();
    staleDate.setHours(staleDate.getHours() - 48); // 48 hours ago

    await supabase
      .from('guardian_scans')
      .insert({
        opportunity_id: testOpportunityId,
        score: 85,
        level: 'green',
        issues: [],
        scanned_at: staleDate.toISOString(),
      });
  });

  afterAll(async () => {
    // Clean up test data
    if (testOpportunityId) {
      // Delete Guardian scans first (foreign key constraint)
      await supabase
        .from('guardian_scans')
        .delete()
        .eq('opportunity_id', testOpportunityId);

      // Delete opportunity
      await supabase
        .from('opportunities')
        .delete()
        .eq('id', testOpportunityId);

      // Clean up Redis queue entry
      const queueKey = `guardian:rescan:queue:${testOpportunityId}`;
      await cacheDel([queueKey]);
    }
  });

  describe('listStaleOpportunities', () => {
    it('should find opportunities with stale scans', async () => {
      const staleOpps = await listStaleOpportunities({
        olderThanHours: 24,
        limit: 100,
      });

      expect(Array.isArray(staleOpps)).toBe(true);
      
      // Our test opportunity should be in the list
      const testOpp = staleOpps.find(o => o.id === testOpportunityId);
      expect(testOpp).toBeDefined();
      
      if (testOpp) {
        expect(testOpp.slug).toBe(testOpportunitySlug);
        expect(testOpp.hoursSinceLastScan).toBeGreaterThan(24);
      }
    });

    it('should respect the olderThanHours parameter', async () => {
      // Query for opportunities older than 100 hours
      const veryStaleOpps = await listStaleOpportunities({
        olderThanHours: 100,
        limit: 100,
      });

      // Our test opportunity (48h old) should NOT be in this list
      const testOpp = veryStaleOpps.find(o => o.id === testOpportunityId);
      expect(testOpp).toBeUndefined();
    });

    it('should respect the limit parameter', async () => {
      const staleOpps = await listStaleOpportunities({
        olderThanHours: 24,
        limit: 5,
      });

      expect(staleOpps.length).toBeLessThanOrEqual(5);
    });

    it('should only return published opportunities', async () => {
      const staleOpps = await listStaleOpportunities({
        olderThanHours: 24,
        limit: 100,
      });

      // Verify all returned opportunities are published
      for (const opp of staleOpps) {
        const { data } = await supabase
          .from('opportunities')
          .select('status')
          .eq('id', opp.id)
          .single();

        expect(data?.status).toBe('published');
      }
    });
  });

  describe('queueRescan', () => {
    it('should queue an opportunity for rescan', async () => {
      const success = await queueRescan(testOpportunityId);
      expect(success).toBe(true);

      // Verify the queue entry exists in Redis
      const queueKey = `guardian:rescan:queue:${testOpportunityId}`;
      const queueData = await cacheGet(queueKey);

      expect(queueData).toBeDefined();
      expect(queueData).toHaveProperty('opportunityId', testOpportunityId);
      expect(queueData).toHaveProperty('queuedAt');
      expect(queueData).toHaveProperty('status', 'pending');
    });

    it('should handle multiple queue operations', async () => {
      // Queue the same opportunity multiple times
      const success1 = await queueRescan(testOpportunityId);
      const success2 = await queueRescan(testOpportunityId);
      const success3 = await queueRescan(testOpportunityId);

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(success3).toBe(true);

      // Verify the queue entry still exists
      const queueKey = `guardian:rescan:queue:${testOpportunityId}`;
      const queueData = await cacheGet(queueKey);
      expect(queueData).toBeDefined();
    });
  });

  describe('invalidateGuardianCache', () => {
    it('should invalidate cache for opportunities', async () => {
      // First, ensure there's something in the cache
      const { cacheSet } = await import('@/lib/redis/cache');
      const { RedisKeys } = await import('@/lib/redis/keys');
      
      const cacheKey = RedisKeys.guardianScan(testOpportunityId);
      await cacheSet(cacheKey, { test: 'data' }, { ttl: 3600 });

      // Verify it's cached
      const cachedBefore = await cacheGet(cacheKey);
      expect(cachedBefore).toBeDefined();

      // Invalidate
      const deleted = await invalidateGuardianCache([testOpportunityId]);
      expect(deleted).toBeGreaterThan(0);

      // Verify it's gone
      const cachedAfter = await cacheGet(cacheKey);
      expect(cachedAfter).toBeNull();
    });

    it('should handle empty array', async () => {
      const deleted = await invalidateGuardianCache([]);
      expect(deleted).toBe(0);
    });

    it('should handle multiple opportunities', async () => {
      const { cacheSet } = await import('@/lib/redis/cache');
      const { RedisKeys } = await import('@/lib/redis/keys');
      
      // Create multiple cache entries
      const ids = ['id1', 'id2', 'id3'];
      for (const id of ids) {
        const cacheKey = RedisKeys.guardianScan(id);
        await cacheSet(cacheKey, { test: 'data' }, { ttl: 3600 });
      }

      // Invalidate all
      const deleted = await invalidateGuardianCache(ids);
      expect(deleted).toBe(3);

      // Verify all are gone
      for (const id of ids) {
        const cacheKey = RedisKeys.guardianScan(id);
        const cached = await cacheGet(cacheKey);
        expect(cached).toBeNull();
      }
    });
  });

  describe('End-to-End Cron Flow', () => {
    it('should complete full cron cycle', async () => {
      // Step 1: Find stale opportunities
      const staleOpps = await listStaleOpportunities({
        olderThanHours: 24,
        limit: 10,
      });

      expect(Array.isArray(staleOpps)).toBe(true);

      // Step 2: Queue each for rescan
      const queueResults = await Promise.all(
        staleOpps.map(opp => queueRescan(opp.id))
      );

      // All should succeed
      expect(queueResults.every(r => r === true)).toBe(true);

      // Step 3: Verify queue entries exist
      for (const opp of staleOpps) {
        const queueKey = `guardian:rescan:queue:${opp.id}`;
        const queueData = await cacheGet(queueKey);
        expect(queueData).toBeDefined();
      }

      // Step 4: Clean up queue entries
      const queueKeys = staleOpps.map(opp => `guardian:rescan:queue:${opp.id}`);
      await cacheDel(queueKeys);
    });
  });

  describe('Performance', () => {
    it('should handle large batch of stale opportunities efficiently', async () => {
      const startTime = Date.now();

      const staleOpps = await listStaleOpportunities({
        olderThanHours: 24,
        limit: 100,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in less than 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should queue multiple opportunities efficiently', async () => {
      // Create test opportunity IDs
      const testIds = Array.from({ length: 20 }, (_, i) => `test-id-${i}`);

      const startTime = Date.now();

      await Promise.all(testIds.map(id => queueRescan(id)));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in less than 1 second for 20 items
      expect(duration).toBeLessThan(1000);

      // Clean up
      const queueKeys = testIds.map(id => `guardian:rescan:queue:${id}`);
      await cacheDel(queueKeys);
    });
  });
});
