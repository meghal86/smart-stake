import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HarvestPro from '@/pages/HarvestPro';

const mockUseDemoMode = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/ux/DemoModeManager', () => ({
  useDemoMode: () => mockUseDemoMode(),
}));

vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({
    connectedWallets: [],
    activeWallet: null,
    isAuthenticated: false,
  }),
}));

vi.mock('@/hooks/useHarvestFilters', () => ({
  useHarvestFilters: () => ({
    filteredOpportunities: [],
    isFiltered: false,
    activeFilterCount: 0,
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

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    threshold: 80,
  }),
}));

vi.mock('@/lib/harvestpro/service-availability', () => ({
  HarvestProService: {},
  serviceAvailability: {
    startMonitoringAll: vi.fn(),
    cleanup: vi.fn(),
    getHealthSummary: () => ({ overallHealth: 'healthy' }),
  },
}));

vi.mock('@/lib/harvestpro/performance-monitor', () => ({
  harvestProPerformanceMonitor: {
    measureLoadingState: (_label: string, fn: () => void) => fn(),
    measureInteraction: (_label: string, fn: () => void) => fn(),
    measureCSVGeneration: (_label: string, fn: () => void) => fn(),
  },
}));

vi.mock('@/components/header/GlobalHeader', () => ({
  GlobalHeader: ({ className }: { className?: string }) => (
    <div data-testid="global-header" className={className}>
      Global Header
    </div>
  ),
}));

vi.mock('@/components/layout/FooterNav', () => ({
  FooterNav: ({ currentRoute }: { currentRoute?: string }) => (
    <footer data-testid="footer-nav">Footer {currentRoute}</footer>
  ),
}));

vi.mock('@/components/ui/PullToRefreshIndicator', () => ({
  PullToRefreshIndicator: () => null,
}));

vi.mock('@/components/harvestpro/HarvestProErrorBoundary', () => ({
  HarvestProErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/harvestpro', () => ({
  FilterChipRow: () => <div data-testid="filter-chip-row">Filter chips</div>,
  HarvestSummaryCard: () => <div>Summary card</div>,
  HarvestOpportunityCard: () => <div>Opportunity card</div>,
  HarvestDetailModal: () => null,
  HarvestSuccessScreen: () => null,
  SummaryCardSkeleton: () => <div>Summary loading</div>,
  OpportunityCardSkeletonGrid: () => <div>Opportunity loading</div>,
  NoWalletsConnected: () => <div>No Wallets Connected</div>,
  NoOpportunitiesDetected: () => <div>No Opportunities Detected</div>,
  AllOpportunitiesHarvested: () => <div>All Opportunities Harvested</div>,
  APIFailureFallback: () => <div>API Failure</div>,
}));

const renderHarvestProWithRouter = (initialPath = '/harvestpro') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <HarvestPro />
    </MemoryRouter>
  );

describe('HarvestPro Page Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDemoMode.mockReturnValue({
      isDemo: false,
      setDemoMode: vi.fn(),
    });
  });

  test('renders the new HarvestPro shell at /harvestpro', () => {
    renderHarvestProWithRouter('/harvestpro');

    expect(screen.getByTestId('global-header')).toBeInTheDocument();
    expect(screen.getByText('Tax-aware exits, without noise.')).toBeInTheDocument();
    expect(screen.getByText(/review live harvesting opportunities/i)).toBeInTheDocument();
    expect(screen.getByTestId('filter-chip-row')).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toHaveTextContent('Footer /harvestpro');
  });

  test('shows the current empty-state content when there are no opportunities', () => {
    renderHarvestProWithRouter('/harvestpro');

    expect(screen.getByText('No Opportunities Detected')).toBeInTheDocument();
  });

  test('renders live-mode helper copy when demo mode is off', () => {
    renderHarvestProWithRouter('/harvestpro');

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText(/authenticated harvesting dataset/i)).toBeInTheDocument();
  });

  test('renders demo-mode helper copy when demo mode is on', () => {
    mockUseDemoMode.mockReturnValue({
      isDemo: true,
      setDemoMode: vi.fn(),
    });

    renderHarvestProWithRouter('/harvestpro');

    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getByText(/showing simulated opportunities/i)).toBeInTheDocument();
  });
});
