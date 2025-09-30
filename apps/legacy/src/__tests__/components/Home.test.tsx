import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../../pages/Home';
import { supabase } from '../../integrations/supabase/client';

// Mock Supabase
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

const renderHome = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders home page correctly', () => {
    renderHome();
    
    expect(screen.getByText('Whale Alerts')).toBeInTheDocument();
    expect(screen.getByText('Live whale transactions')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by token, address...')).toBeInTheDocument();
  });

  test('renders filter controls', () => {
    renderHome();
    
    expect(screen.getByPlaceholderText('Search by token, address...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min USD')).toBeInTheDocument();
    expect(screen.getByText('All Chains')).toBeInTheDocument();
  });

  test('displays mock transactions initially', async () => {
    renderHome();
    
    await waitFor(() => {
      expect(screen.getByText('📊 Showing demo data - Sign up to see real whale alerts')).toBeInTheDocument();
    });

    // Should show mock transaction data
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  test('handles search input', () => {
    renderHome();
    
    const searchInput = screen.getByPlaceholderText('Search by token, address...');
    fireEvent.change(searchInput, { target: { value: 'ETH' } });
    
    expect(searchInput).toHaveValue('ETH');
  });

  test('handles chain filter selection', () => {
    renderHome();
    
    const chainSelect = screen.getByText('All Chains');
    fireEvent.click(chainSelect);
    
    // Should show dropdown options
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('BSC')).toBeInTheDocument();
  });

  test('handles min amount filter', () => {
    renderHome();
    
    const minAmountInput = screen.getByPlaceholderText('Min USD');
    fireEvent.change(minAmountInput, { target: { value: '1000000' } });
    
    expect(minAmountInput).toHaveValue('1000000');
  });

  test('fetches real data from Supabase', async () => {
    const mockData = [
      {
        id: 'real-1',
        from_addr: '0x1234567890abcdef1234567890abcdef12345678',
        to_addr: '0xabcdef1234567890abcdef1234567890abcdef12',
        amount_usd: 5000000,
        token: 'ETH',
        chain: 'Ethereum',
        created_at: new Date().toISOString(),
        tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      },
    ];

    const mockSupabase = supabase.from as jest.Mock;
    mockSupabase.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    });

    renderHome();
    
    await waitFor(() => {
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  test('handles Supabase error gracefully', async () => {
    const mockSupabase = supabase.from as jest.Mock;
    mockSupabase.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Connection failed' } 
          }),
        }),
      }),
    });

    renderHome();
    
    await waitFor(() => {
      // Should fall back to mock data
      expect(screen.getByText('📊 Showing demo data - Sign up to see real whale alerts')).toBeInTheDocument();
    });
  });

  test('displays transaction cards with correct data', async () => {
    renderHome();
    
    await waitFor(() => {
      // Check for transaction card elements
      const transactionCards = screen.getAllByText(/ETH|USDC|BTC/);
      expect(transactionCards.length).toBeGreaterThan(0);
    });

    // Check for buy/sell indicators
    expect(screen.getAllByText('BUY').length + screen.getAllByText('SELL').length).toBeGreaterThan(0);
  });

  test('handles retry functionality', async () => {
    // First, simulate an error
    const mockSupabase = supabase.from as jest.Mock;
    mockSupabase.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Network error')),
        }),
      }),
    });

    renderHome();
    
    // Should show error state with retry button
    await waitFor(() => {
      expect(screen.getByText('📊 Showing demo data - Sign up to see real whale alerts')).toBeInTheDocument();
    });
  });

  test('formats transaction amounts correctly', async () => {
    renderHome();
    
    await waitFor(() => {
      // Should show formatted amounts (2.50M, 1.80M, 950K)
      expect(screen.getByText('2.50M')).toBeInTheDocument();
      expect(screen.getByText('1.80M')).toBeInTheDocument();
      expect(screen.getByText('950K')).toBeInTheDocument();
    });
  });

  test('shows correct timestamp formatting', async () => {
    renderHome();
    
    await waitFor(() => {
      // Should show relative timestamps (5m ago, 15m ago, 30m ago)
      expect(screen.getByText(/\d+m ago/)).toBeInTheDocument();
    });
  });
});