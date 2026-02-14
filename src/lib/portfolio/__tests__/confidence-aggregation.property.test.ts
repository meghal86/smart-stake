/**
 * Property-Based Tests for Confidence Aggregation Rule
 * 
 * Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
 * Validates: Requirements R1.10
 * 
 * Tests that confidence aggregation follows the rule:
 * - For safety-critical aggregates (approvals, actions, plans): confidence = min(sourceConfidences)
 * - Weighted averages allowed ONLY for non-execution UI metrics
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  aggregateConfidence,
  sourceConfidenceFromResult,
  isSafetyCriticalSource,
  type SourceConfidence
} from '../confidenceAggregation';

describe('Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)', () => {
  
  test('safety-critical aggregates use minimum confidence', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        // Generate array of source confidences with at least one safety-critical
        fc.array(
          fc.record({
            source: fc.constantFrom('Portfolio', 'Guardian', 'Hunter', 'Harvest'),
            confidence: fc.float({ min: 0.0, max: 1.0, noNaN: true }),
            isSafetyCritical: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ).filter(sources => sources.some(s => s.isSafetyCritical)),
        
        (sources: SourceConfidence[]) => {
          const result = aggregateConfidence(sources);
          
          // Property: When any source is safety-critical, result should use min method
          expect(result.method).toBe('min');
          
          // Property: Confidence should equal minimum of all source confidences (bounded by threshold)
          const expectedMin = Math.min(...sources.map(s => s.confidence));
          const actualMin = Math.max(0.50, expectedMin); // Bounded by minimum threshold
          expect(result.confidence).toBe(actualMin);
          
          // Property: Result confidence should be less than or equal to max source confidence
          // UNLESS it's bounded by the minimum threshold
          const maxSourceConfidence = Math.max(...sources.map(s => s.confidence));
          if (expectedMin >= 0.50) {
            // When not bounded by threshold, result should not exceed max source
            expect(result.confidence).toBeLessThanOrEqual(maxSourceConfidence + 0.001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('non-safety-critical aggregates can use weighted average', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        // Generate array of non-safety-critical sources only
        fc.array(
          fc.record({
            source: fc.constantFrom('Hunter', 'Harvest', 'Analytics', 'Metrics'),
            confidence: fc.float({ min: 0.0, max: 1.0, noNaN: true }),
            isSafetyCritical: fc.constant(false)
          }),
          { minLength: 1, maxLength: 10 }
        ),
        
        (sources: SourceConfidence[]) => {
          const result = aggregateConfidence(sources);
          
          // Property: When no source is safety-critical, weighted average is allowed
          expect(result.method).toBe('weighted_avg');
          
          // Property: Confidence should be average of source confidences
          const expectedAvg = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
          const actualAvg = Math.max(0.50, expectedAvg); // Bounded by minimum threshold
          expect(result.confidence).toBeCloseTo(actualAvg, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('confidence is always bounded by minimum threshold', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10, R1.8
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            source: fc.constantFrom('Portfolio', 'Guardian', 'Hunter', 'Harvest'),
            confidence: fc.float({ min: 0.0, max: 1.0, noNaN: true }),
            isSafetyCritical: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.float({ min: 0.0, max: 1.0, noNaN: true }), // Custom minimum threshold
        
        (sources: SourceConfidence[], minThreshold: number) => {
          const result = aggregateConfidence(sources, minThreshold);
          
          // Property: Confidence should never be below minimum threshold
          expect(result.confidence).toBeGreaterThanOrEqual(minThreshold);
          
          // Property: Confidence should never exceed 1.0
          expect(result.confidence).toBeLessThanOrEqual(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('single safety-critical source failure results in minimum confidence', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Number of successful sources
        
        (successfulCount: number) => {
          // Create sources with one safety-critical failure (confidence = 0.0)
          const sources: SourceConfidence[] = [
            { source: 'Guardian', confidence: 0.0, isSafetyCritical: true },
            ...Array.from({ length: successfulCount }, (_, i) => ({
              source: `Source${i}`,
              confidence: 1.0,
              isSafetyCritical: false
            }))
          ];
          
          const result = aggregateConfidence(sources);
          
          // Property: Single safety-critical failure should result in minimum confidence
          expect(result.confidence).toBe(0.50); // Minimum threshold
          expect(result.method).toBe('min');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all sources successful results in maximum confidence', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // Number of sources
        
        (sourceCount: number) => {
          // Create sources with all successful (confidence = 1.0)
          const sources: SourceConfidence[] = Array.from({ length: sourceCount }, (_, i) => ({
            source: `Source${i}`,
            confidence: 1.0,
            isSafetyCritical: i < 2 // First two are safety-critical
          }));
          
          const result = aggregateConfidence(sources);
          
          // Property: All sources successful should result in maximum confidence
          expect(result.confidence).toBe(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sourceConfidenceFromResult correctly maps Promise results', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        fc.constantFrom('Portfolio', 'Guardian', 'Hunter', 'Harvest'),
        fc.boolean(), // Success or failure
        fc.boolean(), // Is safety critical
        
        (source: string, isSuccess: boolean, isSafetyCritical: boolean) => {
          const result: PromiseSettledResult<any> = isSuccess
            ? { status: 'fulfilled', value: {} }
            : { status: 'rejected', reason: new Error('Test error') };
          
          const sourceConf = sourceConfidenceFromResult(source, result, isSafetyCritical);
          
          // Property: Fulfilled promises should have confidence 1.0
          if (isSuccess) {
            expect(sourceConf.confidence).toBe(1.0);
          } else {
            // Property: Rejected promises should have confidence 0.0
            expect(sourceConf.confidence).toBe(0.0);
          }
          
          // Property: Source name and safety flag should be preserved
          expect(sourceConf.source).toBe(source);
          expect(sourceConf.isSafetyCritical).toBe(isSafetyCritical);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('isSafetyCriticalSource correctly identifies critical sources', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    // Property: Guardian and Portfolio are safety-critical
    expect(isSafetyCriticalSource('Guardian')).toBe(true);
    expect(isSafetyCriticalSource('Portfolio')).toBe(true);
    
    // Property: Hunter and Harvest are not safety-critical
    expect(isSafetyCriticalSource('Hunter')).toBe(false);
    expect(isSafetyCriticalSource('Harvest')).toBe(false);
    
    // Property: Unknown sources are not safety-critical
    expect(isSafetyCriticalSource('Unknown')).toBe(false);
  });

  test('confidence aggregation is deterministic', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            source: fc.constantFrom('Portfolio', 'Guardian', 'Hunter', 'Harvest'),
            confidence: fc.float({ min: 0.0, max: 1.0, noNaN: true }),
            isSafetyCritical: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        
        (sources: SourceConfidence[]) => {
          // Run aggregation twice with same inputs
          const result1 = aggregateConfidence(sources);
          const result2 = aggregateConfidence(sources);
          
          // Property: Same inputs should produce same outputs
          expect(result1.confidence).toBe(result2.confidence);
          expect(result1.method).toBe(result2.method);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty sources array returns minimum confidence', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10
    
    const result = aggregateConfidence([]);
    
    // Property: Empty sources should return minimum confidence
    expect(result.confidence).toBe(0.50);
    expect(result.method).toBe('min');
    expect(result.sources).toEqual([]);
  });

  test('confidence aggregation respects custom minimum threshold', () => {
    // Feature: unified-portfolio, Property: Confidence Aggregation Rule (R1.10)
    // Validates: Requirements R1.10, R1.8
    
    fc.assert(
      fc.property(
        fc.float({ min: 0.0, max: 1.0, noNaN: true }), // Custom minimum threshold
        fc.array(
          fc.record({
            source: fc.constantFrom('Portfolio', 'Guardian', 'Hunter', 'Harvest'),
            confidence: fc.float({ min: 0.0, max: 1.0, noNaN: true }),
            isSafetyCritical: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        
        (minThreshold: number, sources: SourceConfidence[]) => {
          const result = aggregateConfidence(sources, minThreshold);
          
          // Property: Result should respect custom minimum threshold
          expect(result.confidence).toBeGreaterThanOrEqual(minThreshold);
        }
      ),
      { numRuns: 100 }
    );
  });
});
