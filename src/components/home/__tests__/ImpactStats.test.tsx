import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ImpactStats } from '../ImpactStats';

// Mock IntersectionObserver for Framer Motion
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Mock the MetricsProof component
vi.mock('@/components/ux/MetricsProof', () => ({
  InlineMetricsProof: ({ children, metricType }: { children: React.ReactNode; metricType: string }) => (
    <button data-testid={`metrics-proof-${metricType}`}>
      {children}
    </button>
  ),
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

// Wrapper for router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ImpactStats', () => {
  test('renders section heading', () => {
    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Platform Metrics')).toBeInTheDocument();
    expect(screen.getByText('Click to view detailed breakdown')).toBeInTheDocument();
  });

  test('renders all three stat cards', () => {
    renderWithRouter(<ImpactStats />);
    
    // Check for stat labels
    expect(screen.getByText('Assets Protected')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Avg Annual Savings')).toBeInTheDocument();
  });

  test('expands stat card on click', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    // Initially, breakdown should not be visible
    expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(firstCard);
    
    // Breakdown should now be visible
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
      expect(screen.getByText('$89M')).toBeVisible();
      expect(screen.getByText('$142M')).toBeVisible();
    });
  });

  test('shows "How it\'s calculated" link when expanded', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    // Click to expand
    fireEvent.click(firstCard);
    
    // "How it's calculated" link should be visible
    await waitFor(() => {
      expect(screen.getByTestId('metrics-proof-assets_protected')).toBeInTheDocument();
      expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
    });
  });

  test('collapses stat card on second click', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    // Expand
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Collapse
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });

  test('only one stat card expanded at a time', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    const secondCard = screen.getByLabelText(/Active Users/i);
    
    // Expand first card
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Expand second card
    fireEvent.click(secondCard);
    await waitFor(() => {
      expect(screen.getByText('Daily active users')).toBeVisible();
      // First card should now be collapsed
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });

  test('stat cards have proper ARIA attributes', () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    expect(firstCard).toHaveAttribute('role', 'button');
    expect(firstCard).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(firstCard);
    
    expect(firstCard).toHaveAttribute('aria-expanded', 'true');
  });

  test('displays all breakdown items when expanded', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    fireEvent.click(firstCard);
    
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
      expect(screen.getByText('Rug pulls detected')).toBeVisible();
      expect(screen.getByText('Bad APY avoided')).toBeVisible();
    });
  });

  test('keyboard navigation works for stat cards', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    // Press Enter to expand
    fireEvent.keyDown(firstCard, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Press Space to collapse
    fireEvent.keyDown(firstCard, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });

  test('each metric type has correct proof link', async () => {
    renderWithRouter(<ImpactStats />);
    
    // Expand Assets Protected card
    const assetsCard = screen.getByLabelText(/Assets Protected/i);
    fireEvent.click(assetsCard);
    
    await waitFor(() => {
      expect(screen.getByTestId('metrics-proof-assets_protected')).toBeInTheDocument();
    });
    
    // Collapse and expand Active Users card
    fireEvent.click(assetsCard);
    const usersCard = screen.getByLabelText(/Active Users/i);
    fireEvent.click(usersCard);
    
    await waitFor(() => {
      expect(screen.getByTestId('metrics-proof-wallets_protected')).toBeInTheDocument();
    });
    
    // Collapse and expand Avg Annual Savings card
    fireEvent.click(usersCard);
    const savingsCard = screen.getByLabelText(/Avg Annual Savings/i);
    fireEvent.click(savingsCard);
    
    await waitFor(() => {
      expect(screen.getByTestId('metrics-proof-yield_optimized')).toBeInTheDocument();
    });
  });

  test('displays click hint when collapsed', () => {
    renderWithRouter(<ImpactStats />);
    
    // All cards should show "Click to view" when collapsed
    const clickHints = screen.getAllByText('Click to view');
    expect(clickHints).toHaveLength(3);
  });

  test('hides click hint when expanded', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Assets Protected/i);
    
    // Initially should show click hint
    expect(screen.getAllByText('Click to view')).toHaveLength(3);
    
    // Expand card
    fireEvent.click(firstCard);
    
    await waitFor(() => {
      // Should now have one less click hint
      expect(screen.getAllByText('Click to view')).toHaveLength(2);
    });
  });

  test('displays last updated timestamp when available', () => {
    renderWithRouter(<ImpactStats />);
    
    // Should display the timestamp
    expect(screen.getByText('Updated 1 minute ago')).toBeInTheDocument();
    
    // Should display clock icon
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  test('displays "Data unavailable" when there is an error', () => {
    const { useHomeMetrics } = vi.mocked(require('@/hooks/useHomeMetrics'));
    useHomeMetrics.mockReturnValue({
      metrics: null,
      isLoading: false,
      error: new Error('API failed'),
      freshnessStatus: 'outdated',
      dataAge: null,
      isDemo: false,
    });

    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Data unavailable')).toBeInTheDocument();
  });

  test('displays "Timestamp unavailable" when no lastUpdated field', () => {
    const { useHomeMetrics } = vi.mocked(require('@/hooks/useHomeMetrics'));
    useHomeMetrics.mockReturnValue({
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

    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Timestamp unavailable')).toBeInTheDocument();
  });

  test('displays demo mode badge when in demo mode', () => {
    const { useHomeMetrics } = vi.mocked(require('@/hooks/useHomeMetrics'));
    useHomeMetrics.mockReturnValue({
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

    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  test('displays loading state for timestamp', () => {
    const { useHomeMetrics } = vi.mocked(require('@/hooks/useHomeMetrics'));
    useHomeMetrics.mockReturnValue({
      metrics: null,
      isLoading: true,
      error: null,
      freshnessStatus: 'outdated',
      dataAge: null,
      isDemo: false,
    });

    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
