/**
 * Property-Based Tests for Risk Classification
 * Feature: harvestpro, Property 12: Risk Level Classification
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  determineOverallRisk,
  classifyLiquidityRisk,
  assessRisk,
} from '../risk-classification';
import { classifyRiskFromScore } from '../guardian-adapter';
import type { OpportunityCandidate } from '../opportunity-detection';

describe('Risk Classification - Property Tests', () => {
  /**
   * Property 12: Risk Level Classification
   * Feature: harvestpro, Property 12: Risk Level Classification
   * Validates: Requirements 15.1, 15.2, 15.3, 15.4
   * 
   * For any lot, risk level SHALL be:
   * - HIGH if guardian_score <= 3 OR liquidity_score < 50
   * - MEDIUM if guardian_score is 4-6 (and liquidity >= 50)
   * - LOW if guardian_score >= 7 (and liquidity >= 50)
   */
  it('Property 12: Risk Level Classification - Guardian score <= 3 means HIGH RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 3, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.1: Guardian score <= 3 means HIGH RISK
          // (regardless of liquidity if liquidity >= 50)
          if (liquidityScore >= 50) {
            expect(riskLevel).toBe('HIGH');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Risk Level Classification - liquidity < 50 means HIGH RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(49.99), noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.4: Liquidity < 50 overrides Guardian score
          expect(riskLevel).toBe('HIGH');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Risk Level Classification - Guardian score 4-6 means MEDIUM RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 4, max: 6, noNaN: true }),
        fc.float({ min: 50, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.2: Guardian score 4-6 means MEDIUM RISK
          // (when liquidity >= 50)
          expect(riskLevel).toBe('MEDIUM');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Risk Level Classification - Guardian score >= 7 and liquidity >= 50 means LOW RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 7, max: 10, noNaN: true }),
        fc.float({ min: 50, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.3: Guardian score >= 7 and liquidity >= 50 means LOW RISK
          expect(riskLevel).toBe('LOW');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: classifyRiskFromScore follows Guardian score rules
   */
  it('Property: classifyRiskFromScore correctly classifies all Guardian scores', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        (guardianScore) => {
          const riskLevel = classifyRiskFromScore(guardianScore);
          
          if (guardianScore <= 3) {
            expect(riskLevel).toBe('HIGH');
          } else if (guardianScore >= 4 && guardianScore <= 6) {
            expect(riskLevel).toBe('MEDIUM');
          } else {
            expect(riskLevel).toBe('LOW');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: classifyLiquidityRisk follows liquidity score rules
   */
  it('Property: classifyLiquidityRisk correctly classifies all liquidity scores', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (liquidityScore) => {
          const riskLevel = classifyLiquidityRisk(liquidityScore);
          
          if (liquidityScore >= 80) {
            expect(riskLevel).toBe('LOW');
          } else if (liquidityScore >= 50) {
            expect(riskLevel).toBe('MEDIUM');
          } else {
            expect(riskLevel).toBe('HIGH');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Overall risk is never safer than liquidity risk
   * (liquidity risk acts as a floor)
   */
  it('Property: Liquidity risk overrides Guardian risk when worse', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const overallRisk = determineOverallRisk(guardianScore, liquidityScore);
          const liquidityRisk = classifyLiquidityRisk(liquidityScore);
          
          // If liquidity is HIGH risk, overall must be HIGH
          if (liquidityRisk === 'HIGH') {
            expect(overallRisk).toBe('HIGH');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: assessRisk produces consistent overall risk
   */
  it('Property: assessRisk overall risk matches determineOverallRisk', () => {
    fc.assert(
      fc.property(
        fc.record({
          token: fc.constantFrom('ETH', 'BTC', 'USDC', 'LINK', 'UNI'),
          unrealizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(-20.01), noNaN: true }),
          remainingQty: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          holdingPeriodDays: fc.integer({ min: 0, max: 3650 }),
          guardianScore: fc.float({ min: 0, max: 10, noNaN: true }),
          liquidityScore: fc.float({ min: 0, max: 100, noNaN: true }),
          riskLevel: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
        }),
        (candidate) => {
          const assessment = assessRisk(candidate as OpportunityCandidate);
          const expectedRisk = determineOverallRisk(
            candidate.guardianScore,
            candidate.liquidityScore
          );
          
          expect(assessment.overallRisk).toBe(expectedRisk);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Risk score is always between 0 and 100
   */
  it('Property: Risk score is bounded between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          token: fc.constantFrom('ETH', 'BTC', 'USDC', 'LINK', 'UNI'),
          unrealizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(-20.01), noNaN: true }),
          remainingQty: fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          holdingPeriodDays: fc.integer({ min: 0, max: 3650 }),
          guardianScore: fc.float({ min: 0, max: 10, noNaN: true }),
          liquidityScore: fc.float({ min: 0, max: 100, noNaN: true }),
          riskLevel: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
        }),
        (candidate) => {
          const assessment = assessRisk(candidate as OpportunityCandidate);
          
          expect(assessment.score).toBeGreaterThanOrEqual(0);
          expect(assessment.score).toBeLessThanOrEqual(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Higher Guardian score and liquidity produce higher risk score
   */
  it('Property: Risk score increases with Guardian score and liquidity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 9, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (guardianScore, liquidityScore) => {
          // Create two candidates with different scores
          const candidate1: OpportunityCandidate = {
            token: 'ETH',
            unrealizedPnl: -100,
            remainingQty: 1,
            holdingPeriodDays: 100,
            guardianScore,
            liquidityScore,
            riskLevel: 'MEDIUM',
          };
          
          const candidate2: OpportunityCandidate = {
            token: 'ETH',
            unrealizedPnl: -100,
            remainingQty: 1,
            holdingPeriodDays: 100,
            guardianScore: guardianScore + 1,
            liquidityScore: liquidityScore + 1,
            riskLevel: 'MEDIUM',
          };
          
          const assessment1 = assessRisk(candidate1);
          const assessment2 = assessRisk(candidate2);
          
          // Higher Guardian score and liquidity should produce higher risk score
          expect(assessment2.score).toBeGreaterThanOrEqual(assessment1.score);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
