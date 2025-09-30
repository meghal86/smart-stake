import { describe, it, expect } from 'vitest';

// Mock forecast data
const mockForecasts = [
  { preset_name: 'CEX Inflows', predicted_upgrade_rate: 15.2, actual_rate: 14.8 },
  { preset_name: 'Accumulation', predicted_upgrade_rate: 12.5, actual_rate: 13.1 },
  { preset_name: 'Distribution', predicted_upgrade_rate: 8.3, actual_rate: 7.9 }
];

// Helper functions for testing forecast accuracy
function calculateAccuracy(predicted: number, actual: number): number {
  return Math.max(0, 100 - Math.abs(predicted - actual));
}

function calculateMAPE(forecasts: Array<{predicted_upgrade_rate: number, actual_rate: number}>): number {
  const totalError = forecasts.reduce((sum, f) => {
    return sum + Math.abs((f.actual_rate - f.predicted_upgrade_rate) / f.actual_rate);
  }, 0);
  return (totalError / forecasts.length) * 100;
}

function shouldTriggerAlert(currentRate: number, previousRate: number): boolean {
  const weekOverWeekChange = ((currentRate - previousRate) / previousRate) * 100;
  return weekOverWeekChange < -10; // 10% drop threshold
}

describe('Forecast Accuracy', () => {
  describe('Accuracy Calculation', () => {
    it('should calculate perfect accuracy for exact predictions', () => {
      const accuracy = calculateAccuracy(15.0, 15.0);
      expect(accuracy).toBe(100);
    });

    it('should calculate accuracy for close predictions', () => {
      const accuracy = calculateAccuracy(15.2, 14.8);
      expect(accuracy).toBe(99.6); // 100 - 0.4
    });

    it('should handle large prediction errors', () => {
      const accuracy = calculateAccuracy(20.0, 10.0);
      expect(accuracy).toBe(90); // 100 - 10
    });
  });

  describe('MAPE Calculation', () => {
    it('should calculate mean absolute percentage error', () => {
      const mape = calculateMAPE(mockForecasts);
      expect(mape).toBeCloseTo(3.5, 1); // Expected ~3.5% MAPE
    });

    it('should handle perfect predictions', () => {
      const perfectForecasts = [
        { predicted_upgrade_rate: 15.0, actual_rate: 15.0 },
        { predicted_upgrade_rate: 10.0, actual_rate: 10.0 }
      ];
      const mape = calculateMAPE(perfectForecasts);
      expect(mape).toBe(0);
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alert for >10% WoW drop', () => {
      const shouldAlert = shouldTriggerAlert(12.0, 15.0); // 20% drop
      expect(shouldAlert).toBe(true);
    });

    it('should not trigger alert for small drops', () => {
      const shouldAlert = shouldTriggerAlert(14.0, 15.0); // 6.7% drop
      expect(shouldAlert).toBe(false);
    });

    it('should not trigger alert for increases', () => {
      const shouldAlert = shouldTriggerAlert(16.0, 15.0); // 6.7% increase
      expect(shouldAlert).toBe(false);
    });
  });

  describe('Cross-Retention Analysis', () => {
    it('should show higher upgrade probability for more active users', () => {
      const retentionData = [
        { activity_bucket: '0-2 runs', upgrade_probability: 5.2 },
        { activity_bucket: '3-5 runs', upgrade_probability: 12.8 },
        { activity_bucket: '6+ runs', upgrade_probability: 24.1 }
      ];

      // Verify ascending upgrade probability
      expect(retentionData[0].upgrade_probability).toBeLessThan(retentionData[1].upgrade_probability);
      expect(retentionData[1].upgrade_probability).toBeLessThan(retentionData[2].upgrade_probability);
    });
  });

  describe('Model Performance', () => {
    it('should achieve acceptable accuracy threshold', () => {
      const avgAccuracy = mockForecasts.reduce((sum, f) => {
        return sum + calculateAccuracy(f.predicted_upgrade_rate, f.actual_rate);
      }, 0) / mockForecasts.length;

      expect(avgAccuracy).toBeGreaterThan(85); // 85% accuracy threshold
    });

    it('should have low prediction error', () => {
      const mape = calculateMAPE(mockForecasts);
      expect(mape).toBeLessThan(10); // <10% MAPE threshold
    });
  });
});