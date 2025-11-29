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

    test('renders platform statistics heading', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
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

      const badgeItems = container.querySelectorAll('[role="list"][aria-label="Trust badges"] [role="listitem"]');
      expect(badgeItems).toHaveLength(4);
    });
  });

  describe('Platform Statistics', () => {
    test('displays all 3 statistics when loaded', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      // Check that all stats are displayed
      expect(screen.getByTestId('stat-wallets-protected')).toBeInTheDocument();
      expect(screen.getByTestId('stat-yield-optimized')).toBeInTheDocument();
      expect(screen.getByTestId('stat-avg-score')).toBeInTheDocument();
    });

    test('formats wallets protected with commas', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      const walletsProtected = screen.getByTestId('stat-wallets-protected');
      expect(walletsProtected).toHaveTextContent('50,000');
    });

    test('formats yield optimized as millions', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      const yieldOptimized = screen.getByTestId('stat-yield-optimized');
      expect(yieldOptimized).toHaveTextContent('$12.4M');
    });

    test('displays average guardian score as number', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      const avgScore = screen.getByTestId('stat-avg-score');
      expect(avgScore).toHaveTextContent('85');
    });

    test('displays stat labels', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.getByText('Wallets Protected')).toBeInTheDocument();
      expect(screen.getByText('Yield Optimized')).toBeInTheDocument();
      expect(screen.getByText('Avg Guardian Score')).toBeInTheDocument();
    });

    test('statistics have proper ARIA role', () => {
      const { container } = render(<TrustBuilders metrics={defaultMetrics} />);

      const statsList = container.querySelector('[role="list"][aria-label="Platform statistics"]');
      expect(statsList).toBeInTheDocument();

      const statItems = container.querySelectorAll('[role="list"][aria-label="Platform statistics"] [role="listitem"]');
      expect(statItems).toHaveLength(3);
    });
  });

  describe('Loading State', () => {
    test('shows skeleton loaders when isLoading is true', () => {
      render(<TrustBuilders metrics={defaultMetrics} isLoading={true} />);

      // Skeleton should be shown
      expect(screen.getByRole('status', { name: /loading trust statistics/i })).toBeInTheDocument();

      // Stats should not be shown
      expect(screen.queryByTestId('stat-wallets-protected')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stat-yield-optimized')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stat-avg-score')).not.toBeInTheDocument();
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
    test('displays fallback values when error exists', () => {
      render(<TrustBuilders metrics={defaultMetrics} error="Failed to load" />);

      // Should show fallback values
      const walletsProtected = screen.getByTestId('stat-wallets-protected');
      const yieldOptimized = screen.getByTestId('stat-yield-optimized');
      const avgScore = screen.getByTestId('stat-avg-score');

      expect(walletsProtected).toHaveTextContent('10,000');
      expect(yieldOptimized).toHaveTextContent('$5.0M');
      expect(avgScore).toHaveTextContent('85');
    });

    test('displays error indicator message', () => {
      render(<TrustBuilders metrics={defaultMetrics} error="Failed to load" />);

      expect(screen.getByText('Showing approximate values')).toBeInTheDocument();
    });

    test('error indicator has proper ARIA attributes', () => {
      render(<TrustBuilders metrics={defaultMetrics} error="Failed to load" />);

      const errorIndicator = screen.getByText('Showing approximate values');
      expect(errorIndicator).toHaveAttribute('role', 'status');
      expect(errorIndicator).toHaveAttribute('aria-live', 'polite');
    });

    test('does not show error indicator when no error', () => {
      render(<TrustBuilders metrics={defaultMetrics} />);

      expect(screen.queryByText('Showing approximate values')).not.toBeInTheDocument();
    });
  });

  describe('Fallback Values', () => {
    test('uses fallback values when metrics is undefined', () => {
      // @ts-expect-error Testing undefined metrics
      render(<TrustBuilders metrics={undefined} />);

      const walletsProtected = screen.getByTestId('stat-wallets-protected');
      const yieldOptimized = screen.getByTestId('stat-yield-optimized');
      const avgScore = screen.getByTestId('stat-avg-score');

      expect(walletsProtected).toHaveTextContent('10,000');
      expect(yieldOptimized).toHaveTextContent('$5.0M');
      expect(avgScore).toHaveTextContent('85');
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

      expect(screen.getByTestId('stat-wallets-protected')).toHaveTextContent('123,456');
      expect(screen.getByTestId('stat-yield-optimized')).toHaveTextContent('$789,000');
    });

    test('formats numbers over 1 million as M', () => {
      const metrics = {
        totalWalletsProtected: 1500000,
        totalYieldOptimizedUsd: 25600000,
        averageGuardianScore: 88,
      };

      render(<TrustBuilders metrics={metrics} />);

      expect(screen.getByTestId('stat-wallets-protected')).toHaveTextContent('1,500,000');
      expect(screen.getByTestId('stat-yield-optimized')).toHaveTextContent('$25.6M');
    });

    test('handles zero values', () => {
      const metrics = {
        totalWalletsProtected: 0,
        totalYieldOptimizedUsd: 0,
        averageGuardianScore: 0,
      };

      render(<TrustBuilders metrics={metrics} />);

      expect(screen.getByTestId('stat-wallets-protected')).toHaveTextContent('0');
      expect(screen.getByTestId('stat-yield-optimized')).toHaveTextContent('$0');
      expect(screen.getByTestId('stat-avg-score')).toHaveTextContent('0');
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
});
