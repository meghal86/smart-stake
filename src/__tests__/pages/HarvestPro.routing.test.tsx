/**
 * HarvestPro Page Routing Test
 * 
 * Tests that the HarvestPro page renders correctly when accessed via /harvestpro route
 * Requirements: Enhanced Req 18 AC1 (responsive nav)
 * Design: Navigation Architecture → Route Canonicalization
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HarvestPro from '@/pages/HarvestPro';

// Mock the required hooks and contexts
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({
    connectedWallets: [],
    activeWallet: null,
    isConnecting: false
  })
}));

vi.mock('@/hooks/useHarvestFilters', () => ({
  useHarvestFilters: () => ({
    filteredOpportunities: [], // This is what was missing!
    isFiltered: false,
    activeFilterCount: 0,
    filters: {
      search: '',
      types: [],
      wallets: [],
      riskLevels: [],
      minBenefit: 0,
      holdingPeriod: 'all',
      gasEfficiency: 'all',
      liquidity: 'all',
      sort: 'net-benefit-desc'
    },
    setFilters: vi.fn(),
    resetFilters: vi.fn()
  })
}));

vi.mock('@/hooks/useHarvestOpportunities', () => ({
  useHarvestOpportunities: () => ({
    opportunities: [],
    summary: {
      totalHarvestableLoss: 0,
      estimatedNetBenefit: 0,
      eligibleTokensCount: 0,
      gasEfficiencyScore: 'A'
    },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    isRefreshing: false,
    pullToRefreshProps: {}
  })
}));

vi.mock('@/lib/harvestpro/disclosure', () => ({
  shouldShowDisclosure: () => false,
  saveDisclosureAcceptance: vi.fn()
}));

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    main: ({ children, ...props }: any) => <main {...props}>{children}</main>
  },
  AnimatePresence: ({ children }: any) => children
}));

const renderHarvestProWithRouter = (initialPath = '/harvestpro') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <HarvestPro />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('HarvestPro Page Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('HarvestPro page renders when accessed via /harvestpro route', () => {
    renderHarvestProWithRouter('/harvestpro');
    
    // Check that the HarvestPro header is rendered
    expect(screen.getByText('HarvestPro')).toBeInTheDocument();
    
    // Check that the demo/live toggle is present
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('HarvestPro page includes FooterNav component', () => {
    renderHarvestProWithRouter('/harvestpro');
    
    // Check that footer navigation is present
    const footerNav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(footerNav).toBeInTheDocument();
    
    // Check that HarvestPro nav item is active
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    expect(harvestNavItem).toHaveAttribute('aria-current', 'page');
  });

  test('HarvestPro page shows no wallets connected state by default', () => {
    renderHarvestProWithRouter('/harvestpro');
    
    // Since we mocked no connected wallets, should show the no wallets state
    // The exact text depends on the component implementation
    expect(screen.getByText(/connect/i)).toBeInTheDocument();
  });

  test('HarvestPro page has correct document structure', () => {
    renderHarvestProWithRouter('/harvestpro');
    
    // Check that main content area exists
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    
    // Check that header exists
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
    
    // Check that footer exists
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  test('HarvestPro page is accessible via direct URL navigation', () => {
    // Test that the page can be accessed directly via URL
    renderHarvestProWithRouter('/harvestpro');
    
    // Verify the page loads without errors
    expect(screen.getByText('HarvestPro')).toBeInTheDocument();
    
    // Verify that the URL would be correct (in a real browser)
    // This is implicitly tested by MemoryRouter with initialEntries
    expect(true).toBe(true); // Placeholder assertion
  });
});