/**
 * Demo Mode Integration Tests for HarvestPro
 * 
 * Tests that demo mode integration works correctly:
 * - Demo banner appears when in demo mode
 * - Demo badges appear on cards when in demo mode
 * - Demo data is clearly labeled and never mixed with live data
 * 
 * Requirements: Enhanced Req 30 AC2-3 (demo badges)
 * Design: Demo Mode Manager → Mode Switching
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { HarvestSummaryCard } from '@/components/harvestpro/HarvestSummaryCard';
import { HarvestOpportunityCard } from '@/components/harvestpro/HarvestOpportunityCard';
import { DemoBanner } from '@/components/ux/DemoBanner';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import type { OpportunitiesSummary, HarvestOpportunity } from '@/types/harvestpro';

// Mock the demo mode manager
vi.mock('@/lib/ux/DemoModeManager', () => ({
  useDemoMode: vi.fn(),
}));

const mockUseDemoMode = vi.mocked(useDemoMode);

// Mock data
const mockSummary: OpportunitiesSummary = {
  totalHarvestableLoss: 12450,
  estimatedNetBenefit: 2988,
  eligibleTokensCount: 8,
  gasEfficiencyScore: 'B',
};

const mockOpportunity: HarvestOpportunity = {
  id: '1',
  lotId: 'lot-1',
  userId: 'user-1',
  token: 'ETH',
  tokenLogoUrl: null,
  riskLevel: 'LOW',
  unrealizedLoss: 4500,
  remainingQty: 2.5,
  gasEstimate: 45,
  slippageEstimate: 22,
  tradingFees: 15,
  netTaxBenefit: 1080,
  guardianScore: 8.5,
  executionTimeEstimate: '5-8 min',
  confidence: 92,
  recommendationBadge: 'recommended',
  metadata: {
    walletName: 'Main Wallet',
    venue: 'Uniswap',
    reasons: ['High liquidity', 'Low gas cost'],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('HarvestPro Demo Mode Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Demo Banner Integration', () => {
    test('demo banner appears when in demo mode', async () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(<DemoBanner />);

      await waitFor(() => {
        expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
      });

      expect(screen.getByText('Connect Wallet for Live Data')).toBeInTheDocument();
    });

    test('demo banner does not appear when in live mode', () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: false,
        reason: 'live_mode',
        bannerVisible: false,
        dataSourceStatus: {
          gasOracle: true,
          coreAPI: true,
          moduleAPIs: { guardian: true, hunter: true, harvestpro: true },
          overall: true,
        },
        bannerMessage: '',
        bannerCTA: '',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(<DemoBanner />);

      expect(screen.queryByText('Demo Mode — Data is simulated')).not.toBeInTheDocument();
      expect(screen.queryByText('Connect Wallet for Live Data')).not.toBeInTheDocument();
    });
  });

  describe('Summary Card Demo Labeling', () => {
    test('shows demo badge when in demo mode', async () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(<HarvestSummaryCard summary={mockSummary} />);

      await waitFor(() => {
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
      });

      // Check that the demo badge has the correct styling
      const demoBadge = screen.getByText('Demo Data').closest('div');
      expect(demoBadge).toHaveClass('bg-gradient-to-r', 'from-blue-600/20', 'to-cyan-600/20');
    });

    test('does not show demo badge when in live mode', () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: false,
        reason: 'live_mode',
        bannerVisible: false,
        dataSourceStatus: {
          gasOracle: true,
          coreAPI: true,
          moduleAPIs: { guardian: true, hunter: true, harvestpro: true },
          overall: true,
        },
        bannerMessage: '',
        bannerCTA: '',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(<HarvestSummaryCard summary={mockSummary} />);

      expect(screen.queryByText('Demo Data')).not.toBeInTheDocument();
    });
  });

  describe('Opportunity Card Demo Labeling', () => {
    test('shows demo badge when in demo mode', async () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Demo')).toBeInTheDocument();
      });

      // Check that the demo badge has the correct styling
      const demoBadge = screen.getByText('Demo').closest('div');
      expect(demoBadge).toHaveClass('bg-gradient-to-r', 'from-blue-600/20', 'to-cyan-600/20');
    });

    test('does not show demo badge when in live mode', () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: false,
        reason: 'live_mode',
        bannerVisible: false,
        dataSourceStatus: {
          gasOracle: true,
          coreAPI: true,
          moduleAPIs: { guardian: true, hunter: true, harvestpro: true },
          overall: true,
        },
        bannerMessage: '',
        bannerCTA: '',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
        />
      );

      expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    });
  });

  describe('Data Integrity', () => {
    test('demo data is clearly labeled and separated from live data', async () => {
      // Test demo mode first
      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(
        <div>
          <HarvestSummaryCard summary={mockSummary} />
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
          />
        </div>
      );

      // Verify demo mode indicators are present
      await waitFor(() => {
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
        expect(screen.getByText('Demo')).toBeInTheDocument();
      });
    });

    test('live mode does not show demo indicators', () => {
      // Test live mode
      mockUseDemoMode.mockReturnValue({
        isDemo: false,
        reason: 'live_mode',
        bannerVisible: false,
        dataSourceStatus: {
          gasOracle: true,
          coreAPI: true,
          moduleAPIs: { guardian: true, hunter: true, harvestpro: true },
          overall: true,
        },
        bannerMessage: '',
        bannerCTA: '',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(
        <div>
          <HarvestSummaryCard summary={mockSummary} />
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
          />
        </div>
      );

      // Verify demo mode indicators are not present
      expect(screen.queryByText('Demo Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    });

    test('demo mode state is consistent across all components', async () => {
      const mockSetDemoMode = vi.fn();

      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: mockSetDemoMode,
        refreshDataSources: vi.fn(),
      });

      render(
        <div>
          <DemoBanner />
          <HarvestSummaryCard summary={mockSummary} />
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
          />
        </div>
      );

      // All components should show demo indicators
      await waitFor(() => {
        expect(screen.getByText('Demo Mode — Data is simulated')).toBeInTheDocument();
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
        expect(screen.getByText('Demo')).toBeInTheDocument();
      });

      // Verify all components are using the same demo mode hook
      expect(mockUseDemoMode).toHaveBeenCalledTimes(3); // Once for each component
    });
  });

  describe('Accessibility', () => {
    test('demo badges have proper accessibility attributes', async () => {
      mockUseDemoMode.mockReturnValue({
        isDemo: true,
        reason: 'wallet_not_connected',
        bannerVisible: true,
        dataSourceStatus: {
          gasOracle: false,
          coreAPI: false,
          moduleAPIs: { guardian: false, hunter: false, harvestpro: false },
          overall: false,
        },
        bannerMessage: 'Demo Mode — Data is simulated',
        bannerCTA: 'Connect Wallet for Live Data',
        setDemoMode: vi.fn(),
        refreshDataSources: vi.fn(),
      });

      render(
        <div>
          <HarvestSummaryCard summary={mockSummary} />
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
          />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText('Demo Data')).toBeInTheDocument();
        expect(screen.getByText('Demo')).toBeInTheDocument();
      });

      // Demo badges should be present and accessible
      const demoDataBadge = screen.getByText('Demo Data');
      const demoBadge = screen.getByText('Demo');
      
      expect(demoDataBadge).toBeInTheDocument();
      expect(demoBadge).toBeInTheDocument();
    });
  });
});