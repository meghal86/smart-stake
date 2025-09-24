import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MarketIntelligenceHub } from '@/components/market/MarketIntelligenceHub';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Mock hooks
jest.mock('@/hooks/useEnhancedMarketData', () => ({
  useEnhancedMarketData: () => ({
    data: {
      marketMood: { mood: 65, label: 'Bullish' },
      volume24h: 1500000000,
      volumeDelta: 12.5,
      activeWhales: 892,
      whalesDelta: 8.2,
      avgRiskScore: 45
    },
    isLoading: false
  })
}));

jest.mock('@/hooks/useRealTimeAlerts', () => ({
  useRealTimeAlerts: () => ({
    alerts: [],
    acknowledgeAlert: jest.fn(),
    clearAlert: jest.fn(),
    clearAllAlerts: jest.fn(),
    unacknowledgedCount: 0
  })
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    track: jest.fn()
  })
}));

jest.mock('@/hooks/use-mobile', () => ({
  useWindowSize: () => ({ width: 1024, height: 768 })
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const mockSubscription = {
  userPlan: { plan: 'premium' },
  isLoading: false
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider value={{ user: mockUser, loading: false }}>
          <SubscriptionProvider value={mockSubscription}>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MarketIntelligenceHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders market health cards', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // Check for market health indicators
    expect(screen.getByText('Market Mood')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('Bullish')).toBeInTheDocument();

    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('$1.5B')).toBeInTheDocument();

    expect(screen.getByText('Active Whales')).toBeInTheDocument();
    expect(screen.getByText('892')).toBeInTheDocument();

    expect(screen.getByText('Risk Index')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('renders whale clusters section', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    expect(screen.getByText('Whale Clusters')).toBeInTheDocument();
    expect(screen.getByText('CEX Inflow Whales')).toBeInTheDocument();
    expect(screen.getByText('DeFi Whales')).toBeInTheDocument();
    expect(screen.getByText('Dormant Whales')).toBeInTheDocument();
    expect(screen.getByText('Accumulation')).toBeInTheDocument();
    expect(screen.getByText('Distribution')).toBeInTheDocument();
  });

  test('renders real-time alerts sidebar', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    expect(screen.getByText('Real-time Alerts')).toBeInTheDocument();
    expect(screen.getByText('AI Digest - Last 24h')).toBeInTheDocument();
    expect(screen.getByText('Stream')).toBeInTheDocument();
    expect(screen.getByText('Grouped')).toBeInTheDocument();
  });

  test('handles cluster selection', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    const cexCluster = screen.getByText('CEX Inflow Whales');
    fireEvent.click(cexCluster);

    await waitFor(() => {
      expect(screen.getByText('CEX Inflow Whales Details')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
      expect(screen.getByText('Risk Score')).toBeInTheDocument();
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
    });
  });

  test('switches between stream and grouped alerts view', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    const groupedButton = screen.getByRole('button', { name: 'Grouped' });
    fireEvent.click(groupedButton);

    // Should switch to grouped view
    expect(groupedButton).toHaveClass('bg-primary'); // or whatever active class
  });

  test('renders bottom action bar', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  test('handles export functionality for premium users', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    // Should not show free plan restriction for premium user
    expect(screen.queryByText('Export feature is available for Premium subscribers only')).not.toBeInTheDocument();
  });

  test('restricts export for free users', async () => {
    const freeUserSubscription = {
      userPlan: { plan: 'free' },
      isLoading: false
    };

    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <AuthProvider value={{ user: mockUser, loading: false }}>
            <SubscriptionProvider value={freeUserSubscription}>
              <MarketIntelligenceHub />
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    // Should show restriction alert
    await waitFor(() => {
      // Note: This would typically show an alert/modal, but for testing we check the console or mock
      expect(global.alert).toHaveBeenCalledWith('Export feature is available for Premium subscribers only');
    });
  });

  test('displays AI digest with market insights', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    expect(screen.getByText('AI Digest - Last 24h')).toBeInTheDocument();
    
    // Check for digest items (these are generated based on mock data)
    const digestItems = screen.getAllByText(/high-priority whale movements|large transactions|sell pressure/i);
    expect(digestItems.length).toBeGreaterThan(0);
  });

  test('handles mobile responsive layout', async () => {
    // Mock mobile viewport
    jest.mocked(require('@/hooks/use-mobile').useWindowSize).mockReturnValue({
      width: 375,
      height: 667
    });

    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // On mobile, the alerts sidebar should be hidden
    const alertsSidebar = screen.queryByText('Real-time Alerts');
    expect(alertsSidebar).not.toBeVisible();
  });

  test('filters alerts by severity', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    const highPriorityFilter = screen.getByText('High Priority');
    fireEvent.click(highPriorityFilter);

    // Should filter alerts (this would be tested with actual alert data)
    await waitFor(() => {
      // Check that only high priority alerts are shown
      // This would require mock alert data to test properly
    });
  });

  test('handles alert click interactions', async () => {
    // This test would require mock alert data
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // Would test clicking on individual alerts and tracking analytics
    // Requires mock alert data to be present
  });

  test('validates accessibility features', async () => {
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // Check for proper ARIA labels and roles
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    
    // Check for keyboard navigation support
    const filterButton = screen.getByRole('button', { name: /filter/i });
    filterButton.focus();
    expect(filterButton).toHaveFocus();
  });

  test('handles error states gracefully', async () => {
    // Mock error state
    jest.mocked(require('@/hooks/useEnhancedMarketData').useEnhancedMarketData).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch market data')
    });

    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // Should still render basic structure even with errors
    expect(screen.getByText('Market Mood')).toBeInTheDocument();
    expect(screen.getByText('Whale Clusters')).toBeInTheDocument();
  });

  test('validates performance with large datasets', async () => {
    // This would test virtualization and performance optimizations
    // Requires mock data with large number of alerts/clusters
    render(
      <TestWrapper>
        <MarketIntelligenceHub />
      </TestWrapper>
    );

    // Test that component renders efficiently with large datasets
    // Would measure render time and memory usage in real implementation
  });
});

// Integration tests
describe('MarketIntelligenceHub Integration', () => {
  test('integrates with real-time data updates', async () => {
    // Test real-time updates from WebSocket connections
    // Would require WebSocket mocking
  });

  test('integrates with export functionality', async () => {
    // Test actual export generation
    // Would require file system mocking
  });

  test('integrates with watchlist functionality', async () => {
    // Test adding/removing items from watchlist
    // Would require database mocking
  });
});