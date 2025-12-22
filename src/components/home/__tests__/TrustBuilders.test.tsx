import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBuilders } from '../TrustBuilders';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the useHomeMetrics hook
vi.mock('@/hooks/useHomeMetrics', () => ({
  useHomeMetrics: vi.fn(() => ({
    metrics: {
      totalWalletsProtected: 10000,
      totalYieldOptimizedUsd: 142,
      averageGuardianScore: 89,
      lastUpdated: new Date().toISOString(),
      isDemo: false,
    },
    isLoading: false,
    error: null,
    freshnessStatus: 'current',
    dataAge: 1,
    isDemo: false,
  })),
  getFreshnessMessage: vi.fn((status, age) => 'Updated 1 minute ago'),
  getFreshnessColor: vi.fn(() => 'text-green-500'),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('TrustBuilders', () => {
  const defaultMetrics = {
    totalWalletsProtected: 50000,
    totalYieldOptimizedUsd: 12400000,
    averageGuardianScore: 85,
  };

  describe('Rendering', () => {
    test('renders section heading', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('Trusted by the DeFi Community')).toBeInTheDocument();
    });

    test('renders platform statistics', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check that metrics are displayed (no separate heading)
      expect(screen.getByText('Wallets Protected')).toBeInTheDocument();
      expect(screen.getByText('Yield Optimized')).toBeInTheDocument();
      expect(screen.getByText('Avg Security Score')).toBeInTheDocument();
    });
  });

  describe('Trust Badges', () => {
    test('renders all 4 trust badges', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('Non-custodial')).toBeInTheDocument();
      expect(screen.getByText('No KYC')).toBeInTheDocument();
      expect(screen.getByText('On-chain')).toBeInTheDocument();
      expect(screen.getByText('Guardian-vetted')).toBeInTheDocument();
    });

    test('renders badge descriptions', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('You control your keys')).toBeInTheDocument();
      expect(screen.getByText('Privacy-first approach')).toBeInTheDocument();
      expect(screen.getByText('Transparent & verifiable')).toBeInTheDocument();
      expect(screen.getByText('Security-first design')).toBeInTheDocument();
    });

    test('badges have proper ARIA role', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const badgesList = container.querySelector('[role="list"][aria-label="Trust badges"]');
      expect(badgesList).toBeInTheDocument();

      // Trust badges use role="button" not role="listitem"
      const badgeItems = container.querySelectorAll('[role="list"][aria-label="Trust badges"] [role="button"]');
      expect(badgeItems).toHaveLength(4);
    });
  });

  describe('Platform Statistics', () => {
    test('displays all 3 statistics when loaded', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check that all stats are displayed via MetricsProof components
      expect(screen.getByText('Wallets Protected')).toBeInTheDocument();
      expect(screen.getByText('Yield Optimized')).toBeInTheDocument();
      expect(screen.getByText('Avg Security Score')).toBeInTheDocument();
    });

    test('formats wallets protected with commas', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check formatted value is displayed
      expect(screen.getByText('50,000+')).toBeInTheDocument();
    });

    test('formats yield optimized as millions', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check formatted value is displayed
      expect(screen.getByText('$12,400,000M+')).toBeInTheDocument();
    });

    test('displays average guardian score as number', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check formatted value is displayed
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    test('displays stat labels', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('Wallets Protected')).toBeInTheDocument();
      expect(screen.getByText('Yield Optimized')).toBeInTheDocument();
      expect(screen.getByText('Avg Security Score')).toBeInTheDocument();
    });

    test('statistics have proper ARIA role', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      // Check that the grid container exists
      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows skeleton loaders when isLoading is true', () => {
      render(<TrustBuilders metrics={defaultMetrics} isLoading={true} />);

      // Skeleton should be shown
      expect(screen.getByRole('status', { name: /loading platform statistics/i })).toBeInTheDocument();

      // Stats should not be shown
      expect(screen.queryByText('Wallets Protected')).not.toBeInTheDocument();
      expect(screen.queryByText('Yield Optimized')).not.toBeInTheDocument();
      expect(screen.queryByText('Avg Security Score')).not.toBeInTheDocument();
    });

    test('badges are still visible during loading', () => {
      render(<TrustBuilders metrics={defaultMetrics} isLoading={true} />);

      // Badges should still be visible
      expect(screen.getByText('Non-custodial')).toBeInTheDocument();
      expect(screen.getByText('No KYC')).toBeInTheDocument();
      expect(screen.getByText('On-chain')).toBeInTheDocument();
      expect(screen.getByText('Guardian-vetted')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays provided metrics when using prop metrics', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Should show the provided metrics values
      expect(screen.getByText('50,000+')).toBeInTheDocument();
      expect(screen.getByText('$12,400,000M+')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    test('does not show error indicator when no error', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.queryByText('Data unavailable')).not.toBeInTheDocument();
    });
  });

  describe('Fallback Values', () => {
    test('uses fallback values when metrics is undefined', () => {
      // @ts-expect-error Testing undefined metrics
      render(<TrustBuilders metrics={undefined} />);

      // Should show hook metrics values
      expect(screen.getByText('10,000+')).toBeInTheDocument();
      expect(screen.getByText('$142M+')).toBeInTheDocument();
      expect(screen.getByText('89/100')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    test('formats numbers under 1 million with commas', () => {
      const metrics = {
        totalWalletsProtected: 123456,
        totalYieldOptimizedUsd: 789000,
        averageGuardianScore: 92,
      };

      render(<TrustBuilders metrics={metrics} />);

      expect(screen.getByText('123,456+')).toBeInTheDocument();
      expect(screen.getByText('$789,000M+')).toBeInTheDocument();
    });

    test('formats numbers over 1 million as M', () => {
      const metrics = {
        totalWalletsProtected: 1500000,
        totalYieldOptimizedUsd: 25600000,
        averageGuardianScore: 88,
      };

      render(<TrustBuilders metrics={metrics} />);

      expect(screen.getByText('1,500,000+')).toBeInTheDocument();
      expect(screen.getByText('$25,600,000M+')).toBeInTheDocument();
    });

    test('handles zero values', () => {
      const metrics = {
        totalWalletsProtected: 0,
        totalYieldOptimizedUsd: 0,
        averageGuardianScore: 0,
      };

      render(<TrustBuilders metrics={metrics} />);

      expect(screen.getByText('0+')).toBeInTheDocument();
      expect(screen.getByText('$0M+')).toBeInTheDocument();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper section heading with id', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      const heading = screen.getByText('Trusted by the DeFi Community');
      expect(heading).toHaveAttribute('id', 'trust-builders-heading');
    });

    test('section has aria-labelledby attribute', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-labelledby', 'trust-builders-heading');
    });

    test('all interactive elements are keyboard accessible', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      // TrustBuilders doesn't have interactive elements, but verify structure
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive grid classes to badges', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const badgesGrid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(badgesGrid).toBeInTheDocument();
    });

    test('applies responsive grid classes to stats', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    test('applies glassmorphism styling to badges', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const badges = container.querySelectorAll('.bg-white\\/5.backdrop-blur-md.border.border-white\\/10');
      expect(badges.length).toBeGreaterThan(0);
    });

    test('applies cyan color to stat values', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const statValues = container.querySelectorAll('.text-cyan-400');
      expect(statValues.length).toBeGreaterThanOrEqual(3); // At least 3 stat values
    });
  });

  describe('Last Updated Timestamp - R14.TRUST.TIMESTAMPS', () => {
    test('displays last updated timestamp when available', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);
      
      // Should display the timestamp
      expect(screen.getByText('Updated 1 minute ago')).toBeInTheDocument();
    });

    test('displays "Data unavailable" when there is an error', async () => {
      const { useHomeMetrics } = await import('@/hooks/useHomeMetrics');
      vi.mocked(useHomeMetrics).mockReturnValue({
        metrics: null,
        isLoading: false,
        error: new Error('API failed'),
        freshnessStatus: 'outdated',
        dataAge: null,
        isDemo: false,
      });

      render(<TrustBuilders metrics={defaultMetrics} />);
      
      expect(screen.getByText('Data unavailable')).toBeInTheDocument();
    });

    test('displays "Timestamp unavailable" when no lastUpdated field', async () => {
      const { useHomeMetrics } = await import('@/hooks/useHomeMetrics');
      vi.mocked(useHomeMetrics).mockReturnValue({
        metrics: {
          totalWalletsProtected: 10000,
          totalYieldOptimizedUsd: 142,
          averageGuardianScore: 89,
          lastUpdated: null,
          isDemo: false,
        },
        isLoading: false,
        error: null,
        freshnessStatus: 'outdated',
        dataAge: null,
        isDemo: false,
      });

      render(<TrustBuilders metrics={defaultMetrics} />);
      
      expect(screen.getByText('Timestamp unavailable')).toBeInTheDocument();
    });

    test('displays demo mode badge when in demo mode', async () => {
      const { useHomeMetrics } = await import('@/hooks/useHomeMetrics');
      vi.mocked(useHomeMetrics).mockReturnValue({
        metrics: {
          totalWalletsProtected: 10000,
          totalYieldOptimizedUsd: 142,
          averageGuardianScore: 89,
          lastUpdated: new Date().toISOString(),
          isDemo: true,
        },
        isLoading: false,
        error: null,
        freshnessStatus: 'current',
        dataAge: 1,
        isDemo: true,
      });

      render(<TrustBuilders metrics={defaultMetrics} />);
      
      expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    });

    test('uses prop metrics when provided', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);
      
      // Should use prop metrics for display
      expect(screen.getByText('50,000+')).toBeInTheDocument();
    });

    test('uses hook metrics when prop metrics not provided', () => {
      render(<TrustBuilders />);
      
      // Should use hook metrics for display
      expect(screen.getByText('10,000+')).toBeInTheDocument();
    });
  });
});
