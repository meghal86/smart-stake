/**
 * Property-Based Tests for Filter Application
 * Feature: harvestpro, Property 8: Filter Application
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { applyFilters, hasActiveFilters, getActiveFilterCount } from '../filter-application';
import type { HarvestOpportunity, FilterState, RiskLevel } from '@/types/harvestpro';

// Arbitraries for generating test data
const riskLevelArb = fc.constantFrom<RiskLevel>('LOW', 'MEDIUM', 'HIGH');

const opportunityArb = fc.record({
  id: fc.uuid(),
  lotId: fc.uuid(),
  userId: fc.uuid(),
  token: fc.constantFrom('ETH', 'BTC', 'MATIC', 'LINK', 'UNI', 'AAVE'),
  tokenLogoUrl: fc.option(fc.webUrl(), { nil: null }),
  riskLevel: riskLevelArb,
  unrealizedLoss: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  remainingQty: fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
  gasEstimate: fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }),
  slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
  tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
  netTaxBenefit: fc.float({ min: Math.fround(-1000), max: Math.fround(10000), noNaN: true }),
  guardianScore: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
  executionTimeEstimate: fc.option(fc.constantFrom('5-8 min', '8-12 min', '10-15 min'), { nil: null }),
  confidence: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
  recommendationBadge: fc.constantFrom('recommended', 'not-recommended', 'high-benefit', 'gas-heavy', 'guardian-flagged'),
  metadata: fc.record({
    walletName: fc.option(fc.constantFrom('Main Wallet', 'Trading Wallet', 'Cold Wallet'), { nil: undefined }),
    venue: fc.option(fc.constantFrom('Uniswap', 'SushiSwap', 'QuickSwap', 'CEX Binance', 'CEX Coinbase'), { nil: undefined }),
    reasons: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined }),
  }),
  createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString()),
  updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString()),
}) as fc.Arbitrary<HarvestOpportunity>;

const filterStateArb = fc.record({
  search: fc.option(fc.constantFrom('', 'ETH', 'BTC', 'Main'), { nil: '' }),
  types: fc.array(fc.constantFrom('harvest', 'loss-lot', 'cex-position'), { maxLength: 3 }),
  wallets: fc.array(fc.constantFrom('Main Wallet', 'Trading Wallet', 'Cold Wallet'), { maxLength: 3 }),
  riskLevels: fc.array(riskLevelArb, { maxLength: 3 }),
  minBenefit: fc.float({ min: Math.fround(0), max: Math.fround(5000), noNaN: true }),
  holdingPeriod: fc.constantFrom('short-term', 'long-term', 'all'),
  gasEfficiency: fc.constantFrom('A', 'B', 'C', 'all'),
  liquidity: fc.constantFrom('high', 'medium', 'low', 'all'),
  sort: fc.constantFrom('net-benefit-desc', 'loss-amount-desc', 'guardian-score-desc', 'gas-efficiency-asc', 'newest'),
}) as fc.Arbitrary<FilterState>;

describe('Filter Application - Property Tests', () => {
  /**
   * Property 8: Filter Application
   * Feature: harvestpro, Property 8: Filter Application
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
   * 
   * For any set of opportunities and any filter criteria,
   * applying the filter SHALL return only opportunities matching all active filter conditions
   */
  it('Property 8: All filtered opportunities match all active filter conditions', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        filterStateArb,
        (opportunities, filters) => {
          const filtered = applyFilters(opportunities, filters);

          // All filtered opportunities must be from the original set
          filtered.forEach(opp => {
            expect(opportunities).toContainEqual(opp);
          });

          // Check each filter condition
          filtered.forEach(opp => {
            // Search filter
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              const matchesSearch =
                opp.token.toLowerCase().includes(searchLower) ||
                opp.metadata.walletName?.toLowerCase().includes(searchLower) ||
                opp.metadata.venue?.toLowerCase().includes(searchLower);
              expect(matchesSearch).toBe(true);
            }

            // Risk level filter
            if (filters.riskLevels.length > 0) {
              expect(filters.riskLevels).toContain(opp.riskLevel);
            }

            // Minimum benefit filter
            if (filters.minBenefit > 0) {
              expect(opp.netTaxBenefit).toBeGreaterThanOrEqual(filters.minBenefit);
            }

            // Type filters (if active)
            if (filters.types.length > 0) {
              const matchesType =
                (filters.types.includes('cex-position') && opp.metadata.venue?.includes('CEX')) ||
                (filters.types.includes('harvest') && opp.recommendationBadge === 'recommended') ||
                (filters.types.includes('loss-lot') && opp.unrealizedLoss > 0);
              expect(matchesType).toBe(true);
            }

            // Wallet filters (if active)
            if (filters.wallets.length > 0) {
              const matchesWallet = filters.wallets.some(wallet =>
                opp.metadata.walletName?.includes(wallet)
              );
              expect(matchesWallet).toBe(true);
            }

            // Gas efficiency filter
            if (filters.gasEfficiency !== 'all') {
              const gasRatio = opp.gasEstimate / opp.unrealizedLoss;
              const gasGrade =
                gasRatio < 0.02 ? 'A' : gasRatio < 0.05 ? 'B' : 'C';
              expect(gasGrade).toBe(filters.gasEfficiency);
            }

            // Liquidity filter
            if (filters.liquidity !== 'all') {
              const slippageRatio = opp.slippageEstimate / opp.unrealizedLoss;
              const liquidityLevel =
                slippageRatio < 0.01 ? 'high' : slippageRatio < 0.03 ? 'medium' : 'low';
              expect(liquidityLevel).toBe(filters.liquidity);
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering is idempotent
   * Applying the same filter twice should produce the same result
   */
  it('Property: Filtering is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        filterStateArb,
        (opportunities, filters) => {
          const filtered1 = applyFilters(opportunities, filters);
          const filtered2 = applyFilters(filtered1, filters);

          expect(filtered1).toEqual(filtered2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty filter returns all opportunities (sorted)
   */
  it('Property: Empty filter returns all opportunities', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        (opportunities) => {
          const emptyFilter: FilterState = {
            search: '',
            types: [],
            wallets: [],
            riskLevels: [],
            minBenefit: 0,
            holdingPeriod: 'all',
            gasEfficiency: 'all',
            liquidity: 'all',
            sort: 'net-benefit-desc',
          };

          const filtered = applyFilters(opportunities, emptyFilter);

          // Should have same length
          expect(filtered.length).toBe(opportunities.length);

          // All original opportunities should be present
          opportunities.forEach(opp => {
            expect(filtered).toContainEqual(opp);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering reduces or maintains size
   * Applying a filter should never increase the number of opportunities
   */
  it('Property: Filtering never increases opportunity count', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        filterStateArb,
        (opportunities, filters) => {
          const filtered = applyFilters(opportunities, filters);

          expect(filtered.length).toBeLessThanOrEqual(opportunities.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting maintains filter conditions
   * Changing sort order should not affect which opportunities are included
   */
  it('Property: Different sort orders include same opportunities', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        filterStateArb,
        (opportunities, filters) => {
          const sortOptions: FilterState['sort'][] = [
            'net-benefit-desc',
            'loss-amount-desc',
            'guardian-score-desc',
            'gas-efficiency-asc',
            'newest',
          ];

          const results = sortOptions.map(sort =>
            applyFilters(opportunities, { ...filters, sort })
          );

          // All results should have the same opportunities (just in different order)
          for (let i = 1; i < results.length; i++) {
            expect(results[i].length).toBe(results[0].length);
            
            // Check that same opportunities are present (order may differ)
            results[0].forEach(opp => {
              expect(results[i]).toContainEqual(opp);
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting produces correct order
   */
  it('Property: Sorting produces correct order for net-benefit-desc', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 2, maxLength: 20 }),
        (opportunities) => {
          const filters: FilterState = {
            search: '',
            types: [],
            wallets: [],
            riskLevels: [],
            minBenefit: 0,
            holdingPeriod: 'all',
            gasEfficiency: 'all',
            liquidity: 'all',
            sort: 'net-benefit-desc',
          };

          const filtered = applyFilters(opportunities, filters);

          // Check that each opportunity has net benefit >= next opportunity
          for (let i = 0; i < filtered.length - 1; i++) {
            expect(filtered[i].netTaxBenefit).toBeGreaterThanOrEqual(
              filtered[i + 1].netTaxBenefit
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple risk levels work as OR condition
   */
  it('Property: Multiple risk levels are combined with OR', () => {
    fc.assert(
      fc.property(
        fc.array(opportunityArb, { minLength: 0, maxLength: 20 }),
        fc.array(riskLevelArb, { minLength: 1, maxLength: 3 }),
        (opportunities, riskLevels) => {
          const filters: FilterState = {
            search: '',
            types: [],
            wallets: [],
            riskLevels,
            minBenefit: 0,
            holdingPeriod: 'all',
            gasEfficiency: 'all',
            liquidity: 'all',
            sort: 'net-benefit-desc',
          };

          const filtered = applyFilters(opportunities, filters);

          // All filtered opportunities must have one of the selected risk levels
          filtered.forEach(opp => {
            expect(riskLevels).toContain(opp.riskLevel);
          });

          // All opportunities with selected risk levels should be included
          const expectedCount = opportunities.filter(opp =>
            riskLevels.includes(opp.riskLevel)
          ).length;
          expect(filtered.length).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasActiveFilters correctly identifies active filters
   */
  it('Property: hasActiveFilters is correct', () => {
    fc.assert(
      fc.property(
        filterStateArb,
        (filters) => {
          const isActive = hasActiveFilters(filters);

          const shouldBeActive =
            filters.search !== '' ||
            filters.types.length > 0 ||
            filters.wallets.length > 0 ||
            filters.riskLevels.length > 0 ||
            filters.minBenefit > 0 ||
            filters.holdingPeriod !== 'all' ||
            filters.gasEfficiency !== 'all' ||
            filters.liquidity !== 'all' ||
            filters.sort !== 'net-benefit-desc';

          expect(isActive).toBe(shouldBeActive);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getActiveFilterCount is accurate
   */
  it('Property: getActiveFilterCount counts correctly', () => {
    fc.assert(
      fc.property(
        filterStateArb,
        (filters) => {
          const count = getActiveFilterCount(filters);

          let expectedCount = 0;
          if (filters.search) expectedCount++;
          if (filters.types.length > 0) expectedCount++;
          if (filters.wallets.length > 0) expectedCount++;
          if (filters.riskLevels.length > 0) expectedCount++;
          if (filters.minBenefit > 0) expectedCount++;
          if (filters.holdingPeriod !== 'all') expectedCount++;
          if (filters.gasEfficiency !== 'all') expectedCount++;
          if (filters.liquidity !== 'all') expectedCount++;

          expect(count).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
