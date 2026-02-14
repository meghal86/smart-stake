/**
 * Property-Based Tests for Telemetry Analytics Service
 * 
 * Feature: unified-portfolio, Property 36-40: Telemetry Analytics Correctness
 * Validates: Requirements 16.3, 16.4, 16.5
 * 
 * Tests verify:
 * - MTTS calculations are accurate and consistent
 * - Prevented loss percentiles are correctly computed
 * - Fix rate calculations follow correct formulas
 * - False positive rate calculations are accurate
 * - Action funnel metrics maintain logical progression
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { telemetryAnalytics } from '../TelemetryAnalytics';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('Feature: unified-portfolio, Property 36-40: Telemetry Analytics Correctness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Property 36: MTTS Calculation Accuracy
  test('Property 36: MTTS calculations are accurate and percentiles are correctly computed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            issue_id: fc.string(),
            user_id: fc.uuid(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            issue_type: fc.constantFrom('approval_risk', 'policy_violation', 'simulation_failure', 'security_warning'),
            detected_at: fc.date(),
            resolved_at: fc.option(fc.date(), { nil: null }),
            time_to_safety_ms: fc.option(fc.integer({ min: 1000, max: 86400000 }), { nil: null }),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        async (issues) => {
          // Mock Supabase response
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: issues,
                    error: null,
                  })),
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const userId = issues[0]?.user_id || 'test-user';
          const result = await telemetryAnalytics.calculateMTTS(userId, 30);

          // Property: Resolved issues should have time_to_safety_ms
          const resolvedIssues = issues.filter(i => i.resolved_at && i.time_to_safety_ms);
          expect(result.totalIssues).toBe(issues.length);
          expect(result.unresolvedCount).toBe(issues.length - resolvedIssues.length);

          // Property: Mean should be average of all times
          if (resolvedIssues.length > 0) {
            const times = resolvedIssues.map(i => i.time_to_safety_ms!);
            const expectedMean = times.reduce((sum, t) => sum + t, 0) / times.length;
            expect(Math.abs(result.overall.mean - expectedMean)).toBeLessThan(1);
          }

          // Property: Median should be middle value
          if (resolvedIssues.length > 0) {
            const sortedTimes = resolvedIssues.map(i => i.time_to_safety_ms!).sort((a, b) => a - b);
            const expectedMedian = sortedTimes[Math.floor(sortedTimes.length / 2)];
            expect(result.overall.median).toBe(expectedMedian);
          }

          // Property: P95 should be >= median
          expect(result.overall.p95).toBeGreaterThanOrEqual(result.overall.median);

          // Property: P99 should be >= p95
          expect(result.overall.p99).toBeGreaterThanOrEqual(result.overall.p95);

          // Property: Severity counts should sum to total resolved
          const severityCounts = Object.values(result.bySeverity).reduce((sum, s) => sum + s.count, 0);
          expect(severityCounts).toBe(resolvedIssues.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 37: Prevented Loss Percentile Accuracy
  test('Property 37: Prevented loss percentiles (p50, p95, p99) are correctly computed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.uuid(),
            action_id: fc.string(),
            action_type: fc.constantFrom('revoke_approval', 'reject_transaction', 'policy_block', 'simulation_block'),
            prevented_loss_usd: fc.float({ min: 0, max: 100000 }),
            confidence: fc.float({ min: 0.5, max: 1.0 }),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            timestamp: fc.date(),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        async (losses) => {
          // Mock Supabase response
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: losses,
                    error: null,
                  })),
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const userId = losses[0]?.user_id || 'test-user';
          const result = await telemetryAnalytics.calculatePreventedLoss(userId, 30);

          // Property: Total should equal sum of all losses
          const expectedTotal = losses.reduce((sum, l) => sum + l.prevented_loss_usd, 0);
          expect(Math.abs(result.total - expectedTotal)).toBeLessThan(0.01);

          // Property: p50 should be <= p95
          expect(result.p50).toBeLessThanOrEqual(result.p95);

          // Property: p95 should be <= p99
          expect(result.p95).toBeLessThanOrEqual(result.p99);

          // Property: p99 should be <= max value
          const maxLoss = Math.max(...losses.map(l => l.prevented_loss_usd));
          expect(result.p99).toBeLessThanOrEqual(maxLoss);

          // Property: Severity totals should sum to overall total
          const severityTotal = Object.values(result.bySeverity).reduce((sum, s) => sum + s.total, 0);
          expect(Math.abs(severityTotal - expectedTotal)).toBeLessThan(0.01);

          // Property: Timeline dates should be in ascending order
          for (let i = 1; i < result.timeline.length; i++) {
            expect(result.timeline[i].date >= result.timeline[i - 1].date).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 38: Fix Rate Calculation Accuracy
  test('Property 38: Fix rate calculations follow correct formula (completed / presented * 100)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.uuid(),
            action_id: fc.string(),
            action_type: fc.string(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            presented: fc.boolean(),
            completed: fc.boolean(),
            dismissed: fc.boolean(),
            timestamp: fc.date(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        async (actions) => {
          // Mock Supabase response
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => Promise.resolve({
                  data: actions,
                  error: null,
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const userId = actions[0]?.user_id || 'test-user';
          const result = await telemetryAnalytics.calculateFixRate(userId, 30);

          // Property: Fix rate should equal (completed / presented) * 100
          const presented = actions.filter(a => a.presented).length;
          const completed = actions.filter(a => a.completed).length;
          const expectedFixRate = presented > 0 ? (completed / presented) * 100 : 0;
          
          expect(result.overall.presented).toBe(presented);
          expect(result.overall.completed).toBe(completed);
          expect(Math.abs(result.overall.fixRate - expectedFixRate)).toBeLessThan(0.01);

          // Property: Fix rate should be between 0 and 100
          expect(result.overall.fixRate).toBeGreaterThanOrEqual(0);
          expect(result.overall.fixRate).toBeLessThanOrEqual(100);

          // Property: Completed should be <= presented
          expect(result.overall.completed).toBeLessThanOrEqual(result.overall.presented);

          // Property: Severity fix rates should all be valid percentages
          Object.values(result.bySeverity).forEach(severity => {
            expect(severity.fixRate).toBeGreaterThanOrEqual(0);
            expect(severity.fixRate).toBeLessThanOrEqual(100);
            expect(severity.completed).toBeLessThanOrEqual(severity.presented);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 39: False Positive Rate Accuracy
  test('Property 39: False positive rate calculations are accurate ((dismissed + overridden) / total * 100)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.uuid(),
            issue_id: fc.string(),
            issue_type: fc.string(),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
            dismissed: fc.boolean(),
            overridden: fc.boolean(),
            feedback: fc.option(fc.string(), { nil: null }),
            timestamp: fc.date(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        async (issues) => {
          // Mock Supabase response
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => Promise.resolve({
                  data: issues,
                  error: null,
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const userId = issues[0]?.user_id || 'test-user';
          const result = await telemetryAnalytics.calculateFalsePositiveRate(userId, 30);

          // Property: FP rate should equal ((dismissed + overridden) / total) * 100
          const total = issues.length;
          const dismissed = issues.filter(i => i.dismissed).length;
          const overridden = issues.filter(i => i.overridden).length;
          const expectedFpRate = total > 0 ? ((dismissed + overridden) / total) * 100 : 0;
          
          expect(result.overall.total).toBe(total);
          expect(result.overall.dismissed).toBe(dismissed);
          expect(result.overall.overridden).toBe(overridden);
          expect(Math.abs(result.overall.fpRate - expectedFpRate)).toBeLessThan(0.01);

          // Property: FP rate should be between 0 and 100
          expect(result.overall.fpRate).toBeGreaterThanOrEqual(0);
          expect(result.overall.fpRate).toBeLessThanOrEqual(100);

          // Property: Critical overrides should be <= total overridden
          expect(result.criticalOverrides).toBeLessThanOrEqual(result.overall.overridden);

          // Property: Severity FP rates should all be valid percentages
          Object.values(result.bySeverity).forEach(severity => {
            expect(severity.fpRate).toBeGreaterThanOrEqual(0);
            expect(severity.fpRate).toBeLessThanOrEqual(100);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 40: Action Funnel Logical Progression
  test('Property 40: Action funnel metrics maintain logical stage progression', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            user_id: fc.uuid(),
            action_id: fc.string(),
            correlation_id: fc.string(),
            stage: fc.constantFrom('card_viewed', 'plan_created', 'simulated', 'signing', 'submitted', 'confirmed', 'failed'),
            timestamp: fc.date(),
            metadata: fc.record({}),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        async (events) => {
          // Mock Supabase response
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: events,
                    error: null,
                  })),
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const userId = events[0]?.user_id || 'test-user';
          const result = await telemetryAnalytics.calculateActionFunnel(userId, 30);

          // Property: Stage counts should match event counts
          const stageCounts: Record<string, number> = {};
          events.forEach(e => {
            stageCounts[e.stage] = (stageCounts[e.stage] || 0) + 1;
          });

          Object.keys(stageCounts).forEach(stage => {
            expect(result.stages[stage]).toBe(stageCounts[stage]);
          });

          // Property: Completion rate should be between 0 and 100
          expect(result.completionRate).toBeGreaterThanOrEqual(0);
          expect(result.completionRate).toBeLessThanOrEqual(100);

          // Property: Conversion rates should be between 0 and 100
          Object.values(result.conversionRates).forEach(rate => {
            expect(rate).toBeGreaterThanOrEqual(0);
            expect(rate).toBeLessThanOrEqual(100);
          });

          // Property: Dropoff points should have rates > 0
          result.dropoffPoints.forEach(dropoff => {
            expect(dropoff.rate).toBeGreaterThan(0);
            expect(dropoff.rate).toBeLessThanOrEqual(100);
          });

          // Property: Confirmed count should be <= card_viewed count
          if (result.stages.card_viewed > 0) {
            expect(result.stages.confirmed).toBeLessThanOrEqual(result.stages.card_viewed);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 41: Dashboard Metrics Consistency
  test('Property 41: Dashboard metrics are internally consistent across all components', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          days: fc.integer({ min: 1, max: 90 }),
        }),
        async ({ userId, days }) => {
          // Mock all Supabase responses with empty data
          const mockFrom = vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
          }));
          (supabase.from as any) = mockFrom;

          const result = await telemetryAnalytics.getDashboardMetrics(userId, days);

          // Property: Period should match requested days
          const periodDays = Math.floor((result.period.end.getTime() - result.period.start.getTime()) / (24 * 60 * 60 * 1000));
          expect(Math.abs(periodDays - days)).toBeLessThanOrEqual(1); // Allow 1 day tolerance

          // Property: All metrics should be present
          expect(result.mtts).toBeDefined();
          expect(result.preventedLoss).toBeDefined();
          expect(result.fixRate).toBeDefined();
          expect(result.falsePositive).toBeDefined();
          expect(result.actionFunnel).toBeDefined();

          // Property: All rates should be valid percentages
          expect(result.fixRate.overall.fixRate).toBeGreaterThanOrEqual(0);
          expect(result.fixRate.overall.fixRate).toBeLessThanOrEqual(100);
          expect(result.falsePositive.overall.fpRate).toBeGreaterThanOrEqual(0);
          expect(result.falsePositive.overall.fpRate).toBeLessThanOrEqual(100);
          expect(result.actionFunnel.completionRate).toBeGreaterThanOrEqual(0);
          expect(result.actionFunnel.completionRate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 50 }
    );
  });
});
