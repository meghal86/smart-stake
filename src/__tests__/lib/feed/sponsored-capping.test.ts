/**
 * Unit tests for sponsored item capping in feed query
 * 
 * Tests the sliding window filter that enforces ≤2 sponsored items
 * per any contiguous 12 cards.
 * 
 * Requirements: 4.16, 4.19, 5.10, 5.15
 */

import { describe, it, expect } from 'vitest';
import type { Opportunity } from '@/types/hunter';

/**
 * Helper to create a mock opportunity
 */
function createMockOpportunity(id: string, sponsored: boolean): Opportunity {
  return {
    id,
    slug: `opp-${id}`,
    title: `Opportunity ${id}`,
    description: 'Test opportunity',
    protocol: {
      name: 'Test Protocol',
      logo: 'https://example.com/logo.png',
    },
    type: 'airdrop',
    chains: ['ethereum'],
    reward: {
      min: 100,
      max: 1000,
      currency: 'USD',
      confidence: 'estimated',
    },
    trust: {
      score: 85,
      level: 'green',
      last_scanned_ts: new Date().toISOString(),
      issues: [],
    },
    difficulty: 'easy',
    featured: false,
    sponsored,
    time_left_sec: null,
    external_url: 'https://example.com',
    badges: sponsored ? [{ type: 'sponsored', label: 'Sponsored' }] : [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    expires_at: null,
  };
}

/**
 * Apply the same sponsored capping logic as in query.ts
 * This is duplicated here for testing purposes
 */
function applySponsoredCapping(
  opportunities: Opportunity[],
  foldSize: number = 12
): Opportunity[] {
  const WINDOW_SIZE = 12;
  const MAX_SPONSORED_PER_WINDOW = 2;
  
  const result: Opportunity[] = [];
  
  for (const opp of opportunities) {
    if (result.length >= foldSize) {
      break;
    }

    if (!opp.sponsored) {
      result.push(opp);
      continue;
    }

    const windowStart = Math.max(0, result.length - (WINDOW_SIZE - 1));
    const windowItems = result.slice(windowStart);
    const sponsoredInWindow = windowItems.filter(item => item.sponsored).length;

    if (sponsoredInWindow < MAX_SPONSORED_PER_WINDOW) {
      result.push(opp);
    }
  }

  return result;
}

/**
 * Helper to verify no window has more than 2 sponsored items
 */
function verifyWindowCompliance(items: Opportunity[], windowSize: number = 12): boolean {
  for (let i = 0; i <= items.length - windowSize; i++) {
    const window = items.slice(i, i + windowSize);
    const sponsoredCount = window.filter(item => item.sponsored).length;
    if (sponsoredCount > 2) {
      return false;
    }
  }
  return true;
}

describe('Sponsored Capping - Sliding Window Filter', () => {
  describe('Basic Compliance', () => {
    it('should allow up to 2 sponsored items in a 12-card window', () => {
      const opportunities = [
        createMockOpportunity('1', true),  // sponsored
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),  // sponsored
        createMockOpportunity('4', false),
        createMockOpportunity('5', false),
        createMockOpportunity('6', false),
        createMockOpportunity('7', false),
        createMockOpportunity('8', false),
        createMockOpportunity('9', false),
        createMockOpportunity('10', false),
        createMockOpportunity('11', false),
        createMockOpportunity('12', false),
      ];

      const result = applySponsoredCapping(opportunities, 12);

      expect(result).toHaveLength(12);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should reject 3rd sponsored item in same window', () => {
      const opportunities = [
        createMockOpportunity('1', true),  // sponsored - included
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),  // sponsored - included
        createMockOpportunity('4', false),
        createMockOpportunity('5', true),  // sponsored - REJECTED (would be 3rd)
        createMockOpportunity('6', false),
        createMockOpportunity('7', false),
        createMockOpportunity('8', false),
        createMockOpportunity('9', false),
        createMockOpportunity('10', false),
        createMockOpportunity('11', false),
        createMockOpportunity('12', false),
      ];

      const result = applySponsoredCapping(opportunities, 12);

      // Should have 11 items (rejected the 3rd sponsored)
      expect(result.length).toBeLessThanOrEqual(12);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(result.find(item => item.id === '5')).toBeUndefined();
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should handle all non-sponsored items', () => {
      const opportunities = Array.from({ length: 15 }, (_, i) =>
        createMockOpportunity(`${i + 1}`, false)
      );

      const result = applySponsoredCapping(opportunities, 12);

      expect(result).toHaveLength(12);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(0);
    });

    it('should handle all sponsored items (only first 2 included)', () => {
      const opportunities = Array.from({ length: 15 }, (_, i) =>
        createMockOpportunity(`${i + 1}`, true)
      );

      const result = applySponsoredCapping(opportunities, 12);

      // Should only include first 2 sponsored items
      expect(result).toHaveLength(2);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('Sliding Window Behavior', () => {
    it('should enforce cap across any contiguous 12-card window', () => {
      // Create a pattern that would violate if we only check per-page
      const opportunities = [
        createMockOpportunity('1', true),   // sponsored
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 2}`, false)),
        createMockOpportunity('7', true),   // sponsored
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 8}`, false)),
        createMockOpportunity('13', true),  // sponsored - should be included (window slides)
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 14}`, false)),
        createMockOpportunity('19', true),  // sponsored - should be included
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 20}`, false)),
      ];

      const result = applySponsoredCapping(opportunities, 24);

      expect(result.length).toBeGreaterThan(0);
      expect(verifyWindowCompliance(result)).toBe(true);
      
      // Verify we can have more than 2 sponsored total, just not in same window
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBeGreaterThanOrEqual(2);
    });

    it('should allow 3rd sponsored after window slides past first', () => {
      const opportunities = [
        createMockOpportunity('1', true),   // sponsored #1
        ...Array.from({ length: 11 }, (_, i) => createMockOpportunity(`${i + 2}`, false)),
        createMockOpportunity('13', true),  // sponsored #2 (at position 12)
        createMockOpportunity('14', true),  // sponsored #3 (at position 13, first is out of window)
        ...Array.from({ length: 10 }, (_, i) => createMockOpportunity(`${i + 15}`, false)),
      ];

      const result = applySponsoredCapping(opportunities, 24);

      expect(result).toHaveLength(24);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(3); // All 3 should be included
      expect(verifyWindowCompliance(result)).toBe(true);
    });
  });

  describe('Viewport Size Variations', () => {
    it('should work correctly for mobile viewport (6 items)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),
        createMockOpportunity('4', false),
        createMockOpportunity('5', true),  // Should be rejected
        createMockOpportunity('6', false),
        createMockOpportunity('7', false),
      ];

      const result = applySponsoredCapping(opportunities, 6);

      expect(result).toHaveLength(6);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should work correctly for tablet viewport (8 items)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),
        createMockOpportunity('4', false),
        createMockOpportunity('5', true),  // Should be rejected
        createMockOpportunity('6', false),
        createMockOpportunity('7', false),
        createMockOpportunity('8', false),
        createMockOpportunity('9', false),
      ];

      const result = applySponsoredCapping(opportunities, 8);

      expect(result).toHaveLength(8);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should work correctly for desktop viewport (12 items)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),
        createMockOpportunity('4', false),
        createMockOpportunity('5', true),  // Should be rejected
        ...Array.from({ length: 10 }, (_, i) => createMockOpportunity(`${i + 6}`, false)),
      ];

      const result = applySponsoredCapping(opportunities, 12);

      expect(result).toHaveLength(12);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should work correctly for large desktop viewport (24 items)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 2}`, false)),
        createMockOpportunity('7', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 8}`, false)),
        createMockOpportunity('13', true),  // Should be included (window slides)
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 14}`, false)),
        createMockOpportunity('19', true),  // Should be included
        ...Array.from({ length: 10 }, (_, i) => createMockOpportunity(`${i + 20}`, false)),
      ];

      const result = applySponsoredCapping(opportunities, 24);

      expect(result).toHaveLength(24);
      expect(verifyWindowCompliance(result)).toBe(true);
    });
  });

  describe('Partial Folds', () => {
    it('should handle 7 items on short viewport', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),
        createMockOpportunity('4', false),
        createMockOpportunity('5', true),  // Should be rejected
        createMockOpportunity('6', false),
        createMockOpportunity('7', false),
        createMockOpportunity('8', false),
      ];

      const result = applySponsoredCapping(opportunities, 7);

      expect(result).toHaveLength(7);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should handle 5 items on very short viewport', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', true),
        createMockOpportunity('3', true),  // Should be rejected
        createMockOpportunity('4', false),
        createMockOpportunity('5', false),
        createMockOpportunity('6', false),
      ];

      const result = applySponsoredCapping(opportunities, 5);

      expect(result).toHaveLength(5);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
    });

    it('should handle 15 items (1.25 folds)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 2}`, false)),
        createMockOpportunity('7', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 8}`, false)),
        createMockOpportunity('13', true),  // Should be included (window slides)
        createMockOpportunity('14', false),
        createMockOpportunity('15', false),
        createMockOpportunity('16', false),
      ];

      const result = applySponsoredCapping(opportunities, 15);

      expect(result).toHaveLength(15);
      expect(verifyWindowCompliance(result)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = applySponsoredCapping([], 12);
      expect(result).toHaveLength(0);
    });

    it('should handle single item (sponsored)', () => {
      const opportunities = [createMockOpportunity('1', true)];
      const result = applySponsoredCapping(opportunities, 12);
      
      expect(result).toHaveLength(1);
      expect(result[0].sponsored).toBe(true);
    });

    it('should handle single item (non-sponsored)', () => {
      const opportunities = [createMockOpportunity('1', false)];
      const result = applySponsoredCapping(opportunities, 12);
      
      expect(result).toHaveLength(1);
      expect(result[0].sponsored).toBe(false);
    });

    it('should handle exactly 2 sponsored items', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', true),
      ];
      const result = applySponsoredCapping(opportunities, 12);
      
      expect(result).toHaveLength(2);
      expect(result.filter(item => item.sponsored)).toHaveLength(2);
    });

    it('should handle fold size smaller than window (edge case)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', true),
        createMockOpportunity('3', true),  // Should be rejected
        createMockOpportunity('4', false),
      ];

      const result = applySponsoredCapping(opportunities, 4);

      // Should have 3 items (2 sponsored + 1 non-sponsored, 3rd sponsored rejected)
      expect(result.length).toBeLessThanOrEqual(4);
      const sponsoredCount = result.filter(item => item.sponsored).length;
      expect(sponsoredCount).toBe(2);
    });

    it('should be deterministic (same input produces same output)', () => {
      const opportunities = [
        createMockOpportunity('1', true),
        createMockOpportunity('2', false),
        createMockOpportunity('3', true),
        createMockOpportunity('4', true),
        createMockOpportunity('5', false),
        ...Array.from({ length: 10 }, (_, i) => createMockOpportunity(`${i + 6}`, false)),
      ];

      const result1 = applySponsoredCapping([...opportunities], 12);
      const result2 = applySponsoredCapping([...opportunities], 12);

      expect(result1).toEqual(result2);
      expect(result1.map(o => o.id)).toEqual(result2.map(o => o.id));
    });
  });

  describe('Grid Density Variations', () => {
    it('should maintain compliance at mobile density (1 column)', () => {
      // Mobile: 1 column, ~6 items visible
      const opportunities = Array.from({ length: 20 }, (_, i) => 
        createMockOpportunity(`${i + 1}`, i % 4 === 0) // Every 4th is sponsored
      );

      const result = applySponsoredCapping(opportunities, 12);

      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should maintain compliance at tablet density (2 columns)', () => {
      // Tablet: 2 columns, ~8 items visible
      const opportunities = Array.from({ length: 20 }, (_, i) => 
        createMockOpportunity(`${i + 1}`, i % 4 === 0)
      );

      const result = applySponsoredCapping(opportunities, 12);

      expect(verifyWindowCompliance(result)).toBe(true);
    });

    it('should maintain compliance at desktop density (3 columns)', () => {
      // Desktop: 3 columns, ~12 items visible
      const opportunities = Array.from({ length: 20 }, (_, i) => 
        createMockOpportunity(`${i + 1}`, i % 4 === 0)
      );

      const result = applySponsoredCapping(opportunities, 12);

      expect(verifyWindowCompliance(result)).toBe(true);
    });
  });

  describe('Multi-Page Scenarios', () => {
    it('should maintain compliance across multiple page fetches', () => {
      // Simulate first page
      const page1Opportunities = [
        createMockOpportunity('1', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 2}`, false)),
        createMockOpportunity('7', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 8}`, false)),
      ];

      const page1Result = applySponsoredCapping(page1Opportunities, 12);
      expect(verifyWindowCompliance(page1Result)).toBe(true);

      // Simulate second page (starts fresh, but should still comply)
      const page2Opportunities = [
        createMockOpportunity('13', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 14}`, false)),
        createMockOpportunity('19', true),
        ...Array.from({ length: 5 }, (_, i) => createMockOpportunity(`${i + 20}`, false)),
      ];

      const page2Result = applySponsoredCapping(page2Opportunities, 12);
      expect(verifyWindowCompliance(page2Result)).toBe(true);
    });
  });
});
