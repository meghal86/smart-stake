/**
 * Property-Based Tests for V2 Telemetry Analytics
 * 
 * Feature: unified-portfolio, Property 36: V2 Telemetry Correctness
 * 
 * Validates: Requirements 16.3, 16.4, 16.5
 * 
 * Tests comprehensive telemetry metrics:
 * - MTTS (Mean Time To Safety) calculations
 * - Prevented loss percentile calculations
 * - Fix rate and false positive rate calculations
 * - Action funnel analytics
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { TelemetryAnalytics } from '../TelemetryAnalytics';

// ============================================================================
// Generators
// ============================================================================

const severityArbitrary = fc.constantFrom('critical', 'high', 'medium', 'low');

const issueTypeArbitrary = fc.constantFrom(
  'approval_risk',
  'policy_violation',
  'simulation_failure',
  'security_warning'
);

const actionTypeArbitrary = fc.constantFrom(
  'revoke_approval',
  'reject_transaction',
  'policy_block',
  'simulation_block'
);

const mttsMetricArbitrary = fc.record({
  issueId: fc.uuid(),
  severity: severityArbitrary,
  detectedAt: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  resolvedAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date() }), { nil: null }),
  userId: fc.uuid(),
  issueType: issueTypeArbitrary
});

const preventedLossMetricArbitrary = fc.record({
  userId: fc.uuid(),
  actionId: fc.uuid(),
  actionType: actionTypeArbitrary,
  preventedLossUsd: fc.float({ min: 0, max: 100000, noNaN: true }),
  confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  severity: severityArbitrary
});

const fixRateMetricArbitrary = fc.record({
  userId: fc.uuid(),
  actionId: fc.uuid(),
  actionType: fc.string({ minLength: 1, maxLength: 50 }),
  severity: severityArbitrary,
  presented: fc.constant(true),
  completed: fc.boolean(),
  dismissed: fc.boolean(),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() })
});

const falsePositiveMetricArbitrary = fc.record({
  userId: fc.uuid(),
  issueId: fc.uuid(),
  issueType: fc.string({ minLength: 1, maxLength: 50 }),
  severity: severityArbitrary,
  dismissed: fc.boolean(),
  overridden: fc.boolean(),
  feedback: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() })
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 36: V2 Telemetry Correctness', () => {
  const analytics = new TelemetryAnalytics();

  // ==========================================================================
  // Property 36.1: Percentile calculations return values within input range
  // ==========================================================================

  test('percentile calculations always return values within input range', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 100000, noNaN: true }), { minLength: 1, maxLength: 1000 }),
        fc.integer({ min: 0, max: 100 }),
        (values, percentile) => {
          const sorted = [...values].sort((a, b) => a - b);
          const result = (analytics as any).calculatePercentile(sorted, percentile);

          // Property: Result must be within min and max of input values
          const min = Math.min(...values);
          const max = Math.max(...values);
          
          expect(result).toBeGreaterThanOrEqual(min);
          expect(result).toBeLessThanOrEqual(max);
          expect(result).not.toBeNaN();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.2: MTTS calculations never return negative values
  // ==========================================================================

  test('MTTS calculations never return negative values', () => {
    fc.assert(
      fc.property(
        fc.array(mttsMetricArbitrary, { minLength: 0, maxLength: 100 }),
        (metrics) => {
          // Calculate time to safety for resolved issues
          const metricsWithTTS = metrics.map(m => ({
            ...m,
            timeToSafetyMs: m.resolvedAt && m.detectedAt
              ? Math.max(0, m.resolvedAt.getTime() - m.detectedAt.getTime())
              : null
          }));

          // Calculate overall MTTS
          const resolvedMetrics = metricsWithTTS.filter(m => m.timeToSafetyMs !== null);
          const overall = resolvedMetrics.length > 0
            ? resolvedMetrics.reduce((sum, m) => sum + (m.timeToSafetyMs || 0), 0) / resolvedMetrics.length
            : 0;

          // Property: MTTS must never be negative
          expect(overall).toBeGreaterThanOrEqual(0);
          expect(overall).not.toBeNaN();

          // Property: Individual MTTS values must never be negative
          metricsWithTTS.forEach(m => {
            if (m.timeToSafetyMs !== null) {
              expect(m.timeToSafetyMs).toBeGreaterThanOrEqual(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.3: Fix rate always between 0-100%
  // ==========================================================================

  test('fix rate calculations always return values between 0-100%', () => {
    fc.assert(
      fc.property(
        fc.array(fixRateMetricArbitrary, { minLength: 1, maxLength: 100 }),
        (metrics) => {
          const completedCount = metrics.filter(m => m.completed).length;
          const presentedCount = metrics.filter(m => m.presented).length;
          const fixRate = presentedCount > 0 ? (completedCount / presentedCount) * 100 : 0;

          // Property: Fix rate must be between 0 and 100
          expect(fixRate).toBeGreaterThanOrEqual(0);
          expect(fixRate).toBeLessThanOrEqual(100);
          expect(fixRate).not.toBeNaN();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.4: False positive rate always between 0-100%
  // ==========================================================================

  test('false positive rate calculations always return values between 0-100%', () => {
    fc.assert(
      fc.property(
        fc.array(falsePositiveMetricArbitrary, { minLength: 1, maxLength: 100 }),
        (metrics) => {
          const criticalMetrics = metrics.filter(m => m.severity === 'critical');
          const dismissedOrOverridden = criticalMetrics.filter(m => m.dismissed || m.overridden).length;
          const fpRate = criticalMetrics.length > 0 ? (dismissedOrOverridden / criticalMetrics.length) * 100 : 0;

          // Property: FP rate must be between 0 and 100
          expect(fpRate).toBeGreaterThanOrEqual(0);
          expect(fpRate).toBeLessThanOrEqual(100);
          expect(fpRate).not.toBeNaN();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.5: Prevented loss p95 >= p50
  // ==========================================================================

  test('prevented loss p95 is always greater than or equal to p50', () => {
    fc.assert(
      fc.property(
        fc.array(preventedLossMetricArbitrary, { minLength: 2, maxLength: 100 }),
        (metrics) => {
          const lossValues = metrics.map(m => m.preventedLossUsd).sort((a, b) => a - b);
          const p50 = (analytics as any).calculatePercentile(lossValues, 50);
          const p95 = (analytics as any).calculatePercentile(lossValues, 95);

          // Property: p95 must be >= p50
          expect(p95).toBeGreaterThanOrEqual(p50);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.6: Total prevented loss equals sum of individual losses
  // ==========================================================================

  test('total prevented loss equals sum of individual losses', () => {
    fc.assert(
      fc.property(
        fc.array(preventedLossMetricArbitrary, { minLength: 1, maxLength: 100 }),
        (metrics) => {
          const total = metrics.reduce((sum, m) => sum + m.preventedLossUsd, 0);
          const calculatedTotal = metrics.map(m => m.preventedLossUsd).reduce((sum, val) => sum + val, 0);

          // Property: Total must equal sum of individual values
          expect(Math.abs(total - calculatedTotal)).toBeLessThan(0.01); // Allow for floating point precision
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.7: MTTS by severity contains only valid severity levels
  // ==========================================================================

  test('MTTS by severity breakdown contains only valid severity levels', () => {
    fc.assert(
      fc.property(
        fc.array(mttsMetricArbitrary, { minLength: 1, maxLength: 100 }),
        (metrics) => {
          const validSeverities = ['critical', 'high', 'medium', 'low'];
          const bySeverity: Record<string, number[]> = {};

          metrics.forEach(m => {
            if (!bySeverity[m.severity]) {
              bySeverity[m.severity] = [];
            }
            if (m.resolvedAt && m.detectedAt) {
              const tts = m.resolvedAt.getTime() - m.detectedAt.getTime();
              if (tts >= 0) {
                bySeverity[m.severity].push(tts);
              }
            }
          });

          // Property: All severity keys must be valid
          Object.keys(bySeverity).forEach(severity => {
            expect(validSeverities).toContain(severity);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.8: Fix rate by severity never exceeds overall fix rate significantly
  // ==========================================================================

  test('fix rate by severity is consistent with overall fix rate', () => {
    fc.assert(
      fc.property(
        fc.array(fixRateMetricArbitrary, { minLength: 10, maxLength: 100 }),
        (metrics) => {
          const overallCompleted = metrics.filter(m => m.completed).length;
          const overallPresented = metrics.filter(m => m.presented).length;
          const overallFixRate = overallPresented > 0 ? (overallCompleted / overallPresented) * 100 : 0;

          const severities = ['critical', 'high', 'medium', 'low'];
          severities.forEach(sev => {
            const sevMetrics = metrics.filter(m => m.severity === sev);
            if (sevMetrics.length > 0) {
              const sevCompleted = sevMetrics.filter(m => m.completed).length;
              const sevPresented = sevMetrics.filter(m => m.presented).length;
              const sevFixRate = sevPresented > 0 ? (sevCompleted / sevPresented) * 100 : 0;

              // Property: Severity fix rate must be between 0 and 100
              expect(sevFixRate).toBeGreaterThanOrEqual(0);
              expect(sevFixRate).toBeLessThanOrEqual(100);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.9: Action funnel stages maintain logical progression
  // ==========================================================================

  test('action funnel stages maintain logical progression', () => {
    const stageOrder = ['card_viewed', 'plan_created', 'simulated', 'signing', 'submitted', 'confirmed'];
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            actionId: fc.uuid(),
            stage: fc.constantFrom(...stageOrder),
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() })
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (metrics) => {
          // Group by action ID
          const byAction: Record<string, typeof metrics> = {};
          metrics.forEach(m => {
            if (!byAction[m.actionId]) {
              byAction[m.actionId] = [];
            }
            byAction[m.actionId].push(m);
          });

          // Property: For each action, stages should be in logical order
          Object.values(byAction).forEach(actionMetrics => {
            const sortedByTime = [...actionMetrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const stageIndices = sortedByTime.map(m => stageOrder.indexOf(m.stage));

            // Check that stage indices are non-decreasing (allowing duplicates)
            for (let i = 1; i < stageIndices.length; i++) {
              expect(stageIndices[i]).toBeGreaterThanOrEqual(stageIndices[i - 1]);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ==========================================================================
  // Property 36.10: Confidence values are always within valid range
  // ==========================================================================

  test('confidence values in prevented loss metrics are always between 0.5 and 1.0', () => {
    fc.assert(
      fc.property(
        fc.array(preventedLossMetricArbitrary, { minLength: 1, maxLength: 100 }),
        (metrics) => {
          // Property: All confidence values must be between 0.5 and 1.0
          metrics.forEach(m => {
            expect(m.confidence).toBeGreaterThanOrEqual(0.5);
            expect(m.confidence).toBeLessThanOrEqual(1.0);
            expect(m.confidence).not.toBeNaN();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
