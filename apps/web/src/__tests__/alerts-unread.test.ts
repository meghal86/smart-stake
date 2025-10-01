import { renderHook, act } from '@testing-library/react';
import { useAlertsUnread } from '../hooks/useAlertsUnread';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useAlertsUnread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('returns 0 unread for empty alerts', () => {
    const { result } = renderHook(() => useAlertsUnread([]));
    
    expect(result.current.unread).toBe(0);
  });

  test('counts unread alerts correctly', () => {
    const now = Date.now();
    const alerts = [
      { id: 'a1', ts: new Date(now - 1000 * 60 * 30).toISOString() }, // 30 min ago
      { id: 'a2', ts: new Date(now - 1000 * 60 * 10).toISOString() }, // 10 min ago
      { id: 'a3', ts: new Date(now).toISOString() } // now
    ];
    
    // Mock last viewed 20 minutes ago
    mockLocalStorage.getItem.mockReturnValue(String(now - 1000 * 60 * 20));
    
    const { result } = renderHook(() => useAlertsUnread(alerts));
    
    // Should count 2 alerts (10 min ago and now) as unread
    expect(result.current.unread).toBe(2);
  });

  test('markAlertsViewed updates localStorage and state', () => {
    const alerts = [
      { id: 'a1', ts: new Date().toISOString() }
    ];
    
    const { result } = renderHook(() => useAlertsUnread(alerts));
    
    act(() => {
      result.current.markAlertsViewed();
    });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'alpha/alerts/lastViewedAt',
      expect.any(String)
    );
    
    // After marking viewed, unread should be 0
    expect(result.current.unread).toBe(0);
  });

  test('handles invalid localStorage values gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid');
    
    const { result } = renderHook(() => useAlertsUnread([]));
    
    // Should default to 0 when localStorage has invalid value
    expect(result.current.lastViewedAt).toBe(0);
  });

  test('recalculates unread when alerts change', () => {
    const { result, rerender } = renderHook(
      ({ alerts }) => useAlertsUnread(alerts),
      { initialProps: { alerts: [] } }
    );
    
    expect(result.current.unread).toBe(0);
    
    // Add new alerts
    const newAlerts = [
      { id: 'a1', ts: new Date().toISOString() }
    ];
    
    rerender({ alerts: newAlerts });
    
    expect(result.current.unread).toBe(1);
  });
});