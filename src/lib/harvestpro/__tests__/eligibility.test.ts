/**
 * Property-Based Tests for Eligibility Filtering
 * Feature: harvestpro, Property 5: Eligibility Filter Composition
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  checkEligibility,
  checkMinimumLoss,
  checkLiquidity,
  checkGuardianScore,
  checkGasCost,
  checkTradability,
  DEFAULT_ELIGIBILITY_FILTERS,
  type EligibilityParams,
} from '../eligibility';
import type { OpportunityCandidate } from '../opportunity-detection';
import type { Lot } from '../fifo';

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generate a valid Lot for testing
 */
const lotArbitrary = fc.record({
  acquiredAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
  quantity: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
  priceUsd: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  remaining: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
});

/**
 * Generate a valid OpportunityCandidate for testing
 */
const opportunityCandidateArbitrary = fc.record({
  lot: lotArbitrary,
  unrealizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(-0.01), noNaN: true }), // Always negative (loss)
  unrealizedLoss: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }), // Always positive
  holdingPeriodDays: fc.integer({ min: 0, max: 3650 }),
  longTerm: fc.boolean(),
  riskLevel: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
  liquidityScore: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
  guardianScore: fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }),
});

/**
 * Generate eligibility parameters with controlled values
 */
const eligibilityParamsArbitrary = fc.record({
  opportunity: opportunityCandidateArbitrary,
  gasEstimate: fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
  isTradable: fc.boolean(),
});

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Eligibility Filtering - Property Tests', () => {
  /**
   * Property 5: Eligibility Filter Composition
   * Feature: harvestpro, Property 5: Eligibility Filter Composition
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   * 
   * For any lot, it SHALL be eligible for harvest if and only if:
   * - unrealized loss > $20 AND
   * - liquidity score >= threshold AND
   * - guardian score >= 3 AND
   * - gas cost < unrealized loss AND
   * - token is tradable
   */
  it('Property 5: Eligibility Filter Composition - all criteria must pass', () => {
    fc.assert(
      fc.property(
        eligibilityParamsArbitrary,
        (params: EligibilityParams) => {
          const result = checkEligibility(params);
          
          const { opportunity, gasEstimate, isTradable } = params;
          
          // Check each individual criterion
          const lossCheck = opportunity.unrealizedLoss > DEFAULT_ELIGIBILITY_FILTERS.minLossThreshold;
          const liquidityCheck = opportunity.liquidityScore >= DEFAULT_ELIGIBILITY_FILTERS.minLiquidityScore;
          const guardianCheck = opportunity.guardianScore >= DEFAULT_ELIGIBILITY_FILTERS.minGuardianScore;
          const gasCheck = gasEstimate < opportunity.unrealizedLoss;
          const tradabilityCheck = isTradable;
          
          // Eligibility should be true IFF all checks pass
          const expectedEligible = lossCheck && liquidityCheck && guardianCheck && gasCheck && tradabilityCheck;
          
          expect(result.eligible).toBe(expectedEligible);
          
          // If not eligible, there should be at least one reason
          if (!result.eligible) {
            expect(result.reasons.length).toBeGreaterThan(0);
          }
          
          // If eligible, there should be no reasons
          if (result.eligible) {
            expect(result.reasons.length).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Minimum loss threshold is enforced
   * Validates: Requirement 3.1
   */
  it('Property: Loss <= $20 always results in ineligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(20), noNaN: true }), // Loss <= $20
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }), // Good liquidity
        fc.float({ min: Math.fround(3), max: Math.fround(10), noNaN: true }), // Good guardian score
        fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), // Low gas
        (unrealizedLoss, liquidityScore, guardianScore, gasEstimate) => {
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -unrealizedLoss,
              unrealizedLoss,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore,
              guardianScore,
            },
            gasEstimate,
            isTradable: true,
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when loss <= $20
          expect(result.eligible).toBe(false);
          expect(result.reasons.some(r => r.includes('must exceed'))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Liquidity threshold is enforced
   * Validates: Requirement 3.2
   */
  it('Property: Liquidity score below threshold results in ineligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(49.99), noNaN: true }), // Below threshold
        (liquidityScore) => {
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -100,
              unrealizedLoss: 100,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore,
              guardianScore: 5,
            },
            gasEstimate: 10,
            isTradable: true,
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when liquidity is too low
          expect(result.eligible).toBe(false);
          expect(result.reasons.some(r => r.includes('liquidity'))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Guardian score threshold is enforced
   * Validates: Requirement 3.3
   */
  it('Property: Guardian score < 3 results in ineligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(2.99), noNaN: true }), // Below threshold
        (guardianScore) => {
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -100,
              unrealizedLoss: 100,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore: 80,
              guardianScore,
            },
            gasEstimate: 10,
            isTradable: true,
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when Guardian score is too low
          expect(result.eligible).toBe(false);
          expect(result.reasons.some(r => r.includes('Guardian score'))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Gas cost threshold is enforced
   * Validates: Requirement 3.4
   */
  it('Property: Gas cost >= unrealized loss results in ineligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(21), max: Math.fround(1000), noNaN: true }), // Unrealized loss
        (unrealizedLoss) => {
          const gasEstimate = unrealizedLoss * fc.sample(fc.float({ min: Math.fround(1.0), max: Math.fround(2.0), noNaN: true }), 1)[0]; // Gas >= loss
          
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -unrealizedLoss,
              unrealizedLoss,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore: 80,
              guardianScore: 5,
            },
            gasEstimate,
            isTradable: true,
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when gas cost >= unrealized loss
          expect(result.eligible).toBe(false);
          expect(result.reasons.some(r => r.includes('Gas cost'))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tradability is enforced
   * Validates: Requirement 3.5
   */
  it('Property: Non-tradable tokens result in ineligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(21), max: Math.fround(1000), noNaN: true }), // Good loss
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }), // Good liquidity
        fc.float({ min: Math.fround(3), max: Math.fround(10), noNaN: true }), // Good guardian score
        (unrealizedLoss, liquidityScore, guardianScore) => {
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -unrealizedLoss,
              unrealizedLoss,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore,
              guardianScore,
            },
            gasEstimate: unrealizedLoss * 0.1, // Low gas
            isTradable: false, // Not tradable
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when not tradable
          expect(result.eligible).toBe(false);
          expect(result.reasons.some(r => r.includes('tradable'))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All criteria passing results in eligibility
   */
  it('Property: Meeting all criteria results in eligibility', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(21), max: Math.fround(1000), noNaN: true }), // Loss > $20
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }), // Good liquidity
        fc.float({ min: Math.fround(3), max: Math.fround(10), noNaN: true }), // Good guardian score
        (unrealizedLoss, liquidityScore, guardianScore) => {
          const gasEstimate = unrealizedLoss * 0.5; // Gas < loss
          
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -unrealizedLoss,
              unrealizedLoss,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore,
              guardianScore,
            },
            gasEstimate,
            isTradable: true,
          };
          
          const result = checkEligibility(params);
          
          // Should always be eligible when all criteria pass
          expect(result.eligible).toBe(true);
          expect(result.reasons.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Failing any single criterion results in ineligibility
   */
  it('Property: Failing any single criterion makes opportunity ineligible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('loss', 'liquidity', 'guardian', 'gas', 'tradability'),
        (failingCriterion) => {
          // Start with all good values
          let unrealizedLoss = 100;
          let liquidityScore = 80;
          let guardianScore = 5;
          let gasEstimate = 10;
          let isTradable = true;
          
          // Make one criterion fail
          switch (failingCriterion) {
            case 'loss':
              unrealizedLoss = 15; // Below $20
              break;
            case 'liquidity':
              liquidityScore = 30; // Below 50
              break;
            case 'guardian':
              guardianScore = 2; // Below 3
              break;
            case 'gas':
              gasEstimate = 150; // Above loss
              break;
            case 'tradability':
              isTradable = false;
              break;
          }
          
          const params: EligibilityParams = {
            opportunity: {
              lot: { acquiredAt: new Date(), quantity: 1, priceUsd: 100, remaining: 1 },
              unrealizedPnl: -unrealizedLoss,
              unrealizedLoss,
              holdingPeriodDays: 100,
              longTerm: false,
              riskLevel: 'LOW',
              liquidityScore,
              guardianScore,
            },
            gasEstimate,
            isTradable,
          };
          
          const result = checkEligibility(params);
          
          // Should always be ineligible when any criterion fails
          expect(result.eligible).toBe(false);
          expect(result.reasons.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// INDIVIDUAL CHECK TESTS
// ============================================================================

describe('Individual Eligibility Checks', () => {
  it('checkMinimumLoss: passes when loss > threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(20.01), max: Math.fround(10000), noNaN: true }),
        (loss) => {
          const result = checkMinimumLoss(loss, 20);
          expect(result.pass).toBe(true);
          expect(result.reason).toBeUndefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkMinimumLoss: fails when loss <= threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(20), noNaN: true }),
        (loss) => {
          const result = checkMinimumLoss(loss, 20);
          expect(result.pass).toBe(false);
          expect(result.reason).toBeDefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkLiquidity: passes when score >= threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(50), max: Math.fround(100), noNaN: true }),
        (score) => {
          const result = checkLiquidity(score, 50);
          expect(result.pass).toBe(true);
          expect(result.reason).toBeUndefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkLiquidity: fails when score < threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(49.99), noNaN: true }),
        (score) => {
          const result = checkLiquidity(score, 50);
          expect(result.pass).toBe(false);
          expect(result.reason).toBeDefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkGuardianScore: passes when score >= threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(3), max: Math.fround(10), noNaN: true }),
        (score) => {
          const result = checkGuardianScore(score, 3);
          expect(result.pass).toBe(true);
          expect(result.reason).toBeUndefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkGuardianScore: fails when score < threshold', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(2.99), noNaN: true }),
        (score) => {
          const result = checkGuardianScore(score, 3);
          expect(result.pass).toBe(false);
          expect(result.reason).toBeDefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkGasCost: passes when gas < loss', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
        (loss) => {
          const gas = loss * 0.5; // 50% of loss
          const result = checkGasCost(gas, loss, 1.0);
          expect(result.pass).toBe(true);
          expect(result.reason).toBeUndefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkGasCost: fails when gas >= loss', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
        (loss) => {
          const gas = loss * 1.5; // 150% of loss
          const result = checkGasCost(gas, loss, 1.0);
          expect(result.pass).toBe(false);
          expect(result.reason).toBeDefined();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkTradability: passes when tradable', () => {
    const result = checkTradability(true);
    expect(result.pass).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('checkTradability: fails when not tradable', () => {
    const result = checkTradability(false);
    expect(result.pass).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
