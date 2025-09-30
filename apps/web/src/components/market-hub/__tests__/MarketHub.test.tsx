import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MarketHub from '@/pages/MarketHub';

const mockMarketData = {
  marketSummary: {
    marketMoodIndex: 75,
    volume24h: 1500000000,
    volumeDelta: 12.5,
    activeWhales: 892,
    whalesDelta: 8.2,
    riskIndex: 45,
    topAlerts: [
      {
        id: 'alert-1',
        severity: 'High' as const,
        title: 'Large ETH Movement'
      }
    ]
  },
  whaleClusters: [
    {
      id: 'accumulation',
      type: 'ACCUMULATION',
      name: 'Accumulation Whales',
      membersCount: 45,
      sumBalanceUsd: 2100000000,
      riskScore: 35
    }
  ],
  alertsStream: [
    {
      id: 'alert-123',
      severity: 'High' as const,
      usdAmount: 25000000,
      fromEntity: 'Unknown Whale',
      toEntity: 'Binance'
    }
  ],
  isLoading: false
};

vi.mock('@/hooks/useMarketHub', () => ({
  useMarketHub: () => mockMarketData
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ track: vi.fn() })
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ userPlan: { plan: 'premium' } })
}));

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Market Intelligence Hub', () => {
  test('renders market health cards', async () => {
    render(<MarketHub />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Market Intelligence Hub')).toBeInTheDocument();
      expect(screen.getByText('Market Mood')).toBeInTheDocument();
      expect(screen.getByText('24h Volume')).toBeInTheDocument();
      expect(screen.getByText('Active Whales')).toBeInTheDocument();
      expect(screen.getByText('Risk Index')).toBeInTheDocument();
    });
  });

  test('renders whale clusters', async () => {
    render(<MarketHub />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Accumulation Whales')).toBeInTheDocument();
      expect(screen.getByText('45 addresses')).toBeInTheDocument();
    });
  });

  test('renders alerts sidebar', async () => {
    render(<MarketHub />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Alerts')).toBeInTheDocument();
      expect(screen.getByText('AI Digest - Last 24h')).toBeInTheDocument();
    });
  });

  test('switches tabs correctly', async () => {
    render(<MarketHub />, { wrapper: TestWrapper });
    
    await waitFor(() => {
      const whaleTab = screen.getByText('Whale Analytics');
      fireEvent.click(whaleTab);
      expect(screen.getByText('Whale Analytics')).toBeInTheDocument();
    });
  });
});