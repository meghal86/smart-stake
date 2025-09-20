import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PredictionsScenarios from '@/pages/PredictionsScenarios';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePredictionOutcomes } from '@/hooks/usePredictionOutcomes';
import { usePredictionClusters } from '@/hooks/usePredictionClusters';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useSubscription');
vi.mock('@/hooks/usePredictionOutcomes');
vi.mock('@/hooks/usePredictionClusters');
vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/analytics');

const mockPredictions = [
  {
    id: 'pred_1',
    timestamp: '2025-01-21T10:00:00Z',
    asset: 'ETH',
    chain: 'ethereum',
    prediction_type: 'whale_activity',
    confidence: 0.85,
    predicted_value: 1,
    features: {
      whale_volume: 0.8,
      market_sentiment: 0.7,
      technical_indicators: 0.75
    },
    explanation: 'Strong whale accumulation detected'
  }
];

const mockOutcomes = [
  {
    prediction_id: 'pred_1',
    realized_return: 0.032,
    was_correct: true,
    realized_ts: '2025-01-21T16:00:00Z'
  }
];

const mockClusters = [
  {
    id: 'cluster_1',
    label: 'ETH Upside Cluster',
    assets: ['ETH', 'BTC'],
    signal_count: 3,
    direction: 'long' as const,
    confidence: 0.85,
    rationale: 'Strong accumulation pattern'
  }
];

describe('PredictionsScenarios', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user_1' },
      loading: false
    } as any);

    vi.mocked(useSubscription).mockReturnValue({
      canAccessFeature: vi.fn().mockReturnValue(true)
    } as any);

    vi.mocked(usePredictionOutcomes).mockReturnValue({
      outcomes: mockOutcomes,
      loading: false
    });

    vi.mocked(usePredictionClusters).mockReturnValue({
      clusters: mockClusters,
      loading: false
    });

    // Mock Supabase function
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ predictions: mockPredictions })
    });
  });

  it('renders predictions page with header', async () => {
    render(<PredictionsScenarios />);
    
    expect(screen.getByText('Predictions & Scenarios')).toBeInTheDocument();
    expect(screen.getByText('AI-powered whale behavior analysis')).toBeInTheDocument();
  });

  it('displays prediction clusters', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      expect(screen.getByText('Signal Clusters')).toBeInTheDocument();
      expect(screen.getByText('ETH Upside Cluster')).toBeInTheDocument();
    });
  });

  it('shows outcome badges for predictions with results', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      expect(screen.getByText('✓ +3.2%')).toBeInTheDocument();
    });
  });

  it('displays confidence bars instead of plain percentages', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      // Check for confidence bar element
      expect(document.querySelector('.bg-cyan-400')).toBeInTheDocument();
    });
  });

  it('filters predictions when cluster is clicked', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      const clusterCard = screen.getByText('ETH Upside Cluster');
      fireEvent.click(clusterCard);
    });

    // Should show clear filter button
    await waitFor(() => {
      expect(screen.getByText('Clear Filter')).toBeInTheDocument();
    });
  });

  it('opens alert creation dialog', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      const alertButton = screen.getByText('Alert');
      fireEvent.click(alertButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Create Alert')).toBeInTheDocument();
    });
  });

  it('shows export buttons in header', async () => {
    render(<PredictionsScenarios />);
    
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  it('displays educational tooltips', async () => {
    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      expect(screen.getByText('Why this matters')).toBeInTheDocument();
    });
  });

  it('shows upgrade prompt for non-premium users', () => {
    vi.mocked(useSubscription).mockReturnValue({
      canAccessFeature: vi.fn().mockReturnValue(false)
    } as any);

    render(<PredictionsScenarios />);
    
    expect(screen.getByText('Premium Feature')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
  });

  it('handles mobile accordion for feature importance', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<PredictionsScenarios />);
    
    await waitFor(() => {
      expect(screen.getByText('Feature Importance')).toBeInTheDocument();
    });
  });

  it('shows mobile FAB for scenario builder', () => {
    render(<PredictionsScenarios />);
    
    // Check for FAB button (Plus icon)
    const fabButton = document.querySelector('.fixed.bottom-5.right-5');
    expect(fabButton).toBeInTheDocument();
  });
});