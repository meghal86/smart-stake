/**
 * Property-Based Tests for Risk Classification (Deno/Edge Functions)
 * Feature: harvestpro, Property 12: Risk Level Classification
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4
 * 
 * This is the server-side test for Supabase Edge Functions.
 * Migrated from src/lib/harvestpro/__tests__/risk-classification.test.ts
 */

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import fc from 'npm:fast-check@3.15.0';
import {
  determineOverallRisk,
  classifyLiquidityRisk,
  classifyRiskFromScore,
  assessRisk,
} from '../risk-classification.ts';
import type { OpportunityCandidate } from '../opportunity-detection.ts';
import type { Lot } from '../fifo.ts';
import type { RiskLevel } from '../types.ts';

Deno.test('Risk Classification - Property Tests', async (t) => {
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

  await t.step('Property 12: Risk Level Classification - Guardian score <= 3 means HIGH RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 3, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.1: Guardian score <= 3 means HIGH RISK
          // (regardless of liquidity if liquidity >= 50)
          if (liquidityScore >= 50) {
            assertEquals(riskLevel, 'HIGH');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  await t.step('Property 12: Risk Level Classification - liquidity < 50 means HIGH RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(49.99), noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.4: Liquidity < 50 overrides Guardian score
          assertEquals(riskLevel, 'HIGH');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  await t.step('Property 12: Risk Level Classification - Guardian score 4-6 means MEDIUM RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 4, max: 6, noNaN: true }),
        fc.float({ min: 50, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.2: Guardian score 4-6 means MEDIUM RISK
          // (when liquidity >= 50)
          assertEquals(riskLevel, 'MEDIUM');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  await t.step('Property 12: Risk Level Classification - Guardian score >= 7 and liquidity >= 50 means LOW RISK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 7, max: 10, noNaN: true }),
        fc.float({ min: 50, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const riskLevel = determineOverallRisk(guardianScore, liquidityScore);
          
          // Requirement 15.3: Guardian score >= 7 and liquidity >= 50 means LOW RISK
          assertEquals(riskLevel, 'LOW');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: classifyRiskFromScore follows Guardian score rules
   */
  await t.step('Property: classifyRiskFromScore correctly classifies all Guardian scores', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        (guardianScore) => {
          const riskLevel = classifyRiskFromScore(guardianScore);
          
          if (guardianScore <= 3) {
            assertEquals(riskLevel, 'HIGH');
          } else if (guardianScore >= 4 && guardianScore <= 6) {
            assertEquals(riskLevel, 'MEDIUM');
          } else {
            assertEquals(riskLevel, 'LOW');
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
  await t.step('Property: classifyLiquidityRisk correctly classifies all liquidity scores', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (liquidityScore) => {
          const riskLevel = classifyLiquidityRisk(liquidityScore);
          
          if (liquidityScore >= 80) {
            assertEquals(riskLevel, 'LOW');
          } else if (liquidityScore >= 50) {
            assertEquals(riskLevel, 'MEDIUM');
          } else {
            assertEquals(riskLevel, 'HIGH');
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
  await t.step('Property: Liquidity risk overrides Guardian risk when worse', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (guardianScore, liquidityScore) => {
          const overallRisk = determineOverallRisk(guardianScore, liquidityScore);
          const liquidityRisk = classifyLiquidityRisk(liquidityScore);
          
          // If liquidity is HIGH risk, overall must be HIGH
          if (liquidityRisk === 'HIGH') {
            assertEquals(overallRisk, 'HIGH');
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
  await t.step('Property: assessRisk overall risk matches determineOverallRisk', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(-20.01), noNaN: true }),
          unrealizedLoss: fc.float({ min: Math.fround(20.01), max: Math.fround(10000), noNaN: true }),
          holdingPeriodDays: fc.integer({ min: 0, max: 3650 }),
          guardianScore: fc.float({ min: 0, max: 10, noNaN: true }),
          liquidityScore: fc.float({ min: 0, max: 100, noNaN: true }),
          longTerm: fc.boolean(),
        }),
        (candidateData) => {
          // Create a mock lot
          const mockLot: Lot = {
            acquiredAt: new Date(Date.now() - candidateData.holdingPeriodDays * 24 * 60 * 60 * 1000),
            quantity: 1,
            priceUsd: 100,
            remaining: 1,
          };
          
          const candidate: OpportunityCandidate = {
            lot: mockLot,
            unrealizedPnl: candidateData.unrealizedPnl,
            unrealizedLoss: candidateData.unrealizedLoss,
            holdingPeriodDays: candidateData.holdingPeriodDays,
            longTerm: candidateData.longTerm,
            guardianScore: candidateData.guardianScore,
            liquidityScore: candidateData.liquidityScore,
            riskLevel: 'MEDIUM' as RiskLevel,
          };
          
          const assessment = assessRisk(candidate);
          const expectedRisk = determineOverallRisk(
            candidateData.guardianScore,
            candidateData.liquidityScore
          );
          
          assertEquals(assessment.overallRisk, expectedRisk);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Risk score is always between 0 and 100
   */
  await t.step('Property: Risk score is bounded between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          unrealizedPnl: fc.float({ min: Math.fround(-10000), max: Math.fround(-20.01), noNaN: true }),
          unrealizedLoss: fc.float({ min: Math.fround(20.01), max: Math.fround(10000), noNaN: true }),
          holdingPeriodDays: fc.integer({ min: 0, max: 3650 }),
          guardianScore: fc.float({ min: 0, max: 10, noNaN: true }),
          liquidityScore: fc.float({ min: 0, max: 100, noNaN: true }),
          longTerm: fc.boolean(),
        }),
        (candidateData) => {
          // Create a mock lot
          const mockLot: Lot = {
            acquiredAt: new Date(Date.now() - candidateData.holdingPeriodDays * 24 * 60 * 60 * 1000),
            quantity: 1,
            priceUsd: 100,
            remaining: 1,
          };
          
          const candidate: OpportunityCandidate = {
            lot: mockLot,
            unrealizedPnl: candidateData.unrealizedPnl,
            unrealizedLoss: candidateData.unrealizedLoss,
            holdingPeriodDays: candidateData.holdingPeriodDays,
            longTerm: candidateData.longTerm,
            guardianScore: candidateData.guardianScore,
            liquidityScore: candidateData.liquidityScore,
            riskLevel: 'MEDIUM' as RiskLevel,
          };
          
          const assessment = assessRisk(candidate);
          
          assertEquals(assessment.score >= 0, true);
          assertEquals(assessment.score <= 100, true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Higher Guardian score and liquidity produce higher risk score
   */
  await t.step('Property: Risk score increases with Guardian score and liquidity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 9, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (guardianScore, liquidityScore) => {
          // Create two candidates with different scores
          const mockLot: Lot = {
            acquiredAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
            quantity: 1,
            priceUsd: 100,
            remaining: 1,
          };
          
          const candidate1: OpportunityCandidate = {
            lot: mockLot,
            unrealizedPnl: -100,
            unrealizedLoss: 100,
            holdingPeriodDays: 100,
            longTerm: false,
            guardianScore,
            liquidityScore,
            riskLevel: 'MEDIUM' as RiskLevel,
          };
          
          const candidate2: OpportunityCandidate = {
            lot: mockLot,
            unrealizedPnl: -100,
            unrealizedLoss: 100,
            holdingPeriodDays: 100,
            longTerm: false,
            guardianScore: guardianScore + 1,
            liquidityScore: liquidityScore + 1,
            riskLevel: 'MEDIUM' as RiskLevel,
          };
          
          const assessment1 = assessRisk(candidate1);
          const assessment2 = assessRisk(candidate2);
          
          // Higher Guardian score and liquidity should produce higher risk score
          assertEquals(assessment2.score >= assessment1.score, true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
