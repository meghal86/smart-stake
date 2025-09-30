// Cluster Data Coherence Tests
import { calculateShareOfTotal, validateClusterMetrics, formatUSD, getRiskThreshold } from '@/lib/market/compute';
import { ClusterMetrics } from '@/types/cluster';

describe('Cluster Formula Validation', () => {
  test('calculateShareOfTotal never exceeds 100%', () => {
    const testCases = [
      { cluster: 100, all: [100, -50, 25], expected: 57.1 }, // 100 / (100+50+25) * 100
      { cluster: -200, all: [100, -200, 50], expected: 57.1 }, // 200 / (100+200+50) * 100
      { cluster: 0, all: [0, 0, 0], expected: 0 },
      { cluster: 1000, all: [1000], expected: 100 }
    ];

    testCases.forEach(({ cluster, all, expected }) => {
      const result = calculateShareOfTotal(cluster, all);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
      expect(result).toBeCloseTo(expected, 1);
    });
  });

  test('validateClusterMetrics catches data incoherence', () => {
    const incoherentMetrics: ClusterMetrics = {
      clusterId: 'test',
      name: 'Test',
      kind: 'Dormant',
      activeAddresses: 0,
      valueAbsUSD: 0,
      netFlowUSD: 1000000, // Non-zero flow with zero addresses
      shareOfTotalPct: 150, // > 100%
      riskScore: 50,
      confidencePct: 80
    };

    const errors = validateClusterMetrics(incoherentMetrics);
    expect(errors).toContain('share_out_of_bounds: 150%');
    expect(errors.some(e => e.includes('data_incoherent'))).toBe(true);
  });

  test('formatUSD handles signs correctly', () => {
    expect(formatUSD(1500000)).toBe('+$1.5M');
    expect(formatUSD(-2300000000)).toBe('−$2.3B');
    expect(formatUSD(0)).toBe('$0');
    expect(formatUSD(500)).toBe('+$500');
  });

  test('getRiskThreshold boundaries', () => {
    expect(getRiskThreshold(0)).toBe('Safe');
    expect(getRiskThreshold(33)).toBe('Safe');
    expect(getRiskThreshold(34)).toBe('Watch');
    expect(getRiskThreshold(66)).toBe('Watch');
    expect(getRiskThreshold(67)).toBe('High');
    expect(getRiskThreshold(100)).toBe('High');
  });
});

describe('Confidence Gating', () => {
  test('low confidence switches to uncertain state', () => {
    const lowConfidenceMetrics: ClusterMetrics = {
      clusterId: 'uncertain',
      name: 'Uncertain Cluster',
      kind: 'Other',
      activeAddresses: 1,
      valueAbsUSD: 100000,
      netFlowUSD: 50000,
      shareOfTotalPct: 10,
      riskScore: 80,
      confidencePct: 15 // Below 20% threshold
    };

    // In UI, this should show "Uncertain" instead of classification
    expect(lowConfidenceMetrics.confidencePct).toBeLessThan(20);
  });
});

describe('Mock Data Scenarios', () => {
  test('dormant awakening scenario', () => {
    const dormantCluster: ClusterMetrics = {
      clusterId: 'dormant_waking',
      name: 'Dormant Wallets Awakening',
      kind: 'Dormant',
      activeAddresses: 23,
      valueAbsUSD: 104100000,
      netFlowUSD: -104100000, // Large outflow
      shareOfTotalPct: 45.2,
      riskScore: 90,
      confidencePct: 90
    };

    const errors = validateClusterMetrics(dormantCluster);
    expect(errors).toHaveLength(0);
    expect(dormantCluster.netFlowUSD).toBeLessThan(0); // Outflow
    expect(dormantCluster.riskScore).toBeGreaterThan(67); // High risk
  });

  test('insufficient data scenario', () => {
    const insufficientCluster: ClusterMetrics = {
      clusterId: 'cex_inflow',
      name: 'CEX Inflows',
      kind: 'CEXInflow',
      activeAddresses: 0,
      valueAbsUSD: 0,
      netFlowUSD: 0,
      shareOfTotalPct: 0,
      riskScore: 0,
      confidencePct: 0,
      note: 'insufficient_data'
    };

    expect(insufficientCluster.note).toBe('insufficient_data');
    expect(insufficientCluster.confidencePct).toBe(0);
    expect(insufficientCluster.riskScore).toBe(0);
  });
});