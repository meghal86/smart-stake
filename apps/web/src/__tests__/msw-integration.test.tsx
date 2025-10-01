import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// MSW handlers for integration testing
const handlers = [
  rest.get('/api/spotlight', (req, res, ctx) => {
    return res(ctx.json({
      id: 'sp1',
      whaleId: '0xabcd...1234',
      asset: 'ETH',
      amount: 12500000,
      narrative: 'Large ETH movement detected',
      provenance: 'Real'
    }));
  }),
  
  rest.get('/api/digest', (req, res, ctx) => {
    return res(ctx.json({
      items: [
        { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy' },
        { id: 'd2', text: 'ETH CEX inflows up 15%', direction: 'sell' }
      ]
    }));
  }),
  
  rest.post('/api/alerts', (req, res, ctx) => {
    return res(ctx.json({ id: 'alert1', created: true }));
  }),
  
  rest.post('/api/watchlist', (req, res, ctx) => {
    return res(ctx.json({ id: 'watch1', followed: true }));
  }),
  
  rest.get('/api/prices', (req, res, ctx) => {
    return res(ctx.json({
      BTC: { price: 45000, change24h: 2.3 },
      ETH: { price: 2250, change24h: -1.2 }
    }));
  })
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock component for testing digest CTAs
const DigestWithCTAs = () => {
  const [alerts, setAlerts] = React.useState([]);
  const [watchlist, setWatchlist] = React.useState([]);
  
  const handleSetAlert = async (item) => {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ item })
    });
    const result = await response.json();
    if (result.created) {
      setAlerts(prev => [...prev, result.id]);
    }
  };
  
  const handleFollow = async (item) => {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ item })
    });
    const result = await response.json();
    if (result.followed) {
      setWatchlist(prev => [...prev, result.id]);
    }
  };
  
  return (
    <div>
      <div data-testid="digest-item">
        <span>Whales bought $200M BTC</span>
        <button onClick={() => handleSetAlert('btc-buy')}>Set Alert</button>
        <button onClick={() => handleFollow('btc-whale')}>Follow</button>
      </div>
      <div data-testid="alerts-count">{alerts.length}</div>
      <div data-testid="watchlist-count">{watchlist.length}</div>
    </div>
  );
};

describe('MSW Integration Tests', () => {
  test('Digest CTA creates alert via API', async () => {
    render(<DigestWithCTAs />);
    
    fireEvent.click(screen.getByText('Set Alert'));
    
    await waitFor(() => {
      expect(screen.getByTestId('alerts-count')).toHaveTextContent('1');
    });
  });
  
  test('Follow CTA updates watchlist via API', async () => {
    render(<DigestWithCTAs />);
    
    fireEvent.click(screen.getByText('Follow'));
    
    await waitFor(() => {
      expect(screen.getByTestId('watchlist-count')).toHaveTextContent('1');
    });
  });
  
  test('Demo portfolio computes value from price API', async () => {
    const DemoPortfolioWithAPI = () => {
      const [portfolio, setPortfolio] = React.useState(null);
      
      const seedDemo = async () => {
        const pricesResponse = await fetch('/api/prices');
        const prices = await pricesResponse.json();
        
        const positions = [
          { symbol: 'BTC', amount: 0.5, ...prices.BTC },
          { symbol: 'ETH', amount: 5, ...prices.ETH }
        ];
        
        const totalValue = positions.reduce((sum, pos) => sum + (pos.amount * pos.price), 0);
        setPortfolio({ positions, totalValue });
      };
      
      return (
        <div>
          {!portfolio ? (
            <button onClick={seedDemo}>Try Demo</button>
          ) : (
            <div data-testid="portfolio-value">${portfolio.totalValue.toLocaleString()}</div>
          )}
        </div>
      );
    };
    
    render(<DemoPortfolioWithAPI />);
    
    fireEvent.click(screen.getByText('Try Demo'));
    
    await waitFor(() => {
      // 0.5 * 45000 + 5 * 2250 = 22500 + 11250 = 33750
      expect(screen.getByTestId('portfolio-value')).toHaveTextContent('$33,750');
    });
  });
  
  test('Spotlight data loads from API', async () => {
    const SpotlightWithAPI = () => {
      const [spotlight, setSpotlight] = React.useState(null);
      
      React.useEffect(() => {
        fetch('/api/spotlight')
          .then(res => res.json())
          .then(setSpotlight);
      }, []);
      
      if (!spotlight) return <div>Loading...</div>;
      
      return (
        <div>
          <div data-testid="whale-id">{spotlight.whaleId}</div>
          <div data-testid="amount">{spotlight.amount.toLocaleString()}</div>
          <div data-testid="asset">{spotlight.asset}</div>
        </div>
      );
    };
    
    render(<SpotlightWithAPI />);
    
    await waitFor(() => {
      expect(screen.getByTestId('whale-id')).toHaveTextContent('0xabcd...1234');
      expect(screen.getByTestId('amount')).toHaveTextContent('12,500,000');
      expect(screen.getByTestId('asset')).toHaveTextContent('ETH');
    });
  });
  
  test('API error handling works correctly', async () => {
    server.use(
      rest.post('/api/alerts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    const AlertWithErrorHandling = () => {
      const [error, setError] = React.useState(null);
      
      const handleSetAlert = async () => {
        try {
          const response = await fetch('/api/alerts', { method: 'POST' });
          if (!response.ok) throw new Error('Failed to create alert');
        } catch (err) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <button onClick={handleSetAlert}>Set Alert</button>
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    };
    
    render(<AlertWithErrorHandling />);
    
    fireEvent.click(screen.getByText('Set Alert'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to create alert');
    });
  });
});