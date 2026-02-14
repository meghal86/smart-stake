/**
 * Property-Based Tests for Action Scoring Service
 * 
 * Feature: unified-portfolio, Property 5: Action Score Calculation
 * Validates: Requirements 4.2, 4.3, 4.4
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  calculateActionScore,
  calculateTimeDecay,
  calculateFriction,
  sortActionsByScore,
  validateActionTypes,
  SEVERITY_WEIGHTS,
  type ActionScoringParams,
} from '../ActionScoringService';
import { RecommendedAction } from '@/types/portfolio';

describe('Feature: unified-portfolio, Property 5: Action Score Calculation', () => {
  // Generators for valid input ranges
  const severityGen = fc.constantFrom('critical', 'high', 'medium', 'low');
  const exposureGen = fc.float({ min: 0, max: 1000000, noNaN: true });
  const confidenceGen = fc.float({ min: 0.5, max: 1.0, noNaN: true });
  const ageGen = fc.float({ min: 0, max: 168, noNaN: true }); // 0-168 hours (1 week)
  const gasGen = fc.float({ min: 0, max: 1000, noNaN: true });
  const timeGen = fc.float({ min: 1, max: 3600, noNaN: true }); // 1 second to 1 hour

  const actionScoringParamsGen = fc.record({
    severity: severityGen,
    exposureUsd: exposureGen,
    confidence: confidenceGen,
    ageInHours: ageGen,
    gasEstimateUsd: gasGen,
    timeEstimateSec: timeGen,
  });

  test('ActionScore formula correctness', () => {
    fc.assert(
      fc.property(actionScoringParamsGen, (params) => {
        const score = calculateActionScore(params);
        
        // Calculate expected components
        const severityWeight = SEVERITY_WEIGHTS[params.severity];
        const timeDecay = calculateTimeDecay(params.ageInHours);
        const friction = calculateFriction(params.gasEstimateUsd, params.timeEstimateSec);
        const expectedScore = Math.max(0, (severityWeight * params.exposureUsd * params.confidence * timeDecay) - friction);
        
        // Property: ActionScore equals the exact formula
        expect(score).toBeCloseTo(expectedScore, 10);
        
        // Property: ActionScore is never negative
        expect(score).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 1000 } // Critical financial property
    );
  });

  test('Severity weights are correctly applied', () => {
    fc.assert(
      fc.property(
        fc.record({
          exposureUsd: exposureGen,
          confidence: confidenceGen,
          ageInHours: ageGen,
          gasEstimateUsd: gasGen,
          timeEstimateSec: timeGen,
        }),
        (baseParams) => {
          const criticalScore = calculateActionScore({ ...baseParams, severity: 'critical' });
          const highScore = calculateActionScore({ ...baseParams, severity: 'high' });
          const mediumScore = calculateActionScore({ ...baseParams, severity: 'medium' });
          const lowScore = calculateActionScore({ ...baseParams, severity: 'low' });
          
          // Property: Critical actions score highest (when other factors equal)
          // Only assert if scores are positive (friction might make some negative -> 0)
          if (criticalScore > 0 && highScore > 0 && mediumScore > 0 && lowScore > 0) {
            expect(criticalScore).toBeGreaterThanOrEqual(highScore);
            expect(highScore).toBeGreaterThanOrEqual(mediumScore);
            expect(mediumScore).toBeGreaterThanOrEqual(lowScore);
          }
          
          // Property: Severity weights match specification (R4.3)
          // critical=1.0, high=0.75, medium=0.5, low=0.25
          expect(SEVERITY_WEIGHTS.critical).toBe(1.0);
          expect(SEVERITY_WEIGHTS.high).toBe(0.75);
          expect(SEVERITY_WEIGHTS.medium).toBe(0.5);
          expect(SEVERITY_WEIGHTS.low).toBe(0.25);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Time decay monotonicity', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 0, max: 100, noNaN: true })
        ).filter(([age1, age2]) => age1 !== age2),
        ([age1, age2]) => {
          const decay1 = calculateTimeDecay(age1);
          const decay2 = calculateTimeDecay(age2);
          
          // Property: Newer actions (lower age) have higher time decay
          if (age1 < age2) {
            expect(decay1).toBeGreaterThanOrEqual(decay2);
          } else {
            expect(decay2).toBeGreaterThanOrEqual(decay1);
          }
          
          // Property: Time decay is always between 0 and 1
          expect(decay1).toBeGreaterThanOrEqual(0);
          expect(decay1).toBeLessThanOrEqual(1);
          expect(decay2).toBeGreaterThanOrEqual(0);
          expect(decay2).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Friction calculation correctness', () => {
    fc.assert(
      fc.property(gasGen, timeGen, (gas, time) => {
        const friction = calculateFriction(gas, time);
        const timeMinutes = time / 60;
        const timeCostFactor = 0.5;
        const expectedFriction = gas + (timeMinutes * timeCostFactor);
        
        // Property: Friction equals gas cost plus time cost
        expect(friction).toBeCloseTo(expectedFriction, 10);
        
        // Property: Friction is never negative
        expect(friction).toBeGreaterThanOrEqual(0);
        
        // Property: Higher gas or time increases friction
        const higherGasFriction = calculateFriction(gas + 10, time);
        const higherTimeFriction = calculateFriction(gas, time + 60);
        
        expect(higherGasFriction).toBeGreaterThan(friction);
        expect(higherTimeFriction).toBeGreaterThan(friction);
      }),
      { numRuns: 100 }
    );
  });

  test('Tie-breaking rules in sorting', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            severity: severityGen,
            why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
            impactPreview: fc.record({
              riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
              preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
              expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
              gasEstimateUsd: gasGen,
              timeEstimateSec: timeGen,
              confidence: confidenceGen,
            }),
            actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
            cta: fc.record({
              label: fc.string({ minLength: 1 }),
              intent: fc.string({ minLength: 1 }),
              params: fc.object(),
            }),
            walletScope: fc.record({
              mode: fc.constant('active_wallet' as const),
              address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
            }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (actions) => {
          const sorted = sortActionsByScore(actions);
          
          // Property: Array length is preserved
          expect(sorted).toHaveLength(actions.length);
          
          // Property: Sorting is stable (same elements)
          const sortedIds = sorted.map(a => a.id).sort();
          const originalIds = actions.map(a => a.id).sort();
          expect(sortedIds).toEqual(originalIds);
          
          // Property: Actions are sorted by score descending
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].actionScore).toBeGreaterThanOrEqual(sorted[i + 1].actionScore);
          }
          
          // Property: Tie-breaking works correctly
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            if (current.actionScore === next.actionScore) {
              // Tie-break 1: If scores are equal, higher confidence should come first
              if (current.impactPreview.confidence !== next.impactPreview.confidence) {
                expect(current.impactPreview.confidence).toBeGreaterThanOrEqual(next.impactPreview.confidence);
              } else {
                // Tie-break 2: If confidence is also equal, lower friction should come first
                const frictionCurrent = calculateFriction(
                  current.impactPreview.gasEstimateUsd,
                  current.impactPreview.timeEstimateSec
                );
                const frictionNext = calculateFriction(
                  next.impactPreview.gasEstimateUsd,
                  next.impactPreview.timeEstimateSec
                );
                expect(frictionCurrent).toBeLessThanOrEqual(frictionNext);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Action type validation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            severity: severityGen,
            why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
            impactPreview: fc.record({
              riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
              preventedLossP50Usd: fc.float({ min: 0, max: 10000, noNaN: true }),
              expectedGainUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
              gasEstimateUsd: gasGen,
              timeEstimateSec: timeGen,
              confidence: confidenceGen,
            }),
            actionScore: fc.float({ min: 0, max: 1000, noNaN: true }),
            cta: fc.record({
              label: fc.string({ minLength: 1 }),
              intent: fc.constantFrom(
                'revoke_approval', 'approval_hygiene',
                'de_risk', 'reduce_exposure',
                'claim_rewards', 'harvest_rewards',
                'optimize_routing', 'route_opportunity',
                'other_intent'
              ),
              params: fc.object(),
            }),
            walletScope: fc.record({
              mode: fc.constant('active_wallet' as const),
              address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
            }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (actions) => {
          const validation = validateActionTypes(actions);
          
          // Property: Validation correctly identifies action types
          const intents = new Set(actions.map(a => a.cta.intent));
          
          const expectedApprovalHygiene = intents.has('revoke_approval') || intents.has('approval_hygiene');
          const expectedDeRisk = intents.has('de_risk') || intents.has('reduce_exposure');
          const expectedRewards = intents.has('claim_rewards') || intents.has('harvest_rewards');
          const expectedRouting = intents.has('optimize_routing') || intents.has('route_opportunity');
          
          expect(validation.hasApprovalHygiene).toBe(expectedApprovalHygiene);
          expect(validation.hasDeRisk).toBe(expectedDeRisk);
          expect(validation.hasRewards).toBe(expectedRewards);
          expect(validation.hasRouting).toBe(expectedRouting);
          
          // Property: allMinimumTypesPresent is correct
          const expectedAllPresent = expectedApprovalHygiene && expectedDeRisk && expectedRewards && expectedRouting;
          expect(validation.allMinimumTypesPresent).toBe(expectedAllPresent);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence impact on scoring', () => {
    fc.assert(
      fc.property(
        fc.record({
          severity: severityGen,
          exposureUsd: exposureGen,
          ageInHours: ageGen,
          gasEstimateUsd: gasGen,
          timeEstimateSec: timeGen,
        }),
        fc.tuple(
          fc.float({ min: Math.fround(0.5), max: Math.fround(0.99), noNaN: true }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(0.99), noNaN: true })
        ).filter(([c1, c2]) => Math.abs(c1 - c2) > 0.01),
        (baseParams, [confidence1, confidence2]) => {
          const score1 = calculateActionScore({ ...baseParams, confidence: confidence1 });
          const score2 = calculateActionScore({ ...baseParams, confidence: confidence2 });
          
          // Property: Higher confidence leads to higher score (when positive)
          if (score1 > 0 && score2 > 0) {
            if (confidence1 > confidence2) {
              expect(score1).toBeGreaterThan(score2);
            } else {
              expect(score2).toBeGreaterThan(score1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Exposure USD impact on scoring', () => {
    fc.assert(
      fc.property(
        fc.record({
          severity: severityGen,
          confidence: confidenceGen,
          ageInHours: ageGen,
          gasEstimateUsd: gasGen,
          timeEstimateSec: timeGen,
        }),
        fc.tuple(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.float({ min: 100, max: 10000, noNaN: true })
        ).filter(([e1, e2]) => Math.abs(e1 - e2) > 100),
        (baseParams, [exposure1, exposure2]) => {
          const score1 = calculateActionScore({ ...baseParams, exposureUsd: exposure1 });
          const score2 = calculateActionScore({ ...baseParams, exposureUsd: exposure2 });
          
          // Property: Higher exposure leads to higher score (when positive)
          if (score1 > 0 && score2 > 0) {
            if (exposure1 > exposure2) {
              expect(score1).toBeGreaterThan(score2);
            } else {
              expect(score2).toBeGreaterThan(score1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});