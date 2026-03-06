import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Hunter from '@/pages/Hunter';

const mockUseDemoMode = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate: _animate, initial: _initial, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, animate: _animate, initial: _initial, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    actualTheme: 'dark',
  }),
}));

vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({
    connectedWallets: [{ address: '0x123' }],
    activeWallet: '0x123',
  }),
}));

vi.mock('@/lib/ux/DemoModeManager', () => ({
  useDemoMode: () => mockUseDemoMode(),
}));

vi.mock('@/hooks/useHunterFeed', () => ({
  useHunterFeed: () => ({
    opportunities: [
      {
        id: 'opp-1',
        type: 'Airdrop',
        title: 'Bridge and claim',
        description: 'Sample opportunity',
        reward: '$150',
        confidence: 90,
        duration: '15 min',
        guardianScore: 8.7,
        riskLevel: 'Low',
      },
    ],
    isLoading: false,
    lastUpdated: '2026-03-06T12:00:00.000Z',
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
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

vi.mock('@/components/hunter/HunterTabs', () => ({
  HunterTabs: ({ activeTab }: { activeTab: string }) => <div data-testid="hunter-tabs">Tabs {activeTab}</div>,
}));

vi.mock('@/components/hunter/RightRail', () => ({
  RightRail: () => <aside data-testid="right-rail">Right Rail</aside>,
}));

vi.mock('@/components/hunter/OpportunityCard', () => ({
  OpportunityCard: ({ opportunity }: { opportunity: { title: string } }) => (
    <article>{opportunity.title}</article>
  ),
}));

vi.mock('@/components/hunter/OpportunityCardSkeleton', () => ({
  OpportunityGridSkeleton: () => <div>Loading opportunities</div>,
}));

vi.mock('@/components/hunter/EmptyState', () => ({
  EmptyState: ({ filter }: { filter: string }) => <div>No results for {filter}</div>,
}));

vi.mock('@/components/hunter/ExecuteQuestModal', () => ({
  ExecuteQuestModal: () => null,
}));

vi.mock('@/components/ui/PullToRefreshIndicator', () => ({
  PullToRefreshIndicator: () => null,
}));

describe('Hunter Page Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDemoMode.mockReturnValue({
      isDemo: false,
      setDemoMode: vi.fn(),
    });
  });

  it('renders the new Hunter shell with shared header and footer', () => {
    render(<Hunter />);

    expect(screen.getByTestId('global-header')).toBeInTheDocument();
    expect(screen.getByText('Find the next wallet-ready move.')).toBeInTheDocument();
    expect(screen.getByText(/review filtered opportunities/i)).toBeInTheDocument();
    expect(screen.getByTestId('hunter-tabs')).toHaveTextContent('Tabs All');
    expect(screen.getByTestId('right-rail')).toBeInTheDocument();
    expect(screen.getByTestId('footer-nav')).toHaveTextContent('Footer /hunter');
  });

  it('renders live-mode helper copy and feed content', () => {
    render(<Hunter />);

    expect(screen.getByText('Ask Hunter AI')).toBeInTheDocument();
    expect(screen.getByText('Bridge and claim')).toBeInTheDocument();
    expect(screen.getAllByText('Live').length).toBeGreaterThan(0);
    expect(screen.getByText(/authenticated wallet-aware feed/i)).toBeInTheDocument();
  });

  it('shows the demo banner when demo mode is enabled', () => {
    mockUseDemoMode.mockReturnValue({
      isDemo: true,
      setDemoMode: vi.fn(),
    });

    render(<Hunter />);

    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    expect(screen.getAllByText(/showing simulated opportunities/i).length).toBeGreaterThan(0);
  });
});
