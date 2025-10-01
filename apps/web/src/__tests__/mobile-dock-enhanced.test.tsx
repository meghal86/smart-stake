import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileDock from '../components/MobileDock';
import { useActiveSection } from '../hooks/useActiveSection';
import { usePWAPrompt } from '../hooks/usePWAPrompt';

// Mock hooks
jest.mock('../hooks/useActiveSection');
jest.mock('../hooks/usePWAPrompt');
jest.mock('../utils/haptics');

const mockUseActiveSection = useActiveSection as jest.MockedFunction<typeof useActiveSection>;
const mockUsePWAPrompt = usePWAPrompt as jest.MockedFunction<typeof usePWAPrompt>;

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn()
});

describe('Enhanced MobileDock', () => {
  beforeEach(() => {
    mockUseActiveSection.mockReturnValue('spotlight');
    mockUsePWAPrompt.mockReturnValue({
      showPrompt: false,
      installPWA: jest.fn(),
      dismissPrompt: jest.fn()
    });
  });

  test('highlights active section', () => {
    mockUseActiveSection.mockReturnValue('for-you');
    
    render(<MobileDock />);
    
    const watchlistBtn = screen.getByLabelText('Watchlist');
    expect(watchlistBtn).toHaveClass('bg-white/20');
    expect(watchlistBtn).toHaveClass('text-white');
  });

  test('shows alerts badge when unread alerts exist', () => {
    render(<MobileDock unreadAlerts={5} />);
    
    const alertsBtn = screen.getByLabelText('Alerts');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows dot for single unread alert', () => {
    render(<MobileDock unreadAlerts={1} />);
    
    const badge = document.querySelector('.bg-red-500.w-2.h-2');
    expect(badge).toBeInTheDocument();
  });

  test('shows 99+ for high alert counts', () => {
    render(<MobileDock unreadAlerts={150} />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('hides dock when modal is open', () => {
    render(<MobileDock modalOpen={true} />);
    
    const dock = screen.getByTestId('mobile-dock');
    expect(dock).toHaveClass('opacity-0');
    expect(dock).toHaveClass('translate-y-6');
  });

  test('shows PWA prompt when available', () => {
    mockUsePWAPrompt.mockReturnValue({
      showPrompt: true,
      installPWA: jest.fn(),
      dismissPrompt: jest.fn()
    });
    
    render(<MobileDock />);
    
    expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  test('PWA install button works', () => {
    const mockInstall = jest.fn();
    mockUsePWAPrompt.mockReturnValue({
      showPrompt: true,
      installPWA: mockInstall,
      dismissPrompt: jest.fn()
    });
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByText('Add'));
    expect(mockInstall).toHaveBeenCalled();
  });

  test('PWA dismiss button works', () => {
    const mockDismiss = jest.fn();
    mockUsePWAPrompt.mockReturnValue({
      showPrompt: true,
      installPWA: jest.fn(),
      dismissPrompt: mockDismiss
    });
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByText('×'));
    expect(mockDismiss).toHaveBeenCalled();
  });

  test('triggers haptic feedback on button press', () => {
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Spotlight'));
    
    // Haptic should be triggered (mocked)
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  test('scrolls with header offset', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 100 }),
      scrollIntoView: jest.fn()
    };
    document.getElementById = jest.fn().mockReturnValue(mockElement);
    
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Spotlight'));
    
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 12, // 100 - 88 (header offset)
      behavior: 'smooth'
    });
  });

  test('emits analytics events', () => {
    const mockTrack = jest.fn();
    (window as any).track = mockTrack;
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Watchlist'));
    
    expect(mockTrack).toHaveBeenCalledWith('dock_watchlist');
  });

  test('respects reduced motion for haptics', () => {
    // Mock prefers-reduced-motion
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true
    });
    
    render(<MobileDock />);
    
    fireEvent.click(screen.getByLabelText('Spotlight'));
    
    // Haptic should not be triggered when reduced motion is preferred
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  test('handles missing elements gracefully', () => {
    document.getElementById = jest.fn().mockReturnValue(null);
    
    render(<MobileDock />);
    
    // Should not throw when element is not found
    expect(() => {
      fireEvent.click(screen.getByLabelText('Spotlight'));
    }).not.toThrow();
  });
});