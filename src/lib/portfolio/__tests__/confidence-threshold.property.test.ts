/**
 * Property-Based Tests for Confidence Threshold Enforcement
 * 
 * Feature: unified-portfolio, Property 3: Confidence Threshold Enforcement
 * Validates: Requirements 1.8, 1.9
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { 
  PolicyEngine, 
  DEFAULT_POLICY_CONFIG 
} from '../PolicyEngine';
import type { PolicyEngineConfig } from '@/types/portfolio';

// ============================================================================
// Generators
// ============================================================================

const confidenceGenerator = fc.float({ min: 0, max: 1, noNaN: true });

const confidenceThresholdGenerator = fc.float({ min: 0.50, max: 1.0, noNaN: true });

const policyConfigGenerator = fc.record({
  maxGasUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
  blockNewContractsDays: fc.integer({ min: 0, max: 365 }),
  blockInfiniteApprovalsToUnknown: fc.boolean(),
  requireSimulationForValueOverUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
  confidenceThreshold: confidenceThresholdGenerator,
  allowedSlippagePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  maxDailyTransactionCount: fc.integer({ min: 0, max: 1000 })
}) as fc.Arbitrary<PolicyEngineConfig>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 3: Confidence Threshold Enforcement', () => {
  
  test('Confidence values are always within valid range (0..1)', () => {
    fc.assert(
      fc.property(
        confidenceGenerator,
        (confidence) => {
          // Confidence should always be between 0 and 1
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
          expect(Number.isFinite(confidence)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold is enforced with minimum bound of 0.50', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(0.49), noNaN: true }), // Below minimum threshold
        (belowMinThreshold) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: belowMinThreshold };
          const engine = new PolicyEngine(config);
          
          // Engine should enforce minimum threshold of 0.50
          const actualConfig = engine.getConfig();
          expect(actualConfig.confidenceThreshold).toBeGreaterThanOrEqual(0.50);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold check returns consistent degraded state', () => {
    fc.assert(
      fc.property(
        confidenceThresholdGenerator,
        confidenceGenerator,
        (threshold, confidence) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          const result = engine.checkConfidenceThreshold(confidence);
          
          // Result should have required properties
          expect(typeof result.degraded).toBe('boolean');
          expect(typeof result.gateRiskyActions).toBe('boolean');
          expect(Array.isArray(result.degradedReasons)).toBe(true);
          
          // Degraded and gateRiskyActions should be consistent
          expect(result.degraded).toBe(result.gateRiskyActions);
          
          // If confidence is below threshold, should be degraded
          if (confidence < threshold) {
            expect(result.degraded).toBe(true);
            expect(result.gateRiskyActions).toBe(true);
            expect(result.degradedReasons.length).toBeGreaterThan(0);
            
            // Degraded reason should mention the threshold
            const hasThresholdReason = result.degradedReasons.some(reason => 
              reason.includes('threshold') && reason.includes(threshold.toString())
            );
            expect(hasThresholdReason).toBe(true);
          } else {
            expect(result.degraded).toBe(false);
            expect(result.gateRiskyActions).toBe(false);
            expect(result.degradedReasons.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold enforcement is monotonic', () => {
    fc.assert(
      fc.property(
        confidenceThresholdGenerator,
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (threshold, confidence1, confidence2) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          const result1 = engine.checkConfidenceThreshold(confidence1);
          const result2 = engine.checkConfidenceThreshold(confidence2);
          
          // The confidence threshold creates a step function:
          // - confidence >= threshold -> not degraded
          // - confidence < threshold -> degraded
          
          // Test the step function property directly
          const expectedResult1 = confidence1 < threshold;
          const expectedResult2 = confidence2 < threshold;
          
          expect(result1.degraded).toBe(expectedResult1);
          expect(result2.degraded).toBe(expectedResult2);
          
          // Test monotonicity: if confidence1 <= confidence2, then 
          // result1.degraded should be >= result2.degraded (degraded is "worse")
          if (confidence1 <= confidence2) {
            // If confidence1 is not degraded, then confidence2 should also not be degraded
            if (!result1.degraded) {
              expect(result2.degraded).toBe(false);
            }
            // If confidence2 is degraded, then confidence1 should also be degraded
            if (result2.degraded) {
              expect(result1.degraded).toBe(true);
            }
          }
          
          // Test the step function boundaries more explicitly
          if (confidence1 < threshold && confidence2 >= threshold) {
            expect(result1.degraded).toBe(true);
            expect(result2.degraded).toBe(false);
          }
          
          if (confidence1 >= threshold && confidence2 < threshold) {
            expect(result1.degraded).toBe(false);
            expect(result2.degraded).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold configuration updates correctly', () => {
    fc.assert(
      fc.property(
        policyConfigGenerator,
        confidenceThresholdGenerator,
        (initialConfig, newThreshold) => {
          const engine = new PolicyEngine(initialConfig);
          
          // Update configuration with new threshold
          engine.updateConfig({ confidenceThreshold: newThreshold });
          
          const updatedConfig = engine.getConfig();
          
          // New threshold should be applied (or enforced to minimum 0.50)
          const expectedThreshold = Math.max(newThreshold, 0.50);
          expect(updatedConfig.confidenceThreshold).toBe(expectedThreshold);
          
          // Other config values should remain unchanged
          expect(updatedConfig.maxGasUsd).toBe(initialConfig.maxGasUsd);
          expect(updatedConfig.blockNewContractsDays).toBe(initialConfig.blockNewContractsDays);
          expect(updatedConfig.blockInfiniteApprovalsToUnknown).toBe(initialConfig.blockInfiniteApprovalsToUnknown);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold validation works correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1, max: 2, noNaN: true }), // Include invalid values
        (threshold) => {
          const validation = PolicyEngine.validateConfig({ confidenceThreshold: threshold });
          
          // Validation result must have valid boolean and errors array
          expect(typeof validation.valid).toBe('boolean');
          expect(Array.isArray(validation.errors)).toBe(true);
          
          // Check validation logic
          if (threshold < 0.50 || threshold > 1.0) {
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors.some(error => 
              error.includes('confidenceThreshold') && 
              error.includes('0.50') && 
              error.includes('1.0')
            )).toBe(true);
          } else {
            // For this specific field, if it's valid, there should be no errors about it
            const hasConfidenceError = validation.errors.some(error => 
              error.includes('confidenceThreshold')
            );
            expect(hasConfidenceError).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Degraded mode activates when confidence is below threshold', () => {
    fc.assert(
      fc.property(
        confidenceThresholdGenerator,
        (threshold) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          // Test confidence just below threshold
          const belowThreshold = Math.max(0, threshold - 0.01);
          const resultBelow = engine.checkConfidenceThreshold(belowThreshold);
          
          // Test confidence just above threshold
          const aboveThreshold = Math.min(1, threshold + 0.01);
          const resultAbove = engine.checkConfidenceThreshold(aboveThreshold);
          
          // Below threshold should be degraded
          if (belowThreshold < threshold) {
            expect(resultBelow.degraded).toBe(true);
            expect(resultBelow.gateRiskyActions).toBe(true);
          }
          
          // Above threshold should not be degraded
          if (aboveThreshold >= threshold) {
            expect(resultAbove.degraded).toBe(false);
            expect(resultAbove.gateRiskyActions).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold boundary conditions are handled correctly', () => {
    fc.assert(
      fc.property(
        confidenceThresholdGenerator,
        (threshold) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          // Test exact threshold value
          const resultExact = engine.checkConfidenceThreshold(threshold);
          expect(resultExact.degraded).toBe(false);
          expect(resultExact.gateRiskyActions).toBe(false);
          expect(resultExact.degradedReasons.length).toBe(0);
          
          // Test minimum possible confidence (0)
          const resultMin = engine.checkConfidenceThreshold(0);
          expect(resultMin.degraded).toBe(true);
          expect(resultMin.gateRiskyActions).toBe(true);
          expect(resultMin.degradedReasons.length).toBeGreaterThan(0);
          
          // Test maximum possible confidence (1)
          const resultMax = engine.checkConfidenceThreshold(1);
          expect(resultMax.degraded).toBe(false);
          expect(resultMax.gateRiskyActions).toBe(false);
          expect(resultMax.degradedReasons.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold enforcement is deterministic', () => {
    fc.assert(
      fc.property(
        confidenceThresholdGenerator,
        confidenceGenerator,
        (threshold, confidence) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          // Call the same function multiple times with same inputs
          const result1 = engine.checkConfidenceThreshold(confidence);
          const result2 = engine.checkConfidenceThreshold(confidence);
          const result3 = engine.checkConfidenceThreshold(confidence);
          
          // Results should be identical
          expect(result1.degraded).toBe(result2.degraded);
          expect(result1.degraded).toBe(result3.degraded);
          expect(result1.gateRiskyActions).toBe(result2.gateRiskyActions);
          expect(result1.gateRiskyActions).toBe(result3.gateRiskyActions);
          expect(result1.degradedReasons).toEqual(result2.degradedReasons);
          expect(result1.degradedReasons).toEqual(result3.degradedReasons);
        }
      ),
      { numRuns: 100 }
    );
  });
});