import { describe, it, expect } from 'vitest';

// Mock data for testing
const mockScenarioRuns = [
  { model_version: 'scn-v1.0', confidence: 0.8, created_at: '2025-01-20T10:00:00Z' },
  { model_version: 'scn-v1.0', confidence: 0.7, created_at: '2025-01-15T10:00:00Z' },
  { model_version: 'scn-v1.0', confidence: 0.9, created_at: '2025-01-01T10:00:00Z' }
];

const mockOutcomes = [
  { scenario_run_id: '1', correct: true, recorded_at: '2025-01-20T12:00:00Z' },
  { scenario_run_id: '2', correct: false, recorded_at: '2025-01-15T12:00:00Z' },
  { scenario_run_id: '3', correct: true, recorded_at: '2025-01-01T12:00:00Z' }
];

// Helper functions for testing drift calculations
function calculateHitRate(outcomes: any[], windowDays: number): number {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const relevantOutcomes = outcomes.filter(o => new Date(o.recorded_at) >= cutoff);
  
  if (relevantOutcomes.length === 0) return 0;
  
  const hits = relevantOutcomes.filter(o => o.correct).length;
  return hits / relevantOutcomes.length;
}

function shouldTriggerAlert(currentRate: number, baseline: number, consecutiveDays: number): boolean {
  const delta = baseline - currentRate;
  return delta > 0.05 && consecutiveDays >= 2; // 5pp drop for 2+ days
}

describe('Drift Monitoring', () => {
  describe('Hit Rate Calculation', () => {
    it('should calculate 7-day hit rate correctly', () => {
      const hitRate = calculateHitRate(mockOutcomes, 7);
      expect(hitRate).toBe(1.0); // Only recent outcome (correct=true)
    });

    it('should calculate 30-day hit rate correctly', () => {
      const hitRate = calculateHitRate(mockOutcomes, 30);
      expect(hitRate).toBeCloseTo(0.67, 1); // 2 out of 3 correct
    });

    it('should handle empty outcomes', () => {
      const hitRate = calculateHitRate([], 7);
      expect(hitRate).toBe(0);
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alert when hit rate drops >5pp for 2+ days', () => {
      const shouldAlert = shouldTriggerAlert(0.65, 0.72, 2); // 7pp drop, 2 days
      expect(shouldAlert).toBe(true);
    });

    it('should not trigger alert for small drops', () => {
      const shouldAlert = shouldTriggerAlert(0.70, 0.72, 2); // 2pp drop, 2 days
      expect(shouldAlert).toBe(false);
    });

    it('should not trigger alert on first day', () => {
      const shouldAlert = shouldTriggerAlert(0.65, 0.72, 1); // 7pp drop, 1 day
      expect(shouldAlert).toBe(false);
    });
  });

  describe('Metrics Aggregation', () => {
    it('should aggregate confidence correctly', () => {
      const avgConfidence = mockScenarioRuns.reduce((sum, run) => sum + run.confidence, 0) / mockScenarioRuns.length;
      expect(avgConfidence).toBeCloseTo(0.8);
    });

    it('should group by model version', () => {
      const grouped = mockScenarioRuns.reduce((acc, run) => {
        if (!acc[run.model_version]) acc[run.model_version] = [];
        acc[run.model_version].push(run);
        return acc;
      }, {} as Record<string, any[]>);

      expect(grouped['scn-v1.0']).toHaveLength(3);
    });
  });
});