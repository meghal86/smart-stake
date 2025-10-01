import { render, screen, fireEvent } from '@testing-library/react';
import MobileDock from '../components/MobileDock';

// Mock window.visualViewport
Object.defineProperty(window, 'visualViewport', {
  writable: true,
  value: {
    height: 812,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('MobileDock', () => {
  beforeEach(() => {
    // Reset window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812
    });
  });

  test('renders mobile dock with all buttons', () => {
    render(<MobileDock />);
    
    expect(screen.getByTestId('mobile-dock')).toBeInTheDocument();
    expect(screen.getByLabelText('Spotlight')).toBeInTheDocument();
    expect(screen.getByLabelText('Watchlist')).toBeInTheDocument();
    expect(screen.getByLabelText('Alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('Upgrade')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<MobileDock />);
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveAttribute('role', 'navigation');
    expect(dock).toHaveAttribute('aria-label', 'Quick actions');
    
    // Check button tap targets
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('min-w-[44px]');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  test('upgrade button has primary styling', () => {
    render(<MobileDock />);
    
    const upgradeBtn = screen.getByLabelText('Upgrade');
    expect(upgradeBtn).toHaveClass('bg-teal-500');
    expect(upgradeBtn).toHaveClass('text-slate-900');
  });

  test('other buttons have ghost styling', () => {
    render(<MobileDock />);
    
    const spotlightBtn = screen.getByLabelText('Spotlight');
    expect(spotlightBtn).toHaveClass('bg-white/5');
    expect(spotlightBtn).toHaveClass('text-slate-200');
  });

  test('spotlight button scrolls to spotlight section', () => {
    // Mock getElementById
    const mockElement = { scrollIntoView: jest.fn() };
    document.getElementById = jest.fn().mockReturnValue(mockElement);
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Spotlight'));
    
    expect(document.getElementById).toHaveBeenCalledWith('spotlight');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });
  });

  test('watchlist button scrolls to for-you section', () => {
    const mockElement = { scrollIntoView: jest.fn() };
    document.getElementById = jest.fn().mockReturnValue(mockElement);
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Watchlist'));
    
    expect(document.getElementById).toHaveBeenCalledWith('for-you');
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
  });

  test('alerts button scrolls to alerts section', () => {
    const mockElement = { scrollIntoView: jest.fn() };
    document.getElementById = jest.fn().mockReturnValue(mockElement);
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Alerts'));
    
    expect(document.getElementById).toHaveBeenCalledWith('alerts');
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
  });

  test('upgrade button navigates to upgrade page', () => {
    // Mock window.location.assign
    const mockAssign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { assign: mockAssign },
      writable: true
    });
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Upgrade'));
    
    expect(mockAssign).toHaveBeenCalledWith('/upgrade');
  });

  test('hides when keyboard opens', () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();
    
    Object.defineProperty(window, 'visualViewport', {
      value: {
        height: 400, // Simulated keyboard open
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener
      }
    });
    
    render(<MobileDock />);
    
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    // Simulate keyboard opening by calling the resize handler
    const resizeHandler = mockAddEventListener.mock.calls[0][1];
    resizeHandler();
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveClass('opacity-0');
    expect(dock).toHaveClass('translate-y-6');
  });

  test('shows on desktop breakpoint with md:hidden class', () => {
    render(<MobileDock />);
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveClass('md:hidden');
  });

  test('has proper z-index to appear above content', () => {
    render(<MobileDock />);
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveClass('z-50');
  });

  test('uses safe area inset for bottom padding', () => {
    render(<MobileDock />);
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveStyle('padding-bottom: env(safe-area-inset-bottom)');
  });
});