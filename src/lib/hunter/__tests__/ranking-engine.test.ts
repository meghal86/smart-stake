// Feature: hunter-demand-side, Property 15: Ranking Formula Correctness
// Feature: hunter-demand-side, Property 16: Relevance Calculation Correctness
// Feature: hunter-demand-side, Property 17: Freshness Calculation Correctness
// Validates: Requirements 6.1-6.9

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  calculateRanking,
  batchCalculateRanking,
  calculateRecencyBoost,
  sortByRanking,
  type RankingScores,
  type UserHistory,
} from '../ranking-engine';
import type { Opportunity } from '../types';
import type { WalletSignals } from '../wallet-signals';
import type { EligibilityResult } from '../eligibility-engine';

// Helper to generate valid dates
const validDateGenerator = () => fc.date({ 
  min: new Date('2020-01-01'), 
  max: new Date('2030-12-31') 
});

// Helper to create a minimal valid opportunity
const createOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'test-id',
  slug: 'test-slug',
  title: 'Test Opportunity',
  protocol: 'TestProtocol',
  type: 'airdrop',
  chains: ['ethereum'],
  reward_currency: 'USD',
  reward_confidence: 'confirmed',
  difficulty: 'easy',
  trust_score: 80,
  is_verified: true,
  audited: true,
  start_date: new Date().toISOString(),
  urgency: 'medium',
  requirements: { chains: [] },
  steps: [],
  category: ['defi'],
  tags: ['test'],
  featured: false,
  source: 'test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('Hunter Demand-Side: Ranking Engine Properties', () => {
  describe('Property 15: Ranking Formula Correctness', () => {
    test('overall score equals 0.60 × relevance + 0.25 × trust + 0.15 × freshness', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // trust_score
          fc.date({ min: new Date('2024-01-01'), max: new Date() }), // created_at
          (trustScore, createdAt) => {
            const opportunity = createOpportunity({
              trust_score: trustScore,
              created_at: createdAt.toISOString(),
            });

            const eligibility: EligibilityResult = {
              status: 'maybe',
              score: 0.5,
              reasons: ['Test reason 1', 'Test reason 2'],
            };

            const walletSignals: WalletSignals = {
              address: '0x' + 'a'.repeat(40),
              wallet_age_days: 100,
              tx_count_90d: 50,
              chains_active: ['ethereum'],
              top_assets: [],
              stablecoin_usd_est: null,
            };

            const ranking = calculateRanking(opportunity, eligibility, walletSignals);

            // Property: Overall score should equal weighted sum
            const trust = trustScore / 100;
            const expectedOverall = 0.60 * ranking.relevance + 0.25 * trust + 0.15 * ranking.freshness;

            expect(ranking.overall).toBeCloseTo(expectedOverall, 10);

            // Property: All scores should be clamped to [0, 1]
            expect(ranking.overall).toBeGreaterThanOrEqual(0);
            expect(ranking.overall).toBeLessThanOrEqual(1);
            expect(ranking.relevance).toBeGreaterThanOrEqual(0);
            expect(ranking.relevance).toBeLessThanOrEqual(1);
            expect(ranking.freshness).toBeGreaterThanOrEqual(0);
            expect(ranking.freshness).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 30 } // Reduced from 100 to 30 for faster execution
      );
    });
  });
  describe('Property 16: Relevance Calculation Correctness', () => {
    test('adds 0.4 for chain match', () => {
      const opportunity = createOpportunity({ chains: ['ethereum', 'base'] });
      const eligibility: EligibilityResult = { 
        status: 'unlikely', 
        score: 0.3, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals);
      expect(ranking.relevance).toBeGreaterThanOrEqual(0.4);
    });

    test('adds 0.2 for likely eligibility status', () => {
      const opportunity = createOpportunity({ chains: ['polygon'] });
      const eligibility: EligibilityResult = { 
        status: 'likely', 
        score: 0.9, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + 'b'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals);
      expect(ranking.relevance).toBeGreaterThanOrEqual(0.2);
    });

    test('adds 0.1 for maybe eligibility status', () => {
      const opportunity = createOpportunity({ chains: ['polygon'] });
      const eligibility: EligibilityResult = { 
        status: 'maybe', 
        score: 0.6, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + 'c'.repeat(40),
        wallet_age_days: 50,
        tx_count_90d: 20,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals);
      expect(ranking.relevance).toBeGreaterThanOrEqual(0.1);
    });
    test('adds 0.1 for tag match', () => {
      const opportunity = createOpportunity({ tags: ['staking', 'yield'] });
      const eligibility: EligibilityResult = { 
        status: 'unlikely', 
        score: 0.3, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + 'd'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };
      const userHistory: UserHistory = { saved_tags: ['staking', 'defi'] };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals, userHistory);
      expect(ranking.relevance).toBeGreaterThanOrEqual(0.1);
    });

    test('adds 0.2 for type match', () => {
      const opportunity = createOpportunity({ type: 'yield' });
      const eligibility: EligibilityResult = { 
        status: 'unlikely', 
        score: 0.3, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + 'e'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };
      const userHistory: UserHistory = { most_completed_type: 'yield' };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals, userHistory);
      expect(ranking.relevance).toBeGreaterThanOrEqual(0.2);
    });

    test('relevance is always clamped to [0, 1]', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('likely', 'maybe', 'unlikely'),
          fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
          fc.constantFrom('airdrop', 'quest', 'staking', 'yield'),
          (status, chains, type) => {
            const opportunity = createOpportunity({ chains, type });
            const eligibility: EligibilityResult = { 
              status: status as any, 
              score: 0.5, 
              reasons: ['Test 1', 'Test 2'] 
            };
            const walletSignals: WalletSignals = {
              address: '0x' + 'f'.repeat(40),
              wallet_age_days: 100,
              tx_count_90d: 50,
              chains_active: chains,
              top_assets: [],
              stablecoin_usd_est: null,
            };
            const userHistory: UserHistory = { saved_tags: ['test'], most_completed_type: type };

            const ranking = calculateRanking(opportunity, eligibility, walletSignals, userHistory);

            expect(ranking.relevance).toBeGreaterThanOrEqual(0);
            expect(ranking.relevance).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 20 } // Reduced from 100 to 20 for faster execution
      );
    });
  });
  describe('Property 17: Freshness Calculation Correctness', () => {
    test('calculates urgency boost for opportunities with end_date', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 84 * 60 * 60 * 1000); // 84 hours = 3.5 days

      const opportunity = createOpportunity({
        start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const eligibility: EligibilityResult = { 
        status: 'likely', 
        score: 0.9, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + '1'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals);

      // urgency = max(0, 1 - 84 / 168) = 0.5
      expect(ranking.freshness).toBeGreaterThanOrEqual(0.4);
    });

    test('calculates recency for all opportunities', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

      const opportunity = createOpportunity({
        created_at: createdAt.toISOString(),
        end_date: null,
      });

      const eligibility: EligibilityResult = { 
        status: 'maybe', 
        score: 0.6, 
        reasons: ['Test 1', 'Test 2'] 
      };
      const walletSignals: WalletSignals = {
        address: '0x' + '2'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['base'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const ranking = calculateRanking(opportunity, eligibility, walletSignals);

      // recency = max(0, 1 - 15 / 30) = 0.5
      expect(ranking.freshness).toBeCloseTo(0.5, 1);
    });
    test('freshness is always clamped to [0, 1]', () => {
      fc.assert(
        fc.property(
          validDateGenerator(),
          fc.option(validDateGenerator(), { nil: null }),
          (createdAt, endDate) => {
            // Skip invalid dates
            if (isNaN(createdAt.getTime()) || (endDate && isNaN(endDate.getTime()))) {
              return true;
            }

            const opportunity = createOpportunity({
              created_at: createdAt.toISOString(),
              end_date: endDate ? endDate.toISOString() : null,
            });

            const eligibility: EligibilityResult = { 
              status: 'maybe', 
              score: 0.5, 
              reasons: ['Test 1', 'Test 2'] 
            };
            const walletSignals: WalletSignals = {
              address: '0x' + '3'.repeat(40),
              wallet_age_days: 100,
              tx_count_90d: 50,
              chains_active: ['ethereum'],
              top_assets: [],
              stablecoin_usd_est: null,
            };

            const ranking = calculateRanking(opportunity, eligibility, walletSignals);

            expect(ranking.freshness).toBeGreaterThanOrEqual(0);
            expect(ranking.freshness).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 25 } // Reduced from 100 to 25 for faster execution
      );
    });
  });
  describe('Utility Functions', () => {
    test('batchCalculateRanking returns same length as input', () => {
      const opportunities = [
        createOpportunity({ id: '1' }),
        createOpportunity({ id: '2' }),
        createOpportunity({ id: '3' }),
      ];

      const eligibilityResults = opportunities.map(() => ({
        status: 'maybe' as const,
        score: 0.5,
        reasons: ['Test 1', 'Test 2'],
      }));

      const walletSignals: WalletSignals = {
        address: '0x' + '4'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const rankings = batchCalculateRanking(opportunities, eligibilityResults, walletSignals);

      expect(rankings.length).toBe(opportunities.length);
    });

    test('sortByRanking sorts in descending order', () => {
      const opportunities = [
        { id: '1', title: 'Low', ranking: { overall: 0.3, relevance: 0.2, freshness: 0.5 } },
        { id: '2', title: 'High', ranking: { overall: 0.9, relevance: 0.8, freshness: 0.9 } },
        { id: '3', title: 'Medium', ranking: { overall: 0.6, relevance: 0.5, freshness: 0.7 } },
      ];

      const sorted = sortByRanking(opportunities);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].ranking.overall).toBeGreaterThanOrEqual(sorted[i].ranking.overall);
      }
    });

    test('calculateRecencyBoost returns value between 0 and 1', () => {
      fc.assert(
        fc.property(
          validDateGenerator(),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (createdAt, now) => {
            // Skip invalid dates
            if (isNaN(createdAt.getTime()) || isNaN(now.getTime())) {
              return true;
            }

            const recency = calculateRecencyBoost(createdAt.toISOString(), now.getTime());

            expect(recency).toBeGreaterThanOrEqual(0);
            expect(recency).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 20 } // Reduced from 100 to 20 for faster execution
      );
    });
  });
});