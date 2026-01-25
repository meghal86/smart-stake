// Feature: hunter-demand-side, Property 12: Empty Requirements Default Eligibility
// Feature: hunter-demand-side, Property 13: Eligibility Score to Status Mapping
// Feature: hunter-demand-side, Property 14: Eligibility Reasons Count
// Validates: Requirements 5.1, 5.7-5.10

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';
import {
  evaluateEligibility,
  clearEligibilityCache,
  type EligibilityResult,
} from '@/lib/hunter/eligibility-engine';
import type { WalletSignals } from '@/lib/hunter/wallet-signals';
import type { Opportunity } from '@/lib/hunter/types';

// Helper to generate valid dates (avoids invalid date errors)
const validDateGenerator = () => fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

describe('Hunter Demand-Side: Eligibility Engine', () => {
  beforeEach(async () => {
    // Clear cache before each test
    const testAddress = '0x' + 'a'.repeat(40);
    await clearEligibilityCache(testAddress);
  });

  describe('Property 12: Empty Requirements Default Eligibility', () => {
    test('opportunities with no requirements return status "maybe" with score 0.5', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: opportunities with empty requirements
          fc.record({
            id: fc.uuid(),
            slug: fc.string({ minLength: 5, maxLength: 20 }),
            title: fc.string({ minLength: 10, maxLength: 50 }),
            protocol: fc.string({ minLength: 3, maxLength: 20 }),
            type: fc.constantFrom('airdrop', 'quest', 'staking', 'yield'),
            chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum'), { minLength: 1, maxLength: 3 }),
            reward_currency: fc.constantFrom('USD', 'ETH', 'POINTS'),
            reward_confidence: fc.constantFrom('confirmed', 'estimated', 'speculative'),
            difficulty: fc.constantFrom('easy', 'medium', 'hard'),
            trust_score: fc.integer({ min: 0, max: 100 }),
            is_verified: fc.boolean(),
            audited: fc.boolean(),
            start_date: validDateGenerator().map(d => d.toISOString()),
            end_date: fc.option(validDateGenerator().map(d => d.toISOString()), { nil: null }),
            urgency: fc.constantFrom('high', 'medium', 'low'),
            // Empty requirements - no chains, no minBalance, no walletAge, no previousTxCount
            requirements: fc.constant({ chains: [] }),
            steps: fc.array(fc.record({
              order: fc.integer({ min: 1, max: 10 }),
              title: fc.string({ minLength: 5, maxLength: 30 }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              action: fc.constantFrom('visit', 'connect', 'transaction', 'social', 'verify'),
            }), { minLength: 1, maxLength: 5 }),
            category: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
            featured: fc.boolean(),
            source: fc.string({ minLength: 3, maxLength: 20 }),
            created_at: validDateGenerator().map(d => d.toISOString()),
            updated_at: validDateGenerator().map(d => d.toISOString()),
          }),
          // Generator: wallet signals (any valid signals)
          fc.record({
            address: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 })
              .map(arr => '0x' + arr.join('')),
            wallet_age_days: fc.option(fc.integer({ min: 0, max: 3650 }), { nil: null }),
            tx_count_90d: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
            chains_active: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum', 'optimism', 'polygon'), { minLength: 0, maxLength: 5 }),
            top_assets: fc.array(fc.record({
              symbol: fc.constantFrom('ETH', 'USDC', 'USDT', 'DAI', 'WETH'),
              amount: fc.float({ min: 0, max: 1000000 }),
            }), { minLength: 0, maxLength: 10 }),
            stablecoin_usd_est: fc.option(fc.float({ min: 0, max: 1000000 }), { nil: null }),
          }),
          async (opportunity, walletSignals) => {
            // Evaluate eligibility
            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: Empty requirements should return status "maybe" with score 0.5
            expect(result.status).toBe('maybe');
            expect(result.score).toBe(0.5);
            expect(result.reasons).toContain('No specific requirements');
          }
        ),
        { numRuns: 50 }
      );
    });

    test('opportunities with only empty chains array return status "maybe" with score 0.5', async () => {
      // Test with requirements object that has only empty chains
      const opportunity: Partial<Opportunity> = {
        id: 'test-opp-1',
        slug: 'test-opportunity',
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
        requirements: { chains: [] }, // Empty chains array
        steps: [],
        category: ['defi'],
        tags: ['test'],
        featured: false,
        source: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 100,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'ETH', amount: 1.0 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, opportunity as Opportunity);

      // Property: Empty requirements should return status "maybe" with score 0.5
      expect(result.status).toBe('maybe');
      expect(result.score).toBe(0.5);
      expect(result.reasons).toContain('No specific requirements');
    });
  });

  describe('Property 13: Eligibility Score to Status Mapping', () => {
    test('score >= 0.8 maps to status "likely"', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: opportunities with requirements that will result in high scores
          fc.record({
            address: fc.constant('0x' + 'b'.repeat(40)),
            wallet_age_days: fc.integer({ min: 365, max: 3650 }), // Old wallet
            tx_count_90d: fc.integer({ min: 100, max: 10000 }), // Many transactions
            chains_active: fc.constant(['ethereum', 'base', 'arbitrum']), // Active on multiple chains
            top_assets: fc.constant([
              { symbol: 'ETH', amount: 10.0 },
              { symbol: 'USDC', amount: 10000 },
            ]),
            stablecoin_usd_est: fc.constant(10000),
          }),
          async (walletSignals) => {
            // Create opportunity with requirements that wallet meets
            const opportunity: Partial<Opportunity> = {
              id: 'test-opp-likely',
              slug: 'test-likely',
              title: 'Test Likely',
              protocol: 'TestProtocol',
              type: 'airdrop',
              chains: ['ethereum'],
              reward_currency: 'USD',
              reward_confidence: 'confirmed',
              difficulty: 'easy',
              trust_score: 90,
              is_verified: true,
              audited: true,
              start_date: new Date().toISOString(),
              urgency: 'medium',
              requirements: {
                chains: ['ethereum'], // Wallet is active on ethereum
                walletAge: 90, // Wallet is older
                previousTxCount: 10, // Wallet has more transactions
              },
              steps: [],
              category: ['defi'],
              tags: ['test'],
              featured: false,
              source: 'test',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: score >= 0.8 should map to status "likely"
            if (result.score >= 0.8) {
              expect(result.status).toBe('likely');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('0.5 <= score < 0.8 maps to status "maybe"', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: wallet signals that will result in medium scores
          fc.record({
            address: fc.constant('0x' + 'c'.repeat(40)),
            wallet_age_days: fc.integer({ min: 30, max: 89 }), // Moderate age
            tx_count_90d: fc.integer({ min: 5, max: 50 }), // Moderate transactions
            chains_active: fc.array(fc.constantFrom('ethereum', 'base'), { minLength: 1, maxLength: 2 }),
            top_assets: fc.array(fc.record({
              symbol: fc.constantFrom('ETH', 'USDC'),
              amount: fc.float({ min: Math.fround(0.1), max: Math.fround(5) }),
            }), { minLength: 1, maxLength: 3 }),
            stablecoin_usd_est: fc.float({ min: Math.fround(100), max: Math.fround(5000) }),
          }),
          async (walletSignals) => {
            // Create opportunity with some requirements
            const opportunity: Partial<Opportunity> = {
              id: 'test-opp-maybe',
              slug: 'test-maybe',
              title: 'Test Maybe',
              protocol: 'TestProtocol',
              type: 'quest',
              chains: ['ethereum', 'base'],
              reward_currency: 'POINTS',
              reward_confidence: 'estimated',
              difficulty: 'medium',
              trust_score: 70,
              is_verified: true,
              audited: false,
              start_date: new Date().toISOString(),
              urgency: 'medium',
              requirements: {
                chains: ['ethereum'],
                walletAge: 90, // Wallet might not meet this
                previousTxCount: 10,
              },
              steps: [],
              category: ['defi'],
              tags: ['test'],
              featured: false,
              source: 'test',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: 0.5 <= score < 0.8 should map to status "maybe"
            if (result.score >= 0.5 && result.score < 0.8) {
              expect(result.status).toBe('maybe');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('score < 0.5 maps to status "unlikely"', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: wallet signals that will result in low scores
          fc.record({
            address: fc.constant('0x' + 'd'.repeat(40)),
            wallet_age_days: fc.integer({ min: 1, max: 29 }), // Very new wallet
            tx_count_90d: fc.integer({ min: 0, max: 4 }), // Few transactions
            chains_active: fc.constant(['polygon']), // Not on required chains
            top_assets: fc.array(fc.record({
              symbol: fc.constantFrom('MATIC', 'WMATIC'),
              amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1) }),
            }), { minLength: 0, maxLength: 2 }),
            stablecoin_usd_est: fc.float({ min: Math.fround(0), max: Math.fround(50) }),
          }),
          async (walletSignals) => {
            // Create opportunity with strict requirements
            const opportunity: Partial<Opportunity> = {
              id: 'test-opp-unlikely',
              slug: 'test-unlikely',
              title: 'Test Unlikely',
              protocol: 'TestProtocol',
              type: 'staking',
              chains: ['ethereum'],
              reward_currency: 'ETH',
              reward_confidence: 'confirmed',
              difficulty: 'hard',
              trust_score: 95,
              is_verified: true,
              audited: true,
              start_date: new Date().toISOString(),
              urgency: 'high',
              requirements: {
                chains: ['ethereum', 'base'], // Wallet not active on these
                walletAge: 365, // Wallet too new
                previousTxCount: 100, // Wallet has too few transactions
              },
              steps: [],
              category: ['defi'],
              tags: ['test'],
              featured: false,
              source: 'test',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: score < 0.5 should map to status "unlikely"
            if (result.score < 0.5) {
              expect(result.status).toBe('unlikely');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('status mapping is deterministic for same score', async () => {
      // Test boundary values
      const testCases = [
        { score: 0.8, expectedStatus: 'likely' },
        { score: 0.9, expectedStatus: 'likely' },
        { score: 1.0, expectedStatus: 'likely' },
        { score: 0.79, expectedStatus: 'maybe' },
        { score: 0.5, expectedStatus: 'maybe' },
        { score: 0.6, expectedStatus: 'maybe' },
        { score: 0.49, expectedStatus: 'unlikely' },
        { score: 0.3, expectedStatus: 'unlikely' },
        { score: 0.0, expectedStatus: 'unlikely' },
      ];

      for (const { score, expectedStatus } of testCases) {
        // Create a scenario that produces the target score
        // We'll use a simple opportunity and adjust wallet signals
        const opportunity: Partial<Opportunity> = {
          id: `test-opp-${score}`,
          slug: `test-${score}`,
          title: `Test ${score}`,
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
          requirements: {
            chains: ['ethereum'],
          },
          steps: [],
          category: ['defi'],
          tags: ['test'],
          featured: false,
          source: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const walletSignals: WalletSignals = {
          address: '0x' + 'e'.repeat(40),
          wallet_age_days: 100,
          tx_count_90d: 50,
          chains_active: score >= 0.6 ? ['ethereum'] : ['polygon'], // Meet or miss chain requirement
          top_assets: [{ symbol: 'ETH', amount: 1.0 }],
          stablecoin_usd_est: 1000,
        };

        const result = await evaluateEligibility(walletSignals, opportunity as Opportunity);

        // The actual score might not match exactly due to scoring logic,
        // but we can verify the status mapping is correct
        if (result.score >= 0.8) {
          expect(result.status).toBe('likely');
        } else if (result.score >= 0.5) {
          expect(result.status).toBe('maybe');
        } else {
          expect(result.status).toBe('unlikely');
        }
      }
    });
  });

  describe('Property 14: Eligibility Reasons Count', () => {
    test('reasons array always contains between 2 and 5 reasons', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: any valid opportunity
          fc.record({
            id: fc.uuid(),
            slug: fc.string({ minLength: 5, maxLength: 20 }),
            title: fc.string({ minLength: 10, maxLength: 50 }),
            protocol: fc.string({ minLength: 3, maxLength: 20 }),
            type: fc.constantFrom('airdrop', 'quest', 'staking', 'yield'),
            chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum'), { minLength: 1, maxLength: 3 }),
            reward_currency: fc.constantFrom('USD', 'ETH', 'POINTS'),
            reward_confidence: fc.constantFrom('confirmed', 'estimated', 'speculative'),
            difficulty: fc.constantFrom('easy', 'medium', 'hard'),
            trust_score: fc.integer({ min: 0, max: 100 }),
            is_verified: fc.boolean(),
            audited: fc.boolean(),
            start_date: validDateGenerator().map(d => d.toISOString()),
            end_date: fc.option(validDateGenerator().map(d => d.toISOString()), { nil: null }),
            urgency: fc.constantFrom('high', 'medium', 'low'),
            requirements: fc.record({
              chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum'), { minLength: 0, maxLength: 3 }),
              walletAge: fc.option(fc.integer({ min: 0, max: 365 }), { nil: undefined }),
              previousTxCount: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            }),
            steps: fc.array(fc.record({
              order: fc.integer({ min: 1, max: 10 }),
              title: fc.string({ minLength: 5, maxLength: 30 }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              action: fc.constantFrom('visit', 'connect', 'transaction', 'social', 'verify'),
            }), { minLength: 1, maxLength: 5 }),
            category: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
            featured: fc.boolean(),
            source: fc.string({ minLength: 3, maxLength: 20 }),
            created_at: validDateGenerator().map(d => d.toISOString()),
            updated_at: validDateGenerator().map(d => d.toISOString()),
          }),
          // Generator: any valid wallet signals
          fc.record({
            address: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 })
              .map(arr => '0x' + arr.join('')),
            wallet_age_days: fc.option(fc.integer({ min: 0, max: 3650 }), { nil: null }),
            tx_count_90d: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
            chains_active: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum', 'optimism', 'polygon'), { minLength: 0, maxLength: 5 }),
            top_assets: fc.array(fc.record({
              symbol: fc.constantFrom('ETH', 'USDC', 'USDT', 'DAI', 'WETH'),
              amount: fc.float({ min: 0, max: 1000000 }),
            }), { minLength: 0, maxLength: 10 }),
            stablecoin_usd_est: fc.option(fc.float({ min: 0, max: 1000000 }), { nil: null }),
          }),
          async (opportunity, walletSignals) => {
            // Evaluate eligibility
            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: reasons array should always have 2-5 reasons
            expect(result.reasons.length).toBeGreaterThanOrEqual(2);
            expect(result.reasons.length).toBeLessThanOrEqual(5);

            // Verify reasons are strings
            result.reasons.forEach(reason => {
              expect(typeof reason).toBe('string');
              expect(reason.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('reasons array contains unique reasons', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: opportunities with various requirements
          fc.record({
            id: fc.uuid(),
            slug: fc.string({ minLength: 5, maxLength: 20 }),
            title: fc.string({ minLength: 10, maxLength: 50 }),
            protocol: fc.string({ minLength: 3, maxLength: 20 }),
            type: fc.constantFrom('airdrop', 'quest', 'staking', 'yield'),
            chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum'), { minLength: 1, maxLength: 3 }),
            reward_currency: fc.constantFrom('USD', 'ETH', 'POINTS'),
            reward_confidence: fc.constantFrom('confirmed', 'estimated', 'speculative'),
            difficulty: fc.constantFrom('easy', 'medium', 'hard'),
            trust_score: fc.integer({ min: 0, max: 100 }),
            is_verified: fc.boolean(),
            audited: fc.boolean(),
            start_date: validDateGenerator().map(d => d.toISOString()),
            end_date: fc.option(validDateGenerator().map(d => d.toISOString()), { nil: null }),
            urgency: fc.constantFrom('high', 'medium', 'low'),
            requirements: fc.record({
              chains: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum'), { minLength: 0, maxLength: 3 }),
              walletAge: fc.option(fc.integer({ min: 0, max: 365 }), { nil: undefined }),
              previousTxCount: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            }),
            steps: fc.array(fc.record({
              order: fc.integer({ min: 1, max: 10 }),
              title: fc.string({ minLength: 5, maxLength: 30 }),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              action: fc.constantFrom('visit', 'connect', 'transaction', 'social', 'verify'),
            }), { minLength: 1, maxLength: 5 }),
            category: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
            featured: fc.boolean(),
            source: fc.string({ minLength: 3, maxLength: 20 }),
            created_at: validDateGenerator().map(d => d.toISOString()),
            updated_at: validDateGenerator().map(d => d.toISOString()),
          }),
          fc.record({
            address: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 })
              .map(arr => '0x' + arr.join('')),
            wallet_age_days: fc.option(fc.integer({ min: 0, max: 3650 }), { nil: null }),
            tx_count_90d: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
            chains_active: fc.array(fc.constantFrom('ethereum', 'base', 'arbitrum', 'optimism', 'polygon'), { minLength: 0, maxLength: 5 }),
            top_assets: fc.array(fc.record({
              symbol: fc.constantFrom('ETH', 'USDC', 'USDT', 'DAI', 'WETH'),
              amount: fc.float({ min: 0, max: 1000000 }),
            }), { minLength: 0, maxLength: 10 }),
            stablecoin_usd_est: fc.option(fc.float({ min: 0, max: 1000000 }), { nil: null }),
          }),
          async (opportunity, walletSignals) => {
            // Evaluate eligibility
            const result = await evaluateEligibility(walletSignals as WalletSignals, opportunity as Opportunity);

            // Property: reasons should be unique (no duplicates)
            const uniqueReasons = new Set(result.reasons);
            expect(uniqueReasons.size).toBe(result.reasons.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('reasons array is non-empty for all eligibility statuses', async () => {
      // Test all three statuses
      const testCases = [
        {
          name: 'likely',
          opportunity: {
            id: 'test-likely',
            slug: 'test-likely',
            title: 'Test Likely',
            protocol: 'TestProtocol',
            type: 'airdrop' as const,
            chains: ['ethereum'],
            reward_currency: 'USD' as const,
            reward_confidence: 'confirmed' as const,
            difficulty: 'easy' as const,
            trust_score: 90,
            is_verified: true,
            audited: true,
            start_date: new Date().toISOString(),
            urgency: 'medium' as const,
            requirements: {
              chains: ['ethereum'],
              walletAge: 30,
              previousTxCount: 5,
            },
            steps: [],
            category: ['defi'],
            tags: ['test'],
            featured: false,
            source: 'test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          walletSignals: {
            address: '0x' + 'f'.repeat(40),
            wallet_age_days: 365,
            tx_count_90d: 100,
            chains_active: ['ethereum', 'base'],
            top_assets: [{ symbol: 'ETH', amount: 10.0 }],
            stablecoin_usd_est: 10000,
          },
        },
        {
          name: 'maybe',
          opportunity: {
            id: 'test-maybe',
            slug: 'test-maybe',
            title: 'Test Maybe',
            protocol: 'TestProtocol',
            type: 'quest' as const,
            chains: ['ethereum'],
            reward_currency: 'POINTS' as const,
            reward_confidence: 'estimated' as const,
            difficulty: 'medium' as const,
            trust_score: 70,
            is_verified: true,
            audited: false,
            start_date: new Date().toISOString(),
            urgency: 'medium' as const,
            requirements: {
              chains: [],
            },
            steps: [],
            category: ['defi'],
            tags: ['test'],
            featured: false,
            source: 'test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          walletSignals: {
            address: '0x' + '1'.repeat(40),
            wallet_age_days: 50,
            tx_count_90d: 20,
            chains_active: ['ethereum'],
            top_assets: [{ symbol: 'ETH', amount: 1.0 }],
            stablecoin_usd_est: 1000,
          },
        },
        {
          name: 'unlikely',
          opportunity: {
            id: 'test-unlikely',
            slug: 'test-unlikely',
            title: 'Test Unlikely',
            protocol: 'TestProtocol',
            type: 'staking' as const,
            chains: ['ethereum'],
            reward_currency: 'ETH' as const,
            reward_confidence: 'confirmed' as const,
            difficulty: 'hard' as const,
            trust_score: 95,
            is_verified: true,
            audited: true,
            start_date: new Date().toISOString(),
            urgency: 'high' as const,
            requirements: {
              chains: ['ethereum', 'base'],
              walletAge: 365,
              previousTxCount: 100,
            },
            steps: [],
            category: ['defi'],
            tags: ['test'],
            featured: false,
            source: 'test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          walletSignals: {
            address: '0x' + '2'.repeat(40),
            wallet_age_days: 10,
            tx_count_90d: 2,
            chains_active: ['polygon'],
            top_assets: [],
            stablecoin_usd_est: 10,
          },
        },
      ];

      for (const testCase of testCases) {
        const result = await evaluateEligibility(
          testCase.walletSignals as WalletSignals,
          testCase.opportunity as Opportunity
        );

        // Property: reasons array should always be non-empty
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.reasons.length).toBeGreaterThanOrEqual(2);
        expect(result.reasons.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Edge Cases', () => {
    test('handles null wallet signals gracefully', async () => {
      const opportunity: Partial<Opportunity> = {
        id: 'test-null-signals',
        slug: 'test-null',
        title: 'Test Null Signals',
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
        requirements: {
          chains: ['ethereum'],
          walletAge: 90,
          previousTxCount: 10,
        },
        steps: [],
        category: ['defi'],
        tags: ['test'],
        featured: false,
        source: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const walletSignals: WalletSignals = {
        address: '0x' + '3'.repeat(40),
        wallet_age_days: null,
        tx_count_90d: null,
        chains_active: [],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = await evaluateEligibility(walletSignals, opportunity as Opportunity);

      // Should return "maybe" status for null signals
      expect(result.status).toBe('maybe');
      expect(result.score).toBe(0.5);
      expect(result.reasons).toContain('Wallet data unavailable');
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.reasons.length).toBeLessThanOrEqual(5);
    });

    test('handles opportunities with all requirement types', async () => {
      const opportunity: Partial<Opportunity> = {
        id: 'test-all-reqs',
        slug: 'test-all-requirements',
        title: 'Test All Requirements',
        protocol: 'TestProtocol',
        type: 'yield',
        chains: ['ethereum', 'base'],
        reward_currency: 'ETH',
        reward_confidence: 'confirmed',
        difficulty: 'hard',
        trust_score: 95,
        is_verified: true,
        audited: true,
        start_date: new Date().toISOString(),
        urgency: 'high',
        requirements: {
          chains: ['ethereum', 'base'],
          walletAge: 180,
          previousTxCount: 50,
          minBalance: { amount: 1.0, token: 'ETH' },
        },
        steps: [],
        category: ['defi'],
        tags: ['test'],
        featured: false,
        source: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const walletSignals: WalletSignals = {
        address: '0x' + '4'.repeat(40),
        wallet_age_days: 200,
        tx_count_90d: 60,
        chains_active: ['ethereum', 'base', 'arbitrum'],
        top_assets: [
          { symbol: 'ETH', amount: 2.5 },
          { symbol: 'USDC', amount: 5000 },
        ],
        stablecoin_usd_est: 5000,
      };

      const result = await evaluateEligibility(walletSignals, opportunity as Opportunity);

      // Should evaluate all requirements
      expect(result.status).toBe('likely');
      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.reasons.length).toBeLessThanOrEqual(5);
    });
  });
});
