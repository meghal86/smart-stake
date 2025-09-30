import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../Home';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: 'API not available' })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }))
  }
}));

// Mock hooks
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    userPlan: { plan: 'free' },
    canAccessFeature: () => 'full',
    getUpgradeMessage: () => ''
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Home Component Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('search filter works for token names', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Wait for component to load with mock data
    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test search by token
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: 'ETH' } });

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.queryByText('USDC')).not.toBeInTheDocument();
    });
  });

  test('search filter works for addresses', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test search by address (partial)
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: '0x1234' } });

    await waitFor(() => {
      // Should show transactions with addresses containing '0x1234'
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });
  });

  test('chain filter works correctly', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test chain filter
    const chainSelect = screen.getByRole('combobox');
    fireEvent.click(chainSelect);
    
    await waitFor(() => {
      const ethereumOption = screen.getByText('Ethereum');
      fireEvent.click(ethereumOption);
    });

    await waitFor(() => {
      // Should only show Ethereum transactions
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.queryByText('USDC')).not.toBeInTheDocument(); // USDC is on Polygon in mock data
    });
  });

  test('minimum amount filter works', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test minimum amount filter
    const minAmountInput = screen.getByPlaceholderText('Min USD');
    fireEvent.change(minAmountInput, { target: { value: '2000000' } });

    await waitFor(() => {
      // Should only show transactions >= $2M
      expect(screen.getByText('ETH')).toBeInTheDocument(); // $2.5M
      expect(screen.queryByText('BTC')).not.toBeInTheDocument(); // $950K
    });
  });

  test('quick filter buttons work', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test $10M+ quick filter
    const megaWhaleButton = screen.getByText('💥 $10M+');
    fireEvent.click(megaWhaleButton);

    await waitFor(() => {
      // Should filter to only mega whale transactions
      const minAmountInput = screen.getByPlaceholderText('Min USD') as HTMLInputElement;
      expect(minAmountInput.value).toBe('10000000');
    });
  });

  test('chain quick filter buttons work', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Test Ethereum quick filter
    const ethButton = screen.getByText('Ξ ETH Only');
    fireEvent.click(ethButton);

    await waitFor(() => {
      // Should set chain filter to ethereum
      const chainSelect = screen.getByRole('combobox');
      expect(chainSelect).toHaveTextContent('Ethereum');
    });
  });

  test('combined filters work together', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Apply multiple filters
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: 'ETH' } });

    const minAmountInput = screen.getByPlaceholderText('Min USD');
    fireEvent.change(minAmountInput, { target: { value: '1000000' } });

    await waitFor(() => {
      // Should show only ETH transactions >= $1M
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.queryByText('USDC')).not.toBeInTheDocument();
      expect(screen.queryByText('BTC')).not.toBeInTheDocument();
    });
  });

  test('no results message shows when filters match nothing', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Apply filter that matches nothing
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    await waitFor(() => {
      expect(screen.getByText('No Whale Activity')).toBeInTheDocument();
      expect(screen.getByText('There are no large transactions matching your criteria at the moment.')).toBeInTheDocument();
    });
  });

  test('clearing filters shows all transactions', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    // Apply filter
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: 'ETH' } });

    await waitFor(() => {
      expect(screen.queryByText('USDC')).not.toBeInTheDocument();
    });

    // Clear filter
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      // Should show all transactions again
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });
  });
});