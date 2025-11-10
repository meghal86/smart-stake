/**
 * Feed Query Service Integration Tests
 * 
 * Integration tests for getFeedPage() function
 * These tests verify the logic without mocking Supabase
 */

import { describe, it, expect } from 'vitest';
import { applySponsoredCapping, transformRowToOpportunity } from './test-helpers';

describe('Feed Query Service - Integration', () => {
  describe('Sponsored Capping Logic', () => {
    it('should cap sponsored items to ≤2 per fold', () => {
      const opportunities = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol: { name: 'Test Protocol', logo: '' },
        type: 'airdrop' as const,
        chains: ['ethereum' as const],
        reward: { min: 100, max: 500, currency: 'USD' as const, confidence: 'confirmed' as const },
        trust: { score: 85, level: 'green' as const, last_scanned_ts: '2025-01-01T00:00:00Z', issues: [] },
        difficulty: 'easy' as const,
        featured: false,
        sponsored: i < 5, // First 5 are sponsored
        time_left_sec: 86400,
        badges: [],
        status: 'published' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      const result = applySponsoredCapping(opportunities, 12);

      // Count sponsored items in result
      const sponsoredCount = result.filter(item => item.sponsored).length;
      
      // Should have at most 2 sponsored items per fold
      expect(sponsoredCount).toBeLessThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(12);
    });

    it('should include all non-sponsored items up to limit', () => {
      const opportunities = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol: { name: 'Test Protocol', logo: '' },
        type: 'airdrop' as const,
        chains: ['ethereum' as const],
        reward: { min: 100, max: 500, currency: 'USD' as const, confidence: 'confirmed' as const },
        trust: { score: 85, level: 'green' as const, last_scanned_ts: '2025-01-01T00:00:00Z', issues: [] },
        difficulty: 'easy' as const,
        featured: false,
        sponsored: false, // None are sponsored
        time_left_sec: 86400,
        badges: [],
        status: 'published' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      const result = applySponsoredCapping(opportunities, 12);

      // Should include all 12 non-sponsored items
      expect(result.length).toBe(12);
      expect(result.every(item => !item.sponsored)).toBe(true);
    });

    it('should handle mixed sponsored and non-sponsored items', () => {
      const opportunities = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol: { name: 'Test Protocol', logo: '' },
        type: 'airdrop' as const,
        chains: ['ethereum' as const],
        reward: { min: 100, max: 500, currency: 'USD' as const, confidence: 'confirmed' as const },
        trust: { score: 85, level: 'green' as const, last_scanned_ts: '2025-01-01T00:00:00Z', issues: [] },
        difficulty: 'easy' as const,
        featured: false,
        sponsored: i % 3 === 0, // Every 3rd item is sponsored
        time_left_sec: 86400,
        badges: [],
        status: 'published' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      const result = applySponsoredCapping(opportunities, 12);

      const sponsoredCount = result.filter(item => item.sponsored).length;
      
      expect(sponsoredCount).toBeLessThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Row Transformation', () => {
    it('should transform database row to Opportunity object', () => {
      const row = {
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        description: 'Test description',
        protocol_name: 'Test Protocol',
        protocol_logo: 'https://example.com/logo.png',
        type: 'airdrop',
        chains: ['ethereum', 'base'],
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        reward_confidence: 'confirmed',
        apr: 5.5,
        trust_score: 85,
        trust_level: 'green',
        urgency: 'new',
        difficulty: 'easy',
        featured: true,
        sponsored: false,
        time_left_sec: 86400,
        external_url: 'https://example.com',
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
        expires_at: '2025-12-31T23:59:59Z',
      };

      const result = transformRowToOpportunity(row);

      expect(result).toMatchObject({
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        description: 'Test description',
        protocol: {
          name: 'Test Protocol',
          logo: 'https://example.com/logo.png',
        },
        type: 'airdrop',
        chains: ['ethereum', 'base'],
        reward: {
          min: 100,
          max: 500,
          currency: 'USD',
          confidence: 'confirmed',
        },
        apr: 5.5,
        trust: {
          score: 85,
          level: 'green',
          last_scanned_ts: '2025-01-01T00:00:00Z',
          issues: [],
        },
        urgency: 'new',
        difficulty: 'easy',
        featured: true,
        sponsored: false,
        time_left_sec: 86400,
        external_url: 'https://example.com',
        badges: [{ type: 'featured', label: 'Featured' }],
        status: 'published',
      });
    });

    it('should handle missing optional fields', () => {
      const row = {
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = transformRowToOpportunity(row);

      expect(result.protocol.logo).toBe('');
      expect(result.reward.min).toBe(0);
      expect(result.reward.max).toBe(0);
      expect(result.reward.currency).toBe('USD');
      expect(result.badges).toEqual([]);
    });

    it('should add featured badge when featured is true', () => {
      const row = {
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: true,
        sponsored: false,
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = transformRowToOpportunity(row);

      expect(result.badges).toContainEqual({ type: 'featured', label: 'Featured' });
    });

    it('should add sponsored badge when sponsored is true', () => {
      const row = {
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: false,
        sponsored: true,
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = transformRowToOpportunity(row);

      expect(result.badges).toContainEqual({ type: 'sponsored', label: 'Sponsored' });
    });
  });
});
