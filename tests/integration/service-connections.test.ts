/**
 * Service Connections Integration Tests
 * 
 * Tests integration between portfolio components and external services
 * (Guardian, Hunter, Harvest).
 * 
 * Task 18.3: Write integration tests for service connections
 * Requirements: 1.6
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { portfolioSnapshotService } from '@/services/PortfolioSnapshotService';
import { requestGuardianScan } from '@/services/guardianService';
import { requestHunterScan } from '@/services/hunterService';
import { requestHarvestScan } from '@/services/harvestService';
import { WalletScope } from '@/types/portfolio';

// Mock the services
vi.mock('@/services/guardianService');
vi.mock('@/services/hunterService');
vi.mock('@/services/harvestService');
vi.mock('@/services/PortfolioValuationService', () => ({
  portfolioValuationService: {
    valuatePortfolio: vi.fn()
  }
}));

describe('Service Connections Integration Tests', () => {
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
  
  const walletScope: WalletScope = {
    mode: 'active_wallet',
    address: TEST_WALLET_ADDRESS as `0x${string}`
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guardian Integration', () => {
    test('should successfully integrate Guardian security data', async () => {
      // Mock Guardian response
      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 3,
        riskLevel: 'Medium',
        statusLabel: 'Medium Risk',
        statusTone: 'warning',
        flags: [
          {
            type: 'OLD_APPROVAL',
            severity: 'medium',
            description: 'Approval older than 6 months',
            recommendation: 'Consider revoking old approvals'
          }
        ]
      });

      // Mock other services
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [],
        positions: [],
        totalOpportunityValue: 0,
        confidence: 0.75
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [],
        totalTaxSavings: 0,
        totalUnrealizedLoss: 0,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Verify Guardian data is integrated
      expect(requestGuardianScan).toHaveBeenCalledWith({
        walletAddress: TEST_WALLET_ADDRESS,
        network: 'ethereum'
      });

      expect(snapshot.riskSummary.overallScore).toBeGreaterThan(0);
      expect(snapshot.freshness.confidence).toBeGreaterThan(0);
    });

    test('should handle Guardian service failure gracefully', async () => {
      // Mock Guardian failure
      vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian service unavailable'));

      // Mock other services succeeding
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [],
        positions: [],
        totalOpportunityValue: 0,
        confidence: 0.75
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [],
        totalTaxSavings: 0,
        totalUnrealizedLoss: 0,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Should still return snapshot with degraded confidence
      expect(snapshot).toBeDefined();
      expect(snapshot.freshness.degraded).toBe(true);
      expect(snapshot.freshness.confidence).toBeLessThan(0.70);
    });
  });

  describe('Hunter Integration', () => {
    test('should successfully integrate Hunter opportunity data', async () => {
      // Mock Hunter response with opportunities
      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [
          {
            id: 'hunter_opp_1',
            type: 'airdrop',
            title: 'Airdrop Opportunity',
            description: 'Potential airdrop detected',
            estimatedValue: 500,
            confidence: 0.8,
            chainId: 1,
            protocol: 'Uniswap'
          }
        ],
        positions: [
          {
            id: 'hunter_pos_1',
            protocol: 'Aave',
            type: 'lending',
            token: 'USDC',
            amount: '1000',
            valueUsd: 1000,
            apy: 5.5,
            chainId: 1
          }
        ],
        totalOpportunityValue: 500,
        confidence: 0.75
      });

      // Mock other services
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: []
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [],
        totalTaxSavings: 0,
        totalUnrealizedLoss: 0,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Verify Hunter data is integrated
      expect(requestHunterScan).toHaveBeenCalledWith({
        walletAddresses: [TEST_WALLET_ADDRESS]
      });

      // Should have Hunter positions in aggregated positions
      expect(snapshot.positions.length).toBeGreaterThan(0);
      
      // Should have Hunter opportunities in recommended actions
      expect(snapshot.recommendedActions.length).toBeGreaterThan(0);
    });

    test('should handle Hunter service failure gracefully', async () => {
      // Mock Hunter failure
      vi.mocked(requestHunterScan).mockRejectedValue(new Error('Hunter service unavailable'));

      // Mock other services succeeding
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: []
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [],
        totalTaxSavings: 0,
        totalUnrealizedLoss: 0,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Should still return snapshot with degraded confidence
      expect(snapshot).toBeDefined();
      expect(snapshot.freshness.degraded).toBe(true);
    });
  });

  describe('Harvest Integration', () => {
    test('should successfully integrate Harvest tax optimization data', async () => {
      // Mock Harvest response with recommendations
      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [
          {
            id: 'harvest_rec_1',
            type: 'tax_loss_harvest',
            title: 'Harvest Tax Loss on ETH',
            description: 'Realize loss to offset capital gains',
            estimatedTaxSavings: 600,
            confidence: 0.8,
            token: 'ETH',
            amount: '1.5',
            currentValue: 2000,
            costBasis: 2500,
            unrealizedPnL: -500,
            chainId: 1
          }
        ],
        totalTaxSavings: 600,
        totalUnrealizedLoss: 500,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      // Mock other services
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: []
      });

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [],
        positions: [],
        totalOpportunityValue: 0,
        confidence: 0.75
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Verify Harvest data is integrated
      expect(requestHarvestScan).toHaveBeenCalledWith({
        walletAddresses: [TEST_WALLET_ADDRESS]
      });

      // Should have Harvest recommendations in recommended actions
      expect(snapshot.recommendedActions.length).toBeGreaterThan(0);
      const harvestAction = snapshot.recommendedActions.find(action => 
        action.cta.intent === 'harvest_rewards'
      );
      expect(harvestAction).toBeDefined();
    });

    test('should handle Harvest service failure gracefully', async () => {
      // Mock Harvest failure
      vi.mocked(requestHarvestScan).mockRejectedValue(new Error('Harvest service unavailable'));

      // Mock other services succeeding
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: []
      });

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [],
        positions: [],
        totalOpportunityValue: 0,
        confidence: 0.75
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Should still return snapshot with degraded confidence
      expect(snapshot).toBeDefined();
      expect(snapshot.freshness.degraded).toBe(true);
    });
  });

  describe('Data Flow Between Components', () => {
    test('should correctly aggregate data from all services', async () => {
      // Mock all services with data
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: [
          {
            token: 'ETH',
            qty: 5,
            value: 10000,
            source: 'wallet'
          }
        ]
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 3,
        riskLevel: 'Medium',
        statusLabel: 'Medium Risk',
        statusTone: 'warning',
        flags: [
          {
            type: 'HIGH_RISK_APPROVAL',
            severity: 'critical',
            description: 'Unlimited approval to unknown contract',
            recommendation: 'Revoke this approval immediately'
          }
        ]
      });

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [
          {
            id: 'hunter_opp_1',
            type: 'yield',
            title: 'Yield Opportunity',
            description: 'High APY detected',
            estimatedValue: 1000,
            confidence: 0.85,
            chainId: 1,
            protocol: 'Compound'
          }
        ],
        positions: [
          {
            id: 'hunter_pos_1',
            protocol: 'Aave',
            type: 'lending',
            token: 'USDC',
            amount: '1000',
            valueUsd: 1000,
            apy: 5.5,
            chainId: 1
          }
        ],
        totalOpportunityValue: 1000,
        confidence: 0.75
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [
          {
            id: 'harvest_rec_1',
            type: 'tax_loss_harvest',
            title: 'Harvest Tax Loss on ETH',
            description: 'Realize loss to offset capital gains',
            estimatedTaxSavings: 600,
            confidence: 0.8,
            token: 'ETH',
            amount: '1.5',
            currentValue: 2000,
            costBasis: 2500,
            unrealizedPnL: -500,
            chainId: 1
          }
        ],
        totalTaxSavings: 600,
        totalUnrealizedLoss: 500,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Verify all data is aggregated correctly
      expect(snapshot.netWorth).toBe(10000);
      expect(snapshot.delta24h).toBe(100);
      expect(snapshot.positions.length).toBeGreaterThan(0);
      expect(snapshot.recommendedActions.length).toBeGreaterThan(0);
      expect(snapshot.riskSummary.criticalIssues).toBeGreaterThan(0);
      
      // Verify confidence is calculated correctly (all services succeeded)
      expect(snapshot.freshness.confidence).toBeGreaterThanOrEqual(0.70);
      expect(snapshot.freshness.degraded).toBe(false);
    });

    test('should handle mixed success/failure scenarios', async () => {
      // Mock Portfolio and Guardian succeeding, Hunter and Harvest failing
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestGuardianScan).mockResolvedValue({
        trustScorePercent: 85,
        trustScoreRaw: 0.85,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: []
      });

      vi.mocked(requestHunterScan).mockRejectedValue(new Error('Hunter unavailable'));
      vi.mocked(requestHarvestScan).mockRejectedValue(new Error('Harvest unavailable'));

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Should return snapshot with partial data
      expect(snapshot).toBeDefined();
      expect(snapshot.netWorth).toBe(10000);
      
      // Confidence should reflect 2/4 services succeeded
      expect(snapshot.freshness.confidence).toBe(0.5);
      expect(snapshot.freshness.degraded).toBe(true);
      expect(snapshot.freshness.degradedReasons).toContain('Failed to load data from: Hunter, Harvest');
    });
  });

  describe('Error Handling and Fallback Behavior', () => {
    test('should provide meaningful error messages when all services fail', async () => {
      // Mock all services failing
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockRejectedValue(new Error('Portfolio unavailable'));
      vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian unavailable'));
      vi.mocked(requestHunterScan).mockRejectedValue(new Error('Hunter unavailable'));
      vi.mocked(requestHarvestScan).mockRejectedValue(new Error('Harvest unavailable'));

      const snapshot = await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Should return snapshot with minimum confidence
      expect(snapshot.freshness.confidence).toBe(0.5); // Minimum threshold
      expect(snapshot.freshness.degraded).toBe(true);
      expect(snapshot.freshness.degradedReasons).toBeDefined();
      expect(snapshot.freshness.degradedReasons![0]).toContain('Failed to load data from');
    });

    test('should retry failed service calls appropriately', async () => {
      // This test verifies that the service doesn't retry excessively
      // Mock Guardian failing
      vi.mocked(requestGuardianScan).mockRejectedValue(new Error('Guardian unavailable'));

      // Mock other services succeeding
      const { portfolioValuationService } = await import('@/services/PortfolioValuationService');
      vi.mocked(portfolioValuationService.valuatePortfolio).mockResolvedValue({
        kpis: { total_value: 10000, pnl_24h: 100 },
        holdings: []
      } as any);

      vi.mocked(requestHunterScan).mockResolvedValue({
        opportunities: [],
        positions: [],
        totalOpportunityValue: 0,
        confidence: 0.75
      });

      vi.mocked(requestHarvestScan).mockResolvedValue({
        recommendations: [],
        totalTaxSavings: 0,
        totalUnrealizedLoss: 0,
        totalUnrealizedGain: 0,
        confidence: 0.70
      });

      await portfolioSnapshotService.getSnapshot(TEST_USER_ID, walletScope);

      // Guardian should only be called once (no retries in Promise.allSettled)
      expect(requestGuardianScan).toHaveBeenCalledTimes(1);
    });
  });
});
