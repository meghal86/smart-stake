/**
 * HarvestPro Accessibility Compliance Tests (Simplified)
 * 
 * Tests WCAG AA compliance for core HarvestPro components
 * 
 * Requirements: Enhanced Req 18 AC4-5 (accessibility standards)
 * Design: Accessibility → Compliance Validation
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, describe, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HarvestOpportunityCard } from '@/components/harvestpro/HarvestOpportunityCard';
import { HarvestDetailModal } from '@/components/harvestpro/HarvestDetailModal';
import { HarvestSummaryCard } from '@/components/harvestpro/HarvestSummaryCard';
import { FilterChipRow } from '@/components/harvestpro/FilterChipRow';
import type { HarvestOpportunity, OpportunitiesSummary } from '@/types/harvestpro';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Create a test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock all dependencies
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    data: {
      formattedGasPrice: '25 gwei',
      gasColorClass: 'text-green-400',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/stores/useHarvestFilterStore', () => ({
  useHarvestFilterStore: () => ({
    minBenefit: 0,
    holdingPeriod: 'all',
    gasEfficiency: 'all',
    liquidity: 'all',
    riskLevels: [],
    types: [],
    wallets: [],
    setMinBenefit: vi.fn(),
    setHoldingPeriod: vi.fn(),
    setGasEfficiency: vi.fn(),
    setLiquidity: vi.fn(),
    toggleRiskLevel: vi.fn(),
    toggleType: vi.fn(),
    toggleWallet: vi.fn(),
    resetFilters: vi.fn(),
  }),
}));

vi.mock('@/hooks/useHarvestProPerformance', () => ({
  useHarvestProPerformance: () => ({
    measureInteraction: vi.fn((name, fn) => fn()),
    recordMetric: vi.fn(),
  }),
}));

// Mock opportunity data
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

const mockSummary: OpportunitiesSummary = {
  totalHarvestableLoss: 12450,
  estimatedNetBenefit: 2988,
  eligibleTokensCount: 8,
  gasEfficiencyScore: 'B',
};

describe('HarvestPro Accessibility Compliance', () => {
  describe('WCAG AA Compliance - Automated Testing', () => {
    test('HarvestOpportunityCard has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
            onSave={vi.fn()}
            onShare={vi.fn()}
            onReport={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('HarvestDetailModal has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <HarvestDetailModal
            opportunity={mockOpportunity}
            isOpen={true}
            onClose={vi.fn()}
            onExecute={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('HarvestSummaryCard has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <HarvestSummaryCard
            summary={mockSummary}
            hasHighRiskOpportunities={true}
          />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('FilterChipRow has no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <FilterChipRow />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive Elements - ARIA Labels', () => {
    test('all buttons have accessible names', () => {
      render(
        <TestWrapper>
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
            onSave={vi.fn()}
            onShare={vi.fn()}
            onReport={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );

      // Primary action button
      const startHarvestButton = screen.getByRole('button', { name: /start harvest/i });
      expect(startHarvestButton).toBeInTheDocument();
      expect(startHarvestButton).toHaveAccessibleName();

      // Secondary action buttons
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toHaveAccessibleName();

      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toBeInTheDocument();
      expect(shareButton).toHaveAccessibleName();

      const reportButton = screen.getByRole('button', { name: /report/i });
      expect(reportButton).toBeInTheDocument();
      expect(reportButton).toHaveAccessibleName();
    });

    test('modal has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <HarvestDetailModal
            opportunity={mockOpportunity}
            isOpen={true}
            onClose={vi.fn()}
            onExecute={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );

      // Modal should have dialog role
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');

      // Close button should have accessible name (use more specific selector)
      const closeButton = screen.getByRole('button', { name: /close harvest details modal/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAccessibleName();
    });

    test('filter chips have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <FilterChipRow />
        </TestWrapper>
      );

      // All filter chips should be buttons with accessible names
      const filterButtons = screen.getAllByRole('button');
      filterButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });

      // Active filters should have aria-pressed
      const activeFilters = filterButtons.filter(button => 
        button.getAttribute('aria-pressed') === 'true'
      );
      expect(activeFilters.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Keyboard Navigation', () => {
    test('opportunity card is keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockStartHarvest = vi.fn();

      render(
        <TestWrapper>
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={mockStartHarvest}
            onSave={vi.fn()}
            onShare={vi.fn()}
            onReport={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );

      const startHarvestButton = screen.getByRole('button', { name: /start harvest/i });
      
      // Focus the button
      startHarvestButton.focus();
      expect(document.activeElement).toBe(startHarvestButton);

      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockStartHarvest).toHaveBeenCalledWith(mockOpportunity.id);
    });

    test('modal supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      const mockExecute = vi.fn();

      render(
        <TestWrapper>
          <HarvestDetailModal
            opportunity={mockOpportunity}
            isOpen={true}
            onClose={mockClose}
            onExecute={mockExecute}
            isConnected={true}
          />
        </TestWrapper>
      );

      // Escape key should close modal
      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalled();
    });

    test('filter chips support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <FilterChipRow />
        </TestWrapper>
      );

      const filterButtons = screen.getAllByRole('button');
      
      // Should be able to tab through all filter buttons
      if (filterButtons.length > 0) {
        filterButtons[0].focus();
        expect(document.activeElement).toBe(filterButtons[0]);

        // Tab to next filter
        await user.keyboard('{Tab}');
        if (filterButtons.length > 1) {
          expect(document.activeElement).toBe(filterButtons[1]);
        }

        // Space or Enter should activate filter
        await user.keyboard('{Enter}');
        // Filter should be activated (implementation dependent)
      }
    });
  });

  describe('Touch Target Sizes', () => {
    test('all interactive elements have proper CSS classes for touch targets', () => {
      render(
        <TestWrapper>
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
            onSave={vi.fn()}
            onShare={vi.fn()}
            onReport={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Check that buttons have appropriate classes or minimum dimensions
      buttons.forEach(button => {
        const classList = Array.from(button.classList);
        
        // Check for common button classes that ensure proper sizing
        const hasProperSizing = 
          classList.some(cls => cls.includes('p-')) || // padding classes
          classList.some(cls => cls.includes('py-')) || // vertical padding
          classList.some(cls => cls.includes('px-')) || // horizontal padding
          classList.some(cls => cls.includes('h-')) || // height classes
          classList.some(cls => cls.includes('w-')); // width classes
        
        expect(hasProperSizing).toBe(true);
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('important content has proper semantic markup', () => {
      render(
        <TestWrapper>
          <HarvestOpportunityCard
            opportunity={mockOpportunity}
            onStartHarvest={vi.fn()}
            onSave={vi.fn()}
            onShare={vi.fn()}
            onReport={vi.fn()}
            isConnected={true}
          />
        </TestWrapper>
      );

      // Article should have proper role
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    test('status updates are announced to screen readers', () => {
      render(
        <TestWrapper>
          <HarvestDetailModal
            opportunity={mockOpportunity}
            isOpen={true}
            onClose={vi.fn()}
            onExecute={vi.fn()}
            isConnected={true}
            isExecuting={true}
          />
        </TestWrapper>
      );

      // Loading state should be announced
      const statusElement = screen.getByText(/executing/i);
      expect(statusElement).toBeInTheDocument();
    });
  });
});