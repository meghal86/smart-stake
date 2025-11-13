/**
 * Tests for Personalized Ranking Service
 * 
 * Requirements: 3.1-3.6, 17.4, 18.4
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRelevanceScore,
  applyPersonalizedRanking,
  getDefaultRankingBoost,
} from '@/lib/feed/personalized-ranking';
import { Opportunity } from '@/types/hunter';
import { WalletHistory } from '@/lib/wallet-history';

describe('Personalized Ranking Service', () => {
  const mockWalletHistory: WalletHistory = {
    walletAddress: '0x1234',
    chains: ['ethereum', 'base', 'arbitrum'],
    completedTypes: ['airdrop', 'quest'],
    savedTypes: ['yield', 'staking'],
    preferredChains: ['ethereum', 'base'],
    completedCount: 15,
    savedCount: 8,
    cachedAt: Date.now(),
  };

  const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
    id: 'opp-1',
    slug: 'test-opportunity',
    title: 'Test Opportunity',
    description: 'Test description',
    protocol: {
      name: 'Test Protocol',
      logo: 'https://example.com/logo.png',
    },
    type: 'airdrop',
    chains: ['ethereum'],
    reward: {
      min: 100,
      max: 500,
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
    sponsored: false,
    time_left_sec: 86400,
    external_url: 'https://example.com',
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  });

  describe('calculateRelevanceScore', () => {
    it('should return high score for perfect match', () => {
      const opportunity = createMockOpportunity({
        type: 'airdrop', // Matches completed types
        chains: ['ethereum'], // Matches preferred chains
      });

      const score = calculateRelevanceScore(opportunity, mockWalletHistory);

      // Should be high due to chain and type matches
      expect(score).toBeGreaterThan(0.7);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should return lower score for no match', () => {
      const opportunity = createMockOpportunity({
        type: 'testnet', // Not in completed or saved types
        chains: ['solana'], // Not in wallet history
      });

      const score = calculateRelevanceScore(opportunity, mockWalletHistory);

      // Should be lower due to no matches
      expect(score).toBeLessThan(0.6);
      expect(score).toBeGreaterThan(0);
    });

    it('should score preferred chains highest', () => {
      const preferredChainOpp = createMockOpportunity({
        chains: ['ethereum'], // Preferred chain
        type: 'testnet', // Same type to isolate chain scoring
      });

      const nonPreferredChainOpp = createMockOpportunity({
        chains: ['solana'], // Not in history or preferred
        type: 'testnet', // Same type to isolate chain scoring
      });

      const preferredScore = calculateRelevanceScore(preferredChainOpp, mockWalletHistory);
      const nonPreferredScore = calculateRelevanceScore(nonPreferredChainOpp, mockWalletHistory);

      expect(preferredScore).toBeGreaterThan(nonPreferredScore);
    });

    it('should score completed types higher than saved types', () => {
      const completedTypeOpp = createMockOpportunity({
        type: 'airdrop', // In completed types
      });

      const savedTypeOpp = createMockOpportunity({
        type: 'yield', // In saved types
      });

      const completedScore = calculateRelevanceScore(completedTypeOpp, mockWalletHistory);
      const savedScore = calculateRelevanceScore(savedTypeOpp, mockWalletHistory);

      expect(completedScore).toBeGreaterThan(savedScore);
    });

    it('should consider engagement level (completion count)', () => {
      const highEngagementHistory: WalletHistory = {
        ...mockWalletHistory,
        completedCount: 20,
      };

      const lowEngagementHistory: WalletHistory = {
        ...mockWalletHistory,
        completedCount: 2,
      };

      const opportunity = createMockOpportunity();

      const highScore = calculateRelevanceScore(opportunity, highEngagementHistory);
      const lowScore = calculateRelevanceScore(opportunity, lowEngagementHistory);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should return score between 0 and 1', () => {
      const opportunity = createMockOpportunity();
      const score = calculateRelevanceScore(opportunity, mockWalletHistory);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('applyPersonalizedRanking', () => {
    it('should sort opportunities by personalized rank score', () => {
      const opportunities = [
        createMockOpportunity({
          id: 'opp-1',
          type: 'testnet', // Low relevance
          chains: ['solana'],
          trust: { score: 70, level: 'amber', last_scanned_ts: '', issues: [] },
        }),
        createMockOpportunity({
          id: 'opp-2',
          type: 'airdrop', // High relevance (completed type)
          chains: ['ethereum'], // High relevance (preferred chain)
          trust: { score: 85, level: 'green', last_scanned_ts: '', issues: [] },
        }),
        createMockOpportunity({
          id: 'opp-3',
          type: 'yield', // Medium relevance (saved type)
          chains: ['base'], // High relevance (preferred chain)
          trust: { score: 80, level: 'green', last_scanned_ts: '', issues: [] },
        }),
      ];

      const ranked = applyPersonalizedRanking(opportunities, mockWalletHistory);

      // opp-2 should rank highest (best match)
      expect(ranked[0].id).toBe('opp-2');
      
      // opp-1 should rank lowest (worst match)
      expect(ranked[2].id).toBe('opp-1');
    });

    it('should use trust score as tiebreaker', () => {
      const opportunities = [
        createMockOpportunity({
          id: 'opp-1',
          type: 'airdrop',
          chains: ['ethereum'],
          trust: { score: 70, level: 'amber', last_scanned_ts: '', issues: [] },
        }),
        createMockOpportunity({
          id: 'opp-2',
          type: 'airdrop',
          chains: ['ethereum'],
          trust: { score: 90, level: 'green', last_scanned_ts: '', issues: [] },
        }),
      ];

      const ranked = applyPersonalizedRanking(opportunities, mockWalletHistory);

      // Higher trust should rank first when relevance is equal
      expect(ranked[0].id).toBe('opp-2');
      expect(ranked[1].id).toBe('opp-1');
    });

    it('should use expires_at as tertiary sort', () => {
      const now = Date.now();
      const opportunities = [
        createMockOpportunity({
          id: 'opp-1',
          type: 'airdrop',
          chains: ['ethereum'],
          trust: { score: 85, level: 'green', last_scanned_ts: '', issues: [] },
          expires_at: new Date(now + 172800000).toISOString(), // 2 days
        }),
        createMockOpportunity({
          id: 'opp-2',
          type: 'airdrop',
          chains: ['ethereum'],
          trust: { score: 85, level: 'green', last_scanned_ts: '', issues: [] },
          expires_at: new Date(now + 86400000).toISOString(), // 1 day
        }),
      ];

      const ranked = applyPersonalizedRanking(opportunities, mockWalletHistory);

      // Sooner expiry should rank first when relevance and trust are equal
      expect(ranked[0].id).toBe('opp-2');
      expect(ranked[1].id).toBe('opp-1');
    });

    it('should boost urgency in freshness component', () => {
      const opportunities = [
        createMockOpportunity({
          id: 'opp-1',
          type: 'airdrop',
          chains: ['ethereum'],
          urgency: undefined,
        }),
        createMockOpportunity({
          id: 'opp-2',
          type: 'airdrop',
          chains: ['ethereum'],
          urgency: 'ending_soon',
        }),
      ];

      const ranked = applyPersonalizedRanking(opportunities, mockWalletHistory);

      // Ending soon should rank higher due to freshness boost
      expect(ranked[0].id).toBe('opp-2');
    });

    it('should maintain consistent ordering for identical scores', () => {
      // Create opportunities with identical properties
      const baseProps = {
        type: 'testnet' as const,
        chains: ['solana' as const],
        trust: { score: 75, level: 'amber' as const, last_scanned_ts: '', issues: [] },
        difficulty: 'medium' as const,
        urgency: undefined,
        featured: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const opportunities = [
        createMockOpportunity({ ...baseProps, id: 'opp-1' }),
        createMockOpportunity({ ...baseProps, id: 'opp-2' }),
        createMockOpportunity({ ...baseProps, id: 'opp-3' }),
      ];

      const ranked1 = applyPersonalizedRanking([...opportunities], mockWalletHistory);
      const ranked2 = applyPersonalizedRanking([...opportunities], mockWalletHistory);

      // Should produce consistent ordering across multiple calls
      expect(ranked1.map(o => o.id)).toEqual(ranked2.map(o => o.id));
      
      // All items should be present
      expect(ranked1).toHaveLength(3);
    });
  });

  describe('getDefaultRankingBoost', () => {
    it('should boost green trust items', () => {
      const greenOpp = createMockOpportunity({
        trust: { score: 85, level: 'green', last_scanned_ts: '', issues: [] },
      });

      const amberOpp = createMockOpportunity({
        trust: { score: 70, level: 'amber', last_scanned_ts: '', issues: [] },
      });

      const greenBoost = getDefaultRankingBoost(greenOpp);
      const amberBoost = getDefaultRankingBoost(amberOpp);

      expect(greenBoost).toBeGreaterThan(amberBoost);
    });

    it('should boost easy difficulty', () => {
      const easyOpp = createMockOpportunity({ difficulty: 'easy' });
      const hardOpp = createMockOpportunity({ difficulty: 'advanced' });

      const easyBoost = getDefaultRankingBoost(easyOpp);
      const hardBoost = getDefaultRankingBoost(hardOpp);

      expect(easyBoost).toBeGreaterThan(hardBoost);
    });

    it('should boost featured items', () => {
      const featuredOpp = createMockOpportunity({ featured: true });
      const normalOpp = createMockOpportunity({ featured: false });

      const featuredBoost = getDefaultRankingBoost(featuredOpp);
      const normalBoost = getDefaultRankingBoost(normalOpp);

      expect(featuredBoost).toBeGreaterThan(normalBoost);
    });

    it('should boost hot and new items', () => {
      const hotOpp = createMockOpportunity({ urgency: 'hot' });
      const newOpp = createMockOpportunity({ urgency: 'new' });
      const normalOpp = createMockOpportunity({ urgency: undefined });

      const hotBoost = getDefaultRankingBoost(hotOpp);
      const newBoost = getDefaultRankingBoost(newOpp);
      const normalBoost = getDefaultRankingBoost(normalOpp);

      expect(hotBoost).toBeGreaterThan(normalBoost);
      expect(newBoost).toBeGreaterThan(normalBoost);
    });

    it('should cap boost at 0.5', () => {
      const maxBoostedOpp = createMockOpportunity({
        trust: { score: 90, level: 'green', last_scanned_ts: '', issues: [] },
        difficulty: 'easy',
        featured: true,
        urgency: 'hot',
      });

      const boost = getDefaultRankingBoost(maxBoostedOpp);

      expect(boost).toBeLessThanOrEqual(0.5);
    });
  });
});
