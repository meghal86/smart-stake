import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Scanner from '../Scanner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Test wallet addresses for different risk levels
const TEST_WALLETS = {
  LOW_RISK: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance Hot Wallet
  MEDIUM_RISK: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Active DeFi user
  HIGH_RISK: '0x1234567890123456789012345678901234567890', // New/empty wallet
  INVALID: '0xinvalid', // Invalid address format
};

// Mock responses for different wallet types
const MOCK_RESPONSES = {
  [TEST_WALLETS.LOW_RISK]: {
    success: true,
    risk_score: 2,
    risk_level: 'low',
    analysis: {
      totalTransactions: 150000,
      walletAge: 1200,
      currentBalance: 5000.5,
      avgTxValue: 2.5,
      uniqueContracts: 45,
      recentActivity: 100,
      failedTxRatio: 0.02
    },
    risk_factors: [],
    recommendations: ['Wallet appears safe for normal interactions'],
    breakdown: {
      liquidity: 9,
      history: 9,
      associations: 8,
      volatility: 7
    }
  },
  [TEST_WALLETS.MEDIUM_RISK]: {
    success: true,
    risk_score: 5,
    risk_level: 'medium',
    analysis: {
      totalTransactions: 2500,
      walletAge: 180,
      currentBalance: 15.8,
      avgTxValue: 0.8,
      uniqueContracts: 25,
      recentActivity: 50,
      failedTxRatio: 0.08
    },
    risk_factors: ['High smart contract interaction frequency'],
    recommendations: ['Monitor transactions closely', 'Verify recent activity'],
    breakdown: {
      liquidity: 6,
      history: 5,
      associations: 4,
      volatility: 6
    }
  },
  [TEST_WALLETS.HIGH_RISK]: {
    success: true,
    risk_score: 9,
    risk_level: 'high',
    analysis: {
      totalTransactions: 3,
      walletAge: 15,
      currentBalance: 0.05,
      avgTxValue: 0.02,
      uniqueContracts: 1,
      recentActivity: 2,
      failedTxRatio: 0.33
    },
    risk_factors: [
      'New wallet (less than 30 days old)',
      'Low transaction history',
      'Very low ETH balance',
      'High failed transaction ratio'
    ],
    recommendations: [
      'Proceed with extreme caution',
      'Verify wallet ownership',
      'Start with small amounts'
    ],
    breakdown: {
      liquidity: 2,
      history: 1,
      associations: 2,
      volatility: 3
    }
  }
};

// Mock Supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}));

// Mock hooks
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    userPlan: { plan: 'premium' },
    canAccessFeature: () => 'full',
    getUpgradeMessage: () => ''
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
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

describe('Risk Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders scanner interface correctly', () => {
    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Enter wallet address (0x...)')).toBeInTheDocument();
    expect(screen.getByText('Scan Wallet')).toBeInTheDocument();
  });

  test('scans low-risk wallet correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: MOCK_RESPONSES[TEST_WALLETS.LOW_RISK],
      error: null
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.LOW_RISK } });
    fireEvent.click(scanButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Scanning...')).toBeInTheDocument();
    });

    // Check results
    await waitFor(() => {
      expect(screen.getByText('2/10')).toBeInTheDocument();
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
      expect(screen.getByText('5000.5000 ETH')).toBeInTheDocument();
      expect(screen.getByText('Wallet appears safe for normal interactions')).toBeInTheDocument();
    });

    expect(mockInvoke).toHaveBeenCalledWith('riskScan', {
      body: { walletAddress: TEST_WALLETS.LOW_RISK, userId: 'test-user' }
    });
  });

  test('scans medium-risk wallet correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: MOCK_RESPONSES[TEST_WALLETS.MEDIUM_RISK],
      error: null
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.MEDIUM_RISK } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('5/10')).toBeInTheDocument();
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
      expect(screen.getByText('High smart contract interaction frequency')).toBeInTheDocument();
      expect(screen.getByText('Monitor transactions closely')).toBeInTheDocument();
    });
  });

  test('scans high-risk wallet correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: MOCK_RESPONSES[TEST_WALLETS.HIGH_RISK],
      error: null
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.HIGH_RISK } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('9/10')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
      expect(screen.getByText('New wallet (less than 30 days old)')).toBeInTheDocument();
      expect(screen.getByText('Proceed with extreme caution')).toBeInTheDocument();
    });
  });

  test('handles scan errors correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid wallet address' }
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.INVALID } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('Scan Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid wallet address')).toBeInTheDocument();
    });
  });

  test('displays risk breakdown correctly', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: MOCK_RESPONSES[TEST_WALLETS.LOW_RISK],
      error: null
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.LOW_RISK } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('Risk Breakdown')).toBeInTheDocument();
      expect(screen.getByText('liquidity')).toBeInTheDocument();
      expect(screen.getByText('history')).toBeInTheDocument();
      expect(screen.getByText('associations')).toBeInTheDocument();
      expect(screen.getByText('volatility')).toBeInTheDocument();
    });
  });

  test('displays wallet analysis details', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: MOCK_RESPONSES[TEST_WALLETS.LOW_RISK],
      error: null
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.LOW_RISK } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('Wallet Analysis')).toBeInTheDocument();
      expect(screen.getByText('150,000')).toBeInTheDocument(); // Total transactions
      expect(screen.getByText('1200 years')).toBeInTheDocument(); // Wallet age
      expect(screen.getByText('100 txns')).toBeInTheDocument(); // Recent activity
      expect(screen.getByText('45')).toBeInTheDocument(); // Unique contracts
    });
  });

  test('disables scan button when no address entered', () => {
    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const scanButton = screen.getByText('Scan Wallet');
    expect(scanButton).toBeDisabled();
  });

  test('enables scan button when valid address entered', () => {
    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.LOW_RISK } });
    expect(scanButton).not.toBeDisabled();
  });

  test('shows try again button on error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' }
    });

    render(
      <TestWrapper>
        <Scanner />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
    const scanButton = screen.getByText('Scan Wallet');

    fireEvent.change(input, { target: { value: TEST_WALLETS.LOW_RISK } });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Click try again should reset the state
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.queryByText('Scan Failed')).not.toBeInTheDocument();
  });

  test('calculates risk score correctly for different scenarios', async () => {
    // Test all risk levels
    const testCases = [
      { wallet: TEST_WALLETS.LOW_RISK, expectedScore: '2/10', expectedLevel: 'Low Risk' },
      { wallet: TEST_WALLETS.MEDIUM_RISK, expectedScore: '5/10', expectedLevel: 'Medium Risk' },
      { wallet: TEST_WALLETS.HIGH_RISK, expectedScore: '9/10', expectedLevel: 'High Risk' }
    ];

    for (const testCase of testCases) {
      mockInvoke.mockResolvedValueOnce({
        data: MOCK_RESPONSES[testCase.wallet],
        error: null
      });

      render(
        <TestWrapper>
          <Scanner />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Enter wallet address (0x...)');
      const scanButton = screen.getByText('Scan Wallet');

      fireEvent.change(input, { target: { value: testCase.wallet } });
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedScore)).toBeInTheDocument();
        expect(screen.getByText(testCase.expectedLevel)).toBeInTheDocument();
      });

      // Clean up for next iteration
      screen.unmount();
    }
  });
});