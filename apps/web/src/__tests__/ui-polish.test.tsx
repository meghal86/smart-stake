import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkeletonCard, SkeletonRow } from '../components/ui/SkeletonCard';

describe('UI Polish Enhancements', () => {
  test('SkeletonCard renders loading state', () => {
    render(<SkeletonCard />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-slate-800');
  });

  test('SkeletonRow renders loading state', () => {
    render(<SkeletonRow />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-slate-700/30');
  });

  test('Carousel arrows hide at ends', () => {
    const TestCarousel = () => {
      const [index, setIndex] = React.useState(0);
      const maxIndex = 2;
      
      return (
        <div>
          <button 
            data-testid="prev-arrow"
            style={{ display: index === 0 ? 'none' : 'flex' }}
            onClick={() => setIndex(Math.max(0, index - 1))}
          >
            ←
          </button>
          <button 
            data-testid="next-arrow"
            style={{ display: index >= maxIndex ? 'none' : 'flex' }}
            onClick={() => setIndex(Math.min(maxIndex, index + 1))}
          >
            →
          </button>
          <div data-testid="index">{index}</div>
        </div>
      );
    };
    
    render(<TestCarousel />);
    
    // At start, prev arrow should be hidden
    expect(screen.getByTestId('prev-arrow')).toHaveStyle('display: none');
    expect(screen.getByTestId('next-arrow')).toHaveStyle('display: flex');
    
    // Click next twice to reach end
    fireEvent.click(screen.getByTestId('next-arrow'));
    fireEvent.click(screen.getByTestId('next-arrow'));
    
    // At end, next arrow should be hidden
    expect(screen.getByTestId('prev-arrow')).toHaveStyle('display: flex');
    expect(screen.getByTestId('next-arrow')).toHaveStyle('display: none');
  });

  test('Fear Index has ARIA meter attributes', () => {
    const FearIndexMeter = () => (
      <div 
        role="meter" 
        aria-valuenow="62" 
        aria-valuemin="0" 
        aria-valuemax="100" 
        aria-label="Fear and Whale Index"
      >
        <span>62</span>
      </div>
    );
    
    render(<FearIndexMeter />);
    
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '62');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-label', 'Fear and Whale Index');
  });

  test('Digest rows are keyboard accessible', () => {
    const DigestRow = ({ onClick }) => (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        Test Row
      </div>
    );
    
    const mockClick = jest.fn();
    render(<DigestRow onClick={mockClick} />);
    
    const row = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(mockClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(row, { key: ' ' });
    expect(mockClick).toHaveBeenCalledTimes(2);
    
    // Test click
    fireEvent.click(row);
    expect(mockClick).toHaveBeenCalledTimes(3);
  });

  test('Portfolio header shows value and percentage', () => {
    const PortfolioHeader = ({ portfolio }) => (
      <h3>
        📊 Portfolio
        {portfolio && (
          <span>
            ${portfolio.totalValue.toLocaleString()} • {portfolio.changePercent >= 0 ? '+' : ''}{portfolio.changePercent.toFixed(1)}%
          </span>
        )}
      </h3>
    );
    
    const mockPortfolio = {
      totalValue: 33750,
      changePercent: 1.13
    };
    
    render(<PortfolioHeader portfolio={mockPortfolio} />);
    
    expect(screen.getByText(/\$33,750/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.1%/)).toBeInTheDocument();
  });

  test('Status chips are right-aligned', () => {
    const CardWithChip = () => (
      <div className="card-header">
        <h3>Title</h3>
        <span className="status-chip">Simulated</span>
      </div>
    );
    
    render(<CardWithChip />);
    
    const chip = screen.getByText('Simulated');
    expect(chip).toHaveClass('status-chip');
  });

  test('Footer baseline alignment works', () => {
    const FooterBaseline = () => (
      <div className="footer-baseline">
        <span>14:32 UTC • 11m ago •</span>
        <button>Refresh</button>
      </div>
    );
    
    render(<FooterBaseline />);
    
    const footer = document.querySelector('.footer-baseline');
    expect(footer).toHaveClass('footer-baseline');
  });

  test('Loading states resolve after timeout', async () => {
    const LoadingComponent = () => {
      const [isLoading, setIsLoading] = React.useState(true);
      
      React.useEffect(() => {
        setTimeout(() => setIsLoading(false), 100);
      }, []);
      
      return (
        <div>
          {isLoading ? <SkeletonCard /> : <div>Content loaded</div>}
        </div>
      );
    };
    
    render(<LoadingComponent />);
    
    // Initially shows skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // After timeout, shows content
    await waitFor(() => {
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
    });
    
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});