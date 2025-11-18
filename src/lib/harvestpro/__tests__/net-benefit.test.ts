/**
 * Property-Based Tests for Net Benefit Calculation
 * Feature: harvestpro, Property 6: Net Benefit Calculation
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateNetBenefit,
  calculateTaxSavings,
  calculateTotalCosts,
  calculateHarvestBenefit,
  type NetBenefitParams,
} from '../net-benefit';

describe('Net Benefit Calculation - Property Tests', () => {
  /**
   * Property 6: Net Benefit Calculation
   * Feature: harvestpro, Property 6: Net Benefit Calculation
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4
   * 
   * For any harvest opportunity, net benefit SHALL equal:
   * (unrealized_loss * tax_rate) - gas_estimate - slippage_estimate - trading_fees
   */
  it('Property 6: Net benefit equals tax savings minus all costs', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          taxRate: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          gasEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        }),
        (params) => {
          const netBenefit = calculateNetBenefit(params);
          
          // Calculate expected value manually
          const taxSavings = params.unrealizedLoss * params.taxRate;
          const totalCosts = params.gasEstimate + params.slippageEstimate + params.tradingFees;
          const expectedNetBenefit = taxSavings - totalCosts;
          
          // Verify the formula is correct
          expect(netBenefit).toBeCloseTo(expectedNetBenefit, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tax savings calculation is correct
   * Validates: Requirement 4.1
   */
  it('Property: Tax savings equals unrealized loss times tax rate', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
        (unrealizedLoss, taxRate) => {
          const taxSavings = calculateTaxSavings(unrealizedLoss, taxRate);
          const expected = unrealizedLoss * taxRate;
          
          expect(taxSavings).toBeCloseTo(expected, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total costs is sum of all cost components
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  it('Property: Total costs equals sum of gas, slippage, and trading fees', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        (gasEstimate, slippageEstimate, tradingFees) => {
          const costs = calculateTotalCosts(gasEstimate, slippageEstimate, tradingFees);
          const expectedTotal = gasEstimate + slippageEstimate + tradingFees;
          
          expect(costs.totalCosts).toBeCloseTo(expectedTotal, 5);
          expect(costs.gasCost).toBe(gasEstimate);
          expect(costs.slippageCost).toBe(slippageEstimate);
          expect(costs.tradingFees).toBe(tradingFees);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net benefit is monotonic with respect to tax rate
   * Higher tax rate should always result in higher net benefit (all else equal)
   */
  it('Property: Net benefit increases with tax rate', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true }),
          gasEstimate: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
          slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
          tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
        }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }),
        (params, taxRate1, taxRate2) => {
          // Ensure taxRate1 < taxRate2
          const lowerRate = Math.min(taxRate1, taxRate2);
          const higherRate = Math.max(taxRate1, taxRate2);
          
          if (lowerRate === higherRate) return true; // Skip if equal
          
          const netBenefit1 = calculateNetBenefit({ ...params, taxRate: lowerRate });
          const netBenefit2 = calculateNetBenefit({ ...params, taxRate: higherRate });
          
          // Higher tax rate should result in higher net benefit
          expect(netBenefit2).toBeGreaterThan(netBenefit1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net benefit decreases with costs
   * Higher costs should always result in lower net benefit (all else equal)
   */
  it('Property: Net benefit decreases with higher costs', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true }),
          taxRate: fc.float({ min: Math.fround(0.1), max: Math.fround(0.5), noNaN: true }),
        }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        (params, cost1, cost2) => {
          // Ensure cost1 < cost2
          const lowerCost = Math.min(cost1, cost2);
          const higherCost = Math.max(cost1, cost2);
          
          // Skip if costs are equal or too close (within floating point precision)
          const epsilon = 1e-6;
          if (Math.abs(higherCost - lowerCost) < epsilon) return true;
          
          const netBenefit1 = calculateNetBenefit({
            ...params,
            gasEstimate: lowerCost,
            slippageEstimate: 0,
            tradingFees: 0,
          });
          
          const netBenefit2 = calculateNetBenefit({
            ...params,
            gasEstimate: higherCost,
            slippageEstimate: 0,
            tradingFees: 0,
          });
          
          // Higher cost should result in lower net benefit
          expect(netBenefit1).toBeGreaterThan(netBenefit2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net benefit is zero when tax rate is zero
   * If there's no tax benefit, net benefit should be negative (just costs)
   */
  it('Property: Zero tax rate results in negative net benefit', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          gasEstimate: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        }),
        (params) => {
          const netBenefit = calculateNetBenefit({ ...params, taxRate: 0 });
          
          // With zero tax rate, net benefit should be negative (just costs)
          const totalCosts = params.gasEstimate + params.slippageEstimate + params.tradingFees;
          expect(netBenefit).toBeCloseTo(-totalCosts, 5);
          expect(netBenefit).toBeLessThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net benefit with zero costs equals tax savings
   */
  it('Property: Zero costs results in net benefit equal to tax savings', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1), noNaN: true }),
        (unrealizedLoss, taxRate) => {
          const netBenefit = calculateNetBenefit({
            unrealizedLoss,
            taxRate,
            gasEstimate: 0,
            slippageEstimate: 0,
            tradingFees: 0,
          });
          
          const taxSavings = unrealizedLoss * taxRate;
          expect(netBenefit).toBeCloseTo(taxSavings, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Harvest benefit includes recommendation flag
   * Validates: Requirement 4.5 (not recommended if net benefit <= 0)
   */
  it('Property: Recommendation is false when net benefit is non-positive', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          taxRate: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          gasEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        }),
        (params) => {
          const result = calculateHarvestBenefit(params);
          
          // Verify recommendation matches net benefit sign
          if (result.netBenefit > 0) {
            expect(result.recommended).toBe(true);
          } else {
            expect(result.recommended).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All cost components are preserved in harvest benefit
   */
  it('Property: Harvest benefit preserves all input values', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          taxRate: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          gasEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          slippageEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          tradingFees: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
        }),
        (params) => {
          const result = calculateHarvestBenefit(params);
          
          // Verify all input values are preserved
          expect(result.unrealizedLoss).toBe(params.unrealizedLoss);
          expect(result.gasCost).toBe(params.gasEstimate);
          expect(result.slippageCost).toBe(params.slippageEstimate);
          expect(result.tradingFees).toBe(params.tradingFees);
          
          // Verify tax savings calculation
          const expectedTaxSavings = params.unrealizedLoss * params.taxRate;
          expect(result.taxSavings).toBeCloseTo(expectedTaxSavings, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net benefit is commutative with respect to cost components
   * Order of costs shouldn't matter
   */
  it('Property: Cost order does not affect net benefit', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          taxRate: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
        }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        (params, cost1, cost2, cost3) => {
          // Calculate with costs in different positions
          const result1 = calculateNetBenefit({
            ...params,
            gasEstimate: cost1,
            slippageEstimate: cost2,
            tradingFees: cost3,
          });
          
          const result2 = calculateNetBenefit({
            ...params,
            gasEstimate: cost2,
            slippageEstimate: cost3,
            tradingFees: cost1,
          });
          
          const result3 = calculateNetBenefit({
            ...params,
            gasEstimate: cost3,
            slippageEstimate: cost1,
            tradingFees: cost2,
          });
          
          // All should be equal (within floating point precision)
          expect(result1).toBeCloseTo(result2, 5);
          expect(result2).toBeCloseTo(result3, 5);
          expect(result1).toBeCloseTo(result3, 5);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
