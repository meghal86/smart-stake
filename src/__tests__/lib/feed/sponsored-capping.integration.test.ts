/**
 * Integration tests for sponsored capping with real database
 * 
 * Tests the sponsored window filter with actual Supabase queries
 * 
 * Requirements: 4.16, 4.19, 5.10, 5.15
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient } from '@/integrations/supabase/service';
import { getFeedPage } from '@/lib/feed/query';

/**
 * Helper to verify no window has more than 2 sponsored items
 */
function verifyWindowCompliance(items: unknown[], windowSize: number = 12): boolean {
  for (let i = 0; i <= items.length - windowSize; i++) {
    const window = items.slice(i, i + windowSize);
    const sponsoredCount = window.filter(item => item.sponsored).length;
    if (sponsoredCount > 2) {
      console.error(`Window violation at index ${i}: ${sponsoredCount} sponsored items`);
      return false;
    }
  }
  return true;
}

/**
 * Helper to create test opportunities
 */
async function createTestOpportunities() {
  const supabase = createServiceClient();
  
  const opportunities = [];
  
  // Create a mix of sponsored and non-sponsored opportunities
  for (let i = 0; i < 30; i++) {
    const isSponsored = i % 3 === 0; // Every 3rd item is sponsored
    
    opportunities.push({
      slug: `test-opp-${i}`,
      title: `Test Opportunity ${i}`,
      protocol_name: 'Test Protocol',
      type: 'airdrop',
      chains: ['ethereum'],
      reward_min: 100,
      reward_max: 1000,
      reward_currency: 'USD',
      reward_confidence: 'estimated',
      difficulty: 'easy',
      featured: false,
      sponsored: isSponsored,
      status: 'published',
      trust_score: 85,
      trust_level: 'green',
      published_at: new Date(Date.now() - i * 1000).toISOString(),
      dedupe_key: `test-${i}`,
      source: 'internal',
    });
  }
  
  const { error } = await supabase
    .from('opportunities')
    .insert(opportunities);
  
  if (error) {
    console.error('Failed to create test opportunities:', error);
    throw error;
  }
}

/**
 * Helper to clean up test opportunities
 */
async function cleanupTestOpportunities() {
  const supabase = createServiceClient();
  
  await supabase
    .from('opportunities')
    .delete()
    .like('slug', 'test-opp-%');
}

describe('Sponsored Capping Integration Tests', () => {
  beforeAll(async () => {
    // Create test data
    await createTestOpportunities();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestOpportunities();
  });

  describe('Basic Feed Query', () => {
    it('should enforce sponsored cap in feed results', async () => {
      const result = await getFeedPage({
        limit: 12,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(12);

      // Verify window compliance
      const isCompliant = verifyWindowCompliance(result.items);
      expect(isCompliant).toBe(true);

      // Count sponsored items
      const sponsoredCount = result.items.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBeLessThanOrEqual(2);
    });

    it('should maintain compliance across multiple pages', async () => {
      // Fetch first page
      const page1 = await getFeedPage({
        limit: 12,
      });

      expect(verifyWindowCompliance(page1.items)).toBe(true);

      // Fetch second page if available
      if (page1.nextCursor) {
        const page2 = await getFeedPage({
          limit: 12,
          cursor: page1.nextCursor,
        });

        expect(verifyWindowCompliance(page2.items)).toBe(true);
      }
    });

    it('should work with different page sizes', async () => {
      const pageSizes = [6, 8, 12, 24];

      for (const pageSize of pageSizes) {
        const result = await getFeedPage({
          limit: pageSize,
        });

        expect(result.items.length).toBeGreaterThan(0);
        expect(verifyWindowCompliance(result.items)).toBe(true);
      }
    });
  });

  describe('With Filters', () => {
    it('should maintain compliance with type filter', async () => {
      const result = await getFeedPage({
        limit: 12,
        types: ['airdrop'],
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });

    it('should maintain compliance with chain filter', async () => {
      const result = await getFeedPage({
        limit: 12,
        chains: ['ethereum'],
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });

    it('should maintain compliance with trust filter', async () => {
      const result = await getFeedPage({
        limit: 12,
        trustMin: 80,
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });

    it('should maintain compliance with multiple filters', async () => {
      const result = await getFeedPage({
        limit: 12,
        types: ['airdrop'],
        chains: ['ethereum'],
        trustMin: 80,
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });
  });

  describe('Sorting Options', () => {
    it('should maintain compliance with recommended sort', async () => {
      const result = await getFeedPage({
        limit: 12,
        sort: 'recommended',
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });

    it('should maintain compliance with newest sort', async () => {
      const result = await getFeedPage({
        limit: 12,
        sort: 'newest',
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });

    it('should maintain compliance with trust sort', async () => {
      const result = await getFeedPage({
        limit: 12,
        sort: 'trust',
      });

      expect(verifyWindowCompliance(result.items)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results gracefully', async () => {
      const result = await getFeedPage({
        limit: 12,
        search: 'nonexistent-opportunity-xyz',
      });

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle small result sets', async () => {
      const result = await getFeedPage({
        limit: 3,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(3);
      
      const sponsoredCount = result.items.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBeLessThanOrEqual(2);
    });

    it('should be deterministic across multiple calls', async () => {
      const result1 = await getFeedPage({
        limit: 12,
      });

      const result2 = await getFeedPage({
        limit: 12,
      });

      // Should return same items in same order
      expect(result1.items.map(i => i.id)).toEqual(result2.items.map(i => i.id));
      
      // Both should be compliant
      expect(verifyWindowCompliance(result1.items)).toBe(true);
      expect(verifyWindowCompliance(result2.items)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete query within acceptable time', async () => {
      const startTime = Date.now();
      
      await getFeedPage({
        limit: 12,
      });
      
      const duration = Date.now() - startTime;
      
      // Should complete within 500ms (generous for integration test)
      expect(duration).toBeLessThan(500);
    });

    it('should handle large page sizes efficiently', async () => {
      const startTime = Date.now();
      
      const result = await getFeedPage({
        limit: 24,
      });
      
      const duration = Date.now() - startTime;
      
      expect(result.items.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
      expect(verifyWindowCompliance(result.items)).toBe(true);
    });
  });
});
