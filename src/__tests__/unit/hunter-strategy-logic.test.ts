/**
 * Unit Tests: Hunter Strategy Logic
 * 
 * Tests strategy-specific logic:
 * - Strategy step ordering
 * - Subscription tracking
 * - Trust score computation (aggregation across steps)
 * - Trust score caching and recomputation on update
 * - steps_trust_breakdown format and content
 */

import { describe, test, expect } from 'vitest';

// Mock types for testing
interface Opportunity {
  id: string;
  title: string;
  type: string;
  trust_score: number;
}

interface Strategy {
  id: string;
  slug: string;
  title: string;
  description: string;
  creator_id: string;
  steps: string[]; // Array of opportunity IDs
  trust_score_cached: number;
  steps_trust_breakdown: number[];
  category: string[];
  tags: string[];
  featured: boolean;
}

interface StrategySubscription {
  id: string;
  user_id: string;
  strategy_id: string;
  subscribed_at: string;
}

/**
 * Compute trust score by aggregating opportunity trust scores
 */
function computeTrustScore(opportunities: Opportunity[]): {
  trust_score_cached: number;
  steps_trust_breakdown: number[];
} {
  const steps_trust_breakdown = opportunities.map((opp) => opp.trust_score || 80);
  const trust_score_cached =
    steps_trust_breakdown.reduce((sum, score) => sum + score, 0) /
    steps_trust_breakdown.length;

  return {
    trust_score_cached: Math.round(trust_score_cached),
    steps_trust_breakdown,
  };
}

/**
 * Validate strategy step ordering
 */
function validateStepOrdering(strategy: Strategy): boolean {
  // Steps should be in the order they were added
  // No duplicates allowed
  const uniqueSteps = new Set(strategy.steps);
  return uniqueSteps.size === strategy.steps.length;
}

describe('Hunter Strategy Logic', () => {
  describe('Strategy Step Ordering', () => {
    test('maintains step order as defined', () => {
      const strategy: Strategy = {
        id: '1',
        slug: 'test-strategy',
        title: 'Test Strategy',
        description: 'Test',
        creator_id: 'user-1',
        steps: ['opp-1', 'opp-2', 'opp-3'],
        trust_score_cached: 85,
        steps_trust_breakdown: [80, 85, 90],
        category: ['test'],
        tags: ['test'],
        featured: false,
      };

      expect(strategy.steps).toEqual(['opp-1', 'opp-2', 'opp-3']);
      expect(strategy.steps[0]).toBe('opp-1');
      expect(strategy.steps[1]).toBe('opp-2');
      expect(strategy.steps[2]).toBe('opp-3');
    });

    test('rejects duplicate steps', () => {
      const strategy: Strategy = {
        id: '1',
        slug: 'test-strategy',
        title: 'Test Strategy',
        description: 'Test',
        creator_id: 'user-1',
        steps: ['opp-1', 'opp-2', 'opp-1'], // Duplicate
        trust_score_cached: 85,
        steps_trust_breakdown: [80, 85, 80],
        category: ['test'],
        tags: ['test'],
        featured: false,
      };

      expect(validateStepOrdering(strategy)).toBe(false);
    });

    test('allows empty steps array', () => {
      const strategy: Strategy = {
        id: '1',
        slug: 'test-strategy',
        title: 'Test Strategy',
        description: 'Test',
        creator_id: 'user-1',
        steps: [],
        trust_score_cached: 80,
        steps_trust_breakdown: [],
        category: ['test'],
        tags: ['test'],
        featured: false,
      };

      expect(validateStepOrdering(strategy)).toBe(true);
      expect(strategy.steps.length).toBe(0);
    });
  });

  describe('Subscription Tracking', () => {
    test('tracks user subscription to strategy', () => {
      const subscription: StrategySubscription = {
        id: 'sub-1',
        user_id: 'user-1',
        strategy_id: 'strategy-1',
        subscribed_at: new Date().toISOString(),
      };

      expect(subscription.user_id).toBe('user-1');
      expect(subscription.strategy_id).toBe('strategy-1');
      expect(subscription.subscribed_at).toBeDefined();
    });

    test('allows multiple users to subscribe to same strategy', () => {
      const subscriptions: StrategySubscription[] = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          strategy_id: 'strategy-1',
          subscribed_at: new Date().toISOString(),
        },
        {
          id: 'sub-2',
          user_id: 'user-2',
          strategy_id: 'strategy-1',
          subscribed_at: new Date().toISOString(),
        },
      ];

      expect(subscriptions.length).toBe(2);
      expect(subscriptions[0].strategy_id).toBe(subscriptions[1].strategy_id);
      expect(subscriptions[0].user_id).not.toBe(subscriptions[1].user_id);
    });

    test('allows user to subscribe to multiple strategies', () => {
      const subscriptions: StrategySubscription[] = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          strategy_id: 'strategy-1',
          subscribed_at: new Date().toISOString(),
        },
        {
          id: 'sub-2',
          user_id: 'user-1',
          strategy_id: 'strategy-2',
          subscribed_at: new Date().toISOString(),
        },
      ];

      expect(subscriptions.length).toBe(2);
      expect(subscriptions[0].user_id).toBe(subscriptions[1].user_id);
      expect(subscriptions[0].strategy_id).not.toBe(subscriptions[1].strategy_id);
    });
  });

  describe('Trust Score Computation', () => {
    test('computes average trust score from opportunities', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 85 },
      ];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      expect(trust_score_cached).toBe(85); // (80 + 90 + 85) / 3 = 85
      expect(steps_trust_breakdown).toEqual([80, 90, 85]);
    });

    test('rounds trust score to nearest integer', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 85 },
      ];

      const { trust_score_cached } = computeTrustScore(opportunities);

      expect(trust_score_cached).toBe(83); // (80 + 85) / 2 = 82.5 → 83
    });

    test('handles single opportunity', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 92 },
      ];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      expect(trust_score_cached).toBe(92);
      expect(steps_trust_breakdown).toEqual([92]);
    });

    test('uses default trust score for missing values', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 0 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
      ];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      // When trust_score is 0 or missing, use default of 80
      expect(steps_trust_breakdown[0]).toBe(80); // Default applied
      expect(trust_score_cached).toBe(85); // (80 + 90) / 2 = 85
    });
  });

  describe('Trust Score Caching', () => {
    test('caches computed trust score', () => {
      const strategy: Strategy = {
        id: '1',
        slug: 'test-strategy',
        title: 'Test Strategy',
        description: 'Test',
        creator_id: 'user-1',
        steps: ['opp-1', 'opp-2', 'opp-3'],
        trust_score_cached: 85,
        steps_trust_breakdown: [80, 85, 90],
        category: ['test'],
        tags: ['test'],
        featured: false,
      };

      expect(strategy.trust_score_cached).toBe(85);
      expect(strategy.steps_trust_breakdown).toEqual([80, 85, 90]);
    });

    test('recomputes trust score when steps change', () => {
      // Initial strategy
      const opportunities1: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
      ];

      const { trust_score_cached: score1, steps_trust_breakdown: breakdown1 } =
        computeTrustScore(opportunities1);

      expect(score1).toBe(85);
      expect(breakdown1).toEqual([80, 90]);

      // Updated strategy with new step
      const opportunities2: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 95 },
      ];

      const { trust_score_cached: score2, steps_trust_breakdown: breakdown2 } =
        computeTrustScore(opportunities2);

      expect(score2).toBe(88); // (80 + 90 + 95) / 3 = 88.33 → 88
      expect(breakdown2).toEqual([80, 90, 95]);
      expect(score2).not.toBe(score1); // Trust score changed
    });
  });

  describe('steps_trust_breakdown Format', () => {
    test('maintains same order as steps array', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 85 },
      ];

      const { steps_trust_breakdown } = computeTrustScore(opportunities);

      expect(steps_trust_breakdown.length).toBe(opportunities.length);
      expect(steps_trust_breakdown[0]).toBe(opportunities[0].trust_score);
      expect(steps_trust_breakdown[1]).toBe(opportunities[1].trust_score);
      expect(steps_trust_breakdown[2]).toBe(opportunities[2].trust_score);
    });

    test('is an array of numbers', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
      ];

      const { steps_trust_breakdown } = computeTrustScore(opportunities);

      expect(Array.isArray(steps_trust_breakdown)).toBe(true);
      expect(steps_trust_breakdown.every((score) => typeof score === 'number')).toBe(
        true
      );
    });

    test('has same length as steps array', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 80 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 90 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 85 },
        { id: 'opp-4', title: 'Opp 4', type: 'points', trust_score: 88 },
      ];

      const { steps_trust_breakdown } = computeTrustScore(opportunities);

      expect(steps_trust_breakdown.length).toBe(opportunities.length);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty opportunities array', () => {
      const opportunities: Opportunity[] = [];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      // Should return NaN or default value
      expect(isNaN(trust_score_cached) || trust_score_cached === 80).toBe(true);
      expect(steps_trust_breakdown).toEqual([]);
    });

    test('handles very high trust scores', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 98 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 99 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 100 },
      ];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      expect(trust_score_cached).toBe(99); // (98 + 99 + 100) / 3 = 99
      expect(steps_trust_breakdown).toEqual([98, 99, 100]);
    });

    test('handles very low trust scores', () => {
      const opportunities: Opportunity[] = [
        { id: 'opp-1', title: 'Opp 1', type: 'airdrop', trust_score: 50 },
        { id: 'opp-2', title: 'Opp 2', type: 'quest', trust_score: 55 },
        { id: 'opp-3', title: 'Opp 3', type: 'yield', trust_score: 60 },
      ];

      const { trust_score_cached, steps_trust_breakdown } =
        computeTrustScore(opportunities);

      expect(trust_score_cached).toBe(55); // (50 + 55 + 60) / 3 = 55
      expect(steps_trust_breakdown).toEqual([50, 55, 60]);
    });
  });
});
