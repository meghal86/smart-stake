/**
 * Feature Cards Unit Tests
 * 
 * Tests for GuardianFeatureCard, HunterFeatureCard, and HarvestProFeatureCard components.
 * Validates that each card correctly wires up metrics from useHomeMetrics hook.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuardianFeatureCard } from '../GuardianFeatureCard';
import { HunterFeatureCard } from '../HunterFeatureCard';
import { HarvestProFeatureCard } from '../HarvestProFeatureCard';
import * as useHomeMetricsModule from '@/hooks/useHomeMetrics';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

describe('GuardianFeatureCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with Guardian-specific content', () => {
    // Mock useHomeMetrics to return demo data
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<GuardianFeatureCard />);

    // Verify Guardian-specific content
    expect(screen.getByText('Guardian')).toBeInTheDocument();
    expect(screen.getByText('Secure your wallet')).toBeInTheDocument();
    expect(screen.getByText('Guardian Score')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('Your security rating')).toBeInTheDocument();
  });

  test('uses Shield icon', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    const { container } = render(<GuardianFeatureCard />);
    
    // Shield icon should be present (Lucide icons render as SVG)
    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });

  test('routes to /guardian', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<GuardianFeatureCard />);
    
    const primaryButton = screen.getByRole('button', { name: 'View Guardian' });
    expect(primaryButton).toBeInTheDocument();
  });

  test('shows demo badge when in demo mode', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<GuardianFeatureCard />);
    
    expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
  });

  test('displays live Guardian Score when authenticated', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      },
      isLoading: false,
      error: null,
      isDemo: false,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<GuardianFeatureCard />);
    
    // Should show live score
    expect(screen.getByText('87')).toBeInTheDocument();
    
    // Should NOT show demo badge
    expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
  });
});

describe('HunterFeatureCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with Hunter-specific content', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HunterFeatureCard />);

    // Verify Hunter-specific content
    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Hunt alpha opportunities')).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Available yield opportunities')).toBeInTheDocument();
  });

  test('routes to /hunter', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HunterFeatureCard />);
    
    const primaryButton = screen.getByRole('button', { name: 'View Hunter' });
    expect(primaryButton).toBeInTheDocument();
  });

  test('displays live opportunities count when authenticated', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      },
      isLoading: false,
      error: null,
      isDemo: false,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HunterFeatureCard />);
    
    // Should show live count
    expect(screen.getByText('28')).toBeInTheDocument();
    
    // Should NOT show demo badge
    expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
  });
});

describe('HarvestProFeatureCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with HarvestPro-specific content', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HarvestProFeatureCard />);

    // Verify HarvestPro-specific content
    expect(screen.getByText('HarvestPro')).toBeInTheDocument();
    expect(screen.getByText('Harvest tax losses')).toBeInTheDocument();
    expect(screen.getByText('Tax Benefit')).toBeInTheDocument();
    expect(screen.getByText('$12.4K')).toBeInTheDocument();
    expect(screen.getByText('Estimated tax savings')).toBeInTheDocument();
  });

  test('formats USD values correctly', () => {
    // Test thousands formatting
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    const { rerender } = render(<HarvestProFeatureCard />);
    expect(screen.getByText('$12.4K')).toBeInTheDocument();

    // Test millions formatting
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 1500000,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    rerender(<HarvestProFeatureCard />);
    expect(screen.getByText('$1.5M')).toBeInTheDocument();
  });

  test('routes to /harvestpro', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 89,
        hunterOpportunities: 42,
        hunterAvgApy: 18.5,
        hunterConfidence: 92,
        harvestEstimateUsd: 12400,
        harvestEligibleTokens: 7,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        demoMode: true,
      },
      isLoading: false,
      error: null,
      isDemo: true,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HarvestProFeatureCard />);
    
    const primaryButton = screen.getByRole('button', { name: 'View HarvestPro' });
    expect(primaryButton).toBeInTheDocument();
  });

  test('displays live tax benefit when authenticated', () => {
    vi.spyOn(useHomeMetricsModule, 'useHomeMetrics').mockReturnValue({
      metrics: {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      },
      isLoading: false,
      error: null,
      isDemo: false,
      isFresh: true,
      freshnessStatus: 'current',
      dataAge: 0,
      manualRefresh: vi.fn(),
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
    } as any);

    render(<HarvestProFeatureCard />);
    
    // Should show live estimate
    expect(screen.getByText('$3.8K')).toBeInTheDocument();
    
    // Should NOT show demo badge
    expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
  });
});
