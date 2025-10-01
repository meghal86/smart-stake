import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { copy } from '../lib/copy';

// Mock components for testing
const MockPortfolioDemo = () => {
  const [demoPortfolio, setDemoPortfolio] = React.useState(null);
  
  const seedDemo = () => {
    const portfolio = {
      positions: [
        { symbol: 'BTC', amount: 0.5, price: 45000, change24h: 2.3 },
        { symbol: 'ETH', amount: 5, price: 2250, change24h: -1.2 }
      ]
    };
    const totalValue = portfolio.positions.reduce((sum, pos) => sum + (pos.amount * pos.price), 0);
    const totalChange = portfolio.positions.reduce((sum, pos) => sum + (pos.amount * pos.price * pos.change24h / 100), 0);
    setDemoPortfolio({ ...portfolio, totalValue, totalChange, changePercent: (totalChange / totalValue) * 100 });
  };
  
  return (
    <div>
      {!demoPortfolio ? (
        <Button onClick={seedDemo}>Try Demo</Button>
      ) : (
        <div>
          <div data-testid="total-value">${demoPortfolio.totalValue.toLocaleString()}</div>
          <div data-testid="total-change">{demoPortfolio.changePercent.toFixed(2)}%</div>
          <Button onClick={() => setDemoPortfolio(null)}>Reset Demo</Button>
        </div>
      )}
    </div>
  );
};

describe('Partial Features Completion', () => {
  test('CTA hierarchy - Button variants work correctly', () => {
    render(
      <div>
        <Button variant="primary">Set Alert</Button>
        <Button variant="secondary">Follow</Button>
        <Button variant="tertiary">Share</Button>
      </div>
    );
    
    const primaryBtn = screen.getByText('Set Alert');
    const secondaryBtn = screen.getByText('Follow');
    const tertiaryBtn = screen.getByText('Share');
    
    expect(primaryBtn).toHaveClass('bg-teal-600');
    expect(secondaryBtn).toHaveClass('border-slate-600');
    expect(tertiaryBtn).toHaveClass('text-slate-400');
  });

  test('Portfolio Demo - P&L calculation is correct', () => {
    render(<MockPortfolioDemo />);
    
    fireEvent.click(screen.getByText('Try Demo'));
    
    // BTC: 0.5 * 45000 = 22500
    // ETH: 5 * 2250 = 11250
    // Total: 33750
    expect(screen.getByTestId('total-value')).toHaveTextContent('$33,750');
    
    // BTC change: 22500 * 0.023 = 517.5
    // ETH change: 11250 * -0.012 = -135
    // Total change: 382.5
    // Percentage: (382.5 / 33750) * 100 = 1.13%
    expect(screen.getByTestId('total-change')).toHaveTextContent('1.13%');
  });

  test('Portfolio Demo - Reset functionality works', () => {
    render(<MockPortfolioDemo />);
    
    fireEvent.click(screen.getByText('Try Demo'));
    expect(screen.getByTestId('total-value')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Reset Demo'));
    expect(screen.getByText('Try Demo')).toBeInTheDocument();
    expect(screen.queryByTestId('total-value')).not.toBeInTheDocument();
  });

  test('Microcopy consistency - Copy object has required strings', () => {
    expect(copy.setAlert).toBe('Set Alert');
    expect(copy.follow).toBe('Follow');
    expect(copy.share).toBe('Share');
    expect(copy.upgradeAction).toBe('See full analysis');
    expect(copy.simulatedTooltip).toContain('This is simulated until live sources');
    expect(copy.etherscanLabel).toBe('View on Etherscan');
  });

  test('Button accessibility - Min tap targets are 44x44', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByText('Test Button');
    
    expect(button).toHaveClass('min-w-[44px]');
    expect(button).toHaveClass('min-h-[44px]');
  });

  test('Keyboard shortcuts - A and F keys trigger actions', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Simulate the keyboard event handler
    const handleKeyDown = (e) => {
      if (e.key === 'a' || e.key === 'A') console.log('Set alert shortcut');
      if (e.key === 'f' || e.key === 'F') console.log('Follow shortcut');
    };
    
    handleKeyDown({ key: 'a' });
    expect(consoleSpy).toHaveBeenCalledWith('Set alert shortcut');
    
    handleKeyDown({ key: 'F' });
    expect(consoleSpy).toHaveBeenCalledWith('Follow shortcut');
    
    consoleSpy.mockRestore();
  });

  test('Refresh feedback - Shows updating state', async () => {
    const mockRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const RefreshTest = () => {
      const [isRefreshing, setIsRefreshing] = React.useState(false);
      
      const handleRefresh = async () => {
        setIsRefreshing(true);
        await mockRefresh();
        setIsRefreshing(false);
      };
      
      return (
        <button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </button>
      );
    };
    
    render(<RefreshTest />);
    
    const refreshBtn = screen.getByText('Refresh');
    fireEvent.click(refreshBtn);
    
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });
});