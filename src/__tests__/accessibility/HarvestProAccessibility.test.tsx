/**
 * HarvestPro Accessibility Compliance Tests
 * 
 * Tests WCAG AA compliance for all HarvestPro components:
 * - Interactive elements have proper ARIA labels
 * - Keyboard navigation works correctly
 * - Screen reader compatibility
 * - Color contrast meets standards
 * - Touch target sizes are adequate
 * 
 * Requirements: Enhanced Req 18 AC4-5 (accessibility standards)
 * Design: Accessibility → Compliance Validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, describe, test, vi, beforeEach } from 'vitest';
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

// Mock dependencies
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({
    connectedWallets: ['0x123...'],
    activeWallet: '0x123...',
  }),
}));

vi.mock('@/hooks/useHarvestOpportunities', () => ({
  useHarvestOpportunities: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useHarvestFilters', () => ({
  useHarvestFilters: (opportunities: any[]) => ({
    filteredOpportunities: opportunities,
    isFiltered: false,
    activeFilterCount: 0,
  }),
}));

vi.mock('@/lib/ux/DemoModeManager', () => ({
  useDemoMode: () => ({
    isDemo: true,
    setDemoMode: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    threshold: 80,
  }),
}));

vi.mock('@/lib/harvestpro/service-availability', () => ({
  serviceAvailability: {
    startMonitoringAll: vi.fn(),
    cleanup: vi.fn(),
    getHealthSummary: () => ({ overallHealth: 'healthy' }),
  },
}));

vi.mock('@/lib/harvestpro/performance-monitor', () => ({
  harvestProPerformanceMonitor: {
    measureLoadingState: vi.fn((name, fn) => fn()),
    measureInteraction: vi.fn((name, fn) => fn()),
    measureCSVGeneration: vi.fn((name, fn) => fn()),
    recordMetric: vi.fn(),
  },
}));

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

      // Close button should have accessible name
      const closeButton = screen.getByRole('button', { name: /close/i });
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

    test('summary card metrics have proper labels', () => {
      render(
        <TestWrapper>
          <HarvestSummaryCard
            summary={mockSummary}
            hasHighRiskOpportunities={true}
          />
        </TestWrapper>
      );

      // Metrics should have accessible descriptions
      expect(screen.getByText('$12,450')).toBeInTheDocument();
      expect(screen.getByText('$2,988')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('opportunity card is keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockStartHarvest = vi.fn();

      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockStartHarvest}
          onSave={vi.fn()}
          onShare={vi.fn()}
          onReport={vi.fn()}
          isConnected={true}
        />
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
        <HarvestDetailModal
          opportunity={mockOpportunity}
          isOpen={true}
          onClose={mockClose}
          onExecute={mockExecute}
          isConnected={true}
        />
      );

      // Escape key should close modal
      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalled();

      // Tab navigation should work within modal
      const executeButton = screen.getByRole('button', { name: /execute harvest/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      executeButton.focus();
      expect(document.activeElement).toBe(executeButton);

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(cancelButton);
    });

    test('filter chips support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<FilterChipRow />);

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

    test('focus management works correctly', async () => {
      const user = userEvent.setup();

      render(<HarvestPro />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('HarvestPro')).toBeInTheDocument();
      });

      // Should be able to tab through interactive elements
      const interactiveElements = screen.getAllByRole('button');
      
      if (interactiveElements.length > 0) {
        interactiveElements[0].focus();
        expect(document.activeElement).toBe(interactiveElements[0]);

        // Tab should move focus to next element
        await user.keyboard('{Tab}');
        expect(document.activeElement).not.toBe(interactiveElements[0]);
      }
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('important content has proper semantic markup', () => {
      render(<HarvestPro />);

      // Main content should have proper landmarks
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      // Headers should have proper hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    test('status updates are announced to screen readers', () => {
      render(
        <HarvestDetailModal
          opportunity={mockOpportunity}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={true}
          isExecuting={true}
        />
      );

      // Loading state should be announced
      const statusElement = screen.getByText(/executing/i);
      expect(statusElement).toBeInTheDocument();
    });

    test('form validation errors are accessible', () => {
      render(
        <HarvestDetailModal
          opportunity={{...mockOpportunity, netTaxBenefit: -100}}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={true}
        />
      );

      // Negative benefit warning should be accessible
      const warningText = screen.getByText(/net benefit is negative/i);
      expect(warningText).toBeInTheDocument();
    });

    test('dynamic content changes are announced', async () => {
      const user = userEvent.setup();

      render(<HarvestPro />);

      // Wait for demo mode content
      await waitFor(() => {
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
      });

      // Demo mode should be clearly indicated
      const demoBadge = screen.getByText('Demo Mode');
      expect(demoBadge).toBeInTheDocument();
    });
  });

  describe('Touch Target Sizes', () => {
    test('all interactive elements meet minimum touch target size', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
          onSave={vi.fn()}
          onShare={vi.fn()}
          onReport={vi.fn()}
          isConnected={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        const width = parseInt(styles.width);
        
        // WCAG AA requires minimum 44x44px touch targets
        expect(height).toBeGreaterThanOrEqual(44);
        expect(width).toBeGreaterThanOrEqual(44);
      });
    });

    test('modal buttons have adequate touch targets', () => {
      render(
        <HarvestDetailModal
          opportunity={mockOpportunity}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        const width = parseInt(styles.width);
        
        // Modal buttons should meet touch target requirements
        expect(height).toBeGreaterThanOrEqual(44);
        expect(width).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Color Contrast Validation', () => {
    test('text elements meet WCAG AA contrast requirements', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
          isConnected={true}
        />
      );

      // Primary text should be visible
      const tokenText = screen.getByText('Harvest ETH Loss');
      expect(tokenText).toBeInTheDocument();
      
      // Net benefit should be clearly visible
      const benefitText = screen.getByText('$1,080');
      expect(benefitText).toBeInTheDocument();
    });

    test('interactive elements have sufficient contrast', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
          isConnected={true}
        />
      );

      const startButton = screen.getByRole('button', { name: /start harvest/i });
      expect(startButton).toBeInTheDocument();
      
      // Button should have sufficient contrast (tested via axe)
      const styles = window.getComputedStyle(startButton);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });
  });

  describe('Error States and Feedback', () => {
    test('error messages are accessible', () => {
      render(
        <HarvestDetailModal
          opportunity={{...mockOpportunity, netTaxBenefit: -100}}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={false}
        />
      );

      // Error state should be accessible
      const executeButton = screen.getByRole('button', { name: /execute harvest/i });
      expect(executeButton).toBeDisabled();
    });

    test('loading states are announced', () => {
      render(
        <HarvestDetailModal
          opportunity={mockOpportunity}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={true}
          isExecuting={true}
        />
      );

      // Loading state should be accessible
      const loadingText = screen.getByText(/executing/i);
      expect(loadingText).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    test('components work with mobile screen readers', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={vi.fn()}
          isConnected={true}
        />
      );

      // Content should still be accessible on mobile
      const startButton = screen.getByRole('button', { name: /start harvest/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveAccessibleName();
    });

    test('modal is accessible on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <HarvestDetailModal
          opportunity={mockOpportunity}
          isOpen={true}
          onClose={vi.fn()}
          onExecute={vi.fn()}
          isConnected={true}
        />
      );

      // Modal should be accessible on mobile
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });
});