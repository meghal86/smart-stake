/**
 * Integration tests for Guardian Summary API endpoint
 * 
 * Tests:
 * - Real database queries
 * - Redis caching behavior
 * - End-to-end request flow
 * - Performance benchmarks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { cacheFlushAll } from '@/lib/redis/cache';
import { GET } from '@/app/api/guardian/summary/route';
import { NextRequest } from 'next/server';

describe('Guardian Summary API Integration', () => {
  let testOpportunityIds: string[] = [];

  beforeAll(async () => {
    // Create test opportunities with Guardian scans
    const testData = [
      {
        slug: 'test-opp-1-guardian-summary',
        title: 'Test Opportunity 1',
        protocol_name: 'Test Protocol 1',
        type: 'airdrop',
        chains: ['ethereum'],
        status: 'published',
        dedupe_key: 'test:guardian-summary:1',
        source: 'internal',
      },
      {
        slug: 'test-opp-2-guardian-summary',
        title: 'Test Opportunity 2',
        protocol_name: 'Test Protocol 2',
        type: 'quest',
        chains: ['base'],
        status: 'published',
        dedupe_key: 'test:guardian-summary:2',
        source: 'internal',
      },
      {
        slug: 'test-opp-3-guardian-summary',
        title: 'Test Opportunity 3',
        protocol_name: 'Test Protocol 3',
        type: 'yield',
        chains: ['arbitrum'],
        status: 'published',
        dedupe_key: 'test:guardian-summary:3',
        source: 'internal',
      },
    ];

    // Insert test opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .insert(testData)
      .select('id');

    if (oppError) {
      console.error('Failed to create test opportunities:', oppError);
      throw oppError;
    }

    testOpportunityIds = opportunities!.map((o) => o.id);

    // Insert Guardian scans for each opportunity
    const scanData = [
      {
        opportunity_id: testOpportunityIds[0],
        score: 85,
        level: 'green',
        issues: [
          { type: 'high_gas_approval', severity: 'low' },
          { type: 'unverified_contract', severity: 'medium' },
        ],
        scanned_at: new Date().toISOString(),
      },
      {
        opportunity_id: testOpportunityIds[1],
        score: 65,
        level: 'amber',
        issues: [
          { type: 'mixer_interaction', severity: 'high' },
          { type: 'suspicious_pattern', severity: 'medium' },
        ],
        scanned_at: new Date().toISOString(),
      },
      {
        opportunity_id: testOpportunityIds[2],
        score: 45,
        level: 'red',
        issues: [
          { type: 'sanctions_list', severity: 'critical' },
          { type: 'known_scam', severity: 'critical' },
          { type: 'phishing_detected', severity: 'high' },
        ],
        scanned_at: new Date().toISOString(),
      },
    ];

    const { error: scanError } = await supabase
      .from('guardian_scans')
      .insert(scanData);

    if (scanError) {
      console.error('Failed to create Guardian scans:', scanError);
      throw scanError;
    }

    console.log('Test data created:', testOpportunityIds);
  });

  afterAll(async () => {
    // Clean up test data
    if (testOpportunityIds.length > 0) {
      await supabase
        .from('guardian_scans')
        .delete()
        .in('opportunity_id', testOpportunityIds);

      await supabase
        .from('opportunities')
        .delete()
        .in('id', testOpportunityIds);
    }

    // Clear Redis cache
    await cacheFlushAll();
  });

  beforeEach(async () => {
    // Clear Redis cache before each test
    await cacheFlushAll();
  });

  describe('Database Integration', () => {
    it('should fetch Guardian summaries from database', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds.join(',')}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(3);
      expect(data.requested).toBe(3);

      // Verify green level
      expect(data.summaries[testOpportunityIds[0]]).toMatchObject({
        score: 85,
        level: 'green',
      });

      // Verify amber level
      expect(data.summaries[testOpportunityIds[1]]).toMatchObject({
        score: 65,
        level: 'amber',
      });

      // Verify red level
      expect(data.summaries[testOpportunityIds[2]]).toMatchObject({
        score: 45,
        level: 'red',
      });
    });

    it('should extract top 3 issues from Guardian scans', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[2]}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const summary = data.summaries[testOpportunityIds[2]];
      expect(summary.top_issues).toHaveLength(3);
      expect(summary.top_issues).toContain('sanctions_list');
      expect(summary.top_issues).toContain('known_scam');
      expect(summary.top_issues).toContain('phishing_detected');
    });

    it('should handle opportunities with no Guardian scans', async () => {
      // Create opportunity without Guardian scan
      const { data: opp, error } = await supabase
        .from('opportunities')
        .insert({
          slug: 'test-opp-no-scan',
          title: 'No Scan Opportunity',
          protocol_name: 'Test Protocol',
          type: 'airdrop',
          chains: ['ethereum'],
          status: 'published',
          dedupe_key: 'test:guardian-summary:no-scan',
          source: 'internal',
        })
        .select('id')
        .single();

      if (error) throw error;

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${opp.id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(0);
      expect(data.requested).toBe(1);
      expect(data.summaries[opp.id]).toBeUndefined();

      // Clean up
      await supabase.from('opportunities').delete().eq('id', opp.id);
    });

    it('should use most recent scan when multiple scans exist', async () => {
      // Insert older scan
      const olderScan = {
        opportunity_id: testOpportunityIds[0],
        score: 50,
        level: 'amber',
        issues: [],
        scanned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
      };

      await supabase.from('guardian_scans').insert(olderScan);

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[0]}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const summary = data.summaries[testOpportunityIds[0]];
      // Should use the newer scan (score 85, not 50)
      expect(summary.score).toBe(85);
      expect(summary.level).toBe('green');
    });
  });

  describe('Redis Caching', () => {
    it('should cache Guardian summaries in Redis', async () => {
      const req1 = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[0]}`
      );

      // First request - cache miss
      const response1 = await GET(req1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.summaries[testOpportunityIds[0]]).toBeDefined();

      // Second request - should hit cache
      const req2 = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[0]}`
      );

      const response2 = await GET(req2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.summaries[testOpportunityIds[0]]).toEqual(
        data1.summaries[testOpportunityIds[0]]
      );
    });

    it('should handle partial cache hits', async () => {
      // Prime cache with first opportunity
      const req1 = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[0]}`
      );
      await GET(req1);

      // Request both opportunities (one cached, one not)
      const req2 = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds[0]},${testOpportunityIds[1]}`
      );

      const response2 = await GET(req2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.count).toBe(2);
      expect(data2.summaries[testOpportunityIds[0]]).toBeDefined();
      expect(data2.summaries[testOpportunityIds[1]]).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms for cached data', async () => {
      // Prime cache
      const primeReq = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds.join(',')}`
      );
      await GET(primeReq);

      // Measure cached request
      const start = Date.now();
      
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds.join(',')}`
      );
      
      const response = await GET(req);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200);
      
      console.log(`Cached request took ${duration}ms`);
    });

    it('should respond within 500ms for uncached data', async () => {
      const start = Date.now();
      
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${testOpportunityIds.join(',')}`
      );
      
      const response = await GET(req);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(500);
      
      console.log(`Uncached request took ${duration}ms`);
    });

    it('should handle batch of 10 opportunities efficiently', async () => {
      // Create 10 test opportunities
      const batchData = Array.from({ length: 10 }, (_, i) => ({
        slug: `test-opp-batch-${i}`,
        title: `Batch Test ${i}`,
        protocol_name: 'Batch Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        status: 'published',
        dedupe_key: `test:guardian-summary:batch:${i}`,
        source: 'internal',
      }));

      const { data: batchOpps, error: batchError } = await supabase
        .from('opportunities')
        .insert(batchData)
        .select('id');

      if (batchError) throw batchError;

      const batchIds = batchOpps!.map((o) => o.id);

      // Insert Guardian scans
      const batchScans = batchIds.map((id) => ({
        opportunity_id: id,
        score: 80,
        level: 'green',
        issues: [],
        scanned_at: new Date().toISOString(),
      }));

      await supabase.from('guardian_scans').insert(batchScans);

      // Measure batch request
      const start = Date.now();
      
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${batchIds.join(',')}`
      );
      
      const response = await GET(req);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.count).toBe(10);
      expect(duration).toBeLessThan(500);
      
      console.log(`Batch of 10 took ${duration}ms`);

      // Clean up
      await supabase.from('guardian_scans').delete().in('opportunity_id', batchIds);
      await supabase.from('opportunities').delete().in('id', batchIds);
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate IDs in request', async () => {
      const id = testOpportunityIds[0];
      
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id},${id},${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only return one summary despite duplicate IDs
      expect(Object.keys(data.summaries)).toHaveLength(1);
    });

    it('should handle mix of valid and invalid IDs', async () => {
      const validId = testOpportunityIds[0];
      const invalidId = '00000000-0000-0000-0000-000000000000';
      
      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${validId},${invalidId}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(1);
      expect(data.requested).toBe(2);
      expect(data.summaries[validId]).toBeDefined();
      expect(data.summaries[invalidId]).toBeUndefined();
    });

    it('should handle empty issues array', async () => {
      // Create opportunity with scan but no issues
      const { data: opp, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          slug: 'test-opp-no-issues',
          title: 'No Issues Opportunity',
          protocol_name: 'Test Protocol',
          type: 'airdrop',
          chains: ['ethereum'],
          status: 'published',
          dedupe_key: 'test:guardian-summary:no-issues',
          source: 'internal',
        })
        .select('id')
        .single();

      if (oppError) throw oppError;

      await supabase.from('guardian_scans').insert({
        opportunity_id: opp.id,
        score: 95,
        level: 'green',
        issues: [],
        scanned_at: new Date().toISOString(),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${opp.id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const summary = data.summaries[opp.id];
      expect(summary.top_issues).toEqual([]);

      // Clean up
      await supabase.from('guardian_scans').delete().eq('opportunity_id', opp.id);
      await supabase.from('opportunities').delete().eq('id', opp.id);
    });
  });
});
