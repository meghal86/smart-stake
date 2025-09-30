import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Portfolio from '@/pages/Portfolio';
import { usePortfolioData } from '@/hooks/usePortfolioData';

// Mock the portfolio data hook
jest.mock('@/hooks/usePortfolioData');
const mockUsePortfolioData = usePortfolioData as jest.MockedFunction<typeof usePortfolioData>;

// Mock data
const mockAddresses = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
    label: 'My Trading Wallet',
    group: 'personal',
    totalValue: 45230,
    pnl: 8.2,
    riskScore: 7,
    whaleInteractions: 12,
    lastActivity: new Date('2024-01-15T10:00:00Z'),
    holdings: [
      { token: 'ETH', amount: 25.5, value: 42000, change24h: 2.1 },
      { token: 'USDC', amount: 3230, value: 3230, change24h: 0.1 }
    ]
  }
];

const renderPortfolio = () => {
  return render(
    <BrowserRouter>
      <Portfolio />
    </BrowserRouter>
  );
};

describe('Portfolio Monitor', () => {
  beforeEach(() => {
    mockUsePortfolioData.mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    localStorage.clear();
  });

  test('should display empty state when no addresses', () => {
    renderPortfolio();
    expect(screen.getByText('No Addresses Monitored')).toBeInTheDocument();
  });

  test('should open add address modal', async () => {
    const user = userEvent.setup();
    renderPortfolio();
    
    const addButton = screen.getByText('Add Your First Address');
    await user.click(addButton);
    
    expect(screen.getByText('Add Address to Monitor')).toBeInTheDocument();
  });

  test('should validate address format', async () => {
    const user = userEvent.setup();
    renderPortfolio();
    
    const addButton = screen.getByText('Add Your First Address');
    await user.click(addButton);
    
    const addressInput = screen.getByPlaceholderText('0x742d35Cc... or vitalik.eth');
    await user.type(addressInput, 'invalid-address');
    
    expect(screen.getByText('Please enter a valid Ethereum address or ENS name')).toBeInTheDocument();
  });

  test('should display portfolio summary', () => {
    localStorage.setItem('portfolio-addresses', JSON.stringify(mockAddresses));
    renderPortfolio();
    
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Avg P&L')).toBeInTheDocument();
  });

  test('should show export button when addresses exist', () => {
    localStorage.setItem('portfolio-addresses', JSON.stringify(mockAddresses));
    renderPortfolio();
    
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  test('should display error message when API fails', () => {
    mockUsePortfolioData.mockReturnValue({
      data: {},
      loading: false,
      error: 'Portfolio tracking service is not deployed',
      refetch: jest.fn()
    });
    
    renderPortfolio();
    expect(screen.getByText('Portfolio tracking service is not deployed')).toBeInTheDocument();
  });
});